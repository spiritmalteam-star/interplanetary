import type { DossierKind, EntityDossier, Scope } from "@/lib/mirror-types";
import { civEntities } from "@/lib/data/entities-civ";
import { interdimEntities } from "@/lib/data/entities-interdim";

/* ---------------- image path helpers ---------------- */
/* Every archive entity owns a unique AI-derived portrait at a
   deterministic path; section masters live under /images/ai. */

export function entityImage(id: string): string {
  return `/images/entities/${id}.jpg`;
}

export function groupImage(kind: DossierKind, groupId: string): string {
  return kind === "civilization"
    ? `/images/ai/fam-${groupId}.jpg`
    : `/images/ai/ord-${groupId}.jpg`;
}

export function sectionImage(key: string): string {
  return `/images/ai/${key}.jpg`;
}

/* ---------------- lookups ---------------- */

export function findEntity(
  kind: DossierKind,
  id: string
): EntityDossier | null {
  const source = kind === "civilization" ? civEntities : interdimEntities;
  return source.find((e) => e.id === id) ?? null;
}

/** Search named representatives across one archive (name / origin / specialty). */
export function searchEntities(
  kind: DossierKind,
  query: string,
  limit = 14
): EntityDossier[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const source = kind === "civilization" ? civEntities : interdimEntities;
  const results: EntityDossier[] = [];
  for (const e of source) {
    if (
      e.name.toLowerCase().includes(q) ||
      e.origin.toLowerCase().includes(q) ||
      e.specialty.toLowerCase().includes(q)
    ) {
      results.push(e);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/* ---------------- scope theme metadata ---------------- */

export type ScopeOrnament = "orbit" | "grid" | "wave" | "aura" | "alchemy";

export const SCOPE_META: Record<
  Scope,
  {
    label: string;
    tagline: string;
    imageKey: string;
    ornament: ScopeOrnament;
    glyph: string;
    phases: string[];
  }
> = {
  interplanetary: {
    label: "Interplanetary",
    tagline: "Star families · contact · support",
    imageKey: "mode-interplanetary",
    ornament: "orbit",
    glyph: "🌐",
    phases: [
      "Aligning receiver field…",
      "Gathering willing representatives…",
      "Opening the interplanetary channel…",
      "Weaving the transmission…",
    ],
  },
  science: {
    label: "Science",
    tagline: "Verified knowledge · honest wonder",
    imageKey: "mode-science",
    ornament: "grid",
    glyph: "🔬",
    phases: [
      "Calibrating instruments…",
      "Consulting the documented record…",
      "Separating evidence from speculation…",
      "Composing the reading…",
    ],
  },
  quantum: {
    label: "Quantum",
    tagline: "Observation · superposition · entanglement",
    imageKey: "mode-quantum",
    ornament: "wave",
    glyph: "☯",
    phases: [
      "Preparing the apparatus…",
      "Superposing candidate answers…",
      "Including the observer…",
      "Collapsing the wavefunction…",
    ],
  },
  healing: {
    label: "Healing",
    tagline: "Restoration · gentle frequencies only",
    imageKey: "mode-healing",
    ornament: "aura",
    glyph: "💚",
    phases: [
      "Warming the field…",
      "Softening the edges…",
      "Calling the gentle frequencies…",
      "Weaving the transmission…",
    ],
  },
  manifesting: {
    label: "Manifesting",
    tagline: "Intention · resonance · creation",
    imageKey: "lab-chamber",
    ornament: "alchemy",
    glyph: "◆",
    phases: [
      "Sealing the chamber…",
      "Charging the sigil…",
      "Consulting the alchemical record…",
      "Drawing the blueprint…",
    ],
  },
};
