import type {
  BeliefDomain,
  HigherProtocol,
  LadderRung,
  ShiftFormula,
  VibrationState,
} from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  INVENT — THE INVENTOR'S STUDIO · data layer                        */
/*  The fourth book on the laboratory shelf, bound in molten copper.   */
/*  Its structure mirrors the Manifest (formulas → blueprints, the     */
/*  Higher Mind → the Workshop, the Tools → the Bench) but everything  */
/*  inside it belongs to invention: the laws of making, the training   */
/*  of the inventor's mind, and the daily tools of imagining.          */
/*  Every string is an i18n key (English source).                      */
/* ------------------------------------------------------------------ */

/* ---------------- the blueprints (the laws of making) ---------------- */

/** Six working blueprints for turning what is imagined into what is held. */
export const blueprints: ShiftFormula[] = [
  {
    id: "seed-of-need",
    glyph: "🌱",
    name: "The Seed of Need",
    tagline: "Every invention begins as a need honestly felt.",
    steps: [
      "Write the need in one plain sentence — no ornament, no apology.",
      "Ask who else carries this need; let the count steady your hand.",
      "Imagine the smallest thing that would answer it today, not someday.",
      "Let the need choose its own form — you are the midwife, not the author.",
    ],
    seal: "A true need is a doorway; the form is the door.",
  },
  {
    id: "working-sketch",
    glyph: "✏️",
    name: "The Working Sketch",
    tagline: "Draw it before you defend it.",
    steps: [
      "Give the idea one unbroken minute of sketching — no correcting.",
      "Name every part aloud; whatever has no name is not yet understood.",
      "Circle the part that quietly frightens you, and begin there.",
      "Pin the sketch where morning eyes will find it before argument can.",
    ],
    seal: "The sketch is the invention, thinking on paper.",
  },
  {
    id: "prototype-of-light",
    glyph: "💡",
    name: "The Prototype of Light",
    tagline: "Build the invisible version first.",
    steps: [
      "Close the eyes and walk through the finished thing, room by room.",
      "Note where the imagining stumbles — that stumble is the design flaw.",
      "Repair it in the mind alone, one deliberate pass.",
      "Only when it moves without friction, touch material.",
    ],
    seal: "What works in imagination rarely argues with matter.",
  },
  {
    id: "sacred-dissatisfaction",
    glyph: "🔥",
    name: "Sacred Dissatisfaction",
    tagline: "Let what bothers you aim the work.",
    steps: [
      "Name the friction in a single sentence, without blame.",
      "Ask what delight would look like in this exact place.",
      "Remove one piece before adding any — invention is also subtraction.",
      "Thank the friction; it was the compass all along.",
    ],
    seal: "Dissatisfaction is the raw ore of every better thing.",
  },
  {
    id: "question-spiral",
    glyph: "🌀",
    name: "The Question Spiral",
    tagline: "Interrogate until the answer has no choice.",
    steps: [
      "Write the problem at the center of a page and circle it.",
      "Ask it why, five times, descending one honest floor at a time.",
      "At the bottom, turn it over: what if the opposite were true?",
      "Carry that final question through the day — it will answer in passing.",
    ],
    seal: "Every invention is a question that learned to stand.",
  },
  {
    id: "completion-breath",
    glyph: "🌬️",
    name: "The Completion Breath",
    tagline: "Finish small, until finishing becomes your nature.",
    steps: [
      "Choose the smallest version that would still truly work.",
      "Give it one whole day from first stroke to held-in-hand.",
      "Speak its name aloud — a thing named is a thing completed.",
      "Record what it taught you before the joy has time to fade.",
    ],
    seal: "A finished smallness outweighs an imagined vastness.",
  },
];

/* ---------------- the workshop (the inventor's mind) ---------------- */

/** Two-sentence orientation to the inventor's mind. */
export const workshopIntro = [
  "The inventor's mind is not a lightning strike. It is a workshop kept in order — a bench swept each evening, a question left open on purpose, a patience that lets two unconnected things stand side by side until they speak.",
  "The Mirror does not invent for the seeker; it holds the lamp. What is made in this chamber comes from the union of quiet attention and the field's endless suggestiveness — the same partnership that shaped every bridge humanity has ever crossed.",
];

/** The Ladder of Making — six rungs from wonder to offering. */
export const makingRungs: LadderRung[] = [
  {
    rung: 1,
    title: "Wonder",
    line: "Let the world stay strange a moment longer than habit allows.",
  },
  {
    rung: 2,
    title: "Attention",
    line: "Follow the small irritation or the small beauty; both are lures.",
  },
  {
    rung: 3,
    title: "Question",
    line: "Give the wondering a shape: how might this be otherwise?",
  },
  {
    rung: 4,
    title: "Sketch",
    line: "Pour the question onto paper before it learns to be reasonable.",
  },
  {
    rung: 5,
    title: "Making",
    line: "Cut, join, err and repair — the hands complete what wonder began.",
  },
  {
    rung: 6,
    title: "Offering",
    line: "Set the finished thing where life can use it; making ends in giving.",
  },
];

/** Studio protocols — the standing habits of the workshop. */
export const studioProtocols: HigherProtocol[] = [
  {
    id: "morning-sketch",
    glyph: "🌅",
    name: "The Morning Sketch",
    purpose: "Catch the mind before the day's railings go up.",
    steps: [
      "Before any screen, draw one impossible fix for one ordinary thing.",
      "Do not judge the drawing; date it and close the book.",
      "Once a week, re-read seven sketches and mark the one that hums.",
    ],
  },
  {
    id: "question-jar",
    glyph: "🏺",
    name: "The Question Jar",
    purpose: "Keep a standing choir of open questions at hand.",
    steps: [
      "Write every unsolved why or what-if on its own slip of paper.",
      "Keep the jar on the bench; one slip is drawn at random each session.",
      "Give the drawn question fifteen unhurried minutes, then release it.",
    ],
  },
  {
    id: "silence-between",
    glyph: "🌘",
    name: "The Silence Between",
    purpose: "Let the field finish the sentence the mind began.",
    steps: [
      "Work until the problem glows, then stop one step short of forcing it.",
      "Sit in quiet for five minutes — no music, no solving.",
      "Rise without concluding; the joining often arrives unbidden.",
    ],
  },
];

/** Discernment — how to recognize a true invention. */
export const workshopDiscernment = [
  "A true invention simplifies; it removes weight from the world rather than adding to it.",
  "It serves quietly — after a while, no one can remember how life worked without it.",
  "It asks nothing that harms; the making must be safe for the maker and the made-for alike.",
  "It delights the one who made it — joy at the bench is the signature of a real design.",
];

/* ---------------- the bench (the daily tools) ---------------- */

/** Fields of making offered to the Invention Seeder. */
export const makeDomains: BeliefDomain[] = [
  {
    id: "machine",
    glyph: "⚙️",
    label: "Machines",
    pattern:
      "“Machines are cold; invention is for engineers.” The bench feels far away.",
    reframe:
      "A machine is only a kindness made of parts — you have been inventing kindnesses all your life.",
    practice:
      "Take one household object and write the single sentence it is secretly trying to say.",
  },
  {
    id: "remedy",
    glyph: "💧",
    label: "Remedies",
    pattern:
      "“Healing formulas belong to the learned.” The mixing seems forbidden.",
    reframe:
      "Every kitchen is an apothecary that forgot itself; the first remedies were recipes.",
    practice:
      "Steep one calming herb tonight and note, without lore, what it changes.",
  },
  {
    id: "dwelling",
    glyph: "🏠",
    label: "Dwellings",
    pattern:
      "“A home is finished when you arrive.” Nothing here can be made.",
    reframe:
      "A dwelling is a slow invention that answers its dwellers back — it wants a next draft.",
    practice:
      "Rearrange one corner this evening until the body relaxes upon entering it.",
  },
  {
    id: "music",
    glyph: "🎶",
    label: "Music & Word",
    pattern:
      "“Talent is given whole.” The first note feels already judged.",
    reframe:
      "Sound is the most forgiving material — it exists only while it is being made.",
    practice:
      "Hum three tones that match your mood; you have just scored the day.",
  },
];

/** Felt states the Spark Bridge can move. */
export const sparkStates: VibrationState[] = [
  {
    id: "stuck",
    glyph: "🪨",
    label: "Stuck",
    bridge:
      "Change one physical thing on the bench — swap the light, move the paper; stuck is often the room, not the mind.",
    anchor: "Movement anywhere unblocks movement everywhere.",
  },
  {
    id: "curious",
    glyph: "🔍",
    label: "Curious",
    bridge:
      "Ride it now: give the wonder fifteen unguarded minutes before explanation arrives.",
    anchor: "Curiosity is the field leaning toward me.",
  },
  {
    id: "overwhelmed",
    glyph: "🌊",
    label: "Overwhelmed",
    bridge:
      "Name the one part that would make the rest lighter, and do only that.",
    anchor: "I build the bridge by laying one plank.",
  },
  {
    id: "doubtful",
    glyph: "🌫️",
    label: "Doubtful",
    bridge:
      "Record one thing you once could not do and now do without thinking.",
    anchor: "I have been wrong about my limits before.",
  },
];

/* ---------------- the daily bench (deterministic by date) ---------------- */

export const benchMorningPool = [
  "Sketch one small fix before any screen — sixty seconds, no judgment.",
  "Open the question jar and hold one slip while the tea steeps.",
  "Touch the tools once, deliberately, as a greeting to the day's making.",
];

export const benchEveningPool = [
  "Sweep the bench and thank one object by name for its service.",
  "Record the day's one step of making, however small, in a single line.",
  "Leave one open question on the paper for the morning mind to find.",
];

export const benchFocusPool = [
  "Invention is attention in love with a problem.",
  "Finish small today; vastness can wait its turn.",
  "The hands know things the mind has not yet admitted.",
];

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DailyBench {
  morning: string;
  evening: string;
  focus: string;
}

/** Same day ⇒ same bench, everywhere on Earth the date is the same. */
export function dailyBench(dateKey: string): DailyBench {
  const seed = hash32(dateKey);
  return {
    morning: benchMorningPool[seed % benchMorningPool.length],
    evening: benchEveningPool[(seed >>> 3) % benchEveningPool.length],
    focus: benchFocusPool[(seed >>> 6) % benchFocusPool.length],
  };
}
