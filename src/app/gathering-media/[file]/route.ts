import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/*  /gathering-media/<file> — the gathering's own shelf, read aloud.   */
/*                                                                     */
/*  Every uploaded picture, film and voice rests outside public/ and   */
/*  is streamed per request, so a file is served the same breath it    */
/*  is uploaded — in dev and in production alike. Films and voices     */
/*  answer Range requests, so the hand may scrub and seek.             */
/* ------------------------------------------------------------------ */

const MEDIA_DIR = path.join(process.cwd(), ".gathering-media");

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
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
        if (start >= stat.size || start > end) {
          return new NextResponse(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${stat.size}` },
          });
        }
        const slice = Buffer.alloc(end - start + 1);
        const fd = fs.openSync(filePath, "r");
        try {
          fs.readSync(fd, slice, 0, slice.length, start);
        } finally {
          fs.closeSync(fd);
        }
        return new NextResponse(new Uint8Array(slice), {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(slice.length),
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }
    }

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Accept-Ranges": "bytes",
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
