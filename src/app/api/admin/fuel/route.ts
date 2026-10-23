import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, ADMIN_EMAIL } from "@/lib/server/admin";
import { ensureReserves, fuseAll, distributeFuel, fuelStatus } from "@/lib/server/fuel-engine";

/* ------------------------------------------------------------------ */
/*  THE FUEL ENGINE'S ONLY DOOR — /api/admin/fuel                      */
/*                                                                     */
/*  GET  → the whole incubator read (reserves, totals, recent grants). */
/*  POST → the keeper's hands:                                         */
/*          { action: "fuse" }                                        */
/*          { action: "distribute", email, amount, kind?, note? }      */
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
