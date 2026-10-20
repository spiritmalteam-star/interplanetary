"use client";

/* SCOPE LAB DECK — the laboratory that replaces plain chat when the visitor
   wears the Interplanetary, Quantum or HealX scope. Three benches of honest,
   working instruments (real gate math, real counters, real star catalog),
   progression kept per-scope in localStorage "mirror:lab-progress:v1". */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type JSX,
  type ReactNode,
} from "react";
import {
  Atom,
  AudioWaveform,
  Blend,
  FlaskConical,
  GitMerge,
  HeartPulse,
  Leaf,
  Pause,
  PersonStanding,
  Play,
  Radar,
  RotateCcw,
  Rocket,
  Sparkle,
  Sprout,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  HealxInstruments,
  InterplanetaryInstruments,
  QuantumInstruments,
} from "./ScopeLabInstruments";

export type LabScope = "interplanetary" | "quantum" | "healing" | "florax";

type Complex = { re: number; im: number };
type LabProgress = Record<string, { xp: number; events: number }>;

const PROGRESS_KEY = "mirror:lab-progress:v1";
const TIER_STEPS = [0, 12, 36, 90] as const;
const XP_CAP = TIER_STEPS[TIER_STEPS.length - 1];

const TIER_NAMES: Record<LabScope, readonly string[]> = {
  quantum: ["Observer", "Experimenter", "Theorist", "Adept of the Unseen"],
  healing: ["Listener", "Breather", "Steward", "Keeper of Quiet"],
  interplanetary: ["Scout", "Navigator", "Cartographer", "Herald of the Deep"],
  florax: ["Sprout", "Herbalist", "Alchemist", "Keeper of the Garden"],
};

const LAB_TITLES: Record<LabScope, string> = {
  interplanetary: "The Interplanetary Lab",
  quantum: "The Quantum Lab",
  healing: "The HealX Lab",
  florax: "The Florax Greenhouse",
};

const LAB_SUBTITLES: Record<LabScope, string> = {
  interplanetary: "scan · decode · compute — chart the near deep",
  quantum: "states · gates · entanglement — touch the unseen",
  healing: "breath · body · rest — instruments for quiet",
  florax: "leaves · extractions · living formulations",
};

/** accent at NN% strength over transparency */
const mix = (accent: string, pct: number): string =>
  `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/* ── progression hook ─────────────────────────────────────────────────── */

function useLabProgress(scope: LabScope) {
  const [entry, setEntry] = useState<{ xp: number; events: number }>({ xp: 0, events: 0 });
  const entryRef = useRef(entry);

  /* hydrate from the device log after mount (no hydration mismatch) */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LabProgress;
      const found = parsed[scope];
      if (found && typeof found.xp === "number" && typeof found.events === "number") {
        entryRef.current = { xp: found.xp, events: found.events };
        setEntry(entryRef.current);
      }
    } catch {
      /* a corrupt log is quietly forgiven */
    }
  }, [scope]);

  const addXp = useCallback(
    (n: number, events = 0) => {
      const prev = entryRef.current;
      const next = { xp: Math.min(prev.xp + n, XP_CAP), events: prev.events + events };
      entryRef.current = next;
      setEntry(next);
      try {
        const raw = window.localStorage.getItem(PROGRESS_KEY) ?? "{}";
        const parsed = JSON.parse(raw) as LabProgress;
        parsed[scope] = next;
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
      } catch {
        /* the log forgives */
      }
    },
    [scope]
  );

  const derived = useMemo(() => {
    let tierIndex = 0;
    for (let i = TIER_STEPS.length - 1; i >= 0; i -= 1) {
      if (entry.xp >= TIER_STEPS[i]) {
        tierIndex = i;
        break;
      }
    }
    const nextAt = tierIndex < TIER_STEPS.length - 1 ? TIER_STEPS[tierIndex + 1] : null;
    const floor = TIER_STEPS[tierIndex];
    const progress = nextAt === null ? 1 : clamp01((entry.xp - floor) / (nextAt - floor));
    return { tier: TIER_NAMES[scope][tierIndex], tierIndex, nextAt, progress };
  }, [scope, entry.xp]);

  return { xp: entry.xp, events: entry.events, ...derived, addXp };
}

/* ── reduced motion ───────────────────────────────────────────────────── */

const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

const subscribeNoop = (): (() => void) => () => {};

/* ── shared chrome atoms ──────────────────────────────────────────────── */

function LabCard({ icon: Icon, title, note, accent, className = "", children }: {
  icon: LucideIcon; title: string; note?: string; accent: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-3 transition-colors duration-300 ${className}`}
      style={{ borderColor: mix(accent, 20), background: mix(accent, 6) }}>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <h3 className="font-serif text-[13px] leading-tight text-foreground">{title}</h3>
      </div>
      {note ? (
        <p className="mono-label mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">{note}</p>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ accent, active = false, onClick, disabled = false, title, children }: {
  accent: string; active?: boolean; onClick: () => void; disabled?: boolean; title?: string; children: ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title} aria-pressed={active}
      className={`focus-glow min-h-[32px] rounded-full border px-2.5 py-1 text-[10.5px] leading-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${active ? "" : "text-muted-foreground hover:text-foreground"}`}
      style={{
        borderColor: active ? mix(accent, 60) : mix(accent, 22),
        background: active ? mix(accent, 16) : "transparent",
        color: active ? accent : undefined,
      }}
    >
      {children}
    </button>
  );
}

function LabButton({ accent, onClick, disabled = false, children }: {
  accent: string; onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="mono-label focus-glow min-h-[32px] rounded-xl border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-colors duration-300 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: mix(accent, 45), background: mix(accent, 12), color: accent }}>
      {children}
    </button>
  );
}

function GhostAsk({ accent, onClick, disabled = false, children }: {
  accent: string; onClick: () => void; disabled?: boolean; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="focus-glow min-h-[32px] rounded-lg px-1 py-1 text-left text-[11px] text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      style={{ textDecorationColor: mix(accent, 55) }}>
      {children}
    </button>
  );
}

function HonestLine({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[10.5px] italic leading-snug text-muted-foreground/80">{children}</p>;
}

function ProgressChip({ accent, tier, tierIndex, progress, xp }: {
  accent: string; tier: string; tierIndex: number; progress: number; xp: number;
}) {
  const t = useT();
  const maxed = tierIndex >= TIER_STEPS.length - 1;
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1"
      style={{ borderColor: mix(accent, 30), background: mix(accent, 8) }}>
      <span className="mono-label max-w-[110px] truncate text-[9px] uppercase tracking-[0.14em]"
        style={{ color: mix(accent, 85) }}>
        {t(tier)}
      </span>
      <span className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-foreground/10"
        role="progressbar" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)} aria-label={t("Progress to the next tier")}>
        <span
          className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${Math.round(progress * 100)}%`, background: accent }} />
      </span>
      <span className="mono-label text-[9px] tabular-nums text-muted-foreground">{xp} {t("xp")}</span>
      {maxed ? (
        <Sparkle className="size-3 shrink-0" style={{ color: accent }} aria-label={t("Highest tier reached")} />
      ) : null}
    </div>
  );
}

/* ══ QUANTUM LAB ════════════════════════════════════════════════════════ */

const C = (re: number, im = 0): Complex => ({ re, im });
const cmul = (x: Complex, y: Complex): Complex => ({
  re: x.re * y.re - x.im * y.im,
  im: x.re * y.im + x.im * y.re,
});
const cadd = (x: Complex, y: Complex): Complex => ({ re: x.re + y.re, im: x.im + y.im });
const cabs2 = (z: Complex): number => z.re * z.re + z.im * z.im;
const carg = (z: Complex): number => Math.atan2(z.im, z.re);

type QubitState = [Complex, Complex];
type Gate2 = [[Complex, Complex], [Complex, Complex]];
type GateKey = "X" | "Z" | "H" | "S" | "T";
type PresetKey = "ket0" | "ket1" | "ketPlus" | "ketMinus";

const HALF = C(Math.SQRT1_2);

const GATES: Record<GateKey, Gate2> = {
  X: [[C(0), C(1)], [C(1), C(0)]],
  Z: [[C(1), C(0)], [C(0), C(-1)]],
  H: [[HALF, HALF], [HALF, C(-Math.SQRT1_2)]],
  S: [[C(1), C(0)], [C(0), C(0, 1)]],
  T: [[C(1), C(0)], [C(0), C(Math.SQRT1_2, Math.SQRT1_2)]], // e^{iπ/4}
};

const GATE_TITLES: Record<GateKey, string> = {
  X: "bit flip", Z: "phase flip", H: "superpose",
  S: "quarter turn of phase", T: "eighth turn of phase",
};

const GATE_ORDER: readonly GateKey[] = ["X", "Z", "H", "S", "T"];

const PRESETS: Record<PresetKey, { label: string; state: QubitState }> = {
  ket0: { label: "|0⟩", state: [C(1), C(0)] },
  ket1: { label: "|1⟩", state: [C(0), C(1)] },
  ketPlus: { label: "|+⟩", state: [HALF, HALF] },
  ketMinus: { label: "|−⟩", state: [HALF, C(-Math.SQRT1_2)] },
};

function applyGate(s: QubitState, m: Gate2): QubitState {
  return [
    cadd(cmul(m[0][0], s[0]), cmul(m[0][1], s[1])),
    cadd(cmul(m[1][0], s[0]), cmul(m[1][1], s[1])),
  ];
}

function normalizeQubit(s: QubitState): QubitState {
  const norm = Math.sqrt(cabs2(s[0]) + cabs2(s[1]));
  if (norm <= 1e-12) return [C(1), C(0)];
  return [
    { re: s[0].re / norm, im: s[0].im / norm },
    { re: s[1].re / norm, im: s[1].im / norm },
  ];
}

/* ── State Bench ──────────────────────────────────────────────────────── */

type PendingAsk =
  | { kind: "single"; outcome: number; label: string }
  | { kind: "batch"; n0: number; n1: number; label: string }
  | null;

function ProbBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="mono-label w-14 shrink-0 text-[9px] text-muted-foreground">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <span
          className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(clamp01(value) * 100).toFixed(1)}%`, background: accent }} />
      </span>
      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-foreground/80">
        {Math.round(clamp01(value) * 100)}%
      </span>
    </div>
  );
}

function MiniBar({ label, count, accent }: { label: string; count: number; accent: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] tabular-nums text-foreground/80">{count}</span>
      <span className="flex h-10 w-6 items-end overflow-hidden rounded-md bg-foreground/10">
        <span className="w-full rounded-md transition-[height] duration-500 motion-reduce:transition-none"
          style={{ height: `${clamp01(count / 100) * 100}%`, background: accent }} />
      </span>
      <span className="mono-label text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StateBench({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [preset, setPreset] = useState<PresetKey>("ket0");
  const [gates, setGates] = useState<GateKey[]>([]);
  const [state, setState] = useState<QubitState>(PRESETS.ket0.state);
  const [measures, setMeasures] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<number | null>(null);
  const [batch, setBatch] = useState<{ n0: number; n1: number } | null>(null);
  const [pendingAsk, setPendingAsk] = useState<PendingAsk>(null);

  const p0 = clamp01(cabs2(state[0]));
  const p1 = clamp01(cabs2(state[1]));
  const stateLabel = `${gates.slice(-4).join("")}${PRESETS[preset].label}`;

  const clearAsk = () => {
    setLastOutcome(null);
    setBatch(null);
    setPendingAsk(null);
  };

  const choosePreset = (k: PresetKey) => {
    setPreset(k);
    setGates([]);
    setState(PRESETS[k].state);
    clearAsk();
  };

  const applyG = (g: GateKey) => {
    setState((s) => normalizeQubit(applyGate(s, GATES[g])));
    setGates((gs) => [...gs, g].slice(-4));
    clearAsk();
  };

  const measure = () => {
    const outcome = Math.random() < p0 ? 0 : 1;
    setState(outcome === 0 ? [C(1), C(0)] : [C(0), C(1)]);
    setMeasures((m) => m + 1);
    setBatch(null);
    setLastOutcome(outcome);
    setPendingAsk({ kind: "single", outcome, label: stateLabel });
    addXp(1);
  };

  const runBatch = () => {
    let n0 = 0;
    for (let i = 0; i < 100; i += 1) if (Math.random() < p0) n0 += 1;
    setBatch({ n0, n1: 100 - n0 });
    setLastOutcome(null);
    setPendingAsk({ kind: "batch", n0, n1: 100 - n0, label: stateLabel });
    addXp(2);
  };

  const ask = () => {
    if (!pendingAsk) return;
    if (pendingAsk.kind === "single") {
      onAsk(
        t("I prepared the state {state} and measured |{outcome}⟩ — what does this observation reveal beneath the surface?", {
          state: pendingAsk.label,
          outcome: pendingAsk.outcome,
        })
      );
    } else {
      onAsk(
        t("I ran the state {state} one hundred times and observed |0⟩ {n0} times, |1⟩ {n1} times — read the pattern beneath these quanta.", {
          state: pendingAsk.label,
          n0: pendingAsk.n0,
          n1: pendingAsk.n1,
        })
      );
    }
    setPendingAsk(null);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
          <Chip key={k} accent={accent} disabled={disabled} onClick={() => choosePreset(k)}
            active={preset === k && gates.length === 0}>
            {t(PRESETS[k].label)}
          </Chip>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {GATE_ORDER.map((g) => (
          <Chip key={g} accent={accent} disabled={disabled} title={t(GATE_TITLES[g])} onClick={() => applyG(g)}>{g}</Chip>
        ))}
        <span className="mono-label ml-auto self-center text-[9px] text-muted-foreground/70">{stateLabel}</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <ProbBar label={t("P(|0⟩)")} value={p0} accent={accent} />
        <ProbBar label={t("P(|1⟩)")} value={p1} accent={accent} />
      </div>
      <p className="mono-label mt-1.5 text-[9px] text-muted-foreground/70" aria-live="polite">
        {t("arg(a) {a} · arg(b) {b} rad", {
          a: carg(state[0]).toFixed(2),
          b: carg(state[1]).toFixed(2),
        })}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled} onClick={measure}>{t("Measure")}</LabButton>
        <LabButton accent={accent} disabled={disabled} onClick={runBatch}>{t("Run ×100")}</LabButton>
        <span className="mono-label ml-auto text-[9px] text-muted-foreground/70">{t("Measurements")} {measures}</span>
      </div>
      {lastOutcome !== null ? (
        <p className="mono-label mt-2 text-[10px] uppercase tracking-[0.14em]" style={{ color: accent }}
          aria-live="polite">
          {t("Outcome: |{o}⟩", { o: lastOutcome })}
        </p>
      ) : null}
      {batch ? (
        <div className="mt-2 flex items-end gap-4 rounded-xl border p-2" style={{ borderColor: mix(accent, 18) }}>
          <MiniBar label={t("|0⟩")} count={batch.n0} accent={accent} />
          <MiniBar label={t("|1⟩")} count={batch.n1} accent={accent} />
          <span className="mono-label ml-auto self-start text-[9px] text-muted-foreground/70">n = 100</span>
        </div>
      ) : null}
      {pendingAsk ? (
        <div className="mt-2">
          <GhostAsk accent={accent} disabled={disabled} onClick={ask}>{t("Ask the field about this state")}</GhostAsk>
        </div>
      ) : null}
    </div>
  );
}

/* ── Entanglement Bench ───────────────────────────────────────────────── */

const TRIAL_CHOICES = [50, 200, 1000] as const;
type Trials = (typeof TRIAL_CHOICES)[number];

interface EntCounts { n00: number; n01: number; n10: number; n11: number }

function OutcomeCell({ label, count, accent, strong = false }: {
  label: string; count: number | null; accent: string; strong?: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-1 py-1.5 text-center"
      style={{
        borderColor: strong ? mix(accent, 40) : mix(accent, 14),
        background: strong ? mix(accent, 10) : "transparent",
      }}
    >
      <p className="mono-label text-[9px]" style={{ color: strong ? accent : "currentColor" }}>{label}</p>
      <p className="text-[12px] tabular-nums text-foreground/90">{count === null ? "—" : count}</p>
    </div>
  );
}

function EntanglementBench({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [trials, setTrials] = useState<Trials>(200);
  const [counts, setCounts] = useState<EntCounts | null>(null);

  const run = () => {
    let n00 = 0;
    for (let i = 0; i < trials; i += 1) if (Math.random() < 0.5) n00 += 1;
    setCounts({ n00, n01: 0, n10: 0, n11: trials - n00 });
    addXp(2);
  };

  const total = counts ? counts.n00 + counts.n01 + counts.n10 + counts.n11 : 0;
  const corr = counts && total > 0 ? (counts.n00 + counts.n11) / total : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {TRIAL_CHOICES.map((n) => (
          <Chip key={n} accent={accent} active={trials === n} disabled={disabled} onClick={() => setTrials(n)}>{n}</Chip>
        ))}
      </div>
      <div className="mt-2">
        <LabButton accent={accent} disabled={disabled} onClick={run}>{t("Run the pair")}</LabButton>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        <OutcomeCell label="00" count={counts ? counts.n00 : null} accent={accent} strong />
        <OutcomeCell label="01" count={counts ? counts.n01 : null} accent={accent} />
        <OutcomeCell label="10" count={counts ? counts.n10 : null} accent={accent} />
        <OutcomeCell label="11" count={counts ? counts.n11 : null} accent={accent} strong />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="mono-label shrink-0 text-[9px] text-muted-foreground">{t("Correlation")}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <span
            className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${(corr * 100).toFixed(0)}%`, background: accent }} />
        </span>
        <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-foreground/80">
          {Math.round(corr * 100)}%
        </span>
      </div>
      <HonestLine>{t("Each qubit alone reads 50/50 — the correlation is shared, not sent.")}</HonestLine>
      {counts ? (
        <div className="mt-2">
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("We measured an entangled pair many times and every run correlated perfectly, yet each single qubit reads 50/50 — what hides beneath this correlation?")
              )
            }
          >
            {t("Ask the field about this correlation")}
          </GhostAsk>
        </div>
      ) : null}
    </div>
  );
}

function QuantumLab({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  return (
    <>
      <LabCard icon={Atom} accent={accent} title={t("State Bench")} note={t("one qubit, prepared honestly")} className="min-[540px]:col-span-2">
        <StateBench accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      </LabCard>
      <LabCard icon={GitMerge} accent={accent} title={t("Entanglement Bench")} note={t("a Bell pair Φ⁺, counted")}>
        <EntanglementBench accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      </LabCard>
      {/* THE MEASUREMENT BENCH — the deeper instruments: a true
          interferometer, a true Bloch bench, a true random source;
          each with its own plate showing the tool and its domain. */}
      <QuantumInstruments accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
    </>
  );
}

/* ══ HEALX LAB ══════════════════════════════════════════════════════════ */

type BreathKind = "in" | "hold" | "out";
interface BreathPhase { kind: BreathKind; seconds: number }
interface BreathPattern { key: string; label: string; decimals: 0 | 1; phases: readonly BreathPhase[] }

const BREATH_PATTERNS: readonly BreathPattern[] = [
  {
    key: "box", label: "Box 4·4·4·4", decimals: 0,
    phases: [
      { kind: "in", seconds: 4 }, { kind: "hold", seconds: 4 },
      { kind: "out", seconds: 4 }, { kind: "hold", seconds: 4 },
    ],
  },
  {
    key: "calm", label: "Calm 4·7·8", decimals: 0,
    phases: [{ kind: "in", seconds: 4 }, { kind: "hold", seconds: 7 }, { kind: "out", seconds: 8 }],
  },
  {
    key: "coherent", label: "Coherent 5.5·5.5", decimals: 1,
    phases: [{ kind: "in", seconds: 5.5 }, { kind: "out", seconds: 5.5 }],
  },
];

const PHASE_LABELS: Record<BreathKind, string> = {
  in: "Breathe in", hold: "Hold", out: "Breathe out",
};

/* ── Breath Pacer ─────────────────────────────────────────────────────── */

interface BreathRun {
  running: boolean;
  patternIdx: number;
  phaseIdx: number;
  remainingDs: number; // remaining deciseconds of the phase (integer, no drift)
  cycles: number;
  elapsedDs: number;
}

function BreathPacer({ accent, disabled, addXp, onCycle }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onCycle: () => void;
}) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const [breath, setBreath] = useState<BreathRun>(() => ({
    running: false,
    patternIdx: 0,
    phaseIdx: 0,
    remainingDs: Math.round(BREATH_PATTERNS[0].phases[0].seconds * 10),
    cycles: 0,
    elapsedDs: 0,
  }));
  const awardRef = useRef({ cycles: 0, sessions: 0 });

  const pattern = BREATH_PATTERNS[breath.patternIdx];
  const phase = pattern.phases[breath.phaseIdx];

  /* the 100 ms heartbeat of the pacer */
  useEffect(() => {
    if (!breath.running) return;
    const id = window.setInterval(() => {
      setBreath((b) => {
        if (!b.running) return b;
        const phases = BREATH_PATTERNS[b.patternIdx].phases;
        const rem = b.remainingDs - 1;
        if (rem > 0) return { ...b, remainingDs: rem, elapsedDs: b.elapsedDs + 1 };
        const phaseIdx = (b.phaseIdx + 1) % phases.length;
        return {
          ...b,
          phaseIdx,
          remainingDs: Math.round(phases[phaseIdx].seconds * 10),
          cycles: phaseIdx === 0 ? b.cycles + 1 : b.cycles,
          elapsedDs: b.elapsedDs + 1,
        };
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [breath.running]);

  /* award xp per completed cycle; one session event per 4 cycles */
  useEffect(() => {
    const prev = awardRef.current;
    if (breath.cycles > prev.cycles) {
      const sessions = Math.floor(breath.cycles / 4);
      addXp(breath.cycles - prev.cycles, sessions - prev.sessions);
      awardRef.current = { cycles: breath.cycles, sessions };
      onCycle();
    }
  }, [breath.cycles, addXp, onCycle]);

  const choosePattern = (idx: number) => {
    setBreath((b) => ({
      ...b,
      patternIdx: idx,
      phaseIdx: 0,
      remainingDs: Math.round(BREATH_PATTERNS[idx].phases[0].seconds * 10),
    }));
  };

  const resetBreath = () => {
    setBreath((b) => ({
      ...b,
      running: false,
      phaseIdx: 0,
      remainingDs: Math.round(BREATH_PATTERNS[b.patternIdx].phases[0].seconds * 10),
      cycles: 0,
      elapsedDs: 0,
    }));
    awardRef.current = { cycles: 0, sessions: 0 };
  };

  /* circle scale from the phase state machine */
  const phaseTotalDs = Math.round(phase.seconds * 10);
  const frac = phaseTotalDs > 0 ? clamp01(1 - breath.remainingDs / phaseTotalDs) : 0;
  let scale = 1;
  if (phase.kind === "in") {
    scale = 1 + 0.35 * frac;
  } else if (phase.kind === "out") {
    scale = 1.35 - 0.35 * frac;
  } else {
    const prevKind =
      pattern.phases[(breath.phaseIdx + pattern.phases.length - 1) % pattern.phases.length].kind;
    scale = prevKind === "in" ? 1.35 : 1;
  }

  const elapsedSec = Math.floor(breath.elapsedDs / 10);
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3 min-[540px]:flex-row min-[540px]:gap-5">
      <div className="grid h-[112px] w-[112px] shrink-0 place-items-center">
        <div
          className="grid size-20 place-items-center rounded-full transition-transform duration-100 ease-linear motion-reduce:transition-none"
          style={{
            transform: reduced ? undefined : `scale(${scale.toFixed(3)})`,
            border: `1px solid ${mix(accent, 55)}`,
            background: mix(accent, 10),
            boxShadow: reduced ? `0 0 0 7px ${mix(accent, 9)}` : `0 0 24px ${mix(accent, 24)}`,
          }}
        >
          <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t(PHASE_LABELS[phase.kind])}
          </span>
        </div>
      </div>
      <div className="w-full min-w-0 flex-1">
        <div className="flex flex-wrap gap-1.5">
          {BREATH_PATTERNS.map((p, idx) => (
            <Chip key={p.key} accent={accent} disabled={disabled} onClick={() => choosePattern(idx)}
              active={breath.patternIdx === idx}>
              {t(p.label)}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <LabButton accent={accent} disabled={disabled}
            onClick={() => setBreath((b) => ({ ...b, running: !b.running }))}>
            {breath.running ? t("Pause") : t("Start")}
          </LabButton>
          <button type="button" onClick={resetBreath} disabled={disabled} aria-label={t("Reset the pacer")}
            className="focus-glow flex min-h-[32px] items-center gap-1 rounded-xl px-2 text-[10.5px] text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            {t("Reset")}
          </button>
        </div>
        <div className="mono-label mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground/80">
          <span>{t("Cycle")} {breath.cycles}</span>
          <span className="tabular-nums">{mm}:{ss}</span>
          <span className="tabular-nums">{(breath.remainingDs / 10).toFixed(pattern.decimals)}{t("s")}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Body Compass ─────────────────────────────────────────────────────── */

interface BodyRegion { key: string; label: string; tips: readonly [string, string, string] }

const BODY_REGIONS: readonly BodyRegion[] = [
  {
    key: "head", label: "Head & Mind",
    tips: ["Dim the lights and rest the eyes on something far away", "Write the loudest thought down, then close the notebook", "Four slow rounds of the Calm pattern above"],
  },
  {
    key: "breath", label: "Breath & Lungs",
    tips: ["Six slow rounds of the Calm pattern above", "Steam or warm tea, sipped slowly", "Two minutes of tall posture, shoulders wide"],
  },
  {
    key: "heart", label: "Heart & Chest",
    tips: ["A warm hand on the chest, breathing underneath it", "Ten quiet rounds with a longer exhale than inhale", "Name three small kindnesses the day carried"],
  },
  {
    key: "belly", label: "Belly & Gut",
    tips: ["Warm hands, slow circles over the belly", "A short walk after eating, no destination", "Gentle warmth: a compress, a soup, a shawl"],
  },
  {
    key: "back", label: "Back & Spine",
    tips: ["Lie on the floor, knees bent, ten slow breaths", "Roll the shoulders slowly, one way then the other", "Stand tall against a wall, heels soft, jaw loose"],
  },
  {
    key: "arms", label: "Arms & Hands",
    tips: ["Open and close the fists ten times, slowly", "Let warm water run over the wrists", "Let the arms hang heavy and swing gently"],
  },
  {
    key: "legs", label: "Legs & Feet",
    tips: ["Roll the soles over a ball or a bottle", "Elevate the legs for five quiet minutes", "Slow calf raises at the kitchen counter"],
  },
  {
    key: "sleep", label: "Sleep & Rest",
    tips: ["Let the screens dim an hour before lying down", "Keep tomorrow's wake time, even after a short night", "A cool dark room, a heavier blanket, a slower light"],
  },
  {
    key: "whole", label: "Whole Body",
    tips: ["A slow walk with no phone in the hand", "A glass of water before anything else", "Stretch for the length of one song"],
  },
];

function BodyCompass({ accent, disabled, addXp, onAsk, onAskCount }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void;
  onAsk: (question: string) => void; onAskCount: () => void;
}) {
  const t = useT();
  const [regionKey, setRegionKey] = useState<string | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const region = BODY_REGIONS.find((r) => r.key === regionKey) ?? null;
  const alreadyAsked = regionKey !== null && asked.includes(regionKey);

  const bringToField = () => {
    if (!region || alreadyAsked) return;
    onAsk(
      t("My body asks for quiet around my {region} — where should gentleness begin?", {
        region: t(region.label).toLowerCase(),
      })
    );
    setAsked((a) => (a.includes(region.key) ? a : [...a, region.key]));
    addXp(1);
    onAskCount();
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3">
        {BODY_REGIONS.map((r) => (
          <Chip key={r.key} accent={accent} disabled={disabled} onClick={() => setRegionKey(r.key)}
            active={regionKey === r.key}>
            {t(r.label)}
          </Chip>
        ))}
      </div>
      {region ? (
        <div className="mt-2 rounded-xl border p-2.5"
          style={{ borderColor: mix(accent, 22), background: mix(accent, 6) }}>
          <p className="mono-label text-[9px] uppercase tracking-[0.18em]" style={{ color: mix(accent, 85) }}>
            {t(region.label)}
          </p>
          <ul className="mt-1.5 space-y-1">
            {region.tips.map((tip) => (
              <li key={tip} className="flex gap-1.5 text-[11px] leading-snug text-muted-foreground">
                <span className="mt-[5px] size-1 shrink-0 rounded-full" style={{ background: mix(accent, 70) }} aria-hidden="true" />
                <span>{t(tip)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <LabButton accent={accent} disabled={disabled || alreadyAsked} onClick={bringToField}>
              {alreadyAsked ? t("Brought to the field") : t("Bring this to the field")}
            </LabButton>
          </div>
        </div>
      ) : null}
      <HonestLine>{t("Reflections for comfort — never a diagnosis.")}</HonestLine>
    </div>
  );
}

/* ── Care Log ─────────────────────────────────────────────────────────── */

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="mono-label text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">{label}</span>
      <span className="text-[11.5px] tabular-nums text-foreground/90">{value}</span>
    </div>
  );
}

function CareLog({ accent, disabled, addXp, cycles, compassAsks, tier }: {
  accent: string; disabled: boolean; addXp: (n: number, events?: number) => void;
  cycles: number; compassAsks: number; tier: string;
}) {
  const t = useT();
  const [logged, setLogged] = useState(false);
  const fadeRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (fadeRef.current !== null) window.clearTimeout(fadeRef.current);
    },
    []
  );

  const complete = () => {
    addXp(2, 1);
    setLogged(true);
    if (fadeRef.current !== null) window.clearTimeout(fadeRef.current);
    fadeRef.current = window.setTimeout(() => setLogged(false), 2600);
  };

  return (
    <div>
      <div className="space-y-1.5">
        <StatRow label={t("Breath cycles")} value={cycles} />
        <StatRow label={t("Compass asks")} value={compassAsks} />
        <StatRow label={t("Tier")} value={t(tier)} />
      </div>
      <div className="mt-2.5">
        <LabButton accent={accent} disabled={disabled} onClick={complete}>{t("Session complete")}</LabButton>
      </div>
      <p
        className={`mt-1.5 text-[10.5px] italic text-muted-foreground transition-opacity duration-700 motion-reduce:transition-none ${logged ? "opacity-100" : "opacity-0"}`}
        aria-live="polite">
        {t("The log keeps your session.")}
      </p>
      <HonestLine>{t("Kept on this device only.")}</HonestLine>
    </div>
  );
}

function HealxLab({ accent, disabled, addXp, onAsk, tier }: {
  accent: string; disabled: boolean; tier: string;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [cycles, setCycles] = useState(0);
  const [compassAsks, setCompassAsks] = useState(0);
  const handleCycle = useCallback(() => setCycles((c) => c + 1), []);
  const handleCompassAsk = useCallback(() => setCompassAsks((c) => c + 1), []);
  return (
    <>
      <LabCard icon={Wind} accent={accent} title={t("Breath Pacer")}
        note={t("three honest patterns, one slow circle")} className="min-[540px]:col-span-2">
        <BreathPacer accent={accent} disabled={disabled} addXp={addXp} onCycle={handleCycle} />
      </LabCard>
      <LabCard icon={PersonStanding} accent={accent} title={t("Body Compass")}
        note={t("where does quiet want to begin")}>
        <BodyCompass accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} onAskCount={handleCompassAsk} />
      </LabCard>
      <LabCard icon={HeartPulse} accent={accent} title={t("Care Log")} note={t("the session, written down")}>
        <CareLog accent={accent} disabled={disabled} addXp={addXp} cycles={cycles} compassAsks={compassAsks} tier={tier} />
      </LabCard>
      {/* THE CARE INSTRUMENTS — a true binaural oscillator, a true
          day-log correlator, a true body heatmap; the plates above
          them show each tool and its world. */}
      <HealxInstruments accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
    </>
  );
}

/* ══ INTERPLANETARY LAB ═════════════════════════════════════════════════ */

interface StarSystem { name: string; ly: number; cls: string; note: string }

const STAR_CATALOG: readonly StarSystem[] = [
  { name: "Proxima Centauri", ly: 4.25, cls: "M5.5Ve", note: "red dwarf — hosts Proxima b in the habitable zone" },
  { name: "Alpha Centauri A", ly: 4.37, cls: "G2V", note: "sun-like — the nearest true twin of our own star" },
  { name: "Barnard's Star", ly: 5.96, cls: "M4V", note: "high proper motion — the fastest-drifting star in our sky" },
  { name: "Wolf 359", ly: 7.86, cls: "M6V", note: "a faint flare star, restless and small" },
  { name: "Sirius", ly: 8.60, cls: "A1V", note: "the brightest star of the night" },
  { name: "Luyten 726-8", ly: 8.79, cls: "M5.5Ve", note: "a pair of flaring red dwarfs" },
  { name: "Ross 154", ly: 9.70, cls: "M3.5Ve", note: "a quiet red ember that sometimes flares" },
  { name: "Epsilon Eridani", ly: 10.48, cls: "K2V", note: "young, with a debris disk like an early solar system" },
  { name: "TRAPPIST-1", ly: 40.66, cls: "M8V", note: "seven Earth-sized worlds around one cool ember" },
  { name: "TOI-700", ly: 101.4, cls: "M2V", note: "hosts an Earth-sized world in the habitable zone" },
  { name: "Kepler-442", ly: 1206, cls: "K5V", note: "a super-Earth orbiting in quiet steadiness" },
  { name: "Tabby's Star", ly: 1470, cls: "F3V", note: "unusual dimming — a frontier mystery" },
];

/* ── Star Atlas Scanner ───────────────────────────────────────────────── */

function AtlasScanner({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const [sweeping, setSweeping] = useState(false);
  const [sweepY, setSweepY] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [record, setRecord] = useState<StarSystem | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(
    () => () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  const pickIndex = (): number => {
    const seen = seenRef.current;
    if (seen.size >= STAR_CATALOG.length) seen.clear();
    let idx = Math.floor(Math.random() * STAR_CATALOG.length);
    while (seen.has(idx)) idx = Math.floor(Math.random() * STAR_CATALOG.length);
    seen.add(idx);
    return idx;
  };

  const scan = () => {
    clearTimers();
    setRecord(null);
    if (reduced) {
      /* no sweep — the record simply resolves */
      setStatus(t("Record resolved"));
      setRecord(STAR_CATALOG[pickIndex()]);
      addXp(1);
      return;
    }
    setSweeping(true);
    setSweepY(0);
    setStatus(t("Sweeping…"));
    rafRef.current = window.requestAnimationFrame(() => {
      setSweepY(1);
      rafRef.current = null;
    });
    timersRef.current.push(
      window.setTimeout(() => setStatus(t("Locking signal…")), 560),
      window.setTimeout(() => setStatus(t("Record resolved")), 1150),
      window.setTimeout(() => {
        setSweeping(false);
        setRecord(STAR_CATALOG[pickIndex()]);
        addXp(1);
      }, 1600)
    );
  };

  return (
    <div>
      <div className="relative min-h-[110px] overflow-hidden rounded-xl border p-2.5" style={{ borderColor: mix(accent, 18) }}>
        {sweeping ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-px motion-reduce:hidden"
            style={{
              top: `${(sweepY * 100).toFixed(1)}%`,
              background: accent,
              boxShadow: `0 0 14px 3px ${mix(accent, 65)}`,
              opacity: 0.85,
              transition: "top 1600ms linear",
            }}
          />
        ) : null}
        <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70" aria-live="polite">
          {status ?? t("The atlas is quiet — run a scan")}
        </p>
        {record ? (
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-[14px] leading-tight text-foreground">{t(record.name)}</p>
              <span className="mono-label shrink-0 text-[9px] tabular-nums" style={{ color: mix(accent, 85) }}>
                {record.ly} {t("ly")}
              </span>
            </div>
            <p className="mono-label mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
              {t("Class {cls}", { cls: record.cls })}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t(record.note)}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled} onClick={scan}>{record ? t("Re-scan") : t("Scan")}</LabButton>
        {record ? (
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("The atlas resolved {name}, {dist} light-years away — walk me beneath what orbits there.", {
                  name: t(record.name),
                  dist: record.ly,
                })
              )
            }
          >
            {t("Bring this record to the field")}
          </GhostAsk>
        ) : null}
      </div>
    </div>
  );
}

/* ── Signal Decoder ───────────────────────────────────────────────────── */

const SIGNAL_MESSAGES: readonly string[] = [
  "the deep answers in patterns, not words",
  "we counted your reaches — they are already voyages",
  "the noise was never empty; it was patience",
  "distance is a story matter tells slowly",
  "every signal sent is a small home built in the dark",
  "keep listening — the quiet is also a language",
];

const randomTune = (): number => Math.floor(Math.random() * 201) / 2; // multiples of 0.5

function drawSignal(canvas: HTMLCanvasElement, tuned: number, accent: string): void {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 72;
  const pxW = Math.max(1, Math.round(w * dpr));
  const pxH = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* the carrier — a noisy, fixed background hum */
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.32)";
  ctx.beginPath();
  for (let x = 0; x <= w; x += 2) {
    const p = x / w;
    const y =
      h / 2 + Math.sin(p * Math.PI * 2 * 7) * h * 0.16 + Math.sin(p * Math.PI * 2 * 17 + 1.3) * h * 0.06 +
      (Math.random() - 0.5) * 1.6;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  /* the visitor's tuned sine, lit in the scope's accent */
  const cycles = 2 + (tuned / 100) * 16;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = accent;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 1) {
    const p = x / w;
    const y = h / 2 + Math.sin(p * Math.PI * 2 * cycles) * h * 0.3;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function SignalDecoder({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tuned, setTuned] = useState(30);
  const [target, setTarget] = useState(() => 15 + Math.floor(Math.random() * 71));
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * SIGNAL_MESSAGES.length));
  const [decoded, setDecoded] = useState(false);
  /* hydration gate — the hidden target is random, so hold the meter at 0 until mounted */
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const decodedRef = useRef(false);
  const holdRef = useRef(0);
  const lockRef = useRef(0);

  const delta = Math.abs(tuned - target);
  const lock = delta < 6 ? 1 - delta / 6 : 0;

  useEffect(() => {
    lockRef.current = mounted ? lock : 0;
  }, [lock, mounted]);

  /* the hold-to-decode sentry — 100 ms checks, cleaned up on unmount */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (decodedRef.current) return;
      if (lockRef.current >= 0.9) {
        holdRef.current += 100;
        if (holdRef.current >= 1200) {
          decodedRef.current = true;
          setDecoded(true);
          addXp(2);
        }
      } else {
        holdRef.current = 0;
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [addXp]);

  /* live waveform — rAF only while mounted and the tab is visible */
  const tunedRef = useRef(tuned);
  useEffect(() => {
    tunedRef.current = tuned;
  }, [tuned]);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      if (document.visibilityState === "visible") drawSignal(canvas, tunedRef.current, accent);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
    };
  }, [reduced, accent]);

  /* reduced motion — draw once per change instead of a loop */
  useEffect(() => {
    if (!reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSignal(canvas, tuned, accent);
  }, [reduced, tuned, accent]);

  const newSignal = () => {
    decodedRef.current = false;
    holdRef.current = 0;
    setDecoded(false);
    setTarget(15 + Math.floor(Math.random() * 71));
    setMsgIdx(Math.floor(Math.random() * SIGNAL_MESSAGES.length));
    setTuned(randomTune());
  };

  const fmtTuned = tuned % 1 === 0 ? String(tuned) : tuned.toFixed(1);

  return (
    <div>
      <canvas ref={canvasRef} className="h-[72px] w-full rounded-xl border" aria-hidden="true"
        style={{ borderColor: mix(accent, 18), background: "rgba(0,0,0,0.35)" }} />
      <input type="range" min={0} max={100} step={0.5} value={tuned} disabled={disabled}
        onChange={(e) => setTuned(Number(e.target.value))} aria-label={t("Tune the signal frequency")}
        className="focus-glow mt-2 h-8 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        style={{ accentColor: accent }} />
      <div className="mt-1 flex items-center gap-2">
        <span className="mono-label shrink-0 text-[9px] text-muted-foreground">{t("Lock")}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <span
            className="block h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${((mounted ? clamp01(lock) : 0) * 100).toFixed(0)}%`, background: accent }} />
        </span>
        <span className="mono-label shrink-0 text-[9px] tabular-nums text-muted-foreground/80">
          {t("freq {f}", { f: fmtTuned })}
        </span>
      </div>
      <div className="mt-2 min-h-[34px] rounded-xl border p-2" style={{ borderColor: mix(accent, 18) }}>
        {decoded ? (
          <p className="font-serif text-[12.5px] leading-relaxed" style={{ color: mix(accent, 90) }} aria-live="polite">
            …{t(SIGNAL_MESSAGES[msgIdx])}…
          </p>
        ) : (
          <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {t("Find the hidden frequency and hold the lock")}
          </p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <LabButton accent={accent} disabled={disabled} onClick={newSignal}>{t("New signal")}</LabButton>
        {decoded ? (
          <GhostAsk
            accent={accent} disabled={disabled}
            onClick={() =>
              onAsk(
                t("A signal from the deep just resolved into words: \"…{msg}...\" — what reached us beneath the noise?", {
                  msg: t(SIGNAL_MESSAGES[msgIdx]),
                })
              )
            }
          >
            {t("Bring the signal to the field")}
          </GhostAsk>
        ) : null}
      </div>
    </div>
  );
}

/* ── Transit Computer ─────────────────────────────────────────────────── */

interface TransitDrive { key: string; name: string; chip: string; v: number; speculative: boolean }

const TRANSIT_DRIVES: readonly TransitDrive[] = [
  { key: "ion", name: "Ion Sail", chip: "Ion Sail — 0.05% c", v: 0.0005, speculative: false },
  { key: "fusion", name: "Fusion Torch", chip: "Fusion Torch — 8% c", v: 0.08, speculative: false },
  { key: "photon", name: "Photon Rider", chip: "Photon Rider — 20% c", v: 0.2, speculative: false },
  { key: "frontier", name: "Frontier Skimmer", chip: "Frontier Skimmer — speculative", v: 2, speculative: true },
];

function TransitComputer({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const [destIdx, setDestIdx] = useState(8);
  const [driveIdx, setDriveIdx] = useState(0);
  const [result, setResult] = useState<{ years: number; driveIdx: number; destIdx: number } | null>(null);
  const [fill, setFill] = useState(0);
  const fillRafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (fillRafRef.current !== null) window.cancelAnimationFrame(fillRafRef.current);
    },
    []
  );

  const compute = () => {
    const drive = TRANSIT_DRIVES[driveIdx];
    const sys = STAR_CATALOG[destIdx];
    if (fillRafRef.current !== null) {
      window.cancelAnimationFrame(fillRafRef.current);
      fillRafRef.current = null;
    }
    if (reduced) {
      setFill(1);
    } else {
      setFill(0);
      fillRafRef.current = window.requestAnimationFrame(() => {
        setFill(1);
        fillRafRef.current = null;
      });
    }
    setResult({ years: sys.ly / drive.v, driveIdx, destIdx });
    addXp(1);
  };

  const shownDrive = result ? TRANSIT_DRIVES[result.driveIdx] : null;
  const shownDest = result ? STAR_CATALOG[result.destIdx] : null;

  return (
    <div>
      <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {t("Origin — {origin}", { origin: t("Earth Orbit") })}
      </p>
      <select value={destIdx} disabled={disabled} onChange={(e) => setDestIdx(Number(e.target.value))}
        aria-label={t("Destination star")}
        className="focus-glow mt-1.5 h-8 w-full rounded-lg border bg-background px-2 text-[11.5px] text-foreground transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: mix(accent, 24) }}>
        {STAR_CATALOG.map((s, i) => (
          <option key={s.name} value={i}>{t(s.name)} — {s.ly} {t("ly")}</option>
        ))}
      </select>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {TRANSIT_DRIVES.map((d, i) => (
          <Chip key={d.key} accent={accent} active={driveIdx === i} disabled={disabled} onClick={() => setDriveIdx(i)}>
            {t(d.chip)}
          </Chip>
        ))}
      </div>
      {TRANSIT_DRIVES[driveIdx].speculative ? (
        <p className="mono-label mt-1.5 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {t("frontier — not yet physics")}
        </p>
      ) : null}
      <div className="mt-2.5">
        <LabButton accent={accent} disabled={disabled} onClick={compute}>{t("Compute the crossing")}</LabButton>
      </div>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <span
          className="block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${Math.round(fill * 100)}%`, background: accent }} />
      </span>
      <div className="mt-2 min-h-[24px]" aria-live="polite">
        {result && shownDrive && shownDest ? (
          shownDrive.speculative ? (
            <p className="mono-label text-[9px] uppercase tracking-[0.18em]" style={{ color: mix(accent, 80) }}>
              {t("frontier math — a horizon, not a timetable")}
            </p>
          ) : (
            <p className="font-serif text-[15px] text-foreground">
              ≈ {Math.round(result.years).toLocaleString("en-US")} {t("years")}
            </p>
          )
        ) : null}
      </div>
      {result && shownDrive && shownDest ? (
        <GhostAsk
          accent={accent} disabled={disabled}
          onClick={() =>
            onAsk(
              t("We plotted a crossing from Earth Orbit to {name}, {dist} light-years, aboard the {drive} — what should such a voyage truly cost and carry?", {
                name: t(shownDest.name),
                dist: shownDest.ly,
                drive: t(shownDrive.name),
              })
            )
          }
        >
          {t("Bring this crossing to the field")}
        </GhostAsk>
      ) : null}
    </div>
  );
}

function InterplanetaryLab({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  return (
    <>
      <LabCard icon={Radar} accent={accent} title={t("Star Atlas Scanner")}
        note={t("twelve real neighbours, honestly catalogued")} className="min-[540px]:col-span-2">
        <AtlasScanner accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      </LabCard>
      <LabCard icon={AudioWaveform} accent={accent} title={t("Signal Decoder")}
        note={t("tune, lock, and listen")} className="min-[540px]:col-span-2">
        <SignalDecoder accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      </LabCard>
      <LabCard icon={Rocket} accent={accent} title={t("Transit Computer")}
        note={t("real distances, real years")} className="min-[540px]:col-span-2">
        <TransitComputer accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      </LabCard>
      {/* THE MISSION INSTRUMENTS — the rocket equation, the light-time
          gauge, the transfer windows: the navigator's own bench, each
          plate showing its tool and its sky. */}
      <InterplanetaryInstruments accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
    </>
  );
}

/* ══ THE FLORAX GREENHOUSE ═════════════════════════════════════════════
   The botanical world's own benches: the Mixing Bench — a compendium of
   living ingredients, each carrying its honest class of actives, mixed
   into deterministic formulation sketches with synergy and caution
   lines — and the Discovery Wheel, which turns a therapeutic aim into a
   trio and a discovery path. Every result ends at the honest border:
   exploratory alchemy, never a prescription. */

interface FloraxIngredient {
  id: string;
  name: string;
  part: string;
  active: string;
  cls: "flavonoid" | "terpene" | "polyphenol" | "polysaccharide" | "organosulfur" | "tannin" | "alkaloid" | "anthocyanin" | "glycoside";
  prep: string;
  caution: string | null;
  thinning: boolean;
  aims: string[];
}

const FLORAX_SHELF: FloraxIngredient[] = [
  { id: "willow", name: "Willow bark", part: "bark", active: "salicin", cls: "glycoside", prep: "cold maceration or gentle decoction, 12 parts water to 1 bark", caution: "carries the thinning gift — never with blood-thinners", thinning: true, aims: ["resilience"] },
  { id: "chamomile", name: "Chamomile flower", part: "flower", active: "apigenin", cls: "flavonoid", prep: "infusion, 5 minutes covered, water just off the boil", caution: "kin to ragweed — allergy watched", thinning: false, aims: ["calm", "sleep", "skin"] },
  { id: "ginger", name: "Ginger root", part: "rhizome", active: "gingerol", cls: "terpene", prep: "fresh infusion, 10 minutes, covered", caution: "carries the thinning gift in larger bowls", thinning: true, aims: ["digestion", "resilience"] },
  { id: "turmeric", name: "Turmeric rhizome", part: "rhizome", active: "curcumin", cls: "polyphenol", prep: "simmered in oil or milk with a pinch of black pepper", caution: "piperine or fat carries it — gallbladder watched", thinning: false, aims: ["resilience", "skin", "digestion"] },
  { id: "peppermint", name: "Peppermint leaf", part: "leaf", active: "menthol", cls: "terpene", prep: "infusion, 4 minutes, never boiling the leaf", caution: "can lift reflux in some bodies", thinning: false, aims: ["focus", "digestion"] },
  { id: "greentea", name: "Green tea leaf", part: "leaf", active: "EGCG catechin", cls: "polyphenol", prep: "infusion, 2 minutes, water below the boil", caution: "holds iron at arm's length — drink between meals", thinning: false, aims: ["focus", "resilience"] },
  { id: "lavender", name: "Lavender flower", part: "flower", active: "linalool", cls: "terpene", prep: "infusion, 3 minutes; the oil only outside the body", caution: "the oil sensitizes skin undiluted", thinning: false, aims: ["calm", "sleep"] },
  { id: "garlic", name: "Garlic bulb", part: "bulb", active: "allicin", cls: "organosulfur", prep: "crushed and rested 10 minutes, then raw or barely warmed", caution: "carries the thinning gift — never with blood-thinners", thinning: true, aims: ["resilience", "digestion"] },
  { id: "elderberry", name: "Elderberry fruit", part: "fruit", active: "anthocyanins", cls: "anthocyanin", prep: "simmered into syrup, 20 minutes, never raw parts", caution: "raw stems and leaves are not food", thinning: false, aims: ["resilience"] },
  { id: "reishi", name: "Reishi mushroom", part: "fruiting body", active: "beta-glucans", cls: "polysaccharide", prep: "long decoction, 40 minutes or more", caution: "overlaps the thinning gift — anticoagulant care", thinning: true, aims: ["sleep", "resilience"] },
  { id: "calendula", name: "Calendula petal", part: "petal", active: "triterpenes", cls: "terpene", prep: "oil infusion, 2 weeks in the sun; then salve", caution: "kin to the aster family — allergy watched", thinning: false, aims: ["skin"] },
  { id: "rosemary", name: "Rosemary leaf", part: "leaf", active: "rosmarinic acid", cls: "polyphenol", prep: "infusion, 5 minutes, or oil infusion for the bench", caution: "the essential oil is never drunk", thinning: false, aims: ["focus", "skin", "resilience"] },
];

const FLORAX_NAMES: readonly string[][] = [
  ["The Quiet Ember", "The Amber Veil", "The Verdant Hour"],
  ["The Green Lantern", "The Sleeping Grove", "The Copper Root"],
  ["The Velvet Moss", "The Morning Resin", "The Humming Leaf"],
];

function floraxHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** the pairing law — deterministic synergy and caution lines */
function floraxPairLine(a: FloraxIngredient, b: FloraxIngredient): { line: string; caution: boolean } {
  if (a.thinning && b.thinning) {
    return { line: "caution — both carry the thinning gift; the bowl must not pour twice", caution: true };
  }
  const key = [a.cls, b.cls].sort().join("+");
  if (key === "flavonoid+terpene") return { line: "volatile synergy — the terpene opens the gate the flavonoid walks through", caution: false };
  if (key === "polyphenol+polysaccharide") return { line: "the slow scaffold — the polysaccharide carries what the polyphenol does", caution: false };
  if (key === "polysaccharide+tannin") return { line: "the tannin binds; the mucilage softens its grip", caution: false };
  if (key === "flavonoid+organosulfur") return { line: "the sulfur sharpens; the flavonoid steadies", caution: false };
  if (key === "polyphenol+terpene") return { line: "warming synergy — heat and patience trade places", caution: false };
  if (key === "flavonoid+polyphenol") return { line: "the antioxidant braid — two reds woven into one thread", caution: false };
  if (key === "terpene+terpene") return { line: "the volatiles answer each other — keep both bowls light", caution: false };
  if (key === "anthocyanin+flavonoid") return { line: "the deep color deepens — a harvest of pigments", caution: false };
  if (key === "glycoside+terpene") return { line: "the glycoside leads, the volatile follows — weigh both", caution: true };
  return { line: "a quiet companionship — neither leads, neither resists", caution: false };
}

function FloraxMixingBench({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<null | {
    name: string; ratio: string; prep: string; lines: { line: string; caution: boolean }[];
    cautions: string[]; border: string; ask: string;
  }>(null);

  const toggle = (id: string) => {
    setResult(null);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  };

  const compose = () => {
    const items = picked.map((id) => FLORAX_SHELF.find((x) => x.id === id)).filter(Boolean) as FloraxIngredient[];
    if (items.length < 2) return;
    const h = floraxHash(items.map((x) => x.id).join("+"));
    const lines: { line: string; caution: boolean }[] = [];
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) lines.push(floraxPairLine(items[i], items[j]));
    }
    const cautions = items.map((x) => x.caution).filter(Boolean) as string[];
    const ratio = items.length === 2 ? "2 : 1 parts" : "2 : 1 : 1 parts";
    const ask = `Walk the Florax path with me: I am sketching a formulation of ${items
      .map((x) => `${x.name} (${x.active})`)
      .join(", ")}, at ${ratio}, by ${items[0].prep}. What does each ingredient truly carry, how could they meet, and what new biologic treatment does the combination reach toward — with the honest border named?`;
    setResult({
      name: FLORAX_NAMES[h % 3][Math.floor(h / 3) % 3],
      ratio,
      prep: items[0].prep,
      lines,
      cautions,
      border: "an exploratory formulation sketch — not a remedy to take; the last step belongs to trained human hands",
      ask,
    });
    addXp(2, 1);
  };

  return (
    <LabCard icon={Blend} accent={accent} title={t("The Mixing Bench")}
      note={t("pick two or three — read what each carries, then compose")}>
      <div className="flex flex-wrap gap-1.5">
        {FLORAX_SHELF.map((ing) => (
          <Chip key={ing.id} accent={accent} active={picked.includes(ing.id)}
            disabled={disabled} title={`${ing.active} · ${ing.caution ?? "no known caution"}`}
            onClick={() => toggle(ing.id)}>
            {ing.name}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <LabButton accent={accent} disabled={disabled || picked.length < 2} onClick={compose}>
          {t("Compose")}
        </LabButton>
        {picked.length > 0 ? (
          <LabButton accent={accent} disabled={disabled} onClick={() => { setPicked([]); setResult(null); }}>
            <RotateCcw className="mr-1 inline size-3" aria-hidden="true" />
            {t("Clear")}
          </LabButton>
        ) : null}
      </div>
      {result ? (
        <div className="mt-2 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 26), background: mix(accent, 8) }}>
          <p className="font-serif text-[13px] text-foreground">{t(result.name)}</p>
          <p className="mono-label mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
            {t("parts")} {result.ratio} · {t("by")} {result.prep}
          </p>
          <ul className="mt-1.5 space-y-1">
            {result.lines.map((l, i) => (
              <li key={i} className="text-[10.5px] leading-snug"
                style={{ color: l.caution ? mix(accent, 90) : "var(--muted-foreground)" }}>
                {l.caution ? "△ " : "· "}
                {t(l.line)}
              </li>
            ))}
          </ul>
          {result.cautions.length > 0 ? (
            <p className="mt-1.5 text-[10px] leading-snug" style={{ color: mix(accent, 85) }}>
              △ {result.cautions.map((c) => t(c)).join(" · ")}
            </p>
          ) : null}
          <HonestLine>{t(result.border)}</HonestLine>
          <div className="mt-1.5">
            <GhostAsk accent={accent} disabled={disabled} onClick={() => onAsk(result.ask)}>
              {t("Ask the Mirror to decode this formulation")}
            </GhostAsk>
          </div>
        </div>
      ) : null}
    </LabCard>
  );
}

const FLORAX_AIMS: { id: string; label: string; trio: [string, string, string]; note: string }[] = [
  { id: "calm", label: "Calm", trio: ["chamomile", "lavender", "rosemary"], note: "the flavonoid quiets, the linalool slows the breath, the rosemary keeps the mind's lamp lit but low" },
  { id: "sleep", label: "Sleep", trio: ["lavender", "chamomile", "reishi"], note: "the volatiles descend, the apigenin settles, the beta-glucans hold the long night's hand" },
  { id: "focus", label: "Focus", trio: ["greentea", "peppermint", "rosemary"], note: "the catechin steadies attention, the menthol clears the airway, the rosmarinic acid guards the working mind" },
  { id: "resilience", label: "Resilience", trio: ["elderberry", "ginger", "turmeric"], note: "the anthocyanins shield, the gingerol warms the threshold, the curcumin keeps the embers even" },
  { id: "digestion", label: "Digestion", trio: ["ginger", "peppermint", "garlic"], note: "the gingerol stirs the fire, the menthol loosens the gates, the allicin clears the old growth" },
  { id: "skin", label: "Skin", trio: ["calendula", "chamomile", "turmeric"], note: "the triterpenes mend the surface, the apigenin quiets the red, the curcumin holds the long repair" },
];

function FloraxDiscoveryWheel({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  const [aim, setAim] = useState<string | null>(null);
  const found = FLORAX_AIMS.find((a) => a.id === aim) ?? null;
  const trio = found
    ? found.trio.map((id) => FLORAX_SHELF.find((x) => x.id === id)).filter(Boolean) as FloraxIngredient[]
    : [];
  const ask = found
    ? `Walk the Florax discovery path for ${found.label.toLowerCase()}: the trio is ${trio
        .map((x) => `${x.name} (${x.active})`)
        .join(", ")}. Teach the preparation, the mechanism of each pairing, and what new biologic treatment the path reaches toward — with the honest border named.`
    : "";

  return (
    <LabCard icon={Sprout} accent={accent} title={t("The Discovery Wheel")}
      note={t("choose an aim — receive a trio and a discovery path")}>
      <div className="flex flex-wrap gap-1.5">
        {FLORAX_AIMS.map((a) => (
          <Chip key={a.id} accent={accent} active={aim === a.id} disabled={disabled}
            onClick={() => { setAim(a.id); if (aim !== a.id) addXp(1); }}>
            {t(a.label)}
          </Chip>
        ))}
      </div>
      {found ? (
        <div className="mt-2 rounded-xl border p-2.5" style={{ borderColor: mix(accent, 26), background: mix(accent, 8) }}>
          <p className="font-serif text-[13px] text-foreground">
            {trio.map((x) => t(x.name)).join(" + ")}
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{t(found.note)}</p>
          <p className="mt-1 text-[10px] leading-snug" style={{ color: mix(accent, 85) }}>
            △ {trio.map((x) => x.caution).filter(Boolean).map((c) => t(c as string)).join(" · ") ||
              t("no known cautions among the three")}
          </p>
          <HonestLine>{t("a discovery path, not a prescription — verify with trained hands")}</HonestLine>
          <div className="mt-1.5">
            <GhostAsk accent={accent} disabled={disabled} onClick={() => onAsk(ask)}>
              {t("Walk this path with Florax")}
            </GhostAsk>
          </div>
        </div>
      ) : null}
    </LabCard>
  );
}

function FloraxLab({ accent, disabled, addXp, onAsk }: {
  accent: string; disabled: boolean;
  addXp: (n: number, events?: number) => void; onAsk: (question: string) => void;
}) {
  const t = useT();
  return (
    <>
      <LabCard icon={Leaf} accent={accent} title={t("The Living Compendium")}
        note={t("every ingredient carries its honest class of actives")} className="min-[540px]:col-span-2">
        <p className="text-[10.5px] leading-relaxed text-muted-foreground">
          {t("Alkaloids, flavonoids, terpenes, tannins, glycosides, polysaccharides — read the leaf before you mix it. Every chip above names its active and its caution; the garden is generous, the border is honest.")}
        </p>
      </LabCard>
      <FloraxMixingBench accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
      <FloraxDiscoveryWheel accent={accent} disabled={disabled} addXp={addXp} onAsk={onAsk} />
    </>
  );
}

/* ══ THE DECK ═══════════════════════════════════════════════════════════ */

const VALID_SCOPES: readonly LabScope[] = ["interplanetary", "quantum", "healing", "florax"];

export function ScopeLabDeck(props: {
  scope: LabScope;
  /** the scope's own accent color (hex string, e.g. "#22d3ee") */
  accent: string;
  /** sends a prepared question into the chat conversation */
  onAsk: (question: string) => void;
  disabled?: boolean;
}): JSX.Element | null {
  const { accent, onAsk, disabled = false } = props;
  /* defensive: whatever arrives, only a true scope opens a lab */
  const scope = VALID_SCOPES.includes(props.scope as LabScope) ? (props.scope as LabScope) : null;

  const t = useT();
  const progress = useLabProgress(scope ?? "quantum");

  if (!scope) return null;

  const labProps = { accent, disabled, addXp: progress.addXp, onAsk } as const;

  return (
    <section
      data-testid="scope-lab-deck"
      aria-label={t(LAB_TITLES[scope])}
      className="pointer-events-auto w-full max-w-[560px] rounded-3xl border p-3 sm:p-4"
      style={{
        borderColor: mix(accent, 26),
        background: `color-mix(in srgb, ${accent} 4%, var(--background))`,
      }}
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="size-2 shrink-0 rounded-full"
          style={{ background: accent, boxShadow: `0 0 10px 2px ${mix(accent, 55)}` }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[15px] leading-tight text-foreground">{t(LAB_TITLES[scope])}</h2>
          <p className="mono-label truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
            {t(LAB_SUBTITLES[scope])}
          </p>
        </div>
        <ProgressChip accent={accent} tier={progress.tier} tierIndex={progress.tierIndex}
          progress={progress.progress} xp={progress.xp} />
      </header>
      <div className="mt-3 grid gap-2 min-[540px]:grid-cols-2">
        {scope === "quantum" ? <QuantumLab {...labProps} /> : null}
        {scope === "healing" ? (
          <HealxLab accent={accent} disabled={disabled} addXp={progress.addXp} onAsk={onAsk} tier={progress.tier} />
        ) : null}
        {scope === "interplanetary" ? <InterplanetaryLab {...labProps} /> : null}
        {scope === "florax" ? <FloraxLab {...labProps} /> : null}
      </div>
    </section>
  );
}
