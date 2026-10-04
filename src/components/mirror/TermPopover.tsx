"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { termByName, type TermEntry } from "@/lib/data/lexicon";

/* ------------------------------------------------------------------ */
/*  TermPopover — the small card of meaning. A double-clicked word     */
/*  opens this quiet sheet: the term, its short meaning, and one       */
/*  crystallize button that pours the meaning into the chat as a       */
/*  vision. Rendered in a portal so nothing can clip it.               */
/* ------------------------------------------------------------------ */

export function TermPopover() {
  const t = useT();
  const askMirror = useMirror((s) => s.askMirror);
  const [term, setTerm] = useState<TermEntry | null>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    bottom: number;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  /* A double-click (or double-tap) anywhere on a glowing term opens
     the meaning. The listener lives on the document — the glow is
     rendered deep inside animated prose trees. */
  useEffect(() => {
    const onDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.("[data-term]") as HTMLElement | null;
      if (!el) return;
      const entry = termByName(el.dataset.term ?? "");
      if (!entry) return;
      const r = el.getBoundingClientRect();
      setAnchor({ x: r.left, y: r.top, width: r.width, bottom: r.bottom });
      setTerm(entry);
    };
    document.addEventListener("dblclick", onDblClick);
    return () => document.removeEventListener("dblclick", onDblClick);
  }, []);

  /* Tap or scroll anywhere else — the meaning folds away again. */
  useEffect(() => {
    if (!term) return;
    const dismiss = (e: Event) => {
      if (cardRef.current && cardRef.current.contains(e.target as Node)) return;
      const el = (e.target as HTMLElement | null)?.closest?.("[data-term]");
      if (el) return;
      setTerm(null);
    };
    const onScroll = () => setTerm(null);
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("touchstart", dismiss);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("touchstart", dismiss);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [term]);

  if (typeof document === "undefined") return null;

  /* Card placement: under the word when there is room, above it when
     there is not — clamped to the frame. */
  const CARD_W = 296;
  const CARD_H_EST = 190;
  let left = anchor ? anchor.x + anchor.width / 2 - CARD_W / 2 : 0;
  left = Math.max(12, Math.min(left, window.innerWidth - CARD_W - 12));
  const below = anchor ? anchor.bottom + 10 : 0;
  const top =
    anchor && below + CARD_H_EST > window.innerHeight
      ? Math.max(12, anchor.y - CARD_H_EST - 10)
      : below;

  const crystallize = () => {
    if (!term) return;
    void askMirror(
      `Crystallize into an image — ${term.term}: ${term.meaning}`
    );
    setTerm(null);
  };

  return createPortal(
    <AnimatePresence>
      {term && anchor && (
        <motion.div
          ref={cardRef}
          key={term.term}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label={t("The meaning of {term}", { term: term.term })}
          data-testid="term-popover"
          className="fixed z-[90] rounded-2xl border border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] bg-[var(--glass-bg)] p-4 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          style={{ left, top, width: CARD_W }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="ink-hand text-[15px] font-semibold leading-snug text-foreground">
              {t(term.term)}
            </p>
            <button
              type="button"
              onClick={() => setTerm(null)}
              aria-label={t("Close")}
              className="focus-glow -mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5 font-serif text-[13px] leading-relaxed text-muted-foreground">
            {t(term.meaning)}
          </p>
          <button
            type="button"
            onClick={crystallize}
            data-testid="term-crystallize"
            className="focus-glow mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--scope-a,transparent)_35%,transparent)] px-3 text-[12.5px] text-foreground/90 transition-all duration-300 hover:-translate-y-px"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("Crystallize this meaning")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
