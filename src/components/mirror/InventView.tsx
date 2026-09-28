"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  DraftingCompass,
  Hammer,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Waves,
  Wind,
  Wrench,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  blueprints,
  dailyBench,
  makeDomains,
  makingRungs,
  sparkStates,
  studioProtocols,
  workshopDiscernment,
  workshopIntro,
} from "@/lib/data/invent";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";

/* ------------------------------------------------------------------ */
/*  INVENT — the fourth book on the laboratory shelf, bound in         */
/*  molten copper. Its structure mirrors the Manifest book — header,   */
/*  greeting, chambers around the work, expandable cards with steps    */
/*  and seals, a ladder, protocols, tools — but everything inside      */
/*  belongs to invention.                                              */
/*                                                                     */
/*  COMPACTNESS: a slim sticky rail of three chambers turns the        */
/*  studio; the blueprints are folded accordions with only one open    */
/*  at a time, so the reader never scrolls far.                        */
/* ------------------------------------------------------------------ */

type StudioPlace = "blueprints" | "workshop" | "bench";

const STUDIO_PLACES: {
  id: StudioPlace;
  label: string;
  icon: typeof DraftingCompass;
}[] = [
  { id: "blueprints", label: "Blueprints", icon: DraftingCompass },
  { id: "workshop", label: "The Workshop", icon: Hammer },
  { id: "bench", label: "The Bench", icon: Wrench },
];

/* ---------------- one blueprint — a folded sheet ---------------- */

function BlueprintCard({
  index,
  blueprintId,
  open,
  onToggle,
}: {
  index: number;
  blueprintId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const blueprint = blueprints[index];
  const t = useT();

  const spoken = useMemo(
    () =>
      [
        blueprint.name,
        blueprint.tagline,
        ...blueprint.steps.map((s, i) => `${i + 1}. ${s}`),
        blueprint.seal,
      ].join(". "),
    [blueprint]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative overflow-hidden rounded-2xl glass"
      data-testid={`invent-blueprint-${blueprint.id}`}
    >
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-glow flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full border text-[17px]"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
          }}
          aria-hidden="true"
        >
          {blueprint.glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="scope-gradient-text block text-[15.5px] font-semibold sm:text-[17px]">
            {t(blueprint.name)}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] text-muted-foreground">
            {t(blueprint.tagline)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="border-t hairline px-5 pb-5 pt-4 sm:px-6">
            <p className="text-[14.5px] italic leading-relaxed text-muted-foreground">
              {t(blueprint.tagline)}
            </p>

            <ol className="mt-4 space-y-3">
              {blueprint.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mono-label mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10.5px]"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                      color: "var(--scope-a)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-[1.75] text-foreground/88">
                    {t(step)}
                  </span>
                </li>
              ))}
            </ol>

            <div
              className="mt-5 rounded-xl border py-4 text-center"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                background:
                  "color-mix(in srgb, var(--scope-a) 6%, transparent)",
              }}
            >
              <p className="mono-label text-[10px] text-[var(--scope-a)]">
                {t("Seal")}
              </p>
              <p className="scope-gradient-text mx-auto mt-1.5 max-w-[440px] font-serif text-[17px] italic leading-relaxed">
                “{t(blueprint.seal)}”
              </p>
            </div>

            <div className="mt-3 flex justify-end">
              <ListenButton text={spoken} cacheKey={`invent-${blueprint.id}`} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------------- the workshop tab ---------------- */

function WorkshopTab() {
  const t = useT();

  return (
    <div className="space-y-6">
      {/* orientation */}
      <div className="rounded-2xl glass p-5 sm:p-6">
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
          {t("The Inventor's Mind — the one that dreams in diagrams")}
        </h3>
        <div className="mt-3 space-y-3">
          {workshopIntro.map((p, i) => (
            <p
              key={i}
              className="text-[15px] leading-[1.8] text-foreground/88"
            >
              {t(p)}
            </p>
          ))}
        </div>
      </div>

      {/* ladder of making */}
      <div>
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
          {t("The Ladder of Making — six rungs from wonder to offering")}
        </h3>
        <div className="relative mt-4 space-y-0">
          {makingRungs.map((rung, i) => (
            <motion.div
              key={rung.rung}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="relative flex gap-4 pb-4 last:pb-0"
            >
              {i < makingRungs.length - 1 && (
                <span
                  className="absolute left-[17px] top-9 h-[calc(100%-26px)] w-px"
                  style={{
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--scope-a) 40%, transparent), color-mix(in srgb, var(--scope-a) 10%, transparent))",
                  }}
                  aria-hidden="true"
                />
              )}
              <span
                className="mono-label z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-[var(--glass-bg-strong)] text-[12px] font-semibold"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 45%, transparent)",
                  color: "var(--scope-a)",
                }}
              >
                {rung.rung}
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[15px] font-semibold text-foreground">
                  {t(rung.title)}
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
                  {t(rung.line)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* studio protocols */}
      <div>
        <h3 className="mono-label text-[11px] text-[var(--scope-a)]">
          {t("Studio protocols")}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {studioProtocols.map((p) => (
            <div key={p.id} className="rounded-2xl glass p-5">
              <span
                className="flex size-9 items-center justify-center rounded-full border text-[16.5px]"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                  background:
                    "color-mix(in srgb, var(--scope-a) 8%, transparent)",
                }}
                aria-hidden="true"
              >
                {p.glyph}
              </span>
              <h4 className="scope-gradient-text mt-3 text-[15.5px] font-semibold">
                {t(p.name)}
              </h4>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {t(p.purpose)}
              </p>
              <ol className="mt-3 space-y-2">
                {p.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-[7px] inline-block size-1.5 shrink-0 rotate-45"
                      style={{ background: "var(--scope-a)" }}
                      aria-hidden="true"
                    />
                    <span className="text-[14px] leading-[1.7] text-foreground/85">
                      {t(s)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* discernment */}
      <div className="rounded-2xl glass p-5 sm:p-6">
        <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t("Discernment — how to know a true invention")}
        </h3>
        <ul className="mt-3 space-y-2.5">
          {workshopDiscernment.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className="mt-[9px] inline-block size-1.5 shrink-0 rotate-45"
                style={{ background: "var(--scope-a)" }}
                aria-hidden="true"
              />
              <span className="text-[14.5px] leading-[1.75] text-foreground/85">
                {t(line)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- the bench tab ---------------- */

function InventionSeeder() {
  const [domainId, setDomainId] = useState<string | null>(null);
  const t = useT();
  const domain = makeDomains.find((d) => d.id === domainId) ?? null;

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
        <Wind className="size-3.5" aria-hidden="true" />
        {t("Invention Seeder")}
      </h3>
      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t("Choose a field of making")}
      >
        {makeDomains.map((d) => {
          const active = d.id === domainId;
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={active}
              onClick={() => setDomainId(active ? null : d.id)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background:
                        "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      boxShadow:
                        "0 0 16px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true">{d.glyph}</span>
              {t(d.label)}
            </button>
          );
        })}
      </div>

      {domain && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 space-y-3"
        >
          <div className="rounded-xl border border-[var(--destructive)]/20 bg-[color-mix(in_srgb,var(--destructive)_5%,transparent)] p-3.5">
            <p className="mono-label text-[10px] text-muted-foreground">
              {t("The block")}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
              {t(domain.pattern)}
            </p>
          </div>
          <div
            className="rounded-xl border p-3.5"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a) 30%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
            }}
          >
            <p className="mono-label text-[10px] text-[var(--scope-a)]">
              {t("The reframe")}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground/88">
              {t(domain.reframe)}
            </p>
          </div>
          <div className="rounded-xl border hairline p-3.5">
            <p className="mono-label text-[10px] text-muted-foreground">
              {t("The first stroke")}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
              {t(domain.practice)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SparkBridge() {
  const [stateId, setStateId] = useState<string | null>(null);
  const t = useT();
  const state = sparkStates.find((v) => v.id === stateId) ?? null;

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
        <Waves className="size-3.5" aria-hidden="true" />
        {t("Spark Bridge")}
      </h3>
      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label={t("Where is your making now?")}
      >
        {sparkStates.map((v) => {
          const active = v.id === stateId;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={active}
              onClick={() => setStateId(active ? null : v.id)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background:
                        "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                      boxShadow:
                        "0 0 16px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)",
                    }
                  : undefined
              }
            >
              <span aria-hidden="true">{v.glyph}</span>
              {t(v.label)}
            </button>
          );
        })}
      </div>

      {state && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 space-y-3"
        >
          <div
            className="rounded-xl border p-3.5"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a) 30%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
            }}
          >
            <p className="mono-label text-[10px] text-[var(--scope-a)]">
              {t("The bridge")}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-foreground/88">
              {t(state.bridge)}
            </p>
          </div>
          <div className="rounded-xl border hairline py-4 text-center">
            <p className="mono-label text-[10px] text-muted-foreground">
              {t("Anchor phrase")}
            </p>
            <p className="scope-gradient-text mx-auto mt-1.5 max-w-[380px] font-serif text-[15.5px] italic leading-relaxed">
              “{t(state.anchor)}”
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DailyBenchCard() {
  const t = useT();
  const today = useMemo(() => {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key, bench: dailyBench(key) };
  }, []);

  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <h3 className="mono-label flex items-center gap-2 text-[11px] text-[var(--scope-a)]">
        <Sun className="size-3.5" aria-hidden="true" />
        {t("The Daily Bench")}
      </h3>
      <p className="mono-label mt-1 text-[10px] text-muted-foreground/70">
        {today.key}
      </p>
      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-3">
          <Sun
            className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]"
            aria-hidden="true"
          />
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">
              {t("Morning")}
            </p>
            <p className="mt-0.5 text-[14.5px] leading-relaxed text-foreground/88">
              {t(today.bench.morning)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Moon
            className="mt-0.5 size-4 shrink-0 text-[var(--scope-a)]"
            aria-hidden="true"
          />
          <div>
            <p className="mono-label text-[10px] text-muted-foreground">
              {t("Evening")}
            </p>
            <p className="mt-0.5 text-[14.5px] leading-relaxed text-foreground/88">
              {t(today.bench.evening)}
            </p>
          </div>
        </div>
        <div
          className="rounded-xl border py-4 text-center"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
          }}
        >
          <p className="mono-label text-[10px] text-[var(--scope-a)]">
            {t("Focus of the day")}
          </p>
          <p className="scope-gradient-text mx-auto mt-1.5 max-w-[380px] font-serif text-[15.5px] italic leading-relaxed">
            “{t(today.bench.focus)}”
          </p>
        </div>
      </div>
    </div>
  );
}

function BenchTab() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <InventionSeeder />
        <SparkBridge />
      </div>
      <DailyBenchCard />
    </div>
  );
}

/* ---------------- the studio shell ---------------- */

export function InventView() {
  const exitInvent = useMirror((s) => s.exitInvent);
  const [place, setPlace] = useState<StudioPlace>("blueprints");
  /* one blueprint open at a time — the compactness of the studio */
  const [openId, setOpenId] = useState<string | null>(
    blueprints[0]?.id ?? null
  );
  const t = useT();

  const openBlueprint = (id: string) => {
    setOpenId((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        /* let the sheet unfold, then bring it into view */
        requestAnimationFrame(() => {
          document
            .getElementById(`invent-blueprint-${id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  return (
    <div className="scope-invent relative flex h-full flex-col">
      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={exitInvent}
            data-testid="invent-back"
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {t("Return to the Observatory")}
            </span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <div className="min-w-0 text-center">
            <h1 className="title-gradient truncate text-[15.5px] font-semibold tracking-[0.12em] sm:text-[17px]">
              INVENT
            </h1>
            <p className="mono-label mt-0.5 truncate text-[10px] text-muted-foreground/80 sm:text-[11px]">
              {t("The inventor's studio of the laboratory")}
            </p>
          </div>

          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline"
            aria-hidden="true"
          >
            <DraftingCompass className="size-4 text-[var(--iv-a)]" />
          </span>
        </div>
      </header>

      {/* ---------- the studio ---------- */}
      <main
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="invent-view"
      >
        <div className="mx-auto w-full max-w-[820px] px-4 pb-8 sm:px-6">
          {/* slim greeting */}
          <div className="pt-5 text-center sm:pt-6">
            <p
              className="mono-label text-[11px]"
              style={{ color: "var(--scope-a)" }}
            >
              INVENT · {t("The inventor's studio of the laboratory")}
            </p>
            <h2 className="scope-gradient-text mt-2 text-[22px] font-semibold leading-tight sm:text-[26px]">
              {t("Imagine It Into Form")}
            </h2>
            <p className="mx-auto mt-2 max-w-[540px] text-[14px] leading-relaxed text-muted-foreground">
              {t(
                "Three chambers of making: the Blueprints hold the laws of invention, the Workshop trains the inventor's mind, and the Bench keeps the daily tools. One sheet opens at a time — the studio is built compact."
              )}
            </p>
          </div>

          {/* the slim rail of chambers — sticky, so turning the studio is
              always one tap away and the reader never scrolls far */}
          <div
            className="sticky top-0 z-20 -mx-4 mt-4 border-b hairline bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
            role="tablist"
            aria-label={t("The chambers of the studio")}
            data-testid="invent-rail"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:justify-center">
              {STUDIO_PLACES.map(({ id, label, icon: Icon }) => {
                const active = place === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPlace(id)}
                    className={cn(
                      "focus-glow flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13.5px] transition-all duration-300",
                      active
                        ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] font-semibold text-foreground glow-sm"
                        : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {t(label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* the chambers */}
          <motion.div
            key={place}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="pt-4"
          >
            {place === "blueprints" && (
              <div className="space-y-3">
                <p className="mx-auto max-w-[560px] pb-1 text-center text-[14px] leading-relaxed text-muted-foreground">
                  {t(
                    "Six working laws for turning what is imagined into what is held. Open one, walk it slowly, and let the hands learn what the mind already knows."
                  )}
                </p>
                {blueprints.map((b, i) => (
                  <BlueprintCard
                    key={b.id}
                    index={i}
                    blueprintId={b.id}
                    open={openId === b.id}
                    onToggle={() => openBlueprint(b.id)}
                  />
                ))}
                {/* walk the blueprints with the Mirror */}
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={exitInvent}
                    className="dream-btn focus-glow group flex h-10 items-center gap-2.5 rounded-full px-5 text-[14.5px] font-medium text-foreground transition-all duration-300 hover:-translate-y-px"
                  >
                    <Sparkles className="size-3.5 text-[var(--iv-a)]" aria-hidden="true" />
                    {t("Ask the Mirror about your invention")}
                    <span
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Lightbulb
                    className="size-3.5 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {place === "workshop" && <WorkshopTab />}
            {place === "bench" && <BenchTab />}
          </motion.div>

          <p className="mono-label pb-1 pt-5 text-center text-[10px] text-muted-foreground/50">
            {t(
              "INVENT stands beside the other chambers · every imagination honored"
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
