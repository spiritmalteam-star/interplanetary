/* Collects every data-driven t(value) key for the i18n pipeline:
   scope suggestions, gift lines, emotional frequencies, loading phases,
   federation records and all Mirror OS guidance content. Merges into
   scripts/i18n-keys-dynamic.json (stale entries preserved minus the
   removed Interplanetary Biology vocabulary). */
import { readFileSync, writeFileSync } from "node:fs";
import { scopeSuggestions, suggestedQuestions, giftLines, labFrequencies } from "../src/lib/data/science.ts";
import { federationBodies, federationTreaties, federationPrinciples } from "../src/lib/data/federation.ts";
import { SCOPE_META } from "../src/lib/entity-utils.ts";
import {
  shiftFormulas,
  higherMindIntro,
  ladderRungs,
  higherProtocols,
  discernmentLines,
  beliefDomains,
  vibrationStates,
  morningPool,
  eveningPool,
  focusPool,
} from "../src/lib/data/mirroros.ts";

const dynPath = "/home/z/my-project/scripts/i18n-keys-dynamic.json";
const existing: string[] = JSON.parse(readFileSync(dynPath, "utf8"));

/* Removed with the Interplanetary Biology module — never required again. */
const BIOLOGY_RETIRED = [
  "Interplanetary Biology", "Living archive collections", "Fauna ({n})", "Flora ({n})",
  "Fauna archive", "Flora archive", "Fauna species", "Flora species",
  "Specimens catalogued", "Search the living archive", "Search the living archive…",
  "Switch to the fauna archive ({n})", "Switch to the flora archive ({n})",
  "Specimen not found",
  "No specimens match this search — every one of the {n} exists, try a shorter search.",
  "Classes", "Lineages", "Origin civilization", "Field traits", "Field note",
  "Habitat", "Diet", "Temperament", "Size", "Lifespan", "Bloom cycle", "Scent",
  "Height", "Properties",
  "Every catalogued being — {f} fauna and {fl} flora — carries its origin civilization, its field traits and its herbarium plate, exactly as the survey teams recorded it.",
  "Please tell me about the specimen {name} (registry {no}, {group} of the {origin}) — its nature, its field traits, and what its presence mirrors back to us.",
  "5D – 9D", "Aerial floater", "Ground grazer", "Apex predator", "Deep-ocean dweller",
  "Colonial swarm", "Crystalline grazer", "Burrow engineer", "Canopy glider",
  "Lantern lineage", "Spiral lineage", "Glass lineage", "Ember lineage",
  "Tide lineage", "Moss lineage", "Whisper lineage", "Bloom-giant lineage",
  "Common in federation records", "Recorded across several systems",
  "Rare — a few confirmed sightings", "Elusive — one sighting per cycle",
  "Singularity — a single known specimen", "Registry", "Genus",
];
const retired = new Set([
  ...BIOLOGY_RETIRED,
  /* removed chat classification block */
  "Documented science",
  "This transmission draws on established, verifiable science.",
  "Speculative theory",
  "Grounded in credible but unproven hypotheses — hold it lightly.",
  "Spiritual tradition",
  "Reflects spiritual and channeled traditions — offered for reflection, not as verified science.",
  "World-building",
  "A creative, fictional cosmology from the Mirror archive — for wonder, not evidence.",
  "Symbolic reading",
  "A symbolic interpretation offered at your request — the meaning is yours to keep.",
  "Archive reflection",
  "Held gently by the archive — verify inwardly what resonates.",
]);

const set = new Set<string>(existing.filter((k) => !retired.has(k)));

/* scope suggestions + universal questions */
for (const arr of Object.values(scopeSuggestions)) for (const q of arr) set.add(q);
for (const q of suggestedQuestions) set.add(q);

/* gift lines + emotional frequencies (label + hint) */
for (const line of giftLines) set.add(line);
for (const f of labFrequencies) {
  set.add(f.label);
  set.add(f.hint);
}

/* per-scope loading phases */
for (const meta of Object.values(SCOPE_META)) for (const p of meta.phases) set.add(p);

/* federation records */
for (const card of [...federationBodies, ...federationTreaties, ...federationPrinciples]) {
  set.add(card.badge);
  set.add(card.label);
  set.add(card.footer);
}
set.add("The governing and coordinating bodies of the galactic family — {n} at present. Open any entry to view its full record and emblem.");
set.add("The {n} accords that hold the federation together — and hold it back from us. Open any entry to view its full record and emblem.");
set.add("The {n} operating principles every signatory civilization is asked to keep. Open any entry to view its full record and emblem.");

/* Mirror OS — Reality Guidance content */
for (const f of shiftFormulas) {
  set.add(f.name);
  set.add(f.tagline);
  for (const s of f.steps) set.add(s);
  set.add(f.seal);
}
for (const p of higherMindIntro) set.add(p);
for (const r of ladderRungs) {
  set.add(r.title);
  set.add(r.line);
}
for (const p of higherProtocols) {
  set.add(p.name);
  set.add(p.purpose);
  for (const s of p.steps) set.add(s);
}
for (const d of discernmentLines) set.add(d);
for (const b of beliefDomains) {
  set.add(b.label);
  set.add(b.pattern);
  set.add(b.reframe);
  set.add(b.practice);
}
for (const v of vibrationStates) {
  set.add(v.label);
  set.add(v.bridge);
  set.add(v.anchor);
}
for (const m of morningPool) set.add(m);
for (const e of eveningPool) set.add(e);
for (const f of focusPool) set.add(f);

const out = [...set].sort((a, b) => a.localeCompare(b));
writeFileSync(dynPath, JSON.stringify(out, null, 2));
console.log(`dynamic keys: ${existing.length} -> ${out.length}`);
