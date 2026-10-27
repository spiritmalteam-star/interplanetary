import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { getLoopFinal, readLoopFinalFile } from "@/lib/server/lc-engine";

/* ------------------------------------------------------------------ */
/*  GET /api/light-codes/audio?token=… — the finished journey's door.  */
/*                                                                     */
/*  A long piece cannot ride the JSON response (it would dwarf the     */
/*  sky's door), so the woven journey rests briefly on the warm        */
/*  instance's own shelf and is fetched here once — bytes only, no     */
/*  JSON wrapping. THE OWNERSHIP LAW: the token answers only to the    */
/*  keeper whose weave laid it down; every other ask is met with       */
/*  silence (404). The shelf is swept after a few quiet minutes —      */
/*  the visitor's own copy lives on their device, not in the house.    */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!/^lp[\w]{6,40}$/.test(token)) {
      return NextResponse.json({ error: "No journey answers to that token." }, { status: 400 });
    }
    const visitor = await resolveVisitor(req);
    const final = getLoopFinal(token, visitor.user.id);
    if (!final) {
      return withAnonCookie(
        NextResponse.json(
          {
            error:
              "The journey's sound rested before it reached you — the shelf keeps it only briefly. Ask the Mirror to weave it again; your brief still stands.",
            code: "journey_gone",
          },
          { status: 404 }
        ),
        visitor
      );
    }
    const bytes = await readLoopFinalFile(final);
    const body = new Uint8Array(bytes);
    return withAnonCookie(
      new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(bytes.length),
          "Cache-Control": "private, no-store",
        },
      }),
      visitor
    );
  } catch (err) {
    console.error(
      "[light-codes/audio] the shelf failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "The shelf rests a moment." }, { status: 500 });
  }
}
