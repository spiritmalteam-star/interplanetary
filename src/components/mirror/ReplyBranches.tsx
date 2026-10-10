"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ListTree } from "lucide-react";
import { chatSuggestionPools, type PoolId } from "@/lib/data/suggestions-pools";
import { contextVocabulary, scoreSuggestion } from "@/lib/suggestion-resonance";
import type { BranchId } from "@/lib/data/suggestion-tree";
import {
  BRANCH_TYPE_LABELS,
  driftTreeTo,
  journeyDepth,
  loadSeen,
  parseBranchesPayload,
  recordJourney,
  recordSeen,
  type LearnedBranch,
} from "@/lib/learning-branches";
import { useMirror } from "@/lib/mirror-store";
import type { Mode } from "@/lib/mirror-types";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE REPLY BRANCHES — where the signature used to live.             */
/*                                                                     */
/*  Instead of "— The Mirror Entity, with the Pleiadian choir", every  */
/*  landed reply now closes with BRANCHES: two to five continuations   */
/*  grown from this very exchange, each belonging to one of the        */
/*  Mirror Entity's learning movements, each carrying its reason.      */
/*  They are linked with the big hub of branches — one touch and the   */
/*  living tree opens and drifts to their general branch.              */
/*                                                                     */
/*  Every thread of the laboratory is served: the scope channels, the  */
/*  forge (Invent), the OS (Manifesting), ParticleX (Quantum) and      */
/*  Evolve Med — each reply's branches connect to their own general    */
/*  branch of the tree.                                                */
/*                                                                     */
/*  Honest by law: while the branch engine is thinking, the closest    */
/*  pool whispers (ranked against THIS reply alone) stand in; if the   */
/*  sky is silent, they simply remain. Nothing is invented.            */
/* ------------------------------------------------------------------ */

/** Branches grown per message — one quiet fetch per landed reply. */
const inflight = new Set<string>();

/** The smallest shape of a landed reply every thread can offer. */
interface ReplyBranchMessage {
  id: string;
  text: string;
  query?: string;
  branches?: LearnedBranch[];
}

/** Every thread kind the branches can grow in. */
export type BranchThread = Mode | "forge" | "os" | "px" | "em" | "ax";

/** The thread kind's own general branch of the living tree. */
function branchFor(kind: BranchThread): BranchId {
  switch (kind) {
    case "forge":
      return "invent";
    case "os":
      return "manifesting";
    case "px":
      return "quantum";
    case "em":
      return "evolvemed";
    case "ax":
      return "artx";
    default:
      return kind as BranchId;
  }
}

/** The stand-in pool a thread's whispers rise from while the engine thinks. */
function poolFor(kind: BranchThread): string[] {
  const poolId: PoolId =
    kind === "forge"
      ? "invent"
      : kind === "os"
        ? "mirroros"
        : kind === "px"
          ? "particlex"
          : kind === "em"
            ? "evolvemed"
            : kind === "ax"
              ? "artx"
              : (kind as PoolId);
  return chatSuggestionPools[poolId] ?? [];
}

/* THE BRANCHES' OWN FLOOR — the one law of the conversation's feet:
   when a landed reply carries branches, they are THE suggestions of
   the chat — the tree and every other in-chat whisper stand down so
   only the branches speak. This pure check tells any view whether a
   landed reply currently holds the floor (grown branches, or the
   stand-in whispers while the engine thinks). */
export function branchChipsLive(
  kind: BranchThread,
  message: { text: string; query?: string; branches?: LearnedBranch[] },
  contextQuery?: string
): boolean {
  if (!message.text.trim()) return false;
  if (message.branches && message.branches.length > 0) return true;
  const pool = poolFor(kind);
  if (pool.length === 0) return false;
  const vocab = contextVocabulary(
    `${contextQuery ?? message.query ?? ""}\n${message.text}`.slice(-1800)
  );
  const seen = new Set(loadSeen().map((s) => s.toLowerCase()));
  return pool.some(
    (s) => scoreSuggestion(s, vocab) > 0 && !seen.has(s.toLowerCase())
  );
}

export function ReplyBranches({
  message,
  kind,
  active,
  disabled,
  onPick,
  contextQuery,
  askFn,
  scopeHint: scopeHintProp,
}: {
  message: ReplyBranchMessage;
  /** Which thread this reply lives in — decides its general branch. */
  kind: BranchThread;
  /** True when this is the thread's latest reply and it has landed. */
  active: boolean;
  disabled: boolean;
  onPick: (suggestion: string) => void;
  /** Threads whose messages carry no query (os/px/em) pass the paired
      visitor line here — the exchange the reply answered. */
  contextQuery?: string;
  /** How a picked branch is asked — defaults to the main mirror. */
  askFn?: (q: string) => void;
  /** The scope/window this thread currently stands in (its own name —
      "Interdimensional Ateliers", "Protein Folding"). THE SCOPE LAW:
      branches belong ONLY to the category or scope they represent —
      the grown branches open this scope alone, and the stand-in
      whispers lean toward it. */
  scopeHint?: string | null;
}) {
  const t = useT();
  const askMirror = useMirror((s) => s.askMirror);
  const attachBranches = useMirror((s) => s.attachBranches);
  /* the visitor's fields of expansion — coherent ones seed new branches */
  const seeds = useMirror((s) => s.expansionSeeds);
  const scopeHint = scopeHintProp ?? null;
  /* the dropdown — THE BRANCHES ARE NEVER GONE: they open by themselves
     the moment their reply becomes the latest landed exchange, and fold
     again when a newer exchange takes the floor. The hand always wins:
     once the visitor toggles them, the tree never argues. */
  const [open, setOpen] = useState(active);
  const [touched, setTouched] = useState(false);
  const [seenActive, setSeenActive] = useState(active);
  if (active !== seenActive) {
    setSeenActive(active);
    if (!touched) setOpen(active);
  }

  /* the instant stand-in — the pool's closest whispers to THIS reply
     alone, so the foot is never empty while the engine thinks.
     THE VARIETY LAW: the pool is rotated by a fresh offset every mount,
     so equal-scoring whispers never repeat in the same order — different
     fragments of the Absolute surface on different visits. */
  const fallback = useMemo(() => {
    const pool = poolFor(kind);
    if (!message.text || pool.length === 0) return [] as string[];
    const rotateBy = Math.floor(Math.random() * pool.length);
    const rotated = [...pool.slice(rotateBy), ...pool.slice(0, rotateBy)];
    /* the reply's own breath is the context — closer than the whole
       thread ever is: this is what makes these branches more
       connected to the context than the tree's standing whispers.
       The active scope's name rides at the front, so the whispers
       that surface belong to the scope the visitor stands in. */
    const vocab = contextVocabulary(
      `${scopeHint ?? ""}\n${contextQuery ?? message.query}\n${message.text}`.slice(-1800)
    );
    const seen = new Set(loadSeen().map((s) => s.toLowerCase()));
    return rotated
      .map((s, i) => ({ s, i, score: scoreSuggestion(s, vocab) }))
      .filter((x) => x.score > 0 && !seen.has(x.s.toLowerCase()))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, 3)
      .map((x) => x.s);
  }, [message.text, message.query, contextQuery, kind, scopeHint]);

  /* the grown branches — one quiet call per landed reply */
  const growRef = useRef(false);
  useEffect(() => {
    if (!active || message.branches) return;
    if (!message.text.trim()) return;
    const id = window.setTimeout(async () => {
      if (growRef.current || inflight.has(message.id)) return;
      growRef.current = true;
      inflight.add(message.id);
      try {
        const res = await fetch("/api/suggestions/bud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: branchFor(kind),
            /* the last breaths are THIS exchange — the freshest
               resonance the laboratory can hear */
            context: `${contextQuery ?? message.query}\n${message.text}`.slice(-2400),
            /* THE SCOPE LAW — the grown branches belong only to the
               scope this thread stands in */
            scope: scopeHint ?? undefined,
            seen: loadSeen().slice(0, 24),
            /* the visitor's own fields of expansion ride along —
               coherent ones grow branches of their own */
            seeds,
            /* THE DNA DEEPENING: the deeper the walk, the deeper the
               branches the engine grows */
            depth: journeyDepth(),
          }),
        });
        const data = await res.json().catch(() => null);
        const grown: LearnedBranch[] = parseBranchesPayload(data).slice(0, 5);
        if (grown.length > 0) {
          attachBranches(kind, message.id, grown);
          recordSeen(grown.map((b) => b.question));
        }
      } catch {
        /* the sky is silent — the stand-in whispers remain */
      } finally {
        inflight.delete(message.id);
      }
    }, 650);
    return () => window.clearTimeout(id);
  }, [active, message.id, message.text, message.query, message.branches, kind, contextQuery, scopeHint, seeds, attachBranches]);

  const branches = message.branches;
  /* nothing to stand on yet and nothing grown — the foot rests empty */
  const showFallback = !branches || branches.length === 0;
  const chipCount = (branches?.length ?? 0) + (showFallback ? fallback.length : 0);
  if (chipCount === 0) return null;

  const pick = (s: string) => {
    if (disabled) return;
    /* the walk is kept — the helix reflects the branch this step took */
    recordJourney({ b: branchFor(kind) });
    if (askFn) askFn(s);
    else void askMirror(s);
    onPick(s);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mt-5 border-t pt-4"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a) 22%, transparent)",
      }}
      data-testid="reply-branches"
    >
      {/* THE DROPDOWN — one quiet door. The branches never lay themselves
          out directly; they drop down only when the door is pressed. */}
      <button
        type="button"
        onClick={() => {
          setTouched(true);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        data-testid="reply-branches-toggle"
        className="focus-glow flex w-full items-center justify-between gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_46%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_12%,var(--glass-bg))] px-3.5 py-1.5 text-left shadow-[0_1px_12px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_45%,transparent)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_62%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_18%,var(--glass-bg))]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ListTree className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
          <span className="mono-label truncate text-[9px] uppercase tracking-[0.22em] text-foreground/85">
            {t("Branches of this exchange")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className="mono-label rounded-full px-1.5 text-[8px] uppercase tracking-[0.14em] leading-[1.6] text-[var(--scope-a,var(--gd))]"
            style={{ border: "1px solid color-mix(in srgb, var(--scope-a, var(--gd)) 48%, transparent)" }}
          >
            {chipCount}
          </span>
          <ChevronDown
            className={`size-3.5 text-foreground/80 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            data-testid="reply-branches-panel"
          >
            <div className="flex flex-wrap gap-1.5 pt-2.5">
        {(branches ?? []).map((b, i) =>
          b.type === "pause" ? (
            /* the seventh movement — rest here, integrate; not a click */
            <div
              key={`${b.type}-${i}`}
              role="note"
              aria-label={t("Pause & integrate")}
              className="max-w-full rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--scope-a,var(--gd))_44%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,var(--glass-bg))] px-3 py-1.5"
              data-testid="reply-branch-pause"
            >
              <span className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] leading-[1.6] text-[var(--scope-a,var(--gd))]">
                {t("Pause & integrate")}
              </span>
              <span className="align-middle text-[12px] italic leading-[1.5] text-foreground/90">
                {b.question}
              </span>
            </div>
          ) : (
            <button
              key={`${b.type}-${i}`}
              type="button"
              onClick={() => pick(b.question)}
              disabled={disabled}
              aria-disabled={disabled}
              data-testid="reply-branch-chip"
              title={b.reason ? `${b.question} — ${b.reason}` : b.question}
              className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_52%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground shadow-[0_1px_10px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_50%,transparent)] backdrop-blur-xl transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,var(--glass-bg))] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
            >
              <span
                className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] not-italic leading-[1.6] text-[var(--scope-a,var(--gd))]"
                style={{
                  border:
                    "1px solid color-mix(in srgb, var(--scope-a, var(--gd)) 46%, transparent)",
                }}
              >
                {t(BRANCH_TYPE_LABELS[b.type])}
              </span>
              {b.question}
            </button>
          )
        )}

        {showFallback &&
          fallback.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              disabled={disabled}
              aria-disabled={disabled}
              data-testid="reply-branch-chip"
              title={s}
              className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_44%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground/90 backdrop-blur-xl transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_62%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,var(--glass-bg))] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
            >
              {t(s)}
            </button>
          ))}
            </div>

            {/* the way to the living tree — one quiet step inside the
                dropdown, never parked where the chips used to wait */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => driftTreeTo(branchFor(kind))}
                aria-label={t("Find them on the tree")}
                data-testid="reply-branches-hub"
                className="mono-label flex items-center gap-1.5 rounded-full px-2 py-1 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
              >
                <ListTree className="size-3" aria-hidden="true" />
                {t("Find them on the tree")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
