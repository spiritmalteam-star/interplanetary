"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Beaker,
  Calendar,
  ChevronDown,
  Clock,
  Cpu,
  FlaskConical,
  Layers,
  ListChecks,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { MsEntity, MsExperiment } from "@/lib/data/meta-science";
import { useMetaScience, type MsTab } from "@/lib/meta-science-store";
import { useT } from "@/lib/i18n";
import { MsAvatar } from "./MsAvatar";
import { MsChat } from "./MsChat";
import { MsParticles } from "./MsParticles";
import { MsTools } from "./MsTools";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — one entity's channel: hero, sticky tabs, five       */
/*  rooms (Overview · Experiments · Case Studies · Tools ·             */
/*  Communicate). The accent flows through everything.                 */
/* ------------------------------------------------------------------ */

const TABS: MsTab[] = ["overview", "experiments", "examples", "tools", "communicate"];

const TAB_LABELS: Record<MsTab, string> = {
  overview: "Overview",
  experiments: "Experiments",
  examples: "Case Studies",
  tools: "Tools",
  communicate: "Communicate",
};

const DIFFICULTY_COLORS: Record<MsExperiment["difficulty"], string> = {
  Beginner: "#10b981",
  Intermediate: "#22d3ee",
  Advanced: "#f59e0b",
  Frontier: "#f43f5e",
};

function ExperimentCard({
  experiment,
  entity,
}: {
  experiment: MsExperiment;
  entity: MsEntity;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const difficultyColor = DIFFICULTY_COLORS[experiment.difficulty];

  return (
    <motion.div layout className="ms-holo overflow-hidden rounded-2xl ms-glass">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid="ms-experiment-toggle"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/4 focus:outline-none sm:px-5"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: entity.accentSoft, color: entity.accent }}
        >
          <FlaskConical className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-snug text-white/90">
            {experiment.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{
                background: `${difficultyColor}1f`,
                border: `1px solid ${difficultyColor}55`,
                color: difficultyColor,
              }}
            >
              {t(experiment.difficulty)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/45">
              <Clock className="size-3" aria-hidden="true" />
              {experiment.duration}
            </span>
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-white/40 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-white/8 px-4 py-4 sm:px-5">
              {/* hypothesis */}
              <div>
                <h5
                  className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: entity.accent }}
                >
                  <Target className="size-3.5" aria-hidden="true" />
                  {t("Hypothesis")}
                </h5>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">
                  {experiment.hypothesis}
                </p>
              </div>

              {/* method */}
              <div>
                <h5
                  className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: entity.accent }}
                >
                  <ListChecks className="size-3.5" aria-hidden="true" />
                  {t("Method")}
                </h5>
                <ol className="mt-2 space-y-1.5">
                  {experiment.method.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="ms-font-display mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                        style={{ background: entity.accentSoft, color: entity.accent }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[12.5px] leading-relaxed text-white/70">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* materials */}
                <div>
                  <h5
                    className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: entity.accent }}
                  >
                    <Beaker className="size-3.5" aria-hidden="true" />
                    {t("Materials")}
                  </h5>
                  <ul className="mt-1.5 space-y-1">
                    {experiment.materials.map((m) => (
                      <li key={m} className="flex items-start gap-2 text-[12px] leading-relaxed text-white/65">
                        <span
                          className="mt-[7px] size-1 shrink-0 rounded-full"
                          style={{ background: entity.accent }}
                          aria-hidden="true"
                        />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* outcome */}
                <div>
                  <h5
                    className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: entity.accent }}
                  >
                    <Target className="size-3.5" aria-hidden="true" />
                    {t("Expected Outcome")}
                  </h5>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">
                    {experiment.outcome}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OverviewTab({ entity }: { entity: MsEntity }) {
  const t = useT();
  const setActiveTab = useMetaScience((s) => s.setActiveTab);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <section className="ms-holo rounded-2xl p-5 ms-glass">
          <h4 className="ms-font-display text-[10px] uppercase tracking-[0.2em] text-white/45">
            {t("Identity")}
          </h4>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/75">
            {entity.intro}
          </p>
        </section>

        <section className="ms-holo rounded-2xl p-5 ms-glass">
          <h4 className="ms-font-display text-[10px] uppercase tracking-[0.2em] text-white/45">
            {t("Operating Philosophy")}
          </h4>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/75">
            {entity.philosophy}
          </p>
        </section>

        <section className="ms-holo rounded-2xl p-5 ms-glass">
          <h4 className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <Cpu className="size-3.5" aria-hidden="true" />
            {t("Core Capabilities")}
          </h4>
          <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {entity.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-[13px] leading-relaxed text-white/75">
                <span
                  className="mt-[8px] size-1.5 shrink-0 rounded-full"
                  style={{ background: entity.accent }}
                  aria-hidden="true"
                />
                {cap}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-5">
        <section className="ms-holo rounded-2xl p-5 ms-glass">
          <h4 className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <Layers className="size-3.5" aria-hidden="true" />
            {t("Focus Areas")}
          </h4>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entity.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-full px-2.5 py-1 text-[11px] text-white/75"
                style={{
                  background: entity.accentSoft,
                  border: `1px solid rgba(${entity.accentRgb}, 0.33)`,
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </section>

        <section className="ms-holo rounded-2xl p-5 ms-glass">
          <h4 className="ms-font-display text-[10px] uppercase tracking-[0.2em] text-white/45">
            {t("Channel Snapshot")}
          </h4>
          <ul className="mt-3 space-y-2">
            {entity.metrics.map((metric) => (
              <li
                key={metric.label}
                className="flex items-center justify-between gap-3 border-b border-white/6 pb-2 text-[12.5px] last:border-0 last:pb-0"
              >
                <span className="min-w-0 text-white/55">{metric.label}</span>
                <span className="flex shrink-0 items-center gap-1.5 font-medium tabular-nums text-white/90">
                  {metric.trend !== "stable" && (
                    <TrendingUp
                      className={`size-3.5 ${metric.trend === "down" ? "rotate-180" : ""}`}
                      style={{ color: entity.accent }}
                      aria-hidden="true"
                    />
                  )}
                  {metric.value}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={() => setActiveTab("communicate")}
          data-testid="ms-communicate-cta"
          className="focus-glow w-full rounded-xl px-4 py-3 text-[14px] font-bold text-black transition-shadow duration-300"
          style={{ background: entity.accent, boxShadow: `0 0 26px -8px rgba(${entity.accentRgb}, 0.8)` }}
        >
          {t("Communicate with {name}", { name: entity.name })}
        </motion.button>
      </div>
    </div>
  );
}

function ExamplesTab({ entity }: { entity: MsEntity }) {
  const t = useT();
  return (
    <div>
      <h3 className="ms-font-display text-lg font-bold uppercase tracking-[0.12em] text-white/90">
        {t("Landmark Discoveries")}
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entity.examples.map((example) => (
          <article
            key={example.id}
            className="ms-holo relative flex flex-col overflow-hidden rounded-2xl p-5 ms-glass"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl"
              style={{ background: entity.accentSoft }}
            />
            <div className="relative flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  background: entity.accentSoft,
                  border: `1px solid rgba(${entity.accentRgb}, 0.33)`,
                  color: entity.accent,
                }}
              >
                <Sparkles className="size-3" aria-hidden="true" />
                {example.category}
              </span>
              <span className="ms-font-display flex items-center gap-1 text-[10px] tabular-nums text-white/45">
                <Calendar className="size-3" aria-hidden="true" />
                {example.year}
              </span>
            </div>
            <h4 className="relative mt-3 text-[14.5px] font-semibold leading-snug text-white/90">
              {example.title}
            </h4>
            <p className="relative mt-2 flex-1 text-[12.5px] leading-relaxed text-white/60">
              {example.summary}
            </p>
            <div
              className="relative mt-3 rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="ms-font-display flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em]"
                style={{ color: entity.accent }}
              >
                <TrendingUp className="size-3" aria-hidden="true" />
                {t("Impact")}
              </span>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/65">
                {example.impact}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MsDetail({ entity, onBack }: { entity: MsEntity; onBack: () => void }) {
  const t = useT();
  const activeTab = useMetaScience((s) => s.activeTab);
  const setActiveTab = useMetaScience((s) => s.setActiveTab);

  return (
    <div
      className="relative min-h-full ms-world"
      style={
        {
          "--ms-accent": entity.accent,
          "--ms-rgb": entity.accentRgb,
        } as React.CSSProperties
      }
      data-testid="ms-detail"
    >
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="ms-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, ${entity.accentSoft}, transparent 55%)`,
          }}
        />
        <MsParticles accentRgb={entity.accentRgb} density={50} />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            data-testid="ms-back-to-hub"
            className="focus-glow flex h-8 items-center gap-2 rounded-full border border-white/12 px-3.5 text-[12px] text-white/70 transition-all duration-300 hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("Return to Lab Hub")}
          </button>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
            <MsAvatar entity={entity} size="xl" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="ms-font-display rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]"
                  style={{
                    background: entity.accentSoft,
                    border: `1px solid rgba(${entity.accentRgb}, 0.33)`,
                    color: entity.accent,
                  }}
                >
                  {entity.designation} · {entity.domain}
                </span>
                <span className="ms-font-display flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-emerald-300/80">
                  <span className="ms-pulse inline-block size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  {t("Channel open · latency 0.0ms")}
                </span>
              </div>

              <h1
                className="ms-font-display ms-text-glow mt-2.5 text-4xl font-bold sm:text-5xl md:text-6xl"
                style={{ color: entity.accent }}
                data-testid="ms-detail-name"
              >
                {entity.name}
              </h1>
              <p className="mt-3 max-w-2xl text-balance text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
                {entity.tagline}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {entity.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="ms-glass-soft rounded-xl px-3 py-2.5"
                    data-testid="ms-metric"
                  >
                    <span className="ms-font-display block text-[8.5px] uppercase tracking-[0.14em] text-white/45">
                      {metric.label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className="ms-font-display text-[15px] font-bold tabular-nums text-white/95">
                        {metric.value}
                      </span>
                      {metric.trend !== "stable" && (
                        <TrendingUp
                          className={`size-3.5 shrink-0 ${metric.trend === "down" ? "rotate-180" : ""}`}
                          style={{ color: entity.accent }}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- sticky tabs ---------- */}
      <div
        className="sticky top-0 z-20 border-b border-white/8 bg-[#05050d]/80 backdrop-blur-xl"
        role="tablist"
        aria-label={t("The channels of {name}", { name: entity.name })}
      >
        <div className="ms-scroll mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`ms-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`ms-font-display relative shrink-0 px-4 py-3 text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                  active ? "text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                {t(TAB_LABELS[tab])}
                {active && (
                  <motion.span
                    layoutId="ms-tab-underline"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    style={{
                      background: entity.accent,
                      boxShadow: `0 0 10px ${entity.accent}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- tab content ---------- */}
      <div className="mx-auto max-w-6xl px-4 py-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 md:py-8">
        {activeTab === "overview" && <OverviewTab entity={entity} />}

        {activeTab === "experiments" && (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="ms-font-display text-lg font-bold uppercase tracking-[0.12em] text-white/90">
                {t("Reproducible Experiments")}
              </h3>
              <span className="ms-font-display hidden text-[10px] uppercase tracking-[0.16em] text-white/35 sm:inline">
                {t("{n} protocols", { n: entity.experiments.length })}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {entity.experiments.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} entity={entity} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "examples" && <ExamplesTab entity={entity} />}

        {activeTab === "tools" && <MsTools entity={entity} />}

        {activeTab === "communicate" && (
          <div>
            <h3 className="ms-font-display text-lg font-bold uppercase tracking-[0.12em] text-white/90">
              {t("Direct Mirror Communication")}
            </h3>
            <div className="mt-4">
              <MsChat entity={entity} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
