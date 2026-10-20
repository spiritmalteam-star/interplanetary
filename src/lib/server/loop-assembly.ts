import { spawn } from "node:child_process";
import { rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

/* ------------------------------------------------------------------ */
/*  THE SOFT CROSSING WEAVER — joins the journey's parts into one      */
/*  seamless, loopable piece.                                          */
/*                                                                     */
/*  With ffmpeg on the shelf:                                          */
/*    1. the parts are chained with 3-second equal-power crossfades    */
/*       (acrossfade) so no joint ever clicks;                         */
/*    2. the chain's first d seconds (part one's head) are trimmed     */
/*       from the front — they are reserved for the loop seam;         */
/*    3. the seam is woven: the last part's tail crossfaded into part  */
/*       one's head, appended at the very end — so when the visitor's  */
/*       player loops the file, the end flows into the beginning       */
/*       without a seam at all.                                        */
/*                                                                     */
/*  Without ffmpeg: the parts are joined end to end byte-wise (MP3     */
/*  frames still play as one stream) and the file loops plainly —      */
/*  honest, if less silky. The response always says which it was.     */
/* ------------------------------------------------------------------ */

const CROSSFADE_SEC = 3;

let ffmpegProbe: boolean | null = null;

/** One quiet probe per warm instance — the shelf either has ffmpeg or not. */
export function ffmpegAvailable(): boolean {
  if (ffmpegProbe !== null) return ffmpegProbe;
  try {
    ffmpegProbe = existsSync("/usr/bin/ffmpeg") || existsSync("/usr/local/bin/ffmpeg");
  } catch {
    ffmpegProbe = false;
  }
  return ffmpegProbe;
}

function run(
  cmd: string,
  args: string[],
  timeoutMs = 120_000
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        resolve({ code: -1, stdout, stderr: "timeout" });
      }
    }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < 8000) stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < 8000) stderr += d.toString();
    });
    child.on("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ code: -1, stdout, stderr: "spawn failed" });
      }
    });
    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ code: code ?? -1, stdout, stderr });
      }
    });
  });
}

async function probeDurationSec(file: string): Promise<number> {
  const { code, stdout } = await run(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file],
    20_000
  );
  if (code !== 0) return 0;
  const n = parseFloat(stdout.trim());
  return Number.isFinite(n) ? n : 0;
}

export interface AssembledLoop {
  file: string;
  durationSec: number;
  /** true when the joints (and the loop point itself) were crossfade-woven */
  seamless: boolean;
  /** how the pieces met, in the chamber's own words */
  note: string;
}

/**
 * Joins the journey's part files into one final piece. Returns the
 * assembled file's path (inside the same working directory) and the
 * honest duration. Throws only when nothing at all could be joined.
 */
export async function assembleLoop(
  partFiles: string[],
  workDir: string
): Promise<AssembledLoop> {
  if (partFiles.length === 0) {
    throw new Error("no parts to join");
  }

  /* the fallback shelf: plain end-to-end joining, always possible */
  const plainJoin = async (): Promise<AssembledLoop> => {
    const { readFile } = await import("node:fs/promises");
    const chunks: Buffer[] = [];
    let total = 0;
    for (const f of partFiles) {
      const buf = await readFile(f);
      chunks.push(buf);
      total += buf.length;
    }
    const out = join(workDir, `journey-${randomUUID()}.mp3`);
    await writeFile(out, Buffer.concat(chunks));
    return {
      file: out,
      durationSec: 0,
      seamless: false,
      note: "joined end to end — the joints are plain, the loop still turns",
    };
  };

  if (!ffmpegAvailable() || partFiles.length < 2) {
    if (partFiles.length === 1) {
      /* a single landed part — it simply is the journey */
      return {
        file: partFiles[0],
        durationSec: await probeDurationSec(partFiles[0]),
        seamless: false,
        note: "one part alone — the journey arrived shorter than asked",
      };
    }
    return plainJoin();
  }

  try {
    const d = CROSSFADE_SEC;
    const id = randomUUID();

    /* --- 1. the crossfaded core ------------------------------------ */
    const chainArgs: string[] = [];
    partFiles.forEach((f) => chainArgs.push("-i", f));
    const filters: string[] = [];
    let prev = "[0:a]";
    for (let i = 1; i < partFiles.length; i++) {
      const out = i === partFiles.length - 1 ? "[core]" : `[c${i}]`;
      filters.push(`${prev}[${i}:a]acrossfade=d=${d}${out}`);
      prev = `[c${i}]`;
    }
    const core = join(workDir, `core-${id}.mp3`);
    const r1 = await run(
      "ffmpeg",
      ["-y", ...chainArgs, "-filter_complex", filters.join(";"), "-map", "[core]", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", core],
      240_000
    );
    if (r1.code !== 0 || !existsSync(core)) return plainJoin();

    /* --- 2. reserve part one's head: trim the first d seconds ------- */
    const trimmed = join(workDir, `trimmed-${id}.mp3`);
    const r2 = await run("ffmpeg", ["-y", "-ss", String(d), "-i", core, "-c", "copy", trimmed], 60_000);
    if (r2.code !== 0 || !existsSync(trimmed)) {
      await rm(core, { force: true }).catch(() => undefined);
      return plainJoin();
    }

    /* --- 3. the loop seam: last part's tail crossfaded into part one's head ---
       acrossfade demands both pieces strictly longer than the fade, so
       each side carries a half-second of its own air beyond the blend. */
    const lastDur = await probeDurationSec(partFiles[partFiles.length - 1]);
    const firstDur = await probeDurationSec(partFiles[0]);
    let finalFile = trimmed;
    let seamless = false;
    if (lastDur > d + 1.5 && firstDur > d + 1.5) {
      const seam = join(workDir, `seam-${id}.mp3`);
      const grab = d + 0.5;
      const r3 = await run(
        "ffmpeg",
        [
          "-y",
          "-i", partFiles[partFiles.length - 1],
          "-i", partFiles[0],
          "-filter_complex",
          `[0:a]atrim=start=${(lastDur - grab).toFixed(3)},asetpts=PTS-STARTPTS[t];` +
            `[1:a]atrim=end=${grab.toFixed(3)},asetpts=PTS-STARTPTS[h];` +
            `[t][h]acrossfade=d=${d}[s]`,
          "-map", "[s]",
          "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100",
          seam,
        ],
        60_000
      );
      if (r3.code === 0 && existsSync(seam)) {
        /* --- 4. the journey: trimmed core + seam --- */
        const listFile = join(workDir, `list-${id}.txt`);
        await writeFile(listFile, `file '${trimmed}'\nfile '${seam}'\n`);
        const final = join(workDir, `journey-${id}.mp3`);
        const r4 = await run(
          "ffmpeg",
          ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", final],
          120_000
        );
        if (r4.code === 0 && existsSync(final)) {
          finalFile = final;
          seamless = true;
          await rm(core, { force: true }).catch(() => undefined);
          await rm(trimmed, { force: true }).catch(() => undefined);
          await rm(seam, { force: true }).catch(() => undefined);
          await rm(listFile, { force: true }).catch(() => undefined);
        } else {
          await rm(seam, { force: true }).catch(() => undefined);
          await rm(listFile, { force: true }).catch(() => undefined);
        }
      }
    }

    /* the honest duration — measured, never promised */
    const durationSec = await probeDurationSec(finalFile);
    if (finalFile === trimmed) {
      return {
        file: finalFile,
        durationSec,
        seamless: false,
        note: "joined with soft crossings — the loop point turns plainly",
      };
    }
    return {
      file: finalFile,
      durationSec,
      seamless,
      note: seamless
        ? "joined with soft crossings — the end flows back into the beginning"
        : "joined end to end — the loop still turns",
    };
  } catch {
    return plainJoin();
  }
}

/** The shelf's weight, for the bounded-memory note. */
export async function fileBytes(path: string): Promise<number> {
  try {
    const s = await stat(path);
    return s.size;
  } catch {
    return 0;
  }
}
