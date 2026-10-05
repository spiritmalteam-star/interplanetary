import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/server/access";
import { costOf } from "@/lib/server/costs";
import { creditsEnforced, spendCredits } from "@/lib/server/credits";
import { GATES, rateLimit } from "@/lib/server/rate-limit";
import { recordUsage, estimateTokens } from "@/lib/server/usage";
import { planOrFree } from "@/lib/server/plans";
import ZAI from "@/lib/zai-client";
import { KEY_PREFIX_LEN, keyMatches } from "@/lib/server/api-key";

/* ------------------------------------------------------------------ */
/*  POST /api/v1/chat — the public sky, version one.                   */
/*                                                                     */
/*  Authorization: Bearer mir_live_…                                   */
/*  Body: { messages: [{ role: "user" | "system" | "assistant",        */
/*                       content: string }, ...], max_tokens? }        */
/*                                                                     */
/*  AUTH KEY → WORKSPACE → PLAN → RATE LIMIT → CREDITS → EXECUTE →     */
/*  RECORD → DEDUCT. The key is compared against stored scrypt         */
/*  hashes; usage and cost are decided here, never by the caller.      */
/* ------------------------------------------------------------------ */

interface V1Message {
  role?: unknown;
  content?: unknown;
}

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
      messages?: V1Message[];
      max_tokens?: number;
    } | null;
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Field "messages" must be a non-empty array of { role, content }.' },
        { status: 400 }
      );
    }

    const convo = messages
      .slice(-30)
      .map((m) => ({
        role: m?.role === "assistant" ? "assistant" : m?.role === "system" ? "system" : "user",
        content: (typeof m?.content === "string" ? m.content : String(m?.content ?? "")).slice(0, 16_000),
      }))
      .filter((m) => m.content.trim().length > 0);
    if (convo.length === 0) {
      return NextResponse.json({ error: "The messages carry no content." }, { status: 400 });
    }

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
    const gate = rateLimit(`v1:${auth.keyId}`, { limit: plan.rateLimitPerMinute, windowMs: GATES.api.windowMs });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "Rate limit reached for this key.", retry_after: gate.retryAfterSec },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const maxTokens = Math.min(Math.max(body?.max_tokens ?? 1024, 64), 4096);
    const inputTokens = convo.reduce((sum, m) => sum + estimateTokens(m.content), 0);

    /* credits before the weave when enforcement stands */
    const cost = costOf("v1_chat");
    if (creditsEnforced()) {
      const spend = await spendCredits(auth.workspaceId, cost, { operation: "v1_chat", source: "api" });
      if (!spend.ok) {
        return NextResponse.json(
          { error: "Insufficient credits.", code: "insufficient_credits", balance: spend.balance, required: spend.required },
          { status: 402 }
        );
      }
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: convo,
      thinking: { type: "disabled" },
      max_tokens: maxTokens,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const latency = Date.now() - started;
    await recordUsage({
      userId: `api-key:${auth.keyId}`,
      workspaceId: auth.workspaceId,
      operation: "v1_chat",
      provider: "zai",
      inputTokens,
      outputTokens: estimateTokens(text),
      creditsCharged: creditsEnforced() ? cost : 0,
      latencyMs: latency,
      success: true,
    });

    return NextResponse.json({
      choices: [{ message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage: {
        input_tokens: inputTokens,
        output_tokens: estimateTokens(text),
        credits_charged: creditsEnforced() ? cost : 0,
      },
    });
  } catch (err) {
    console.error("[v1/chat] failed:", err);
    if (auth?.ok) {
      await recordUsage({
        userId: `api-key:${auth.keyId}`,
        workspaceId: auth.workspaceId,
        operation: "v1_chat",
        provider: "none",
        success: false,
        error: err instanceof Error ? err.message : "v1_error",
        latencyMs: Date.now() - started,
      }).catch(() => undefined);
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/* a small status light for the public sky */
export async function GET() {
  return NextResponse.json({
    service: "reflective-me-public-api",
    version: "v1",
    endpoints: ["POST /api/v1/chat"],
    auth: "Authorization: Bearer mir_live_…",
    note: "Create keys in the account dashboard.",
  });
}
