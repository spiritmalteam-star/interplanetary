"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ListTree } from "lucide-react";
import { chatSuggestionPools, type PoolId } from "@/lib/data/suggestions-pools";
import { contextVocabulary, scoreSuggestion } from "@/lib/suggestion-resonance";
import type { BranchId } from "@/lib/data/suggestion-tree";
import {
  BRANCH_TYPE_LABELS,
  driftTreeTo,
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
export type BranchThread = Mode | "forge" | "os" | "px" | "em";

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
            : (kind as PoolId);
  return chatSuggestionPools[poolId] ?? [];
}

export function ReplyBranches({
  message,
  kind,
  active,
  disabled,
  onPick,
  contextQuery,
  askFn,
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
}) {
  const t = useT();
  const askMirror = useMirror((s) => s.askMirror);
  const attachBranches = useMirror((s) => s.attachBranches);

  /* the instant stand-in — the pool's closest whispers to THIS reply
     alone, so the foot is never empty while the engine thinks */
  const fallback = useMemo(() => {
    const pool = poolFor(kind);
    if (!message.text || pool.length === 0) return [] as string[];
    /* the reply's own breath is the context — closer than the whole
       thread ever is: this is what makes these branches more
       connected to the context than the tree's standing whispers */
    const vocab = contextVocabulary(
      `${contextQuery ?? message.query}\n${message.text}`.slice(-1800)
    );
    const seen = new Set(loadSeen().map((s) => s.toLowerCase()));
    return pool
      .map((s, i) => ({ s, i, score: scoreSuggestion(s, vocab) }))
      .filter((x) => x.score > 0 && !seen.has(x.s.toLowerCase()))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, 3)
      .map((x) => x.s);
  }, [message.text, message.query, contextQuery, kind]);

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
            seen: loadSeen().slice(0, 24),
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
  }, [active, message.id, message.text, message.query, message.branches, kind, contextQuery, attachBranches]);

  const branches = message.branches;
  /* nothing to stand on yet and nothing grown — the foot rests empty */
  const showFallback = !branches || branches.length === 0;
  if (!branches && fallback.length === 0) return null;
  if (branches && branches.length === 0 && fallback.length === 0) return null;

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
      className="mt-5 border-t pt-4 first-letter:content-['']"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a) 22%, transparent)",
      }}
      data-testid="reply-branches"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
          {t("Branches of this exchange")}
        </span>
        <button
          type="button"
          onClick={() => driftTreeTo(branchFor(kind))}
          aria-label={t("Find them on the tree")}
          title={t("Find them on the tree")}
          data-testid="reply-branches-hub"
          className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] hover:text-foreground"
        >
          <ListTree className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(branches ?? []).map((b, i) =>
          b.type === "pause" ? (
            /* the seventh movement — rest here, integrate; not a click */
            <div
              key={`${b.type}-${i}`}
              role="note"
              aria-label={t("Pause & integrate")}
              className="max-w-full rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--gd)_30%,transparent)] bg-[color-mix(in_srgb,var(--gd)_5%,transparent)] px-3 py-1.5"
              data-testid="reply-branch-pause"
            >
              <span className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] leading-[1.6] text-[var(--gd)]">
                {t("Pause & integrate")}
              </span>
              <span className="align-middle text-[12px] italic leading-[1.5] text-foreground/80">
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
              className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--gd)_32%,transparent)] bg-[var(--glass-bg)] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground/85 backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
            >
              <span
                className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] not-italic leading-[1.6] text-[var(--gd)]"
                style={{
                  border:
                    "1px solid color-mix(in srgb, var(--gd) 30%, transparent)",
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
              className="focus-glow max-w-full rounded-full border hairline bg-[var(--glass-bg)] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
            >
              {t(s)}
            </button>
          ))}
      </div>
    </motion.div>
  );
}
