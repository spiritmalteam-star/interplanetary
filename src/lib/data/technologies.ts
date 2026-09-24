import { fnv1a } from "../hash";

/* ------------------------------------------------------------------ */
/*  ET TECHNOLOGY REGISTER — 827 exotic crafts of the star             */
/*  civilizations, catalogued as artifact archetypes seen through      */
/*  adjective "fields". Built NOUN-MAJOR: every run of 46 consecutive  */
/*  entries sweeps all 46 context scenes, so no neighboring card       */
/*  repeats a backdrop. Every value is drawn with FNV-1a — the         */
/*  register is identical on every load, on every world.               */
/* ------------------------------------------------------------------ */

export interface TechAdjective {
  /** kebab form, also the context-scene file slug */
  name: string;
  /** 1–3 word field label the craft is catalogued under */
  field: string;
  /** short evocative scene description for the AI painter */
  scene: string;
  /** first overview sentence, keyed by the adjective */
  sentence: string;
}

export interface TechNoun {
  name: string;
  /** second overview sentence, keyed by the noun */
  sentence: string;
}

export interface TechPrinciple {
  title: string;
  text: string;
}

export interface TechFamilyDef {
  id: string;
  label: string;
  /** noun names gathered under this family (some families hold 2) */
  nouns: string[];
  /** family practice sentence (third overview sentence) */
  practice: string;
  /** 4 principles; each entry picks 3 deterministically */
  principles: TechPrinciple[];
  /** 8 application phrases; each entry picks 3 deterministically */
  applications: string[];
}

export interface TechMeters {
  rarity: number;
  containment: number;
  ethicsLoad: number;
  maturity: number;
}

export interface TechEntry {
  /** XT-0001 style, zero-padded registry number */
  id: string;
  name: string;
  /** "XT-nnnn · <FAMILY LABEL>" */
  registry: string;
  familyId: string;
  family: string;
  adjective: string;
  noun: string;
  adjectiveField: string;
  /** per-adjective context scene, painted by the AI */
  contextImage: string;
  /** per-family artifact portrait, painted by the AI */
  image: string;
  origin: string;
  whisper: string;
  /** exactly 4 sentences */
  overview: string;
  /** exactly 3 strings */
  principles: string[];
  /** exactly 3 strings */
  applications: string[];
  era: string;
  ethics: string;
  classificationTone: string;
  grade: string;
  meters: TechMeters;
  /** exactly 3 same-family entry ids, stride 7, cyclic */
  adjacent: string[];
}

/* ------------------------------------------------------------------ */
/*  46 adjectives — each with a field label, a painter's scene and     */
/*  its own overview sentence.                                         */
/* ------------------------------------------------------------------ */

export const TECH_ADJECTIVES: TechAdjective[] = [
  {
    name: "gravity-veiled",
    field: "gravity wells",
    scene: "a colossal artifact resting in a gravity well, starlight bending gently around it",
    sentence:
      "Under gravity so thick that light leans, the {noun} learns to hold its shape by consent rather than by force.",
  },
  {
    name: "tidal",
    field: "tidal shores",
    scene: "an artifact half-submerged on a shoreline where two long tides meet and argue",
    sentence:
      "Born on a shore where two tides argue, the {noun} keeps the rhythm of that disagreement in its working.",
  },
  {
    name: "iron-veiled",
    field: "iron deserts",
    scene: "an artifact standing in a desert of rust-red iron dunes under a small hard sun",
    sentence:
      "The {noun} comes out of the iron deserts wearing a skin of rust that it refuses, politely, to remove.",
  },
  {
    name: "resonant",
    field: "resonance halls",
    scene: "an artifact humming inside a vast hall of standing sound-waves made visible",
    sentence:
      "Struck once, the {noun} continues for a whole day, which is how its owners tell time inside deep buildings.",
  },
  {
    name: "hollow",
    field: "hollow moons",
    scene: "an artifact nested inside the hollowed shell of a small pale moon",
    sentence:
      "The {noun} lives inside a moon that was emptied as carefully as a fruit, and it has inherited the quiet.",
  },
  {
    name: "sun-forged",
    field: "solar forges",
    scene: "an artifact taking shape in a forge lit by a captured sliver of sun",
    sentence:
      "Forged at a hearth lit by a captured sliver of sun, the {noun} carries a warmth that no instrument has classified.",
  },
  {
    name: "dream-folded",
    field: "dream folds",
    scene: "an artifact folded through soft dreamlike layers of overlapping space",
    sentence:
      "The {noun} is folded through layers of space the way a letter is folded through a small envelope.",
  },
  {
    name: "salt-born",
    field: "salt flats",
    scene: "an artifact crystallizing on an endless white salt flat at dawn",
    sentence:
      "Crystallized on the salt flats over one slow season, the {noun} is said to taste of beginnings.",
  },
  {
    name: "glass-bright",
    field: "glass plains",
    scene: "an artifact gleaming on a plain of fused glass under a low violet sun",
    sentence:
      "On the glass plains the {noun} is visible from two horizons away, which its keepers consider honest advertising.",
  },
  {
    name: "ash-walking",
    field: "ash slopes",
    scene: "an artifact stepping slowly across a warm slope of grey volcanic ash",
    sentence:
      "The {noun} walks the ash slopes at the pace of cooling, and it has never once hurried.",
  },
  {
    name: "comet-spun",
    field: "comet trails",
    scene: "an artifact spinning threads of light in the tail of a passing comet",
    sentence:
      "Spun in the tail of a comet mid-passage, the {noun} believes, correctly, that travel is a material.",
  },
  {
    name: "star-nested",
    field: "star nurseries",
    scene: "an artifact brooding among glowing newborn stars inside a soft nebula",
    sentence:
      "The {noun} was brooded among newborn stars, and it still gives off the faint light of an unhatched idea.",
  },
  {
    name: "moon-cut",
    field: "moon cliffs",
    scene: "an artifact carved into the cliff face of a pale moon, tool-marks visible",
    sentence:
      "Cut from the cliff of a pale moon, the {noun} kept its tool-marks as a form of autobiography.",
  },
  {
    name: "amber-locked",
    field: "amber vaults",
    scene: "an artifact sealed inside a vault of glowing amber light",
    sentence:
      "The {noun} arrived sealed in amber light, and the sealing is considered part of its function.",
  },
  {
    name: "wind-written",
    field: "wind scries",
    scene: "an artifact reading messages written by wind across open dunes",
    sentence:
      "The {noun} reads the wind the way a priest reads scripture, and its margins are full of weather.",
  },
  {
    name: "root-bound",
    field: "root labyrinths",
    scene: "an artifact embraced by the pale roots of an ancient orbital tree",
    sentence:
      "Held by roots that have not yet decided to let go, the {noun} practices a patient kind of architecture.",
  },
  {
    name: "pulse-threaded",
    field: "pulse wires",
    scene: "an artifact threaded with faintly pulsing lines of violet light",
    sentence:
      "Threaded with wires that pulse in their sleep, the {noun} is considered alive by three schools and one court.",
  },
  {
    name: "mirror-clad",
    field: "mirror dunes",
    scene: "an artifact reflected endlessly across dunes of polished mirror",
    sentence:
      "Clad in mirror, the {noun} shows every place it has been, all at once, to anyone who looks carefully.",
  },
  {
    name: "spore-carried",
    field: "spore drifts",
    scene: "an artifact drifting in a slow river of luminous spores",
    sentence:
      "Carried by drifting spores to places no courier would volunteer for, the {noun} knows the back roads of the sky.",
  },
  {
    name: "ice-remembered",
    field: "ice shelves",
    scene: "an artifact embedded in a shelf of ancient blue ice",
    sentence:
      "The {noun} slept in blue ice for so long that the ice is listed as a co-author.",
  },
  {
    name: "oath-bound",
    field: "oath circles",
    scene: "an artifact at the center of a wide ring of standing stones",
    sentence:
      "Bound by an oath spoken over it in a language since retired, the {noun} has never once declined to serve.",
  },
  {
    name: "fire-singing",
    field: "fire canyons",
    scene: "an artifact singing above a canyon of slow-burning flame",
    sentence:
      "The {noun} sings above slow fire, and the song is a working part rather than an ornament.",
  },
  {
    name: "mist-drawn",
    field: "mist basins",
    scene: "an artifact drawing its shape out of a basin of rising mist",
    sentence:
      "Drawn up out of the mist basins one shape at a time, the {noun} is still deciding on its final outline.",
  },
  {
    name: "ore-hearted",
    field: "ore seams",
    scene: "an artifact grown around a seam of glittering raw ore",
    sentence:
      "The {noun} grew around a seam of ore the way a tree grows around a fence, and neither remembers which came first.",
  },
  {
    name: "tide-bound",
    field: "tide pools",
    scene: "an artifact mirrored in a network of calm tide pools",
    sentence:
      "Kept in tide pools tended by specialists, the {noun} has learned to keep its own schedule of return.",
  },
  {
    name: "dust-veiled",
    field: "dust seas",
    scene: "an artifact half-veiled by a slow sea of golden dust",
    sentence:
      "Half-veiled by a slow sea of golden dust, the {noun} is consulted only by those willing to wait for the wind.",
  },
  {
    name: "leaf-scripted",
    field: "leaf archives",
    scene: "an artifact covered in green leaves inscribed with fine living script",
    sentence:
      "The {noun} is inscribed in living leaves that re-write themselves each spring, so its text is technically annual.",
  },
  {
    name: "bone-whispered",
    field: "bone ridges",
    scene: "an artifact resting among vast pale ridges like the bones of something kind",
    sentence:
      "The {noun} rests among ridges like great bones, and it speaks of them the way one speaks of relatives.",
  },
  {
    name: "storm-caged",
    field: "storm cells",
    scene: "an artifact caged inside a slow, perfectly rotating storm",
    sentence:
      "Caged in a storm that rotates with ceremonial slowness, the {noun} considers the storm a colleague.",
  },
  {
    name: "light-eaten",
    field: "dark apertures",
    scene: "an artifact drinking light at the edge of a dark circular aperture in space",
    sentence:
      "The {noun} drinks light at the edge of a dark aperture, and what it returns is measurably kinder.",
  },
  {
    name: "worm-holed",
    field: "wormhole gates",
    scene: "an artifact passing through a quiet ring-shaped gate in deep space",
    sentence:
      "The {noun} passes through a quiet ring-gate twice a day, and arrives slightly improved each time.",
  },
  {
    name: "crystal-voiced",
    field: "crystal chambers",
    scene: "an artifact ringing inside a chamber of tall singing crystals",
    sentence:
      "The {noun} rings inside a chamber of tall crystals, and every maintenance session is conducted entirely in harmony.",
  },
  {
    name: "salt-bloomed",
    field: "salt gardens",
    scene: "an artifact flowering with slow crystals in a garden of white salt",
    sentence:
      "Flowering with slow crystals in a garden of salt, the {noun} blooms on a schedule that only it can read.",
  },
  {
    name: "night-mapped",
    field: "night charts",
    scene: "an artifact charted against a sky of constellations and thin measured lines",
    sentence:
      "Charted nightly against constellations and thin lines, the {noun} is the most photographed object that no one has ever touched.",
  },
  {
    name: "echo-shaped",
    field: "echo canyons",
    scene: "an artifact shaped like the echo that returns from a deep canyon",
    sentence:
      "The {noun} is shaped like the echo that returns from a canyon, which makes it difficult to draw and easy to trust.",
  },
  {
    name: "flame-taught",
    field: "flame schools",
    scene: "an artifact taught by patient rings of standing flame",
    sentence:
      "Taught by rings of patient flame, the {noun} learned its craft the way apprentices once learned: by watching.",
  },
  {
    name: "clay-remembered",
    field: "clay terraces",
    scene: "an artifact resting on terraces of smooth wet clay, fingerprints visible",
    sentence:
      "Resting on terraces of smooth wet clay, the {noun} keeps every fingerprint it has ever been handed.",
  },
  {
    name: "song-laden",
    field: "song currents",
    scene: "an artifact carried along visible currents of song",
    sentence:
      "Carried by visible currents of song, the {noun} arrives wherever the singing is truest.",
  },
  {
    name: "shadow-woven",
    field: "shadow looms",
    scene: "an artifact woven from soft bands of shadow",
    sentence:
      "Woven from bands of soft shadow, the {noun} is most useful at the hours when the light gives up.",
  },
  {
    name: "aurora-blessed",
    field: "aurora curtains",
    scene: "an artifact standing beneath slow curtains of aurora",
    sentence:
      "Beneath slow curtains of aurora, the {noun} was blessed by a sky that does not bless often.",
  },
  {
    name: "rain-numbered",
    field: "rain gauges",
    scene: "an artifact counting rain across a field of thin open gauges",
    sentence:
      "The {noun} counts the rain one drop at a time, and its ledgers are accepted by every court of the wet countries.",
  },
  {
    name: "ember-kept",
    field: "ember beds",
    scene: "an artifact kept warm in a wide bed of patient embers",
    sentence:
      "Kept warm in a bed of patient embers, the {noun} has never known a winter worth mentioning.",
  },
  {
    name: "frost-ploughed",
    field: "frost fields",
    scene: "an artifact cutting straight furrows through a field of frost",
    sentence:
      "The {noun} cuts its furrows through frost fields, leaving lines the sun reads like large, slow handwriting.",
  },
  {
    name: "signal-touched",
    field: "signal meadows",
    scene: "an artifact receiving faint signals in a meadow of thin antennas",
    sentence:
      "Receiving faint signals in a meadow of thin antennas, the {noun} answers only what it is sure of, which is little, and true.",
  },
  {
    name: "dew-caught",
    field: "dew nets",
    scene: "an artifact catching dew in fine nets strung between silent poles",
    sentence:
      "The {noun} catches dew in nets strung between silent poles, and by dawn it owns the only water that matters.",
  },
  {
    name: "hymn-carved",
    field: "hymn walls",
    scene: "an artifact carved with rows of hymns into a high stone wall",
    sentence:
      "Carved with rows of hymns into a high wall, the {noun} is sung rather than operated, and the singing is the operation.",
  },
];

/* ------------------------------------------------------------------ */
/*  25 nouns — craft archetypes. The first 18 appear in the sliced     */
/*  827-entry register; the last 7 are registry-line ancestors of the  */
/*  families that hold them.                                           */
/* ------------------------------------------------------------------ */

export const TECH_NOUNS: TechNoun[] = [
  {
    name: "Loom",
    sentence:
      "Its working surface is woven rather than machined, every thread a small agreement between tension and release.",
  },
  {
    name: "Chalice",
    sentence:
      "The bowl is graduated not in measures but in needs, and it fills to whichever line is being looked at honestly.",
  },
  {
    name: "Compass",
    sentence:
      "Its needle does not point at magnetic north but at whichever promise the holder is currently keeping.",
  },
  {
    name: "Chronometer",
    sentence:
      "The movement is governed by a balance wheel that beats to the season, quicker in spring and thoughtful in winter.",
  },
  {
    name: "Kiln",
    sentence:
      "Its chamber is lined with brick that remembers every firing and quietly refuses to repeat the bad ones.",
  },
  {
    name: "Lantern",
    sentence:
      "The housing is a cage of thin ribs designed to be carried by someone who is walking, not someone who is hurrying.",
  },
  {
    name: "Font",
    sentence:
      "The basin fills from below, as if the water were arriving rather than being poured, and no one has corrected this.",
  },
  {
    name: "Harp",
    sentence:
      "Its frame carries more strings than any player will ever need, precisely because no one knows which ones those are.",
  },
  {
    name: "Bell",
    sentence:
      "The bronze is cast with a fault-line that makes it speak in two voices, and both voices are considered accurate.",
  },
  {
    name: "Plough",
    sentence:
      "The blade is set at an angle learned from the roots it moves, and it can be re-set by hand in under a minute.",
  },
  {
    name: "Choir",
    sentence:
      "It is not an instrument but an arrangement, a standing order of voices that assembles wherever it is needed.",
  },
  {
    name: "Engine",
    sentence:
      "The drivetrain turns at a speed chosen for longevity, and its noise is tuned to sit underneath conversation, not over it.",
  },
  {
    name: "Garden",
    sentence:
      "It is a garden in the registry sense: a designed place whose primary output is the people who tend it.",
  },
  {
    name: "Mirror",
    sentence:
      "The surface is silvered to a depth that makes reflection feel like accommodation rather than physics.",
  },
  {
    name: "Bridge",
    sentence:
      "Its span is deliberately narrower than the road it joins, so that everyone arriving must slow down and be counted.",
  },
  {
    name: "Atlas",
    sentence:
      "It is bound loose-leaf, because the geography it describes has never once finished moving.",
  },
  {
    name: "Ark",
    sentence:
      "Its hull is doubled against a weather nobody has met, and the space between the hulls is stocked with patience.",
  },
  {
    name: "Prism",
    sentence:
      "The crystal is cut with facets set at angles that were argued over for a generation, and the argument is preserved in the cut.",
  },
  {
    name: "Weaver",
    sentence:
      "It weaves standing up, the way its makers did, and it declines to produce work for anyone who will not sit with it a while.",
  },
  {
    name: "Reliquary",
    sentence:
      "Its compartments are sized for things that matter more than they measure, and none of the locks have keys, only permissions.",
  },
  {
    name: "Orrery",
    sentence:
      "Its spheres drift on bearings so fine that the model runs a full year to be wrong by a breath.",
  },
  {
    name: "Astrolabe",
    sentence:
      "Its plates are interchangeable, one for each sky it has agreed to serve, and the case holds room for one more.",
  },
  {
    name: "Crucible",
    sentence:
      "Its walls are glazed with the residue of every metal it has agreed to hold, and that residue is the actual tool.",
  },
  {
    name: "Beacon",
    sentence:
      "Its lamp turns on a bearing race salvaged from a ship twice its size, which is why it has never stopped.",
  },
  {
    name: "Alembic",
    sentence:
      "Its coils are blown by hand, and each bend is a decision about what deserves to be kept and what deserves to be let go.",
  },
];

/* ------------------------------------------------------------------ */
/*  18 craft-families — 25 nouns gathered under 18 labels; seven       */
/*  families hold a pair of related nouns.                             */
/* ------------------------------------------------------------------ */

export const TECH_FAMILIES: TechFamilyDef[] = [
  {
    id: "warp-weft",
    label: "Warp & Weft",
    nouns: ["Loom", "Weaver"],
    practice:
      "Practitioners of the warp schools spend nine years listening to thread before they are permitted to cross one.",
    principles: [
      {
        title: "The thread consents",
        text: "nothing in the cloth is forced; each strand is asked, and weaving begins only when the strand agrees.",
      },
      {
        title: "Measure by ear",
        text: "tension is set by listening, not by number — a thread under true tension hums a third above silence.",
      },
      {
        title: "The pattern remembers",
        text: "every completed passage is stored in the cloth itself, so the loom can re-teach a craft to a generation that lost it.",
      },
      {
        title: "Leave one thread loose",
        text: "a finished work always keeps a single unfinished thread, in honor of the pattern that has not been thought of yet.",
      },
    ],
    applications: [
      "weaving settlement cloth that holds a town's agreements until unanimously repealed",
      "mending hull fabric by teaching the tear what it used to be",
      "producing ceremonial banners that unfold only in the presence of honest speech",
      "binding star-chart silk that re-draws itself when the sky changes",
      "manufacturing parachute grades trusted with the season's firstborn livestock",
      "weaving mourning bands that loosen, stitch by stitch, as grief completes",
      "crafting sails that trim themselves to the mood of a slow wind",
      "printing currency-thread into cloth so value can be worn and verified",
    ],
  },
  {
    id: "vessels-keeping",
    label: "Vessels of Keeping",
    nouns: ["Chalice", "Reliquary"],
    practice:
      "Its keepers are certified by examination and by reference, and the references are written by the previous contents.",
    principles: [
      {
        title: "Empty is a shape",
        text: "the vessel is calibrated when empty; whatever it later holds is measured against that first emptiness.",
      },
      {
        title: "Nothing kept in secret",
        text: "a vessel that hides its contents from its keeper stops holding them — the walls consider this honesty, not failure.",
      },
      {
        title: "One pour per grief",
        text: "the cup gives exactly what is needed and no more; abundance is treated as a form of spillage.",
      },
      {
        title: "The rim is an oath",
        text: "to drink is to accept the terms the vessel was made under, so every rim is engraved with those terms in full.",
      },
    ],
    applications: [
      "storing vaccines of distant manufacture at the exact temperature of trust",
      "carrying a household's drinking water through a decade of migration",
      "holding the last seeds of a fallen orchard until the climate forgives it",
      "serving treaty wines at negotiations where candor is a legal requirement",
      "preserving the final recording of a dissolved monastery",
      "dispensing medicines that refuse to pour for the wrong patient",
      "keeping a city's oath of office submerged until it is sworn",
      "reliquary duty for the remains of unidentified astronauts",
    ],
  },
  {
    id: "instruments-bearing",
    label: "Instruments of Bearing",
    nouns: ["Compass", "Orrery"],
    practice:
      "The bearing guilds inspect every instrument yearly, and an instrument that has drifted is retired with honors rather than corrected.",
    principles: [
      {
        title: "North is a promise",
        text: "the instrument does not point at what is true but at what was promised, and the two are reconciled nightly.",
      },
      {
        title: "Carry it open",
        text: "a bearing instrument carried closed forgets its calibration; it is meant to face the sky even indoors.",
      },
      {
        title: "Three readings before trust",
        text: "no single reading is a heading; the instrument must be consulted at rest, in motion, and in doubt.",
      },
      {
        title: "The errata dial",
        text: "when the instrument is wrong it says so in a small side window, and travelers are taught to read that window first.",
      },
    ],
    applications: [
      "guiding migration fleets through shoals of gravitational fog",
      "aligning orphaned satellites with the skies they were built for",
      "teaching navigation to cultures that map by smell and story",
      "steady-bearing service on polar expeditions where compasses weep",
      "orientation therapy for crews returned from fold-transit",
      "charting the drift of islands that move out of grief",
      "bearing witness in court when a road's ownership is disputed",
      "locating the true horizon for architects of tall quiet buildings",
    ],
  },
  {
    id: "instruments-hours",
    label: "Instruments of the Hours",
    nouns: ["Chronometer", "Astrolabe"],
    practice:
      "Its examiners measure accuracy in courtesy: how politely the instrument disagrees with the sun.",
    principles: [
      {
        title: "The hour asks permission",
        text: "time is not taken from the day; each hour is requested, granted, and then acknowledged aloud.",
      },
      {
        title: "Two skies, one reading",
        text: "the instrument agrees with itself only when the mechanical sky and the real sky are read together.",
      },
      {
        title: "Wound by the eldest",
        text: "only the eldest person present winds the mechanism, so that patience outranks precision.",
      },
      {
        title: "Leap moments are sacred",
        text: "the seconds the instrument adds or deletes are displayed, never hidden, and are spent only on reconciliation.",
      },
    ],
    applications: [
      "scheduling the first minute of each planetary new year, to the blink",
      "timekeeping for surgeries performed across three time-zones at once",
      "synchronizing the dreams of sleeping crews on long vessels",
      "rating the honesty of clocks sold at frontier fairs",
      "time-stamping testimony in tribunals where memory is contested",
      "pacing orchestras that perform for audiences made of ice",
      "measuring the work-day of volcanoes, which keep irregular hours",
      "finding the correct hour to open a letter that has waited a century",
    ],
  },
  {
    id: "firecraft",
    label: "Firecraft",
    nouns: ["Kiln", "Crucible"],
    practice:
      "The firewrights who maintain it are forbidden to work more than one firing a day, so that attention never thins.",
    principles: [
      {
        title: "The fire is fed, not commanded",
        text: "heat is offered as food; the craft fails wherever the flame is treated as a servant.",
      },
      {
        title: "Every firing keeps a witness",
        text: "a small unmarked token rides each firing, and the fired piece inherits the token's silence.",
      },
      {
        title: "Cooling is half the work",
        text: "the piece is not finished when it hardens but when it has forgiven the heat, which takes exactly as long as it takes.",
      },
      {
        title: "Ash returns to the bed",
        text: "all ash is returned to the ember bed, because the fire recognizes its own dead.",
      },
    ],
    applications: [
      "firing hull tiles that survive atmosphere twice, once coming and once going",
      "tempering surgical tools on worlds where steel is a religious matter",
      "smelting gate-alloys for crossings too small for ships",
      "cremation rites that return a body as a lens, not as ash",
      "kiln-training the clay domes of frontier settlements",
      "forging treaty seals that melt if the treaty is broken",
      "keeping a lantern-relay of slow fires across a dark continent",
      "reforging weapons into ploughshares with the serial number intact",
    ],
  },
  {
    id: "lightkeeping",
    label: "Lightkeeping",
    nouns: ["Lantern", "Beacon"],
    practice:
      "Its order keeps a roster of darkness as carefully as a roster of light, and both are signed at dusk.",
    principles: [
      {
        title: "Light is lent",
        text: "no lamp is ever owned; keepers hold the light in trust and sign for it each evening.",
      },
      {
        title: "Dim on purpose",
        text: "once a night the light is deliberately lowered, so the darkness is never treated as an enemy.",
      },
      {
        title: "The flame outlives the wick",
        text: "wicks, glass and housing are all replaceable; the flame itself is the only continuity the craft claims.",
      },
      {
        title: "A light for the returner",
        text: "one beam is always aimed back the way the last traveler came, on the chance they turned around.",
      },
    ],
    applications: [
      "marking reef-passages for ships that navigate by smell",
      "keeping a night-light burning over libraries of sleeping seed-vaults",
      "beacon duty for pilgrim caravans crossing the glass equator",
      "lighthouse service on moons with no reliable dawn",
      "signaling between mountain monasteries during the six silent months",
      "lighting the reading rooms of archives that fear electricity",
      "escorting night-ferry crossings with a single disciplined beam",
      "teaching children constellations with a lamp that corrects them gently",
    ],
  },
  {
    id: "wells-stillings",
    label: "Wells & Stillings",
    nouns: ["Font", "Alembic"],
    practice:
      "Its guild licenses the drawing of water, the drawing of essence, and the drawing of conclusions, in that order.",
    principles: [
      {
        title: "The source is asked first",
        text: "before anything is drawn, the water is informed of its intended use, and the drawing proceeds only on stillness.",
      },
      {
        title: "What evaporates is given",
        text: "the vapor is never counted as loss; the craft treats the sky as the next rightful holder.",
      },
      {
        title: "Distill in odd numbers",
        text: "passes are made one, three, or five at a time — even numbers are said to make the essence shy.",
      },
      {
        title: "Keep a spare emptiness",
        text: "every well keeps one vessel empty at all times, so arrival is always structurally possible.",
      },
    ],
    applications: [
      "distilling drinking water from fog on coasts that have forgotten rain",
      "drawing the exact measure of ink a treaty signature requires",
      "brewing the calmative served before difficult family councils",
      "supplying baptismal fonts to fleets that christen in orbit",
      "refining perfumes that only smell honest to the wearer",
      "well-keeping for caravan routes that cross the rust deserts",
      "reducing a fallen comrade's letters to their essential oils",
      "metering out courage in field-hospitals, one measured dram at a time",
    ],
  },
  {
    id: "stringwork",
    label: "Stringwork",
    nouns: ["Harp"],
    practice:
      "Its players are licensed by ear, and the examination consists of one string, one room, and one hour.",
    principles: [
      {
        title: "Tune to the room",
        text: "the harp is tuned after it arrives, never before, because every room holds a note the strings must meet.",
      },
      {
        title: "The broken string speaks",
        text: "a snapped string is mounted beside the harp for a season, its absence counted as one of the voices.",
      },
      {
        title: "Hands before picks",
        text: "the first hour of any performance is played with bare hands, so the instrument learns who is asking.",
      },
      {
        title: "Silence is a string",
        text: "the rest between notes is tuned like the notes, and players practice it with the same seriousness.",
      },
    ],
    applications: [
      "tuning the great hall-chords of orbital cathedrals",
      "accompanying negotiations, since treaties signed to music hold better",
      "string-therapy for engines that have begun to complain",
      "teaching mathematics to deaf students through felt vibration",
      "lullaby duty in nurseries aboard accelerating ships",
      "transcribing bird-song dialects before the flocks migrate forever",
      "providing the cadence for funeral marches that must not rush",
      "serenading vineyards whose fruit ripens only for music",
    ],
  },
  {
    id: "bellwork",
    label: "Bellwork",
    nouns: ["Bell"],
    practice:
      "Its founders are certified by the bells they have not yet cast, which are kept as sketches and as promises.",
    principles: [
      {
        title: "Cast once, honestly",
        text: "a bell is cast in a single sitting; if the pour fails, the metal rests a year before it is asked again.",
      },
      {
        title: "Ring for the leaving",
        text: "bells sound for departures before arrivals, because going is the more dangerous half of any journey.",
      },
      {
        title: "The clapper forgives",
        text: "struck too hard, the bell sounds but records the violence, and a year of gentle ringing cleans the record.",
      },
      {
        title: "Silence has a schedule",
        text: "each bell keeps posted hours of compulsory silence, and the town learns to tell time by the quiet.",
      },
    ],
    applications: [
      "marking the watch-changes of floating cities",
      "sounding the alarm-shape that warns of weather still over the horizon",
      "calling assemblies on worlds where shouting is forbidden",
      "bell-casting for towns that have outgrown their old voice",
      "ringing the hour for prisons that have become libraries",
      "sound-service at sea-burials, in weather that insults speech",
      "signing treaties audibly, so that the wind is a witness",
      "keeping time for couriers who run the ridge roads at night",
    ],
  },
  {
    id: "fieldcraft",
    label: "Fieldcraft",
    nouns: ["Plough"],
    practice:
      "Its ploughwrights serve a term in the fields before touching the shop, and the mud is considered a prerequisite.",
    principles: [
      {
        title: "Read the tenth furrow",
        text: "nine furrows are cut by instruction; the tenth is cut by listening, and it corrects the other nine.",
      },
      {
        title: "Share the blade's shadow",
        text: "the plough rests where its shadow falls at noon, and that rest-spot is left unploughed forever.",
      },
      {
        title: "Turn soil toward the sun",
        text: "every cut is made so the buried, tired soil faces upward into light before it is asked to grow anything.",
      },
      {
        title: "The field signs last",
        text: "harvest inventories are countersigned by the field itself, via the shape of whatever volunteered at the margin.",
      },
    ],
    applications: [
      "opening the first furrows of a reclaimed battlefield",
      "ploughing the terraces of orchard-moons too steep for machines",
      "turning under the residue of industries that apologized",
      "breaking ground for settlement-villages that have only a song so far",
      "tillage-service for seed-vaults waking after long emergencies",
      "cutting firebreaks through grass that memorizes sparks",
      "preparing the fellowship-fields that feed returning fleets",
      "teaching tractor-priests the older, slower geometry",
    ],
  },
  {
    id: "voicework",
    label: "Voicework",
    nouns: ["Choir"],
    practice:
      "Its conductors are trained to rehearse silence first, and rehearsals are held at the volume of the final performance divided by ten.",
    principles: [
      {
        title: "One breath per line",
        text: "the choir takes a single shared breath per line of text; running out together is considered correct timing.",
      },
      {
        title: "The quietest carries",
        text: "melody is assigned to whichever voice can sing it most softly and still be heard.",
      },
      {
        title: "Unison is earned",
        text: "singers rehearse apart for years before they are allowed to rehearse together.",
      },
      {
        title: "Leave room for the room",
        text: "every arrangement leaves one interval unplayed, reserved for the acoustics of wherever it is sung.",
      },
    ],
    applications: [
      "singing the news to settlements that lost their transmitters",
      "vocal escort for diplomatic parties passing through hostile silence",
      "training the replacement voices of singers who gave theirs away",
      "performing the four-hour lullabies that keep hibernation decks calm",
      "reciting patient registries in hospitals, so no one is a number",
      "choir-service at the launching of ships too large to bless alone",
      "translating whale-cantus into forms a town hall can act on",
      "holding the note that seals a vault until the rightful heir arrives",
    ],
  },
  {
    id: "enginecraft",
    label: "Enginecraft",
    nouns: ["Engine"],
    practice:
      "Its engineers keep diaries on the engine's behalf, and the diaries are read aloud at overhaul.",
    principles: [
      {
        title: "Start it bored",
        text: "the engine may only be started when nothing urgently needs it, so urgency never learns the ignition sequence.",
      },
      {
        title: "Motion owes a toll",
        text: "every hour of running accrues one hour of maintenance, paid by hand, with the engine cold.",
      },
      {
        title: "It idles in your accent",
        text: "the idle rhythm subtly tunes to its crew's speech cadence, and a homesick engine is a serviceable one.",
      },
      {
        title: "Stop before the answer",
        text: "the engine is shut down while it still wants to run, so that wanting survives the journey.",
      },
    ],
    applications: [
      "motive power for canal-tenders on rivers that changed their minds",
      "hauling the last bells of flooded valleys to higher ground",
      "turning the ventilation-wheels of cities built inside mountains",
      "tug-service for generational ships entering port after a century",
      "driving the pump-engines that keep a drowning archive dry",
      "moving the traveling hospital between villages that share it",
      "grinding the pigment for maps of coastlines that keep moving",
      "winching lifelines through storms too thick for radio",
    ],
  },
  {
    id: "gardencraft",
    label: "Gardencraft",
    nouns: ["Garden"],
    practice:
      "Its gardeners are appointed for nine years, precisely long enough to be wrong about at least one season.",
    principles: [
      {
        title: "Plant for the third gardener",
        text: "anything planted must be planned to be harvested by someone who has not yet arrived.",
      },
      {
        title: "Weeds are unpaid staff",
        text: "weeds are catalogued, assigned duties, and only dismissed if they refuse the work.",
      },
      {
        title: "The gate opens both ways",
        text: "a garden that cannot be exited is considered a trap, and traps cannot grow anything but regret.",
      },
      {
        title: "Compost the plan",
        text: "last year's plan is composted each spring, physically, so the soil knows what was intended.",
      },
    ],
    applications: [
      "growing the pharmacopoeia gardens attached to every courthouse",
      "keeping the memorial orchards of towns that buried their names",
      "roof-garden service for capitals that paved over their watersheds",
      "raising the drip-gardens that feed orbital neighborhoods",
      "restoring the kitchen-gardens of monasteries gone quiet",
      "cultivating border-gardens where two nations meet on purpose",
      "tending the night-blooming beds that shift workers walk past",
      "growing the school-yards where children learn every crop by name",
    ],
  },
  {
    id: "mirrorwork",
    label: "Mirrorwork",
    nouns: ["Mirror"],
    practice:
      "Its silversmiths work only in the morning, on the theory that a mirror made in the afternoon is looking forward to leaving.",
    principles: [
      {
        title: "Silver honestly",
        text: "the backing is applied in one continuous breath, and a mirror that catches its maker lying fogs permanently.",
      },
      {
        title: "Return the gaze",
        text: "mirrors are angled slightly upward, so that what looks in is looked at rather than looked over.",
      },
      {
        title: "One face at a time",
        text: "surfaces are sized for a single viewer; a mirror that fits two faces is reclassified as a doorway.",
      },
      {
        title: "Dust with the left hand",
        text: "cleaning is done with the non-dominant hand to keep the work slow, humble, and attentive.",
      },
    ],
    applications: [
      "fitting the periscopes of submarines that navigate by starlight",
      "diagnostic mirrors for temples that examine their own ceremonies",
      "mirror-service for observatories chasing the first light of the day",
      "making the honest mirrors required in every frontier courtroom",
      "teaching sign-language students to see their own hands clearly",
      "doubling the daylight in cities built under overhangs of rock",
      "providing the final reflection permitted before a long voyage",
      "checking the faces of masks before they are worn into ceremony",
    ],
  },
  {
    id: "spancraft",
    label: "Spancraft",
    nouns: ["Bridge"],
    practice:
      "Its builders must cross their own bridge a hundred times on foot before the first cart is permitted.",
    principles: [
      {
        title: "Build the crossing, not the span",
        text: "the bridge is considered finished when the habit of crossing exists, not when the stone stops moving.",
      },
      {
        title: "Leave a gap on purpose",
        text: "every bridge holds one deliberate gap, fitted with a slow ferry, so the river keeps a vote.",
      },
      {
        title: "Toll is a story",
        text: "the crossing fee is a fact told to the keeper; a traveler with no story crosses for the price of listening.",
      },
      {
        title: "Name the wind",
        text: "each bridge is named for a local wind, and construction begins only when that wind is blowing.",
      },
    ],
    applications: [
      "bridging the canal-gorges of moons with two-week tides",
      "ferry-span service over rivers that migrate each spring",
      "linking the towers of cities that abolished ground travel",
      "building the animal-overpasses of migration highways",
      "spanning the moats of fortresses that are now schools",
      "footbridge duty in villages split by an argument two centuries old",
      "temporary bridges for festivals that must leave no trace",
      "rejoining the estates divided by a border redrawn in error",
    ],
  },
  {
    id: "mapcraft",
    label: "Mapcraft",
    nouns: ["Atlas"],
    practice:
      "Its cartographers sign every sheet twice: once for what is drawn and once for what is deliberately not.",
    principles: [
      {
        title: "Draw the change",
        text: "maps are dated by the hour, and the margin always carries the sentence that this has already begun to be wrong.",
      },
      {
        title: "Leave the blank honest",
        text: "unmapped regions are marked with a blank of a distinct, beautiful paper, never with invention.",
      },
      {
        title: "Fold toward home",
        text: "every atlas folds so that, closed blindly in the dark, the reader's thumb lands on their own doorstep.",
      },
      {
        title: "Two hands on the table",
        text: "reading aloud from the atlas requires one finger on the place and one on the reader's own location.",
      },
    ],
    applications: [
      "surveying the shifting streets of cities that dream in different places",
      "chart-service for fishing fleets that follow the weather inward",
      "mapping the settled interior of comets after anchor-fall",
      "atlas-duty for caravans crossing the singing dunes",
      "recording the outlines of lakes that volunteer to disappear",
      "census-mapping the floating neighborhoods of estuary towns",
      "drawing the school-charts that teach children their own watershed",
      "map-service in court for roads older than the kingdoms around them",
    ],
  },
  {
    id: "arkcraft",
    label: "Arkcraft",
    nouns: ["Ark"],
    practice:
      "Its provisioners pack by hunger first and sentiment second, and the manifest is read like poetry at departure.",
    principles: [
      {
        title: "Room for the uninvited",
        text: "one sealed compartment is stocked for a passenger no manifest predicted, and it is never opened to check.",
      },
      {
        title: "Provisions outrank ornament",
        text: "weight budgets are settled by hunger first, and beauty is funded only with what hunger did not claim.",
      },
      {
        title: "The keel remembers water",
        text: "keels are laid from timber that has already crossed something, and the crossing is recorded in the log.",
      },
      {
        title: "Landfall is rehearsed",
        text: "arrival is drilled weekly for the whole voyage, so that hope arrives practiced.",
      },
    ],
    applications: [
      "seed-ark duty for biomes waiting out a hostile age",
      "carrying the library of a drowned country to higher shelves",
      "livestock-arks for islands that erupt on well-studied schedules",
      "refuge-arcs for towns beneath glaciers that have begun to hum",
      "arks of instruments for orchestras re-founded in exile",
      "storing the festivals of a city too busy to hold them yet",
      "grain-arks standing by against the seven lean years",
      "arks of correspondence for letters written to the unborn",
    ],
  },
  {
    id: "prismcraft",
    label: "Prismcraft",
    nouns: ["Prism"],
    practice:
      "Its opticians are sworn to report the color they see rather than the color they expect, and the oath is renewed annually.",
    principles: [
      {
        title: "Cut for the question",
        text: "the facet angles are ground to match the question the light will be asked, and regrinding is a new beginning.",
      },
      {
        title: "Never split the same light twice",
        text: "a beam already analyzed is retired from study; only unwritten light is admitted.",
      },
      {
        title: "The spectrum is a sentence",
        text: "colors are read in order as grammar, and readings taken out of order are marked as poetry.",
      },
      {
        title: "Keep one dark facet",
        text: "one face is left unpolished, so the prism retains an opinion about darkness.",
      },
    ],
    applications: [
      "spectral analysis of treaties, to detect the ink of forgers",
      "sorting the light of dying stars for the observatory-monasteries",
      "color-calibration for surgeons operating by stained lamp",
      "reading the chemistry of rain on worlds that changed their sky",
      "gem-work for crowns that are only worn at abdications",
      "splitting lighthouse-beams so each sector gets its honest color",
      "analyzing the glint of tears in truth-finding hearings",
      "photography-service for paintings that change in daylight",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Deterministic banks — origins, whispers, closers, era, ethics,     */
/*  tone. Nothing here is random; everything is drawn.                 */
/* ------------------------------------------------------------------ */

const ORIGINS: string[] = [
  "First catalogued aboard the glass orbital stations above a drowned world",
  "Recovered from a workshops-arc that landed gently and never opened",
  "Traded out of the night markets of the tidal moons for a song and a promise",
  "Excavated from the kiln-districts of a city that buried itself on purpose",
  "Gifted by the survey fleets of the outer reaches, with instructions in eleven hands",
  "Found drifting in the long quiet between two systems, still warm",
  "Inherited from the archivists of the amber vaults, minus one page",
  "Carried out of a war by a deserter who kept it oiled the whole way",
  "Raised from the seabed of a sea that gave it up reluctantly",
  "Documented by the lighthouse-orders of the frozen continents",
  "Sent back by the first probe to land upright on the salt plains",
  "Purchased at auction from the estate of a collector who never existed",
  "Unearthed beneath the root-cellar of a monastery still inhabited",
  "Delivered by a courier who arrived old, having left young",
  "Recovered from the debris-train of a comet that was never named",
  "Compiled by the guilds of the wind-cities from three broken ancestors",
  "Brought home in the pocket of a returning ambassador, unexplained",
  "Salvaged from the museum-ships of the second scattering",
  "Grown, not made, in the gardens of the gravity wells",
  "Taken in trade from the ice-herders of the southern shelf",
  "Passed down through nine keepers, each of whom added one mark",
  "Unlocked from a vault whose door had been waiting politely for centuries",
  "Brought up from the deep mines by crews who refused to say what it cost",
  "Found folded inside a map of a country that has since moved",
  "Received from the tide-courts in settlement of a very old debt",
  "Discovered in the luggage of a pilgrim who walked the long way",
  "Reassembled from fragments by a school class with too much patience",
  "Surrendered by the storm-cells during the armistice of the gray season",
];

const WHISPERS: string[] = [
  "It works only while someone remembers why it was made.",
  "Ask it nothing twice — the {adj} {noun} answers both times, differently.",
  "The {noun} is complete; the craft around it is not.",
  "Hold it near the {field} and it settles, like a dog hearing its name.",
  "Every keeper has added one small improvement and one small apology.",
  "It was built for a question that has not been asked yet.",
  "The manual is one sentence, and the sentence is disputed.",
  "It runs quietly, but it notices everything.",
  "Two civilizations claim it; both keep it lovingly; only one is right.",
  "It has been repaired so often that the repairs are the artifact.",
  "The {field} taught it first; the makers only took notes.",
  "It refuses to work in a hurry, and it has never once been wrong slowly.",
  "Children understand it immediately; experts take years.",
  "The {adj} finish is not decoration — it is the warranty.",
  "It is exactly as old as it claims, which is the strange part.",
  "Somewhere there is its twin, and the two are homesick.",
  "The {noun} keeps the oath; the keeper only witnesses it.",
  "It weighs less on the days it is trusted.",
  "Listen for the third sound — the first two are courtesy.",
  "The {field} still pays it a small visit every season.",
  "Its maker signed it with a mistake, on purpose, as a signature.",
  "It has never been dropped, and it worries about that.",
  "The {adj} {noun} tolerates study; it does not tolerate theft.",
  "What it measures is real; the scale is the mystery.",
  "It was mended with a better metal than it was born with.",
  "The {field} remembers this one fondly, the registries say.",
  "Turn it gently; it is older than patience.",
  "It works best for people who intend to stay.",
];

const CLOSERS: string[] = [
  "The register classifies it as working, which is a stronger word than it sounds.",
  "No survey team has reported the same silhouette twice, and the register considers this a feature.",
  "It is displayed behind glass that is itself a later, lesser copy.",
  "Students are permitted to look; apprentices are permitted to touch; keepers are permitted to be changed.",
  "Its continued function is a matter of record, its continued patience a matter of grace.",
  "The comprehensiveness of the files is owed to one archivist who refused to summarize.",
  "It has survived three owners, two wars, and one honest attempt at improvement.",
  "The examination board notes that it performs best when it is being trusted rather than tested.",
  "Curators describe the effect as standing next to someone who is thinking.",
  "Its documentation runs to nine hundred pages, four hundred of which are apologies.",
  "The registry number is longer than the list of things it cannot do.",
  "Replicas exist, and they are all, without exception, slightly kind.",
  "It is one of the few artifacts that improve when borrowed and returned late.",
  "The original specifications call it temporary, and it has agreed to that for nine centuries.",
  "Whatever it replaces, it replaces gently, and whatever it measures, it measures kindly.",
  "Every attempt to photograph it accurately has instead produced a portrait.",
  "The guilds agree on its function, its provenance, and nothing else, which keeps the conferences lively.",
  "It is routinely over-insured, and the insurers have stopped minding.",
  "Its sound, or its light, or its weight — witnesses disagree — is what people miss when they leave.",
  "The last inspection concluded with the phrase 'no defects, several opinions'.",
  "It is said to be unfinished, but no one has proposed a next step in living memory.",
  "Apprentices are told its story differs slightly depending on who is telling it, and that this is the point.",
  "The register records no instance of it being used in anger, and every use in haste ending well anyway.",
  "Its case in the museum is warm to the touch, and this is noted but not explained.",
];

const ERAS: string[] = [
  "Late Scatter Epoch, before the Second Quiet",
  "Early Concord centuries",
  "The Long Tidework, between the two great surveys",
  "First Expansion, pre-registry",
  "The Amber Interregnum",
  "High Navigational Era",
  "The Settlement Winters",
  "Post-Arbitration decades",
  "The Bright Surveys, third passing",
  "Late Seedling Period",
  "The Quiet shipyards era",
  "Early deep-field decades, post-contact",
];

const ETHICS: string[] = [
  "Openly taught; the craft refuses to function for a single keeper.",
  "Restricted to oathbound orders; the restriction itself is published.",
  "Unrestricted, on the argument that misusing it is more instructive than preventing it.",
  "Licensed by guild ballot, renewable every nine years.",
  "Free to study, costly to practice, forbidden to hoard.",
  "Shared freely with any civilization that publishes its failures.",
  "Held in trust for the ninth generation, who have not been consulted.",
  "Disclosed fully at every border, which has ended more wars than the fleets have.",
  "Taught only in person; the craft does not survive transcription.",
  "Under a standing truce: whoever holds it owes its use to the nearest need.",
  "Regulated by the tide-courts, which rule slowly and never twice the same.",
  "Freely given, on the single condition that it be passed on improved.",
];

const TONES: string[] = [
  "contemplative",
  "ordinal",
  "votive",
  "glacial",
  "mercurial",
  "pastoral",
  "oracular",
  "tectonic",
  "luminous",
  "tidal",
  "spectral",
  "regal",
  "plainspoken",
  "nocturnal",
];

const GRADES: string[] = ["Grade I", "Grade II", "Grade III", "Grade IV", "Grade V"];

/* ------------------------------------------------------------------ */
/*  Build — noun-major, deterministic, sliced to the target.           */
/* ------------------------------------------------------------------ */

const TARGET = 827;

const cap = (s: string) => s.replace(/(^|-)([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
const pick = <T>(arr: readonly T[], h: number): T => arr[h % arr.length];
const pick3 = (arr: readonly string[], h: number): string[] => {
  const n = arr.length;
  const a = h % n;
  return [arr[a], arr[(a + 7) % n], arr[(a + 14) % n]];
};
const fill = (tpl: string, noun: string, adj: string, field: string) =>
  tpl.replaceAll("{noun}", noun).replaceAll("{adj}", adj).replaceAll("{field}", field);

const familyOfNoun = new Map<string, TechFamilyDef>();
for (const fam of TECH_FAMILIES) {
  for (const noun of fam.nouns) familyOfNoun.set(noun, fam);
}

const fullSweep: TechEntry[] = [];
for (const nounDef of TECH_NOUNS) {
  const fam = familyOfNoun.get(nounDef.name);
  if (!fam) throw new Error(`noun without family: ${nounDef.name}`);
  for (const adj of TECH_ADJECTIVES) {
    const n = fullSweep.length;
    const id = `XT-${String(n + 1).padStart(4, "0")}`;
    const h = fnv1a(id);
    const name = `${cap(adj.name)} ${nounDef.name}`;
    const overview = [
      fill(adj.sentence, nounDef.name, adj.name, adj.field),
      nounDef.sentence,
      fam.practice,
      pick(CLOSERS, fnv1a(`${id}|closer`)),
    ].join(" ");
    const skip = h % fam.principles.length;
    fullSweep.push({
      id,
      name,
      registry: `${id} · ${fam.label}`,
      familyId: fam.id,
      family: fam.label,
      adjective: adj.name,
      noun: nounDef.name,
      adjectiveField: adj.field,
      contextImage: `/images/ai/et-tech/adj-${adj.name}.jpg`,
      image: `/images/ai/et-tech/fam-${fam.id}.jpg`,
      origin: pick(ORIGINS, h),
      whisper: fill(pick(WHISPERS, fnv1a(`${id}|whisper`)), nounDef.name, adj.name, adj.field),
      overview,
      principles: fam.principles
        .filter((_, i) => i !== skip)
        .map((p) => `${p.title} — ${p.text}`),
      applications: pick3(fam.applications, fnv1a(`${id}|apps`)),
      era: pick(ERAS, fnv1a(`${id}|era`)),
      ethics: pick(ETHICS, fnv1a(`${id}|ethics`)),
      classificationTone: pick(TONES, fnv1a(`${id}|tone`)),
      grade: pick(GRADES, fnv1a(`${id}|grade`)),
      meters: {
        rarity: 10 + (h % 86),
        containment: 15 + ((h >>> 7) % 81),
        ethicsLoad: 8 + ((h >>> 13) % 88),
        maturity: 22 + ((h >>> 17) % 74),
      },
      adjacent: [],
    });
  }
}

export const techEntries: TechEntry[] = fullSweep.slice(0, TARGET);

/* Adjacent crafts — cyclic same-family neighbours with stride 7, in
   the family's own registry-ordered entry list. */
const byFamily = new Map<string, TechEntry[]>();
for (const entry of techEntries) {
  const list = byFamily.get(entry.familyId);
  if (list) list.push(entry);
  else byFamily.set(entry.familyId, [entry]);
}
for (const [familyId, list] of byFamily) {
  for (let i = 0; i < list.length; i++) {
    list[i].adjacent = [7, 14, 21].map((stride) => list[(i + stride) % list.length].id);
  }
}

export const craftFamilies: { id: string; label: string; count: number }[] = TECH_FAMILIES.map((fam) => ({
  id: fam.id,
  label: fam.label,
  count: techEntries.reduce((c, e) => (e.familyId === fam.id ? c + 1 : c), 0),
}));

const entryIndex = new Map(techEntries.map((e) => [e.id, e] as const));

/** Look a technology up by registry id ("XT-0042"). */
export function getTechEntry(id: string): TechEntry | undefined {
  return entryIndex.get(id);
}

export const TECH_TOTAL = techEntries.length;
