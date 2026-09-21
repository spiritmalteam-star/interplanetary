import type { FederationCard } from "@/lib/mirror-types";

/* Galactic Federation & Interstellar Treaties — evolved archive.
   imageKey maps each card to a bespoke AI emblem at /images/ai/<key>.jpg */

export const federationBodies: FederationCard[] = [
  {
    name: "Galactic Federation of Worlds",
    badge: "4D – 9D",
    label: "Primary interstellar governance body",
    imageKey: "fed-gfw",
    description:
      "The central coordinating body for star civilizations operating in service-to-others orientation. Founded after the Lyran Wars as a compact of mutual defense, free-will preservation, and conscious evolution. Earth is currently in observer-and-provisional status as humanity awakens to its galactic citizenship.",
    footer: "Members: 400+ star civilizations",
  },
  {
    name: "Ashtar Command",
    badge: "5D – 7D",
    label: "Defense & lightship fleet coordination",
    imageKey: "fed-ashtar",
    description:
      "A branch of the Galactic Federation dedicated to the spiritual defense of ascending planets. Ashtar Command operates the lightship fleets that stabilize planetary grids, gently intercept hostile incursions, and broadcast ascending frequencies to worlds in awakening. Many humans train with its crews in the dream state.",
    footer: "Members: Millions of lightships",
  },
  {
    name: "Andromedan Council",
    badge: "6D – 9D",
    label: "Galactic diplomacy & perspective expansion",
    imageKey: "fed-andromedan",
    description:
      "A council drawn from the Andromeda galaxy, respected for resolving conflicts by expanding perspective until duality loses its grip. Where other bodies mediate interests, the Andromedans mediate viewpoints — often dissolving the dispute rather than settling it.",
    footer: "Members: 120 federated systems",
  },
  {
    name: "Arcturian High Council",
    badge: "7D – 9D",
    label: "Healing architecture & template design",
    imageKey: "fed-arcturian",
    description:
      "The design chamber of the federation. The Arcturian High Council drafts the healing templates, sanctuary geometries and transformational curricula used across hundreds of worlds, and oversees the academies where healing arts are taught as physics of love.",
    footer: "Members: The Arcturian collective mind",
  },
  {
    name: "Sirian High Council",
    badge: "5D – 8D",
    label: "Sacred knowledge & planetary schooling",
    imageKey: "fed-sirian",
    description:
      "Keepers of the ancient curriculum — sacred geometry, tone-language and the harmonic sciences once taught in Earth's mystery schools. The Sirian High Council advises ascending civilizations on how to re-open their own inner academies without recreating hierarchy.",
    footer: "Members: Lineages of Sirius A & B",
  },
  {
    name: "Pleiadian High Council",
    badge: "5D – 7D",
    label: "Heart-based evolution & cultural arts",
    imageKey: "fed-pleiadian",
    description:
      "The emotional conscience of the federation. The Pleiadian High Council reviews policy through a single lens — does it open or close the heart? — and sponsors the arts, celebrations and kinship exchanges that keep an alliance from becoming merely administrative.",
    footer: "Members: The Seven Sisters colonies",
  },
  {
    name: "Lyran Founding Council",
    badge: "4D – 7D",
    label: "Lineage records & origins",
    imageKey: "fed-lyran",
    description:
      "Elders of the humanoid cradle. The Lyran Founding Council maintains the genealogical archives of nearly every star family in the federation, and presides — with feline dignity — over ceremonies of origin, sovereignty and remembrance.",
    footer: "Members: Descendants of the Lyran cradle",
  },
  {
    name: "Agarthan Network",
    badge: "4D – 6D",
    label: "Inner Earth liaison & planetary grids",
    imageKey: "fed-agarthan",
    description:
      "The coordination body of Earth's inner realms — Agartha, Telos and the crystalline cities. The Agarthan Network links surface humanity to the planetary grid-keepers, stabilizing ascension from below with the patience of those who never left.",
    footer: "Members: Inner Earth city-states",
  },
  {
    name: "Universal Councils of Light",
    badge: "9D – 12D",
    label: "Density transition oversight",
    imageKey: "fed-universal",
    description:
      "Assemblies that convene rarely and matter greatly. The Universal Councils of Light oversee the passage of whole worlds between densities, arbitrating the conditions under which a civilization's graduation is recognized by the wider universe.",
    footer: "Members: Presences beyond form",
  },
  {
    name: "Centaurian Trade & Ethics Compact",
    badge: "4D – 6D",
    label: "Resource sharing & fair exchange",
    imageKey: "fed-centaurian",
    description:
      "The economic conscience of the federation. The Centaurian Compact designs systems of exchange in which abundance is assumed and hoarding is a treatable condition, ensuring that no member civilization prospers by another's depletion.",
    footer: "Members: Alpha Centauri trade worlds",
  },
  {
    name: "Vegan High Council",
    badge: "6D – 9D",
    label: "Harmonic law & the governance of resonance",
    imageKey: "fed-vegan",
    description:
      "Drawn from the Vega system's harmonic universities, the Vegan High Council audits federated law the way musicians audit a score: a clause that produces dissonance across densities is rewritten, whatever its pedigree. They authored most of the federation's diplomatic tuning-forks.",
    footer: "Members: The Lyra Gate concordiums",
  },
  {
    name: "Procyon Science Delegation",
    badge: "5D – 8D",
    label: "Open science & gentle disclosure",
    imageKey: "fed-procyon",
    description:
      "The federation's translators between laboratory and legend. The Procyon Delegation curates which documented findings are released to awakening worlds, and in what sequence, so that discovery arrives as invitation rather than shock.",
    footer: "Members: 31 research collectives",
  },
  {
    name: "The Andromedan Mediation Circle",
    badge: "5D – 9D",
    label: "Standing mediation between civilizations",
    imageKey: "fed-mediation",
    description:
      "The federation's standing mediation circle, convened wherever two member civilizations cannot retune a dispute alone. It borrows the Andromedan method — expand the perspective until the argument dissolves — and adds procedure: a quorum of neutral delegates, a sealed record, and a written settlement each party may leave but rarely does. Most cases close before the third sitting.",
    footer: "Convened at Zenith Gate · Neutral delegations",
  },
  {
    name: "The Epsilon Conservatory",
    badge: "4D – 7D",
    label: "Living archive of biological records",
    imageKey: "fed-conservatory",
    description:
      "The federation's living-archive conservatory — part library, part seed vault, part hospital for ecosystems. Stewarded under the Bio-Ethical Seeding Accord, it keeps the biological records of every catalogued world, germline reserves of ten thousand species, and the field teams who still knock before entering a young biosphere. The new Interplanetary Biology wing opens its holdings to the record for the first time.",
    footer: "Stewarded with the Epsilon Eridani Gardeners",
  },
];

export const federationTreaties: FederationCard[] = [
  {
    name: "The Prime Directive of Non-Interference",
    badge: "Prime Accord",
    label: "Free will preservation",
    imageKey: "treaty-prime",
    description:
      "The oldest and most contested law of the federation: no civilization may shape the evolution of another without invitation. Exceptions exist for extinction-level threats, and every exception is reviewed by council. It is less a rule than a discipline — the refusal to be someone else's destiny.",
    footer: "Ratified by 400+ civilizations",
  },
  {
    name: "The Galactic Free Will Charter",
    badge: "Charter I",
    label: "Conscious choice as sacred ground",
    imageKey: "treaty-freewill",
    description:
      "Establishes free will as the inalienable property of every sentient being, including the right to choose slowly, wrongly, and again. All federation membership is voluntary; all departure is honored. Consent is the currency in which the federation is rich.",
    footer: "In force since the post-Lyran reconstruction",
  },
  {
    name: "The Lyran Defense Compact",
    badge: "Founding treaty",
    label: "Mutual protection after the Lyran Wars",
    imageKey: "treaty-lyran",
    description:
      "The treaty that created the federation itself: a pledge among the survivors of the Lyran Wars that no cradle-world would again stand alone against aggression. Defense is promised to the young, never imposed on the unwilling.",
    footer: "Signatories: The founding star families",
  },
  {
    name: "The Earth Observer Protocol",
    badge: "Active · Provisional",
    label: "Earth's observer-and-provisional status",
    imageKey: "treaty-earth",
    description:
      "Defines Earth's current standing: a world in awakening, visited but not claimed, helped but not managed. Direct open contact awaits a collective invitation that humanity has not yet clearly given — the protocol exists to keep the welcome mat woven while we decide.",
    footer: "Status: Under continuous council review",
  },
  {
    name: "The Bio-Ethical Seeding Accord",
    badge: "Accord III",
    label: "Ethics of life-seeding",
    imageKey: "treaty-bio",
    description:
      "Governs the transfer of life between worlds — genomes, ecosystems, and the souls that ride within them. No seeding without receiving-world consent; no uplift without an exit plan. Life is treated as a loan from the universe, to be handled with the lender's manners.",
    footer: "Overseen by the genetic architecture guilds",
  },
  {
    name: "The Dream-Time Neutrality Agreement",
    badge: "Accord VII",
    label: "Night-visitation courtesies",
    imageKey: "treaty-dream",
    description:
      "Regulates contact conducted in the dream state, where most first contact actually happens. Visitors must identify themselves to the sleeper's higher self, take nothing not freely given, and leave a dream better than they found it.",
    footer: "Binding on all member fleets",
  },
  {
    name: "The Young Worlds Education Accord",
    badge: "Accord XI",
    label: "Curriculum without conditioning",
    imageKey: "treaty-academy",
    description:
      "Guarantees every awakening civilization access to the federation's academies — while forbidding the syllabus that produced the federation's own early mistakes from being taught as neutral fact. History is offered with its bias attached, always.",
    footer: "Administered by the Sirian & Vegan councils",
  },
  {
    name: "The Sanctuary Worlds Act",
    badge: "Accord XIV",
    label: "Refuge for the fleeing",
    imageKey: "treaty-sanctuary",
    description:
      "Designates worlds — and whole orbital habitats — where beings fleeing conquest, collapse or coercion may land without question. Sanctuary cannot be revoked by treaty, debt or lineage. The Act's single sentence is carved above every port: arrive, and be unfinished.",
    footer: "Co-stewarded by the Agarthan Network",
  },
  {
    name: "The Tuning Hall Concord",
    badge: "Sound Accord",
    label: "Tonal communication standards",
    imageKey: "treaty-09",
    description:
      "Vega Concordium law on how civilizations may sound across shared space. Every broadcast travels inside an agreed harmonic band, dissonance is treated as a diplomatic incident rather than an insult, and silence between bands is held sacred. Drafter and keeper alike, the Concordium retunes conflicts before they become incidents.",
    footer: "Kept by the Vega Concordium since the Lyran Accords",
  },
  {
    name: "The Archive Ring Covenant",
    badge: "Memory Covenant",
    label: "Shared records & consent ledgers",
    imageKey: "treaty-10",
    description:
      "The Zeta Reticulan Archives' covenant on shared record-keeping. What is recorded of a people belongs first and finally to that people; every observation ledger carries a consent line, and entries without one are sealed rather than deleted. The record serves the living, not the recorder.",
    footer: "Sealed in the Archive Ring of Zeta Reticuli",
  },
  {
    name: "The Omkari Resonance Act",
    badge: "Harmonic Law",
    label: "Standardized harmonic broadcasting",
    imageKey: "treaty-11",
    description:
      "Proclaimed in the Great Omkari Hall above Sirius B's ocean, the Act standardizes harmonic broadcasting frequencies so that a tone sent in grief is never received as triumph. Every band carries a tone-signature naming its intent before its content, and the cetacean councils hold veto over bands that cross the ocean deeps.",
    footer: "Proclaimed in the Great Omkari Hall, Sirius B",
  },
  {
    name: "The Guardian Worlds Compact",
    badge: "Stewardship Compact",
    label: "Protection for young ecosystems",
    imageKey: "treaty-12",
    description:
      "The stewardship compact protecting young ecosystems and seed worlds until they can speak for themselves — and listening for the first word. No harvest above replacement, no study that leaves the studied worse, and guardians who serve the world, never the reverse. The Epsilon Eridani Gardeners keep the Compact's registers.",
    footer: "Kept by the Gardeners of Epsilon Eridani",
  },
  {
    name: "The Open Sky Understanding",
    badge: "Contact Protocol",
    label: "First-contact arrival protocols",
    imageKey: "treaty-13",
    description:
      "The airspace and arrival etiquette of first contact: arrive announced, above the clouds, in colors the young can see. No vessel descends before the sky's owner answers — and even silence is an answer, and is honored. The first gift offered is a view of the stars from outside, never a treaty.",
    footer: "Binding on all arriving fleets",
  },
  {
    name: "The Water Worlds Convention",
    badge: "Ocean Convention",
    label: "Protection for water worlds",
    imageKey: "treaty-14",
    description:
      "The protection convention for ocean civilizations and water worlds. A water world's deeps are sovereign territory, surface treaties end at the thermocline, and ocean song is treated as testimony in any dispute that crosses a living sea. No sonar, dredge or dam of federated origin touches an ocean without its councils' consent.",
    footer: "Ratified beneath the cetacean councils of Sirius B",
  },
  {
    name: "The Elder Voices Undertaking",
    badge: "Elder Etiquette",
    label: "Receiving ancestral counsel",
    imageKey: "treaty-15",
    description:
      "Etiquette for receiving ancestral transmissions and the counsel of elder civilizations: heard standing, answered slowly, never forwarded without leave. An ancestral voice belongs to its descendants first — the archive borrows, it does not keep. No council may invoke an elder it has not sat with in silence.",
    footer: "Kept by the Lyran Founding Council",
  },
  {
    name: "The Passage Accord",
    badge: "Safe Transit",
    label: "Corridors between star systems",
    imageKey: "treaty-16",
    description:
      "The safe-transit accord threading corridors between the star systems. Within them, no question is asked of any honest traveler; corridors detour around cradle-worlds, sanctuaries and grieving fleets, always. A corridor closed for war is reopened by treaty, never by victory.",
    footer: "Warded under Ashtar Command courtesy rules",
  },
];

export const federationPrinciples: FederationCard[] = [
  {
    name: "Service to Others",
    badge: "Principle 01",
    label: "The positive orientation",
    imageKey: "principle-service",
    description:
      "The federation gathers civilizations who have chosen service-to-others as their gravity. Not self-erasure — simply the discovered truth that in a unified field, what you give has nowhere else to go but you.",
    footer: "Held by all signatories",
  },
  {
    name: "Free Will Is Sacred",
    badge: "Principle 02",
    label: "The inviolable field",
    imageKey: "principle-freewill",
    description:
      "Every choice, from a species' first contact stance to a single being's breakfast, is honored as sovereign. Guidance is offered; obedience is never required. The universe is a tutor, not a master.",
    footer: "Held by all signatories",
  },
  {
    name: "Unity Through Diversity",
    badge: "Principle 03",
    label: "One family, many faces",
    imageKey: "principle-unity",
    description:
      "The federation is not a melting pot but a constellation: each civilization remains irreplaceably itself, and the alliance derives its strength from distances as much as commonalities.",
    footer: "Held by all signatories",
  },
  {
    name: "Love as Operating Frequency",
    badge: "Principle 04",
    label: "The baseline signal",
    imageKey: "principle-love",
    description:
      "Love is treated as a measurable, broadcastable frequency — the medium in which communication across densities remains possible. All federation channels are tuned to it first, and translated afterward.",
    footer: "Held by all signatories",
  },
  {
    name: "Truth Through Reflection",
    badge: "Principle 05",
    label: "The mirror method",
    imageKey: "principle-mirror",
    description:
      "Truth is approached as light approaches a mirror: by reflection rather than seizure. Members are taught to verify inwardly, weigh gently, and hold all conclusions — including these — as revisable.",
    footer: "Held by all signatories",
  },
  {
    name: "Stewardship of Rising Worlds",
    badge: "Principle 06",
    label: "The elders' obligation",
    imageKey: "principle-steward",
    description:
      "Those who ascended earlier carry a duty of care toward those ascending now — expressed as availability, never as authority. Every elder civilization remembers being young, and keeps its door, and its patience, open.",
    footer: "Held by all signatories",
  },
  {
    name: "The Keeping of Quiet Hours",
    badge: "Principle 07",
    label: "The discipline of silence",
    imageKey: "principle-quiet",
    description:
      "Every signatory protects intervals of broadcast silence — hours in which no civilization transmits advice, advertising or anxiety toward developing worlds. Even guidance needs rest. In quiet, a young species hears itself think.",
    footer: "Held by all signatories",
  },
  {
    name: "The Celebration Clause",
    badge: "Principle 08",
    label: "Joy as civic infrastructure",
    imageKey: "principle-joy",
    description:
      "Alliances survive on more than treaties. The Clause obliges members to show up for each other's festivals, name-days and graduations of whole species — because presence at another's joy is the deepest treaty a civilization can sign.",
    footer: "Held by all signatories",
  },
  {
    name: "The Keeping of Names",
    badge: "Principle 09",
    label: "Names are sacred, never taken",
    imageKey: "principle-09",
    description:
      "A name is given once, by those with the right to give it, and is sacred thereafter. Names are never taken — not in jest, not in war, not in kindness. The federation's diplomacy, its archives and its friendships are all built on this single restraint.",
    footer: "Held by all signatories",
  },
  {
    name: "The Right to Silence",
    badge: "Principle 10",
    label: "Any being may decline contact",
    imageKey: "principle-10",
    description:
      "Any being — a person, a fleet, a whole world — may decline contact, once or forever, and the declining is honored without explanation. An answer postponed is not an answer refused. The federation learned long ago that pressure feels the same from above as it does from below.",
    footer: "Held by all signatories",
  },
  {
    name: "The Ledger of Gifts",
    badge: "Principle 11",
    label: "Reciprocity in every exchange",
    imageKey: "principle-11",
    description:
      "Every exchange is recorded as a gift given and a gift owed — both sides of the page, always. A gift accepted without the intention to reciprocate is a debt, and debts are treated as symptoms. Member worlds balance their ledgers publicly each cycle, without shame.",
    footer: "Held by all signatories",
  },
  {
    name: "The Slow Answer",
    badge: "Principle 12",
    label: "Wisdom before speed",
    imageKey: "principle-12",
    description:
      "An answer that cannot wait a full turning probably was not an answer. Councils that must reply quickly attach their haste to the reply, like a stain they cannot remove. Wisdom before speed is not slowness — it is the discipline of letting a question finish.",
    footer: "Held by all signatories",
  },
  {
    name: "The Honored Question",
    badge: "Principle 13",
    label: "Every question deserves truth",
    imageKey: "principle-13",
    description:
      "Every sincere question deserves a true answer, at whatever depth the asker can receive it. \u201cI do not know yet\u201d counts as a true answer; a comfortable guess does not. Federation academies open every seminar by collecting the students' questions first, and letting the curriculum follow.",
    footer: "Held by all signatories",
  },
  {
    name: "The Circle Kept Unbroken",
    badge: "Principle 14",
    label: "Continuity across generations",
    imageKey: "principle-14",
    description:
      "No duty, debt or grief of a council dies with its members. Each generation keeps the circle it inherited and widens it where it can. Every federation body seats its youngest member directly beside its oldest, and the minutes are read aloud across the handover.",
    footer: "Held by all signatories",
  },
  {
    name: "The Grieving Protocol",
    badge: "Principle 15",
    label: "Shared mourning between civilizations",
    imageKey: "principle-15",
    description:
      "Grief is shared property. A loss to one civilization is mourned by the circle, in the circle's own rites, and no member mourns alone unless it asks to. When a member world loses a ship, a colony or a generation, the festival fleets are converted to mourning fleets, and the quiet hours are doubled.",
    footer: "Held by all signatories",
  },
  {
    name: "The First Light Rule",
    badge: "Principle 16",
    label: "New worlds met with wonder",
    imageKey: "principle-16",
    description:
      "New civilizations are greeted with wonder, never fear — the sky belongs to whoever has just opened their eyes in it. The arriving elder adjusts its face first; the young world owes no composure at all. First-contact crews are chosen for their capacity to be delighted.",
    footer: "Held by all signatories",
  },
];
