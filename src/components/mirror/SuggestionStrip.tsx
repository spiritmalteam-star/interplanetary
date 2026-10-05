"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  chatSuggestionPools,
  type PoolId,
} from "@/lib/data/suggestions-pools";
import {
  contextVocabulary,
  scoreSuggestion,
} from "@/lib/suggestion-resonance";
import { SuggestionTree } from "./SuggestionTree";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE LIVING SUGGESTION ENGINE                                       */
/*                                                                     */
/*  Every chat keeps a pool of 300 quiet invitations. Six ride the     */
/*  strip at a time — never random noise: when a conversation is       */
/*  unfolding, the invitations closest to what is being spoken are     */
/*  revealed first; when the room is still, the windows wander the     */
/*  pool by a seeded draw. Every five minutes the window advances by   */
/*  itself, so a visitor who lingers keeps meeting wholly fresh ones.  */
/*  On the PC the invitations wear their angle marks < like this > so  */
/*  they read as spoken whispers, never as buttons.                    */
/* ------------------------------------------------------------------ */

/** How many suggestions ride the strip at once. */
const WINDOW = 6;
/** The window advances itself every five minutes. */
const ROTATE_MS = 5 * 60 * 1000;

/* the resonance engine itself — the vocabulary of a conversation and
   the scoring of a whisper against it — lives in
   src/lib/suggestion-resonance.ts, shared with the living tree       */

/**
 * The ranked pool: suggestions closest to the conversation first.
 * With no unfolding conversation the pool keeps its own order and the
 * windows wander by a seeded draw instead.
 */
function rankPool(pool: string[], vocab: Map<string, number>): string[] {
  if (vocab.size === 0) return pool;
  return pool
    .map((s, i) => ({ s, i, score: scoreSuggestion(s, vocab) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .filter((x) => x.score > 0)
    .map((x) => x.s);
}

/** One chip — a clean whisper; the angle marks live at the strip's sides. */
function SuggestionChip({
  text,
  onPick,
  disabled,
  testId,
}: {
  text: string;
  onPick: () => void;
  disabled: boolean;
  testId?: string;
}) {
  const t = useT();
  const label = t(text);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid={testId ?? "suggestion-chip"}
      title={label}
      className="focus-glow shrink-0 whitespace-nowrap rounded-full border hairline bg-[var(--glass-bg)] px-3.5 py-1.5 font-serif text-[12.5px] italic leading-snug text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
    >
      {label}
    </button>
  );
}

/** One slide handle — the angle mark living at the strip's side. */
function SlideHandle({
  dir,
  onSlide,
  label,
  testId,
}: {
  dir: "prev" | "next";
  onSlide: () => void;
  label: string;
  testId: string;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onSlide}
      aria-label={label}
      title={label}
      data-testid={testId}
      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

/**
 * The reusable engine — any world mounts it with its own pool and its
 * own living context. Ranking, the five-minute rotation and the six-at-
 * a-time window are shared by every chat.
 */
export function ContextSuggestionStrip({
  poolId,
  contextText,
  onPick,
  testIdPrefix,
  ariaLabel,
  className,
}: {
  poolId: PoolId;
  contextText: string;
  onPick: (suggestion: string) => void;
  testIdPrefix?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useT();
  const pool = chatSuggestionPools[poolId];

  /* The ranked line-up — recomputed only when the conversation's
     vocabulary itself changes shape. */
  const vocab = useMemo(() => contextVocabulary(contextText), [contextText]);
  const ranked = useMemo(() => rankPool(pool, vocab), [pool, vocab]);
  const hasContext = vocab.size > 0 && ranked.length >= WINDOW;

  /* Window index: which group of six is on stage. Deterministic 0 at
     first render so server and client agree; the wandering draw (for
     the still room) happens in a client effect after hydration. */
  const [windowIdx, setWindowIdx] = useState(0);
  const seeded = useRef(false);

  useEffect(() => {
    seeded.current = false;
    /* deferred so the reset never cascades a render inside the effect */
    const id = window.setTimeout(() => setWindowIdx(0), 0);
    return () => window.clearTimeout(id);
  }, [poolId, ranked]);

  /* The still-room draw — when no conversation guides the ranking,
     start at a wandering window so every visit meets a different face
     of the pool. */
  useEffect(() => {
    if (seeded.current || hasContext) return;
    seeded.current = true;
    /* deferred — the wandering draw lands on the next tick */
    const id = window.setTimeout(
      () =>
        setWindowIdx(
          Math.floor(Math.random() * Math.max(1, pool.length / WINDOW))
        ),
      0
    );
    return () => window.clearTimeout(id);
  }, [hasContext, pool.length]);

  /* The five-minute breath — the window advances by itself, forever. */
  useEffect(() => {
    const id = window.setInterval(() => {
      setWindowIdx((w) => w + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  /* Six at a time, wrapped around the ranked line-up. */
  const start = (windowIdx * WINDOW) % Math.max(1, ranked.length);
  const visible = Array.from(
    { length: Math.min(WINDOW, ranked.length) },
    (_, i) => ranked[(start + i) % ranked.length]
  );

  const advance = () => setWindowIdx((w) => w + 1);
  const retreat = () => setWindowIdx((w) => Math.max(0, w - 1));

  return (
    <div
      className={`relative mx-auto w-full max-w-[760px] ${className ?? ""}`}
      role="group"
      aria-label={ariaLabel ?? t("Suggested questions")}
      data-testid={testIdPrefix ? `${testIdPrefix}-strip` : "suggestion-strip"}
    >
      <div className="flex items-center gap-1">
        {/* the left angle — slide back toward what was shown before */}
        <SlideHandle
          dir="prev"
          onSlide={retreat}
          label={t("Earlier suggestions")}
          testId={testIdPrefix ? `${testIdPrefix}-prev` : "suggestion-prev"}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${poolId}-${windowIdx}-${hasContext}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 py-1 sm:gap-2"
          >
            {visible.map((q) => (
              <SuggestionChip
                key={q}
                text={q}
                disabled={false}
                onPick={() => onPick(q)}
                testId={
                  testIdPrefix ? `${testIdPrefix}-chip` : "suggestion-chip"
                }
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* the right angle — slide the next six into the light */}
        <SlideHandle
          dir="next"
          onSlide={advance}
          label={t("More suggestions")}
          testId={testIdPrefix ? `${testIdPrefix}-reload` : "suggestion-reload"}
        />
      </div>
      {/* edge fade — the strip dissolves instead of clipping */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-10 w-6 bg-gradient-to-l from-[var(--background)] to-transparent"
      />
    </div>
  );
}

/**
 * The main conversation's strip — the engine fed by the channel's own
 * living thread (its recent exchanges are the context) and sent
 * through the scope's transmission door.
 */
export function SuggestionStrip() {
  const activeMode = useMirror((s) => s.activeMode);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const messages = useMirror((s) => s.sessions[s.activeMode].messages);
  const askMirror = useMirror((s) => s.askMirror);

  /* The conversation's last breaths are the context — what was asked
     and what the Mirror answered, recent and weighted toward now. */
  const contextText = useMemo(() => {
    const recent = messages.slice(-6);
    return recent.map((m) => `${m.query}\n${m.text}`).join("\n");
  }, [messages]);

  const loading = status === "loading";

  return (
    <ContextSuggestionStrip
      poolId={activeMode}
      contextText={contextText}
      onPick={(q) => {
        if (!loading) void askMirror(q);
      }}
      testIdPrefix="suggestion"
      className={loading ? "pointer-events-none opacity-70" : undefined}
    />
  );
}

/**
 * The main conversation's tree — the living suggestion tree fed by the
 * channel's own thread. Every branch of the laboratory rides it
 * (Interplanetary, Healing, Quantum, Evolve Med, Invent, Manifesting);
 * the window rests on the active mode's branch and drifts to whichever
 * branch the conversation's last topic brings closest.
 */
export function MainSuggestionTree() {
  const activeMode = useMirror((s) => s.activeMode);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const messages = useMirror((s) => s.sessions[s.activeMode].messages);
  const askMirror = useMirror((s) => s.askMirror);

  const contextText = useMemo(() => {
    const recent = messages.slice(-6);
    return recent.map((m) => `${m.query}\n${m.text}`).join("\n");
  }, [messages]);

  const loading = status === "loading";

  /* the channeling branch — the branches grown at this thread's
     replies hang at the top of the tree, tied to the general branch */
  const channeling = useMemo(
    () => [...messages].reverse().find((m) => m.branches?.length)?.branches,
    [messages]
  );

  return (
    <SuggestionTree
      focusBranch={activeMode}
      contextText={contextText}
      onPick={(q) => {
        if (!loading) void askMirror(q);
      }}
      disabled={loading}
      testIdPrefix="suggestion"
      className={loading ? "opacity-70" : undefined}
      channeling={channeling}
      transmitting={loading}
    />
  );
}
