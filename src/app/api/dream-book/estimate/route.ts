import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { walletEnforced } from "@/lib/server/wallet";
import { estimateBookCredits } from "@/lib/book-pricing";
import { topicHoldsGround } from "@/lib/book-length";

/* ------------------------------------------------------------------ */
/*  POST /api/dream-book/estimate — THE SCALES AT THE DOOR.            */
/*                                                                     */
/*  The honest price of a weaving, spoken BEFORE the loom begins:      */
/*  the plan's pages, the telling's depth, the reader's page measure — */
/*  one band of credits the visitor reads while they still hold the    */
/*  choice. No purse is touched here: this door only reads the scales  */
/*  (the weaving itself draws stride by stride as it works).           */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => null)) as {
      config?: {
        volume?: string;
        level?: string;
        age?: string;
        tale?: string;
        topic?: string;
        wishes?: string;
        pages?: number;
      };
    } | null;
    const config = body?.config ?? {};

    /* the visitor is resolved only to name their purse — a stateless
       or resting vault simply leaves the balance out of the answer */
    let spendable: number | null = null;
    let visitor: Awaited<ReturnType<typeof resolveVisitor>> | null = null;
    try {
      visitor = await resolveVisitor(req);
      if (!visitor.user.id.startsWith("stateless:")) {
        const { ensureWallet } = await import("@/lib/server/wallet");
        const snap = await ensureWallet(visitor.user.id);
        spendable = snap.freeCreditsRemaining + snap.paidCreditsRemaining;
      }
    } catch {
      /* the scales weigh without the purse when the vault rests */
    }

    const topic = typeof config.topic === "string" ? config.topic : "";
    const wishes = typeof config.wishes === "string" ? config.wishes : "";
    const ground = topicHoldsGround(`${topic} ${wishes}`);

    const estimate = estimateBookCredits({
      volume: config.volume,
      level: config.level,
      age: config.age,
      topic,
      wishes,
      pages: typeof config.pages === "number" ? config.pages : null,
      ground,
    });

    const out: Record<string, unknown> = {
      estimate,
      enforced: walletEnforced(),
      ...(spendable !== null ? { spendable } : {}),
    };
    const res = NextResponse.json(out, {
      headers: { "cache-control": "private, no-store" },
    });
    return visitor ? withAnonCookie(res, visitor) : res;
  } catch (err) {
    console.error(
      "[dream-book/estimate] failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "The scales rest for a moment." },
      { status: 500 }
    );
  }
}

/* the scales never sleep long — a quote needs no cloud room */
export const maxDuration = 30;
