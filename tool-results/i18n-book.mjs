import fs from "fs";

const withLove = {
  de: "Mit Liebe", el: "Με αγάπη", es: "Con amor",
  fr: "Avec amour", it: "Con amore", sq: "Me dashuri", tr: "Sevgiyle",
};

for (const [lang, wl] of Object.entries(withLove)) {
  const p = `src/lib/i18n/dicts/${lang}.ts`;
  let src = fs.readFileSync(p, "utf8");
  // 1) "With love ❤️" key → "With love" (value minus emoji)
  const m = src.match(/"With love ❤️":\s*"([^"]*)"/);
  if (m) {
    let val = m[1].replace(/\s*❤️\s*/g, "").trim();
    src = src.replace(/"With love ❤️":\s*"[^"]*"/, `"With love": ${JSON.stringify(val)}`);
  } else if (!src.includes('"With love"')) {
    // key missing entirely — append
    const last = src.lastIndexOf("};");
    src = src.slice(0, last) + `  "With love": ${JSON.stringify(wl)},\n` + src.slice(last);
  }
  // 2) Manifesting key without ❤️
  src = src.replace(
    /"Manifesting complements action · it never replaces it · Free will honored always ❤️":/,
    '"Manifesting complements action · it never replaces it · Free will honored always":'
  );
  fs.writeFileSync(p, src);
  console.log(p, "ok");
}
console.log("DONE");
