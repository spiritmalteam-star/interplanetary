import { readFileSync } from "node:fs";

const missing = JSON.parse(
  readFileSync("/home/z/my-project/scripts/tmp/missing-keys-46.json", "utf8")
);
const pairRe = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const LANGS = ["sq", "it", "el", "de", "fr", "es", "tr"];

for (const lang of LANGS) {
  const src = readFileSync(`/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`, "utf8");
  const dict = new Map();
  let m;
  pairRe.lastIndex = 0;
  while ((m = pairRe.exec(src))) {
    const k = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    dict.set(k, m[2]);
  }
  const present = missing.filter((k) => dict.has(k));
  console.log(`[${lang}] entries: ${dict.size} | of the 93 already present: ${present.length}`);
  for (const k of present) console.log(`   PRESENT: ${JSON.stringify(k)} → ${JSON.stringify(dict.get(k))}`);
}
