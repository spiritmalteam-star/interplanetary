import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requestIsSecure } from "@/lib/server/access";
import { publicOrigin, safeReturnPath } from "./callback/route";

/* ------------------------------------------------------------------ */
/*  GET /api/auth/google — the Google passage.                         */
/*  When the keys are placed (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) */
/*  this opens the real OAuth consent; until then it answers with a    */
/*  gentle note instead of pretending.                                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "The Google passage opens once its two keys are placed in the laboratory's vault (GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET).",
      },
      { status: 501 }
    );
  }

  const origin = publicOrigin(req.nextUrl.origin);
  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set("mirror_g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestIsSecure(req),
    path: "/",
    maxAge: 600,
  });
  /* THE WAY BACK IS KEPT — the room the visitor signed in from rides
     along (a validated same-origin path only; the callback honors it
     once, then the cookie falls). */
  const back = safeReturnPath(req.nextUrl.searchParams.get("next"));
  if (back) {
    res.cookies.set("mirror_g_next", encodeURIComponent(back), {
      httpOnly: true,
      sameSite: "lax",
      secure: requestIsSecure(req),
      path: "/",
      maxAge: 600,
    });
  }
  return res;
}
