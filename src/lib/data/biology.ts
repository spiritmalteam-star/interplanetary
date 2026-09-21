import { civilizations } from "./civilizations";
import type { FaunaSpecimen, FloraSpecimen, SpecimenKind } from "@/lib/mirror-types";

/* Interplanetary Biology — the v1.3 living-archive wing.
 *
 * DETERMINISTIC CONTRACT
 * ----------------------
 * Every specimen is derived from a mulberry32 PRNG seeded per specimen:
 *     fauna: seed = (0x9e3779b9 ^ index) >>> 0
 *     flora: seed = (0x9e3779b9 ^ 0x85ebca6b ^ index) >>> 0
 * There is no Math.random(), no Date.now(), no ambient state: the same build
 * always produces the same universe (same names, same traits, same plates).
 *
 * Field-guide plates: artIndex = hash32(genus) % 24, so every specimen of one
 * genus shares a plate, the way real natural-history books reuse a plate for
 * a whole genus. Plates live at /images/biology/{fauna|flora}-NN.jpg (NN = 01..24).
 *
 * Registry numbers follow generation order: BIO-FA-0001…1200, BIO-FL-0001…1500.
 * All pools below are handcrafted; nothing here is fetched or computed slowly —
 * building all 2,700 specimens at module load is pure string work (<100ms).
 */

/* ------------------------------------------------------------------ */
/*  Deterministic helpers                                             */
/* ------------------------------------------------------------------ */

/** mulberry32 — same implementation pattern as scripts/gen-images.mjs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash — stable across builds for a given string. */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick exactly 4 distinct traits from a pool of ≥18 phrases. */
function pickTraits(rng: () => number, pool: readonly string[]): string[] {
  const chosen: string[] = [];
  const usedIdx = new Set<number>();
  let guard = 0;
  while (chosen.length < 4 && guard < 200) {
    const idx = Math.floor(rng() * pool.length);
    if (!usedIdx.has(idx)) {
      usedIdx.add(idx);
      chosen.push(pool[idx]);
    }
    guard++;
  }
  return chosen;
}

const ROMAN_SUFFIXES = [" II", " III", " IV"] as const;

/** Draw a unique "Genus Epithet" name; re-draws on collision, bounded, then
 *  falls back to appending a roman numeral. Returns name and its genus. */
function drawName(
  rng: () => number,
  genera: readonly string[],
  epithets: readonly string[],
  used: Set<string>,
): { name: string; genus: string } {
  let genus = pick(rng, genera);
  let name = `${genus} ${pick(rng, epithets)}`;
  let attempts = 0;
  while (used.has(name) && attempts < 64) {
    genus = pick(rng, genera);
    name = `${genus} ${pick(rng, epithets)}`;
    attempts++;
  }
  if (used.has(name)) {
    for (const suffix of ROMAN_SUFFIXES) {
      if (!used.has(name + suffix)) {
        name = name + suffix;
        break;
      }
    }
  }
  used.add(name);
  return { name, genus };
}

/* ------------------------------------------------------------------ */
/*  Fixed vocabularies                                                */
/* ------------------------------------------------------------------ */

export const FAUNA_CLASSES: { id: string; label: string }[] = [
  { id: "aerial-floater", label: "Aerial floater" },
  { id: "ground-grazer", label: "Ground grazer" },
  { id: "apex-predator", label: "Apex predator" },
  { id: "deep-ocean", label: "Deep-ocean dweller" },
  { id: "colonial-swarm", label: "Colonial swarm" },
  { id: "crystalline", label: "Crystalline grazer" },
  { id: "burrow-engineer", label: "Burrow engineer" },
  { id: "canopy-glider", label: "Canopy glider" },
];

export const FLORA_LINEAGES: { id: string; label: string }[] = [
  { id: "lantern", label: "Lantern lineage" },
  { id: "spiral", label: "Spiral lineage" },
  { id: "glass", label: "Glass lineage" },
  { id: "ember", label: "Ember lineage" },
  { id: "tide", label: "Tide lineage" },
  { id: "moss", label: "Moss lineage" },
  { id: "whisper", label: "Whisper lineage" },
  { id: "bloom-giant", label: "Bloom-giant lineage" },
];

export const RARITY_TIERS: string[] = [
  "Common in federation records",
  "Recorded across several systems",
  "Rare — a few confirmed sightings",
  "Elusive — one sighting per cycle",
  "Singularity — a single known specimen",
];

/* 60 fauna + 60 flora single-word genus tokens. */
const FAUNA_GENERA: string[] = [
  "Velmora", "Thalune", "Ossivar", "Quorren", "Ashvane", "Brilloth",
  "Cindralux", "Dornath", "Elowen", "Faelor", "Graveth", "Hollivar",
  "Iskrene", "Jorune", "Kaveth", "Lumenor", "Myrren", "Nyxalis",
  "Ophiran", "Pellavor", "Quessari", "Ravennar", "Solvane", "Torveil",
  "Umarath", "Veskarn", "Wrennavar", "Xanthis", "Yarrowen", "Zephyrion",
  "Aldrava", "Belthara", "Craloth", "Duvenor", "Embara", "Fyrell",
  "Glaiven", "Hushara", "Ithric", "Javenne", "Krelnor", "Lotheric",
  "Mavreen", "Noverre", "Ondrelith", "Perrivale", "Quorvath", "Ruskara",
  "Selnor", "Tavoreth", "Umbravane", "Vashkar", "Wessarine", "Xilvaren",
  "Yggrath", "Zorvane", "Aurivelle", "Bordune", "Celovar", "Draventh",
];

const FLORA_GENERA: string[] = [
  "Selunara", "Emberis", "Vaelith", "Murnath", "Oryelle", "Pelluvia",
  "Quandrel", "Rosivane", "Sylvarine", "Tendralis", "Umaveth", "Verdanth",
  "Wispervine", "Xylorae", "Yselde", "Zinnvare", "Ambrisse", "Bellamor",
  "Corvenne", "Dunyarel", "Eirvane", "Fenvale", "Glimmeroot", "Halovene",
  "Irivelle", "Jassevar", "Kolvane", "Lurristel", "Mistralei", "Nimbelle",
  "Opheliar", "Petralune", "Quillarine", "Rillith", "Sorvenna", "Tassavine",
  "Uvariel", "Violdrath", "Winternell", "Xanthelle", "Ysolanth", "Zennalore",
  "Aravene", "Brightmoss", "Chalicea", "Dewmorra", "Esterelle", "Fernhollow",
  "Glorivane", "Hollowspire", "Icerune", "Junivere", "Kindleth", "Luzmarelle",
  "Meridelle", "Nettlevine", "Orchaline", "Prismavere", "Riventhal", "Solstira",
];

/* ≥80 epithets per kind; Name = "Genus Epithet". */
const FAUNA_EPITHETS: string[] = [
  "Sky-drift", "Cloud-rester", "Dusk-walker", "Dawn-singer", "Storm-caller",
  "Moss-back", "Fern-hides", "Salt-maned", "Frost-hoof", "Ember-eyed",
  "Glass-antlered", "Night-veiled", "Tide-follower", "Stone-browed", "Star-gazer",
  "Wind-borne", "Deep-voiced", "Silken-flanked", "Amber-tusked", "Quill-crowned",
  "Sun-drinker", "Mist-hunter", "Ridge-runner", "Hollow-boned", "Lantern-throated",
  "Comet-tailed", "Aurora-winged", "Sage-eyed", "Dune-born", "Ice-veined",
  "Shadow-pacer", "Ember-crested", "Moon-marked", "Grief-singer", "Salt-bright",
  "Thorn-maned", "Ripple-backed", "Hearth-warm", "Cloud-veiled", "Star-nosed",
  "Bough-leaper", "Coil-tailed", "Light-keeper", "Drift-sleeper", "Vane-winged",
  "Bell-throated", "Murk-eyed", "Gleam-horned", "Fathom-slow", "Seed-hoarder",
  "Dusk-prowler", "Sigh-voiced", "Slate-clawed", "Lumen-finned", "Vapor-crowned",
  "Cliff-born", "Velvet-footed", "Whisper-pelt", "Gale-rider", "Frost-lunged",
  "Bloom-chinned", "Twilight-antlered", "Opal-scaled", "Hollow-horned", "Star-veiled",
  "Sun-spined", "Mist-pawed", "Coil-horned", "Ember-bellied", "Gale-throated",
  "Ripple-finned", "Slate-beaked", "Vellum-winged", "Thistle-maned", "Auroral-crested",
  "Basin-drinker", "Cradle-sleeper", "Summit-dweller", "Lantern-eyed", "Comet-maned",
  "Glass-finned", "Drift-antlered", "Pole-wanderer", "Ember-throated",
];

const FLORA_EPITHETS: string[] = [
  "Bright-lantern", "Dewmantle", "Night-bloomer", "Sun-cradle", "Mist-weaver",
  "Glass-petalled", "Ember-heart", "Tide-cradled", "Moon-scented", "Star-threaded",
  "Frost-blooming", "Honey-veined", "Shadow-drinking", "Spiral-fruiting", "Silver-rooted",
  "Whisper-leaved", "Bloom-heavy", "Cloud-feeding", "Storm-flowering", "Dusk-opening",
  "Gold-throated", "Moss-footed", "Star-hung", "Salt-gladdened", "Dream-bearing",
  "Ember-seeded", "Glass-fruited", "Lantern-cupped", "Rain-keeping", "Hollow-hearted",
  "Dawn-scented", "Spiral-climbing", "Frost-veiled", "Nectar-deep", "Moon-watered",
  "Aurora-petalled", "Stone-hugging", "Wind-pollinated", "Light-drinking", "Tide-ring",
  "Ember-veined", "Cloud-rooted", "Star-counting", "Honey-throated", "Night-fruiting",
  "Grief-blooming", "Glass-belled", "Spiral-seeded", "Silver-leafed", "Dawn-flowering",
  "Mist-veiled", "Ember-barked", "Moon-cupped", "Shadow-flowering", "Star-crowned",
  "Dew-hoarding", "Sun-bowed", "Frost-fruiting", "Lantern-hearted", "Whisper-rooted",
  "Tide-singing", "Glass-veiled", "Bloom-spilling", "Gold-veined", "Night-scented",
  "Aurora-veined", "Moss-crowned", "Spiral-lit", "Ember-cupped", "Star-swaddled",
  "Rain-cradled", "Honey-barked", "Dawn-fruiting", "Frost-hearted", "Glass-rooted",
  "Lantern-veined", "Moon-marked", "Shadow-blooming", "Tide-lulled", "Whisper-cupped",
  "Spiral-throated", "Sun-sleeping", "Bloom-patient", "Star-banked",
];

/* ------------------------------------------------------------------ */
/*  Origin worlds — per civilization family flavor lines              */
/* ------------------------------------------------------------------ */

const ORIGIN_WORLD_FLAVOR: Record<string, string[]> = {
  pleiadian: [
    "the Taygetan meadow worlds",
    "the Alcyone temple gardens",
    "the Seven Sisters' orchard moons",
  ],
  sirian: [
    "the Omkari tidelands of Sirius B",
    "the star-gate academies of Sirius A",
    "the cetacean singing-shallows",
  ],
  arcturian: [
    "Arcturus' ninth crystalline city",
    "the frequency temples of Boötes",
    "the sanctuary-geometry conservatories",
  ],
  lyran: [
    "the rebuilt cradle-worlds of Lyra",
    "the lion-gate savannas",
    "the pridelands behind the Hall of First Names",
  ],
  andromedan: [
    "the between-galaxies wandering stations",
    "the Zenith Gate midpoint gardens",
    "the sky-rivers of the Andromeda spiral",
  ],
  "inner-earth": [
    "the crystal concourse of Agartha",
    "the garden terraces of Telos",
    "the hollowway cities beneath the ranges",
  ],
  "solar-neighbors": [
    "the venusian temple terraces",
    "the martian rectification canyons",
    "the Jovian moon outposts",
  ],
  nordic: [
    "the Procyon colony pastures",
    "the high plateau worlds of the tall whites",
    "the Pleiadian-linked colony fields",
  ],
  "feline-canine": [
    "the hearth-prides of Lyra",
    "the canine watchlands of Sirius",
    "the firelit guard-fields",
  ],
  "aquatic-reptilian": [
    "the conscious oceans of Earth",
    "the deep cetacean trenches of Sirius B",
    "the marsh-edges of the Draconis systems",
  ],
  "insectoid-mantid": [
    "the Mantid observatories of Orion's outer arms",
    "the genetic archive vaults beyond Zeta Reticuli",
    "the threshold-ceremony groves",
  ],
  avian: [
    "the wind-passage portals of the blue guardians",
    "the migration spires between densities",
    "the threshold rookeries",
  ],
  crystalline: [
    "the grid-temples of pure pattern",
    "the light-lattice conservatories",
    "the tonal geometry fields",
  ],
  hybrid: [
    "the Zeta–human interface habitats",
    "the meeting gardens of two lineages",
    "the between-home settlements",
  ],
  "other-nations": [
    "the quiet addresses of Mintaka",
    "Aldebaran's terraced valleys",
    "the unnamed villages of the federated family",
  ],
  "tau-ceti": [
    "the frontier farms of the near sun",
    "the rough-map survey plains",
    "the settler coastlines of Tau Ceti",
  ],
  vega: [
    "the harmonic universities of Vega",
    "the dusk-humming cities of the harp-star",
    "the tonal treaty gardens",
  ],
  "epsilon-eridani": [
    "the orbital garden belt",
    "the living-ship nurseries",
    "the seeding greenhouses of the Accord",
  ],
  "zeta-reticuli": [
    "the Archive Ring habitats",
    "the watch-station corridors",
    "the holographic record halls",
  ],
  mintaka: [
    "the forge-dawns of Mintaka",
    "the ember hearth-worlds",
    "the rekindling stations of Orion's belt",
  ],
};

/** The 20 recorded families, reduced to id + name (from civilizations.ts). */
const CIVILIZATION_FAMILIES = civilizations.map((c) => ({ id: c.id, name: c.name }));

/* ------------------------------------------------------------------ */
/*  Fauna pools                                                       */
/* ------------------------------------------------------------------ */

const FAUNA_HABITATS: string[] = [
  "high-altitude cloud shelves",
  "tidal glass flats",
  "the deep thermal reefs",
  "old-growth canopy layers",
  "burrow-warrens beneath crystal steppes",
  "open savanna of low-gravity worlds",
  "magnetized dune seas",
  "the lightless hadal trenches",
  "symbiotic host forests",
  "aerial plankton rivers",
  "cave-rivers lit by lantern moss",
  "frost meadows above the treeline",
];

const FAUNA_HABITAT_EXTRAS: Record<string, string[]> = {
  "aerial-floater": [
    "the high cloud-shelves at the edge of breathable air",
    "the equinox wind-rivers above the trade lanes",
  ],
  "ground-grazer": [
    "the open savannas of the low-gravity steppes",
    "the long grass corridors between salt flats",
  ],
  "apex-predator": [
    "ridgelines and shadowed canyons",
    "the tall-grass margins of herding plains",
  ],
  "deep-ocean": [
    "the lightless hadal trenches",
    "the thermal vent fields of the deep rifts",
  ],
  "colonial-swarm": [
    "the hollow galleries of giant host trees",
    "warm cliff-hives above the river bends",
  ],
  crystalline: [
    "the resonant crystal steppes",
    "the singing quartz canyons",
  ],
  "burrow-engineer": [
    "warren systems beneath old lava tubes",
    "soft loess hills riddled with engineered tunnels",
  ],
  "canopy-glider": [
    "the middle canopy of old-growth sky forests",
    "the emergent crowns above the mist line",
  ],
};

const FAUNA_DIETS: string[] = [
  "sun-filtered plankton",
  "mineral lichen",
  "electric field grains",
  "nectar of night-blooming flora",
  "small swarm-fauna",
  "drifting spore-veils",
  "kelp-forest fronds",
  "detritus of the canopy fall",
  "thermal vent bacteria",
  "starlight (photosynthetic skin)",
  "fungal root-milk",
  "crystal sap",
];

const FAUNA_DIET_EXTRAS: Record<string, string[]> = {
  "aerial-floater": [
    "airborne spore-veils at altitude",
    "condensation rich with sky-minerals",
  ],
  "ground-grazer": [
    "mineral lichen and sweet steppe grass",
    "fallen fruit of the migration trees",
  ],
  "apex-predator": [
    "large herd-fauna taken cleanly",
    "swarm-colonies pried from cliff crevices",
  ],
  "deep-ocean": [
    "thermal vent bacteria",
    "the falling snow of the upper ocean",
  ],
  "colonial-swarm": [
    "nectar farmed from lineage-flowers",
    "fungus cultivated in hive gardens",
  ],
  crystalline: [
    "starlight filtered through quartz",
    "seismic mineral broths",
  ],
  "burrow-engineer": [
    "root vegetables of its own replanting",
    "stored seeds by vintage",
  ],
  "canopy-glider": [
    "canopy fruit and gliding insects",
    "sweet sap tapped from glass-lineage trees",
  ],
};

const FAUNA_TEMPERAMENTS: string[] = [
  "serene",
  "curious but shy",
  "fiercely territorial",
  "gentle and gregarious",
  "solitary until dusk",
  "playful with strangers",
  "wary, never hostile",
  "imperious",
  "docile in crowds",
  "skittish",
  "stoic",
  "mischievous",
];

const FAUNA_SIZES: string[] = [
  "hand-sized",
  "hound-sized",
  "pony-sized",
  "the height of a standing adult",
  "wide as a courtyard",
  "colossal — visible from orbit",
  "small as a sparrow",
  "the bulk of a cargo hauler",
  "two palms across",
  "the length of a river barge",
  "barely visible to the eye",
  "broader than a federation landing pad",
];

const FAUNA_LIFESPANS: string[] = [
  "one short season",
  "a dozen standard years",
  "three human generations",
  "a full federated cycle",
  "centuries, by the banding record",
  "functionally ageless",
  "a single long day",
  "two hundred tides",
  "nine decades",
  "one orbital year of its host world",
  "unknown — longer than the survey",
  "a handful of winters",
];

/* ≥18 field-note trait phrases per fauna class. */
const FAUNA_TRAITS: Record<string, string[]> = {
  "aerial-floater": [
    "Stores starlight in dorsal lenses",
    "Rides thermals it makes itself",
    "Changes altitude by mood",
    "Hums at 432 Hz when content",
    "Deflates one chamber to gesture agreement",
    "Navigates by the taste of the wind",
    "Sleeps drift-tethered to its kin",
    "Glints rainbow when startled",
    "Carries its young like lanterns",
    "Whistles a two-note warning before storms",
    "Never descends below the cloud deck by choice",
    "Bares a silver throat to signal peace",
    "Leaks faint light when dreaming",
    "Molts a sail of fine membrane each spring",
    "Steers with a trailing ribbon-tail",
    "Greets dawn by releasing stored light",
    "Sheds ballast sand when excited",
    "Responds to humming within a mile",
  ],
  "ground-grazer": [
    "Trails a moss garden on its back",
    "Kneels to drink only from moving water",
    "Remembers salt licks across generations",
    "Growls contentment in low registers",
    "Walks the same loop until the path is a shrine",
    "Hoards rare pebbles in a cheek pouch",
    "Startles at its own shadow, then apologizes",
    "Adopts orphaned grazers of other species",
    "Sleeps standing, in shifts, with kin",
    "Signals danger by freezing mid-stride",
    "Trills when the rains arrive",
    "Horns record age as visible rings",
    "Prefers the long way around anything steep",
    "Digs snow-wells in summer as memory",
    "Duets at dusk with its own echo",
    "Follows the oldest member without question",
    "Marks trust by offering its favorite stone",
    "Refuses to cross a burned field",
  ],
  "apex-predator": [
    "Stalks in complete silence, then purrs",
    "Hunts only what it has watched fail first",
    "Caches prey beneath heat-shielding sand",
    "Eyes reflect nothing, even at close range",
    "Paces its territory at exactly dusk",
    "Leaves the young of other species untouched",
    "Clicks its plates to warn rather than ambush",
    "Shares a kill only after kin have eaten",
    "Mimics the call of grazers to study them",
    "Refuses carrion as a matter of instinct",
    "Purr-vibrates to calm its own wounded",
    "Knows every shadow on its ridge by name",
    "Tests the wind three times before the pounce",
    "Marks boundaries with a single long claw-line",
    "Drinks only from falling water",
    "Walks ridgelines, never valleys",
    "Sleeps one eye open over its young",
    "Retreats from nothing except fire",
  ],
  "deep-ocean": [
    "Flashes bioluminescent sonnets downward",
    "Keeps its own pressure-lamp lit",
    "Navigates by the planet's magnetic song",
    "Mourns its dead by circling twice",
    "Sings below human hearing for hours",
    "Grows a new lantern after each molt",
    "Rides thermal columns like slow elevators",
    "Shields its fry inside a gelatin bell",
    "Compensates for currents before they arrive",
    "Bares light patterns that name its pod",
    "Never rises above the twilight layer",
    "Collects stones it can name",
    "Sleeps in slow spirals, alone",
    "Shares warmth with strangers in cold vents",
    "Answers sonar politely, in kind",
    "Drifts with eyes open, dreaming visibly",
    "Keeps a clean den despite the dark",
    "Follows whale-song the way pilgrims follow bells",
  ],
  "colonial-swarm": [
    "Votes by density of hum",
    "Thinks in hundreds of small agreements",
    "Molds itself into one vast shape at dusk",
    "Shares a single memory across the swarm",
    "Replaces lost members within a day",
    "Never leaves a fallen member uncarried",
    "Signals rain two hours ahead",
    "Divides work by taste for brightness",
    "Holds grudges exactly one season",
    "Sings in rounds older than its host tree",
    "Fashions tools it cannot use alone",
    "Curls around eggs of other species to warm them",
    "Changes the swarm's mind mid-flight, smoothly",
    "Keeps the queen warm by unanimous consent",
    "Mourns by dimming, all at once",
    "Reroutes around any field of grief",
    "Maps new territory with temporary lanterns",
    "Distributes food by touch alone",
  ],
  crystalline: [
    "Grows one new facet each standard year",
    "Resonates with the steppe's own key",
    "Repairs chips by secreting warm light",
    "Stores seismic memory in its spine",
    "Refracts rainbows as a courtesy to kin",
    "Hibernates as a dull stone, wakes as a chandelier",
    "Sings when struck exactly correctly",
    "Aligns to true north within moments of birth",
    "Shares frequency with crystalline flora nearby",
    "Cracks honestly rather than bending",
    "Absorbs grief loud enough to ring",
    "Naps in direct starlight, visibly brighter after",
    "Keeps a permanent hum for its geode-kin",
    "Casts sharp, honest shadows",
    "Stays cool to the touch even in fire-season",
    "Records lightning in internal veils",
    "Chooses its ground and never moves again",
    "Faces the constellation of its hatching",
  ],
  "burrow-engineer": [
    "Excavates doors that lock with packed clay",
    "Keeps its tunnels labeled by scent-stones",
    "Air-conditions its warren with two shafts",
    "Stores seeds by vintage",
    "Builds flood-gates it has never needed twice",
    "Digs around roots, never through",
    "Greets neighbors by exchanging soil samples",
    "Sleeps in the deepest chamber by rotation",
    "Relines its nursery with fresh moss hourly",
    "Solves blocked tunnels without panic",
    "Shares wall-building duty with its mate for life",
    "Sings echo-maps to its young",
    "Remembers every tunnel it has ever sealed",
    "Installs pebble alarms at the surface",
    "Refuses to dig beneath standing stone",
    "Keeps a grain reserve for strangers in hard winters",
    "Digs test-shafts it later rents to other species",
    "Retires old tunnels into cool pantries",
  ],
  "canopy-glider": [
    "Spreads a membrane of woven light",
    "Steers by star-lines it learned as a joey",
    "Lands without a sound on any leaf",
    "Naps mid-glide on warm updrafts",
    "Caches fruit in crooks it marks with sap",
    "Signals kin with a flash of underwing",
    "Never glides in rain out of respect for the wings",
    "Shares roosts with gliders of other lineages",
    "Crosses whole valleys between two breaths",
    "Folds its wings with ceremony before eating",
    "Grooms its membrane after every long flight",
    "Chooses the tallest tree and greets it daily",
    "Remembers every broken branch on its routes",
    "Takes the young of neighbors on short hops",
    "Tastes the air before the wind changes",
    "Sleeps hanging exactly upside down",
    "Molts in private, or not at all",
    "Tucks its tail like a signature on landing",
  ],
};

/* ------------------------------------------------------------------ */
/*  Flora pools                                                       */
/* ------------------------------------------------------------------ */

const FLORA_HABITATS: string[] = [
  "sheltered canyon gardens",
  "the margins of glass lakes",
  "alpine scree and old lava",
  "under the canopy of host trees",
  "tide-line rock shelves",
  "the orbital greenhouse belt",
  "frost caves with faint light",
  "volcanic steam fields",
  "crystal steppe hollows",
  "river-thread wetlands",
  "the shaded sides of memory-stones",
  "cloud-forest ridgelines",
];

const FLORA_HABITAT_EXTRAS: Record<string, string[]> = {
  lantern: ["dark ravines that need lighting", "trail-sides where waymarkers plant them"],
  spiral: ["the host trees of the old groves", "winding riverbanks"],
  glass: ["open flats where the sun can pass through", "the frost-cave margins"],
  ember: ["fire-cleared slopes", "the volcanic steam fields"],
  tide: ["tide-line rock shelves", "shallow warm lagoons"],
  moss: ["shaded memory-stones", "the old floors of ruined halls"],
  whisper: ["quiet garden cloisters", "the grave-cleared hillside terraces"],
  "bloom-giant": ["the center of village greens", "the hearts of old-growth groves"],
};

const FLORA_BLOOM_CYCLES: string[] = [
  "once a decade",
  "with every third moon",
  "at the winter solstice only",
  "continuously, a few flowers at a time",
  "after forest fires",
  "in total darkness",
  "on the anniversary of its planting",
  "twice in a long lifetime",
  "when sung to",
  "at the year's first storm",
  "only under two suns",
  "during the autumn aurora",
];

const FLORA_SCENTS: string[] = [
  "warm honey and rain",
  "cold iron and violets",
  "old paper and resin",
  "sea salt and jasmine",
  "no scent at all — by design",
  "crushed mint and starlight",
  "ember smoke and plum",
  "green tea and wet stone",
  "night stock and myrrh",
  "vanilla from a distance, ozone up close",
  "citrus over deep moss",
  "a scent each rememberer describes differently",
];

const FLORA_HEIGHTS: string[] = [
  "a finger's width",
  "knee-high and sprawling",
  "waist-high",
  "taller than two adults",
  "a slow climb to the first branch",
  "canopy-emergent at forty meters",
  "creeping — effectively groundless height",
  "the height of the conservatory rafters",
  "stunted above the snowline",
  "vine-length unmeasured — it outgrew the hall",
  "bonsai-sized in federation records",
  "two hand-spans",
];

const FLORA_PROPERTIES: string[] = [
  "steeps into a calm-well tea for grief",
  "its sap closes wounds and open arguments",
  "petals hold a charge of courage for days",
  "smoke from its wood carries dreams honestly",
  "root pulp mends crystal fatigue",
  "a poultice for memory that will not settle",
  "its hum steadies failing heart-rhythms",
  "nullifies most recorded dream-intrusions",
  "an antidote base for stings of the shallow reefs",
  "its pollen teaches the lungs to slow",
  "flowers pressed into a balm for long sleepers",
  "an old remedy for frost-touch and old grudges",
];

/* ≥18 field-note trait phrases per flora lineage. */
const FLORA_TRAITS: Record<string, string[]> = {
  lantern: [
    "Lights its fruit from within at dusk",
    "Dims politely when neighbors sleep",
    "Stores a spare glow in root-bulbs",
    "Casts shadows that soothe rather than darken",
    "Blinks twice before a storm",
    "Feeds the moths it attracts, then releases them",
    "Glows brighter when sung to",
    "Keeps one lantern-flower lit all winter",
    "Signals trail-walkers home by pulse-rate",
    "Never flares suddenly — good manners in light",
    "Seeds travel on the light of their own glow",
    "Dims in grief and brightens in company",
    "Pollen glitters like held starlight",
    "Grows toward dark places, not away",
    "Shares light with seedlings beneath it",
    "Its glow reads as amber to the young",
    "Scent arrives one breath after the light",
    "Dims to nothing when the moon is generous",
  ],
  spiral: [
    "Coils its stem clockwise, always, without exception",
    "Counts its leaves in perfect fifths",
    "Unfurls one whorl per rain",
    "Stores rain in a spiral staircase of cups",
    "Winds around host trees without strangling them",
    "Leaves rotate to face the last warm light",
    "Grows fastest on the inside of the coil",
    "Curls closed when spoken to harshly",
    "Marks its age in visible spiral rings",
    "Seeds ride the spiral down, never fall",
    "Points its bud along the wind's old path",
    "Grows a full turn for every season survived",
    "Mirrors the shell-fauna's coil exactly",
    "Keeps its flowers on the coil's outer edge, for visitors",
    "Untangles neighboring vines for no reward",
    "Tightens in drought, loosens in abundance",
    "Grows both directions from one patient crown",
    "Its spiral reads true as a compass",
  ],
  glass: [
    "Leaves are transparent as cooled breath",
    "Rings faintly when the wind finds its edge",
    "Photosynthesizes through living panes",
    "Frosts over deliberately in heat",
    "Shatters nothing — it bends, always",
    "Holds rain like a display case",
    "Casts prisms on the stones below",
    "Repairs a crack overnight, clearer than before",
    "Guards its clear leaves from greedy shade",
    "Hums a high note when hail threatens",
    "Keeps its seeds visible — nothing to hide",
    "Colors with age like old window-glass",
    "Takes the light it needs and passes the rest down",
    "Blooms inside its own transparent bud",
    "Shows its roots plainly through the soil",
    "Cools the air beneath its panes",
    "Collects the first frost of the year like an heirloom",
    "Its fallen leaves are kept by collectors, respectfully",
  ],
  ember: [
    "Smolders gently at the leaf-tips in frost",
    "Opens only after a fire, on schedule",
    "Stores heat in a heartwood furnace",
    "Scents of woodsmoke and ripe plum",
    "Its seeds require one honest flame to wake",
    "Warms the soil under its canopy by two degrees",
    "Sparks are a warning, not a habit",
    "Colors deepen exactly at the year's coldest night",
    "Feeds hearth-fauna with oil-rich pods",
    "Never burns its neighbors — a line it keeps",
    "Ashes beneath it are always fertile",
    "Glow persists in dead branches for a year",
    "Draws lightning with polite indifference",
    "Keeps embers alive in sealed seed-pods",
    "Reddens as a warning long before wilting",
    "Regrows from the burn line, never the crown",
    "Its resin soothes burns it did not cause",
    "Blooms like slow fire climbing a wick",
  ],
  tide: [
    "Opens its fronds only under water",
    "Keeps time with two moons, not one",
    "Sweetens the rockpools around its holdfast",
    "Sways toward storms it senses offshore",
    "Bares spores on the lowest tide of the year",
    "Shelters fry in its fringed shallows",
    "Freshens the water it grows in",
    "Sings a low bubbling note at slack tide",
    "Grows a ring for every king tide survived",
    "Salt it does not need, it returns to the sea",
    "Anchors shifting sand with patient mats",
    "Never grows where the reef has grieved",
    "Puts out lantern-bladders on dark nights",
    "Tastes of cold cucumber and clean brine",
    "Holds its breath in freshwater for exactly a day",
    "Feeds the hermit-fauna it cannot see",
    "Folds its fronds around drifting seeds until they root",
    "Keeps the memory of every storm in its stipe",
  ],
  moss: [
    "Grows a millimeter a year and means it",
    "Softens every stone it settles on",
    "Holds a hillside together by agreement",
    "Remembers footpaths and cushions them",
    "Drinks the fog before the rain arrives",
    "Keeps the ground beneath it exactly cool",
    "Stays green even under snow, patiently",
    "Returns to life from crumble-dry in one rain",
    "Grows in the shape of whatever it lost",
    "Shelters springtails too small to see",
    "Its spore-bearers rise like tiny street lamps",
    "Never competes — it simply arrives first",
    "Holds old footprints for a full season",
    "Turns the fallen to bed, respectfully",
    "Grows thickest where grief was longest",
    "Muffles the whole forest's sound by degrees",
    "Follows the shade like a slow green tide",
    "Restores worn stone to living velvet",
  ],
  whisper: [
    "Its leaves murmur in languages it has overheard",
    "Quiets a clearing when entered",
    "Sways without wind when spoken about",
    "Repeats a kind sentence back, slowly",
    "Grows only where secrets are kept well",
    "Pollen drifts on whispers, not wind",
    "Drops a leaf as a reply, one per question",
    "Rustles an alarm before bad news arrives",
    "Learns lullabies and returns them at dusk",
    "Its sap tastes of the last words said beside it",
    "Answers arguments with a long neutral hush",
    "Keeps conversations sealed in its hollow stem",
    "Grows taller around graves of good listeners",
    "Never rustles during another's sleep",
    "Sends its seeds out on exactly one sentence",
    "Records vows in rings of pale grain",
    "Turns silver when it hears true grief",
    "Hums the caretaker's own tune back to them",
  ],
  "bloom-giant": [
    "Supports a village in its branches",
    "Blooms once a century, all at once, on purpose",
    "Its canopy weathers storms three days early",
    "Root-rings drink from the water table's oldest seam",
    "Bark scarred by centuries heals into calligraphy",
    "Feeds the soil it stands in, not just the soil near it",
    "Keeps a hollow that shelters hibernating bears",
    "Drops fruit heavy with sweet fat before every winter",
    "Shelters an entire understory of rarer flora",
    "Grows toward its fallen kin, slowly, to stand over them",
    "Flowers smell like a memory of someone's garden",
    "Its seeds weigh more than most birds and travel anyway",
    "Sheds a branch deliberately before the storm takes it",
    "Widens its shade each year by exact, modest degrees",
    "Old lightning scars are kept, unwounded, as records",
    "Creaks in a known key that local fauna navigate by",
    "Carries epiphytes the way an elder carries grandchildren",
    "Flowers only when the grove votes by budding",
  ],
};

/* ------------------------------------------------------------------ */
/*  Field-note templates                                              */
/* ------------------------------------------------------------------ */

const F_RATIONS: string[] = [
  "bundle of sweet reeds",
  "tray of crystal sap",
  "basket of fallen fruit",
  "salt block",
  "dish of warm kelp",
];

const F_INCIDENTS: string[] = [
  "sung a lost caravan back to camp",
  "returned a dropped instrument",
  "led a survey team out of a canyon",
  "stood guard over a wounded field surgeon",
  "carried a hatchling across the flood line",
];

const F_WHENS: string[] = [
  "at first light",
  "in the blue hour",
  "during the equinox winds",
  "after the second rain",
  "at the year's first frost",
];

const FL_SEEDCOUNTS: string[] = ["three", "nine", "twelve", "forty", "one hundred"];

const FL_WHENS: string[] = [
  "at moonrise",
  "before the dew burns off",
  "in the last hour of light",
  "after the first storm of the year",
];

interface FaunaNoteCtx {
  originName: string;
  originWorld: string;
  className: string;
  habitat: string;
  temperament: string;
  diet: string;
  lifespan: string;
  trait: string;
}

interface FloraNoteCtx {
  originName: string;
  originWorld: string;
  lineage: string;
  scent: string;
  properties: string;
  trait: string;
}

const FAUNA_NOTE_TEMPLATES: ReadonlyArray<(c: FaunaNoteCtx, rng: () => number) => string> = [
  (c) => `${c.originName} survey teams log it on ${c.originWorld} every season, and the count has never once come in late.`,
  (c, r) => `A ${c.temperament} regular of ${c.habitat} — ${c.originName} keepers set aside a ${pick(r, F_RATIONS)} for it by name.`,
  (c) => `Known to ${c.originName} herders on ${c.originWorld} as a good omen before long voyages.`,
  (c) => `The archive page is annotated in ${c.originName} script with a single line: "${c.trait}".`,
  (c, r) => `First catalogued after it ${pick(r, F_INCIDENTS)} in front of a ${c.originName} research outpost.`,
  (c) => `Hatched in the ${c.originName} nurseries on ${c.originWorld} and returned to the wild within the season, as the treaties require.`,
  (c) => `Feeds on ${c.diet} almost exclusively, which the ${c.originName} botanists consider excellent taste.`,
  (c) => `One ${c.className.toLowerCase()} among many, but the one the ${c.originName} cadets ask for by name.`,
  (c) => `Lives out its ${c.lifespan} within a short range of where it was first banded, says the ${c.originName} field ledger.`,
  (c, r) => `Best observed ${pick(r, F_WHENS)}, though it has been known to appear simply when the ${c.originName} observers stop looking.`,
];

const FLORA_NOTE_TEMPLATES: ReadonlyArray<(c: FloraNoteCtx, rng: () => number) => string> = [
  (c) => `${c.originName} gardeners on ${c.originWorld} swear it blooms brighter in the years it is ignored.`,
  (c) => `A cutting carried through the Archive Ring and back never dropped a petal, the ${c.originName} couriers report.`,
  (c) => `Listed in the ${c.originName} herbarium under two names — the official one, and one only children use.`,
  (c) => `The archive page carries one pressed flower and the note "${c.trait}" in green ink.`,
  (c) => `Planted along the ${c.originName} memory-walks, where its ${c.scent} is allowed to do the remembering.`,
  (c, r) => `The ${c.originName} seed-vault keeps ${pick(r, FL_SEEDCOUNTS)} samples of this lineage and rotates them by moon-count.`,
  (c) => `Said to lean, very slowly, toward whoever tends it; the ${c.originName} tenders no longer argue the point.`,
  (c) => `One of the few ${c.lineage.toLowerCase()} specimens the Epsilon Eridani Gardeners list as "self-sufficient, politely".`,
  (c) => `Blooms out of turn on ${c.originWorld}, and the ${c.originName} almanac prints a small apology each time.`,
  (c, r) => `Best gathered ${pick(r, FL_WHENS)}, by consent of the ${c.originName} stewards and never by force.`,
  (c) => `Standard lore in the ${c.originName} dispensary: ${c.properties}.`,
];

/* ------------------------------------------------------------------ */
/*  Builders — run once at module load                                */
/* ------------------------------------------------------------------ */

const FAUNA_COUNT = 1200;
const FLORA_COUNT = 1500;
const FAUNA_SALT = 0x9e3779b9;
const FLORA_SALT = 0x85ebca6b;

function buildFauna(): FaunaSpecimen[] {
  const usedNames = new Set<string>();
  const list: FaunaSpecimen[] = [];
  for (let i = 0; i < FAUNA_COUNT; i++) {
    const rng = mulberry32((FAUNA_SALT ^ i) >>> 0);
    const cls = pick(rng, FAUNA_CLASSES);
    const drawn = drawName(rng, FAUNA_GENERA, FAUNA_EPITHETS, usedNames);
    const fam = pick(rng, CIVILIZATION_FAMILIES);
    const originWorld = pick(rng, ORIGIN_WORLD_FLAVOR[fam.id]);
    const habitat = pick(rng, [...FAUNA_HABITATS, ...FAUNA_HABITAT_EXTRAS[cls.id]]);
    const diet = pick(rng, [...FAUNA_DIETS, ...FAUNA_DIET_EXTRAS[cls.id]]);
    const temperament = pick(rng, FAUNA_TEMPERAMENTS);
    const size = pick(rng, FAUNA_SIZES);
    const lifespan = pick(rng, FAUNA_LIFESPANS);
    const traits = pickTraits(rng, FAUNA_TRAITS[cls.id]);
    const rarity = pick(rng, RARITY_TIERS);
    const note = pick(rng, FAUNA_NOTE_TEMPLATES)({
      originName: fam.name,
      originWorld,
      className: cls.label,
      habitat,
      temperament,
      diet,
      lifespan,
      trait: traits[0],
    }, rng);
    list.push({
      id: `fauna-${String(i + 1).padStart(4, "0")}`,
      registryNo: `BIO-FA-${String(i + 1).padStart(4, "0")}`,
      name: drawn.name,
      genus: drawn.genus,
      classId: cls.id,
      className: cls.label,
      originGroupId: fam.id,
      originName: fam.name,
      originWorld,
      habitat,
      diet,
      temperament,
      size,
      lifespan,
      traits,
      note,
      rarity,
      artIndex: hash32(drawn.genus) % 24,
    });
  }
  return list;
}

function buildFlora(): FloraSpecimen[] {
  const usedNames = new Set<string>();
  const list: FloraSpecimen[] = [];
  for (let i = 0; i < FLORA_COUNT; i++) {
    const rng = mulberry32((FAUNA_SALT ^ FLORA_SALT ^ i) >>> 0);
    const lineage = pick(rng, FLORA_LINEAGES);
    const drawn = drawName(rng, FLORA_GENERA, FLORA_EPITHETS, usedNames);
    const fam = pick(rng, CIVILIZATION_FAMILIES);
    const originWorld = pick(rng, ORIGIN_WORLD_FLAVOR[fam.id]);
    const habitat = pick(rng, [...FLORA_HABITATS, ...FLORA_HABITAT_EXTRAS[lineage.id]]);
    const bloomCycle = pick(rng, FLORA_BLOOM_CYCLES);
    const scent = pick(rng, FLORA_SCENTS);
    const height = pick(rng, FLORA_HEIGHTS);
    const properties = pick(rng, FLORA_PROPERTIES);
    const traits = pickTraits(rng, FLORA_TRAITS[lineage.id]);
    const rarity = pick(rng, RARITY_TIERS);
    const note = pick(rng, FLORA_NOTE_TEMPLATES)({
      originName: fam.name,
      originWorld,
      lineage: lineage.label,
      scent,
      properties,
      trait: traits[0],
    }, rng);
    list.push({
      id: `flora-${String(i + 1).padStart(4, "0")}`,
      registryNo: `BIO-FL-${String(i + 1).padStart(4, "0")}`,
      name: drawn.name,
      genus: drawn.genus,
      lineageId: lineage.id,
      lineage: lineage.label,
      originGroupId: fam.id,
      originName: fam.name,
      originWorld,
      habitat,
      bloomCycle,
      scent,
      height,
      properties,
      traits,
      note,
      rarity,
      artIndex: hash32(drawn.genus) % 24,
    });
  }
  return list;
}

export const faunaSpecimens: FaunaSpecimen[] = buildFauna();
export const floraSpecimens: FloraSpecimen[] = buildFlora();

export const faunaTotal = faunaSpecimens.length;
export const floraTotal = floraSpecimens.length;
export const biologyTotal = faunaTotal + floraTotal;

/* ------------------------------------------------------------------ */
/*  Lookups & image paths                                             */
/* ------------------------------------------------------------------ */

const faunaIndex = new Map<string, FaunaSpecimen>(faunaSpecimens.map((s) => [s.id, s]));
const floraIndex = new Map<string, FloraSpecimen>(floraSpecimens.map((s) => [s.id, s]));

export function specimenImage(kind: SpecimenKind, artIndex: number): string {
  return `/images/biology/${kind}-${String(artIndex + 1).padStart(2, "0")}.jpg`;
}

export function findSpecimen(
  kind: SpecimenKind,
  id: string,
): FaunaSpecimen | FloraSpecimen | undefined {
  return kind === "fauna" ? faunaIndex.get(id) : floraIndex.get(id);
}

export function findFaunaSpecimen(id: string): FaunaSpecimen | undefined {
  return faunaIndex.get(id);
}

export function findFloraSpecimen(id: string): FloraSpecimen | undefined {
  return floraIndex.get(id);
}
