/* ------------------------------------------------------------------ */
/*  generate.mjs — resumable image pipeline for ParticleX + Evolve Med */
/*                                                                     */
/*  - One image per poetic subject from ./manifest.mjs                 */
/*  - Style: minimalist vintage ink engraving (book-plate)             */
/*  - Skips public/images/px/<category>/<slug>.png if already present  */
/*  - Rewrites public/images/px/manifest.json after every success      */
/*  - Max 3 images in flight, 3 attempts per image, 5s backoff         */
/*  - Uses the z-ai CLI when available, else z-ai-web-dev-sdk          */
/*                                                                     */
/*  Env:  LIMIT=<n per category>   SIZE=<WxH> (default 1024x1024)      */
/*        CONCURRENCY=<n> (default 3)  ATTEMPTS=<n> (default 3)        */
/* ------------------------------------------------------------------ */

import {
  existsSync,
  mkdirSync,
  statSync,
  openSync,
  readSync,
  closeSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import sharp from "sharp";
import { CATEGORY_LABELS, CATEGORY_ORDER, SUBJECTS } from "./manifest.mjs";

/* ------------------------------ config ---------------------------- */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "public", "images", "px");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

const SIZE = process.env.SIZE || "1024x1024";
const LIMIT = parseInt(process.env.LIMIT || "0", 10) || 0; // 0 = no limit
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || "3", 10));
const ATTEMPTS = Math.max(1, parseInt(process.env.ATTEMPTS || "3", 10));
const BACKOFF_MS = 5000;
const CLI_TIMEOUT_MS = 300000; // 5 min per CLI attempt

const PROMPT_TEMPLATE =
  "Minimalist vintage ink engraving, black ink on warm white paper, fine-line etching, elegant classic book-plate illustration, ethereal calm atmosphere, high contrast, no text, no letters, no watermark: <subject>";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/* ------------------------------ helpers --------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(subject) {
  const base = subject
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "image";
}

function isValidPng(p) {
  try {
    if (statSync(p).size < 1024) return false;
    const fd = openSync(p, "r");
    const buf = Buffer.alloc(8);
    readSync(fd, buf, 0, 8, 0);
    closeSync(fd);
    return buf.equals(PNG_MAGIC);
  } catch {
    return false;
  }
}

/** The API often returns JPEG bytes; force-encode every image as a true PNG. */
async function toTruePng(outPath) {
  if (isValidPng(outPath)) return true;
  const tmp = `${outPath}.conv.png`;
  await sharp(outPath).png({ compressionLevel: 9 }).toFile(tmp);
  const { renameSync, unlinkSync } = await import("node:fs");
  renameSync(tmp, outPath);
  if (!isValidPng(outPath)) {
    try {
      unlinkSync(outPath);
    } catch {}
    return false;
  }
  return true;
}

/* ------------------------------ job list -------------------------- */

/** Build per-category jobs (slug included, LIMIT applied). */
function buildJobsByCategory() {
  const byCat = new Map();
  for (const cat of CATEGORY_ORDER) {
    const all = SUBJECTS[cat] || [];
    const limited = LIMIT > 0 ? all.slice(0, LIMIT) : all;
    const seen = new Map(); // slug uniqueness safety
    const jobs = limited.map((subject) => {
      let slug = slugify(subject);
      const n = (seen.get(slug) || 0) + 1;
      seen.set(slug, n);
      if (n > 1) slug = `${slug.slice(0, 57)}-${n}`;
      return { category: cat, subject, slug };
    });
    byCat.set(cat, jobs);
  }
  return byCat;
}

/** First 2 images of every category first, then continue category by category. */
function orderJobs(byCat) {
  const ordered = [];
  for (const cat of CATEGORY_ORDER) ordered.push(...byCat.get(cat).slice(0, 2));
  for (const cat of CATEGORY_ORDER) ordered.push(...byCat.get(cat).slice(2));
  return ordered;
}

/* --------------------------- manifest state ----------------------- */

const state = new Map(); // "category/slug" -> true (valid png on disk)

function scanExisting(byCat) {
  for (const cat of CATEGORY_ORDER) {
    const dir = path.join(OUT_DIR, cat);
    for (const job of byCat.get(cat)) {
      const p = path.join(dir, `${job.slug}.png`);
      if (isValidPng(p)) state.set(`${cat}/${job.slug}`, true);
    }
  }
}

function writeManifest(byCat) {
  const categories = {};
  for (const cat of CATEGORY_ORDER) {
    const images = [];
    for (const job of byCat.get(cat)) {
      if (state.has(`${cat}/${job.slug}`)) images.push(`${cat}/${job.slug}.png`);
    }
    categories[cat] = { label: CATEGORY_LABELS[cat], count: images.length, images };
  }
  const manifest = { generatedAt: new Date().toISOString(), categories };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

/* ---------------------------- generators -------------------------- */

let cliAvailable = null; // null = unknown, true/false
let zaiSdk = null; // lazy SDK fallback

function detectCli() {
  return new Promise((resolve) => {
    execFile("which", ["z-ai"], (err) => resolve(!err));
  });
}

async function getSdk() {
  if (!zaiSdk) {
    const mod = await import("z-ai-web-dev-sdk");
    const ZAI = mod.default || mod;
    zaiSdk = await ZAI.create();
  }
  return zaiSdk;
}

function generateViaCli(prompt, outPath) {
  return new Promise((resolve) => {
    const child = spawn(
      "z-ai",
      ["image", "-p", prompt, "-o", outPath, "-s", SIZE],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, CLI_TIMEOUT_MS);
    child.stderr.on("data", (d) => {
      stderr += String(d).slice(0, 4000);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) return resolve({ ok: false, err: "CLI timeout after 300s" });
      if (code === 0 && existsSync(outPath) && statSync(outPath).size > 1024) {
        return resolve({ ok: true });
      }
      resolve({
        ok: false,
        err: `CLI exit ${code}${stderr ? " :: " + stderr.trim().split("\n").slice(-2).join(" | ") : ""}`,
      });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, err: `CLI spawn error: ${err.message}` });
    });
  });
}

async function generateViaSdk(prompt, outPath) {
  const zai = await getSdk();
  const response = await zai.images.generations.create({ prompt, size: SIZE });
  const b64 = response?.data?.[0]?.base64;
  if (!b64) throw new Error("SDK returned no image data");
  writeFileSync(outPath, Buffer.from(b64, "base64"));
  return { ok: true };
}

async function generateImage(prompt, outPath) {
  if (cliAvailable === null) cliAvailable = await detectCli();
  let lastErr = "unknown";
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const raw = cliAvailable
        ? await generateViaCli(prompt, outPath)
        : await generateViaSdk(prompt, outPath);
      if (!raw.ok) {
        lastErr = raw.err || "unknown";
      } else if (await toTruePng(outPath)) {
        return { ok: true, attempt };
      } else {
        lastErr = "could not encode output as PNG";
      }
    } catch (err) {
      lastErr = err?.message || String(err);
    }
    if (attempt < ATTEMPTS) await sleep(BACKOFF_MS);
  }
  return { ok: false, err: lastErr };
}

/* ------------------------------- main ----------------------------- */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const byCat = buildJobsByCategory();
  const ordered = orderJobs(byCat);
  scanExisting(byCat);

  // rewrite manifest at start (reflects whatever already exists on disk)
  writeManifest(byCat);

  cliAvailable = await detectCli();
  const engine = cliAvailable ? "z-ai CLI" : "z-ai-web-dev-sdk";

  const totals = {};
  let totalJobs = 0;
  for (const cat of CATEGORY_ORDER) {
    totals[cat] = byCat.get(cat).length;
    totalJobs += totals[cat];
  }
  const alreadyDone = ordered.filter((j) =>
    state.has(`${j.category}/${j.slug}`),
  ).length;

  console.log(
    `[px-images] engine=${engine} size=${SIZE} limit=${LIMIT || "none"} concurrency=${CONCURRENCY} attempts=${ATTEMPTS}`,
  );
  console.log(
    `[px-images] jobs=${totalJobs} (per category: ${CATEGORY_ORDER.map((c) => `${c} ${totals[c]}`).join(", ")})`,
  );
  console.log(
    `[px-images] resuming: ${alreadyDone}/${totalJobs} already on disk — manifest rewritten at start`,
  );

  const doneCount = {}; // per-category completed (existing + new)
  for (const cat of CATEGORY_ORDER) {
    doneCount[cat] = byCat
      .get(cat)
      .filter((j) => state.has(`${cat}/${j.slug}`)).length;
  }
  let globalDone = alreadyDone;
  let globalFailed = 0;
  let inFlight = 0;

  const queue = ordered.slice(); // shared queue, consumed by workers
  let qi = 0;

  async function worker(id) {
    while (true) {
      const job = queue[qi++];
      if (!job) return;
      const { category, subject, slug } = job;
      const rel = `${category}/${slug}.png`;
      const outPath = path.join(OUT_DIR, category, `${slug}.png`);

      if (state.has(`${category}/${slug}`)) {
        console.log(`[${category}] skip ${doneCount[category]}/${totals[category]} ${slug} (exists)`);
        continue;
      }

      mkdirSync(path.join(OUT_DIR, category), { recursive: true });
      inFlight++;
      const prompt = PROMPT_TEMPLATE.replace("<subject>", subject);
      const res = await generateImage(prompt, outPath);
      inFlight--;

      if (res.ok) {
        state.set(`${category}/${slug}`, true);
        doneCount[category]++;
        globalDone++;
        writeManifest(byCat);
        console.log(`[${category}] ${doneCount[category]}/${totals[category]} ${slug}`);
        if (globalDone % 10 === 0) {
          console.log(`[px-images] progress ${globalDone}/${totalJobs} (failed so far: ${globalFailed})`);
        }
      } else {
        globalFailed++;
        console.log(`[${category}] FAILED ${slug} :: ${res.err}`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, ordered.length); i++) {
    workers.push(worker(i));
  }
  await Promise.all(workers);

  writeManifest(byCat);
  console.log(
    `[px-images] DONE pass complete: generated/verified ${globalDone}/${totalJobs}, failed ${globalFailed}`,
  );
  if (globalFailed > 0) {
    console.log("[px-images] re-run the same command to retry only the missing images");
  }
}

main().catch((err) => {
  console.error("[px-images] FATAL", err);
  process.exit(1);
});
