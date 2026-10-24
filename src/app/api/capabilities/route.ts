import { NextResponse } from "next/server";
import { listCapabilities } from "@/lib/capabilities/registry";

/* ------------------------------------------------------------------ */
/*  GET /api/capabilities — the toolbox's own public shelf.            */
/*  Every capability with its honest contract and status, so the       */
/*  interface (and the visitor) may see what truly stands.            */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { capabilities: listCapabilities() },
    { headers: { "cache-control": "no-store" } }
  );
}
