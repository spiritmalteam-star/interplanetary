#!/usr/bin/env bun
/* ------------------------------------------------------------------ */
/*  ET TECHNOLOGY — the per-technology painter.                        */
/*  Paints ONE unique image for EACH entry of the register             */
/*  (tech-XT-nnnn.jpg) into public/images/ai/et-tech/, in registry     */
/*  order — so page one of the register is painted first. Prompts are  */
/*  derived from each entry's own name, family, whisper and overview,  */
/*  so no two paintings share a subject. Resumable: existing files     */
/*  are skipped. Concurrency 3, 429 backoff, time budget.              */
/*  Run: bun scripts/generate-et-tech-registry-images.mjs              */
/*       [--budget-minutes=N] [--concurrency=N] [--start-index=N]      */
/* ------------------------------------------------------------------ */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { techEntries } from "../src/lib/data/technologies.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/images/ai/et-tech");
const SIZE = "1024x1024";
const RETRY_DELAYS_MS = [15000, 30000, 60000, 90000, 120000];

const arg = (name, fallback) => {
  const a = process.argv
    .slice(2)
    .find((x) => x.startsWith(`--${name}=`));
  return a ? Number(a.split("=")[1]) || fallback : fallback;
};
const BUDGET_MINUTES = arg("budget-minutes", 600);
const CONCURRENCY = arg("concurrency", 3);
const START_INDEX = arg("start-index", 0);

const BASE = "retro mid-century deep-space survey painting";
const TAIL =
  "violet and midnight palette, unmarked surfaces, no logos, no insignia, no text, no letters, no watermark";

/** A unique painter's brief for one technology. */
function promptFor(entry) {
  const firstOverview = entry.overview.split(/(?<=\.)\s+/)[0] ?? "";
  return [
    `${BASE} of the "${entry.name}"`,
    `a ${entry.adjective} ${entry.noun.toLowerCase()} of ${entry.family} craft`,
    entry.origin.toLowerCase(),
    firstOverview,
    TAIL,
  ]
    .filter(Boolean)
    .join(", ");
}

const jobs = techEntries
  .slice(START_INDEX)
  .map((entry) => ({
    file: `tech-${entry.id}.jpg`,
    prompt: promptFor(entry),
  }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...parts) =>
  console.log(new Date().toISOString().slice(11, 19), ...parts);

/** Shared cool-off: after any 429 every worker pauses briefly. */
let global429Until = 0;

/** Verify the z-ai binary before painting anything. */
function verifyCli() {
  const candidates = [
    ["bunx", ["z-ai", "--help"]],
    [process.execPath, ["x", "z-ai", "--help"]],
  ];
  for (const [cmd, args] of candidates) {
    try {
      const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 120000 });
      const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
      if (r.status === 0 || out.includes("z-ai")) {
        return { cmd, args: args.slice(0, -1) }; // strip the --help
      }
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** One CLI invocation; resolves { ok, out, err }. */
function paint(job, cmd) {
  return new Promise((resolvePromise) => {
    const outPath = join(OUT_DIR, job.file);
    const child = spawn(
      cmd.cmd,
      [...cmd.args, "image", "-p", job.prompt, "-o", outPath, "-s", SIZE],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGKILL"), 300000);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ ok: code === 0 && existsSync(outPath), out, err });
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolvePromise({ ok: false, out, err: `${err}${e.message}` });
    });
  });
}

async function paintWithRetries(job, cmd, deadline) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (Date.now() > deadline) return { ok: false, budget: true };
    const r = await paint(job, cmd);
    if (r.ok) return r;
    if (attempt < RETRY_DELAYS_MS.length) {
      const rateLimited = /429|rate.?limit|too many/i.test(`${r.err}${r.out}`);
      if (rateLimited) global429Until = Math.max(global429Until, Date.now() + 60000);
      const wait = rateLimited
        ? Math.max(RETRY_DELAYS_MS[attempt], 30000)
        : RETRY_DELAYS_MS[attempt];
      log(`  ! ${job.file} failed (attempt ${attempt + 1}) — retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  return { ok: false, budget: false };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const cmd = verifyCli();
  if (!cmd) {
    console.error("z-ai CLI not available (bunx z-ai --help failed). Aborting.");
    process.exit(1);
  }

  const pending = jobs.filter((j) => !existsSync(join(OUT_DIR, j.file)));
  log(
    `ET registry painter — ${jobs.length} targets from index ${START_INDEX}, ${pending.length} to paint (concurrency ${CONCURRENCY}, budget ${BUDGET_MINUTES} min).`
  );
  if (pending.length === 0) {
    console.log("All target images exist. Nothing to do.");
    return;
  }

  const deadline = Date.now() + BUDGET_MINUTES * 60000;
  let index = 0;
  let done = 0;
  let failures = 0;
  const failCounts = new Map();
  const requeue = [];

  async function worker() {
    while ((index < pending.length || requeue.length > 0) && Date.now() < deadline) {
      /* honor a global cool-off after any 429 */
      const waitMs = global429Until - Date.now();
      if (waitMs > 0) await sleep(Math.min(waitMs, 30000));
      const job = requeue.length > 0 && Math.random() < 0.5
        ? requeue.shift()
        : index < pending.length
          ? pending[index++]
          : requeue.shift();
      if (!job) break;
      const t0 = Date.now();
      const r = await paintWithRetries(job, cmd, deadline);
      if (r.ok) {
        done++;
        log(`[${done}] ${job.file} ✓ (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      } else if (r.budget) {
        log(`  … budget reached before ${job.file} — re-run to continue`);
      } else {
        const fails = (failCounts.get(job.file) ?? 0) + 1;
        failCounts.set(job.file, fails);
        if (fails >= 3) {
          failures++;
          log(`  ✗ ${job.file} gave up after 3 rounds`);
        } else {
          log(`  ↻ ${job.file} re-queued (round ${fails})`);
          requeue.push(job);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  log(`Finished: ${done} painted this run, ${failures} permanent failures.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
