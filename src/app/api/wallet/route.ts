import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { ensureWallet, walletEnforced } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  GET /api/wallet — the visitor's own light, at a glance.            */
/*                                                                     */
/*  The badge and the doors ask here: planTier, both credit buckets    */
/*  and their sum. EVERY visitor is answered — the signed passage and  */
/*  the anonymous keeper alike — and the wallet is laid down on the    */
/*  first glance (five free lights at birth). A stateless visitor      */
/*  (the vault resting) simply receives null — nothing pretended.      */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ wallet: null }), visitor);
    }
    const wallet = await ensureWallet(visitor.user.id);
    return withAnonCookie(
      NextResponse.json({ wallet, enforced: walletEnforced() }),
      visitor
    );
  } catch (err) {
    console.error("[wallet] glance failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ wallet: null }, { status: 200 });
  }
}
