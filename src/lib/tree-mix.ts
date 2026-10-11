/* --------------------------------------------------------------------
   THE TREE MIX — the compass's memory, shared by every surface that
   speaks the house's proportions: the living tree's kategories, the
   Laboratory's settings and the profile's own settings room.

   THE GENERAL LAW. The tree's default branch is GENERAL: every
   family's whispers woven into one connected grove. The mix — fifty
   percent interplanetary, twenty percent quantum, and so on — decides
   which suggestions appear more often. The mix persists on the
   visitor's own device: the whole app is the walk. */

import { TREE_FAMILIES } from "@/lib/data/suggestion-banks";

export interface TreeMix {
  on: string[];
  weights: Record<string, number>;
}

export const MIX_STORE_KEY = "mirror:tree-mix";

export function allFamilyKeys(): string[] {
  return TREE_FAMILIES.map((f) => f.key);
}

export function evenWeights(): Record<string, number> {
  const w: Record<string, number> = {};
  for (const f of TREE_FAMILIES) w[f.key] = 1;
  return w;
}

export function defaultTreeMix(): TreeMix {
  return { on: allFamilyKeys(), weights: evenWeights() };
}

export function loadTreeMix(): TreeMix | null {
  try {
    const raw = window.localStorage.getItem(MIX_STORE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TreeMix;
    if (!v || !Array.isArray(v.on) || !v.weights) return null;
    const on = v.on.filter((k) => TREE_FAMILIES.some((f) => f.key === k));
    if (on.length === 0) return null;
    const weights: Record<string, number> = {};
    for (const f of TREE_FAMILIES) {
      const n = Number(v.weights[f.key]);
      weights[f.key] =
        Number.isFinite(n) && n > 0 ? Math.min(100, Math.round(n)) : 0;
    }
    if (!on.some((k) => (weights[k] ?? 0) > 0)) return null;
    return { on, weights };
  } catch {
    return null;
  }
}

export function saveTreeMix(m: TreeMix) {
  try {
    window.localStorage.setItem(MIX_STORE_KEY, JSON.stringify(m));
  } catch {
    /* quiet — the mix is a preference, never a promise */
  }
}

/** True when the mix is the whole house in even voices — GENERAL. */
export function mixIsGeneral(m: TreeMix): boolean {
  const ws = TREE_FAMILIES.map((f) =>
    m.on.includes(f.key) ? (m.weights[f.key] ?? 0) : 0
  );
  return ws.every((w) => w > 0) && new Set(ws).size === 1;
}

/** The compass's word for where the walk stands — GENERAL, or the
    families the mix carries, named and counted. */
export function mixTitle(m: TreeMix, t: (k: string) => string): string {
  if (mixIsGeneral(m)) return t("General");
  const onFams = TREE_FAMILIES.filter(
    (f) => m.on.includes(f.key) && (m.weights[f.key] ?? 0) > 0
  );
  if (onFams.length === 0) return t("General");
  const names = onFams
    .slice(0, 2)
    .map((f) => t(familyLabelKeys[f.key] ?? f.key));
  return (
    names.join(" · ") + (onFams.length > 2 ? ` +${onFams.length - 2}` : "")
  );
}

/* -------- the family's own light — rope + section, one text ----------
   Each chip and each rope wears its family's color through the
   --chip-a custom property; the words always wear the house's one
   text color. */

export const familyLabelKeys: Record<string, string> = {
  interplanetary: "Interplanetary",
  manifest: "Manifest",
  quantum: "Quantum",
  evolvemed: "Evolve Med",
  invent: "Invent",
  healing: "Healing",
  artx: "Art X",
};

/** The live percentage of one family inside the standing mix — the
    number the kategories panel and both settings rooms speak. */
export function familyShare(
  m: TreeMix,
  key: string
): { on: boolean; pct: number } {
  const w = m.weights[key] ?? 0;
  const on = m.on.includes(key) && w > 0;
  const sum =
    TREE_FAMILIES.reduce(
      (a, x) => a + (m.on.includes(x.key) ? (m.weights[x.key] ?? 0) : 0),
      0
    ) || 1;
  return { on, pct: on ? Math.round((w / sum) * 100) : 0 };
}

/* THE MIX — the slider's word is law: how much of each family the
   grove carries, and which suggestions visit more often. The house
   rescales around every word: raising one family to fifty percent
   makes the whole house speak fifty percent of it, the rest sharing
   what remains in their own proportions. */
export function setFamilyWeightInMix(
  m: TreeMix,
  key: string,
  v: number
): TreeMix {
  const value = Math.max(0, Math.min(100, Math.round(v)));
  if (value <= 0) {
    /* the family rests — the others keep their proportions; the
       walk never walks empty (the last family always stays) */
    const weights = { ...m.weights, [key]: 0 };
    const remaining = TREE_FAMILIES.filter(
      (f) => f.key !== key && (weights[f.key] ?? 0) > 0
    );
    if (remaining.length === 0) {
      return { on: [key], weights: { ...weights, [key]: 1 } };
    }
    return {
      on: remaining.map((f) => f.key),
      weights,
    };
  }
  const rest = 100 - value;
  const others = TREE_FAMILIES.filter((f) => f.key !== key);
  const onOthers = others.filter((f) => (m.weights[f.key] ?? 0) > 0);
  const weights: Record<string, number> = { [key]: value };
  if (onOthers.length > 0) {
    const sumOthers = onOthers.reduce(
      (a, f) => a + (m.weights[f.key] ?? 0),
      0
    );
    for (const f of onOthers) {
      weights[f.key] = Math.max(
        1,
        Math.round(((m.weights[f.key] ?? 0) / sumOthers) * rest)
      );
    }
  } else {
    const even = Math.max(1, Math.round(rest / others.length));
    for (const f of others) weights[f.key] = even;
  }
  /* families already resting stay resting */
  for (const f of others)
    if (!(f.key in weights)) weights[f.key] = 0;
  return {
    on: TREE_FAMILIES.filter((f) => (weights[f.key] ?? 0) > 0).map(
      (f) => f.key
    ),
    weights,
  };
}
