"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Orbit, RotateCcw, SendHorizontal } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  mirrorBookPhases,
  mirrorSuggestions,
} from "@/lib/data/mirror-suggestions";
import { ListenButton } from "./ListenButton";
import {
  AttachmentChips,
  ChatInputExtras,
} from "./ChatInputExtras";
import {
  hasPendingAttachments,
  type ChatAttachment,
} from "./attachments";

/* ------------------------------------------------------------------ */
/*  THE MIRROR — the fifth book of the laboratory: the reflection of   */
/*  deeper knowing. One purple-liquid surface, no scope, no filter —   */
/*  what the seeker writes, their own deeper self answers, in a warm   */
/*  handwritten voice.                                                 */
/* ------------------------------------------------------------------ */

const WELL_STEP = 5; /* the well gives its reflections five at a time */

/* ---------- forming: the reflection gathers ---------- */

function FormingReflection({ phase }: { phase: number }) {
  return (
    <div className="relative mx-auto mt-8 size-20" aria-hidden="true">
      {/* a slow liquid orb — the surface before the words rise */}
      <div
        className="mirror-blob mirror-blob-orb absolute inset-0"
        style={{ animationDuration: "7s" }}
      />
      <div
        className="mirror-blob mirror-blob-orb absolute inset-3"
        style={{ animationDuration: "11s", animationDirection: "reverse" }}
      />
      <Orbit className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-[#b98fd9] animate-charge-pulse" />
      <span className="sr-only">{mirrorBookPhases[phase % mirrorBookPhases.length]}</span>
    </div>
  );
}

/* ---------- the well of reflections — one hundred deep, drawn five
   at a time ---------- */

function WellOfReflections({ onDraw }: { onDraw: (q: string) => void }) {
  const t = useT();
  const total = mirrorSuggestions.length;
  /* deterministic first paint (the first five of the pool), the random
     window drawn in a client effect after hydration */
  const [offset, setOffset] = useState(0);
  const [drawn, setDrawn] = useState(WELL_STEP);

  useEffect(() => {
    setOffset(Math.floor(Math.random() * total));
  }, [total]);

  const visible = Array.from(
    { length: drawn },
    (_, i) => mirrorSuggestions[(offset + i) % total]
  );
  const remaining = total - drawn;

  return (
    <section
      aria-label={t("The well of reflections")}
      className="mx-auto mt-12 w-full pb-2"
      data-testid="mirror-well"
    >
      <div className="flex items-center gap-3">
        <span
          className="mirror-microlabel"
          style={{ color: "color-mix(in srgb, #b98fd9 80%, white)" }}
        >
          {t("The well of reflections")}
        </span>
        <span
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, #8a5fae 45%, transparent), transparent)",
          }}
          aria-hidden="true"
        />
        <span className="mirror-microlabel text-muted-foreground/60">
          {drawn} / {total}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {visible.map((q, i) => (
          <button
            key={`${i}-${q.slice(0, 24)}`}
            type="button"
            onClick={() => onDraw(q)}
            data-testid="mirror-well-suggestion"
            className="mirror-well-card focus-glow group flex min-h-[56px] items-start gap-3 rounded-[16px] px-4 py-3 text-left"
          >
            <span className="mirror-well-dot mt-[7px] shrink-0" aria-hidden="true" />
            <span className="font-hand flex-1 text-[16px] leading-snug mirror-ink">
              {t(q)}
            </span>
          </button>
        ))}
      </div>

      {remaining > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawn((d) => Math.min(d + WELL_STEP, total))}
            data-testid="mirror-well-load"
            className="focus-glow mirror-draw-btn flex h-10 items-center gap-2.5 rounded-full px-6 text-[13.5px] font-medium"
          >
            <Orbit className="size-4" aria-hidden="true" />
            {t("Draw 5 more")}
          </button>
          <p className="mirror-microlabel text-muted-foreground/55">
            {t("{n} reflections still in the well", { n: String(remaining) })}
          </p>
        </div>
      ) : (
        <p className="mirror-microlabel mt-4 text-center text-muted-foreground/55">
          {t("The well stands open — every reflection drawn.")}
        </p>
      )}
    </section>
  );
}

/* ---------- the book itself ---------- */

export function MirrorBookView() {
  const t = useT();
  const messages = useMirror((s) => s.mirrorMessages);
  const status = useMirror((s) => s.mirrorStatus);
  const error = useMirror((s) => s.mirrorError);
  const draft = useMirror((s) => s.mirrorDraft);
  const setDraft = useMirror((s) => s.setMirrorDraft);
  const askMirrorBook = useMirror((s) => s.askMirrorBook);
  const clearMirrorBook = useMirror((s) => s.clearMirrorBook);
  const exitMirror = useMirror((s) => s.exitMirror);

  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [phase, setPhase] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* forming phases cycle while the reflection gathers */
  useEffect(() => {
    if (status !== "loading") return;
    const id = window.setInterval(
      () => setPhase((p) => (p + 1) % mirrorBookPhases.length),
      2200
    );
    return () => window.clearInterval(id);
  }, [status]);

  /* auto-resize — the writing surface grows only when truly needed */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  /* the scroll law — the newest turn always owns the frame */
  const latestRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const baseline = useRef({ len: messages.length, status, fresh: true });

  useEffect(() => {
    const b = baseline.current;
    const grew = messages.length !== b.len;
    const startedLoading =
      !b.fresh && status === "loading" && b.status !== "loading";
    baseline.current = { len: messages.length, status, fresh: false };
    if (b.fresh) {
      if (status === "loading") {
        loadingRef.current?.scrollIntoView({ block: "start" });
      }
      return;
    }
    if (grew) {
      latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const id = window.setTimeout(() => {
        latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 450);
      return () => window.clearTimeout(id);
    }
    if (startedLoading) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages.length, status]);

  const canSend =
    draft.trim().length > 0 &&
    status !== "loading" &&
    !hasPendingAttachments(attachments);

  const send = (raw: string) => {
    const words = raw.trim();
    if (!words || status === "loading" || hasPendingAttachments(attachments))
      return;
    const carried = attachments.length > 0 ? attachments : undefined;
    setAttachments([]);
    void askMirrorBook(words, carried);
  };

  const submit = () => send(draft);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  /* the voice becomes handwriting on the surface — visible for a
     breath — then it flies to the mirror on its own */
  const handleVoiceSubmit = (text: string) => {
    const prev = useMirror.getState().mirrorDraft.trim();
    const finalText = prev ? `${prev} ${text}` : text;
    setDraft(finalText);
    window.setTimeout(() => send(finalText), 650);
  };

  return (
    <div
      className="mirror-world relative flex h-dvh flex-col overflow-hidden"
      data-testid="mirror-book-view"
    >
      {/* the purple glowing liquid the whole book floats on */}
      <div className="mirror-liquid" aria-hidden="true">
        <span className="mirror-blob mirror-blob-1" />
        <span className="mirror-blob mirror-blob-2" />
        <span className="mirror-blob mirror-blob-3" />
        <span className="mirror-blob mirror-blob-4" />
      </div>

      {/* header — the only bridge back is the return button */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6">
        <button
          type="button"
          onClick={exitMirror}
          data-testid="mirror-book-back"
          className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline px-3.5 text-[12.5px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("Return to the Observatory")}
        </button>

        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:flex">
          <h1 className="mirror-title">{t("The Mirror")}</h1>
          <p className="font-hand mirror-ink -mt-0.5 text-[15px] opacity-80">
            {t("A reflection of deeper knowing")}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearMirrorBook}
            data-testid="mirror-book-clear"
            aria-label={t("Quiet the surface")}
            title={t("Quiet the surface")}
            className="focus-glow flex size-9 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </header>

      {/* the surface — the thread the deeper self writes on */}
      <div
        className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="mirror-book-thread"
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pb-8 sm:px-6">
          {messages.length === 0 && status === "idle" && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mirror-letter mt-6 px-6 py-7 sm:px-9"
            >
              <p className="font-hand mirror-ink text-[19px] leading-[1.7] sm:text-[21px]">
                {t(
                  "You found the one book that was never written — because it writes itself the moment you arrive."
                )}
              </p>
              <p className="font-hand mirror-ink mt-3 text-[16.5px] leading-[1.75] opacity-85 sm:text-[18px]">
                {t(
                  "Nothing here is out of bounds. Write anything — the thing you say aloud and the thing you don't. What answers is not someone else: it is the part of you that never stopped knowing."
                )}
              </p>
            </motion.div>
          )}

          {messages.map((m, i) =>
            m.role === "visitor" ? (
              <div
                key={m.id}
                ref={
                  i === messages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
                className="mt-7 flex justify-end"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mirror-visitor-line max-w-[85%] rounded-[18px] rounded-br-[6px] px-4 py-2.5 sm:max-w-[75%]"
                >
                  <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground/92">
                    {m.text}
                  </p>
                  {m.attachments &&
                    (m.attachments.images > 0 ||
                      m.attachments.docNames.length > 0) && (
                      <p className="mirror-microlabel mt-1.5 text-right text-[9.5px] text-muted-foreground/70">
                        {m.attachments.images > 0 && t("an image")}
                        {m.attachments.images > 0 &&
                          m.attachments.docNames.length > 0 &&
                          " · "}
                        {m.attachments.docNames.join(" · ")}
                      </p>
                    )}
                </motion.div>
              </div>
            ) : (
              <div
                key={m.id}
                ref={
                  i === messages.length - 1
                    ? (node) => {
                        latestRef.current = node;
                      }
                    : undefined
                }
                className="mt-6"
              >
                <motion.article
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="mirror-letter relative px-5 py-5 sm:px-8 sm:py-6"
                  aria-label={t("From the deeper knowing")}
                >
                  <div className="mb-3 flex items-center justify-end gap-2">
                    <ListenButton text={m.text} cacheKey={m.id} />
                  </div>
                  {m.text.split(/\n{2,}/).map((p, j) => (
                    <p
                      key={j}
                      className="font-hand mirror-ink text-[17.5px] leading-[1.72] sm:text-[19px]"
                      style={{ marginTop: j === 0 ? 0 : "0.9rem" }}
                    >
                      {p}
                    </p>
                  ))}
                </motion.article>
              </div>
            )
          )}

          {status === "loading" && (
            <div
              ref={(node) => {
                loadingRef.current = node;
              }}
              className="mt-8 text-center"
              aria-live="polite"
              aria-busy="true"
              data-testid="mirror-book-loading"
            >
              <FormingReflection phase={phase} />
              <p className="mirror-microlabel mt-3 text-muted-foreground">
                {t(mirrorBookPhases[phase % mirrorBookPhases.length])}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mirror-letter mt-8 text-center" data-testid="mirror-book-error">
              <p className="font-hand mirror-ink text-[16.5px] leading-relaxed">
                {t("The surface is still. Rest a breath, then write again.")}
              </p>
              {error && (
                <p className="mirror-microlabel mt-2 text-muted-foreground/70">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* the well — one hundred reflections, drawn five at a time */}
          <WellOfReflections onDraw={(q) => send(q)} />
        </div>
      </div>

      {/* the writing surface */}
      <div
        className="relative z-10 shrink-0 border-t hairline bg-[var(--glass-bg)] px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl sm:px-6 sm:pb-3.5"
        data-testid="mirror-book-composer"
      >
        <form onSubmit={onSubmit} className="relative mx-auto w-full max-w-[760px]">
          <AttachmentChips
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            testId="mirror-book-attachments"
          />
          <div
            className={`glass-strong flex items-end gap-1.5 rounded-[20px] p-1.5 pl-3 mirror-composer transition-all duration-300 focus-within:-translate-y-px ${
              status === "loading" ? "opacity-80" : ""
            }`}
          >
            <label htmlFor="mirror-book-query" className="sr-only">
              {t("Write to the mirror")}
            </label>
            <textarea
              id="mirror-book-query"
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("Write to the mirror...")}
              className="nice-scroll max-h-[120px] min-h-[34px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-[15.5px]"
            />
            <ChatInputExtras
              scope="communion"
              size="xs"
              disabled={status === "loading"}
              accentVar="#8a5fae"
              onTranscript={(text) => {
                const prev = useMirror.getState().mirrorDraft;
                setDraft(prev ? `${prev} ${text}` : text);
              }}
              onVoiceSubmit={handleVoiceSubmit}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={t("Write to the mirror")}
              data-testid="mirror-book-send"
              className="focus-glow mb-0 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a873d6] to-[#6d3f96] text-white shadow-[0_0_16px_-6px_color-mix(in_srgb,#a873d6_75%,transparent)] transition-all duration-300 hover:glow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <SendHorizontal className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mirror-microlabel mt-1.5 hidden text-center text-[10px] text-muted-foreground/50 sm:block">
            {t("Enter to write · Shift + Enter for a new line · The self signs nothing")}
          </p>
        </form>
      </div>
    </div>
  );
}
