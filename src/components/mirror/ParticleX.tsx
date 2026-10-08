"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Atom,
  CircleAlert,
  Dna,
  Feather,
  FlaskConical,
  History,
  RotateCcw,
  ScrollText,
  StickyNote,
  Telescope,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SuggestionTree } from "./SuggestionTree";
import { ReplyBranches, branchChipsLive } from "./ReplyBranches";
import { pxGatheringPhrases, pxScopes } from "@/lib/data/particlex";
import { pxNoteSets } from "@/lib/data/scope-notes";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";
import { ScopeNotes } from "./ScopeNotes";
import { WorldNewChat } from "./WorldNewChat";
import { ChatHistoryPanel } from "./ChatHistoryPanel";
import { QuantumLoading } from "./ThemedLoadings";
import { PxBioMech } from "./PxBioMech";
import { RevelationProse, RevelationSections } from "./RevelationBody";
import { WindowSelect } from "./WindowSelect";
import { useFloatingBarAutoHide } from "./useFloatingBar";
import {
  PxCodexTab,
  PxCopyButton,
  PxPdfButton,
  PxScopesTab,
  PxToolsTab,
  PX_SCOPE_ICONS,
} from "./ParticleXChambers";

type PxPlace = "chat" | "biomech" | "scopes" | "tools" | "codex";

/** px scope window id → the living tree's quantum scope key (the two
    taxonomies grew apart: the window "quantum" is the tree's "reality",
    the window "mycelia" is the tree's "mycelial"). */
const PX_SCOPE_TO_TREE: Record<string, string> = {
  formulas: "formulas",
  perception: "perception",
  emotions: "emotions",
  belief: "belief",
  quantum: "reality",
  parallel: "parallel",
  mycelia: "mycelial",
  vibration: "vibration",
};

/** The visitor line a px reply answered — the exchange's first half. */
function pxVisitorBefore(
  arr: { role: "visitor" | "px"; text: string }[],
  idx: number
): string {
  for (let i = idx - 1; i >= 0; i--)
    if (arr[i].role === "visitor") return arr[i].text;
  return "";
}

const PX_PLACES: {
  id: Exclude<PxPlace, "chat">;
  label: string;
  icon: typeof Telescope;
}[] = [
  { id: "biomech", label: "Bio Mechanics", icon: Dna },
  { id: "scopes", label: "Scopes", icon: Telescope },
  { id: "tools", label: "Tools", icon: FlaskConical },
  { id: "codex", label: "Codex", icon: ScrollText },
];

/* Every chamber of the quantum world gathered behind one quiet button —
   the tools no longer sprawl as a row of circles across the top. */
const PX_TOOL_ITEMS: { id: PxPlace; name: string; icon: typeof Telescope }[] = [
  { id: "chat", name: "The Core", icon: Atom },
  ...PX_PLACES.map(({ id, label, icon }) => ({ id, name: label, icon })),
];

/* --------------------------- the emblem ---------------------------- */

/** ParticleX's mark: one center, two orbiting rings — the linear and
    the non-linear reasoning circling the same quantum heart. */
function PxEmblem({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-full text-[var(--scope-a)]">
        <circle cx="32" cy="32" r="2.6" fill="currentColor" />
        <g className="px-orbit-a" style={{ transformOrigin: "32px 32px" }}>
          <ellipse
            cx="32"
            cy="32"
            rx="26"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.65"
          />
          <circle cx="58" cy="32" r="1.7" fill="currentColor" />
        </g>
        <g className="px-orbit-b" style={{ transformOrigin: "32px 32px" }}>
          <g transform="rotate(62 32 32)">
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 5"
              opacity="0.4"
            />
            <circle cx="6" cy="32" r="1.4" fill="currentColor" />
          </g>
        </g>
      </svg>
    </span>
  );
}

/* --------------------------- the thinking -------------------------- */

function PxThinking() {
  const t = useT();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % pxGatheringPhrases.length),
      3400
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-2.5"
      aria-live="polite"
      aria-busy="true"
    >
      <QuantumLoading className="size-16 text-foreground sm:size-20" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phraseIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="font-serif text-[14px] italic text-muted-foreground"
        >
          {t(pxGatheringPhrases[phraseIdx])}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- one exchange ---------------------------- */

function PxExchange({
  role,
  text,
  formulas,
  sections,
  seal,
  animate,
  index,
  messageId,
  failed,
  retryDisabled,
}: {
  role: "visitor" | "px";
  text: string;
  formulas?: string[];
  sections?: { heading: string; body: string }[];
  seal?: string;
  animate: boolean;
  index: number;
  messageId?: string;
  /** the transmission never landed — the question stays, dimmed, one
      touch from being sent again */
  failed?: boolean;
  retryDisabled?: boolean;
}) {
  const t = useT();

  if (role === "visitor") {
    return (
      <motion.div
        initial={{ opacity: animate ? 0 : 1, y: animate ? 8 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animate ? 0.4 : 0, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-end"
      >
        <p
          className={cn(
            "max-w-[78%] rounded-2xl rounded-br-md border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)] px-4 py-2.5 text-[15px] leading-relaxed text-foreground/90",
            failed && "opacity-70"
          )}
        >
          {text}
        </p>
        {failed && messageId && (
          <div
            data-testid="failed-msg"
            className="mt-1.5 flex max-w-[78%] flex-wrap items-center justify-end gap-1.5"
          >
            <span className="mono-label flex items-center gap-1 rounded-full border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-2 py-1 text-[9.5px] text-muted-foreground">
              <CircleAlert
                className="size-3 text-[var(--destructive)]"
                aria-hidden="true"
              />
              {t("Not delivered — the field was quiet")}
            </span>
            <button
              type="button"
              data-testid="retry-failed"
              disabled={retryDisabled}
              onClick={() => useMirror.getState().retryFailed("px", messageId)}
              className="focus-glow flex items-center gap-1 rounded-full border hairline px-2.5 py-1 text-[11px] text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              {t("Send again")}
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  const formulaList = formulas ?? [];

  return (
    <motion.div
      initial={{ opacity: animate ? 0 : 1, y: animate ? 10 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3"
      data-testid={`px-answer-${index}`}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
        aria-hidden="true"
      >
        <Atom className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">PARTICLEX</p>
        <div className="mt-1.5 rounded-2xl rounded-tl-md glass px-4 py-3">
          <RevelationProse text={text} />
        </div>

        <RevelationSections sections={sections} className="mt-2.5" />

        {formulaList.length > 0 && (
          <div className="px-formula relative mt-2.5 overflow-hidden rounded-xl px-4 py-3" data-testid={`px-formulas-${index}`}>
            <span
              aria-hidden="true"
              className="px-seam absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--scope-a), transparent)",
              }}
            />
            <p className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              <Atom className="size-3" aria-hidden="true" />
              {t("The formulas that run it")}
            </p>
            <div className="mt-2 space-y-1.5">
              {formulaList.map((f, i) => (
                <p
                  key={i}
                  className="px-formula-line text-center font-serif text-[15.5px] italic leading-relaxed text-foreground/90"
                >
                  {f}
                </p>
              ))}
            </div>
          </div>
        )}

        {seal && (
          <p className="ink-soft mt-2.5 text-center font-serif text-[14px] italic">
            {seal}
          </p>
        )}

        <div className="mt-2 flex flex-nowrap items-center gap-1.5 sm:gap-2">
          <ListenButton
            text={`${text}. ${formulaList.join(". ")}`}
            cacheKey={`px-${text.slice(0, 24)}-${text.length}-${index}`}
            voice="regent"
            className="shrink-0 whitespace-nowrap"
          />
          <PxCopyButton text={`${text}\n\n${formulaList.join("\n")}`} />
          <PxPdfButton />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------- the window's note stickers -------------------- */

/** The pinned cluster of one window's notes, resolved for the thread. */
function PxNotesBlock({ scopeId }: { scopeId: string }) {
  const set = pxNoteSets[scopeId];
  const scope = pxScopes.find((s) => s.id === scopeId);
  if (!set || !scope) return null;
  return <ScopeNotes glyph={scope.glyph} name={scope.name} notes={set.notes} />;
}

/** The eight window pills as one quiet drop-down — press it, choose
    the window, and the scope orients AND its notes pin into the
    conversation. Shared by the empty state and the quiet
    re-invitation above the composer. The chat keeps its air. */
function PxWindowPills({ centered = false }: { centered?: boolean }) {
  const pxScope = useMirror((s) => s.pxScope);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  return (
    <WindowSelect
      items={pxScopes.map((scope) => ({
        id: scope.id,
        name: scope.name,
        tagline: scope.tagline,
        icon: PX_SCOPE_ICONS[scope.id] ?? Atom,
      }))}
      activeId={pxScope}
      placeholder="Choose a window"
      onSelect={(id) => {
        /* orient the scope AND pin the window's notes
           into the conversation — both, in one touch */
        setPxScope(id);
        pinPxNotes(id);
      }}
      testIdPrefix="px-window"
      centered={centered}
    />
  );
}

/* --------------------------- the core chat -------------------------- */

function ParticleXChat() {
  const pxMessages = useMirror((s) => s.pxMessages);
  const pxStatus = useMirror((s) => s.pxStatus);
  const pxError = useMirror((s) => s.pxError);
  const pxDraft = useMirror((s) => s.pxDraft);
  const setPxDraft = useMirror((s) => s.setPxDraft);
  const askPX = useMirror((s) => s.askPX);
  const pxScope = useMirror((s) => s.pxScope);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pxFusion = useMirror((s) => s.pxFusion);
  const setPxFusion = useMirror((s) => s.setPxFusion);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* the channeling branch — the exchanges' own grown branches */
  const pxChanneling = useMemo(
    () =>
      [...pxMessages]
        .reverse()
        .find((m) => m.role === "px" && m.branches?.length)?.branches,
    [pxMessages]
  );

  /* the tree scope keys that lead the quantum branch — the active
     scope window (and its fusions) stand at the branch's tip */
  const pxTreeScopes = useMemo(() => {
    const keys: string[] = [];
    const push = (id: string | null) => {
      if (!id) return;
      const key = PX_SCOPE_TO_TREE[id];
      if (key && !keys.includes(key)) keys.push(key);
    };
    push(pxScope);
    for (const id of pxFusion) push(id);
    return keys;
  }, [pxScope, pxFusion]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  /* The thread opens at its BEGINNING: mounting or reopening the chat
     never scrolls away from the first words. New turns settle at the
     top of the view — the same law as the manifesting line. */
  const baseline = useRef({
    len: pxMessages.length,
    status: pxStatus,
    error: pxError,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const grew = pxMessages.length !== b.len;
    const startedLoading =
      !b.fresh && pxStatus === "loading" && b.status !== "loading";
    baseline.current = {
      len: pxMessages.length,
      status: pxStatus,
      error: pxError,
      fresh: false,
    };
    if (b.fresh) {
      if (pxStatus === "loading") {
        loadingRef.current?.scrollIntoView({ block: "start" });
      }
      return;
    }
    if (grew) {
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (startedLoading) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pxMessages.length, pxStatus, pxError]);

  /* auto-resize composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [pxDraft]);

  const canSend = pxDraft.trim().length > 0 && pxStatus !== "loading";

  const submit = () => {
    const query = pxDraft.trim();
    if (!query || pxStatus === "loading") return;
    void askPX(query);
  };

  /* The active window: one scope, or a melted pair. */
  const activeScope = pxScope
    ? pxScopes.find((s) => s.id === pxScope) ?? null
    : null;
  const fusionPair = pxFusion
    .map((id) => pxScopes.find((s) => s.id === id))
    .filter((s): s is (typeof pxScopes)[number] => Boolean(s));
  const hasWindow = Boolean(activeScope) || fusionPair.length === 2;

  /* THE SCOPE LAW — the branches belong only to the window this thread
     stands in: the active scope (and its fusion) ride with every ask. */
  const scopeHint =
    [activeScope?.name, ...fusionPair.map((s) => s.name)]
      .filter(Boolean)
      .join(" + ") || null;

  /* THE BRANCHES' OWN FLOOR — when the latest landed reply carries
     branches, they are the conversation's only suggestions: the living
     tree stands down so just the branches speak. */
  const branchesOwnFloor = useMemo(() => {
    const last = [...pxMessages]
      .reverse()
      .find((m) => m.role === "px" && m.text.trim() && !m.notesScope);
    if (!last) return false;
    return branchChipsLive(
      "px",
      last,
      pxVisitorBefore(pxMessages, pxMessages.indexOf(last))
    );
  }, [pxMessages]);

  return (
    <div className="scope-frame-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <div
        className="animate-line-breathe h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* thread — it reaches the very top of the world, sliding beneath
          the floating controls */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pb-5 pt-16 sm:px-5 sm:pt-[72px]"
      >
        {pxMessages.length === 0 && pxStatus === "idle" && !pxError ? (
          <div className="flex h-full flex-col py-6 text-center">
            <div className="my-auto flex w-full flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="dream-halo relative flex size-16 items-center justify-center"
              >
                <PxEmblem className="size-16" />
              </motion.div>
              <p className="scope-gradient-text mt-4 text-[17px] font-semibold">
                {t("The quantum narrator is listening")}
              </p>
              <p className="mx-auto mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Ask anything it is possible for us to know — ParticleX answers from the Mirror Entity alone, in prose and in the formulas that run reality."
                )}
              </p>

              {/* the eight scope windows — one drop-down, more chat */}
              <div className="mt-5 flex justify-center">
                <PxWindowPills centered />
              </div>
            </div>
          </div>
        ) : (
          <>
            {pxMessages.map((m, i) => (
              <div
                key={m.id}
                ref={
                  i === pxMessages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
              >
                {m.notesScope ? (
                  <PxNotesBlock scopeId={m.notesScope} />
                ) : (
                  <PxExchange
                    role={m.role}
                    text={m.text}
                    formulas={m.formulas}
                    sections={m.sections}
                    seal={m.seal}
                    animate={i === pxMessages.length - 1 && pxStatus !== "loading"}
                    index={i}
                    messageId={m.id}
                    failed={m.failed}
                    retryDisabled={pxStatus === "loading"}
                  />
                )}
                {/* the branches of this exchange — connected with the
                    quantum branch of the living tree */}
                {m.role === "px" &&
                  m.text.trim() &&
                  !m.notesScope && (
                    <div className="mt-1 pl-11">
                      <ReplyBranches
                        message={m}
                        kind="px"
                        active={
                          i === pxMessages.length - 1 && pxStatus !== "loading"
                        }
                        disabled={pxStatus === "loading"}
                        onPick={() => {}}
                        contextQuery={pxVisitorBefore(pxMessages, i)}
                        scopeHint={scopeHint}
                        askFn={(q) => {
                          if (pxStatus !== "loading") void askPX(q);
                        }}
                      />
                    </div>
                  )}
              </div>
            ))}
            {pxStatus === "loading" && (
              <div
                ref={(node) => {
                  loadingRef.current = node;
                }}
                className="pl-11"
              >
                <PxThinking />
              </div>
            )}
            {pxStatus === "error" && pxError && (
              <div className="ml-11 rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3">
                <p className="text-[14.5px] leading-relaxed text-foreground/85">
                  {t("ParticleX could not finish the revealing.")}
                </p>
                <p className="mt-1 text-[14px] italic text-muted-foreground">
                  {pxError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* the active window line — sits above the composer while talking */}
      {hasWindow && (
        <div className="shrink-0 px-3 pt-2 sm:px-5">
          <div className="mx-auto flex w-full max-w-[720px] flex-wrap items-center gap-1.5">
            {activeScope && (
              <span
                className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
                data-testid="px-active-scope"
              >
                <Atom className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
                {t(activeScope.name)}
                <button
                  type="button"
                  onClick={() => pinPxNotes(activeScope.id)}
                  aria-label={t("Show the window's notes")}
                  title={t("Show the window's notes")}
                  data-testid="px-experience-active"
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <StickyNote className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPxScope(null)}
                  aria-label={t("Clear the scope")}
                  title={t("Clear the scope")}
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
            {fusionPair.length === 2 && (
              <span
                className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
                data-testid="px-active-fusion"
              >
                {t(fusionPair[0].name)} × {t(fusionPair[1].name)}
                <button
                  type="button"
                  onClick={() => setPxFusion([])}
                  aria-label={t("Let the windows separate")}
                  title={t("Let the windows separate")}
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* the quiet re-invitation — the conversation alive, no window
          open: the drop-down waits right above the composer */}
      {!hasWindow && pxMessages.length > 0 && (
        <div className="shrink-0 px-3 pt-1.5 sm:px-5">
          <PxWindowPills />
        </div>
      )}

      {/* the living tree — the quantum branch only, resting on the
          active scope window, drifting to what is spoken. It stands
          down whenever this exchange's own branches hold the floor. */}
      {!branchesOwnFloor && (
      <div className="shrink-0 px-3 pb-1 sm:px-5">
        <SuggestionTree
          focusBranch="quantum"
          /* THE CATEGORIZATION LAW: the branches of suggestions belong
             to the kategory we are at — quantum only. */
          lockedBranch="quantum"
          prioritizeScopes={pxTreeScopes}
          contextText={pxMessages
            .slice(-6)
            .map((m) => m.text)
            .join("\n")}
          onPick={(q) => {
            if (pxStatus !== "loading") void askPX(q);
          }}
          disabled={pxStatus === "loading"}
          testIdPrefix="px-suggestion"
          channeling={pxChanneling}
          transmitting={pxStatus === "loading"}
        />
      </div>
      )}

      {/* composer */}
      <div className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto w-full max-w-[800px]"
        >
          <div className="glass-strong flex items-end gap-2 rounded-[18px] p-1.5 pl-3.5 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow-sm">
            <label htmlFor="px-query" className="sr-only">
              {t("Ask ParticleX")}
            </label>
            <textarea
              id="px-query"
              ref={textareaRef}
              rows={1}
              value={pxDraft}
              onChange={(e) => setPxDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("Ask ParticleX…")}
              className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("Send to ParticleX")}
              data-testid="px-send"
              className="focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Feather className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------------- the shell ------------------------------ */

export function ParticleX() {
  const exitParticleX = useMirror((s) => s.exitParticleX);
  const setPxScope = useMirror((s) => s.setPxScope);
  const pinPxNotes = useMirror((s) => s.pinPxNotes);
  const [place, setPlace] = useState<PxPlace>("chat");
  const [historyOpen, setHistoryOpen] = useState(false);
  const t = useT();

  /* the reading bar law — the floating controls sink away with the
     stillness or the downward flow, rise at the first upward breath */
  const worldRootRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLElement | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const topBarHidden = useFloatingBarAutoHide({
    rootRef: worldRootRef,
    barRef: topBarRef,
    hold: toolsOpen,
  });

  return (
    <div
      ref={worldRootRef}
      className="scope-particlex relative flex h-full flex-col"
    >
      {/* ---------- floating top controls over the chat — back, every
          chamber behind one tools button, and the fresh hand — they
          sink away as the visitor reads and rise when reached for ---------- */}
      <header
        ref={topBarRef}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[var(--background)]/85 via-[var(--background)]/30 to-transparent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          topBarHidden ? "invisible -translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className="bar-safe flex items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={exitParticleX}
            className="focus-glow pointer-events-auto group flex h-9 shrink-0 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)]/80 px-3 text-[14px] font-medium text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          {/* every tool in one button */}
          <div className="pointer-events-auto flex min-w-0 items-center">
            <WindowSelect
              items={PX_TOOL_ITEMS}
              activeId={place}
              placeholder="Tools"
              onSelect={(id) => setPlace(id as PxPlace)}
              testIdPrefix="px-tools"
              triggerClassName="bg-[var(--glass-bg)]/80 backdrop-blur-xl"
              onOpenChange={setToolsOpen}
            />
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={t("Your conversations")}
              title={t("Your conversations")}
              onClick={() => setHistoryOpen(true)}
              className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <History className="size-4" aria-hidden="true" />
            </button>
            <WorldNewChat world="quantum" />
          </div>
        </div>
      </header>

      {/* ---------- the core — reaching the very top of the world ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-3 pb-5 sm:px-5">
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              place === "chat" ? "pt-1.5 sm:pt-2" : "pt-16 sm:pt-20"
            )}
          >
            {place === "chat" ? (
              <ParticleXChat />
            ) : (
              <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                <motion.div
                  key={place}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="pb-8"
                >
                  {/* return to the core */}
                  <div className="mb-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPlace("chat")}
                      className="focus-glow group flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_30%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_7%,transparent)] px-3.5 text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a)_50%,transparent)]"
                    >
                      <Atom className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                      {t("Back to the Core")}
                    </button>
                  </div>

                  {place === "biomech" && <PxBioMech />}
                  {place === "scopes" && (
                    <PxScopesTab
                      onOpenInCore={(scopeId) => {
                        if (scopeId) {
                          setPxScope(scopeId);
                          pinPxNotes(scopeId);
                        }
                        setPlace("chat");
                      }}
                    />
                  )}
                  {place === "tools" && <PxToolsTab />}
                  {place === "codex" && <PxCodexTab />}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* the conversation shelf — every past chat, kept on this device */}
      <ChatHistoryPanel
        surface="px"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
