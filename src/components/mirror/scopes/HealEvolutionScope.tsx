"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import {
  LAB_CATEGORIES,
  getLabCategory,
  type LabCategory,
  type LabTag,
} from "@/lib/data/heal-evolution";
import { useHealScope } from "@/lib/heal-scope-store";
import { useT } from "@/lib/i18n";
import { MiniProcedureAnimation } from "../heal/MiniProcedureAnimation";
import { ToolPanel } from "../heal/ToolPanel";
import { StudyPageView } from "../heal/StudyPageView";
import { CATEGORY_ICONS } from "../heal/category-icons";
import "../heal/laboratory.css";

/* ================================================================== */
/*  HEAL EVOLUTION SCOPE — the evolution laboratory living INSIDE the  */
/*  one shared house. The shell paints the laboratory's dark emerald   */
/*  light behind the whole content column while the nav, sidebar and   */
/*  composer keep standing; this scope contributes the hub of twelve   */
/*  disciplines, each opening a board of research topics and           */
/*  instruments, with the ToolPanel / StudyPageView overlays floating  */
/*  above everything, self-contained, with their own back.             */
/* ================================================================== */

const TAG_CLASS: Record<LabTag, string> = {
  Core: "lab-tag",
  Advanced: "lab-tag-blue",
  Research: "lab-tag-purple",
  Applied: "lab-tag-gold",
};

interface ActiveTool {
  tool: string;
  category: LabCategory;
}

interface ActiveStudy {
  category: LabCategory;
  topic: string;
}

/* ------------------------------------------------------------------ */
/*  Hub — no discipline chosen yet: the twelve disciplines             */
/* ------------------------------------------------------------------ */

function ScopeHub({ onSelect }: { onSelect: (category: LabCategory) => void }) {
  const t = useT();

  const chips = [t("12 Categories"), t("60+ Tools"), t("AI Mirror")];

  return (
    <>
      {/* the hero */}
      <div className="relative z-10 px-4 pb-7 pt-8 text-center sm:px-6">
        <span className="he-font-display inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1 text-[9.5px] uppercase tracking-[0.2em] text-emerald-200/80">
          <Activity className="size-3 text-emerald-300" aria-hidden="true" />
          {t("Heal Evolution · the evolution laboratory")}
        </span>
        <h2
          data-testid="he-scope-title"
          className="he-font-display mx-auto mt-4 bg-clip-text text-3xl font-bold tracking-[0.08em] text-transparent sm:text-5xl"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #00ff88, #00b4d8 55%, #a855f7)",
          }}
        >
          HEAL EVOLUTION LABORATORY
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[13px] text-white/60">
          {t("Twelve healing disciplines · the evolution laboratory")}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="he-font-display rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/60"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* the discipline grid */}
      <div className="relative z-10 grid grid-cols-1 gap-3.5 px-4 pb-8 sm:grid-cols-2 sm:px-6">
        {LAB_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.icon];
          return (
            <motion.button
              key={category.id}
              type="button"
              whileHover={{ y: -4 }}
              onClick={() => onSelect(category)}
              data-testid={`he-category-card-${category.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.06]"
              style={
                { "--lab-category-color": category.color } as React.CSSProperties
              }
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background:
                      "color-mix(in srgb, var(--lab-category-color) 14%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--lab-category-color) 35%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  <Icon
                    className="size-4"
                    style={{ color: "var(--lab-category-color)" }}
                  />
                </span>
                <span className="truncate text-[13.5px] font-semibold text-white/90">
                  {t(category.name)}
                </span>
                <span className="he-font-display ml-auto shrink-0 text-[9px] uppercase tracking-[0.16em] text-white/35">
                  {t("{n} tools", { n: category.tools.length })}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-white/55">
                {t(category.description)}
              </p>
              <div className="lab-board-bg mt-3 h-20 overflow-hidden rounded-lg border border-white/5">
                <MiniProcedureAnimation
                  procedureId={category.id}
                  className="h-full w-full"
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Board — one discipline's study surface                             */
/* ------------------------------------------------------------------ */

function ScopeBoard({
  category,
  onBack,
  onStudy,
  onTool,
}: {
  category: LabCategory;
  onBack: () => void;
  onStudy: (topic: string) => void;
  onTool: (tool: string) => void;
}) {
  const t = useT();
  const Icon = CATEGORY_ICONS[category.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="he-scope-board"
    >
      {/* back row */}
      <div className="px-4 pt-5 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          data-testid="he-board-back"
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-white/12 px-3 text-[12px] text-white/75 transition-colors hover:border-emerald-400/40 hover:text-white"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("Back")}
        </button>
      </div>

      {/* the discipline's header */}
      <div className="mt-4 px-4 sm:px-6">
        <div
          className="lab-category-glow-line"
          style={
            { "--lab-category-color": category.color } as React.CSSProperties
          }
          aria-hidden="true"
        />
        <div className="mt-3 flex items-start gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--lab-category-color) 14%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--lab-category-color) 35%, transparent)",
            }}
            aria-hidden="true"
          >
            <Icon
              className="size-4"
              style={{ color: "var(--lab-category-color)" }}
            />
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-white/95">
              {t(category.name)}
            </h3>
            <p className="text-[12px] leading-relaxed text-white/55">
              {t(category.description)}
            </p>
          </div>
        </div>
      </div>

      {/* the living procedure animation */}
      <div className="mt-4 px-4 sm:px-6">
        <div className="lab-board-bg h-36 overflow-hidden rounded-xl border border-white/8">
          <MiniProcedureAnimation
            procedureId={category.id}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* research topics */}
      <section className="mt-6 px-4 sm:px-6" aria-label={t("Research Topics")}>
        <p className="he-font-display text-[10px] uppercase tracking-[0.22em] text-white/40">
          {t("Research Topics")}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {category.cards.map((card, i) => (
            <div key={card.title} className="lab-research-card">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-semibold leading-snug text-white/90">
                  {t(card.title)}
                </h4>
                <span className={`shrink-0 ${TAG_CLASS[card.tag]}`}>
                  {t(card.tag)}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                {t(card.description)}
              </p>
              <button
                type="button"
                onClick={() => onStudy(card.title)}
                data-testid={`he-study-btn-${i}`}
                className="lab-study-btn mt-3"
              >
                <GraduationCap className="size-3" aria-hidden="true" />
                {t("Study")}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* laboratory tools */}
      <section
        className="mt-6 px-4 pb-8 sm:px-6"
        aria-label={t("Laboratory Tools")}
      >
        <p className="he-font-display text-[10px] uppercase tracking-[0.22em] text-white/40">
          {t("Laboratory Tools")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {category.tools.map((tool, index) => (
            <button
              key={tool}
              type="button"
              onClick={() => onTool(tool)}
              data-testid={`he-tool-${category.id}-${index}`}
              className="lab-tool-btn"
            >
              <GraduationCap className="size-3 opacity-60" aria-hidden="true" />
              {t(tool)}
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  The scope itself — hub ⇄ board inside one emerald world, with      */
/*  the tool / study overlays floating above                           */
/* ------------------------------------------------------------------ */

export function HealEvolutionScope() {
  /* The open discipline lives in the heal-scope store so the scope's
     sidebar register and the board stay one navigation. */
  const activeCategoryId = useHealScope((s) => s.activeCategoryId);
  const closeCategory = useHealScope((s) => s.closeCategory);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [activeStudy, setActiveStudy] = useState<ActiveStudy | null>(null);

  const activeCategory: LabCategory | null = activeCategoryId
    ? (getLabCategory(activeCategoryId) ?? null)
    : null;

  return (
    <>
      <div
        className="relative overflow-hidden"
        data-testid="healevolution-scope"
      >
        {/* the laboratory's quiet atmosphere — shared by hub and board */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-40 size-80 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden="true"
        />

        {activeCategory === null ? (
          <ScopeHub onSelect={(category) => useHealScope.getState().openCategory(category.id)} />
        ) : (
          <ScopeBoard
            key={`board-${activeCategory.id}`}
            category={activeCategory}
            onBack={closeCategory}
            onStudy={(topic) =>
              setActiveStudy({ category: activeCategory, topic })
            }
            onTool={(tool) => setActiveTool({ tool, category: activeCategory })}
          />
        )}
      </div>

      {/* the self-contained overlays — fixed inset-0 z-50, their own back */}
      <AnimatePresence>
        {activeTool && (
          <ToolPanel
            key="he-tool-panel"
            tool={activeTool.tool}
            category={activeTool.category}
            onBack={() => setActiveTool(null)}
          />
        )}
        {activeStudy && (
          <StudyPageView
            key="he-study-page"
            category={activeStudy.category}
            topic={activeStudy.topic}
            onBack={() => setActiveStudy(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
