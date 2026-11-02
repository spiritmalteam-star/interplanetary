import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/server/admin";
import { recordAudit } from "@/lib/server/audit";
import { logger } from "@/lib/server/logger";
import { healthSnapshot } from "@/lib/me/health";
import { taskCatalog } from "@/lib/me/registry";
import { agentCatalog } from "@/lib/me/agents";

/* ------------------------------------------------------------------ */
/*  THE COMMAND CENTER — /api/admin/overview                           */
/*                                                                     */
/*  The owner's single glance at the whole platform. Every number      */
/*  here is read from the house's own tables — nothing is invented,    */
/*  nothing cached beyond a breath, no secret is ever included.        */
/*  Guarded by the signed session's bound ADMIN role (plus the         */
/*  gatehouse middleware's first door).                                */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ms(v: bigint | number | null | undefined): number | null {
  if (v == null) return null;
  return Number(v);
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The console keeps its silence." }, { status: 403 });
  }

  try {
    /* ---------------- the parallel halls: every glance at once ------- */
    const [
      dbT0,
      usersTotal,
      usersVerified,
      usersAnon,
      usersNew24h,
      usersNew7d,
      reqToday,
      errToday,
      latencyToday,
      dauRows,
      mauRows,
      models7d,
      providers7d,
      ops7d,
      walletsByPlan,
      walletSums,
      paymentsCount,
      subsActive,
      jobsProcess,
      jobsGeneration,
      flags,
      announcementRow,
    ] = await Promise.all([
      Date.now(),
      db.user.count(),
      db.user.count({ where: { emailVerifiedAt: { not: null } } }),
      db.user.count({ where: { email: { startsWith: "anon:" } } }),
      db.user.count({ where: { createdAt: { gte: daysAgo(1) } } }),
      db.user.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      db.usageEvent.count({ where: { createdAt: { gte: startOfToday() } } }),
      db.usageEvent.count({
        where: { createdAt: { gte: startOfToday() }, success: false },
      }),
      db.usageEvent.aggregate({
        where: { createdAt: { gte: startOfToday() }, latencyMs: { not: null } },
        _avg: { latencyMs: true },
      }),
      db.usageEvent.findMany({
        where: { createdAt: { gte: startOfToday() } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      db.usageEvent.findMany({
        where: { createdAt: { gte: startOfMonth() } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      db.usageEvent.groupBy({
        by: ["model"],
        where: { createdAt: { gte: daysAgo(7) }, model: { not: null } },
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true },
        orderBy: { _count: { model: "desc" } },
        take: 12,
      }),
      db.usageEvent.groupBy({
        by: ["provider"],
        where: { createdAt: { gte: daysAgo(7) } },
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      db.usageEvent.groupBy({
        by: ["operation", "success"],
        where: { createdAt: { gte: daysAgo(7) } },
        _count: { _all: true },
      }),
      db.userWallet.groupBy({ by: ["planTier"], _count: { _all: true } }),
      db.userWallet.aggregate({
        _sum: {
          freeCreditsRemaining: true,
          paidCreditsRemaining: true,
          depositCredits: true,
        },
      }),
      db.payment.count(),
      db.subscription.count({ where: { status: "active" } }),
      db.processJob.groupBy({ by: ["status"], _count: { _all: true } }),
      db.generationJob.groupBy({ by: ["status"], _count: { _all: true } }),
      db.platformConfig.findMany({
        select: { key: true, value: true, updatedAt: true, updatedBy: true },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      db.platformConfig.findUnique({ where: { key: "system_announcement" } }),
    ]);
    const dbLatencyMs = Date.now() - dbT0;

    /* ---------------- the daily pulse (14 days) ---------------------- */
    const pulseRows = await db.usageEvent.findMany({
      where: { createdAt: { gte: daysAgo(14) } },
      select: { createdAt: true, success: true },
    });
    const pulse: Array<{ day: string; requests: number; errors: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      pulse.push({ day: key, requests: 0, errors: 0 });
    }
    const pulseIndex = new Map(pulse.map((p) => [p.day, p]));
    for (const row of pulseRows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      const bucket = pulseIndex.get(key);
      if (!bucket) continue;
      bucket.requests += 1;
      if (!row.success) bucket.errors += 1;
    }

    /* ---------------- the M.E. intelligence's own state -------------- */
    const errorRate = reqToday > 0 ? Math.round((errToday / reqToday) * 1000) / 10 : 0;

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        system: {
          users: {
            total: usersTotal,
            verified: usersVerified,
            anonymous: usersAnon,
            new24h: usersNew24h,
            new7d: usersNew7d,
          },
          activity: {
            dau: dauRows.length,
            mau: mauRows.length,
            requests24h: reqToday,
            errors24h: errToday,
            errorRate24hPct: errorRate,
            avgLatencyMs24h:
              latencyToday._avg.latencyMs != null
                ? Math.round(latencyToday._avg.latencyMs)
                : null,
          },
          pulse,
        },
        intelligence: {
          health: healthSnapshot(),
          models7d: models7d.map((m) => ({
            model: m.model ?? "unknown",
            calls: m._count._all,
            inputTokens: m._sum.inputTokens ?? 0,
            outputTokens: m._sum.outputTokens ?? 0,
          })),
          providers7d: providers7d.map((p) => ({
            provider: p.provider,
            calls: p._count._all,
            inputTokens: p._sum.inputTokens ?? 0,
            outputTokens: p._sum.outputTokens ?? 0,
          })),
          operations7d: Object.values(
            ops7d.reduce<Record<string, { operation: string; success: number; failed: number }>>(
              (acc, row) => {
                const slot = (acc[row.operation] ??= {
                  operation: row.operation,
                  success: 0,
                  failed: 0,
                });
                if (row.success) slot.success += row._count._all;
                else slot.failed += row._count._all;
                return acc;
              },
              {}
            )
          ).sort((a, b) => b.success + b.failed - (a.success + a.failed)),
          tasks: taskCatalog(),
          agents: agentCatalog(),
        },
        business: {
          wallets: walletsByPlan.map((w) => ({ planTier: w.planTier, count: w._count._all })),
          credits: {
            free: ms(walletSums._sum.freeCreditsRemaining) ?? 0,
            paid: ms(walletSums._sum.paidCreditsRemaining) ?? 0,
            deposit: ms(walletSums._sum.depositCredits) ?? 0,
          },
          paymentsTotal: paymentsCount,
          activeSubscriptions: subsActive,
        },
        infrastructure: {
          db: { latencyMs: dbLatencyMs, kind: "sqlite" },
          processJobs: jobsProcess.map((j) => ({ status: j.status, count: j._count._all })),
          generationJobs: jobsGeneration.map((j) => ({ status: j.status, count: j._count._all })),
        },
        config: {
          flags: flags.map((f) => ({
            key: f.key,
            value: f.value,
            updatedAt: f.updatedAt,
            updatedBy: f.updatedBy,
          })),
          announcement:
            announcementRow && typeof announcementRow.value === "object" && announcementRow.value
              ? (announcementRow.value as { message?: string; level?: string })
              : null,
        },
      },
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("admin_overview_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "The console's glance rested." }, { status: 500 });
  }
}

/** The owner's own voice — a system announcement carried in
 *  PlatformConfig (level: info | warning | celebration), audited. */
export async function POST(req: NextRequest) {
  const admin = await isAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "The console keeps its silence." }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      message?: string;
      level?: string;
    } | null;
    const message = (body?.message ?? "").trim().slice(0, 280);
    const level = ["info", "warning", "celebration"].includes(body?.level ?? "")
      ? body!.level!
      : "info";

    await db.platformConfig.upsert({
      where: { key: "system_announcement" },
      update: { value: { message, level }, updatedBy: "admin:overview" },
      create: {
        key: "system_announcement",
        value: { message, level },
        updatedBy: "admin:overview",
      },
    });
    await recordAudit({
      action: "announce",
      target: "system_announcement",
      detail: { level, chars: message.length },
    });
    return NextResponse.json({ ok: true, announcement: { message, level } });
  } catch (err) {
    logger.error("admin_announcement_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "The voice could not be raised." }, { status: 500 });
  }
}
