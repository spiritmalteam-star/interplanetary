import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  THE MEDIA SHELF — one engine behind both upload doors.             */
/*                                                                     */
/*  Every uploaded picture or film rests outside public/ (in           */
/*  .gathering-media/) and is streamed per request by                  */
/*  /gathering-media/[file] — a file is served the same breath it      */
/*  is uploaded. Only the shapes the shelf can speak are kept.         */
/* ------------------------------------------------------------------ */

export const MEDIA_DIR = path.join(process.cwd(), ".gathering-media");
const MEDIA_MAX_BYTES = 25 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export interface StoredMedia {
  url: string;
  mediaType: "image" | "video";
  name: string;
}

export type MediaStoreResult =
  | { ok: true; media: StoredMedia }
  | { ok: false; status: number; error: string };

/** A shelf name the serving route's own law accepts: gm-<stem>.<ext>
    with letters, digits and hyphens only. */
function shelfName(ext: string): string {
  const stem = `${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
  return `gm-${stem}.${ext}`;
}

/** Reads one multipart upload and lays it on the shelf. */
export async function storeUploadedMedia(req: NextRequest): Promise<MediaStoreResult> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { ok: false, status: 400, error: "The offering arrived unreadable — send it as multipart form data." };
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return { ok: false, status: 400, error: "The shelf asks for one file, named `file`." };
  }

  const mime = (file.type || "").toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    return {
      ok: false,
      status: 415,
      error: "The shelf keeps pictures and films only — an image/* or video/* shape.",
    };
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "The shelf keeps what a single breath can carry — 25 MB at most.",
    };
  }
  if (file.size <= 0) {
    return { ok: false, status: 400, error: "The shelf received an empty thing." };
  }

  const name = shelfName(ext);
  const mediaType: "image" | "video" = mime.startsWith("video/") ? "video" : "image";

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(MEDIA_DIR, { recursive: true });
    await writeFile(path.join(MEDIA_DIR, name), buffer);
  } catch (err) {
    console.error(
      "[media-shelf] the shelf could not keep the offering:",
      err instanceof Error ? err.message : err
    );
    return { ok: false, status: 500, error: "The shelf could not keep the offering just now." };
  }

  return {
    ok: true,
    media: { url: `/gathering-media/${name}`, mediaType, name },
  };
}
