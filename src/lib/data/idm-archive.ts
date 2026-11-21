import recordsRaw from "./idm-archive.json";
import hashesRaw from "./idm-archive-hashes.json";

/* ------------------------------------------------------------------ */
/*  THE INTERDIMENSIONAL ARCHIVE — a sibling collection of the Codex.  */
/*                                                                     */
/*  Imported by scripts/import-idm-archive.mjs from the supplied       */
/*  packs (upsert by immutable id — re-running the import updates      */
/*  the same records and never duplicates them). Civilizations keep    */
/*  their own counters; this archive consumes none of them.            */
/*                                                                     */
/*  Four image roles per record — subject, locus, geometry,            */
/*  encounter — bound by (entityId, role) with a short sha256 of the   */
/*  served bytes as the cache/version key. Provenance is preserved:    */
/*  sourceKind separates the supplied unverified catalog records from  */
/*  the original speculative extensions.                               */
/* ------------------------------------------------------------------ */

export type IdmRole = "subject" | "locus" | "geometry" | "encounter";

export type IdmArchiveCategory =
  | "beings"
  | "portals"
  | "realms"
  | "flora"
  | "fauna";

export interface IdmArchiveRecord {
  id: string;
  name: string;
  category: IdmArchiveCategory;
  categoryLabel: string;
  archiveOrder: number;
  classification: string;
  dimensionality: string;
  resonanceSubstrate: string;
  phenomenologicalLocus: string;
  communicationMode: string;
  ontologicalStability: string;
  summary: string;
  phenomenologyAndEncounters: string;
  hyperGeometricAnatomy: string;
  cognitiveImpactAndMessages: string;
  pullQuote: string;
  quoteSource: string;
  sourceKind: string;
  provenance: string;
  relatedIds: string[];
  accentColor?: string | null;
  civilizationId: null;
  schemaVersion: string;
  archive: string;
  sourceRecord?: Record<string, unknown> | null;
}

export const idmArchiveRecords = (
  recordsRaw as IdmArchiveRecord[]
).slice().sort((a, b) => a.archiveOrder - b.archiveOrder || a.id.localeCompare(b.id));

const hashes = (hashesRaw as { hashes: Record<string, string> }).hashes ?? {};

/* the supplied-unverified records keep their catalog voice; the rest
   are the archive's own speculative extensions — both stay labelled */
export const idmSuppliedCount = idmArchiveRecords.filter(
  (r) => r.sourceKind === "supplied-unverified-catalog"
).length;

export const idmArchiveTotal = idmArchiveRecords.length;

export interface IdmCategoryMeta {
  id: IdmArchiveCategory;
  label: string;
  count: number;
}

export const idmCategories: IdmCategoryMeta[] = (
  ["beings", "portals", "realms", "flora", "fauna"] as const
).map((id) => ({
  id,
  label:
    id === "beings"
      ? "Beings"
      : id === "portals"
        ? "Portals"
        : id === "realms"
          ? "Realms"
          : id === "flora"
            ? "Flora"
            : "Fauna",
  count: idmArchiveRecords.filter((r) => r.category === id).length,
}));

export function findIdmRecord(id: string): IdmArchiveRecord | undefined {
  return idmArchiveRecords.find((r) => r.id === id);
}

/** role image URL — bound by (entityId, role), cache-keyed by the
    served bytes' own short sha256, never a shared fallback */
export function idmArchiveImage(eid: string, role: IdmRole): string | null {
  if (!hashes[`${eid}:${role}`]) return null;
  return `/idm-archive/${eid}/${role}.jpg?v=${hashes[`${eid}:${role}`]}`;
}

/** the record's own interface ornament (SVG), when present */
export function idmArchiveSymbol(eid: string): string | null {
  return hashes[`${eid}:subject`] ? `/idm-archive/${eid}/symbol.svg` : null;
}

/** related records resolved by exact id across the whole archive —
    a missing id stays itself, shown as unavailable, never replaced */
export function resolveIdmRelated(ids: string[]): IdmArchiveRecord[] {
  return ids
    .map((id) => findIdmRecord(id))
    .filter((r): r is IdmArchiveRecord => Boolean(r));
}

export const IDM_ROLE_LABELS: Record<IdmRole, string> = {
  subject: "Subject",
  locus: "Locus",
  geometry: "Geometry",
  encounter: "Encounter",
};

/* ---- the visitor's own keeping: the last card the archive showed --- */

const LAST_KEY = "mirror-codex-last";

export interface CodexLast {
  kind: string;
  id: string;
  at: number;
}

export function readCodexLast(): CodexLast | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CodexLast;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCodexLast(kind: string, id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LAST_KEY,
      JSON.stringify({ kind, id, at: Date.now() } satisfies CodexLast)
    );
  } catch {
    /* the device's keeping is full — the red thread simply rests */
  }
}
