import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  removeAudioFromVault,
  sweepStaleWeaveJobs,
} from "@/lib/server/music-vault";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  /api/music-library — the music room's own vault shelf.             */
/*                                                                     */
/*  GET    — the passage's kept sounds (newest first, a hundred at     */
/*           most) plus the weave jobs still standing "processing"     */
/*           (younger than a day), so a visitor who refreshed          */
/*           mid-weave can find the thread again and watch it land.    */
/*           A weave the house never heard back from is swept to       */
/*           "failed" here, its drawn light returned — once.           */
/*  PATCH  — { id, favorite } — the owner's heart on one row.          */
/*  DELETE — ?id= — the owner's hand forgets: the row and its bytes.   */
/*                                                                     */
/*  THE SIGNED LAW: the shelf opens only to a signed passage. An       */
/*  anonymous or stateless keeper is answered 401 SIGN_IN_REQUIRED —   */
/*  their keeping lives on their own device, exactly as it always has. */
/*  Ownership rides the database row alone; every write re-checks it.  */
/* ------------------------------------------------------------------ */

const SIGN_IN_REQUIRED = { error: "SIGN_IN_REQUIRED" };

/** A shelf row as the room hears it — nothing but the honest shape. */
function trackView(t: {
  id: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  status: string;
  favorite: boolean;
  createdAt: Date;
}) {
  return {
    id: t.id,
    title: t.title,
    audioUrl: t.audioUrl,
    durationSec: t.durationSec,
    status: t.status,
    favorite: t.favorite,
    createdAt: t.createdAt.toISOString(),
  };
}

async function signedUser(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  if (
    visitor.user.email.startsWith("anon:") ||
    visitor.user.id.startsWith("stateless:")
  ) {
    return { visitor, userId: null as string | null };
  }
  return { visitor, userId: visitor.user.id };
}

export async function GET(req: NextRequest) {
  const { visitor, userId } = await signedUser(req);
  if (!userId) {
    return withAnonCookie(
      NextResponse.json(SIGN_IN_REQUIRED, { status: 401 }),
      visitor
    );
  }
  try {
    /* the sweep walks before the read — a lost weave is spoken to
       before its owner asks after it */
    await sweepStaleWeaveJobs(userId);

    const now = Date.now();
    const [tracks, processing, freshTerminal] = await Promise.all([
      db.musicTrack.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.generationJob.findMany({
        where: {
          userId,
          tool: "light_codes",
          status: "processing",
          createdAt: { gt: new Date(now - 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      /* terminal states ride home briefly, so the visitor's own
         watcher sees a weave resolve exactly once */
      db.generationJob.findMany({
        where: {
          userId,
          tool: "light_codes",
          status: { in: ["succeeded", "failed"] },
          updatedAt: { gt: new Date(now - 2 * 60 * 1000) },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    const seen = new Set<string>();
    const jobs = [...processing, ...freshTerminal]
      .filter((j) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      })
      .map((j) => ({
        id: j.id,
        status: j.status,
        providerTaskId: j.providerTaskId,
        creditsDrawn: j.creditsDrawn,
        refunded: j.refunded,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      }));

    return withAnonCookie(
      NextResponse.json({ tracks: tracks.map(trackView), jobs }),
      visitor
    );
  } catch (err) {
    console.error(
      "[music-library] the shelf could not be read:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "The shelf rests a moment. Breathe, then ask again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { visitor, userId } = await signedUser(req);
  if (!userId) {
    return withAnonCookie(
      NextResponse.json(SIGN_IN_REQUIRED, { status: 401 }),
      visitor
    );
  }
  try {
    const body = (await req.json().catch(() => null)) as {
      id?: string;
      favorite?: boolean;
    } | null;
    if (
      !body ||
      typeof body.id !== "string" ||
      !body.id ||
      typeof body.favorite !== "boolean"
    ) {
      return NextResponse.json(
        { error: "The ask must carry a row's id and a favorite heart." },
        { status: 400 }
      );
    }
    const row = await db.musicTrack.findFirst({
      where: { id: body.id, userId },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json(
        { error: "No such sound rests on your shelf." },
        { status: 404 }
      );
    }
    await db.musicTrack.update({
      where: { id: row.id },
      data: { favorite: body.favorite },
    });
    return withAnonCookie(
      NextResponse.json({ ok: true, id: row.id, favorite: body.favorite }),
      visitor
    );
  } catch (err) {
    console.error(
      "[music-library] the heart could not be laid:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "The shelf rests a moment." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { visitor, userId } = await signedUser(req);
  if (!userId) {
    return withAnonCookie(
      NextResponse.json(SIGN_IN_REQUIRED, { status: 401 }),
      visitor
    );
  }
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json(
        { error: "The ask must name the row to forget." },
        { status: 400 }
      );
    }
    const row = await db.musicTrack.findFirst({
      where: { id, userId },
      select: { id: true, localFile: true },
    });
    if (!row) {
      return NextResponse.json(
        { error: "No such sound rests on your shelf." },
        { status: 404 }
      );
    }
    if (row.localFile) {
      await removeAudioFromVault(row.localFile);
    }
    await db.musicTrack.delete({ where: { id: row.id } });
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error(
      "[music-library] the forgetting stumbled:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "The shelf rests a moment." }, { status: 500 });
  }
}
