/* ------------------------------------------------------------------ */
/*  THE BOOK'S OWN SCALES — what a weaving costs, before it begins.    */
/*                                                                     */
/*  THE HONEST PRICE LAW: a book is weighed by what it truly spends —  */
/*  TOKENS — and tokens are spoken here as pages, depth and reader     */
/*  age, the three hands the loom actually turns:                      */
/*    · LENGTH  — the plan's pages (BOOK_PLAN, one truth with the      */
/*    · DEPTH  — the depth bar (d1..d5): deeper tellings carry more    */
/*    · AGE    — the page's own measure (book-layout wordsPerSheet):  */
/*  The loom charges STRIDE BY STRIDE as it weaves — the open breath, */
/*  every background stride, the closing seal — and nothing else. A    */
/*  visitor who pauses or cancels keeps every credit the unwoven       */
/*  pages would have cost: what is left was never taken.               */
/* ------------------------------------------------------------------ */

import { detectShortBookAsk, type GroundLaw } from "./book-length";
import { specForAge } from "./book-layout";

/** The page plans of the loom — ONE truth shared by the route's
    prompts and the scales below (previously the route kept a private
    copy; the scales now read the same table the prompts speak). */
export const BOOK_PLAN: Record<
  string,
  { min: number; max: number; label: string }
> = {
  /* THE SHORT BOOK — the visitor's own ask, honored: a complete tale
     in a handful of pages, never a long, endless story. */
  short: {
    min: 10,
    max: 16,
    label:
      "a SHORT book — a complete tale told in a handful of pages (10–16 total): one bright arc, no sprawling middle, an ending that arrives on time",
  },
  bedtime: {
    min: 80,
    max: 104,
    label:
      "a soft bedtime treasure — short luminous pages, a calm nightly cadence",
  },
  classic: {
    min: 96,
    max: 120,
    label:
      "a classic tale — full pages, an evergreen storybook voice",
  },
  saga: {
    min: 120,
    max: 220,
    label:
      "a grand saga — an epic breadth of pages up to 220, a mythic storyteller's breath",
  },
  /* THE NOVEL — when the visitor speaks a long book by name (a novel,
     three hundred pages), the loom plans a true novel: every woven
     page a FULL typeset page of prose, the whole manuscript measured
     at the seal — page count never confused with narrative length. */
  novel: {
    min: 240,
    max: 320,
    label:
      "a FULL NOVEL — two hundred forty to three hundred twenty pages, every page a complete typeset page of living prose; arcs, acts and chapters planned like a printed book, never a page-count wearing a novel's name",
  },
  /* THE POEM ITSELF — when the visitor's own words ask for a poem (no
     book word spoken), the loom weaves the poem, not a book: verses on
     a few leaves, complete in the hand. */
  tiny: {
    min: 4,
    max: 10,
    label:
      "A POEM ITSELF — verses on a few leaves (4–10 pages): the whole poem present, nothing padded, no sprawling book around it",
  },
};

/** The visitor's own words may name the length themselves (novel, a
    three-hundred-page ask) — the same law the route obeys. */
export const NOVEL_ASK =
  /\b(novels?|\d{3}\s*pages?|three\s+hundred(?:\s+pages?)?|roman)\b/i;

/** THE PRICE OF ONE PAGE — the base the depth and the age scale.
    Env-tunable (BOOK_CREDITS_PER_PAGE) so the vault may re-tune the
    scales without a redeploy of the law itself. */
function basePerPage(): number {
  const raw = Number(process.env.BOOK_CREDITS_PER_PAGE);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.32;
}

/** THE DEPTH'S OWN WEIGHT — how much more sky one page costs as the
    telling deepens (d1 the clear daylight … d5 the multidimensional). */
const DEPTH_WEIGHT: Record<string, number> = {
  d1: 1.0,
  d2: 1.15,
  d3: 1.3,
  d4: 1.5,
  d5: 1.75,
};

const LEGACY_DEPTH_MAP: Record<string, string> = {
  angel: "d1",
  cryptic: "d3",
  decipher: "d4",
  legacy: "d5",
};

export function depthKeyOf(level?: string | null): string {
  const raw = (level ?? "").trim();
  if (DEPTH_WEIGHT[raw]) return raw;
  const legacy = LEGACY_DEPTH_MAP[raw];
  if (legacy) return legacy;
  return "d3";
}

export function depthWeight(level?: string | null): number {
  return DEPTH_WEIGHT[depthKeyOf(level)] ?? 1.3;
}

/** THE AGE'S OWN WEIGHT — the page's own measure (words per sheet)
    against the storybook standard (335): a grown reader's denser page
    truly spends more sky than a child's lighter one. */
export function ageWeight(age?: string | null): number {
  const wps = specForAge(age).wordsPerSheet;
  return Math.max(0.5, Math.min(2, wps / 335));
}

/** THE PRICE OF ONE WOVEN PAGE at the chosen depth and age. */
export function perPageCredits(level?: string | null, age?: string | null): number {
  return Math.round(basePerPage() * depthWeight(level) * ageWeight(age) * 100) / 100;
}

/** The volume key the loom itself will obey — the same law the route
    speaks (the visitor's own words outrank the chosen shapes). */
export function volumeKeyOf(input: {
  volume?: string | null;
  topic?: string | null;
  wishes?: string | null;
  ground?: GroundLaw | null;
}): string {
  const volume = (input.volume ?? "classic").trim();
  const text = `${input.topic ?? ""} ${input.wishes ?? ""}`;
  if (input.ground?.tiny) return "tiny";
  if (volume === "short" || detectShortBookAsk(text)) return "short";
  if (volume === "novel" || NOVEL_ASK.test(text)) return "novel";
  return BOOK_PLAN[volume] ? volume : "classic";
}

export interface BookEstimate {
  /** the volume key the loom will obey */
  volumeKey: string;
  /** the plan's honest span of pages */
  pagesMin: number;
  pagesMax: number;
  /** the visitor's own named length, when they spoke one (20–300) */
  askedPages: number;
  /** the price of one woven page at this depth and age */
  perPage: number;
  depthKey: string;
  /** credits for the whole volume — the honest band */
  creditsMin: number;
  creditsMax: number;
  /** the weaving strides (the six-page background breath) */
  stridesMin: number;
  stridesMax: number;
  /** the price of one stride, roughly */
  perStride: number;
}

/** THE WEIGHING — the whole volume's honest price band, before the
    first word is asked for. The visitor sees THIS before the loom
    begins; the loom then draws only what it weaves. */
export function estimateBookCredits(input: {
  volume?: string | null;
  level?: string | null;
  age?: string | null;
  topic?: string | null;
  wishes?: string | null;
  pages?: number | null;
  ground?: GroundLaw | null;
}): BookEstimate {
  const volumeKey = volumeKeyOf(input);
  const plan = BOOK_PLAN[volumeKey] ?? BOOK_PLAN.classic;
  const askedPages =
    typeof input.pages === "number" && input.pages >= 20 && input.pages <= 300
      ? Math.floor(input.pages)
      : 0;
  const pagesMin = askedPages || plan.min;
  const pagesMax = askedPages || plan.max;
  const perPage = perPageCredits(input.level, input.age);
  /* the whole volume's band — one page costs what one page costs,
     whether the loom weaves it tomorrow or next week */
  const creditsMin = Math.max(1, Math.ceil(pagesMin * perPage));
  const creditsMax = Math.max(creditsMin, Math.ceil(pagesMax * perPage));
  /* the strides — the background breath carries six pages at a time */
  const strideSpan = 6;
  const stridesMin = Math.max(1, Math.ceil(pagesMin / strideSpan));
  const stridesMax = Math.max(stridesMin, Math.ceil(pagesMax / strideSpan));
  const perStride = Math.max(1, Math.ceil(perPage * strideSpan));
  return {
    volumeKey,
    pagesMin,
    pagesMax,
    askedPages,
    perPage,
    depthKey: depthKeyOf(input.level),
    creditsMin,
    creditsMax,
    stridesMin,
    stridesMax,
    perStride,
  };
}
