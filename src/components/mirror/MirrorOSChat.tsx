"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Feather, Orbit, RefreshCw, RotateCcw } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ReplyBranches } from "./ReplyBranches";
import {
  BranchCanopy,
  CanopyRestStrip,
  CanopySummonButton,
} from "./BranchCanopy";
import { recordJourney } from "@/lib/learning-branches";
import { detectVisualIntent } from "@/lib/visualization";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import { ListenButton } from "./ListenButton";
import { voiceProfile } from "@/lib/voice-profiles";
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
import { cn } from "@/lib/utils";
/** Openers visible at once (wrap-around window). */
const WINDOW = 4;

/** The visitor line an os reply answered — the exchange's first half. */
function visitorBefore(
  arr: { role: "visitor" | "os"; text: string }[],
  idx: number
): string {
  for (let i = idx - 1; i >= 0; i--)
    if (arr[i].role === "visitor") return arr[i].text;
  return "";
}

function OsThinking() {
  const t = useT();
  return (
    <div
      className="flex flex-col items-center gap-2 py-1"
      aria-live="polite"
      aria-busy="true"
    >
      <ManifestLoading className="size-16 text-foreground sm:size-20" />
      <span className="mono-label text-[11px] text-muted-foreground">
        {t("the OS is refining its answer")}
      </span>
    </div>
  );
}

/* -------- one exchange in the direct line (visualization aware) ----- */

function OsVisualBlock({
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
  const askOSVisual = useMirror((s) => s.askOSVisual);
  const artifact = useMirror(
    (s) => s.osMessages.find((m) => m.id === messageId)?.artifact
  );
  const visual = useMirror(
    (s) => s.osMessages.find((m) => m.id === messageId)?.visual
  );

  if (visual === "pending" && artifact) {
    return <VisualizationCard artifact={artifact} accent={accent} testIdPrefix={testIdPrefix} regenerating />;
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
            onClick={() => void askOSVisual(visualRequest, null, null)}
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
          void askOSVisual(
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
      accent={accent}
      testIdPrefix={testIdPrefix}
      onRegenerate={() =>
        void askOSVisual(
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

function OsExchange({
  role,
  text,
  animate,
  attachments,
  hasVisual,
  messageId,
  failed,
  retryDisabled,
}: {
  role: "visitor" | "os";
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
              onClick={() => useMirror.getState().retryFailed("os", messageId)}
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
        <Orbit className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">
          MIRROR ENTITY OS
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
            <OsVisualBlock
              messageId={messageId}
              accent="var(--scope-a)"
              testIdPrefix="os-visual"
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
              <ListenButton text={text} cacheKey={`os-${text.slice(0, 24)}-${text.length}`} profile={voiceProfile("main")} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- the direct line ---------------- */

export function MirrorOSChat() {
  const osMessages = useMirror((s) => s.osMessages);
  const osStatus = useMirror((s) => s.osStatus);
  const osError = useMirror((s) => s.osError);
  const osDraft = useMirror((s) => s.osDraft);
  const setOsDraft = useMirror((s) => s.setOsDraft);
  const askOS = useMirror((s) => s.askOS);
  const askOSVisual = useMirror((s) => s.askOSVisual);
  const t = useT();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  /* THE CANOPY — the branches fill the whole chat box: standing in the
     empty room, fading when the answer arrives, summoned again by the
     button beside the input. */
  const [summoned, setSummoned] = useState(false);
  /* "this" in a follow-up refers to the last artifact of this line */
  const visualContextRef = useRef<{ subject: string; mode: string } | null>(
    null
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* The OS thread opens at its BEGINNING: mounting or reopening the
     chat never scrolls away from the first words. New turns load from
     the TOP — the newest exchange settles at the top of the view and
     the visitor reads downward through the rest. One exception: if the
     world is re-entered while a transmission is still forming, the
     frame meets it where it forms. */
  const baseline = useRef({
    len: osMessages.length,
    status: osStatus,
    error: osError,
    fresh: true,
  });

  useEffect(() => {
    const b = baseline.current;
    const grew = osMessages.length !== b.len;
    const startedLoading =
      !b.fresh && osStatus === "loading" && b.status !== "loading";
    baseline.current = {
      len: osMessages.length,
      status: osStatus,
      error: osError,
      fresh: false,
    };
    if (b.fresh) {
      if (osStatus === "loading") {
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
  }, [osMessages.length, osStatus, osError]);

  /* remember the last artifact's subject so follow-ups can evolve it */
  useEffect(() => {
    const lastArtifact = [...osMessages]
      .reverse()
      .find((m) => m.artifact)?.artifact;
    visualContextRef.current = lastArtifact
      ? { subject: lastArtifact.subject, mode: lastArtifact.mode }
      : visualContextRef.current;
  }, [osMessages]);

  /* auto-resize composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [osDraft]);

  const canSend =
    osDraft.trim().length > 0 &&
    osStatus !== "loading" &&
    !hasPendingAttachments(attachments);

  const submitText = (raw: string) => {
    const query = raw.trim();
    if (!query || osStatus === "loading" || hasPendingAttachments(attachments))
      return;
    const carried = attachments.length > 0 ? attachments : undefined;
    /* the tree steps aside as the answer begins to form */
    setSummoned(false);

    /* IMAGE CRYSTALLIZATION — an image is asked for by name: no LLM
       round-trip travels. The last channel (the OS's most recent reply)
       crystallizes at once, shaped by the visitor's words; with an
       empty line, the words themselves crystallize. */
    if (isVisualIntent(query)) {
      const lastReply =
        [...osMessages]
          .reverse()
          .find((m) => m.role === "os" && m.text.trim())?.text ?? "";
      setAttachments([]);
      if (useMirror.getState().osDraft.trim() === query) setOsDraft("");
      void askOSVisual(blendVisualRequest(query, lastReply), null, null, query);
      return;
    }

    /* No button, no wand — a request to see simply is one. Ordinary
       words never wake the atelier. */
    const intent = detectVisualIntent(query);
    const wantsVisual =
      intent.direct ||
      (intent.followUp && visualContextRef.current !== null);
    setAttachments([]);
    /* clear the field only when it still holds exactly what is sent */
    if (useMirror.getState().osDraft.trim() === query) setOsDraft("");
    if (wantsVisual) {
      void askOSVisual(
        query,
        visualContextRef.current
          ? {
              subject: visualContextRef.current.subject,
              mode: visualContextRef.current.mode as never,
            }
          : null
      );
    } else {
      void askOS(query, carried);
    }
  };

  const submit = () => submitText(osDraft);

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
          clear of the back · tools · new-chat row */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pb-5 pt-16 sm:px-5 sm:pt-[72px]"
      >
        {osMessages.length === 0 && osStatus === "idle" && !osError ? (
          /* the room belongs to the tree — the canopy stands over it */
          <div className="h-full" aria-hidden="true" />
        ) : (
          <>
            {osMessages.map((m, i) => (
              <div
                key={m.id}
                ref={
                  i === osMessages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
              >
                <OsExchange
                  role={m.role}
                  text={m.text}
                  animate={
                    i === osMessages.length - 1 && osStatus !== "loading"
                  }
                  attachments={m.attachments}
                  hasVisual={Boolean(m.artifact || m.visual)}
                  messageId={m.id}
                  failed={m.failed}
                  retryDisabled={osStatus === "loading"}
                />
                {/* the branches of this exchange — connected with the
                    manifesting branch of the living tree */}
                {m.role === "os" &&
                  m.text.trim() &&
                  !m.artifact &&
                  !m.visual && (
                    <div className="mt-1 pl-11">
                      <ReplyBranches
                        message={m}
                        kind="os"
                        active={
                          i === osMessages.length - 1 && osStatus !== "loading"
                        }
                        disabled={osStatus === "loading"}
                        onPick={() => {}}
                        contextQuery={visitorBefore(osMessages, i)}
                        askFn={(q) => {
                          if (osStatus !== "loading") void askOS(q);
                        }}
                      />
                    </div>
                  )}
              </div>
            ))}
            {/* one breath at a time — while a visualization is forming
                it carries its own card, so the plain thinking line
                stands down and the thread never shows two loaders.
                The streaming law: once the OS's own line holds words,
                the thinking line steps aside — the answer IS the
                indicator now. */}
            {osStatus === "loading" &&
              !osMessages.some((m) => m.visual === "pending") &&
              !osMessages[osMessages.length - 1]?.text?.trim() && (
              <div
                ref={(node) => {
                  loadingRef.current = node;
                }}
                className="pl-11"
              >
                <OsThinking />
              </div>
            )}
            {osStatus === "error" && osError && (
              <div className="ml-11 rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3">
                <p className="text-[14.5px] leading-relaxed text-foreground/85">
                  {t("The OS could not complete the refinement.")}
                </p>
                <p className="mt-1 text-[14px] italic text-muted-foreground">
                  {osError}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* THE BRANCH CANOPY — the living tree of this chat, filling the
          whole box: it stands in the empty room, fades when the answer
          is revealed, and is summoned again beside the input. */}
      <BranchCanopy
        category="manifesting"
        open={
          osMessages.length === 0 && osStatus === "idle" && !osError
            ? true
            : summoned
        }
        onPick={(q) => {
          setSummoned(false);
          if (osStatus !== "loading") void askOS(q);
        }}
        onClose={() => setSummoned(false)}
        disabled={osStatus === "loading"}
        testIdPrefix="os-canopy"
        introHeading={t("Not taught — reminded")}
        introSub={
          osMessages.length === 0 && osStatus === "idle" && !osError
            ? t(
                "The Mirror Entity does not teach you. It reminds you that you are the creator of your reality — and holds your chosen line with you, turn after turn of this conversation."
              )
            : null
        }
        contextText={osMessages
          .slice(-6)
          .map((m) => m.text)
          .join("\n")}
        channeling={
          [...osMessages]
            .reverse()
            .find((m) => m.role === "os" && m.branches?.length)?.branches ??
          null
        }
      />

      {/* THE TRUNK'S REST — the living tree's slim floor at the top of
          the input bar; one touch summons the whole grove again. */}
      <CanopyRestStrip
        open={
          osMessages.length === 0 && osStatus === "idle" && !osError
            ? true
            : summoned
        }
        onSummon={() => setSummoned(true)}
        disabled={osStatus === "loading"}
        testIdPrefix="os-composer"
      />

      {/* composer */}
      <div className="relative z-30 shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
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
            testId="os-attachments"
          />
          <div className="glass-strong flex items-end gap-2 rounded-[18px] p-1.5 pl-2 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow-sm"
          >
          <CanopySummonButton
            open={summoned}
            onToggle={() => setSummoned((v) => !v)}
            disabled={osStatus === "loading"}
            testIdPrefix="os-composer"
          />
          <label htmlFor="os-query" className="sr-only">
            {t("Ask the Manifest OS")}
          </label>
          <textarea
            id="os-query"
            ref={textareaRef}
            rows={1}
            value={osDraft}
            onChange={(e) => setOsDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("Ask the Manifest OS…")}
            className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <ChatInputExtras
            scope="mirroros"
            size="sm"
            accentVar="var(--scope-a)"
            disabled={osStatus === "loading"}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("Send to the OS")}
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
