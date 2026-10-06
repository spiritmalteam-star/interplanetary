"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Compass,
  Feather,
  FlaskConical,
  Microscope,
  RefreshCw,
  ScrollText,
  StickyNote,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SuggestionTree } from "./SuggestionTree";
import { ReplyBranches } from "./ReplyBranches";
import { emGatheringPhrases, emVectors } from "@/lib/data/evolvemed";
import { emNoteSets } from "@/lib/data/scope-notes";
import { cn } from "@/lib/utils";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import { ListenButton } from "./ListenButton";
import { ScopeNotes } from "./ScopeNotes";
import { WorldNewChat } from "./WorldNewChat";
import { WindowSelect } from "./WindowSelect";
import { useFloatingBarAutoHide } from "./useFloatingBar";
import { HelixLoading } from "./ThemedLoadings";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";
import { RevelationProse, RevelationSections } from "./RevelationBody";
import {
  EM_VECTOR_ICONS,
  EmCodexTab,
  EmCopyButton,
  EmInstrumentsTab,
  EmPdfButton,
  EmVectorsTab,
} from "./EvolveMedChambers";

type EmPlace = "chat" | "vectors" | "instruments" | "codex";

/** em vector window id → the living tree's Evolve Med scope key (the
    window "genome" is the tree's "genomics"; the rest speak alike). */
const EM_VECTOR_TO_TREE: Record<string, string> = {
  genome: "genomics",
  engines: "engines",
  medworld: "medworld",
  interface: "interface",
};

/** The visitor line an em reply answered — the exchange's first half. */
function emVisitorBefore(
  arr: { role: "visitor" | "em"; text: string }[],
  idx: number
): string {
  for (let i = idx - 1; i >= 0; i--)
    if (arr[i].role === "visitor") return arr[i].text;
  return "";
}

const EM_PLACES: {
  id: Exclude<EmPlace, "chat">;
  label: string;
  icon: typeof Compass;
}[] = [
  { id: "vectors", label: "Vectors", icon: Compass },
  { id: "instruments", label: "Instruments", icon: FlaskConical },
  { id: "codex", label: "Codex", icon: ScrollText },
];

/* Every chamber of the nexus gathered behind one quiet button — the
   tools no longer sprawl as a row of circles across the top. */
const EM_TOOL_ITEMS: { id: EmPlace; name: string; icon: typeof Compass }[] = [
  { id: "chat", name: "The Nexus", icon: Activity },
  ...EM_PLACES.map(({ id, label, icon }) => ({ id, name: label, icon })),
];

/* --------------------------- the emblem ---------------------------- */

/** Evolve Med's mark: a living helix — two strands crossing around
    one axis, the digital and the biological breathing together. */
function EmEmblem({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="size-full text-[var(--scope-a)]">
        {/* the two strands of the helix */}
        <g className="em-helix" style={{ transformOrigin: "32px 32px" }}>
          <path
            d="M22 8 C42 20 22 44 42 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M42 8 C22 20 42 44 22 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* the rungs — the meeting places of the strands */}
          <line x1="26" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <line x1="24" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <line x1="26" y1="50" x2="38" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        </g>
        {/* the four vectors — one quiet dot for each, at the compass points */}
        <circle cx="32" cy="3.5" r="1.4" fill="currentColor" opacity="0.8" />
        <circle cx="60.5" cy="32" r="1.4" fill="currentColor" opacity="0.55" />
        <circle cx="32" cy="60.5" r="1.4" fill="currentColor" opacity="0.8" />
        <circle cx="3.5" cy="32" r="1.4" fill="currentColor" opacity="0.55" />
      </svg>
    </span>
  );
}

/* --------------------------- the thinking -------------------------- */

function EmThinking() {
  const t = useT();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % emGatheringPhrases.length),
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
      <HelixLoading className="size-16 text-foreground sm:size-20" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phraseIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="font-serif text-[14px] italic text-muted-foreground"
        >
          {t(emGatheringPhrases[phraseIdx])}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------- one exchange ---------------------------- */

/* ---------- the crystallized image — one visual block per exchange --- */

/** The visualization slot of one nexus exchange: the pending animation,
    the atelier-quiet fallback with one retry, the prepared-prompt
    fallback, or the completed card — the same idiom as the OS line. */
function EmVisualBlock({
  messageId,
  visualRequest,
  accent,
  testIdPrefix,
}: {
  messageId: string;
  visualRequest?: string;
  accent: string;
  testIdPrefix: string;
}) {
  const t = useT();
  const askEMVisual = useMirror((s) => s.askEMVisual);
  const artifact = useMirror(
    (s) => s.emMessages.find((m) => m.id === messageId)?.artifact
  );
  const visual = useMirror(
    (s) => s.emMessages.find((m) => m.id === messageId)?.visual
  );

  if (visual === "pending" && artifact) {
    return (
      <VisualizationCard
        artifact={artifact}
        accent={accent}
        testIdPrefix={testIdPrefix}
        regenerating
      />
    );
  }
  if (visual === "pending") {
    return <VisualizationPending accent={accent} testIdPrefix={testIdPrefix} />;
  }
  if (visual === "error") {
    return (
      <div
        className="glass rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_65%,transparent)] px-4 py-3.5"
        data-testid={`${testIdPrefix}-error`}
      >
        <p className="text-[14px] italic leading-relaxed text-foreground/80">
          {t(
            "The atelier is quiet — the vision could not be composed. Rest a breath, then ask again."
          )}
        </p>
        {visualRequest && (
          <button
            type="button"
            onClick={() => void askEMVisual(visualRequest)}
            data-testid={`${testIdPrefix}-retry`}
            className="focus-glow mt-2.5 flex h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_35%,transparent)] px-4 text-[13px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t("Be still and receive")}
          </button>
        )}
      </div>
    );
  }
  if (!artifact) return null;
  if (!artifact.imageUrl && artifact.slides.length === 0) {
    return (
      <PreparedPromptFallback
        artifact={artifact}
        accent={accent}
        testIdPrefix={testIdPrefix}
        onPaint={() =>
          void askEMVisual(visualRequest ?? artifact.subject, undefined, {
            id: messageId,
            request: visualRequest ?? artifact.subject,
            prompt: artifact.prompt,
            subject: artifact.subject,
            mode: artifact.mode,
          })
        }
      />
    );
  }
  return (
    <VisualizationCard
      artifact={artifact}
      accent={accent}
      testIdPrefix={testIdPrefix}
      onRegenerate={() =>
        void askEMVisual(visualRequest ?? artifact.subject, undefined, {
          id: messageId,
          request: visualRequest ?? artifact.subject,
          prompt: artifact.prompt,
          subject: artifact.subject,
          mode: artifact.mode,
        })
      }
    />
  );
}

function EmExchange({
  role,
  text,
  formulas,
  sections,
  seal,
  animate,
  index,
  hasVisual,
  messageId,
  visualRequest,
}: {
  role: "visitor" | "em";
  text: string;
  formulas?: string[];
  sections?: { heading: string; body: string }[];
  seal?: string;
  animate: boolean;
  index: number;
  hasVisual?: boolean;
  messageId?: string;
  visualRequest?: string;
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
        <p className="max-w-[78%] rounded-2xl rounded-br-md border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)] px-4 py-2.5 text-[15px] leading-relaxed text-foreground/90">
          {text}
        </p>
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
      data-testid={`em-answer-${index}`}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
        aria-hidden="true"
      >
        <Activity className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">EVOLVE MED</p>
        {hasVisual && messageId ? (
          <div className="mt-1.5">
            {text.trim() && (
              <div className="rounded-2xl rounded-tl-md glass px-4 py-3">
                <RevelationProse text={text} />
              </div>
            )}
            <RevelationSections sections={sections} className="mt-2.5" />
            <EmVisualBlock
              messageId={messageId}
              visualRequest={visualRequest}
              accent="var(--scope-a)"
              testIdPrefix="em-visual"
            />
          </div>
        ) : (
          <>
            <div className="mt-1.5 rounded-2xl rounded-tl-md glass px-4 py-3">
              <RevelationProse text={text} />
            </div>

            <RevelationSections sections={sections} className="mt-2.5" />

            {formulaList.length > 0 && (
              <div className="px-formula relative mt-2.5 overflow-hidden rounded-xl px-4 py-3" data-testid={`em-formulas-${index}`}>
                <span
                  aria-hidden="true"
                  className="px-seam absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--scope-a), transparent)",
                  }}
                />
                <p className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  <Microscope className="size-3" aria-hidden="true" />
                  {t("The mechanisms that run it")}
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
                cacheKey={`em-${text.slice(0, 24)}-${text.length}-${index}`}
                voice="regent"
                className="shrink-0 whitespace-nowrap"
              />
              <EmCopyButton text={`${text}\n\n${formulaList.join("\n")}`} />
              <EmPdfButton />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------- the vector's note stickers --------------------- */

/** The pinned cluster of one vector's notes, resolved for the thread. */
function EmNotesBlock({ vectorId }: { vectorId: string }) {
  const set = emNoteSets[vectorId];
  const vector = emVectors.find((v) => v.id === vectorId);
  if (!set || !vector) return null;
  return (
    <ScopeNotes glyph={vector.glyph} name={vector.name} notes={set.notes} />
  );
}

/** The four vector windows as one quiet drop-down — press it, choose
    the vector, and the directive routes AND the vector's notes pin
    into the conversation. Shared by the empty state and the quiet
    re-invitation above the composer. The chat keeps its air. */
function EmWindowPills({ centered = false }: { centered?: boolean }) {
  const emVector = useMirror((s) => s.emVector);
  const setEmVector = useMirror((s) => s.setEmVector);
  const pinEmNotes = useMirror((s) => s.pinEmNotes);
  return (
    <WindowSelect
      items={emVectors.map((vector) => ({
        id: vector.id,
        name: vector.name,
        tagline: vector.tagline,
        icon: EM_VECTOR_ICONS[vector.id] ?? Activity,
      }))}
      activeId={emVector}
      placeholder="Choose a vector window"
      onSelect={(id) => {
        /* route the directive AND pin the vector's
           notes into the conversation — both, in one touch */
        setEmVector(id);
        pinEmNotes(id);
      }}
      testIdPrefix="em-window"
      centered={centered}
    />
  );
}

/* --------------------------- the core chat -------------------------- */

function EvolveMedChat() {
  const emMessages = useMirror((s) => s.emMessages);
  const emStatus = useMirror((s) => s.emStatus);
  const emError = useMirror((s) => s.emError);
  const emDraft = useMirror((s) => s.emDraft);
  const setEmDraft = useMirror((s) => s.setEmDraft);
  const askEM = useMirror((s) => s.askEM);
  const askEMVisual = useMirror((s) => s.askEMVisual);
  const emVector = useMirror((s) => s.emVector);
  const setEmVector = useMirror((s) => s.setEmVector);
  const emFusion = useMirror((s) => s.emFusion);
  const setEmFusion = useMirror((s) => s.setEmFusion);
  const pinEmNotes = useMirror((s) => s.pinEmNotes);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* the channeling branch — the exchanges' own grown branches */
  const emChanneling = useMemo(
    () =>
      [...emMessages]
        .reverse()
        .find((m) => m.role === "em" && m.branches?.length)?.branches,
    [emMessages]
  );

  /* the tree scope keys that lead the Evolve Med branch — the active
     vector window (and its fusions) stand at the branch's tip */
  const emTreeScopes = useMemo(() => {
    const keys: string[] = [];
    const push = (id: string | null) => {
      if (!id) return;
      const key = EM_VECTOR_TO_TREE[id];
      if (key && !keys.includes(key)) keys.push(key);
    };
    push(emVector);
    for (const id of emFusion) push(id);
    return keys;
  }, [emVector, emFusion]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  /* The thread opens at its BEGINNING: mounting or reopening the chat
     never scrolls away from the first words. New turns settle at the
     top of the view — the same law as the quantum world. */
  const baseline = useRef({
    len: emMessages.length,
    status: emStatus,
    error: emError,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const grew = emMessages.length !== b.len;
    const startedLoading =
      !b.fresh && emStatus === "loading" && b.status !== "loading";
    baseline.current = {
      len: emMessages.length,
      status: emStatus,
      error: emError,
      fresh: false,
    };
    if (b.fresh) {
      if (emStatus === "loading") {
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
  }, [emMessages.length, emStatus, emError]);

  /* auto-resize composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [emDraft]);

  const canSend = emDraft.trim().length > 0 && emStatus !== "loading";

  const submit = () => {
    const query = emDraft.trim();
    if (!query || emStatus === "loading") return;
    /* IMAGE CRYSTALLIZATION — an image is asked for by name: the last
       channel (the nexus's most recent revelation) crystallizes at
       once, shaped by the visitor's words; with an empty thread, the
       words themselves crystallize. */
    if (isVisualIntent(query)) {
      const lastReply =
        [...emMessages]
          .reverse()
          .find((m) => m.role === "em" && m.text.trim())?.text ?? "";
      void askEMVisual(blendVisualRequest(query, lastReply), query);
      return;
    }
    void askEM(query);
  };

  /* The active route: one vector, or a melted pair. */
  const activeVector = emVector
    ? emVectors.find((s) => s.id === emVector) ?? null
    : null;
  const fusionPair = emFusion
    .map((id) => emVectors.find((s) => s.id === id))
    .filter((s): s is (typeof emVectors)[number] => Boolean(s));
  const hasWindow = Boolean(activeVector) || fusionPair.length === 2;

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
        {emMessages.length === 0 && emStatus === "idle" && !emError ? (
          <div className="flex h-full flex-col py-6 text-center">
            <div className="my-auto flex w-full flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="dream-halo relative flex size-16 items-center justify-center"
              >
                <EmEmblem className="size-16" />
              </motion.div>
              <p className="scope-gradient-text mt-4 text-[17px] font-semibold">
                {t("The biocompiler is online")}
              </p>
              <p className="mx-auto mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Bring a directive — an intention, a therapeutic goal, an archive to keep — and Evolve Med compiles it into a living blueprint, routed across the four vector windows, in prose and in the mechanisms that run the living machine."
                )}
              </p>

              {/* the four vector windows — one drop-down, more chat */}
              <div className="mt-5 flex justify-center">
                <EmWindowPills centered />
              </div>
            </div>
          </div>
        ) : (
          <>
            {emMessages.map((m, i) => (
              <div
                key={m.id}
                ref={
                  i === emMessages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
              >
                {m.notesVector ? (
                  <EmNotesBlock vectorId={m.notesVector} />
                ) : (
                  <EmExchange
                    role={m.role}
                    text={m.text}
                    formulas={m.formulas}
                    sections={m.sections}
                    seal={m.seal}
                    animate={i === emMessages.length - 1 && emStatus !== "loading"}
                    index={i}
                    hasVisual={Boolean(m.artifact || m.visual)}
                    messageId={m.id}
                    visualRequest={m.visualRequest}
                  />
                )}
                {/* the branches of this exchange — connected with the
                    Evolve Med branch of the living tree */}
                {m.role === "em" &&
                  m.text.trim() &&
                  !m.notesVector &&
                  !m.artifact &&
                  !m.visual && (
                    <div className="mt-1 pl-11">
                      <ReplyBranches
                        message={m}
                        kind="em"
                        active={
                          i === emMessages.length - 1 && emStatus !== "loading"
                        }
                        disabled={emStatus === "loading"}
                        onPick={() => {}}
                        contextQuery={emVisitorBefore(emMessages, i)}
                        askFn={(q) => {
                          if (emStatus !== "loading") void askEM(q);
                        }}
                      />
                    </div>
                  )}
              </div>
            ))}
            {emStatus === "loading" && (
              <div
                ref={(node) => {
                  loadingRef.current = node;
                }}
                className="pl-11"
              >
                <EmThinking />
              </div>
            )}
            {emStatus === "error" && emError && (
              <div className="ml-11 rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3">
                <p className="text-[14.5px] leading-relaxed text-foreground/85">
                  {t("Evolve Med could not finish the revealing.")}
                </p>
                <p className="mt-1 text-[14px] italic text-muted-foreground">
                  {emError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* the active vector line — sits above the composer while talking */}
      {hasWindow && (
        <div className="shrink-0 px-3 pt-2 sm:px-5">
          <div className="mx-auto flex w-full max-w-[720px] flex-wrap items-center gap-1.5">
            {activeVector && (
              <span
                className="mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] uppercase tracking-[0.18em] text-foreground/80"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 40%, transparent)",
                }}
                data-testid="em-active-vector"
              >
                <Activity className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
                {t(activeVector.name)}
                <button
                  type="button"
                  onClick={() => pinEmNotes(activeVector.id)}
                  aria-label={t("Show the window's notes")}
                  title={t("Show the window's notes")}
                  data-testid="em-experience-active"
                  className="focus-glow rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <StickyNote className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEmVector(null)}
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
                data-testid="em-active-fusion"
              >
                {t(fusionPair[0].name)} × {t(fusionPair[1].name)}
                <button
                  type="button"
                  onClick={() => setEmFusion([])}
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

      {/* the quiet re-invitation — the conversation alive, no vector
          open: the drop-down waits right above the composer */}
      {!hasWindow && emMessages.length > 0 && (
        <div className="shrink-0 px-3 pt-1.5 sm:px-5">
          <EmWindowPills />
        </div>
      )}

      {/* the living tree — the Evolve Med branch only, resting on the
          active vector window, drifting to what is spoken */}
      <div className="shrink-0 px-3 pb-1 sm:px-5">
        <SuggestionTree
          focusBranch="evolvemed"
          /* THE CATEGORIZATION LAW: the branches of suggestions belong
             to the kategory we are at — Evolve Med only. */
          lockedBranch="evolvemed"
          prioritizeScopes={emTreeScopes}
          contextText={emMessages
            .slice(-6)
            .map((m) => m.text)
            .join("\n")}
          onPick={(q) => {
            if (emStatus !== "loading") void askEM(q);
          }}
          disabled={emStatus === "loading"}
          testIdPrefix="em-suggestion"
          channeling={emChanneling}
          transmitting={emStatus === "loading"}
        />
      </div>

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
            <label htmlFor="em-query" className="sr-only">
              {t("Ask Evolve Med")}
            </label>
            <textarea
              id="em-query"
              ref={textareaRef}
              rows={1}
              value={emDraft}
              onChange={(e) => setEmDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("Ask Evolve Med…")}
              className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("Send to Evolve Med")}
              data-testid="em-send"
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

export function EvolveMed() {
  const exitEvolveMed = useMirror((s) => s.exitEvolveMed);
  const setEmVector = useMirror((s) => s.setEmVector);
  const pinEmNotes = useMirror((s) => s.pinEmNotes);
  const [place, setPlace] = useState<EmPlace>("chat");
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
      className="scope-evolvemed relative flex h-full flex-col"
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
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={exitEvolveMed}
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
              items={EM_TOOL_ITEMS}
              activeId={place}
              placeholder="Tools"
              onSelect={(id) => setPlace(id as EmPlace)}
              testIdPrefix="em-tools"
              triggerClassName="bg-[var(--glass-bg)]/80 backdrop-blur-xl"
              onOpenChange={setToolsOpen}
            />
          </div>

          <div className="pointer-events-auto flex shrink-0 items-center gap-2">
            <WorldNewChat world="evolvemed" />
          </div>
        </div>
      </header>

      {/* ---------- the nexus — reaching the very top of the world ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-3 pb-5 sm:px-5">
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              place === "chat" ? "pt-1.5 sm:pt-2" : "pt-16 sm:pt-20"
            )}
          >
            {place === "chat" ? (
              <EvolveMedChat />
            ) : (
              <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                <motion.div
                  key={place}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="pb-8"
                >
                  {/* return to the nexus */}
                  <div className="mb-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPlace("chat")}
                      className="focus-glow group flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_30%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_7%,transparent)] px-3.5 text-[13.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a)_50%,transparent)]"
                    >
                      <Activity className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                      {t("Back to the Nexus")}
                    </button>
                  </div>

                  {place === "vectors" && (
                    <EmVectorsTab
                      onOpenInNexus={(vectorId) => {
                        if (vectorId) {
                          setEmVector(vectorId);
                          pinEmNotes(vectorId);
                        }
                        setPlace("chat");
                      }}
                    />
                  )}
                  {place === "instruments" && <EmInstrumentsTab />}
                  {place === "codex" && <EmCodexTab />}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
