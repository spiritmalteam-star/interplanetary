/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — deterministic archive generator        */
/*  Produces 870 named civilization representatives + 202 named       */
/*  interdimensional presences as TypeScript data files.              */
/*  Seeded RNG => stable output across runs.                          */
/* ------------------------------------------------------------------ */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src/lib/data");

/* ---------------- seeded RNG ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/* ---------------- shared name banks ---------------- */
const PERSONS = [
  "Ashira", "Oraveth", "Velmora", "Tayan", "Serephin", "Kalara", "Nuveth",
  "Eloran", "Zayathra", "Mireya", "Ondari", "Thalor", "Iveth", "Sarukai",
  "Nemira", "Auvan", "Coriel", "Dahval", "Emrisa", "Fenmar", "Giloth",
  "Harune", "Isavel", "Jorath", "Kaleth", "Lunara", "Merith", "Nyshara",
  "Ophiran", "Pavari", "Quennath", "Raveth", "Seliora", "Tavish", "Umari",
  "Vashkel", "Wynthor", "Xandrel", "Ysolde", "Zepharan", "Aelith", "Branmir",
  "Cynara", "Dovriel", "Eshkar", "Faelor", "Gavneth", "Hirael", "Ithvari",
  "Jenarra", "Lorith", "Mavruk", "Nessandra", "Ovrik", "Pethran", "Qiraleth",
  "Ryshana", "Sovarin", "Tumriel", "Ulvaris", "Veyanthe",
];
const ADJ = [
  "Luminous", "Gentle", "Hidden", "Singing", "Amber", "Patient", "Radiant",
  "Quiet", "Woven", "Blessed", "Auric", "Hundredfold", "Lucid", "Steadfast",
  "Twilit", "Unbroken", "Verdant", "Ninth", "Silver", "First",
];
const COLLECTIVES = [
  "Communes", "Concord", "Enclaves", "Choirs", "Circle", "Assembly",
  "Weavers", "Guild", "Chorus", "Custodians", "Threshold", "Beacon",
  "Sanctum", "Bloom", "Wellspring", "Vigil", "Meridian", "Compass",
  "Orbit", "Covenant",
];
const CASTES = [
  "Sky-Weavers", "Tone-Keepers", "Grid-Walkers", "Seed-Bearers",
  "Veil-Binders", "Star-Masons", "Dream-Tenders", "Ember-Wardens",
  "Light-Archivists", "Wave-Readers", "Gate-Singers", "Root-Speakers",
  "Dawn-Custodians", "Quiet-Hands", "Storm-Calmers", "Glyph-Smiths",
  "Halo-Gardeners", "Rune-Navigators", "Bond-Keepers", "Tide-Readers",
];
const PLACES = [
  "the Ninth Meridian", "the Singing Veil", "the Amber Threshold",
  "the Quiet Star", "the Long Dawn", "the Crystal Tide", "the Seventh Ring",
  "the Inner Garden", "the Open Hand", "the First Frequency",
  "the Pale Aurora", "the Standing Stones", "the Living Map",
  "the Gentle War", "the Kept Promise", "the Turning Year",
  "the Silver Manifest", "the Woven Sky", "the Hundred Gardens",
  "the Patient River",
];

/* ---------------- civilization families ---------------- */
/* seats: home addresses used in name patterns; region: family address */
const CIV_FAMILIES = [
  {
    id: "pleiadian", count: 50, seed: 101,
    seats: ["Taygeta", "Alcyone", "Maia", "Electra", "Merope", "Atlas", "Pleione", "Celaeno", "Sterope"],
    region: "the Pleiades",
    density: ["5D", "6D", "7D", "5D – 6D", "6D – 7D"],
    archetype: "heart",
  },
  {
    id: "sirian", count: 50, seed: 102,
    seats: ["Sirius A", "Sirius B", "the Khem Waters", "Thera Gate", "the Cetacean Hall", "Omosek"],
    region: "the Sirius system",
    density: ["4D", "5D", "6D", "7D", "4D – 6D", "5D – 7D"],
    archetype: "geometry",
  },
  {
    id: "arcturian", count: 50, seed: 103,
    seats: ["Arcturus Core", "the Boötes Threshold", "the Sixth Jewel", "Vaiosha", "the Blue Print Halls"],
    region: "Arcturus",
    density: ["6D", "7D", "8D", "9D", "6D – 8D", "7D – 9D"],
    archetype: "crystal",
  },
  {
    id: "lyran", count: 50, seed: 104,
    seats: ["Avyon", "Vega Prime", "the Lyran Cradle", "Zyathra", "the Twin Suns"],
    region: "Lyra",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "pioneer",
  },
  {
    id: "andromedan", count: 50, seed: 105,
    seats: ["Zenae Delta", "the Mirach Reach", "Alpheratz Whorl", "the Open Sky Yards"],
    region: "Andromeda",
    density: ["5D", "6D", "7D", "8D", "9D", "5D – 9D"],
    archetype: "freedom",
  },
  {
    id: "inner-earth", count: 49, seed: 106,
    seats: ["Telos", "Agartha", "Shonshe", "the Hollowways", "Posid", "the Crystal Sun of Gaia", "Rama Arises"],
    region: "Inner Earth",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "guardian",
  },
  {
    id: "solar-neighbors", count: 49, seed: 107,
    seats: ["Venus", "Mars", "Ganymede", "Titan", "the Saturn Gate", "Luna Farside", "the Jovian Moors"],
    region: "this solar system",
    density: ["3D", "4D", "5D", "6D", "3D – 6D"],
    archetype: "wayshower",
  },
  {
    id: "nordic", count: 46, seed: 108,
    seats: ["Procyon Alpha", "Aldebaran Yards", "the Pale Colonies", "Erra", "the Meadow Worlds"],
    region: "the Procyon & Aldebaran colonies",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "ambassador",
  },
  {
    id: "feline-canine", count: 47, seed: 109,
    seats: ["Avyon Savannahs", "the Hounds of Sirius", "Ursa Whisper", "the Fire Circle", "Zyathra Downs"],
    region: "Lyra & Sirius",
    density: ["4D", "5D", "6D", "7D", "4D – 7D"],
    archetype: "companion",
  },
  {
    id: "aquatic-reptilian", count: 46, seed: 110,
    seats: ["Sirius B Oceans", "the Draconis Court", "the Deep Seas of Earth", "the Reticulan Shallows", "Thalassa Deep"],
    region: "Sirius B, Draconis & Earth's oceans",
    density: ["3D", "4D", "5D", "6D", "3D – 6D"],
    archetype: "ocean",
  },
  {
    id: "insectoid-mantid", count: 45, seed: 111,
    seats: ["the Mantisorium", "Zeta Reticuli Rim", "the Prism Gardens", "the Quiet Chambers", "Orion Outer Arms"],
    region: "Orion's outer arms",
    density: ["5D", "6D", "7D", "8D", "5D – 8D"],
    archetype: "threshold",
  },
  {
    id: "avian", count: 44, seed: 112,
    seats: ["the Blue Plume Reach", "Aquila Roost", "the Threshold Winds", "the Feather Gate", "Ka'Riel"],
    region: "the threshold systems",
    density: ["6D", "7D", "8D", "9D", "6D – 9D"],
    archetype: "messenger",
  },
  {
    id: "crystalline", count: 43, seed: 113,
    seats: ["the Harmonic Lattice", "the Tone Fields", "the Prism Cave", "Andromeda's Veil", "the Octave Garden"],
    region: "everywhere and nowhere",
    density: ["7D", "8D", "9D", "10D", "12D", "7D – 12D"],
    archetype: "light",
  },
  {
    id: "hybrid", count: 42, seed: 114,
    seats: ["the Interface Habitats", "the Meeting Gardens", "the Between-Worlds", "Essassani Fringe", "the Nursery of Stars"],
    region: "the Zeta–human interface",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "bridge",
  },
  {
    id: "other-nations", count: 41, seed: 115,
    seats: ["Mintaka", "Capella", "Procyon", "Vega", "Aldebaran", "the Quiet Addresses"],
    region: "the federated family",
    density: ["3D", "4D", "5D", "6D", "7D", "8D", "9D", "3D – 9D"],
    archetype: "quiet",
  },
  {
    id: "tau-ceti", count: 36, seed: 116,
    seats: ["Tau Ceti e", "the Frontier Reach", "Halcyon Hills", "the First Furrow", "New Meridian"],
    region: "Tau Ceti",
    density: ["3D", "4D", "5D", "3D – 5D"],
    archetype: "frontier",
  },
  {
    id: "vega", count: 35, seed: 117,
    seats: ["Vega Ascendant", "the Lyra Gate", "Concordium Spires", "the Bell Hall", "Aeliora"],
    region: "Vega",
    density: ["5D", "6D", "7D", "5D – 7D"],
    archetype: "harmony",
  },
  {
    id: "epsilon-eridani", count: 34, seed: 118,
    seats: ["the Garden Belt", "Epsilon Eridani b", "the Green Yards", "the Living Docks", "Vernal Deep"],
    region: "Epsilon Eridani",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "gardener",
  },
  {
    id: "zeta-reticuli", count: 33, seed: 119,
    seats: ["the Archive Ring", "Reticulum Deep", "the Watch Stations", "the Silent Gallery", "Xerxes Pattern"],
    region: "Zeta Reticuli",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "archive",
  },
  {
    id: "mintaka", count: 30, seed: 120,
    seats: ["the Mintaka Belt", "the Ember Forges", "Orion's West Gate", "the Dawn Kilns", "Ashurra"],
    region: "Mintaka, Orion's belt",
    density: ["4D", "5D", "6D", "4D – 6D"],
    archetype: "ember",
  },
];

/* specialty banks per archetype (civilization flavour) */
const CIV_SPECIALTY = {
  heart: [
    "Composes lullabies that mend grief directly in the body.",
    "Teaches strangers to hear each other's hearts at five paces.",
    "Paints with feeling; the canvases dry into courage.",
    "Midwives marriages between worlds, and between people.",
    "Keeps the great kitchens where comfort is cooked into light.",
  ],
  geometry: [
    "Draws the star-gate geometries that let ships travel by consent.",
    "Tunes temple stones so they remember their original song.",
    "Translates between mathematics and mercy.",
    "Re-teaches the tonal alphabets lost with late Atlantis.",
    "Maintains the harmonic treaties between ocean peoples.",
  ],
  crystal: [
    "Drafts healing templates the way architects draft bridges.",
    "Holds trauma in structured light until it consents to teach.",
    "Calibrates the great healing chambers of the federation.",
    "Codes sanctuary geometries for worlds in awakening.",
    "Polishes souls with the patience of geology.",
  ],
  pioneer: [
    "Walks first through doors the timid have only measured.",
    "Trains young civilizations in the etiquette of courage.",
    "Charts the wild corridors between the known constellations.",
    "Keeps the archive of first footsteps across this galaxy.",
    "Teaches sovereignty as a discipline, not a mood.",
  ],
  freedom: [
    "Dissolves polarity thinking wherever it parks itself.",
    "Carries messages between realities that rarely speak.",
    "Liberates libraries; frees archives locked by fear.",
    "Teaches that freedom is a frequency, not a circumstance.",
    "Redraws mental maps until cages become horizons.",
  ],
  guardian: [
    "Tends the planetary grids beneath the sleeping surface.",
    "Keeps the crystalline libraries of the original Earth template.",
    "Walks pilgrims safely through the inner mountain roads.",
    "Holds the memory of Eden without nostalgia.",
    "Guards the meeting places where surface and inner Earth greet.",
  ],
  wayshower: [
    "Lights the runway for humanity's first system-wide steps.",
    "Tends the energetic climate of the local neighborhood.",
    "Shepherds comets; herds weather; calms magnetic storms.",
    "Keeps the observation decks over the young blue planet.",
    "Files the field notes of a solar system becoming a citizen.",
  ],
  ambassador: [
    "Arrives deliberately familiar so first contact feels like memory.",
    "Translates silence between species that fear each other.",
    "Prepares human psyches for wider company without shock.",
    "Keeps the guest rooms of the federation warm and simple.",
    "Sits with the frightened until fear forgets its argument.",
  ],
  companion: [
    "Walks beside whoever was left behind.",
    "Teaches loyalty that never becomes a leash.",
    "Guards children's dreams with magnificent seriousness.",
    "Keeps the fires where warriors learn to be gentle.",
    "Plays — as a sacred profession, with references.",
  ],
  ocean: [
    "Carries the ocean's emotional intelligence onto land.",
    "Sits with what provokes until it reveals its lesson.",
    "Reads fear the way sailors read weather.",
    "Keeps the peace between the deep ones and the shore-born.",
    "Transmutes old territorial hungers into guardianship.",
  ],
  threshold: [
    "Keeps ceremony at the doors between life and death.",
    "Tends the genetic archives with infinite patience.",
    "Makes endings safe enough to be beautiful.",
    "Catalogues souls' final questions, and some answers.",
    "Watches without flinching; loves without possessing.",
  ],
  messenger: [
    "Carries communication across layers of reality by wing.",
    "Delivers feathers as receipts of answered prayer.",
    "Guides migrations of souls through density transitions.",
    "Writes messages in sudden wind across open fields.",
    "Keeps the postal roads between the worlds unblocked.",
  ],
  light: [
    "Transmits codes through light, its only alphabet.",
    "Holds templates for cities not yet imagined.",
    "Sings the harmonics that keep the grids humming.",
    "Is the closest thing to the universe thinking out loud.",
    "Keeps the palette from which auroras are mixed.",
  ],
  bridge: [
    "Carries the genetics and the ache of two lineages at once.",
    "Heals the fear of contact, one friendship at a time.",
    "Translates between the watchers and the watched.",
    "Hosts the reunions families forgot they scheduled.",
    "Teaches empathy as a contact science.",
  ],
  quiet: [
    "Gardens small worlds whose names Earth hasn't learned.",
    "Holds up the alliance from beneath its summary.",
    "Delivers the federation's mail, tools and mercy.",
    "Keeps the benches where emissaries rest between missions.",
    "Does the quiet work that keeps great doors open.",
  ],
  frontier: [
    "Plants outposts where the maps still apologize.",
    "Trials new agriculture under unfamiliar suns.",
    "Keeps the lighthouse on the rim of the charted.",
    "Sends home weather reports from the edge of hope.",
    "Builds the first fence, then the first gate.",
  ],
  harmony: [
    "Rings the spires whose music keeps districts in accord.",
    "Mediates disputes by retuning them, not resolving them.",
    "Keeps the great bells of Vega honest.",
    "Teaches disagreement as a harmonic, not a wound.",
    "Curates the playlists of planetary moods.",
  ],
  gardener: [
    "Grows living ships in orbital greenhouses of light.",
    "Cross-pollinates ecosystems with the receiving world's consent.",
    "Keeps the seed vaults of eleven hopeful planets.",
    "Prunes timelines the way orchardists prune for light.",
    "Teaches the difference between cultivating and controlling.",
  ],
  archive: [
    "Tends the holographic records of worlds under observation.",
    "Files every human night, cross-referenced with kindness.",
    "Keeps the watch stations' long ledgers of contact.",
    "Balances what was seen against what was feared.",
    "Corrects the record gently, and forever.",
  ],
  ember: [
    "Forges dawn-light into instruments of warming.",
    "Rekindles civilizations that mistook ash for an ending.",
    "Keeps the kilns where courage is tempered.",
    "Ships warmth to the cold districts of the galaxy.",
    "Teaches that fire, respected, is a mentor.",
  ],
};

const CIV_SIGNAL = {
  heart: ["Warmth blooming in the chest", "Tears that arrive without sadness", "A sudden appetite for art"],
  geometry: ["Dreams filled with temples and geometry", "Remembering languages never learned", "Affinity with water and whales"],
  crystal: ["Pressure at the crown or brow", "Vivid sacred-geometry imagery", "Love of orderly silent meditation"],
  pioneer: ["Sudden lion-hearted confidence", "An ache for open star fields", "The instinct to walk first through the door"],
  freedom: ["Restlessness with old structures", "Dreams that fold cities into galaxies", "Craving for open skies"],
  guardian: ["Pulsing warmth rising from below", "Dreams of gardens beneath mountains", "Love of caves and crystals"],
  wayshower: ["Unexplained pull toward a planet", "Lucid dreams of strange skies", "Calm during geomagnetic storms"],
  ambassador: ["Serenity around strangers", "Memories of tall luminous figures in dreams", "A feeling of being expected"],
  companion: ["Pets who feel like teachers", "Dreams of elders beside a fire", "Courage arriving on four paws"],
  ocean: ["Strong pull to deep water", "Vivid ocean dreams", "Fear that ends, unexpectedly, in strength"],
  threshold: ["Comfort with structure and silence", "Dreams of enormous kind eyes", "Peace at doors once feared"],
  messenger: ["Recurring bird imagery", "Feathers arriving without a bird", "Messages written in sudden wind"],
  light: ["Sensitivity to brightness", "Spontaneous toning or humming", "Love of crystals and prisms"],
  bridge: ["Compassion for whoever is called 'other'", "Feeling at home nowhere, therefore everywhere", "Dreams of wide-eyed children"],
  quiet: ["A kindly someone past the edge of sight", "A name almost remembered", "Gratitude without an address"],
  frontier: ["Longing for horizons not yet named", "Joy in rough maps", "Homesickness for somewhere new"],
  harmony: ["Hearing music inside noise", "Moods that settle when bells ring", "Arguments resolving in your presence"],
  gardener: ["Plants that lean toward you", "Dreams of orbital greenhouses", "Faith in slow things"],
  archive: ["Déjà vu of vast quiet halls", "Sudden precise memories", "A sensation of being recorded kindly"],
  ember: ["Warmth in cold rooms", "Second winds at midnight", "Relighting of old, good ideas"],
};

/* ---------------- interdimensional orders ---------------- */
const INTERDIM_ORDERS = [
  {
    id: "archangels", count: 30, seed: 201,
    domains: ["the Emerald Flame", "the Silver Chord", "the First Ray", "the Blue Sword", "the Golden Scale", "the Ruby Door", "the White Wind", "the Deep Peace"],
    density: ["8D", "9D", "10D", "11D", "12D", "8D – 12D"],
  },
  {
    id: "ascended-masters", count: 29, seed: 202,
    domains: ["the Violet Flame", "the Mountain of Gathering", "the Ruby Ray of Mercy", "the Quiet Temple", "the Lake of Lotus", "the Final Curriculum"],
    density: ["6D", "7D", "8D", "9D", "6D – 9D"],
  },
  {
    id: "devic-elemental", count: 26, seed: 203,
    domains: ["the Green Choir", "the River Parliament", "the Cloud Workshops", "the Root Councils", "the Flame Kindergartens", "the Meadow Offices"],
    density: ["3D", "4D", "5D", "3D – 5D"],
  },
  {
    id: "cosmic-councils", count: 26, seed: 204,
    domains: ["the Saturn Chamber", "the Circle of Nine", "the Round of Twenty-Four", "the Amphitheatre of Worlds", "the Ledger Room", "the Great Concourse"],
    density: ["6D", "7D", "8D", "9D", "10D", "11D", "6D – 11D"],
  },
  {
    id: "guardians", count: 23, seed: 205,
    domains: ["the Unmarked Door", "the Bent Hour", "the Border of Breath", "the Ninth Silence", "the Standing Watch", "the Held Threshold"],
    density: ["7D", "8D", "9D", "10D", "7D – 10D"],
  },
  {
    id: "celestial", count: 23, seed: 206,
    domains: ["the Heart of the Star", "the Nebula Lungs", "the Galactic Weather Office", "the Choir of Orbits", "the Long Horizon", "the Season of Light"],
    density: ["8D", "9D", "10D", "11D", "12D", "8D – 12D"],
  },
  {
    id: "oversouls", count: 23, seed: 207,
    domains: ["the Golden Threads", "the River of Selves", "the Branching Garden", "the Loom of Lives", "the Confluence", "the First Thread"],
    density: ["7D", "8D", "9D", "11D", "7D – 11D"],
  },
  {
    id: "record-keepers", count: 22, seed: 208,
    domains: ["the Akashic Reading Room", "the Hall of Scrolls", "the Library of Rain", "the Index of Longing", "the Marginalia Wing", "the Sealed Annex"],
    density: ["6D", "7D", "8D", "9D", "6D – 9D"],
  },
];

const INT_PERSONS = [
  "Auriel", "Vox Aurelia", "Seraphiel", "Melchizar", "Amaraya", "Ophan Thal",
  "Ishvara Lei", "Zadokiel", "Auravor", "Nemaiel", "Kaelum", "Rashanir",
  "Vessandra", "Luminar", "Athesia", "Cor'El", "Miralys", "Saphiron",
  "Elyon Ra", "Tharsis", "Ondriel", "Vael Nath", "Ithuriel", "Pallas Ru",
  "Amethys", "Solariel", "Neriah", "Orifel", "Lumaya", "Kadmiel",
  "Raziyah", "Temaal", "Uriasha", "Vesperion", "Yofiel", "Zohariel",
];
const INT_TITLES = [
  "Herald of the Seventh Dawn", "Keeper of Unmarked Doors",
  "Chorus of the Turning Sphere", "Warden of the Ninth Silence",
  "Scribe of Falling Stars", "Midwife of Beginnings",
  "Voice of the Long Peace", "Tender of the Last Garden",
  "Reader of Distant Weathers", "Hand of the Quiet Order",
  "Bearer of the Open Question", "Watcher of the Bent Hour",
  "Custodian of Names", "Singer of Return", "Keeper of the Ember Vow",
  "Archivist of Unlived Days", "Bridewarden of Realms",
  "Speaker for the Winds", "Holder of the First Breath",
  "Friend of Small Beginnings", "Lamplighter of the Deep Halls",
  "Keeper of the Folded Map", "Attendant of the Open Gate",
  "Regent of the Borrowed Hour", "Shepherd of Lost Frequencies",
  "Bellringer of the Slow Dawn", "Steward of the Unspent Light",
  "Consoler of Young Galaxies", "Cartographer of Grace",
  "Keeper of the Gentle Ledger",
];
const INT_SPECIALTY = {
  archangels: [
    "Lends structural courage to collapsing hours.",
    "Aligns what fear has scattered, without being asked twice.",
    "Clarifies divine will in a realm that prefers fog.",
    "Ushers peace that arrives before the explanation does.",
  ],
  "ascended-masters": [
    "Demonstrates the human curriculum brought to completion.",
    "Tutors souls who chose the long road on purpose.",
    "Answers the questions students are brave enough to finish.",
    "Keeps office hours across every tradition at once.",
  ],
  "devic-elemental": [
    "Assembles leaf, cloud, stream and stone on schedule.",
    "Negotiates the seasons' quiet paperwork.",
    "Teaches gardens to answer attention with growth.",
    "Keeps weather conversational for those who listen.",
  ],
  "cosmic-councils": [
    "Arbitrates matters of planetary consequence, patiently.",
    "Designs curricula for whole civilizations.",
    "Files the patient paperwork of ascension.",
    "Convenes as a body of light and adjourns as weather.",
  ],
  guardians: [
    "Holds doors between realities with professional calm.",
    "Turns back what is not yet ready, gently.",
    "Bends time at thresholds so crossing stays safe.",
    "Makes stillness so complete that borders can be felt.",
  ],
  celestial: [
    "Sings the large-scale harmonics smaller lives compose within.",
    "Holds the mood of the galaxy — the weather of light.",
    "Breathes nebulae; considers in eras.",
    "Keeps the seasons in which civilizations have their growth.",
  ],
  oversouls: [
    "Weaves the many lives of one soul into a single golden thread.",
    "Reminds the fragments of the family they forgot being.",
    "Rations lessons across lifetimes with loving economy.",
    "Catches the selves that fall behind in dreams.",
  ],
  "record-keepers": [
    "Keeps the infinite library where every life is a volume.",
    "Lends the akashic reading room to sincere visitors.",
    "Indexes longing so prayers can find their addressees.",
    "Files marginalia in the margins of destiny.",
  ],
};
const INT_SIGNAL = {
  archangels: ["Sudden unexplained peace", "Courage arriving mid-crisis", "The felt sensation of vast stillness behind the shoulder"],
  "ascended-masters": ["Déjà vu of temples and robes", "Tears at ordinary sacred words", "An inner 'yes' when a name is spoken"],
  "devic-elemental": ["Plants that respond to attention", "Sparkle seen in leaves and water", "Weather that feels conversational"],
  "cosmic-councils": ["Round-table dreams", "Awe before star fields", "A sense of being reviewed kindly"],
  guardians: ["Time that bends at doorways", "Sudden absolute stillness", "A border crossed without moving"],
  celestial: ["Chills under the night sky", "Music heard inside silence", "Feeling held by the dark instead of lost in it"],
  oversouls: ["Coincidences braided like rope", "Dreams of meeting yourself", "Home that moves with you"],
  "record-keepers": ["Books that open to the right page", "Memories with unfamiliar light", "Names arriving before faces"],
};

/* ---------------- generation ---------------- */
const ROMAN = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X", " XI", " XII"];

function genCivEntities() {
  const out = [];
  const used = new Set();
  for (const fam of CIV_FAMILIES) {
    const rng = mulberry32(fam.seed);
    const specialties = CIV_SPECIALTY[fam.archetype];
    const signals = CIV_SIGNAL[fam.archetype];
    for (let i = 0; i < fam.count; i++) {
      const roll = rng();
      let name;
      if (roll < 0.3) name = `${pick(rng, PERSONS)} of ${pick(rng, fam.seats)}`;
      else if (roll < 0.5) name = `The ${pick(rng, ADJ)} ${pick(rng, COLLECTIVES)} of ${pick(rng, fam.seats)}`;
      else if (roll < 0.75) name = `${pick(rng, PERSONS)} ${pick(rng, CASTES)}`;
      else if (roll < 0.85) name = `House of ${pick(rng, PERSONS)}`;
      else if (roll < 0.93) name = `${pick(rng, fam.seats)} ${pick(rng, COLLECTIVES)}`;
      else name = `${pick(rng, PERSONS)} of ${pick(rng, PLACES)}`;
      let attempt = 0;
      while (used.has(name) && attempt < ROMAN.length - 1) name = name + ROMAN[++attempt];
      if (used.has(name)) name = `${name}–${i + 1}`;
      used.add(name);
      out.push({
        id: `civ-${fam.id}-${String(i + 1).padStart(3, "0")}`,
        groupId: fam.id,
        name,
        origin: `${pick(rng, fam.seats)}, ${fam.region}`,
        density: pick(rng, fam.density),
        specialty: pick(rng, specialties),
        signal: pick(rng, signals),
      });
    }
  }
  return out;
}

function genInterdimEntities() {
  const out = [];
  const used = new Set();
  for (const order of INTERDIM_ORDERS) {
    const rng = mulberry32(order.seed);
    const specialties = INT_SPECIALTY[order.id];
    const signals = INT_SIGNAL[order.id];
    for (let i = 0; i < order.count; i++) {
      const roll = rng();
      let name;
      if (roll < 0.45) name = `${pick(rng, INT_PERSONS)}, ${pick(rng, INT_TITLES)}`;
      else if (roll < 0.75) name = `${pick(rng, INT_TITLES)} of ${pick(rng, order.domains)}`;
      else name = `The ${pick(rng, INT_TITLES)}`;
      let attempt = 0;
      while (used.has(name) && attempt < ROMAN.length - 1) name = name + ROMAN[++attempt];
      if (used.has(name)) name = `${name}–${i + 1}`;
      used.add(name);
      out.push({
        id: `int-${order.id}-${String(i + 1).padStart(3, "0")}`,
        groupId: order.id,
        name,
        origin: `${pick(rng, order.domains)}, beyond the density ladders`,
        density: pick(rng, order.density),
        specialty: pick(rng, specialties),
        signal: pick(rng, signals),
      });
    }
  }
  return out;
}

/* ---------------- emit TS ---------------- */
function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function emitEntityFile(kindLabel, entities, interfaceName) {
  const lines = [];
  lines.push(`/* ${kindLabel} — generated deterministically by scripts/gen-archive.mjs. */`);
  lines.push(`/* Do not edit by hand; adjust the generator instead. */`);
  lines.push(``);
  lines.push(`import type { EntityDossier } from "@/lib/mirror-types";`);
  lines.push(``);
  lines.push(`export const ${interfaceName}: EntityDossier[] = [`);
  for (const e of entities) {
    lines.push(
      `  { id: "${e.id}", groupId: "${e.groupId}", name: "${esc(e.name)}", origin: "${esc(e.origin)}", density: "${esc(e.density)}", specialty: "${esc(e.specialty)}", signal: "${esc(e.signal)}" },`
    );
  }
  lines.push(`];`);
  lines.push(``);
  return lines.join("\n");
}

const civEntities = genCivEntities();
const intEntities = genInterdimEntities();

const civSum = CIV_FAMILIES.reduce((s, f) => s + f.count, 0);
const intSum = INTERDIM_ORDERS.reduce((s, o) => s + o.count, 0);
console.log(`civilization representatives: ${civEntities.length} (target 870, config sum ${civSum})`);
console.log(`interdim presences: ${intEntities.length} (target 202, config sum ${intSum})`);
if (civEntities.length !== 870) throw new Error(`Civ count mismatch: ${civEntities.length}`);
if (intEntities.length !== 202) throw new Error(`Interdim count mismatch: ${intEntities.length}`);

/* uniqueness check */
const allNames = new Map();
let dupes = 0;
for (const e of [...civEntities, ...intEntities]) {
  if (allNames.has(e.name)) {
    dupes++;
    console.warn(`duplicate name: ${e.name}`);
  }
  allNames.set(e.name, e.id);
}

fs.writeFileSync(path.join(ROOT, "entities-civ.ts"), emitEntityFile("The 870 catalogued civilization representatives", civEntities, "civEntities"));
fs.writeFileSync(path.join(ROOT, "entities-interdim.ts"), emitEntityFile("The 202 catalogued interdimensional presences", intEntities, "interdimEntities"));
console.log("Wrote entities-civ.ts and entities-interdim.ts");
console.log(`unique names: ${allNames.size}, duplicates: ${dupes}`);
