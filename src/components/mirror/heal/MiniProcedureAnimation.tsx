"use client";

import type { ComponentType } from "react";

/* ================================================================== */
/*  MiniProcedureAnimation — pure presentational procedure visuals.   */
/*  No hooks, no fetch: every animation is SMIL (<animate>,           */
/*  <animateTransform>, <animateMotion>) or CSS inside the SVG.       */
/*  All share viewBox "0 0 400 144" and the laboratory palette.        */
/* ================================================================== */

type MiniAnimationKind =
  | "dna"
  | "molecular"
  | "cell"
  | "energetic"
  | "pigmentation"
  | "neural"
  | "cardiac"
  | "generic";

interface MiniAnimationProps {
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  1 · DNA — twin strands, base-pair pulses, a travelling repair spark */
/* ------------------------------------------------------------------ */

const MINI_DNA_STRAND_A =
  "M0,42 C17,42 33,102 50,102 C67,102 83,42 100,42 C117,42 133,102 150,102 C167,102 183,42 200,42 C217,42 233,102 250,102 C267,102 283,42 300,42 C317,42 333,102 350,102 C367,102 383,42 400,42";

const MINI_DNA_STRAND_B =
  "M0,102 C17,102 33,42 50,42 C67,42 83,102 100,102 C117,102 133,42 150,42 C167,42 183,102 200,102 C217,102 233,42 250,42 C267,42 283,102 300,102 C317,102 333,42 350,42 C367,42 383,102 400,102";

const MINI_DNA_PAIRS: ReadonlyArray<readonly [number, number, number]> = [
  [12.5, 51, 93],
  [62.5, 93, 51],
  [112.5, 51, 93],
  [162.5, 93, 51],
  [212.5, 51, 93],
  [262.5, 93, 51],
  [312.5, 51, 93],
  [362.5, 93, 51],
];

function DNAAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mini-dna-glow">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft under-glow of the strands */}
      <path
        d={MINI_DNA_STRAND_A}
        fill="none"
        stroke="#10B981"
        strokeOpacity="0.16"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={MINI_DNA_STRAND_B}
        fill="none"
        stroke="#06B6D4"
        strokeOpacity="0.14"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* base pairs — staggered opacity pulses */}
      {MINI_DNA_PAIRS.map(([x, yA, yB], i) => (
        <line
          key={`pair-${i}`}
          x1={x}
          y1={yA}
          x2={x}
          y2={yB}
          stroke="#34D399"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.35"
        >
          <animate
            attributeName="opacity"
            values="0.2;0.9;0.2"
            dur="2.4s"
            begin={`${i * 0.3}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* the strands themselves */}
      <path
        d={MINI_DNA_STRAND_A}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d={MINI_DNA_STRAND_B}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* four glow nodes breathing along the ladder */}
      {[12.5, 112.5, 212.5, 312.5].map((x, i) => (
        <circle
          key={`glow-${i}`}
          cx={x}
          cy={51}
          r="7"
          fill="url(#mini-dna-glow)"
        >
          <animate
            attributeName="opacity"
            values="0.35;0.9;0.35"
            dur="3s"
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* the repair spark — a golden ring riding strand A */}
      <circle
        r="4"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="1.6"
        opacity="0"
      >
        <animateMotion
          path={MINI_DNA_STRAND_A}
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.95;0"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values="2;7;2"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  2 · Molecular — bonded atoms adrift, one expanding resonance ripple */
/* ------------------------------------------------------------------ */

const MINI_MOL_ATOMS: ReadonlyArray<{
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly color: string;
  readonly dur: string;
  readonly drift: string;
}> = [
  { cx: 200, cy: 72, r: 9, color: "#10B981", dur: "3.8s", drift: "0 0; 2 -3; -2 2; 0 0" },
  { cx: 140, cy: 48, r: 6, color: "#06B6D4", dur: "4.4s", drift: "0 0; -3 2; 2 -2; 0 0" },
  { cx: 148, cy: 104, r: 5, color: "#0EA5E9", dur: "3.4s", drift: "0 0; 2 3; -2 -1; 0 0" },
  { cx: 262, cy: 44, r: 7, color: "#A855F7", dur: "4.1s", drift: "0 0; -2 -3; 3 2; 0 0" },
  { cx: 256, cy: 102, r: 6, color: "#10B981", dur: "3.6s", drift: "0 0; 3 -2; -2 3; 0 0" },
  { cx: 322, cy: 72, r: 4, color: "#F59E0B", dur: "4.6s", drift: "0 0; -2 2; 2 -3; 0 0" },
  { cx: 112, cy: 72, r: 5, color: "#06B6D4", dur: "3.9s", drift: "0 0; 2 -2; -3 2; 0 0" },
];

function MolecularAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mini-mol-glow">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="72" r="14" fill="url(#mini-mol-glow)" opacity="0.6">
        <animate
          attributeName="opacity"
          values="0.35;0.8;0.35"
          dur="3.6s"
          repeatCount="indefinite"
        />
      </circle>

      {/* bonds */}
      {MINI_MOL_ATOMS.slice(1).map((atom, i) => (
        <line
          key={`bond-${i}`}
          x1="200"
          y1="72"
          x2={atom.cx}
          y2={atom.cy}
          stroke="rgba(110,231,183,0.28)"
          strokeWidth="1.2"
        />
      ))}

      {/* one expanding resonance ripple from the central atom */}
      <circle
        cx="200"
        cy="72"
        r="10"
        fill="none"
        stroke="#10B981"
        strokeWidth="1.4"
      >
        <animate
          attributeName="r"
          values="10;70"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* atoms, each afloat on its own rhythm */}
      {MINI_MOL_ATOMS.map((atom, i) => (
        <g key={`atom-${i}`}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={atom.drift}
            dur={atom.dur}
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
          <circle cx={atom.cx} cy={atom.cy} r={atom.r} fill={atom.r > 6 ? "rgba(10,20,40,0.9)" : atom.color} stroke={atom.color} strokeWidth="1.6" />
          {atom.r > 6 && (
            <circle cx={atom.cx} cy={atom.cy} r={atom.r - 4} fill={atom.color} opacity="0.85" />
          )}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  3 · Cell — membrane, nucleus, a golden mitochondrion and its ATP    */
/* ------------------------------------------------------------------ */

const MINI_CELL_ATP: ReadonlyArray<{
  readonly path: string;
  readonly dur: string;
  readonly begin: string;
}> = [
  { path: "M290,52 q34,6 62,20", dur: "3.6s", begin: "0s" },
  { path: "M290,52 q28,-18 58,-24", dur: "4.2s", begin: "0.8s" },
  { path: "M290,52 q20,22 44,38", dur: "3.9s", begin: "1.6s" },
  { path: "M290,52 q8,-30 26,-44", dur: "4.5s", begin: "2.4s" },
  { path: "M290,52 q40,-6 70,4", dur: "4s", begin: "3.2s" },
];

function CellAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {/* outer membrane, gently breathing */}
      <ellipse
        cx="200"
        cy="72"
        rx="158"
        ry="62"
        fill="rgba(16,185,129,0.04)"
        stroke="rgba(110,231,183,0.35)"
        strokeWidth="1.5"
      >
        <animate
          attributeName="ry"
          values="62;65;62"
          dur="5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* energy ripple radiating from the nucleus */}
      <circle
        cx="140"
        cy="82"
        r="22"
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1.3"
        opacity="0"
      >
        <animate
          attributeName="r"
          values="22;64"
          dur="3.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.4;0"
          dur="3.2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* nucleus */}
      <circle
        cx="140"
        cy="82"
        r="22"
        fill="rgba(6,182,212,0.12)"
        stroke="rgba(6,182,212,0.5)"
        strokeWidth="1.4"
      />
      <circle cx="140" cy="82" r="8" fill="rgba(6,182,212,0.4)">
        <animate
          attributeName="r"
          values="7;9;7"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* mitochondrion with wavy cristae */}
      <g transform="rotate(-14 290 52)">
        <ellipse
          cx="290"
          cy="52"
          rx="30"
          ry="13"
          fill="rgba(245,158,11,0.10)"
          stroke="rgba(245,158,11,0.55)"
          strokeWidth="1.2"
        />
        <path
          d="M266,52 Q272,44 280,52 T294,52 T308,52"
          fill="none"
          stroke="rgba(252,211,77,0.65)"
          strokeWidth="1.1"
        />
      </g>

      {/* ATP particles drifting outward */}
      {MINI_CELL_ATP.map((atp, i) => (
        <circle key={`atp-${i}`} r="2.4" fill="#FCD34D" opacity="0">
          <animateMotion
            path={atp.path}
            dur={atp.dur}
            begin={atp.begin}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.15;0.8;1"
            dur={atp.dur}
            begin={atp.begin}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  4 · Energetic — a figure of light, chakras, rings and orbiters      */
/* ------------------------------------------------------------------ */

const MINI_ENE_CHAKRAS: ReadonlyArray<{
  readonly cy: number;
  readonly color: string;
}> = [
  { cy: 44, color: "#A855F7" },
  { cy: 58, color: "#0EA5E9" },
  { cy: 72, color: "#10B981" },
  { cy: 84, color: "#F59E0B" },
  { cy: 96, color: "#06B6D4" },
];

const MINI_ENE_RINGS: ReadonlyArray<readonly [number, number]> = [
  [34, 40],
  [52, 58],
  [70, 77],
  [88, 96],
];

const MINI_ENE_ORBIT_PATH =
  "M90,76 a110,52 0 1,0 220,0 a110,52 0 1,0 -220,0";

function EnergeticAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {/* concentric energy rings around the body */}
      {MINI_ENE_RINGS.map(([r, peak], i) => (
        <circle
          key={`ring-${i}`}
          cx="200"
          cy="76"
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? "rgba(16,185,129,0.3)" : "rgba(168,85,247,0.26)"}
          strokeWidth="1"
        >
          <animate
            attributeName="r"
            values={`${r};${peak};${r}`}
            dur="3.6s"
            begin={`${i * 0.45}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.55;0.2"
            dur="3.6s"
            begin={`${i * 0.45}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* orbiting particles — emerald and violet alternating */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={`orb-${i}`}
          r="2.5"
          fill={i % 2 === 0 ? "#10B981" : "#A855F7"}
          opacity="0.85"
        >
          <animateMotion
            path={MINI_ENE_ORBIT_PATH}
            dur="10s"
            begin={`${i * 1.25}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* the abstract figure of light */}
      <circle
        cx="200"
        cy="28"
        r="10"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="2"
      />
      <path
        d="M200,40 L200,92 M200,52 L172,68 M200,52 L228,68 M200,92 L184,124 M200,92 L216,124"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* chakra dots pulsing in sequence down the spine */}
      {MINI_ENE_CHAKRAS.map((chakra, i) => (
        <circle
          key={`chakra-${i}`}
          cx="200"
          cy={chakra.cy}
          r="3"
          fill={chakra.color}
        >
          <animate
            attributeName="r"
            values="2.2;4.4;2.2"
            dur="3s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="3s"
            begin={`${i * 0.4}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  5 · Pigmentation — three skin layers, melanocytes, a healing wave   */
/* ------------------------------------------------------------------ */

function PigmentationAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="mini-pig-clip">
          <rect x="40" y="14" width="320" height="112" rx="10" />
        </clipPath>
      </defs>

      {/* three stacked skin layers */}
      <rect
        x="40"
        y="18"
        width="320"
        height="30"
        rx="8"
        fill="rgba(226,240,255,0.06)"
        stroke="rgba(226,240,255,0.16)"
        strokeWidth="1"
      />
      <rect
        x="40"
        y="52"
        width="320"
        height="32"
        rx="8"
        fill="rgba(168,85,247,0.07)"
        stroke="rgba(168,85,247,0.22)"
        strokeWidth="1"
      />
      <rect
        x="40"
        y="88"
        width="320"
        height="34"
        rx="8"
        fill="rgba(14,165,233,0.07)"
        stroke="rgba(14,165,233,0.22)"
        strokeWidth="1"
      />

      {/* the vertical dividing line */}
      <line
        x1="200"
        y1="14"
        x2="200"
        y2="126"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* melanocyte dots pulsing in sequence within the middle layer */}
      {[85, 133, 181, 229, 277, 325].map((cx, i) => (
        <circle
          key={`mel-${i}`}
          cx={cx}
          cy="68"
          r="3"
          fill="#FCD34D"
        >
          <animate
            attributeName="r"
            values="2.4;4.4;2.4"
            dur="2.8s"
            begin={`${i * 0.35}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.55;1;0.55"
            dur="2.8s"
            begin={`${i * 0.35}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* the healing wave sweeping left → right */}
      <g clipPath="url(#mini-pig-clip)">
        <path
          d="M0,70 Q10,56 20,70 T40,70 T60,70 T80,70 T100,70 T120,70 T140,70 T160,70 T180,70 T200,70 T220,70 T240,70 T260,70 T280,70 T300,70 T320,70 T340,70 T360,70 T380,70 T400,70 T420,70 T440,70 T460,70 T480,70"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          opacity="0"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-480 0; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            keyTimes="0;0.1;0.85;1"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  6 · Neural — an organic mesh, signal travellers, one broad pulse    */
/* ------------------------------------------------------------------ */

const MINI_NEU_NODES: ReadonlyArray<readonly [number, number]> = [
  [70, 38],
  [200, 30],
  [330, 44],
  [56, 80],
  [204, 74],
  [344, 86],
  [90, 122],
  [210, 116],
  [332, 124],
];

const MINI_NEU_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 7],
  [7, 8],
  [0, 4],
];

const MINI_NEU_SIGNALS: ReadonlyArray<readonly [number, number, string, string]> = [
  [0, 1, "1.8s", "0s"],
  [4, 5, "2.2s", "0.5s"],
  [6, 7, "2s", "1s"],
  [3, 4, "2.4s", "1.5s"],
];

function NeuralAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {/* broad soft pulse wave expanding from the center */}
      <circle
        cx="204"
        cy="76"
        r="12"
        fill="none"
        stroke="rgba(16,185,129,0.4)"
        strokeWidth="1.2"
        opacity="0"
      >
        <animate
          attributeName="r"
          values="12;140"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.35;0"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* connections with breathing opacity */}
      {MINI_NEU_EDGES.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          x1={MINI_NEU_NODES[a][0]}
          y1={MINI_NEU_NODES[a][1]}
          x2={MINI_NEU_NODES[b][0]}
          y2={MINI_NEU_NODES[b][1]}
          stroke="rgba(110,231,183,0.28)"
          strokeWidth="1"
          opacity="0.5"
        >
          <animate
            attributeName="opacity"
            values="0.25;0.85;0.25"
            dur={`${2.2 + (i % 5) * 0.4}s`}
            begin={`${(i % 4) * 0.45}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* signals travelling along connections */}
      {MINI_NEU_SIGNALS.map(([a, b, dur, begin], i) => (
        <circle
          key={`signal-${i}`}
          r="2.5"
          fill="#06B6D4"
          opacity="0.95"
        >
          <animateMotion
            path={`M${MINI_NEU_NODES[a][0]},${MINI_NEU_NODES[a][1]} L${MINI_NEU_NODES[b][0]},${MINI_NEU_NODES[b][1]}`}
            dur={dur}
            begin={begin}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* nodes — blurred glow, border, bright core */}
      {MINI_NEU_NODES.map(([cx, cy], i) => (
        <g key={`node-${i}`}>
          <circle cx={cx} cy={cy} r="9" fill="#10B981" opacity="0.16">
            <animate
              attributeName="opacity"
              values="0.08;0.35;0.08"
              dur="2.6s"
              begin={`${i * 0.28}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={cx}
            cy={cy}
            r="4.5"
            fill="rgba(7,18,31,0.9)"
            stroke="#34D399"
            strokeWidth="1"
          />
          <circle cx={cx} cy={cy} r="1.8" fill="#6EE7B7" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  7 · Cardiac — a glowing ECG, a travelling highlight, a sweeping line */
/* ------------------------------------------------------------------ */

const MINI_CAR_ECG =
  "M0,76 L40,76 Q55,60 70,76 L95,76 L102,86 L114,22 L126,104 L134,76 L150,76 C160,76 166,58 178,76 L200,76 L240,76 Q255,60 270,76 L295,76 L302,86 L314,22 L326,104 L334,76 L350,76 C360,76 366,58 378,76 L400,76";

function CardiacAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id="mini-car-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* baseline guides */}
      <line
        x1="0"
        y1="76"
        x2="400"
        y2="76"
        stroke="rgba(110,231,183,0.10)"
        strokeWidth="1"
      />

      {/* the ECG waveform, lit from within */}
      <path
        d={MINI_CAR_ECG}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#mini-car-glow)"
      />

      {/* highlight circle riding the waveform */}
      <circle r="3.5" fill="#A7F3D0" opacity="0.95">
        <animateMotion
          path={MINI_CAR_ECG}
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* vertical sweep line crossing left → right */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 400 0"
          dur="5s"
          repeatCount="indefinite"
        />
        <line
          x1="0"
          y1="18"
          x2="0"
          y2="130"
          stroke="rgba(110,231,183,0.22)"
          strokeWidth="1"
        />
      </g>

      {/* the heart-rate dot, blinking */}
      <circle cx="368" cy="28" r="3" fill="#F59E0B">
        <animate
          attributeName="opacity"
          values="1;0.15;1"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="368" cy="28" r="7" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1">
        <animate
          attributeName="r"
          values="5;10;5"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  8 · GenericWave — three layered tides over one expanding circle     */
/* ------------------------------------------------------------------ */

const MINI_GEN_WAVES: ReadonlyArray<{
  readonly d: string;
  readonly color: string;
  readonly opacity: number;
  readonly dur: string;
  readonly width: number;
}> = [
  {
    d: "M-40,76 Q-30,24 -20,76 T0,76 T20,76 T40,76 T60,76 T80,76 T100,76 T120,76 T140,76 T160,76 T180,76 T200,76 T220,76 T240,76 T260,76 T280,76 T300,76 T320,76 T340,76 T360,76 T380,76 T400,76 T420,76 T440,76",
    color: "#10B981",
    opacity: 0.85,
    dur: "6s",
    width: 2,
  },
  {
    d: "M-40,76 Q-30,44 -20,76 T0,76 T20,76 T40,76 T60,76 T80,76 T100,76 T120,76 T140,76 T160,76 T180,76 T200,76 T220,76 T240,76 T260,76 T280,76 T300,76 T320,76 T340,76 T360,76 T380,76 T400,76 T420,76 T440,76",
    color: "#06B6D4",
    opacity: 0.6,
    dur: "4.6s",
    width: 1.6,
  },
  {
    d: "M-40,76 Q-30,60 -20,76 T0,76 T20,76 T40,76 T60,76 T80,76 T100,76 T120,76 T140,76 T160,76 T180,76 T200,76 T220,76 T240,76 T260,76 T280,76 T300,76 T320,76 T340,76 T360,76 T380,76 T400,76 T420,76 T440,76",
    color: "#0EA5E9",
    opacity: 0.42,
    dur: "8s",
    width: 1.4,
  },
];

function GenericWaveAnimation({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 400 144"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="mini-gen-clip">
          <rect x="0" y="0" width="400" height="144" />
        </clipPath>
      </defs>

      {/* one expanding circle behind the tides */}
      <circle cx="200" cy="76" r="24" fill="rgba(16,185,129,0.10)" opacity="0">
        <animate
          attributeName="r"
          values="24;100"
          dur="3.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0"
          dur="3.6s"
          repeatCount="indefinite"
        />
      </circle>

      <g clipPath="url(#mini-gen-clip)">
        {MINI_GEN_WAVES.map((wave, i) => (
          <path
            key={`wave-${i}`}
            d={wave.d}
            fill="none"
            stroke={wave.color}
            strokeOpacity={wave.opacity}
            strokeWidth={wave.width}
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`-40 0; 0 0; -40 0`}
              dur={wave.dur}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Dispatcher                                                          */
/* ------------------------------------------------------------------ */

const MINI_ANIMATIONS: Record<MiniAnimationKind, ComponentType<MiniAnimationProps>> = {
  dna: DNAAnimation,
  molecular: MolecularAnimation,
  cell: CellAnimation,
  energetic: EnergeticAnimation,
  pigmentation: PigmentationAnimation,
  neural: NeuralAnimation,
  cardiac: CardiacAnimation,
  generic: GenericWaveAnimation,
};

function getMiniAnimationKind(procedureId: string): MiniAnimationKind {
  switch (procedureId) {
    case "dna":
    case "epigenetics":
      return "dna";
    case "molecular":
      return "molecular";
    case "mitochondrial":
    case "detox":
      return "cell";
    case "energetic":
    case "endocrinology":
      return "energetic";
    case "dermatology":
      return "pigmentation";
    case "neuroscience":
      return "neural";
    case "cardiology":
      return "cardiac";
    default:
      return "generic";
  }
}

export function MiniProcedureAnimation({
  procedureId,
  className,
}: {
  procedureId: string;
  className?: string;
}) {
  const Animation = MINI_ANIMATIONS[getMiniAnimationKind(procedureId)];
  return <Animation className={className} />;
}
