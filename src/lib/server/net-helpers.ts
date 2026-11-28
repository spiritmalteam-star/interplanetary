import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { networkName } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE NETWORK'S OWN STATIONERY — the small hands every door of the   */
/*  living evolution network passes to each other: reading params,     */
/*  honest defaults, the feed's post shape, the failure shape.         */
/* ------------------------------------------------------------------ */

/** the quiet read — a fallen shelf answers with its honest fallback */
export async function graceful<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch {
    return fallback;
  }
}

export function takeOf(url: URL, def: number, max = 60): number {
  const raw = Number(url.searchParams.get("take") ?? def);
  if (!Number.isFinite(raw)) return def;
  return Math.max(1, Math.min(max, Math.trunc(raw)));
}

export function cleanStr(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, max);
}

/** "a, b, c" → ["a","b","c"] — the comma-joined shelves, read back out */
export function listOf(joined: string | null | undefined, max = 20): string[] {
  if (!joined) return [];
  return joined
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** ["a","b"] → "a,b" — validates an array of strings into a joined shelf */
export function joinOf(
  value: unknown,
  maxItems = 20,
  itemMax = 40
): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim().slice(0, itemMax))
    .filter(Boolean)
    .slice(0, maxItems);
  return items.length > 0 ? items.join(",") : null;
}

export const DEFAULT_PREFS = { resonance: true, echoes: true, connections: true, library: true };

export function prefsOf(raw: unknown): typeof DEFAULT_PREFS {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const p = raw as Record<string, unknown>;
  return {
    resonance: p.resonance !== false,
    echoes: p.echoes !== false,
    connections: p.connections !== false,
    library: p.library !== false,
  };
}

/* THE HALL'S OWN POST SHAPE — what every feed, shelf and wall of the
   network reads offerings in. Mirrors GET /api/gathering's rows. */
export type FeedUserRow = {
  name: string | null;
  email: string;
  provider: string | null;
  image?: string | null;
};

export type FeedPostRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  sector?: string | null;
  region?: string | null;
  cover?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaName?: string | null;
  tags?: string | null;
  circle?: { id: string; name: string } | null;
  circleId?: string | null;
  visibility?: string | null;
  epistemic?: string | null;
  status?: string | null;
  language?: string | null;
  altText?: string | null;
  aiMedia?: boolean | null;
  aiStyle?: string | null;
  createdAt: Date;
  userId: string;
  user?: FeedUserRow;
  resonances?: { id: string; userId?: string }[];
  _count?: { resonances?: number; echoes?: number };
};

export function tagsOut(joined: string | null | undefined): string[] {
  return (joined ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function feedPostOf(
  p: FeedPostRow,
  viewerId: string,
  extras?: {
    repostCount?: number;
    bookmarked?: boolean;
    reposted?: boolean;
    resonated?: boolean;
    hasQuestion?: boolean;
    hasLab?: boolean;
    hasIntentionSpace?: boolean;
  }
) {
  return {
    id: p.id,
    kind: p.kind,
    title: p.title,
    body: p.body,
    sector: p.sector ?? null,
    region: p.region ?? null,
    cover: p.cover ?? null,
    mediaUrl: p.mediaUrl ?? null,
    mediaType: p.mediaType ?? null,
    mediaName: p.mediaName ?? null,
    tags: tagsOut(p.tags),
    circle: p.circle ? { id: p.circle.id, name: p.circle.name } : null,
    resonanceCount: p._count?.resonances ?? p.resonances?.length ?? 0,
    echoCount: p._count?.echoes ?? 0,
    createdAt: new Date(p.createdAt).toISOString(),
    author: {
      name: p.user ? networkName(p.user) : "An unnamed maker",
      image: p.user?.image ?? null,
      anon: (p.user?.provider ?? "") === "anon",
    },
    mine: p.userId === viewerId,
    resonated: extras?.resonated ?? (p.resonances?.length ?? 0) > 0,
    repostCount: extras?.repostCount ?? 0,
    bookmarked: extras?.bookmarked ?? false,
    reposted: extras?.reposted ?? false,
    epistemic: p.epistemic ?? null,
    visibility: p.visibility ?? "public",
    language: p.language ?? null,
    altText: p.altText ?? null,
    aiMedia: Boolean(p.aiMedia),
    aiStyle: p.aiStyle ?? null,
    hasQuestion: extras?.hasQuestion ?? false,
    hasLab: extras?.hasLab ?? false,
    hasIntentionSpace: extras?.hasIntentionSpace ?? false,
  };
}

/* the failure shape — every door answers with { error } */
export function errorJson(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** A person's count shelves, gathered honestly — fallen counts rest at zero. */
export async function countShelves(userId: string): Promise<{
  posts: number;
  circles: number;
  projects: number;
}> {
  const [posts, circles, projects] = await Promise.all([
    graceful(() => db.gatheringPost.count({ where: { userId } }), 0),
    graceful(() => db.networkCircleMember.count({ where: { userId } }), 0),
    graceful(() => db.networkLabProject.count({ where: { ownerId: userId } }), 0),
  ]);
  return { posts, circles, projects };
}
