import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costOf } from "@/lib/server/costs";
import { creditsEnforced, spendCredits } from "@/lib/server/credits";
import { GATES, rateLimit } from "@/lib/server/rate-limit";
import { recordUsage, estimateTokens } from "@/lib/server/usage";
import { planOrFree } from "@/lib/server/plans";
import { generateImage } from "@/lib/image-engine";
import { KEY_PREFIX_LEN, keyMatches } from "@/lib/server/api-key";

/* ------------------------------------------------------------------ */
/*  POST /api/v1/images — the public sky's atelier, version one.       */
/*                                                                     */
/*  Authorization: Bearer mir_live_…                                   */
/*  Body: { prompt: string, size?: string, quality?: "standard"|"hd" } */
/*                                                                     */
/*  AUTH KEY → WORKSPACE → PLAN → RATE LIMIT → CREDITS → PAINT →       */
/*  RECORD → DEDUCT. Every prompt is channeled through the Higher      */
/*  Self by the engine itself — the caller's words are the wish, the   */
/*  channel decides how the vision is composed.                        */
/* ------------------------------------------------------------------ */

async function authenticateKey(req: NextRequest): Promise<
  | { ok: true; workspaceId: string; keyId: string }
  | { ok: false; status: number; error: string }
> {
  const header = req.headers.get("authorization") ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw.startsWith("mir_live_") || raw.length < 20 || raw.length > 200) {
    return { ok: false, status: 401, error: "A valid API key is required (Authorization: Bearer mir_live_…)." };
  }

  const key = await db.apiKey.findFirst({
    where: { revokedAt: null, prefix: raw.slice(0, KEY_PREFIX_LEN) },
  });
  if (!key || !keyMatches(raw, key.keyHash)) {
    return { ok: false, status: 401, error: "That key does not open the sky." };
  }

  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return { ok: true, workspaceId: key.workspaceId, keyId: key.id };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  let auth: Awaited<ReturnType<typeof authenticateKey>> | null = null;

  try {
    auth = await authenticateKey(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await req.json().catch(() => null)) as {
      prompt?: string;
      size?: string;
      quality?: string;
    } | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
    if (!prompt) {
      return NextResponse.json(
        { error: 'Field "prompt" must be a non-empty string.' },
        { status: 400 }
      );
    }
    const quality = body?.quality === "hd" ? "hd" : "standard";
    const size = typeof body?.size === "string" ? body.size : "1024x1024";

    /* plan & rate limit */
    const subscription = await db.subscription.findFirst({
      where: { workspaceId: auth.workspaceId, status: { in: ["active", "trialing", "past_due"] } },
    });
    const plan = planOrFree(subscription?.plan);
    if (!plan.apiAccess) {
      return NextResponse.json(
        { error: `The ${plan.label} plan does not carry API access. Bring a plan that does.` },
        { status: 403 }
      );
    }
    const gate = rateLimit(`v1img:${auth.keyId}`, { limit: Math.max(1, Math.floor(plan.rateLimitPerMinute / 5)), windowMs: GATES.api.windowMs });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "Rate limit reached for this key.", retry_after: gate.retryAfterSec },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    /* credits before the weave when enforcement stands */
    const cost = costOf("v1_image");
    if (creditsEnforced()) {
      const spend = await spendCredits(auth.workspaceId, cost, { operation: "v1_image", source: "api" });
      if (!spend.ok) {
        return NextResponse.json(
          { error: "Insufficient credits.", code: "insufficient_credits", balance: spend.balance, required: spend.required },
          { status: 402 }
        );
      }
    }

    const img = await generateImage(prompt, { size, quality });
    if (!img) {
      throw new Error("every brush rested — no canvas returned");
    }

    const latency = Date.now() - started;
    await recordUsage({
      userId: `api-key:${auth.keyId}`,
      workspaceId: auth.workspaceId,
      operation: "v1_image",
      provider: img.engine === "openai" ? "openai" : "zai",
      creditsCharged: creditsEnforced() ? cost : 0,
      latencyMs: latency,
      success: true,
    });

    return NextResponse.json({
      data: [
        {
          url: img.url,
          revised_prompt: img.revisedPrompt,
          engine: img.engine,
          channel: "higher_self",
        },
      ],
      usage: {
        prompt_tokens: estimateTokens(prompt),
        credits_charged: creditsEnforced() ? cost : 0,
      },
    });
  } catch (err) {
    console.error("[v1/images] failed:", err);
    if (auth?.ok) {
      await recordUsage({
        userId: `api-key:${auth.keyId}`,
        workspaceId: auth.workspaceId,
        operation: "v1_image",
        provider: "none",
        success: false,
        error: err instanceof Error ? err.message : "v1_image_error",
        latencyMs: Date.now() - started,
      }).catch(() => undefined);
    }
    return NextResponse.json({ error: "The atelier could not paint — rest, then try again." }, { status: 500 });
  }
}

/* a small status light for the atelier's door */
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/v1/images",
    body: { prompt: "string", size: "1024x1024 | 1024x1792 | 1792x1024 (nearest supported)", quality: "standard | hd" },
    auth: "Authorization: Bearer mir_live_…",
    channel: "every vision is channeled through the Higher Self",
  });
}
