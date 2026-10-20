import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { isAdminRequest } from "@/lib/server/admin";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import {
  getComplimentaryConfig,
  isAdminKey,
  ownerEmail,
} from "@/lib/server/features";

/* ------------------------------------------------------------------ */
/*  THE OWNER'S OWN HAND — /api/admin/complimentary                    */
/*                                                                     */
/*  GET  — the configuration as it stands, and the last complimentary  */
/*         transactions (Payment rows, honestly labelled) beside the   */
/*         paid ones.                                                  */
/*  POST — turn the switches. Body (all optional, all validated):      */
/*     { complimentaryCheckout, openAccessMode, credinsEnabled,        */
/*       packages: string[], allocations: Record<string, number>,      */
/*       dailyLimit: number }                                          */
/*                                                                     */
/*  Who may speak here: the owner's own signed session (OWNER_EMAIL    */
/*  in the vault) or a script carrying x-admin-key (ADMIN_KEY).        */
/*  Nobody else — and never a frontend request from a visitor.         */
/* ------------------------------------------------------------------ */

async function authorize(req: NextRequest): Promise<boolean> {
  /* the house's own admin law first (ADMIN_EMAIL + the keeper's
     session), then the script key for the same hand */
  if (await isAdminRequest(req)) return true;
  const key = req.headers.get("x-admin-key");
  return isAdminKey(key);
}

export async function GET(req: NextRequest) {
  try {
    const gate = rateLimit(`admin:${requestIp(req)}`, GATES.account);
    if (!gate.ok) {
      return NextResponse.json({ error: "One moment — the doors rest a little." }, { status: 429 });
    }
    if (!(await authorize(req))) {
      return NextResponse.json({ error: "This hand answers only to the owner." }, { status: 403 });
    }

    const config = await getComplimentaryConfig();
    const [complimentary, paid, counts] = await Promise.all([
      db.payment.findMany({
        where: { type: "complimentary" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          userId: true,
          amountCents: true,
          status: true,
          description: true,
          createdAt: true,
        },
      }),
      db.payment.findMany({
        where: { type: { not: "complimentary" } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, userId: true, type: true, amountCents: true, status: true, createdAt: true },
      }),
      db.payment.groupBy({ by: ["type"], _count: { _all: true } }),
    ]);

    return NextResponse.json({
      config,
      ownerConfigured: Boolean(ownerEmail()),
      transactions: {
        complimentary: complimentary.map((p) => ({
          ...p,
          description: p.description ? JSON.parse(p.description) : null,
        })),
        paid,
      },
      counts: counts.map((c) => ({ type: c.type, count: c._count._all })),
    });
  } catch (err) {
    console.error("[admin/complimentary GET] failed:", err);
    return NextResponse.json({ error: "The panel could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`admin-write:${requestIp(req)}`, { limit: 30, windowMs: 60 * 60 * 1000 });
    if (!gate.ok) {
      return NextResponse.json({ error: "One moment — the doors rest a little." }, { status: 429 });
    }
    if (!(await authorize(req))) {
      return NextResponse.json({ error: "This hand answers only to the owner." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Nothing to turn was given." }, { status: 400 });
    }

    const writes: { key: string; value: Prisma.InputJsonValue }[] = [];

    /* the console's own tongue: the value column is Json — booleans,
       arrays, objects and numbers travel as themselves */

    if (typeof body.complimentaryCheckout === "boolean") {
      writes.push({ key: "complimentary_checkout", value: body.complimentaryCheckout });
    }
    if (typeof body.openAccessMode === "boolean") {
      writes.push({ key: "open_access_mode", value: body.openAccessMode });
    }
    if (typeof body.credinsEnabled === "boolean") {
      writes.push({ key: "credins_enabled", value: body.credinsEnabled });
    }
    if (Array.isArray(body.packages) && body.packages.every((p: unknown) => typeof p === "string")) {
      const allowed = [
        "SEEKER",
        "OBSERVATORY_PRO",
        "topup",
        "pack_100",
        "pack_250",
        "pack_700",
        "PRO",
        "PRO_PLUS",
        "BUSINESS",
        "pack_10k",
        "pack_50k",
        "pack_200k",
      ];
      const clean = body.packages.filter((p: string) => allowed.includes(p));
      writes.push({ key: "complimentary_packages", value: clean });
    }
    if (body.allocations && typeof body.allocations === "object" && !Array.isArray(body.allocations)) {
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(body.allocations as Record<string, unknown>)) {
        const n = Number(v);
        if (typeof k === "string" && k.length <= 40 && Number.isFinite(n) && n >= 0 && n <= 10_000_000) {
          clean[k] = Math.floor(n);
        }
      }
      writes.push({ key: "complimentary_allocations", value: clean });
    }
    if (typeof body.dailyLimit === "number" && Number.isFinite(body.dailyLimit) && body.dailyLimit > 0) {
      writes.push({ key: "complimentary_daily_limit", value: Math.floor(body.dailyLimit) });
    }

    if (writes.length === 0) {
      return NextResponse.json({ error: "Nothing recognizable to turn was given." }, { status: 400 });
    }

    /* who turned the switches — the keeper's console remembers */
    let turnedBy = "admin:key";
    try {
      const user = await getSessionUser(req);
      if (user && !user.email.startsWith("anon:")) turnedBy = user.email;
    } catch {
      /* a key-turned switch keeps its honest label */
    }

    /* every switch laid in its own honest stroke (upsert = set or seed) */
    await db.$transaction(
      writes.map((w) =>
        db.platformConfig.upsert({
          where: { key: w.key },
          create: { key: w.key, value: w.value, updatedBy: turnedBy },
          update: { value: w.value, updatedBy: turnedBy },
        })
      )
    );

    const config = await getComplimentaryConfig();
    return NextResponse.json({ config, updated: writes.map((w) => w.key) });
  } catch (err) {
    console.error("[admin/complimentary POST] failed:", err);
    return NextResponse.json({ error: "The switches could not be turned." }, { status: 500 });
  }
}
