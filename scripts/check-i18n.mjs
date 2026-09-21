/* Verifies that every translation dictionary covers every key:
   literals from i18n-keys.json + dynamic keys from i18n-keys-dynamic.json.
   Also checks that {placeholders} survive translation. */
import { readFileSync, existsSync } from "node:fs";

const keysLiterals = JSON.parse(
  readFileSync("/home/z/my-project/scripts/i18n-keys.json", "utf8")
);
const dynPath = "/home/z/my-project/scripts/i18n-keys-dynamic.json";
const keysDynamic = existsSync(dynPath)
  ? JSON.parse(readFileSync(dynPath, "utf8"))
  : [];
const ALL = [...new Set([...keysLiterals, ...keysDynamic])];

const LANGS = ["sq", "it", "el", "de", "fr", "es", "tr"];
const pairRe = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;

let failed = false;

for (const lang of LANGS) {
  const path = `/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`;
  const src = readFileSync(path, "utf8");
  const dict = new Map();
  let m;
  pairRe.lastIndex = 0;
  while ((m = pairRe.exec(src))) {
    const k = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    dict.set(k, m[2]);
  }

  const missing = ALL.filter((k) => !dict.has(k));
  const placeholderIssues = [];
  for (const k of ALL) {
    const v = dict.get(k);
    if (!v) continue;
    const needed = [...k.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
    const got = [...v.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
    if (needed.join(",") !== got.join(",")) {
      placeholderIssues.push(`${k} → ${v}`);
    }
    if (
      v === k &&
      !/^(?:\d+D\s–\s\d+D|Ring (?:I|II|III|IV|V)|Accord [IVX]+|Charter I|Principle \d+|Prime Accord)$/.test(k)
    ) {
      // identical to English — informational only (notation keys are expected)
      console.log(`  NOTE (identical to English): ${k}`);
    }
  }

  console.log(
    `\n[${lang}] dict entries: ${dict.size} | keys: ${ALL.length} | missing: ${missing.length}`
  );
  if (missing.length) {
    failed = true;
    for (const k of missing.slice(0, 40)) console.log(`  MISSING: ${JSON.stringify(k)}`);
    if (missing.length > 40) console.log(`  … and ${missing.length - 40} more`);
  }
  if (placeholderIssues.length) {
    failed = true;
    for (const p of placeholderIssues.slice(0, 20)) console.log(`  ISSUE: ${p}`);
    if (placeholderIssues.length > 20)
      console.log(`  … and ${placeholderIssues.length - 20} more`);
  }
}

console.log(failed ? "\nFAIL" : "\nALL DICTIONARIES COMPLETE");
process.exit(failed ? 1 : 0);
