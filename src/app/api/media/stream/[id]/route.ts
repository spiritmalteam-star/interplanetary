import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { Readable } from "stream";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { resolveVaultPath } from "@/lib/server/media-vault";

/* ------------------------------------------------------------------ */
/*  THE VAULT'S STREAM — GET /api/media/stream/[id]                    */
/*                                                                     */
/*  One work, streamed out of the vault. A private work streams only   */
/*  to its own keeper; a published work streams to the whole field.    */
/*  HTTP Range is honored so videos may seek.                          */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toWebStream(
  nodeStream: fs.ReadStream
): ReadableStream<Uint8Array> {
  return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitor = await resolveVisitor(req);

  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return withAnonCookie(
        NextResponse.json({ error: "Not found" }, { status: 404 }),
        visitor
      );
    }
    if (!asset.published && asset.userId !== visitor.user.id) {
      return withAnonCookie(
        NextResponse.json({ error: "This work rests in private." }, { status: 403 }),
        visitor
      );
    }

    const abs = resolveVaultPath(asset.fileKey);
    if (!abs || !fs.existsSync(abs)) {
      return withAnonCookie(
        NextResponse.json({ error: "Not found" }, { status: 404 }),
        visitor
      );
    }

    const stat = fs.statSync(abs);
    const total = stat.size;
    const range = req.headers.get("range");

    /* THE RANGE LAW — a seeking player asks for a band; give the band */
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
        if (Number.isNaN(start) || start >= total || start > end) {
          return withAnonCookie(
            new NextResponse(null, {
              status: 416,
              headers: { "Content-Range": `bytes */${total}` },
            }),
            visitor
          );
        }
        const stream = fs.createReadStream(abs, { start, end });
        return withAnonCookie(
          new NextResponse(toWebStream(stream), {
            status: 206,
            headers: {
              "Content-Type": asset.mime,
              "Content-Length": String(end - start + 1),
              "Content-Range": `bytes ${start}-${end}/${total}`,
              "Accept-Ranges": "bytes",
              "Cache-Control": "private, max-age=3600",
            },
          }),
          visitor
        );
      }
    }

    const stream = fs.createReadStream(abs);
    return withAnonCookie(
      new NextResponse(toWebStream(stream), {
        status: 200,
        headers: {
          "Content-Type": asset.mime,
          "Content-Length": String(total),
          "Accept-Ranges": "bytes",
          "Cache-Control": asset.published
            ? "public, max-age=3600"
            : "private, max-age=3600",
        },
      }),
      visitor
    );
  } catch (err) {
    console.error(
      "[media] the stream broke:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(
      NextResponse.json({ error: "The stream broke — try once more." }, { status: 500 }),
      visitor
    );
  }
}
