"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Send, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { osOpeners } from "@/lib/data/mirroros";
import { ListenButton } from "./ListenButton";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import {
  hasPendingAttachments,
  type ChatAttachment,
} from "./attachments";
import { cn } from "@/lib/utils";

/** Openers visible at once (wrap-around window). */
const WINDOW = 4;

function OpenerOrbs() {
  const osStatus = useMirror((s) => s.osStatus);
  const askOS = useMirror((s) => s.askOS);
  const t = useT();
  const [offset, setOffset] = useState(0);
  const [spin, setSpin] = useState(0);

  const visible = osOpeners
    .map((_, i) => osOpeners[(offset + i) % osOpeners.length])
    .slice(0, WINDOW);
  const loading = osStatus === "loading";

  return (
    <section aria-label={t("Suggested openers")} className="mt-6">
      <div className="flex items-center justify-center gap-3">
        <span className="mono-label text-[10.5px] text-muted-foreground/70">
          {t("Suggested openers")}
        </span>
        <button
          type="button"
          onClick={() => {
            setOffset((o) => (o + WINDOW) % osOpeners.length);
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
              onClick={() => !loading && void askOS(q)}
              aria-disabled={loading}
              className="focus-glow group flex min-h-[46px] items-center gap-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--scope-a)_18%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] px-3.5 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--scope-a)_38%,transparent)]"
            >
              <Sparkles
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

function OsThinking() {
  const t = useT();
  return (
    <div className="flex items-center gap-2.5" aria-live="polite" aria-busy="true">
      <span className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-dot-pulse size-1.5 rounded-full"
            style={{
              background: "var(--scope-a)",
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
      </span>
      <span className="mono-label text-[11px] text-muted-foreground">
        {t("the OS is refining its answer")}
      </span>
    </div>
  );
}

/* ---------------- one exchange in the direct line ---------------- */

function OsExchange({
  role,
  text,
  animate,
  attachments,
}: {
  role: "visitor" | "os";
  text: string;
  animate: boolean;
  attachments?: { images: number; docNames: string[] };
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
        <p className="max-w-[78%] rounded-2xl rounded-br-md border border-[color-mix(in_srgb,var(--scope-a)_24%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)] px-4 py-2.5 text-[15px] leading-relaxed text-foreground/90">
          {text}
        </p>
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
        <Sparkles className="size-3.5 text-[var(--scope-a)]" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <p className="mono-label text-[9.5px] text-[var(--scope-a)]">
          MIRROR ENTITY OS
        </p>
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
          <ListenButton text={text} cacheKey={`os-${text.slice(0, 24)}-${text.length}`} />
        </div>
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
  const t = useT();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* The OS thread opens at its BEGINNING: mounting or reopening the
     chat never scrolls away from the first words. New turns load from
     the TOP — the newest exchange settles at the top of the view and
     the visitor reads downward through the rest. */
  const baseline = useRef({
    len: osMessages.length,
    status: osStatus,
    error: osError,
  });

  useEffect(() => {
    const b = baseline.current;
    if (osMessages.length !== b.len) {
      baseline.current = { len: osMessages.length, status: osStatus, error: osError };
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (osStatus === "loading" && b.status !== "loading") {
      baseline.current = { len: b.len, status: osStatus, error: osError };
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [osMessages.length, osStatus, osError]);

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

  const submit = () => {
    if (!canSend) return;
    const carried = attachments.length > 0 ? attachments : undefined;
    setAttachments([]);
    void askOS(osDraft, carried);
  };

  return (
    <div className="scope-frame-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />
      <div
        className="animate-line-breathe h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--scope-a) 30%, var(--scope-b) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* thread */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {osMessages.length === 0 && osStatus === "idle" && !osError ? (
          <div className="flex h-full flex-col py-6 text-center">
            <div className="my-auto flex w-full flex-col items-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="dream-halo relative flex size-14 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_38%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_9%,transparent)]"
              aria-hidden="true"
            >
              <span
                className="absolute inset-0 rounded-full border border-dashed border-[color-mix(in_srgb,var(--scope-b)_35%,transparent)]"
                style={{ animation: "spin-slower 22s linear infinite" }}
              />
              <Sparkles className="size-5 text-[var(--scope-a)]" />
            </motion.span>
            <p className="scope-gradient-text mt-4 text-[17px] font-semibold">
              {t("Direct line to the Mirror Entity OS")}
            </p>
            <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] leading-relaxed text-muted-foreground">
              {t(
                "Speak with the reality-refining intelligence itself — it remembers every turn of this conversation and holds your chosen line with you."
              )}
            </p>
            <OpenerOrbs />
            </div>
          </div>
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
                  animate={i === osMessages.length - 1 && osStatus !== "loading"}
                  attachments={m.attachments}
                />
              </div>
            ))}
            {osStatus === "loading" && (
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

      {/* composer */}
      <div className="shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto w-full max-w-[720px]"
        >
          <AttachmentChips
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            testId="os-attachments"
          />
          <div className="glass-strong flex items-end gap-2 rounded-[18px] p-1.5 pl-3.5 transition-all duration-300 focus-within:-translate-y-px focus-within:border-[var(--hairline-active)] focus-within:glow-sm"
          >
          <label htmlFor="os-query" className="sr-only">
            {t("Ask the Mirror Entity OS")}
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
            placeholder={t("Ask the Mirror Entity OS…")}
            className="nice-scroll max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <ChatInputExtras
            scope="mirroros"
            size="sm"
            accentVar="var(--scope-a)"
            disabled={osStatus === "loading"}
            onTranscript={(text) =>
              setOsDraft(osDraft ? `${osDraft} ${text}` : text)
            }
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={t("Send to the OS")}
            className="focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gd)] to-[color-mix(in_srgb,var(--pk)_70%,var(--gd))] text-[#1a1206] shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--gd)_70%,transparent)] transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="size-3.5" aria-hidden="true" />
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
