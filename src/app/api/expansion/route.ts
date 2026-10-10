import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { db } from "@/lib/db";
import { studyExpansion, type ExpansionEventLite } from "@/lib/expansion-core";

/* ------------------------------------------------------------------ */
/*  /api/expansion — the Expansion Mirror's keeper.                    */
/*                                                                     */
/*  GET  — the visitor's studied mirror: the score, the stage, the     */
/*         signals, the recent continuations. Every visitor is         */
/*         answered — signed passage and anonymous keeper alike.       */
/*  POST — one event of the walk (a pick, a transmission, a grow).     */
/*         The keeper studies the whole continuation stream and        */
/*         proceeds the score that lets a profile notice its own       */
/*         progression, digitally.                                     */
/* ------------------------------------------------------------------ */

const EVENTS_KEPT = 400;

async function readMirror(userId: string) {
  const [profile, events] = await Promise.all([
    db.expansionProfile.findUnique({ where: { userId } }),
    db.expansionEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: EVENTS_KEPT,
    }),
  ]);

  const lite: ExpansionEventLite[] = events
    .slice()
    .reverse()
    .map((e) => ({
      kind: e.kind as ExpansionEventLite["kind"],
      scope: e.scope,
      movement: e.movement,
      at: e.createdAt.getTime(),
    }));

  const studied = studyExpansion(lite, profile?.score ?? 0);

  /* the server's own reading always carries the last stored delta so
     the profile can notice growth between visits */
  const mirror = {
    ...studied,
    delta: profile ? studied.score - profile.score : 0,
    updatedAt: Date.now(),
  };
  return { mirror, recent: lite.slice(-24).reverse() };
}

async function writeMirror(userId: string) {
  const { mirror } = await readMirror(userId);
  await db.expansionProfile.upsert({
    where: { userId },
    create: {
      userId,
      score: mirror.score,
      stage: mirror.stage,
      breadth: mirror.signals.breadth,
      depth: mirror.signals.depth,
      harmony: mirror.signals.harmony,
      constancy: mirror.signals.constancy,
      creation: mirror.signals.creation,
      totalPicks: mirror.totalPicks,
      chains: mirror.chains,
      deepestChain: mirror.deepestChain,
      delta: mirror.delta,
    },
    update: {
      score: mirror.score,
      stage: mirror.stage,
      breadth: mirror.signals.breadth,
      depth: mirror.signals.depth,
      harmony: mirror.signals.harmony,
      constancy: mirror.signals.constancy,
      creation: mirror.signals.creation,
      totalPicks: mirror.totalPicks,
      chains: mirror.chains,
      deepestChain: mirror.deepestChain,
      delta: mirror.delta,
    },
  });
  return mirror;
}

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ mirror: null }), visitor);
    }
    const { mirror, recent } = await readMirror(visitor.user.id);
    return withAnonCookie(NextResponse.json({ mirror, recent }), visitor);
  } catch (err) {
    console.error(
      "[expansion] the mirror rests:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ mirror: null }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ mirror: null }), visitor);
    }
    const body = (await req.json().catch(() => ({}))) as {
      kind?: string;
      scope?: string | null;
      movement?: string | null;
    };
    const kind =
      body.kind === "transmission" || body.kind === "grow" ? body.kind : "pick";
    const scope =
      typeof body.scope === "string" && body.scope.trim()
        ? body.scope.trim().slice(0, 80)
        : null;
    const movement =
      typeof body.movement === "string" && body.movement.trim()
        ? body.movement.trim().slice(0, 40)
        : null;

    await db.expansionEvent.create({
      data: { userId: visitor.user.id, kind, scope, movement },
    });

    /* keep the continuation stream lean — the study reads 400, the
       stream keeps 4x that at most */
    const count = await db.expansionEvent.count({
      where: { userId: visitor.user.id },
    });
    if (count > EVENTS_KEPT * 4) {
      const oldest = await db.expansionEvent.findMany({
        where: { userId: visitor.user.id },
        orderBy: { createdAt: "asc" },
        take: count - EVENTS_KEPT * 4,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await db.expansionEvent.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        });
      }
    }

    const mirror = await writeMirror(visitor.user.id);
    return withAnonCookie(NextResponse.json({ mirror }), visitor);
  } catch (err) {
    console.error(
      "[expansion] the event could not rest:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ mirror: null }, { status: 200 });
  }
}
