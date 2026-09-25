"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Layers,
  Search,
  Orbit,
  X,
} from "lucide-react";
import {
  archiveTotals,
  findDossier,
  useMirror,
} from "@/lib/mirror-store";
import {
  civEntities,
} from "@/lib/data/entities-civ";
import { interdimEntities } from "@/lib/data/entities-interdim";
import { civilizations } from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { entityImage } from "@/lib/entity-utils";
import { entityRegistryLine } from "@/lib/entity-profile";
import { useT } from "@/lib/i18n";
import type { DossierKind, EntityDossier } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";

const BATCH = 60;

const REGISTER_META: Record<
  DossierKind,
  {
    title: string;
    subtitle: string;
    groupLabel: string;
    groups: { id: string; name: string; count: number }[];
  }
> = {
  civilization: {
    title: "Full Register — Named Civilizations",
    subtitle:
      "Every catalogued representative of the star families. Nothing summarized, nothing hidden — reveal them all the way down to the last name.",
    groupLabel: "Families",
    groups: civilizations.map((c) => ({ id: c.id, name: c.name, count: c.count })),
  },
  interdim: {
    title: "Full Register — Interdimensional Presences",
    subtitle:
      "Every catalogued presence of the subtle orders. Nothing summarized, nothing hidden — reveal them all the way down to the last name.",
    groupLabel: "Orders",
    groups: interdimensional.map((o) => ({ id: o.id, name: o.name, count: o.count })),
  },
};

function RegisterRow({
  rep,
  kind,
}: {
  rep: EntityDossier;
  kind: DossierKind;
}) {
  const openModal = useMirror((s) => s.openModal);
  const group = useMemo(() => findDossier(kind, rep.groupId), [kind, rep.groupId]);

  return (
    <li>
      <button
        type="button"
        onClick={() => openModal({ type: "entity", kind, id: rep.id })}
        className="focus-glow group flex w-full items-center gap-3.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-3 text-left transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:glow-sm"
      >
        <span
          className="relative size-12 shrink-0 overflow-hidden rounded-xl border hairline"
          aria-hidden="true"
        >
          <img
            src={entityImage(rep.id)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[16px] font-semibold leading-tight text-foreground transition-colors group-hover:text-[var(--cy)]">
              {rep.name}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground/55">
              {entityRegistryLine(rep, kind)}
            </span>
          </span>
          <span className="mt-1 block truncate text-[14px] text-muted-foreground">
            {group?.name} · {rep.origin} · {rep.density}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] italic leading-relaxed text-foreground/65">
            {rep.specialty}
          </span>
        </span>
        <Orbit
          className="size-4 shrink-0 text-muted-foreground/30 transition-colors duration-300 group-hover:text-[var(--cy)]"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

export function ArchiveRegister() {
  const registerKind = useMirror((s) => s.registerKind);
  const openRegister = useMirror((s) => s.openRegister);
  const exitRegister = useMirror((s) => s.exitRegister);
  const t = useT();

  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(BATCH);
  const [prevContext, setPrevContext] = useState(`|`);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset the reveal window whenever the filter context changes —
  // adjusted during render (no effect needed).
  const context = `${registerKind}|${groupId}|${query}`;
  if (context !== prevContext) {
    setPrevContext(context);
    setRevealed(BATCH);
  }

  const meta = REGISTER_META[registerKind];
  const total = registerKind === "civilization" ? archiveTotals.civilizations : archiveTotals.interdim;
  const source = registerKind === "civilization" ? civEntities : interdimEntities;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((e) => {
      if (groupId && e.groupId !== groupId) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.origin.toLowerCase().includes(q) ||
        e.specialty.toLowerCase().includes(q)
      );
    });
  }, [source, query, groupId]);

  // Sentinel auto-load
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed((r) => (r < filtered.length ? Math.min(r + BATCH, filtered.length) : r));
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, revealed);
  const groupChips = meta.groups;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t(meta.title)}
      className="mx-auto w-full max-w-[860px] px-1 pb-8 pt-8 sm:pt-10"
    >
      {/* header */}
      <div className="text-center">
        <span className="mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[10.5px] text-muted-foreground">
          <Layers className="size-3" aria-hidden="true" />
          {t("Mirror archive · full register")}
        </span>
        <h1 className="hero-text mt-3 text-[24px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px]">
          {t(meta.title)}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[560px] text-[14.5px] leading-relaxed text-muted-foreground">
          {t(meta.subtitle)}
        </p>
      </div>

      {/* exact counters */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {total}
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t("named entries · exact")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {groupChips.length}
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t(meta.groupLabel).toLowerCase()} {t("catalogued")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p
            className={cn(
              "font-mono text-[18px] font-semibold tabular-nums sm:text-[22px]",
              revealed >= filtered.length ? "text-[var(--ok)]" : "text-foreground"
            )}
          >
            {revealed}
            <span className="text-[14px] text-muted-foreground">/{filtered.length}</span>
          </p>
          <p className="mono-label mt-1 text-[9.5px] text-muted-foreground">
            {t("revealed on this page")}
          </p>
        </div>
      </div>

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
            placeholder={t("Search all names, origins, specialties…")}
            aria-label={
              registerKind === "civilization"
                ? t("Search the full civilization register")
                : t("Search the full interdimensional register")
            }
            className="focus-glow h-10 w-full rounded-xl border hairline bg-transparent pl-10 pr-9 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("Clear register search")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setGroupId(null)}
            aria-pressed={groupId === null}
            className={cn(
              "focus-glow mono-label rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
              groupId === null
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {t("All {label} ({n})", {
              label: t(meta.groupLabel).toLowerCase(),
              n: total,
            })}
          </button>
          {groupChips.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(groupId === g.id ? null : g.id)}
              aria-pressed={groupId === g.id}
              className={cn(
                "focus-glow mono-label rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
                groupId === g.id
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
            >
              {g.name.replace(/ (Family|Lineages|Collective|Council|Descendants|Realms|Neighbors|Humanoids|Nations|Orders|Records|Keepers|Emanations|Frontier Worlds|Concordium|Gardeners|Archives|Ember Councils|Beings|Selves|Peoples|Minds|Assemblies|Custodians)$/i, "")} ({g.count})
            </button>
          ))}
        </div>
      </div>

      {/* result status line */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <BadgeCheck className="size-3.5 text-[var(--ok)]" aria-hidden="true" />
        <p className="mono-label text-[10.5px] text-muted-foreground/80">
          {revealed < filtered.length
            ? t("Revealed {a} of {b} — scroll to keep revealing", {
                a: revealed,
                b: filtered.length,
              })
            : t("All {n} entries revealed — the register is complete", {
                n: filtered.length,
              })}
        </p>
      </div>

      {/* list */}
      <ul className="mt-3 space-y-1.5" aria-live="polite">
        {shown.map((rep) => (
          <RegisterRow key={rep.id} rep={rep} kind={registerKind} />
        ))}
      </ul>

      {shown.length === 0 && (
        <div className="mt-6 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-6 py-10 text-center">
          <p className="text-[15px] text-foreground/85">
            {t("No entries match this filter.")}
          </p>
          <p className="mt-1.5 text-[13.5px] italic text-muted-foreground">
            {t(
              "Every name in the archive exists — try a softer search, or clear the filters."
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
            className="focus-glow rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            {t("Reveal {n} more", {
              n: Math.min(BATCH, filtered.length - revealed),
            })}
          </button>
          <button
            type="button"
            onClick={() => setRevealed(filtered.length)}
            className="focus-glow rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2 text-[14px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
          >
            {t("Reveal all {n}", { n: filtered.length })}
          </button>
        </div>
      )}

      {/* switch archive + back */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t hairline pt-6">
        <button
          type="button"
          onClick={exitRegister}
          className="focus-glow group flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
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
            openRegister(registerKind === "civilization" ? "interdim" : "civilization")
          }
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Layers className="size-3.5" aria-hidden="true" />
          {t("Switch to the {register}", {
            register:
              registerKind === "civilization"
                ? t("interdimensional register ({n})", {
                    n: archiveTotals.interdim,
                  })
                : t("civilization register ({n})", {
                    n: archiveTotals.civilizations,
                  }),
          })}
        </button>
      </div>
    </motion.section>
  );
}
