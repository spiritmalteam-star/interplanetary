import { NextResponse } from "next/server";

/* THE HOUSE'S PULSE — liveness + the exact deployed commit, so a
   release can be verified against www.reflectme.space. No database
   call, no provider call, no secrets: it can never cost a credit or
   leak a key. */
export const dynamic = "force-dynamic";

export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return NextResponse.json(
    {
      ok: true,
      commit: sha ? sha.slice(0, 8) : null,
      env: process.env.VERCEL_ENV ?? null,
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
