"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Feather } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { detectVisualIntent } from "@/lib/visualization";
import { detectArtifactIntent } from "@/lib/artifact-intent";
import {
  AttachmentChips,
  ChatInputExtras,
} from "@/components/mirror/ChatInputExtras";
import { RemedyLayer } from "@/components/mirror/RemedyLayer";
import {
  CanopySummonButton,
} from "@/components/mirror/BranchCanopy";
import {
  hasPendingAttachments,
  type ChatAttachment,
} from "@/components/mirror/attachments";
import type { LiveScopeKey } from "@/lib/live-scopes";

export function QueryComposer() {
  const activeMode = useMirror((s) => s.activeMode);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);
  const setDraft = useMirror((s) => s.setDraft);
  const askMirror = useMirror((s) => s.askMirror);
  const askScopeVisual = useMirror((s) => s.askScopeVisual);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const composerFocusNonce = useMirror((s) => s.composerFocusNonce);
  const canopySummoned = useMirror((s) => s.canopySummoned);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  /* the channel's last visualization — "this" in a follow-up refers to it */
  const messages = useMirror((s) => s.sessions[s.activeMode].messages);
  const lastArtifact = useMemo(
    () =>
      [...messages].reverse().find((m) => m.artifact)?.artifact ?? null,
    [messages]
  );

  // Auto-resize — a slim field that grows only when truly needed
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [draft]);

  // Focus on request (suggested question chosen, etc.)
  useEffect(() => {
    if (composerFocusNonce > 0) {
      textareaRef.current?.focus();
    }
  }, [composerFocusNonce]);

  const canSend =
    draft.trim().length > 0 &&
    status !== "loading" &&
    !hasPendingAttachments(attachments);

  const submitText = (raw: string) => {
    const query = raw.trim();
    if (!query || status === "loading" || hasPendingAttachments(attachments))
      return;
    const carried = attachments.length > 0 ? attachments : undefined;
    /* the tree steps aside as the answer begins to form */
    useMirror.getState().setCanopySummoned(false);
    /* The side activities speak first: an akashic record, a card draw,
       an intention to charge or a mystery to strike travels with the
       reply as a living artifact — not as a picture. */
    if (detectArtifactIntent(query)) {
      void askMirror(query, carried);
      return;
    }
    /* The visualization engine is not a button — a request to SEE simply
       is one. Ordinary words never wake the atelier. */
    const intent = detectVisualIntent(query);
    const wantsVisual =
      intent.direct || (intent.followUp && lastArtifact !== null);
    setAttachments([]);
    if (wantsVisual) {
      void askScopeVisual(activeMode, query, null);
    } else {
      void askMirror(query, carried);
    }
  };

  const submit = () => submitText(draft);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl sm:px-6 sm:pb-2"
      role="search"
      aria-label={t("Ask the mirror")}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative mx-auto w-full max-w-[760px]"
      >
        {/* The Healing Apothecary's mini tab — floats just above the
            composer, only inside the Healing channel. */}
        {activeMode === "healing" && <RemedyLayer />}
        <AttachmentChips
          attachments={attachments}
          onRemove={(id) =>
            setAttachments((prev) => prev.filter((a) => a.id !== id))
          }
          testId="composer-attachments"
        />
        <div
          className={`glass-strong flex items-end gap-1 rounded-[16px] p-1.5 pl-2 transition-all duration-300 focus-within:border-[color-mix(in_srgb,var(--cy)_38%,transparent)] sm:gap-1 sm:p-1 sm:pl-2 ${
            status === "loading" ? "opacity-80" : ""
          }`}
        >
          <CanopySummonButton
            open={canopySummoned}
            onToggle={() =>
              useMirror.getState().setCanopySummoned(
                !useMirror.getState().canopySummoned
              )
            }
            disabled={status === "loading"}
            testIdPrefix="composer"
          />
          <label htmlFor="mirror-query" className="sr-only">
            {t("Ask the mirror")}
          </label>
          <textarea
            id="mirror-query"
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("Ask the mirror...")}
            className="nice-scroll max-h-[96px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-snug text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:min-h-[22px] sm:py-[2px] sm:text-[14.5px]"
          />
          <ChatInputExtras
            scope={activeMode as LiveScopeKey}
            size="2xs"
            mobileLarger
            disabled={status === "loading"}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("Transmit question to the mirror")}
            className="focus-glow mb-0 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-all duration-300 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 sm:size-7"
          >
            <Feather className="size-4 sm:size-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
