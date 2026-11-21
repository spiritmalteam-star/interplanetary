import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify, wallIdsFor } from "@/lib/server/network";
import { isCoverStyle } from "./cover/route";

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S DOORS — the shared hall's own API.                 */
/*                                                                     */
/*  THE FREE LAW holds here too: every visitor — a signed keeper or    */
/*  the anonymous cookie's quiet explorer — may walk the hall, offer   */
/*  a reflection, resonate with another's work, leave an echo.         */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - nothing is auto-published: a post exists because its maker       */
/*    pressed the offering hand themselves;                            */
/*  - every post keeps its maker's name (anon keeps a quiet one);      */
/*  - resonance is a tuning, not a trophy: one per explorer per post,  */
/*    taken back the moment it is withdrawn;                           */
/*  - the flood-gates (rate limits) stop bursts, not people;           */
/*  - the hall's order is read from the tables, never from a market:   */
/*    the tabs weave by recency, kinship and the maker's own stated    */
/*    interests — no paid places, no hidden hands.                     */
/* ------------------------------------------------------------------ */

export const GATHERING_KINDS = [
  "reflection",
  "creation", // kept for the older offerings already on the walls
  "dream",
  "music",
  "book",
  "discovery",
  "question",
  "intention", // the seeker's own vow — a purpose spoken into the hall
  // publication kinds — hung by the publication house, not by a composer
  "artwork",
  // the living evolution network's kinds — hypotheses to hold,
  // experiments to try, findings to share, hands to join, words to weigh
  "hypothesis",
  "experiment",
  "finding",
  "collaboration",
  "discussion",
] as const;

export const GATHERING_MEDIA_TYPES = ["image", "video"] as const;
export type GatheringMediaType = (typeof GATHERING_MEDIA_TYPES)[number];

export function isGatheringMediaType(v: unknown): v is GatheringMediaType {
  return typeof v === "string" && (GATHERING_MEDIA_TYPES as readonly string[]).includes(v);
}

export type GatheringKind = (typeof GATHERING_KINDS)[number];

export function isGatheringKind(v: unknown): v is GatheringKind {
  return typeof v === "string" && (GATHERING_KINDS as readonly string[]).includes(v);
}

/* THE HONEST LABELS — how a maker names their own certainty. The hall
   never grades knowledge itself; it only asks each maker to speak
   plainly about how far their word has walked. */
export const GATHERING_EPISTEMIC = [
  "established",
  "preliminary",
  "hypothesis",
  "personal",
  "philosophical",
  "creative",
  "disputed",
] as const;

export type GatheringEpistemic = (typeof GATHERING_EPISTEMIC)[number];

export function isGatheringEpistemic(v: unknown): v is GatheringEpistemic {
  return typeof v === "string" && (GATHERING_EPISTEMIC as readonly string[]).includes(v);
}

/* THE ATLAS' OWN SHORES — the only regions an intention may wear. A
   whitelist keeps the map honest: no free-text places, only the
   shores the atlas itself draws. */
export const GATHERING_REGIONS = [
  "north-america",
  "south-america",
  "europe",
  "africa",
  "middle-east",
  "asia",
  "oceania",
] as const;

export type GatheringRegion = (typeof GATHERING_REGIONS)[number];

export function isGatheringRegion(v: unknown): v is GatheringRegion {
  return typeof v === "string" && (GATHERING_REGIONS as readonly string[]).includes(v);
}

/* THE HALL'S OWN TABS — four ways of walking the same room. */
export const GATHERING_TABS = ["foryou", "following", "latest", "discoveries"] as const;
export type GatheringTab = (typeof GATHERING_TABS)[number];

export function isGatheringTab(v: unknown): v is GatheringTab {
  return typeof v === "string" && (GATHERING_TABS as readonly string[]).includes(v);
}

const TITLE_MAX = 120;
const BODY_MAX = 4000;

/* THE OFFERING'S OWN VISIBILITIES — who may read it once it hangs:
   the open hall, a circle's wall, accepted connections, anyone with
   the quiet link, or the maker alone. The server decides — never the
   visitor's politeness. */
export const POST_VISIBILITIES = [
  "public",
  "circle",
  "connections",
  "unlisted",
  "private",
] as const;

export function isPostVisibility(v: unknown): v is (typeof POST_VISIBILITIES)[number] {
  return typeof v === "string" && (POST_VISIBILITIES as readonly string[]).includes(v);
}

/** the display name a post's maker wears in the hall — the landing
    profile's own name for the signed-in; the minted astral name for
    the quiet guest (one mint, shared with the whole network) */
export function gatheringName(user: {
  name: string | null;
  email: string;
  provider?: string | null;
}): string {
  return networkName(user);
}

/* ---------------- the "for you" loom ----------------
   A quiet, honest weaving — never a popularity contest:
     score = 0.5*freshness + 1.4*followed + 0.9*interestMatch + 0.4*kindWeight
   Freshness fades over a 48-hour breath; `followed` reads only the
   paths the visitor chose themselves; interestMatch reads only the
   tokens the maker wrote on their own profile; kind weight leans
   gently toward the questions, hypotheses and experiments of the
   living network. No paid places, no hidden hands. */

const FORYOU_POOL_PUBLIC = 90;
const FORYOU_POOL_FOLLOWED = 60;
const FORYOU_DISCOVERY_KINDS = [
  "discovery",
  "finding",
  "experiment",
  "creation",
  "book",
  "music",
] as const;

const FORYOU_WEIGHTED_KINDS = new Set([
  "question",
  "hypothesis",
  "discovery",
  "finding",
  "experiment",
  "collaboration",
]);

function interestTokensOf(
  profile: { interests: string | null; disciplines: string | null } | null
): string[] {
  if (!profile) return [];
  const raw = `${profile.interests ?? ""} ${profile.disciplines ?? ""}`;
  return Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length >= 3)
    )
  ).slice(0, 24);
}

type PostRow = Prisma.GatheringPostGetPayload<{
  include: {
    user: { select: { name: true; email: true; provider: true; image: true } };
    circle: { select: { id: true; name: true } };
    resonances: { select: { id: true } };
    _count: { select: { resonances: true; echoes: true } };
  };
}>;

/** weave the merged pool: score, order, then let no one kind crowd the
    path — no more than two neighbours of the same kind in a row */
function rankForYou(pool: PostRow[], followedIds: Set<string>, tokens: string[]): PostRow[] {
  const now = Date.now();
  const scored = pool.map((p) => {
    const hoursSince = Math.max(0, (now - p.createdAt.getTime()) / (60 * 60 * 1000));
    const freshness = Math.exp(-hoursSince / 48);
    const followed = followedIds.has(p.userId) ? 1 : 0;
    const haystack = `${p.title} ${p.tags ?? ""} ${p.body}`.toLowerCase();
    let matches = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) matches += 1;
    }
    const interestMatch = tokens.length > 0 ? Math.min(1, matches / tokens.length) : 0;
    const kindWeight = FORYOU_WEIGHTED_KINDS.has(p.kind) ? 1 : 0.6;
    const score = 0.5 * freshness + 1.4 * followed + 0.9 * interestMatch + 0.4 * kindWeight;
    return { post: p, score, at: p.createdAt.getTime(), id: p.id };
  });
  scored.sort(
    (a, b) => b.score - a.score || b.at - a.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );

  const ordered: PostRow[] = [];
  const waiting: typeof scored = [];
  let runKind: string | null = null;
  let runLen = 0;
  const emit = (s: (typeof scored)[number]): void => {
    ordered.push(s.post);
    if (s.post.kind === runKind) runLen += 1;
    else {
      runKind = s.post.kind;
      runLen = 1;
    }
  };
  for (const s of scored) {
    if (s.post.kind === runKind && runLen >= 2) {
      waiting.push(s);
      continue;
    }
    emit(s);
  }
  while (waiting.length > 0) {
    let pick = 0;
    if (runKind !== null && runLen >= 2) {
      const alt = waiting.findIndex((s) => s.post.kind !== runKind);
      if (alt > 0) pick = alt;
    }
    emit(waiting.splice(pick, 1)[0]);
  }
  return ordered;
}

/* ---------------- the twin-fold ----------------
   One maker, one name, twice on the walls — a work and its echo
   hanging as strangers. The fold keeps the most-resonated of the
   twins in its original place and counts the rest honestly. */
function foldTwins(rows: PostRow[]): { rows: PostRow[]; folded: number } {
  const byKey = new Map<string, PostRow>();
  let folded = 0;
  for (const p of rows) {
    const key = `${p.userId}::${p.title.trim().toLowerCase()}`;
    const held = byKey.get(key);
    if (!held) {
      byKey.set(key, p);
      continue;
    }
    folded += 1;
    const better =
      p._count.resonances > held._count.resonances ||
      (p._count.resonances === held._count.resonances && p.createdAt > held.createdAt);
    if (better) byKey.set(key, p);
  }
  const kept = rows.filter((p) => byKey.get(`${p.userId}::${p.title.trim().toLowerCase()}`)?.id === p.id);
  return { rows: kept, folded };
}

/* ---------------- the quiet walls — graceful on every sky ----------------
   A young cloud may not carry every table yet; the hall still opens.
   Each side-room read falls back to its honest empty answer, so the
   exhibition never closes because one shelf has not been built. */
async function graceful<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch {
    return fallback;
  }
}

/** THE LEAN FALLBACK — the offerings read without the relation shelves
    (resonances, circle, counts) when a young sky has not built those
    tables yet: the works still stand in the hall, wearing what the
    works themselves carry. */
async function readPosts(
  args: {
    where: Prisma.GatheringPostWhereInput;
    orderBy: Prisma.GatheringPostOrderByWithRelationInput;
    take: number;
    cursor?: { id: string };
    skip?: number;
  },
  visitorUserId: string
): Promise<PostRow[]> {
  const include = {
    user: { select: { name: true, email: true, provider: true, image: true } },
    circle: { select: { id: true, name: true } },
    resonances: { where: { userId: visitorUserId }, select: { id: true } },
    _count: { select: { resonances: true, echoes: true } },
  } satisfies Prisma.GatheringPostInclude;
  try {
    return await db.gatheringPost.findMany({ ...args, include });
  } catch {
    const lean = await db.gatheringPost.findMany({
      ...args,
      include: { user: { select: { name: true, email: true, provider: true, image: true } } },
    });
    return lean.map((p) => ({
      ...p,
      circle: null,
      resonances: [],
      _count: { resonances: 0, echoes: 0 },
    }));
  }
}

/* ---------------- GET /api/gathering — the living exhibition ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const mine = url.searchParams.get("mine") === "1";
    const circleId = url.searchParams.get("circle");
    const region = url.searchParams.get("region");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const cursor = url.searchParams.get("cursor");
    const epistemicRaw = url.searchParams.get("epistemic");
    const epistemicLevel = isGatheringEpistemic(epistemicRaw) ? epistemicRaw : null;
    const take = Math.min(30, Math.max(5, Number(url.searchParams.get("take") ?? 15)));

    /* a tab only steers the open hall — a maker's own shelf, a circle's
       wall or a search keeps its own ordering */
    const tabRaw = url.searchParams.get("tab");
    const tab: GatheringTab =
      !mine && !circleId && !q && isGatheringTab(tabRaw) ? tabRaw : "latest";

    /* the quiet walls — a closed door's words never reach the hall */
    const walls = await graceful(
      () => wallIdsFor(visitor.user.id),
      new Set<string>()
    );

    let rows: PostRow[];
    let nextCursor: string | null = null;
    let foldedTwins = 0;

    if (tab === "foryou") {
      /* the weaver's pools: the open hall's newest words, and the
         newest words of the makers the visitor chose to follow */
      const follows = await graceful(
        () =>
          db.networkFollow.findMany({
            where: { followerId: visitor.user.id },
            select: { followingId: true },
          }),
        [] as { followingId: string }[]
      );
      const followedIds = new Set(follows.map((f) => f.followingId));

      const hallPool = await readPosts(
        {
          where: {
            visibility: "public",
            status: "published",
            userId: { notIn: Array.from(walls) },
          },
          orderBy: { createdAt: "desc" },
          take: FORYOU_POOL_PUBLIC,
        },
        visitor.user.id
      );
      const followedPool =
        followedIds.size > 0
          ? await readPosts(
              {
                where: {
                  userId: {
                    in: Array.from(followedIds),
                    notIn: Array.from(walls),
                  },
                  visibility: "public",
                  status: "published",
                },
                orderBy: { createdAt: "desc" },
                take: FORYOU_POOL_FOLLOWED,
              },
              visitor.user.id
            )
          : [];

      const merged = new Map<string, PostRow>();
      for (const p of followedPool) merged.set(p.id, p);
      for (const p of hallPool) {
        if (!merged.has(p.id)) merged.set(p.id, p);
      }

      const profile = await graceful(
        () =>
          db.networkProfile.findUnique({
            where: { userId: visitor.user.id },
            select: { interests: true, disciplines: true },
          }),
        null
      );
      const ranked = rankForYou(Array.from(merged.values()), followedIds, interestTokensOf(profile));

      /* the twin-fold and the honest label's own sieve — applied before
         the page is cut, so a page never shows two of one offering */
      const folded = foldTwins(ranked);
      const sieved = epistemicLevel
        ? folded.rows.filter((p) => p.epistemic === epistemicLevel)
        : folded.rows;

      /* the numeric cursor — an offset spoken as a string */
      const offset = Math.max(0, Number.parseInt(cursor ?? "0", 10) || 0);
      rows = sieved.slice(offset, offset + take);
      nextCursor = offset + take < sieved.length ? String(offset + take) : null;
      foldedTwins = folded.folded;
    } else {
      const where: Prisma.GatheringPostWhereInput = {
        /* the honesty law — only offerings still standing are read */
        status: "published",
        ...(mine ? { userId: visitor.user.id } : {}),
        ...(tab === "discoveries"
          ? {
              kind: isGatheringKind(kind) && (FORYOU_DISCOVERY_KINDS as readonly string[]).includes(kind)
                ? kind
                : { in: [...FORYOU_DISCOVERY_KINDS] },
            }
          : isGatheringKind(kind)
            ? { kind }
            : {}),
        ...(isGatheringRegion(region) ? { region } : {}),
        ...(epistemicLevel ? { epistemic: epistemicLevel } : {}),
        /* the circle's own filter stands only when a circle is named —
           the visibility law already keeps a circle's private words
           out of the open hall, so the open hall reads public offerings
           however their circle field rests */
        ...(circleId ? { circleId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { body: { contains: q } },
                { tags: { contains: q } },
              ],
            }
          : {}),
      };

      if (tab === "following") {
        /* the paths the visitor chose — their makers' words, and the
           visitor's own, one quiet river; the visitor's own quieter
           rooms stay theirs alone, the hall reads the public words */
        const follows = await graceful(
          () =>
            db.networkFollow.findMany({
              where: { followerId: visitor.user.id },
              select: { followingId: true },
            }),
          [] as { followingId: string }[]
        );
        where.userId = { in: [...follows.map((f) => f.followingId), visitor.user.id] };
        where.OR = [{ visibility: "public" }, { userId: visitor.user.id }];
      } else if (mine) {
        /* the maker reads every room of their own house */
      } else if (circleId) {
        /* a circle's wall reads its own and the public words */
        where.visibility = { in: ["public", "circle"] };
      } else {
        /* the open hall reads only what was spoken to it */
        where.visibility = "public";
      }

      const fetched = await readPosts(
        {
          where,
          orderBy: { createdAt: "desc" },
          take: take + 40,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        },
        visitor.user.id
      );

      const walled = fetched.filter((p) => !walls.has(p.userId));
      const folded = foldTwins(walled);
      foldedTwins = folded.folded;
      const safe = folded.rows.slice(0, take + 1);
      const hasMore = safe.length > take;
      const page = safe.slice(0, take);
      rows = page;
      nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;
    }

    /* the page's own truth — read once, after the slicing, straight
       from the tables: bookmarks, reposts, and the living spaces a
       post may have opened (question, lab bench, intention). Each
       read degrades gracefully on a sky whose shelves are still
       being built. */
    const ids = rows.map((p) => p.id);
    const [visitorBookmarks, repostRows, questionRows, labRows, intentionRows] = await Promise.all([
      graceful(
        () =>
          db.gatheringBookmark.findMany({
            where: { userId: visitor.user.id, postId: { in: ids } },
            select: { postId: true },
          }),
        [] as { postId: string }[]
      ),
      graceful(
        () =>
          db.gatheringRepost.findMany({
            where: { postId: { in: ids } },
            select: { postId: true, userId: true },
          }),
        [] as { postId: string; userId: string }[]
      ),
      graceful(
        () =>
          db.networkQuestion.findMany({
            where: { postId: { in: ids } },
            select: { postId: true },
            take: Math.max(1, ids.length),
          }),
        [] as { postId: string }[]
      ),
      graceful(
        () =>
          db.networkLabProject.findMany({
            where: { seedPostId: { in: ids } },
            select: { seedPostId: true },
            take: Math.max(1, ids.length),
          }),
        [] as { seedPostId: string }[]
      ),
      graceful(
        () =>
          db.networkIntention.findMany({
            where: { seedPostId: { in: ids } },
            select: { seedPostId: true },
            take: Math.max(1, ids.length),
          }),
        [] as { seedPostId: string }[]
      ),
    ]);

    const bookmarkedIds = new Set(visitorBookmarks.map((b) => b.postId));
    const repostCounts = new Map<string, number>();
    const myRepostIds = new Set<string>();
    for (const r of repostRows) {
      repostCounts.set(r.postId, (repostCounts.get(r.postId) ?? 0) + 1);
      if (r.userId === visitor.user.id) myRepostIds.add(r.postId);
    }
    const questionPostIds = new Set(questionRows.map((r) => r.postId));
    const labPostIds = new Set(labRows.map((r) => r.seedPostId));
    const intentionPostIds = new Set(intentionRows.map((r) => r.seedPostId));

    const posts = rows.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      body: p.body,
      sector: p.sector,
      region: p.region,
      cover: p.cover,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      mediaName: p.mediaName,
      tags: (p.tags ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      circle: p.circle ? { id: p.circle.id, name: p.circle.name } : null,
      /* the live truth, read from the tables themselves — the
         denormalized columns rest, the hall never lies */
      resonanceCount: p._count.resonances,
      echoCount: p._count.echoes,
      createdAt: p.createdAt.toISOString(),
      author: {
        name: gatheringName(p.user),
        image: p.user.image ?? null,
        anon: p.user.provider === "anon",
      },
      mine: p.userId === visitor.user.id,
      resonated: p.resonances.length > 0,
      /* the page's own attachments — read, not guessed */
      repostCount: repostCounts.get(p.id) ?? 0,
      bookmarked: bookmarkedIds.has(p.id),
      reposted: myRepostIds.has(p.id),
      epistemic: p.epistemic,
      visibility: p.visibility,
      language: p.language,
      altText: p.altText,
      aiMedia: p.aiMedia,
      aiStyle: p.aiStyle,
      hasQuestion: questionPostIds.has(p.id),
      hasLab: labPostIds.has(p.id),
      hasIntentionSpace: intentionPostIds.has(p.id),
    }));

    return withAnonCookie(
      NextResponse.json({
        posts,
        nextCursor,
        foldedTwins,
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering GET failed", err);
    return NextResponse.json({ error: "The hall could not be read." }, { status: 500 });
  }
}

/* ---------------- POST /api/gathering — the offering hand ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const flood = rateLimit(`gathering:post:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The hall asks for a breath — offer again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      kind?: unknown;
      title?: unknown;
      body?: unknown;
      sector?: unknown;
      tags?: unknown;
      region?: unknown;
      circleId?: unknown;
      mediaUrl?: unknown;
      mediaType?: unknown;
      mediaName?: unknown;
      epistemic?: unknown;
      visibility?: unknown;
      language?: unknown;
      altText?: unknown;
      aiMedia?: unknown;
      aiStyle?: unknown;
      publishKey?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The offering arrived unreadable." }, { status: 400 });
    }

    /* THE ONE KEY, ONE OFFERING LAW — the composer speaks with an
       idempotency key; a shaky hand, a lost reply or a retry can
       never hang the same offering twice. The first pressing hangs;
       every later pressing reads the very same offering back. */
    const publishKey =
      typeof raw.publishKey === "string" &&
      raw.publishKey.length >= 10 &&
      raw.publishKey.length <= 64 &&
      /^[A-Za-z0-9_-]+$/.test(raw.publishKey)
        ? raw.publishKey
        : null;
    if (publishKey) {
      const existing = await db.gatheringPost.findUnique({
        where: { publishKey },
        include: {
          user: { select: { name: true, email: true, provider: true, image: true } },
          circle: { select: { id: true, name: true } },
          resonances: { where: { userId: visitor.user.id }, select: { id: true } },
          _count: { select: { resonances: true, echoes: true } },
        },
      });
      if (existing && existing.userId !== visitor.user.id) {
        return NextResponse.json(
          { error: "This offering's key is already spoken for." },
          { status: 409 }
        );
      }
      if (existing) {
        return withAnonCookie(
          NextResponse.json({
            existing: true,
            post: {
              id: existing.id,
              kind: existing.kind,
              title: existing.title,
              body: existing.body,
              sector: existing.sector,
              region: existing.region,
              mediaUrl: existing.mediaUrl,
              mediaType: existing.mediaType,
              mediaName: existing.mediaName,
              tags: (existing.tags ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              circle: existing.circle
                ? { id: existing.circle.id, name: existing.circle.name }
                : null,
              resonanceCount: existing._count.resonances,
              echoCount: existing._count.echoes,
              createdAt: existing.createdAt.toISOString(),
              author: {
                name: gatheringName(existing.user),
                image: existing.user.image ?? null,
                anon: existing.user.provider === "anon",
              },
              mine: true,
              resonated: existing.resonances.length > 0,
              repostCount: 0,
              bookmarked: false,
              reposted: false,
              epistemic: existing.epistemic,
              visibility: existing.visibility,
              language: existing.language,
              altText: existing.altText,
              aiMedia: existing.aiMedia,
              aiStyle: existing.aiStyle,
              hasQuestion: false,
              hasLab: false,
              hasIntentionSpace: false,
            },
          }),
          visitor
        );
      }
    }

    if (!isGatheringKind(raw.kind)) {
      return NextResponse.json(
        { error: "Choose the offering's own intention." },
        { status: 400 }
      );
    }

    /* the honest label — the maker names their own certainty, from the
       seven words the hall keeps; silence arrives as no label at all */
    const epistemic = raw.epistemic === undefined || raw.epistemic === null
      ? null
      : isGatheringEpistemic(raw.epistemic)
        ? raw.epistemic
        : null;
    if (raw.epistemic !== undefined && raw.epistemic !== null && !epistemic) {
      return NextResponse.json(
        { error: "Choose an honest label for this knowledge." },
        { status: 400 }
      );
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const body = typeof raw.body === "string" ? raw.body.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    if (body.length < 2 || body.length > BODY_MAX) {
      return NextResponse.json(
        { error: `The words want between 2 and ${BODY_MAX} letters.` },
        { status: 400 }
      );
    }
    const sector =
      typeof raw.sector === "string" && raw.sector.trim().length >= 2 && raw.sector.length <= 24
        ? raw.sector.trim()
        : null;
    const tags =
      typeof raw.tags === "string" && raw.tags.trim().length >= 2
        ? raw.tags
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length >= 2)
            .slice(0, 6)
            .join(",")
        : null;

    /* the intention's own shore — only a shore the atlas draws may be
       worn; anything else arrives without a region */
    const region = isGatheringRegion(raw.region) ? raw.region : null;

    /* the offering's own picture or film — only the house's shelf may
       be named: a gathering upload or an atelier painting; a foreign
       address never enters the hall */
    let media: { url: string; type: string; name: string | null } | null = null;
    if (
      typeof raw.mediaUrl === "string" &&
      (raw.mediaUrl.startsWith("/gathering-media/") || raw.mediaUrl.startsWith("/api/visual/"))
    ) {
      if (!isGatheringMediaType(raw.mediaType)) {
        return NextResponse.json(
          { error: "The offering's media wears an unknown shape." },
          { status: 400 }
        );
      }
      media = {
        url: raw.mediaUrl.slice(0, 200),
        type: raw.mediaType,
        name:
          typeof raw.mediaName === "string" && raw.mediaName.trim().length >= 1
            ? raw.mediaName.trim().slice(0, 120)
            : null,
      };
    }

    /* a circle's wall — only a member hangs inside it */
    let circleId: string | null = null;
    if (typeof raw.circleId === "string" && raw.circleId.length > 0) {
      const membership = await db.networkCircleMember.findUnique({
        where: { circleId_userId: { circleId: raw.circleId, userId: visitor.user.id } },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "Only a circle's own members hang inside it." },
          { status: 403 }
        );
      }
      circleId = raw.circleId;
    }

    /* THE VISIBILITY LAW — the maker chooses who may read; inside a
       circle the circle's own wall decides. The server enforces this
       at every read; the feed never trusts a hidden room. */
    const asked = isPostVisibility(raw.visibility) ? raw.visibility : "public";
    const visibility = circleId ? "circle" : asked;

    /* the offering's own tongue — recorded, never translated */
    const language =
      typeof raw.language === "string" && raw.language.trim().length >= 2
        ? raw.language.trim().slice(0, 8).toLowerCase()
        : null;

    /* the picture's honest description and its engine's truth */
    const altText =
      typeof raw.altText === "string" && raw.altText.trim().length >= 1
        ? raw.altText.trim().slice(0, 300)
        : null;
    const aiMedia = raw.aiMedia === true;
    const aiStyle = isCoverStyle(raw.aiStyle) ? raw.aiStyle : null;

    const created = await db.gatheringPost.create({
      data: {
        userId: visitor.user.id,
        kind: raw.kind,
        title,
        body,
        sector,
        tags,
        region,
        circleId,
        epistemic,
        visibility,
        language,
        altText,
        aiMedia,
        aiStyle,
        ...(publishKey ? { publishKey } : {}),
        ...(media
          ? { mediaUrl: media.url, mediaType: media.type, mediaName: media.name }
          : {}),
      },
    });

    /* the bench retires — the words found their wall */
    try {
      await db.gatheringDraft.deleteMany({ where: { userId: visitor.user.id } });
    } catch {
      /* a resting bench never blocks a hung offering */
    }

    /* the circle's bells ring softly — a new offering arrived */
    if (circleId) {
      const others = await db.networkCircleMember.findMany({
        where: { circleId, userId: { not: visitor.user.id } },
        select: { userId: true },
        take: 40,
      });
      for (const o of others) {
        await notify({
          userId: o.userId,
          actorId: visitor.user.id,
          actorName: networkName(visitor.user),
          type: "circle_join",
          body: `${title.slice(0, 120)}`,
          refType: "post",
          refId: created.id,
        });
      }
    }

    return withAnonCookie(
      NextResponse.json({
        post: {
          id: created.id,
          kind: created.kind,
          title: created.title,
          body: created.body,
          sector: created.sector,
          region: created.region,
          mediaUrl: created.mediaUrl,
          mediaType: created.mediaType,
          mediaName: created.mediaName,
          tags: (created.tags ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          circle: circleId ? { id: circleId, name: "" } : null,
          resonanceCount: 0,
          echoCount: 0,
          createdAt: created.createdAt.toISOString(),
          author: {
            name: gatheringName(visitor.user),
            image: visitor.user.image ?? null,
            anon: visitor.user.provider === "anon",
          },
          mine: true,
          resonated: false,
          /* the page's own attachments — a fresh offering carries none yet */
          repostCount: 0,
          bookmarked: false,
          reposted: false,
          epistemic: created.epistemic,
          visibility: created.visibility,
          language: created.language,
          altText: created.altText,
          aiMedia: created.aiMedia,
          aiStyle: created.aiStyle,
          hasQuestion: false,
          hasLab: false,
          hasIntentionSpace: false,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering POST failed", err);
    return NextResponse.json({ error: "The offering could not be placed." }, { status: 500 });
  }
}
