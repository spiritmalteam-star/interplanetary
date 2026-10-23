import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, ADMIN_EMAIL } from "@/lib/server/admin";
import { ensureReserves, fuseAll, distributeFuel, fuelStatus } from "@/lib/server/fuel-engine";
import { grantDeposit } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  THE FUEL ENGINE'S ONLY DOOR — /api/admin/fuel                      */
/*                                                                     */
/*  GET  → the whole incubator read (reserves, totals, recent grants). */
/*  POST → the keeper's hands:                                         */
/*          { action: "fuse" }                                        */
/*          { action: "distribute", email, amount, kind?, note? }      */
/*          { action: "deposit", email?, amount?, source? } — the      */
/*            great deposit (idempotent, the keeper's purse by default) */
/*          { action: "pause" | "resume", reserve }                   */
/*  Every breath is checked against the signed session's email —      */
/*  the incubator answers only its keeper (ADMIN_EMAIL).              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The incubator answers only its keeper." }, { status: 404 });
  }
  try {
    const status = await fuelStatus(ADMIN_EMAIL);
    return NextResponse.json(status);
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

    if (action === "deposit") {
      /* THE GREAT DEPOSIT — reflection pulses borrowed from the skies'
         own API accumulation, laid on a passage's deposit (the keeper's
         own when no email is named). Idempotent: a deposit already
         standing at or above the named amount is left untouched. */
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
    console.error("[admin/fuel] action failed:", err);
    return NextResponse.json({ error: "The incubator stumbled — rest, then try again." }, { status: 500 });
  }
}
