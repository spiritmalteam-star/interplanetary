import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { networkName, splitList, wallIdsFor, type PersonCard } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ENCOUNTERS' DOOR — GET /api/network/people                         */
/*                                                                     */
/*  Real makers only: a person appears here because they hung an       */
/*  offering in the hall, wove a project or introduced themselves —    */
/*  never because a number says they should. The quiet walls hold:     */
/*  a closed door reads no one behind it.                              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 60);
    const take = Math.min(40, Math.max(6, Number(url.searchParams.get("take") ?? 24)));

    const walls = await wallIdsFor(visitor.user.id);

    /* the real makers: anyone whose words or work already stand in the
       network — profiles, offerings, circles, projects, the library */
    const [withPosts, withProfiles, withCircles, withProjects, withLibrary] = await Promise.all([
      db.gatheringPost.findMany({ select: { userId: true }, distinct: ["userId"] }),
      db.networkProfile.findMany({ where: { visibility: "public" }, select: { userId: true } }),
      db.networkCircleMember.findMany({ select: { userId: true }, distinct: ["userId"] }),
      db.networkProjectMember.findMany({ select: { userId: true }, distinct: ["userId"] }),
      db.networkLibraryItem.findMany({ select: { userId: true }, distinct: ["userId"] }),
    ]);

    const ids = new Set<string>();
    for (const row of [...withPosts, ...withProfiles, ...withCircles, ...withProjects, ...withLibrary]) {
      if (row.userId !== visitor.user.id && !walls.has(row.userId)) ids.add(row.userId);
    }
    const all = Array.from(ids);
    if (all.length === 0) {
      return withAnonCookie(NextResponse.json({ people: [] as PersonCard[] }), visitor);
    }

    const rows = await db.user.findMany({
      where: { id: { in: all } },
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        image: true,
        networkProfile: { select: { bio: true, interests: true, disciplines: true, visibility: true } },
      },
      take: 200,
    });

    const [posts, circles, projects] = await Promise.all([
      db.gatheringPost.groupBy({ by: ["userId"], where: { userId: { in: all } }, _count: { _all: true } }),
      db.networkCircleMember.groupBy({ by: ["userId"], where: { userId: { in: all } }, _count: { _all: true } }),
      db.networkProjectMember.groupBy({ by: ["userId"], where: { userId: { in: all } }, _count: { _all: true } }),
    ]);
    const postCount = new Map(posts.map((p) => [p.userId, p._count._all]));
    const circleCount = new Map(circles.map((c) => [c.userId, c._count._all]));
    const projectCount = new Map(projects.map((p) => [p.userId, p._count._all]));

    const lowered = q.toLowerCase();
    const people: PersonCard[] = rows
      .map((u) => ({
        id: u.id,
        name: networkName(u),
        image: u.image ?? null,
        anon: u.provider === "anon",
        bio: u.networkProfile?.bio ?? null,
        interests: splitList(u.networkProfile?.interests),
        disciplines: splitList(u.networkProfile?.disciplines),
        postCount: postCount.get(u.id) ?? 0,
        circleCount: circleCount.get(u.id) ?? 0,
        projectCount: projectCount.get(u.id) ?? 0,
      }))
      .filter((p) => {
        if (!lowered) return true;
        return (
          p.name.toLowerCase().includes(lowered) ||
          (p.bio ?? "").toLowerCase().includes(lowered) ||
          p.interests.some((i) => i.toLowerCase().includes(lowered)) ||
          p.disciplines.some((d) => d.toLowerCase().includes(lowered))
        );
      })
      .sort((a, b) => b.postCount + b.projectCount - (a.postCount + a.projectCount))
      .slice(0, take);

    return withAnonCookie(NextResponse.json({ people }), visitor);
  } catch (err) {
    console.error("network people GET failed", err);
    return NextResponse.json({ error: "The encounters could not be read." }, { status: 500 });
  }
}
