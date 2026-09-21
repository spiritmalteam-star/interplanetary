"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Flower2,
  PawPrint,
  Search,
  Sprout,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import {
  FAUNA_CLASSES,
  FLORA_LINEAGES,
  faunaSpecimens,
  floraSpecimens,
  faunaTotal,
  floraTotal,
  biologyTotal,
  specimenImage,
} from "@/lib/data/biology";
import { sectionImage } from "@/lib/entity-utils";
import { formatArchiveNumber, useT } from "@/lib/i18n";
import type { SpecimenKind } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";

const BATCH = 60;

/* One normalized row shape so a single renderer can serve both archives
   without union gymnastics — built once at module load (pure string work). */
interface SpecimenRow {
  id: string;
  name: string;
  registryNo: string;
  originName: string;
  groupId: string;
  groupLabel: string;
  artIndex: number;
}

const FAUNA_ROWS: SpecimenRow[] = faunaSpecimens.map((s) => ({
  id: s.id,
  name: s.name,
  registryNo: s.registryNo,
  originName: s.originName,
  groupId: s.classId,
  groupLabel: s.className,
  artIndex: s.artIndex,
}));

const FLORA_ROWS: SpecimenRow[] = floraSpecimens.map((s) => ({
  id: s.id,
  name: s.name,
  registryNo: s.registryNo,
  originName: s.originName,
  groupId: s.lineageId,
  groupLabel: s.lineage,
  artIndex: s.artIndex,
}));

const GROUP_COUNTS: Record<SpecimenKind, Map<string, number>> = {
  fauna: (() => {
    const m = new Map<string, number>();
    for (const r of FAUNA_ROWS) m.set(r.groupId, (m.get(r.groupId) ?? 0) + 1);
    return m;
  })(),
  flora: (() => {
    const m = new Map<string, number>();
    for (const r of FLORA_ROWS) m.set(r.groupId, (m.get(r.groupId) ?? 0) + 1);
    return m;
  })(),
};

/* ---------------- thumbnail (graceful onError fallback) ---------------- */

function SpecimenThumb({
  kind,
  artIndex,
  name,
}: {
  kind: SpecimenKind;
  artIndex: number;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border hairline bg-[color-mix(in_srgb,var(--ok)_8%,transparent)]"
      aria-hidden="true"
    >
      {failed ? (
        <span className="font-mono text-[14px] text-[var(--ok)]/80">
          {name.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <img
          src={specimenImage(kind, artIndex)}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

/* ---------------- one specimen row ---------------- */

function SpecimenRowButton({
  row,
  kind,
}: {
  row: SpecimenRow;
  kind: SpecimenKind;
}) {
  const openModal = useMirror((s) => s.openModal);
  const t = useT();

  return (
    <li>
      <button
        type="button"
        onClick={() => openModal({ type: "specimen", kind, id: row.id })}
        className="focus-glow group flex w-full items-center gap-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:glow-sm"
      >
        <SpecimenThumb kind={kind} artIndex={row.artIndex} name={row.name} />
        <span className="min-w-0 flex-1">
          <span className="truncate text-[13px] font-medium text-foreground transition-colors group-hover:text-[var(--ok)]">
            {row.name}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
            {t(row.groupLabel)} · {row.originName}
          </span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {row.registryNo}
        </span>
      </button>
    </li>
  );
}

/* ---------------- searchable / filterable / revealable body ---------------- */

function ExplorerBody({ kind }: { kind: SpecimenKind }) {
  const t = useT();
  const language = useMirror((s) => s.language);

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(BATCH);
  const [prevContext, setPrevContext] = useState(`|`);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset the reveal window whenever the filter context changes —
  // adjusted during render (no effect needed).
  const context = `${classFilter}|${query}`;
  if (context !== prevContext) {
    setPrevContext(context);
    setRevealed(BATCH);
  }

  const rows = kind === "fauna" ? FAUNA_ROWS : FLORA_ROWS;
  const total = kind === "fauna" ? faunaTotal : floraTotal;
  const groups = kind === "fauna" ? FAUNA_CLASSES : FLORA_LINEAGES;
  const groupCounts = GROUP_COUNTS[kind];
  const groupLabel = kind === "fauna" ? t("Classes") : t("Lineages");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (classFilter && r.groupId !== classFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.originName.toLowerCase().includes(q) ||
        r.registryNo.toLowerCase().includes(q) ||
        r.groupLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, query, classFilter]);

  // Sentinel auto-load
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed((r) =>
            r < filtered.length ? Math.min(r + BATCH, filtered.length) : r
          );
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, revealed);

  return (
    <>
      {/* controls */}
      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search the living archive…")}
            aria-label={t("Search the living archive")}
            className="focus-glow h-10 w-full rounded-xl border hairline bg-transparent pl-10 pr-9 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("Clear search")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setClassFilter(null)}
            aria-pressed={classFilter === null}
            className={cn(
              "focus-glow mono-label rounded-full border px-2.5 py-1 text-[8.5px] transition-all duration-300",
              classFilter === null
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-foreground"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {t("All {label} ({n})", {
              label: groupLabel.toLowerCase(),
              n: formatArchiveNumber(total, language),
            })}
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setClassFilter(classFilter === g.id ? null : g.id)}
              aria-pressed={classFilter === g.id}
              className={cn(
                "focus-glow mono-label rounded-full border px-2.5 py-1 text-[8.5px] transition-all duration-300",
                classFilter === g.id
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
            >
              {t(g.label)} ({groupCounts.get(g.id) ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* result status line */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <BadgeCheck className="size-3.5 text-[var(--ok)]" aria-hidden="true" />
        <p className="mono-label text-[8.5px] text-muted-foreground/80">
          {revealed < filtered.length
            ? t("Revealed {a} of {b} — scroll to keep revealing", {
                a: formatArchiveNumber(revealed, language),
                b: formatArchiveNumber(filtered.length, language),
              })
            : t("All {n} entries revealed — the register is complete", {
                n: formatArchiveNumber(filtered.length, language),
              })}
        </p>
      </div>

      {/* list */}
      <ul className="mt-3 space-y-1.5" aria-live="polite">
        {shown.map((row) => (
          <SpecimenRowButton key={row.id} row={row} kind={kind} />
        ))}
      </ul>

      {shown.length === 0 && (
        <div className="mt-6 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-6 py-10 text-center">
          <p className="text-[13.5px] text-foreground/85">
            {t(
              "No specimens match this search — every one of the {n} exists, try a shorter search.",
              { n: total }
            )}
          </p>
        </div>
      )}

      {/* sentinel + controls */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {revealed < filtered.length && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setRevealed((r) => Math.min(r + BATCH, filtered.length))}
            className="focus-glow rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            {t("Reveal {n} more", {
              n: Math.min(BATCH, filtered.length - revealed),
            })}
          </button>
          <button
            type="button"
            onClick={() => setRevealed(filtered.length)}
            className="focus-glow rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] px-4 py-2 text-[12px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
          >
            {t("Reveal all {n}", { n: filtered.length })}
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- the wing ---------------- */

export function BiologyExplorer() {
  const biologyKind = useMirror((s) => s.biologyKind);
  const setBiologyKind = useMirror((s) => s.setBiologyKind);
  const exitBiology = useMirror((s) => s.exitBiology);
  const language = useMirror((s) => s.language);
  const t = useT();

  const [bannerFailed, setBannerFailed] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t("Interplanetary Biology")}
      className="mx-auto w-full max-w-[860px] px-1 pb-8 pt-8 sm:pt-10"
    >
      {/* hero header — masked banner art behind the archive pill */}
      <div className="relative text-center">
        <div
          className="pointer-events-none absolute inset-x-0 -top-6 mx-auto h-[200px] max-w-[680px] sm:h-[240px]"
          aria-hidden="true"
        >
          {!bannerFailed && (
            <img
              src={sectionImage("bio-banner")}
              alt=""
              onError={() => setBannerFailed(true)}
              className="size-full object-cover opacity-[0.22] dark:opacity-[0.30]"
              style={{
                maskImage:
                  "radial-gradient(ellipse 75% 70% at 50% 42%, black 25%, transparent 72%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 70% at 50% 42%, black 25%, transparent 72%)",
              }}
            />
          )}
        </div>
        <div className="relative">
          <span className="mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[8.5px] text-muted-foreground">
            <Sprout className="size-3 text-[var(--ok)]" aria-hidden="true" />
            {t("The Living Archive")}
          </span>
          <h2 className="hero-text mt-3 text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]">
            {t("Interplanetary Biology")}
          </h2>
          <p className="mx-auto mt-2.5 max-w-[560px] text-[12.5px] leading-relaxed text-muted-foreground">
            {t(
              "Every catalogued being — {f} fauna and {fl} flora — carries its origin civilization, its field traits and its herbarium plate, exactly as the survey teams recorded it.",
              { f: formatArchiveNumber(faunaTotal, language), fl: formatArchiveNumber(floraTotal, language) }
            )}
          </p>
        </div>
      </div>

      {/* exact counters */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {formatArchiveNumber(faunaTotal, language)}
          </p>
          <p className="mono-label mt-1 text-[7.5px] text-muted-foreground">
            {t("Fauna species")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {formatArchiveNumber(floraTotal, language)}
          </p>
          <p className="mono-label mt-1 text-[7.5px] text-muted-foreground">
            {t("Flora species")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {formatArchiveNumber(biologyTotal, language)}
          </p>
          <p className="mono-label mt-1 text-[7.5px] text-muted-foreground">
            {t("Specimens catalogued")}
          </p>
        </div>
      </div>

      {/* kind switch */}
      <div
        className="mt-5 grid grid-cols-2 gap-1.5"
        role="tablist"
        aria-label={t("Living archive collections")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={biologyKind === "fauna"}
          onClick={() => setBiologyKind("fauna")}
          className={cn(
            "focus-glow flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            biologyKind === "fauna"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <PawPrint className="size-3 text-[var(--ok)]" aria-hidden="true" />
          {t("Fauna ({n})", { n: formatArchiveNumber(faunaTotal, language) })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={biologyKind === "flora"}
          onClick={() => setBiologyKind("flora")}
          className={cn(
            "focus-glow flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            biologyKind === "flora"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Flower2 className="size-3 text-[var(--ok)]" aria-hidden="true" />
          {t("Flora ({n})", { n: formatArchiveNumber(floraTotal, language) })}
        </button>
      </div>

      {/* keyed body — query / filter / reveal state resets per kind */}
      <ExplorerBody key={biologyKind} kind={biologyKind} />

      {/* footer actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t hairline pt-6">
        <button
          type="button"
          onClick={exitBiology}
          className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {t("Return to the Observatory")}
        </button>
        <button
          type="button"
          onClick={() =>
            setBiologyKind(biologyKind === "fauna" ? "flora" : "fauna")
          }
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          {biologyKind === "fauna" ? (
            <Flower2 className="size-3.5" aria-hidden="true" />
          ) : (
            <PawPrint className="size-3.5" aria-hidden="true" />
          )}
          {biologyKind === "fauna"
            ? t("Switch to the flora archive ({n})", {
                n: formatArchiveNumber(floraTotal, language),
              })
            : t("Switch to the fauna archive ({n})", {
                n: formatArchiveNumber(faunaTotal, language),
              })}
        </button>
      </div>
    </motion.section>
  );
}
