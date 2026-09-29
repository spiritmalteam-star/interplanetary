import { readFileSync } from "node:fs";
const src = readFileSync("/home/z/my-project/src/lib/i18n/dicts/de.ts", "utf8");
const pairRe = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
const dict = new Map();
let m;
while ((m = pairRe.exec(src))) {
  const k = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (dict.has(k)) console.log("DUP:", JSON.stringify(k));
  dict.set(k, m[2]);
}
const keysLiterals = JSON.parse(readFileSync("/home/z/my-project/scripts/i18n-keys.json", "utf8"));
const dyn = JSON.parse(readFileSync("/home/z/my-project/scripts/i18n-keys-dynamic.json", "utf8"));
const ALL = [...new Set([...keysLiterals, ...dyn])];
console.log("de missing:", ALL.filter((k) => !dict.has(k)).length);
for (const k of ALL) {
  const v = dict.get(k);
  if (v === k && !/^(?:\d+D\s–\s\d+D|Ring (?:I|II|III|IV|V)|Accord [IVX]+|Charter I|Principle \d+|Prime Accord)$/.test(k))
    console.log("NOTE:", JSON.stringify(k), "→", JSON.stringify(v));
}
