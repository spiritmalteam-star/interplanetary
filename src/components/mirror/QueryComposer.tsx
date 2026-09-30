"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectVisualIntent } from "@/lib/visualization";
import {
  AttachmentChips,
  ChatInputExtras,
} from "@/components/mirror/ChatInputExtras";
import { RemedyLayer } from "@/components/mirror/RemedyLayer";
import {
  hasPendingAttachments,
  type ChatAttachment,
} from "@/components/mirror/attachments";
import type { LiveScopeKey } from "@/lib/live-scopes";
import { cn } from "@/lib/utils";

export function QueryComposer({ embedded = false }: { embedded?: boolean }) {
  const activeMode = useMirror((s) => s.activeMode);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);
  const setDraft = useMirror((s) => s.setDraft);
  const askMirror = useMirror((s) => s.askMirror);
  const askScopeVisual = useMirror((s) => s.askScopeVisual);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const composerFocusNonce = useMirror((s) => s.composerFocusNonce);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  /* the channel's last visualization — "this" in a follow-up refers to it */
  const messages = useMirror((s) => s.sessions[s.activeMode].messages);
  const lastArtifact = useMemo(
    () =>
      [...messages].reverse().find((m) => m.artifact)?.artifact ?? null,
    [messages]
  );

  // Auto-resize — a slimmer field that grows only when truly needed
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
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

  /* the voice becomes words in the field — visible for a breath — then
     the words fly to the mirror on their own */
  const handleVoiceSubmit = (text: string) => {
    const state = useMirror.getState();
    const prev = state.sessions[state.activeMode].draft.trim();
    const finalText = prev ? `${prev} ${text}` : text;
    setDraft(finalText);
    window.setTimeout(() => submitText(finalText), 650);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        "shrink-0 px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:pb-3.5",
        /* anchored inside the chamber: no seam of its own — the frame
           already holds it; floating free: the old glass band */
        embedded
          ? "bg-transparent backdrop-blur-none"
          : "border-t hairline bg-[var(--glass-bg)] backdrop-blur-xl"
      )}
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
          className={`glass-strong flex items-end gap-1.5 rounded-[20px] p-1.5 pl-3 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[color-mix(in_srgb,var(--ac,var(--cy))_38%,transparent)] focus-within:glow-sm ${
            status === "loading" ? "opacity-80" : ""
          }`}
        >
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
            placeholder={
              isMobile
                ? t("Ask the mirror...")
                : t(
                    "Ask the mirror... e.g. Who are the Pleiadians, and how are they helping humanity evolve?"
                  )
            }
            className="nice-scroll max-h-[104px] min-h-[34px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-[15.5px]"
          />
          <ChatInputExtras
            scope={activeMode as LiveScopeKey}
            size="xs"
            disabled={status === "loading"}
            onTranscript={(text) => {
              const state = useMirror.getState();
              const prev = state.sessions[state.activeMode].draft;
              setDraft(prev ? `${prev} ${text}` : text);
            }}
            onVoiceSubmit={handleVoiceSubmit}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("Transmit question to the mirror")}
            className="focus-glow mb-0 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cy)] to-[color-mix(in_srgb,var(--cy)_55%,#0fd975)] text-[#04120c] shadow-[0_0_16px_-6px_color-mix(in_srgb,var(--cy)_75%,transparent)] transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mono-label mt-1.5 hidden text-center text-[10px] text-muted-foreground/50 sm:block">
          {t(
            "Enter to transmit · Shift + Enter for a new line · Free will honored always"
          )}
        </p>
      </form>
    </div>
  );
}
