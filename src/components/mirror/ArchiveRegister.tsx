"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Orbit,
  Search,
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
import { innerEarth } from "@/lib/data/inner-earth";
import { civilizations } from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { IdmArchiveBrowser } from "./IdmArchiveBrowser";
import { CodexTabs } from "./CodexTabs";
import { entityImage } from "@/lib/entity-utils";
import { entityRegistryLine, getEntityProfile } from "@/lib/entity-profile";
import { useT } from "@/lib/i18n";
import type { DossierKind, EntityDossier } from "@/lib/mirror-types";
import type { RegisterKind } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

const BATCH = 60;

/* THE DESK'S OWN LAW — the two-pane codex (list beside dossier) stands
   from the lg width up; below it the phone keeps the full leaves and
   the dossier over the room. One honest media listener, no layout
   thrash: the variant only changes when the width truly crosses. */
function useIsCodexDesk(): boolean {
  const [isDesk, setIsDesk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesk(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesk;
}

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

type ListKind = Exclude<RegisterKind, "archive">;

const REGISTER_META: Record<
  ListKind,
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
      "Every catalogued representative of the star families, kept by mirror intelligence. Nothing summarized, nothing hidden — reveal them all the way down to the last name.",
    groupLabel: "Families",
    groups: civilizations.map((c) => ({ id: c.id, name: c.name, count: c.count })),
  },
  interdim: {
    title: "Full Register — Interdimensional Presences",
    subtitle:
      "Every catalogued presence of the subtle orders, kept by mirror intelligence: patterns of experience named across traditions, mirrored faithfully and claimed as nothing the evidence cannot carry. Truth is kept whole; nothing is dressed as fantasy.",
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

/* ------------------------------------------------------------------ */
/*  THE REGISTER ROWS — full leaf (phone) and compact leaf (desktop    */
/*  pane): the same name, the same red thread on the last-viewed       */
/*  profile, two dresses for the two widths.                           */
/* ------------------------------------------------------------------ */

function RegisterRow({
  rep,
  kind,
  index,
  isLastViewed,
  variant,
}: {
  rep: EntityDossier | HyperspaceRow;
  kind: ListKind;
  index: number;
  isLastViewed: boolean;
  variant: "full" | "compact";
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

  const activate = () => {
    markCodexViewed(kind, rep.id);
    if (variant === "full") {
      /* the phone opens the dossier over the room; the desktop codex
         shows the standing profile in its own pane instead */
      openModal(
        kind === "hyperspace"
          ? { type: "hyperspace", id: rep.id }
          : { type: "entity", kind: kind as DossierKind, id: rep.id }
      );
    }
  };

  if (variant === "compact") {
    return (
      <li className="relative" id={`codex-row-${rep.id}`}>
        {isLastViewed && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-[70%] w-[2.5px] -translate-y-1/2 rounded-full bg-red-500 dark:bg-red-400"
          />
        )}
        <button
          type="button"
          onClick={activate}
          title={`${rep.origin} · ${rep.specialty}`}
          className="focus-glow group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-all duration-200 hover:border-[var(--hairline)] hover:bg-[var(--glass-bg-soft)]"
        >
          <span className="mono-label w-9 shrink-0 text-right text-[9px] tabular-nums text-muted-foreground/55">
            № {index + 1}
          </span>
          <span
            className="relative size-7 shrink-0 overflow-hidden rounded-md border hairline"
            aria-hidden="true"
          >
            {kind === "hyperspace" ? (
              <span className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--gd)_14%,transparent)] font-mono text-[10px] text-foreground/70">
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
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/90 transition-colors group-hover:text-[var(--cy)]">
            {rep.name}
          </span>
          <span className="mono-label hidden shrink-0 text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground/50 md:block">
            {group ? `${group.name} · ` : ""}
            {rep.origin}
          </span>
          {isLastViewed && (
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400"
            />
          )}
        </button>
      </li>
    );
  }

  return (
    <li className="relative" id={`codex-row-${rep.id}`}>
      {isLastViewed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[calc(100%-14px)] w-[3px] -translate-y-1/2 rounded-full bg-red-500 dark:bg-red-400"
        />
      )}
      <button
        type="button"
        onClick={activate}
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

/* ------------------------------------------------------------------ */
/*  THE PROFILE ROLL — the number selector EVERY category wears: a     */
/*  native roll (the archive's own honest select) of every profile,    */
/*  the standing one carried in the field, the last-viewed marked      */
/*  with its own bead. The page hands beside it wear the codex's       */
/*  corner ornaments.                                                  */
/* ------------------------------------------------------------------ */

function ProfileRoll({
  source,
  effectiveIndex,
  lastIndex,
  onPick,
}: {
  source: (EntityDossier | HyperspaceRow)[];
  effectiveIndex: number;
  lastIndex: number;
  onPick: (index: number) => void;
}) {
  const t = useT();
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPick(effectiveIndex - 1)}
        disabled={effectiveIndex <= 0}
        aria-label={t("Previous profile")}
        title={t("Previous profile")}
        data-testid="codex-prev"
        className="corner-fancy focus-glow flex size-8 shrink-0 items-center justify-center border hairline bg-[var(--glass-bg-soft)] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      <div className="relative h-8 min-w-0 max-w-[min(340px,calc(100vw-9rem))] flex-1">
        <label className="sr-only" htmlFor="codex-profile-roll">
          {t("Choose a profile by number")}
        </label>
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-muted-foreground"
          aria-hidden="true"
        >
          №
        </span>
        <select
          id="codex-profile-roll"
          value={effectiveIndex}
          onChange={(e) => onPick(Number(e.target.value))}
          data-testid="codex-profile-select"
          className="focus-glow h-8 w-full appearance-none rounded-[4px] border hairline bg-[var(--glass-bg-soft)] pl-7 pr-7 text-[12.5px] tabular-nums text-foreground"
        >
          {source.map((rep, i) => (
            <option key={rep.id} value={i}>
              {`${String(i + 1).padStart(4, "0")} — ${rep.name}${i === lastIndex ? " ●" : ""}`}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <button
        type="button"
        onClick={() => onPick(effectiveIndex + 1)}
        disabled={effectiveIndex >= source.length - 1}
        aria-label={t("Next profile — shown from the top")}
        title={t("Next profile — shown from the top")}
        data-testid="codex-next"
        className="corner-fancy focus-glow flex size-8 shrink-0 items-center justify-center border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] text-foreground transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE DOSSIER PANE — the codex's right side on the desk: the full    */
/*  standing profile read beside the list, so both sides carry the     */
/*  codex's information and the page itself never scrolls.             */
/* ------------------------------------------------------------------ */

function DossierPane({
  rep,
  kind,
  index,
  total,
  onStep,
}: {
  rep: EntityDossier | HyperspaceRow;
  kind: ListKind;
  index: number;
  total: number;
  onStep: (dir: 1 | -1) => void;
}) {
  const codexLastViewed = useMirror((s) => s.codexLastViewed);
  const t = useT();
  const isHyp = kind === "hyperspace";
  const group = !isHyp
    ? findDossier(kind as DossierKind, rep.groupId)
    : null;
  const profile = !isHyp
    ? getEntityProfile(rep as EntityDossier, kind as DossierKind)
    : null;
  const inner = isHyp
    ? innerEarth.find((sp) => sp.id === rep.id) ?? null
    : null;
  const isLast =
    codexLastViewed?.kind === kind && codexLastViewed.id === rep.id;

  const facts: { label: string; value: string }[] = isHyp
    ? [
        { label: t("Density"), value: rep.density },
        { label: t("How presence renders"), value: inner?.form ?? rep.signal },
        { label: t("Dwelling"), value: inner?.hall ?? rep.origin },
        { label: t("Signal"), value: rep.signal },
        { label: t("Archive order"), value: `ME-HYP · ${String(index + 1).padStart(4, "0")}` },
      ]
    : [
        { label: t("Rank"), value: profile?.rank ?? "" },
        { label: t("Homeworld"), value: `${profile?.homeworld ?? ""} · ${profile?.starSystem ?? ""}` },
        { label: t("Epoch"), value: profile?.epoch ?? "" },
        { label: t("Lifeform class"), value: profile?.lifeformClass ?? "" },
        { label: t("Density"), value: rep.density },
        { label: t("Resonance"), value: profile?.resonance ?? "" },
        { label: t("Aura"), value: profile?.aura ?? "" },
        { label: t("How they cross"), value: profile?.modality ?? "" },
        { label: t("Signal"), value: rep.signal },
      ];

  return (
    <div
      data-testid="codex-dossier"
      className="flex flex-col gap-3 rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 lg:gap-1.5 lg:p-2.5"
    >
      {/* identity */}
      <div className="flex items-start gap-3">
        <span
          className="relative size-14 shrink-0 overflow-hidden rounded-xl border hairline bg-background/40 lg:size-12"
          aria-hidden="true"
        >
          {isHyp ? (
            <span className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--gd)_14%,transparent)] font-mono text-[18px] text-foreground/70">
              ✶
            </span>
          ) : (
            <img
              src={entityImage(rep.id)}
              alt=""
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="mono-label text-[9.5px] tabular-nums text-muted-foreground/60">
              № {index + 1} / {total}
            </span>
            {isLast && (
              <span className="mono-label shrink-0 rounded-full border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                last viewed
              </span>
            )}
          </div>
          <h2 className="mt-0.5 text-[19px] font-semibold leading-snug text-foreground lg:text-[17px]">
            {rep.name}
          </h2>
          <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-muted-foreground/70">
            {isHyp
              ? `ME-HYP · inner earth`
              : entityRegistryLine(rep as EntityDossier, kind as DossierKind)}
            {" — "}{group ? `${group.name} · ` : ""}{rep.origin} · {rep.density}
          </p>
        </div>
      </div>

      {/* the standing specialty — the entry's own word */}
      <p className="rounded-xl border hairline bg-background/30 px-3 py-2.5 text-[13.5px] italic leading-relaxed text-foreground/80 lg:px-2.5 lg:py-2 lg:text-[12.5px]">
        {rep.specialty}
      </p>

      {/* fact plates — THREE columns on the desk: every plate stands,
          five rows become three, and the whole record fits the pane
          without a scroll */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-1.5">
        {facts.map((f) => (
          <div
            key={f.label}
            className="rounded-lg border hairline bg-background/30 px-2.5 py-2 lg:px-2 lg:py-1"
          >
            <p className="mono-label text-[8.5px] text-muted-foreground/80 lg:text-[8px]">{f.label}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-foreground/85 lg:text-[11.5px]">{f.value}</p>
          </div>
        ))}
      </div>

      {/* the three gifts / the gift */}
      {!isHyp && profile ? (
        <div>
          <p className="mono-label text-[9px] text-[var(--cy)] lg:text-[8.5px]">{t("The three gifts")}</p>
          <ul className="mt-1.5 space-y-1 text-[12.5px] leading-snug text-foreground/85 lg:mt-1 lg:space-y-[2px] lg:text-[11.5px]">
            <li>✦ {profile.giftPrimary}</li>
            <li>✦ {profile.giftSecondary}</li>
            <li>✦ {profile.giftTertiary}</li>
          </ul>
        </div>
      ) : null}
      {isHyp && inner ? (
        <div>
          <p className="mono-label text-[9px] text-[var(--cy)]">{t("The gift they mirror")}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">{inner.gift}</p>
        </div>
      ) : null}

      {/* the deep lines — the record's own walk, kept whole: the gifts'
          list and the seven rows wear the desk's slim dress so every
          line stands inside the pane without a scroll */}
      {!isHyp && profile ? (
        <div className="space-y-1 lg:space-y-[3px]">
          {[
            { label: t("Growth edge"), value: profile.trial },
            { label: t("Known teaching"), value: profile.teaching },
            { label: t("Mission"), value: profile.mission },
            { label: t("Alliance"), value: profile.alliance },
            { label: t("Contact protocol"), value: profile.contactProtocol },
            { label: t("Contact window"), value: profile.contactWindow },
            { label: t("Service"), value: `${profile.serviceLength} · ${profile.sessionsHeld} sessions held` },
          ].map((row) => (
            <div key={row.label} className="flex items-baseline gap-2">
              <span className="mono-label w-[104px] shrink-0 text-right text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground/65 lg:w-[92px] lg:text-[8px]">
                {row.label}
              </span>
              <span className="min-w-0 flex-1 text-[12px] leading-snug text-foreground/80 lg:text-[11px] lg:leading-[1.4]">
                {row.value}
              </span>
            </div>
          ))}
          <blockquote
            className="mt-2 border-l-2 pl-3 lg:mt-1 lg:pl-2"
            style={{
              borderColor:
                "color-mix(in srgb, var(--cy) 45%, transparent)",
            }}
          >
            <p className="font-[family-name:var(--font-literata)] text-[12.5px] italic leading-relaxed text-foreground/85 lg:text-[11.5px]">
              “{profile.quote}”
            </p>
          </blockquote>
        </div>
      ) : null}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE DOSSIER'S OWN HANDS — CORNER ORNAMENTS, no bar: the prev and   */
/*  next wear the codex's luminous corner brackets alone (no full      */
/*  border, no bottom strip) and stand PINNED at the dossier pane's    */
/*  bottom corner — always reachable, never depending on the scroll,   */
/*  while the record itself reads above them. The same walk already    */
/*  lives at the register's top (the roll).                            */
/* ------------------------------------------------------------------ */

function DossierHands({
  rep,
  kind,
  index,
  total,
  onStep,
}: {
  rep: EntityDossier | HyperspaceRow;
  kind: ListKind;
  index: number;
  total: number;
  onStep: (dir: 1 | -1) => void;
}) {
  const openModal = useMirror((s) => s.openModal);
  const t = useT();
  const isHyp = kind === "hyperspace";
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={index <= 0}
          aria-label={t("Previous profile")}
          className="corner-fancy focus-glow flex size-7 items-center justify-center rounded-full bg-[var(--glass-bg-soft)] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={index >= total - 1}
          aria-label={t("Next profile — shown from the top")}
          className="corner-fancy focus-glow flex size-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground transition-all duration-300 hover:glow-sm disabled:opacity-40"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        onClick={() =>
          openModal(
            isHyp
              ? { type: "hyperspace", id: rep.id }
              : { type: "entity", kind: kind as DossierKind, id: rep.id }
          )
        }
        data-testid="codex-dossier-open"
        className="focus-glow flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        {t("Open the full dossier")}
      </button>
    </div>
  );
}

export function ArchiveRegister() {
  const registerKind = useMirror((s) => s.registerKind);
  const openRegister = useMirror((s) => s.openRegister);
  const exitRegister = useMirror((s) => s.exitRegister);
  const t = useT();

  /* THE SIBLING COLLECTION — the Interdimensional Archive lives
     INSIDE the codex as its own category: the shared rail stands
     above it, so every category is one touch away and the codex is
     one room with four doors. */
  if (registerKind === "archive") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-label={t("The codex — Interdimensional Archive")}
        data-testid="codex-register"
        className="nice-scroll flex h-full min-h-0 flex-col overscroll-contain"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-2 pb-5 pt-4 sm:px-3">
          <div className="shrink-0 pb-3">
            <CodexTabs registerKind="archive" />
          </div>
          <div className="min-h-0 flex-1 lg:overflow-hidden">
            <IdmArchiveBrowser onExit={exitRegister} onSwitch={openRegister} />
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <ArchiveList registerKind={registerKind} />
  );
}

function ArchiveList({
  registerKind,
}: {
  registerKind: ListKind;
}) {
  const openRegister = useMirror((s) => s.openRegister);
  const codexLastViewed = useMirror((s) => s.codexLastViewed);
  const markCodexViewed = useMirror((s) => s.markCodexViewed);
  const t = useT();
  const isDesk = useIsCodexDesk();

  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(BATCH);
  const [prevContext, setPrevContext] = useState(`|`);
  const [jumpDraft, setJumpDraft] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

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
     order; the roll opens any number straight away, and the
     last-viewed profile wears the red mark. The DESK reads the
     standing profile in its own pane; the phone opens the dossier
     over the room. */
  const lastIndex = useMemo(() => {
    if (!codexLastViewed || codexLastViewed.kind !== registerKind) return -1;
    return source.findIndex((e) => e.id === codexLastViewed.id);
  }, [codexLastViewed, registerKind, source]);

  const effectiveIndex = lastIndex >= 0 ? lastIndex : 0;
  const selected = source[effectiveIndex] ?? null;

  const openProfileAt = (index: number) => {
    const rep = source[index];
    if (!rep) return;
    markCodexViewed(registerKind, rep.id);
    /* the list pane carries the eye to the chosen row (the pane
       scrolls, the page never leaves its frame on the desk) */
    requestAnimationFrame(() => {
      try {
        document
          .getElementById(`codex-row-${rep.id}`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        /* an engine without smooth steps still carries the eyes */
      }
    });
  };

  const stepProfile = (dir: 1 | -1) => {
    const next = effectiveIndex + dir;
    if (next < 0 || next >= source.length) return;
    openProfileAt(next);
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

  /* the roll reads the FILTERED order — a chosen family rolls its own
     names only (the number the visitor picks is the number shown) */
  const rollIndex = useMemo(() => {
    if (!selected) return 0;
    const i = filtered.findIndex((e) => e.id === selected.id);
    return i >= 0 ? i : 0;
  }, [filtered, selected]);

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
      data-testid="codex-register"
      className="nice-scroll flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain lg:overflow-hidden"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-2 pb-4 pt-4 sm:px-3 lg:pb-2 lg:pt-2">
        {/* -------- the compact header (shrinks onto the desk) -------- */}
        <div className="shrink-0">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <span className="mono-label inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[11px] text-muted-foreground">
                <Layers className="size-3" aria-hidden="true" />
                {t("Mirror archive · the codex")}
              </span>
              <h1 className="hero-text mt-2 text-[21px] font-semibold leading-tight tracking-[-0.01em] sm:text-[24px] lg:mt-1.5 lg:text-[20px]">
                {t(meta.title)}
              </h1>
            </div>
            {/* exact counters — one quiet strip on the header's right */}
            <div className="flex flex-wrap items-center gap-2" data-testid="codex-counters">
              {[
                {
                  value: <span className="tabular-nums">{total}</span>,
                  label: t("named entries · exact"),
                },
                {
                  value: (
                    <span className="tabular-nums">
                      {registerKind === "hyperspace" ? (meta.realms ?? 1) : groupChips.length}
                    </span>
                  ),
                  label: `${t(meta.groupLabel).toLowerCase()} ${t("catalogued")}`,
                },
                {
                  value: (
                    <span
                      className={cn(
                        "tabular-nums",
                        revealed >= filtered.length && "text-[var(--ok)]"
                      )}
                    >
                      {Math.min(revealed, filtered.length)}
                      <span className="text-[11px] text-muted-foreground">
                        /{filtered.length}
                      </span>
                    </span>
                  ),
                  label: t("revealed on this page"),
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-2.5 py-1.5 text-center"
                >
                  <p className="font-mono text-[15px] font-semibold leading-none text-foreground sm:text-[17px]">
                    {c.value}
                  </p>
                  <p className="mono-label mt-1 text-[8.5px] text-muted-foreground">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* the mirror's word and the four doors share ONE line on the
              desk — the header stays slim so both sides of the codex
              stand in the window without the page ever scrolling */}
          <div className="mt-1.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <p className="max-w-[760px] text-[13px] leading-relaxed text-muted-foreground lg:mt-1 lg:text-[12.5px]">
              {t(meta.subtitle)}
            </p>
            <div className="shrink-0">
              <CodexTabs registerKind={registerKind} />
            </div>
          </div>

          {/* search + the roll + the page hands — one row on the desk */}
          <div className="mt-2.5 flex flex-col gap-2 lg:mt-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70"
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
                className="focus-glow h-9 w-full rounded-xl border hairline bg-transparent pl-9 pr-9 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:h-9 sm:text-[14px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("Clear register search")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <ProfileRoll
              source={filtered}
              effectiveIndex={rollIndex}
              lastIndex={lastIndex}
              onPick={(i) => {
                const rep = filtered[i];
                if (!rep) return;
                markCodexViewed(registerKind, rep.id);
                requestAnimationFrame(() => {
                  try {
                    document
                      .getElementById(`codex-row-${rep.id}`)
                      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                  } catch {
                    /* an engine without smooth steps still carries the eyes */
                  }
                });
              }}
            />
          </div>

          {/* the families and the pages ride ONE line on the desk — the
              header stays slim so both sides of the codex stand in the
              window without the page ever scrolling */}
          <div className="mt-2 flex min-w-0 flex-col gap-2 lg:mt-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            {groupChips.length > 0 && (
              <div className="nice-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 lg:flex-nowrap lg:overflow-y-hidden lg:pb-0">
                <button
                  type="button"
                  onClick={() => setGroupId(null)}
                  aria-pressed={groupId === null}
                  className={cn(
                    "focus-glow mono-label shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
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
                      "focus-glow mono-label shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300",
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

          {/* THE CODEX'S OWN PAGES — the numbers at the register's top:
              one row of leaves (first · neighbours · last), a small hand
              that takes any page typed into it, and the way one leaf back
              or onward. No walk down the whole shore to reach a name. */}
          <div
            className="mt-2 flex flex-wrap items-center justify-center gap-1.5"
            data-testid="codex-page-hands"
          >
            <button
              type="button"
              onClick={() => goToPage(standingPage - 1)}
              disabled={standingPage <= 1}
              aria-label={t("The page before")}
              title={t("The page before")}
              className="corner-fancy focus-glow mono-label flex h-7 items-center border px-2.5 text-[11px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
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
                    "corner-fancy focus-glow mono-label flex h-7 min-w-7 items-center justify-center border px-1.5 text-[11px] tabular-nums transition-all duration-300",
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
              className="corner-fancy focus-glow mono-label flex h-7 items-center border px-2.5 text-[11px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
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
                className="focus-glow h-7 w-14 rounded-[4px] border hairline bg-transparent px-2 text-center font-mono text-[11.5px] tabular-nums text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <button
                type="submit"
                aria-label={t("Open that page")}
                title={t("Open that page")}
                className="corner-fancy focus-glow mono-label flex h-7 items-center border hairline px-2.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                {t("Go")}
              </button>
            </form>
          </div>
          </div>
        </div>

        {/* ----------------- THE TWO SIDES OF THE CODEX -----------------
            the desk reads both at once: the roll of names on the left,
            the standing profile's own plate on the right — the page
            itself never scrolls, only the panes do (the grid takes the
            height the header leaves, never a minimum that would clip
            the corners of the panes on a docked lens). The phone keeps
            the full leaves and opens the dossier over the room. */}
        <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:mt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]">
          <div className="min-h-0 lg:overflow-y-auto lg:pr-1.5 nice-scroll" data-testid="codex-list-pane">
            {/* result status line */}
            <div className="flex items-center justify-center gap-2 pb-2">
              <BadgeCheck className="size-3.5 text-[var(--ok)]" aria-hidden="true" />
              <p className="mono-label text-[11px] text-muted-foreground/80">
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
            <div ref={listTopRef} aria-hidden="true" className="h-px scroll-mt-2" />
            <ul className="space-y-1 lg:space-y-0.5" aria-live="polite">
              {shown.map((rep, i) => (
                <RegisterRow
                  key={rep.id}
                  rep={rep}
                  kind={registerKind}
                  index={i}
                  isLastViewed={
                    codexLastViewed?.kind === registerKind &&
                    codexLastViewed.id === rep.id
                  }
                  variant={isDesk ? "compact" : "full"}
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
                  className="corner-fancy focus-glow border hairline px-4 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                >
                  {t("Reveal {n} more", {
                    n: Math.min(BATCH, filtered.length - revealed),
                  })}
                </button>
                <button
                  type="button"
                  onClick={() => setRevealed(filtered.length)}
                  className="corner-fancy focus-glow border border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] px-4 py-2 text-[14px] font-semibold text-foreground transition-all duration-300 hover:glow-sm"
                >
                  {t("Reveal all {n}", { n: filtered.length })}
                </button>
              </div>
            )}
          </div>

          <aside
            className="hidden lg:flex min-h-0 flex-col"
            data-testid="codex-dossier-pane"
          >
            {selected ? (
              <>
                {/* the record itself reads above the hands — the pane
                    scrolls only if a record outgrows the room, and the
                    hands stay pinned at the corner either way */}
                <div className="min-h-0 flex-1 lg:overflow-y-auto nice-scroll">
                  <DossierPane
                    rep={selected}
                    kind={registerKind}
                    index={effectiveIndex}
                    total={source.length}
                    onStep={stepProfile}
                  />
                </div>
                <DossierHands
                  rep={selected}
                  kind={registerKind}
                  index={effectiveIndex}
                  total={source.length}
                  onStep={stepProfile}
                />
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </motion.section>
  );
}
