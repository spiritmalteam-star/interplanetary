import { NextResponse } from "next/server";
import { shopCatalog } from "@/lib/server/payments/catalog";

/* ------------------------------------------------------------------ */
/*  GET /api/payments/catalog                                           */
/*                                                                      */
/*  The shop itself: membership passes and coin packs with their USD    */
/*  prices. Public — the Purse renders from this; money still moves     */
/*  only through checkout and capture.                                  */
/* ------------------------------------------------------------------ */

export function GET() {
  return NextResponse.json(shopCatalog());
}
