import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  GATHER LIVE — /api/network/events                                  */
/*                                                                     */
/*  Scheduled text gatherings: a host, a moment, a room of words,      */
/*  and a record written afterwards with consent. Audio and video      */
/*  wait until readiness — the room speaks in text only.               */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - time is read from the tables, never guessed: a scheduled room    */
/*    whose moment has come opens itself (lazily, on read); a live     */
/*    room whose window has passed ends itself;                        */
/*  - the flood-gates stop bursts, not people;                         */
/*  - the quiet walls hold: a closed door's gatherings never surface.  */
/* ------------------------------------------------------------------ */

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;
const DURATION_MIN = 15;
const DURATION_MAX = 240;
const DAYS_AHEAD_MAX = 365;

/** the lazy clock — a scheduled room whose moment has arrived opens
    itself; a live room whose window has passed closes itself. Read
    once, persisted honestly. */
async function turnTheClock(): Promise<void> {
  const now = new Date();
  await db.networkEvent.updateMany({
    where: { status: "scheduled", scheduledFor: { lte: now } },
    data: { status: "live" },
  });
  const live = await db.networkEvent.findMany({
    where: { status: "live" },
    select: { id: true, scheduledFor: true, durationMin: true },
  });
  const endedIds = live
    .filter((e) => e.scheduledFor.getTime() + e.durationMin * 60 * 1000 < now.getTime())
    .map((e) => e.id);
  if (endedIds.length > 0) {
    await db.networkEvent.updateMany({
      where: { id: { in: endedIds } },
      data: { status: "ended", endedAt: now },
    });
  }
}

/* ---------------- GET — the gatherings in their own order ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const take = Math.min(40, Math.max(1, Number(new URL(req.url).searchParams.get("take") ?? 30)));

    await turnTheClock();

    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.networkEvent.findMany({
      orderBy: { scheduledFor: "asc" },
      take: 160,
      include: {
        host: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { attendees: true } },
        attendees: {
          where: { userId: visitor.user.id },
          select: { id: true },
        },
      },
    });

    /* live rooms breathe first, then the moments still to come (soon
       first), then the ended ones rest beneath (latest first) */
    const rank = (status: string): number => (status === "live" ? 0 : status === "scheduled" ? 1 : 2);
    const visible = rows
      .filter((e) => !walls.has(e.hostId))
      .sort((a, b) => {
        const byRank = rank(a.status) - rank(b.status);
        if (byRank !== 0) return byRank;
        if (a.status === "ended") return b.scheduledFor.getTime() - a.scheduledFor.getTime();
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      })
      .slice(0, take);

    const events = visible.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      scheduledFor: e.scheduledFor.toISOString(),
      durationMin: e.durationMin,
      format: e.format,
      status: e.status,
      attendeeCount: e._count.attendees,
      joined: e.attendees.length > 0,
      mine: e.hostId === visitor.user.id,
      host: {
        id: e.hostId,
        name: networkName(e.host),
        anon: e.host.provider === "anon",
      },
    }));

    return withAnonCookie(NextResponse.json({ events }), visitor);
  } catch (err) {
    console.error("network events GET failed", err);
    return NextResponse.json({ error: "The gatherings could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — set a moment ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:event:create:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The gatherings ask for a breath — set a moment again soon." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      description?: unknown;
      scheduledFor?: unknown;
      durationMin?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The gathering arrived unreadable." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    const description =
      typeof raw.description === "string" && raw.description.trim().length >= 2
        ? raw.description.trim().slice(0, DESCRIPTION_MAX)
        : null;

    /* the moment — real, still to come, and not farther than a year */
    if (typeof raw.scheduledFor !== "string") {
      return NextResponse.json(
        { error: "Choose a moment still to come." },
        { status: 400 }
      );
    }
    const scheduledFor = new Date(raw.scheduledFor);
    const now = Date.now();
    if (
      Number.isNaN(scheduledFor.getTime()) ||
      scheduledFor.getTime() <= now ||
      scheduledFor.getTime() > now + DAYS_AHEAD_MAX * 24 * 60 * 60 * 1000
    ) {
      return NextResponse.json(
        { error: "Choose a moment still to come." },
        { status: 400 }
      );
    }

    /* the room's own length — a gathering keeps honest hours */
    const durationRaw =
      raw.durationMin === undefined || raw.durationMin === null ? 60 : Number(raw.durationMin);
    if (
      !Number.isFinite(durationRaw) ||
      !Number.isInteger(durationRaw) ||
      durationRaw < DURATION_MIN ||
      durationRaw > DURATION_MAX
    ) {
      return NextResponse.json(
        { error: `A gathering keeps between ${DURATION_MIN} and ${DURATION_MAX} minutes.` },
        { status: 400 }
      );
    }

    const created = await db.networkEvent.create({
      data: {
        hostId: visitor.user.id,
        title,
        description,
        scheduledFor,
        durationMin: durationRaw,
      },
    });
    await db.networkEventAttendee.create({
      data: { eventId: created.id, userId: visitor.user.id, role: "host" },
    });

    return withAnonCookie(NextResponse.json({ event: { id: created.id } }), visitor);
  } catch (err) {
    console.error("network events POST failed", err);
    return NextResponse.json({ error: "The moment could not be set." }, { status: 500 });
  }
}
