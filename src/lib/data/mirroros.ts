import type {
  BeliefDomain,
  HigherProtocol,
  LadderRung,
  ShiftFormula,
  VibrationState,
} from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  MIRROR OS — REALITY GUIDANCE · data layer                          */
/*  A fully independent guidance system: six shift formulas, the       */
/*  Higher Mind ladder + protocols, and a toolkit for refining         */
/*  manifestation. Every string is an i18n key (English source).       */
/* ------------------------------------------------------------------ */

/** Six complete formulas for shifting the lived reality-line. */
export const shiftFormulas: ShiftFormula[] = [
  {
    id: "mirror",
    glyph: "🪞",
    name: "The Mirror Formula",
    tagline: "Observe what is, read its reflection, recalibrate one degree.",
    steps: [
      "Write the situation plainly — facts only, no story yet.",
      "Ask the mirror: what is this scene reflecting back about my signal?",
      "Choose one small counter-move — a thought, a word, a single act.",
      "Perform it once today, then thank the mirror for the reading.",
    ],
    seal: "I see the reflection, and I choose the signal.",
  },
  {
    id: "assumption",
    glyph: "🌙",
    name: "The Assumption Formula",
    tagline:
      "Rest in the state of the wish fulfilled until it hardens into fact.",
    steps: [
      "Distill the desire into one short, present-tense sentence.",
      "As the body drifts toward sleep, replay one scene that implies it is already true.",
      "Loop the scene slowly, clothed in feeling — touch it, hear it, live in it.",
      "Rise without checking the evidence; let the state carry the day.",
    ],
    seal: "It is done, and I rest in its completion.",
  },
  {
    id: "two-glass",
    glyph: "🥂",
    name: "The Two-Glass Shift",
    tagline:
      "A physical ritual for crossing from one reality-line to another.",
    steps: [
      "Fill two glasses. Name the first “the line I am leaving.”",
      "Name the second “the line I choose,” and speak its qualities aloud.",
      "Drink the first fully, honoring what that line taught you.",
      "Drink the second slowly, feeling the chosen line arrive.",
    ],
    seal: "I drink from the line I have chosen.",
  },
  {
    id: "frequency-lock",
    glyph: "〰️",
    name: "The Frequency Lock",
    tagline: "Emotion is the carrier wave; thought merely rides upon it.",
    steps: [
      "Find the feeling of the fulfilled desire and locate it in the body.",
      "Amplify it with breath — in for four, hold for four, out for six.",
      "Hold the feeling alone for ninety seconds; no images required.",
      "Anchor it with a gesture — thumb and ring finger touching.",
    ],
    seal: "The wave is set; the form follows.",
  },
  {
    id: "scripting",
    glyph: "📜",
    name: "The Scripting Method",
    tagline: "Write your days from inside the reality you prefer.",
    steps: [
      "Date the page as if you already live in the new reality.",
      "Describe one ordinary day there, in details that prove it.",
      "Write in past tense: “I am so grateful that it happened.”",
      "Re-read nightly until it feels like memory, not hope.",
    ],
    seal: "My pen writes from the end already achieved.",
  },
  {
    id: "vacuum",
    glyph: "🕊️",
    name: "The Vacuum Release",
    tagline:
      "Empty deliberately, and reality rushes to fill the space you define.",
    steps: [
      "Clear one drawer, shelf or folder completely.",
      "Say aloud what the cleared space is now reserved for.",
      "Leave it empty for a full day without refilling it.",
      "Refill it only with things that belong to the chosen line.",
    ],
    seal: "I empty with trust; the field fills with precision.",
  },
];

/** Two-sentence orientation to the Higher Mind. */
export const higherMindIntro = [
  "The Higher Mind is the vantage above the story — the self that watches the whole board while the surface self moves one piece.",
  "It does not shout and it never begs. It answers in quiet certainty, symbols, synchronicities and a calm that arrives before understanding.",
];

/** The Ladder of Arrival — six rungs into the higher view. */
export const ladderRungs: LadderRung[] = [
  {
    rung: 1,
    title: "Stillness",
    line: "Sit until the water settles — the view begins where striving ends.",
  },
  {
    rung: 2,
    title: "Aperture",
    line: "Soften the gaze upward, as if listening with the crown of the head.",
  },
  {
    rung: 3,
    title: "Signal",
    line: "Note the first quiet impression; the Higher Mind speaks first and fastest.",
  },
  {
    rung: 4,
    title: "Dialogue",
    line: "Ask one honest question and record the reply without editing.",
  },
  {
    rung: 5,
    title: "Trust",
    line: "Test the guidance small; confidence grows by verified steps.",
  },
  {
    rung: 6,
    title: "Integration",
    line: "Act, observe, and let the two minds become one movement.",
  },
];

/** Contact protocols for the Higher Mind. */
export const higherProtocols: HigherProtocol[] = [
  {
    id: "morning-aperture",
    glyph: "🌅",
    name: "The Morning Aperture",
    purpose: "Open the channel before the day's noise takes the throne.",
    steps: [
      "Before any screen, sit upright and breathe 4-4-6 for two minutes.",
      "Ask the day's single question and stay silent for its answer.",
      "Write the first three impressions down — no analysis yet.",
    ],
  },
  {
    id: "scripting",
    glyph: "✒️",
    name: "Automatic Scripting",
    purpose: "Let the hand serve as a bridge for the Higher Mind's pen.",
    steps: [
      "Write your question at the top of a page, then release the hand.",
      "Transcribe whatever flows, uncensored, for five minutes.",
      "Mark the lines that ring true; leave the rest without judgment.",
    ],
  },
  {
    id: "dream-bridge",
    glyph: "🌌",
    name: "The Dream Bridge",
    purpose: "Carry the question into sleep and retrieve its seed at dawn.",
    steps: [
      "Before sleep, whisper the question three times with feeling.",
      "Keep paper at the pillow; move nothing until the dream is recorded.",
      "Read the record at breakfast and ask: what is the honest symbol here?",
    ],
  },
];

/** Discernment — how to tell a true signal from noise. */
export const discernmentLines = [
  "True higher signals calm the nervous system; fear and haste are the ego's handwriting.",
  "Guidance never demands, shames or rushes — it invites and leaves you free.",
  "Test every message against kindness, patience and your own quiet yes.",
];

/** Belief domains offered to the Belief Reframer. */
export const beliefDomains: BeliefDomain[] = [
  {
    id: "worth",
    glyph: "💠",
    label: "Worth",
    pattern:
      "“I must earn the right to receive.” Receiving feels like a debt.",
    reframe:
      "Reception is the natural breath of a living field — you inhale without negotiating.",
    practice:
      "Once daily, accept something small with a spoken thank-you and no repayment plan.",
  },
  {
    id: "timing",
    glyph: "⏳",
    label: "Timing",
    pattern:
      "“If it hasn't arrived, it never will.” Delay reads as denial.",
    reframe:
      "Form travels at the speed of belief; delay is distance, not refusal.",
    practice:
      "Name one thing that arrived later than expected and proved worth the wait.",
  },
  {
    id: "permission",
    glyph: "🕯️",
    label: "Permission",
    pattern:
      "“Desiring more means taking from someone.” Abundance feels like theft.",
    reframe:
      "The field is generative, not additive — a lamp lights a thousand lamps and loses none.",
    practice:
      "Write one ambition openly, then bless three people who hold the same one.",
  },
];

/** Felt states the Vibration Bridge can lift. */
export const vibrationStates: VibrationState[] = [
  {
    id: "fog",
    glyph: "😶‍🌫️",
    label: "Fog",
    bridge:
      "Move the body for three minutes before deciding anything; motion drains fog.",
    anchor: "Clarity returns one breath at a time.",
  },
  {
    id: "heaviness",
    glyph: "🪨",
    label: "Heaviness",
    bridge:
      "Place a hand on the chest, name the feeling, and let it be one size smaller.",
    anchor: "I carry light by letting some of this down.",
  },
  {
    id: "scatter",
    glyph: "⚡",
    label: "Scatter",
    bridge:
      "Choose one task and finish it fully; scatter cannot survive completion.",
    anchor: "One point of focus gathers all my power.",
  },
  {
    id: "doubt",
    glyph: "🌧️",
    label: "Doubt",
    bridge:
      "Collect one piece of past evidence that you were wrong about your limits.",
    anchor: "I have been wrong before; the field was larger.",
  },
];

/* ---------------- daily protocol (deterministic by date) ---------------- */

/** Openers for the direct line to the Manifest OS. */
export const osOpeners = [
  "How do I know which reality-line I am currently living on?",
  "Walk me through the Two-Glass Shift, step by step.",
  "I keep doubting my manifestation. Reframe the doubt with me.",
  "How do I connect with my Higher Mind and hear it clearly?",
  "Help me refine one intention into something I can act on this week.",
  "What is one refinement I could make to my signal tonight?",
  "My belief says I am not ready. Can you loosen it with me?",
  "Teach me the Frequency Lock and when to use it.",
];

export const morningPool = [
  "Speak the day's intention aloud before any screen.",
  "Two minutes of 4-4-6 breathing with a soft upward gaze.",
  "Write one sentence of gratitude aimed at your future self.",
  "Drink water slowly and name three things you choose today.",
];

export const eveningPool = [
  "Record one moment the field answered you today.",
  "Re-read your script or formula seal before sleep.",
  "Release the day: name what you keep and what you return.",
  "Thank the body in one sentence; let it carry you to rest.",
];

export const focusPool = [
  "The state, not the effort, does the creating.",
  "What you hold in feeling, the field holds in form.",
  "Choose the line; walk as if it is already beneath your feet.",
];

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DailyProtocol {
  morning: string;
  evening: string;
  focus: string;
}

/** Same day ⇒ same protocol, everywhere on Earth the date is the same. */
export function dailyProtocol(dateKey: string): DailyProtocol {
  const seed = hash32(dateKey);
  return {
    morning: morningPool[seed % morningPool.length],
    evening: eveningPool[(seed >>> 3) % eveningPool.length],
    focus: focusPool[(seed >>> 6) % focusPool.length],
  };
}
