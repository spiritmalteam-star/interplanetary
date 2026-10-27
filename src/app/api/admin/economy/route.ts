import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminEmail, isAdminRequest } from "@/lib/server/admin";
import { getSessionUser } from "@/lib/server/access";
import {
  WALLET_PACKS,
  grantWalletCredits,
  servicePrices,
  walletEnforced,
  type ServicePrices,
} from "@/lib/server/wallet";
import { LC_LIMITS, getLcEngineStatus } from "@/lib/server/lc-engine";

/* ------------------------------------------------------------------ */
/*  /api/admin/economy — the keeper's own console for the creator      */
/*  economy. ONLY the verified administrator is answered; for every    */
/*  other hand the route keeps its silence (403) — hiding the door is  */
/*  not the lock, the lock is here.                                    */
/*                                                                     */
/*  GET            → the whole ledger's glance: users, liability,      */
/*                   purchases, spends, refunds, the engines' own      */
/*                   honesty, the standing prices and packs.           */
/*  POST grant     → lay credits into a passage's wallet (audited).    */
/*  POST deduct    → draw credits out, never below zero (audited).     */
/*  POST setPrices → move the standing prices of the paid creations.   */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The console keeps its silence." }, { status: 403 });
  }
  try {
    /* ---------- the users' shelf — a finite search by email or id ------ */
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (q !== null && q !== undefined && q !== "") {
      const found = await db.user.findMany({
        where: {
          OR: [
            { email: { contains: q } },
            { id: q },
          ],
        },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          emailVerifiedAt: true,
          createdAt: true,
          wallet: {
            select: {
              planTier: true,
              freeCreditsRemaining: true,
              paidCreditsRemaining: true,
              depositCredits: true,
            },
          },
        },
      });
      const withSpent = await Promise.all(
        found.map(async (u) => {
          const agg = await db.creditLedger.aggregate({
            where: { userId: u.id, creditsDeducted: { lt: 0 } },
            _sum: { creditsDeducted: true },
          });
          return {
            id: u.id,
            email: u.email,
            name: u.name,
            provider: u.provider,
            emailVerifiedAt: u.emailVerifiedAt,
            createdAt: u.createdAt,
            admin: isAdminEmail(u.email),
            spent: -(agg._sum.creditsDeducted ?? 0),
            wallet: u.wallet
              ? {
                  planTier: u.wallet.planTier,
                  freeCreditsRemaining: u.wallet.freeCreditsRemaining,
                  paidCreditsRemaining: u.wallet.paidCreditsRemaining,
                  depositCredits: Number(u.wallet.depositCredits ?? BigInt(0)),
                }
              : null,
          };
        })
      );
      return NextResponse.json({ users: withSpent });
    }

    const [userCount, wallets, ledger, usage, prices, lcEngine] = await Promise.all([
      db.user.count(),
      db.userWallet.findMany({ select: { freeCreditsRemaining: true, paidCreditsRemaining: true, depositCredits: true, planTier: true } }),
      db.creditLedger.findMany({ orderBy: { createdAt: "desc" }, take: 400, select: { actionType: true, creditsDeducted: true, metadata: true, createdAt: true, userId: true } }),
      db.usageEvent.groupBy({ by: ["operation"], _count: { _all: true }, where: { success: true } }),
      servicePrices(),
      Promise.resolve(getLcEngineStatus()),
    ]);

    const creditLiability = wallets.reduce(
      (sum, w) => sum + w.freeCreditsRemaining + w.paidCreditsRemaining + Number(w.depositCredits ?? BigInt(0)),
      0
    );
    const admins = await db.user.findMany({
      where: { email: { not: { startsWith: "anon:" } } },
      select: { id: true },
    });
    const signedUp = admins.length;

    let purchased = 0;
    let spent = 0;
    let refunded = 0;
    for (const row of ledger) {
      const meta = (row.metadata ?? {}) as { refundOf?: string; admin?: boolean };
      if (meta?.admin) continue;
      if (row.creditsDeducted > 0) {
        if (meta?.refundOf) refunded += row.creditsDeducted;
        else purchased += row.creditsDeducted;
      } else if (row.creditsDeducted < 0) {
        spent += -row.creditsDeducted;
      }
    }

    /* the newest movements, with the keeper's own name beside them */
    const recentUsers = await db.user.findMany({
      where: { id: { in: ledger.slice(0, 60).map((l) => l.userId) } },
      select: { id: true, email: true },
    });
    const emailOf = new Map(recentUsers.map((u) => [u.id, u.email]));
    const audit = ledger.slice(0, 40).map((l) => ({
      id: l.userId + "-" + l.createdAt.getTime(),
      email: emailOf.get(l.userId) ?? "(a quiet keeper)",
      actionType: l.actionType,
      credits: l.creditsDeducted,
      admin: Boolean((l.metadata as { admin?: boolean })?.admin),
      at: l.createdAt,
    }));

    return NextResponse.json({
      overview: {
        users: userCount,
        signedUsers: signedUp,
        wallets: wallets.length,
        creditLiability,
        purchased,
        spent,
        refunded,
        enforcement: walletEnforced() ? "active" : "resting",
      },
      usage: usage
        .map((u) => ({ operation: u.operation, count: u._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      prices,
      packs: WALLET_PACKS,
      limits: LC_LIMITS,
      lcEngine,
      audit,
    });
  } catch (err) {
    console.error("[admin/economy] the glance failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The console's glance rested." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The console keeps its silence." }, { status: 403 });
  }
  const adminEmail = process.env.ADMIN_EMAIL ?? "gentikoltraka28@gmail.com";
  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      userId?: string;
      credits?: number;
      reason?: string;
      prices?: Partial<ServicePrices>;
    } | null;
    if (!body?.action) {
      return NextResponse.json({ error: "Say what the console should do." }, { status: 400 });
    }

    if (body.action === "grant" || body.action === "deduct") {
      const credits = Math.max(0, Math.floor(Number(body.credits) || 0));
      const reason = String(body.reason ?? "").slice(0, 200);
      if (!body.userId || credits <= 0) {
        return NextResponse.json({ error: "Name the passage and the amount." }, { status: 400 });
      }
      if (body.action === "grant") {
        const res = await grantWalletCredits(body.userId, {
          credits,
          actionType: "SUBSCRIPTION_GRANT",
          referenceId: `admin-grant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          description: `The keeper's own grant — ${reason || "no reason written"}`,
        });
        if (!res.ok) return NextResponse.json({ error: "The grant did not land." }, { status: 500 });
        return NextResponse.json({ ok: true, total: res.total });
      }
      /* the draw — never below zero, always audited */
      const result = await db.$transaction(async (tx) => {
        const wallet = await tx.userWallet.findUnique({ where: { userId: body.userId! } });
        if (!wallet) return { ok: false as const };
        const have = wallet.freeCreditsRemaining + wallet.paidCreditsRemaining;
        const take = Math.min(have, credits);
        const freePart = Math.min(wallet.freeCreditsRemaining, take);
        const paidPart = take - freePart;
        await tx.userWallet.update({
          where: { userId: body.userId! },
          data: {
            freeCreditsRemaining: { decrement: freePart },
            paidCreditsRemaining: { decrement: paidPart },
          },
        });
        await tx.creditLedger.create({
          data: {
            userId: body.userId!,
            actionType: "CHAT",
            creditsDeducted: -take,
            metadata: {
              admin: true,
              adminEmail,
              description: `The keeper's own draw — ${reason || "no reason written"}`,
            },
          },
        });
        return { ok: true as const, taken: take };
      });
      if (!result.ok) return NextResponse.json({ error: "That passage holds no wallet." }, { status: 404 });
      return NextResponse.json({ ok: true, taken: result.taken });
    }

    if (body.action === "setPrices") {
      const current = await servicePrices();
      const clean = (n: unknown, fb: number) => {
        const x = typeof n === "number" ? n : NaN;
        return Number.isFinite(x) && x >= 0 ? Math.floor(x) : fb;
      };
      const next: ServicePrices = {
        musicPreview: clean(body.prices?.musicPreview, current.musicPreview),
        musicFull: clean(body.prices?.musicFull, current.musicFull),
        musicLoop: clean(body.prices?.musicLoop, current.musicLoop),
        akashicReading: clean(body.prices?.akashicReading, current.akashicReading),
        bookShort: clean(body.prices?.bookShort, current.bookShort),
        bookExtended: clean(body.prices?.bookExtended, current.bookExtended),
      };
      const requester = await getSessionUser(req);
      const updatedBy = isAdminEmail(requester?.email) ? requester!.email : adminEmail;
      await db.platformConfig.upsert({
        where: { key: "service_prices" },
        create: { key: "service_prices", value: next as unknown as Record<string, number>, updatedBy },
        update: { value: next as unknown as Record<string, number>, updatedBy },
      });
      return NextResponse.json({ ok: true, prices: next });
    }

    return NextResponse.json({ error: "The console does not know that action." }, { status: 400 });
  } catch (err) {
    console.error("[admin/economy] the hand failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The console's hand rested." }, { status: 500 });
  }
}
