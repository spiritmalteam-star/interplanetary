"use client";

import { useId, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  THE INVENTION DRAFT — the drawing of an invention, drafted live.   */
/*  A blueprint that breathes: two counter-turning rings, motes in     */
/*  orbit, a pulsing core, a flowing line of force, and the            */
/*  invention's own body drafted per its form, so the visitor can SEE  */
/*  the invention while they read it. Transform/opacity/stroke only —  */
/*  the compositor owns every frame.                                   */
/*                                                                     */
/*  Born beside the forge's mystery chamber: the invention revealed    */
/*  on the Invent page arrives with its own animated drawing.          */
/* ------------------------------------------------------------------ */

/** The six bodies the draft knows how to draw. */
export const DRAFT_FORMS = [
  "engine",
  "instrument",
  "structure",
  "signal",
  "vessel",
  "plaything",
] as const;

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A form for a creation that arrives without one — steady per name. */
export function deriveForm(name: string): string {
  return DRAFT_FORMS[hashSeed(name) % DRAFT_FORMS.length];
}

export function InventionDraft({
  form,
  accent,
  seed,
}: {
  form: string;
  accent: string;
  seed: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const h = useMemo(() => hashSeed(seed), [seed]);
  const moteCount = 5 + (h % 4);
  const ringShift = ((h >> 3) % 3) - 1; /* -1 | 0 | 1 — the rings breathe */
  const fig = 1 + (h % 97);
  const stroke = accent;
  const CX = 160;
  const CY = 102;

  const motes = useMemo(() => {
    const out: { angle: number; r: number }[] = [];
    for (let i = 0; i < moteCount; i++) {
      out.push({
        angle: (i * 360) / moteCount + ((h >> (i + 5)) % 24) - 12,
        r: 82 + ringShift * 6,
      });
    }
    return out;
  }, [moteCount, h, ringShift]);

  const ringR = 82 + ringShift * 6;
  const innerR = 58 + ringShift * 4;

  return (
    <figure
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`,
        background:
          "color-mix(in srgb, var(--foreground) 2%, var(--background))",
      }}
      data-testid="creation-draft"
    >
      {/* the drafting paper's corner marks */}
      <span aria-hidden="true" className="mono-label absolute left-2.5 top-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
        FIG. {fig}
      </span>
      <span aria-hidden="true" className="mono-label absolute right-2.5 top-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
        {form}
      </span>
      <svg
        viewBox="0 0 320 210"
        className="block h-auto w-full"
        role="img"
        aria-label={form}
      >
        <defs>
          <pattern
            id={`grid-${uid}`}
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 14 0 L 0 0 0 14"
              fill="none"
              stroke={`color-mix(in srgb, ${stroke} 10%, transparent)`}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="320" height="210" fill={`url(#grid-${uid})`} />

        {/* the force line — flowing through the whole drawing */}
        <path
          d={`M 18 ${CY + 62} C 90 ${CY + 44}, 230 ${CY + 44}, 302 ${CY + 62}`}
          fill="none"
          stroke={`color-mix(in srgb, ${stroke} 42%, transparent)`}
          strokeWidth="1.1"
          strokeDasharray="3 7"
          className="draft-flow"
        />

        {/* the outer ring — turning one way */}
        <g className="draft-spin-rev">
          <circle
            cx={CX}
            cy={CY}
            r={ringR}
            fill="none"
            stroke={`color-mix(in srgb, ${stroke} 34%, transparent)`}
            strokeWidth="1"
            strokeDasharray="5 9"
          />
          {/* the orbiting motes */}
          {motes.map((m, i) => {
            const a = (m.angle * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={CX + m.r * Math.cos(a)}
                cy={CY + m.r * Math.sin(a)}
                r={i % 3 === 0 ? 2.4 : 1.5}
                fill={`color-mix(in srgb, ${stroke} ${i % 3 === 0 ? 80 : 45}%, transparent)`}
              />
            );
          })}
        </g>

        {/* the inner ring — turning the other way */}
        <g className="draft-spin">
          <circle
            cx={CX}
            cy={CY}
            r={innerR}
            fill="none"
            stroke={`color-mix(in srgb, ${stroke} 26%, transparent)`}
            strokeWidth="0.9"
            strokeDasharray="2 6"
          />
        </g>

        {/* the core — the invention's heart, breathing */}
        <circle
          cx={CX}
          cy={CY}
          r="5"
          fill={`color-mix(in srgb, ${stroke} 70%, transparent)`}
          className="draft-pulse"
        />

        {/* the body — drafted per the invention's own form */}
        <g
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {form === "engine" && (
            <>
              <rect x="106" y="82" width="56" height="40" rx="7" />
              <path d="M118 82 V 66 h 12 v 16" />
              <line x1="162" y1="102" x2="196" y2="102" />
              <g className="draft-spin-fast">
                <circle cx="208" cy="102" r="12" />
                <line x1="208" y1="90" x2="208" y2="114" />
                <line x1="196" y1="102" x2="220" y2="102" />
              </g>
              <line x1="96" y1="130" x2="238" y2="130" />
              <line x1="112" y1="130" x2="112" y2="140" />
              <line x1="222" y1="130" x2="222" y2="140" />
            </>
          )}
          {form === "instrument" && (
            <>
              <line x1={CX} y1="146" x2={CX} y2="56" />
              <path d={`M ${CX - 22} 56 a 22 22 0 0 1 44 0`} />
              <ellipse cx={CX} cy="76" rx="15" ry="4.5" />
              <ellipse cx={CX} cy="92" rx="11" ry="3.5" />
              <g className="draft-swing" style={{ transformOrigin: `${CX}px 56px` }}>
                <line x1={CX} y1="56" x2={CX + 38} y2="126" />
                <circle cx={CX + 38} cy="126" r="6.5" />
              </g>
              <line x1="140" y1="146" x2="180" y2="146" />
              <line x1={CX} y1="146" x2={CX - 14} y2="158" />
              <line x1={CX} y1="146" x2={CX + 14} y2="158" />
            </>
          )}
          {form === "structure" && (
            <>
              <line x1="118" y1="152" x2={CX} y2="48" />
              <line x1="202" y1="152" x2={CX} y2="48" />
              <line x1="129" y1="128" x2="191" y2="128" />
              <line x1="141" y1="104" x2="179" y2="104" />
              <line x1="129" y1="128" x2="179" y2="104" />
              <line x1="191" y1="128" x2="141" y2="104" />
              <line x1="118" y1="152" x2="202" y2="152" />
              <circle
                cx={CX}
                cy="44"
                r="5.5"
                className="draft-pulse"
                fill={`color-mix(in srgb, ${stroke} 55%, transparent)`}
                stroke="none"
              />
              <line x1="100" y1="152" x2={CX} y2="52" strokeDasharray="2 5" strokeWidth="0.9" />
              <line x1="220" y1="152" x2={CX} y2="52" strokeDasharray="2 5" strokeWidth="0.9" />
            </>
          )}
          {form === "signal" && (
            <>
              <path d={`M ${CX + 16} ${CY - 42} a 44 44 0 0 1 0 84`} className="draft-pulse" />
              <path
                d={`M ${CX + 30} ${CY - 26} a 28 28 0 0 1 0 52`}
                className="draft-pulse"
                style={{ animationDelay: "0.7s" }}
              />
              <path
                d={`M ${CX + 42} ${CY - 12} a 13 13 0 0 1 0 24`}
                className="draft-pulse"
                style={{ animationDelay: "1.4s" }}
              />
              <path d={`M ${CX - 34} ${CY - 20} a 34 34 0 0 0 0 40`} />
              <line x1={CX - 34} y1={CY} x2={CX - 12} y2={CY} />
            </>
          )}
          {form === "vessel" && (
            <>
              <path d="M 102 116 C 132 148 188 148 218 116 L 204 142 L 116 142 Z" />
              <line x1={CX} y1="116" x2={CX} y2="54" />
              <path d={`M ${CX} 58 L ${CX + 44} 108 L ${CX} 108 Z`} />
              <path d={`M ${CX - 8} 70 L ${CX - 30} 104 L ${CX - 8} 104 Z`} strokeWidth="1.2" />
              <path
                d="M 84 156 C 120 148, 200 148, 236 156"
                strokeDasharray="4 6"
                strokeWidth="1.1"
                className="draft-flow"
              />
            </>
          )}
          {form === "plaything" && (
            <>
              <g className="draft-wobble" style={{ transformOrigin: `${CX}px 100px` }}>
                <line x1={CX} y1="58" x2={CX} y2="140" />
                <path
                  d={`M ${CX} 66 C ${CX + 38} 92, ${CX + 38} 112, ${CX} 136 C ${CX - 38} 112, ${CX - 38} 92, ${CX} 66 Z`}
                />
                <ellipse cx={CX} cy="100" rx="30" ry="7" />
              </g>
              <path d={`M ${CX - 52} 148 h 104`} strokeDasharray="2 5" strokeWidth="1" />
            </>
          )}
        </g>

        {/* the draft's measure marks */}
        <g stroke={`color-mix(in srgb, ${stroke} 30%, transparent)`} strokeWidth="0.9">
          <line x1="20" y1="26" x2="36" y2="26" />
          <line x1="28" y1="18" x2="28" y2="34" />
          <line x1="284" y1="184" x2="300" y2="184" />
          <line x1="292" y1="176" x2="292" y2="192" />
        </g>
      </svg>
    </figure>
  );
}
