import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  THE HALL'S MEDIA SHELF — images and films offered beside words.    */
/*                                                                     */
/*  A visitor may attach one picture or one short film to an           */
/*  offering. The file lands on the house's own shelf (public/         */
/*  gathering-media), the offering keeps only the shelf's address.     */
/*                                                                     */
/*  THE LAWS:                                                          */
/*  - every visitor may hang (the free law holds here too);            */
/*  - the flood-gates stop bursts: twelve attachments in ten minutes;  */
/*  - only honest pictures and films pass the door (jpeg, png, webp,   */
/*    gif, mp4, webm, mov) — anything else is turned away;             */
/*  - a picture may weigh up to 8 MB, a film up to 48 MB;              */
/*  - the shelf's names are house-minted (uuid) — a visitor's own      */
/*    filename never touches the disk.                                 */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};
const IMAGE_MAX = 8 * 1024 * 1024; // 8 MB
const VIDEO_MAX = 48 * 1024 * 1024; // 48 MB

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const flood = rateLimit(`gathering:upload:${visitor.user.id}`, {
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The shelf asks for a breath — try again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file arrived at the shelf." }, { status: 400 });
    }

    const mime = file.type.toLowerCase();
    const isImage = Boolean(IMAGE_TYPES[mime]);
    const isVideo = Boolean(VIDEO_TYPES[mime]);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only an honest picture or film may hang here (jpg, png, webp, gif, mp4, webm, mov)." },
        { status: 415 }
      );
    }
    const cap = isImage ? IMAGE_MAX : VIDEO_MAX;
    if (file.size <= 0 || file.size > cap) {
      return NextResponse.json(
        {
          error: isImage
            ? "The picture is too heavy — 8 MB is the most the shelf may carry."
            : "The film is too heavy — 48 MB is the most the shelf may carry.",
        },
        { status: 413 }
      );
    }

    const ext = (isImage ? IMAGE_TYPES[mime] : VIDEO_TYPES[mime]) ?? (isImage ? ".jpg" : ".mp4");
    const name = `${randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), "public", "gathering-media");
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), bytes);

    return withAnonCookie(
      NextResponse.json({
        url: `/gathering-media/${name}`,
        type: isImage ? "image" : "video",
        name: file.name.slice(0, 120),
        size: file.size,
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering upload failed", err);
    return NextResponse.json({ error: "The shelf could not receive the file." }, { status: 500 });
  }
}
