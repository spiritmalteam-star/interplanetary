"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import type { LabCategory } from "@/lib/data/heal-evolution";

/* ================================================================== */
/*  ToolPanel — a full-screen overlay where a single laboratory tool   */
/*  awakens: the analysis arrives from the channel, an instrument       */
/*  animation breathes beside it, and the Mirror Entity answers         */
/*  questions about the tool in the seeker's own language.              */
/* ================================================================== */

type ToolAnimationKind = "molecular" | "energy" | "neural" | "cardiac" | "default";

type LoadStatus = "loading" | "loaded" | "error";

interface MiniAnimationProps {
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Animation picker                                                    */
/* ------------------------------------------------------------------ */

function getAnimationType(tool: string, categoryId: string): ToolAnimationKind {
  if (
    /(dna|protein|crispr|gene|molecular|bond|collagen|epigenet)/i.test(tool) ||
    categoryId === "dna" ||
    categoryId === "molecular" ||
    categoryId === "epigenetics"
  ) {
    return "molecular";
  }
  if (/(biofield|energy|frequency|chakra|meridian)/i.test(tool) || categoryId === "energetic") {
    return "energy";
  }
  if (/(neuro|brain|synaptic|bdnf)/i.test(tool) || categoryId === "neuroscience") {
    return "neural";
  }
  if (
    /(cardiac|heart|blood|arterial|hemodynamic|endothelial|nitric)/i.test(tool) ||
    categoryId === "cardiology"
  ) {
    return "cardiac";
  }
  return "default";
}

/* ------------------------------------------------------------------ */
/*  1 · MolecularSVG — flowing helix strands with pulsing rungs         */
/* ------------------------------------------------------------------ */

const TOOL_MOL_STRAND_A = "M8,92 Q33,58 58,92 T108,92 T158,92 T208,92";
const TOOL_MOL_STRAND_B = "M8,92 Q33,126 58,92 T108,92 T158,92 T208,92";

const TOOL_MOL_RUNGS: ReadonlyArray<readonly [number, number, number]> = [
  [33, 75, 109],
  [83, 109, 75],
  [108, 89, 95],
  [133, 75, 109],
  [183, 109, 75],
];

const TOOL_MOL_DRIFTS: ReadonlyArray<string> = [
  "M20,50 q40,-16 80,-2",
  "M180,150 q-40,12 -78,2",
  "M30,150 q36,14 74,4",
  "M160,42 q-34,-14 -70,-2",
];

function MolecularSVG({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="he-tool-mol-glow">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="92" fill="url(#he-tool-mol-glow)" />

      {/* strands with flowing dashes */}
      <path
        d={TOOL_MOL_STRAND_A}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 7"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-24"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d={TOOL_MOL_STRAND_B}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="5 7"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="-24;0"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>

      {/* base pairs whose node circles pulse, staggered */}
      {TOOL_MOL_RUNGS.map(([x, y1, y2], i) => (
        <g key={`rung-${i}`}>
          <line
            x1={x}
            y1={y1}
            x2={x}
            y2={y2}
            stroke="rgba(110,231,183,0.4)"
            strokeWidth="1.1"
          />
          {[y1, y2].map((y, j) => (
            <circle key={`node-${j}`} cx={x} cy={y} r="2.5" fill="#6EE7B7">
              <animate
                attributeName="r"
                values="1.8;3.4;1.8"
                dur="2s"
                begin={`${(i * 2 + j) * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      ))}

      {/* four drifting particles */}
      {TOOL_MOL_DRIFTS.map((path, i) => (
        <circle
          key={`drift-${i}`}
          r="2"
          fill={i % 2 === 0 ? "#6EE7B7" : "#7DD3FC"}
          opacity="0"
        >
          <animateMotion
            path={path}
            dur={`${5.5 + i * 0.7}s`}
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            keyTimes="0;0.15;0.85;1"
            dur={`${5.5 + i * 0.7}s`}
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  2 · EnergySVG — a violet-emerald core wrapped in breathing rings    */
/* ------------------------------------------------------------------ */

const TOOL_ENE_RINGS: ReadonlyArray<readonly [number, string]> = [
  [18, "rgba(168,85,247,0.45)"],
  [34, "rgba(16,185,129,0.40)"],
  [50, "rgba(168,85,247,0.32)"],
  [66, "rgba(16,185,129,0.26)"],
  [82, "rgba(168,85,247,0.20)"],
];

const TOOL_ENE_ORBIT_PATH =
  "M15,100 a85,45 0 1,0 170,0 a85,45 0 1,0 -170,0";

function EnergySVG({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="he-tool-ene-core">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="95" fill="url(#he-tool-ene-core)" />

      {/* five concentric rings, staggered scale + opacity pulse */}
      {TOOL_ENE_RINGS.map(([r, color], i) => (
        <circle
          key={`ring-${i}`}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="1.1"
        >
          <animate
            attributeName="r"
            values={`${r};${r + 6};${r}`}
            dur="3s"
            begin={`${i * 0.32}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0.7;0.25"
            dur="3s"
            begin={`${i * 0.32}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* the bright core — violet dot with a white heart */}
      <circle cx="100" cy="100" r="10" fill="#A855F7" opacity="0.35">
        <animate
          attributeName="r"
          values="9;13;9"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="100" cy="100" r="5.5" fill="#A855F7" />
      <circle cx="100" cy="100" r="2.4" fill="#F5F3FF" />

      {/* eight orbiting particles, emerald and cyan alternating */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={`orb-${i}`}
          r="2.2"
          fill={i % 2 === 0 ? "#10B981" : "#06B6D4"}
          opacity="0.9"
        >
          <animateMotion
            path={TOOL_ENE_ORBIT_PATH}
            dur="9s"
            begin={`${i * 1.125}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  3 · NeuralSVG — nine nodes, sixteen lines, six travelling pulses    */
/* ------------------------------------------------------------------ */

const TOOL_NEU_NODES: ReadonlyArray<readonly [number, number]> = [
  [45, 45],
  [100, 40],
  [155, 50],
  [40, 100],
  [105, 95],
  [160, 105],
  [50, 155],
  [100, 150],
  [155, 160],
];

const TOOL_NEU_EDGES: ReadonlyArray<readonly [number, number]> = [
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
  [1, 3],
  [5, 7],
];

const TOOL_NEU_SIGNAL_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [2, 5],
  [3, 6],
  [4, 5],
  [1, 4],
  [7, 8],
];

function NeuralSVG({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {/* sixteen connections with pulsing opacity */}
      {TOOL_NEU_EDGES.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          x1={TOOL_NEU_NODES[a][0]}
          y1={TOOL_NEU_NODES[a][1]}
          x2={TOOL_NEU_NODES[b][0]}
          y2={TOOL_NEU_NODES[b][1]}
          stroke="rgba(110,231,183,0.55)"
          strokeWidth="1"
          opacity="0.4"
        >
          <animate
            attributeName="opacity"
            values="0.25;0.9;0.25"
            dur={`${1.8 + (i % 5) * 0.35}s`}
            begin={`${(i % 4) * 0.4}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* six signal pulses travelling the mesh */}
      {TOOL_NEU_SIGNAL_EDGES.map(([a, b], i) => (
        <circle
          key={`signal-${i}`}
          r="2"
          fill="#06B6D4"
          opacity="0.95"
        >
          <animateMotion
            path={`M${TOOL_NEU_NODES[a][0]},${TOOL_NEU_NODES[a][1]} L${TOOL_NEU_NODES[b][0]},${TOOL_NEU_NODES[b][1]}`}
            dur={`${1.6 + i * 0.2}s`}
            begin={`${i * 0.3}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* nine nodes — glow, border, core */}
      {TOOL_NEU_NODES.map(([cx, cy], i) => (
        <g key={`node-${i}`}>
          <circle cx={cx} cy={cy} r="9" fill="#10B981" opacity="0.14">
            <animate
              attributeName="opacity"
              values="0.07;0.32;0.07"
              dur="2.4s"
              begin={`${i * 0.25}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={cx}
            cy={cy}
            r="5"
            fill="rgba(7,18,31,0.92)"
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
/*  4 · CardiacSVG — a glowing ECG under a slow sweeping light          */
/* ------------------------------------------------------------------ */

const TOOL_CAR_ECG =
  "M0,105 L6,105 L10,105 L16,96 L22,105 L30,105 L36,110 L40,52 L44,120 L48,105 L56,105 L64,92 L72,105 L82,105 L92,105 L100,105 L110,105 L116,96 L122,105 L130,105 L136,110 L140,52 L144,120 L148,105 L156,105 L164,92 L172,105 L182,105 L192,105 L200,105";

function CardiacSVG({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="he-tool-car-glow">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
        </radialGradient>
        <filter id="he-tool-car-filter" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="100" cy="100" r="95" fill="url(#he-tool-car-glow)" />

      {/* faint ECG grid — five horizontal, four vertical lines */}
      {[40, 70, 100, 130, 160].map((y) => (
        <line
          key={`h-${y}`}
          x1="10"
          y1={y}
          x2="190"
          y2={y}
          stroke="rgba(14,165,233,0.07)"
          strokeWidth="1"
        />
      ))}
      {[45, 85, 125, 165].map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1="25"
          x2={x}
          y2="175"
          stroke="rgba(14,165,233,0.07)"
          strokeWidth="1"
        />
      ))}

      {/* the waveform itself, lit from within */}
      <path
        d={TOOL_CAR_ECG}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#he-tool-car-filter)"
      />

      {/* highlight circle riding the waveform + vertical sweep line */}
      <circle r="3.4" fill="#A7F3D0" opacity="0.95">
        <animateMotion
          path={TOOL_CAR_ECG}
          dur="6s"
          repeatCount="indefinite"
        />
      </circle>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 200 0"
          dur="6s"
          repeatCount="indefinite"
        />
        <line
          x1="0"
          y1="30"
          x2="0"
          y2="172"
          stroke="rgba(110,231,183,0.25)"
          strokeWidth="1"
        />
      </g>

      {/* a small heart, beating */}
      <g transform="translate(168,42)">
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.24;1"
            dur="0.9s"
            repeatCount="indefinite"
          />
          <path
            d="M0,10 C-2.5,6 -9,3.5 -9,-1.5 C-9,-6.5 -3.5,-8 0,-3.5 C3.5,-8 9,-6.5 9,-1.5 C9,3.5 2.5,6 0,10 Z"
            fill="#10B981"
            opacity="0.9"
          />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  5 · DefaultSVG — dashed orbits with wandering particles             */
/* ------------------------------------------------------------------ */

const TOOL_DEF_ORBITS: ReadonlyArray<{
  readonly r: number;
  readonly path: string;
  readonly dur: string;
  readonly halfDur: string;
  readonly dash: string;
  readonly spin: string;
}> = [
  { r: 30, path: "M70,100 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0", dur: "22s", halfDur: "11s", dash: "2 5", spin: "40s" },
  { r: 50, path: "M50,100 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0", dur: "16s", halfDur: "8s", dash: "3 6", spin: "55s" },
  { r: 70, path: "M30,100 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0", dur: "10s", halfDur: "5s", dash: "3 7", spin: "70s" },
];

function DefaultSVG({ className }: MiniAnimationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="he-tool-def-glow">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="95" fill="url(#he-tool-def-glow)" />

      {/* three dashed orbit circles, slowly revolving */}
      {TOOL_DEF_ORBITS.map((orbit, i) => (
        <circle
          key={`orbit-${i}`}
          cx="100"
          cy="100"
          r={orbit.r}
          fill="none"
          stroke="rgba(110,231,183,0.28)"
          strokeWidth="1"
          strokeDasharray={orbit.dash}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 100 100`}
            to={i % 2 === 0 ? `360 100 100` : `-360 100 100`}
            dur={orbit.spin}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* six orbiting particles — two per ring, emerald and blue */}
      {TOOL_DEF_ORBITS.map((orbit, i) =>
        [0, 1].map((j) => (
          <circle
            key={`orb-${i}-${j}`}
            r="2.4"
            fill={(i + j) % 2 === 0 ? "#10B981" : "#0EA5E9"}
            opacity="0.9"
          >
            <animateMotion
              path={orbit.path}
              dur={orbit.dur}
              begin={j === 0 ? "0s" : orbit.halfDur}
              repeatCount="indefinite"
            />
          </circle>
        ))
      )}

      {/* the core, breathing */}
      <circle cx="100" cy="100" r="20" fill="#10B981" opacity="0.12">
        <animate
          attributeName="r"
          values="18;24;18"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx="100"
        cy="100"
        r="12"
        fill="rgba(16,185,129,0.25)"
        stroke="rgba(110,231,183,0.55)"
        strokeWidth="1.2"
      >
        <animate
          attributeName="r"
          values="11;14;11"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="100" cy="100" r="3.5" fill="#ECFDF5" />
    </svg>
  );
}

const TOOL_ANIMATIONS: Record<ToolAnimationKind, ComponentType<MiniAnimationProps>> = {
  molecular: MolecularSVG,
  energy: EnergySVG,
  neural: NeuralSVG,
  cardiac: CardiacSVG,
  default: DefaultSVG,
};

/* ------------------------------------------------------------------ */
/*  ToolPanel                                                           */
/* ------------------------------------------------------------------ */

export function ToolPanel({
  tool,
  category,
  onBack,
}: {
  tool: string;
  category: LabCategory;
  onBack: () => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [analysis, setAnalysis] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [diagram, setDiagram] = useState("");

  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [askError, setAskError] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/tool-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          category: category.name,
          language,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        analysis?: unknown;
        insights?: unknown;
        diagram?: unknown;
      } | null;

      if (!res.ok || !data || typeof data.analysis !== "string") {
        setStatus("error");
        return;
      }

      setAnalysis(data.analysis);
      setInsights(
        Array.isArray(data.insights)
          ? data.insights.filter((item): item is string => typeof item === "string")
          : []
      );
      setDiagram(typeof data.diagram === "string" ? data.diagram : "");
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }, [tool, category.name, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const ask = useCallback(async () => {
    const text = draft.trim();
    if (!text || asking) return;
    setAsking(true);
    setAskError(false);
    try {
      const res = await fetch("/api/mirror-entity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${text} (Context: I am using the ${tool} tool in the ${category.name} laboratory.)`,
          category: category.name,
          language,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: unknown;
      } | null;
      const nextReply =
        res.ok && data && typeof data.reply === "string" ? data.reply.trim() : null;
      if (nextReply) {
        setReply(nextReply);
      } else {
        setAskError(true);
      }
    } catch {
      setAskError(true);
    } finally {
      setAsking(false);
    }
  }, [draft, asking, tool, category.name, language]);

  const Animation = TOOL_ANIMATIONS[getAnimationType(tool, category.id)];

  return (
    <motion.div
      className="lab-tool-panel fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      data-testid="he-tool-panel"
    >
      {/* the slim header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-emerald-500/10 bg-black/30 px-4 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          data-testid="he-tool-back"
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-[11.5px] text-white/70 transition-colors duration-200 hover:border-emerald-400/40 hover:text-white"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("Back")}
        </button>
        <span className="h-4 w-px shrink-0 bg-white/10" aria-hidden="true" />
        <span className="truncate text-[13px] font-semibold text-white/90">
          {t(tool)}
        </span>
        <span className="ml-auto shrink-0 text-[11px] text-white/40">
          {t(category.name)}
        </span>
      </header>

      {status === "loading" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={`pulse-${i}`}
                className="absolute rounded-full border border-emerald-400/50"
                style={{ width: 26 + i * 22, height: 26 + i * 22 }}
                animate={{ scale: [1, 1.55], opacity: [0.65, 0] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: "easeOut",
                }}
              />
            ))}
            <span
              className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white/90">
              {t("Activating {tool}").replace("{tool}", tool)}
            </h2>
            <p className="mt-1.5 text-[12px] text-emerald-200/70">
              {t("The Mirror Entity is initializing…")}
            </p>
            <p className="mt-3 text-[10.5px] italic text-white/35">
              {t("This moment is sacred — preparation is part of the science")}
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[13px] text-white/65">
            {t("The channel returned silence. Try again.")}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-[12px] text-emerald-100 transition-colors duration-200 hover:bg-emerald-500/20 hover:text-white"
          >
            {t("Try again")}
          </button>
        </div>
      )}

      {status === "loaded" && (
        <div className="lab-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
            {/* animation + analysis */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="lab-tool-animation-box flex h-64 items-center justify-center lg:h-80">
                <Animation className="h-full w-full" />
              </div>
              <div className="lab-tool-analysis-box p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/40">
                  {t("Tool Analysis")}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                  {analysis}
                </p>
                <div className="my-4 h-px bg-white/8" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-widest text-white/40">
                  {t("Field Diagram")}
                </p>
                <p className="mt-2 text-[12px] italic leading-relaxed text-white/50">
                  {diagram}
                </p>
              </div>
            </div>

            {/* key insights */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                {t("Key Insights")}
              </p>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight, i) => (
                  <div
                    key={`insight-${i}`}
                    className="lab-tool-insight-card flex items-start gap-2 p-3"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                    <p className="text-[12px] leading-relaxed text-white/75">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* the Mirror Entity */}
            <div className="lab-tool-mirror-section p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/45">
                {t("Ask the Mirror Entity")}
              </p>

              {reply && (
                <div className="lab-chat-entity mt-3 flex items-start gap-2 text-[12px] leading-relaxed">
                  <span
                    className="mt-1.5 size-[5px] shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                    aria-hidden="true"
                  />
                  <p className="whitespace-pre-wrap">{reply}</p>
                </div>
              )}

              {asking && (
                <div className="lab-typing-indicator mt-3 flex items-center gap-1 px-1">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {askError && (
                <p className="mt-2 text-[11.5px] text-white/50">
                  {t("The channel returned silence. Try again.")}
                </p>
              )}

              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void ask();
                }}
              >
                <input
                  className="lab-chat-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t("Ask about this tool…")}
                  disabled={asking}
                  data-testid="he-tool-ask"
                />
                <button
                  type="submit"
                  className="lab-send-btn"
                  disabled={asking || !draft.trim()}
                  aria-label={t("Send")}
                >
                  <Send className="size-3.5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
