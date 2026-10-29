import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import {
  AUDIO_VAULT_DIR,
  loadTrackBytes,
  sanitizeVaultFile,
} from "@/lib/server/music-vault";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/audio/<file> — THE MARKET'S OWN LISTENING     */
/*  DOOR. The market is the house's open hall: every visitor's songs   */
/*  are displayed there by name (the visitor named the hall), and a    */
/*  song that cannot be heard is a painting hung backward. This door   */
/*  serves ANY track's bytes to ANY visitor — the showcase's own law,  */
/*  distinct from the private vault's ownership law.                   */
/*                                                                     */
/*  THE RANGE LAW: audio seeking needs byte ranges, so "bytes=a-b" is  */
/*  honored with a 206 and the exact slice; a plain ask receives the   */
/*  whole file with Accept-Ranges declared. The file parameter is      */
/*  name-checked twice (route and vault) — a path, a climb or a        */
/*  stranger character never reaches the disk.                         */
/* ------------------------------------------------------------------ */

const FILE_SHAPE_ERROR = { error: "No sound answers to that name." };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file: raw } = await params;
    const file = sanitizeVaultFile(raw);
    if (!file) {
      return NextResponse.json(FILE_SHAPE_ERROR, { status: 404 });
    }

    /* the sound must be a real track of the hall — a name alone in the
       vault with no row behind it serves nothing */
    const row = await db.musicTrack.findFirst({
      where: { localFile: file },
      select: { id: true, status: true },
    });
    if (!row) {
      return NextResponse.json(FILE_SHAPE_ERROR, { status: 404 });
    }

    const path = join(AUDIO_VAULT_DIR, file);
    let bytes: Buffer | null = null;
    try {
      bytes = await readFile(path);
    } catch {
      /* the house shelf holds nothing under this name — the deep shelf
         (the row's own bytes) is asked next */
      bytes = await loadTrackBytes(file);
    }
    if (!bytes) {
      return NextResponse.json(
        { error: "The hall no longer holds this sound." },
        { status: 404 }
      );
    }

    const total = bytes.length;
    const range = req.headers.get("range");
    const baseHeaders: Record<string, string> = {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
        if (Number.isFinite(start) && start <= end && start < total) {
          const slice = bytes.subarray(start, end + 1);
          return new NextResponse(new Uint8Array(slice), {
            status: 206,
            headers: {
              ...baseHeaders,
              "Content-Range": `bytes ${start}-${end}/${total}`,
              "Content-Length": String(slice.length),
            },
          });
        }
      }
    }

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(total),
      },
    });
  } catch (err) {
    console.error("[marketplace/audio] failed:", err);
    return NextResponse.json(FILE_SHAPE_ERROR, { status: 500 });
  }
}
