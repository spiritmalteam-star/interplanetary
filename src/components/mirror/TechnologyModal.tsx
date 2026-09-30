"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Orbit } from "lucide-react";
import { ModalShell } from "./ModalShell";
import {
  TECH_TOTAL,
  craftFamilies,
  getTechEntry,
  techEntries,
  type TechEntry,
} from "@/lib/data/technologies";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { sceneImageFor, sceneImageForDistinct } from "@/lib/profile-visuals";
import { distinctChains, FactTile, ProfileFigure, ProfileSection } from "./ProfileBits";
import { cn } from "@/lib/utils";

const PAGE = 60;

/**
 * TechnologyModal — the ET Technology register. 827 exotic crafts of
 * the star civilizations, each pictured by its own AI-painted context
 * scene. A sticky family rail filters the grid; every card opens a
 * deep profile as an overlay SIBLING of the scroll container, so the
 * register keeps its scroll position while the detail covers the
 * visible area. Everything lives in memory only.
 */
export function TechnologyModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const t = useT();

  const open = modal?.type === "technology";

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) closeModal();
      }}
      title={t("ET Technology")}
      description={t(
        "The xenotechnology register — {n} crafts of the star civilizations, pictured by their own context scene",
        { n: TECH_TOTAL }
      )}
      widthClass="sm:max-w-[940px]"
    >
      {/* Keyed remount: every opening of the register starts fresh. */}
      <TechnologyRegister key={String(open)} />
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  The register body — sticky family rail + reveal grid, and the      */
/*  detail overlay as a sibling of the scroll container.               */
/* ------------------------------------------------------------------ */
export function TechnologyRegister() {
  const [family, setFamily] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const t = useT();

  const list = family
    ? techEntries.filter((e) => e.familyId === family)
    : techEntries;
  const detail = openId ? getTechEntry(openId) : undefined;

  return (
    <div className="relative min-w-0" data-testid="technology-body">
      {/* ---------- the register ---------- */}
      <div className="register-solid max-h-[calc(100dvh-8rem)] min-h-[420px] overflow-y-auto nice-scroll px-5 pb-6 pt-2 sm:px-7">
        {/* sticky family rail — opaque ink, no bleed-through */}
        <div className="sticky top-0 z-10 -mx-5 bg-[color-mix(in_srgb,var(--register-ink)_94%,transparent)] px-5 pb-2 pt-3 sm:-mx-7 sm:px-7">
          <div className="nice-scroll flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFamily(null)}
              aria-pressed={family === null}
              className={cn(
                "focus-glow mono-label shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] transition-all duration-300",
                family === null
                  ? "border-[color-mix(in_srgb,var(--sp-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--sp-a)_14%,transparent)] text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
            >
              {t("All {n}", { n: TECH_TOTAL })}
            </button>
            {craftFamilies.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFamily(family === f.id ? null : f.id)}
                aria-pressed={family === f.id}
                className={cn(
                  "focus-glow mono-label shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] transition-all duration-300",
                  family === f.id
                    ? "border-[color-mix(in_srgb,var(--sp-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--sp-a)_14%,transparent)] text-foreground"
                    : "hairline text-muted-foreground hover:text-foreground"
                )}
              >
                {t(f.label)} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* keyed by family so the reveal state resets on change */}
        <RevealGrid key={family ?? "all"} entries={list} onOpen={setOpenId} />
      </div>

      {/* ---------- the deep profile — sibling overlay ---------- */}
      <AnimatePresence>
        {detail && (
          <motion.div
            key={detail.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="register-solid nice-scroll encyc-body absolute inset-0 z-10 overflow-y-auto px-5 pb-6 pt-3 sm:px-7"
            data-testid="technology-detail"
          >
            <TechDetail
              entry={detail}
              onBack={() => setOpenId(null)}
              onNavigate={setOpenId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reveal grid — 60 cards at a time, appended by hand.                */
/* ------------------------------------------------------------------ */
function RevealGrid({
  entries,
  onOpen,
}: {
  entries: TechEntry[];
  onOpen: (id: string) => void;
}) {
  const [shown, setShown] = useState(PAGE);
  const t = useT();
  const visible = entries.slice(0, shown);

  return (
    <div>
      <div
        className="mt-3 grid grid-cols-2 gap-3.5 lg:grid-cols-3"
        data-testid="technology-grid"
      >
        {visible.map((entry) => (
          <TechCard key={entry.id} entry={entry} onOpen={onOpen} />
        ))}
      </div>

      {shown < entries.length && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShown((s) => Math.min(s + PAGE, entries.length))}
            className="focus-glow rounded-full border hairline px-5 py-2 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            {t("Reveal more")}
          </button>
          <p className="mono-label text-[10px] text-muted-foreground/60">
            {t("Revealed {a} of {b} — scroll to keep revealing", {
              a: visible.length,
              b: entries.length,
            })}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  One register card — painted scene first, clean plaque below.       */
/* ------------------------------------------------------------------ */
function TechCard({
  entry,
  onOpen,
}: {
  entry: TechEntry;
  onOpen: (id: string) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.id)}
      className="focus-glow group overflow-hidden rounded-2xl border hairline bg-[var(--glass-bg-soft)] text-left transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
    >
      <div className="overflow-hidden">
        <TechImage
          entry={entry}
          className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="px-3 pb-3.5 pt-2.5">
        <span className="mono-label block text-[10.5px] uppercase tracking-[0.16em] text-[var(--sp-a)]">
          {t(entry.family)}
        </span>
        <span className="mt-1 block text-[16px] font-semibold leading-snug text-foreground">
          {entry.name}
        </span>
        <span className="mt-1 block text-[13.5px] text-muted-foreground">
          {entry.origin} · {entry.noun}
        </span>
        <span className="mt-1.5 block line-clamp-2 text-[13.5px] italic leading-relaxed text-foreground/75">
          {entry.whisper}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TechImage — pure painted image, no sigils. Each technology owns    */
/*  its own painting (tech-XT-nnnn.jpg); if it is not on disk yet,     */
/*  the chain falls back to the context scene, then the family         */
/*  portrait, then a quiet ink block.                                  */
/* ------------------------------------------------------------------ */
function TechImage({
  entry,
  className,
  alt,
}: {
  entry: TechEntry;
  className?: string;
  alt?: string;
}) {
  const [stage, setStage] = useState(0);

  const chain = [
    `/images/ai/et-tech/tech-${entry.id}.jpg`,
    entry.contextImage,
    entry.image,
  ];

  if (stage >= chain.length) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "block bg-[color-mix(in_srgb,var(--register-ink)_88%,var(--sp-a)_12%)]",
          className
        )}
      />
    );
  }

  return (
    <img
      src={chain[stage]}
      alt={alt ?? entry.name}
      loading="lazy"
      draggable={false}
      onError={() => setStage((s) => s + 1)}
      className={cn("object-cover", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  The deep profile — registry plaque, meters, prose, neighbours.     */
/* ------------------------------------------------------------------ */
function TechDetail({
  entry,
  onBack,
  onNavigate,
}: {
  entry: TechEntry;
  onBack: () => void;
  onNavigate: (id: string) => void;
}) {
  const t = useT();
  const askAboutTechnology = useMirror((s) => s.askAboutTechnology);

  const adjacent = entry.adjacent
    .map((id) => getTechEntry(id))
    .filter((e): e is TechEntry => Boolean(e));

  /* the page's three plates — own painting first, no image ever twice */
  const craftScene = sceneImageFor(entry.id, "craft");
  const workshopScene = sceneImageForDistinct(entry.id, "workshop", [craftScene]);
  const plates = distinctChains([
    [`/images/ai/et-tech/tech-${entry.id}.jpg`, entry.contextImage, entry.image],
    [craftScene, entry.image],
    [workshopScene],
  ]);

  const meters: { label: string; value: number }[] = [
    { label: t("Rarity"), value: entry.meters.rarity },
    { label: t("Containment"), value: entry.meters.containment },
    { label: t("Ethics load"), value: entry.meters.ethicsLoad },
    { label: t("Maturity"), value: entry.meters.maturity },
  ];

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={onBack}
        className="focus-glow group flex items-center gap-2 rounded-full border hairline px-3.5 py-1.5 text-[13.5px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        {t("Back to the register")}
      </button>

      <p className="mono-label mt-4 text-[11px] uppercase tracking-[0.22em] text-[var(--sp-a)]">
        {entry.registry}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-[21px] font-semibold leading-tight text-foreground sm:text-[24px]">
          {entry.name}
        </h3>
        <span className="mono-label rounded-full border border-[color-mix(in_srgb,var(--sp-a)_45%,transparent)] bg-[color-mix(in_srgb,var(--sp-a)_12%,transparent)] px-2.5 py-1 text-[10.5px] uppercase tracking-[0.16em] text-foreground">
          {entry.classificationTone} · {entry.grade}
        </span>
      </div>

      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        {entry.origin} · {entry.noun} craft · {entry.adjectiveField}
      </p>

      {/* the lead plate — its own painting, the record wrapping around */}
      <div className="mt-4">
        <ProfileFigure
          sources={plates[0]}
          alt={t("The {name} — its own painted impression", { name: entry.name })}
          variant="lead"
          testid="technology-gallery"
        />
      </div>

      <p className="mt-4 border-l-2 border-[color-mix(in_srgb,var(--sp-a)_35%,transparent)] pl-3 text-[14.5px] italic leading-relaxed text-foreground/85">
        {entry.whisper}
      </p>

      {/* at a glance — the fact console */}
      <section className="mt-5 clear-both">
        <h4 className="mono-label text-[10.5px] text-[var(--sp-a)]">
          {t("At a glance")}
        </h4>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <FactTile label={t("Registry")} value={entry.id} mono />
          <FactTile label={t("Family")} value={entry.family} />
          <FactTile label={t("Classification")} value={`${entry.classificationTone} · ${entry.grade}`} />
          <FactTile label={t("Era")} value={entry.era} />
          <FactTile label={t("Craft form")} value={entry.noun} />
          <FactTile label={t("Field tuning")} value={entry.adjectiveField} />
        </div>
      </section>

      {/* meters */}
      <ProfileSection index="01" label={t("Instrument readings")} className="clear-both">
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {meters.map((m) => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between">
                <span className="mono-label text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {m.label}
                </span>
                <span className="font-mono text-[12px] tabular-nums text-foreground/80">
                  {m.value}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--sp-a)_14%,transparent)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${m.value}%`,
                    backgroundColor: `color-mix(in srgb, var(--sp-a) ${35 + m.value * 0.55}%, transparent)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection index="02" label={t("What it is")}>
        <p className="text-[14.5px] leading-relaxed text-foreground/90">
          {entry.overview}
        </p>
      </ProfileSection>

      {/* the second plate — its craft context, wrapped by the principles */}
      <ProfileFigure
        sources={plates[1]}
        alt={t("The craft context of the {name}", { name: entry.name })}
        side="left"
        testid="technology-gallery-craft"
      />

      {/* principles */}
      <ProfileSection index="03" label={t("Working principles")}>
        <ol className="mt-2 space-y-2">
          {entry.principles.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="mono-label shrink-0 pt-0.5 text-[11px] text-[var(--sp-a)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[14.5px] leading-relaxed text-foreground/85">
                {p}
              </span>
            </li>
          ))}
        </ol>
      </ProfileSection>

      {/* applications */}
      <ProfileSection index="04" label={t("Recorded applications")}>
        <ul className="mt-2 space-y-1.5">
          {entry.applications.map((a) => (
            <li key={a} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-[color-mix(in_srgb,var(--sp-a)_70%,transparent)]"
              />
              <span className="text-[14.5px] leading-relaxed text-foreground/85">
                {a}
              </span>
            </li>
          ))}
        </ul>
      </ProfileSection>

      {/* the third plate — the workshop scene, wrapped by the ethics */}
      <ProfileFigure
        sources={plates[2]}
        alt={t("The {family} family portrait", { family: entry.family })}
        testid="technology-gallery-family"
      />

      {/* ethics */}
      <ProfileSection index="05" label={t("Ethics")} tone="pk">
        <p className="text-[14.5px] leading-relaxed text-foreground/85">
          {entry.ethics}
        </p>
      </ProfileSection>

      {/* adjacent crafts — navigates in place */}
      <ProfileSection index="06" label={t("Adjacent crafts in the register")} className="clear-both">
        <div className="mt-3 flex flex-wrap gap-3">
          {adjacent.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate(a.id)}
              className="focus-glow flex items-center gap-2.5 rounded-full border hairline py-1.5 pl-1.5 pr-4 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
            >
              <TechImage
                entry={a}
                alt=""
                className="size-11 shrink-0 rounded-full"
              />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium leading-tight text-foreground">
                  {a.name}
                </span>
                <span className="mono-label block text-[9.5px] text-muted-foreground">
                  {a.id}
                </span>
              </span>
            </button>
          ))}
        </div>
      </ProfileSection>

      <div className="mt-6 flex justify-center border-t hairline pt-5 clear-both">
        <button
          type="button"
          onClick={() => askAboutTechnology(entry.name)}
          className="star-btn focus-glow flex h-11 items-center gap-2.5 rounded-full px-6 text-[14.5px] font-semibold tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-px"
        >
          <Orbit className="size-4 text-[var(--sp-a)]" aria-hidden="true" />
          {t("Consult the Mirror about this technology")}
        </button>
      </div>
    </div>
  );
}
