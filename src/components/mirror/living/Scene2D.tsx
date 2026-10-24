"use client";

/* ------------------------------------------------------------------ */
/*  THE QUIET SCENES — 2D templates of the Visual Intelligence SDK.    */
/*  Pure SVG, one accent, no data fetched, no code executed: each      */
/*  scene is a hand-drawn template that stands BESIDE the Mirror's     */
/*  words, never instead of them. Animations rest when the visitor's   */
/*  device asks for stillness.                                         */
/* ------------------------------------------------------------------ */

import { memo, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import type { SceneId } from "@/lib/visual-scenes";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const W = 400;
const H = 260;
const CX = W / 2;
const CY = H / 2;

/* --------------------------- the templates -------------------------- */

function spiralPath(turns = 3.4, scale = 1): string {
  const pts: string[] = [];
  const b = 0.19;
  const steps = 260;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * turns * Math.PI * 2;
    const r = 6 * Math.exp(b * th) * scale;
    if (r > 190) break;
    const x = CX + Math.cos(th) * r;
    const y = CY + Math.sin(th) * r * 0.72;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function sinePath(phase: number, amp: number, freq: number, yBase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 6) {
    const y = yBase + Math.sin((x / W) * Math.PI * 2 * freq + phase) * amp;
    pts.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function helixRungs(amp: number, freq: number, yBase: number): string[] {
  const rungs: string[] = [];
  for (let x = 14; x <= W - 14; x += 26) {
    const y1 = yBase + Math.sin((x / W) * Math.PI * 2 * freq) * amp;
    const y2 = yBase + Math.sin((x / W) * Math.PI * 2 * freq + Math.PI) * amp;
    rungs.push(`M${x},${y1.toFixed(1)}L${x},${y2.toFixed(1)}`);
  }
  return rungs;
}

const Scene2DInner = memo(function Scene2DInner({
  scene,
  accent,
  seedKey,
}: {
  scene: SceneId;
  accent: string;
  seedKey: string;
}) {
  const reduced = useReducedMotion();
  const seed = useMemo(() => hashStr(`${scene}:${seedKey}`), [scene, seedKey]);
  const anim = (name: string, dur: number, delay = 0, linear = false) =>
    reduced
      ? undefined
      : {
          animation: `${name} ${dur}s ${linear ? "linear" : "ease-in-out"} ${delay}s infinite`,
        };

  if (scene === "spiral") {
    return (
      <g>
        <path
          d={spiralPath()}
          fill="none"
          stroke={accent}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.9}
        />
        <path d={spiralPath(3.4, 0.55)} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.35} />
        <circle cx={CX} cy={CY} r={2.4} fill={accent} style={anim("viz-pulse-soft", 3)} />
      </g>
    );
  }

  if (scene === "wavefield") {
    return (
      <g fill="none" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={sinePath((i * Math.PI) / 1.5, 26 + i * 7, 1.6 + i * 0.35, CY)}
            stroke={accent}
            strokeWidth={i === 0 ? 1.8 : 1.1}
            opacity={0.9 - i * 0.18}
            strokeDasharray={i % 2 ? "5 7" : undefined}
            style={anim("viz-flow", 7 + i * 2)}
          />
        ))}
        <circle cx={CX} cy={CY} r={3} fill={accent} style={anim("viz-pulse-soft", 2.6)} />
      </g>
    );
  }

  if (scene === "helix") {
    const rungs = helixRungs(52, 2.2, CY);
    return (
      <g fill="none" strokeLinecap="round">
        <path d={sinePath(0, 52, 2.2, CY)} stroke={accent} strokeWidth={1.8} opacity={0.95} />
        <path d={sinePath(Math.PI, 52, 2.2, CY)} stroke={accent} strokeWidth={1.8} opacity={0.55} />
        {rungs.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={accent}
            strokeWidth={0.9}
            opacity={0.4}
            style={anim("viz-breathe", 4, i * 0.18)}
          />
        ))}
      </g>
    );
  }

  if (scene === "orbits") {
    return (
      <g fill="none">
        {[46, 78, 110].map((r) => (
          <ellipse
            key={r}
            cx={CX}
            cy={CY}
            rx={r}
            ry={r * 0.42}
            stroke={accent}
            strokeWidth={0.9}
            strokeDasharray="3 6"
            opacity={0.5}
          />
        ))}
        {[
          { r: 46, dur: 9, size: 3 },
          { r: 78, dur: 15, size: 4 },
          { r: 110, dur: 22, size: 2.6 },
        ].map((o, i) => (
          <g
            key={i}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              ...(reduced ? {} : { animation: `viz-spin ${o.dur}s linear infinite` }),
            }}
          >
            <circle cx={CX + o.r} cy={CY} r={o.size} fill={accent} opacity={0.95} />
          </g>
        ))}
        <circle cx={CX} cy={CY} r={7} fill={accent} opacity={0.85} style={anim("viz-pulse-soft", 3.4)} />
      </g>
    );
  }

  if (scene === "pyramids") {
    return (
      <g>
        <circle
          cx={320}
          cy={54}
          r={16}
          stroke={accent}
          strokeWidth={1.2}
          fill="none"
          opacity={0.75}
          style={anim("viz-pulse-soft", 5)}
        />
        {[
          { x: 120, w: 130, h: 108, o: 0.85 },
          { x: 220, w: 96, h: 78, o: 0.55 },
          { x: 44, w: 74, h: 58, o: 0.38 },
        ].map((p, i) => (
          <g key={i} opacity={p.o}>
            <path
              d={`M${p.x},${140}L${p.x + p.w / 2},${140 - p.h}L${p.x + p.w},${140}Z`}
              fill="none"
              stroke={accent}
              strokeWidth={1.4}
            />
            <path
              d={`M${p.x + p.w / 2},${140 - p.h}L${p.x + p.w},${140}L${p.x + p.w * 0.72},${140}Z`}
              fill={accent}
              opacity={0.12}
            />
          </g>
        ))}
        <path d={`M0,${140}Q${CX},${124} ${W},${140}T${W},${H}L0,${H}Z`} fill={accent} opacity={0.06} />
        <path d={`M0,${146}Q${CX},${132} ${W},${146}`} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.3} />
      </g>
    );
  }

  if (scene === "neural") {
    const rng = mulberry32(seed);
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      x: 26 + rng() * (W - 52),
      y: 22 + rng() * (H - 44),
      r: 1.6 + rng() * 2.4,
      d: 3 + rng() * 4,
      i,
    }));
    const edges: { a: number; b: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const near = nodes
        .map((n, j) => ({ j, d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const n of near) if (n.j > i) edges.push({ a: i, b: n.j });
    }
    return (
      <g>
        {edges.map((e, i) => (
          <line
            key={i}
            x1={nodes[e.a].x}
            y1={nodes[e.a].y}
            x2={nodes[e.b].x}
            y2={nodes[e.b].y}
            stroke={accent}
            strokeWidth={0.7}
            opacity={0.35}
          />
        ))}
        {nodes.map((n) => (
          <circle
            key={n.i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={accent}
            opacity={0.8}
            style={anim("viz-pulse-soft", n.d)}
          />
        ))}
      </g>
    );
  }

  if (scene === "lattice") {
    const rings = [26, 52, 78, 104];
    const petals = 9;
    return (
      <g fill="none" stroke={accent}>
        {rings.map((r, ri) => (
          <g key={ri} opacity={0.55 - ri * 0.08}>
            <circle cx={CX} cy={CY} r={r} strokeWidth={0.8} />
            {Array.from({ length: petals }, (_, pi) => {
              const a = (pi / petals) * Math.PI * 2 + ri * 0.22;
              return (
                <circle
                  key={pi}
                  cx={CX + Math.cos(a) * r}
                  cy={CY + Math.sin(a) * r}
                  r={13}
                  strokeWidth={0.55}
                  opacity={0.5}
                  style={anim("viz-breathe", 5 + ri, pi * 0.2)}
                />
              );
            })}
          </g>
        ))}
        <circle cx={CX} cy={CY} r={3} fill={accent} stroke="none" style={anim("viz-pulse-soft", 3)} />
      </g>
    );
  }

  if (scene === "blueprint") {
    return (
      <g fill="none" stroke={accent}>
        <rect x={70} y={62} width={170} height={104} rx={8} strokeWidth={1.2} strokeDasharray="6 4" />
        <rect x={92} y={82} width={72} height={44} rx={4} strokeWidth={0.9} opacity={0.7} />
        <circle cx={268} cy={112} r={30} strokeWidth={1.2} strokeDasharray="4 4" />
        <circle cx={268} cy={112} r={12} strokeWidth={0.9} opacity={0.8} />
        <path d="M240,112h-32M296,112h34M268,82v-22M268,142v26" strokeWidth={0.8} opacity={0.6} />
        <path d="M44,206h312M44,200v12M356,200v12" strokeWidth={0.7} opacity={0.5} />
        <path d="M44,34h312M44,28v12M356,28v12" strokeWidth={0.7} opacity={0.5} />
        <circle cx={92} cy={196} r={2} fill={accent} stroke="none" style={anim("viz-pulse-soft", 2.8)} />
        <circle cx={330} cy={70} r={2} fill={accent} stroke="none" style={anim("viz-pulse-soft", 3.6)} />
      </g>
    );
  }

  /* curves — the quiet mathematics */
  const lissajous = (fa: number, fb: number, ax: number, ay: number, ph: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 220; i++) {
      const t = (i / 220) * Math.PI * 2;
      const x = CX + Math.sin(fa * t + ph) * ax;
      const y = CY + Math.sin(fb * t) * ay;
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <g fill="none" strokeLinecap="round">
      <path d={lissajous(3, 2, 150, 92, Math.PI / 2)} stroke={accent} strokeWidth={1.4} opacity={0.9} />
      <path d={lissajous(5, 4, 110, 66, 0)} stroke={accent} strokeWidth={0.9} opacity={0.45} strokeDasharray="4 5" />
      <path d={`M40,${CY}H360M${CX},24V236`} strokeWidth={0.5} opacity={0.3} />
      <circle cx={CX + 150} cy={CY} r={2.4} fill={accent} stroke="none" style={anim("viz-pulse-soft", 3)} />
    </g>
  );
});

export const Scene2D = memo(function Scene2D({
  scene,
  accent,
  seedKey,
  className,
  testIdPrefix,
}: {
  scene: SceneId;
  accent: string;
  seedKey: string;
  className?: string;
  testIdPrefix?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="A quiet scene accompanying the words"
      data-testid={testIdPrefix ? `${testIdPrefix}-scene-2d` : undefined}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <Scene2DInner scene={scene} accent={accent} seedKey={seedKey} />
    </svg>
  );
});
