/* Dict completeness audit v2 — apostrophe-safe extraction */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const SRC = "/home/z/my-project/src";
const keys = new Set();
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?)$/.test(name)) continue;
    const text = readFileSync(p, "utf8");
    for (const m of text.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1]);
    for (const m of text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]);
    for (const m of text.matchAll(/\bt\(\s*`((?:[^`\\]|\\.)*)`/g)) keys.add(m[1]);
    for (const m of text.matchAll(/\btranslate\(\s*[\w.]+\s*,\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(m[1]);
    for (const m of text.matchAll(/\btranslate\(\s*[\w.]+\s*,\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]);
  }
}
walk(SRC);
const dictsDir = join(SRC, "lib", "i18n", "dicts");
const dictFiles = readdirSync(dictsDir).filter((f) => f.endsWith(".ts"));
console.log(`app keys: ${keys.size}`);
const results = [];
for (const f of dictFiles) {
  const code = f.replace(".ts", "");
  const text = readFileSync(join(dictsDir, f), "utf8");
  const entries = new Set();
  for (const m of text.matchAll(/(?:^|[,{\n])\s*"((?:\\.|[^"\\])*)"\s*:/g)) entries.add(m[1]);
  for (const m of text.matchAll(/(?:^|[,{\n])\s*'((?:\\.|[^'\\])*)'\s*:/g)) entries.add(m[1]);
  const missing = [...keys].filter((k) => !entries.has(k));
  results.push({ code, total: entries.size, missing: missing.length, list: missing });
}
results.sort((a, b) => a.missing - b.missing);
for (const r of results) console.log(`${r.code.padEnd(4)} entries=${String(r.total).padStart(5)}  missing=${r.missing}`);
/* dump full missing lists for the nine picker tongues */
import { writeFileSync } from "node:fs";
for (const code of ["sq", "hi", "pt", "zh", "ar", "fr", "ru", "es"]) {
  const r = results.find((x) => x.code === code);
  writeFileSync(`/home/z/my-project/.zscripts/missing-${code}.json`, JSON.stringify(r.list, null, 1));
}
console.log("missing lists written to .zscripts/missing-*.json");
