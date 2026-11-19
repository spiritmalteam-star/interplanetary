"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MIRROR_NOTES, type MirrorNoteEntry } from "@/lib/data/mirror-notes";

/* ------------------------------------------------------------------ */
/*  THE NOTE'S DEEPER PAGE — a note on the side of the conversation    */
/*  is touched and it opens: a full-screen reading room holding the    */
/*  deeper words — an inspiration, a piece of information, a signal    */
/*  from the deep, a riddle. The arrows turn the pages; Esc folds the  */
/*  page away. The house speaks in its own quiet voice and never       */
/*  names itself.                                                      */
/* ------------------------------------------------------------------ */

const KIND_DRESS: Record<
  MirrorNoteEntry["kind"],
  { glyph: string; color: string }
> = {
  inspiration: { glyph: "✧", color: "#d8b571" },
  information: { glyph: "❖", color: "#7dd3fc" },
  news: { glyph: "☄", color: "#22d3ee" },
  riddle: { glyph: "◈", color: "#a78bfa" },
};

export function MirrorNoteZoom({
  index,
  onIndexChange,
  onClose,
  testId = "mirror-note-zoom",
}: {
  index: number | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  testId?: string;
}) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);

  const total = MIRROR_NOTES.length;
  const entry = index !== null ? MIRROR_NOTES[index % total] : null;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onIndexChange((index + dir + total) % total);
    },
    [index, onIndexChange, total]
  );

  useEffect(() => {
    if (index === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, onClose, step]);

  if (index === null || !entry || typeof document === "undefined") return null;
  const dress = KIND_DRESS[entry.kind];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(entry.label)}
      data-testid={testId}
      className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      {/* the close hand */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("Close the page")}
        data-testid={`${testId}-close`}
        className="focus-glow absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white/90 transition-all duration-300 hover:scale-105 hover:bg-black/60 sm:right-5 sm:top-5"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${entry.label}`}
          initial={{ opacity: 0, y: 18, rotate: -0.4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -14, rotate: 0.4 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-[640px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* the deeper page itself — a paper that reads in the dark */}
          <div
            data-testid={`${testId}-card`}
            className="rounded-2xl border px-6 py-8 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:px-10 sm:py-10"
            style={{
              background:
                "linear-gradient(168deg, color-mix(in srgb, " +
                dress.color +
                " 7%, var(--glass-bg, rgba(20,20,24,0.92))), var(--glass-bg, rgba(20,20,24,0.92)))",
              borderColor:
                "color-mix(in srgb, " + dress.color + " 30%, var(--hairline))",
            }}
          >
            {/* the page's own label — the kind, dressed in its light */}
            <p className="mono-label flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-foreground/75">
              <span
                aria-hidden="true"
                className="text-[13px]"
                style={{ color: dress.color }}
              >
                {dress.glyph}
              </span>
              {t(entry.label)}
            </p>

            {/* the deeper words — high-contrast in every weather */}
            <p className="mt-5 whitespace-pre-wrap break-words font-[family-name(var(--font-literata))] text-[17px] leading-[1.85] text-foreground sm:text-[19px] sm:leading-[1.9]">
              {t(entry.text)}
            </p>

            {/* the turning hands — one row beneath the words */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("The page before")}
                data-testid={`${testId}-prev`}
                className="focus-glow flex size-9 items-center justify-center rounded-full border text-foreground/75 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
                style={{
                  borderColor:
                    "color-mix(in srgb, " + dress.color + " 32%, transparent)",
                }}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <span
                className="mono-label text-[10px] tracking-[0.3em] text-foreground/60"
                aria-live="polite"
              >
                {(index % total) + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t("The page after")}
                data-testid={`${testId}-next`}
                className="focus-glow flex size-9 items-center justify-center rounded-full border text-foreground/75 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
                style={{
                  borderColor:
                    "color-mix(in srgb, " + dress.color + " 32%, transparent)",
                }}
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
