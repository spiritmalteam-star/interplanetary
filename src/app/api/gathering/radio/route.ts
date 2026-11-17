import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { houseTrackDefs } from "@/lib/frequency-radio";

/* ------------------------------------------------------------------ */
/*  GET /api/gathering/radio — the frequency radio's shelf.            */
/*                                                                     */
/*  One hundred house works are woven into the database the first time */
/*  the radio is asked for — each named by the entity, each breathing  */
/*  on its own healing frequency (release 396, grounding 432,          */
/*  defragment 528, heart 639, theta, crown 741, aura 852, pineal      */
/*  963). The sound itself is woven locally by the visitor's own       */
/*  machine (lib/frequency-radio.ts) — the database keeps the          */
/*  definitions, never the files.                                      */
/*                                                                     */
/*  Two hands the radio plays from:                                    */
/*   · radio    — a random walk across the whole shelf: the entity's   */
/*                house works AND the music other gatherers have made  */
/*                (MusicTrack rows that stand ready), side by side.    */
/*   · playlist — the gatherer's own works only.                       */
/*                                                                     */
/*  Public JSON, so outside hands (bridges, agents) may read the       */
/*  shelf without a door of their own.                                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    /* THE FIRST ASK WOVES THE SHELF — one hundred house works, once. */
    const count = await db.gatheringTrack.count({
      where: { authorKey: null },
    });
    if (count < 100) {
      const defs = houseTrackDefs(100);
      /* the shelf is filled to its hundred, never past it — the insert
         resumes from where the last one stopped */
      const missing = 100 - count;
      await db.gatheringTrack.createMany({
        data: defs.slice(0, missing).map((d) => ({
          title: d.title,
          intent: d.intent,
          freq: d.freq,
          seed: d.seed,
          duration: d.duration,
          authorName: "The Mirror Entity",
          authorKey: null,
        })),
      });
    }

    const visitor = await resolveVisitor(req).catch(() => null);
    if (!visitor) {
      return NextResponse.json(
        { error: "The radio's shelf is momentarily quiet." },
        { status: 500 }
      );
    }
    const viewerId = visitor && !visitor.user.anon ? visitor.user.id : null;

    /* THE HOUSE'S OWN HUNDRED — woven seeds, no files, sound born on
       the visitor's own machine. */
    const house = await db.gatheringTrack.findMany({
      where: { authorKey: null },
      take: 100,
    });

    /* THE GATHERERS' OWN MUSIC — works other hands have made, standing
       ready in the house's audio vault. They ride the radio beside the
       entity's hundred. */
    const madeMusic = await db.musicTrack.findMany({
      where: {
        status: { in: ["ready", "mirrored"] },
        audioUrl: { not: "" },
        ...(viewerId ? { userId: { not: viewerId } } : {}),
      },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    /* THE RADIO'S HAND — a shuffled walk, house and gathered works
       standing side by side. */
    const houseShaped = house.map((t) => ({
      id: t.id,
      title: t.title,
      intent: t.intent,
      freq: t.freq,
      seed: t.seed,
      duration: t.duration,
      authorName: t.authorName,
      audioUrl: null as string | null,
      own: false,
    }));
    const musicShaped = madeMusic.map((t) => ({
      id: t.id,
      title: t.title,
      intent: "music",
      freq: 0,
      seed: 0,
      duration: Math.round(t.durationSec ?? 0),
      authorName: t.user.name ?? "A gatherer",
      audioUrl: t.audioUrl,
      own: false,
    }));
    const radio = [...houseShaped, ...musicShaped]
      .sort(() => Math.random() - 0.5)
      .slice(0, 34);

    /* THE GATHERER'S OWN SHELF — every work their own hand has made. */
    const ownMusic = viewerId
      ? await db.musicTrack.findMany({
          where: {
            userId: viewerId,
            status: { in: ["ready", "mirrored"] },
            audioUrl: { not: "" },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];
    const playlist = ownMusic.map((t) => ({
      id: t.id,
      title: t.title,
      intent: "music",
      freq: 0,
      seed: 0,
      duration: Math.round(t.durationSec ?? 0),
      authorName: "You",
      audioUrl: t.audioUrl,
      own: true,
    }));

    return withAnonCookie(
      NextResponse.json(
        {
          radio,
          playlist,
          shelfTotal: houseShaped.length + musicShaped.length,
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      ),
      visitor
    );
  } catch (err) {
    console.error("[gathering/radio] failed:", err);
    return NextResponse.json(
      { error: "The radio's shelf is momentarily quiet." },
      { status: 500 }
    );
  }
}
