import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, ADMIN_EMAIL } from "@/lib/server/admin";
import { ensureReserves, fuseAll, distributeFuel, fuelStatus } from "@/lib/server/fuel-engine";
import { depositStatus, grantDeposit } from "@/lib/server/wallet";
import {
  decryptSecret,
  encryptSecret,
  maskHintFromCredentials,
  sanitizeCredentials,
} from "@/lib/server/secret-box";
import type { PaymentSource } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  THE FUEL ENGINE'S ONLY DOOR — /api/admin/fuel                      */
/*                                                                     */
/*  GET  → the whole incubator read (reserves, totals, recent grants,  */
/*         the DEPOSIT well: balance + tides + last movements) and the */
/*         payment sources in their MASKED shapes only.                */
/*  POST → the keeper's hands:                                         */
/*          { action: "fuse" }                                        */
/*          { action: "distribute", email, amount, kind?, note? }      */
/*          { action: "deposit", sourceId, amount, reference? } — THE  */
/*            WELL CHARGE: credits enter the deposit from a stored     */
/*            payment source (the recorded truth; for stripe the       */
/*            self-invoice may follow — the UI says so honestly)       */
/*          { action: "deposit-status" } — balance + last 30 movements */
/*          { action: "sky-deposit", email?, amount?, source? } — the  */
/*            great per-user deposit of reflection pulses (z.ai)       */
/*          { action: "pause" | "resume", reserve }                   */
/*          { action: "source-add", name, provider, credentials }      */
/*          { action: "source-toggle" | "source-delete" | "source-test",*/
/*                       sourceId, ... }                               */
/*                                                                     */
/*  SECURITY: every breath is checked against the signed session's     */
/*  email (ADMIN_EMAIL) and everything else answers 404 — the door     */
/*  hides behind silence. Source credentials are AES-256-GCM sealed    */
/*  at rest (secret-box.ts) and NEVER travel: no response, no log —    */
/*  lists and reads carry only the masked hint ("••••1234").           */
/* ------------------------------------------------------------------ */

const PROVIDERS = ["stripe", "paypal", "manual", "custom"];

/** The ONLY shape a payment source ever wears outside this server. */
function maskedSource(row: PaymentSource) {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    active: row.active,
    hint: row.hint,
    lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
    lastTestedAt: row.lastTestedAt ? row.lastTestedAt.toISOString() : null,
    lastTestOk: row.lastTestOk,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Opens the box server-side and hands the credentials back — this
    helper is the ONLY place a decryption happens, and its result is
    consumed in-process: never returned, never logged. */
function openSource(row: PaymentSource): Record<string, string> {
  const parsed = JSON.parse(decryptSecret(row.credentialsEnc)) as Record<string, string>;
  return parsed;
}

/** The honest ping — what "testing" a source can truthfully claim. */
async function probeSource(
  row: PaymentSource
): Promise<{ ok: boolean; verified: boolean; message: string }> {
  const creds = openSource(row);
  if (row.provider === "stripe") {
    const key = creds.secretKey ?? creds.key ?? "";
    if (!/^(sk|rk)_(test|live)_[A-Za-z0-9_-]{8,}$/.test(key)) {
      return { ok: false, verified: false, message: "That is not a Stripe secret key's shape (sk_test_… / sk_live_…)." };
    }
    try {
      const { default: Stripe } = await import("stripe");
      const probe = new Stripe(key, { timeout: 8000, typescript: true });
      await probe.balance.retrieve();
      return { ok: true, verified: true, message: "The key opened Stripe's own vault — the account answered." };
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 140) : "the sky did not answer";
      return {
        ok: true,
        verified: false,
        message: `The key's shape is right, but the live ping did not answer (${msg}) — treat the source as unverified until it does.`,
      };
    }
  }
  if (row.provider === "paypal") {
    const okShape = Boolean(creds.clientId && creds.clientSecret);
    return {
      ok: okShape,
      verified: false,
      message: okShape
        ? "Credentials recorded — clientId and clientSecret both stand. PayPal is not pinged; the shape is the truth we keep."
        : "A PayPal source needs clientId and clientSecret.",
    };
  }
  const filled = Object.values(creds).some((v) => v.trim().length > 0);
  return {
    ok: filled,
    verified: false,
    message: filled
      ? "Recorded — a recorded source's truth is the keeper's word, kept encrypted at rest."
      : "The record is empty.",
  };
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The incubator answers only its keeper." }, { status: 404 });
  }
  try {
    const [status, sources] = await Promise.all([
      fuelStatus(ADMIN_EMAIL),
      db.paymentSource.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ ...status, sources: sources.map(maskedSource) });
  } catch (err) {
    console.error("[admin/fuel] read failed:", err);
    return NextResponse.json({ error: "The incubator rests — try again in a breath." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The incubator answers only its keeper." }, { status: 404 });
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      email?: string;
      amount?: number;
      kind?: string;
      note?: string;
      reserve?: string;
      source?: string;
      sourceId?: string;
      reference?: string;
      name?: string;
      provider?: string;
      credentials?: Record<string, string>;
      active?: boolean;
    } | null;
    const action = body?.action;

    if (action === "fuse") {
      const result = await fuseAll();
      return NextResponse.json({ ok: true, ...result, status: await fuelStatus(ADMIN_EMAIL) });
    }

    if (action === "distribute") {
      const result = await distributeFuel({
        email: String(body?.email ?? ""),
        amount: Number(body?.amount ?? 0),
        kind: String(body?.kind ?? "gift"),
        note: body?.note ? String(body.note) : undefined,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, grant: result.grant, status: await fuelStatus(ADMIN_EMAIL) });
    }

    /* --------------- THE WELL CHARGE (the deposit action) ------------- */
    if (action === "deposit") {
      const sourceId = String(body?.sourceId ?? "");
      const amount = Math.floor(Number(body?.amount ?? 0));
      const reference = body?.reference ? String(body.reference).slice(0, 200) : null;
      if (!sourceId || !Number.isFinite(amount) || amount < 1 || amount > 100_000_000) {
        return NextResponse.json(
          { error: "Name the source and a sane amount of lights (1 … 100,000,000)." },
          { status: 400 }
        );
      }
      const row = await db.paymentSource.findUnique({ where: { id: sourceId } });
      if (!row) {
        return NextResponse.json({ error: "No such payment source." }, { status: 400 });
      }
      if (!row.active) {
        return NextResponse.json({ error: "That source is paused — wake it first." }, { status: 400 });
      }
      /* the box must open — integrity proof; the credentials themselves
         are consumed here and never leave this scope */
      let creds: Record<string, string>;
      try {
        creds = openSource(row);
      } catch {
        return NextResponse.json(
          { error: "The source's sealed box would not open (re-keyed or tampered) — delete and re-enter it." },
          { status: 400 }
        );
      }
      if (row.provider === "stripe") {
        const key = creds.secretKey ?? "";
        if (!/^(sk|rk)_(test|live)_[A-Za-z0-9_-]{8,}$/.test(key)) {
          return NextResponse.json(
            { error: "That source's key is not a Stripe secret key's shape — test or re-enter it." },
            { status: 400 }
          );
        }
      }
      await db.paymentSource.update({
        where: { id: row.id },
        data: { lastUsedAt: new Date() },
      });
      const { recordDepositIn } = await import("@/lib/server/wallet");
      await recordDepositIn({
        amount,
        sourceId: row.id,
        sourceName: row.name,
        reference: reference ?? `well:${Date.now()}`,
        actorEmail: ADMIN_EMAIL,
        note:
          row.provider === "stripe"
            ? "Recorded charge — the Stripe self-invoice may follow; the well accepts the keeper's word"
            : "Recorded charge from a stored source",
      });
      return NextResponse.json({ ok: true, deposit: await depositStatus(30) });
    }

    if (action === "deposit-status") {
      return NextResponse.json({ ok: true, deposit: await depositStatus(30) });
    }

    /* ------------- payment sources — the sealed cupboard --------------- */
    if (action === "source-add") {
      const name = String(body?.name ?? "").trim().slice(0, 80);
      const provider = String(body?.provider ?? "");
      const credentials = sanitizeCredentials(body?.credentials);
      if (!name) {
        return NextResponse.json({ error: "Give the source a name." }, { status: 400 });
      }
      if (!PROVIDERS.includes(provider)) {
        return NextResponse.json({ error: "That provider is not one of the house's." }, { status: 400 });
      }
      if (!credentials) {
        return NextResponse.json({ error: "The credentials are empty or malformed." }, { status: 400 });
      }
      if (!process.env.CREDENTIALS_KEY && !(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)) {
        return NextResponse.json(
          { error: "The secret box has no key — set CREDENTIALS_KEY (32+ chars) in the vault first." },
          { status: 503 }
        );
      }
      const row = await db.paymentSource.create({
        data: {
          name,
          provider,
          credentialsEnc: encryptSecret(JSON.stringify(credentials)),
          hint: maskHintFromCredentials(credentials),
        },
      });
      return NextResponse.json({ ok: true, source: maskedSource(row) });
    }

    if (action === "source-toggle") {
      const sourceId = String(body?.sourceId ?? "");
      const row = await db.paymentSource.findUnique({ where: { id: sourceId } });
      if (!row) {
        return NextResponse.json({ error: "No such payment source." }, { status: 400 });
      }
      const updated = await db.paymentSource.update({
        where: { id: row.id },
        data: { active: typeof body?.active === "boolean" ? body.active : !row.active },
      });
      return NextResponse.json({ ok: true, source: maskedSource(updated) });
    }

    if (action === "source-delete") {
      const sourceId = String(body?.sourceId ?? "");
      const row = await db.paymentSource.findUnique({ where: { id: sourceId } });
      if (!row) {
        return NextResponse.json({ error: "No such payment source." }, { status: 400 });
      }
      await db.paymentSource.delete({ where: { id: row.id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "source-test") {
      const sourceId = String(body?.sourceId ?? "");
      const row = await db.paymentSource.findUnique({ where: { id: sourceId } });
      if (!row) {
        return NextResponse.json({ error: "No such payment source." }, { status: 400 });
      }
      const result = await probeSource(row);
      await db.paymentSource.update({
        where: { id: row.id },
        data: { lastTestedAt: new Date(), lastTestOk: result.ok },
      });
      return NextResponse.json({ ok: result.ok, verified: result.verified, message: result.message });
    }

    if (action === "sky-deposit") {
      /* THE GREAT DEPOSIT — reflection pulses borrowed from the skies'
         own API accumulation, laid on a passage's deposit (the keeper's
         own when no email is named). Idempotent: a deposit already
         standing at or above the named amount is left untouched. This
         is the per-user reservoir — NOT the keeper's well. */
      const email = String(body?.email ?? ADMIN_EMAIL).trim().toLowerCase();
      const amount = Math.max(1, Math.floor(Number(body?.amount ?? 10_000_000_000)));
      const source = String(body?.source ?? "zai_api_accumulation").slice(0, 120);
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "No passage holds that email yet." }, { status: 400 });
      }
      if (user.email.startsWith("anon:")) {
        return NextResponse.json({ error: "Anonymous wanderers hold no deposit." }, { status: 400 });
      }
      const existing = await db.userWallet.findUnique({ where: { userId: user.id } });
      if (existing && Number(existing.depositCredits) >= amount) {
        return NextResponse.json({
          ok: true,
          already: true,
          email,
          depositCredits: Number(existing.depositCredits),
          status: await fuelStatus(ADMIN_EMAIL),
        });
      }
      const result = await grantDeposit(user.id, {
        amount,
        source,
        note: "Reflection pulses converted from the z.ai API accumulation — the house stands as the middle man",
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error ?? "the deposit did not land" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, email, depositCredits: result.depositCredits, status: await fuelStatus(ADMIN_EMAIL) });
    }

    if (action === "pause" || action === "resume") {
      await ensureReserves();
      const key = String(body?.reserve ?? "");
      const row = await db.fuelReserve.findUnique({ where: { key } });
      if (!row) {
        return NextResponse.json({ error: "No such reserve." }, { status: 400 });
      }
      await db.fuelReserve.update({
        where: { key },
        data: { status: action === "pause" ? "paused" : row.fused > 0 ? "active" : "resting" },
      });
      return NextResponse.json({ ok: true, status: await fuelStatus(ADMIN_EMAIL) });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("[admin/fuel] action failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The incubator stumbled — rest, then try again." }, { status: 500 });
  }
}
