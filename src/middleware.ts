/* ------------------------------------------------------------------ */
/*  THE GATEHOUSE — middleware for the whole platform.                 */
/*                                                                     */
/*  Three duties, all cheap, all structural:                          */
/*    1. THE REQUEST ID — every request carries its own correlation    */
/*       id (`x-request-id`), echoed on the response, so logs and      */
/*       traces can be followed end to end.                            */
/*    2. THE SECURITY HEADERS — nosniff, frame-deny, referrer law,     */
/*       permissions law, HSTS when the sky is https, and a            */
/*       report-only CSP that watches without breaking the house.      */
/*    3. THE ADMIN PASSAGE'S FIRST DOOR — /api/admin/* requires a      */
/*       signed session cookie to even knock (defense in depth: the    */
/*       route's own server-side role check remains the second and     */
/*       binding door — this one only stops the keyless).              */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "mirror_session";

function securityHeaders(req: NextRequest, headers: Headers): void {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), payment=(), usb=()"
  );
  const proto = req.headers.get("x-forwarded-proto") ?? "";
  if (proto.split(",")[0]?.trim() === "https") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  /* THE WATCHER, NOT THE WALL — report-only: the house sees what a
     real policy would catch, and nothing breaks while the policy is
     tuned. Promotion to enforcing CSP is the owner's own lever once
     the reports run quiet. */
  headers.set(
    "Content-Security-Policy-Report-Only",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}

export function middleware(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const path = req.nextUrl.pathname;

  /* the admin passage's first door — a keyless knock is answered at
     the gate, before any route code runs */
  if (path.startsWith("/api/admin/")) {
    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const denied = NextResponse.json(
        { error: "The console keeps its silence." },
        { status: 401 }
      );
      denied.headers.set("x-request-id", requestId);
      securityHeaders(req, denied.headers);
      return denied;
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-request-id", requestId);
  /* surfaces that opt into the correlation id can read it from here
     (ASCII only — a header's law) */
  res.headers.set("x-mirror-entity", "M.E. Mirror Entity");
  securityHeaders(req, res.headers);
  return res;
}

export const config = {
  /* everything that is not a static asset, an icon or a source map */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};
