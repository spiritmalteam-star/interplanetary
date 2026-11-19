import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { ensureWallet } from "@/lib/server/wallet";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import {
  clampCount,
  createMusicJob,
  perTrackCost,
  settleMusicJob,
  viewOfJob,
} from "@/lib/server/music/job";
import type { StudioTuning } from "@/lib/server/music/interpreter";
import { db } from "@/lib/db";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  THE DURABLE GENERATION — POST /api/music/generate                   */
/*                                                                      */
/*  A generation that can never eat a paid-for song: the job and every  */
/*  track row are written before the first submission, each completed   */
/*  song is persisted the moment it lands, and each track carries its   */
/*  own light-hold. GET (?jobId) settles and returns one job.           */
/*                                                                      */
/*  Charging: per track, once. chargedIndexes on the job is the book    */
/*  of what is held; a resume charges only what is not in it.           */
/* ------------------------------------------------------------------ */

interface GenerateBody {
  mode?: string;
  intention?: string;
  civilization?: string | null;
  shape?: Record<string, unknown> | null;
  studio?: StudioTuning | null;
  userLyrics?: string;
  instrumental?: boolean;
  language?: string;
  count?: number;
}

async function requireVisitor(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  if (visitor.user.id.startsWith("stateless:")) {
    return {
      visitor,
      error: withAnonCookie(
        NextResponse.json(
          {
            error: "The shelf rests while the vault rests — no place yet to keep your songs.",
            code: "shelf_unavailable",
          },
          { status: 503 }
        ),
        visitor
      ),
    };
  }
  return { visitor, error: null };
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  try {
    const gate = rateLimit(`music-gen:${requestIp(req)}`, GATES.ai);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The sky needs a breath. Try again in a moment." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const { visitor, error } = await requireVisitor(req);
    if (error) return error;
    const userId = visitor.user.id;

    const body = (await req.json().catch(() => null)) as GenerateBody | null;
    if (!body) {
      return withAnonCookie(
        NextResponse.json({ error: "The chamber received nothing to interpret." }, { status: 400 }),
        visitor
      );
    }

    const count = clampCount(body.count);
    const cost = perTrackCost() * count;

    /* the honest weigh — before anything is asked of the engine */
    try {
      const wallet = await ensureWallet(userId);
      if (wallet.total < cost) {
        return withAnonCookie(
          NextResponse.json(
            {
              error: "INSUFFICIENT_CREDITS",
              required: cost,
              current: wallet.total,
              planTier: wallet.planTier,
              actionType: "LIGHT_CODES",
            },
            { status: 402 }
          ),
          visitor
        );
      }
    } catch (err) {
      console.error("[music/generate] wallet rested:", err instanceof Error ? err.message : err);
      return withAnonCookie(
        NextResponse.json(
          { error: "The purse could not be weighed — rest a breath and ask again.", code: "wallet_unavailable" },
          { status: 503 }
        ),
        visitor
      );
    }

    const { view, interpretation } = await createMusicJob({
      visitorId: userId,
      userId,
      mode: String(body.mode ?? "light-transmission").slice(0, 60),
      intention: String(body.intention ?? "").slice(0, 600),
      civilization: body.civilization ? String(body.civilization).slice(0, 60) : null,
      language: body.language ? String(body.language).slice(0, 12) : null,
      shape: body.shape ?? null,
      studio: body.studio ?? null,
      userLyrics: body.userLyrics ? String(body.userLyrics).slice(0, 600) : null,
      instrumental: body.instrumental === true,
      count,
    });

    console.info(
      `[music/generate] job ${view.id} created (${count} songs) in ${Date.now() - started}ms`
    );
    return withAnonCookie(NextResponse.json({ job: view, interpretation }), visitor);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "nokey") {
      return NextResponse.json(
        {
          error:
            "The chamber is tuned, but the sound engine's key is not yet placed. Add SUNO_API_KEY in the environment vault, and the transmissions will sound.",
          code: "nokey",
        },
        { status: 501 }
      );
    }
    console.error("[music/generate] failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { visitor, error } = await requireVisitor(req);
    if (error) return error;
    const userId = visitor.user.id;

    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return withAnonCookie(
        NextResponse.json({ error: "No job was named." }, { status: 400 }),
        visitor
      );
    }
    await settleMusicJob(jobId, userId);
    const job = await db.musicGenerationJob.findUnique({
      where: { id: jobId },
      include: { tracks: true },
    });
    if (!job || job.visitorId !== userId) {
      return withAnonCookie(
        NextResponse.json({ error: "That generation is not on your shelf." }, { status: 404 }),
        visitor
      );
    }
    return withAnonCookie(NextResponse.json({ job: viewOfJob(job) }), visitor);
  } catch (err) {
    console.error("[music/generate] poll failed:", err);
    return NextResponse.json({ error: "The shelf could not be read." }, { status: 500 });
  }
}
