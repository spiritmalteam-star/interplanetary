import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { GATHERING_REGIONS } from "../route";

/* ------------------------------------------------------------------ */
/*  THE ATLAS' OWN LEDGER — how many intentions each shore of the      */
/*  earth carries. The map reads this once when it rises, so every     */
/*  region wears its living count: the visitor sees where the          */
/*  world's purposes gather before choosing their own shore.           */
/*                                                                     */
/*  THE HALL'S OWN LAWS hold: only public, published, open-hall        */
/*  offerings are counted; a closed door's words never reach the map.  */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const rows = await db.gatheringPost.groupBy({
      by: ["region"],
      _count: { _all: true },
      _max: { createdAt: true },
      where: {
        region: { not: null },
        status: "published",
        visibility: "public",
        circleId: null,
      },
    });

    const counts = new Map(rows.map((r) => [r.region as string, r]));
    const regions = GATHERING_REGIONS.map((id) => {
      const row = counts.get(id);
      return {
        id,
        count: row?._count._all ?? 0,
        latest: row?._max.createdAt ? row._max.createdAt.toISOString() : null,
      };
    });

    return withAnonCookie(NextResponse.json({ regions }), visitor);
  } catch (err) {
    console.error("gathering regions GET failed", err);
    return NextResponse.json({ error: "The atlas could not be read." }, { status: 500 });
  }
}
