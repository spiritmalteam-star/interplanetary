"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Fingerprint,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  Orbit,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  archiveTotals,
  findDossier,
  useMirror,
} from "@/lib/mirror-store";
import {
  civEntities,
} from "@/lib/data/entities-civ";
import { interdimEntities } from "@/lib/data/entities-interdim";
import { innerEarth } from "@/lib/data/inner-earth";
import { civilizations } from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { idmArchiveTotal } from "@/lib/data/idm-archive";
import { IdmArchiveBrowser } from "./IdmArchiveBrowser";
import { entityImage } from "@/lib/entity-utils";
import { entityRegistryLine } from "@/lib/entity-profile";
import { useT } from "@/lib/i18n";
import type { DossierKind, EntityDossier } from "@/lib/mirror-types";
import type { RegisterKind } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

const BATCH = 60;

/* The codex's third register — the hyperspace ledger: the hidden
   orders beneath the crust and beyond the veil, carried in the same
   row shape as the star families so one reader serves all three. */
interface HyperspaceRow {
  id: string;
  groupId: string;
  name: string;
  origin: string;
  density: string;
  specialty: string;
  signal: string;
}

const hyperspaceRows: HyperspaceRow[] = innerEarth.map((sp) => ({
  id: sp.id,
  groupId: "inner-earth",
  name: sp.name,
  origin: "Inner Earth",
  density: "3D – 5D thresholds",
  specialty: sp.gift,
  signal: sp.form,
}));

const REGISTER_META: Record<
  Exclude<RegisterKind, "archive">,
  {
    title: string;
    subtitle: string;
    groupLabel: string;
    groups: { id: string; name: string; count: number }[];
    /** The second counter's own word (the codex's three registers all
        carry exact counts — the hyperspace ledger counts one realm). */
    realms?: number;
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
  hyperspace: {
    title: "Full Register — Hyperspace & the Hidden Orders",
    subtitle:
      "The fifty-nine peoples of the deep crust and the threshold orders beyond the veil — every one named, every gift kept whole.",
    groupLabel: "Realms",
    groups: [],
    realms: 1,
  },
};

/* THE CODEX'S OWN PAGES — the register reveals itself in leaves of
   sixty names; the page hands let the visitor stand on any leaf of
   the codex without walking the whole shore (the visitor named the
   numbers: type a page, land on it). */
const REGISTER_PAGE_SIZE = BATCH;

/** the page chips around the standing page — first, last, the chosen
    leaf and its two neighbours, an ellipsis where a gap opens */
function registerPageChips(
  page: number,
  total: number
): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set<number>([1, total, page]);
  if (page - 1 > 1) wanted.add(page - 1);
  if (page + 1 < total) wanted.add(page + 1);
  if (page <= 3) {
    wanted.add(2);
    wanted.add(3);
  }
  if (page >= total - 2) {
    wanted.add(total - 1);
    wanted.add(total - 2);
  }
  const sorted = [...wanted].sort((a, b) => a - b);
  const chips: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) chips.push("gap");
    chips.push(p);
    prev = p;
  }
  return chips;
}
/* The codex's top rail — the three registers stand side by side, and
   the interdimensional door lives HERE, at the codex, exactly where
   the hyperspace ledger stands beside it. */
const KIND_TABS: {
  kind: RegisterKind;
  label: string;
  count: number;
}[] = [
  { kind: "civilization", label: "Civilisations", count: archiveTotals.civilizations },
  { kind: "interdim", label: "Interdimensional", count: archiveTotals.interdim },
  { kind: "hyperspace", label: "Hyperspace", count: archiveTotals.innerearth },
  { kind: "archive", label: "Exobiologica", count: idmArchiveTotal },
];

function RegisterRow({
  rep,
  kind,
  isLastViewed,
}: {
  rep: EntityDossier | HyperspaceRow;
  kind: RegisterKind;
  isLastViewed: boolean;
}) {
  const openModal = useMirror((s) => s.openModal);
  const markCodexViewed = useMirror((s) => s.markCodexViewed);
  const group = useMemo(
    () =>
      kind === "hyperspace"
        ? null
        : findDossier(kind as DossierKind, rep.groupId),
    [kind, rep.groupId]
  );

  return (
    <li className="relative">
      {isLastViewed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[calc(100%-14px)] w-[3px] -translate-y-1/2 rounded-full bg-red-500 dark:bg-red-400"
        />
      )}
      <button
        type="button"
        onClick={() => {
          markCodexViewed(kind, rep.id);
          openModal(
            kind === "hyperspace"
              ? { type: "hyperspace", id: rep.id }
              : { type: "entity", kind: kind as DossierKind, id: rep.id }
          );
        }}
        className="focus-glow group flex w-full items-center gap-3.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-3 text-left transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:glow-sm"
      >
        <span
          className="relative size-12 shrink-0 overflow-hidden rounded-xl border hairline"
          aria-hidden="true"
        >
          {kind === "hyperspace" ? (
            <span className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--gd)_14%,transparent)] font-mono text-[15px] text-foreground/70">
              ✶
            </span>
          ) : (
            <img
              src={entityImage(rep.id)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[17px] font-semibold leading-tight text-foreground transition-colors group-hover:text-[var(--cy)]">
              {rep.name}
            </span>
            {isLastViewed && (
              <span className="mono-label shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                last viewed
              </span>
            )}
            <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground/55">
              {kind === "hyperspace"
                ? `ME-HYP · inner earth`
                : entityRegistryLine(rep as EntityDossier, kind as DossierKind)}
            </span>
          </span>
          <span className="mt-1 block truncate text-[14px] text-muted-foreground">
            {group ? `${group.name} · ` : ""}
            {rep.origin} · {rep.density}
          </span>
          <span className="mt-0.5 block truncate text-[14.5px] italic leading-relaxed text-foreground/65">
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
  const codexLastViewed = useMirror((s) => s.codexLastViewed);
  const markCodexViewed = useMirror((s) => s.markCodexViewed);
  const openModal = useMirror((s) => s.openModal);
  const t = useT();

  /* THE SIBLING COLLECTION — the Interdimensional Archive is its own
     browser with its own laws (the roll, the red thread, the turn
     from the top); it never bends the register list beneath it. */
  if (registerKind === "archive") {
    return (
      <IdmArchiveBrowser onExit={exitRegister} onSwitch={openRegister} />
    );
  }

  return (
    <ArchiveList registerKind={registerKind} />
  );
}

function ArchiveList({
  registerKind,
}: {
  registerKind: "civilization" | "interdim" | "hyperspace";
}) {
  const openRegister = useMirror((s) => s.openRegister);
  const exitRegister = useMirror((s) => s.exitRegister);
  const codexLastViewed = useMirror((s) => s.codexLastViewed);
  const markCodexViewed = useMirror((s) => s.markCodexViewed);
  const openModal = useMirror((s) => s.openModal);
  const t = useT();

  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(BATCH);
  const [prevContext, setPrevContext] = useState(`|`);
  const [jumpDraft, setJumpDraft] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Reset the reveal window whenever the filter context changes —
  // adjusted during render (no effect needed).
  const context = `${registerKind}|${groupId}|${query}`;
  if (context !== prevContext) {
    setPrevContext(context);
    setRevealed(BATCH);
  }

  const meta = REGISTER_META[registerKind];
  const total =
    registerKind === "civilization"
      ? archiveTotals.civilizations
      : registerKind === "interdim"
        ? archiveTotals.interdim
        : archiveTotals.innerearth;
  const source: (EntityDossier | HyperspaceRow)[] =
    registerKind === "civilization"
      ? civEntities
      : registerKind === "interdim"
        ? interdimEntities
        : hyperspaceRows;

  /* THE NUMBERED PROFILE — the codex keeps every profile in one exact
     order; the drop-down roll opens any number straight away, and the
     last-viewed profile wears the red mark. */
  const lastViewedIndex = useMemo(() => {
    if (!codexLastViewed || codexLastViewed.kind !== registerKind) return -1;
    return source.findIndex((e) => e.id === codexLastViewed.id);
  }, [codexLastViewed, registerKind, source]);

  const openProfileAt = (index: number) => {
    const rep = source[index];
    if (!rep) return;
    markCodexViewed(registerKind, rep.id);
    openModal(
      registerKind === "hyperspace"
        ? { type: "hyperspace", id: rep.id }
        : { type: "entity", kind: registerKind as DossierKind, id: rep.id }
    );
    /* THE NEXT LAW — the moment a profile is called, the codex shows
       it from the top: the page climbs back to its first word. */
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  };

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

  /* THE PAGE HANDS — the codex's own numbers: the standing page, the
     whole count, and the way to land on any leaf by chip or by hand */
  const totalPages = Math.max(1, Math.ceil(filtered.length / REGISTER_PAGE_SIZE));
  const standingPage = Math.min(
    totalPages,
    Math.max(1, Math.ceil(revealed / REGISTER_PAGE_SIZE))
  );
  const goToPage = (p: number) => {
    const leaf = Math.min(Math.max(1, Math.floor(p)), totalPages);
    if (leaf === standingPage) return;
    setRevealed(Math.min(leaf * REGISTER_PAGE_SIZE, filtered.length));
    /* the reader's eyes ride to the list's own top — the names begin
       where the numbers promise (the anchor stands above the list) */
    try {
      listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* an engine without smooth steps still carries the eyes */
    }
  };
  const submitJump = () => {
    const n = Number.parseInt(jumpDraft, 10);
    if (Number.isFinite(n) && n > 0) goToPage(n);
    setJumpDraft("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-label={t(meta.title)}
      className="nice-scroll h-full overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto w-full max-w-[860px] px-1 pb-8 pt-8 sm:pt-10">
      <div ref={topRef} aria-hidden="true" className="h-px" />
      {/* header */}
      <div className="text-center">
        <span className="mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[11.5px] text-muted-foreground">
          <Layers className="size-3" aria-hidden="true" />
          {t("Mirror archive · full register")}
        </span>
        <h1 className="hero-text mt-3 text-[25px] font-semibold leading-tight tracking-[-0.01em] sm:text-[29px]">
          {t(meta.title)}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[560px] text-[15.5px] leading-relaxed text-muted-foreground">
          {t(meta.subtitle)}
        </p>
      </div>

      {/* THE CODEX RAIL — the three registers side by side, then the
          numbered profile roll with its own red mark and hands */}
      <div
        className="mt-5 flex flex-col items-center gap-2.5 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 sm:px-4"
        data-testid="codex-rail"
      >
        <div
          className="flex w-full max-w-full flex-wrap items-stretch justify-center gap-1.5"
          role="tablist"
          aria-label={t("The codex registers")}
        >
          {KIND_TABS.map((tab) => {
            const active = registerKind === tab.kind;
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => openRegister(tab.kind)}
                data-testid={`codex-kind-${tab.kind}`}
                className={cn(
                  "focus-glow flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-300",
                  active
                    ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground"
                    : "hairline text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{t(tab.label)}</span>
                <span className="mono-label shrink-0 tabular-nums text-[9.5px] text-muted-foreground/75">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => openProfileAt(Math.max(0, lastViewedIndex - 1))}
            disabled={lastViewedIndex <= 0}
            aria-label={t("Previous profile")}
            title={t("Previous profile")}
            data-testid="codex-prev"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              data-testid="codex-profile-select"
              aria-label={t("Choose a profile by number")}
              title={t("Choose a profile by number")}
              className="focus-glow flex h-8 min-w-0 max-w-[min(320px,calc(100vw-9rem))] flex-1 items-center gap-2 rounded-full border px-3 text-[12.5px] hairline text-muted-foreground transition-all duration-300 hover:text-foreground data-[state=open]:border-[var(--hairline-active)]"
            >
              <span className="mono-label shrink-0 text-[9.5px] uppercase tracking-[0.14em]">
                {t("Profile №")}
              </span>
              <span className="min-w-0 flex-1 truncate text-left font-mono text-[12px] tabular-nums text-foreground/85">
                {lastViewedIndex >= 0
                  ? `${lastViewedIndex + 1} — ${source[lastViewedIndex]?.name ?? ""}`
                  : t("{n} profiles on the roll", { n: source.length })}
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={6}
              className="max-h-[min(460px,var(--radix-dropdown-menu-content-available-height))] w-[min(360px,calc(100vw-2rem))] overflow-y-auto nice-scroll"
            >
              {source.map((rep, i) => {
                const isLast = i === lastViewedIndex;
                return (
                  <DropdownMenuItem
                    key={rep.id}
                    onSelect={() => openProfileAt(i)}
                    data-testid={`codex-profile-item-${i + 1}`}
                    aria-pressed={isLast}
                    className={cn(
                      "items-baseline gap-2.5 rounded-lg px-2.5 py-1.5",
                      isLast && "bg-red-500/10"
                    )}
                  >
                    <span
                      className={cn(
                        "mono-label w-10 shrink-0 text-right text-[9.5px] tabular-nums",
                        isLast ? "text-red-600 dark:text-red-400" : "text-muted-foreground/60"
                      )}
                    >
                      № {i + 1}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-[12.5px]",
                        isLast
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : "text-foreground/85"
                      )}
                    >
                      {rep.name}
                    </span>
                    {isLast && (
                      <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                        {t("last viewed")}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => openProfileAt(lastViewedIndex + 1)}
            disabled={lastViewedIndex >= source.length - 1}
            aria-label={t("Next profile — shown from the top")}
            title={t("Next profile — shown from the top")}
            data-testid="codex-next"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] text-foreground transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* exact counters */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[19px] font-semibold tabular-nums text-foreground sm:text-[23px]">
            {total}
          </p>
          <p className="mono-label mt-1 text-[10.5px] text-muted-foreground">
            {t("named entries · exact")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p className="font-mono text-[18px] font-semibold tabular-nums text-foreground sm:text-[22px]">
            {registerKind === "hyperspace" ? (meta.realms ?? 1) : groupChips.length}
          </p>
          <p className="mono-label mt-1 text-[10.5px] text-muted-foreground">
            {t(meta.groupLabel).toLowerCase()} {t("catalogued")}
          </p>
        </div>
        <div className="rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-3 text-center">
          <p
            className={cn(
              "font-mono text-[19px] font-semibold tabular-nums sm:text-[23px]",
              revealed >= filtered.length ? "text-[var(--ok)]" : "text-foreground"
            )}
          >
            {Math.min(revealed, filtered.length)}
            <span className="text-[14px] text-muted-foreground">/{filtered.length}</span>
          </p>
          <p className="mono-label mt-1 text-[10.5px] text-muted-foreground">
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
                : registerKind === "interdim"
                  ? t("Search the full interdimensional register")
                  : t("Search the hyperspace register")
            }
            className="focus-glow h-9 w-full rounded-xl border hairline bg-transparent pl-10 pr-9 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:h-10 sm:text-[15.5px]"
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

        {groupChips.length > 0 && (
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
        )}
      </div>

      {/* THE CODEX'S OWN PAGES — the numbers at the register's top:
          one row of leaves (first · neighbours · last), a small hand
          that takes any page typed into it, and the way one leaf back
          or onward. No walk down the whole shore to reach a name. */}
      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
        data-testid="codex-page-hands"
      >
        <button
          type="button"
          onClick={() => goToPage(standingPage - 1)}
          disabled={standingPage <= 1}
          aria-label={t("The page before")}
          title={t("The page before")}
          className="focus-glow mono-label flex h-7 items-center rounded-full border px-2.5 text-[11px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        >
          ‹
        </button>
        {registerPageChips(standingPage, totalPages).map((chip, i) =>
          chip === "gap" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="mono-label px-0.5 text-[11px] text-muted-foreground/45"
            >
              …
            </span>
          ) : (
            <button
              key={chip}
              type="button"
              onClick={() => goToPage(chip)}
              aria-current={chip === standingPage ? "page" : undefined}
              aria-label={t("Codex page {n}", { n: chip })}
              title={t("Codex page {n}", { n: chip })}
              className={cn(
                "focus-glow mono-label flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 text-[11px] tabular-nums transition-all duration-300",
                chip === standingPage
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {chip}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => goToPage(standingPage + 1)}
          disabled={standingPage >= totalPages}
          aria-label={t("The page after")}
          title={t("The page after")}
          className="focus-glow mono-label flex h-7 items-center rounded-full border px-2.5 text-[11px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        >
          ›
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitJump();
          }}
          className="ml-1 flex items-center gap-1"
        >
          <label
            htmlFor="codex-page-jump"
            className="mono-label text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70"
          >
            {t("Page")}
          </label>
          <input
            id="codex-page-jump"
            type="number"
            min={1}
            max={totalPages}
            value={jumpDraft}
            onChange={(e) => setJumpDraft(e.target.value)}
            placeholder={String(standingPage)}
            aria-label={t("Jump to a codex page")}
            className="focus-glow h-7 w-14 rounded-full border hairline bg-transparent px-2 text-center font-mono text-[11.5px] tabular-nums text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t("Open that page")}
            title={t("Open that page")}
            className="focus-glow mono-label flex h-7 items-center rounded-full border hairline px-2.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            {t("Go")}
          </button>
        </form>
      </div>

      {/* result status line */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <BadgeCheck className="size-3.5 text-[var(--ok)]" aria-hidden="true" />
        <p className="mono-label text-[11.5px] text-muted-foreground/80">
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
      <div ref={listTopRef} aria-hidden="true" className="h-px scroll-mt-2" />
      <ul className="mt-3 space-y-1.5" aria-live="polite">
        {shown.map((rep) => (
          <RegisterRow
            key={rep.id}
            rep={rep}
            kind={registerKind}
            isLastViewed={
              codexLastViewed?.kind === registerKind &&
              codexLastViewed.id === rep.id
            }
          />
        ))}
      </ul>

      {shown.length === 0 && (
        <div className="mt-6 rounded-2xl border hairline bg-[var(--glass-bg-soft)] px-6 py-10 text-center">
          <p className="text-[16px] text-foreground/85">
            {t("No entries match this filter.")}
          </p>
          <p className="mt-1.5 text-[14.5px] italic text-muted-foreground">
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
            className="focus-glow rounded-full border hairline px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            {t("Reveal {n} more", {
              n: Math.min(BATCH, filtered.length - revealed),
            })}
          </button>
          <button
            type="button"
            onClick={() => setRevealed(filtered.length)}
            className="focus-glow rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2 text-[15px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
          >
            {t("Reveal all {n}", { n: filtered.length })}
          </button>
        </div>
      )}

      {/* switch archive — the per-room back has rested: THE ONE BACK
          (the workplace header's own hand) returns to the chat */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 border-t hairline pt-6">
        <button
          type="button"
          onClick={() =>
            openRegister(registerKind === "civilization" ? "interdim" : "civilization")
          }
          className="focus-glow flex items-center gap-2 rounded-full border hairline px-4 py-2 text-[15px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
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
        <button
          type="button"
          onClick={() => openRegister("archive")}
          data-testid="open-idm-archive"
          className="focus-glow flex items-center gap-2 rounded-full border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2 text-[14px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
        >
          <Fingerprint className="size-3.5" aria-hidden="true" />
          {t("Interdimensional Archive ({n})", { n: idmArchiveTotal })}
        </button>
      </div>
      </div>
    </motion.section>
  );
}
