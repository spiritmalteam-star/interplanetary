import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE DISCOVER CURRENT — /api/discover                               */
/*                                                                     */
/*  One current, six mouths:                                           */
/*    for-you   · a personal blend, never popularity alone             */
/*    people    · the makers' directory                                */
/*    creations · the unified gallery of published works               */
/*    circles   · the communities                                      */
/*    projects  · the collaborative works seeking hands                */
/*    knowledge · the indexed public contributions, labeled            */
/*    mine      · the caller's own creations (publication picker)      */
/*                                                                     */
/*  Every mouth enforces visibility at retrieval time. Private rows    */
/*  never enter a public answer — not by omission, by construction.    */
/* ------------------------------------------------------------------ */

const TAKE_MAX = 48;

/* the knowledge filter accepts every honest label of the evidence
   ladder — the same vocabulary the hall's own walls speak */
const EPISTEMIC_FILTERS = [
  "established",
  "preliminary",
  "hypothesis",
  "personal",
  "philosophical",
  "interpretation",
  "creative",
  "disputed",
];

function cleanTake(url: URL): number {
  const n = Number(url.searchParams.get("take") ?? 18);
  return Math.min(TAKE_MAX, Math.max(3, Number.isFinite(n) ? Math.floor(n) : 18));
}
function cleanQ(url: URL): string {
  return (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 80);
}
function cleanCursor(url: URL): Date | null {
  const raw = url.searchParams.get("cursor");
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function acceptedConnectionIds(userId: string): Promise<Set<string>> {
  const rows = await db.networkConnection.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) ids.add(r.requesterId === userId ? r.addresseeId : r.requesterId);
  return ids;
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const limit = rateLimit(`discover:${visitor.user.id}`, { limit: 120, windowMs: 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: "The current rests a moment." }, { status: 429 });
    }
    const url = new URL(req.url);
    const dest = url.searchParams.get("dest") ?? "for-you";
    const q = cleanQ(url);
    const take = cleanTake(url);
    const cursor = cleanCursor(url);
    const userId = visitor.user.id;
    const walls = await wallIdsFor(userId);
    const connIds = await acceptedConnectionIds(userId);

    /* ------------------------- for you ------------------------- */
    if (dest === "for-you") {
      const profile = await db.networkProfile.findUnique({ where: { userId } });
      const interests = (profile?.interests ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6);

      const [creations, makers, circles, projects, knowledge, themeRows] = await Promise.all([
        db.gatheringPost.findMany({
          where: {
            status: "published",
            OR: [
              { visibility: "public" },
              { visibility: "connections", userId: { in: [userId, ...connIds] } },
            ],
            userId: { notIn: walls.size ? [...walls] : undefined },
            ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 18,
          select: {
            id: true, title: true, body: true, kind: true, sourceType: true, sourcePortal: true,
            cover: true, refUrl: true, tags: true, resonanceCount: true, createdAt: true, userId: true,
            user: { select: { id: true, name: true, email: true, provider: true, image: true } },
          },
        }),
        db.networkProfile.findMany({
          where: {
            visibility: "public",
            user: { id: { not: userId, notIn: walls.size ? [...walls] : undefined } },
          },
          orderBy: { updatedAt: "desc" },
          take: 24,
          select: {
            userId: true, bio: true, interests: true, disciplines: true,
            user: { select: { id: true, name: true, email: true, provider: true, image: true } },
          },
        }),
        db.networkCircle.findMany({
          where: { visibility: "public" },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, name: true, focus: true, description: true, _count: { select: { members: true, posts: true } } },
        }),
        db.networkProject.findMany({
          where: {
            ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : { seeking: true }),
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true, title: true, description: true, focus: true, status: true, seeking: true, requiredSkills: true, createdAt: true,
            owner: { select: { id: true, name: true, email: true, provider: true } },
            _count: { select: { members: true, entries: true } },
          },
        }),
        db.gatheringPost.findMany({
          where: {
            status: "published",
            epistemic: { not: null },
            visibility: "public",
            userId: { notIn: walls.size ? [...walls] : undefined },
            ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true, title: true, body: true, epistemic: true, sourceType: true, createdAt: true,
            user: { select: { id: true, name: true, email: true, provider: true } },
          },
        }),
        db.gatheringPost.findMany({
          where: { status: "published", visibility: "public", createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
          select: { tags: true },
          take: 200,
        }),
      ]);

      /* transparent blending: interest overlap first, recency second —
         never a leaderboard, never a score shown as a verdict */
      const scoredCreations = creations
        .map((p) => {
          const hay = `${p.title} ${p.body} ${p.tags ?? ""}`.toLowerCase();
          const overlap = interests.filter((i) => i.length > 2 && hay.includes(i)).length;
          return { ...p, relevance: overlap };
        })
        .sort((a, b) => b.relevance - a.relevance || b.createdAt.getTime() - a.createdAt.getTime());

      const scoredMakers = makers
        .map((m) => {
          const hay = `${m.bio ?? ""} ${m.interests ?? ""} ${m.disciplines ?? ""}`.toLowerCase();
          const overlap = interests.filter((i) => i.length > 2 && hay.includes(i)).length;
          return { ...m, relevance: overlap };
        })
        .sort((a, b) => b.relevance - a.relevance);

      const tagCounts = new Map<string, number>();
      for (const row of themeRows) {
        for (const tag of (row.tags ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      const themes = [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));

      return withAnonCookie(
        NextResponse.json({
          dest,
          interests,
          creations: scoredCreations.slice(0, 12).map((p) => ({
            id: p.id, title: p.title, preview: p.body.slice(0, 220), kind: p.kind,
            contentType: p.sourceType ?? p.kind, cover: p.cover, refUrl: p.refUrl,
            tags: p.tags, resonanceCount: p.resonanceCount, createdAt: p.createdAt,
            author: { id: p.user.id, name: networkName(p.user), image: p.user.image },
          })),
          makers: scoredMakers.slice(0, 6).map((m) => ({
            id: m.user.id, name: networkName(m.user), image: m.user.image,
            bio: m.bio?.slice(0, 120) ?? null, disciplines: m.disciplines, interests: m.interests,
          })),
          circles: circles.map((c) => ({
            id: c.id, name: c.name, focus: c.focus, description: c.description?.slice(0, 120) ?? null,
            members: c._count.members, posts: c._count.posts,
          })),
          projects: projects.map((p) => ({
            id: p.id, title: p.title, description: p.description?.slice(0, 140) ?? null, focus: p.focus,
            status: p.status, seeking: p.seeking, requiredSkills: p.requiredSkills,
            owner: { id: p.owner.id, name: networkName(p.owner) },
            members: p._count.members, entries: p._count.entries, createdAt: p.createdAt,
          })),
          knowledge: knowledge.map((k) => ({
            id: k.id, title: k.title, epistemicLabel: k.epistemic, contentType: k.sourceType ?? "reflection",
            preview: k.body.slice(0, 120), createdAt: k.createdAt,
            author: { id: k.user.id, name: networkName(k.user) },
          })),
          themes,
        }),
        visitor
      );
    }

    /* ------------------------- people -------------------------- */
    if (dest === "people") {
      const discipline = (url.searchParams.get("discipline") ?? "").trim().toLowerCase().slice(0, 40);
      const sort = url.searchParams.get("sort") === "name" ? "name" : "recent";
      const profiles = await db.networkProfile.findMany({
        where: {
          visibility: "public",
          user: { id: { not: userId, notIn: walls.size ? [...walls] : undefined } },
          ...(q
            ? {
                OR: [
                  { bio: { contains: q } },
                  { interests: { contains: q } },
                  { disciplines: { contains: q } },
                  { user: { name: { contains: q } } },
                ],
              }
            : {}),
          ...(discipline ? { disciplines: { contains: discipline } } : {}),
        },
        orderBy: sort === "name" ? { user: { name: "asc" } } : { updatedAt: "desc" },
        take: take + 6,
        select: {
          userId: true, bio: true, interests: true, disciplines: true, visibility: true, updatedAt: true,
          user: { select: { id: true, name: true, email: true, provider: true, image: true, createdAt: true } },
        },
      });

      const ids = profiles.slice(0, take + 6).map((p) => p.user.id);
      const [follows, connRows, creationCounts, projectCounts] = await Promise.all([
        db.networkFollow.findMany({ where: { followerId: userId, followingId: { in: ids } }, select: { followingId: true } }),
        db.networkConnection.findMany({
          where: { OR: [{ requesterId: userId, addresseeId: { in: ids } }, { addresseeId: userId, requesterId: { in: ids } }] },
          select: { requesterId: true, addresseeId: true, status: true },
        }),
        db.gatheringPost.groupBy({ by: ["userId"], where: { userId: { in: ids }, status: "published", visibility: "public" }, _count: true }),
        db.networkProjectMember.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: true }),
      ]);
      const followSet = new Set(follows.map((f) => f.followingId));
      const connMap = new Map<string, string>();
      for (const c of connRows) {
        const other = c.requesterId === userId ? c.addresseeId : c.requesterId;
        connMap.set(other, c.status);
      }
      const creationMap = new Map(creationCounts.map((c) => [c.userId, c._count]));
      const projectMap = new Map(projectCounts.map((c) => [c.userId, c._count]));

      return withAnonCookie(
        NextResponse.json({
          dest,
          people: profiles.slice(0, take).map((p) => ({
            id: p.user.id,
            name: networkName(p.user),
            image: p.user.image,
            bio: p.bio?.slice(0, 200) ?? null,
            interests: p.interests,
            disciplines: p.disciplines,
            joinedAt: p.user.createdAt,
            publicCreations: creationMap.get(p.user.id) ?? 0,
            sharedProjects: projectMap.get(p.user.id) ?? 0,
            following: followSet.has(p.user.id),
            connectionState: connMap.get(p.user.id) ?? null,
          })),
          hasMore: profiles.length > take,
          cursor: profiles.length > take ? profiles[take - 1].updatedAt?.toISOString() ?? null : null,
        }),
        visitor
      );
    }

    /* ------------------------ creations ------------------------ */
    if (dest === "creations") {
      const contentType = (url.searchParams.get("type") ?? "").trim().toLowerCase().slice(0, 24);
      const rows = await db.gatheringPost.findMany({
        where: {
          status: "published",
          OR: [
            { visibility: "public" },
            { visibility: "connections", userId: { in: [userId, ...connIds] } },
          ],
          userId: { notIn: walls.size ? [...walls] : undefined },
          ...(contentType ? { OR: [{ sourceType: contentType }, { kind: contentType }] } : {}),
          ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }, { tags: { contains: q } }] } : {}),
          ...(cursor ? { createdAt: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        select: {
          id: true, title: true, body: true, kind: true, sourceType: true, sourcePortal: true, sourceId: true,
          cover: true, refUrl: true, tags: true, resonanceCount: true, echoCount: true, createdAt: true,
          user: { select: { id: true, name: true, email: true, provider: true, image: true } },
        },
      });
      const hasMore = rows.length > take;
      return withAnonCookie(
        NextResponse.json({
          dest,
          creations: rows.slice(0, take).map((p) => ({
            id: p.id,
            title: p.title,
            preview: p.body.slice(0, 160),
            kind: p.kind,
            contentType: p.sourceType ?? p.kind,
            sourcePortal: p.sourcePortal,
            sourceId: p.sourceId,
            cover: p.cover,
            refUrl: p.refUrl,
            tags: p.tags,
            resonanceCount: p.resonanceCount,
            echoCount: p.echoCount,
            createdAt: p.createdAt,
            author: { id: p.user.id, name: networkName(p.user), image: p.user.image },
          })),
          hasMore,
          cursor: hasMore ? rows[take - 1].createdAt.toISOString() : null,
        }),
        visitor
      );
    }

    /* ------------------------- circles ------------------------- */
    if (dest === "circles") {
      const focus = (url.searchParams.get("focus") ?? "").trim().slice(0, 40);
      const mine = url.searchParams.get("mine") === "1";
      const memberships = await db.networkCircleMember.findMany({
        where: { userId },
        select: { circleId: true, role: true },
      });
      const joinedIds = new Set(memberships.map((m) => m.circleId));
      const rows = await db.networkCircle.findMany({
        where: {
          visibility: "public",
          ...(mine ? { id: { in: [...joinedIds] } } : {}),
          ...(focus ? { focus } : {}),
          ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }, { focus: { contains: q } }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: take + 4,
        select: {
          id: true, name: true, focus: true, description: true, createdAt: true,
          owner: { select: { id: true, name: true, email: true, provider: true } },
          _count: { select: { members: true, posts: true } },
        },
      });
      return withAnonCookie(
        NextResponse.json({
          dest,
          circles: rows.slice(0, take).map((c) => ({
            id: c.id, name: c.name, focus: c.focus, description: c.description?.slice(0, 160) ?? null,
            members: c._count.members, posts: c._count.posts, joined: joinedIds.has(c.id),
            owner: { id: c.owner.id, name: networkName(c.owner) },
            createdAt: c.createdAt,
          })),
          hasMore: rows.length > take,
        }),
        visitor
      );
    }

    /* ------------------------ projects ------------------------- */
    if (dest === "projects") {
      const status = (url.searchParams.get("status") ?? "").trim().slice(0, 12);
      const seekingOnly = url.searchParams.get("seeking") === "1";
      const rows = await db.networkProject.findMany({
        where: {
          ...(status && ["open", "weaving", "published"].includes(status) ? { status } : {}),
          ...(seekingOnly ? { seeking: true } : {}),
          ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { requiredSkills: { contains: q } }] } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: take + 4,
        select: {
          id: true, title: true, description: true, focus: true, status: true, seeking: true, requiredSkills: true,
          seedPostId: true, createdAt: true, updatedAt: true,
          owner: { select: { id: true, name: true, email: true, provider: true, image: true } },
          members: { select: { userId: true, role: true } },
          _count: { select: { members: true, entries: true } },
        },
      });
      const myMemberships = new Set(rows.filter((r) => r.members.some((m) => m.userId === userId)).map((r) => r.id));
      return withAnonCookie(
        NextResponse.json({
          dest,
          projects: rows.slice(0, take).map((p) => ({
            id: p.id, title: p.title, description: p.description?.slice(0, 200) ?? null, focus: p.focus,
            status: p.status, seeking: p.seeking, requiredSkills: p.requiredSkills,
            owner: { id: p.owner.id, name: networkName(p.owner), image: p.owner.image },
            members: p._count.members, entries: p._count.entries,
            joined: myMemberships.has(p.id), isOwner: p.owner.id === userId,
            createdAt: p.createdAt, updatedAt: p.updatedAt,
          })),
          hasMore: rows.length > take,
        }),
        visitor
      );
    }

    /* ------------------------ knowledge ------------------------ */
    if (dest === "knowledge") {
      const epistemic = (url.searchParams.get("epistemic") ?? "").trim().toLowerCase().slice(0, 16);
      const rows = await db.gatheringPost.findMany({
        where: {
          status: "published",
          epistemic: { not: null },
          ...(epistemic && EPISTEMIC_FILTERS.includes(epistemic) ? { epistemic } : {}),
          OR: [
            { visibility: "public" },
            { visibility: "connections", userId: { in: [userId, ...connIds] } },
          ],
          userId: { notIn: walls.size ? [...walls] : undefined },
          ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }, { tags: { contains: q } }] } : {}),
          ...(cursor ? { createdAt: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        select: {
          id: true, title: true, body: true, epistemic: true, sourceType: true, sourcePortal: true,
          tags: true, resonanceCount: true, createdAt: true,
          user: { select: { id: true, name: true, email: true, provider: true } },
        },
      });
      const hasMore = rows.length > take;
      return withAnonCookie(
        NextResponse.json({
          dest,
          knowledge: rows.slice(0, take).map((k) => ({
            id: k.id, title: k.title, preview: k.body.slice(0, 200), epistemicLabel: k.epistemic,
            contentType: k.sourceType ?? "reflection", sourcePortal: k.sourcePortal, tags: k.tags,
            resonanceCount: k.resonanceCount, createdAt: k.createdAt,
            author: { id: k.user.id, name: networkName(k.user) },
          })),
          hasMore,
          cursor: hasMore ? rows[take - 1].createdAt.toISOString() : null,
        }),
        visitor
      );
    }

    /* -------------------------- mine ---------------------------- */
    if (dest === "mine") {
      /* the publication picker: the caller's own shelf, every room */
      const [library, tracks] = await Promise.all([
        db.libraryEntry.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: { id: true, sector: true, title: true, excerpt: true, cover: true, createdAt: true },
        }),
        db.musicTrack.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, title: true, audioUrl: true, durationSec: true, createdAt: true },
        }),
      ]);
      const hung = await db.gatheringPost.findMany({
        where: { userId, sourceId: { not: null }, status: "published" },
        select: { sourceId: true },
      });
      const hungSet = new Set(hung.map((h) => h.sourceId));
      return withAnonCookie(
        NextResponse.json({
          dest,
          creations: library.map((e) => ({
            sourceKind: "library" as const,
            sourceId: e.id,
            sector: e.sector,
            title: e.title,
            preview: e.excerpt?.slice(0, 140) ?? "",
            cover: e.cover,
            refUrl: null,
            createdAt: e.createdAt,
            published: hungSet.has(e.id),
          })),
          tracks: tracks.map((t) => ({
            sourceKind: "music" as const,
            sourceId: t.id,
            sector: "lightcodes",
            title: t.title,
            preview: t.durationSec ? `${Math.round(t.durationSec / 60)} min` : "A composition",
            cover: null,
            refUrl: t.audioUrl,
            createdAt: t.createdAt,
            published: hungSet.has(t.id),
          })),
        }),
        visitor
      );
    }

    return NextResponse.json({ error: "That mouth of the current is not a known one." }, { status: 400 });
  } catch (err) {
    console.error("[discover] failed:", err);
    return NextResponse.json({ error: "The current is momentarily quiet." }, { status: 500 });
  }
}
