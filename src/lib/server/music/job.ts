import { db } from "@/lib/db";
import {
  refundWalletCredits,
  spendWalletCredits,
} from "@/lib/server/wallet";
import { keepWovenSound } from "@/lib/server/music-vault";
import {
  buildJobBrief,
  buildTrackBrief,
  type StudioTuning,
  type TrackBrief,
} from "@/lib/server/music/interpreter";

/* ------------------------------------------------------------------ */
/*  THE DURABLE GENERATION — the shelf that never loses a paid song.   */
/*                                                                     */
/*  Every job and every track row is laid down BEFORE the first ask;   */
/*  each track carries its own light-hold (one ledger row per track);  */
/*  a finished song is persisted the moment it lands; a failed track   */
/*  refunds only itself; a visitor who leaves mid-render returns to    */
/*  find every landed song waiting on the shelf.                       */
/*                                                                     */
/*  THE ONCE LAW (charging): chargedIndexes on the job is the book of  */
/*  what is held. A track is charged exactly once — the atomic claim   */
/*  (status flip inside the same breath as the weigh) is the lock, so  */
/*  two settling hands can never draw the same light twice. A resume   */
/*  charges only the indexes not already in the book.                  */
/*                                                                     */
/*  THE WEAVE'S SHAPE: settling never blocks its caller — the heavy    */
/*  ask is kicked free and the row speaks when it lands. A row still   */
/*  "rendering" past ten quiet minutes is spoken honestly to failed,   */
/*  its light returned once (the chargeRef is the lock).               */
/* ------------------------------------------------------------------ */

export const MAX_TRACKS = 6;
const STALE_RENDER_MS = 10 * 60 * 1000;
const WEAVE_TIMEOUT_MS = 230_000;
const INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const LYRIA_FULL_MODEL = process.env.LYRIA_MODEL || "lyria-3.5";
const LYRIA_PRO_MODEL = process.env.LYRIA_PRO_MODEL || "lyria-3-pro-preview";

export interface JobTrackRow {
  id: string;
  jobId: string;
  index: number;
  title: string | null;
  taskId: string | null;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  chargeRef: string | null;
  error: string | null;
}

export interface JobRow {
  id: string;
  visitorId: string;
  status: string;
  mode: string;
  intention: string;
  civilization: string | null;
  language: string;
  style: string | null;
  lyrics: string | null;
  notes: string | null;
  trackCount: number;
  chargedCount: number;
  chargedIndexes: unknown;
  error: string | null;
  createdAt: Date;
}

export interface JobTrackView {
  id: string;
  index: number;
  title: string | null;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  error: string | null;
}

export interface MusicJobView {
  id: string;
  status: string;
  mode: string;
  intention: string;
  notes: string | null;
  trackCount: number;
  chargedCount: number;
  readyCount: number;
  pendingCount: number;
  createdAt: string;
  tracks: JobTrackView[];
}

export function clampCount(n: unknown): number {
  const x = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 1;
  return Math.min(MAX_TRACKS, Math.max(1, x));
}

/** the per-song price — env-tunable, five lights by default */
export function perTrackCost(): number {
  const raw = Number(process.env.MUSIC_TRACK_COST);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 5;
}

function parseCharged(job: JobRow): number[] {
  const raw = job.chargedIndexes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is number => typeof x === "number");
}

export function viewOfJob(
  job: JobRow & { tracks: JobTrackRow[] }
): MusicJobView {
  const tracks = [...job.tracks].sort((a, b) => a.index - b.index);
  const readyCount = tracks.filter((t) => t.status === "ready").length;
  const pendingCount = tracks.filter(
    (t) => t.status === "pending" || t.status === "rendering"
  ).length;
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    intention: job.intention,
    notes: job.notes,
    trackCount: job.trackCount,
    chargedCount: job.chargedCount,
    readyCount,
    pendingCount,
    createdAt:
      job.createdAt instanceof Date
        ? job.createdAt.toISOString()
        : String(job.createdAt),
    tracks: tracks.map((t) => ({
      id: t.id,
      index: t.index,
      title: t.title,
      status: t.status,
      audioUrl: t.audioUrl,
      durationMs: t.durationMs,
      error: t.error,
    })),
  };
}

async function jobStatusFor(jobId: string): Promise<string> {
  const tracks = await db.musicGenerationTrack.findMany({
    where: { jobId },
    select: { status: true },
  });
  const ready = tracks.filter((t) => t.status === "ready").length;
  const failed = tracks.filter((t) => t.status === "failed").length;
  const pending = tracks.filter(
    (t) => t.status === "pending" || t.status === "rendering"
  ).length;
  if (pending > 0) return ready > 0 ? "partial" : "rendering";
  if (ready === tracks.length && tracks.length > 0) return "ready";
  if (ready === 0) return "failed";
  return "partial";
}

export interface CreateJobArgs {
  visitorId: string;
  userId: string;
  mode: string;
  intention: string;
  civilization: string | null;
  language: string | null;
  shape: Record<string, unknown> | null;
  studio: StudioTuning | null;
  userLyrics: string | null;
  instrumental: boolean;
  count: number;
}

const NOKEY_MESSAGE =
  "The chamber is tuned, but the sound engine's key is not yet placed. Add GEMINI_API_KEY in the environment vault, and the transmissions will sound.";

export async function createMusicJob(
  args: CreateJobArgs
): Promise<{ view: MusicJobView; interpretation: TrackBrief }> {
  /* the engine's door must exist before the purse is opened */
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(NOKEY_MESSAGE) as Error & { code?: string };
    err.code = "nokey";
    throw err;
  }

  const brief = buildJobBrief({
    mode: args.mode,
    intention: args.intention,
    civilization: args.civilization,
    shape: args.shape,
    studio: args.studio,
    userLyrics: args.userLyrics,
    instrumental: args.instrumental,
    language: args.language,
    count: args.count,
  });

  const job = await db.musicGenerationJob.create({
    data: {
      visitorId: args.visitorId,
      userId: args.userId,
      status: "rendering",
      mode: args.mode,
      intention: args.intention,
      civilization: args.civilization,
      language: args.language ?? "en",
      style: brief.style,
      lyrics: brief.lyrics,
      notes: brief.notes,
      trackCount: args.count,
      chargedCount: 0,
      chargedIndexes: [],
    },
    include: { tracks: true },
  });

  await db.musicGenerationTrack.createMany({
    data: Array.from({ length: args.count }, (_, index) => ({
      jobId: job.id,
      index,
      status: "pending",
    })),
  });

  const tracks = await db.musicGenerationTrack.findMany({
    where: { jobId: job.id },
  });

  return {
    view: viewOfJob({ ...job, tracks } as JobRow & { tracks: JobTrackRow[] }),
    interpretation: brief,
  };
}

/* --------------------- the engine's own door ----------------------- */

interface StepBlock {
  type?: string;
  text?: string;
  data?: string;
  mime_type?: string;
  mimeType?: string;
}

function findAudioDeep(
  node: unknown,
  key = "",
  found: { data: string; mime: string }[] = []
): { data: string; mime: string }[] {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const item of node) findAudioDeep(item, key, found);
    return found;
  }
  const obj = node as Record<string, unknown>;
  const siblingMime =
    (typeof obj.mime_type === "string" && obj.mime_type) ||
    (typeof obj.mimeType === "string" && obj.mimeType) ||
    "";
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (typeof v === "string" && v.length > 512) {
      const looksBase64 = /^[A-Za-z0-9+/=\r\n_-]+$/.test(v.slice(0, 512));
      const dataUri = /^data:audio\//i.test(v.slice(0, 40));
      const audioByName =
        /audio/.test(lower) ||
        /audio/.test(siblingMime.toLowerCase()) ||
        /audio/.test(key.toLowerCase());
      const inline = lower === "inlinedata" || lower === "inline_data";
      if (dataUri || (looksBase64 && (audioByName || inline))) {
        found.push({
          data: dataUri ? v.slice(v.indexOf(",") + 1) : v,
          mime: siblingMime || "audio/mpeg",
        });
        continue;
      }
    }
    findAudioDeep(v, k, found);
  }
  return found;
}

interface WeaveResult {
  audioB64: string;
  mime: string;
}

async function lyriaWeave(
  input: string,
  key: string
): Promise<WeaveResult> {
  const rungs = Array.from(
    new Set([LYRIA_FULL_MODEL, "lyria-002", LYRIA_PRO_MODEL].filter(Boolean))
  );
  let climbable = true;
  let lastDetail = "";

  for (const model of rungs) {
    if (!climbable) break;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), WEAVE_TIMEOUT_MS);
    try {
      const res = await fetch(INTERACTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ model, input }),
        signal: ctrl.signal,
      });
      const raw = await res.text();
      if (!res.ok) {
        let detail = raw.slice(0, 300);
        try {
          const j = JSON.parse(raw) as { error?: { message?: string } };
          if (j.error?.message) detail = j.error.message;
        } catch {
          /* the raw words stand */
        }
        lastDetail = detail;
        if (
          res.status === 401 ||
          res.status === 403 ||
          /API_KEY_INVALID|api key.*not valid|permission denied/i.test(detail)
        ) {
          throw new Error(NOKEY_MESSAGE);
        }
        climbable =
          res.status === 404 ||
          res.status === 429 ||
          /not found|unsupported|not supported|does not exist|quota|resource.?exhausted|rate.?limit|unavailable/i.test(
            detail
          );
        continue;
      }
      const interaction = JSON.parse(raw) as unknown;
      const found = findAudioDeep(interaction);
      if (found.length === 0) {
        throw new Error(
          "The engine answered without a sound — the take rests, its light returns."
        );
      }
      const last = found[found.length - 1];
      return { audioB64: last.data, mime: last.mime };
    } catch (err) {
      if ((err as Error | null)?.name === "AbortError") {
        throw new Error(
          "The weave is still longer than one answer may hold — the take rests, its light returns."
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    `The sound engine did not open its door. ${lastDetail.slice(0, 140) || "Rest, then try again."}`
  );
}

/* ------------------------ the track's walk ------------------------- */

async function weaveTrack(job: JobRow, track: JobTrackRow): Promise<void> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    await failTrack(track, job, NOKEY_MESSAGE);
    return;
  }
  try {
    const total = job.trackCount;
    const base: TrackBrief = {
      title: track.title ?? "",
      style: job.style ?? "",
      lyrics: job.lyrics,
      notes: job.notes ?? "",
      promptText: job.style ?? "",
    };
    const brief = buildTrackBrief(
      base,
      track.index,
      total,
      job.mode,
      job.intention
    );
    /* the honest promptText: the job's own contract rebuilt for this take */
    const prompt = brief.promptText;

    const weave = await lyriaWeave(prompt, key);
    const bytes = Buffer.from(weave.audioB64, "base64");
    const keep = await keepWovenSound(bytes, weave.mime);
    const audioUrl = `/api/music-audio/${keep.file}`;

    const updated = await db.musicGenerationTrack.updateMany({
      where: { id: track.id, status: "rendering" },
      data: {
        status: "ready",
        title: brief.title || track.title,
        audioUrl,
        error: null,
      },
    });
    if (updated.count === 1) {
      await db.musicGenerationJob.update({
        where: { id: job.id },
        data: { status: await jobStatusFor(job.id), updatedAt: new Date() },
      });
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "The take stumbled — its light returns to your purse.";
    await failTrack(track, job, message);
  }
}

/** one track speaks honestly to failed, its own light returned once */
async function failTrack(
  track: JobTrackRow,
  job: JobRow,
  message: string
): Promise<void> {
  const claimed = await db.musicGenerationTrack.updateMany({
    where: { id: track.id, status: { in: ["pending", "rendering"] } },
    data: { status: "failed", error: message.slice(0, 300) },
  });
  if (claimed.count !== 1) return; // someone spoke first — the lock holds

  if (track.chargeRef) {
    try {
      await refundWalletCredits(job.visitorId, track.chargeRef);
    } catch (err) {
      console.error(
        "[music/job] a failed track's light could not be returned:",
        err instanceof Error ? err.message : err
      );
    }
  }
  const charged = parseCharged(job).filter((x) => x !== track.index);
  await db.musicGenerationJob.update({
    where: { id: job.id },
    data: {
      chargedIndexes: charged,
      chargedCount: charged.length,
      status: await jobStatusFor(job.id),
      error: null,
      updatedAt: new Date(),
    },
  });
}

/** the claim-and-charge — atomic by the status flip, priced by the track */
async function claimAndChargeTrack(
  job: JobRow,
  track: JobTrackRow
): Promise<JobTrackRow | null> {
  const charged = parseCharged(job);
  if (charged.includes(track.index)) return track; // already held — never twice

  const spend = await spendWalletCredits(job.visitorId, "LIGHT_CODES", {
    cost: perTrackCost(),
    description: "A song of the durable shelf — held before its weave",
    metadata: { referenceId: `musicjob:${job.id}:t${track.index}` },
  });
  if (!spend.ok) {
    await db.musicGenerationTrack.updateMany({
      where: { id: track.id, status: "pending" },
      data: {
        status: "failed",
        error: "The purse could not carry this song — the set rests uncharged.",
      },
    });
    return null;
  }

  const updated = await db.musicGenerationTrack.updateMany({
    where: { id: track.id, status: "pending" },
    data: {
      status: "rendering",
      chargeRef: spend.ledgerId ?? null,
      taskId: `settle-${Date.now().toString(36)}`,
    },
  });
  if (updated.count !== 1) {
    /* the row was spoken for between the weigh and the flip — return
       the light so the double-claim can never eat it */
    if (spend.ledgerId) {
      await refundWalletCredits(job.visitorId, spend.ledgerId).catch(
        () => undefined
      );
    }
    return null;
  }

  const nextCharged = [...charged, track.index];
  await db.musicGenerationJob.update({
    where: { id: job.id },
    data: {
      chargedIndexes: nextCharged,
      chargedCount: nextCharged.length,
      updatedAt: new Date(),
    },
  });
  return { ...track, status: "rendering", chargeRef: spend.ledgerId ?? null };
}

/* --------------------------- the settling -------------------------- */

/** The two hands of settling: speak stale renders honestly, then walk
    at most two pending tracks into their weave (kicked free — the
    caller never waits on the engine). */
export async function settleMusicJob(
  jobId: string,
  visitorId: string
): Promise<void> {
  const job = await db.musicGenerationJob.findUnique({
    where: { id: jobId },
    include: { tracks: true },
  });
  if (!job || job.visitorId !== visitorId || job.hiddenAt) return;

  const row = job as unknown as JobRow & { tracks: JobTrackRow[] };

  /* stale renders — ten quiet minutes and the light returns once */
  const now = Date.now();
  for (const track of row.tracks) {
    if (
      track.status === "rendering" &&
      track.taskId?.startsWith("settle-")
    ) {
      const stamp = Number.parseInt(track.taskId.slice(7), 36);
      if (Number.isFinite(stamp) && now - stamp > STALE_RENDER_MS) {
        await failTrack(track, row, "The weave went quiet — its light was returned. Continue the set to try again.");
      }
    }
  }

  /* at most two fresh asks per settling — the shelf stays light */
  const fresh = row.tracks
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.index - b.index)
    .slice(0, 2);
  for (const track of fresh) {
    const claimed = await claimAndChargeTrack(row, track);
    if (!claimed) continue;
    void weaveTrack(row, claimed);
  }

  const status = await jobStatusFor(job.id);
  if (status !== job.status) {
    await db.musicGenerationJob.update({
      where: { id: job.id },
      data: { status, updatedAt: new Date() },
    });
  }
}

/** the continue action — failed tracks return to pending (they are not
    in the charged book: their light was already returned), then the
    same settling walks them */
export async function resumeMusicJob(
  jobId: string,
  visitorId: string,
  _callerId: string
): Promise<MusicJobView> {
  const job = await db.musicGenerationJob.findUnique({
    where: { id: jobId },
    include: { tracks: true },
  });
  if (!job) {
    const err = new Error("That generation is not on the shelf.") as Error & {
      code?: string;
    };
    err.code = "not_found";
    throw err;
  }
  if (job.visitorId !== visitorId) {
    const err = new Error("That generation is not yours to continue.") as Error & {
      code?: string;
    };
    err.code = "forbidden";
    throw err;
  }
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(NOKEY_MESSAGE) as Error & { code?: string };
    err.code = "nokey";
    throw err;
  }
  if (job.hiddenAt) {
    const err = new Error("That generation rests hidden.") as Error & {
      code?: string;
    };
    err.code = "not_found";
    throw err;
  }

  const row = job as unknown as JobRow & { tracks: JobTrackRow[] };

  /* failed tracks are already refunded — they may be asked again */
  await db.musicGenerationTrack.updateMany({
    where: { jobId: job.id, status: "failed" },
    data: { status: "pending", error: null },
  });

  await settleMusicJob(job.id, visitorId);

  const fresh = await db.musicGenerationJob.findUnique({
    where: { id: job.id },
    include: { tracks: true },
  });
  if (!fresh) throw new Error("That generation is not on the shelf.");
  return viewOfJob(fresh as unknown as JobRow & { tracks: JobTrackRow[] });
}
