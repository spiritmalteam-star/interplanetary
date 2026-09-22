/**
 * Collects every NEW i18n key introduced by the Mirror OS + the
 * slimmed chat, by scanning the components for t("...") literals and
 * by walking the mirroros data fields. Writes scripts/mirror-os-keys.json
 * for the translation agents, plus a report of keys already present
 * in each dictionary.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  shiftFormulas,
  higherMindIntro,
  ladderRungs,
  higherProtocols,
  discernmentLines,
  beliefDomains,
  vibrationStates,
  morningPool,
  eveningPool,
  focusPool,
} from "../src/lib/data/mirroros";

const SRC = "/home/z/my-project/src";
const DICTS_DIR = join(SRC, "lib/i18n/dicts");

const SCAN_FILES = [
  "components/mirror/MirrorOS.tsx",
  "components/mirror/MirrorOSForge.tsx",
  "components/mirror/Sidebar.tsx",
  "components/mirror/ModeSelector.tsx",
  "components/mirror/TransmissionView.tsx",
];

/* ---------- 1. t("...") literals in the new/changed components ---------- */

const keys = new Set<string>();

for (const rel of SCAN_FILES) {
  const src = readFileSync(join(SRC, rel), "utf8");
  const re = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) keys.add(m[1]);
}

/* ---------- 2. every user-facing string in the mirroros data ---------- */

for (const f of shiftFormulas) {
  keys.add(f.name);
  keys.add(f.tagline);
  f.steps.forEach((s) => keys.add(s));
  keys.add(f.seal);
}
higherMindIntro.forEach((k) => keys.add(k));
ladderRungs.forEach((r) => {
  keys.add(r.title);
  keys.add(r.line);
});
higherProtocols.forEach((p) => {
  keys.add(p.name);
  keys.add(p.purpose);
  p.steps.forEach((s) => keys.add(s));
});
discernmentLines.forEach((k) => keys.add(k));
beliefDomains.forEach((d) => {
  keys.add(d.label);
  keys.add(d.pattern);
  keys.add(d.reframe);
  keys.add(d.practice);
});
vibrationStates.forEach((v) => {
  keys.add(v.label);
  keys.add(v.bridge);
  keys.add(v.anchor);
});
[...morningPool, ...eveningPool, ...focusPool].forEach((k) => keys.add(k));

/* ---------- 3. report which keys each dict already has ---------- */

const perDict: Record<string, string[]> = {};
for (const f of readdirSync(DICTS_DIR)) {
  const raw = readFileSync(join(DICTS_DIR, f), "utf8");
  const existing = new Set<string>();
  const re = /^\s*"((?:[^"\\]|\\.)*)"\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) existing.add(m[1]);
  perDict[f] = [...keys].filter((k) => existing.has(k));
}

const sorted = [...keys].sort();
writeFileSync(
  "/home/z/my-project/scripts/mirror-os-keys.json",
  JSON.stringify(sorted, null, 2)
);

console.log(`Total new keys: ${sorted.length}`);
for (const [f, already] of Object.entries(perDict)) {
  console.log(`${f}: ${already.length} already present`);
  already.forEach((k) => console.log("   ·", k));
}
