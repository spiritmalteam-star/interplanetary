import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveVisitor } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE M.E. MEMORY SHELF — the five domains' API.                     */
/*                                                                     */
/*  Owner-bound always: only the visitor's own rows are read, written  */
/*  or forgotten. personal · conversation · project are writable;      */
/*  community and public are the future knowledge graph's — writing    */
/*  there is refused. Retention: ttl honoured on read; a gentle cap    */
/*  of forty rows per domain.                                          */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITABLE = new Set(["personal", "conversation", "project"]);
const CAP_PER_DOMAIN = 40;

const rememberInput = z.object({
  domain: z.string().min(1).max(40),
  content: z.string().min(1).max(2000),
  scopeKey: z.string().max(120).optional(),
  sourceRef: z.string().max(200).optional(),
  weight: z.number().int().min(1).max(9).optional(),
  ttlHours: z.number().min(0).max(8760).optional(),
});

function unauth() {
  return NextResponse.json(
    { ok: false, error: { code: "UNAUTHENTICATED", message: "the passage holds no visitor" } },
    { status: 401 }
  );
}

/** Recall own memory — ?domain=&q=&scopeKey= */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (!visitor.user || visitor.user.id.startsWith("stateless:")) return unauth();
    const rl = rateLimit(`me:memory:${visitor.user.id}`, { limit: 60, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: `rest ${rl.retryAfterSec}s` } },
        { status: 429 }
      );
    }
    const sp = req.nextUrl.searchParams;
    const domain = sp.get("domain");
    const q = sp.get("q")?.trim().toLowerCase() ?? "";
    const scopeKey = sp.get("scopeKey");
    const now = new Date();
    const rows = await db.memoryItem.findMany({
      where: {
        userId: visitor.user.id, // the ownership law
        ...(domain ? { domain } : {}),
        ...(scopeKey ? { scopeKey } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
      take: 40,
    });
    const items = rows
      .filter((r) => (q ? r.content.toLowerCase().includes(q) : true))
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        domain: r.domain,
        scopeKey: r.scopeKey,
        content: r.content,
        weight: r.weight,
        createdAt: r.createdAt,
      }));
    return NextResponse.json({ ok: true, data: { items } });
  } catch (e) {
    console.error("[api/me/memory]", e);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "the shelf stumbled" } },
      { status: 500 }
    );
  }
}

/** Remember — into one's own writable domain only. */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (!visitor.user || visitor.user.id.startsWith("stateless:")) return unauth();
    if (visitor.user.anon) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "anonymous visitors hold no memory shelf — pass the gate first" } },
        { status: 403 }
      );
    }
    const rl = rateLimit(`me:memorize:${visitor.user.id}`, { limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: `rest ${rl.retryAfterSec}s` } },
        { status: 429 }
      );
    }
    const raw = await req.json().catch(() => null);
    const parsed = rememberInput.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "the memory does not match the contract" } },
        { status: 400 }
      );
    }
    const input = parsed.data;
    if (!WRITABLE.has(input.domain)) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: `the ${input.domain} domain is not a personal memory` } },
        { status: 400 }
      );
    }
    const row = await db.memoryItem.create({
      data: {
        userId: visitor.user.id,
        domain: input.domain,
        scopeKey: input.scopeKey ?? null,
        content: input.content.trim(),
        sourceRef: input.sourceRef ?? null,
        weight: input.weight ?? 1,
        expiresAt:
          input.ttlHours && input.ttlHours > 0
            ? new Date(Date.now() + input.ttlHours * 3_600_000)
            : null,
      },
    });
    // the cap law — release the oldest when the shelf overflows
    const overflow = await db.memoryItem.findMany({
      where: { userId: visitor.user.id, domain: input.domain },
      orderBy: [{ weight: "asc" }, { createdAt: "asc" }],
      skip: CAP_PER_DOMAIN,
      select: { id: true },
    });
    if (overflow.length > 0) {
      await db.memoryItem.deleteMany({ where: { id: { in: overflow.map((r) => r.id) } } });
    }
    return NextResponse.json({ ok: true, data: { id: row.id } }, { status: 201 });
  } catch (e) {
    console.error("[api/me/memory]", e);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "the shelf stumbled" } },
      { status: 500 }
    );
  }
}

/** Forget — one's own rows only. ?id= | ?domain= | ?scopeKey= */
export async function DELETE(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (!visitor.user || visitor.user.id.startsWith("stateless:")) return unauth();
    const rl = rateLimit(`me:forget:${visitor.user.id}`, { limit: 30, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: `rest ${rl.retryAfterSec}s` } },
        { status: 429 }
      );
    }
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id") ?? undefined;
    const domain = sp.get("domain") ?? undefined;
    const scopeKey = sp.get("scopeKey") ?? undefined;
    if (!id && !domain && !scopeKey) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "name what should be forgotten" } },
        { status: 400 }
      );
    }
    const result = await db.memoryItem.deleteMany({
      where: {
        userId: visitor.user.id, // only one's own memory ever burns
        ...(id ? { id } : {}),
        ...(domain ? { domain } : {}),
        ...(scopeKey ? { scopeKey } : {}),
      },
    });
    return NextResponse.json({ ok: true, data: { forgotten: result.count } });
  } catch (e) {
    console.error("[api/me/memory]", e);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "the shelf stumbled" } },
      { status: 500 }
    );
  }
}
