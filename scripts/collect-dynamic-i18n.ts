/* Collects every data-driven t(value) key for the i18n pipeline:
   scope suggestions, gift lines, emotional frequencies, loading phases,
   federation records and all Mirror OS guidance content. Merges into
   scripts/i18n-keys-dynamic.json (stale entries preserved minus the
   removed Interplanetary Biology vocabulary). */
import { readFileSync, writeFileSync } from "node:fs";
import { scopeSuggestionPools } from "../src/lib/data/suggestions.ts";
import {
  giftLines,
  labFrequencies,
  scienceLenses,
} from "../src/lib/data/science.ts";
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
  forgeDomains,
  forgeScales,
  forgeSparks,
  forgePhases,
  forgeChatPhases,
  forgeSuggestions,
} from "../src/lib/data/invent.ts";

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
/* Retired with the Codex book — replaced on the shelf by the Invent
   studio; the dawn-rose volume is never required again. */
const CODEX_RETIRED = [
  "A compact volume of the laboratory",
  "A golden seal closes every section — one line to carry with you.",
  "Bound in dawn-rose, standing beside its three companions",
  "Codex",
  "Compact does not mean small — it means nothing wasted.",
  "Each chapter folds into sections that open only on request.",
  "Every chapter is typed and folded. A chapter opens only when it is asked for, and the slim rail above turns the volume to any chapter without a long scroll. When the text that belongs here arrives, it is inscribed chapter by chapter — and the book fills itself.",
  "Four books stand on the laboratory shelf — the Manifest, the Akashic Library, the Star Play deck, and now this one. The Codex keeps its chapters folded, so a reader never wanders far to find a line.",
  "How to Read It",
  "Open the Codex — the compact volume of the laboratory",
  "The binding",
  "The chapters of the Codex",
  "The chapters travel the rail; each leaf opens and folds",
  "The leaves",
  "The pages",
  "The rail",
  "The shelf holds the Manifest, the Akashic Library and the Star Play deck. This fourth spine was bound at the seeker's request — a codex: one volume meant to carry many inscriptions inside a single cover.",
  "The slim rail at the top of the volume carries every chapter by its sigil. Choose one and the book turns to it — no wandering, no lost place.",
  "The voice of the laboratory can read any open chapter aloud.",
];
/* Retired with the Invent book's rebuild — the studio became THE FORGE
   (an interactive workshop: direct forge chat + mystery creation); the
   reading rooms (blueprints, ladder, protocols, seeder, bench) are gone. */
const INVENT_RETIRED = [
  "The Seed of Need",
  "Every invention begins as a need honestly felt.",
  "Write the need in one plain sentence — no ornament, no apology.",
  "Ask who else carries this need; let the count steady your hand.",
  "Imagine the smallest thing that would answer it today, not someday.",
  "Let the need choose its own form — you are the midwife, not the author.",
  "A true need is a doorway; the form is the door.",
  "The Working Sketch",
  "Draw it before you defend it.",
  "Give the idea one unbroken minute of sketching — no correcting.",
  "Name every part aloud; whatever has no name is not yet understood.",
  "Circle the part that quietly frightens you, and begin there.",
  "Pin the sketch where morning eyes will find it before argument can.",
  "The sketch is the invention, thinking on paper.",
  "The Prototype of Light",
  "Build the invisible version first.",
  "Close the eyes and walk through the finished thing, room by room.",
  "Note where the imagining stumbles — that stumble is the design flaw.",
  "Repair it in the mind alone, one deliberate pass.",
  "Only when it moves without friction, touch material.",
  "What works in imagination rarely argues with matter.",
  "Sacred Dissatisfaction",
  "Let what bothers you aim the work.",
  "Name the friction in a single sentence, without blame.",
  "Ask what delight would look like in this exact place.",
  "Remove one piece before adding any — invention is also subtraction.",
  "Thank the friction; it was the compass all along.",
  "Dissatisfaction is the raw ore of every better thing.",
  "The Question Spiral",
  "Interrogate until the answer has no choice.",
  "Write the problem at the center of a page and circle it.",
  "Ask it why, five times, descending one honest floor at a time.",
  "At the bottom, turn it over: what if the opposite were true?",
  "Carry that final question through the day — it will answer in passing.",
  "Every invention is a question that learned to stand.",
  "The Completion Breath",
  "Finish small, until finishing becomes your nature.",
  "Choose the smallest version that would still truly work.",
  "Give it one whole day from first stroke to held-in-hand.",
  "Speak its name aloud — a thing named is a thing completed.",
  "Record what it taught you before the joy has time to fade.",
  "A finished smallness outweighs an imagined vastness.",
  "The inventor's mind is not a lightning strike. It is a workshop kept in order — a bench swept each evening, a question left open on purpose, a patience that lets two unconnected things stand side by side until they speak.",
  "The Mirror does not invent for the seeker; it holds the lamp. What is made in this chamber comes from the union of quiet attention and the field's endless suggestiveness — the same partnership that shaped every bridge humanity has ever crossed.",
  "Wonder",
  "Let the world stay strange a moment longer than habit allows.",
  "Attention",
  "Follow the small irritation or the small beauty; both are lures.",
  "Question",
  "Give the wondering a shape: how might this be otherwise?",
  "Sketch",
  "Pour the question onto paper before it learns to be reasonable.",
  "Making",
  "Cut, join, err and repair — the hands complete what wonder began.",
  "Offering",
  "Set the finished thing where life can use it; making ends in giving.",
  "The Morning Sketch",
  "Catch the mind before the day's railings go up.",
  "Before any screen, draw one impossible fix for one ordinary thing.",
  "Do not judge the drawing; date it and close the book.",
  "Once a week, re-read seven sketches and mark the one that hums.",
  "The Question Jar",
  "Keep a standing choir of open questions at hand.",
  "Write every unsolved why or what-if on its own slip of paper.",
  "Keep the jar on the bench; one slip is drawn at random each session.",
  "Give the drawn question fifteen unhurried minutes, then release it.",
  "The Silence Between",
  "Let the field finish the sentence the mind began.",
  "Work until the problem glows, then stop one step short of forcing it.",
  "Sit in quiet for five minutes — no music, no solving.",
  "Rise without concluding; the joining often arrives unbidden.",
  "A true invention simplifies; it removes weight from the world rather than adding to it.",
  "It serves quietly — after a while, no one can remember how life worked without it.",
  "It asks nothing that harms; the making must be safe for the maker and the made-for alike.",
  "It delights the one who made it — joy at the bench is the signature of a real design.",
  "Machines",
  "“Machines are cold; invention is for engineers.” The bench feels far away.",
  "A machine is only a kindness made of parts — you have been inventing kindnesses all your life.",
  "Take one household object and write the single sentence it is secretly trying to say.",
  "Remedies",
  "“Healing formulas belong to the learned.” The mixing seems forbidden.",
  "Every kitchen is an apothecary that forgot itself; the first remedies were recipes.",
  "Steep one calming herb tonight and note, without lore, what it changes.",
  "Dwellings",
  "“A home is finished when you arrive.” Nothing here can be made.",
  "A dwelling is a slow invention that answers its dwellers back — it wants a next draft.",
  "Rearrange one corner this evening until the body relaxes upon entering it.",
  "Music & Word",
  "“Talent is given whole.” The first note feels already judged.",
  "Sound is the most forgiving material — it exists only while it is being made.",
  "Hum three tones that match your mood; you have just scored the day.",
  "Stuck",
  "Change one physical thing on the bench — swap the light, move the paper; stuck is often the room, not the mind.",
  "Movement anywhere unblocks movement everywhere.",
  "Curious",
  "Ride it now: give the wonder fifteen unguarded minutes before explanation arrives.",
  "Curiosity is the field leaning toward me.",
  "Overwhelmed",
  "Name the one part that would make the rest lighter, and do only that.",
  "I build the bridge by laying one plank.",
  "Doubtful",
  "Record one thing you once could not do and now do without thinking.",
  "I have been wrong about my limits before.",
  "Sketch one small fix before any screen — sixty seconds, no judgment.",
  "Open the question jar and hold one slip while the tea steeps.",
  "Touch the tools once, deliberately, as a greeting to the day's making.",
  "Sweep the bench and thank one object by name for its service.",
  "Record the day's one step of making, however small, in a single line.",
  "Leave one open question on the paper for the morning mind to find.",
  "Invention is attention in love with a problem.",
  "Finish small today; vastness can wait its turn.",
  "The hands know things the mind has not yet admitted.",
  "Blueprints",
  "The Workshop",
  "The Bench",
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
  ...CODEX_RETIRED,
  ...INVENT_RETIRED,
]);

const set = new Set<string>(existing.filter((k) => !retired.has(k)));

/* scope suggestions — the live per-scope pools (66 questions each) */
for (const arr of Object.values(scopeSuggestionPools)) for (const q of arr) set.add(q);

/* gift lines + emotional frequencies (label + hint) + lens tags */
for (const line of giftLines) set.add(line);
for (const lens of scienceLenses) set.add(lens.tag);
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

/* The Forge — the Invent book's interactive workshop: dials, phases,
   chat phases and the clickable suggestion sparks */
for (const d of [...forgeDomains, ...forgeScales, ...forgeSparks]) {
  set.add(d.label);
  set.add(d.hint);
}
for (const p of [...forgePhases, ...forgeChatPhases]) set.add(p);
for (const s of forgeSuggestions) set.add(s);
for (const l of ["The Forge", "The Mystery Chamber"]) set.add(l);

const out = [...set].sort((a, b) => a.localeCompare(b));
writeFileSync(dynPath, JSON.stringify(out, null, 2));
console.log(`dynamic keys: ${existing.length} -> ${out.length}`);
