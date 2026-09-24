#!/usr/bin/env bun
/* ------------------------------------------------------------------ */
/*  ET TECHNOLOGY — AI painter for the register's imagery.             */
/*  Paints 18 family portraits (fam-<familyId>.jpg) and 46 adjective   */
/*  context scenes (adj-<adjective>.jpg) into                          */
/*  public/images/ai/et-tech/. Resumable: existing files are skipped,  */
/*  so re-running only paints what is missing. Concurrency 2, retry    */
/*  with backoff (429s happen), clean exit inside a time budget.       */
/*  Run: bun scripts/generate-et-tech-images.mjs [--budget-minutes=19] */
/* ------------------------------------------------------------------ */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TECH_ADJECTIVES,
  TECH_FAMILIES,
} from "../src/lib/data/technologies.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/images/ai/et-tech");
const SIZE = "1024x1024";
const CONCURRENCY = 2;
const RETRY_DELAYS_MS = [3000, 8000, 15000, 30000];

const budgetArg = process.argv
  .slice(2)
  .find((a) => a.startsWith("--budget-minutes="));
const BUDGET_MINUTES = budgetArg
  ? Number(budgetArg.split("=")[1]) || 19
  : 19;

const BASE = "retro mid-century deep-space survey painting";
const TAIL =
  "violet and midnight palette, unmarked surfaces, no logos, no insignia, no text, no letters, no watermark";

const jobs = [];
for (const fam of TECH_FAMILIES) {
  jobs.push({
    file: `fam-${fam.id}.jpg`,
    prompt: `${BASE} of an alien ${fam.label} artifact, ${TAIL}`,
  });
}
for (const adj of TECH_ADJECTIVES) {
  jobs.push({
    file: `adj-${adj.name}.jpg`,
    prompt: `${BASE}, ${adj.scene}, ${TAIL}`,
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...parts) => console.log(new Date().toISOString().slice(11, 19), ...parts);

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
      resolvePromise({
        ok: code === 0 && existsSync(outPath),
        out,
        err,
      });
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolvePromise({ ok: false, out, err: `${err}${e.message}` });
    });
  });
}

async function paintWithRetries(job, cmd, deadline) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (Date.now() > deadline) return { ok: false, out: "", err: "", budget: true };
    const r = await paint(job, cmd);
    if (r.ok) return r;
    if (attempt < RETRY_DELAYS_MS.length) {
      const rateLimited = /429|rate.?limit|too many/i.test(`${r.err}${r.out}`);
      const wait = rateLimited
        ? RETRY_DELAYS_MS[attempt] + 20000
        : RETRY_DELAYS_MS[attempt];
      log(`  ! ${job.file} failed (attempt ${attempt + 1}) — retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  return { ok: false, out: "", err: "gave up", budget: false };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const cmd = verifyCli();
  if (!cmd) {
    console.error("z-ai CLI not available (bunx z-ai --help failed). Aborting.");
    process.exit(1);
  }

  const pending = jobs.filter((j) => !existsSync(join(OUT_DIR, j.file)));
  const already = jobs.length - pending.length;
  log(
    `ET Technology painter — ${jobs.length} targets, ${already} already on disk, ${pending.length} to paint (budget ${BUDGET_MINUTES} min).`
  );
  if (pending.length === 0) {
    console.log(`All ${jobs.length} images exist. Nothing to do.`);
    return;
  }

  const deadline = Date.now() + BUDGET_MINUTES * 60000;
  let index = 0;
  let done = already;
  let failures = 0;

  async function worker() {
    while (index < pending.length && Date.now() < deadline) {
      const job = pending[index++];
      const t0 = Date.now();
      const r = await paintWithRetries(job, cmd, deadline);
      if (r.ok) {
        done++;
        log(`[${done}/${jobs.length}] ${job.file} ✓ (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      } else if (r.budget) {
        log(`  … budget reached before ${job.file} — left for the next run`);
      } else {
        failures++;
        log(`  ✗ ${job.file} gave up after retries`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const onDisk = jobs.filter((j) => existsSync(join(OUT_DIR, j.file))).length;
  log(
    `Finished with ${onDisk}/${jobs.length} images on disk` +
      (failures ? `, ${failures} permanent failures` : "") +
      (onDisk < jobs.length ? " — re-run to continue (resumable)" : " — register fully painted")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
