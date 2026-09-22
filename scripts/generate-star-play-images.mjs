#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  Star Play — suit image batch generator.                            */
/*                                                                     */
/*  Generates the violet arcana art for the deck's 39 suits under      */
/*  public/images/ai/star-play/<slug>-<n>.jpg and then rewrites        */
/*  src/lib/star-play-images.ts with the counts actually on disk.      */
/*                                                                     */
/*  Resumable: skips files that already exist. Supports a time budget:  */
/*  bun scripts/generate-star-play-images.mjs [variants] [budgetSec]    */
/*  When the budget elapses, counts are saved and the run exits cleanly */
/*  — call again and again until every slot is filled.                  */
/* ------------------------------------------------------------------ */

import { existsSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = "/home/z/my-project";
const OUT_DIR = `${ROOT}/public/images/ai/star-play`;
const COUNTS_PATH = `${ROOT}/src/lib/star-play-images.ts`;

const VARIANTS = Number(process.argv[2] ?? 2);
const BUDGET_SEC = Number(process.argv[3] ?? 0);
const startedAt = Date.now();

function budgetLeft() {
  if (!BUDGET_SEC) return true;
  return (Date.now() - startedAt) / 1000 < BUDGET_SEC;
}

const SUITS = [
  ["silver-gate", "an ornate silver gate ajar with violet starlight spilling through, sacred geometry hinges"],
  ["violet-hour", "a suspended twilight hour, a clock of violet petals dissolving into amethyst mist"],
  ["ember-compass", "a compass rose whose needle is a glowing ember, violet nebula around it"],
  ["pearl-threshold", "a glowing pearl resting on a threshold of soft violet light"],
  ["glass-aurora", "translucent glass curtains of aurora light in violet and orchid hues"],
  ["silent-meridian", "a lone vertical meridian line of light crossing a still violet desert"],
  ["honeyed-void", "golden honey light dripping into a deep violet cosmic void"],
  ["velvet-antenna", "a delicate antenna of velvet violet light receiving soft signals from stars"],
  ["salt-cathedral", "a cathedral carved from luminous crystal salt, violet shadows"],
  ["lantern-of-hours", "an antique lantern holding swirling violet hours instead of flame"],
  ["ninth-harbor", "a quiet harbor at dusk with nine lanterns, violet water reflections"],
  ["copper-vesper", "an evening prayer bell of warm copper glowing against violet dusk"],
  ["wandering-chord", "a musical chord made visible as wandering violet light threads"],
  ["quiet-bell", "a silent bronze bell surrounded by calm violet ripples of air"],
  ["inked-aurora", "aurora borealis appearing like ink strokes written across a violet night sky"],
  ["patient-fire", "a small unhurried flame burning inside a violet glass vessel"],
  ["cartographers-moon", "the moon drawn as an antique map with phases marked in violet ink"],
  ["hollow-star", "a star with a luminous hollow center, violet corona around the emptiness"],
  ["first-snow", "the first snow falling over a violet twilight meadow"],
  ["glacier choir", "glacial ice formations glowing violet like a frozen choir of voices"],
  ["lamplight-field", "a night meadow lit kindly by a single floating lamp, violet grass"],
  ["amber-frequency", "a waveform of light preserved inside amber, violet halo"],
  ["humming-threshold", "a doorway whose air vibrates with visible violet sound rings"],
  ["cinder-psalm", "glowing cinders rising and arranging into psalm-like violet script"],
  ["unwritten-hour", "an open blank book on a violet altar of light, one page glowing"],
  ["stillpoint-chord", "three notes of light meeting at a single still violet point"],
  ["cartomancers-hand", "elegant hands dealing luminous violet arcana cards over a starlit table"],
  ["aurora-ledger", "an celestial ledger book whose entries are lines of aurora light, violet hues"],
  ["salt-road", "an ancient road paved with glimmering salt crystals under a violet sky"],
  ["velvet-dark", "night sky rendered as folded velvet with soft violet sheen"],
  ["ninth-wave", "a single great ocean wave glowing violet, carrying light forward"],
  ["lantern-oath", "a hand swearing an oath over a small violet lantern flame"],
  ["pearl-meridian", "a strand of pearls laid along a glowing violet longitude line"],
  ["glass-bell", "a bell made of clear glass with a silver clapper, violet resonance rings"],
  ["ember-psalm", "warm embers floating upward forming a song of violet light"],
  ["quiet-meridian", "a horizon line where all noise dissolves into violet stillness"],
  ["honeyed-ember", "a glowing ember wrapped in golden honey light and violet mist"],
  ["wandering-lantern", "a lantern drifting joyfully along a winding violet path"],
  ["silent-aurora", "aurora light frozen mid-ripple, deep violet, absolutely still"],
];

function slugify(name) {
  return name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureCountsFile() {
  if (!existsSync(COUNTS_PATH)) {
    throw new Error(`missing ${COUNTS_PATH}`);
  }
}

function writeCounts(counts) {
  const lines = Object.entries(counts)
    .map(([slug, n]) => `  "${slug}": ${n},`)
    .join("\n");
  const body = `/* ------------------------------------------------------------------ */
/*  Star Play — physical image pool inventory (auto-maintained by      */
/*  scripts/generate-star-play-images.mjs). Counts how many generated  */
/*  variants exist on disk per suit slug under                         */
/*  public/images/ai/star-play/<slug>-<n>.jpg (n = 0 … count-1).       */
/* ------------------------------------------------------------------ */

export const SUIT_IMAGE_COUNTS: Record<string, number> = {
${lines}
};

/** Shown until a suit's own art exists on disk. */
export const STAR_PLAY_FALLBACK_IMAGE = "/images/ai/star-play-emblem.jpg";
`;
  writeFileSync(COUNTS_PATH, body, "utf8");
}

function generate(prompt, outPath) {
  execFileSync("z-ai", ["image", "-p", prompt, "-o", outPath, "-s", "1024x1024"], {
    stdio: ["ignore", "ignore", "ignore"],
    timeout: 180000,
  });
}

function ok(path) {
  try {
    return existsSync(path) && statSync(path).size > 20000;
  } catch {
    return false;
  }
}

async function main() {
  ensureCountsFile();
  const counts = {};
  let made = 0;

  for (const [rawName, subject] of SUITS) {
    const slug = slugify(rawName);
    let count = 0;
    for (let v = 0; v < VARIANTS; v++) {
      const out = `${OUT_DIR}/${slug}-${v}.jpg`;
      if (ok(out)) {
        count++;
        continue;
      }
      if (!budgetLeft()) {
        counts[slug] = count;
        writeCounts(counts);
        process.stdout.write(`budget reached at ${slug}-${v}\n`);
        process.stdout.write(`done — generated ${made} new images\n`);
        return;
      }
      const prompt =
        `Mystical violet tarot arcana card art: ${subject}. ` +
        "Deep aubergine and amethyst palette with soft orchid glow, fine luminous filigree border, " +
        "cosmic nebula haze, painterly engraved texture, centered mystical composition, " +
        "no text, no letters, no words.";
      try {
        generate(prompt, out);
        if (ok(out)) {
          count++;
          made++;
        }
      } catch {
        process.stderr.write(`warn: failed ${slug}-${v}\n`);
      }
    }
    counts[slug] = count;
    writeCounts(counts);
    process.stdout.write(`${slug}: ${count}/${VARIANTS}\n`);
  }

  writeCounts(counts);
  process.stdout.write(`done — generated ${made} new images\n`);
}

main().catch((e) => {
  process.stderr.write(`${e?.message ?? e}\n`);
  process.exit(1);
});
