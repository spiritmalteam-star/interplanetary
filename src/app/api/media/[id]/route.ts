import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { removeFromVault } from "@/lib/server/media-vault";

/* ------------------------------------------------------------------ */
/*  ONE WORK OF THE VAULT — /api/media/[id]                            */
/*                                                                     */
/*  PATCH  { action: "publish" | "unpublish" | "resonate" }            */
/*         publish / unpublish belong to the work's own keeper;        */
/*         resonate belongs to the whole field — one touch amplifies.  */
/*  DELETE — the keeper removes the work from the vault entirely.      */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitor = await resolveVisitor(req);

  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      title?: string;
    } | null;
    const action = body?.action ?? "";
    const asset = await db.mediaAsset.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!asset) {
      return withAnonCookie(
        NextResponse.json({ error: "The work is gone." }, { status: 404 }),
        visitor
      );
    }

    if (action === "resonate") {
      const updated = await db.mediaAsset.update({
        where: { id },
        data: { resonance: { increment: 1 } },
      });
      return withAnonCookie(
        NextResponse.json({ resonance: updated.resonance }),
        visitor
      );
    }

    if (asset.userId !== visitor.user.id) {
      return withAnonCookie(
        NextResponse.json(
          { error: "Only the work's own keeper may turn its door." },
          { status: 403 }
        ),
        visitor
      );
    }

    if (action === "publish" || action === "unpublish") {
      const updated = await db.mediaAsset.update({
        where: { id },
        data: { published: action === "publish" },
      });
      return withAnonCookie(
        NextResponse.json({ published: updated.published }),
        visitor
      );
    }

    if (action === "retitle" && typeof body?.title === "string") {
      const title = body.title.trim().slice(0, 120);
      if (!title) {
        return withAnonCookie(
          NextResponse.json({ error: "A work needs a name." }, { status: 400 }),
          visitor
        );
      }
      const updated = await db.mediaAsset.update({
        where: { id },
        data: { title },
      });
      return withAnonCookie(
        NextResponse.json({ title: updated.title }),
        visitor
      );
    }

    return withAnonCookie(
      NextResponse.json({ error: "The vault does not know that hand." }, { status: 400 }),
      visitor
    );
  } catch (err) {
    console.error(
      "[media] the hand slipped:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(
      NextResponse.json({ error: "The vault rests — try once more." }, { status: 500 }),
      visitor
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitor = await resolveVisitor(req);

  try {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return withAnonCookie(
        NextResponse.json({ ok: true }, { status: 200 }),
        visitor
      );
    }
    if (asset.userId !== visitor.user.id) {
      return withAnonCookie(
        NextResponse.json(
          { error: "Only the work's own keeper may release it." },
          { status: 403 }
        ),
        visitor
      );
    }
    await db.mediaAsset.delete({ where: { id } });
    removeFromVault(asset.fileKey);
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error(
      "[media] the release failed:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(
      NextResponse.json({ error: "The vault rests — try once more." }, { status: 500 }),
      visitor
    );
  }
}
