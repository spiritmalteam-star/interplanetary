/* ------------------------------------------------------------------ */
/*  ASTRAL PLAY — the Mirror's majestic arcana deck.                   */
/*  24 cards, each a small constellation of meaning. The visitor draws  */
/*  a three-card spread; the Mirror intelligence behind the deck then   */
/*  offers what they need to know, when they need to know it.           */
/*  Card text is oracle data (like the OS formulas) — the AI reading    */
/*  is composed in the visitor's language by /api/astral-play.          */
/* ------------------------------------------------------------------ */

export interface ArcanaCard {
  id: string;
  name: string;
  essence: string;
  glyph: string;
  message: string;
  /** The card's own light — a desaturated gradient duo. */
  from: string;
  to: string;
}

export const arcanaDeck: ArcanaCard[] = [
  { id: "singing-void", name: "The Singing Void", essence: "Stillness before creation", glyph: "◌", message: "Every universe began as a silence that learned to hum. Your next step wants quiet first.", from: "#5B5480", to: "#2E2A4A" },
  { id: "first-mirror", name: "The First Mirror", essence: "Gentle self-reflection", glyph: "◎", message: "What you judge outside is a doorway inside. Look once, kindly, and the door opens.", from: "#8B7FA8", to: "#4A4368" },
  { id: "signal-ship", name: "The Signal Ship", essence: "Crossing between chapters", glyph: "◈", message: "You are between chapters. Trust the crossing — the navigation is already yours.", from: "#6FA8C9", to: "#33566E" },
  { id: "ember-gate", name: "The Ember Gate", essence: "A small sacred yes", glyph: "△", message: "A small yes is burning through an old no. Walk through while it is warm.", from: "#D98E73", to: "#7A4433" },
  { id: "bound-current", name: "The Bound Current", essence: "Two hearts, one circuit", glyph: "∞", message: "Give what you wish to receive — the current completes itself through you.", from: "#EE93B8", to: "#8A4A66" },
  { id: "crystal-archive", name: "The Crystal Archive", essence: "Memory as a map", glyph: "❖", message: "What you remember is a map, not a prison. Read it kindly and travel lighter.", from: "#A8C5BC", to: "#4E6A62" },
  { id: "weaving-nebula", name: "The Weaving Nebula", essence: "Creation in progress", glyph: "✧", message: "Your life is mid-weave. Do not judge the tapestry by its unfinished threads.", from: "#B39DDB", to: "#5A4B7E" },
  { id: "silent-watcher", name: "The Silent Watcher", essence: "Quiet discernment", glyph: "◉", message: "Not everything true is loud. Tonight, trust the quiet observation over the loud claim.", from: "#9FB8AD", to: "#48605A" },
  { id: "golden-proportion", name: "The Golden Proportion", essence: "Right timing", glyph: "☉", message: "What is yours keeps its appointment. Loosen your grip on the schedule it must keep.", from: "#E8C687", to: "#8A6D3B" },
  { id: "descending-grace", name: "The Descending Grace", essence: "Unearned receiving", glyph: "▽", message: "You do not have to earn this one. Receive it with clean and open hands.", from: "#C5D5EA", to: "#5F7BA1" },
  { id: "council-of-nine", name: "The Council of Nine", essence: "Inner counsel", glyph: "✷", message: "Let your inner table seat your wiser selves. Take the vote slowly, then act once.", from: "#C9B8E8", to: "#63548E" },
  { id: "blueprint-key", name: "The Blueprint Key", essence: "Purpose under the plans", glyph: "⚿", message: "The plan beneath your plans is kindness. Build from there and nothing collapses.", from: "#86C99B", to: "#3F6B4F" },
  { id: "wandering-star", name: "The Wandering Star", essence: "The holy detour", glyph: "☄", message: "The detour is the road. Collect what only losing your way can teach you.", from: "#F2B36D", to: "#92602C" },
  { id: "deep-well", name: "The Deep Well", essence: "Inner resource", glyph: "◍", message: "You are not running low. You are digging in the right place — go deeper, not wider.", from: "#6FD3DC", to: "#2F6B72" },
  { id: "harmonic-lock", name: "The Harmonic Lock", essence: "Alignment recognized", glyph: "≋", message: "When the answer is right, the body hums first. Ask your bones before you ask the world.", from: "#7FB5E8", to: "#3A5E85" },
  { id: "glass-bead-game", name: "The Glass Bead Game", essence: "Creation through play", glyph: "◐", message: "Creation rehearses itself in play. Take the game seriously by taking it lightly.", from: "#D8A7CA", to: "#714E66" },
  { id: "night-bloom", name: "The Night Bloom", essence: "Patience in the dark", glyph: "☾", message: "Some openings only happen in the dark. Stop checking the stem — bloom keeps its own hour.", from: "#8FA8D8", to: "#3D4E78" },
  { id: "star-sower", name: "The Star Sower", essence: "One true seed", glyph: "✦", message: "Plant one true thing today. A century of you will stand in it, shade and all.", from: "#E8D48B", to: "#8A7A3B" },
  { id: "two-trees", name: "The Two Trees", essence: "The loving choice", glyph: "⑂", message: "Both paths love you. Choose the one that asks you to grow.", from: "#A8C68F", to: "#4E6640" },
  { id: "braided-river", name: "The Braided River", essence: "Integration", glyph: "∪", message: "The pieces are merging. Stop pulling them apart to check whether they are real.", from: "#9DC9CF", to: "#43666C" },
  { id: "lantern-thresholds", name: "The Lantern of Thresholds", essence: "Honored transition", glyph: "✹", message: "Carry a small light into the change. The whole corridor brightens with your walking.", from: "#F0C987", to: "#916A2E" },
  { id: "singing-stones", name: "The Singing Stones", essence: "Proven foundation", glyph: "▣", message: "Build on what has already survived you. The older stones hold the deepest songs.", from: "#B8AA9B", to: "#5E554A" },
  { id: "aurora-veil", name: "The Aurora Veil", essence: "Tender revelation", glyph: "☍", message: "What hides is not against you. The veil lifts at the speed of your tenderness.", from: "#9EE8C8", to: "#3E7A63" },
  { id: "homecoming", name: "The Homecoming", essence: "Belonging reclaimed", glyph: "⌂", message: "You were never late to your own life. Open the door and welcome yourself back.", from: "#D8B48F", to: "#774F2E" },
];

export const arcanaTotal = arcanaDeck.length; // 24

/** The three positions of the majestic spread (i18n keys). */
export const spreadPositions = [
  "What is",
  "What is hidden",
  "What is emerging",
] as const;

/** Draw n distinct cards from the deck (uniform shuffle). */
export function drawArcana(n: number): ArcanaCard[] {
  const pool = [...arcanaDeck];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
