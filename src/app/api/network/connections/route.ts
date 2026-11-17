import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE INTRODUCTION HANDS — /api/network/connections                  */
/*                                                                     */
/*  GET  — the visitor's own accepted connections, and the requests    */
/*         waiting on both sides of the door.                          */
/*  POST — a connection request, carried by the visitor's own words.   */
/*         M.E. may have sensed the resonance; a human always opens    */
/*         the door.                                                   */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const [accepted, incoming, outgoing] = await Promise.all([
      db.networkConnection.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: visitor.user.id }, { addresseeId: visitor.user.id }],
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
        include: {
          requester: { select: { id: true, name: true, email: true, provider: true, image: true } },
          addressee: { select: { id: true, name: true, email: true, provider: true, image: true } },
        },
      }),
      db.networkConnection.findMany({
        where: { addresseeId: visitor.user.id, status: "pending" },
        orderBy: { createdAt: "desc" },
        include: {
          requester: { select: { id: true, name: true, email: true, provider: true, image: true } },
        },
      }),
      db.networkConnection.findMany({
        where: { requesterId: visitor.user.id, status: "pending" },
        orderBy: { createdAt: "desc" },
        include: {
          addressee: { select: { id: true, name: true, email: true, provider: true, image: true } },
        },
      }),
    ]);

    const shape = (u: { id: string; name: string | null; email: string; provider: string; image: string | null }) => ({
      id: u.id,
      name: networkName(u),
      image: u.image ?? null,
      anon: u.provider === "anon",
    });

    return withAnonCookie(
      NextResponse.json({
        connections: accepted.map((c) => ({
          id: c.id,
          since: c.updatedAt.toISOString(),
          viaMirror: c.viaMirror,
          person: c.requesterId === visitor.user.id ? shape(c.addressee) : shape(c.requester),
        })),
        incoming: incoming.map((c) => ({
          id: c.id,
          note: c.note,
          viaMirror: c.viaMirror,
          createdAt: c.createdAt.toISOString(),
          person: shape(c.requester),
        })),
        outgoing: outgoing.map((c) => ({
          id: c.id,
          note: c.note,
          createdAt: c.createdAt.toISOString(),
          person: shape(c.addressee),
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error("network connections GET failed", err);
    return NextResponse.json({ error: "The introductions could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:connect:${visitor.user.id}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The doors ask for a breath — offer again in a moment." },
        { status: 429 }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      userId?: unknown;
      note?: unknown;
      viaMirror?: unknown;
    } | null;
    if (!raw || typeof raw.userId !== "string") {
      return NextResponse.json({ error: "The introduction arrived unreadable." }, { status: 400 });
    }

    const targetId = raw.userId;
    if (targetId === visitor.user.id) {
      return NextResponse.json({ error: "One's own door is always open." }, { status: 400 });
    }
    const walls = await wallIdsFor(visitor.user.id);
    if (walls.has(targetId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }
    const reverseWall = await db.networkBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: targetId, blockedId: visitor.user.id } },
      select: { id: true },
    });
    if (reverseWall) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, email: true, provider: true },
    });
    if (!target) {
      return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
    }

    const note = typeof raw.note === "string" ? raw.note.trim().slice(0, 300) : null;
    const viaMirror = raw.viaMirror === true;

    /* an old request in the other direction is accepted where it stands */
    const reverse = await db.networkConnection.findUnique({
      where: { requesterId_addresseeId: { requesterId: targetId, addresseeId: visitor.user.id } },
    });
    if (reverse) {
      if (reverse.status === "accepted") {
        return withAnonCookie(NextResponse.json({ status: "accepted", id: reverse.id }), visitor);
      }
      const accepted = await db.networkConnection.update({
        where: { id: reverse.id },
        data: { status: "accepted", viaMirror: reverse.viaMirror || viaMirror },
      });
      await notify({
        userId: targetId,
        actorId: visitor.user.id,
        actorName: networkName(visitor.user),
        type: "connection_accepted",
        refType: "user",
        refId: visitor.user.id,
      });
      return withAnonCookie(NextResponse.json({ status: "accepted", id: accepted.id }), visitor);
    }

    const existing = await db.networkConnection.findUnique({
      where: { requesterId_addresseeId: { requesterId: visitor.user.id, addresseeId: targetId } },
    });
    if (existing) {
      return withAnonCookie(
        NextResponse.json({ status: existing.status, id: existing.id }),
        visitor
      );
    }

    const created = await db.networkConnection.create({
      data: {
        requesterId: visitor.user.id,
        addresseeId: targetId,
        note: note && note.length >= 2 ? note : null,
        viaMirror,
      },
    });
    await notify({
      userId: targetId,
      actorId: visitor.user.id,
      actorName: networkName(visitor.user),
      type: "connection_request",
      body: note ?? undefined,
      refType: "user",
      refId: visitor.user.id,
    });
    return withAnonCookie(NextResponse.json({ status: "pending", id: created.id }), visitor);
  } catch (err) {
    console.error("network connections POST failed", err);
    return NextResponse.json({ error: "The introduction could not be sent." }, { status: 500 });
  }
}
