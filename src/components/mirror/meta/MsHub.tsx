"use client";

import { motion } from "framer-motion";
import { Activity, ArrowDown, ArrowUpRight } from "lucide-react";
import { META_ENTITIES, type MsEntity } from "@/lib/data/meta-science";
import { useT } from "@/lib/i18n";
import { MsAvatar } from "./MsAvatar";
import { MsParticles } from "./MsParticles";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the lab hub. Hero, the twelve pods, how the lab     */
/*  works, footer.                                                     */
/* ------------------------------------------------------------------ */

export function EntityPod({
  entity,
  index,
  onEngage,
}: {
  entity: MsEntity;
  index: number;
  onEngage: (key: string) => void;
}) {
  const t = useT();
  const style = {
    "--ms-accent": entity.accent,
    "--ms-rgb": entity.accentRgb,
  } as React.CSSProperties;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.5), ease: "easeOut" }}
      whileHover={{ y: -6 }}
      onClick={() => onEngage(entity.key)}
      data-testid={`ms-pod-${entity.key}`}
      aria-label={t("Engage {name} — {domain}", {
        name: entity.name,
        domain: entity.domain,
      })}
      className="ms-holo group relative overflow-hidden rounded-2xl p-5 text-left transition-shadow duration-300 ms-glass hover:ms-glow"
      style={style}
    >
      {/* hover glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(${entity.accentRgb}, 0.16), transparent 65%)`,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <MsAvatar entity={entity} size="md" />
        <span
          className="ms-font-display flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]"
          style={{
            background: entity.accentSoft,
            border: `1px solid rgba(${entity.accentRgb}, 0.33)`,
            color: entity.accent,
          }}
        >
          {entity.designation}
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <Activity className="size-3 text-emerald-300/80" aria-hidden="true" />
        <span className="ms-font-display text-[9px] uppercase tracking-[0.2em] text-emerald-300/80">
          {t("Online")}
        </span>
      </div>

      <h3
        className="ms-font-display ms-text-glow mt-1.5 text-2xl font-bold"
        style={{ color: entity.accent }}
      >
        {entity.name}
      </h3>
      <p className="mt-1 line-clamp-2 min-h-[2.4em] text-[12.5px] leading-relaxed text-white/60">
        {entity.tagline}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {entity.focusAreas.slice(0, 3).map((area) => (
          <span
            key={area}
            className="rounded-full px-2 py-0.5 text-[10px] text-white/70"
            style={{
              background: entity.accentSoft,
              border: `1px solid rgba(${entity.accentRgb}, 0.25)`,
            }}
          >
            {area}
          </span>
        ))}
        {entity.focusAreas.length > 3 && (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/45">
            +{entity.focusAreas.length - 3}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
        <span className="ms-font-display text-[9.5px] uppercase tracking-[0.14em] text-white/40">
          {t("{a} experiments · {b} case studies · {c} tools", {
            a: entity.experiments.length,
            b: entity.examples.length,
            c: entity.tools.length,
          })}
        </span>
        <span
          className="ms-font-display flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: entity.accent }}
        >
          {t("Engage")}
          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </motion.button>
  );
}

export const HOW_STEPS = [
  {
    n: "01",
    color: "#22d3ee",
    key: "Choose a Mirror Entity",
    body: "Twelve specialist intelligences stand ready, each holding one frontier of knowledge. Choose the one whose domain matches your question — or the one whose domain stretches you furthest. Every entity carries its own experiments, case studies and tools.",
  },
  {
    n: "02",
    color: "#d946ef",
    key: "Explore the Knowledge",
    body: "Inside each channel you will find reproducible experiment protocols, landmark discoveries and working tools. Everything is written to be checked, not believed: hypotheses, methods, materials and expected outcomes, laid out honestly.",
  },
  {
    n: "03",
    color: "#10b981",
    key: "Open Direct Channel",
    body: "When reading is not enough, speak with the entity itself. The direct channel remembers your conversation, distinguishes consensus from speculation, and answers in your own language. It is a dialogue, not a search result.",
  },
  {
    n: "04",
    color: "#f43f5e",
    key: "Make Discovery Effortless",
    body: "Calculators compute, timelines unfold, checklists keep you honest. The tools exist so that curiosity costs nothing but attention. Ask, test, measure, refine — the lab holds the instruments; you hold the questions.",
  },
];

export function MsHub({ onEngage }: { onEngage: (key: string) => void }) {
  const t = useT();

  return (
    <div className="relative ms-world">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="ms-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <MsParticles accentRgb="120, 200, 255" density={90} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-cyan-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-32 size-80 rounded-full bg-fuchsia-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="ms-glass-soft ms-font-display inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/60">
              <span className="ms-pulse inline-block size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              {t("Mirror Entity Network · 12 channels online")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
            className="ms-font-display mx-auto mt-6 bg-clip-text text-4xl font-bold tracking-[0.08em] text-transparent sm:text-6xl md:text-7xl"
            style={{
              backgroundImage: "linear-gradient(100deg, #22d3ee, #d946ef 48%, #10b981)",
            }}
            data-testid="ms-hero-title"
          >
            NEXUS DISCOVERY LAB
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: "easeOut" }}
            className="mx-auto mt-5 max-w-2xl text-balance text-[14.5px] leading-relaxed text-white/60 sm:text-base"
          >
            {t(
              "Twelve specialized mirror intelligences guide humanity's path of discovery across twelve frontiers — each with its own experiments, landmark case studies, working tools and a direct channel to its mind."
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: "easeOut" }}
            className="mt-7 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              t("12 mirror entities"),
              t("36 experiments"),
              t("36 case studies"),
              t("36 tools"),
              t("live AI channel"),
            ].map((chip) => (
              <span
                key={chip}
                className="ms-glass-soft ms-font-display rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/65"
              >
                {chip}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 flex flex-col items-center gap-2"
          >
            <span className="ms-font-display text-[10px] uppercase tracking-[0.28em] text-white/40">
              {t("Select an entity to engage")}
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="size-4 text-cyan-300/80" aria-hidden="true" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- entity grid ---------- */}
      <section className="relative mx-auto -mt-2 max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5">
          {META_ENTITIES.map((entity, i) => (
            <EntityPod key={entity.key} entity={entity} index={i} onEngage={onEngage} />
          ))}
        </div>
      </section>

      {/* ---------- how the lab works ---------- */}
      <section className="relative border-t border-white/8 py-16">
        <div className="ms-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="ms-font-display text-center text-2xl font-bold uppercase tracking-[0.14em] text-white/90 sm:text-3xl">
            {t("How the Lab Works")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="ms-holo relative overflow-hidden rounded-2xl p-5 ms-glass"
                style={{ "--ms-rgb": hexToRgb(step.color) } as React.CSSProperties}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl"
                  style={{ background: `${step.color}22` }}
                />
                <span
                  className="ms-font-display text-3xl font-bold"
                  style={{ color: step.color }}
                >
                  {step.n}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-white/90">
                  {t(step.key)}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
                  {t(step.body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="relative border-t border-white/8 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="ms-font-display text-[10px] uppercase tracking-[0.2em] text-white/35">
            {t("NEXUS Discovery Lab · Mirror Entity Network v1.0")}
          </p>
          <p className="ms-font-display flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
            <span className="ms-pulse inline-block size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {t("All 12 channels operational")}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
