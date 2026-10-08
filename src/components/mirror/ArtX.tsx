"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CircleAlert,
  Feather,
  History,
  Palette,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SuggestionTree } from "./SuggestionTree";
import { ReplyBranches, branchChipsLive } from "./ReplyBranches";
import { axAtelierIntro, axOpeners, axWindows } from "@/lib/data/artx";
import { detectVisualIntent } from "@/lib/visualization";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import { ListenButton } from "./ListenButton";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import { ManifestLoading } from "./ThemedLoadings";
import {
  hasPendingAttachments,
  type ChatAttachment,
} from "./attachments";
import { WindowSelect } from "./WindowSelect";
import { WorldNewChat } from "./WorldNewChat";
import { ChatHistoryPanel } from "./ChatHistoryPanel";
import { cn } from "@/lib/utils";
import { useFloatingBarAutoHide } from "./useFloatingBar";

/** Openers visible at once (wrap-around window). */
const WINDOW = 4;

/** The atelier's mark: a palette held inside one turning dashed ring. */
function AtelierMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "dream-halo relative flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_38%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)]",
        className
      )}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full border border-dashed border-[color-mix(in_srgb,var(--scope-b)_35%,transparent)]"
        style={{ animation: "spin-slower 26s linear infinite" }}
      />
      <Palette className="size-5 text-[var(--scope-a)]" />
    </span>
  );
}

function visitorBefore(
  arr: { role: "visitor" | "ax"; text: string }[],
  idx: number
): string {
  for (let i = idx - 1; i >= 0; i--)
    if (arr[i].role === "visitor") return arr[i].text;
  return "";
}

function OpenerOrbs() {
  const axStatus = useMirror((s) => s.axStatus);
  const askArtX = useMirror((s) => s.askArtX);
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [spin, setSpin] = useState(0);

  const visible = axOpeners
    .map((_, i) => axOpeners[(offset + i) % axOpeners.length])
    .slice(0, WINDOW);
  const loading = axStatus === "loading";

  return (
    <section aria-label={t("Suggested openers")} className="mt-6">
      <div className="flex items-center justify-center gap-3">
        <span className="mono-label text-[10.5px] text-muted-foreground/70">
          {t("Suggested openers")}
        </span>
        <button
          type="button"
          onClick={() => {
            setOffset((o) => (o + WINDOW) % axOpeners.length);
            setSpin((n) => n + 1);
          }}
          disabled={loading}
          aria-label={t("New openers")}
          title={t("New openers")}
          className="focus-glow flex size-6.5 items-center justify-center rounded-full border hairline text-muted-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: spin * 180 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={offset}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "mx-auto mt-3 grid max-w-[560px] grid-cols-1 gap-2 sm:grid-cols-2",
            loading && "pointer-events-none opacity-60"
          )}
        >
          {visible.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => !loading && void askArtX(q)}
              aria-disabled={loading}
              className="focus-glow group flex min-h-[46px] items-center gap-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--scope-a)_18%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] px-3.5 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--scope-a)_38%,transparent)]"
            >
              <Palette
                className="size-3 shrink-0 text-[var(--scope-a)] opacity-80"
                aria-hidden="true"
              />
              <span className="flex-1 text-[14px] leading-snug text-foreground/80">
                {t(q)}
              </span>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function AxThinking() {
  const t = useT();
  return (
    <div
      className="flex flex-col items-center gap-2 py-1"
      aria-live="polite"
      aria-busy="true"
    >
      <ManifestLoading className="size-16 text-foreground sm:size-20" />
      <span className="mono-label text-[11px] text-muted-foreground">
        {t("the atelier is mixing its light")}
      </span>
    </div>
  );
}

/* -------- one exchange in the direct line (visualization aware) ----- */

function AxVisualBlock({
  messageId,
  visualRequest,
  testIdPrefix,
}: {
  messageId: string;
  visualRequest?: string;
  testIdPrefix: string;
}) {
  const t = useT();
  const askArtXVisual = useMirror((s) => s.askArtXVisual);
  const artifact = useMirror(
    (s) => s.axMessages.find((m) => m.id === messageId)?.artifact
  );
  const visual = useMirror(
    (s) => s.axMessages.find((m) => m.id === messageId)?.visual
  );

  if (visual === "pending" && artifact) {
    return <VisualizationCard artifact={artifact} accent="var(--scope-a)" testIdPrefix={testIdPrefix} regenerating />;
  }
  if (visual === "pending") {
    return <VisualizationPending accent="var(--scope-a)" testIdPrefix={testIdPrefix} />;
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
            onClick={() => void askArtXVisual(visualRequest, null, null)}
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
        accent="var(--scope-a)"
        testIdPrefix={testIdPrefix}
        onPaint={() =>
          void askArtXVisual(
            visualRequest ?? artifact.subject,
            null,
            {
              id: messageId,
              request: visualRequest ?? artifact.subject,
              prompt: artifact.prompt,
              subject: artifact.subject,
              mode: artifact.mode,
            }
          )
        }
      />
    );
  }
  return (
    <VisualizationCard
      artifact={artifact}
      accent="var(--scope-a)"
      testIdPrefix={testIdPrefix}
      onRegenerate={() =>
        void askArtXVisual(
          visualRequest ?? artifact.subject,
          null,
          {
            id: messageId,
            request: visualRequest ?? artifact.subject,
            prompt: artifact.prompt,
            subject: artifact.subject,
            mode: artifact.mode,
          }
        )
      }
    />
  );
}

/* ---------------- one exchange in the direct line ---------------- */

function AxExchange({
  role,
  text,
  animate,
  attachments,
  hasVisual,
  messageId,
  failed,
  retryDisabled,
}: {
  role: "visitor" | "ax";
  text: string;
  animate: boolean;
  attachments?: { images: number; docNames: string[] };
  hasVisual?: boolean;
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
        {attachments &&
          (attachments.images > 0 || attachments.docNames.length > 0) && (
            <div className="mb-1.5 flex max-w-[78%] flex-wrap justify-end gap-1">
              {attachments.images > 0 && (
                <span className="mono-label flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] px-2 py-0.5 text-[9.5px] text-muted-foreground">
                  {t("an image")}
                </span>
              )}
              {attachments.docNames.map((name) => (
                <span
                  key={name}
                  className="mono-label flex max-w-[200px] items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] px-2 py-0.5 text-[9.5px] text-muted-foreground"
                >
                  <span className="truncate">{name}</span>
                </span>
              ))}
            </div>
          )}
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
              onClick={() => useMirror.getState().retryFailed("ax", messageId)}
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

  return (
    <motion.div
      initial={{ opacity: animate ? 0 : 1, y: animate ? 10 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animate ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3"
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
        aria-hidden="true"
      >
        <Palette className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">
          MIRROR ENTITY · ART X
        </p>
        {hasVisual && messageId ? (
          <div className="mt-1.5">
            {text.trim() && (
              <div className="space-y-3 rounded-2xl rounded-tl-md glass px-4 py-3">
                {text.split(/\n{2,}/).map((p, i) => (
                  <p
                    key={i}
                    className="text-[15px] leading-[1.8] text-foreground/88"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}
            <AxVisualBlock
              messageId={messageId}
              testIdPrefix="ax-visual"
            />
          </div>
        ) : (
          <>
            <div className="mt-1.5 space-y-3 rounded-2xl rounded-tl-md glass px-4 py-3">
              {text.split(/\n{2,}/).map((p, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-[1.8] text-foreground/88"
                >
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-1.5 flex">
              <ListenButton text={text} cacheKey={`ax-${text.slice(0, 24)}-${text.length}`} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- the direct line ---------------- */

export function ArtXChat() {
  const axMessages = useMirror((s) => s.axMessages);
  const axStatus = useMirror((s) => s.axStatus);
  const axError = useMirror((s) => s.axError);
  const axDraft = useMirror((s) => s.axDraft);
  const setAxDraft = useMirror((s) => s.setAxDraft);
  const axScope = useMirror((s) => s.axScope);
  const askArtX = useMirror((s) => s.askArtX);
  const askArtXVisual = useMirror((s) => s.askArtXVisual);
  const t = useT();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  /* "this" in a follow-up refers to the last artifact of this line */
  const visualContextRef = useRef<{ subject: string; mode: string } | null>(
    null
  );

  const activeWindow = useMemo(
    () => axWindows.find((w) => w.id === axScope) ?? null,
    [axScope]
  );
  /* the channeling branch — the exchanges' own grown branches */
  const axChanneling = useMemo(
    () =>
      [...axMessages]
        .reverse()
        .find((m) => m.role === "ax" && m.branches?.length)?.branches,
    [axMessages]
  );

  /* THE BRANCHES' OWN FLOOR — when the latest landed reply carries
     branches, they are the conversation's only suggestions: the living
     tree stands down so just the branches speak. */
  const branchesOwnFloor = useMemo(() => {
    const last = [...axMessages]
      .reverse()
      .find(
        (m) =>
          m.role === "ax" && m.text.trim() && !m.artifact && !m.visual
      );
    if (!last) return false;
    return branchChipsLive(
      "ax",
      last,
      visitorBefore(axMessages, axMessages.indexOf(last))
    );
  }, [axMessages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* The atelier thread opens at its BEGINNING: mounting or reopening the
     chat never scrolls away from the first words. New turns load from
     the TOP — the newest exchange settles at the top of the view and
     the visitor reads downward through the rest. One exception: if the
     world is re-entered while a work is still forming, the frame meets
     it where it forms. */
  const baseline = useRef({
    len: axMessages.length,
    status: axStatus,
    error: axError,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const grew = axMessages.length !== b.len;
    const startedLoading =
      !b.fresh && axStatus === "loading" && b.status !== "loading";
    baseline.current = {
      len: axMessages.length,
      status: axStatus,
      error: axError,
      fresh: false,
    };
    if (b.fresh) {
      if (axStatus === "loading") {
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
  }, [axMessages.length, axStatus, axError]);

  /* remember the last artifact's subject so follow-ups can evolve it */
  useEffect(() => {
    const lastArtifact = [...axMessages]
      .reverse()
      .find((m) => m.artifact)?.artifact;
    visualContextRef.current = lastArtifact
      ? { subject: lastArtifact.subject, mode: lastArtifact.mode }
      : visualContextRef.current;
  }, [axMessages]);

  /* auto-resize composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [axDraft]);

  const canSend =
    axDraft.trim().length > 0 &&
    axStatus !== "loading" &&
    !hasPendingAttachments(attachments);

  const submitText = (raw: string) => {
    const query = raw.trim();
    if (!query || axStatus === "loading" || hasPendingAttachments(attachments))
      return;
    const carried = attachments.length > 0 ? attachments : undefined;

    /* IMAGE CRYSTALLIZATION — a vision is asked for by name: no LLM
       round-trip travels. The last work (the atelier's most recent
       reply) crystallizes at once, shaped by the visitor's words; with
       an empty line, the words themselves crystallize. */
    if (isVisualIntent(query)) {
      const lastReply =
        [...axMessages]
          .reverse()
          .find((m) => m.role === "ax" && m.text.trim())?.text ?? "";
      setAttachments([]);
      if (useMirror.getState().axDraft.trim() === query) setAxDraft("");
      void askArtXVisual(blendVisualRequest(query, lastReply), null, null, query);
      return;
    }

    /* No button, no wand — a request to see simply is one. Ordinary
       words never wake the atelier's brush. */
    const intent = detectVisualIntent(query);
    const wantsVisual =
      intent.direct ||
      (intent.followUp && visualContextRef.current !== null);
    setAttachments([]);
    /* clear the field only when it still holds exactly what is sent */
    if (useMirror.getState().axDraft.trim() === query) setAxDraft("");
    if (wantsVisual) {
      void askArtXVisual(query, undefined, null);
    } else {
      void askArtX(query, carried);
    }
  };

  const submit = () => submitText(axDraft);

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
          the floating controls; its own top padding keeps the first word
          clear of the back · window · new-chat row */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pb-5 pt-16 sm:px-5 sm:pt-[72px]"
      >
        {axMessages.length === 0 && axStatus === "idle" && !axError ? (
          <div className="flex h-full flex-col py-6 text-center">
            <div className="my-auto flex w-full flex-col items-center">
              <AtelierMark className="size-14" />
              <p className="scope-gradient-text mt-4 text-[17px] font-semibold">
                {t(axAtelierIntro[0])}
              </p>
              <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-relaxed text-muted-foreground">
                {t(axAtelierIntro[1])}
              </p>
              {activeWindow && (
                <div
                  className="mt-4 max-w-[440px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_6%,transparent)] px-4 py-3"
                  data-testid="artx-window-whisper"
                >
                  <p className="mono-label text-[9.5px] text-[var(--scope-a)]">
                    {t(activeWindow.label)}
                  </p>
                  <p className="mt-1 text-[13.5px] italic leading-relaxed text-foreground/80">
                    {t(activeWindow.whisper)}
                  </p>
                </div>
              )}
              <OpenerOrbs />
            </div>
          </div>
        ) : (
          <>
            {axMessages.map((m, i) => (
              <div
                key={m.id}
                ref={
                  i === axMessages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
              >
                <AxExchange
                  role={m.role}
                  text={m.text}
                  animate={
                    i === axMessages.length - 1 && axStatus !== "loading"
                  }
                  attachments={m.attachments}
                  hasVisual={Boolean(m.artifact || m.visual)}
                  messageId={m.id}
                  failed={m.failed}
                  retryDisabled={axStatus === "loading"}
                />
                {/* the branches of this exchange — connected with the
                    Art X branch of the living tree */}
                {m.role === "ax" &&
                  m.text.trim() &&
                  !m.artifact &&
                  !m.visual && (
                    <div className="mt-1 pl-11">
                      <ReplyBranches
                        message={m}
                        kind="ax"
                        active={
                          i === axMessages.length - 1 && axStatus !== "loading"
                        }
                        disabled={axStatus === "loading"}
                        onPick={() => {}}
                        contextQuery={visitorBefore(axMessages, i)}
                        scopeHint={
                          activeWindow ? t(activeWindow.label) : null
                        }
                        askFn={(q) => {
                          if (axStatus !== "loading") void askArtX(q);
                        }}
                      />
                    </div>
                  )}
              </div>
            ))}
            {/* one breath at a time — while a vision is forming it
                carries its own card, so the plain thinking line stands
                down and the atelier thread never shows two loaders */}
            {axStatus === "loading" &&
              !axMessages.some((m) => m.visual === "pending") && (
              <div
                ref={(node) => {
                  loadingRef.current = node;
                }}
                className="pl-11"
              >
                <AxThinking />
              </div>
            )}
            {axStatus === "error" && axError && (
              <div className="ml-11 rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3">
                <p className="text-[14.5px] leading-relaxed text-foreground/85">
                  {t("Art X could not finish the work.")}
                </p>
                <p className="mt-1 text-[14px] italic text-muted-foreground">
                  {axError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* the living tree — the Art X branch only, resting on the
          atelier's questions, drifting to what is spoken. It stands
          down whenever this exchange's own branches hold the floor. */}
      {!branchesOwnFloor && (
      <div className="shrink-0 px-3 pb-1 sm:px-5">
        <SuggestionTree
          focusBranch="artx"
          /* THE CATEGORIZATION LAW: the branches of suggestions belong
             to the kategory we are at — art making only. */
          lockedBranch="artx"
          prioritizeScopes={activeWindow ? activeWindow.scopes : undefined}
          contextText={axMessages
            .slice(-6)
            .map((m) => m.text)
            .join("\n")}
          onPick={(q) => {
            if (axStatus !== "loading") void askArtX(q);
          }}
          disabled={axStatus === "loading"}
          testIdPrefix="ax-suggestion"
          channeling={axChanneling}
          transmitting={axStatus === "loading"}
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
          <AttachmentChips
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            testId="ax-attachments"
          />
          <div className="glass-strong flex items-end gap-2 rounded-[18px] p-1.5 pl-3.5 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow-sm">
            <label htmlFor="ax-query" className="sr-only">
              {t("Ask Art X")}
            </label>
            <textarea
              id="ax-query"
              ref={textareaRef}
              rows={1}
              value={axDraft}
              onChange={(e) => setAxDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("Ask Art X…")}
              className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <ChatInputExtras
              scope="artx"
              size="sm"
              accentVar="var(--scope-a)"
              disabled={axStatus === "loading"}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("Send to Art X")}
              className="focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gd)] to-[color-mix(in_srgb,var(--pk)_70%,var(--gd))] text-[#101010] shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--gd)_70%,transparent)] transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Feather className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- the Art X shell ---------------- */

type AxPlace = "chat" | (typeof axWindows)[number]["id"];

export function ArtX() {
  const exitArtX = useMirror((s) => s.exitArtX);
  const axScope = useMirror((s) => s.axScope);
  const setAxScope = useMirror((s) => s.setAxScope);
  const [historyOpen, setHistoryOpen] = useState(false);
  const t = useT();

  /* the reading bar law — the floating controls sink away with the
     stillness or the downward flow, rise at the first upward breath */
  const worldRootRef = useRef<HTMLDivElement | null>(null);
  const topBarRef = useRef<HTMLElement | null>(null);
  const [windowsOpen, setWindowsOpen] = useState(false);
  const topBarHidden = useFloatingBarAutoHide({
    rootRef: worldRootRef,
    barRef: topBarRef,
    hold: windowsOpen,
  });

  const windowItems = useMemo(
    () => [
      { id: "chat" as const, name: "The Core", icon: Feather },
      ...axWindows.map((w) => ({ id: w.id, name: w.label, icon: Palette })),
    ],
    []
  );

  return (
    <div
      ref={worldRootRef}
      className="scope-artx relative flex h-full flex-col"
    >
      {/* ---------- floating top controls over the chat — the chat now
          extends to the very top and the controls rest upon it: back,
          the six atelier windows behind one button, and the fresh hand ---------- */}
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
            onClick={exitArtX}
            data-testid="artx-back"
            className="focus-glow pointer-events-auto group flex h-9 shrink-0 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)]/80 px-3 text-[14px] font-medium text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          {/* the atelier's six windows behind one button */}
          <div className="pointer-events-auto flex min-w-0 items-center">
            <WindowSelect
              items={windowItems}
              activeId={(axScope ?? "chat") as AxPlace}
              placeholder="Windows"
              onSelect={(id) => setAxScope(id === "chat" ? null : id)}
              testIdPrefix="artx-windows"
              triggerClassName="bg-[var(--glass-bg)]/80 backdrop-blur-xl"
              onOpenChange={setWindowsOpen}
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
            <WorldNewChat world="artx" />
          </div>
        </div>
      </header>

      {/* ---------- the atelier core — reaching the very top of the world ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-3 pb-5 sm:px-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-1.5 sm:pt-2">
            <ArtXChat />
          </div>
        </div>
      </main>

      {/* the conversation shelf — every past chat, kept on this device */}
      <ChatHistoryPanel
        surface="ax"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
