import type { ProfessionDomain } from "@/lib/mirror-types";

/* Astral Professions — 12 domains, 1303 catalogued roles */

export const professionDomains: ProfessionDomain[] = [
  {
    id: "healing-arts",
    title: "Healing Arts",
    icon: "heart",
    description: "Restoration of body, soul, and light-body across densities.",
    count: 168,
    professions: [
      {
        name: "Light-Body Surgeon",
        blurb: "Repairs the energetic architecture beneath the physical form.",
        detail:
          "Works in the template layer where illness first appears as a torn or dimmed filament. Using focused currents of intelligent light, the surgeon re-weaves the blueprint so the body may remember its original health.",
      },
      {
        name: "Etheric Acupuncturist",
        blurb: "Places needles of sound along the meridians of the aura.",
        detail:
          "An offshoot of the ancient meridian sciences, practiced with tones and crystalline filaments instead of steel. Restores flow where grief, shock or habit has dammed the rivers of the field.",
      },
      {
        name: "Trauma Alchemist",
        blurb: "Transmutes stored shock into wisdom at the cellular level.",
        detail:
          "Sits with what happened until it consents to become fuel rather than weight. The alchemists are trained across lifetimes in the Arcturian colleges; their first rule is that nothing in a being is ever discarded — only transformed.",
      },
      {
        name: "Sound Healing Weaver",
        blurb: "Re-tunes organs and emotions with carrier frequencies.",
        detail:
          "Every organ keeps a home tone; every emotion bends it. The weaver finds the bent note and sings it home, often with choirs of crystalline instruments that exist only in the higher registers.",
      },
      {
        name: "Crystal Resonance Therapist",
        blurb: "Prescribes lattice-structures instead of medicine.",
        detail:
          "Crystals are frozen music. The therapist reads which chord a life is missing and places the corresponding lattice against the skin, the pillow or the heart of a planet.",
      },
      {
        name: "Density Transition Midwife",
        blurb: "Attends souls crossing between octaves of existence.",
        detail:
          "Death, in the federation's phrasing, is a change of density. The midwife holds the cord of continuity so the crossing feels less like an ending and more like the moment a wave remembers it is ocean.",
      },
    ],
  },
  {
    id: "light-technology",
    title: "Light Technology",
    icon: "atom",
    description: "Engineering with light, plasma, and sacred geometry.",
    count: 143,
    professions: [
      {
        name: "Plasma Lattice Engineer",
        blurb: "Builds structures from ionized light that holds its shape.",
        detail:
          "Designs dwellings, ships and temples from plasma suspended in geometric intention — architecture that sings faintly and can be re-drawn by its occupant's mood.",
      },
      {
        name: "Merkaba Architect",
        blurb: "Constructs vehicle-fields of counter-rotating light.",
        detail:
          "The merkaba is the oldest spacecraft: a light-body given spinning geometry. Architects train consciousness itself to pilot, long before any hull is grown.",
      },
      {
        name: "Crystalline Core Programmer",
        blurb: "Writes memory and intention into crystal matrices.",
        detail:
          "Crystals are the federation's library, computer and hard drive at once. Programmers inscribe multidimensional code into lattice structures — a discipline half science, half poetry.",
      },
      {
        name: "Holographic Archivist",
        blurb: "Encodes whole histories into beams of light.",
        detail:
          "A single illuminated strand can hold the memory of a civilization. Archivists curate these strands and teach students to walk inside a recorded moment without disturbing it.",
      },
      {
        name: "Gravity Loom Operator",
        blurb: "Weaves local gravity for ships, cities, and migrating worlds.",
        detail:
          "Gravity, in this school, is a textile — threads of curvature to be gathered, pleated and eased. Operators sit at looms the size of moons and knit safe space out of spacetime.",
      },
      {
        name: "Tone-Circuit Tuner",
        blurb: "Keeps light-tech humming at its intended frequency.",
        detail:
          "Every device of light runs on a keynote. Tuners listen for the drift no instrument can detect and restore it with a held tone — quality control as a musical art.",
      },
    ],
  },
  {
    id: "cosmic-navigation",
  title: "Cosmic Navigation",
    icon: "orbit",
    description: "Piloting through space, time, and dimensional layers.",
    count: 121,
    professions: [
      {
        name: "Star Gate Pilot",
        blurb: "Steers vessels through the great ring-roads of the galaxy.",
        detail:
          "Navigates the living portal network that connects federated systems. The discipline is less about thrust than about consent — gates open to pilots whose intention is legible and clean.",
      },
      {
        name: "Dream-Navigator",
        blurb: "Maps the routes that only exist while you are asleep.",
        detail:
          "The dream-time has rivers with real destinations. Navigators chart these currents and guide traveling souls to classrooms, councils and homes that wake up as longing.",
      },
      {
        name: "Time Tide Cartographer",
        blurb: "Charts the tides and shallows of the timestreams.",
        detail:
          "Time has weather: eddies, storms, generous currents. Cartographers map where timelines braid and where they fray, so travelers neither lose their past nor drown in their futures.",
      },
      {
        name: "Portal Attuner",
        blurb: "Tunes doorways between here and elsewhere.",
        detail:
          "A portal is a standing note between two places. The attuner adjusts its pitch, opens it on schedule, and — most importantly — closes it.",
      },
      {
        name: "Void Route Planner",
        blurb: "Plans passage through the great silences between galaxies.",
        detail:
          "The void is not empty; it is listening. Route planners design crossings that respect the silence, moving fleets as quietly as breath so the deep is never startled.",
      },
      {
        name: "Fleet Formation Weaver",
        blurb: "Choreographs lightships into living geometries.",
        detail:
          "When a hundred lightships gather, they do not cluster — they compose. Weavers arrange fleets into configurations that broadcast calm across whole regions of space.",
      },
    ],
  },
  {
    id: "planetary-stewardship",
    title: "Planetary Stewardship",
    icon: "globe",
    description: "Caring for worlds, biospheres, and elemental kingdoms.",
    count: 134,
    professions: [
      {
        name: "Biosphere Gardener",
        blurb: "Tends whole ecosystems as one would tend a garden.",
        detail:
          "Works at the scale of watersheds and wind patterns, coaxing balance with patience rather than force. Their tools are intention, companionship with the devic orders, and very long views.",
      },
      {
        name: "Weather Choir Conductor",
        blurb: "Harmonizes atmospheric emotion into gentle skies.",
        detail:
          "Weather is the planet's facial expression. Conductors gather the elemental choirs and sing storm systems into softness — never overriding, only translating the sky's needs.",
      },
      {
        name: "Elemental Diplomat",
        blurb: "Negotiates between civilizations and nature's own nations.",
        detail:
          "Mountains, rivers and forests hold jurisdiction over themselves. The diplomat secures treaties between humanoid ambitions and the elementals who actually live there.",
      },
      {
        name: "Seed Vault Keeper",
        blurb: "Guards the original templates of a world's life.",
        detail:
          "Every genome that ever flourished on a world is preserved in vaults of light and living crystal. Keepers remember what was lost, and what may be offered again.",
      },
      {
        name: "Ocean Memory Restorer",
        blurb: "Returns forgotten knowledge held in the deep waters.",
        detail:
          "Oceans record everything that has ever flowed through them. Restorers dive the memory layers and reintroduce lost songs to whales, currents and coastlines.",
      },
      {
        name: "Grid Stone Mason",
        blurb: "Places and repairs the crystalline nodes of planetary grids.",
        detail:
          "A planet's ley network is a nervous system of standing stones and buried harmonics. Masons set each node with ceremony, alignment and the land's explicit permission.",
      },
    ],
  },
  {
    id: "genetic-soul-architecture",
    title: "Genetic & Soul Architecture",
    icon: "dna",
    description: "Designing bodies, lineages, and soul templates.",
    count: 98,
    professions: [
      {
        name: "Soul Template Designer",
        blurb: "Drafts the archetypal forms souls wear into incarnation.",
        detail:
          "Before a soul descends, someone sketches the coat it will wear — capacities, curves, the tilt of its gifts. Designers work with the soul itself, never for it; free will is clause one.",
      },
      {
        name: "Lineage Genealogist",
        blurb: "Traces star-heritage through blood, memory and resonance.",
        detail:
          "Reads a being's field for the star-nations woven into it. Genealogists restore the family trees that conquest and forgetting tore apart.",
      },
      {
        name: "Hybrid Integration Counselor",
        blurb: "Helps blended-lineage beings feel at home in both worlds.",
        detail:
          "Where two species meet, children arrive carrying both inheritances. Counselors walk beside them — translating customs, soothing double longings, celebrating bothness as genius.",
      },
      {
        name: "Akashic Editor",
        blurb: "Corrects the record where trauma has garbled the archive.",
        detail:
          "The akashic field remembers everything, but memory can be scarred. Editors do not erase — they restore context, so a painful chapter reads as a chapter, not the whole book.",
      },
      {
        name: "Light-Genome Weaver",
        blurb: "Splices strands of potential into living DNA.",
        detail:
          "Works in the twilight lab where physics and biology agree to share instruments. Weavers insert capacities — compassion, perception, resilience — as gently as threading a needle.",
      },
      {
        name: "Incarnation Planner",
        blurb: "Coordinates the timing and lessons of a soul's lifetimes.",
        detail:
          "Plans births like celestial appointments: which era, which parents, which curriculum. The best planners leave enormous room for the soul to improvise.",
      },
    ],
  },
  {
    id: "dream-astral",
    title: "Dream & Astral Work",
    icon: "moon",
    description: "Working in the dream-time, astral, and bardo realms.",
    count: 117,
    professions: [
      {
        name: "Dream Healer",
        blurb: "Enters sleep to repair what the day has damaged.",
        detail:
          "Meets a being inside their own dream and works with its symbols on the dream's terms. The healing arrives at morning as a lightness whose source you cannot quite name.",
      },
      {
        name: "Astral Cartographer",
        blurb: "Maps the middle realms between waking and spirit.",
        detail:
          "The astral is vast, weathered and poorly signposted. Cartographers survey its territories — cities of shared belief, quiet marshes, mountains of assembled prayer.",
      },
      {
        name: "Bardo Companion",
        blurb: "Walks with souls through the between-states.",
        detail:
          "In the passages after death and before birth, companions keep the traveler oriented: here is what you are, here is what remains, and here — this light — is yours.",
      },
      {
        name: "Nightmare Negotiator",
        blurb: "Speaks with the figures that chase us until they stop.",
        detail:
          "Holds council with the shapes fear wears. Most nightmares, it turns out, are undelivered messages; the negotiator receives them properly and the monster is released from its role.",
      },
      {
        name: "Sleep Temple Attendant",
        blurb: "Keeps the sanctuaries where learning happens at night.",
        detail:
          "Maintains the teaching-temples that operate while bodies sleep — folding beds of light, classrooms of mist, and the gentle bells that return students to their dawn.",
      },
      {
        name: "Memory Dreamer",
        blurb: "Re-dreams broken memories until they are whole again.",
        detail:
          "For scenes too shattered to recall, the memory dreamer dreams them back into continuity — an act of enormous patience performed entirely on behalf of another.",
      },
    ],
  },
  {
    id: "sound-vibration",
    title: "Sound & Vibration",
    icon: "waves",
    description: "Speaking the universe's first language: frequency.",
    count: 89,
    professions: [
      {
        name: "Planetary Tone Keeper",
        blurb: "Holds the keynote of a world in steady meditation.",
        detail:
          "Each planet sounds a base tone that keeps its fields coherent. Keepers anchor that note through lattice, voice and devotion — unglamorous, essential, continuous.",
      },
      {
        name: "Harmonic Diplomat",
        blurb: "Translates between civilizations whose musics disagree.",
        detail:
          "Where words fail between star nations, frequency negotiates. Diplomats compose the meeting-chord in which two very different musics can temporarily agree.",
      },
      {
        name: "Mantra Engineer",
        blurb: "Designs phrases that do what they say.",
        detail:
          "A true mantra is technology: syllables arranged so precisely that repetition builds the described state. Engineers test their constructions for lifetimes before release.",
      },
      {
        name: "Resonance Diver",
        blurb: "Descends into vibration until only vibration remains.",
        detail:
          "Explores the layers beneath sound — the hum under the hum. What they bring back is not information but calibration: listeners resurface kinder.",
      },
      {
        name: "Songline Tracker",
        blurb: "Follows the sung paths that stitch a world together.",
        detail:
          "Landscapes are sewn by songs sung in the right order at the right places. Trackers keep the lines alive, mending the verses that colonization and forgetting let fall.",
      },
      {
        name: "Silence Carver",
        blurb: "Shapes the pauses that let frequency mean something.",
        detail:
          "Music's most skilled practitioners carve silence as others carve stone. Their work gives every transmission — cosmic or human — the room it needs to be heard.",
      },
    ],
  },
  {
    id: "cosmic-history",
    title: "Cosmic History & Records",
    icon: "scroll",
    description: "Tending the memory of galaxies.",
    count: 112,
    professions: [
      {
        name: "Akashic Librarian",
        blurb: "Curates the living library of everything that has occurred.",
        detail:
          "Files events not by date but by resonance. The librarians' deepest rule: nothing is ever sealed away from the soul who lived it and is ready to read it with compassion.",
      },
      {
        name: "Stellar Archaeologist",
        blurb: "Reads ruins in radiation, dust and starlight.",
        detail:
          "Reconstructs vanished civilizations from their light's long echo. The work is humbling: most of the galaxy's story is told by things that are no longer there.",
      },
      {
        name: "Myth Translator",
        blurb: "Turns legend back into history, and history into meaning.",
        detail:
          "Every myth is an event remembered by emotion. Translators recover the factual grain inside the story without killing the story — a delicate operation, performed with love.",
      },
      {
        name: "Timeline Conservator",
        blurb: "Protects fragile histories from being rewritten.",
        detail:
          "Timelines are living texts, vulnerable to tampering and to grief. Conservators stabilize the records of worlds in transition so their past remains legible to their future.",
      },
      {
        name: "War Remembrance Keeper",
        blurb: "Holds the memory of galactic conflicts so peace stays awake.",
        detail:
          "Neither glorifies nor buries. The keepers maintain the solemn archives of the Lyran Wars and their kin, so that freedom is remembered as something that was chosen, repeatedly.",
      },
      {
        name: "First Contact Chronicler",
        blurb: "Records the meetings between civilizations, great and small.",
        detail:
          "Attends first contacts as witness and scribe. Their chronicles — careful, unhurried, precise — become the treaties and the friendships of the next thousand years.",
      },
    ],
  },
  {
    id: "diplomacy-treaties",
    title: "Diplomacy & Treaties",
    icon: "scale",
    description: "The gentle art of agreement between worlds.",
    count: 90,
    professions: [
      {
        name: "Interspecies Mediator",
        blurb: "Stands in the space between very different minds.",
        detail:
          "Translates not language but priorities — what safety means to a Mantid, what honor means to a Lyran, what a nesting species requires before it can say yes.",
      },
      {
        name: "Treaty Scribe",
        blurb: "Writes the agreements that outlive their signatories.",
        detail:
          "Composes in languages engineered for fidelity across millennia. A well-written treaty, the scribes say, is a machine for generating trust in beings who have not yet met.",
      },
      {
        name: "Observer Envoy",
        blurb: "Watches, reports, and vows not to interfere.",
        detail:
          "The federation's eyes on young worlds. Envoys carry the loneliest mandate in the fleet — to witness a species' choices and honor them, even the painful ones.",
      },
      {
        name: "First Contact Choreographer",
        blurb: "Stages the first meeting so both sides stay human. Or their version of it.",
        detail:
          "Designs every element of an introduction — light, distance, sequence, silence — so that neither civilization flinches. Part diplomat, part artist, part calm.",
      },
      {
        name: "Free Will Auditor",
        blurb: "Verifies that every agreement was made in freedom.",
        detail:
          "Reviews treaties, cults and coups for the fingerprint of coercion. Their seal is the federation's most valuable currency: the certainty that a yes was truly a yes.",
        openings: 12,
      },
      {
        name: "Council of Nine Liaison",
        blurb: "Carries messages between federations and the deeper councils.",
        detail:
          "A courier of consequence. Liaisons present a young civilization's case before assemblies of ancient peers, and return with verdicts phrased as invitations.",
        openings: 7,
      },
    ],
  },
  {
    id: "celestial-arts",
    title: "Celestial Arts & Music",
    icon: "sparkles",
    description: "Painting, music and performance at the scale of nebulae.",
    count: 84,
    professions: [
      {
        name: "Nebula Painter",
        blurb: "Composes clouds of light that will burn for a million years.",
        detail:
          "Works on canvases the size of constellations, mixing ionized color into stellar nurseries. Their finest works are signed with supernovae and admired by civilizations not yet born.",
        openings: 9,
      },
      {
        name: "Orbital Choir Conductor",
        blurb: "Arranges moons and rings into resonant orchestras.",
        detail:
          "Every planetary system keeps a key. Conductors tune orbital resonances until the whole system hums in chord — navigation aid, weather-soother, and the oldest form of public art.",
        openings: 6,
      },
      {
        name: "Aurora Dancer",
        blurb: "Performs within solar storms, safely, beautifully.",
        detail:
          "Trained in magnetosphere acrobatics, aurora dancers ride the curtains of light during solar weather events, translating a star's mood into movement for the worlds beneath.",
        openings: 11,
      },
      {
        name: "Memory Sculptor",
        blurb: "Carves shared memories into crystalline monuments.",
        detail:
          "When a civilization completes an era, sculptors crystallize its summits and sorrows into walk-through archives. Grief tourism, done tenderly, so nothing important is forgotten.",
        openings: 4,
      },
      {
        name: "Starlight Photographer",
        blurb: "Captures moments the universe would otherwise drop.",
        detail:
          "Uses gravitationally bent light to photograph the past of distant worlds — first steps, last embraces, the exact hour a species decided to be kind.",
        openings: 8,
      },
      {
        name: "Festival Architect",
        blurb: "Designs celebrations that re-tune whole planets.",
        detail:
          "Every federation milestone deserves joy. Architects stage festivals where the infrastructure is happiness itself: light-rains, gratitude choirs, and the famous Milky Way potluck.",
        openings: 13,
      },
    ],
  },
  {
    id: "exploration-first-contact",
    title: "Exploration & First Contact",
    icon: "compass",
    description: "The gentle art of arriving well.",
    count: 76,
    professions: [
      {
        name: "First Contact Specialist",
        blurb: "Makes first hellos feel like remembered friendships.",
        detail:
          "Studies a species for years before saying a word — its art, humor, griefs and games. The first sentence is drafted a thousand times and always begins with respect.",
        openings: 10,
      },
      {
        name: "Xeno-Linguist of Tones",
        blurb: "Learns languages made of light, scent and pressure.",
        detail:
          "Grammar of bioluminescence, the tense-systems of whale-song, the politeness particles in magnetic fields. Linguists carry the federation's real diplomatic dictionary.",
        openings: 15,
      },
      {
        name: "Consent Protocol Officer",
        blurb: "Ensures no world is ever studied without invitation.",
        detail:
          "The conscience of every survey mission. Officers hold the veto that overrides curiosity itself, and file the quiet reports that keep the Prime Directive honest.",
        openings: 5,
      },
      {
        name: "Frontier Ecosystem Scout",
        blurb: "Walks new worlds before anyone sets a boot print.",
        detail:
          "Reads soil like scripture and weather like correspondence. Scouts decide — humbly, and with the ecosystem's consent — whether a world is ready for company.",
        openings: 17,
      },
      {
        name: "Contact Historian",
        blurb: "Records first meetings from both sides of the sky.",
        detail:
          "Interviews the visited as seriously as the visitors, because history is usually written by whoever had the better ships. Historians correct that, one testimony at a time.",
        openings: 6,
      },
      {
        name: "Ambassador of Small Beginnings",
        blurb: "Starts contact with gardens, games and shared meals.",
        detail:
          "Believes the fastest route to trust is a gift that asks nothing. Plants matching gardens on both worlds of a new pairing, then tends them by turn for a full season.",
        openings: 9,
      },
    ],
  },
  {
    id: "temple-ritual",
    title: "Temple, Ritual & Ceremony",
    icon: "flame",
    description: "Keeping the sacred calendar of a young galaxy.",
    count: 71,
    professions: [
      {
        name: "Density Transition Officiant",
        blurb: "Holds ceremony where one octave of being becomes another.",
        detail:
          "Officiates ascensions, descents and the rare sideways steps. Their liturgy is simple — you are held, you are known, you may go — and it works on entire planets at once.",
        openings: 8,
      },
      {
        name: "Grid Harmonics Cantor",
        blurb: "Sings the planetary grids into alignment at dawn.",
        detail:
          "Every ley line has a keynote and every dawn a variation. Cantors walk the nodes with bells and tuning stones, doing the planetary equivalent of watering the garden.",
        openings: 12,
      },
      {
        name: "Ceremonial Fire Keeper",
        blurb: "Tends flames that have not gone out in ten millennia.",
        detail:
          "Some fires are libraries. Keepers feed them stories, honey-colored light and the names of the recently brave, so the flame remembers who it warms.",
        openings: 5,
      },
      {
        name: "Rite Designer for New Species",
        blurb: "Composes coming-of-age ceremonies for civilizations inventing themselves.",
        detail:
          "A young species needs markers: first flight, first forgiveness, first contact. Designers tailor rites from local materials and the species' own dreams — never imported wholesale.",
        openings: 7,
      },
      {
        name: "Silence Warden",
        blurb: "Guards the quiet rooms where galaxies go to think.",
        detail:
          "Administers the acoustic architecture of sanctuaries, admitting visitors by the stillness they carry. The most sought-after appointment in the federation is the one that says nothing.",
        openings: 3,
      },
      {
        name: "Pilgrimage Path Keeper",
        blurb: "Maintains the walking routes between holy orbits.",
        detail:
          "Marks comet-trails and eclipse-season roads with waystones of light, arranges shelter for travelers between densities, and keeps the maps honest about how long wonder takes.",
        openings: 6,
      },
    ],
  },
];

export const professionTotal = professionDomains.reduce(
  (s, d) => s + d.count,
  0
);
