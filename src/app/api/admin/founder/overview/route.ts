import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin";
import { buildFounderOverview } from "@/lib/server/founder-metrics";

/* GET /api/admin/founder/overview?days=30 — the founder's truth.
   Server-verified founder only; every other caller gets the same
   404 a missing page gives (the door's existence is not confirmed).
   Read-only: no writes, no provider calls, no secrets. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "private, no-store" } });
  }
  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const data = await buildFounderOverview(days);
  return NextResponse.json(data, { headers: { "cache-control": "private, no-store" } });
}
