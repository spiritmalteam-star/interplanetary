/* ------------------------------------------------------------------ */
/*  THE RESONANCE ENGINE — the hyper-advanced ear of every branch.     */
/*                                                                     */
/*  Every branch of the house — the living tree of the chat box, the   */
/*  crown grown from an exchange, the stand-in whispers of a landed    */
/*  reply — ranks through this one ear, and the ear listens to three    */
/*  laws:                                                              */
/*                                                                     */
/*  1. THE FIELD. A conversation is heard as a field of weighted       */
/*     words: the scope the visitor is exploring weighs triple, the    */
/*     branches grown of the exchange weigh double, the last           */
/*     transmission and the visitor's own words carry the middle, and  */
/*     the journey's older picks fade gently by age.                   */
/*                                                                     */
/*  2. THE RARITY. A word is worth what it costs. Measured against     */
/*     the whole grove (inverse document frequency), "the" is silence  */
/*     and "pleiadian" is a bell.                                      */
/*                                                                     */
/*  3. THE HARMONY. A whisper's resonance is the sum of the words it   */
/*     shares with the field, lifted by shared phrases, tuned by its   */
/*     learning movement to the conversation's phase, damped when it   */
/*     was already offered, shivered by one deterministic degree of    */
/*     the hour — and the crown is chosen under a diversity floor, so  */
/*     no single subject sings twice over a quieter voice.             */
/*                                                                     */
/*  Pure, synchronous, dependency-free: a grove of 560 whispers is     */
/*  fully ranked in a single frame, once per summon — then silent.     */
/* ------------------------------------------------------------------ */

import type { BranchType } from "@/lib/learning-branches";

/* ------------------------- the small words -------------------------- */

const STOPWORDS = new Set<string>(
  ("a an and are as at be but by can do does for from has have how i " +
    "in is it its me my not of on or our so that the their them then " +
    "there these they this to us was we what when where which who why " +
    "will with would you your about into over really truly just very " +
    /* de */ "der die das den dem des ein eine einen einem einer und " +
    "ist bin bist sind war were wird werden wurde für mit von zu zum " +
    "zur auf aus bei nach wie auch nicht nur noch was wer wie wenn " +
    "dass deine dein dein Ihre ihr ihre uns euch man sich so dann " +
    /* fr */ "le la les un une des du de au aux et est sont que qui " +
    "quoi quel quelle pour dans sur avec sans sous chez ton ta tes " +
    "votre vos nos notre mes son sa ses leur leurs plus moins tres " +
    /* es */ "el los las un una unas unos y es son que quien cual " +
    "para por con sin sobre entre tu tus su sus mis del al lo mas " +
    "menos muy hoy manana cuando donde quien " +
    /* it */ "il lo la gli le un uno una e sono che chi quale per " +
    "con senza su tra fra tuo tua tuoi tue vostro vostra nostri " +
    "piu meno molto oggi domani quando dove " +
    /* sq */ "një një një një një një një një një një dhe është janë " +
    "në nga për me pa mbi ndërmjet para pas te tu të sa cilin cili " +
    "çfarë kur ku pse si gjithashtu vetëm edhe por ose " +
    /* tr */ "bir ve veya ile için gibi ama daha çok en bu şu o ben " +
    "sen biz siz onlar ne nasıl neden nerede hangi kim diye olarak " +
    "de da ki mi mu var yok değil çünkü göre kadar since " +
    /* el */ "και τη τον της στο στος στη στης μια ένα για από με " +
    "χωρίς πάνω κάτω μετα μεταξύ πριν μετά ειναι είναι ποιο πού " +
    "πώς πώς όταν που τι γιατι γιατί")
    .split(/\s+/)
    .filter(Boolean)
);

/** Fold diacritics and unify the letters that travel under many faces. */
function fold(w: string): string {
  let out = w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .replace(/[\u0300-\u036f]/g, "");
  /* Turkish dotless i and friends land on plain letters after the fold */
  out = out.replace(/ı/g, "i").replace(/İ/g, "i");
  return out;
}

/** The content-words of a phrase, in every tongue of the house. */
export function tokenizeResonant(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const raw of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    const w = fold(raw);
    if (w.length < 3) continue;
    if (STOPWORDS.has(w)) continue;
    out.push(w);
  }
  return out;
}

/* --------------------------- the field ------------------------------ */

export interface ResonanceField {
  /** word → accumulated field weight */
  tokens: Map<string, number>;
  /** "w1 w2" → weight — the conversation's own phrases */
  bigrams: Map<string, number>;
  /** the conversation's phase, spoken in movements */
  phase: Record<BranchType, number>;
  /** the scope's own words — they weigh beyond every other voice */
  scopeTokens: Set<string>;
  /** the hour the listening belongs to (the shimmer's seed) */
  hour: number;
}

const EMPTY_PHASE: Record<BranchType, number> = {
  deepen: 1,
  connect: 1,
  contrast: 1,
  apply: 1,
  create: 1,
  reflect: 1,
  pause: 1,
};

/** The phase of a conversation that has already begun: the walk leans
    toward deepening, applying and reflecting on what has landed. */
const WALKING_PHASE: Record<BranchType, number> = {
  ...EMPTY_PHASE,
  deepen: 1.18,
  apply: 1.12,
  reflect: 1.12,
  connect: 1.06,
  contrast: 0.94,
  pause: 0.9,
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Hear a conversation as one field. Every source has its own voice and
 * its own weight — the scope they are exploring leads, the context that
 * follows (the exchange, the visitor's words, the journey) harmonizes.
 */
export function buildResonanceField(opts: {
  /** The scope/window the visitor stands in — the loudest voice. */
  scope?: string | null;
  /** The conversation's last breaths — transmission, visitor, journey. */
  context?: string | null;
  /** The branches grown on the exchange — the crown's own voice. */
  buds?: string[] | null;
  /** Older picks of the walk, newest first — they fade by age. */
  journey?: string[] | null;
  /** The UTC hour the grove belongs to. */
  hour?: number;
}): ResonanceField {
  const tokens = new Map<string, number>();
  const bigrams = new Map<string, number>();

  const hear = (text: string, weight: number) => {
    if (!text) return;
    const words = tokenizeResonant(text);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      tokens.set(w, (tokens.get(w) ?? 0) + weight);
      if (i + 1 < words.length) {
        const bg = `${w} ${words[i + 1]}`;
        bigrams.set(bg, (bigrams.get(bg) ?? 0) + weight);
      }
    }
  };

  /* THE SCOPE LEADS — threefold */
  if (opts.scope) hear(opts.scope, 3);
  /* THE GROWN CROWN — twofold */
  for (const b of opts.buds ?? []) hear(b, 2);
  /* THE CONTEXT THAT FOLLOWS */
  if (opts.context) hear(opts.context, 1.4);
  /* THE JOURNEY — newest first, each step a breath quieter */
  const journey = opts.journey ?? [];
  for (let i = 0; i < Math.min(journey.length, 8); i++)
    hear(journey[i], 0.9 * Math.pow(0.85, i));

  /* the scope's own tokens, remembered apart — a whisper carrying one
     of them stands inside the scope's light even with no other echo */
  const scopeTokens = new Set(opts.scope ? tokenizeResonant(opts.scope) : []);

  const hasVoice = tokens.size > 0;
  return {
    tokens,
    bigrams,
    phase: hasVoice ? WALKING_PHASE : EMPTY_PHASE,
    scopeTokens,
    hour: opts.hour ?? 0,
  };
}

/* ---------------------------- the rarity ---------------------------- */

const idfCache = new WeakMap<string[], Map<string, number>>();

/**
 * The cost of every word, measured across the whole grove. A word that
 * hangs on many whispers is nearly free; a rare word rings like a bell.
 */
export function buildIdf(texts: string[]): Map<string, number> {
  const cached = idfCache.get(texts);
  if (cached) return cached;
  const df = new Map<string, number>();
  for (const text of texts) {
    const seen = new Set(tokenizeResonant(text));
    for (const w of seen) df.set(w, (df.get(w) ?? 0) + 1);
  }
  const n = Math.max(1, texts.length);
  const idf = new Map<string, number>();
  for (const [w, d] of df) idf.set(w, 0.55 + Math.log2(1 + n / d) * 0.45);
  if (idfCache.size > 16) idfCache.clear();
  idfCache.set(texts, idf);
  return idf;
}

/* --------------------------- the harmony ---------------------------- */

export type ResonanceTier = "deep" | "attuned" | "resting";

export interface ResonanceVerdict {
  /** 0 … ~4+ — the whisper's resonance with the conversation */
  score: number;
  tier: ResonanceTier;
  /** the words the whisper and the conversation share */
  matches: string[];
}

/**
 * One whisper's resonance with the field: shared words weighted by
 * rarity, shared phrases doubled, the scope's own light counted twice,
 * the movement tuned to the conversation's phase, the already-offered
 * damped, and one deterministic shimmer of the hour — so the grove
 * still renews each hour without ever scrambling mid-listen.
 */
export function scoreWhisper(
  text: string,
  movement: BranchType | undefined,
  field: ResonanceField,
  opts?: {
    idf?: Map<string, number>;
    /** lowercase texts already offered — they damp */
    seen?: Set<string> | null;
    /** the whisper's subject — resonance inside one subject's light */
    subject?: string | null;
  }
): ResonanceVerdict {
  const words = tokenizeResonant(text);
  if (words.length === 0 || field.tokens.size === 0)
    return { score: 0, tier: "resting", matches: [] };

  const idf = opts?.idf;
  let base = 0;
  const matches: string[] = [];
  for (const w of words) {
    const weight = field.tokens.get(w);
    if (!weight) continue;
    const rarity = idf?.get(w) ?? 1;
    base += weight * rarity;
    matches.push(w);
  }

  /* shared phrases — the conversation's own sentences echoing back */
  let phrase = 0;
  for (let i = 0; i + 1 < words.length; i++) {
    const bg = `${words[i]} ${words[i + 1]}`;
    const bw = field.bigrams.get(bg);
    if (bw) phrase += bw * 2.2;
  }

  /* the scope's own light — a whisper inside the scope stands closer */
  let scopeGlow = 0;
  if (field.scopeTokens.size > 0) {
    for (const w of words) if (field.scopeTokens.has(w)) scopeGlow += 0.8;
  }
  if (opts?.subject) {
    const st = tokenizeResonant(opts.subject);
    for (const w of st) if (field.tokens.has(w)) scopeGlow += 0.35;
  }

  /* the movement tuned to the conversation's phase */
  const tune = movement ? (field.phase[movement] ?? 1) : 1;

  /* the already-offered damp — the grove never repeats itself */
  const low = text.toLowerCase();
  const seenDamp = opts?.seen?.has(low) ? 0.45 : 1;

  /* the shimmer of the hour — one deterministic degree, ±4% */
  const shimmer =
    1 + (((hashStr(`${low}|${field.hour}`) % 1000) / 1000 - 0.5) * 0.08);

  const score = (base + phrase + scopeGlow) * tune * seenDamp * shimmer;

  const tier: ResonanceTier =
    score >= 2.4 ? "deep" : score >= 1.1 ? "attuned" : "resting";
  return { score, tier, matches: matches.slice(0, 6) };
}

/* --------------------------- the ranking ---------------------------- */

/**
 * Rank a whole grove against the field, under the diversity floor: no
 * subject sings more than twice among the chosen, so the crown carries
 * the conversation's whole width, not one echo repeated.
 */
export function rankWhispers<T extends { text: string; movement?: BranchType; subject?: string | null }>(
  items: T[],
  field: ResonanceField,
  opts?: {
    idf?: Map<string, number>;
    seen?: Set<string> | null;
    limit?: number;
    /** max whispers of one subject among the chosen (diversity floor) */
    perSubject?: number;
  }
): (T & ResonanceVerdict)[] {
  const idf = opts?.idf;
  const seen = opts?.seen ?? null;
  const limit = opts?.limit ?? items.length;
  const perSubject = Math.max(1, opts?.perSubject ?? 2);

  const scored: (T & ResonanceVerdict)[] = [];
  for (const item of items) {
    const v = scoreWhisper(item.text, item.movement, field, {
      idf,
      seen,
      subject: item.subject ?? null,
    });
    scored.push({ ...item, ...v });
  }
  scored.sort((a, b) => b.score - a.score);

  /* the diversity floor */
  const perSubjectCount = new Map<string, number>();
  const chosen: (T & ResonanceVerdict)[] = [];
  const overflow: (T & ResonanceVerdict)[] = [];
  for (const w of scored) {
    if (w.score <= 0) continue;
    const key = (w.subject ?? "").toLowerCase().slice(0, 48) || "__";
    const c = perSubjectCount.get(key) ?? 0;
    if (c >= perSubject) {
      overflow.push(w);
      continue;
    }
    perSubjectCount.set(key, c + 1);
    chosen.push(w);
    if (chosen.length >= limit) break;
  }
  if (chosen.length < limit) {
    for (const w of overflow) {
      chosen.push(w);
      if (chosen.length >= limit) break;
    }
  }
  return chosen;
}

/** Rank bare strings — the pools of the landed replies. */
export function rankStrings(
  items: string[],
  field: ResonanceField,
  opts?: { idf?: Map<string, number>; seen?: Set<string> | null; limit?: number }
): { text: string; score: number; tier: ResonanceTier }[] {
  return rankWhispers(
    items.map((text) => ({ text })),
    field,
    opts
  );
}

/** The verdict in words, for the leaf's honest title. */
export function tierTitle(tier: ResonanceTier): string {
  return tier === "deep"
    ? "resonates deeply with your walk"
    : tier === "attuned"
      ? "resonates with your walk"
      : "";
}
