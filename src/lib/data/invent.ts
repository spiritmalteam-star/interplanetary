import type { ForgeDialOption } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  THE FORGE — the Invent book's interactive workshop · data layer    */
/*  The fourth book on the laboratory shelf, bound in molten copper.   */
/*  No reading rooms: the whole book is the workshop — a direct        */
/*  mirror chat specialized for invention, and the Mystery Chamber     */
/*  where a random creation is struck from the coals.                  */
/*  Every string is an i18n key (English source).                      */
/* ------------------------------------------------------------------ */

/* ---------------- the mystery chamber dials ---------------- */

/** What family of making the Forge reaches into. */
export const forgeDomains: ForgeDialOption[] = [
  { id: "device", label: "Device", emoji: "⚙️", hint: "A thing with parts that move or hold" },
  { id: "remedy", label: "Remedy", emoji: "🌿", hint: "A preparation or practice that eases" },
  { id: "instrument", label: "Instrument", emoji: "🔭", hint: "A thing that measures or reveals" },
  { id: "structure", label: "Structure", emoji: "🏛️", hint: "A thing that stands or shelters" },
  { id: "signal", label: "Signal", emoji: "📡", hint: "A thing that sends or translates" },
  { id: "plaything", label: "Plaything", emoji: "🪁", hint: "A thing whose purpose is wonder" },
];

/** How much world the creation takes up. */
export const forgeScales: ForgeDialOption[] = [
  { id: "pocket", label: "Pocket", emoji: "🤲", hint: "Small enough to hold in one hand" },
  { id: "room", label: "Room", emoji: "🪑", hint: "The size of furniture, living with a room" },
  { id: "world", label: "World", emoji: "🌍", hint: "For streets, gardens and wider" },
];

/** The energy the creation drinks from. */
export const forgeSparks: ForgeDialOption[] = [
  { id: "sun", label: "Sun", emoji: "☀️", hint: "It drinks sunlight" },
  { id: "water", label: "Water", emoji: "💧", hint: "It is moved or shaped by water" },
  { id: "sound", label: "Sound", emoji: "🔔", hint: "It works through sound and vibration" },
  { id: "star", label: "Star", emoji: "✨", hint: "It belongs to the night sky" },
  { id: "earth", label: "Earth", emoji: "🪨", hint: "It is fed by soil, clay or stone" },
  { id: "breath", label: "Breath", emoji: "🌬️", hint: "It lives on the breath" },
];

/* ---------------- the strike — forging animation phases ---------------- */

/** Cycled while the Mystery Chamber works. */
export const forgePhases: string[] = [
  "Opening the coals…",
  "Drawing three embers…",
  "Folding the light…",
  "Quenching the name…",
];

/** Cycled while the Forge composes a chat answer. */
export const forgeChatPhases: string[] = [
  "Stoking the coals…",
  "Weighing the parts…",
  "Finding the first stroke…",
];

/* ---------------- the sparks — clickable openers for the chat ---------------- */

/** One tap speaks the whole line to the Forge. */
export const forgeSuggestions: string[] = [
  "What wants to be invented through me?",
  "I have a half-formed idea — help me shape it",
  "Sketch a small device that makes a balcony feel like a forest",
  "I am stuck — break my invention into a first stroke",
  "What could I make from what my kitchen already holds?",
  "Speak of the difference between a gadget and a companion",
];
