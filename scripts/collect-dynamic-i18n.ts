/* Collects every data-driven t(value) key for the i18n pipeline:
   scope suggestions, gift lines, emotional frequencies, loading phases,
   federation records and all Mirror OS guidance content. Merges into
   scripts/i18n-keys-dynamic.json (stale entries preserved minus the
   removed Interplanetary Biology vocabulary). */
import { readFileSync, writeFileSync } from "node:fs";
import { scopeSuggestionPools } from "../src/lib/data/suggestions.ts";
import { giftLines, labFrequencies } from "../src/lib/data/science.ts";
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
  osOpeners,
  morningPool,
  eveningPool,
  focusPool,
} from "../src/lib/data/mirroros.ts";
import {
  CRAFT_PHASES,
  KIND_LABEL,
  STEPS_LABEL_HERBAL,
  STEPS_LABEL_PRACTICE,
} from "../src/lib/data/remedy.ts";
import {
  codexTitle,
  codexSubtitle,
  codexIntro,
  codexChapters,
} from "../src/lib/data/codex.ts";

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
/* Retired with the old science suggestion pool — the pool now holds
   strictly real-science questions (see src/lib/data/suggestions.ts). */
const SCIENCE_POOL_RETIRED = [
  "How do scientists study consciousness without reducing it to neurons?",
  "What should we ask when a discovery sounds too beautiful to be true?",
  "Why is skepticism a gift to the truth rather than its enemy?",
  "How close is real science to understanding zero-point energy?",
  "What is dark energy actually doing to the expansion of everything?",
  "Why does nature prefer symmetry, and where does it quietly break?",
  "How does order emerge from chaos without anyone arranging it?",
  "What is time, and why does it only run one way?",
  "Why did the universe make just enough matter to build stars?",
  "What is the universe expanding into, and is that even the right question?",
  "How do neurons make a thought, and where does the self sit?",
  "What are the deep rules that let simple cells become forests and minds?",
  "Why is mathematics so unreasonably good at describing the world?",
  "What keeps a proton from unraveling across the whole lifetime of the universe?",
  "How does DNA carry a memory older than our oldest cities?",
  "What is dark matter doing right now, threading through this room?",
  "Why do waves, from oceans to light, follow the same deep grammar?",
  "How did life decide to use carbon, water, and sunlight?",
  "What happens in the last second before a star becomes a supernova?",
  "Why does sleep fold memories so neatly, and what decides what stays?",
  "What would a theory of everything still leave unexplained?",
  "How does a single fertilized cell know to become a whale or an oak?",
  "Why do the same spirals appear in sunflowers and in galaxies?",
  "What is information, and why does the universe seem to keep every bit?",
  "How does the brain build color out of colorless light?",
  "How do stars spend their whole lives turning hydrogen into everything we love?",
  "Why does the same law of gravity hold in every galaxy we can see?",
  "What is an honest experiment, and how does it protect us from ourselves?",
  "How do placebos teach the body to speak in chemistry?",
  "What is the oldest light we can still catch, and where did it travel from?",
  "Why do flocks and fish schools move as one mind without a leader?",
  "What is entropy, and why does it give time its arrow?",
  "How does evolution invent eyes more than once in different lineages?",
  "What is the smallest thing that can still be called alive?",
  "Why does the moon hold two tides at once, one on each side?",
  "How does the immune system remember an enemy it has never met?",
  "What are the limits of what a microscope or a telescope can ever show?",
  "Why does music, which is only air, rearrange the nervous system?",
  "What is a black hole doing with everything it gathers?",
  "How do mountains grow, and how slowly do they die?",
  "Why is the night sky dark if the stars go on forever?",
  "What is the gut microbiome teaching the brain it lives beneath?",
  "How does a question in science differ from a wish?",
  "What lets water dissolve almost everything and still nourish life?",
  "Why do we dream, and what is the brain practicing in the dark?",
  "What is the strongest evidence that the future of the universe is open?",
  "How do enzymes fold ten thousand times a second without mistake?",
  "Why do quasars shine brighter than whole galaxies from such small engines?",
  "What is the deepest layer of the ocean still hiding from our cameras?",
  "How does memory rebuild itself slightly differently every time we remember?",
  "Why does hydrogen, the simplest atom, hold the whole story of the first three minutes?",
  "What makes a planet habitable, and how rare is that recipe?",
  "How do coral reefs keep a calendar written in moonlight?",
  "What is the exact shape of a heartbeat, and who sets its rhythm?",
  "Why do identical twins diverge, and what writes the differences?",
  "How does a volcano keep the pressure of a thousand quiet years?",
  "Why does empty space refuse to be truly empty?",
  "How do languages evolve under the same pressures as living species?",
  "When did chemistry first cross the line into biology on early Earth?",
  "Why does the human hand carry so much of the brain's map?",
  "What does a glacier archive that no human ever wrote down?",
  "How do scientists weigh a planet they will never visit?",
  "Why do we share almost every gene with a fruit fly, and still differ?",
  "What is the fastest message matter can send, and why can nothing outrun it?",
  "How does a forest share sugar and warnings through its underground threads?",
  "What remains genuinely unknown about consciousness that no scan can yet touch?",
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
  ...SCIENCE_POOL_RETIRED,
]);

const set = new Set<string>(existing.filter((k) => !retired.has(k)));

/* scope suggestions — the live per-scope pools (66 questions each) */
for (const arr of Object.values(scopeSuggestionPools)) for (const q of arr) set.add(q);

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

/* Mirror Entity OS — direct-line openers + chamber node labels */
for (const o of osOpeners) set.add(o);
for (const l of ["The Core", "Shift Formulas", "Higher Mind", "Tools", "Forge"]) {
  set.add(l);
}

/* The Healing Apothecary — craft phases, remedy kinds and step headings */
for (const p of CRAFT_PHASES) set.add(p);
for (const label of Object.values(KIND_LABEL)) set.add(label);
set.add(STEPS_LABEL_HERBAL);
set.add(STEPS_LABEL_PRACTICE);

/* The Codex — the fourth book: title, subtitle, intro and every chapter */
set.add(codexTitle);
set.add(codexSubtitle);
for (const p of codexIntro) set.add(p);
for (const c of codexChapters) {
  set.add(c.title);
  set.add(c.tagline);
  for (const s of c.sections) {
    if (s.heading) set.add(s.heading);
    for (const p of s.body ?? []) set.add(p);
    for (const li of s.list ?? []) set.add(li);
    if (s.seal) set.add(s.seal);
  }
}

const out = [...set].sort((a, b) => a.localeCompare(b));
writeFileSync(dynPath, JSON.stringify(out, null, 2));
console.log(`dynamic keys: ${existing.length} -> ${out.length}`);
