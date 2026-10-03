import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  DAILY_LIMITS,
  getSessionUser,
  readAnonId,
} from "@/lib/server/access";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );

    const user = await getSessionUser(req);
    if (!user) {
      /* the anonymous visitor — their two free pools, keyed by the
         anonymous cookie when it exists */
      const anonId = readAnonId(req);
      let mainUsed = 0;
      let manifestUsed = 0;
      if (anonId) {
        const key = `anon:${anonId}`;
        const rows = await db.usage.findMany({ where: { key, day: todayUTC() } });
        for (const r of rows) {
          if (r.sector === "main") mainUsed += r.count;
          if (r.sector === "manifest") manifestUsed += r.count;
        }
      }
      return NextResponse.json({
        user: null,
        googleConfigured,
        pools: { main: { used: mainUsed, limit: DAILY_LIMITS.anon }, manifest: { used: manifestUsed, limit: DAILY_LIMITS.anon } },
      });
    }

    const rows = await db.usage.findMany({
      where: { key: `user:${user.id}`, day: todayUTC() },
    });
    const used = rows.reduce((n, r) => n + r.count, 0);
    const limit = user.tier === "light" ? Number.POSITIVE_INFINITY : DAILY_LIMITS.crystalline;
    const entries = await db.libraryEntry.count({ where: { userId: user.id } });

    return NextResponse.json({
      user,
      googleConfigured,
      usage: {
        used,
        limit: Number.isFinite(limit) ? limit : null, // null = boundless
        remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : null,
      },
      libraryCount: entries,
    });
  } catch (err) {
    console.error("[auth/me] failed:", err);
    return NextResponse.json({ user: null, googleConfigured: false }, { status: 200 });
  }
}
