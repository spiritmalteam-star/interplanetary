import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "@/lib/db";
import { assembleLoop } from "@/lib/server/loop-assembly";

/* ------------------------------------------------------------------ */
/*  THE JOURNEY'S DEEP SHELF — the endless journey's durable thread.   */
/*                                                                     */
/*  The old journey rested on one warm instance's own memory: on the   */
/*  house's own ground that held, but in the sky (Vercel) each part    */
/*  may land on a different instance, and the thread was lost between  */
/*  them — the long weave could never finish there. Now every part is  */
/*  laid in the vault's deep shelf (the database) the moment it lands, */
/*  so the journey crosses instances and the half-hour weave finishes  */
/*  wherever its last part touches down.                               */
/*                                                                     */
/*  THE TIMING LAW: an unfinished journey rests after one quiet hour   */
/*  (swept when a new journey begins); a finished piece rests one      */
/*  quiet hour as well — the visitor's own copy lives on their device. */
/* ------------------------------------------------------------------ */

/** One quiet hour — beyond any honest weaving pause. */
const SWEEP_MS = 60 * 60 * 1000;

/** The vault's own shape — Prisma's Bytes wants a plain ArrayBuffer
    view, so a buffer is copied into one honest byte view. */
function asBytes(b: Buffer): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(b) as Uint8Array<ArrayBuffer>;
}

export interface DbLoopState {
  token: string;
  total: number;
  parts: number;
}

function newToken(): string {
  return `lp${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** The sweep — journeys and finals past the timing law leave the shelf. */
async function sweepExpired(): Promise<void> {
  const cutoff = new Date(Date.now() - SWEEP_MS);
  try {
    await db.loopWeave.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    await db.loopWeaveFinal.deleteMany({ where: { createdAt: { lt: cutoff } } });
  } catch (err) {
    console.error(
      "[loop-vault] the sweep rested:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Opens the journey's thread and lays its first part down. Returns the
 * token that carries the thread between requests (and between instances).
 */
export async function dbLoopBegin(
  userId: string,
  total: number,
  mime: string,
  firstPart: Buffer
): Promise<DbLoopState> {
  await sweepExpired();
  const token = newToken();
  await db.loopWeave.create({
    data: {
      token,
      userId,
      total,
      mime,
      parts: { create: { idx: 1, audio: asBytes(firstPart) } },
    },
    select: { id: true },
  });
  return { token, total, parts: 1 };
}

/** The journey's state — null when the thread rested past its hour. */
export async function dbLoopState(
  token: string,
  userId: string
): Promise<DbLoopState | null> {
  const row = await db.loopWeave.findUnique({
    where: { token },
    select: { userId: true, total: true, _count: { select: { parts: true } } },
  });
  if (!row || row.userId !== userId) return null;
  return { token, total: row.total, parts: row._count.parts };
}

/** Lays the next part down. The step law is checked first: the part
    that arrives must be exactly the one the loom waits for. */
export async function dbLoopAddPart(
  token: string,
  userId: string,
  idx: number,
  bytes: Buffer
): Promise<DbLoopState | { outOfStep: number }> {
  const row = await db.loopWeave.findUnique({
    where: { token },
    select: { id: true, userId: true, total: true, _count: { select: { parts: true } } },
  });
  if (!row || row.userId !== userId) return { outOfStep: 0 };
  if (row._count.parts !== idx - 1) return { outOfStep: row._count.parts };
  await db.loopWeavePart.create({
    data: { weaveId: row.id, idx, audio: asBytes(bytes) },
  });
  await db.loopWeave.update({
    where: { id: row.id },
    data: { updatedAt: new Date() },
  });
  return { token, total: row.total, parts: row._count.parts + 1 };
}

/**
 * Joins the journey with soft crossings (ffmpeg when the shelf has it;
 * a plain end-to-end join otherwise — the honest fallback) and lays the
 * finished piece in the deep shelf. The parts' thread is swept — the
 * journey flew to its own shelf.
 */
export async function dbLoopFinalize(
  token: string,
  userId: string
): Promise<{
  durationSec: number;
  seamless: boolean;
  note: string;
  mime: string;
} | null> {
  const row = await db.loopWeave.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      mime: true,
      parts: { orderBy: { idx: "asc" }, select: { audio: true } },
    },
  });
  if (!row || row.userId !== userId || row.parts.length === 0) return null;

  const buffers = row.parts.map((p) => Buffer.from(p.audio));
  let durationSec = 0;
  let seamless = false;
  let note = "joined end to end — the loop still turns";

  /* the soft-crossing attempt: parts to temp files, ffmpeg joins them */
  let dir: string | null = null;
  try {
    dir = await mkdtemp(join(tmpdir(), "lc-loop-db-"));
    const files: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const f = join(dir, `part-${String(i + 1).padStart(2, "0")}.mp3`);
      await writeFile(f, buffers[i]);
      files.push(f);
    }
    const joined = await assembleLoop(files, dir);
    const bytes = await readFile(joined.file).catch(() => null);
    if (bytes) {
      durationSec = joined.durationSec;
      seamless = joined.seamless;
      note = joined.note;
      await db.loopWeaveFinal.create({
        data: {
          token,
          userId,
          mime: row.mime,
          audio: asBytes(bytes),
          durationSec: joined.durationSec,
          seamless: joined.seamless,
          note: joined.note,
        },
        select: { id: true },
      });
      await db.loopWeave.delete({ where: { id: row.id } });
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      return { durationSec, seamless, note, mime: row.mime };
    }
  } catch (err) {
    console.error(
      "[loop-vault] the soft crossing rested — the plain join carries the journey:",
      err instanceof Error ? err.message : err
    );
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }

  /* the plain join — byte-wise, always possible */
  const plain = Buffer.concat(buffers);
  await db.loopWeaveFinal.create({
    data: {
      token,
      userId,
      mime: row.mime,
      audio: asBytes(plain),
      durationSec: 0,
      seamless: false,
      note,
    },
    select: { id: true },
  });
  await db.loopWeave.delete({ where: { id: row.id } });
  return { durationSec: 0, seamless: false, note, mime: row.mime };
}

/** The finished journey's bytes — only for its own keeper. */
export async function dbLoopFinal(
  token: string,
  userId: string
): Promise<{ audio: Buffer; mime: string; durationSec: number } | null> {
  const row = await db.loopWeaveFinal.findUnique({
    where: { token },
    select: { userId: true, audio: true, mime: true, durationSec: true },
  });
  if (!row || row.userId !== userId) return null;
  return { audio: Buffer.from(row.audio), mime: row.mime, durationSec: row.durationSec };
}
