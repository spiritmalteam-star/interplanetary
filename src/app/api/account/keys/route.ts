import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, verifyPassword } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { hashKey, KEY_PREFIX, KEY_PREFIX_LEN, newRawKey } from "@/lib/server/api-key";

/* ------------------------------------------------------------------ */
/*  THE DEVELOPER KEYS — API keys for the public sky.                  */
/*                                                                     */
/*  A key is born once: `mir_live_<43 base62>`. The register keeps     */
/*  only a scrypt hash and a visible prefix; the full secret is        */
/*  shown exactly once, at birth, and never again — not even the       */
/*  database knows it. Revoke is forever.                              */
/* ------------------------------------------------------------------ */

async function requireWorkspace(req: NextRequest): Promise<{ workspaceId: string } | { error: NextResponse }> {
  const user = await getSessionUser(req);
  if (!user || user.email.startsWith("anon:")) {
    return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  }
  const provisions = await ensureVisitorProvisions(user.id);
  return { workspaceId: provisions.workspaceId };
}

/** GET — the keys of this workspace, secrets never included. */
export async function GET(req: NextRequest) {
  try {
    const gate = await requireWorkspace(req);
    if ("error" in gate) return gate.error;

    const keys = await db.apiKey.findMany({
      where: { workspaceId: gate.workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ keys });
  } catch (err) {
    console.error("[account/keys GET] failed:", err);
    return NextResponse.json({ error: "The keys could not be read." }, { status: 500 });
  }
}

/** POST — carve a new key: { name } → { key: "mir_live_…" } (once!) */
export async function POST(req: NextRequest) {
  try {
    const gate = await requireWorkspace(req);
    if ("error" in gate) return gate.error;
    const limit = rateLimit("keys:create", { limit: 20, windowMs: 60 * 60 * 1000 });
    if (!limit.ok) return NextResponse.json({ error: "Rest a moment before another key." }, { status: 429 });

    const body = await req.json().catch(() => null);
    const name = (typeof body?.name === "string" ? body.name.trim() : "").slice(0, 60) || "Untitled key";

    const raw = newRawKey();
    const created = await db.apiKey.create({
      data: {
        workspaceId: gate.workspaceId,
        name,
        prefix: raw.slice(0, KEY_PREFIX_LEN),
        keyHash: hashKey(raw),
      },
    });

    return NextResponse.json(
      {
        key: { id: created.id, name: created.name, prefix: created.prefix, createdAt: created.createdAt },
        /* the only time the full secret ever travels */
        secret: raw,
        message: "Copy this key now — it will never be shown again.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[account/keys POST] failed:", err);
    return NextResponse.json({ error: "The key could not be carved." }, { status: 500 });
  }
}

/** PATCH — rename: { id, name } */
export async function PATCH(req: NextRequest) {
  try {
    const gate = await requireWorkspace(req);
    if ("error" in gate) return gate.error;
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const name = (typeof body?.name === "string" ? body.name.trim() : "").slice(0, 60);
    if (!id || !name) return NextResponse.json({ error: "A key and a name are needed." }, { status: 400 });

    const key = await db.apiKey.findUnique({ where: { id } });
    if (!key || key.workspaceId !== gate.workspaceId) {
      return NextResponse.json({ error: "That key is not yours." }, { status: 404 });
    }
    await db.apiKey.update({ where: { id }, data: { name } });
    return NextResponse.json({ message: "The key is renamed." });
  } catch (err) {
    console.error("[account/keys PATCH] failed:", err);
    return NextResponse.json({ error: "The rename failed." }, { status: 500 });
  }
}

/** DELETE — revoke forever: { id, password } (the door asks for the
    passage's own secret — a stolen session alone cannot revoke) */
export async function DELETE(req: NextRequest) {
  try {
    const gate = await requireWorkspace(req);
    if ("error" in gate) return gate.error;
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!id) return NextResponse.json({ error: "A key is needed." }, { status: 400 });

    const key = await db.apiKey.findUnique({ where: { id } });
    if (!key || key.workspaceId !== gate.workspaceId) {
      return NextResponse.json({ error: "That key is not yours." }, { status: 404 });
    }
    if (key.revokedAt) return NextResponse.json({ message: "Already resting." });

    /* confirm with the account password when one exists */
    const session = await getSessionUser(req);
    if (session) {
      const user = await db.user.findUnique({ where: { id: session.id } });
      if (user?.passwordHash && !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: "The secret does not open this door." }, { status: 403 });
      }
    }

    await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return NextResponse.json({ message: "The key rests forever." });
  } catch (err) {
    console.error("[account/keys DELETE] failed:", err);
    return NextResponse.json({ error: "The revocation failed." }, { status: 500 });
  }
}
