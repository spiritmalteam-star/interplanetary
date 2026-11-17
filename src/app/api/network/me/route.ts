import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import {
  networkName,
  readNetworkPrefs,
  splitList,
  wallIdsFor,
} from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE VISITOR'S OWN IDENTITY IN THE NETWORK                          */
/*                                                                     */
/*  GET  /api/network/me — who the visitor is here: their name, their  */
/*         introduction, their quiet counts, their unread bell.        */
/*  PATCH /api/network/me — the introduction's own hand: bio, fields   */
/*         of curiosity, creative disciplines, visibility.             */
/* ------------------------------------------------------------------ */

async function meShape(userId: string) {
  const [profile, posts, circles, projects, connections, unread] = await Promise.all([
    db.networkProfile.findUnique({ where: { userId } }),
    db.gatheringPost.count({ where: { userId } }),
    db.networkCircleMember.count({ where: { userId } }),
    db.networkProjectMember.count({ where: { userId } }),
    db.networkConnection.count({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    }),
    db.networkNotification.count({ where: { userId, readAt: null } }),
  ]);

  const pendingIn = await db.networkConnection.count({
    where: { addresseeId: userId, status: "pending" },
  });

  return {
    id: userId,
    name: null, // filled by the caller from the visitor row
    bio: profile?.bio ?? null,
    interests: splitList(profile?.interests),
    disciplines: splitList(profile?.disciplines),
    visibility: profile?.visibility ?? "public",
    prefs: readNetworkPrefs(profile?.prefs),
    since: profile?.createdAt ?? null,
    counts: {
      posts,
      circles,
      projects,
      connections,
      pendingIn,
      unreadNotifications: unread,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const walls = await wallIdsFor(visitor.user.id);
    const me = await meShape(visitor.user.id);
    const isAnon =
      visitor.user.provider === "anon" || visitor.user.email.startsWith("anon:");
    return withAnonCookie(
      NextResponse.json({
        me: {
          ...me,
          name: networkName(visitor.user),
          /* the landing passage — the two profiles are one: a signed-in
             maker carries the house's own email here; a quiet guest
             carries nothing personal at all */
          email: isAnon ? null : visitor.user.email,
          anon: isAnon,
        },
        anon: isAnon,
        walls: Array.from(walls),
      }),
      visitor
    );
  } catch (err) {
    console.error("network me GET failed", err);
    return NextResponse.json({ error: "The mirror could not be read." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:me:${visitor.user.id}`, { limit: 12, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
    }

    const raw = (await req.json().catch(() => null)) as {
      bio?: unknown;
      interests?: unknown;
      disciplines?: unknown;
      visibility?: unknown;
      name?: unknown;
      prefs?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The introduction arrived unreadable." }, { status: 400 });
    }

    const bio =
      typeof raw.bio === "string"
        ? raw.bio.trim().slice(0, 600)
        : undefined;
    const interests =
      typeof raw.interests === "string" ? raw.interests.trim().slice(0, 300) : undefined;
    const disciplines =
      typeof raw.disciplines === "string" ? raw.disciplines.trim().slice(0, 300) : undefined;
    const visibility = raw.visibility === "public" || raw.visibility === "private" ? raw.visibility : undefined;

    const data: Record<string, string> = {};
    if (bio !== undefined) data.bio = bio;
    if (interests !== undefined) data.interests = interests;
    if (disciplines !== undefined) data.disciplines = disciplines;
    if (visibility !== undefined) data.visibility = visibility;

    /* the bell's own manners — four honest switches, merged over the
       previous setting so a partial hand never silences the rest */
    let prefs: Prisma.InputJsonValue | undefined;
    if (raw.prefs && typeof raw.prefs === "object") {
      const existing = await db.networkProfile.findUnique({
        where: { userId: visitor.user.id },
        select: { prefs: true },
      });
      const prev = readNetworkPrefs(existing?.prefs);
      const next = raw.prefs as Record<string, unknown>;
      prefs = {
        resonance:
          typeof next.resonance === "boolean" ? next.resonance : prev.resonance,
        echoes: typeof next.echoes === "boolean" ? next.echoes : prev.echoes,
        connections:
          typeof next.connections === "boolean"
            ? next.connections
            : prev.connections,
        library: typeof next.library === "boolean" ? next.library : prev.library,
      } as Prisma.InputJsonValue;
    }

    /* a keeper may also wear a chosen name in the network — the same
       rule the hall speaks: between 2 and 40 letters */
    let nameChanged = false;
    if (typeof raw.name === "string") {
      const trimmed = raw.name.trim();
      if (trimmed.length >= 2 && trimmed.length <= 40) {
        await db.user.update({
          where: { id: visitor.user.id },
          data: { name: trimmed },
        });
        nameChanged = true;
      }
    }

    if (Object.keys(data).length > 0 || prefs !== undefined) {
      await db.networkProfile.upsert({
        where: { userId: visitor.user.id },
        create: {
          userId: visitor.user.id,
          ...data,
          ...(prefs !== undefined ? { prefs } : {}),
        },
        update: {
          ...data,
          ...(prefs !== undefined ? { prefs } : {}),
        },
      });
    }

    const me = await meShape(visitor.user.id);
    const fresh = nameChanged
      ? await db.user.findUnique({ where: { id: visitor.user.id }, select: { name: true, email: true, provider: true } })
      : null;
    const isAnon =
      visitor.user.provider === "anon" || visitor.user.email.startsWith("anon:");

    return withAnonCookie(
      NextResponse.json({
        ok: true,
        me: {
          ...me,
          name: fresh ? networkName(fresh) : networkName(visitor.user),
          email: isAnon ? null : visitor.user.email,
          anon: isAnon,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network me PATCH failed", err);
    return NextResponse.json({ error: "The introduction could not be written." }, { status: 500 });
  }
}
