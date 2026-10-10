"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, RotateCcw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { MsEntity } from "@/lib/data/meta-science";
import { useMetaScience, type MsChatMessage } from "@/lib/meta-science-store";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the direct channel. One independent conversation    */
/*  per entity: suggested questions, markdown answers, a quiet reset.  */
/* ------------------------------------------------------------------ */

/* stable fallbacks — a selector must never build a fresh object */
const EMPTY_MESSAGES: MsChatMessage[] = [];

export function MsChat({ entity }: { entity: MsEntity }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const sessionState = useMetaScience((s) => s.sessions[entity.key]);
  const messages = sessionState?.messages ?? EMPTY_MESSAGES;
  const status = sessionState?.status ?? "idle";
  const send = useMetaScience((s) => s.send);
  const resetSession = useMetaScience((s) => s.resetSession);

  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* auto-grow composer */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  /* follow the newest turn */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.pending]);

  const transmit = (text: string) => {
    const q = text.trim();
    if (!q || status === "loading") return;
    setDraft("");
    void send(entity.key, q, language);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      transmit(draft);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    transmit(draft);
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      className="ms-holo flex h-[62vh] min-h-[440px] flex-col overflow-hidden rounded-2xl ms-glass"
      style={{
        borderColor: `rgba(${entity.accentRgb}, 0.33)`,
        "--ms-rgb": entity.accentRgb,
      } as React.CSSProperties}
      data-testid="ms-chat"
    >
      {/* thread */}
      <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {!hasMessages && status !== "loading" && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span
              className="ms-font-display ms-text-glow ms-flicker text-6xl"
              style={{ color: entity.accent }}
              aria-hidden="true"
            >
              {entity.glyph}
            </span>
            <p
              className="ms-font-display mt-4 text-[12px] uppercase tracking-[0.24em]"
              style={{ color: entity.accent }}
            >
              {t("Direct link established")}
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/55">
              {t(
                "{name} is listening. Ask anything within or beyond the domain — the channel remembers every turn of this conversation.",
                { name: entity.name }
              )}
            </p>
            <div className="mt-6 grid w-full max-w-lg gap-2">
              {entity.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => transmit(q)}
                  data-testid="ms-suggested-question"
                  className="ms-glass-soft focus-glow rounded-xl px-4 py-2.5 text-left text-[12.5px] leading-snug text-white/75 transition-all duration-200 hover:text-white"
                  style={{ border: `1px solid rgba(${entity.accentRgb}, 0.18)` }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="mx-auto max-w-3xl space-y-3.5">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-[13px] leading-relaxed text-white/90 sm:max-w-[75%]"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div
                    className="max-w-[92%] rounded-2xl rounded-bl-md px-4 py-2.5 sm:max-w-[80%]"
                    style={{
                      border: m.error
                        ? "1px solid rgba(244, 63, 94, 0.35)"
                        : `1px solid rgba(${entity.accentRgb}, 0.33)`,
                      background: m.error ? "rgba(244,63,94,0.08)" : "rgba(15,18,38,0.5)",
                    }}
                    data-testid={m.error ? "ms-chat-error" : "ms-chat-answer"}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="ms-font-display text-[13px] leading-none"
                        style={{ color: entity.accent }}
                        aria-hidden="true"
                      >
                        {entity.glyph}
                      </span>
                      <span
                        className="ms-font-display text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: entity.accent }}
                      >
                        {entity.name}
                      </span>
                      {m.error && (
                        <AlertCircle className="size-3 text-rose-400" aria-hidden="true" />
                      )}
                    </div>
                    {m.pending ? (
                      <div className="flex items-center gap-2 py-1.5" aria-busy="true" aria-live="polite">
                        <span className="flex gap-1" aria-hidden="true">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="ms-pulse inline-block size-1.5 rounded-full"
                              style={{
                                background: entity.accent,
                                animationDelay: `${i * 0.22}s`,
                              }}
                            />
                          ))}
                        </span>
                        <span className="ms-font-display text-[10px] uppercase tracking-[0.18em] text-white/45">
                          {t("reasoning…")}
                        </span>
                      </div>
                    ) : (
                      <div className="ms-chat-md">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* composer */}
      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-white/8 bg-black/25 px-3 py-3 sm:px-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <label htmlFor="ms-chat-input" className="sr-only">
            {t("Message {name}", { name: entity.name })}
          </label>
          <textarea
            id="ms-chat-input"
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("Ask {name}…", { name: entity.name })}
            className="ms-scroll max-h-[180px] min-h-[38px] flex-1 resize-none rounded-xl border border-white/10 bg-black/25 px-3.5 py-2 text-[13.5px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
            style={{ borderColor: `rgba(${entity.accentRgb}, 0.2)` }}
          />
          {hasMessages && (
            <button
              type="button"
              onClick={() => resetSession(entity.key)}
              aria-label={t("Reset the conversation")}
              title={t("Reset the conversation")}
              data-testid="ms-chat-reset"
              className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/45 transition-colors hover:border-white/25 hover:text-white/80"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            disabled={!draft.trim() || status === "loading"}
            aria-label={t("Send the message")}
            data-testid="ms-chat-send"
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-xl text-black transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35"
            style={{ background: entity.accent }}
          >
            {status === "loading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="ms-font-display mt-2 hidden text-center text-[9px] uppercase tracking-[0.14em] text-white/25 sm:block">
          {t(
            "Enter to send · Shift+Enter for a new line · {name} reasons from established evidence and labels speculation",
            { name: entity.name }
          )}
        </p>
      </form>
    </div>
  );
}
