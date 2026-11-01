"use client";

import { memo } from "react";

/* ------------------------------------------------------------------ */
/*  THE SCOPE'S OWN SKY — every room of the house breathes beneath     */
/*  its own theme: a quiet layer of living elements that stand for     */
/*  what the scope IS, poured far behind the words.                    */
/*                                                                     */
/*  THE THREE LAWS:                                                    */
/*    1. THE WORDS FIRST — the layer never takes a touch (pointer-     */
/*       events: none), never sits above the text, never competes      */
/*       with it: few elements, low light, the edges of the room.      */
/*    2. THE WRITING YIELD — the moment the visitor starts writing,    */
/*       the sky folds away (data-dormant → opacity 0) and returns     */
/*       when the line rests again.                                    */
/*    3. THE CALM SKY — slow breaths only (12s and beyond), and a      */
/*       visitor who asked for less motion receives a still sky.       */
/*                                                                     */
/*  HYPERX WEARS SCIENCE — the discovery room's sky is its own:        */
/*  an atom with its electrons, a strand of DNA, the molecular         */
/*  lattice, the wave, and the formulas themselves drifting — so no    */
/*  other chat can be mistaken for it.                                 */
/* ------------------------------------------------------------------ */

/* ------------------------- HYPERX — the science sky ---------------- */

/** The formulas of the discovery sky — honest pieces of the real
    machinery (relativity, the wavefunction, Maxwell, de Broglie,
    uncertainty, entropy), few and far between. */
const SCIENCE_FORMULAS = [
  { text: "E = mc²", top: "12%", left: "4%", delay: "0s", dur: "26s" },
  { text: "ψ(x, t)", top: "58%", left: "2.5%", delay: "-9s", dur: "31s" },
  { text: "∇ · E = ρ/ε₀", top: "30%", left: "88%", delay: "-16s", dur: "28s" },
  { text: "λ = h / p", top: "78%", left: "84%", delay: "-5s", dur: "24s" },
  { text: "ΔE · Δt ≥ ħ/2", top: "88%", left: "38%", delay: "-12s", dur: "33s" },
] as const;

function HyperXScienceSky() {
  return (
    <>
      {/* the blueprint grid — the scientist's own paper, faint */}
      <span className="hx-sky-grid absolute inset-0" aria-hidden="true" />

      {/* THE SPACETIME WARP — the grid bent by a mass at its heart:
          relativity's own picture, resting behind the room */}
      <svg
        viewBox="0 0 400 260"
        className="absolute right-[-6%] bottom-[-4%] w-[min(400px,72vw)] opacity-[0.1] dark:opacity-[0.13]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#22d3ee" strokeWidth="0.9">
          {Array.from({ length: 7 }).map((_, i) => (
            <path
              key={`h${i}`}
              d={`M0 ${24 + i * 36} C 120 ${24 + i * 36}, 150 ${130 - Math.abs(i - 2.4) * 26}, 200 130 C 250 ${130 + Math.abs(i - 2.4) * 26}, 280 ${24 + i * 36}, 400 ${24 + i * 36}`}
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={`v${i}`}
              d={`M${24 + i * 44} 0 C ${24 + i * 44} 80, ${200 - Math.abs(i - 4) * 12} 110, 200 130 C ${200 + Math.abs(i - 4) * 12} 150, ${24 + i * 44} 180, ${24 + i * 44} 260`}
            />
          ))}
        </g>
        <circle cx="200" cy="130" r="9" fill="#e879f9" opacity="0.7" />
      </svg>

      {/* THE GRAVITATIONAL WAVE — two rings radiating from a merger,
          the spacetime's own ripple */}
      <svg
        viewBox="0 0 300 160"
        className="absolute left-[2%] bottom-[4%] w-[min(260px,58vw)] opacity-[0.13] dark:opacity-[0.16]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#e879f9" strokeWidth="1.2">
          <ellipse cx="150" cy="80" rx="130" ry="52" strokeDasharray="10 14" />
          <ellipse cx="150" cy="80" rx="96" ry="38" strokeDasharray="8 12" opacity="0.75" />
          <ellipse cx="150" cy="80" rx="60" ry="24" strokeDasharray="6 10" opacity="0.55" />
        </g>
        <circle cx="138" cy="76" r="5" fill="#22d3ee" />
        <circle cx="163" cy="84" r="4" fill="#e879f9" />
      </svg>

      {/* THE ATOM — a nucleus and three electrons on their orbits,
          the discovery room's own sigil, slowly turning */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -left-10 top-[6%] w-[190px] opacity-[0.13] dark:opacity-[0.16] [animation:amb-drift_24s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#22d3ee" strokeWidth="1.1">
          <ellipse cx="100" cy="100" rx="86" ry="32" />
          <ellipse
            cx="100"
            cy="100"
            rx="86"
            ry="32"
            transform="rotate(60 100 100)"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="86"
            ry="32"
            transform="rotate(120 100 100)"
          />
        </g>
        <circle cx="100" cy="100" r="7" fill="#e879f9" opacity="0.75" />
        <circle cx="186" cy="100" r="4" fill="#22d3ee" />
        <circle cx="57" cy="160" r="4" fill="#22d3ee" />
        <circle cx="143" cy="40" r="4" fill="#e879f9" opacity="0.8" />
      </svg>

      {/* THE HELIX — the ladder of life, one slow turn at the edge */}
      <svg
        viewBox="0 0 60 260"
        className="absolute -right-2 top-[34%] h-[240px] w-[56px] opacity-[0.12] dark:opacity-[0.15] [animation:amb-sway_19s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#e879f9" strokeWidth="1.4">
          <path d="M14 0 C 50 33, 10 66, 14 98 C 18 130, 50 164, 14 196 C 6 214, 10 238, 14 260" />
          <path
            d="M46 0 C 10 33, 50 66, 46 98 C 42 130, 10 164, 46 196 C 54 214, 50 238, 46 260"
            stroke="#22d3ee"
          />
        </g>
        <g stroke="#22d3ee" strokeWidth="1" opacity="0.7">
          <line x1="14" y1="20" x2="46" y2="20" />
          <line x1="30" y1="50" x2="30" y2="50" />
          <line x1="14" y1="80" x2="46" y2="80" />
          <line x1="14" y1="116" x2="46" y2="116" />
          <line x1="14" y1="150" x2="46" y2="150" />
          <line x1="14" y1="182" x2="46" y2="182" />
          <line x1="14" y1="214" x2="46" y2="214" />
        </g>
      </svg>

      {/* THE LATTICE — a cluster of the molecular hexagons, resting */}
      <svg
        viewBox="0 0 180 130"
        className="absolute bottom-[4%] left-[6%] w-[150px] opacity-[0.1] dark:opacity-[0.13] [animation:amb-drift_29s_ease-in-out_infinite_reverse]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#22d3ee" strokeWidth="1.1">
          <path d="M45 5 L75 22 L75 56 L45 73 L15 56 L15 22 Z" />
          <path d="M105 22 L135 39 L135 73 L105 90 L75 73 L75 39 Z" />
          <path d="M75 56 L105 73 L105 107 L75 124 L45 107 L45 73 Z" />
        </g>
        <g fill="#e879f9" opacity="0.8">
          <circle cx="45" cy="5" r="2.6" />
          <circle cx="105" cy="22" r="2.6" />
          <circle cx="75" cy="124" r="2.6" />
          <circle cx="135" cy="73" r="2.6" />
        </g>
      </svg>

      {/* THE WAVE — the signal beneath every discovery, drawn and
          redrawn along its own length */}
      <svg
        viewBox="0 0 320 60"
        className="absolute right-[8%] top-[8%] w-[240px] opacity-[0.14] dark:opacity-[0.17]"
        aria-hidden="true"
      >
        <path
          d="M0 30 Q 20 4, 40 30 T 80 30 T 120 30 T 160 30 T 200 30 T 240 30 T 280 30 T 320 30"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.6"
          strokeDasharray="10 190"
          className="[animation:amb-dash_9s_linear_infinite]"
        />
      </svg>

      {/* THE FORMULAS — the machinery's own handwriting, drifting */}
      {SCIENCE_FORMULAS.map((f) => (
        <span
          key={f.text}
          aria-hidden="true"
          className="hx-sky-formula absolute font-mono text-[12px] tracking-[0.14em] text-[#22d3ee]"
          style={{
            top: f.top,
            left: f.left,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        >
          {f.text}
        </span>
      ))}
    </>
  );
}

/* --------------------- MIRROR — the still water sky ---------------- */

function MirrorAmbientSky() {
  return (
    <>
      {/* the halo — the Mirror's own quiet crown of light */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[-18%] h-[46vh] w-[46vh] -translate-x-1/2 rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] opacity-40 [animation:amb-breathe_13s_ease-in-out_infinite]"
      />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-[-14%] h-[30vh] w-[30vh] -translate-x-1/2 rounded-full border border-[color-mix(in_srgb,var(--gd)_22%,transparent)] opacity-35 [animation:amb-breathe_13s_ease-in-out_0.9s_infinite]"
      />
      {/* the light motes — few, slow, rising like dust in a beam */}
      {[
        { left: "12%", delay: "0s", dur: "24s", size: "3px" },
        { left: "30%", delay: "-8s", dur: "29s", size: "2px" },
        { left: "58%", delay: "-15s", dur: "26s", size: "3px" },
        { left: "79%", delay: "-4s", dur: "31s", size: "2px" },
        { left: "91%", delay: "-19s", dur: "23s", size: "3px" },
      ].map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] rounded-full bg-[var(--gd)]"
          style={{
            left: m.left,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
            animationDuration: m.dur,
          }}
        />
      ))}
    </>
  );
}

/* ----------------- INTERPLANETARY — the orbiting sky --------------- */

function InterplanetaryAmbientSky() {
  return (
    <>
      {/* THE RINGED PLANET — one slow giant at the shoulder of the sky */}
      <svg
        viewBox="0 0 220 140"
        className="absolute -right-12 top-[10%] w-[210px] opacity-[0.13] dark:opacity-[0.16] [animation:amb-drift_31s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <circle cx="110" cy="70" r="34" fill="#c9a7f5" opacity="0.55" />
        <ellipse
          cx="110"
          cy="70"
          rx="62"
          ry="16"
          fill="none"
          stroke="#f7c873"
          strokeWidth="2"
          transform="rotate(-16 110 70)"
        />
        <circle cx="182" cy="52" r="3.4" fill="#f7c873" />
      </svg>
      {/* the little moon on its long walk around the room */}
      <span
        aria-hidden="true"
        className="absolute left-[6%] top-[64%] size-2 rounded-full bg-[#f7c873] opacity-50 [animation:amb-walk_38s_linear_infinite]"
      />
      {/* the far stars — five, barely lit */}
      {[
        { top: "16%", left: "18%", d: "0s" },
        { top: "40%", left: "70%", d: "-6s" },
        { top: "72%", left: "28%", d: "-11s" },
        { top: "84%", left: "60%", d: "-3s" },
        { top: "26%", left: "44%", d: "-9s" },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute size-[3px] rounded-full bg-foreground opacity-25 [animation:amb-twinkle_7s_ease-in-out_infinite]"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}
    </>
  );
}

/* --------------------- QUANTUM — the chamber sky ------------------- */

function QuantumAmbientSky() {
  return (
    <>
      {/* the probability wave — the uncertainty drawn honestly */}
      <svg
        viewBox="0 0 360 70"
        className="absolute bottom-[10%] left-[4%] w-[min(320px,72vw)] opacity-[0.13] dark:opacity-[0.16]"
        aria-hidden="true"
      >
        <path
          d="M0 40 C 40 40, 50 10, 90 10 C 130 10, 140 52, 180 52 C 220 52, 230 14, 270 14 C 300 14, 320 40, 360 40"
          fill="none"
          stroke="#7fd7c4"
          strokeWidth="1.6"
          strokeDasharray="12 220"
          className="[animation:amb-dash_11s_linear_infinite]"
        />
      </svg>
      {/* the chamber tracks — particles writing their own curves */}
      <svg
        viewBox="0 0 140 200"
        className="absolute -left-6 top-[8%] h-[190px] opacity-[0.12] dark:opacity-[0.15]"
        aria-hidden="true"
      >
        <g fill="none" strokeWidth="1.3">
          <path d="M8 190 C 30 120, 70 90, 130 78" stroke="#b8a7f5" />
          <path d="M2 150 C 40 110, 60 60, 58 4" stroke="#7fd7c4" />
          <path d="M14 170 C 60 150, 96 160, 136 140" stroke="#b8a7f5" opacity="0.7" />
        </g>
        <circle cx="130" cy="78" r="3" fill="#7fd7c4" />
        <circle cx="58" cy="4" r="3" fill="#b8a7f5" />
      </svg>
      {/* the drifting sparks — the chamber's own dust */}
      {[
        { top: "24%", left: "62%", d: "0s" },
        { top: "48%", left: "82%", d: "-7s" },
        { top: "70%", left: "50%", d: "-13s" },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute size-[4px] rounded-full bg-[#7fd7c4] opacity-30 [animation:amb-twinkle_8s_ease-in-out_infinite]"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}
    </>
  );
}

/* --------------------- HEALING — the breathing sky ------------------ */

function HealingAmbientSky() {
  return (
    <>
      {/* the breathing rings — the body's own calm, expanding */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute bottom-[-22%] left-[64%] size-[34vh] rounded-full border border-[color-mix(in_srgb,#a7e8c8_38%,transparent)] [animation:amb-breathe_12s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 4}s` }}
        />
      ))}
      {/* the pulse — one honest heartbeat drawn along its line */}
      <svg
        viewBox="0 0 300 60"
        className="absolute left-[6%] top-[14%] w-[min(260px,64vw)] opacity-[0.15] dark:opacity-[0.18]"
        aria-hidden="true"
      >
        <path
          d="M0 32 H90 L104 10 L120 52 L134 32 H150 L162 22 L172 40 L182 32 H300"
          fill="none"
          stroke="#ffd9a8"
          strokeWidth="1.6"
          strokeDasharray="14 260"
          className="[animation:amb-dash_10s_linear_infinite]"
        />
      </svg>
      {/* the warm motes — gentle lights rising like breath */}
      {[
        { left: "22%", delay: "0s", dur: "27s" },
        { left: "48%", delay: "-11s", dur: "31s" },
        { left: "70%", delay: "-6s", dur: "25s" },
      ].map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] rounded-full bg-[#a7e8c8]"
          style={{
            left: m.left,
            width: "3px",
            height: "3px",
            animationDelay: m.delay,
            animationDuration: m.dur,
          }}
        />
      ))}
    </>
  );
}

/* ----------------------- ARTX — the painted sky --------------------- */

function ArtxAmbientSky() {
  const daubs = [
    { top: "12%", left: "8%", c: "#f28ab2", s: "70px", d: "26s" },
    { top: "62%", left: "4%", c: "#f0c96a", s: "52px", d: "-9s" },
    { top: "24%", left: "84%", c: "#9fe8c1", s: "64px", d: "-15s" },
    { top: "74%", left: "88%", c: "#c9a7f5", s: "48px", d: "21s" },
  ];
  return (
    <>
      {/* the paint daubs — soft color under frosted glass */}
      {daubs.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full opacity-[0.12] blur-xl dark:opacity-[0.15] [animation:amb-drift_28s_ease-in-out_infinite]"
          style={{
            top: b.top,
            left: b.left,
            width: b.s,
            height: b.s,
            background: b.c,
            animationDelay: b.d,
          }}
        />
      ))}
      {/* the brush arcs — two strokes that never dry */}
      <svg
        viewBox="0 0 200 120"
        className="absolute bottom-[8%] left-[30%] w-[180px] opacity-[0.12] dark:opacity-[0.15]"
        aria-hidden="true"
      >
        <path
          d="M6 96 C 60 20, 140 20, 194 88"
          fill="none"
          stroke="#f28ab2"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 170"
          className="[animation:amb-dash_12s_linear_infinite]"
        />
        <path
          d="M20 110 C 70 50, 130 46, 186 104"
          fill="none"
          stroke="#f0c96a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 160"
          className="[animation:amb-dash_15s_linear_infinite_reverse]"
        />
      </svg>
    </>
  );
}

/* ----------------------- the layer itself --------------------------- */

function AmbientSkyFor(scope: string | null) {
  switch (scope ?? "mirror") {
    case "hyperx":
      return <HyperXScienceSky />;
    case "interplanetary":
      return <InterplanetaryAmbientSky />;
    case "quantum":
      return <QuantumAmbientSky />;
    case "healing":
      return <HealingAmbientSky />;
    case "artx":
      return <ArtxAmbientSky />;
    default:
      return <MirrorAmbientSky />;
  }
}

/** THE SCOPE'S OWN SKY — mounted once behind the room's words; it
    yields (fades) whenever the visitor starts writing. */
export const ScopeAmbient = memo(function ScopeAmbient({
  scope,
  dormant = false,
}: {
  scope: string | null;
  dormant?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="scope-ambient"
      data-scope={scope ?? "mirror"}
      data-dormant={dormant ? "true" : "false"}
      className="scope-ambient pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
    >
      {AmbientSkyFor(scope)}
    </div>
  );
});
