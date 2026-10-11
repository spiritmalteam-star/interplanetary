"use client";

import type { BranchType } from "@/lib/learning-branches";

/* ------------------------------------------------------------------ */
/*  THE QUESTION'S VOICE — the clarity law of the walk.                */
/*                                                                     */
/*  The visitor asked for questions that never look alike, that are    */
/*  SHORT enough to be read in one breath, and that meet each walker   */
/*  at their own depth — the depth the profile's DNA evolution score   */
/*  already knows. This library is that law, in one place:             */
/*                                                                     */
/*    - compressWhisper: one whisper in, a shorter, plainer whisper    */
/*      out (whole meaning kept; scene-setting and repeated tails      */
/*      fall away; nothing is ever cut mid-thought).                   */
/*    - tooSimilar: two whispers that share too much of their          */
/*      substance never stand side by side in the family.              */
/*    - voiceForScore: the walker's Expansion Index (0-100) becomes    */
/*      a voice: how many words a question may carry and which         */
/*      learning movements lead at this depth of the walk.             */
/*    - tuneSeedBatch: a whole family tuned at once: compressed,       */
/*      de-duplicated against its siblings, balanced across movements  */
/*      and led by the walker's own voice.                             */
/*                                                                     */
/*  Pure and synchronous: the tree renders from it and goes silent.    */
/* ------------------------------------------------------------------ */

/* ------------------------- the voice tiers -------------------------- */

export interface VoiceTier {
  /** The most words one question may carry at this depth. */
  maxWords: number;
  /** The movements that lead the family at this depth (in order). */
  prefer: BranchType[];
}

/**
 * The walker's DNA evolution score (the Expansion Index, 0-100) spoken
 * as a voice. A fresh spark receives short, plain, grounded questions;
 * a deep walker receives the wider, stranger, more demanding ones.
 */
export function voiceForScore(score: number): VoiceTier {
  const s = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  if (s < 15) {
    return {
      maxWords: 9,
      prefer: ["apply", "reflect", "deepen", "connect", "create", "contrast", "pause"],
    };
  }
  if (s < 32) {
    return {
      maxWords: 11,
      prefer: ["deepen", "apply", "reflect", "connect", "create", "contrast", "pause"],
    };
  }
  if (s < 55) {
    return {
      maxWords: 12,
      prefer: ["deepen", "connect", "reflect", "apply", "contrast", "create", "pause"],
    };
  }
  if (s < 78) {
    return {
      maxWords: 13,
      prefer: ["connect", "contrast", "deepen", "create", "reflect", "apply", "pause"],
    };
  }
  return {
    maxWords: 14,
    prefer: ["contrast", "create", "connect", "deepen", "reflect", "apply", "pause"],
  };
}

/* --------------------------- the measure ---------------------------- */

const FILLER_WORDS = new Set([
  "a", "an", "the", "of", "in", "on", "at", "to", "for", "with", "and",
  "or", "but", "is", "are", "was", "were", "be", "been", "being", "it",
  "its", "this", "that", "these", "those", "you", "your", "yours", "we",
  "our", "they", "their", "what", "which", "who", "whom", "whose", "how",
  "when", "where", "why", "does", "do", "did", "would", "could", "should",
  "can", "will", "shall", "may", "might", "if", "as", "by", "from", "not",
  "no", "yes", "about", "into", "out", "up", "down", "over", "under",
]);

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function contentSet(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of words(text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, " "))) {
    const w = raw.replace(/^[''-]+|[''-]+$/g, "");
    if (w.length >= 3 && !FILLER_WORDS.has(w)) out.add(w);
  }
  return out;
}

/**
 * THE SIMILARITY LAW — two whispers that share more than ~55% of their
 * substance are siblings of one thought: the later one steps aside so
 * the family never shows the same question twice in a different dress.
 */
export function tooSimilar(a: string, b: string): boolean {
  const sa = contentSet(a);
  const sb = contentSet(b);
  if (sa.size === 0 || sb.size === 0) return false;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / Math.min(sa.size, sb.size) >= 0.55;
}

/* ------------------------- the compression -------------------------- */

/** Scene-setting tails the grove weaves for atmosphere: beautiful
    once, repeated across a family they make questions look alike.
    Stripped from the end of a whisper, they shorten every one. */
const SCENE_TAILS: RegExp[] = [
  /\s*,?\s*the night before it matters$/i,
  /\s*,?\s*when someone asks how you are$/i,
  /\s*,?\s*as the screen dims for the night$/i,
  /\s*,?\s*in the hour before dawn$/i,
  /\s*,?\s*as if it had already arrived$/i,
  /\s*,?\s*as if remembered twenty years from now$/i,
  /\s*,?\s*in seven words or fewer$/i,
  /\s*,?\s*before the day ends$/i,
  /\s*,?\s*before tonight$/i,
  /\s*,?\s*a breath longer$/i,
  /\s*,?\s*hour by hour$/i,
  /\s*,?\s*in words alone$/i,
  /\s*,?\s*on a day like today$/i,
  /\s*,?\s*in your own words$/i,
  /\s*,?\s*this week$/i,
  /\s*,?\s*tonight$/i,
  /\s*,?\s*today$/i,
];

/** Adverbial clause openers: the clause they open can always be laid
    down whole without breaking the sentence's grammar. */
const ADVERBIAL_OPENERS =
  /^(when|while|because|so that|even though|as if|whether|unless|before|after|since|although|though|wherever|if)\b/i;

/** Relative openers: cut before one only as a last resort. */
const RELATIVE_OPENERS = /^(that|which|who|whose|whom)\b/i;

/** A head must not end on one of these when its relative clause is cut
    away ("tell the you ..." dangles without its clause). */
const DANGLING_END = /(you|it|them|him|her|me|us|this|these|those)$/i;

/** A clause-law head ending on a preposition is not a clean cut — the
    dropped clause carried the preposition's object ("talked you into"). */
const PREP_END =
  /\s+(of|in|on|at|to|for|with|by|about|into|onto|beside|between|without|toward|through|under|past|beyond|against|from|as)$/i;

const QUESTION_START =
  /^(what|which|who|whom|whose|how|where|why|when|is|are|was|were|do|does|did|can|could|would|will|shall|should|may|might|have|has)\b/i;

/** A sentence that OPENS on a subordinate clause ("If the version ...
    could speak, what ..."). Cutting inside it or after its comma
    leaves a broken conditional — such a whisper keeps its whole self. */
const SUBORDINATE_START =
  /^(if|when|while|because|before|after|since|although|though|unless|whether|wherever|as if|so that|even though)\b/i;

/** Trailing orphan CONNECTIVES a cut may leave hanging (never
    prepositions — "talked you into" needs its object; a bare trailing
    preposition means no honest cut existed). */
const ORPHAN_END = /\s+(and|or|but|so|that|which|who|when|while|because|if|before|after|since|until|whether|as)$/i;

/** Punctuate a kept fragment honestly: a question stays a question,
    an invitation ends without one (the pause's own grammar). */
function repunctuate(frag: string, wasQuestion: boolean): string {
  let out = frag.replace(/\s+/g, " ").replace(/[\s:,;.]+\s*$/, "").replace(/—\s*$/, "").trimEnd();
  let guard = 0;
  while (ORPHAN_END.test(out) && guard++ < 3) {
    out = out.replace(ORPHAN_END, "").replace(/[\s:,;.—]+\s*$/, "").trimEnd();
  }
  if (!out) return frag.trimEnd();
  const startsQuestion = QUESTION_START.test(out);
  if (startsQuestion && !out.endsWith("?")) out += "?";
  return out;
}

/** The last word index (>= 5) whose word opens a clause of `re`. */
function lastOpenerIndex(ws: string[], re: RegExp): number {
  for (let i = ws.length - 1; i >= 5; i--) {
    if (re.test(ws[i])) return i;
  }
  return -1;
}

/** Two-word clause openers ("as if", "so that", "even though"). */
const PAIR_OPENERS = /^(as if|so that|even though)$/i;

/** The last index whose WORD PAIR opens a two-word clause. */
function lastPairOpenerIndex(ws: string[]): number {
  for (let i = ws.length - 2; i >= 5; i--) {
    if (PAIR_OPENERS.test(`${ws[i]} ${ws[i + 1]}`)) return i;
  }
  return -1;
}

/** True when another clause already opens EARLIER in the head — a cut
    would leave that clause unterminated ("... if the morning" hangs).
    The first word never counts: "Which memory ..." opens a question,
    not a relative clause. */
function earlierOpener(ws: string[], before: number): boolean {
  for (let i = 1; i < before; i++) {
    if (ADVERBIAL_OPENERS.test(ws[i]) || RELATIVE_OPENERS.test(ws[i])) return true;
    if (i < before - 1 && PAIR_OPENERS.test(`${ws[i]} ${ws[i + 1]}`)) return true;
  }
  return false;
}

/** True when the head carries an open scaffold (a colon, a semicolon,
    a parenthesis) a cut would orphan. */
function openScaffold(head: string): boolean {
  return head.includes(":") || head.includes(";") || head.includes("(");
}

/**
 * THE COMPRESSION. One whisper, shorter and plainer, its whole meaning
 * kept. The laws, in order:
 *   1. the em-dash law: a repeated follow-up tail after " - " falls
 *      away; the head carries the meaning.
 *   2. the clause law: a trailing adverbial clause (when / because /
 *      as if ...) falls away whole; the grammar stands.
 *   3. the scene law: atmosphere tails fall away.
 *   4. the breath law: still too long, the whisper ends at its last
 *      clean boundary inside the budget. A whisper that cannot be cut
 *      cleanly keeps its whole self (meaning before brevity).
 * A breath of +3 words over the budget is forgiven when the only cut
 * left would cost grammar.
 */
export function compressWhisper(text: string, maxWords: number): string {
  const full = text.replace(/\s+/g, " ").trim();
  if (!full) return full;
  const budget = Math.max(5, maxWords);
  const wasQuestion = full.endsWith("?");
  /* the final period is laid down first — the laws match phrase ends,
     and repunctuate decides the final mark at the very end */
  if (words(full.replace(/[.]\s*$/, "")).length <= budget) return full;
  let work = full.replace(/[.]\s*$/, "");

  /* 1 — the em-dash law */
  const dashAt = work.indexOf(" \u2014 ");
  if (dashAt > 0 && !earlierOpener(words(work.slice(0, dashAt)), 99)) {
    const head = work.slice(0, dashAt);
    const tail = work.slice(dashAt + 3);
    const keepHead = words(head).length >= Math.max(5, words(tail).length - 2);
    if (keepHead) {
      work = head;
      if (words(work).length <= budget + 3) return repunctuate(work, wasQuestion);
    }
  }

  /* 2 — the clause law: a TOP-LEVEL trailing adverbial clause falls
     away whole (never from inside an if/that/who clause) */
  const ws0 = words(work);
  const adv = Math.max(
    lastOpenerIndex(ws0, ADVERBIAL_OPENERS),
    lastPairOpenerIndex(ws0)
  );
  if (adv >= 5 && !earlierOpener(ws0, adv) && !openScaffold(ws0.slice(0, adv).join(" "))) {
    const head = ws0.slice(0, adv).join(" ").replace(/[,;:\u2014]+\s*$/, "");
    if (words(head).length >= 5 && !PREP_END.test(head)) {
      work = head;
      if (words(work).length <= budget + 3) return repunctuate(work, wasQuestion);
    }
  }

  /* 3 — the scene law */
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of SCENE_TAILS) {
      const next = work.replace(re, "");
      if (next !== work) {
        work = next.trimEnd();
        changed = true;
        if (words(work).length <= budget + 3) return repunctuate(work, wasQuestion);
      }
    }
  }

  /* 4 — the breath law */
  const ws = words(work);
  const conditional = SUBORDINATE_START.test(ws[0] ?? "");
  if (ws.length > budget && !conditional) {
    for (let cut = budget; cut >= 5; cut--) {
      const nextWord = ws[cut];
      const headStr = ws.slice(0, cut).join(" ");
      /* only honest boundaries: a comma, or a whole trailing adverbial
         clause. A bare preposition is never a boundary — "carried
         through water" loses its object and the grammar breaks. */
      const boundary =
        /[,;:]$/.test(ws[cut - 1]) || ADVERBIAL_OPENERS.test(nextWord);
      if (
        boundary &&
        !earlierOpener(ws, cut) &&
        !openScaffold(headStr) &&
        !PREP_END.test(headStr.replace(/[,;:\u2014]+\s*$/, ""))
      ) {
        const frag = headStr.replace(/[,;:\u2014]+\s*$/, "");
        if (words(frag).length >= 5) return repunctuate(frag, wasQuestion);
      }
    }
    /* last resort — a relative clause, only when the head can stand */
    const rel = ws.findIndex((w, i) => i >= 5 && RELATIVE_OPENERS.test(w));
    if (rel >= 5 && !earlierOpener(ws, rel)) {
      const headWords = ws.slice(0, rel);
      const tailWords = ws.slice(rel + 1);
      const head = headWords.join(" ").replace(/[,;:\u2014]+\s*$/, "");
      if (
        headWords.length >= 5 &&
        tailWords.length >= 4 &&
        !openScaffold(head) &&
        !DANGLING_END.test(headWords[headWords.length - 1])
      ) {
        return repunctuate(head, wasQuestion);
      }
    }
  }

  /* no honest cut — the whisper keeps its whole self */
  return repunctuate(work, wasQuestion);
}

/* --------------------- the family tuner ----------------------------- */

export interface TunableSeed {
  text: string;
  movement: BranchType;
  score: number;
}

/**
 * THE FAMILY TUNER — a batch of seeds tuned at once:
 *   - every seed compressed to the voice's breath,
 *   - near-twin seeds stepped aside (the family shows one thought once),
 *   - the walker's depth gently re-orders the candidates (the
 *     resonance's own order inside each band is kept),
 *   - no movement may crowd the family (a cap per movement),
 *   - the pool is read past every set-aside so a family is never starved.
 * Deterministic: the same pool and voice grow the same family.
 */
export function tuneSeedBatch(
  pool: TunableSeed[],
  score: number,
  take: number
): TunableSeed[] {
  const voice = voiceForScore(score);
  /* a gentle re-order: each movement's candidates drift a little toward
     the front of the line — the resonance order inside stays */
  const drift = new Map<BranchType, number>();
  voice.prefer.forEach((m, i) => drift.set(m, i * 3));
  const ordered = pool
    .map((seed, i) => ({ seed, key: i + (drift.get(seed.movement) ?? 24) }))
    .sort((a, b) => a.key - b.key);

  const cap = Math.max(3, Math.ceil(take * 0.55));
  const perMovement = new Map<BranchType, number>();
  const out: TunableSeed[] = [];
  const keptTexts: string[] = [];
  const passedOver: TunableSeed[] = [];
  for (const { seed } of ordered) {
    if (out.length >= take) break;
    const count = perMovement.get(seed.movement) ?? 0;
    if (count >= cap) {
      passedOver.push(seed);
      continue;
    }
    const short = compressWhisper(seed.text, voice.maxWords);
    if (words(short).length < 3) continue;
    if (keptTexts.some((k) => tooSimilar(k, short))) continue;
    keptTexts.push(short);
    perMovement.set(seed.movement, count + 1);
    out.push({ ...seed, text: short });
  }
  /* the pool ran dry with caps set — the passed-over voices return */
  for (const seed of passedOver) {
    if (out.length >= take) break;
    const short = compressWhisper(seed.text, voice.maxWords);
    if (words(short).length < 3) continue;
    if (keptTexts.some((k) => tooSimilar(k, short))) continue;
    keptTexts.push(short);
    out.push({ ...seed, text: short });
  }
  return out;
}
