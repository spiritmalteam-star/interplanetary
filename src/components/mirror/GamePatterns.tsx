"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, Lock, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  CosmicPayload,
  DiceFace,
  GameInstance,
} from "@/lib/cosmic-games";

/* ------------------------------------------------------------------ */
/*  The twelve playable archetypes. Each one is a small machine of     */
/*  wonder: press, choose, trace, answer, hold — and the Mirror pays   */
/*  out one true sentence. All content arrives authored from the       */
/*  catalog; these components only animate the encounter.              */
/* ------------------------------------------------------------------ */

const hairlineBtn =
  "focus-glow inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40";

function HairlineButton({
  children,
  onClick,
  testId,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  testId?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(hairlineBtn, className)}
      style={{
        borderColor: "color-mix(in srgb, var(--scope-a) 34%, transparent)",
        background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
      }}
    >
      {children}
    </button>
  );
}

const softPanel =
  "rounded-xl border border-[color-mix(in_srgb,var(--hairline)_60%,transparent)] bg-[color-mix(in_srgb,var(--hairline)_10%,transparent)]";

/* ---------- 1 · ORACLE — draw one card from the face-down deck ----- */

function OracleGame({
  draws,
  seed,
  testIdPrefix,
}: {
  draws: { glyph: string; title: string; line: string }[];
  seed: number;
  testIdPrefix: string;
}) {
  const t = useT();
  const [drawn, setDrawn] = useState<number | null>(null);
  const [shuffling, setShuffling] = useState(false);

  const draw = () => {
    if (shuffling) return;
    setShuffling(true);
    window.setTimeout(() => {
      setDrawn(((seed + Math.floor(Math.random() * 7)) % draws.length + draws.length) % draws.length);
      setShuffling(false);
    }, 620);
  };

  const card = drawn !== null ? draws[drawn] : null;

  return (
    <div className="flex flex-col items-center">
      {!card && (
        <button
          type="button"
          onClick={draw}
          disabled={shuffling}
          data-testid={`${testIdPrefix}-draw`}
          aria-label={t("Draw a card")}
          className="focus-glow group relative flex h-32 w-24 items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-1 disabled:cursor-wait"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background:
              "linear-gradient(150deg, color-mix(in srgb, var(--scope-a) 14%, transparent), color-mix(in srgb, var(--hairline) 12%, transparent))",
          }}
        >
          <motion.span
            className="font-serif text-3xl"
            style={{ color: "var(--scope-a)" }}
            animate={shuffling ? { rotate: [0, -12, 12, -6, 0], scale: [1, 1.08, 0.96, 1] } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            aria-hidden="true"
          >
            ✶
          </motion.span>
          <span className="pointer-events-none absolute -bottom-8 whitespace-nowrap text-[11.5px] italic text-muted-foreground">
            {shuffling ? "…" : t("Draw a card")}
          </span>
        </button>
      )}
      <AnimatePresence mode="wait">
        {card && (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, rotateY: 70, y: 8 }}
            animate={{ opacity: 1, rotateY: 0, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`${softPanel} w-full max-w-[420px] px-5 py-5 text-center`}
            data-testid={`${testIdPrefix}-card`}
          >
            <span className="block font-serif text-4xl leading-none" style={{ color: "var(--scope-a)" }} aria-hidden="true">
              {card.glyph}
            </span>
            <p className="mono-label mt-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {card.title}
            </p>
            <p className="mt-2.5 font-serif text-[15px] italic leading-relaxed text-foreground/90">
              {card.line}
            </p>
            <button
              type="button"
              onClick={() => setDrawn(null)}
              className="focus-glow mt-4 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Return to the deck")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 2 · RIDDLE — answer the gate, or ask it to yield -------- */

function RiddleGame({
  riddle,
  testIdPrefix,
}: {
  riddle: { gate: string; hints: string[]; keys: string[]; reveal: string };
  testIdPrefix: string;
}) {
  const t = useT();
  const [answer, setAnswer] = useState("");
  const [fails, setFails] = useState(0);
  const [state, setState] = useState<"asking" | "solved" | "revealed">("asking");

  const submit = () => {
    const norm = answer.trim().toLowerCase();
    if (!norm) return;
    const hit = riddle.keys.some((k) => norm.includes(k));
    if (hit) {
      setState("solved");
    } else {
      setFails((f) => f + 1);
      setAnswer("");
    }
  };

  const done = state !== "asking";
  const hintText = fails > 0 ? riddle.hints[Math.min(fails - 1, riddle.hints.length - 1)] : null;

  return (
    <div>
      <p className="font-serif text-[15.5px] italic leading-relaxed text-foreground/90" data-testid={`${testIdPrefix}-gate`}>
        {riddle.gate}
      </p>
      {!done && (
        <>
          <div className="mt-4 flex gap-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("Answer the gate")}
              aria-label={t("Answer the gate")}
              data-testid={`${testIdPrefix}-answer`}
              className="focus-glow h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-[14px] text-foreground placeholder:text-muted-foreground/60"
              style={{ borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)" }}
            />
            <HairlineButton onClick={submit} testId={`${testIdPrefix}-submit`}>
              {t("Answer the gate")}
            </HairlineButton>
          </div>
          {hintText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-[13px] italic text-muted-foreground"
            >
              {hintText}
            </motion.p>
          )}
          {fails >= 2 && (
            <button
              type="button"
              onClick={() => setState("revealed")}
              data-testid={`${testIdPrefix}-reveal`}
              className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Reveal the answer")}
            </button>
          )}
        </>
      )}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-4 px-4 py-3.5`}
            data-testid={`${testIdPrefix}-reveal-text`}
          >
            <p className="mono-label text-[9.5px] uppercase tracking-[0.22em]" style={{ color: "var(--scope-a)" }}>
              {state === "solved" ? "✶ ✓" : "✶"}
            </p>
            <p className="mt-2 font-serif text-[14.5px] italic leading-relaxed text-foreground/90">
              {riddle.reveal}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 3 · FORK — a small crossroads with poetic consequences -- */

function ForkGame({
  fork,
  testIdPrefix,
}: {
  fork: { situation: string; paths: { label: string; result: string }[] };
  testIdPrefix: string;
}) {
  const t = useT();
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <div>
      <p className="font-serif text-[15.5px] italic leading-relaxed text-foreground/90" data-testid={`${testIdPrefix}-situation`}>
        {fork.situation}
      </p>
      {chosen === null ? (
        <div className="mt-4 flex flex-col gap-2">
          {fork.paths.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setChosen(i)}
              data-testid={`${testIdPrefix}-path-${i}`}
              className="focus-glow group flex items-center justify-between rounded-full border px-4 py-2.5 text-left text-[13.5px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
              style={{
                borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
              }}
            >
              <span>{p.label}</span>
              <span className="ml-3 shrink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${softPanel} mt-4 px-4 py-3.5`}
          data-testid={`${testIdPrefix}-result`}
        >
          <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {fork.paths[chosen].label}
          </p>
          <p className="mt-2 font-serif text-[14.5px] italic leading-relaxed text-foreground/90">
            {fork.paths[chosen].result}
          </p>
          <button
            type="button"
            onClick={() => setChosen(null)}
            className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t("Begin again")}
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- 4 · RITUAL — press and hold; the rounds pay out lines --- */

const RITUAL_HOLD_MS = 1500;

function RitualGame({
  ritual,
  testIdPrefix,
}: {
  ritual: { rounds: number; steps: string[] };
  testIdPrefix: string;
}) {
  const t = useT();
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  const done = round >= ritual.rounds;

  useEffect(() => {
    if (!holding) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    startRef.current = performance.now() - progress * RITUAL_HOLD_MS;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / RITUAL_HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        setHolding(false);
        setProgress(0);
        setRound((r) => r + 1);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [holding]);

  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center">
      {!done ? (
        <>
          <button
            type="button"
            data-testid={`${testIdPrefix}-hold`}
            aria-label={t("Press and hold")}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!holding) {
                setProgress(0);
                setHolding(true);
              }
            }}
            onPointerUp={() => setHolding(false)}
            onPointerLeave={() => setHolding(false)}
            onContextMenu={(e) => e.preventDefault()}
            className="focus-glow relative flex size-24 touch-none select-none items-center justify-center rounded-full border transition-transform duration-200"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
              transform: holding ? "scale(0.96)" : undefined,
            }}
          >
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" stroke="transparent" strokeWidth="2.5" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="var(--scope-a)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
                opacity={holding ? 0.9 : 0.25}
              />
            </svg>
            <span className="font-serif text-2xl" style={{ color: "var(--scope-a)" }} aria-hidden="true">
              {holding ? `${pct}%` : "❋"}
            </span>
          </button>
          <p className="mt-3 text-[11.5px] italic text-muted-foreground">
            {t("Press and hold")} · {round + 1}/{ritual.rounds}
          </p>
        </>
      ) : (
        <div className="w-full">
          {ritual.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.35, duration: 0.5 }}
              className={`${softPanel} ${i > 0 ? "mt-2" : ""} px-4 py-3`}
              data-testid={`${testIdPrefix}-step-${i}`}
            >
              <p className="font-serif text-[14px] italic leading-relaxed text-foreground/90">{step}</p>
            </motion.div>
          ))}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setRound(0);
                setProgress(0);
              }}
              className="focus-glow text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Begin again")}
            </button>
          </div>
        </div>
      )}
      {/* the lines already earned, kept quietly below while charging */}
      {!done && (
        <div className="mt-4 w-full">
          {ritual.steps.slice(0, round).map((step, i) => (
            <p key={i} className="mt-2 font-serif text-[13.5px] italic leading-relaxed text-muted-foreground">
              {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 5 · CONSTELLATION — connect the stars in their order ---- */

function ConstellationGame({
  sky,
  testIdPrefix,
}: {
  sky: { name: string; meaning: string; stars: [number, number][] };
  testIdPrefix: string;
}) {
  const t = useT();
  const [next, setNext] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const done = next >= sky.stars.length;

  const tap = (i: number) => {
    if (done) return;
    if (i === next) {
      setNext(i + 1);
    } else {
      setShake(i);
      window.setTimeout(() => setShake(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[340px]">
        <svg viewBox="0 0 100 100" className="w-full" aria-label={t("Connect the stars")} role="img">
          {sky.stars.map(([x, y], i) => {
            if (i === 0 || i >= next) return null;
            const [px, py] = sky.stars[i - 1];
            return (
              <motion.line
                key={`l-${i}`}
                x1={px}
                y1={py}
                x2={x}
                y2={y}
                stroke="var(--scope-a)"
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.75 }}
                transition={{ duration: 0.4 }}
              />
            );
          })}
          {sky.stars.map(([x, y], i) => {
            const lit = i < next;
            const isNext = i === next && !done;
            return (
              <motion.g
                key={`s-${i}`}
                onClick={() => tap(i)}
                onPointerDown={() => tap(i)}
                initial={false}
                animate={
                  shake === i
                    ? { x: [0, -2, 2, -1.5, 0] }
                    : isNext
                      ? { opacity: [0.5, 1, 0.5] }
                      : { opacity: 1 }
                }
                transition={
                  shake === i
                    ? { duration: 0.4 }
                    : isNext
                      ? { duration: 1.6, repeat: Infinity }
                      : {}
                }
                style={{ cursor: done ? "default" : "pointer" }}
              >
                <circle cx={x} cy={y} r="6" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={lit ? 1.6 : 1.1}
                  fill={lit ? "var(--scope-a)" : "currentColor"}
                  className={lit ? "" : "text-foreground/60"}
                />
                {lit && (
                  <circle cx={x} cy={y} r="3.2" fill="none" stroke="var(--scope-a)" strokeWidth="0.3" opacity="0.5" />
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      <p className="mt-1 min-h-[18px] text-[11.5px] italic text-muted-foreground">
        {done ? sky.name : t("Connect the stars")}
      </p>
      <AnimatePresence>
        {done && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-2 w-full max-w-[420px] px-4 py-3 text-center font-serif text-[14.5px] italic leading-relaxed text-foreground/90`}
            data-testid={`${testIdPrefix}-meaning`}
          >
            {sky.meaning}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 6 · WEAVE — pick three orbs; the loom writes the truth -- */

function WeaveGame({
  weave,
  seed,
  testIdPrefix,
}: {
  weave: { orbs: string[]; patterns: string[] };
  seed: number;
  testIdPrefix: string;
}) {
  const t = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const [woven, setWoven] = useState<string | null>(null);

  const toggle = (word: string) => {
    if (woven) return;
    setPicked((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 3) return prev;
      return [...prev, word];
    });
  };

  const doWeave = () => {
    if (picked.length !== 3) return;
    const pattern = weave.patterns[seed % weave.patterns.length];
    setWoven(
      pattern
        .replace(/\{0\}/g, picked[0])
        .replace(/\{1\}/g, picked[1])
        .replace(/\{2\}/g, picked[2])
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" data-testid={`${testIdPrefix}-orbs`}>
        {weave.orbs.map((word) => {
          const idx = picked.indexOf(word);
          return (
            <button
              key={word}
              type="button"
              onClick={() => toggle(word)}
              data-testid={`${testIdPrefix}-orb-${word}`}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-300 hover:-translate-y-px",
                idx >= 0 ? "text-foreground" : "text-muted-foreground"
              )}
              style={{
                borderColor:
                  idx >= 0
                    ? "color-mix(in srgb, var(--scope-a) 55%, transparent)"
                    : "color-mix(in srgb, var(--hairline) 70%, transparent)",
                background:
                  idx >= 0 ? "color-mix(in srgb, var(--scope-a) 12%, transparent)" : "transparent",
              }}
            >
              {idx >= 0 && (
                <span className="mono-label text-[9px]" style={{ color: "var(--scope-a)" }} aria-hidden="true">
                  {idx + 1}
                </span>
              )}
              {word}
            </button>
          );
        })}
      </div>
      {!woven && (
        <div className="mt-4">
          <HairlineButton
            onClick={doWeave}
            testId={`${testIdPrefix}-weave`}
            className={picked.length === 3 ? "" : "opacity-40"}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("Weave")}
          </HairlineButton>
          {picked.length > 0 && picked.length < 3 && (
            <span className="ml-3 text-[11.5px] italic text-muted-foreground">
              {picked.length}/3
            </span>
          )}
        </div>
      )}
      <AnimatePresence>
        {woven && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-4 px-4 py-3.5`}
            data-testid={`${testIdPrefix}-woven`}
          >
            <p className="font-serif text-[14.5px] italic leading-relaxed text-foreground/90">{woven}</p>
            <button
              type="button"
              onClick={() => {
                setWoven(null);
                setPicked([]);
              }}
              className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Begin again")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 7 · SCALE — slide the beam; every stop pays a truth ----- */

const SCALE_STOPS = [0, 25, 50, 75, 100];

function ScaleGame({
  scale,
  testIdPrefix,
}: {
  scale: { left: string; right: string; truths: string[] };
  testIdPrefix: string;
}) {
  const t = useT();
  const [value, setValue] = useState(50);
  const [truth, setTruth] = useState<string | null>(null);
  const truthIdx = useRef(0);

  const commit = () => {
    const nearest = SCALE_STOPS.reduce((a, b) =>
      Math.abs(b - value) < Math.abs(a - value) ? b : a
    );
    if (Math.abs(nearest - value) <= 9) {
      /* pick a truth deterministic to the stop + rotation */
      const stopIdx = SCALE_STOPS.indexOf(nearest);
      setTruth(scale.truths[(truthIdx.current + stopIdx) % scale.truths.length]);
      truthIdx.current += 1;
    } else {
      setTruth(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        <span>{scale.left}</span>
        <span>{scale.right}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => {
          setValue(Number(e.target.value));
          setTruth(null);
        }}
        onPointerUp={commit}
        onKeyUp={commit}
        aria-label={t("Settle the beam")}
        data-testid={`${testIdPrefix}-beam`}
        className="mt-3 w-full cursor-pointer accent-[var(--scope-a)]"
      />
      <AnimatePresence mode="wait">
        {truth && (
          <motion.p
            key={truth}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${softPanel} mt-4 px-4 py-3 font-serif text-[14.5px] italic leading-relaxed text-foreground/90`}
            data-testid={`${testIdPrefix}-truth`}
          >
            {truth}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 8 · GATE — three glyph dials; the gate hums when true --- */

function GateGame({
  gate,
  seed,
  testIdPrefix,
}: {
  gate: { dials: string[][]; open: string };
  seed: number;
  testIdPrefix: string;
}) {
  const t = useT();
  const solution = useMemo(
    () => gate.dials.map((_, k) => (seed + k * 97) % gate.dials[k].length),
    [gate.dials, seed]
  );
  const [pos, setPos] = useState<number[]>(() => gate.dials.map((d, k) => (solution[k] + 1 + k) % d.length));
  const open = pos.every((p, k) => p === solution[k]);

  const turn = (k: number) => {
    if (open) return;
    setPos((prev) =>
      prev.map((p, i) => (i === k ? (p + 1) % gate.dials[i].length : p))
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3" data-testid={`${testIdPrefix}-dials`}>
        {gate.dials.map((glyphs, k) => {
          const isTrue = pos[k] === solution[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => turn(k)}
              aria-label={`${t("The gate hums when a dial is true")} — ${k + 1}`}
              data-testid={`${testIdPrefix}-dial-${k}`}
              className="focus-glow flex size-14 items-center justify-center rounded-xl border text-2xl transition-all duration-300 hover:-translate-y-px"
              style={{
                borderColor: isTrue
                  ? "color-mix(in srgb, var(--scope-a) 60%, transparent)"
                  : "color-mix(in srgb, var(--hairline) 70%, transparent)",
                background: isTrue
                  ? "color-mix(in srgb, var(--scope-a) 12%, transparent)"
                  : "transparent",
                boxShadow: isTrue
                  ? "0 0 18px -6px color-mix(in srgb, var(--scope-a) 70%, transparent)"
                  : undefined,
                color: isTrue ? "var(--scope-a)" : undefined,
              }}
            >
              {glyphs[pos[k]]}
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-[18px] text-[11.5px] italic text-muted-foreground">
        {open ? t("The gate opens") : t("The gate hums when a dial is true")}
      </p>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-2 w-full max-w-[420px] px-4 py-3.5 text-center`}
            data-testid={`${testIdPrefix}-open`}
          >
            <Lock className="mx-auto size-4 opacity-0" aria-hidden="true" />
            <p className="font-serif text-[14.5px] italic leading-relaxed text-foreground/90">{gate.open}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 9 · ECHO — one word in; the mirror answers -------------- */

function EchoGame({
  echo,
  seed,
  testIdPrefix,
}: {
  echo: { returns: string[] };
  seed: number;
  testIdPrefix: string;
}) {
  const t = useT();
  const [word, setWord] = useState("");
  const [reflection, setReflection] = useState<string | null>(null);

  const send = () => {
    const w = word.trim();
    if (!w) return;
    const template = echo.returns[seed % echo.returns.length];
    setReflection(template.replace(/\{word\}/g, w.toLowerCase()));
  };

  return (
    <div>
      {!reflection ? (
        <div className="flex gap-2">
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            maxLength={24}
            placeholder={t("Type one word")}
            aria-label={t("Type one word")}
            data-testid={`${testIdPrefix}-word`}
            className="focus-glow h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-[14px] text-foreground placeholder:text-muted-foreground/60"
            style={{ borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)" }}
          />
          <HairlineButton onClick={send} testId={`${testIdPrefix}-send`}>
            {t("Offer the word")}
          </HairlineButton>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid={`${testIdPrefix}-reflection`}
        >
          <p
            className="select-none text-center font-serif text-2xl italic tracking-wide"
            style={{ color: "var(--scope-a)", transform: "scaleX(-1)" }}
            aria-hidden="true"
          >
            {word.trim().toLowerCase()}
          </p>
          <div className={`${softPanel} mt-3 px-4 py-3.5`}>
            <p className="font-serif text-[14.5px] italic leading-relaxed text-foreground/90">{reflection}</p>
          </div>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setReflection(null);
                setWord("");
              }}
              className="focus-glow text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Offer another word")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- 10 · DICE — one tumble; every face is a counselor ------- */

function DiceGame({
  faces,
  seed,
  testIdPrefix,
}: {
  faces: DiceFace[];
  seed: number;
  testIdPrefix: string;
}) {
  const t = useT();
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const [spin, setSpin] = useState(0);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setFace(null);
    const cycles = 8;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setSpin((s) => s + 40);
      if (i >= cycles) {
        window.clearInterval(id);
        setFace((seed + Math.floor(Math.random() * faces.length)) % faces.length);
        setRolling(false);
      }
    }, 80);
  };

  const current = face !== null ? faces[face] : null;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        aria-label={t("Roll the dice")}
        data-testid={`${testIdPrefix}-roll`}
        className="focus-glow flex size-20 items-center justify-center rounded-2xl border transition-all duration-300 hover:-translate-y-1 disabled:cursor-wait"
        style={{
          borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
          background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
        }}
      >
        <motion.span
          animate={{ rotate: spin }}
          transition={{ duration: 0.1 }}
          className="block"
          aria-hidden="true"
        >
          <Dices className="size-8" style={{ color: "var(--scope-a)" }} />
        </motion.span>
      </button>
      <p className="mt-2 min-h-[18px] text-[11.5px] italic text-muted-foreground">
        {rolling ? "…" : face === null ? t("Roll the dice") : ""}
      </p>
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.title}
            initial={{ opacity: 0, y: 10, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`${softPanel} w-full max-w-[420px] px-4 py-4 text-center`}
            data-testid={`${testIdPrefix}-face`}
          >
            <span className="block font-serif text-3xl leading-none" style={{ color: "var(--scope-a)" }} aria-hidden="true">
              {current.glyph}
            </span>
            <p className="mono-label mt-2.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {current.title}
            </p>
            <p className="mt-2 font-serif text-[14.5px] italic leading-relaxed text-foreground/90">
              {current.line}
            </p>
            <button
              type="button"
              onClick={roll}
              className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Roll again")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 11 · SPIRAL — hold; the mote descends; the center teaches */

const SPIRAL_HOLD_MS = 3800;

function SpiralGame({
  spiral,
  testIdPrefix,
}: {
  spiral: { lesson: string };
  testIdPrefix: string;
}) {
  const t = useT();
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [complete, setComplete] = useState(false);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(64, now - (lastRef.current || now));
      lastRef.current = now;
      if (holding && !complete) {
        progressRef.current = Math.min(1, progressRef.current + dt / SPIRAL_HOLD_MS);
        if (progressRef.current >= 1) {
          setComplete(true);
          setHolding(false);
        }
      } else if (!complete) {
        progressRef.current = Math.max(0, progressRef.current - dt / (SPIRAL_HOLD_MS * 2.2));
      }
      setProgress(progressRef.current);
      if (!complete || progressRef.current < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [holding, complete]);

  /* the mote: an inward spiral (three turns) */
  const turns = 3;
  const angle = progress * turns * 2 * Math.PI;
  const radius = (1 - progress) * 42;
  const cx = 50 + radius * Math.cos(angle);
  const cy = 50 + radius * Math.sin(angle);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-[240px] touch-none select-none"
        onPointerDown={(e) => {
          e.preventDefault();
          if (!complete) setHolding(true);
        }}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onContextMenu={(e) => e.preventDefault()}
        data-testid={`${testIdPrefix}-spiral`}
      >
        <svg viewBox="0 0 100 100" className="w-full" aria-label={t("Press and hold")} role="img">
          {[0.14, 0.34, 0.54, 0.74, 0.94].map((p) => (
            <circle
              key={p}
              cx="50"
              cy="50"
              r={p * 46}
              fill="none"
              stroke="currentColor"
              className="text-foreground/12"
              strokeWidth="0.4"
              strokeDasharray="1.5 2.5"
            />
          ))}
          <circle cx={cx} cy={cy} r={complete ? 2.2 : 1.8} fill="var(--scope-a)" />
          {complete && (
            <circle cx={cx} cy={cy} r="6" fill="none" stroke="var(--scope-a)" strokeWidth="0.5" opacity="0.6" />
          )}
        </svg>
        {!complete && !holding && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border bg-background/80 px-3 py-1 text-[11.5px] italic text-muted-foreground backdrop-blur-sm">
              {t("Press and hold")}
            </span>
          </div>
        )}
      </div>
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-3 w-full max-w-[420px] px-4 py-3.5 text-center`}
            data-testid={`${testIdPrefix}-lesson`}
          >
            <p className="font-serif text-[14.5px] italic leading-relaxed text-foreground/90">{spiral.lesson}</p>
            <button
              type="button"
              onClick={() => {
                progressRef.current = 0;
                setProgress(0);
                setComplete(false);
              }}
              className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Begin again")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 12 · SIGNAL — watch the blink, answer in light ---------- */

const BLINK_MS = 480;

function SignalGame({
  signal,
  testIdPrefix,
}: {
  signal: { phrase: string; sequence: number[] };
  testIdPrefix: string;
}) {
  const t = useT();
  const [phase, setPhase] = useState<"idle" | "watch" | "repeat" | "done" | "failed">("idle");
  const [lit, setLit] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  const play = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("watch");
    setStep(0);
    signal.sequence.forEach((pad, i) => {
      timers.current.push(
        window.setTimeout(() => setLit(pad), i * BLINK_MS * 2)
      );
      timers.current.push(
        window.setTimeout(() => setLit(null), i * BLINK_MS * 2 + BLINK_MS)
      );
    });
    timers.current.push(
      window.setTimeout(
        () => setPhase("repeat"),
        signal.sequence.length * BLINK_MS * 2 + 200
      )
    );
  };

  const press = (pad: number) => {
    if (phase !== "repeat") return;
    setLit(pad);
    window.setTimeout(() => setLit(null), 220);
    if (signal.sequence[step] === pad) {
      if (step + 1 >= signal.sequence.length) {
        setPhase("done");
      } else {
        setStep(step + 1);
      }
    } else {
      setPhase("failed");
      setStep(0);
    }
  };

  const pads = [0, 1, 2, 3];

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2.5" data-testid={`${testIdPrefix}-pads`}>
        {pads.map((pad) => (
          <button
            key={pad}
            type="button"
            onPointerDown={() => press(pad)}
            disabled={phase !== "repeat"}
            aria-label={`Signal ${pad + 1}`}
            data-testid={`${testIdPrefix}-pad-${pad}`}
            className="focus-glow size-12 rounded-xl border transition-all duration-150 disabled:cursor-default"
            style={{
              borderColor:
                lit === pad
                  ? "color-mix(in srgb, var(--scope-a) 75%, transparent)"
                  : "color-mix(in srgb, var(--hairline) 70%, transparent)",
              background:
                lit === pad
                  ? "color-mix(in srgb, var(--scope-a) 35%, transparent)"
                  : "color-mix(in srgb, var(--hairline) 8%, transparent)",
              boxShadow:
                lit === pad
                  ? "0 0 20px -4px color-mix(in srgb, var(--scope-a) 75%, transparent)"
                  : undefined,
              transform: lit === pad ? "scale(1.06)" : undefined,
            }}
          />
        ))}
      </div>
      <p className="mt-3 min-h-[18px] text-[11.5px] italic text-muted-foreground">
        {phase === "idle" && ""}
        {phase === "watch" && t("Watch the signal")}
        {phase === "repeat" && t("Repeat the signal")}
        {phase === "failed" && t("The signal scatters — watch again")}
        {phase === "done" && ""}
      </p>
      <div className="mt-2">
        {phase === "idle" && (
          <HairlineButton onClick={play} testId={`${testIdPrefix}-watch`}>
            {t("Watch the signal")}
          </HairlineButton>
        )}
        {phase === "failed" && (
          <HairlineButton onClick={play} testId={`${testIdPrefix}-retry`}>
            {t("Watch the signal")}
          </HairlineButton>
        )}
      </div>
      <AnimatePresence>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${softPanel} mt-3 w-full max-w-[420px] px-4 py-3.5 text-center`}
            data-testid={`${testIdPrefix}-phrase`}
          >
            <p className="font-serif text-[14.5px] italic leading-relaxed text-foreground/90">{signal.phrase}</p>
            <button
              type="button"
              onClick={play}
              className="focus-glow mt-3 text-[12px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t("Begin again")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DISPATCH                                                           */
/* ------------------------------------------------------------------ */

export function GameBoard({
  payload,
  instance,
  testIdPrefix,
}: {
  payload: CosmicPayload;
  instance: GameInstance;
  testIdPrefix: string;
}) {
  switch (payload.kind) {
    case "oracle":
      return <OracleGame draws={payload.draws} seed={instance.seed} testIdPrefix={testIdPrefix} />;
    case "riddle":
      return <RiddleGame riddle={payload.riddle} testIdPrefix={testIdPrefix} />;
    case "fork":
      return <ForkGame fork={payload.fork} testIdPrefix={testIdPrefix} />;
    case "ritual":
      return <RitualGame ritual={payload.ritual} testIdPrefix={testIdPrefix} />;
    case "constellation":
      return <ConstellationGame sky={payload.sky} testIdPrefix={testIdPrefix} />;
    case "weave":
      return <WeaveGame weave={payload.weave} seed={instance.seed} testIdPrefix={testIdPrefix} />;
    case "scale":
      return <ScaleGame scale={payload.scale} testIdPrefix={testIdPrefix} />;
    case "gate":
      return <GateGame gate={payload.gate} seed={instance.seed} testIdPrefix={testIdPrefix} />;
    case "echo":
      return <EchoGame echo={payload.echo} seed={instance.seed} testIdPrefix={testIdPrefix} />;
    case "dice":
      return <DiceGame faces={payload.dice.faces} seed={instance.seed} testIdPrefix={testIdPrefix} />;
    case "spiral":
      return <SpiralGame spiral={payload.spiral} testIdPrefix={testIdPrefix} />;
    case "signal":
      return <SignalGame signal={payload.signal} testIdPrefix={testIdPrefix} />;
  }
}
