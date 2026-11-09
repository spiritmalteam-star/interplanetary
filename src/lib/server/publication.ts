import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { emitEvent, EVENT_TYPES } from "@/lib/server/events";

/* ------------------------------------------------------------------ */
/*  THE PUBLICATION HOUSE — one door from every portal into the hall.  */
/*                                                                     */
/*  A publication is a reference that carries its own snapshot: the    */
/*  source record stays exactly where it was born, private as it       */
/*  always was. Reading the hall never fetches the source — so a       */
/*  private transmission can never leak through a public offering.     */
/*                                                                     */
/*  Idempotent by (maker, portal, source): a retried publish lands     */
/*  the same offering, never a twin.                                   */
/* ------------------------------------------------------------------ */

export const SOURCE_PORTALS = [
  "artx",
  "music",
  "book",
  "dreambook",
  "hyperx",
  "channeling",
  "invent",
  "manifest",
  "lightcodes",
  "quantum",
  "healx",
  "observatory",
] as const;
export type SourcePortal = (typeof SOURCE_PORTALS)[number] | (string & {});

export const PUBLICATION_VISIBILITIES = ["public", "circle", "connections", "draft"] as const;
export type PublicationVisibility = (typeof PUBLICATION_VISIBILITIES)[number];

export const EPISTEMIC_LABELS = ["established", "hypothesis", "interpretation", "creative"] as const;
export type EpistemicLabel = (typeof EPISTEMIC_LABELS)[number];

/** The extensible content-type registry: portal → hall identity. */
export interface ContentTypeEntry {
  portal: string;
  label: string;          // human-readable content type
  kind: string;           // GatheringPost.kind
  sourceType: string;     // stored on the publication
  refKind: "library" | "music" | null;
}

const REGISTRY: Record<string, ContentTypeEntry> = {
  artx: { portal: "artx", label: "Artwork", kind: "artwork", sourceType: "artwork", refKind: "library" },
  music: { portal: "music", label: "Music", kind: "music", sourceType: "music", refKind: "music" },
  lightcodes: { portal: "music", label: "Music", kind: "music", sourceType: "music", refKind: "music" },
  book: { portal: "book", label: "Book / Story", kind: "book", sourceType: "book", refKind: "library" },
  dreambook: { portal: "book", label: "Book / Story", kind: "book", sourceType: "book", refKind: "library" },
  hyperx: { portal: "hyperx", label: "Research / Exploration", kind: "discovery", sourceType: "research", refKind: "library" },
  observatory: { portal: "hyperx", label: "Research / Exploration", kind: "discovery", sourceType: "research", refKind: "library" },
  channeling: { portal: "channeling", label: "Reflection / Transmission", kind: "reflection", sourceType: "transmission", refKind: "library" },
  invent: { portal: "invent", label: "Invention", kind: "creation", sourceType: "invention", refKind: "library" },
  manifest: { portal: "manifest", label: "Intention / Reflection", kind: "reflection", sourceType: "intention", refKind: "library" },
  quantum: { portal: "channeling", label: "Reflection / Transmission", kind: "reflection", sourceType: "transmission", refKind: "library" },
  healx: { portal: "channeling", label: "Reflection / Transmission", kind: "reflection", sourceType: "transmission", refKind: "library" },
};

/** Register an additional portal → type mapping at runtime. */
export function registerContentType(entry: ContentTypeEntry): void {
  REGISTRY[entry.portal] = entry;
}

export function contentTypeFor(portal: string): ContentTypeEntry {
  const hit = REGISTRY[portal];
  if (hit) return hit;
  return {
    portal,
    label: "Reflection / Transmission",
    kind: "reflection",
    sourceType: "transmission",
    refKind: "library",
  };
}

export interface ResolvedSource {
  found: boolean;
  sourceId: string | null;
  title: string;
  excerpt: string;
  cover: string | null;
  refUrl: string | null;
  sector: string | null;
}

/** Load the source the way the hall reads it — a snapshot, not the record. */
async function resolveOwnedSource(
  userId: string,
  refKind: "library" | "music",
  sourceId: string
): Promise<ResolvedSource> {
  if (refKind === "music") {
    const track = await db.musicTrack.findFirst({
      where: { id: sourceId, userId },
      select: { id: true, title: true, audioUrl: true, durationSec: true },
    });
    if (!track) return { found: false, sourceId: null, title: "", excerpt: "", cover: null, refUrl: null, sector: null };
    return {
      found: true,
      sourceId: track.id,
      title: track.title,
      excerpt: `A composition of ${Math.max(1, Math.round((track.durationSec ?? 0) / 60))} minutes, born in the music room.`,
      cover: null,
      refUrl: track.audioUrl ?? null,
      sector: "lightcodes",
    };
  }
  const entry = await db.libraryEntry.findFirst({
    where: { id: sourceId, userId },
    select: { id: true, title: true, excerpt: true, cover: true, sector: true, content: true },
  });
  if (!entry) return { found: false, sourceId: null, title: "", excerpt: "", cover: null, refUrl: null, sector: null };
  let refUrl: string | null = null;
  try {
    const parsed = JSON.parse(entry.content) as { imageUrl?: string; image?: string };
    refUrl = parsed.imageUrl ?? parsed.image ?? null;
  } catch {
    refUrl = null;
  }
  return {
    found: true,
    sourceId: entry.id,
    title: entry.title,
    excerpt: entry.excerpt,
    cover: entry.cover,
    refUrl,
    sector: entry.sector,
  };
}

/**
 * The recent-match hand: for portals whose completed transmission is
 * saved server-side after the response (the streaming rooms), the
 * maker offers the room's own sector and a title hint; the house
 * finds the newest entry born within the window. Ownership is still
 * absolute — only the caller's own shelf is searched.
 */
async function resolveRecentSource(
  userId: string,
  sector: string,
  titleHint: string | null,
  maxAgeMin: number
): Promise<ResolvedSource> {
  const since = new Date(Date.now() - maxAgeMin * 60 * 1000);
  /* the music room keeps its works in MusicTrack, not LibraryEntry —
     the recent-match hand reads both shelves honestly */
  if (sector === "lightcodes") {
    const track = await db.musicTrack.findFirst({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, audioUrl: true, durationSec: true },
    });
    if (track) {
      return {
        found: true,
        sourceId: track.id,
        title: track.title,
        excerpt: `A composition of ${Math.max(1, Math.round((track.durationSec ?? 0) / 60))} minutes, born in the music room.`,
        cover: null,
        refUrl: track.audioUrl ?? null,
        sector: "lightcodes",
      };
    }
    return { found: false, sourceId: null, title: "", excerpt: "", cover: null, refUrl: null, sector };
  }
  const rows = await db.libraryEntry.findMany({
    where: { userId, sector, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, title: true, excerpt: true, cover: true, sector: true },
  });
  const hint = (titleHint ?? "").trim().toLowerCase();
  const hit = hint
    ? rows.find((r) => r.title.toLowerCase().includes(hint) || hint.includes(r.title.toLowerCase().slice(0, 24)))
    : rows[0];
  if (!hit) return { found: false, sourceId: null, title: "", excerpt: "", cover: null, refUrl: null, sector };
  return { found: true, sourceId: hit.id, title: hit.title, excerpt: hit.excerpt, cover: hit.cover, refUrl: null, sector: hit.sector };
}

export interface PublishInput {
  userId: string;
  actorName: string;
  sourcePortal: string;
  title: string;
  body?: string | null;
  question?: string | null;
  introduction?: string | null;
  visibility: PublicationVisibility;
  circleId?: string | null;
  epistemic?: EpistemicLabel | null;
  tags?: string | null;
  sourceId?: string | null;
  refKind?: "library" | "music" | null;
  cover?: string | null;
  refUrl?: string | null;
  /** recent-match fallback fields (streaming rooms) */
  recentSector?: string | null;
  titleHint?: string | null;
  maxAgeMin?: number;
  correlationId?: string | null;
}

export type PublishResult =
  | { ok: true; postId: string; deduplicated: boolean }
  | { ok: false; code: "source_not_found" | "not_circle_member" | "bad_visibility" | "empty_offering"; message: string };

export async function publishToGathering(input: PublishInput): Promise<PublishResult> {
  const type = contentTypeFor(input.sourcePortal);

  if (!PUBLICATION_VISIBILITIES.includes(input.visibility)) {
    return { ok: false, code: "bad_visibility", message: "The offering's audience is not a known one." };
  }

  /* -------- resolve the source (explicit id wins, recent-match falls back) */
  let source: ResolvedSource = {
    found: false,
    sourceId: null,
    title: "",
    excerpt: "",
    cover: input.cover ?? null,
    refUrl: input.refUrl ?? null,
    sector: input.recentSector ?? null,
  };
  if (input.sourceId && input.refKind) {
    source = await resolveOwnedSource(input.userId, input.refKind, input.sourceId);
    if (!source.found) {
      return { ok: false, code: "source_not_found", message: "That creation is not on your shelf." };
    }
  } else if (input.recentSector) {
    source = await resolveRecentSource(
      input.userId,
      input.recentSector,
      input.titleHint ?? null,
      input.maxAgeMin ?? 15
    );
  }

  /* -------- idempotency: one source, one offering per maker -------- */
  if (source.sourceId) {
    const existing = await db.gatheringPost.findUnique({
      where: {
        userId_sourcePortal_sourceId: {
          userId: input.userId,
          sourcePortal: type.portal,
          sourceId: source.sourceId,
        },
      },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== "removed") {
      return { ok: true, postId: existing.id, deduplicated: true };
    }
  }

  /* -------- circle visibility demands real membership -------- */
  if (input.visibility === "circle") {
    if (!input.circleId) {
      return { ok: false, code: "not_circle_member", message: "Choose the circle this offering belongs to." };
    }
    const member = await db.networkCircleMember.findFirst({
      where: { circleId: input.circleId, userId: input.userId },
      select: { id: true },
    });
    if (!member) {
      return { ok: false, code: "not_circle_member", message: "Only a circle's own may hang inside it." };
    }
  }

  /* -------- compose the offering's snapshot -------- */
  const title = (input.title || source.title || "").trim().slice(0, 140);
  const parts: string[] = [];
  if (input.introduction?.trim()) parts.push(input.introduction.trim().slice(0, 600));
  const baseBody = (input.body ?? source.excerpt ?? "").trim();
  if (baseBody) parts.push(baseBody.slice(0, 4000));
  if (input.question?.trim()) parts.push(`A question for the hall: ${input.question.trim().slice(0, 300)}`);
  const body = parts.join("\n\n").slice(0, 4400);
  if (!title && !body) {
    return { ok: false, code: "empty_offering", message: "An offering needs at least a title or a few words." };
  }

  await emitEvent(
    {
      type: EVENT_TYPES.publicationRequested,
      actorType: "user",
      actorId: input.userId,
      source: "publication-service",
      correlationId: input.correlationId ?? null,
      payload: { portal: type.portal, visibility: input.visibility },
    },
    { dedupeKey: `pub_req_${input.userId}_${type.portal}_${source.sourceId ?? randomUUID().slice(0, 8)}` }
  );

  const post = await db.gatheringPost.create({
    data: {
      userId: input.userId,
      kind: type.kind,
      title: title || "An offering without a name",
      body,
      sector: source.sector ?? type.portal,
      circleId: input.visibility === "circle" ? input.circleId ?? null : null,
      tags: input.tags ?? null,
      sourcePortal: type.portal,
      sourceType: type.sourceType,
      sourceId: source.sourceId,
      refKind: source.sourceId ? (input.refKind ?? type.refKind) : null,
      refUrl: source.refUrl,
      cover: source.cover,
      visibility: input.visibility,
      epistemic: input.epistemic ?? null,
      status: "published",
    },
    select: { id: true },
  });

  await emitEvent(
    {
      type: EVENT_TYPES.publicationPublished,
      actorType: "user",
      actorId: input.userId,
      source: "publication-service",
      correlationId: input.correlationId ?? null,
      payload: { postId: post.id, portal: type.portal, contentType: type.label, visibility: input.visibility },
    },
    { dedupeKey: `pub_done_${post.id}` }
  );

  await db.auditRecord.create({
    data: {
      actorType: "user",
      actorId: input.userId,
      action: "publication.publish",
      resourceType: "gathering_post",
      resourceId: post.id,
      meta: JSON.stringify({
        portal: type.portal,
        contentType: type.label,
        sourceId: source.sourceId,
        visibility: input.visibility,
      }),
    },
  });

  return { ok: true, postId: post.id, deduplicated: false };
}

export async function editPublication(
  userId: string,
  postId: string,
  patch: { title?: string; body?: string; visibility?: PublicationVisibility; epistemic?: EpistemicLabel | null; tags?: string | null }
): Promise<boolean> {
  const owned = await db.gatheringPost.findFirst({
    where: { id: postId, userId },
    select: { id: true, circleId: true },
  });
  if (!owned) return false;
  if (patch.visibility === "circle") {
    if (!owned.circleId) return false; /* circle move needs a real target; handled by callers with circleId */
  }
  await db.gatheringPost.update({
    where: { id: postId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title.trim().slice(0, 140) || "An offering without a name" } : {}),
      ...(patch.body !== undefined ? { body: patch.body.slice(0, 4400) } : {}),
      ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
      ...(patch.epistemic !== undefined ? { epistemic: patch.epistemic } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
    },
  });
  await emitEvent(
    {
      type: EVENT_TYPES.publicationEdited,
      actorType: "user",
      actorId: userId,
      source: "publication-service",
      payload: { postId },
    },
    { dedupeKey: `pub_edit_${postId}_${Date.now()}` }
  );
  await db.auditRecord.create({
    data: {
      actorType: "user",
      actorId: userId,
      action: "publication.edit",
      resourceType: "gathering_post",
      resourceId: postId,
      meta: JSON.stringify({ fields: Object.keys(patch) }),
    },
  });
  return true;
}

export async function deletePublication(userId: string, postId: string): Promise<boolean> {
  const owned = await db.gatheringPost.findFirst({
    where: { id: postId, userId },
    select: { id: true, sourceId: true },
  });
  if (!owned) return false;
  await db.gatheringPost.delete({ where: { id: postId } });
  await emitEvent(
    {
      type: EVENT_TYPES.publicationDeleted,
      actorType: "user",
      actorId: userId,
      source: "publication-service",
      payload: { postId },
    },
    { dedupeKey: `pub_del_${postId}_${Date.now()}` }
  );
  await db.auditRecord.create({
    data: {
      actorType: "user",
      actorId: userId,
      action: "publication.delete",
      resourceType: "gathering_post",
      resourceId: postId,
      meta: null,
    },
  });
  return true;
}

/** What has this maker already hung? (prevents duplicate publications in UI) */
export async function publicationsBySource(userId: string, sourceIds: string[]): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set();
  const rows = await db.gatheringPost.findMany({
    where: { userId, sourceId: { in: sourceIds }, status: "published" },
    select: { sourceId: true },
  });
  return new Set(rows.map((r) => r.sourceId).filter((v): v is string => Boolean(v)));
}
