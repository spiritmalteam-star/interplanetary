import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE HOUSE'S OWN SWITCHES — the central configuration.              */
/*                                                                     */
/*  Two layers, one truth:                                             */
/*   ① the environment vault seeds the defaults (OPEN_ACCESS_MODE,     */
/*      COMPLIMENTARY_CHECKOUT, CREDINS_ENABLED — set on Vercel);      */
/*   ② the owner's admin hand overrides them in PlatformConfig, so     */
/*      the mode can be turned without a redeploy.                     */
/*                                                                     */
/*  Everything here is read SERVER-SIDE only. No frontend request can  */
/*  ever set a price, an allocation or a flag — the frontend only ever */
/*  READS what the server decided to show it.                          */
/*                                                                     */
/*  The three master switches:                                         */
/*    OPEN_ACCESS_MODE        — the whole laboratory opens freely      */
/*                              (everything grants, nothing charges)   */
/*    COMPLIMENTARY_CHECKOUT  — the FREE door at checkout stands open  */
/*    CREDINS_ENABLED         — the future bank gateway's readiness    */
/*                              flag (false until CredIns connects;    */
/*                              Stripe remains the paid gateway)       */
/*                                                                     */
/*  The rows ride the keeper's own console (PlatformConfig, value      */
/*  Json, updatedBy remembered) — one row per switch, the boolean      */
/*  or number carried as the value itself.                             */
/*                                                                     */
/*  Complimentary checkout's own tuning (PlatformConfig, owner-set):   */
/*    complimentary_packages      — ["SEEKER","OBSERVATORY_PRO","topup"] */
/*    complimentary_allocations   — {"SEEKER": 100, …} overrides       */
/*    complimentary_daily_limit   — free grants one user may activate  */
/*                                  per day (eligibility)              */
/* ------------------------------------------------------------------ */

export interface ComplimentaryConfig {
  openAccessMode: boolean;
  complimentaryCheckout: boolean;
  credinsEnabled: boolean;
  /** which packages may be activated free (keys of WALLET_PLANS + "topup") */
  packages: string[];
  /** optional per-package credit overrides — the normal allocation stands when absent */
  allocations: Record<string, number>;
  /** how many complimentary grants one user may activate per day */
  dailyLimit: number;
}

const DEFAULT_PACKAGES = ["SEEKER", "OBSERVATORY_PRO", "topup", "pack_100", "pack_250", "pack_700"];
const DEFAULT_DAILY_LIMIT = 5;

function envBool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v == null || v === "") return fallback;
  return v === "true" || v === "1" || v === "yes";
}

/** The console row's value read as a boolean — the Json value may
    carry true/false directly or the strings "true"/"false". */
async function configBool(key: string): Promise<boolean | null> {
  try {
    const row = await db.platformConfig.findUnique({ where: { key } });
    if (!row) return null;
    const v = row.value as unknown;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v === "true" || v === "1";
    if (v && typeof v === "object" && "enabled" in (v as Record<string, unknown>)) {
      return Boolean((v as { enabled: unknown }).enabled);
    }
    return null;
  } catch {
    /* the console may not have walked its migration yet — env serves */
    return null;
  }
}

/** The console row's value read as arbitrary Json. */
async function configJson(key: string): Promise<unknown | null> {
  try {
    const row = await db.platformConfig.findUnique({ where: { key } });
    return row ? (row.value as unknown) : null;
  } catch {
    return null;
  }
}

function asStringArray(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.filter((x): x is string => typeof x === "string");
  return out.length > 0 ? out : fallback;
}

function asAllocationRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (typeof k === "string" && k.length <= 40 && Number.isFinite(n) && n >= 0) {
        out[k] = Math.floor(n);
      }
    }
  }
  return out;
}

function asPositiveInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** The resolved configuration — env seeds, the owner's console on top. */
export async function getComplimentaryConfig(): Promise<ComplimentaryConfig> {
  const [openAccess, complimentary, credins, packages, allocations, dailyLimit] =
    await Promise.all([
      configBool("open_access_mode"),
      configBool("complimentary_checkout"),
      configBool("credins_enabled"),
      configJson("complimentary_packages"),
      configJson("complimentary_allocations"),
      configJson("complimentary_daily_limit"),
    ]);

  return {
    openAccessMode: openAccess ?? envBool("OPEN_ACCESS_MODE"),
    complimentaryCheckout:
      /* THE SECURE DEFAULT — the FREE door stands CLOSED unless the
         owner's own hand (env or the console) opens it. Real plan
         allocations are never given away by a deployment's silence. */
      complimentary ?? envBool("COMPLIMENTARY_CHECKOUT", false),
    credinsEnabled: credins ?? envBool("CREDINS_ENABLED"),
    packages: asStringArray(packages, DEFAULT_PACKAGES),
    allocations: asAllocationRecord(allocations),
    dailyLimit: asPositiveInt(dailyLimit, DEFAULT_DAILY_LIMIT),
  };
}

/** Is a package allowed to be activated free right now? */
export function packageMayBeFree(config: ComplimentaryConfig, packageId: string): boolean {
  return config.packages.includes(packageId);
}

/** The allocation a package grants — the override when the owner set
    one, otherwise the package's own normal credits (never a client
    number; the caller passes the server-side definition's credits). */
export function allocationFor(config: ComplimentaryConfig, packageId: string, normalCredits: number): number {
  const override = config.allocations[packageId];
  if (typeof override === "number" && Number.isFinite(override) && override >= 0) {
    return Math.floor(override);
  }
  return normalCredits;
}

/** The owner's identity — the keeper's own email (the house's
    existing admin law: ADMIN_EMAIL in the vault, one default kept). */
export function ownerEmail(): string | null {
  return process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || null;
}

export function isOwnerEmail(email: string): boolean {
  /* the same law the platform's admin doors already keep */
  const owner = ownerEmail();
  return Boolean(owner && email && !email.startsWith("anon:") && email.toLowerCase() === owner!.toLowerCase());
}

/** The admin API's own key law — the owner's session email OR the
    x-admin-key header (a secret from the vault, for scripts).
    THE TIMING-SAFE LAW — the comparison never leaks its answer's
    length through an early exit. */
export function isAdminKey(key: string | null): boolean {
  const secret = process.env.ADMIN_KEY;
  if (!secret || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(secret);
  if (a.length !== b.length) {
    /* burn the same time a match would take, then refuse */
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
