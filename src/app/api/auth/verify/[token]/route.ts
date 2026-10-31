import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  GET /api/auth/verify/<token> — the letter's landing hand-off.      */
/*                                                                     */
/*  THE SCANNER'S SAFETY: this door never consumes a key. Email        */
/*  clients, link previews and antivirus walkers arrive here with a    */
/*  bare GET; if a GET could spend a verification token, the first     */
/*  curious previewer would spend the visitor's only key. The door     */
/*  simply carries the key to the quiet page (?verify=…) where a       */
/*  human hand presses one button — and only that button's POST        */
/*  (route /api/auth/verify/confirm) can ever consume it.              */
/* ------------------------------------------------------------------ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: pathToken } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? pathToken ?? "";
  const next = req.nextUrl.searchParams.get("next");
  const origin = process.env.APP_URL || req.nextUrl.origin;
  const search = new URLSearchParams();
  if (token) search.set("verify", token);
  if (next) search.set("next", next);
  const res = NextResponse.redirect(
    `${origin.replace(/\/$/, "")}/${search.size ? `?${search.toString()}` : ""}`,
    { status: 302 }
  );
  res.headers.set("cache-control", "private, no-store");
  return res;
}
