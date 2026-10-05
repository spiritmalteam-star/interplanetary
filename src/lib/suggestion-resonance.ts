/* ------------------------------------------------------------------ */
/*  THE RESONANCE ENGINE — how the laboratory hears what a             */
/*  conversation is about. Extracted from the suggestion strip so      */
/*  both the strip and the living suggestion tree rank through the     */
/*  same ear: a conversation's resonant vocabulary, weight by          */
/*  rarity, and every candidate suggestion scored against it.          */
/* ------------------------------------------------------------------ */

/** The small words that carry no meaning of their own. */
const STOPWORDS = new Set(
  ("a an and are as at be but by can do does for from has have how i " +
    "in is it its me my not of on or our so that the their them then " +
    "there these they this to us was we what when where which who why " +
    "will with would you your about into over really truly just very")
    .split(" ")
);

/** Lowercase content-words of a phrase — the tokens that can resonate. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ž\s'-]/gi, " ")
    .split(/[\s'-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** The context's resonant vocabulary — word → weight (rarity bonus). */
export function contextVocabulary(context: string): Map<string, number> {
  const weights = new Map<string, number>();
  for (const w of tokenize(context)) {
    const next = (weights.get(w) ?? 0) + 1;
    weights.set(w, next);
  }
  /* repeated words are the conversation's center of gravity — but a
     word repeated too often stops being signal, so the weight cools */
  for (const [w, n] of weights) {
    weights.set(
      w,
      1 + Math.min(3, Math.log2(n + 1)) + Math.min(1.5, w.length / 12)
    );
  }
  return weights;
}

/** One suggestion's resonance with the conversation. */
export function scoreSuggestion(
  s: string,
  vocab: Map<string, number>
): number {
  let score = 0;
  for (const w of tokenize(s)) {
    const weight = vocab.get(w);
    if (weight) score += weight;
  }
  return score;
}
