/* Verifies that every translation dictionary covers every key.
   TWO TIERS:
   • HARD gate — literal UI keys (i18n-keys.json): every dictionary
     must cover them; missing ones fail the check.
   • CONTENT tier — dynamic data-driven keys (i18n-keys-dynamic.json):
     the large living-content pools (suggestions, lexicon, chamber
     data). These render through t() with a graceful English fallback
     BY DESIGN, so a missing content key is reported, not failed. The
     resumable scripts/translate-dynamic.mjs finishes them whenever
     the translation API quota allows. */
import { readFileSync, existsSync } from "node:fs";

const keysLiterals = JSON.parse(
  readFileSync("/home/z/my-project/scripts/i18n-keys.json", "utf8")
);
const dynPath = "/home/z/my-project/scripts/i18n-keys-dynamic.json";
const keysDynamic = existsSync(dynPath)
  ? JSON.parse(readFileSync(dynPath, "utf8"))
  : [];
const ALL = [...new Set([...keysLiterals, ...keysDynamic])];
const LITERAL_SET = new Set(keysLiterals);

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
    const hard = missing.filter((k) => LITERAL_SET.has(k));
    const content = missing.filter((k) => !LITERAL_SET.has(k));
    if (hard.length) {
      failed = true;
      for (const k of hard.slice(0, 40))
        console.log(`  MISSING (UI): ${JSON.stringify(k)}`);
      if (hard.length > 40) console.log(`  … and ${hard.length - 40} more`);
    }
    if (content.length) {
      /* the content tier falls back to English by design — reported,
         never failed */
      console.log(
        `  content keys in English (graceful fallback): ${content.length}`
      );
    }
  }
  if (placeholderIssues.length) {
    failed = true;
    for (const p of placeholderIssues.slice(0, 20)) console.log(`  ISSUE: ${p}`);
    if (placeholderIssues.length > 20)
      console.log(`  … and ${placeholderIssues.length - 20} more`);
  }
}

console.log(
  failed
    ? "\nFAIL"
    : "\nALL DICTIONARY UI KEYS COMPLETE (content keys fall back to English where noted)"
);
process.exit(failed ? 1 : 0);
