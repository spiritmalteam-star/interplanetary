"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleSlash,
  FlaskConical,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MirrorBridge } from "./living/MirrorBridge";

/* ------------------------------------------------------------------ */
/*  THE QUANTUM LABORATORY — a genuine local scientific bench: the     */
/*  visitor builds a circuit of real quantum gates and the device      */
/*  itself computes the statevector in pure arithmetic — no laboratory */
/*  server, no credits, no pretend hardware. Simulation is honestly    */
/*  labeled as simulation (nothing here claims a quantum processor's   */
/*  answer); the laws it runs are the true unitary laws of the gates.  */
/*                                                                     */
/*  THE BENCH (compact for the living frame):                          */
/*  - a palette of gates (H, X, Z, S, T, CNOT, an eraser), each with   */
/*    its own honest one-line explanation                              */
/*  - up to 8 steps × 2–3 qubit wires; a chosen gate is placed by      */
/*    touching a wire's step                                           */
/*  - the live probability of every basis state, as quiet bars         */
/*  - 200-shot sampling, and a single honest measurement that          */
/*    collapses the state                                              */
/*  - the experiment saves to the Quantum shelf of the visitor's       */
/*    library, and the Mirror Bridge advises on the circuit at hand    */
/* ------------------------------------------------------------------ */

/* ------------------------- the pure engine ------------------------- */

type Cx = { re: number; im: number };

type SingleKind = "h" | "x" | "z" | "s" | "t";
type Op = { kind: SingleKind } | { cnot: { c: number; t: number } };
type Step = { q: (Op | null)[]; cnot?: { c: number; t: number } | null };

const MAX_STEPS = 8;

const SINGLE_LABEL: Record<SingleKind, string> = {
  h: "H",
  x: "X",
  z: "Z",
  s: "S",
  t: "T",
};

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function groundState(n: number): Cx[] {
  const v: Cx[] = Array.from({ length: 1 << n }, () => ({ re: 0, im: 0 }));
  v[0] = { re: 1, im: 0 };
  return v;
}

function applySingle(v: Cx[], n: number, q: number, u: Cx[][]): Cx[] {
  const out = v.map((c) => ({ ...c }));
  const bit = 1 << q;
  for (let i = 0; i < 1 << n; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const a = v[i];
    const b = v[j];
    out[i] = {
      re: u[0][0].re * a.re - u[0][0].im * a.im + u[0][1].re * b.re - u[0][1].im * b.im,
      im: u[0][0].re * a.im + u[0][0].im * a.re + u[0][1].re * b.im + u[0][1].im * b.re,
    };
    out[j] = {
      re: u[1][0].re * a.re - u[1][0].im * a.im + u[1][1].re * b.re - u[1][1].im * b.im,
      im: u[1][0].re * a.im + u[1][0].im * a.re + u[1][1].re * b.im + u[1][1].im * b.re,
    };
  }
  return out;
}

const R2 = Math.SQRT1_2;
const U_H: Cx[][] = [
  [{ re: R2, im: 0 }, { re: R2, im: 0 }],
  [{ re: R2, im: 0 }, { re: -R2, im: 0 }],
];
const U_X: Cx[][] = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
];
const U_Z: Cx[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: -1, im: 0 }],
];
const U_S: Cx[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 1 }],
];
const U_T: Cx[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: R2, im: R2 }],
];

function applyCnot(v: Cx[], n: number, c: number, t: number): Cx[] {
  const out = v.map((a) => ({ ...a }));
  const cb = 1 << c;
  const tb = 1 << t;
  for (let i = 0; i < 1 << n; i++) {
    if ((i & cb) === 0 || (i & tb) !== 0) continue;
    const j = i | tb;
    out[i] = { ...v[j] };
    out[j] = { ...v[i] };
  }
  return out;
}

function runCircuit(steps: Step[], n: number): Cx[] {
  let v = groundState(n);
  for (const step of steps) {
    if (step.cnot) {
      v = applyCnot(v, n, step.cnot.c, step.cnot.t);
      continue;
    }
    for (let q = 0; q < n; q++) {
      const op = step.q[q];
      if (!op || "cnot" in op) continue;
      const u =
        op.kind === "h" ? U_H : op.kind === "x" ? U_X : op.kind === "z" ? U_Z : op.kind === "s" ? U_S : U_T;
      v = applySingle(v, n, q, u);
    }
  }
  return v;
}

function probabilities(v: Cx[]): number[] {
  return v.map((a) => a.re * a.re + a.im * a.im);
}

function sampleShots(probs: number[], shots: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const counts = new Array(probs.length).fill(0) as number[];
  for (let s = 0; s < shots; s++) {
    let r = rand();
    let idx = 0;
    for (let i = 0; i < probs.length; i++) {
      r -= probs[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    counts[idx] += 1;
  }
  return counts;
}

function bits(n: number, idx: number): string {
  return idx
    .toString(2)
    .padStart(n, "0")
    .split("")
    .reverse()
    .join("");
}

/* --------------------------- the bench --------------------------- */

const EMPTY_STEPS: Step[] = Array.from({ length: MAX_STEPS }, () => ({
  q: [null, null, null],
  cnot: null,
}));

const QLAB_KEY = "mirror:qlab-circuit";

type StoredCircuit = { n: number; steps: Step[] };

function readCircuit(): StoredCircuit {
  try {
    const raw = window.localStorage.getItem(QLAB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredCircuit;
      if (
        (parsed.n === 2 || parsed.n === 3) &&
        Array.isArray(parsed.steps) &&
        parsed.steps.length === MAX_STEPS
      ) {
        return parsed;
      }
    }
  } catch {
    /* a cold bench wakes grounded */
  }
  return { n: 2, steps: EMPTY_STEPS.map((s) => ({ q: [...s.q], cnot: null })) };
}

type GateChoice = SingleKind | "cnot" | "erase";

export function QuantumLabView() {
  const t = useT();
  const view = useMirror((s) => s.view);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const language = useMirror((s) => s.language);

  /* THE RESTORED BENCH — the circuit survives page turns in the
     house's own store of small states (localStorage): returning to
     this page restores the visitor's wires exactly as they stood. */
  const [nQubits, setNQubits] = useState(2);
  const [steps, setSteps] = useState<Step[]>(() => EMPTY_STEPS.map((s) => ({ q: [...s.q], cnot: null })));
  const [gate, setGate] = useState<GateChoice>("h");
  const [shots, setShots] = useState<number[] | null>(null);
  const [collapsed, setCollapsed] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readCircuit();
    setNQubits(stored.n);
    setSteps(stored.steps);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(QLAB_KEY, JSON.stringify({ n: nQubits, steps } satisfies StoredCircuit));
    } catch {
      /* a full shelf never breaks the bench */
    }
  }, [hydrated, nQubits, steps]);

  const statevector = useMemo(() => runCircuit(steps, nQubits), [steps, nQubits]);
  /* THE HONEST COLLAPSE — after a measurement the displayed state is
     truly the fallen one (a delta on the measured basis state), and
     every later shot samples the collapsed world until the bench is
     touched again. */
  const [collapseIdx, setCollapseIdx] = useState<number | null>(null);
  const probs = useMemo(
    () =>
      collapseIdx !== null
        ? statevector.map((_, i) => (i === collapseIdx ? 1 : 0))
        : probabilities(statevector),
    [collapseIdx, statevector]
  );

  const placeGate = useCallback(
    (q: number, s: number) => {
      setShots(null);
      setCollapsed(null);
      setCollapseIdx(null);
      setSteps((prev) => {
        const next = prev.map((st) => ({ q: [...st.q], cnot: st.cnot ?? null }));
        const step = next[s];
        if (gate === "erase") {
          step.q[q] = null;
          if (step.cnot && (step.cnot.c === q || step.cnot.t === q)) step.cnot = null;
          return next;
        }
        if (gate === "cnot") {
          if (step.cnot && step.cnot.c === q) step.cnot = null;
          else if (!step.q.some(Boolean)) step.cnot = { c: q, t: (q + 1) % nQubits };
          return next;
        }
        if (step.cnot) return next;
        const cur = step.q[q];
        if (cur && "kind" in cur && cur.kind === gate) step.q[q] = null;
        else step.q[q] = { kind: gate };
        return next;
      });
    },
    [gate, nQubits]
  );

  const reset = useCallback(() => {
    setSteps(EMPTY_STEPS.map((s) => ({ q: [...s.q], cnot: null })));
    setShots(null);
    setCollapsed(null);
    setCollapseIdx(null);
  }, []);

  const runShots = useCallback(() => {
    setShots(sampleShots(probs, 200, (Math.random() * 2 ** 31) | 0));
    setCollapsed(null);
  }, [probs]);

  const measureOnce = useCallback(() => {
    const r = Math.random();
    let acc = 0;
    let idx = probs.length - 1;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) {
        idx = i;
        break;
      }
    }
    setCollapseIdx(idx);
    setCollapsed(bits(nQubits, idx));
    setShots(null);
  }, [nQubits, probs]);

  const save = useCallback(async () => {
    const described = describeCircuit(steps, nQubits);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector: "quantum",
          title: t("Quantum experiment") + ` — ${nQubits}q`,
          excerpt: described,
          content: {
            kind: "quantum-circuit",
            qubits: nQubits,
            gates: described,
            statevector: probs.map((p) => Number(p.toFixed(4))),
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast(t("The experiment rests on the Quantum shelf."));
    } catch {
      toast(t("The shelf refused the experiment — try again in a moment."));
    }
  }, [nQubits, probs, steps, t]);

  /* THE MIRROR BRIDGE — the work at hand: the circuit, plainly told */
  const buildContext = useCallback(() => {
    const described = describeCircuit(steps, nQubits);
    const top = probs
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 4)
      .map((e) => `|${bits(nQubits, e.i)}⟩ ${(e.p * 100).toFixed(1)}%`)
      .join(", ");
    return `${t("Qubits")}: ${nQubits}\n${t("Circuit")}: ${described || t("empty — all resting")}\n${t("Standings")}: ${top}`;
  }, [nQubits, probs, steps, t]);

  const expanded = view === "qlab";
  const gateCount = steps.reduce(
    (acc, st) => acc + (st.cnot ? 1 : st.q.filter(Boolean).length),
    0
  );

  return (
    <div
      data-testid="qlab-view"
      className="absolute inset-0 flex flex-col overflow-y-auto nice-scroll"
    >
      {/* THE BENCH'S OWN HEAD — the back hand when the bench owns the
          whole frame, the honest word, and the resting hands */}
      <div className="flex h-9 shrink-0 items-center gap-1.5 px-2">
        {expanded ? (
          <button
            type="button"
            onClick={returnToObservatory}
            aria-label={t("Back to the chat")}
            title={t("Back to the chat")}
            data-testid="qlab-back"
            className="focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <span
          className="flex items-center gap-1.5 text-[12.5px] font-medium"
          style={{ color: "var(--scope-a,var(--gd))" }}
        >
          <FlaskConical className="size-3.5" aria-hidden="true" />
          {t("Quantum Lab")}
        </span>
        <span className="mono-label ml-1 hidden text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 sm:inline">
          {t("local simulation · true gate laws")}
        </span>
        <span className="flex-1" aria-hidden="true" />
        <button
          type="button"
          onClick={reset}
          aria-label={t("Reset the bench")}
          title={t("Reset the bench")}
          data-testid="qlab-reset"
          className="focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={gateCount === 0}
          aria-label={t("Save to the Quantum shelf")}
          title={t("Save to the Quantum shelf")}
          data-testid="qlab-save"
          className="focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground disabled:opacity-35"
        >
          <Save className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* THE WIRES — the circuit itself: qubit rows, step columns */}
      <div className="min-w-0 flex-1 px-3 pb-2">
        <div className="nice-scroll overflow-x-auto">
          <div className="min-w-[430px]">
            {/* the step ruler */}
            <div className="flex items-center gap-1 pl-9">
              {Array.from({ length: MAX_STEPS }, (_, s) => (
                <span
                  key={s}
                  className="mono-label w-9 text-center text-[8px] uppercase tracking-[0.1em] text-muted-foreground/45"
                  aria-hidden="true"
                >
                  {s + 1}
                </span>
              ))}
            </div>
            {Array.from({ length: nQubits }, (_, q) => (
              <div key={q} className="flex items-center gap-1 py-1">
                <span
                  className="mono-label w-8 shrink-0 text-right text-[9.5px] tabular-nums"
                  style={{ color: "var(--scope-a,var(--gd))" }}
                >
                  q{q}
                </span>
                {Array.from({ length: MAX_STEPS }, (_, s) => {
                  const step = steps[s];
                  const op = step.q[q] as { kind: SingleKind } | null;
                  const isCnotCtrl = step.cnot?.c === q;
                  const isCnotTgt = step.cnot?.t === q;
                  const filled = !!op || isCnotCtrl || isCnotTgt;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => placeGate(q, s)}
                      aria-label={
                        filled
                          ? `${t("Step")} ${s + 1}, q${q}: ${
                              op
                                ? SINGLE_LABEL[(op as { kind: SingleKind }).kind]
                                : isCnotCtrl
                                  ? t("control")
                                  : t("target")
                            }`
                          : `${t("Place")} ${t("the chosen gate")} — q${q}, ${t("step")} ${s + 1}`
                      }
                      data-testid={`qlab-wire-${q}-${s}`}
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-semibold transition-colors duration-300",
                        filled ? "font-semibold" : "border-dashed"
                      )}
                      style={
                        filled
                          ? {
                              borderColor:
                                "color-mix(in srgb, var(--scope-a,var(--gd)) 45%, transparent)",
                              backgroundColor:
                                "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
                              color: "var(--scope-a,var(--gd))",
                            }
                          : {
                              borderColor:
                                "color-mix(in srgb, var(--foreground) 12%, transparent)",
                            }
                      }
                    >
                      {op
                        ? SINGLE_LABEL[(op as { kind: SingleKind }).kind]
                        : isCnotCtrl
                          ? "●"
                          : isCnotTgt
                            ? "⊕"
                            : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* THE PALETTE — the honest instruments, one chosen at a time */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(["h", "x", "z", "s", "t", "cnot", "erase"] as GateChoice[]).map((g) => {
            const chosen = gate === g;
            const label =
              g === "erase"
                ? t("Erase")
                : g === "cnot"
                  ? "CNOT"
                  : SINGLE_LABEL[g as SingleKind];
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGate(g)}
                aria-pressed={chosen}
                data-testid={`qlab-gate-${g}`}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11.5px] transition-colors duration-300",
                  chosen ? "font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  chosen
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 50%, transparent)",
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
                        color: "var(--scope-a,var(--gd))",
                      }
                    : {
                        borderColor:
                          "color-mix(in srgb, var(--foreground) 12%, transparent)",
                      }
                }
              >
                {g === "erase" ? <CircleSlash className="size-3" aria-hidden="true" /> : null}
                {label}
              </button>
            );
          })}
          <span className="ml-1 hidden items-center gap-1.5 sm:flex">
            <span className="mono-label text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/55">
              {t("Qubits")}
            </span>
            {[2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNQubits(n);
                  setShots(null);
                  setCollapsed(null);
                  setCollapseIdx(null);
                }}
                aria-pressed={nQubits === n}
                data-testid={`qlab-qubits-${n}`}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[10.5px] tabular-nums transition-colors duration-300",
                  nQubits === n ? "font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  nQubits === n
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 50%, transparent)",
                        color: "var(--scope-a,var(--gd))",
                      }
                    : {
                        borderColor:
                          "color-mix(in srgb, var(--foreground) 12%, transparent)",
                      }
                }
              >
                {n}
              </button>
            ))}
          </span>
        </div>

        {/* THE CHOSEN GATE'S OWN TRUTH — one honest line, static */}
        <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground/80">
          {gate === "h"
            ? t("H — the fork: splits one path's certainty evenly across two.")
            : gate === "x"
              ? t("X — the flip: exchanges 0 and 1 on this wire.")
              : gate === "z"
                ? t("Z — the phase turn: marks one path with a half-turn of phase.")
                : gate === "s"
                  ? t("S — a quarter-turn of phase on the 1 path.")
                  : gate === "t"
                    ? t("T — an eighth-turn of phase; the fine adjustment.")
                    : gate === "cnot"
                      ? t("CNOT — touch a wire: it becomes the control; the next wire flips if the control stands at 1.")
                      : t("Erase — touch any cell to lay its gate down.")}
        </p>

        {/* THE STANDINGS — the live probabilities, quiet bars */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4" data-testid="qlab-probs">
          {probs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="mono-label w-9 shrink-0 text-[9.5px] tabular-nums text-muted-foreground">
                |{bits(nQubits, i)}⟩
              </span>
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.max(p * 100, p > 0.0001 ? 1.5 : 0)}%`,
                    backgroundColor: "var(--scope-a,var(--gd))",
                  }}
                />
              </span>
              <span className="mono-label w-10 shrink-0 text-right text-[9.5px] tabular-nums text-foreground/75">
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* THE RUNNING HANDS — sampling and the honest collapse */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={runShots}
            data-testid="qlab-shots"
            className="focus-glow flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11.5px] text-foreground transition-colors duration-300 hover:bg-foreground/5"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
            }}
          >
            {t("Run 200 shots")}
          </button>
          <button
            type="button"
            onClick={measureOnce}
            data-testid="qlab-measure"
            className="focus-glow flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11.5px] text-foreground transition-colors duration-300 hover:bg-foreground/5"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
            }}
          >
            {t("Measure once (collapses)")}
          </button>
          {collapsed ? (
            <span
              className="mono-label rounded-full px-2.5 py-1 text-[9.5px] uppercase tracking-[0.14em]"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
                color: "var(--scope-a,var(--gd))",
              }}
              data-testid="qlab-collapse-result"
            >
              {t("measured")} |{collapsed}⟩
            </span>
          ) : null}
        </div>

        {shots ? (
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="qlab-shot-counts">
            {shots.map((c, i) =>
              c > 0 ? (
                <span
                  key={i}
                  className="mono-label rounded-full border px-2 py-0.5 text-[9px] tabular-nums"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                    color: "var(--scope-a,var(--gd))",
                  }}
                >
                  |{bits(nQubits, i)}⟩ ×{c}
                </span>
              ) : null
            )}
          </div>
        ) : null}

        {/* THE HONEST FOOT — simulation is simulation, said plainly */}
        <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-snug text-muted-foreground/60">
          <Sparkles className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          {t(
            "Every number here is computed on your own device from the true unitary laws of the gates — a faithful simulation, never a quantum processor's answer."
          )}
        </p>
      </div>

      {/* THE MIRROR BRIDGE — the compact advisor, one per page */}
      <MirrorBridge workspaceKey="qlab" buildContext={buildContext} />
    </div>
  );
}

/* the circuit, plainly told (for the shelf and the bridge alike) */
function describeCircuit(steps: Step[], n: number): string {
  const parts: string[] = [];
  steps.forEach((step, s) => {
    if (step.cnot) {
      parts.push(`S${s + 1}: CNOT c=q${step.cnot.c}→t=q${step.cnot.t}`);
      return;
    }
    for (let q = 0; q < n; q++) {
      const op = step.q[q] as { kind: SingleKind } | null;
      if (op) parts.push(`S${s + 1}: ${SINGLE_LABEL[op.kind]} q${q}`);
    }
  });
  return parts.join(" · ");
}
