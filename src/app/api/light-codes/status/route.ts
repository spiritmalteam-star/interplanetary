import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refundWalletCredits } from "@/lib/server/wallet";
import { selectProvider, validateAudioUrl } from "@/lib/server/music-provider";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — status of a rendering transmission (Music Engine 2.0).*/
/*                                                                      */
/*  The status door is now the reliability heart of the pipeline:       */
/*   - it persists the finished Track the moment the engine answers     */
/*   - it validates the audio body before declaring it ready            */
/*   - when a render FAILS (or stays silent too long), the wallet's     */
/*     exact draw is refunded through the track's ledger linkage —      */
/*     nobody pays for a silence                                        */
/* ------------------------------------------------------------------ */

const REFUND_AFTER_MS = 10 * 60 * 1000; // a task silent for 10 minutes refunds

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ status: "error", error: "No task was named." }, { status: 400 });
  }
  const provider = selectProvider();
  if (!provider) {
    return NextResponse.json(
      { status: "error", error: "The sound engine's key is not placed yet." },
      { status: 501 }
    );
  }

  /* the track's own record — the source of truth for refunds & history */
  const track = await db.track.findFirst({ where: { taskId } }).catch(() => null);

  const result = await provider.poll(taskId);

  if (result.status === "ready") {
    /* output integrity — the URL must answer with real audio before we
       ever call a transmission ready */
    const check = await validateAudioUrl(result.audioUrl);
    if (!check.ok) {
      console.error("[light-codes/status] audio integrity failed:", check.reason);
      await failTrack(track, "The rendered transmission did not survive the crossing. Try again.");
      return NextResponse.json({
        status: "error",
        error: "The rendered transmission did not survive the crossing. Try again.",
        refunded: true,
      });
    }

    if (track) {
      await db.track
        .update({
          where: { id: track.id },
          data: {
            status: "ready",
            audioUrl: result.audioUrl,
            audioId: result.audioId ?? track.audioId,
            duration:
              typeof result.duration === "number" ? Math.round(result.duration) : track.duration,
            error: null,
          },
        })
        .catch(() => undefined);
    }
    return NextResponse.json({
      status: "ready",
      audioUrl: result.audioUrl,
      id: result.audioId,
      duration: result.duration,
      trackId: track?.id ?? null,
    });
  }

  if (result.status === "error") {
    await failTrack(track, result.error);
    return NextResponse.json({ status: "error", error: result.error, refunded: true });
  }

  /* still pending — but a task silent for ten minutes releases the purse */
  if (track && track.status === "pending") {
    const waited = Date.now() - new Date(track.createdAt).getTime();
    if (waited > REFUND_AFTER_MS) {
      await failTrack(
        track,
        "The transmission is taking longer than the chamber can wait. The lights return to your purse."
      );
      return NextResponse.json({
        status: "error",
        error: "The transmission is taking longer than the chamber can wait. The lights return to your purse.",
        refunded: true,
      });
    }
  }

  return NextResponse.json({ status: "pending", trackId: track?.id ?? null });
}

/** Mark a track failed and give its wallet draw back — once. */
async function failTrack(
  track:
    | {
        id: string;
        ledgerId: string | null;
        userId: string;
        error: string | null;
        status: string;
      }
    | null,
  message: string
): Promise<void> {
  if (!track) return;
  try {
    if (track.status !== "failed") {
      await db.track.update({
        where: { id: track.id },
        data: { status: "failed", error: message },
      });
    }
  } catch {
    /* the record rests */
  }
  if (track.ledgerId) {
    await refundWalletCredits(track.userId, track.ledgerId);
  }
}
