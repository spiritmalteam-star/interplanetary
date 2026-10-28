import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { getLoopFinal, readLoopFinalFile } from "@/lib/server/lc-engine";
import { dbLoopFinal } from "@/lib/server/loop-vault";

/* ------------------------------------------------------------------ */
/*  GET /api/light-codes/audio?token=… — the finished journey's door.  */
/*                                                                     */
/*  A long piece cannot ride the JSON response (it would dwarf the     */
/*  sky's door), so the woven journey rests on the vault's deep shelf  */
/*  (the database — it crosses warm instances) and is fetched here     */
/*  once — bytes only, no JSON wrapping. A stateless keeper's journey  */
/*  still rests on the warm instance's own shelf and is served from    */
/*  there. THE OWNERSHIP LAW: the token answers only to the keeper     */
/*  whose weave laid it down; every other ask is met with silence      */
/*  (404). THE RANGE LAW: seeking honors byte ranges (206).            */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!/^lp[\w]{6,40}$/.test(token)) {
      return NextResponse.json({ error: "No journey answers to that token." }, { status: 400 });
    }
    const visitor = await resolveVisitor(req);

    /* the deep shelf first — the journey that crossed instances */
    const deep = await dbLoopFinal(token, visitor.user.id).catch(() => null);
    let bytes: Buffer | null = deep ? deep.audio : null;
    let mime = deep?.mime ?? "audio/mpeg";

    /* the instance shelf — the stateless keeper's own warm ground */
    if (!bytes) {
      const final = getLoopFinal(token, visitor.user.id);
      if (final) {
        bytes = await readLoopFinalFile(final);
        mime = "audio/mpeg";
      }
    }
    if (!bytes) {
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

    /* the range ask — "bytes=start-end", "bytes=start-", "bytes=-n" */
    const size = bytes.length;
    let start = 0;
    let end = size - 1;
    let partial = false;
    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
      if (m && (m[1] !== "" || m[2] !== "")) {
        if (m[1] === "") {
          const suffix = Math.min(parseInt(m[2], 10) || 0, size);
          start = Math.max(0, size - suffix);
          end = size - 1;
        } else {
          start = Math.min(parseInt(m[1], 10) || 0, Math.max(0, size - 1));
          end = m[2] === "" ? size - 1 : Math.min(parseInt(m[2], 10) || 0, size - 1);
        }
        partial = true;
        if (start > end || start >= size) {
          return withAnonCookie(
            new NextResponse(null, {
              status: 416,
              headers: { "Content-Range": `bytes */${size}` },
            }),
            visitor
          );
        }
      }
    }

    const slice = partial ? bytes.subarray(start, end + 1) : bytes;
    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Content-Length": String(slice.length),
      "Cache-Control": "private, max-age=600",
    };
    if (partial) {
      headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
    return withAnonCookie(
      new NextResponse(new Uint8Array(slice), {
        status: partial ? 206 : 200,
        headers,
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
