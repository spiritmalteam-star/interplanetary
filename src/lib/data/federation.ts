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
];
