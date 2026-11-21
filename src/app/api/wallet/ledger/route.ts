import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  GET /api/wallet/ledger — the purse's own book of movements.        */
/*                                                                     */
/*  Every weigh, every fill, every refund the visitor's wallet ever    */
/*  knew, read ONLY from the caller's own rows (the ledger is the      */
/*  truth; the buckets are hands). The gate is the wallet glance's     */
/*  own: the anonymous keeper is answered too, the stateless visitor   */
/*  receives an empty book — nothing pretended.                        */
/*                                                                     */
/*  Shape: { ledger: [{ id, actionType, creditsDeducted,               */
/*                     rawCostUsd, metadata, createdAt }] }            */
/*  - newest first, limit 50, optional ?offset for older pages.        */
/*  - creditsDeducted is signed: negative spent, positive granted      */
/*    or refunded. rawCostUsd stays the row's own bookkeeping — it     */
/*    is never joined with anyone else's rows.                         */
/* ------------------------------------------------------------------ */

const LEDGER_PAGE = 50;
const MAX_OFFSET = 10000;

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ ledger: [] }), visitor);
    }

    const rawOffset = req.nextUrl.searchParams.get("offset");
    const parsed = rawOffset ? Number.parseInt(rawOffset, 10) : 0;
    const offset =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_OFFSET) : 0;

    const rows = await db.creditLedger.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: LEDGER_PAGE,
      skip: offset,
      select: {
        id: true,
        actionType: true,
        creditsDeducted: true,
        rawCostUsd: true,
        metadata: true,
        createdAt: true,
      },
    });

    return withAnonCookie(
      NextResponse.json({
        ledger: rows.map((row) => ({
          id: row.id,
          actionType: row.actionType,
          creditsDeducted: row.creditsDeducted,
          rawCostUsd: row.rawCostUsd,
          metadata: row.metadata ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error(
      "[wallet/ledger] the book could not be read:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ ledger: [] }, { status: 200 });
  }
}
