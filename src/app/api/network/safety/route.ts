import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE QUIET WALLS — /api/network/safety                              */
/*                                                                     */
/*  GET  — the doors this visitor has closed: the blocked makers,      */
/*         each with the name they wear, for the profile's own         */
/*         privacy room; the visitor's own walls, only theirs.         */
/*  POST — a visitor may close a door (block) and open it again, or    */
/*         ask for a hand from the house (report). Every request is    */
/*         the visitor's own; nothing is judged automatically.         */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const rows = await db.networkBlock.findMany({
      where: { blockerId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        blocked: { select: { id: true, name: true, email: true, provider: true } },
      },
    });
    const blocked = rows.map((r) => ({
      id: r.blocked.id,
      name: networkName(r.blocked),
      since: r.createdAt.toISOString(),
    }));
    return withAnonCookie(NextResponse.json({ blocked }), visitor);
  } catch (err) {
    console.error("network safety GET failed", err);
    return NextResponse.json({ error: "The walls could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:safety:${visitor.user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
    }

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      userId?: unknown;
      targetType?: unknown;
      targetId?: unknown;
      reason?: unknown;
    } | null;
    if (!raw || typeof raw.action !== "string") {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    if (raw.action === "block" || raw.action === "unblock") {
      const targetId = typeof raw.userId === "string" ? raw.userId : "";
      if (!targetId || targetId === visitor.user.id) {
        return NextResponse.json({ error: "That door cannot be moved this way." }, { status: 400 });
      }
      const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!target) {
        return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
      }

      if (raw.action === "block") {
        const existing = await db.networkBlock.findUnique({
          where: { blockerId_blockedId: { blockerId: visitor.user.id, blockedId: targetId } },
          select: { id: true },
        });
        if (!existing) {
          await db.networkBlock.create({
            data: { blockerId: visitor.user.id, blockedId: targetId },
          });
        }
        return withAnonCookie(NextResponse.json({ blocked: true }), visitor);
      }

      await db.networkBlock.deleteMany({
        where: { blockerId: visitor.user.id, blockedId: targetId },
      });
      return withAnonCookie(NextResponse.json({ blocked: false }), visitor);
    }

    if (raw.action === "report") {
      const targetType = raw.targetType;
      const targetId = typeof raw.targetId === "string" ? raw.targetId : "";
      const reason = typeof raw.reason === "string" ? raw.reason.trim().slice(0, 600) : "";
      if (
        !targetId ||
        !reason ||
        typeof targetType !== "string" ||
        !["post", "echo", "user", "message", "conversation", "event"].includes(targetType)
      ) {
        return NextResponse.json({ error: "The request arrived unreadable." }, { status: 400 });
      }
      await db.networkReport.create({
        data: { reporterId: visitor.user.id, targetType, targetId, reason },
      });
      return withAnonCookie(NextResponse.json({ reported: true }), visitor);
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network safety POST failed", err);
    return NextResponse.json({ error: "The walls could not be moved." }, { status: 500 });
  }
}
