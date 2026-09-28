import { readFileSync } from "node:fs";
const keys = ["A Volume Waiting for Its Ink","A book is a door that has learned to wait.","A compact volume of the laboratory","A golden seal closes every section — one line to carry with you.","Bound in dawn-rose, standing beside its three companions","Codex","Compact does not mean small — it means nothing wasted.","Each chapter folds into sections that open only on request.","Every chapter is typed and folded. A chapter opens only when it is asked for, and the slim rail above turns the volume to any chapter without a long scroll. When the text that belongs here arrives, it is inscribed chapter by chapter — and the book fills itself.","Four books stand on the laboratory shelf — the Manifest, the Akashic Library, the Star Play deck, and now this one. The Codex keeps its chapters folded, so a reader never wanders far to find a line.","How to Read It","Open the Codex — the compact volume of the laboratory","The binding","The chapters of the Codex","The chapters travel the rail; each leaf opens and folds","The leaves","The pages","The rail","The shelf holds the Manifest, the Akashic Library and the Star Play deck. This fourth spine was bound at the seeker's request — a codex: one volume meant to carry many inscriptions inside a single cover.","The slim rail at the top of the volume carries every chapter by its sigil. Choose one and the book turns to it — no wandering, no lost place.","The voice of the laboratory can read any open chapter aloud."];
for (const lang of ["sq","it","el","de","fr","es","tr"]) {
  const src = readFileSync(`/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`,"utf8");
  const pairRe = /"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const dict = new Map(); let m, dupes = 0;
  while ((m = pairRe.exec(src))) {
    const k = m[1].replace(/\\"/g,'"').replace(/\\\\/g,"\\");
    if (dict.has(k)) dupes++;
    dict.set(k, m[2]);
  }
  let fails = [];
  for (const k of keys) {
    const v = dict.get(k);
    if (!v) { fails.push(`missing: ${k.slice(0,40)}`); continue; }
    if (v === k && k !== "Codex") fails.push(`untranslated: ${k.slice(0,40)}`);
    // em dash preservation: every em dash in key must appear in value
    const keyDashes = (k.match(/—/g) || []).length;
    const valDashes = (v.match(/—/g) || []).length;
    if (keyDashes !== valDashes) fails.push(`em dash mismatch: ${k.slice(0,40)}`);
  }
  // style: fr must not contain U+2019 anywhere in the NEW block; tr must not contain ASCII ' in its block
  const block = src.split("/* ---- additions: Task 43")[1] ?? "";
  if (lang === "fr" && block.includes("\u2019")) fails.push("fr: curly apostrophe in new block");
  if (lang === "it" && block.includes("\u2019")) fails.push("it: curly apostrophe in new block");
  if (lang === "tr" && /Codex'|Kütüphanesi'|Tezahür'/.test(block)) fails.push("tr: ASCII apostrophe in new possessives");
  const finalBraces = (src.match(/^};$/gm) || []).length;
  console.log(`${lang}: entries=${dict.size} dupes=${dupes} finalClose=${finalBraces} ${fails.length ? "FAIL " + fails.join(" | ") : "OK"}`);
  if (fails.length) process.exitCode = 1;
}
