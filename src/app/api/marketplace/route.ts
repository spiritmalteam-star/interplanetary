import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAnonCookie } from "@/lib/server/access";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace — THE OPEN HALL'S OWN TABLE.                  */
/*                                                                     */
/*  The visitor named the market: a beautiful, laid-out hall at the    */
/*  crown's corner where every visitor's creations are displayed —    */
/*  books, musics, research files, artworks and more. The hall reads   */
/*  the house's own shelves: the cosmic library (every sector's saved  */
/*  transmissions, the woven volumes with their painted covers) and    */
/*  the music vault's track rows (every song's name, its maker, its    */
/*  length — streamed through the hall's own listening door).          */
/*                                                                     */
/*  THE HALL'S LIGHT HAND: a display is a preview, not a cargo run —   */
/*  the listing carries names, first breaths, covers and lengths,      */
/*  never the full freight of a volume's pages.                        */
/* ------------------------------------------------------------------ */

type MarketKind = "book" | "music" | "art" | "research";

interface MarketItem {
  id: string;
  kind: MarketKind;
  title: string;
  excerpt: string;
  creator: string;
  createdAt: string;
  cover: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  pages: number | null;
  /** the volume's subject / the song's chamber — one honest line */
  note: string | null;
}

function creatorName(
  user: { name: string | null; email: string } | null | undefined
): string {
  if (!user) return "A keeper of the house";
  if (user.name && user.name.trim()) return user.name.trim();
  const email = user.email ?? "";
  if (email.includes("@") && !email.startsWith("anon:")) {
    return email.split("@")[0];
  }
  return "A keeper of the house";
}

export async function GET(req: NextRequest) {
  try {
    const items: MarketItem[] = [];

    /* ---------- the woven volumes and the saved transmissions ---------- */
    const rows = await db.libraryEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 240,
      select: {
        id: true,
        sector: true,
        title: true,
        excerpt: true,
        content: true,
        cover: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    for (const r of rows) {
      let content: Record<string, unknown> = {};
      try {
        const parsed: unknown = JSON.parse(r.content);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          content = parsed as Record<string, unknown>;
        }
      } catch {
        /* a row that does not speak JSON keeps only its shelf words */
      }

      if (r.sector === "dreambook" || r.sector === "dreambook_archive") {
        /* the woven volumes — the hall's principal works */
        const pages = Array.isArray(content.pages)
          ? (content.pages as unknown[]).length
          : null;
        items.push({
          id: r.id,
          kind: "book",
          title: String(content.title ?? r.title ?? "A Dream Book"),
          excerpt:
            String(content.axiom ?? content.subtitle ?? r.excerpt ?? "").slice(
              0,
              240
            ) || "A volume woven in real time.",
          creator: creatorName(r.user),
          createdAt: r.createdAt.toISOString(),
          cover: r.cover ?? null,
          audioUrl: null,
          durationSec: null,
          pages,
          note: String(content.topic ?? "") || null,
        });
        continue;
      }

      if (r.sector === "artx") {
        /* the atelier's plates — the hall's gallery wall */
        items.push({
          id: r.id,
          kind: "art",
          title: r.title || "A vision from the atelier",
          excerpt: String(content.query ?? r.excerpt ?? "").slice(0, 240),
          creator: creatorName(r.user),
          createdAt: r.createdAt.toISOString(),
          cover: null,
          audioUrl: null,
          durationSec: null,
          pages: null,
          note: null,
        });
        continue;
      }

      /* every other sector — the observatory's studies, the quantum
         readings, the healing treatises, the shaping intents: research */
      items.push({
        id: r.id,
        kind: "research",
        title: r.title || "A transmission",
        excerpt: String(content.reply ?? r.excerpt ?? "").slice(0, 240),
        creator: creatorName(r.user),
        createdAt: r.createdAt.toISOString(),
        cover: null,
        audioUrl: null,
        durationSec: null,
        pages: null,
        note: r.sector,
      });
    }

    /* ---------- the songs ---------- */
    const tracks = await db.musicTrack.findMany({
      where: { status: { not: "failed" } },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        title: true,
        audioUrl: true,
        localFile: true,
        durationSec: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    for (const t of tracks) {
      /* the hall's own listening door — never the private vault's */
      const audioUrl = t.localFile
        ? `/api/marketplace/audio/${encodeURIComponent(t.localFile)}`
        : null;
      items.push({
        id: t.id,
        kind: "music",
        title: t.title || "A woven song",
        excerpt: "A transmission woven into sound in the music chamber.",
        creator: creatorName(t.user),
        createdAt: t.createdAt.toISOString(),
        cover: null,
        audioUrl,
        durationSec: t.durationSec ?? null,
        pages: null,
        note: null,
      });
    }

    /* the hall hangs its newest works first */
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({
      items: items.slice(0, 160),
      counts: {
        books: items.filter((i) => i.kind === "book").length,
        music: items.filter((i) => i.kind === "music").length,
        art: items.filter((i) => i.kind === "art").length,
        research: items.filter((i) => i.kind === "research").length,
      },
    });
  } catch (err) {
    console.error("[marketplace] failed:", err);
    return NextResponse.json(
      { error: "The hall's doors rest a moment. Breathe, then return." },
      { status: 500 }
    );
  }
}
