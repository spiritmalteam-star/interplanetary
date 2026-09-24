#!/usr/bin/env bun
/* ------------------------------------------------------------------ */
/*  THE ENCYCLOPEDIA PAINTER — one unique painting per profile.       */
/*                                                                     */
/*  Paints every profile's own image so no profile ever repeats        */
/*  another's art. Targets, in priority order:                         */
/*   1. tech-XT-nnnn.jpg  — the 827 technologies (registry order,      */
/*                          so register page one paints first)         */
/*   2. ie-<id>.jpg       — the 59 Inner Earth peoples                 */
/*   3. fed-<key>.jpg     — the Federation bodies/treaties/principles  */
/*   4. job-<slug>.jpg    — the astral professions                     */
/*                                                                     */
/*  (The 1,072 being portraits under /images/entities/ already exist.) */
/*  Resumable: existing files are skipped. Concurrency 1 by default,   */
/*  429 global cool-off + requeue (3 rounds), time budget.             */
/*  Run: bun scripts/generate-profile-images.mjs                       */
/*       [--budget-minutes=N] [--concurrency=N]                        */
/* ------------------------------------------------------------------ */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { techEntries } from "../src/lib/data/technologies.ts";
import { innerEarth } from "../src/lib/data/inner-earth.ts";
import {
  federationBodies,
  federationPrinciples,
  federationTreaties,
} from "../src/lib/data/federation.ts";
import { professionDomains } from "../src/lib/data/professions.ts";
import { slugify } from "../src/lib/profile-visuals.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AI_DIR = resolve(__dirname, "../public/images/ai");
const SIZE = "1024x1024";
const RETRY_DELAYS_MS = [15000, 30000, 60000, 90000, 120000];

const arg = (name, fallback) => {
  const a = process.argv.slice(2).find((x) => x.startsWith(`--${name}=`));
  return a ? Number(a.split("=")[1]) || fallback : fallback;
};
const BUDGET_MINUTES = arg("budget-minutes", 600);
const CONCURRENCY = arg("concurrency", 1);

const BASE = "retro mid-century deep-space survey painting";
const TAIL =
  "violet and midnight palette, unmarked surfaces, no logos, no insignia, no text, no letters, no watermark";

function techPrompt(e) {
  const first = e.overview.split(/(?<=\.)\s+/)[0] ?? "";
  return [
    `${BASE} of the "${e.name}"`,
    `a ${e.adjective} ${e.noun.toLowerCase()} of ${e.family} craft`,
    e.origin.toLowerCase(),
    first,
    TAIL,
  ]
    .filter(Boolean)
    .join(", ");
}

function speciesPrompt(s) {
  return [
    `${BASE} of the ${s.name}`,
    `a gentle subterranean people of the Inner Earth`,
    `their hall: ${s.hall.toLowerCase()}`,
    `their appearance: ${s.form.toLowerCase()}`,
    TAIL,
  ].join(", ");
}

function fedPrompt(card) {
  return [
    `${BASE} of the ${card.name}`,
    `a galactic federation ${card.kind} emblem scene`,
    card.description.toLowerCase(),
    TAIL,
  ].join(", ");
}

function jobPrompt(domain, role) {
  return [
    `${BASE} of a ${role.name.toLowerCase()} at work`,
    `an astral profession of the ${domain.title.toLowerCase()} domain`,
    role.blurb.toLowerCase(),
    TAIL,
  ].join(", ");
}

const jobs = [];

/* 1 — technologies, in registry order */
for (const e of techEntries) {
  jobs.push({
    file: join("et-tech", `tech-${e.id}.jpg`),
    prompt: techPrompt(e),
  });
}

/* 2 — the Inner Earth peoples */
for (const s of innerEarth) {
  jobs.push({
    file: join("inner-earth", `ie-${s.id}.jpg`),
    prompt: speciesPrompt(s),
  });
}

/* 3 — the federation cards (only the fed- prefixed keys, if missing) */
const fedCards = [...federationBodies, ...federationTreaties, ...federationPrinciples];
const seenFedKeys = new Set();
for (const card of fedCards) {
  if (!card.imageKey || seenFedKeys.has(card.imageKey)) continue;
  seenFedKeys.add(card.imageKey);
  if (!card.imageKey.startsWith("fed-")) continue;
  jobs.push({
    file: `${card.imageKey}.jpg`,
    prompt: fedPrompt(card),
  });
}

/* 4 — the astral professions */
for (const domain of professionDomains) {
  for (const role of domain.professions) {
    jobs.push({
      file: join("astral", `job-${slugify(role.name)}.jpg`),
      prompt: jobPrompt(domain, role),
    });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...parts) =>
  console.log(new Date().toISOString().slice(11, 19), ...parts);

/** Shared cool-off: after any 429 every worker pauses briefly. */
let global429Until = 0;

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
        return { cmd, args: args.slice(0, -1) };
      }
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function paint(job, cmd) {
  return new Promise((resolvePromise) => {
    const outPath = join(AI_DIR, job.file);
    mkdirSync(dirname(outPath), { recursive: true });
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
      if (rateLimited)
        global429Until = Math.max(global429Until, Date.now() + 90000);
      const wait = rateLimited
        ? Math.max(RETRY_DELAYS_MS[attempt], 45000)
        : RETRY_DELAYS_MS[attempt];
      log(`  ! ${job.file} failed (attempt ${attempt + 1}) — retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  return { ok: false, budget: false };
}

async function main() {
  const cmd = verifyCli();
  if (!cmd) {
    console.error("z-ai CLI not available (bunx z-ai --help failed). Aborting.");
    process.exit(1);
  }

  const pending = jobs.filter((j) => !existsSync(join(AI_DIR, j.file)));
  log(
    `Encyclopedia painter — ${jobs.length} targets, ${pending.length} to paint (concurrency ${CONCURRENCY}, budget ${BUDGET_MINUTES} min).`
  );
  if (pending.length === 0) {
    console.log("All profile paintings exist. Nothing to do.");
    return;
  }

  const deadline = Date.now() + BUDGET_MINUTES * 60000;
  let index = 0;
  let done = 0;
  let failures = 0;
  const failCounts = new Map();
  const requeue = [];

  async function worker() {
    while (
      (index < pending.length || requeue.length > 0) &&
      Date.now() < deadline
    ) {
      const waitMs = global429Until - Date.now();
      if (waitMs > 0) await sleep(Math.min(waitMs, 30000));
      const job =
        requeue.length > 0 && Math.random() < 0.5
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
