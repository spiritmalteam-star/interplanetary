import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

/* ------------------------------------------------------------------ */
/*  THE VAULT — every visitor's own storage.                           */
/*                                                                     */
/*  Uploaded works (videos, voices, images) live outside public/, one  */
/*  folder per visitor: .media/<userId>/<file>. The database keeps the */
/*  index (MediaAsset); this module keeps the disk honest — names are  */
/*  minted here, never taken from the visitor, and every read is       */
/*  resolved through a database row, never through a raw path.         */
/* ------------------------------------------------------------------ */

export const MEDIA_DIR = path.join(process.cwd(), ".media");

export type MediaKind = "video" | "audio" | "image";

/** The vault's own limits — generous, but bounded. */
export const MEDIA_LIMITS: Record<MediaKind, number> = {
  video: 96 * 1024 * 1024, // 96 MB — a short film of the soul
  audio: 32 * 1024 * 1024, // 32 MB — a voice, a song
  image: 16 * 1024 * 1024, // 16 MB — a painting
};

const MIME_KINDS: { test: RegExp; kind: MediaKind; ext: string }[] = [
  { test: /^video\/(mp4|webm|quicktime|ogg|x-matroska)$/i, kind: "video", ext: "mp4" },
  { test: /^audio\/(mpeg|mp3|wav|x-wav|ogg|webm|m4a|x-m4a|aac|flac)$/i, kind: "audio", ext: "audio" },
  { test: /^image\/(png|jpeg|jpg|gif|webp|avif)$/i, kind: "image", ext: "img" },
];

/** Which kind of work this mime carries — null when the vault refuses. */
export function kindFromMime(mime: string): MediaKind | null {
  const found = MIME_KINDS.find((m) => m.test.test(mime.trim()));
  return found?.kind ?? null;
}

const SAFE_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
  "video/x-matroska": "mkv",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "weba",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/flac": "flac",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Mint the file's own name — never the visitor's words. */
export function mintFileName(userId: string, mime: string): string | null {
  const ext = SAFE_EXT[mime.toLowerCase()];
  if (!ext) return null;
  const stamp = Date.now().toString(36);
  return `${userId}/${stamp}-${randomUUID().slice(0, 8)}.${ext}`;
}

/** Write one work into its owner's folder. Returns the fileKey. */
export function saveIntoVault(
  userId: string,
  mime: string,
  bytes: Buffer | Uint8Array
): string | null {
  const name = mintFileName(userId, mime);
  if (!name) return null;
  const abs = path.join(MEDIA_DIR, name);
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, bytes);
    return name;
  } catch (err) {
    console.error(
      "[media-vault] could not keep the work:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Resolve a fileKey to an absolute path — only well-formed keys pass. */
export function resolveVaultPath(fileKey: string): string | null {
  if (!/^[a-zA-Z0-9_-]+\/[a-z0-9-]+\.[a-z0-9]{2,5}$/i.test(fileKey)) return null;
  const abs = path.join(MEDIA_DIR, fileKey);
  /* the key can never climb out of the vault */
  if (!abs.startsWith(MEDIA_DIR + path.sep)) return null;
  return abs;
}

/** Remove one work from the vault (best effort). */
export function removeFromVault(fileKey: string): void {
  const abs = resolveVaultPath(fileKey);
  if (!abs) return;
  try {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* the vault forgives */
  }
}
