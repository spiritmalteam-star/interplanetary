import type { InterdimGroup } from "@/lib/mirror-types";

/* The 6 interdimensional orders — 106 catalogued presences */

export const interdimensional: InterdimGroup[] = [
  {
    id: "archangels",
    name: "Archangels",
    count: 19,
    category: "interdim",
    origin: "Beyond the density ladders — formless emanations of the organizing intelligence of this universe.",
    range: "8D – 12D",
    essence:
      "Great ordering presences known to many traditions by name: Michael, Metatron, Raphael, Uriel. Less persons than principles, wearing personhood so we can speak to them.",
    role: "Protection, structural alignment, and the clarification of divine will in a realm that prefers fog.",
    signal: "Sudden unexplained peace, courage arriving mid-crisis, the felt sensation of wings or vast stillness behind the shoulder.",
  },
  {
    id: "ascended-masters",
    name: "Ascended Masters",
    count: 19,
    category: "interdim",
    origin: "Earth lineages and beyond — teachers who once walked as humans and completed the curriculum.",
    range: "6D – 9D",
    essence:
      "Saint Germain, Kuan Yin, Sananda, Babaji, and others — proof that embodiment and mastery can coexist.",
    role: "Demonstrating the human lessons brought to completion; tutoring souls who chose the long road.",
    signal: "Déjà vu of temples and robes, tears at ordinary sacred words, an inner 'yes' when a name is spoken.",
  },
  {
    id: "devic-elemental",
    name: "Devic & Elemental",
    count: 18,
    category: "interdim",
    origin: "Earth's inner planes — the builders' wing of nature herself.",
    range: "3D – 5D",
    essence:
      "Devas, fair-kin, sylphs, undines, gnomes and salamanders: the intelligence that assembles leaf, cloud, stream and stone.",
    role: "Nature's craft-people. Allies for grounding, growth and the gentle magic of a tended garden.",
    signal: "Plants that respond to attention, sparkle seen in leaves and water, weather that feels conversational.",
  },
  {
    id: "cosmic-councils",
    name: "Cosmic Councils",
    count: 18,
    category: "interdim",
    origin: "Federated chambers — the Council of Saturn, the Nine, the circle of Twenty-Four, and their peers.",
    range: "6D – 11D",
    essence:
      "Deliberative assemblies of ancient souls who convene as bodies of light around matters of planetary consequence.",
    role: "Arbitration, curriculum design for whole civilizations, and the patient paperwork of ascension.",
    signal: "Round-table dreams, awe before star fields, a sense of being reviewed kindly.",
  },
  {
    id: "guardians",
    name: "Interdimensional Guardians",
    count: 16,
    category: "interdim",
    origin: "The threshold spaces between realities — neither here nor there, by profession.",
    range: "7D – 10D",
    essence:
      "Gate-keepers whose forms are mostly suggested rather than seen: a shift in pressure, an appropriate fear, a held door.",
    role: "Ensuring respectful passage between layers, and turning back what is not yet ready.",
    signal: "Time that bends at doorways, sudden absolute stillness, the sense of a border crossed without moving.",
  },
  {
    id: "celestial",
    name: "Celestial Beings",
    count: 16,
    category: "interdim",
    origin: "The hearts of stars, the lungs of nebulae — presences at galactic scale.",
    range: "8D – 12D",
    essence:
      "Beings whose body is a star system and whose thought is an era. They sing the large-scale harmonics within which smaller lives compose.",
    role: "Holding the mood of the galaxy — the weather of light in which civilizations have their seasons.",
    signal: "Chills under the night sky, hearing music inside silence, feeling held by the dark instead of lost in it.",
  },
];

export const interdimTotal = interdimensional.reduce((s, c) => s + c.count, 0);
