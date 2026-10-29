import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor } from "@/lib/server/access";
import ZAI from "@/lib/zai-client";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  THE PUBLISHING HAND — the market's own door.                       */
/*                                                                     */
/*  A keeper who has just woven something — a book, a song, a vision,  */
/*  a study — may lay it on the market's shelf with one touch. The     */
/*  Mirror organizes the offering: it writes the explaining words,     */
/*  dresses the display with the creation's own cover, and hangs it    */
/*  in the hall for every signed-in keeper to see.                     */
/*                                                                     */
/*  THE PASSAGE LAW: only a signed-in keeper may publish, see or       */
/*  purchase. An anonymous visitor is asked for their passage first.   */
/*                                                                     */
/*  THE SAME PLACE LAW: the whole work happens at the shelf where the  */
/*  visitor stands — the publish hand reports its progress where it    */
/*  is, the visitor never travels, and a publishing may be cancelled   */
/*  until it goes live.                                                */
/*                                                                     */
/*  POST   { kind, refId, refKind?, title?, excerpt?, cover?,          */
/*           audioUrl?, localFile?, durationSec?, pages? }             */
/*          → lays the offering, begins the Mirror's writing           */
/*  GET    ?refId=… (one) | (none: every listing of this keeper)       */
/*          → the progress of the keeper's own offerings               */
/*  DELETE ?id=… → cancel a publishing (or take a live work down)      */
/* ------------------------------------------------------------------ */

type MarketKind = "book" | "music" | "art" | "research";

const KINDS: ReadonlySet<string> = new Set(["book", "music", "art", "research"]);

interface PublishBody {
  kind?: string;
  refId?: string;
  refKind?: string;
  title?: string;
  excerpt?: string;
  cover?: string | null;
  audioUrl?: string | null;
  localFile?: string | null;
  durationSec?: number | null;
  pages?: number | null;
}

function denied() {
  return NextResponse.json(
    {
      error:
        "The hall keeps its doors for the house's own keepers — sign in, and your offering takes its shelf.",
      code: "SIGN_IN_REQUIRED",
    },
    { status: 401 }
  );
}

/* THE MIRROR'S OWN WORDS — the hall's explaining voice: warm, honest,
   short. Never a sales cry; the market is a gallery, not a bazaar. */
async function mirrorNote(
  kind: MarketKind,
  title: string,
  excerpt: string,
  creatorName: string
): Promise<string | null> {
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are the quiet curator of a gallery where people's creations are shown — books, songs, images and studies woven with an AI mirror. Write the small placard that hangs beside one creation. Two to three sentences, plain and warm, speaking directly about what makes this piece worth a visitor's time. Name its kind naturally (a story, a song, a vision, a study). Never use emojis, quotes around the whole text, hashtags, or words like 'user'. Never mention that a mirror or AI curator wrote this. Sound human, admiring but honest.",
        },
        {
          role: "user",
          content: `Kind: ${kind}\nTitle: ${title}\nBy: ${creatorName}\nFirst breath: ${excerpt.slice(0, 400) || "(no words given)"}`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 220,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const note = raw.trim().replace(/^["“”']+|["“”']+$/g, "").slice(0, 600);
    return note || null;
  } catch (err) {
    console.error(
      "[marketplace/publish] the Mirror's words rested:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

async function readBody(req: NextRequest): Promise<PublishBody | null> {
  try {
    return (await req.json()) as PublishBody;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.anon) return denied();

    const b = await readBody(req);
    if (!b || !b.kind || !b.refId || !KINDS.has(b.kind)) {
      return NextResponse.json(
        { error: "The offering arrived without its name or its kind." },
        { status: 400 }
      );
    }
    const kind = b.kind as MarketKind;

    /* the offering must exist and belong to this keeper */
    let title = (b.title ?? "").trim();
    let excerpt = (b.excerpt ?? "").trim();
    let cover = b.cover ?? null;
    let audioUrl = b.audioUrl ?? null;
    let localFile = b.localFile ?? null;
    let durationSec = b.durationSec ?? null;
    let pages = b.pages ?? null;

    if (b.refKind === "music") {
      const track = await db.musicTrack.findFirst({
        where: { id: b.refId, userId: visitor.user.id },
        select: { title: true, audioUrl: true, localFile: true, durationSec: true, status: true },
      });
      if (!track) {
        return NextResponse.json(
          { error: "The song could not be found in your keeping." },
          { status: 404 }
        );
      }
      if (track.status === "failed") {
        return NextResponse.json(
          { error: "This song never finished its weaving — it cannot hang in the hall." },
          { status: 409 }
        );
      }
      title = title || track.title;
      audioUrl = audioUrl ?? track.audioUrl;
      localFile = localFile ?? track.localFile;
      durationSec = durationSec ?? track.durationSec;
    } else {
      const entry = await db.libraryEntry.findFirst({
        where: { id: b.refId, userId: visitor.user.id },
        select: { title: true, excerpt: true, cover: true, content: true },
      });
      if (!entry) {
        return NextResponse.json(
          { error: "The work could not be found in your keeping." },
          { status: 404 }
        );
      }
      title = title || entry.title;
      excerpt = excerpt || entry.excerpt;
      cover = cover ?? entry.cover;
      if (pages === null) {
        try {
          const content = JSON.parse(entry.content) as { pages?: unknown };
          if (Array.isArray(content.pages)) pages = content.pages.length;
        } catch {
          /* a shelf row that keeps its own counsel */
        }
      }
    }
    if (!title) title = "An unnamed offering";

    /* one shelf per creation — publishing again refreshes the words */
    const existing = await db.marketListing.findUnique({
      where: { userId_refId: { userId: visitor.user.id, refId: b.refId } },
      select: { id: true },
    });

    const creatorName =
      (visitor.user.name ?? "").trim() ||
      (visitor.user.email.includes("@") && !visitor.user.email.startsWith("anon:")
        ? visitor.user.email.split("@")[0]
        : "A keeper of the house");

    const data = {
      kind,
      refId: b.refId,
      refKind: b.refKind === "music" ? "music" : "library",
      title: title.slice(0, 220),
      creatorName: creatorName.slice(0, 80),
      excerpt: excerpt.slice(0, 500) || null,
      cover,
      audioUrl,
      localFile,
      durationSec,
      pages,
      status: "publishing",
      progress: 10,
    };

    const listing = existing
      ? await db.marketListing.update({ where: { id: existing.id }, data })
      : await db.marketListing.create({
          data: { ...data, userId: visitor.user.id },
        });

    return NextResponse.json({ ok: true, listing: shape(listing) });
  } catch (err) {
    console.error("[marketplace/publish] failed:", err);
    return NextResponse.json(
      { error: "The shelf rested a moment. Breathe, then offer again." },
      { status: 500 }
    );
  }
}

/* GET — the keeper's own offerings and their progress. When a listing
   still stands "publishing", this door ALSO does the work itself: the
   Mirror's words are written and the display is dressed, step by step,
   so a poll always moves the offering forward (no distant worker is
   needed — the work is small and honest). */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.anon) return denied();

    const refId = req.nextUrl.searchParams.get("refId");
    const where = refId
      ? { userId: visitor.user.id, refId }
      : { userId: visitor.user.id };
    const rows = await db.marketListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: refId ? 1 : 80,
    });

    /* the work itself — one step per poll, so progress is real */
    for (const row of rows) {
      if (row.status !== "publishing") continue;
      if (row.progress <= 10) {
        const note = await mirrorNote(
          row.kind as MarketKind,
          row.title,
          row.excerpt ?? "",
          row.creatorName
        );
        await db.marketListing.update({
          where: { id: row.id },
          data: {
            note:
              note ??
              "(the Mirror's words rest — this offering speaks through its cover)",
            progress: 60,
          },
        });
        row.note = note ?? row.note;
        row.progress = 60;
      } else if (row.progress < 100) {
        await db.marketListing.update({
          where: { id: row.id },
          data: { status: "live", progress: 100 },
        });
        row.status = "live";
        row.progress = 100;
      }
    }

    return NextResponse.json({ listings: rows.map(shape) });
  } catch (err) {
    console.error("[marketplace/publish] read failed:", err);
    return NextResponse.json(
      { error: "The shelf's ledger rested a moment." },
      { status: 500 }
    );
  }
}

/* DELETE — the cancel hand: a publishing may be laid down before it
   goes live; a live work may be taken off the shelf by its maker. */
export async function DELETE(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.anon) return denied();

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Which offering should be laid down?" },
        { status: 400 }
      );
    }
    const row = await db.marketListing.findFirst({
      where: { id, userId: visitor.user.id },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json(
        { error: "That offering is not yours to lay down." },
        { status: 404 }
      );
    }
    await db.marketListing.update({
      where: { id: row.id },
      data: { status: "cancelled", progress: 0 },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[marketplace/publish] cancel failed:", err);
    return NextResponse.json(
      { error: "The cancel hand rested a moment." },
      { status: 500 }
    );
  }
}

function shape(r: {
  id: string;
  kind: string;
  refId: string;
  refKind: string;
  title: string;
  creatorName: string;
  note: string | null;
  excerpt: string | null;
  cover: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  pages: number | null;
  status: string;
  progress: number;
  createdAt: Date;
}) {
  return {
    id: r.id,
    kind: r.kind as MarketKind,
    refId: r.refId,
    refKind: r.refKind,
    title: r.title,
    creatorName: r.creatorName,
    note: r.note,
    excerpt: r.excerpt,
    cover: r.cover,
    audioUrl: r.audioUrl,
    durationSec: r.durationSec,
    pages: r.pages,
    status: r.status,
    progress: r.progress,
    createdAt: r.createdAt.toISOString(),
  };
}
