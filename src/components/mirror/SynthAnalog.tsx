"use client";

import {
  useCallback,
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
  Feather,
  Lock,
  Maximize2,
  Minimize2,
  Orbit,
  Play,
  RotateCcw,
  RotateCw,
  Shuffle,
  Sparkles,
  Sun,
  Volume2,
  Wand2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  saAlignments,
  saBenchOpeners,
  saDials,
  saOracle,
  saPlates,
  saRestLines,
  saSquares,
  saWhispers,
  saWorld,
  type SaAlignment,
  type SaCreation,
  type SaOracleKind,
  type SaOracleReading,
  type SaTool,
} from "@/lib/data/synth-analog";
import { SaSigil, saSquareHasFace, type SaRingId } from "./SaSigils";
import { ContextSuggestionStrip } from "./SuggestionStrip";
import { ListenButton } from "./ListenButton";
import { QuantumLoading } from "./ThemedLoadings";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  SYNTH ANALOG — the cosmic frequency interface                      */
/*                                                                      */
/*  A category of ParticleX, and a fully independent world: the        */
/*  analog realm drawn into the digital. Structured as CHAMBERS like   */
/*  the Invent — a top bar (back · title · chamber tabs) and ONE       */
/*  spacious chamber at a time:                                        */
/*                                                                     */
/*   · THE SACRED CIRCLES — the core: the Aztec Sun border holding     */
/*     three circles of frequency, every icon wearing its own drawn    */
/*     sigil. Each sigil the mirror deciphers becomes a TOOL; each     */
/*     aligned formula climbs out of the mirror core as a CREATION —   */
/*     an ancient technology, decoded so we create it.                 */
/*                                                                     */
/*   · THE BENCH — the Analog Mirror's own chat: aware of every        */
/*     combination happening on the wheels, deciphering all of it in   */
/*     Analog language.                                                */
/*                                                                     */
/*   · THE TOOL WALL — everything the circles have birthed: the        */
/*     thirty-six tools of the sigils and the creations of the         */
/*     alignments, kept in the browser's own codex.                    */
/*                                                                     */
/*  Palette law: Mesoamerican gold + jade on obsidian; the daylight    */
/*  laboratory answers in bronze ink.                                  */
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
/* the tools' demonstrations — small living engines */
@keyframes sa-demo-spin { to { transform: rotate(360deg); } }
@keyframes sa-demo-spin-rev { to { transform: rotate(-360deg); } }
@keyframes sa-demo-sweep { 0% { transform: translateX(-26px); } 100% { transform: translateX(26px); } }
@keyframes sa-demo-pulse { 0%, 100% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
@keyframes sa-demo-flicker { 0%, 100% { opacity: 0.45; } 38% { opacity: 1; } 46% { opacity: 0.55; } 62% { opacity: 0.95; } }
@keyframes sa-demo-flash { 0% { opacity: 0; } 14% { opacity: 1; } 44% { opacity: 0.25; } 100% { opacity: 0; } }
@keyframes sa-demo-part { 0%, 100% { transform: translateX(-7px); } 50% { transform: translateX(7px); } }
.sa-demo-spin { animation: sa-demo-spin 5.5s linear infinite; transform-box: fill-box; transform-origin: center; }
.sa-demo-spin-rev { animation: sa-demo-spin-rev 5.5s linear infinite; transform-box: fill-box; transform-origin: center; }
.sa-demo-sweep { animation: sa-demo-sweep 2.6s ease-in-out infinite alternate; transform-box: fill-box; }
.sa-demo-pulse { animation: sa-demo-pulse 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.sa-demo-flicker { animation: sa-demo-flicker 2.4s linear infinite; }
.sa-demo-flash { animation: sa-demo-flash 2.4s linear infinite; }
.sa-demo-part { animation: sa-demo-part 2.8s ease-in-out infinite; transform-box: fill-box; }
@media (prefers-reduced-motion: reduce) {
  .sa-ring { transition: none !important; }
  .sa-breathe { animation: none !important; opacity: 0.7; }
  .sa-demo-spin, .sa-demo-spin-rev, .sa-demo-sweep, .sa-demo-pulse,
  .sa-demo-flicker, .sa-demo-flash, .sa-demo-part { animation: none !important; opacity: 0.8; }
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

/* --------------------- the persistent keepsakes --------------------- */
/*  The remembered formulas, the decoded tools and the forged creations
    live in localStorage and reach React through tiny external stores —
    no state cascades, cross-tab safe. The codex key is the one the
    instrument has always signed, so earlier discoveries stay kept. */

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

/* A generic external store over one JSON localStorage map. */
function makeLocalMap<T>(key: string, eventName: string) {
  let cache: Record<string, T> | null = null;
  const EMPTY: Record<string, T> = {};
  const read = (): Record<string, T> => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return EMPTY;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return EMPTY;
      return parsed as Record<string, T>;
    } catch {
      return EMPTY;
    }
  };
  const get = (): Record<string, T> => {
    if (cache === null) cache = read();
    return cache;
  };
  const subscribe = (onChange: () => void) => {
    window.addEventListener(eventName, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(eventName, onChange);
      window.removeEventListener("storage", onChange);
    };
  };
  const save = (next: Record<string, T>) => {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* the keepsake stays in memory when the browser refuses */
    }
    window.dispatchEvent(new Event(eventName));
  };
  return { get, subscribe, save, EMPTY };
}

const toolStore = makeLocalMap<SaTool>("px-synth-tools-v1", "px-synth-tools-change");
const creationStore = makeLocalMap<SaCreation>(
  "px-synth-creations-v1",
  "px-synth-creations-change"
);

/* ---------------------- the resonance tone -------------------------- */
/*  A soft sung partial chord at a given Hz — shared by the circles,
    the manual and every tool demonstration. */

function playSaTone(freq: number) {
  try {
    const Ctx =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
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
    window.setTimeout(() => {
      void ctx.close();
    }, 4600);
  } catch {
    /* the tone stays silent when the browser refuses */
  }
}

/** The frequency a sigil's tool sounds, when its sign carries one. */
const saSigilFrequency = (ring: SaRingId, id: string): number | null => {
  if (ring === "dial") return saDials.find((d) => d.id === id)?.frequency ?? null;
  if (ring === "square") return saSquares.find((s) => s.id === id)?.frequency ?? null;
  return null;
};

/* -------------------- the kind of each oracle fruit ------------------ */

const SA_KIND_LABEL: Record<SaOracleKind, string> = {
  technology: "a technology",
  question: "a question",
  illumination: "an illumination",
  practice: "a practice",
  tone: "a tone to keep",
  cipher: "a cipher",
};

const SA_KIND_TONE: Record<SaOracleKind, string> = {
  technology: "var(--sa-gold-bright)",
  question: "var(--sa-jade)",
  illumination: "var(--sa-gold)",
  practice: "var(--sa-jade)",
  tone: "var(--sa-gold-bright)",
  cipher: "var(--sa-gold-soft)",
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

/** The mirror's body — quiet paragraphs, a whisper signed at the end. */
function SaBody({ text }: { text: string }) {
  const paras = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [text]
  );
  return (
    <div className="space-y-2.5">
      {paras.map((p, i) => {
        const isLast = i === paras.length - 1;
        if (isLast && p.startsWith("—")) {
          return (
            <p
              key={i}
              className="mono-label pt-1 text-[11px] leading-relaxed"
              style={{ color: "color-mix(in srgb, var(--sa-gold) 88%, white)" }}
            >
              {p}
            </p>
          );
        }
        return (
          <p
            key={i}
            className={cn(
              "text-[14.5px] leading-[1.75] text-foreground/88",
              i === 0 && "font-medium text-foreground/95"
            )}
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}

/* --------------------- the keepsake cards --------------------------- */

/** One decoded tool, shown on the wall or fresh from the core. */
function SaToolCard({
  tool,
  signName,
  ring,
}: {
  tool: SaTool;
  signName: string;
  ring: SaRingId;
}) {
  const t = useT();
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 38%, transparent)", background: "color-mix(in srgb, var(--sa-gold) 7%, transparent)" }}>
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
          style={{
            borderColor: "color-mix(in srgb, var(--sa-gold) 42%, transparent)",
            color: "var(--sa-gold)",
          }}
        >
          <SaSigil id={tool.sigilId} ring={ring} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="mono-label text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {t(signName)}
          </p>
          <h4 className="truncate text-[15px] font-semibold text-foreground">
            {tool.name}
          </h4>
        </div>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/88">
        {tool.essence}
      </p>
      {tool.purpose && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {tool.purpose}
        </p>
      )}
      <p className="mt-2 rounded-xl border px-3 py-2 text-[13px] leading-relaxed text-foreground/85" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 22%, transparent)" }}>
        <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.16em] text-[var(--sa-gold)]">
          {t("first stroke")}
        </span>
        {tool.first_stroke}
      </p>
      <p className="mt-2 font-serif text-[12.5px] italic text-muted-foreground">
        “{tool.whisper}”
      </p>
    </div>
  );
}

/** One forged creation — an ancient technology, recreated. */
function SaCreationCard({ creation }: { creation: SaCreation }) {
  const t = useT();
  return (
    <div className="rounded-2xl border p-4 glow-sm" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 52%, transparent)", background: "color-mix(in srgb, var(--sa-gold) 10%, transparent)" }}>
      <p className="mono-label text-[8.5px] uppercase tracking-[0.18em]" style={{ color: "var(--sa-gold-bright)" }}>
        {t("a new creation — an ancient technology, recreated")}
      </p>
      <h4 className="mt-1 text-[16px] font-semibold text-foreground">
        {creation.name}
      </h4>
      {creation.ancestry && (
        <p className="mt-1.5 font-serif text-[13px] italic leading-relaxed text-muted-foreground">
          {creation.ancestry}
        </p>
      )}
      <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/88">
        {creation.essence}
      </p>
      {creation.purpose && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {creation.purpose}
        </p>
      )}
      <p className="mt-2 rounded-xl border px-3 py-2 text-[13px] leading-relaxed text-foreground/85" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 26%, transparent)" }}>
        <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.16em] text-[var(--sa-gold)]">
          {t("first stroke")}
        </span>
        {creation.first_stroke}
      </p>
      <p className="mt-2 font-serif text-[12.5px] italic text-muted-foreground">
        “{creation.whisper}”
      </p>
    </div>
  );
}

/* --------------------------- shared types --------------------------- */

type BenchMessage =
  | { kind: "exchange"; id: number; query: string; text: string; createdAt: string }
  | { kind: "system"; id: number; text: string };

type SaPlace = "circles" | "bench" | "tools";

/* ============================== the world =========================== */

export function SynthAnalog() {
  const exitSynth = useMirror((s) => s.exitSynth);
  const language = useMirror((s) => s.language);
  const t = useT();

  const [place, setPlace] = useState<SaPlace>("circles");

  /* The three wheels — kept as NET steps so the rotation is one
     continuous line: the wheels never spin backwards at a wrap. */
  const [outerNet, setOuterNet] = useState(0);
  const [midNet, setMidNet] = useState(0);
  const [squareNet, setSquareNet] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const outerIdx = ((outerNet % 12) + 12) % 12;
  const midIdx = ((midNet % 12) + 12) % 12;
  const squareIdx = ((squareNet % 12) + 12) % 12;

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

  /* the persistent keepsakes — external stores over localStorage */
  const discovered = useSyncExternalStore(
    subscribeCodex,
    getCodex,
    () => CODEX_EMPTY
  );
  const tools = useSyncExternalStore(
    toolStore.subscribe,
    toolStore.get,
    () => toolStore.EMPTY
  );
  const creations = useSyncExternalStore(
    creationStore.subscribe,
    creationStore.get,
    () => creationStore.EMPTY
  );

  const [burst, setBurst] = useState(0);

  /* the bench — the Analog Mirror's own thread */
  const [bench, setBench] = useState<BenchMessage[]>([]);
  const [benchDraft, setBenchDraft] = useState("");
  const [benchStatus, setBenchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [benchError, setBenchError] = useState<string | null>(null);
  const benchIdRef = useRef(0);

  const pushSystemLine = useCallback((text: string) => {
    benchIdRef.current += 1;
    setBench((b) => [...b, { kind: "system", id: benchIdRef.current, text }]);
  }, []);

  /* the mirror at work — tools deciphering, creations forging */
  const [fetchingTools, setFetchingTools] = useState<string[]>([]);
  const [fetchingCreation, setFetchingCreation] = useState<string | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  /* the great awakening — all thirty-six tools waking in one patient
     procession, each one asked of the core in turn */
  const [awakening, setAwakening] = useState(false);
  const awakeningRef = useRef(false);

  /* the wheels' resting triple — mirrored in a ref so rapid turns
     (batched between renders) still read the true resting signs. */
  const tripleRef = useRef({ o: 0, m: 0, s: 0 });

  /* The wheel log — the recent rests, the mirror's running awareness. */
  const [wheelLog, setWheelLog] = useState<string[]>([]);
  const restCountRef = useRef(0);
  const toolTimerRef = useRef<number | null>(null);
  const firstToastRef = useRef(true);

  /* ------------------- the rite of the tool ------------------------- */

  const decipherTool = useCallback(
    async (
      ring: SaRingId,
      item: { id: string; name: string; detail: string; frequency?: number },
      opts?: { quiet?: boolean }
    ) => {
      if (toolStore.get()[item.id]) return;
      if (fetchingRef.current.has(item.id)) return;
      fetchingRef.current.add(item.id);
      setFetchingTools((f) => [...f, item.id]);
      try {
        const res = await fetch("/api/synth-analog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "tool",
            language,
            sigil: {
              id: item.id,
              ring,
              name: item.name,
              detail: item.detail,
              frequency: item.frequency,
            },
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.tool?.name) {
          throw new Error(
            (data && data.error) ||
              "The core stays quiet — the tool could not be decoded."
          );
        }
        const tool: SaTool = {
          sigilId: item.id,
          ring,
          name: String(data.tool.name),
          essence: String(data.tool.essence ?? ""),
          purpose: String(data.tool.purpose ?? ""),
          first_stroke: String(data.tool.first_stroke ?? ""),
          whisper: String(data.tool.whisper ?? ""),
          createdAt: String(data.createdAt ?? new Date().toISOString()),
        };
        toolStore.save({ ...toolStore.get(), [item.id]: tool });
        pushSystemLine(
          `${t("The core deciphered")} ${t(item.name)} → ${tool.name}`
        );
        if (!opts?.quiet && firstToastRef.current) {
          firstToastRef.current = false;
          toast.success(t("A tool climbs out of the core"), {
            description: `${t(item.name)} → ${tool.name}`,
          });
        }
      } catch {
        /* a failed deciphering stays un-decoded — the visitor may
           ask the core again from the Tool Wall */
      } finally {
        fetchingRef.current.delete(item.id);
        setFetchingTools((f) => f.filter((x) => x !== item.id));
      }
    },
    [language, pushSystemLine, t]
  );

  /* ----------------- the rite of the creation ----------------------- */

  const forgeCreation = useCallback(
    async (alignment: SaAlignment) => {
      if (creationStore.get()[alignment.id]) return;
      if (fetchingRef.current.has(`c-${alignment.id}`)) return;
      fetchingRef.current.add(`c-${alignment.id}`);
      setFetchingCreation(alignment.id);
      try {
        const res = await fetch("/api/synth-analog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "creation",
            language,
            alignment: {
              name: alignment.name,
              code: alignment.code,
              formula: alignment.formula,
              effect: alignment.effect,
              frequency: alignment.frequency,
            },
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.creation?.name) {
          throw new Error(
            (data && data.error) ||
              "The mirror core stays dark — the creation could not be forged."
          );
        }
        const creation: SaCreation = {
          alignmentId: alignment.id,
          name: String(data.creation.name),
          ancestry: String(data.creation.ancestry ?? ""),
          essence: String(data.creation.essence ?? ""),
          purpose: String(data.creation.purpose ?? ""),
          first_stroke: String(data.creation.first_stroke ?? ""),
          whisper: String(data.creation.whisper ?? ""),
          createdAt: String(data.createdAt ?? new Date().toISOString()),
        };
        creationStore.save({ ...creationStore.get(), [alignment.id]: creation });
        pushSystemLine(
          `${t("The formula sounded — a creation climbs from the mirror core")}: ${creation.name}`
        );
        toast.success(t("A new creation climbs from the mirror core"), {
          description: `${t(alignment.name)} → ${creation.name}`,
        });
      } catch {
        /* a failed forging may be asked again from the Tool Wall */
      } finally {
        fetchingRef.current.delete(`c-${alignment.id}`);
        setFetchingCreation((c) => (c === alignment.id ? null : c));
      }
    },
    [language, pushSystemLine, t]
  );

  /* ------------------- the wheels' shared turning ------------------- */

  const setNetOf = (ring: "outer" | "mid" | "square") =>
    ring === "outer" ? setOuterNet : ring === "mid" ? setMidNet : setSquareNet;

  /** A formula fires the moment its three signs meet — spoken from
      the turning hands themselves. */
  const checkAndReveal = useCallback(
    (o: number, m: number, s: number) => {
      const found = saAlignments.find(
        (a) =>
          a.dial === saDials[o].id &&
          a.plate === saPlates[m].id &&
          a.square === saSquares[s].id
      );
      if (!found) return;
      if (!discovered.includes(found.id)) {
        rememberCodex(found.id);
        setBurst((b) => b + 1);
        toast.success(t("A cosmic formula reveals itself"), {
          description: `${t(found.name)} · ${found.code}`,
        });
      }
      /* the aligned formula climbs out of the mirror core as a creation */
      void forgeCreation(found);
    },
    [discovered, forgeCreation, t]
  );

  /** After every rest, the mirror's awareness updates and the resting
      signs each begin their slow deciphering — one tool per sigil,
      remembered forever. */
  const commitRest = useCallback(
    (o: number, m: number, s: number) => {
      restCountRef.current += 1;
      const restLine = `${saDials[o].name} · ${saPlates[m].name} · ${saSquares[s].name}`;
      setWheelLog((log) => [...log.slice(-7), restLine]);

      if (toolTimerRef.current) window.clearTimeout(toolTimerRef.current);
      toolTimerRef.current = window.setTimeout(() => {
        firstToastRef.current = true;
        void decipherTool("dial", {
          id: saDials[o].id,
          name: saDials[o].name,
          detail: saDials[o].element,
          frequency: saDials[o].frequency,
        });
        void decipherTool("plate", {
          id: saPlates[m].id,
          name: saPlates[m].name,
          detail: saPlates[m].technique,
        });
        void decipherTool("square", {
          id: saSquares[s].id,
          name: saSquares[s].name,
          detail: saSquares[s].opens,
          frequency: saSquares[s].frequency,
        });
      }, 1200);
    },
    [decipherTool]
  );

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
    let delta = (((target - idx) % 12) + 12) % 12;
    if (delta > 6) delta -= 12;
    const nextIdx = (((idx + delta) % 12) + 12) % 12;
    tripleRef.current = {
      o: ring === "outer" ? nextIdx : tripleRef.current.o,
      m: ring === "mid" ? nextIdx : tripleRef.current.m,
      s: ring === "square" ? nextIdx : tripleRef.current.s,
    };
    if (!silent) {
      const { o, m, s } = tripleRef.current;
      checkAndReveal(o, m, s);
      commitRest(o, m, s);
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
    const nextIdx = (((idx + dir) % 12) + 12) % 12;
    tripleRef.current = {
      o: ring === "outer" ? nextIdx : tripleRef.current.o,
      m: ring === "mid" ? nextIdx : tripleRef.current.m,
      s: ring === "square" ? nextIdx : tripleRef.current.s,
    };
    const { o, m, s } = tripleRef.current;
    checkAndReveal(o, m, s);
    commitRest(o, m, s);
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
    commitRest(o, m, s);
    setSeeking(true);
    window.setTimeout(() => setSeeking(false), 1000);
  };

  useEffect(
    () => () => {
      if (toolTimerRef.current) window.clearTimeout(toolTimerRef.current);
    },
    []
  );

  /* ------------------- the bench of the mirror ---------------------- */

  const askMirror = useCallback(
    async (question: string) => {
      const query = question.trim();
      if (!query || benchStatus === "loading") return;
      setBenchStatus("loading");
      setBenchError(null);
      benchIdRef.current += 1;
      setBenchDraft("");

      try {
        const history = bench
          .filter((m): m is Extract<BenchMessage, { kind: "exchange" }> => m.kind === "exchange")
          .slice(-6)
          .map((m) => ({ q: m.query, a: m.text }));
        const res = await fetch("/api/synth-analog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "decipher",
            language,
            query,
            history,
            triple: {
              dial: dial.name,
              plate: plate.name,
              square: square.name,
              alignment: alignment ? `${alignment.name} (${alignment.code})` : "",
            },
            aligned: Boolean(alignment),
            wheelLog,
            codex: discovered
              .map((id) => saAlignments.find((a) => a.id === id)?.name)
              .filter(Boolean),
            tools: Object.values(toolStore.get()).map((tool) => tool.name),
            creations: Object.values(creationStore.get()).map(
              (creation) => creation.name
            ),
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.transmission) {
          throw new Error(
            (data && data.error) ||
              "The mirror holds its breath. Rest a moment, then ask again."
          );
        }
        benchIdRef.current += 1;
        const id = benchIdRef.current;
        setBench((b) => [
          ...b,
          {
            kind: "exchange",
            id,
            query,
            text: String(data.transmission),
            createdAt: String(data.createdAt ?? new Date().toISOString()),
          },
        ]);
        setBenchStatus("idle");
      } catch (err) {
        setBenchStatus("error");
        setBenchError(
          err instanceof Error
            ? err.message
            : "The mirror holds its breath. Rest a moment, then ask again."
        );
      }
    },
    [
      alignment,
      bench,
      benchStatus,
      dial.name,
      discovered,
      language,
      plate.name,
      square.name,
      wheelLog,
    ]
  );

  /* a stable whisper for every unwritten trio */
  const whisper = useMemo(() => {
    const h =
      (outerIdx + 1) * 31 * 31 + (midIdx + 1) * 31 + (squareIdx + 1) * 7;
    return saWhispers[h % saWhispers.length];
  }, [outerIdx, midIdx, squareIdx]);

  /* the manual of combinations — every resting trio produces something:
     a technology, a question, an illumination, a practice, a tone or a
     cipher, deterministic per combination, 1,728 pages deep. */
  const oracle = useMemo(() => saOracle(outerIdx, midIdx, squareIdx), [
    outerIdx,
    midIdx,
    squareIdx,
  ]);

  const restMotto = useMemo(
    () => saRestLines[restCountRef.current % saRestLines.length],
    [outerIdx, midIdx, squareIdx]
  );

  /* a click on an un-deciphered sign asks the core again */
  const retryTool = useCallback(
    (ring: SaRingId, id: string) => {
      if (ring === "dial") {
        const d = saDials.find((x) => x.id === id);
        if (d)
          void decipherTool("dial", {
            id: d.id,
            name: d.name,
            detail: d.element,
            frequency: d.frequency,
          });
      } else if (ring === "plate") {
        const p = saPlates.find((x) => x.id === id);
        if (p)
          void decipherTool("plate", {
            id: p.id,
            name: p.name,
            detail: p.technique,
          });
      } else {
        const s = saSquares.find((x) => x.id === id);
        if (s)
          void decipherTool("square", {
            id: s.id,
            name: s.name,
            detail: s.opens,
            frequency: s.frequency,
          });
      }
    },
    [decipherTool]
  );

  const aligned = Boolean(alignment);

  /* the great awakening — every sigil on the wall asked of the core,
     one after another, until all thirty-six tools stand awake */
  const awakenAllTools = useCallback(async () => {
    if (awakeningRef.current) return;
    awakeningRef.current = true;
    setAwakening(true);
    const rest = (ms: number) =>
      new Promise<void>((r) => window.setTimeout(r, ms));
    try {
      for (const d of saDials) {
        if (!toolStore.get()[d.id]) {
          await decipherTool("dial", {
            id: d.id,
            name: d.name,
            detail: d.element,
            frequency: d.frequency,
          });
          await rest(260);
        }
      }
      for (const p of saPlates) {
        if (!toolStore.get()[p.id]) {
          await decipherTool("plate", {
            id: p.id,
            name: p.name,
            detail: p.technique,
          });
          await rest(260);
        }
      }
      for (const s of saSquares) {
        if (!toolStore.get()[s.id]) {
          await decipherTool("square", {
            id: s.id,
            name: s.name,
            detail: s.opens,
            frequency: s.frequency,
          });
          await rest(260);
        }
      }
    } finally {
      awakeningRef.current = false;
      setAwakening(false);
    }
  }, [decipherTool]);

  /* ------------------------- the shell ------------------------------ */

  return (
    <div
      data-testid="synth-view"
      className="scope-synth sa-root relative flex h-full flex-col"
    >
      <style>{SA_CSS}</style>

      {/* ---------- top bar: back · title · chamber tabs ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5">
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
            <span className="hidden sm:inline">
              {t("Return to the Observatory")}
            </span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="title-gradient truncate text-[15.5px] font-semibold tracking-[0.12em] sm:text-[17px]">
              SYNTH ANALOG · {t("The Frequency Interface")}
            </h1>
            <p className="mono-label mt-0.5 hidden truncate text-[10px] text-muted-foreground/80 sm:block sm:text-[11px]">
              {t("we decode ancient technologies so we create them")}
            </p>
          </div>

          {/* the chamber tabs — same treatment as the Invent chambers */}
          <nav
            role="tablist"
            aria-label={t("Synth Analog chambers")}
            data-testid="synth-tabs"
            className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto sm:gap-1.5"
          >
            <SaTab
              active={place === "circles"}
              onClick={() => setPlace("circles")}
              icon={Orbit}
              label="The Sacred Circles"
              testId="synth-tab-circles"
            />
            <SaTab
              active={place === "bench"}
              onClick={() => setPlace("bench")}
              icon={Feather}
              label="The Bench"
              testId="synth-tab-bench"
            />
            <SaTab
              active={place === "tools"}
              onClick={() => setPlace("tools")}
              icon={Wrench}
              label="The Tool Wall"
              testId="synth-tab-tools"
            />
          </nav>

          <span
            className="hidden size-9 shrink-0 items-center justify-center rounded-full border hairline sm:flex"
            aria-hidden="true"
          >
            <Sun className="size-4 text-[var(--sa-gold)]" />
          </span>
        </div>
      </header>

      {/* ---------- one spacious chamber at a time ---------- */}
      <main
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="synth-main"
      >
        <div className="mx-auto flex h-full w-full max-w-[1120px] flex-col px-4 pb-5 sm:px-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-4">
            {place === "circles" ? (
              <CirclesChamber
                dial={dial}
                plate={plate}
                square={square}
                outerIdx={outerIdx}
                midIdx={midIdx}
                squareIdx={squareIdx}
                outerNet={outerNet}
                midNet={midNet}
                squareNet={squareNet}
                seeking={seeking}
                alignment={alignment}
                aligned={aligned}
                whisper={whisper}
                oracle={oracle}
                restMotto={restMotto}
                burst={burst}
                discovered={discovered}
                tools={tools}
                creations={creations}
                fetchingTools={fetchingTools}
                fetchingCreation={fetchingCreation}
                onSeek={seek}
                onStep={step}
                onBringTo={bringTo}
                onRetryTool={retryTool}
                onForgeCreation={forgeCreation}
                onAwakenAll={awakenAllTools}
                awakening={awakening}
                onOpenWall={() => setPlace("tools")}
                onOpenBench={() => setPlace("bench")}
              />
            ) : place === "bench" ? (
              <SaBench
                messages={bench}
                draft={benchDraft}
                setDraft={setBenchDraft}
                status={benchStatus}
                error={benchError}
                dial={dial}
                plate={plate}
                square={square}
                aligned={aligned}
                alignment={alignment}
                onSend={askMirror}
                onClear={() => {
                  setBench([]);
                  setBenchError(null);
                  setBenchStatus("idle");
                }}
                onOpenCircles={() => setPlace("circles")}
              />
            ) : (
              <ToolWallChamber
                discovered={discovered}
                tools={tools}
                creations={creations}
                fetchingCreation={fetchingCreation}
                fetchingTools={fetchingTools}
                onForgeCreation={forgeCreation}
                onRetryTool={retryTool}
                onAwakenAll={awakenAllTools}
                awakening={awakening}
                onOpenCircles={() => setPlace("circles")}
                onOpenBench={() => setPlace("bench")}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- one chamber tab — the top-bar row ---------------- */

function SaTab({
  active,
  onClick,
  icon: Icon,
  label,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Orbit;
  label: string;
  testId: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={t(label)}
      title={t(label)}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:size-9",
        active
          ? "border-[color-mix(in_srgb,var(--sa-gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--sa-gold)_14%,transparent)] text-[var(--sa-gold-bright)] glow-sm"
          : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

/* ================================================================== */
/*  CHAMBER I — THE SACRED CIRCLES (the core of the world)             */
/* ================================================================== */

function CirclesChamber({
  dial,
  plate,
  square,
  outerIdx,
  midIdx,
  squareIdx,
  outerNet,
  midNet,
  squareNet,
  seeking,
  alignment,
  aligned,
  whisper,
  oracle,
  restMotto,
  burst,
  discovered,
  tools,
  creations,
  fetchingTools,
  fetchingCreation,
  onSeek,
  onStep,
  onBringTo,
  onRetryTool,
  onForgeCreation,
  onAwakenAll,
  awakening,
  onOpenWall,
  onOpenBench,
}: {
  dial: (typeof saDials)[number];
  plate: (typeof saPlates)[number];
  square: (typeof saSquares)[number];
  outerIdx: number;
  midIdx: number;
  squareIdx: number;
  outerNet: number;
  midNet: number;
  squareNet: number;
  seeking: boolean;
  alignment: SaAlignment | null;
  aligned: boolean;
  whisper: string;
  oracle: SaOracleReading;
  restMotto: string;
  burst: number;
  discovered: string[];
  tools: Record<string, SaTool>;
  creations: Record<string, SaCreation>;
  fetchingTools: string[];
  fetchingCreation: string | null;
  onSeek: () => void;
  onStep: (ring: "outer" | "mid" | "square", dir: 1 | -1) => void;
  onBringTo: (ring: "outer" | "mid" | "square", target: number, silent?: boolean) => void;
  onRetryTool: (ring: SaRingId, id: string) => void;
  onForgeCreation: (a: SaAlignment) => void;
  onAwakenAll: () => void;
  awakening: boolean;
  onOpenWall: () => void;
  onOpenBench: () => void;
}) {
  const t = useT();
  const [zoom, setZoom] = useState(false);

  /* the resonance tone — a soft sung partial chord at the formula's Hz */
  const [sounding, setSounding] = useState<number | null>(null);

  const playTone = (freq: number) => {
    playSaTone(freq);
    setSounding(freq);
    window.setTimeout(() => {
      setSounding((f) => (f === freq ? null : f));
    }, 4600);
  };

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

  /* the fresh deciphers — one card per resting sigil */
  const freshRings: {
    ring: SaRingId;
    key: "outer" | "mid" | "square";
    id: string;
    name: string;
  }[] = [
    { ring: "dial", key: "outer", id: dial.id, name: dial.name },
    { ring: "plate", key: "mid", id: plate.id, name: plate.name },
    { ring: "square", key: "square", id: square.id, name: square.name },
  ];

  const creation = alignment ? creations[alignment.id] : undefined;

  /* --------------------- the instrument block --------------------- */

  const instrument = (
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
            onClick={onSeek}
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
              "The Synth Analog instrument: an Aztec sun border around three circles of frequency — twelve dials, twelve transmutation plates and the interlocking rotating squares of the mirror core, every icon wearing its drawn sigil"
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
                    onClick={() => onBringTo("outer", i)}
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
                    <SaSigil
                      id={d.id}
                      ring="dial"
                      x={-14}
                      y={-14}
                      width={28}
                      height={28}
                      style={{ color: "var(--sa-ink)" }}
                    />
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
                    onClick={() => onBringTo("mid", i)}
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
                    <SaSigil
                      id={pl.id}
                      ring="plate"
                      x={-15}
                      y={-15}
                      width={30}
                      height={30}
                      style={{ color: "var(--sa-ink)" }}
                    />
                  </g>
                );
              })}
            </g>

            {/* ============ CIRCLE 3 — THE QUANTUM MIRROR CORE ============ */}
            <circle cx={CX} cy={CY} r="190" fill="none" stroke="var(--sa-gold-soft)" strokeWidth="1" opacity="0.45" aria-hidden="true" />

            {/* the interlocking rotating squares + the twelve square sigils */}
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
                const hasFace = saSquareHasFace(sq.id);
                return (
                  <g
                    key={sq.id}
                    transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${deg})`}
                    className="sa-hit"
                    onClick={() => onBringTo("square", i)}
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
                    <SaSigil
                      id={sq.id}
                      ring="square"
                      x={hasFace ? -13 : -14}
                      y={hasFace ? -16 : -14}
                      width={hasFace ? 26 : 28}
                      height={hasFace ? 26 : 28}
                      style={{ color: "var(--sa-ink)" }}
                    />
                    {hasFace && (
                      <text
                        y="16"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="600"
                        fill="var(--sa-ink)"
                        opacity="0.85"
                      >
                        {sq.face}
                      </text>
                    )}
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
              <div className="flex items-center gap-2">
                <SaSigil id={dial.id} ring="dial" className="size-4 shrink-0 text-[var(--sa-gold)]" />
                <dt className="shrink-0 text-muted-foreground">{t("Outer Dial")}</dt>
                <dd className="truncate font-semibold text-foreground" data-testid="sa-apex-outer">
                  {t(dial.name)}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <SaSigil id={plate.id} ring="plate" className="size-4 shrink-0 text-[var(--sa-gold)]" />
                <dt className="shrink-0 text-muted-foreground">{t("Transmutation Plate")}</dt>
                <dd className="truncate font-semibold text-foreground" data-testid="sa-apex-mid">
                  {t(plate.name)}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <SaSigil id={square.id} ring="square" className="size-4 shrink-0 text-[var(--sa-gold)]" />
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
            <p className="mono-label mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[var(--sa-gold-soft)]">
              {t(restMotto)}
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
                <button
                  type="button"
                  onClick={onOpenBench}
                  data-testid="sa-ask-bench"
                  className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <Feather className="size-3.5" aria-hidden="true" />
                  {t("Ask the mirror about it")}
                </button>
              </div>

              {/* the creation — climbing from the mirror core */}
              <div className="mt-3 border-t pt-3" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 24%, transparent)" }} data-testid="sa-creation-zone">
                {creations[alignment.id] ? (
                  <SaCreationCard creation={creations[alignment.id]} />
                ) : fetchingCreation === alignment.id ? (
                  <div className="flex flex-col items-center gap-2 py-3" aria-live="polite" aria-busy="true">
                    <QuantumLoading className="size-10 text-[var(--sa-gold)]" />
                    <p className="mono-label text-[10px] text-muted-foreground">
                      {t("the mirror core forges the creation…")}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onForgeCreation(alignment)}
                    data-testid="sa-forge-creation"
                    className="focus-glow flex h-8 w-full items-center justify-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                    style={{
                      borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                      background: "color-mix(in srgb, var(--sa-gold) 8%, transparent)",
                    }}
                  >
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {t("Decode the ancient technology — forge the creation")}
                  </button>
                )}
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
              data-oracle-kind={oracle.kind}
            >
              {/* the manual of combinations — every trio produces something */}
              <div className="flex items-center justify-between gap-2">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("The wheels speak")}
                </p>
                <span
                  className="mono-label shrink-0 rounded-full border px-2 py-0.5 text-[8.5px] uppercase tracking-[0.16em]"
                  style={{
                    borderColor: `color-mix(in srgb, ${SA_KIND_TONE[oracle.kind]} 42%, transparent)`,
                    color: SA_KIND_TONE[oracle.kind],
                  }}
                  data-testid="sa-oracle-kind"
                >
                  {t(SA_KIND_LABEL[oracle.kind])}
                </span>
              </div>
              <p
                className="mt-1.5 font-serif text-[14.5px] font-semibold italic text-foreground/95"
                data-testid="sa-oracle-name"
              >
                {oracle.name}
              </p>
              <p
                className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85"
                data-testid="sa-oracle-reading"
              >
                {oracle.reading}
              </p>
              <p className="mt-2.5 border-t pt-2 text-[12px] leading-relaxed text-muted-foreground/80" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 18%, transparent)" }}>
                {t(
                  "Every combination is a page of the manual — turn the wheels for another. Align a written formula and an ancient technology climbs out as a creation."
                )}
              </p>
            </div>
          )}

          {/* the fresh deciphers — one card per resting sigil */}
          <div className="grid gap-2 sm:grid-cols-1" data-testid="sa-fresh-tools">
            {freshRings.map(({ ring, id, name }) => {
              const tool = tools[id];
              const busy = fetchingTools.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (!tool && !busy) {
                      /* ask the core for this one sign again */
                      onRetryTool(ring, id);
                    }
                  }}
                  disabled={Boolean(tool) || busy}
                  data-testid={`sa-fresh-${id}`}
                  className={cn(
                    "focus-glow flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all duration-300",
                    !tool && !busy && "hover:-translate-y-px"
                  )}
                  style={{
                    borderColor: tool
                      ? "color-mix(in srgb, var(--sa-gold) 40%, transparent)"
                      : "var(--hairline)",
                    background: tool
                      ? "color-mix(in srgb, var(--sa-gold) 8%, transparent)"
                      : "var(--glass-bg)",
                    cursor: tool ? "default" : undefined,
                  }}
                >
                  <SaSigil
                    id={id}
                    ring={ring}
                    className={cn("size-5 shrink-0", busy && "sa-breathe")}
                    style={{ color: tool ? "var(--sa-gold)" : "var(--sa-gold-soft)" }}
                  />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="mono-label block truncate text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                      {t(name)}
                    </span>
                    <span
                      className="block truncate text-[12.5px] font-medium text-foreground/90"
                      data-testid={`sa-fresh-${id}-state`}
                    >
                      {tool
                        ? tool.name
                        : busy
                          ? t("the core deciphers…")
                          : t("not yet deciphered — ask the core")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* the codex count + the bridge to the wall */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
              data-testid="sa-count"
            >
              {t("{n} of {total} formulas remembered", {
                n: discovered.length,
                total: saAlignments.length,
              })}
            </p>
            <button
              type="button"
              onClick={onOpenWall}
              data-testid="sa-open-wall"
              className="focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
              style={{ borderColor: "var(--hairline)" }}
            >
              <Wrench className="size-3" aria-hidden="true" />
              {t("The Tool Wall")}
            </button>
          </div>
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
          onStep={(dir) => onStep("outer", dir)}
        />
        <SaStepper
          ring="mid"
          label="Transmutation Plates"
          current={plate.name}
          onStep={(dir) => onStep("mid", dir)}
        />
        <SaStepper
          ring="square"
          label="Square Glyphs"
          current={square.name}
          onStep={(dir) => onStep("square", dir)}
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
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="sa-board">
      {/* the chamber's own quiet intro */}
      <div className="mb-4 text-center">
        <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-[var(--sa-gold)]">
          {t(saWorld.kicker)}
        </p>
        <p className="mx-auto mt-1.5 max-w-[680px] text-[13.5px] leading-relaxed text-muted-foreground">
          {t(saWorld.reveals)}
        </p>
      </div>

      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-8">
        {instrument}

        {/* the colophon */}
        <p className="mono-label mt-8 text-center text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {t(saWorld.colophon)}
        </p>
      </div>

      {/* ---------- the instrument, full screen ---------- */}
      {zoom &&
        createPortal(
          <div
            className="scope-synth sa-root fixed inset-0 z-[80]"
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
              {instrument}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ================================================================== */
/*  CHAMBER II — THE BENCH (the Analog Mirror's own chat)              */
/* ================================================================== */

function SaBench({
  messages,
  draft,
  setDraft,
  status,
  error,
  dial,
  plate,
  square,
  aligned,
  alignment,
  onSend,
  onClear,
  onOpenCircles,
}: {
  messages: BenchMessage[];
  draft: string;
  setDraft: (v: string) => void;
  status: "idle" | "loading" | "error";
  error: string | null;
  dial: (typeof saDials)[number];
  plate: (typeof saPlates)[number];
  square: (typeof saSquares)[number];
  aligned: boolean;
  alignment: SaAlignment | null;
  onSend: (q: string) => void;
  onClear: () => void;
  onOpenCircles: () => void;
}) {
  const t = useT();
  const threadRef = useRef<HTMLDivElement | null>(null);

  const loading = status === "loading";

  /* the thread keeps its latest decipher in view */
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, status]);

  const send = (text?: string) => {
    const q = (text ?? draft).trim();
    if (!q || loading) return;
    onSend(q);
  };

  const canSend = draft.trim().length > 0 && !loading;

  return (
    <div
      className="scope-frame-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl glass"
      data-testid="synth-bench"
    >
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />

      {/* slim header — the bench's name, the resting trio, the quiet hand */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b hairline px-4 py-2.5 sm:px-5">
        <h3 className="mono-label flex min-w-0 items-center gap-2 text-[11px] text-[var(--sa-gold)]">
          <Feather className="size-3.5 shrink-0" aria-hidden="true" />
          {t("The Analog Mirror speaks")}
          <span
            className="hidden min-w-0 truncate text-[9.5px] normal-case tracking-normal text-muted-foreground/80 md:inline"
            data-testid="synth-bench-trio"
          >
            · {t(dial.name)} · {t(plate.name)} · {t(square.name)}
            {aligned && alignment ? ` — ${alignment.code}` : ""}
          </span>
        </h3>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t("Quiet the mirror")}
            title={t("Quiet the mirror")}
            data-testid="synth-bench-clear"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:text-foreground"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* thread — the whole height of the chamber, its own scroll */}
      <div
        ref={threadRef}
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
        data-testid="synth-thread"
      >
        {messages.length === 0 && status === "idle" && !error ? (
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex size-14 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--sa-gold)_38%,transparent)] bg-[color-mix(in_srgb,var(--sa-gold)_9%,transparent)]"
              aria-hidden="true"
            >
              <span
                className="absolute inset-0 rounded-full border border-dashed border-[color-mix(in_srgb,var(--sa-jade)_35%,transparent)]"
                style={{ animation: "spin-slower 22s linear infinite" }}
              />
              <SaSigil id="chymic-gold" ring="dial" className="size-6 text-[var(--sa-gold)]" />
            </motion.span>
            <p className="scope-gradient-text mt-4 text-[17px] font-semibold sm:text-[19px]">
              {t("The Mirror Deciphers All")}
            </p>
            <p className="mx-auto mt-2 max-w-[500px] text-[14.5px] leading-relaxed text-muted-foreground">
              {t(
                "The mirror is aware of every combination happening on the wheels — and answers in Analog language. Ask it to decipher the resting trio, a formula, or any technology the old world hid."
              )}
            </p>
            <p className="mx-auto mt-4 max-w-[440px] text-[13.5px] italic leading-relaxed text-muted-foreground/80">
              {t("we decode ancient technologies so we create them")}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[760px] space-y-4">
            {messages.map((m, i) =>
              m.kind === "system" ? (
                <p
                  key={m.id}
                  className="mono-label py-0.5 text-center text-[9.5px] uppercase tracking-[0.16em]"
                  style={{ color: "color-mix(in srgb, var(--sa-gold) 78%, white)" }}
                  data-testid="synth-system-line"
                >
                  — {m.text} —
                </p>
              ) : (
                <motion.article
                  key={m.id}
                  initial={i === messages.length - 1 ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl border hairline px-4 py-3.5 sm:px-5"
                  style={{
                    background: "color-mix(in srgb, var(--sa-gold) 5%, transparent)",
                  }}
                  data-testid="synth-exchange"
                >
                  <p className="text-[13px] italic leading-relaxed text-muted-foreground">
                    {m.query}
                  </p>
                  <div className="mt-2.5">
                    <SaBody text={m.text} />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <ListenButton text={m.text} cacheKey={`sa-${m.id}`} variant="icon" />
                  </div>
                </motion.article>
              )
            )}

            {loading && (
              <div
                className="rounded-xl border hairline px-4 py-3.5 sm:px-5"
                aria-live="polite"
                aria-busy="true"
              >
                <p className="text-[13px] italic leading-relaxed text-muted-foreground">
                  {draft || t("Deciphering…")}
                </p>
                <div className="mt-3 flex flex-col items-center gap-2.5">
                  <QuantumLoading className="size-16 text-[var(--sa-gold)] sm:size-20" />
                  <span className="mono-label text-center text-[11px] text-muted-foreground">
                    {t("the mirror reads the signs…")}
                  </span>
                </div>
              </div>
            )}

            {status === "error" && error && (
              <div className="rounded-xl border hairline px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground/85">
                {t(error)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* suggestion sparks — Analog questions, six at a time */}
      <div className="shrink-0 px-3 pb-1 pt-2 sm:px-4">
        <ContextSuggestionStrip
          poolId="synth"
          contextText={messages
            .slice(-6)
            .map((m) => (m.kind === "exchange" ? `${m.query}\n${m.text}` : ""))
            .join("\n")}
          onPick={(s) => {
            if (!loading) send(s);
          }}
          testIdPrefix="synth-suggestion"
        />
      </div>

      {/* composer */}
      <div className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex w-full max-w-[720px] items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={600}
            aria-label={t("Speak to the Analog Mirror")}
            data-testid="synth-composer"
            placeholder={t(
              "Ask the mirror to decipher — a trio, a formula, an old technology…"
            )}
            className="focus-glow max-h-28 min-h-[46px] w-full resize-none rounded-xl border hairline bg-transparent px-3.5 py-2.5 text-[14.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!canSend}
            aria-label={t("Send to the Analog Mirror")}
            data-testid="synth-send"
            className={cn(
              "focus-glow flex size-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
              canSend ? "hover:glow-sm" : "cursor-not-allowed opacity-45"
            )}
            style={{
              borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--sa-gold) 15%, transparent), color-mix(in srgb, var(--sa-jade) 13%, transparent))",
            }}
          >
            <Feather className="size-4" aria-hidden="true" />
          </button>
        </div>
        {/* the bridge back to the circles */}
        <div className="mx-auto mt-2 flex w-full max-w-[720px] justify-center">
          <button
            type="button"
            onClick={onOpenCircles}
            data-testid="synth-back-to-circles"
            className="focus-glow group flex h-7 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--sa-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--sa-gold)_7%,transparent)] px-3 text-[12px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--sa-gold)_50%,transparent)]"
          >
            <Orbit className="size-3 text-[var(--sa-gold)]" aria-hidden="true" />
            {t("Back to the circles")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  THE TOOLS' DEMONSTRATIONS — every tool shows its purpose           */
/* ================================================================== */

/** One small living engine per sigil — the tool performing its own
    purpose inside a 132×44 window. */
function SaDemoEngine({ id, ring }: { id: string; ring: SaRingId }) {
  const ink = "var(--sa-gold)";
  const jade = "var(--sa-jade)";
  const key = ring === "plate" ? id : id;

  if (ring === "square") {
    /* a tone bar — the sign's own sound, held as a standing wave */
    const num = saSquares.find((s) => s.id === id)?.face ?? "";
    return (
      <g>
        <line x1="16" y1="22" x2="116" y2="22" stroke={ink} strokeWidth="1" opacity="0.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            cx={26 + i * 20}
            cy="22"
            r={5 - Math.abs(i - 2) * 1.2}
            fill={i % 2 ? jade : ink}
            className="sa-demo-pulse"
            style={{ animationDelay: `${i * 0.28}s` }}
          />
        ))}
        <text x="66" y="40" textAnchor="middle" fontSize="9" fontWeight="600" fill={ink} opacity="0.85">
          {num}
        </text>
      </g>
    );
  }

  switch (key) {
    case "vibration":
      return (
        <g>
          <circle cx="66" cy="22" r="10" fill="none" stroke={ink} strokeWidth="1.6" className="sa-demo-pulse" />
          <circle cx="66" cy="22" r="3" fill={ink} className="sa-demo-pulse" style={{ animationDelay: "0.4s" }} />
          <path d="M 30 22 h 14 M 88 22 h 14" stroke={ink} strokeWidth="1.4" className="sa-demo-flicker" />
        </g>
      );
    case "intention":
      return (
        <g>
          <path d="M 34 22 H 86 M 78 15 L 88 22 L 78 29" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="42" cy="22" r="3" fill={jade} className="sa-demo-pulse" />
        </g>
      );
    case "harmonics":
      return (
        <g fill="none" stroke={ink}>
          {[8, 14, 20].map((r, i) => (
            <circle key={r} cx="66" cy="22" r={r} strokeWidth="1.3" className="sa-demo-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>
      );
    case "mirror-matrix":
      return (
        <g>
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={36 + (i % 4) * 16}
              y={14 + Math.floor(i / 4) * 16}
              width="9"
              height="9"
              fill="none"
              stroke={i % 2 ? jade : ink}
              strokeWidth="1.2"
              className="sa-demo-pulse"
              style={{ animationDelay: `${(i % 4) * 0.3}s` }}
            />
          ))}
        </g>
      );
    case "resonance":
      return (
        <g fill="none" strokeWidth="1.6">
          <circle cx="46" cy="22" r="9" stroke={ink} className="sa-demo-pulse" />
          <circle cx="86" cy="22" r="9" stroke={jade} className="sa-demo-pulse" style={{ animationDelay: "1.1s" }} />
          <line x1="55" y1="22" x2="77" y2="22" stroke={ink} strokeWidth="1" opacity="0.5" className="sa-demo-flicker" />
        </g>
      );
    case "scalar-wave":
    case "p-scalar":
    case "p-quetzal":
      return (
        <g>
          <path
            d={key === "p-quetzal"
              ? "M 26 22 C 36 8, 46 36, 56 22 S 76 8, 86 22 S 100 32, 106 22"
              : "M 26 22 Q 36 10 46 22 T 66 22 T 86 22 T 106 22"}
            fill="none"
            stroke={ink}
            strokeWidth="1.5"
          />
          <circle r="3.4" fill={jade} cy="22" cx="26" className="sa-demo-sweep" />
        </g>
      );
    case "chymic-gold":
      return (
        <g>
          <circle cx="66" cy="22" r="12" fill={ink} opacity="0.35" className="sa-demo-pulse" />
          <circle cx="66" cy="22" r="5" fill={ink} className="sa-demo-flicker" />
          <circle cx="66" cy="22" r="16" fill="none" stroke={ink} strokeWidth="0.8" opacity="0.5" />
        </g>
      );
    case "aether-dial":
    case "p-aether":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.4">
          <path d="M 42 30 A 26 26 0 0 1 90 30" className="sa-demo-flicker" />
          <path d="M 48 24 A 20 20 0 0 1 84 24" className="sa-demo-flicker" style={{ animationDelay: "0.7s" }} />
          <circle cx="66" cy="14" r="2.4" fill={jade} stroke="none" className="sa-demo-pulse" />
        </g>
      );
    case "biophoton":
      return (
        <g>
          <circle cx="66" cy="22" r="11" fill="none" stroke={jade} strokeWidth="1.2" opacity="0.7" />
          <circle cx="66" cy="22" r="4.5" fill={ink} className="sa-demo-flicker" />
        </g>
      );
    case "torus-core":
    case "p-torus":
      return (
        <g fill="none" strokeWidth="1.5">
          <ellipse cx="66" cy="22" rx="17" ry="7" stroke={ink} className="sa-demo-spin" />
          <ellipse cx="66" cy="22" rx="17" ry="7" stroke={jade} className="sa-demo-spin-rev" opacity="0.8" />
          <circle cx="66" cy="22" r="2.6" fill={ink} stroke="none" />
        </g>
      );
    case "tachyonic-field":
      return (
        <g>
          <path d="M 34 22 H 84 M 77 15 L 87 22 L 77 29" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="92" cy="22" r="4" fill={jade} className="sa-demo-flash" />
        </g>
      );
    case "solfeggio":
      return (
        <g stroke={ink} strokeWidth="1.2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} className="sa-demo-pulse" style={{ animationDelay: `${i * 0.32}s` }}>
              <line x1={34 + i * 13} y1={26 - (i % 3) * 4} x2={34 + i * 13} y2={12 - (i % 3) * 4} />
              <circle cx={32 + i * 13} cy={27 - (i % 3) * 4} r="2.6" fill={ink} stroke="none" />
            </g>
          ))}
        </g>
      );
    case "p-merkaba":
      return (
        <g fill="none" strokeWidth="1.5">
          <path d="M 66 8 L 80 30 L 52 30 Z" stroke={ink} className="sa-demo-spin" />
          <path d="M 66 36 L 52 14 L 80 14 Z" stroke={jade} className="sa-demo-spin-rev" opacity="0.85" />
        </g>
      );
    case "p-phi":
      return (
        <g fill={ink}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = i * 1.05;
            const r = 4 + i * 3.4;
            return (
              <circle
                key={i}
                cx={66 + r * Math.cos(a)}
                cy={22 + r * Math.sin(a) * 0.7}
                r={1.6 + i * 0.5}
                className="sa-demo-pulse"
                style={{ animationDelay: `${i * 0.24}s` }}
                opacity={0.9 - i * 0.08}
              />
            );
          })}
        </g>
      );
    case "p-obsidian":
      return (
        <g stroke={ink} strokeWidth="1.6" fill="none">
          <rect x="46" y="10" width="16" height="24" className="sa-demo-part" />
          <rect x="70" y="10" width="16" height="24" className="sa-demo-part" style={{ animationDelay: "1.4s" }} />
          <line x1="66" y1="8" x2="66" y2="36" stroke={jade} strokeWidth="0.9" strokeDasharray="3 4" />
        </g>
      );
    case "p-tzolkin":
      return (
        <g fill={ink}>
          {Array.from({ length: 10 }, (_, i) => (
            <circle
              key={i}
              cx={36 + (i % 5) * 15}
              cy={15 + Math.floor(i / 5) * 14}
              r="2.6"
              className="sa-demo-pulse"
              style={{ animationDelay: `${(i % 5) * 0.26 + Math.floor(i / 5) * 0.6}s` }}
            />
          ))}
        </g>
      );
    case "p-prism":
      return (
        <g stroke={ink} fill="none" strokeWidth="1.4">
          <line x1="28" y1="22" x2="56" y2="22" />
          <path d="M 56 14 L 70 22 L 56 30 Z" stroke={jade} />
          <line x1="70" y1="22" x2="104" y2="12" className="sa-demo-flicker" />
          <line x1="70" y1="22" x2="104" y2="22" className="sa-demo-flicker" style={{ animationDelay: "0.5s" }} />
          <line x1="70" y1="22" x2="104" y2="32" className="sa-demo-flicker" style={{ animationDelay: "1s" }} />
        </g>
      );
    case "p-sol":
      return (
        <g stroke={ink} strokeWidth="1.4">
          <circle cx="66" cy="22" r="8" fill="none" className="sa-demo-pulse" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={66 + 12 * Math.cos(a)}
                y1={22 + 12 * Math.sin(a)}
                x2={66 + 17 * Math.cos(a)}
                y2={22 + 17 * Math.sin(a)}
                className="sa-demo-flicker"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            );
          })}
        </g>
      );
    case "p-nodal":
      return (
        <g fill="none" strokeWidth="1.5">
          <circle cx="58" cy="22" r="11" stroke={ink} />
          <circle cx="74" cy="22" r="11" stroke={jade} className="sa-demo-pulse" />
        </g>
      );
    case "p-silica":
      return (
        <g fill="none" stroke={ink} strokeWidth="1.2">
          <path d="M 66 8 L 80 22 L 66 36 L 52 22 Z" className="sa-demo-flicker" />
          <path d="M 66 8 L 66 36 M 52 22 L 80 22" opacity="0.5" />
          <circle cx="66" cy="22" r="2.4" fill={jade} stroke="none" className="sa-demo-pulse" />
        </g>
      );
    default:
      return (
        <g fill="none" stroke={ink} strokeWidth="1.4">
          <circle cx="66" cy="22" r="12" className="sa-demo-spin" strokeDasharray="6 5" />
          <circle cx="66" cy="22" r="3" fill={ink} stroke="none" />
        </g>
      );
  }
}

/** One tool's demonstration strip — the living engine, its purpose and
    first stroke, and the sign's own tone when it carries one. */
function SaToolDemo({ ring, sigilId, tool }: { ring: SaRingId; sigilId: string; tool: SaTool }) {
  const t = useT();
  const [sounding, setSounding] = useState(false);
  const freq = saSigilFrequency(ring, sigilId);

  const tone = () => {
    if (!freq) return;
    playSaTone(freq);
    setSounding(true);
    window.setTimeout(() => setSounding(false), 4600);
  };

  return (
    <div
      className="mt-2 rounded-xl border px-3 py-2.5"
      style={{
        borderColor: "color-mix(in srgb, var(--sa-gold) 30%, transparent)",
        background: "color-mix(in srgb, var(--sa-gold) 6%, transparent)",
      }}
      data-testid={`synth-tool-demo-strip-${sigilId}`}
    >
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 132 44"
          className="h-11 w-[132px] shrink-0"
          aria-hidden="true"
          role="img"
        >
          <SaDemoEngine id={sigilId} ring={ring} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="mono-label text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("demonstration")}
          </p>
          {tool.purpose && (
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-foreground/85">
              {tool.purpose}
            </p>
          )}
        </div>
        {freq && (
          <button
            type="button"
            onClick={tone}
            data-testid={`synth-tool-tone-${sigilId}`}
            className="focus-glow flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
            style={{
              borderColor: "color-mix(in srgb, var(--sa-gold) 42%, transparent)",
            }}
          >
            <Volume2 className="size-3" aria-hidden="true" />
            {sounding ? t("Sounding…") : `${freq} Hz`}
          </button>
        )}
      </div>
      {tool.first_stroke && (
        <p className="mt-1.5 border-t pt-1.5 text-[11.5px] leading-snug text-muted-foreground" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 18%, transparent)" }}>
          <span className="mono-label mr-1.5 text-[8.5px] uppercase tracking-[0.16em] text-[var(--sa-gold)]">
            {t("first stroke")}
          </span>
          {tool.first_stroke}
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/*  CHAMBER III — THE TOOL WALL (what the circles have birthed)        */
/* ================================================================== */

function ToolWallChamber({
  discovered,
  tools,
  creations,
  fetchingCreation,
  fetchingTools,
  onForgeCreation,
  onRetryTool,
  onAwakenAll,
  awakening,
  onOpenCircles,
  onOpenBench,
}: {
  discovered: string[];
  tools: Record<string, SaTool>;
  creations: Record<string, SaCreation>;
  fetchingCreation: string | null;
  fetchingTools: string[];
  onForgeCreation: (a: SaAlignment) => void;
  onRetryTool: (ring: SaRingId, id: string) => void;
  onAwakenAll: () => void;
  awakening: boolean;
  onOpenCircles: () => void;
  onOpenBench: () => void;
}) {
  const t = useT();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState<string | null>(null);

  const tool = selectedTool ? tools[selectedTool] : undefined;
  const foundCount = discovered.length;
  const awakeCount = Object.keys(tools).length;
  const TOTAL_TOOLS = saDials.length + saPlates.length + saSquares.length;

  const groups: {
    ring: SaRingId;
    title: string;
    items: { id: string; name: string; hint: string }[];
  }[] = [
    {
      ring: "dial",
      title: "Tools of the Outer Dials",
      items: saDials.map((d) => ({ id: d.id, name: d.name, hint: d.element })),
    },
    {
      ring: "plate",
      title: "Tools of the Transmutation Plates",
      items: saPlates.map((p) => ({ id: p.id, name: p.name, hint: p.technique })),
    },
    {
      ring: "square",
      title: "Tools of the Square Glyphs",
      items: saSquares.map((s) => ({ id: s.id, name: s.name, hint: s.opens })),
    },
  ];

  return (
    <div
      className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-8"
      data-testid="synth-wall"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* the awakening of all tools — compact, functional, one procession */}
        <div
          className="mb-6 flex flex-col items-center gap-2"
          data-testid="synth-awaken-zone"
        >
          <p
            className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            data-testid="synth-awaken-count"
          >
            {t("{n} of {total} tools awake", { n: awakeCount, total: TOTAL_TOOLS })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onAwakenAll}
              disabled={awakening || awakeCount >= TOTAL_TOOLS}
              data-testid="synth-awaken-all"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                background: "color-mix(in srgb, var(--sa-gold) 10%, transparent)",
              }}
            >
              <Wand2
                className={cn("size-3.5", awakening && "sa-breathe")}
                aria-hidden="true"
              />
              {awakening
                ? t("the tools wake…")
                : t("Awaken all tools")}
            </button>
            <button
              type="button"
              onClick={onOpenCircles}
              data-testid="synth-back-to-circles-top"
              className="focus-glow group flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--sa-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--sa-gold)_7%,transparent)] px-3.5 text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--sa-gold)_50%,transparent)]"
            >
              <Orbit className="size-3.5 text-[var(--sa-gold)]" aria-hidden="true" />
              {t("Back to the circles")}
            </button>
          </div>
        </div>

        {/* ============ the creations of the alignments ============ */}
        <div className="mb-8">
          <p className="mono-label mb-1 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("The Codex of Cosmic Alignments — the creations")}
          </p>
          <p className="mx-auto mb-4 max-w-[560px] text-center text-[12.5px] leading-relaxed text-muted-foreground/80">
            {t(
              "Every formula the wheels have aligned climbs out of the mirror core as a creation — an ancient technology, decoded so we create it."
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="sa-codex">
            {saAlignments.map((a) => {
              const found = discovered.includes(a.id);
              const creation = creations[a.id];
              const forging = fetchingCreation === a.id;
              return (
                <div
                  key={a.id}
                  data-testid={`sa-codex-${a.id}`}
                  data-found={found ? "true" : "false"}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-500",
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
                    creation ? (
                      <div className="mt-2 border-t pt-2" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 22%, transparent)" }}>
                        <p className="text-[13.5px] font-semibold text-foreground">
                          {creation.name}
                        </p>
                        <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-foreground/85">
                          {creation.essence}
                        </p>
                        <p className="mt-1.5 font-serif text-[12px] italic text-muted-foreground">
                          “{creation.whisper}”
                        </p>
                      </div>
                    ) : forging ? (
                      <div className="mt-2 flex flex-col items-center gap-1.5 py-2" aria-busy="true">
                        <QuantumLoading className="size-8 text-[var(--sa-gold)]" />
                        <p className="mono-label text-[9.5px] text-muted-foreground">
                          {t("forging…")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 border-t pt-2" style={{ borderColor: "color-mix(in srgb, var(--sa-gold) 22%, transparent)" }}>
                        <p className="font-serif text-[12px] italic leading-snug text-muted-foreground">
                          {t(a.formula)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onForgeCreation(a)}
                          data-testid={`sa-codex-forge-${a.id}`}
                          className="focus-glow mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                          style={{
                            borderColor: "color-mix(in srgb, var(--sa-gold) 45%, transparent)",
                            background: "color-mix(in srgb, var(--sa-gold) 8%, transparent)",
                          }}
                        >
                          <Sparkles className="size-3" aria-hidden="true" />
                          {t("Decode the creation")}
                        </button>
                      </div>
                    )
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
          <p
            className="mono-label mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            data-testid="synth-wall-count"
          >
            {t("{n} of {total} formulas remembered", {
              n: foundCount,
              total: saAlignments.length,
            })}
          </p>
        </div>

        {/* ============ the tools of the sigils — compact, functional ============ */}
        {groups.map((group) => (
          <div key={group.ring} className="mb-7">
            <p className="mono-label mb-3 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t(group.title)}
            </p>
            <div
              className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
              data-testid={`synth-wall-${group.ring}s`}
            >
              {group.items.map((item) => {
                const itemTool = tools[item.id];
                const selected = selectedTool === item.id;
                const demoOpenHere = demoOpen === item.id;
                const busy = fetchingTools.includes(item.id);
                return (
                  <div
                    key={item.id}
                    data-testid={`synth-tool-card-${item.id}`}
                    className={cn(
                      "rounded-xl border p-2.5 transition-all duration-300",
                      selected && "glow-sm"
                    )}
                    style={{
                      borderColor: selected
                        ? "color-mix(in srgb, var(--sa-gold) 60%, transparent)"
                        : itemTool
                          ? "color-mix(in srgb, var(--sa-gold) 36%, transparent)"
                          : "var(--hairline)",
                      background: selected
                        ? "color-mix(in srgb, var(--sa-gold) 14%, transparent)"
                        : itemTool
                          ? "color-mix(in srgb, var(--sa-gold) 7%, transparent)"
                          : "var(--glass-bg)",
                    }}
                  >
                    {/* the compact face — click opens the workbench below */}
                    <button
                      type="button"
                      onClick={() => setSelectedTool(selected ? null : item.id)}
                      aria-pressed={selected}
                      data-testid={`synth-tool-face-${item.id}`}
                      className="focus-glow flex w-full items-center gap-2.5 text-left"
                    >
                      <SaSigil
                        id={item.id}
                        ring={group.ring}
                        className={cn("size-5 shrink-0", busy && "sa-breathe")}
                        style={{
                          color: itemTool ? "var(--sa-gold)" : "var(--sa-gold-soft)",
                          opacity: itemTool ? 1 : 0.6,
                        }}
                      />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="mono-label block truncate text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                          {t(item.name)}
                        </span>
                        <span
                          className="block truncate text-[12px] font-medium text-foreground/90"
                          data-testid={`synth-tool-card-${item.id}-state`}
                        >
                          {itemTool
                            ? itemTool.name
                            : busy
                              ? t("the core deciphers…")
                              : t("not yet deciphered")}
                        </span>
                      </span>
                      {itemTool ? (
                        <Sparkles
                          className="size-3.5 shrink-0"
                          style={{ color: "var(--sa-gold-bright)" }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Lock
                          className="size-3 shrink-0 text-muted-foreground/50"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {/* the function row — every tool awake and demonstrable */}
                    <div
                      className="mt-1.5 flex items-center gap-1.5 border-t pt-1.5"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--sa-gold) 18%, transparent)",
                      }}
                    >
                      {itemTool ? (
                        <button
                          type="button"
                          onClick={() => setDemoOpen(demoOpenHere ? null : item.id)}
                          aria-pressed={demoOpenHere}
                          data-testid={`synth-tool-demo-${item.id}`}
                          className="focus-glow flex h-6.5 flex-1 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--sa-gold) 40%, transparent)",
                            background: demoOpenHere
                              ? "color-mix(in srgb, var(--sa-gold) 14%, transparent)"
                              : undefined,
                          }}
                        >
                          {demoOpenHere ? (
                            <Minimize2 className="size-3" aria-hidden="true" />
                          ) : (
                            <Play className="size-3" aria-hidden="true" />
                          )}
                          {t("Demonstrate")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRetryTool(group.ring, item.id)}
                          disabled={busy}
                          data-testid={`synth-tool-activate-${item.id}`}
                          className="focus-glow flex h-6.5 flex-1 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px disabled:cursor-wait disabled:opacity-60"
                          style={{
                            borderColor: "var(--hairline)",
                          }}
                        >
                          <Wand2 className="size-3" aria-hidden="true" />
                          {busy ? t("the core deciphers…") : t("Activate")}
                        </button>
                      )}
                    </div>

                    {/* the demonstration — the tool showing its own purpose */}
                    {demoOpenHere && itemTool && (
                      <SaToolDemo ring={group.ring} sigilId={item.id} tool={itemTool} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* the chosen tool's workbench resting below the wall */}
        {tool && (
          <motion.div
            key={tool.sigilId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-[620px]"
            data-testid="synth-tool-workbench"
          >
            <SaToolCard
              tool={tool}
              signName={
                [
                  ...saDials.map((d) => ({ id: d.id, name: d.name })),
                  ...saPlates.map((p) => ({ id: p.id, name: p.name })),
                  ...saSquares.map((s) => ({ id: s.id, name: s.name })),
                ].find((x) => x.id === tool.sigilId)?.name ?? tool.sigilId
              }
              ring={tool.ring}
            />
          </motion.div>
        )}

        {/* the bridge back to the bench */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onOpenBench}
            data-testid="synth-wall-to-bench"
            className="focus-glow flex h-8 items-center gap-2 rounded-full border hairline px-3.5 text-[13px] font-medium text-muted-foreground transition-all duration-300 hover:text-foreground"
          >
            <Feather className="size-3.5" aria-hidden="true" />
            {t("Ask the mirror about it")}
          </button>
        </div>

        <p className="mono-label mt-8 text-center text-[10px] text-muted-foreground/60">
          {t("The sun holds the apex · Free will honored always")}
        </p>
      </motion.div>
    </div>
  );
}
