import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { db } from "@/lib/db";
import { refundWalletCredits } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  THE MUSIC VAULT — the music room's half of the house's keeping     */
/*  law. The chamber's woven sounds rest here as plain files under     */
/*  db/audio/, one row in MusicTrack per sound, and the row alone      */
/*  opens the serving door. The vault answers three duties:            */
/*                                                                     */
/*    keep   — write one woven sound in, under a name nothing can      */
/*             twist into a path (the filename is all that is stored); */
/*    forget — take one sound out when its owner's hand asks;          */
/*    sweep  — find weave jobs the house never heard back from (the    */
/*             visitor refreshed, the instance slept mid-weave) and    */
/*             speak them honestly to "failed", returning their drawn  */
/*             light ONCE — the job's own refunded flag is the lock.   */
/*                                                                     */
/*  THE SWEEP'S TIMING LAW: a live weave never outlives its sky        */
/*  timeout by much (the chamber's heaviest full song allows 280s),    */
/*  so a job still "processing" after six quiet minutes is a weave     */
/*  the house will never hear from again. Anything younger is left     */
/*  strictly alone — a sleeping row is never mistaken for a lost one.  */
/* ------------------------------------------------------------------ */

export const AUDIO_VAULT_DIR = join(process.cwd(), "db", "audio");

/** Six quiet minutes — beyond a weave's longest possible breath. */
const STALE_MS = 6 * 60 * 1000;

/** The name law — only plain filenames pass; a path, a climb, or a
 *  stranger character is met with silence. */
export function sanitizeVaultFile(name: string): string | null {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return null;
  }
  return /^[a-zA-Z0-9._-]+$/.test(name) ? name : null;
}

function extensionForMime(mime: string): string {
  return /wav/i.test(mime) ? ".wav" : ".mp3";
}

/**
 * Keep one woven sound in the vault. Returns ONLY the bare filename —
 * the row stores the name, the serve route builds the path — or null
 * when the house could not hold it (the caller stays honest and the
 * visitor's response is never failed for it).
 */
export async function mirrorAudioToVault(
  bytes: Buffer,
  mime: string
): Promise<string | null> {
  try {
    await mkdir(AUDIO_VAULT_DIR, { recursive: true });
    const file = `${randomUUID()}${extensionForMime(mime)}`;
    await writeFile(join(AUDIO_VAULT_DIR, file), bytes);
    return file;
  } catch (err) {
    console.error(
      "[music-vault] the vault could not keep the sound:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * The deep shelf — a woven sound is kept under its own vault name: the
 * file when the house's shelf is writable, and ALWAYS the row's own
 * bytes (audioData) when the caller lays the row. The sky (Vercel)
 * keeps no writable house shelf, so there the row itself is the vault:
 * the serve door reads the bytes from the row when no file stands.
 */
export async function keepWovenSound(
  bytes: Buffer,
  mime: string
): Promise<{ file: string; fileKept: boolean }> {
  const file = `${randomUUID()}${extensionForMime(mime)}`;
  try {
    await mkdir(AUDIO_VAULT_DIR, { recursive: true });
    await writeFile(join(AUDIO_VAULT_DIR, file), bytes);
    return { file, fileKept: true };
  } catch (err) {
    console.error(
      "[music-vault] the house shelf could not keep the sound — the deep shelf (the row) will hold it:",
      err instanceof Error ? err.message : err
    );
    return { file, fileKept: false };
  }
}

/** The deep shelf's read — the bytes a row holds, by the file's name. */
export async function loadTrackBytes(
  file: string
): Promise<Buffer | null> {
  try {
    const row = await db.musicTrack.findFirst({
      where: { localFile: file },
      select: { audioData: true },
    });
    if (!row?.audioData) return null;
    return Buffer.from(row.audioData);
  } catch (err) {
    console.error(
      "[music-vault] the deep shelf could not be read:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** The owner's hand forgets — the bytes leave the vault (best effort;
 *  a missing file is already forgotten, and is not an error). */
export async function removeAudioFromVault(file: string): Promise<void> {
  const safe = sanitizeVaultFile(file);
  if (!safe) return;
  try {
    await unlink(join(AUDIO_VAULT_DIR, safe));
  } catch {
    /* already gone — the forgetting is done */
  }
}

/* ------------------------- the lost weaves ------------------------- */

/** The shape the weave routes lay in `request` — enough to recover the
    trail of the light that was drawn. */
interface WeaveJobRequest {
  walletLedgerId?: string | null;
}

/**
 * Speak one interrupted weave honestly: processing → failed, and its
 * drawn light given back. THE ONCE LAW: the atomic claim below is the
 * lock — only the sweep whose update actually flips the row may refund,
 * so two racing sweeps (or a replay) can never give the light twice.
 */
async function failWeaveJobOnce(job: {
  id: string;
  userId: string;
  creditsDrawn: number;
  request: unknown;
}): Promise<void> {
  const claimed = await db.generationJob.updateMany({
    where: { id: job.id, status: "processing" },
    data: {
      status: "failed",
      refunded: job.creditsDrawn > 0,
      result: {
        error:
          "The weave was interrupted before its sound could land — the house marks it honestly.",
        sweptAt: new Date().toISOString(),
      },
    },
  });
  if (claimed.count !== 1) return; // someone spoke first — the lock holds
  await returnDrawnCredits(job);
}

/**
 * The drawn light's return. When the weigh's ledger row is known, the
 * wallet's own refund walks — idempotent by the ledger's refunded mark.
 * When the trail is lost (a row laid before the ledger id was carried,
 * or a request that never said), the amount is returned directly —
 * paid bucket, one signed ledger row — once, guarded by the job flag
 * the claim above already holds. This is a RETURN, never a mint: the
 * keeper's well is not touched, and grantWalletCredits stays closed.
 */
async function returnDrawnCredits(job: {
  id: string;
  userId: string;
  creditsDrawn: number;
  request: unknown;
}): Promise<void> {
  const amount = Math.max(0, Math.floor(job.creditsDrawn));
  if (amount <= 0) return;
  const request = (job.request ?? null) as WeaveJobRequest | null;
  const ledgerId =
    request && typeof request.walletLedgerId === "string"
      ? request.walletLedgerId
      : null;
  if (ledgerId) {
    await refundWalletCredits(job.userId, ledgerId);
    return;
  }
  try {
    await db.$transaction([
      db.userWallet.update({
        where: { userId: job.userId },
        data: { paidCreditsRemaining: { increment: amount } },
      }),
      db.creditLedger.create({
        data: {
          userId: job.userId,
          actionType: "LIGHT_CODES",
          creditsDeducted: amount,
          metadata: {
            referenceId: `job-fail:${job.id}`,
            description: "A weave was lost before its sound — the drawn light returned",
          },
        },
      }),
    ]);
  } catch (err) {
    console.error(
      "[music-vault] a lost weave's light could not be returned:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * The sweep itself — every weave job of this passage left "processing"
 * past the timing law is failed once, its light returned once. Errors
 * rest quietly: a sweep that cannot run must never block the library.
 */
export async function sweepStaleWeaveJobs(userId: string): Promise<void> {
  try {
    const stale = await db.generationJob.findMany({
      where: {
        userId,
        tool: "light_codes",
        status: "processing",
        updatedAt: { lt: new Date(Date.now() - STALE_MS) },
      },
      select: { id: true, userId: true, creditsDrawn: true, request: true },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    for (const job of stale) {
      await failWeaveJobOnce(job);
    }
    /* THE LOST RETURNS — weaves already marked failed whose light was
       never confirmed returned (the row's humble refunded mark stands
       false): one visit to the shelf gives each its weigh back, once,
       guarded by the same atomic claim. */
    const unreturned = await db.generationJob.findMany({
      where: {
        userId,
        tool: "light_codes",
        status: "failed",
        refunded: false,
        creditsDrawn: { gt: 0 },
        updatedAt: { lt: new Date(Date.now() - STALE_MS) },
      },
      select: { id: true, userId: true, creditsDrawn: true, request: true },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    for (const job of unreturned) {
      const claimed = await db.generationJob.updateMany({
        where: { id: job.id, status: "failed", refunded: false },
        data: { refunded: true },
      });
      if (claimed.count !== 1) continue; // someone spoke first — the lock holds
      await returnDrawnCredits(job);
    }
  } catch (err) {
    console.error(
      "[music-vault] the sweep rested:",
      err instanceof Error ? err.message : err
    );
  }
}
