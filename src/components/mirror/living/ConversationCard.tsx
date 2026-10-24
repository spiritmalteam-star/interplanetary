"use client";

/* ------------------------------------------------------------------ */
/*  THE LIVING CONVERSATION NODE — a branch becomes the conversation.  */
/*                                                                     */
/*  Three honest representations share one node:                       */
/*    · the compact chip — a collapsed conversation resting in the     */
/*      tree (its whole thread sleeps in the living ledger);           */
/*    · the focused card — the branch's tab, the Mirror's words, the   */
/*      visitor's composer, the follow-up branches growing around it;  */
/*    · the deep scene — a 2D/3D companion risen inside the card.      */
/*                                                                     */
/*  Only the focused card carries expensive content; the rest of the   */
/*  tree stays feather-light. The card's words are the Mirror's own —  */
/*  this node renders them, never rewrites them.                       */
/* ------------------------------------------------------------------ */

import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Hammer,
  LoaderCircle,
  Minimize2,
  Music2,
  ScrollText,
  Send,
  Share2,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useConversations, askBranchRoom, type BranchTurn } from "@/lib/branch-conversations";
import { useMirror } from "@/lib/mirror-store";
import { ENERGY_NOTICE, EnergyError } from "@/lib/speak-client";
import { isVisualIntent } from "@/lib/visual-intent";
import { detectArtifactIntent } from "@/lib/artifact-intent";
import { CREATION_ACCENTS } from "@/lib/navigator-graph";
import { useSequentialReveal } from "@/components/mirror/ResonantCardViewer";
import { MirrorChanneling, SCOPE_CHANNELING } from "@/components/mirror/MirrorChanneling";
import { ListenButton } from "@/components/mirror/ListenButton";
import { CreationReveal } from "@/components/mirror/CreationReveal";
import { SideArtifact } from "@/components/mirror/ChatArtifacts";
import { VisualizationCard } from "@/components/mirror/VisualizationCard";
import { VisualPanel } from "./VisualPanel";
import { NavDensity } from "./navContext";
import type { NavNode } from "@/lib/navigator-graph";

/* --------------------------- small helpers -------------------------- */

const CHANNELING_BY_CATEGORY: Record<string, keyof typeof SCOPE_CHANNELING> = {
  interplanetary: "interplanetary",
  healing: "healing",
  quantum: "quantum",
  evolvemed: "evolvemed",
  invent: "forge",
  manifesting: "mirroros",
  artx: "artx",
};

function accentMix(a: string, pct: number, fallback: string): string {
  if (a.startsWith("var(")) return fallback;
  return `color-mix(in srgb, ${a} ${pct}%, transparent)`;
}

function dispatchNav(name: string, detail: { id: string }) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/* ------------------------- the copy/share hands --------------------- */

function AnswerHand({ text, testId }: { text: string; testId: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    const clean = text.trim();
    if (!clean) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clean);
      } else {
        throw new Error("no clipboard");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = clean;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [text]);

  const share = useCallback(async () => {
    const clean = text.trim();
    if (!clean) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("A word from the mirror"), text: clean });
        return;
      } catch {
        return;
      }
    }
    void copy();
  }, [text, t, copy]);

  return (
    <span className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void copy();
        }}
        aria-label={t("Copy")}
        title={t("Copy")}
        data-testid={`${testId}-copy`}
        className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
      >
        {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void share();
        }}
        aria-label={t("Share this transmission")}
        title={t("Share this transmission")}
        data-testid={`${testId}-share`}
        className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
      >
        <Share2 className="size-3" aria-hidden="true" />
      </button>
    </span>
  );
}

/* ------------------------------ the chip ---------------------------- */

function CompactChip({
  nodeId,
  title,
  accent,
  turns,
  failed,
}: {
  nodeId: string;
  title: string;
  accent: string;
  turns: number;
  failed: boolean;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        dispatchNav("nav:conv-open", { id: nodeId });
      }}
      data-testid="nav-conv-chip"
      data-status={failed ? "failed" : "resting"}
      aria-label={t("Return to this conversation")}
      title={t("Return to this conversation")}
      className="nav-conv-chip group relative flex max-w-[268px] flex-col rounded-[14px] border p-2.5 text-left transition-[box-shadow,border-color] duration-300 hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)]"
      style={
        {
          "--na": accent,
          borderColor: accentMix(accent, 34, "var(--hairline)"),
          background: `linear-gradient(160deg, ${accentMix(accent, 10, "transparent")} 0%, var(--background) 62%)`,
        } as CSSProperties
      }
    >
      <Handle type="target" position={Position.Top} className="nav-handle" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className="nav-handle" isConnectable={false} />
      <span className="flex items-center gap-1.5">
        <i
          aria-hidden="true"
          className={cn("size-[5px] shrink-0 rounded-full", failed && "nav-conv-failed-dot")}
          style={{ backgroundColor: failed ? "#f43f5e" : accent }}
        />
        <span
          className="mono-label shrink-0 text-[7.5px] uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {t("room")}
        </span>
        <span className="mono-label ml-auto shrink-0 text-[7.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {turns > 1 ? `×${turns}` : ""}
        </span>
      </span>
      <span className="mt-1 line-clamp-2 break-words text-[12px] leading-[16px] text-foreground/90">
        {title}
      </span>
    </button>
  );
}

/* ------------------------- one turn of the room --------------------- */

function TurnAnswer({
  convId,
  turn,
  index,
  accent,
  testIdPrefix,
  isBranchAnswer,
}: {
  convId: string;
  turn: BranchTurn;
  index: number;
  accent: string;
  testIdPrefix: string;
  isBranchAnswer: boolean;
}) {
  const t = useT();
  const stage = useSequentialReveal(
    `${convId}:${index}`,
    isBranchAnswer && turn.status === "landed"
  );
  const showAnswer = isBranchAnswer ? stage >= 1 : turn.status === "landed";
  const showHands = isBranchAnswer ? stage >= 3 : turn.status === "landed";
  const channelingVariant =
    CHANNELING_BY_CATEGORY[
      useConversations.getState().convs[convId]?.category ?? "interplanetary"
    ] ?? "interplanetary";

  if (turn.status === "loading" || turn.status === "pending") {
    return (
      <div className="conv-rise py-3 text-muted-foreground" data-testid={`${testIdPrefix}-turn-loading`}>
        <MirrorChanneling
          label={t("Channeling")}
          variant={SCOPE_CHANNELING[channelingVariant] ?? "orbs"}
          className="mono-label text-[10px] uppercase tracking-[0.22em]"
        />
      </div>
    );
  }

  if (turn.status === "failed") {
    const energy = turn.energy || turn.error === ENERGY_NOTICE;
    return (
      <div
        role="alert"
        data-testid={`${testIdPrefix}-turn-error`}
        className={cn(
          "conv-rise my-1.5 rounded-2xl border px-3.5 py-3",
          energy
            ? "border-[color-mix(in_srgb,#f59e0b_38%,transparent)] bg-[color-mix(in_srgb,#f59e0b_7%,var(--background))]"
            : "border-[color-mix(in_srgb,#f43f5e_38%,transparent)] bg-[color-mix(in_srgb,#f43f5e_7%,var(--background))]"
        )}
      >
        <p
          className={cn(
            "mono-label text-[9px] uppercase tracking-[0.2em]",
            energy ? "text-[#b8860b] dark:text-[#f59e0b]" : "text-[#f43f5e]"
          )}
        >
          {t("The transmission could not cross")}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
          {turn.error || t("The field is quiet — speak once more")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(isBranchAnswer ? "" : "conv-rise", "min-w-0")}
      data-testid={`${testIdPrefix}-turn-answer`}
    >
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-[13.5px] leading-[1.72] text-foreground/92",
          isBranchAnswer && "font-[family-name:var(--font-literata)]"
        )}
        style={{ opacity: showAnswer ? 1 : 0, transition: "opacity 480ms ease" }}
      >
        {turn.a}
      </p>
      {showHands && (
        <div className="mt-1 flex items-center justify-end gap-1">
          <AnswerHand text={turn.a} testId={`${testIdPrefix}-turn-${index}`} />
          <ListenButton
            text={turn.a}
            cacheKey={`conv:${convId}:${index}`}
            variant="icon"
          />
        </div>
      )}
      {/* the making, risen inside the conversation */}
      {turn.status === "landed" && (turn.artifact || turn.side) && (
        <CreationReveal
          signature={`${turn.side?.kind ?? "visual"}-${turn.messageId ?? `${convId}:${index}`}`}
          testIdPrefix={`${testIdPrefix}-making`}
        >
          {turn.side && !turn.artifact ? (
            <SideArtifact
              kind={turn.side.kind}
              resonance={turn.side.resonance}
              resume={turn.side.resume}
              themes={turn.side.themes}
              tool={turn.side.tool}
            />
          ) : turn.artifact ? (
            <VisualizationCard
              artifact={turn.artifact}
              accent={accent}
              testIdPrefix={`${testIdPrefix}-visual`}
            />
          ) : null}
        </CreationReveal>
      )}
    </div>
  );
}

/* -------------------- the making's own doors ----------------------- */

const MAKING_DOORS = [
  { kind: "book", icon: BookOpen, label: "Create a book" },
  { kind: "akashic", icon: ScrollText, label: "Open an Akashic record" },
  { kind: "music", icon: Music2, label: "Create music" },
  { kind: "invent", icon: Hammer, label: "Invent" },
] as const;

/** THE CONSTELLATION'S SEED — a making born of this conversation:
 *  the artifact node hangs connected to the branch in the map, its
 *  editing tools wait in their own workspace (directive 11/12). */
function MakingDoors({ nodeId, accent }: { nodeId: string; accent: string }) {
  const t = useT();
  return (
    <div
      className="flex items-center gap-1 border-t px-3 pb-1.5 pt-1.5"
      style={{ borderColor: accentMix(accent, 12, "var(--hairline)") }}
      data-testid="nav-conv-making-doors"
    >
      <span className="mono-label shrink-0 text-[7.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
        {t("Grow a making")}
      </span>
      <span className="flex flex-1 items-center justify-end gap-0.5">
        {MAKING_DOORS.map((d) => {
          const doorAccent = CREATION_ACCENTS[d.kind];
          return (
            <button
              key={d.kind}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent<{ id: string; kind: string }>("nav:conv-create", {
                    detail: { id: nodeId, kind: d.kind },
                  })
                );
              }}
              aria-label={t(d.label)}
              title={t(d.label)}
              data-testid={`nav-conv-create-${d.kind}`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-all duration-200 hover:text-foreground"
              style={{
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${doorAccent} 26%, transparent)`,
              }}
            >
              <d.icon className="size-3" aria-hidden="true" style={{ color: doorAccent, opacity: 0.85 }} />
            </button>
          );
        })}
      </span>
    </div>
  );
}

/* --------------------------- the focused card ----------------------- */

function FocusedBody({
  nodeId,
  convId,
  title,
  accent,
}: {
  nodeId: string;
  convId: string;
  title: string;
  accent: string;
}) {
  const t = useT();
  const conv = useConversations((s) => s.convs[convId]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const sigRef = useRef<string>("");

  /* the newest word pulls the eye — quiet, only when the thread grows.
     When a turn LANDS the card's own rectangle changes shape: the
     navigator hears of it (once, debounced) so the camera can reframe
     and the neighbors can keep their honest distances. THE STREAM LAW —
     only the landing of a turn fires the news, never the words arriving
     (the graph never relayouts while the mirror is speaking). */
  useEffect(() => {
    const turns = conv?.turns ?? [];
    const len = turns.length;
    const lastStatus = turns[len - 1]?.status ?? "";
    const lastLen = turns[len - 1]?.a.length ?? 0;
    const sig = `${len}:${lastStatus}:${lastLen}`;
    const prev = sigRef.current;
    if (prev === sig) return;
    sigRef.current = sig;
    if (!prev) return; // the first reading never wakes the canvas
    /* the words themselves still pull the eye while they arrive */
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    /* but only a landed turn (or a new question) changes the card's
       rectangle enough to deserve the canvas's ear */
    const [pLen, pStatus] = prev.split(":");
    const landed =
      len > Number(pLen) ||
      (lastStatus === "landed" && pStatus !== "landed");
    if (!landed) return;
    const timer = window.setTimeout(
      () => dispatchNav("nav:conv-resize", { id: nodeId }),
      220
    );
    return () => window.clearTimeout(timer);
  }, [conv, nodeId]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? draft).trim();
      const c = useConversations.getState().convs[convId];
      if (!text || busy || !c || liveLikeLoading(c)) return;
      /* a making rides the whole channel — it becomes its own branch,
         exactly as every making always has */
      if (detectArtifactIntent(text) || isVisualIntent(text)) {
        setDraft("");
        dispatchNav("nav:conv-channel-ask", { id: text });
        return;
      }
      const index = c.turns.length;
      const prior = c.turns
        .slice(1)
        .filter((turn) => turn.a && turn.status === "landed")
        .map(({ q, a }) => ({ q, a }));
      useConversations.getState().pushTurn(convId, text);
      setDraft("");
      setBusy(true);
      try {
        const reply = await askBranchRoom(c, text, prior);
        useConversations.getState().patchTurn(convId, index, {
          a: reply,
          status: "landed",
        });
      } catch (err) {
        useConversations.getState().patchTurn(convId, index, {
          status: "failed",
          a: "",
          error: err instanceof Error && err.message ? err.message : "",
          energy: err instanceof EnergyError,
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, convId, draft]
  );

  const onTaKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      void send();
    }
    e.stopPropagation();
  };

  if (!conv) return null;
  const branchAnswer = conv.turns[0];
  const followUps = conv.turns.slice(1);
  const lastLanded = [...conv.turns].reverse().find((x) => x.status === "landed" && x.a);
  const turnLoading = conv.turns.some((x) => x.status === "loading" || x.status === "pending");
  const composerDisabled = busy || turnLoading;

  return (
    <div
      className="nav-conv-card nodrag relative flex flex-col overflow-hidden rounded-2xl border"
      style={
        {
          "--na": accent,
          width: "min(560px, calc(100vw - 40px))",
          borderColor: accentMix(accent, 40, "var(--hairline-hover)"),
          background:
            "linear-gradient(172deg, var(--background) 30%, color-mix(in srgb, var(--background) 88%, transparent) 100%)",
          boxShadow: `0 0 0 1px ${accentMix(accent, 26, "transparent")}, 0 26px 60px -32px rgba(0,0,0,0.6)`,
        } as CSSProperties
      }
      data-testid="nav-conv-card"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Handle type="target" position={Position.Top} className="nav-handle" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className="nav-handle" isConnectable={false} />

      {/* THE TAB — the branch's own name, wearing its own color */}
      <div
        className="flex items-start gap-2 border-b px-4 pb-2.5 pt-3"
        style={{
          borderColor: accentMix(accent, 22, "var(--hairline)"),
          background: `linear-gradient(150deg, ${accentMix(accent, 13, "transparent")}, transparent 78%)`,
        }}
        data-testid="nav-conv-tab"
      >
        <i
          aria-hidden="true"
          className="mt-[7px] size-[6px] shrink-0 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accentMix(accent, 70, "transparent")}` }}
        />
        <div className="min-w-0 flex-1">
          <p
            className="line-clamp-2 break-words font-[family-name:var(--font-literata)] italic text-[14px] leading-[19px] text-foreground"
          >
            {title}
          </p>
          <p
            className="mono-label mt-1 text-[7.5px] uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            {t("a living conversation")}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dispatchNav("nav:conv-collapse", { id: nodeId });
          }}
          aria-label={t("Rest this conversation back into the tree")}
          title={t("Rest this conversation back into the tree")}
          data-testid="nav-conv-collapse"
          className="focus-glow mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <Minimize2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* THE THREAD — the branch's living content */}
      <div
        ref={scrollRef}
        className="nowheel nopan nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        style={{ maxHeight: "min(46vh, 430px)" }}
        data-testid="nav-conv-thread"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {branchAnswer && (
          <TurnAnswer
            convId={convId}
            turn={branchAnswer}
            index={0}
            accent={accent}
            testIdPrefix="nav-conv-branch"
            isBranchAnswer
          />
        )}
        {followUps.map((turn, i) => (
          <div key={`${convId}:${i + 1}`} className="mt-3 border-t pt-2.5" style={{ borderColor: accentMix(accent, 14, "var(--hairline)") }}>
            <p className="mb-1.5 flex items-start gap-1.5 text-[12.5px] italic leading-snug text-foreground/75">
              <i aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
              <span className="break-words">{turn.q}</span>
            </p>
            <TurnAnswer
              convId={convId}
              turn={turn}
              index={i + 1}
              accent={accent}
              testIdPrefix={`nav-conv-turn-${i + 1}`}
              isBranchAnswer={false}
            />
          </div>
        ))}
      </div>

      {/* THE SCENE — a 2D/3D companion for the words */}
      {lastLanded && (
        <div className="px-4 pb-1">
          <VisualPanel
            text={lastLanded.a}
            accent={accent}
            testIdPrefix="nav-conv"
            nodeId={nodeId}
          />
        </div>
      )}

      {/* THE COMPOSER — the branch listens back */}
      <div
        className="border-t px-3 py-2.5"
        style={{ borderColor: accentMix(accent, 18, "var(--hairline)") }}
        data-testid="nav-conv-composer"
      >
        <div className="flex items-end gap-1.5">
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            onKeyDown={onTaKeyDown}
            onFocus={(e) => {
              e.stopPropagation();
              dispatchNav("nav:conv-resize", { id: nodeId });
            }}
            rows={1}
            disabled={composerDisabled}
            placeholder={t("Speak within this branch…")}
            aria-label={t("Speak within this branch…")}
            data-testid="nav-conv-input"
            className="nowheel nopan nodrag max-h-[120px] min-h-[36px] w-full flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-[13px] leading-snug text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-foreground/25 disabled:opacity-55"
            style={{ borderColor: accentMix(accent, 26, "var(--hairline)") }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void send();
            }}
            disabled={composerDisabled || !draft.trim()}
            aria-label={t("Send")}
            title={t("Send")}
            data-testid="nav-conv-send"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border text-foreground transition-all duration-200 hover:bg-foreground/5 disabled:opacity-40"
            style={{ borderColor: accentMix(accent, 40, "var(--hairline)") }}
          >
            {busy ? (
              <LoaderCircle className="nav-spin size-3.5" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {/* THE MAKING'S OWN DOORS — books, records, music, inventions:
          each hangs its artifact node connected to this conversation */}
      {branchAnswer?.status === "landed" && (
        <MakingDoors nodeId={nodeId} accent={accent} />
      )}
    </div>
  );
}

function liveLikeLoading(c: { turns: { status: string }[] }): boolean {
  return c.turns.some((x) => x.status === "loading" || x.status === "pending");
}

/* ---------------------------- the node ------------------------------ */

export const ConversationNode = memo(function ConversationNode({
  id,
  data,
}: NodeProps<NavNode>) {
  const convId = typeof data.convId === "string" ? data.convId : null;
  const active = useConversations((s) => (convId ? s.activeConvId === convId : false));
  const dense = useContext(NavDensity);
  const turnsCount = useConversations((s) => {
    if (!convId) return 0;
    const c = s.convs[convId];
    return c ? c.turns.length : 0;
  });
  const failed = useConversations((s) => {
    if (!convId) return false;
    const c = s.convs[convId];
    return !!c && c.turns.some((x) => x.status === "failed");
  });

  if (!convId) {
    /* a stray node without its ledger — rest it as a quiet chip */
    return (
      <CompactChip
        nodeId={id}
        title={String(data.text ?? "")}
        accent={String(data.accent ?? "var(--gd)")}
        turns={0}
        failed={false}
      />
    );
  }

  if (!active || dense) {
    return (
      <CompactChip
        nodeId={id}
        title={String(data.text ?? "")}
        accent={String(data.accent ?? "var(--gd)")}
        turns={turnsCount}
        failed={failed}
      />
    );
  }

  return (
    <FocusedBody
      nodeId={id}
      convId={convId}
      title={String(data.text ?? "")}
      accent={String(data.accent ?? "var(--gd)")}
    />
  );
});
