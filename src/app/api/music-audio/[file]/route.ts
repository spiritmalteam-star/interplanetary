import { NextRequest, NextResponse } from "next/server";
import { open, stat } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import {
  AUDIO_VAULT_DIR,
  sanitizeVaultFile,
} from "@/lib/server/music-vault";
import {
  resolveVisitor,
  withAnonCookie,
  type Visitor,
} from "@/lib/server/access";
import { isAdminRequest } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  GET /api/music-audio/<file> — the audio vault's serving door.      */
/*                                                                     */
/*  THE OWNERSHIP LAW: a file in the vault answers only to the         */
/*  passage whose MusicTrack row names it — or to the keeper's own     */
/*  admin passage. Every other ask is met with silence (404): the      */
/*  door never reveals whether a sound exists. The bytes live under    */
/*  db/audio/ and the file parameter is name-checked twice (route      */
/*  and vault) — a path, a climb or a stranger character never         */
/*  reaches the disk.                                                  */
/*                                                                     */
/*  THE RANGE LAW: audio seeking needs byte ranges, so "bytes=a-b" is  */
/*  honored with a 206 and the exact slice; a plain ask receives the   */
/*  whole file with Accept-Ranges declared.                            */
/* ------------------------------------------------------------------ */

const FILE_SHAPE_ERROR = { error: "No sound answers to that name." };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  let visitor: Visitor | null = null;
  try {
    const { file: raw } = await params;
    const file = sanitizeVaultFile(raw);
    if (!file) {
      return NextResponse.json(FILE_SHAPE_ERROR, { status: 404 });
    }

    visitor = await resolveVisitor(req);
    const admin = await isAdminRequest(req);
    if (!admin) {
      const row = await db.musicTrack.findFirst({
        where: { localFile: file },
        select: { userId: true },
      });
      if (!row || row.userId !== visitor.user.id) {
        return withAnonCookie(
          NextResponse.json(FILE_SHAPE_ERROR, { status: 404 }),
          visitor
        );
      }
    }

    const path = join(AUDIO_VAULT_DIR, file);
    let size = 0;
    try {
      size = (await stat(path)).size;
    } catch {
      /* the row stands but the bytes are gone — the house says so
         honestly instead of pretending to serve silence */
      return withAnonCookie(
        NextResponse.json(
          { error: "The house no longer holds this sound." },
          { status: 404 }
        ),
        visitor
      );
    }

    /* the range ask — "bytes=start-end", "bytes=start-", "bytes=-n" */
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

    const length = end - start + 1;
    const handle = await open(path, "r");
    try {
      const buf = Buffer.alloc(length);
      await handle.read(buf, 0, length, start);
      const headers: Record<string, string> = {
        "Content-Type": file.toLowerCase().endsWith(".wav")
          ? "audio/wav"
          : "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Content-Length": String(length),
        "Cache-Control": "private, max-age=3600",
      };
      if (partial) {
        headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
      }
      return withAnonCookie(
        new NextResponse(new Uint8Array(buf), {
          status: partial ? 206 : 200,
          headers,
        }),
        visitor
      );
    } finally {
      await handle.close();
    }
  } catch (err) {
    console.error(
      "[music-audio] the vault's serving door stumbled:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "The vault rests a moment." }, { status: 500 });
  }
}
