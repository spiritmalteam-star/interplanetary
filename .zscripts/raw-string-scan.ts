/* raw-string-scan — find raw English strings in JSX that never pass
   through t() / translate(), so they render English even in Albanian.
   Scans: JSX text nodes, JSX attribute values (aria-label, title,
   placeholder, alt, aria-description), and template literals in JSX.
   Outputs a JSON report grouped by file with line numbers. */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = "/home/z/my-project/src";
const files: string[] = [];

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.tsx$/.test(name)) files.push(p);
  }
}
walk(ROOT);

/* words that mark genuine English prose (>= 3-letter lowercase words) */
const WORD = /\b[a-z][a-z'-]{2,}\b/;

/* attribute names whose raw English value is user-visible */
const VIS_ATTRS = new Set([
  "aria-label", "title", "placeholder", "alt", "aria-placeholder",
  "aria-roledescription", "aria-valuetext", "aria-description", "label",
]);

interface Hit { file: string; line: number; text: string; kind: string }

const hits: Hit[] = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const lines = src.split("\n");

  /* ---- 1. JSX text nodes: >Some English words< ---- */
  const reText = />([^<>{}\n][^<>{}\n]*)</g;
  for (const m of src.matchAll(reText)) {
    const raw = m[1].trim();
    if (raw.length < 3) continue;
    if (!WORD.test(raw)) continue;
    /* skip imports, urls, css, numbers-only, single symbols */
    if (/^(https?:|\/|\.|#|\{)/.test(raw)) continue;
    /* must contain at least two words or one known word of 4+ letters */
    const words = raw.split(/\s+/);
    if (words.length < 2 && raw.length < 5) continue;
    const line = src.slice(0, m.index).split("\n").length;
    hits.push({ file: f.replace(ROOT + "/", ""), line, text: raw.slice(0, 160), kind: "jsx-text" });
  }

  /* ---- 2. visible attributes with raw English ---- */
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const attr of VIS_ATTRS) {
      const re = new RegExp(`${attr}\\s*=\\s*"([^"{}]+)"`, "g");
      for (const m of line.matchAll(re)) {
        const raw = m[1].trim();
        if (raw.length >= 3 && WORD.test(raw)) {
          hits.push({ file: f.replace(ROOT + "/", ""), line: i + 1, text: `${attr}="${raw}"`.slice(0, 160), kind: "attr" });
        }
      }
    }
  }
}

/* group by file */
const byFile: Record<string, Hit[]> = {};
for (const h of hits) {
  (byFile[h.file] ??= []).push(h);
}
/* sort files by hit count desc */
const order = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
const report = Object.fromEntries(order);
writeFileSync("/home/z/my-project/.zscripts/raw-strings.json", JSON.stringify(report, null, 1));
console.log(`total raw hits: ${hits.length} across ${Object.keys(byFile).length} files`);
for (const [f, hs] of order.slice(0, 30)) console.log(`${hs.length}\t${f}`);
