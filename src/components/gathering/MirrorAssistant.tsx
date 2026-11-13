"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type MeState, GP_CARD, GP_GHOST, GP_ICON_BTN, GP_INPUT, netFetch } from "./shared";

/* ------------------------------------------------------------------ */
/*  THE MIRROR — M.E.'s own contextual hand inside the hall. It        */
/*  listens to the room it stands in, suggests, explains, drafts —     */
/*  and never acts without a human hand. Every answer it gives is a    */
/*  suggestion by definition; every error it meets is shown verbatim,  */
/*  prefixed honestly.                                                 */
/* ------------------------------------------------------------------ */

type AssistantAction = "summarize" | "explain" | "find" | "suggest" | "draft" | "next";

interface Turn {
  who: "me" | "mirror";
  text: string;
}

const QUICK_HANDS: Array<{ action: AssistantAction; label: string }> = [
  { action: "summarize", label: "Summarize this room" },
  { action: "explain", label: "Explain a concept" },
  { action: "find", label: "Find questions" },
  { action: "suggest", label: "Suggest circles" },
  { action: "draft", label: "Draft a post" },
  { action: "next", label: "Next steps" },
];

export default function MirrorAssistant({
  section,
  me,
  radioOpen = false,
}: {
  section: string;
  me: MeState | null;
  /** the frequency radio stands at the hall's foot — the mirror
      lifts itself above its band on the palm, and comes back down
      when the radio folds away */
  radioOpen?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>(() => [
    {
      who: "mirror",
      text: me?.name
        ? `${me.name} — ${t("ask me anything about this room. I suggest; I never act without your hand.")}`
        : t("Ask me anything about this room. I suggest; I never act without your hand."),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* one honest exchange — the question rides with the pending hand
     when a quick hand sent it; errors are shown verbatim, prefixed */
  const ask = useCallback(
    async (question: string, action?: AssistantAction) => {
      if (thinking) return;
      const text = question.trim();
      if (!text && !action) return;
      setPendingAction(null);
      if (text) setTurns((prev) => [...prev, { who: "me", text }]);
      setInput("");
      setThinking(true);
      try {
        const data = await netFetch<{ answer: string }>("/api/network/assistant", {
          method: "POST",
          body: { section, question: text, action: action ?? undefined },
        });
        setTurns((prev) => [...prev, { who: "mirror", text: data.answer }]);
      } catch (err) {
        const raw = err instanceof Error ? err.message : t("M.E. could not be reached just now.");
        setTurns((prev) => [...prev, { who: "mirror", text: `(honest) ${raw}` }]);
      } finally {
        setThinking(false);
      }
    },
    [section, t, thinking]
  );

  /* a quick hand sets its intent and speaks at once — an empty
     question is honest when the action carries the asking */
  const quick = useCallback(
    (action: AssistantAction) => {
      setPendingAction(action);
      void ask("", action);
    },
    [ask]
  );

  /* the newest word stays in sight */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, thinking, open]);

  /* the input receives the visitor's hand when the mirror opens */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* one breath of Escape folds the mirror */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* the floating pearl — the one mirror presence in the hall:
          it rests just above the palm's streets, lifts over the radio
          while it plays, and never covers community content */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        animate={{ scale: open ? 0.92 : 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        aria-label={t("Ask M.E.")}
        title={t("Ask M.E.")}
        aria-expanded={open}
        data-testid="gath-assistant-open"
        className={cn(
          "gp-pearl focus-glow fixed right-4 z-50 flex size-12 items-center justify-center rounded-full border border-white/90 transition-[bottom] duration-300 sm:right-6 lg:bottom-[84px]",
          radioOpen ? "bottom-[196px]" : "bottom-[84px]"
        )}
        style={{
          background: "linear-gradient(150deg,#fdf9ef 0%,#f3ead6 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 20px -8px rgba(122,103,70,0.55)",
        }}
      >
        <Sparkles className="size-5 text-[#8a6f46]" aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={t("The mirror — M.E.")}
            data-testid="gath-assistant-panel"
            className={cn(
              GP_CARD,
              "fixed right-4 z-40 flex max-h-[64vh] w-[min(92vw,380px)] flex-col overflow-hidden shadow-xl transition-[bottom] duration-300 sm:right-6",
              radioOpen ? "bottom-[260px] lg:bottom-[148px]" : "bottom-[148px]"
            )}
          >
            {/* the mirror's crown */}
            <div className="flex items-start justify-between gap-2 border-b border-[#eadfca]/70 px-4 py-3">
              <div className="min-w-0">
                <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[#8a6f46]">
                  {t("the mirror · m.e.")}
                </p>
                <p className="mt-1 font-[family-name:var(--font-literata)] text-[11.5px] italic leading-[1.6] text-[#8a7c64]">
                  {t("It suggests — it never acts without your hand.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Close the mirror")}
                className={cn(GP_ICON_BTN, "size-8")}
                data-testid="gath-assistant-close"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* the quick hands — one quiet scrollable line, so the
                conversation itself stays in sight */}
            <div className="gp-scroll flex shrink-0 gap-1.5 overflow-x-auto px-4 py-2.5">
              {QUICK_HANDS.map((q) => (
                <button
                  key={q.action}
                  type="button"
                  onClick={() => quick(q.action)}
                  disabled={thinking}
                  className={cn(GP_GHOST, "shrink-0 whitespace-nowrap px-3 py-1.5 text-[11px]")}
                  data-testid={`gath-assistant-act-${q.action}`}
                >
                  {t(q.label)}
                </button>
              ))}
            </div>

            {/* the transcript — suggestions by definition */}
            <div
              ref={scrollRef}
              className="gp-scroll min-h-0 max-h-[40vh] flex-1 overflow-y-auto border-t border-[#eadfca]/70 px-4 py-3"
            >
              {turns.map((turn, i) =>
                turn.who === "me" ? (
                  <div key={i} className="mt-2 flex justify-end">
                    <p className="max-w-[85%] rounded-[14px] bg-[#fdf1e7] px-3 py-2 font-[family-name:var(--font-literata)] text-[12.5px] leading-[1.7] text-[#3d3428] [overflow-wrap:anywhere]">
                      {turn.text}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="mt-2.5 flex flex-col items-start">
                    <p className="font-[family-name:var(--font-literata)] text-[12.5px] italic leading-[1.7] text-[#7c715f] [overflow-wrap:anywhere]">
                      <Sparkles
                        className="mr-1.5 inline size-3 align-[-2px] text-[#8a6f46]"
                        aria-hidden="true"
                      />
                      {turn.text}
                    </p>
                    <p className="mono-label mt-1 text-[8px] uppercase tracking-[0.18em] text-[#a2947c]">
                      {t("M.E. suggested")}
                    </p>
                  </div>
                )
              )}
              {thinking && (
                <p className="mt-2 flex items-center gap-2 text-[11.5px] italic text-[#a2947c]">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  {t("M.E. listens…")}
                </p>
              )}
            </div>

            {/* the asking hand */}
            <div className="flex items-center gap-2 border-t border-[#eadfca]/70 px-3 py-2.5">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void ask(input, pendingAction ?? undefined);
                  }
                }}
                maxLength={600}
                placeholder={t("Ask M.E. anything about this room…")}
                aria-label={t("Ask M.E. anything about this room…")}
                data-testid="gath-assistant-input"
                className={cn(GP_INPUT, "min-w-0 flex-1")}
              />
              <button
                type="button"
                onClick={() => void ask(input, pendingAction ?? undefined)}
                disabled={thinking}
                className={cn(GP_ICON_BTN, "size-9")}
                aria-label={t("Send to M.E.")}
                data-testid="gath-assistant-send"
              >
                {thinking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
