import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "node:stream";

/* ------------------------------------------------------------------ */
/*  /gathering-media/<file> — the gathering's own shelf, read aloud.   */
/*                                                                     */
/*  Every uploaded picture, film and voice rests outside public/ and   */
/*  is streamed per request, so a file is served the same breath it    */
/*  is uploaded — in dev and in production alike. Films and voices     */
/*  answer Range requests, so the hand may scrub and seek.             */
/* ------------------------------------------------------------------ */

const MEDIA_DIR = path.join(process.cwd(), ".gathering-media");

/* a ranged answer never exceeds this many bytes — an open-ended
   "bytes=0-" gets the first chunk and the player asks again for more,
   so one request can never pull a whole film into memory */
const MAX_RANGE_BYTES = 4 * 1024 * 1024;

function streamBody(filePath: string, opts?: { start: number; end: number }): ReadableStream {
  return Readable.toWeb(fs.createReadStream(filePath, opts)) as unknown as ReadableStream;
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  /* strict name check — only our own shelf names may pass */
  if (!/^gm-[a-z0-9-]+\.[a-z0-9]+$/i.test(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 400 });
  }
  const ext = (file.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 400 });
  }

  const filePath = path.join(MEDIA_DIR, file);
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const stat = fs.statSync(filePath);
    const range = req.headers.get("range");

    /* THE RANGE HAND — films and voices are scrubbed, so the middle
       of the file may be asked for by itself */
    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        let start: number;
        let end: number;
        if (!match[1] && match[2]) {
          /* a suffix range — "the last N bytes" */
          const n = Number(match[2]);
          start = Math.max(0, stat.size - n);
          end = stat.size - 1;
        } else {
          start = match[1] ? Number(match[1]) : 0;
          end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
        }
        end = Math.min(end, start + MAX_RANGE_BYTES - 1);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start >= stat.size || start > end) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${stat.size}` },
          });
        }
        return new NextResponse(streamBody(filePath, { start, end }), {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    }

    return new NextResponse(streamBody(filePath), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The shelf could not be read just now." },
      { status: 500 }
    );
  }
}
