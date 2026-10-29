/* ------------------------------------------------------------------ */
/*  THE EASY DOORS — plain, clearly understandable whispers.           */
/*                                                                     */
/*  Two laws the house answered:                                       */
/*  ① THE THOUSAND MORE — the mirror chat's reload draws from a far    */
/*     deeper well: every easy door below rides the pool beside the    */
/*     older material, so "five new doors" keeps pouring for a very    */
/*     long walk.                                                      */
/*  ② THE PLAIN TONGUE — a visitor who has not signed in reads doors   */
/*     that ask simple, literal questions ("How does a black hole      */
/*     work?"), never the metaphoric riddles — the walk welcomes       */
/*     everyone at their own door first.                               */
/*                                                                     */
/*  Pure, client-safe, synchronous. Each topic carries its family, so  */
/*  a scope's floor draws easy doors of its own field.                 */
/* ------------------------------------------------------------------ */

export interface EasyWhisper {
  text: string;
  family: string;
}

/* the plain topics of the house — every one a real, nameable thing */
const TOPICS: Array<{ t: string; f: string }> = [
  /* -------- quantum -------- */
  { t: "black holes", f: "quantum" },
  { t: "quantum entanglement", f: "quantum" },
  { t: "the double-slit experiment", f: "quantum" },
  { t: "time dilation", f: "quantum" },
  { t: "dark matter", f: "quantum" },
  { t: "dark energy", f: "quantum" },
  { t: "wormholes", f: "quantum" },
  { t: "antimatter", f: "quantum" },
  { t: "string theory", f: "quantum" },
  { t: "parallel universes", f: "quantum" },
  { t: "quantum computers", f: "quantum" },
  { t: "Schrödinger's cat", f: "quantum" },
  { t: "the speed of light", f: "quantum" },
  { t: "the Big Bang", f: "quantum" },
  { t: "gravity", f: "quantum" },
  { t: "Einstein's relativity", f: "quantum" },
  { t: "the Higgs boson", f: "quantum" },
  { t: "quarks", f: "quantum" },
  { t: "nuclear fusion", f: "quantum" },
  { t: "superconductors", f: "quantum" },
  { t: "chaos theory", f: "quantum" },
  { t: "the multiverse idea", f: "quantum" },
  { t: "neutrinos", f: "quantum" },
  { t: "spacetime", f: "quantum" },
  { t: "entropy", f: "quantum" },

  /* -------- interplanetary -------- */
  { t: "colonizing Mars", f: "interplanetary" },
  { t: "the Voyager probes", f: "interplanetary" },
  { t: "exoplanets", f: "interplanetary" },
  { t: "the International Space Station", f: "interplanetary" },
  { t: "the Moon landing", f: "interplanetary" },
  { t: "life on Europa", f: "interplanetary" },
  { t: "asteroid mining", f: "interplanetary" },
  { t: "the James Webb telescope", f: "interplanetary" },
  { t: "Pluto", f: "interplanetary" },
  { t: "Saturn's rings", f: "interplanetary" },
  { t: "the search for alien signals", f: "interplanetary" },
  { t: "space elevators", f: "interplanetary" },
  { t: "terraforming Mars", f: "interplanetary" },
  { t: "the asteroid belt", f: "interplanetary" },
  { t: "comets", f: "interplanetary" },
  { t: "Jupiter's moons", f: "interplanetary" },
  { t: "how astronauts live in orbit", f: "interplanetary" },
  { t: "the Fermi paradox", f: "interplanetary" },
  { t: "Venus", f: "interplanetary" },
  { t: "the Kuiper belt", f: "interplanetary" },
  { t: "rocket launches", f: "interplanetary" },
  { t: "space suits", f: "interplanetary" },
  { t: "the Sun's life cycle", f: "interplanetary" },
  { t: "dwarf planets", f: "interplanetary" },
  { t: "interstellar travel", f: "interplanetary" },

  /* -------- manifest -------- */
  { t: "setting goals that stick", f: "manifest" },
  { t: "vision boards", f: "manifest" },
  { t: "breaking a bad habit", f: "manifest" },
  { t: "building real confidence", f: "manifest" },
  { t: "beating procrastination", f: "manifest" },
  { t: "morning routines", f: "manifest" },
  { t: "keeping a journal", f: "manifest" },
  { t: "practicing gratitude", f: "manifest" },
  { t: "deep focus", f: "manifest" },
  { t: "staying motivated", f: "manifest" },
  { t: "the fear of failure", f: "manifest" },
  { t: "visualization that works", f: "manifest" },
  { t: "affirmations", f: "manifest" },
  { t: "managing time honestly", f: "manifest" },
  { t: "self-discipline", f: "manifest" },
  { t: "recovering from setbacks", f: "manifest" },
  { t: "saying no with grace", f: "manifest" },
  { t: "finding your why", f: "manifest" },

  /* -------- healing -------- */
  { t: "sleeping better", f: "healing" },
  { t: "easing anxiety", f: "healing" },
  { t: "meditation for beginners", f: "healing" },
  { t: "breathing exercises", f: "healing" },
  { t: "daily stretching", f: "healing" },
  { t: "cold showers", f: "healing" },
  { t: "gut health", f: "healing" },
  { t: "common headaches", f: "healing" },
  { t: "back pain from sitting", f: "healing" },
  { t: "burnout", f: "healing" },
  { t: "drinking enough water", f: "healing" },
  { t: "screen time and the eyes", f: "healing" },
  { t: "good posture", f: "healing" },
  { t: "the immune system", f: "healing" },
  { t: "inflammation", f: "healing" },
  { t: "heart health", f: "healing" },
  { t: "sugar in the diet", f: "healing" },
  { t: "insomnia", f: "healing" },
  { t: "stress hormones", f: "healing" },
  { t: "the benefits of walking", f: "healing" },

  /* -------- evolvemed -------- */
  { t: "gene editing", f: "evolvemed" },
  { t: "mRNA vaccines", f: "evolvemed" },
  { t: "CRISPR", f: "evolvemed" },
  { t: "growing organs in labs", f: "evolvemed" },
  { t: "AI in medicine", f: "evolvemed" },
  { t: "antibiotic resistance", f: "evolvemed" },
  { t: "personalized medicine", f: "evolvemed" },
  { t: "brain-computer interfaces", f: "evolvemed" },
  { t: "nanomedicine", f: "evolvemed" },
  { t: "telemedicine", f: "evolvemed" },
  { t: "3D-printed organs", f: "evolvemed" },
  { t: "stem cells", f: "evolvemed" },
  { t: "cancer immunotherapy", f: "evolvemed" },
  { t: "protein folding", f: "evolvemed" },
  { t: "longevity research", f: "evolvemed" },

  /* -------- invent -------- */
  { t: "3D printing", f: "invent" },
  { t: "home robotics", f: "invent" },
  { t: "how batteries work", f: "invent" },
  { t: "solar panels", f: "invent" },
  { t: "electric cars", f: "invent" },
  { t: "AI assistants", f: "invent" },
  { t: "fusion reactors", f: "invent" },
  { t: "flying cars", f: "invent" },
  { t: "vertical farming", f: "invent" },
  { t: "desalination", f: "invent" },
  { t: "graphene", f: "invent" },
  { t: "wind turbines", f: "invent" },
  { t: "hydrogen fuel", f: "invent" },
  { t: "smart homes", f: "invent" },
  { t: "self-driving cars", f: "invent" },
  { t: "recycling technology", f: "invent" },

  /* -------- artx -------- */
  { t: "learning to draw", f: "artx" },
  { t: "color theory", f: "artx" },
  { t: "digital painting", f: "artx" },
  { t: "watercolor", f: "artx" },
  { t: "photo composition", f: "artx" },
  { t: "writing a short story", f: "artx" },
  { t: "songwriting", f: "artx" },
  { t: "film editing", f: "artx" },
  { t: "sculpting", f: "artx" },
  { t: "character design", f: "artx" },
  { t: "the principles of animation", f: "artx" },
  { t: "street photography", f: "artx" },
  { t: "oil painting", f: "artx" },
  { t: "collage art", f: "artx" },
  { t: "pixel art", f: "artx" },

  /* -------- mirror (the general walk) -------- */
  { t: "consciousness", f: "mirror" },
  { t: "dreams", f: "mirror" },
  { t: "déjà vu", f: "mirror" },
  { t: "how memory works", f: "mirror" },
  { t: "free will", f: "mirror" },
  { t: "the unconscious mind", f: "mirror" },
  { t: "personality", f: "mirror" },
  { t: "where emotions come from", f: "mirror" },
  { t: "intuition", f: "mirror" },
  { t: "the origins of language", f: "mirror" },
  { t: "music and the brain", f: "mirror" },
  { t: "why we sleep", f: "mirror" },
  { t: "why we laugh", f: "mirror" },
  { t: "the science of love", f: "mirror" },
  { t: "learning faster", f: "mirror" },
  { t: "creativity", f: "mirror" },
  { t: "imagination", f: "mirror" },
  { t: "attention", f: "mirror" },
  { t: "curiosity", f: "mirror" },
  { t: "how habits form", f: "mirror" },
];

/* the plain stems — every one grammatical with any topic above */
const STEMS: Array<(s: string) => string> = [
  (s) => `Tell me about ${s}.`,
  (s) => `Explain ${s} in simple words.`,
  (s) => `How does ${s} work?`,
  (s) => `Why does ${s} matter?`,
  (s) => `What should I know about ${s}?`,
  (s) => `Where does ${s} come from?`,
  (s) => `How do I begin with ${s}?`,
  (s) => `What is the truth about ${s}?`,
  (s) => `Help me understand ${s}.`,
  (s) => `What can ${s} teach me?`,
  (s) => `What is really known about ${s}?`,
  (s) => `Show me ${s} clearly.`,
];

/* THE FULL WELL — every topic through every stem, built once */
export const EASY_WHISPERS: EasyWhisper[] = TOPICS.flatMap(({ t, f }) =>
  STEMS.map((stem) => ({ text: stem(t), family: f }))
);

export const EASY_COUNT = EASY_WHISPERS.length;

/* the easy doors of one family ("mirror" = the general walk; null =
   the whole house mixed) */
export function easyWhispersFor(family: string | null): string[] {
  if (!family || family === "mirror") return EASY_WHISPERS.map((w) => w.text);
  return EASY_WHISPERS.filter((w) => w.family === family).map((w) => w.text);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* THE DETERMINISTIC SPREAD — a stable shuffle keyed to a seed (the
   canopy's own hour), so a draw never flickers but the next hour
   pours a different order. */
export function shuffledEasy(
  family: string | null,
  seed: number
): string[] {
  const list = easyWhispersFor(family);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = hashStr(`${seed}:${out[i]}`) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* THE GROVE'S EASY TWIN — a grown grove re-spoken in the plain tongue:
   every whisper of a family is replaced by an easy door of the same
   family (deterministic per whisper + seed), same count, same layout,
   same accents. This is how the walk reads easy for a visitor who has
   not signed in. */
export function swapGroveToEasy<W extends { text: string; family?: string }>(
  grove: W[],
  seed: number
): W[] {
  const byFamily = new Map<string, string[]>();
  for (const w of EASY_WHISPERS) {
    const arr = byFamily.get(w.family) ?? [];
    arr.push(w.text);
    byFamily.set(w.family, arr);
  }
  return grove.map((w) => {
    const fam = w.family && byFamily.has(w.family) ? w.family : "mirror";
    const pool = byFamily.get(fam) ?? [];
    const pick = pool[hashStr(`${seed}:${w.text}`) % pool.length] ?? w.text;
    return { ...w, text: pick };
  });
}
