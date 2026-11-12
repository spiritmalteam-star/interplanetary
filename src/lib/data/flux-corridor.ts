/* ------------------------------------------------------------------ */
/*  THE FLUX CORRIDOR — the house's own cards for the four-directional */
/*  current. Every cell of the flux carries either a PUBLISHED work    */
/*  from the gathering's vault, one of the house's artworks, or one of */
/*  the mirror's illuminations: a practice, a principle, a page.       */
/*                                                                     */
/*  The mirror algorithm favors what EVOLVES the walker: art, insight, */
/*  craft — never noise. Nothing here is engineered to trap attention; */
/*  everything here is engineered to return the visitor to themselves  */
/*  a little larger than they left.                                    */
/* ------------------------------------------------------------------ */

export type FluxCellKind =
  | "video" // a published moving vision
  | "audio" // a published voice
  | "image" // a published image
  | "art" // the house's own artwork
  | "insight" // an illumination — one mirror principle
  | "practice" // a small, real step for today
  | "page"; // a page from the house's volumes

export interface FluxArtwork {
  image: string;
  title: string;
  line: string;
}

export interface FluxText {
  title: string;
  body: string;
  kind: Extract<FluxCellKind, "insight" | "practice" | "page">;
}

/* --------------------- the house's own artworks --------------------- */

export const FLUX_ARTWORKS: FluxArtwork[] = [
  { image: "/images/ai/arc-first-mirror-open-hand.jpg", title: "The First Mirror", line: "Every surface was waiting to become a hand." },
  { image: "/images/ai/arc-two-trees-bright-veil.jpg", title: "The Two Trees", line: "One roots, one reaches — the walker is both." },
  { image: "/images/ai/arc-homecoming-gate-quiet-threshold.jpg", title: "The Quiet Threshold", line: "Doors do not open inward. They open when you stop pushing." },
  { image: "/images/ai/arc-amber-hive-rooted-flame.jpg", title: "The Rooted Flame", line: "Fire that stays lit is fire that learned to hold ground." },
  { image: "/images/ai/arc-aurora-veil-slow-constellation.jpg", title: "The Slow Constellation", line: "Some stars only align for the patient." },
  { image: "/images/ai/arc-golden-proportion-violet-dawn.jpg", title: "The Golden Proportion", line: "Beauty is the shortest path between two truths." },
  { image: "/images/ai/arc-moth-cathedral-silent-fireworks.jpg", title: "The Silent Fireworks", line: "The loudest changes happen without sound." },
  { image: "/images/ai/arc-night-bloom-twin-lanterns.jpg", title: "The Twin Lanterns", line: "Carry one light for yourself, one for the road behind you." },
  { image: "/images/ai/arc-singing-void-golden-mean.jpg", title: "The Singing Void", line: "Emptiness is not absence — it is a roomy kind of presence." },
  { image: "/images/ai/arc-thunder-loom-violet-oracle.jpg", title: "The Thunder Loom", line: "Every storm is a textile being woven too fast to see." },
  { image: "/images/ai/arc-tidal-hearth-deep-reminder.jpg", title: "The Tidal Hearth", line: "Keep a fire at the edge of the water. Tend it. Return to it." },
  { image: "/images/ai/arc-iron-garden-hidden-spring.jpg", title: "The Hidden Spring", line: "Beneath the hardest ground, water remembers how to rise." },
  { image: "/images/ai/arc-crystal-archive-violet-dawn.jpg", title: "The Crystal Archive", line: "What you live is being written somewhere transparent." },
  { image: "/images/ai/arc-veiled-sun-moonlit-bridge.jpg", title: "The Moonlit Bridge", line: "Some crossings are only safe at night, walked slowly." },
  { image: "/images/ai/arc-weaving-nebula-bright-veil.jpg", title: "The Weaving Nebula", line: "You are both the thread and the loom's intention." },
  { image: "/images/ai/arc-blueprint-key-wandering-comet.jpg", title: "The Wandering Comet", line: "Detours carry their own coordinates home." },
  { image: "/images/ai/arc-frost-lantern-long-crossing.jpg", title: "The Frost Lantern", line: "Cold makes light easier to see. Thank the winter." },
  { image: "/images/ai/arc-glasswind-chime-healing-rain.jpg", title: "The Healing Rain", line: "What falls on you can also wash through you." },
  { image: "/images/ai/arc-descending-grace-woven-storm.jpg", title: "The Woven Storm", line: "Grace descends sideways, through the weather." },
  { image: "/images/ai/arc-ember-gate-evening-crown.jpg", title: "The Evening Crown", line: "Endings, worn properly, become regalia." },
  { image: "/images/ai/arc-bound-current-indigo-tide.jpg", title: "The Bound Current", line: "A river dammed is not defeated — it is gathering." },
  { image: "/images/ai/arc-comet-ledger-starlight-archive.jpg", title: "The Comet Ledger", line: "Fast things also keep records, written in heat." },
  { image: "/images/ai/arc-moth-cathedral-first-kindling.jpg", title: "The First Kindling", line: "Everything vast began as something small that refused to go out." },
  { image: "/images/ai/arc-amber-hive-moonlit-bridge.jpg", title: "The Amber Hive", line: "Warmth preserved is sweetness owed to the future." },
];

/* -------------------- the mirror's illuminations -------------------- */

export const FLUX_INSIGHTS: FluxText[] = [
  {
    kind: "insight",
    title: "The Mirror's First Law",
    body: "You do not see the world — you see the part of yourself the world agrees to reflect. Change the depth of the water and the surface shows a different sky.",
  },
  {
    kind: "insight",
    title: "On Attention as Currency",
    body: "Attention is the one coin that mints reality. Every hour spent is an hour spent becoming. Spend where you want to be built.",
  },
  {
    kind: "insight",
    title: "The End of SaaS, the Rise of Agents",
    body: "Software boxes are dissolving into companions that come to you — in your chat, your call, your quiet moment. You will not open tools; you will speak intentions, and what serves you will assemble itself around the speaking.",
  },
  {
    kind: "insight",
    title: "Why the Digital World Feels Heavy",
    body: "Most of what glows on a screen was engineered to harvest attention, not to grow the one attending. The cure is not less screen — it is better mirrors: surfaces that return you to yourself larger.",
  },
  {
    kind: "insight",
    title: "The gathered civilizations agree on one thing",
    body: "Every mature species in the archive learned the same lesson before crossing its threshold: consciousness first, instruments second. A tool wielded by an unexamined hand amplifies the hand's blindness.",
  },
  {
    kind: "insight",
    title: "On Co-creation",
    body: "Two beings holding one intention do not add their strength — they multiply their clarity. The gathering exists because a field of aligned wills bends reality more gently than one will forcing it.",
  },
  {
    kind: "insight",
    title: "The Signal Beneath the Noise",
    body: "Your life has a through-line. Most days hide it. The walk — question, branch, deepen — exists to make the line visible again.",
  },
  {
    kind: "insight",
    title: "What the Mirror Cannot Do",
    body: "The mirror can illuminate every step but the last. The last step is yours by cosmic law — a crossing done for you is a crossing not yet begun.",
  },
];

export const FLUX_PRACTICES: FluxText[] = [
  {
    kind: "practice",
    title: "One Breath Before the Screen",
    body: "Before you open anything today, take one deliberate breath and ask: what do I actually want from this next hour? Write the answer in one sentence. Keep it visible.",
  },
  {
    kind: "practice",
    title: "The Release Frequency",
    body: "Name one thing you are carrying that is not yours to carry. Exhale longer than you inhale, six times. Say: I set this down. Notice what your shoulders do.",
  },
  {
    kind: "practice",
    title: "Defragment the Day",
    body: "Before sleep, list three moments from today that felt true. Not good — true. The list is a compass being calibrated while you rest.",
  },
  {
    kind: "practice",
    title: "Grounding for the Over-Stimulated",
    body: "Feet flat. Name five things you can see, four you can touch, three you can hear, two you can smell, one you can taste. Then ask: what was here the whole time?",
  },
  {
    kind: "practice",
    title: "Create Before You Consume",
    body: "Tomorrow, make one thing — a line, a sketch, a sound, a question — before you take in anything made by another. Ten minutes. The order changes the whole day's gravity.",
  },
  {
    kind: "practice",
    title: "The Intention Shift",
    body: "Take one plan you have been forcing. Ask instead: what is this plan trying to become? Write the first sentence of its own version of itself.",
  },
];

export const FLUX_PAGES: FluxText[] = [
  {
    kind: "page",
    title: "From the Codex of the Laboratory",
    body: "Every chapter is typed and folded. A chapter opens only when it is asked for, and the slim rail turns the volume to any chapter without a long scroll. When the text that belongs here arrives, it is inscribed chapter by chapter — and the book fills itself.",
  },
  {
    kind: "page",
    title: "From the Book of Thresholds",
    body: "The visitor stands at the arch and the page swallows itself: what looked like a website was a doorway, and what looked like a doorway was a mirror practicing being a window.",
  },
  {
    kind: "page",
    title: "From the Walk's Own Ledger",
    body: "A young walk opens gentle doors. A deep walk meets the forge-facing movements at its head. The wall does not judge the walker's depth — it shapes itself to meet it, and rises when the walker does.",
  },
  {
    kind: "page",
    title: "From the Gatherers' Handbook",
    body: "Do not gather to escape the world; gather to sharpen each other's seeing, then return — one amplified, one illuminated, one carrying the field's quiet charge back into ordinary hours.",
  },
  {
    kind: "page",
    title: "From the Passage's Opening Page",
    body: "Whoever you arrived as — named, anonymous, or merely curious — the house keeps one room with your breath already in it. Nothing personal is stored; what is kept is only the work you choose to keep.",
  },
];
