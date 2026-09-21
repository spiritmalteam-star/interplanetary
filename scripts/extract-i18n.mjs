/* Extracts every literal t("...") key from the mirror components so the
   translation dictionaries can cover them all. Also reports dynamic
   t(value) call sites that need manual collection. */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "/home/z/my-project/src/components/mirror";
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => join(dir, f));

const keys = new Map();
const dynamicSites = [];

const literalRes = [
  /(?<![A-Za-z0-9_$.])t\(\s*"((?:[^"\\\n]|\\.)*)"/g,
  /(?<![A-Za-z0-9_$.])t\(\s*'((?:[^'\\\n]|\\.)*)'/g,
];
const dynamicRe = /(?<![A-Za-z0-9_$.])t\(\s*[^"'\s)/]/g;

for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const re of literalRes) {
    let m;
    while ((m = re.exec(src))) {
      const key = m[1]
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\");
      keys.set(key, (keys.get(key) ?? 0) + 1);
    }
  }
  const lines = src.split("\n");
  let m2;
  dynamicRe.lastIndex = 0;
  while ((m2 = dynamicRe.exec(src))) {
    const lineNo = src.slice(0, m2.index).split("\n").length;
    dynamicSites.push(`${f.split("/").pop()}:${lineNo}: ${lines[lineNo - 1].trim()}`);
  }
}

const sorted = [...keys.keys()].sort((a, b) => a.localeCompare(b));
writeFileSync(
  "/home/z/my-project/scripts/i18n-keys.json",
  JSON.stringify(sorted, null, 2)
);

console.log(`literal keys: ${sorted.length}`);
console.log(`\n--- dynamic t(value) sites (collect these manually) ---`);
for (const s of dynamicSites) console.log(s);
