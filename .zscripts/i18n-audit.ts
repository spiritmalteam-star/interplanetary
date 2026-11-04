/* i18n audit — extract every t("...") / translate(...) key used in the
   app and diff against each dictionary to find missing translations. */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = "/home/z/my-project/src";
const keys = new Set<string>();
const files: string[] = [];

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|ts)$/.test(name)) files.push(p);
  }
}
walk(ROOT);

/* match t("..."), t('...') — also t(
   "multiline" ) is rare; we handle single-line only, plus
   translate(language, "...") server calls */
const reT = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const reTranslate = /\btranslate\(\s*[A-Za-z_$][\w$]*\s*,\s*(["'`])((?:\\.|(?!\1).)*)\1/g;

for (const f of files) {
  if (f.includes("/i18n/dicts/")) continue; // dict files hold values, not keys
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(reT)) {
    const key = m[2];
    // skip non-prose keys: testids, css vars, api urls
    if (key.length >= 2 && /^[\p{L}\p{N}]/u.test(key)) keys.add(key);
  }
  for (const m of src.matchAll(reTranslate)) {
    const key = m[2];
    if (key.length >= 2 && /^[\p{L}\p{N}]/u.test(key)) keys.add(key);
  }
}

/* load a dict file and collect its keys */
function dictKeys(lang: string): Set<string> {
  const src = readFileSync(`/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`, "utf8");
  const set = new Set<string>();
  const re = /\n\s*(["'`])((?:\\.|(?!\1).)*)\1\s*:/g;
  for (const m of src.matchAll(re)) set.add(m[2]);
  return set;
}

const used = [...keys].sort();
console.log(`total distinct keys used in app: ${used.length}`);

const report: Record<string, { total: number; missing: number; list: string[] }> = {};
for (const lang of ["sq", "ar", "zh", "fr", "hi", "ru", "es", "it", "el", "de", "tr"]) {
  let dk: Set<string>;
  try { dk = dictKeys(lang); } catch { dk = new Set(); }
  const missing = used.filter((k) => !dk.has(k));
  report[lang] = { total: dk.size, missing: missing.length, list: missing };
  console.log(`${lang}: dict has ${dk.size} keys, missing ${missing.length} of ${used.length}`);
}

writeFileSync("/home/z/my-project/.zscripts/i18n-audit-out.json", JSON.stringify({ used, report }, null, 2));
console.log("written .zscripts/i18n-audit-out.json");
