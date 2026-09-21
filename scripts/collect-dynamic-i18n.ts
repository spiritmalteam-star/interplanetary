/* Collects every data-driven t(value) key for the i18n pipeline:
   scope suggestions, biology taxonomy labels, rarity tiers and all
   federation card values (badge / label / footer). Merges into
   scripts/i18n-keys-dynamic.json (existing entries preserved). */
import { readFileSync, writeFileSync } from "node:fs";
import { scopeSuggestions, suggestedQuestions } from "../src/lib/data/science.ts";
import { FAUNA_CLASSES, FLORA_LINEAGES, RARITY_TIERS } from "../src/lib/data/biology.ts";
import { federationBodies, federationTreaties, federationPrinciples } from "../src/lib/data/federation.ts";

const dynPath = "/home/z/my-project/scripts/i18n-keys-dynamic.json";
const existing: string[] = JSON.parse(readFileSync(dynPath, "utf8"));
const set = new Set<string>(existing);

for (const arr of Object.values(scopeSuggestions)) for (const q of arr) set.add(q);
for (const q of suggestedQuestions) set.add(q);
for (const c of FAUNA_CLASSES) set.add(c.label);
for (const l of FLORA_LINEAGES) set.add(l.label);
for (const r of RARITY_TIERS) set.add(r);
for (const card of [...federationBodies, ...federationTreaties, ...federationPrinciples]) {
  set.add(card.badge);
  set.add(card.label);
  set.add(card.footer);
}

/* Federation tab intro lines are dynamic t(intro.key, intro.params) lookups. */
set.add("The governing and coordinating bodies of the galactic family — {n} at present. Open any entry to view its full record and emblem.");
set.add("The {n} accords that hold the federation together — and hold it back from us. Open any entry to view its full record and emblem.");
set.add("The {n} operating principles every signatory civilization is asked to keep. Open any entry to view its full record and emblem.");

const out = [...set].sort((a, b) => a.localeCompare(b));
writeFileSync(dynPath, JSON.stringify(out, null, 2));
console.log(`dynamic keys: ${existing.length} -> ${out.length}`);
