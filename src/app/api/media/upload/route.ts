import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import {
  kindFromMime,
  MEDIA_LIMITS,
  saveIntoVault,
} from "@/lib/server/media-vault";

/* ------------------------------------------------------------------ */
/*  THE VAULT'S DOOR — POST /api/media/upload (multipart)              */
/*                                                                     */
/*  Every visitor carries their own storage: the work lands in their   */
/*  own folder on the disk, the index lands in their own shelf. The    */
/*  work is private until its keeper publishes it into the gathering.  */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const visitor = await resolveVisitor(req);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return withAnonCookie(
        NextResponse.json(
          { error: "No work was carried — choose a video, a voice or an image." },
          { status: 400 }
        ),
        visitor
      );
    }

    const mime = (file.type || "").toLowerCase();
    const kind = kindFromMime(mime);
    if (!kind) {
      return withAnonCookie(
        NextResponse.json(
          { error: "The vault keeps videos, voices and images only." },
          { status: 415 }
        ),
        visitor
      );
    }
    if (file.size > MEDIA_LIMITS[kind]) {
      const mb = Math.round(MEDIA_LIMITS[kind] / (1024 * 1024));
      return withAnonCookie(
        NextResponse.json(
          { error: `Too heavy for the vault — ${kind}s keep under ${mb} MB.` },
          { status: 413 }
        ),
        visitor
      );
    }
    if (file.size < 64) {
      return withAnonCookie(
        NextResponse.json({ error: "The work is empty." }, { status: 400 }),
        visitor
      );
    }

    const rawTitle = String(form.get("title") ?? "").trim();
    const title =
      rawTitle.slice(0, 120) ||
      file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 120) ||
      (kind === "video" ? "A moving vision" : kind === "audio" ? "A kept voice" : "A kept image");
    const durationRaw = Number(form.get("duration"));
    const duration =
      Number.isFinite(durationRaw) && durationRaw > 0
        ? Math.round(durationRaw * 100) / 100
        : null;

    const bytes = Buffer.from(await file.arrayBuffer());
    const fileKey = saveIntoVault(visitor.user.id, mime, bytes);
    if (!fileKey) {
      return withAnonCookie(
        NextResponse.json(
          { error: "The vault could not keep the work — rest, then try again." },
          { status: 507 }
        ),
        visitor
      );
    }

    const asset = await db.mediaAsset.create({
      data: {
        userId: visitor.user.id,
        kind,
        title,
        fileKey,
        mime,
        size: file.size,
        ...(duration !== null ? { duration } : {}),
      },
    });

    return withAnonCookie(
      NextResponse.json({
        work: {
          id: asset.id,
          kind: asset.kind,
          title: asset.title,
          mime: asset.mime,
          size: asset.size,
          duration: asset.duration,
          published: asset.published,
          resonance: asset.resonance,
          createdAt: asset.createdAt.toISOString(),
          authorName: visitor.user.name || "A gathered soul",
          own: true,
          url: `/api/media/stream/${asset.id}`,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error(
      "[media] the door jammed:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(
      NextResponse.json(
        { error: "The vault's door jammed — rest, then try again." },
        { status: 500 }
      ),
      visitor
    );
  }
}
