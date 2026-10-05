import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  THE VISITOR'S OWN TUNING — GET / PUT /api/account/settings         */
/*                                                                     */
/*  Settings belong to the PASSAGE, not the device: the language, the  */
/*  voice, the pace, the theme and the FIELDS OF EXPANSION (the        */
/*  phrases the visitor wishes to be more informed and expansive in —  */
/*  coherent ones become seeds for new branches in every field).       */
/*  Every sign-in returns this tuning; the laboratory re-tunes itself  */
/*  to the visitor, on every device, every time.                       */
/* ------------------------------------------------------------------ */

interface VisitorSettings {
  [key: string]: unknown;
  language?: string;
  theme?: string;
  voice?: string;
  pace?: number;
  /** The visitor's fields of expansion — coherent phrases become
      seeds for new branches in all fields of the tree. */
  seeds?: string[];
}

const MAX_SEEDS = 6;
const SEED_MAX_LEN = 160;

function sanitizeSettings(raw: unknown): VisitorSettings {
  const out: VisitorSettings = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;

  if (typeof r.language === "string") out.language = r.language.slice(0, 8);
  if (typeof r.theme === "string") out.theme = r.theme.slice(0, 12);
  if (typeof r.voice === "string") out.voice = r.voice.slice(0, 40);
  if (typeof r.pace === "number" && Number.isFinite(r.pace)) {
    out.pace = Math.min(2, Math.max(0.5, r.pace));
  }
  if (Array.isArray(r.seeds)) {
    const seen = new Set<string>();
    const seeds: string[] = [];
    for (const s of r.seeds) {
      if (typeof s !== "string") continue;
      const clean = s.trim().replace(/\s+/g, " ").slice(0, SEED_MAX_LEN);
      if (clean.length < 2) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push(clean);
      if (seeds.length >= MAX_SEEDS) break;
    }
    out.seeds = seeds;
  }
  return out;
}

async function getImpl(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ settings: null, signedIn: false });
  }
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { settings: true },
  });
  return NextResponse.json({
    settings: sanitizeSettings(row?.settings),
    signedIn: true,
  });
}

export async function GET(req: NextRequest) {
  try {
    return await getImpl(req);
  } catch (err) {
    console.error("[account/settings] get failed:", err);
    return NextResponse.json({ settings: null, signedIn: false });
  }
}

async function putImpl(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.email.startsWith("anon:")) {
    return NextResponse.json(
      { error: "The tuning belongs to a passage — sign in to keep it." },
      { status: 401 }
    );
  }
  const body = await req.json().catch(() => null);
  const settings = sanitizeSettings(body?.settings);
  await db.user.update({
    where: { id: user.id },
    data: { settings: settings as unknown as Prisma.InputJsonValue },
  });
  return NextResponse.json({ settings, saved: true });
}

export const PUT = meterRoute("account_settings", putImpl);
