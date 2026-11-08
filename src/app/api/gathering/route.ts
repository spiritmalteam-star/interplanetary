import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S DOORS — the shared hall's own API.                 */
/*                                                                     */
/*  THE FREE LAW holds here too: every visitor — a signed keeper or    */
/*  the anonymous cookie's quiet explorer — may walk the hall, offer   */
/*  a reflection, resonate with another's work, leave an echo.         */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - nothing is auto-published: a post exists because its maker       */
/*    pressed the offering hand themselves;                            */
/*  - every post keeps its maker's name (anon keeps a quiet one);      */
/*  - resonance is a tuning, not a trophy: one per explorer per post,  */
/*    taken back the moment it is withdrawn;                           */
/*  - the flood-gates (rate limits) stop bursts, not people;           */
/*  - no ranking anywhere: the hall reads newest-first, that is all.   */
/* ------------------------------------------------------------------ */

export const GATHERING_KINDS = [
  "reflection",
  "creation",
  "dream",
  "music",
  "book",
  "discovery",
  "question",
] as const;

export type GatheringKind = (typeof GATHERING_KINDS)[number];

export function isGatheringKind(v: unknown): v is GatheringKind {
  return typeof v === "string" && (GATHERING_KINDS as readonly string[]).includes(v);
}

const TITLE_MAX = 120;
const BODY_MAX = 4000;

/** the display name a post's maker wears in the hall */
export function gatheringName(user: {
  name: string | null;
  email: string;
  provider?: string | null;
}): string {
  if (user.name && user.name.trim().length >= 2) return user.name.trim().slice(0, 40);
  if (user.provider === "anon") return "A quiet explorer";
  const local = user.email.split("@")[0] ?? "";
  return local.length >= 2 ? local.slice(0, 40) : "A quiet explorer";
}

/* ---------------- GET /api/gathering — the living exhibition ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const mine = url.searchParams.get("mine") === "1";
    const cursor = url.searchParams.get("cursor");
    const take = Math.min(30, Math.max(5, Number(url.searchParams.get("take") ?? 15)));

    const rows = await db.gatheringPost.findMany({
      where: {
        ...(mine ? { userId: visitor.user.id } : {}),
        ...(isGatheringKind(kind) ? { kind } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { name: true, email: true, provider: true, image: true } },
        resonances: { where: { userId: visitor.user.id }, select: { id: true } },
        _count: { select: { resonances: true, echoes: true } },
      },
    });

    const hasMore = rows.length > take;
    const page = rows.slice(0, take);

    const posts = page.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      body: p.body,
      sector: p.sector,
      resonanceCount: p.resonanceCount,
      echoCount: p._count.echoes,
      createdAt: p.createdAt.toISOString(),
      author: {
        name: gatheringName(p.user),
        image: p.user.image ?? null,
        anon: p.user.provider === "anon",
      },
      mine: p.userId === visitor.user.id,
      resonated: p.resonances.length > 0,
    }));

    return withAnonCookie(
      NextResponse.json({
        posts,
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering GET failed", err);
    return NextResponse.json({ error: "The hall could not be read." }, { status: 500 });
  }
}

/* ---------------- POST /api/gathering — the offering hand ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const flood = rateLimit(`gathering:post:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The hall asks for a breath — offer again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      kind?: unknown;
      title?: unknown;
      body?: unknown;
      sector?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The offering arrived unreadable." }, { status: 400 });
    }

    if (!isGatheringKind(raw.kind)) {
      return NextResponse.json({ error: "Choose one of the seven intentions." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const body = typeof raw.body === "string" ? raw.body.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    if (body.length < 2 || body.length > BODY_MAX) {
      return NextResponse.json(
        { error: `The words want between 2 and ${BODY_MAX} letters.` },
        { status: 400 }
      );
    }
    const sector =
      typeof raw.sector === "string" && raw.sector.trim().length >= 2 && raw.sector.length <= 24
        ? raw.sector.trim()
        : null;

    const created = await db.gatheringPost.create({
      data: {
        userId: visitor.user.id,
        kind: raw.kind,
        title,
        body,
        sector,
      },
    });

    return withAnonCookie(
      NextResponse.json({
        post: {
          id: created.id,
          kind: created.kind,
          title: created.title,
          body: created.body,
          sector: created.sector,
          resonanceCount: 0,
          echoCount: 0,
          createdAt: created.createdAt.toISOString(),
          author: {
            name: gatheringName(visitor.user),
            image: visitor.user.image ?? null,
            anon: visitor.user.provider === "anon",
          },
          mine: true,
          resonated: false,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering POST failed", err);
    return NextResponse.json({ error: "The offering could not be placed." }, { status: 500 });
  }
}
