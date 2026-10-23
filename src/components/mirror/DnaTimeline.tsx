"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/i18n";
import { SUGGESTION_TREE } from "@/lib/data/suggestion-tree";
import {
  DNA_UPDATE_EVENT,
  LEARNING_IDENTITY_EVENT,
  loadJourney,
  type JourneyStep,
} from "@/lib/learning-branches";

/* ------------------------------------------------------------------ */
/*  THE DNA EVOLUTIONARY TIMELINE — the walk's own helix, alive.       */
/*                                                                     */
/*  While the visitor chases the branches — every leading branch the   */
/*  conversation arrives at, every scope bloomed, every whisper picked */
/*  — the walk is kept as a quiet line of steps. The helix renders     */
/*  those steps as a double helix that BREATHES: the strands draw      */
/*  themselves in, a pulse of light travels each strand forever, the   */
/*  rungs glow in the rhythm of their own branch, and a soft sheen     */
/*  sweeps the whole ladder — the path is not a record, it is a        */
/*  living thing. It lives in the visitor's profile, not above the     */
/*  tree — the tree stays a tree.                                      */
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

const HELIX_ID = "dna-helix-path";

/** The helix — one rung per step, two living strands twisting through. */
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
      viewBox={`0 0 ${w} 56`}
      width="100%"
      preserveAspectRatio="xMaxYMid meet"
      role="img"
      aria-label={t("The path you have walked")}
      className="dna-helix block"
      style={{ height: 56 }}
    >
      <defs>
        {/* the sheen that sweeps the ladder */}
        <linearGradient id="dna-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0.14" />
          <stop offset="55%" stopColor="white" stopOpacity="0.14" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* the traveling pulse's glow */}
        <filter id="dna-pulse-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the two strands — drawn in once, then resting as the ladder */}
      <path
        d={strand(yA)}
        fill="none"
        stroke="var(--gd)"
        strokeOpacity={0.4}
        strokeWidth={1.2}
        pathLength={100}
        className="dna-strand"
      />
      <path
        d={strand(yB)}
        fill="none"
        stroke="var(--gd)"
        strokeOpacity={0.4}
        strokeWidth={1.2}
        pathLength={100}
        className="dna-strand dna-strand-b"
      />
      <path id={HELIX_ID} d={strand(yA)} fill="none" stroke="none" />
      <path id={`${HELIX_ID}-b`} d={strand(yB)} fill="none" stroke="none" />

      {/* the rungs — each glowing in its branch's color, staggered */}
      {shown.map((s, i) => {
        const c = JOURNEY_COLORS[s.b] ?? "var(--gd)";
        return (
          <g key={`${s.at}-${i}`} className="dna-rung" style={{ ["--rung-i" as string]: i }}>
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

      {/* the light that never stops walking the path — both strands */}
      {n > 1 && (
        <>
          <circle r={2.4} fill="#fff" opacity={0.95} filter="url(#dna-pulse-glow)">
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${HELIX_ID}`} />
            </animateMotion>
          </circle>
          <circle r={2.1} fill="#fff" opacity={0.8} filter="url(#dna-pulse-glow)">
            <animateMotion dur="7.5s" begin="1.4s" repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
              <mpath href={`#${HELIX_ID}-b`} />
            </animateMotion>
          </circle>
        </>
      )}

      {/* the sheen — a slow sweep of light across the whole helix */}
      <rect x="-40%" y="0" width="40%" height="100%" fill="url(#dna-sheen)" className="dna-sheen" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  THE TRAJECTORY OF YOUR BECOMING — the path's evolution, drawn      */
/*  as one living line: how the walk rose (cumulative steps) and       */
/*  widened (unique branches) day by day.                              */
/* ------------------------------------------------------------------ */

interface TrajectoryPoint {
  day: string;
  total: number;
  breadth: number;
  branches: string[];
}

function buildTrajectory(steps: JourneyStep[]): TrajectoryPoint[] {
  const byDay = new Map<string, { total: number; branches: Set<string> }>();
  for (const s of steps) {
    const day = new Date(s.at);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const bucket = byDay.get(key) ?? { total: 0, branches: new Set<string>() };
    bucket.total += 1;
    bucket.branches.add(s.b);
    byDay.set(key, bucket);
  }
  const days = [...byDay.keys()].sort();
  const seen = new Set<string>();
  let total = 0;
  let breadth = 0;
  return days.map((day) => {
    const bucket = byDay.get(day)!;
    total += bucket.total;
    for (const b of bucket.branches) {
      if (!seen.has(b)) {
        seen.add(b);
        breadth += 1;
      }
    }
    return { day, total, breadth, branches: [...bucket.branches] };
  });
}

export function TrajectoryEvolution({ steps }: { steps: JourneyStep[] }) {
  const t = useT();
  const points = useMemo(() => buildTrajectory(steps), [steps]);

  /* the chart's geometry — drawn alive on mount */
  const w = 560;
  const h = 132;
  const padX = 10;
  const padTop = 14;
  const padBottom = 22;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const maxTotal = Math.max(1, points[points.length - 1]?.total ?? 1);
  const maxBreadth = Math.max(1, ...points.map((p) => p.breadth));
  const xAt = (i: number) =>
    points.length === 1 ? padX + innerW / 2 : padX + (i / (points.length - 1)) * innerW;
  const yTotal = (v: number) => padTop + innerH - (v / maxTotal) * innerH;
  const yBreadth = (v: number) => padTop + innerH - (v / maxBreadth) * innerH;

  const totalPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yTotal(p.total).toFixed(1)}`)
    .join(" ");
  const breadthPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yBreadth(p.breadth).toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 1
      ? `${totalPath} L ${xAt(points.length - 1).toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : "";

  /* momentum — this week against the week before */
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = steps.filter((s) => now - s.at <= week).length;
  const prevWeek = steps.filter((s) => now - s.at > week && now - s.at <= week * 2).length;
  const momentum = thisWeek - prevWeek;
  const branchCounts = new Map<string, number>();
  for (const s of steps) branchCounts.set(s.b, (branchCounts.get(s.b) ?? 0) + 1);
  const deepest = [...branchCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const deepestLabel = deepest
    ? deepest[0] === "channeling"
      ? t("Channeling")
      : t(SUGGESTION_TREE.find((b) => b.id === deepest[0])?.label ?? deepest[0])
    : "—";

  if (points.length === 0) {
    return (
      <section className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5 text-center">
        <p className="font-serif text-[15px] italic text-muted-foreground">
          {t("The trajectory draws itself with the first steps of the walk.")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-4 sm:p-5" data-testid="trajectory-evolution">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("Steps walked"), value: `${steps.length}` },
          {
            label: t("Branches widened"),
            value: `${branchCounts.size}`,
          },
          {
            label: t("This week's pull"),
            value: momentum > 0 ? `+${momentum}` : `${momentum}`,
          },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border hairline bg-[var(--glass-bg)] px-3 py-2.5">
            <p className="text-[16px] font-semibold leading-none text-foreground/95">{tile.value}</p>
            <p className="mono-label mt-1.5 truncate text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {tile.label}
            </p>
          </div>
        ))}
      </div>

      <div className="no-scrollbar mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          style={{ minHeight: h }}
          role="img"
          aria-label={t("The trajectory of your becoming")}
          className="block"
        >
          <defs>
            <linearGradient id="traj-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gd)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--gd)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="traj-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--gd)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--gd)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* the rise of the walk — area + line, drawn in once */}
          {areaPath && <path d={areaPath} fill="url(#traj-area)" className="traj-area" />}
          <path
            d={totalPath}
            fill="none"
            stroke="url(#traj-line)"
            strokeWidth={2}
            strokeLinecap="round"
            pathLength={100}
            className="traj-line"
          />

          {/* the widening — the dashed breadth line */}
          {points.length > 1 && (
            <path
              d={breadthPath}
              fill="none"
              stroke="var(--gd)"
              strokeOpacity={0.45}
              strokeWidth={1.2}
              strokeDasharray="3 4"
              strokeLinecap="round"
              pathLength={100}
              className="traj-line traj-line-breadth"
            />
          )}

          {/* the days' own lights */}
          {points.map((p, i) => (
            <g key={p.day}>
              <circle cx={xAt(i)} cy={yTotal(p.total)} r={2.6} fill="var(--gd)" className="traj-node" style={{ ["--node-i" as string]: i }}>
                <title>{`${p.day} · ${t("{n} steps", { n: p.total })} · ${p.branches.length} ${t("branches")}`}</title>
              </circle>
              {(i === 0 || i === points.length - 1 || points.length <= 8) && (
                <text
                  x={xAt(i)}
                  y={h - 6}
                  textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                  className="fill-current text-[9px] text-muted-foreground/70"
                  style={{ fontSize: 9 }}
                >
                  {p.day.slice(5)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="mono-label flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
          <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded-full" style={{ background: "var(--gd)" }} />
          {t("The rise — steps carried")}
        </span>
        <span className="mono-label flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">
          <span aria-hidden="true" className="inline-block h-px w-4 border-t border-dashed" style={{ borderColor: "var(--gd)" }} />
          {t("The widening — branches opened")}
        </span>
        <span className="mono-label ml-auto text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {t("Deepest thread · {name}", { name: deepestLabel })}
        </span>
      </div>
    </section>
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
