import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor } from "@/lib/server/access";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace — THE HALL'S OWN TABLE.                       */
/*                                                                     */
/*  The market is its own world: a gallery the crown's corner hand     */
/*  opens, wearing its own violet light. It hangs only what keepers    */
/*  have PUBLISHED — every offering was laid on the shelf by its       */
/*  maker's own hand, and the Mirror wrote its explaining words.       */
/*                                                                     */
/*  THE OPEN-HALL LAW: every visitor may walk among the works — the    */
/*  passage is asked only where a hand is needed (publishing lays the  */
/*  ask itself; a future purchase asks at the checkout door).         */
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
  note: string | null;
}

export async function GET(req: NextRequest) {
  try {
    /* THE OPEN HALL — the visitor is only named for their own cookies;
       the hall's table itself is public. */
    await resolveVisitor(req);

    const rows = await db.marketListing.findMany({
      where: { status: "live" },
      orderBy: { createdAt: "desc" },
      take: 160,
      select: {
        id: true,
        kind: true,
        title: true,
        excerpt: true,
        creatorName: true,
        note: true,
        cover: true,
        audioUrl: true,
        localFile: true,
        durationSec: true,
        pages: true,
        createdAt: true,
      },
    });

    const items: MarketItem[] = rows.map((r) => ({
      id: r.id,
      kind: r.kind as MarketKind,
      title: r.title,
      excerpt: r.excerpt ?? "",
      creator: r.creatorName,
      createdAt: r.createdAt.toISOString(),
      cover: r.cover,
      /* the hall's own listening door — never the private vault's */
      audioUrl:
        r.kind === "music" && r.localFile
          ? `/api/marketplace/audio/${encodeURIComponent(r.localFile)}`
          : null,
      durationSec: r.durationSec,
      pages: r.pages,
      note: r.note,
    }));

    return NextResponse.json({
      items,
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
