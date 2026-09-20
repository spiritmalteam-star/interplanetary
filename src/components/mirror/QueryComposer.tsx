"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useIsMobile } from "@/hooks/use-mobile";

export function QueryComposer() {
  const activeMode = useMirror((s) => s.activeMode);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);
  const setDraft = useMirror((s) => s.setDraft);
  const askMirror = useMirror((s) => s.askMirror);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const composerFocusNonce = useMirror((s) => s.composerFocusNonce);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [draft]);

  // Focus on request (suggested question chosen, etc.)
  useEffect(() => {
    if (composerFocusNonce > 0) {
      textareaRef.current?.focus();
    }
  }, [composerFocusNonce]);

  const canSend = draft.trim().length > 0 && status !== "loading";

  const submit = () => {
    if (!canSend) return;
    void askMirror(draft);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6 sm:pb-4"
      role="search"
      aria-label="Ask the mirror"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-auto w-full max-w-[760px]"
      >
        <div
          className={`glass-strong flex items-end gap-2.5 rounded-[22px] p-2 pl-4 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow ${
            status === "loading" ? "opacity-80" : ""
          }`}
        >
          <label htmlFor="mirror-query" className="sr-only">
            Ask the mirror
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
                ? "Ask the mirror... ✨"
                : "Ask the mirror... ✨ e.g. Who are the Pleiadians, and how are they helping humanity evolve?"
            }
            className="nice-scroll max-h-[148px] flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-[14.5px]"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Transmit question to the mirror"
            className="focus-glow mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--cy)] to-[color-mix(in_srgb,var(--cy)_60%,#8f6bff)] text-[#031018] shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--cy)_70%,transparent)] transition-all duration-300 hover:glow disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mono-label mt-2 hidden text-center text-[8px] text-muted-foreground/50 sm:block">
          Enter to transmit · Shift + Enter for a new line · Free will honored
          always
        </p>
      </form>
    </div>
  );
}
