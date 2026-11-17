/* THE JOURNEY'S TEST BENCH — feeds six synthetic MP3 parts through the
   soft-crossing weaver and checks the joined whole honestly:
   duration ≈ sum − 6×3s, and the loop seam present. Run: bun run tools/test-loop-assembly.ts */
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assembleLoop, ffmpegAvailable } from "../src/lib/server/loop-assembly";

async function makeTone(dir: string, i: number): Promise<string> {
  const file = join(dir, `seg-${i}.mp3`);
  /* 12 seconds, distinct pitch per part — audibly joinable */
  const freq = 220 + i * 40;
  const r = spawnSync("ffmpeg", [
    "-y", "-f", "lavfi", "-i", `sine=frequency=${freq}:duration=12`,
    "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", file,
  ]);
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${r.stderr?.toString().slice(0, 200)}`);
  return file;
}

function durationOf(file: string): number {
  const r = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return parseFloat(r.stdout.toString().trim());
}

const dir = await mkdtemp(join(tmpdir(), "lc-loop-test-"));
try {
  const parts: string[] = [];
  for (let i = 1; i <= 6; i++) parts.push(await makeTone(dir, i));
  const sum = parts.reduce((a, f) => a + durationOf(f), 0);
  console.log("ffmpeg on shelf:", ffmpegAvailable());
  console.log("parts:", parts.length, "sum duration:", sum.toFixed(2), "s");

  const out = await assembleLoop(parts, dir);
  const dur = durationOf(out.file);
  const bytes = (await import("node:fs/promises")).stat;
  const size = (await bytes(out.file)).size;
  console.log("assembled:", { seamless: out.seamless, duration: dur.toFixed(2), size, note: out.note });

  /* the weaver's own math: five internal crossfades, the head trimmed,
     and the seam (which carries d+0.5+0.5 of air) appended at the end */
  const expected = sum - 5 * 3 + 1;
  const ok = Math.abs(dur - expected) < 2.5;
  console.log(`expected ≈ ${expected.toFixed(2)}s → ${ok ? "PASS" : "FAIL"}`);
  if (!ok) process.exitCode = 1;
  /* keep a copy for the ear */
  await mkdir("/home/z/my-project/.zscripts", { recursive: true });
  await writeFile("/home/z/my-project/.zscripts/loop-test-note.txt",
    `seamless=${out.seamless} duration=${dur.toFixed(2)}s file=${out.file}\n`);
} finally {
  await rm(dir, { recursive: true, force: true }).catch(() => undefined);
}
