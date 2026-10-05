"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { SUGGESTION_TREE } from "@/lib/data/suggestion-tree";
import {
  DNA_UPDATE_EVENT,
  LEARNING_IDENTITY_EVENT,
  loadJourney,
  type JourneyStep,
} from "@/lib/learning-branches";

/* ------------------------------------------------------------------ */
/*  THE DNA EVOLUTIONARY TIMELINE — the walk's own helix.              */
/*                                                                     */
/*  While the visitor chases the branches — every leading branch the   */
/*  conversation arrives at, every scope bloomed, every whisper picked  */
/*  — the walk is kept as a quiet line of steps. This component         */
/*  renders those steps as a double helix: one rung per moment of the   */
/*  journey, colored by the branch it belonged to, newest at the        */
/*  right. It lives in the visitor's profile, not above the tree —      */
/*  the tree stays a tree.                                              */
/* ------------------------------------------------------------------ */

/** One hue per branch of the walk. */
const JOURNEY_COLORS: Record<string, string> = {
  channeling: "#e8d9a8",
  interplanetary: "#b9a5e0",
  healing: "#8fc9a8",
  quantum: "#7fc4c0",
  evolvemed: "#d98ca6",
  invent: "#d9a06b",
  manifesting: "#e6c87a",
};

/** The helix itself — one rung per step, two strands twisting through. */
export function DnaHelix({ steps }: { steps: JourneyStep[] }) {
  const t = useT();
  const shown = steps.slice(0, 24).reverse(); /* oldest first → newest right */
  const n = shown.length;
  const stepW = 22;
  const amp = 11;
  const mid = 26;
  const omega = Math.PI / 2.4;
  const w = Math.max(72, n * stepW + 24);
  const xAt = (i: number) => 12 + i * stepW;
  const yA = (i: number) => mid + amp * Math.sin(i * omega);
  const yB = (i: number) => mid - amp * Math.sin(i * omega);
  const strand = (fn: (i: number) => number) =>
    shown
      .map(
        (_, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${fn(i).toFixed(1)}`
      )
      .join(" ");
  const labelFor = (s: JourneyStep) => {
    const branchLabel =
      s.b === "channeling"
        ? t("Channeling")
        : t(SUGGESTION_TREE.find((b) => b.id === s.b)?.label ?? s.b);
    return s.s ? `${branchLabel} · ${t(s.s)}` : branchLabel;
  };

  return (
    <svg
      viewBox={`0 0 ${w} 52`}
      width="100%"
      preserveAspectRatio="xMaxYMid meet"
      role="img"
      aria-label={t("The path you have walked")}
      className="block"
      style={{ height: 52 }}
    >
      <path
        d={strand(yA)}
        fill="none"
        stroke="var(--gd)"
        strokeOpacity={0.4}
        strokeWidth={1.2}
      />
      <path
        d={strand(yB)}
        fill="none"
        stroke="var(--gd)"
        strokeOpacity={0.4}
        strokeWidth={1.2}
      />
      {shown.map((s, i) => {
        const c = JOURNEY_COLORS[s.b] ?? "var(--gd)";
        return (
          <g key={`${s.at}-${i}`}>
            <line
              x1={xAt(i)}
              y1={yA(i)}
              x2={xAt(i)}
              y2={yB(i)}
              stroke={c}
              strokeOpacity={0.8}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <circle cx={xAt(i)} cy={yA(i)} r={1.8} fill={c} />
            <circle cx={xAt(i)} cy={yB(i)} r={1.8} fill={c} />
            <title>{labelFor(s)}</title>
          </g>
        );
      })}
    </svg>
  );
}

/** The walk, kept alive — loads the journey and follows its updates. */
export function useJourney(): JourneyStep[] {
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  useEffect(() => {
    const reload = () => setJourney(loadJourney());
    /* deferred — the walk is read after the first paint */
    const id = window.setTimeout(reload, 0);
    window.addEventListener(DNA_UPDATE_EVENT, reload);
    window.addEventListener(LEARNING_IDENTITY_EVENT, reload);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(DNA_UPDATE_EVENT, reload);
      window.removeEventListener(LEARNING_IDENTITY_EVENT, reload);
    };
  }, []);
  return journey;
}
