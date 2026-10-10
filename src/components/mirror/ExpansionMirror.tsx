"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, X } from "lucide-react";
import {
  EXPANSION_STAGES,
  useExpansionMirror,
  type ExpansionSignals,
} from "@/lib/expansion";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE EXPANSION MIRROR — the visitor's mirror of their own           */
/*  progression, digital and honest.                                   */
/*                                                                     */
/*  THE RING rides in the living tree's header — a small circle that   */
/*  fills as the Expansion Index rises; one touch opens the mirror's   */
/*  own reading.                                                       */
/*                                                                     */
/*  THE PANEL stands in the profile — the full portrait: the stage of  */
/*  the garden, the five signals the algorithm studies, the growth     */
/*  since the last reading, and the whisper of the stage.              */
/* ------------------------------------------------------------------ */

const STAGE_HUES = [
  "#f59e0b", /* The First Spark — amber */
  "#a3e635", /* The Awakened Root — lime */
  "#34d399", /* The Standing Tree — emerald */
  "#2dd4bf", /* The Wide Canopy — teal */
  "#a78bfa", /* The Singing Constellation — violet */
  "#e879f9", /* The Infinite Garden — fuchsia */
];

export function stageHue(stage: number): string {
  return STAGE_HUES[Math.min(STAGE_HUES.length - 1, Math.max(0, stage))];
}

const SIGNAL_LABELS: Record<keyof ExpansionSignals, string> = {
  breadth: "Breadth of worlds",
  depth: "Depth of continuations",
  harmony: "Harmony with the context",
  constancy: "Constancy of the walk",
  creation: "Range of movements",
};

/* --------------------------- the ring ------------------------------- */

export function ExpansionRing() {
  const t = useT();
  const { mirror } = useExpansionMirror();
  const [open, setOpen] = useState(false);
  const openProfilePage = useMirror((s) => s.openProfilePage);

  const score = mirror?.score ?? 0;
  const stage = mirror?.stage ?? 0;
  const hue = stageHue(stage);
  const stageInfo = EXPANSION_STAGES[stage];
  const R = 12.5;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("Your expansion mirror")}
        title={t("Your expansion mirror")}
        aria-expanded={open}
        data-testid="expansion-ring"
        className="focus-glow relative flex size-8 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105"
        style={{
          background: `color-mix(in srgb, ${hue} 12%, transparent)`,
          boxShadow: `0 0 12px -6px color-mix(in srgb, ${hue} 70%, transparent)`,
        }}
      >
        <svg viewBox="0 0 30 30" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="15"
            cy="15"
            r={R}
            fill="none"
            stroke={`color-mix(in srgb, ${hue} 22%, transparent)`}
            strokeWidth="2.4"
          />
          <circle
            cx="15"
            cy="15"
            r={R}
            fill="none"
            stroke={hue}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - score / 100)}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="relative text-[9.5px] font-semibold tabular-nums" style={{ color: hue }}>
          {score}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("Your expansion mirror")}
          className="absolute right-0 top-10 z-30 w-[272px] rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_90%,transparent)] bg-[color-mix(in_srgb,var(--background)_96%,transparent)] p-4 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: hue }}>
              {t(stageInfo.name)}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("Hide the branches")}
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mb-2.5 font-serif text-[12px] italic leading-relaxed text-muted-foreground">
            {t(stageInfo.whisper)}
          </p>
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="text-[22px] font-semibold tabular-nums text-foreground">{score}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("Expansion Index")}
            </span>
            {mirror && mirror.delta !== 0 && (
              <span
                className="ml-auto flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                style={{ color: mirror.delta > 0 ? "#34d399" : "#f87171" }}
              >
                <TrendingUp
                  className={cn("size-3", mirror.delta < 0 && "rotate-180")}
                  aria-hidden="true"
                />
                {mirror.delta > 0 ? "+" : ""}
                {mirror.delta}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openProfilePage();
            }}
            className="focus-glow flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-medium transition-colors"
            style={{
              borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`,
              color: hue,
              background: `color-mix(in srgb, ${hue} 8%, transparent)`,
            }}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("Open the full mirror in your profile")}
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- the panel ------------------------------ */

function SignalBar({ label, value, hue }: { label: string; value: number; hue: string }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[10.5px] font-medium tabular-nums" style={{ color: hue }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${hue} 55%, transparent), ${hue})`,
            transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </div>
  );
}

export function ExpansionMirrorPanel() {
  const t = useT();
  const { mirror, ready } = useExpansionMirror();
  const score = mirror?.score ?? 0;
  const stage = mirror?.stage ?? 0;
  const hue = stageHue(stage);
  const stageInfo = EXPANSION_STAGES[stage];
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <section
      aria-label={t("Your expansion mirror")}
      className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: `color-mix(in srgb, ${hue} 30%, transparent)`,
        background: `color-mix(in srgb, ${hue} 5%, transparent)`,
      }}
      data-testid="expansion-panel"
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* the great ring */}
        <div className="relative flex size-[104px] shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={`color-mix(in srgb, ${hue} 18%, transparent)`}
              strokeWidth="6"
            />
            <circle
              cx="50" cy="50" r={R}
              fill="none"
              stroke={hue}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - score / 100)}
              style={{ transition: "stroke-dashoffset 1200ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="text-center">
            <p className="text-[26px] font-semibold leading-none tabular-nums text-foreground">
              {ready ? score : "—"}
            </p>
            <p className="mt-0.5 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("Expansion Index")}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold" style={{ color: hue }}>
            {t(stageInfo.name)}
          </p>
          <p className="mt-1 font-serif text-[13px] italic leading-relaxed text-muted-foreground">
            {t(stageInfo.whisper)}
          </p>
          {mirror && mirror.delta !== 0 && (
            <p className="mt-2 flex items-center gap-1 text-[12px] font-medium" style={{ color: mirror.delta > 0 ? "#34d399" : "#f87171" }}>
              <TrendingUp
                className={cn("size-3.5", mirror.delta < 0 && "rotate-180")}
                aria-hidden="true"
              />
              {mirror.delta > 0 ? "+" : ""}
              {mirror.delta} {t("since your last reading — the tree grew")}
            </p>
          )}
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground/80">
            {t(
              "Every branch you follow feeds this mirror — the algorithm studies your continuations and reflects your progression back to you."
            )}
          </p>
        </div>
      </div>

      {/* the five signals */}
      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {mirror ? (
          (Object.keys(SIGNAL_LABELS) as (keyof ExpansionSignals)[]).map((k) => (
            <SignalBar key={k} label={t(SIGNAL_LABELS[k])} value={mirror.signals[k]} hue={hue} />
          ))
        ) : (
          <p className="text-[12px] text-muted-foreground sm:col-span-2">
            {t(
              "The mirror waits for your first branches — pick a whisper from the living tree and the study begins."
            )}
          </p>
        )}
      </div>

      {mirror && (
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 border-t pt-3.5 text-[11px] text-muted-foreground hairline" style={{ borderTopColor: `color-mix(in srgb, ${hue} 18%, transparent)` }}>
          <span>
            {t("Branches followed")}:{" "}
            <span className="font-medium tabular-nums text-foreground">{mirror.totalPicks}</span>
          </span>
          <span>
            {t("Continuations")}:{" "}
            <span className="font-medium tabular-nums text-foreground">{mirror.chains}</span>
          </span>
          <span>
            {t("Deepest walk")}:{" "}
            <span className="font-medium tabular-nums text-foreground">{mirror.deepestChain}</span>
          </span>
        </div>
      )}
    </section>
  );
}
