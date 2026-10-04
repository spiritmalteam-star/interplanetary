"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Shuffle,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  saAlignments,
  saDials,
  saPlates,
  saSquares,
  saWhispers,
  saWorld,
} from "@/lib/data/synth-analog";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  SYNTH ANALOG — the cosmic frequency interface                      */
/*                                                                      */
/*  A category of ParticleX, and a fully independent world: the        */
/*  analog realm drawn into the digital. An Aztec Sun border guards    */
/*  three circles of frequency — twelve elemental dials (Circle 1),    */
/*  twelve transmutation plates (Circle 2) and the Quantum Mirror      */
/*  Core wearing the interlocking rotating squares of the Tzolkin      */
/*  (Circle 3). Bring one dial, one plate and one square glyph to      */
/*  the apex and the hidden cosmic formulas sound themselves.          */
/*                                                                      */
/*  Palette law: Mesoamerican gold + jade on obsidian; the daylight    */
/*  laboratory answers in bronze ink. The gifted golden sigil sits     */
/*  at the mirror core — radiant gold in deep space, bronze by day.    */
/* ================================================================== */

/* ------------------------- the instrument CSS ----------------------- */

const SA_CSS = `
.sa-root {
  --sa-gold: #8A6A1C;
  --sa-gold-soft: #A9853A;
  --sa-gold-bright: #6E5414;
  --sa-jade: #177E67;
  --sa-ink: #4A4132;
  --sa-plate: #F3EBD8;
  --sa-plate-deep: #E9DFC6;
  --sa-band: #B08F45;
}
.dark .sa-root {
  --sa-gold: #D9AE4E;
  --sa-gold-soft: #B98F3B;
  --sa-gold-bright: #F2CE73;
  --sa-jade: #3BD6B2;
  --sa-ink: #EBDFC2;
  --sa-plate: #1B1611;
  --sa-plate-deep: #241D15;
  --sa-band: #C99A2E;
}
@keyframes sa-breathe { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
.sa-breathe { animation: sa-breathe 2.8s ease-in-out infinite; }
.sa-ring {
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  transform-box: view-box;
  transform-origin: 450px 450px;
}
.sa-hit { cursor: pointer; }
.sa-hit:hover .sa-hit-shape { stroke: var(--sa-gold-bright); stroke-width: 2.4; }
@media (prefers-reduced-motion: reduce) {
  .sa-ring { transition: none !important; }
  .sa-breathe { animation: none !important; opacity: 0.7; }
}
`;

/* --------------------------- geometry ------------------------------- */

const CX = 450;
const CY = 450;

/** One point on the instrument's circles — 0° at twelve o'clock. */
const pt = (radius: number, angleDeg: number) => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
};

/* The Aztec border — 24 ray points, four step pyramids on the
   diagonal temples, four kin suns on the cardinals, and a step-fret
   meander woven between. */
const PYRAMID_ANGLES = [45, 135, 225, 315];
const KIN_ANGLES = [0, 90, 180, 270];
const RAY_ANGLES = Array.from({ length: 24 }, (_, i) => i * 15);
const FRET_ANGLES = RAY_ANGLES.filter(
  (a) => !PYRAMID_ANGLES.includes(a) && !KIN_ANGLES.includes(a)
);

/* --------------------------- ink helpers ---------------------------- */

const hexPath = (r: number) => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 90) * Math.PI) / 180;
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
};

const STEPPED_PYRAMID =
  "M -15 9 L -15 2 L -8 2 L -8 -5 L -2 -5 L -2 -12 L 2 -12 L 2 -5 L 8 -5 L 8 2 L 15 2 L 15 9 Z";
const STEP_FRET = "M -9 5 L -9 -5 L -1 -5 L -1 3 L 5 3 L 5 -3";
const OUT_RAY = "M 0 -11 L 5.5 1 L -5.5 1 Z";

/* --------------------- the persistent codex ------------------------- */
/*  The remembered formulas live in localStorage and reach React
    through a tiny external store — no state cascades, cross-tab safe.
    The key is the one the instrument has always signed, so the
    formulas a visitor has already discovered stay remembered. */

const CODEX_KEY = "px-synth-codex-v1";
const CODEX_EVENT = "px-synth-codex-change";
const CODEX_EMPTY: string[] = [];

let codexCache: string[] | null = null;

const readCodex = (): string[] => {
  try {
    const raw = window.localStorage.getItem(CODEX_KEY);
    if (!raw) return CODEX_EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return CODEX_EMPTY;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return CODEX_EMPTY;
  }
};

const getCodex = (): string[] => {
  if (!codexCache) codexCache = readCodex();
  return codexCache;
};

const subscribeCodex = (onChange: () => void) => {
  window.addEventListener(CODEX_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CODEX_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/** Remember one formula in the browser's own codex. */
const rememberCodex = (id: string) => {
  const current = getCodex();
  if (current.includes(id)) return;
  const next = [...current, id];
  try {
    window.localStorage.setItem(CODEX_KEY, JSON.stringify(next));
  } catch {
    /* the codex stays in memory when the browser refuses */
  }
  codexCache = next;
  window.dispatchEvent(new Event(CODEX_EVENT));
};

/* --------------------------- small parts ---------------------------- */

/** One ring's turning control — the keyboard path around the wheel. */
function SaStepper({
  ring,
  label,
  current,
  onStep,
}: {
  ring: "outer" | "mid" | "square";
  label: string;
  current: string;
  onStep: (dir: 1 | -1) => void;
}) {
  const t = useT();
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border px-2 py-1.5"
      style={{
        borderColor: "color-mix(in srgb, var(--sa-gold) 32%, transparent)",
        background: "color-mix(in srgb, var(--sa-gold) 6%, transparent)",
      }}
    >
      <button
        type="button"
        onClick={() => onStep(-1)}
        aria-label={t("Turn the {ring} counter-clockwise", { ring: t(label) })}
        data-testid={`sa-ring-${ring}-ccw`}
        className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--sa-gold)_16%,transparent)] hover:text-foreground"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-0 flex-1 text-center leading-tight">
        <span className="mono-label block truncate text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
          {t(label)}
        </span>
        <span
          className="block truncate text-[12.5px] font-semibold text-foreground"
          data-testid={`sa-ring-${ring}-name`}
        >
          {t(current)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onStep(1)}
        aria-label={t("Turn the {ring} clockwise", { ring: t(label) })}
        data-testid={`sa-ring-${ring}-cw`}
        className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--sa-gold)_16%,transparent)] hover:text-foreground"
      >
        <RotateCw className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ============================== the world =========================== */

export function SynthAnalog() {
  const exitSynth = useMirror((s) => s.exitSynth);
  const t = useT();

  /* The three wheels — kept as NET steps so the rotation is one
     continuous line: the wheels never spin backwards at a wrap. */
  const [outerNet, setOuterNet] = useState(0);
  const [midNet, setMidNet] = useState(0);
  const [squareNet, setSquareNet] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [zoom, setZoom] = useState(false);

  const outerIdx = ((outerNet % 12) + 12) % 12;
  const midIdx = ((midNet % 12) + 12) % 12;
  const squareIdx = ((squareNet % 12) + 12) % 12;

  /* the remembered formulas — an external store over localStorage */
  const discovered = useSyncExternalStore(
    subscribeCodex,
    getCodex,
    () => CODEX_EMPTY
  );
  const [burst, setBurst] = useState(0);

  /* the resonance tone */
  const audioRef = useRef<AudioContext | null>(null);
  const [sounding, setSounding] = useState<number | null>(null);

  const dial = saDials[outerIdx];
  const plate = saPlates[midIdx];
  const square = saSquares[squareIdx];

  /* the alignment engine — one triple across the three circles */
  const alignment = useMemo(
    () =>
      saAlignments.find(
        (a) =>
          a.dial === dial.id && a.plate === plate.id && a.square === square.id
      ) ?? null,
    [dial.id, plate.id, square.id]
  );

  /* The wheels' resting triple — mirrored in a ref so rapid turns
     (batched between renders) still read the true resting signs.
     A formula fires the moment its three signs meet — spoken from
     the turning hands themselves, never from an effect. */
  const tripleRef = useRef({ o: 0, m: 0, s: 0 });

  const checkAndReveal = (o: number, m: number, s: number) => {
    const found = saAlignments.find(
      (a) =>
        a.dial === saDials[o].id &&
        a.plate === saPlates[m].id &&
        a.square === saSquares[s].id
    );
    if (!found || discovered.includes(found.id)) return;
    rememberCodex(found.id);
    setBurst((b) => b + 1);
    toast.success(t("A cosmic formula reveals itself"), {
      description: `${t(found.name)} · ${found.code}`,
    });
  };

  const setNetOf = (ring: "outer" | "mid" | "square") =>
    ring === "outer"
      ? setOuterNet
      : ring === "mid"
        ? setMidNet
        : setSquareNet;

  /* bring a wheel to a chosen sign by its shortest path.
     `silent` skips the reveal check — used when all three wheels
     move at once, so only the resting triple is ever read. */
  const bringTo = (
    ring: "outer" | "mid" | "square",
    target: number,
    silent = false
  ) => {
    const idx =
      ring === "outer"
        ? tripleRef.current.o
        : ring === "mid"
          ? tripleRef.current.m
          : tripleRef.current.s;
    let delta = ((target - idx) % 12 + 12) % 12;
    if (delta > 6) delta -= 12;
    const nextIdx = ((idx + delta) % 12 + 12) % 12;
    tripleRef.current = {
      o: ring === "outer" ? nextIdx : tripleRef.current.o,
      m: ring === "mid" ? nextIdx : tripleRef.current.m,
      s: ring === "square" ? nextIdx : tripleRef.current.s,
    };
    if (!silent) {
      const { o, m, s } = tripleRef.current;
      checkAndReveal(o, m, s);
    }
    setNetOf(ring)((n) => n + delta);
  };

  const step = (ring: "outer" | "mid" | "square", dir: 1 | -1) => {
    const idx =
      ring === "outer"
        ? tripleRef.current.o
        : ring === "mid"
          ? tripleRef.current.m
          : tripleRef.current.s;
    const nextIdx = ((idx + dir) % 12 + 12) % 12;
    tripleRef.current = {
      o: ring === "outer" ? nextIdx : tripleRef.current.o,
      m: ring === "mid" ? nextIdx : tripleRef.current.m,
      s: ring === "square" ? nextIdx : tripleRef.current.s,
    };
    const { o, m, s } = tripleRef.current;
    checkAndReveal(o, m, s);
    setNetOf(ring)((n) => n + dir);
  };

  /* the wheels seek on their own — every circle turns to a new sign,
     and only the triple they rest on is read aloud */
  const seek = () => {
    const o = Math.floor(Math.random() * 12);
    const m = Math.floor(Math.random() * 12);
    const s = Math.floor(Math.random() * 12);
    bringTo("outer", o, true);
    bringTo("mid", m, true);
    bringTo("square", s, true);
    tripleRef.current = { o, m, s };
    checkAndReveal(o, m, s);
    setSeeking(true);
    window.setTimeout(() => setSeeking(false), 1000);
  };

  /* the resonance tone — a soft sung partial chord at the formula's Hz */
  const playTone = (freq: number) => {
    try {
      const Ctx =
        window.AudioContext ??
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!Ctx) return;
      void audioRef.current?.close();
      const ctx = new Ctx();
      audioRef.current = ctx;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.2, now + 0.14);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
      master.connect(ctx.destination);
      const partials: [number, number][] = [
        [1, 1],
        [2, 0.26],
        [3, 0.09],
        [0.5, 0.13],
      ];
      for (const [mult, g] of partials) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * mult;
        const og = ctx.createGain();
        og.gain.value = g;
        osc.connect(og);
        og.connect(master);
        osc.start(now);
        osc.stop(now + 4.4);
      }
      setSounding(freq);
      window.setTimeout(() => {
        setSounding((f) => (f === freq ? null : f));
        void ctx.close();
      }, 4600);
    } catch {
      /* the tone stays silent when the browser refuses */
    }
  };

  /* a stable whisper for every unwritten trio */
  const whisper = useMemo(() => {
    const h =
      (outerIdx + 1) * 31 * 31 + (midIdx + 1) * 31 + (squareIdx + 1) * 7;
    return saWhispers[h % saWhispers.length];
  }, [outerIdx, midIdx, squareIdx]);

  const aligned = Boolean(alignment);

  /* the full-screen instrument — Esc always returns it to the world */
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  /* ------------------------- the world board ------------------------ */

  const board = (
    <div data-testid="sa-board" className="sa-root space-y-6">
      {/* ------------------------ the hero ---------------------------- */}
      <div className="text-center">
        <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--sa-gold)]">
          {t(saWorld.kicker)}
        </p>
        <h2 className="scope-gradient-text mt-1.5 text-[26px] font-semibold sm:text-[30px]">
          {t(saWorld.name)}
        </h2>
        <p className="mt-1 font-serif text-[15px] italic text-muted-foreground">
          {t(saWorld.subtitle)}
        </p>
        <p className="mx-auto mt-3 max-w-[640px] text-[14.5px] leading-relaxed text-muted-foreground">
          {t(saWorld.reveals)}
        </p>
      </div>

      {/* ------------------------ the instrument ----------------------- */}
      <div className="scope-frame-card relative overflow-hidden rounded-2xl glass p-4 sm:p-6">
        <span className="scope-corner scope-corner-tl" aria-hidden="true" />
        <span className="scope-corner scope-corner-tr" aria-hidden="true" />
        <span className="scope-corner scope-corner-bl" aria-hidden="true" />
        <span className="scope-corner scope-corner-br" aria-hidden="true" />

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-[var(--scope-a)]">
              {t("The cosmic frequency interface")}
            </p>
            <h3 className="scope-gradient-text mt-1 text-[17px] font-semibold">
              {t("The Alignment of the Three Circles")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={seek}
              data-testid="sa-seek"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                background:
                  "color-mix(in srgb, var(--sa-gold) 10%, transparent)",
              }}
            >
              <Shuffle className="size-3.5" aria-hidden="true" />
              {t("Turn the wheels")}
            </button>
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label={t("Work with the instrument full screen")}
              title={t("Work with the instrument full screen")}
              data-testid="sa-zoom"
              className="focus-glow flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-all duration-300 hover:text-foreground"
              style={{ borderColor: "var(--hairline)" }}
            >
              <Maximize2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* ---------------------- the instrument svg ---------------------- */}
          <div className="relative mx-auto w-full max-w-[620px]" data-testid="sa-instrument">
            <svg
              viewBox="0 0 900 900"
              className="size-full"
              role="img"
              aria-label={t(
                "The Synth Analog instrument: an Aztec sun border around three circles of frequency — twelve dials, twelve transmutation plates and the interlocking rotating squares of the mirror core"
              )}
            >
              <defs>
                <radialGradient id="sa-core-glow">
                  <stop offset="0%" stopColor="var(--sa-gold)" stopOpacity="0.5" />
                  <stop offset="55%" stopColor="var(--sa-gold)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--sa-gold)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sa-disk">
                  <stop offset="0%" stopColor="var(--sa-gold)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="var(--sa-gold)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* ============ THE AZTEC SUN BORDER (fixed) ============ */}
              <g aria-hidden="true">
                {RAY_ANGLES.map((a) => {
                  const p = pt(438, a);
                  return (
                    <path
                      key={`ray-${a}`}
                      d={OUT_RAY}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a})`}
                      fill="var(--sa-band)"
                      opacity={aligned ? 0.95 : 0.7}
                      className={aligned ? "sa-breathe" : undefined}
                    />
                  );
                })}
                <circle cx={CX} cy={CY} r="434" fill="none" stroke="var(--sa-band)" strokeWidth="1.4" opacity="0.55" />
                <circle cx={CX} cy={CY} r="396" fill="none" stroke="var(--sa-band)" strokeWidth="1.4" opacity="0.55" />

                {FRET_ANGLES.map((a) => {
                  const p = pt(415, a);
                  return (
                    <path
                      key={`fret-${a}`}
                      d={STEP_FRET}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a + 90})`}
                      fill="none"
                      stroke="var(--sa-gold)"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  );
                })}
                {PYRAMID_ANGLES.map((a) => {
                  const p = pt(415, a);
                  return (
                    <path
                      key={`pyr-${a}`}
                      d={STEPPED_PYRAMID}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a + 90})`}
                      fill="var(--sa-plate-deep)"
                      stroke="var(--sa-gold)"
                      strokeWidth="1.8"
                    />
                  );
                })}
                {KIN_ANGLES.map((a) => {
                  const p = pt(415, a);
                  return (
                    <g key={`kin-${a}`} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`}>
                      <circle r="7" fill="none" stroke="var(--sa-gold)" strokeWidth="1.8" />
                      <circle r="2" fill="var(--sa-gold)" />
                      {[0, 90, 180, 270].map((d) => {
                        const q = pt(12, d);
                        return (
                          <circle
                            key={d}
                            cx={q.x - CX}
                            cy={q.y - CY}
                            r="1.4"
                            fill="var(--sa-gold)"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </g>

              {/* the apex marker — the sun stone's own ray, at 12 o'clock */}
              <g
                aria-hidden="true"
                transform={`translate(${CX} 26)`}
                className={cn(seeking && "sa-breathe")}
              >
                <path
                  d="M 0 -14 L 7 2 L 0 30 L -7 2 Z"
                  fill="var(--sa-gold-bright)"
                  opacity={aligned ? 1 : 0.85}
                />
                <circle cy="-18" r="4" fill="var(--sa-gold)" />
                <circle cx="-16" cy="6" r="2.2" fill="var(--sa-gold)" opacity="0.8" />
                <circle cx="16" cy="6" r="2.2" fill="var(--sa-gold)" opacity="0.8" />
              </g>

              {/* the alignment seam — the vertical line of reading */}
              <line
                x1={CX}
                y1="64"
                x2={CX}
                y2="366"
                stroke="var(--sa-gold-bright)"
                strokeWidth={aligned ? 2.2 : 1.2}
                strokeDasharray={aligned ? undefined : "3 6"}
                opacity={aligned ? 0.9 : 0.4}
                className={cn(seeking && "sa-breathe")}
                aria-hidden="true"
              />

              {/* ============ CIRCLE 1 — THE TWELVE DIALS (rotating) ============ */}
              <circle cx={CX} cy={CY} r="390" fill="none" stroke="var(--sa-gold-soft)" strokeWidth="1" opacity="0.4" aria-hidden="true" />
              <g className="sa-ring" style={{ transform: `rotate(${-outerNet * 30}deg)` }}>
                {saDials.map((d, i) => {
                  const p = pt(343, i * 30);
                  const atApex = i === outerIdx;
                  return (
                    <g
                      key={d.id}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`}
                      className="sa-hit"
                      onClick={() => bringTo("outer", i)}
                    >
                      <title>{`${d.name} — ${d.element} · ${d.frequency} Hz`}</title>
                      {atApex && (
                        <circle
                          r="33"
                          fill="none"
                          stroke="var(--sa-gold-bright)"
                          strokeWidth="2"
                          className="sa-breathe"
                        />
                      )}
                      <circle
                        className="sa-hit-shape"
                        r="27"
                        fill={atApex ? "var(--sa-plate)" : "var(--sa-plate-deep)"}
                        stroke={atApex ? "var(--sa-gold-bright)" : "var(--sa-gold-soft)"}
                        strokeWidth={atApex ? 2.2 : 1.5}
                        style={{ transition: "stroke 0.4s, fill 0.4s" }}
                      />
                      {Array.from({ length: 12 }, (_, k) => {
                        const a = (k * 30 * Math.PI) / 180;
                        return (
                          <line
                            key={k}
                            x1={19 * Math.cos(a)}
                            y1={19 * Math.sin(a)}
                            x2={23 * Math.cos(a)}
                            y2={23 * Math.sin(a)}
                            stroke="var(--sa-gold)"
                            strokeWidth="1.2"
                            opacity="0.6"
                          />
                        );
                      })}
                      <text y="6" textAnchor="middle" fontSize="17" fill="var(--sa-ink)">
                        {d.glyph}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* ============ CIRCLE 2 — THE TRANSMUTATION PLATES ============ */}
              <circle cx={CX} cy={CY} r="292" fill="none" stroke="var(--sa-gold-soft)" strokeWidth="1" opacity="0.4" aria-hidden="true" />
              <circle cx={CX} cy={CY} r="194" fill="url(#sa-disk)" aria-hidden="true" />
              <g className="sa-ring" style={{ transform: `rotate(${-midNet * 30}deg)` }}>
                {saPlates.map((pl, i) => {
                  const p = pt(243, i * 30);
                  const atApex = i === midIdx;
                  return (
                    <g
                      key={pl.id}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`}
                      className="sa-hit"
                      onClick={() => bringTo("mid", i)}
                    >
                      <title>{`${pl.name} — ${pl.technique}`}</title>
                      {atApex && (
                        <circle
                          r="38"
                          fill="none"
                          stroke="var(--sa-gold-bright)"
                          strokeWidth="2"
                          className="sa-breathe"
                        />
                      )}
                      <path
                        className="sa-hit-shape"
                        d={hexPath(31)}
                        fill={atApex ? "var(--sa-plate)" : "var(--sa-plate-deep)"}
                        stroke={atApex ? "var(--sa-gold-bright)" : "var(--sa-gold-soft)"}
                        strokeWidth={atApex ? 2.2 : 1.5}
                        style={{ transition: "stroke 0.4s, fill 0.4s" }}
                      />
                      <text y="6.5" textAnchor="middle" fontSize="19" fill="var(--sa-ink)">
                        {pl.glyph}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* ============ CIRCLE 3 — THE QUANTUM MIRROR CORE ============ */}
              <circle cx={CX} cy={CY} r="190" fill="none" stroke="var(--sa-gold-soft)" strokeWidth="1" opacity="0.45" aria-hidden="true" />

              {/* the interlocking rotating squares + the twelve square glyphs */}
              <g className="sa-ring" style={{ transform: `rotate(${-squareNet * 30}deg)` }}>
                {[
                  { half: 150, rot: 0, tone: "var(--sa-jade)", op: 0.34 },
                  { half: 128, rot: 30, tone: "var(--sa-gold)", op: 0.42 },
                  { half: 106, rot: 60, tone: "var(--sa-jade)", op: 0.28 },
                ].map((s, k) => (
                  <rect
                    key={k}
                    x={CX - s.half}
                    y={CY - s.half}
                    width={s.half * 2}
                    height={s.half * 2}
                    fill="none"
                    stroke={s.tone}
                    strokeWidth="1.3"
                    opacity={s.op}
                    transform={`rotate(${s.rot} ${CX} ${CY})`}
                  />
                ))}
                {saSquares.map((sq, i) => {
                  const p = pt(141, i * 30);
                  const atApex = i === squareIdx;
                  const deg = i * 30;
                  return (
                    <g
                      key={sq.id}
                      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${deg})`}
                      className="sa-hit"
                      onClick={() => bringTo("square", i)}
                    >
                      <title>{`${sq.name} — ${sq.opens}`}</title>
                      {atApex && (
                        <rect
                          x="-27"
                          y="-27"
                          width="54"
                          height="54"
                          fill="none"
                          stroke="var(--sa-gold-bright)"
                          strokeWidth="2"
                          className="sa-breathe"
                          transform={`rotate(${-deg})`}
                        />
                      )}
                      <rect
                        className="sa-hit-shape"
                        x="-20"
                        y="-20"
                        width="40"
                        height="40"
                        fill={atApex ? "var(--sa-plate)" : "var(--sa-plate-deep)"}
                        stroke={atApex ? "var(--sa-gold-bright)" : "var(--sa-gold-soft)"}
                        strokeWidth={atApex ? 2.2 : 1.5}
                        style={{ transition: "stroke 0.4s, fill 0.4s" }}
                      />
                      <text
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={sq.face.length > 2 ? 12 : 16}
                        fontWeight="600"
                        fill="var(--sa-ink)"
                      >
                        {sq.face}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* the mirror core itself — the gifted golden sigil holds still */}
              <circle
                cx={CX}
                cy={CY}
                r="88"
                fill="url(#sa-core-glow)"
                className="sa-breathe"
                aria-hidden="true"
              />
              <image
                href="/images/synth-analog/core-dark.png"
                x={CX - 78}
                y={CY - 78}
                width="156"
                height="156"
                className="dark:hidden"
                aria-hidden="true"
              />
              <image
                href="/images/synth-analog/core-light.png"
                x={CX - 78}
                y={CY - 78}
                width="156"
                height="156"
                className="hidden dark:block"
                aria-hidden="true"
              />
              <circle
                cx={CX}
                cy={CY}
                r="92"
                fill="none"
                stroke={aligned ? "var(--sa-gold-bright)" : "var(--sa-gold-soft)"}
                strokeWidth={aligned ? 2 : 1.2}
                opacity={aligned ? 0.9 : 0.5}
                style={{ transition: "stroke 0.5s, opacity 0.5s" }}
                aria-hidden="true"
              />

              {/* the discovery burst — one golden ring racing to the border */}
              <AnimatePresence>
                {burst > 0 && (
                  <motion.circle
                    key={burst}
                    cx={CX}
                    cy={CY}
                    r="60"
                    fill="none"
                    stroke="var(--sa-gold-bright)"
                    strokeWidth="2.5"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: 0, scale: 7.6 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{ transformBox: "view-box", transformOrigin: "450px 450px" }}
                  />
                )}
              </AnimatePresence>
            </svg>
          </div>

          {/* --------------------- the reading column --------------------- */}
          <div className="flex min-w-0 flex-col gap-3">
            {/* the apex trio */}
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--sa-gold) 30%, transparent)",
                background: "color-mix(in srgb, var(--sa-gold) 5%, transparent)",
              }}
              data-testid="sa-apex-trio"
            >
              <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("At the apex")}
              </p>
              <dl className="mt-2.5 space-y-2 text-[13.5px]">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">{t("Outer Dial")}</dt>
                  <dd className="truncate font-semibold text-foreground" data-testid="sa-apex-outer">
                    {t(dial.name)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">{t("Transmutation Plate")}</dt>
                  <dd className="truncate font-semibold text-foreground" data-testid="sa-apex-mid">
                    {t(plate.name)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">{t("Square Glyph")}</dt>
                  <dd className="truncate font-semibold text-foreground" data-testid="sa-apex-square">
                    {t(square.name)}
                  </dd>
                </div>
              </dl>
              <p
                className="mt-2.5 border-t pt-2 text-[12px] italic text-muted-foreground"
                style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 18%, transparent)" }}
              >
                {t(plate.technique)} · {t(square.opens)}
              </p>
            </div>

            {/* the resonance card */}
            {alignment ? (
              <motion.div
                key={alignment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border p-4 glow-sm"
                style={{
                  borderColor: "color-mix(in srgb, var(--sa-gold) 60%, transparent)",
                  background: "color-mix(in srgb, var(--sa-gold) 12%, transparent)",
                }}
                data-testid="sa-status"
                data-aligned="true"
              >
                <p
                  className="mono-label text-[9.5px] uppercase tracking-[0.2em]"
                  style={{ color: "var(--sa-gold-bright)" }}
                >
                  {t("Cosmic formula aligned")}
                </p>
                <h4 className="mt-1 text-[16px] font-semibold text-foreground">
                  {t(alignment.name)}
                </h4>
                <p
                  className="mono-label mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] tracking-[0.18em]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                    color: "var(--sa-gold-bright)",
                  }}
                >
                  {alignment.code}
                </p>
                <p className="mt-2.5 font-serif text-[13.5px] italic leading-relaxed text-foreground/85">
                  {t(alignment.formula)}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">
                  {t(alignment.effect)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => playTone(alignment.frequency)}
                    data-testid="sa-tone"
                    className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                      background: "color-mix(in srgb, var(--sa-gold) 10%, transparent)",
                    }}
                  >
                    <Volume2 className="size-3.5" aria-hidden="true" />
                    {sounding === alignment.frequency
                      ? t("Sounding…")
                      : t("Hear {n} Hz", { n: alignment.frequency })}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--hairline)",
                  background: "var(--glass-bg)",
                }}
                data-testid="sa-status"
                data-aligned="false"
              >
                <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Unwritten combination")}
                </p>
                <p className="mt-2 font-serif text-[14px] italic leading-relaxed text-muted-foreground">
                  {t(whisper)}
                </p>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground/80">
                  {t(
                    "Turn the three circles until one dial, one plate and one square glyph meet at the apex — the formulas sound themselves when they do."
                  )}
                </p>
              </div>
            )}

            {/* the codex count */}
            <p
              className="mono-label text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              data-testid="sa-count"
            >
              {t("{n} of {total} formulas remembered", {
                n: discovered.length,
                total: saAlignments.length,
              })}
            </p>
          </div>
        </div>

        {/* --------------------- the three steppers ---------------------- */}
        <div
          className="mt-5 flex flex-col gap-2 sm:flex-row"
          role="group"
          aria-label={t("Turn the three circles")}
        >
          <SaStepper
            ring="outer"
            label="Outer Dials"
            current={dial.name}
            onStep={(dir) => step("outer", dir)}
          />
          <SaStepper
            ring="mid"
            label="Transmutation Plates"
            current={plate.name}
            onStep={(dir) => step("mid", dir)}
          />
          <SaStepper
            ring="square"
            label="Square Glyphs"
            current={square.name}
            onStep={(dir) => step("square", dir)}
          />
        </div>

        {/* the polite announcer for screen readers */}
        <p className="sr-only" aria-live="polite" data-testid="sa-announcer">
          {`${t(dial.name)}, ${t(plate.name)}, ${t(square.name)}. ${
            alignment
              ? `${t("Cosmic formula aligned")}: ${t(alignment.name)}`
              : t("Unwritten combination")
          }`}
        </p>
      </div>

      {/* ------------------------ the codex ------------------------ */}
      <div>
        <p className="mono-label mb-3 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("The Codex of Cosmic Alignments")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="sa-codex">
          {saAlignments.map((a) => {
            const found = discovered.includes(a.id);
            return (
              <div
                key={a.id}
                data-testid={`sa-codex-${a.id}`}
                data-found={found ? "true" : "false"}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 transition-all duration-500",
                  found && "glow-sm"
                )}
                style={{
                  borderColor: found
                    ? "color-mix(in srgb, var(--sa-gold) 55%, transparent)"
                    : "var(--hairline)",
                  background: found
                    ? "color-mix(in srgb, var(--sa-gold) 9%, transparent)"
                    : "var(--glass-bg)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="mono-label text-[8.5px] uppercase tracking-[0.18em]"
                    style={{ color: found ? "var(--sa-gold-bright)" : undefined }}
                  >
                    {found || a.grand ? a.code : "· · ·"}
                  </p>
                  {found ? (
                    <Sparkles
                      className="size-3.5 shrink-0"
                      style={{ color: "var(--sa-gold-bright)" }}
                      aria-hidden="true"
                    />
                  ) : a.grand ? (
                    <span className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] tracking-[0.14em] text-muted-foreground">
                      {t("prophecy")}
                    </span>
                  ) : (
                    <Lock
                      className="size-3 shrink-0 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h4 className="mt-1 text-[14.5px] font-semibold leading-snug text-foreground">
                  {found || a.grand
                    ? t(a.name)
                    : t("A veiled formula waits in the wheels")}
                </h4>
                {found ? (
                  <>
                    <p className="mt-1.5 font-serif text-[12px] italic leading-snug text-muted-foreground">
                      {t(a.formula)}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
                      {t(a.effect)}
                    </p>
                  </>
                ) : a.grand ? (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {t(
                      "The old prophecy names this one — bring its three signs to the apex to sound it."
                    )}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {t(
                      "No codex names it. Only the wheels know, and they keep the secret until the signs align."
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------- the colophon ------------------------ */}
      <p className="mono-label pb-1 text-center text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/70">
        {t(saWorld.colophon)}
      </p>
    </div>
  );

  return (
    <div data-testid="synth-view" className="scope-synth sa-root relative flex h-full flex-col">
      <style>{SA_CSS}</style>

      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-5">
          <button
            type="button"
            onClick={exitSynth}
            data-testid="synth-back"
            className="focus-glow group flex h-9 shrink-0 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          {/* the world's own name — no chamber tabs, it is a world */}
          <div className="flex min-w-0 flex-col items-center leading-tight">
            <span className="mono-label text-[10px] uppercase tracking-[0.26em] text-[var(--sa-gold)]">
              {t(saWorld.name)}
            </span>
            <span className="hidden truncate font-serif text-[12px] italic text-muted-foreground sm:block">
              {t(saWorld.subtitle)}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={seek}
              data-testid="synth-seek-top"
              className="focus-glow hidden h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px md:flex"
              style={{
                borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                background: "color-mix(in srgb, var(--sa-gold) 10%, transparent)",
              }}
            >
              <Shuffle className="size-3.5" aria-hidden="true" />
              {t("Turn the wheels")}
            </button>
            <button
              type="button"
              onClick={() => setZoom((v) => !v)}
              aria-label={zoom ? t("Leave the full screen") : t("Work with the instrument full screen")}
              title={zoom ? t("Leave the full screen") : t("Work with the instrument full screen")}
              aria-pressed={zoom}
              data-testid="synth-zoom"
              className={cn(
                "focus-glow flex size-9 items-center justify-center rounded-full border transition-all duration-300",
                zoom
                  ? "border-[color-mix(in_srgb,var(--sa-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--sa-gold)_14%,transparent)] text-[var(--sa-gold-bright)]"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
            >
              {zoom ? (
                <Minimize2 className="size-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------- the world -------------------------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-8 pt-5 sm:px-6">
          {board}
        </div>
      </main>

      {/* ---------- the instrument, full screen ---------- */}
      {zoom &&
        createPortal(
          <div
            className="fixed inset-0 z-[80]"
            role="dialog"
            aria-modal="true"
            aria-label={t("Synth Analog — full screen")}
            data-testid="synth-fullscreen"
          >
            <div className="absolute inset-0 bg-[#05040B]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(58% 46% at 50% 0%, rgba(230,181,74,0.09), transparent 70%), radial-gradient(46% 38% at 82% 96%, rgba(59,214,178,0.07), transparent 70%)",
              }}
            />
            <span className="sa-breathe absolute left-[12%] top-[18%] size-1 rounded-full bg-white/60" aria-hidden="true" />
            <span className="sa-breathe absolute left-[78%] top-[26%] size-1.5 rounded-full bg-white/50" aria-hidden="true" />
            <span className="sa-breathe absolute left-[30%] top-[80%] size-1 rounded-full bg-white/40" aria-hidden="true" />
            <div className="nice-scroll relative z-10 mx-auto h-full w-full max-w-[1180px] overflow-y-auto px-4 pb-10 pt-5 sm:px-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-white/60">
                  {t(saWorld.name)} — {t("full screen")}
                </p>
                <div className="flex items-center gap-2">
                  <kbd className="mono-label rounded-full border border-white/15 px-2 py-1 text-[9px] text-white/50">
                    ESC
                  </kbd>
                  <button
                    type="button"
                    onClick={() => setZoom(false)}
                    aria-label={t("Close the full screen")}
                    title={t("Close the full screen")}
                    data-testid="synth-zoom-close"
                    className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-all duration-300 hover:bg-white/10"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {board}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
