import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE GATHERING — /api/network/events/[id]                           */
/*                                                                     */
/*  GET  — the room: its moment, its state, its summary, and the       */
/*         last two hundred words spoken inside it.                    */
/*  POST — the hands of the room:                                      */
/*    register / cancel — take a seat, set it down;                    */
/*    open / end        — the host's own hands hold the room's time;   */
/*    message           — only the gathered may speak, and only        */
/*                        while the gathering stands;                  */
/*    summary           — the record, written after, by consent.       */
/* ------------------------------------------------------------------ */

const MESSAGE_MAX = 1000;
const SUMMARY_MAX = 4000;

type EventParams = { params: Promise<{ id: string }> };

/* ---------------- GET — the room ---------------- */
export async function GET(req: NextRequest, { params }: EventParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    /* the lazy clock for this one room */
    const now = new Date();
    const existing = await db.networkEvent.findUnique({
      where: { id },
      select: { id: true, status: true, scheduledFor: true, durationMin: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "That gathering no longer stands." }, { status: 404 });
    }
    if (existing.status === "scheduled" && existing.scheduledFor.getTime() <= now.getTime()) {
      await db.networkEvent.update({
        where: { id },
        data: { status: "live" },
      });
    } else if (
      existing.status === "live" &&
      existing.scheduledFor.getTime() + existing.durationMin * 60 * 1000 < now.getTime()
    ) {
      await db.networkEvent.update({
        where: { id },
        data: { status: "ended", endedAt: now },
      });
    }

    const event = await db.networkEvent.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { attendees: true } },
        attendees: {
          where: { userId: visitor.user.id },
          select: { id: true, role: true },
        },
      },
    });
    if (!event) {
      return NextResponse.json({ error: "That gathering no longer stands." }, { status: 404 });
    }

    /* the quiet walls hold — a closed door's gathering rests unread */
    const walls = await wallIdsFor(visitor.user.id);
    if (event.hostId !== visitor.user.id && walls.has(event.hostId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    /* the last two hundred words, oldest first — the room's own river */
    const messagesRaw = await db.networkEventMessage.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { author: { select: { id: true, name: true, email: true, provider: true } } },
    });

    return withAnonCookie(
      NextResponse.json({
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          scheduledFor: event.scheduledFor.toISOString(),
          durationMin: event.durationMin,
          format: event.format,
          status: event.status,
          summary: event.summary,
          endedAt: event.endedAt ? event.endedAt.toISOString() : null,
          attendeeCount: event._count.attendees,
          joined: event.attendees.length > 0,
          role: event.attendees[0]?.role ?? null,
          mine: event.hostId === visitor.user.id,
          host: {
            id: event.hostId,
            name: networkName(event.host),
            anon: event.host.provider === "anon",
          },
          messages: messagesRaw
            .slice()
            .reverse()
            .map((m) => ({
              id: m.id,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
              mine: m.authorId === visitor.user.id,
              author: {
                id: m.authorId,
                name: networkName(m.author),
                anon: m.author.provider === "anon",
              },
            })),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network event GET failed", err);
    return NextResponse.json({ error: "The gathering could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — the hands of the room ---------------- */
export async function POST(req: NextRequest, { params }: EventParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      body?: unknown;
      summary?: unknown;
    } | null;
    if (!raw || typeof raw.action !== "string") {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    const event = await db.networkEvent.findUnique({
      where: { id },
      select: {
        id: true,
        hostId: true,
        title: true,
        status: true,
        scheduledFor: true,
        durationMin: true,
      },
    });
    if (!event) {
      return NextResponse.json({ error: "That gathering no longer stands." }, { status: 404 });
    }

    const isHost = event.hostId === visitor.user.id;
    const attendance = await db.networkEventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: visitor.user.id } },
      select: { id: true, role: true },
    });

    /* ---- seats ---- */
    if (raw.action === "register") {
      if (event.status === "ended") {
        return NextResponse.json(
          { error: "That gathering has already ended — its seats rest now." },
          { status: 400 }
        );
      }
      if (!attendance) {
        await db.networkEventAttendee.create({
          data: { eventId: id, userId: visitor.user.id, role: "participant" },
        });
      }
      return withAnonCookie(NextResponse.json({ joined: true }), visitor);
    }

    if (raw.action === "cancel") {
      if (attendance) {
        await db.networkEventAttendee.delete({ where: { id: attendance.id } });
      }
      return withAnonCookie(NextResponse.json({ joined: false }), visitor);
    }

    /* ---- the room's own time — the host's hands only ---- */
    if (raw.action === "open") {
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the gathering's own host may open the room." },
          { status: 403 }
        );
      }
      if (event.status === "ended") {
        return NextResponse.json(
          { error: "That gathering has already ended." },
          { status: 400 }
        );
      }
      if (event.status !== "live") {
        await db.networkEvent.update({ where: { id }, data: { status: "live" } });
        /* the gathered hear the room open */
        const attendees = await db.networkEventAttendee.findMany({
          where: { eventId: id },
          select: { userId: true },
          take: 100,
        });
        for (const a of attendees) {
          await notify({
            userId: a.userId,
            actorId: visitor.user.id,
            actorName: networkName(visitor.user),
            type: "project_entry",
            body: "started now",
            refType: "event",
            refId: id,
          });
        }
      }
      return withAnonCookie(NextResponse.json({ status: "live" }), visitor);
    }

    if (raw.action === "end") {
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the gathering's own host may end the room." },
          { status: 403 }
        );
      }
      if (event.status !== "ended") {
        await db.networkEvent.update({
          where: { id },
          data: { status: "ended", endedAt: new Date() },
        });
      }
      return withAnonCookie(NextResponse.json({ status: "ended" }), visitor);
    }

    /* ---- the room speaks ---- */
    if (raw.action === "message") {
      if (!attendance) {
        return NextResponse.json(
          { error: "Only the gathered may speak in the room." },
          { status: 403 }
        );
      }
      const flood = rateLimit(`network:event:message:${visitor.user.id}:${id}`, {
        limit: 30,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "The room asks for a breath — speak again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }
      if (event.status !== "live") {
        return NextResponse.json(
          { error: "The room only speaks while the gathering stands." },
          { status: 400 }
        );
      }
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (body.length < 1 || body.length > MESSAGE_MAX) {
        return NextResponse.json(
          { error: `A room's words want between 1 and ${MESSAGE_MAX} letters.` },
          { status: 400 }
        );
      }
      const created = await db.networkEventMessage.create({
        data: { eventId: id, authorId: visitor.user.id, body },
      });
      return withAnonCookie(
        NextResponse.json({
          message: {
            id: created.id,
            body: created.body,
            createdAt: created.createdAt.toISOString(),
            mine: true,
            author: {
              id: visitor.user.id,
              name: networkName(visitor.user),
              anon: visitor.user.provider === "anon",
            },
          },
        }),
        visitor
      );
    }

    /* ---- the record, written after, by consent ---- */
    if (raw.action === "summary") {
      if (!isHost) {
        return NextResponse.json(
          { error: "Only the gathering's own host writes its record." },
          { status: 403 }
        );
      }
      if (event.status !== "ended") {
        return NextResponse.json(
          { error: "The record is written after the gathering ends." },
          { status: 400 }
        );
      }
      const flood = rateLimit(`network:event:summary:${visitor.user.id}`, {
        limit: 12,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "A breath first — write the record again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }
      const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
      if (summary.length < 1 || summary.length > SUMMARY_MAX) {
        return NextResponse.json(
          { error: `The record wants between 1 and ${SUMMARY_MAX} letters.` },
          { status: 400 }
        );
      }
      await db.networkEvent.update({ where: { id }, data: { summary } });
      return withAnonCookie(NextResponse.json({ summary }), visitor);
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network event POST failed", err);
    return NextResponse.json({ error: "The gathering could not be tended." }, { status: 500 });
  }
}
