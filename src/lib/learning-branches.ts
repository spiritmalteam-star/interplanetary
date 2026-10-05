/* ------------------------------------------------------------------ */
/*  THE LEARNING BRANCHES — the shared law of the evolved tree.        */
/*                                                                     */
/*  The Mirror Entity (M.E) Laboratory's suggestion system is a        */
/*  learning companion, not an engagement engine: every generative     */
/*  branch belongs to one of seven movements, carries its reason,      */
/*  and sometimes the truest branch is the PAUSE — stay with what      */
/*  you just learned instead of opening another door.                  */
/*                                                                     */
/*  This module is client-safe: the tree, the reply branches and the   */
/*  learning memory all speak through it.                              */
/* ------------------------------------------------------------------ */

/** The six learning movements — and the seventh state, the pause. */
export type BranchType =
  | "deepen"
  | "connect"
  | "contrast"
  | "apply"
  | "create"
  | "reflect"
  | "pause";

/** One generative branch: what to ask, which movement it serves, why it appeared. */
export interface LearnedBranch {
  type: BranchType;
  question: string;
  /** The honest reason this branch grew here — shown as its title. */
  reason?: string;
}

export function isBranchType(v: unknown): v is BranchType {
  return (
    v === "deepen" ||
    v === "connect" ||
    v === "contrast" ||
    v === "apply" ||
    v === "create" ||
    v === "reflect" ||
    v === "pause"
  );
}

/** The i18n keys each movement's mark is spoken through. */
export const BRANCH_TYPE_LABELS: Record<BranchType, string> = {
  deepen: "Deepen",
  connect: "Connect",
  contrast: "Contrast",
  apply: "Apply",
  create: "Create",
  reflect: "Reflect",
  pause: "Pause & integrate",
};

/**
 * Tolerant parser for the branch engine's reply — accepts the typed
 * `branches` shape first, and falls back to the older plain `buds`
 * strings (they ride as quiet deepenings).
 */
export function parseBranchesPayload(data: unknown): LearnedBranch[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as { branches?: unknown; buds?: unknown };
  const out: LearnedBranch[] = [];
  if (Array.isArray(obj.branches)) {
    for (const b of obj.branches) {
      if (!b || typeof b !== "object") continue;
      const rec = b as { type?: unknown; question?: unknown; reason?: unknown };
      if (typeof rec.question !== "string") continue;
      const q = rec.question.trim();
      if (q.length < 8 || q.length > 200) continue;
      out.push({
        type: isBranchType(rec.type) ? rec.type : "deepen",
        question: q,
        reason:
          typeof rec.reason === "string" && rec.reason.trim()
            ? rec.reason.trim().slice(0, 160)
            : undefined,
      });
    }
  } else if (Array.isArray(obj.buds)) {
    for (const q of obj.buds) {
      if (typeof q === "string" && q.trim().length >= 8)
        out.push({ type: "deepen", question: q.trim() });
    }
  }
  return out;
}

/* ------------------- the anti-bait law (client ear) ------------------ */
/*  Never a cliffhanger, never urgency, never curiosity-gap bait. The   */
/*  server applies the same law before the branches ever travel.        */

const BAIT_PATTERNS: RegExp[] = [
  /you won'?t believe/i,
  /won'?t believe/i,
  /shocking/i,
  /\bsecret of\b/i,
  /\bsecrets? (?:they|nobody)/i,
  /click here/i,
  /don'?t stop now/i,
  /keep exploring/i,
  /one more (?:discovery|click|reveal)/i,
  /wait until you/i,
  /\burgen[tcy]/i,
  /before it'?s (?:too late|gone)/i,
  /this will change everything/i,
  /what happens next will/i,
];

export function isBait(text: string): boolean {
  return BAIT_PATTERNS.some((re) => re.test(text));
}

/* ------------------- the learning memory (light) -------------------- */
/*  A small private memory of what has already been offered and which   */
/*  movements the visitor walked — used ONLY to avoid repetition and    */
/*  to prefer what serves understanding next. Never a profile, never    */
/*  a diagnosis: the visitor decides what anything means.               */
/*                                                                     */
/*  The memory is IDENTITY-KEYED: a signed-in visitor keeps their own   */
/*  grove (so the tree never repeats itself for them), a guest keeps    */
/*  the anonymous one. Guests' heard whispers merge into the signed-in  */
/*  memory, so nothing is ever offered twice.                           */

const LEARNING_KEY = "mirror-learning-state";
const SEEN_CAP = 240;
const OPENED_CAP = 80;

interface StoredLearning {
  seen: string[];
  opened: { type: BranchType; at: number }[];
}

/* the current identity — "anon" until the visitor signs in */
let CURRENT_UID = "anon";
const IDENTITY_EVENT = "mirror-learning-identity";

/** Called once the app knows who the visitor is (their email, or anon). */
export function setLearningIdentity(uid: string): void {
  if (typeof window === "undefined") return;
  const next = uid.trim() ? uid : "anon";
  if (next === CURRENT_UID) return;
  CURRENT_UID = next;
  /* guests' heard whispers carry into the signed-in memory */
  if (next !== "anon") {
    try {
      const guestRaw = window.localStorage.getItem(keyFor("anon"));
      if (guestRaw) {
        const guest = JSON.parse(guestRaw) as Partial<StoredLearning>;
        if (Array.isArray(guest.seen) && guest.seen.length > 0)
          recordSeen(guest.seen);
      }
    } catch {
      /* quiet */
    }
  }
  window.dispatchEvent(new CustomEvent(IDENTITY_EVENT));
}

export function getLearningIdentity(): string {
  return CURRENT_UID;
}

function keyFor(uid: string): string {
  return `${LEARNING_KEY}:${uid}`;
}

export function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(CURRENT_UID));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredLearning>;
    return Array.isArray(parsed.seen) ? parsed.seen.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Remember offered branches so the tree never repeats itself. */
export function recordSeen(texts: string[]): void {
  if (typeof window === "undefined" || texts.length === 0) return;
  try {
    const fresh = texts.map((t) => t.trim()).filter(Boolean);
    const merged = [...fresh, ...loadSeen()]
      .map((t) => (t.length > 180 ? t.slice(0, 180) : t));
    const unique: string[] = [];
    const set = new Set<string>();
    for (const t of merged) {
      const k = t.toLowerCase();
      if (!set.has(k)) {
        set.add(k);
        unique.push(t);
      }
      if (unique.length >= SEEN_CAP) break;
    }
    const opened = loadOpened();
    window.localStorage.setItem(
      keyFor(CURRENT_UID),
      JSON.stringify({ seen: unique, opened } satisfies StoredLearning)
    );
  } catch {
    /* the browser's keeping is full — the session still holds */
  }
}

function loadOpened(): { type: BranchType; at: number }[] {
  try {
    const raw = window.localStorage.getItem(keyFor(CURRENT_UID));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<StoredLearning>;
    return Array.isArray(parsed.opened)
      ? parsed.opened
          .filter((o) => o && isBranchType(o.type))
          .slice(0, OPENED_CAP)
      : [];
  } catch {
    return [];
  }
}

/** Remember which movements were walked — knowledge before novelty. */
export function recordOpened(type: BranchType): void {
  if (typeof window === "undefined") return;
  try {
    const opened = [{ type, at: Date.now() }, ...loadOpened()].slice(0, OPENED_CAP);
    const seen = loadSeen();
    window.localStorage.setItem(
      keyFor(CURRENT_UID),
      JSON.stringify({ seen, opened } satisfies StoredLearning)
    );
  } catch {
    /* quiet */
  }
}

/* ------------------- the DNA evolutionary timeline ------------------- */
/*  While the visitor chases the branches — every leading branch the    */
/*  conversation arrives at, every scope bloomed, every whisper picked  */
/*  — the walk is kept as a quiet line of steps. The tree renders it    */
/*  as a double helix: each rung one moment of the journey, colored     */
/*  by the branch it belonged to. Never a profile: a map of the walk,   */
/*  kept so the visitor can see the shape of their own curiosity.       */

export interface JourneyStep {
  /** The branch id (or "channeling") of the step. */
  b: string;
  /** The scope's label key, when the step happened inside a scope. */
  s?: string;
  at: number;
}

const JOURNEY_KEY = "mirror-dna-timeline";
const JOURNEY_CAP = 72;
const JOURNEY_EVENT = "mirror-dna-update";

export function loadJourney(): JourneyStep[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(JOURNEY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is JourneyStep =>
          !!p && typeof p === "object" && typeof (p as JourneyStep).b === "string" && typeof (p as JourneyStep).at === "number"
      )
      .slice(0, JOURNEY_CAP);
  } catch {
    return [];
  }
}

/** One step of the walk — consecutive repeats inside a minute rest as one. */
export function recordJourney(step: { b: string; s?: string }): void {
  if (typeof window === "undefined" || !step.b) return;
  try {
    const walk = loadJourney();
    const last = walk[0];
    const fresh: JourneyStep = { b: step.b, s: step.s, at: Date.now() };
    if (
      last &&
      last.b === fresh.b &&
      (last.s ?? "") === (fresh.s ?? "") &&
      fresh.at - last.at < 90_000
    )
      return;
    const next = [fresh, ...walk].slice(0, JOURNEY_CAP);
    window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(JOURNEY_EVENT));
  } catch {
    /* quiet */
  }
}

/** The event the tree listens to — the helix redraws on every step. */
export const DNA_UPDATE_EVENT = JOURNEY_EVENT;
export const LEARNING_IDENTITY_EVENT = IDENTITY_EVENT;

/* ------------------- the hub link ----------------------------------- */
/*  The reply branches are linked with the big hub of branches: this    */
/*  event asks the living tree to drift its window to a branch.         */

export const TREE_DRIFT_EVENT = "mirror:tree-drift";
/** A drift may also name the channeling branch itself. */
export const CHANNELING_BRANCH = "channeling" as const;

export function driftTreeTo(branch: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TREE_DRIFT_EVENT, { detail: { branch } })
  );
}
