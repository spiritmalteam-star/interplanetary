/**
 * Removes i18n dictionary lines whose keys are no longer referenced
 * anywhere in src (outside the dicts themselves). Used to purge the
 * removed Interplanetary Biology vocabulary.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/home/z/my-project/src";
const DICTS_DIR = join(ROOT, "lib/i18n/dicts");

const CANDIDATES = [
  /* removed chat chrome */
  "Mirror Transmission",
  "independent channel",
  "{scope} scope",
  "{scope} channel",
  "{scope} channel cleared — this scope is now quiet.",
  "{ornament} frame · {scope}",
  "exchange held in this channel",
  "exchanges held in this channel",
  "Free will honored always · Transmitted with love ❤️",
  "Clear the {scope} channel",
  "Every scope keeps its own private channel with its own history — nothing carries over from other scopes. Ask from the composer below to open the first transmission of this channel.",
  /* removed classification block */
  "Documented science",
  "This transmission draws on established, verifiable science.",
  "Speculative theory",
  "Grounded in credible but unproven hypotheses — hold it lightly.",
  "Spiritual tradition",
  "Reflects spiritual and channeled traditions — offered for reflection, not as verified science.",
  "World-building",
  "A creative, fictional cosmology from the Mirror archive — for wonder, not evidence.",
  "Symbolic reading",
  "A symbolic interpretation offered at your request — the meaning is yours to keep.",
  "Archive reflection",
  "Held gently by the archive — verify inwardly what resonates.",
  /* removed manifesting lab chrome */
  "Open the Reality Manifesting Laboratory",
  "Enter the Reality Manifesting Laboratory — refine an intention into a sealed blueprint",
  "Reality Manifesting Laboratory",
  "Discuss in the Observatory",
];

/* ---------- gather all non-dict source ---------- */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const sources = walk(ROOT)
  .filter((p) => !p.startsWith(DICTS_DIR))
  .map((p) => readFileSync(p, "utf8"))
  .join("\n");

/* ---------- check & strip ---------- */

const stillUsed: string[] = [];

for (const dictFile of readdirSync(DICTS_DIR)) {
  const dictPath = join(DICTS_DIR, dictFile);
  const lines = readFileSync(dictPath, "utf8").split("\n");
  const kept: string[] = [];
  let removed = 0;

  for (const line of lines) {
    const m = line.match(/^\s*"((?:[^"\\]|\\.)*)"\s*:/);
    if (m && CANDIDATES.includes(m[1])) {
      // Is the exact key still used outside the dicts?
      const used = sources.includes(`"${m[1]}"`);
      if (used) {
        kept.push(line);
        stillUsed.push(`${dictFile}: ${m[1]}`);
      } else {
        removed++;
      }
      continue;
    }
    kept.push(line);
  }

  writeFileSync(dictPath, kept.join("\n"));
  console.log(`${dictFile}: removed ${removed} lines`);
}

console.log("\nStill referenced elsewhere (kept):");
for (const u of new Set(stillUsed)) console.log("  -", u);
