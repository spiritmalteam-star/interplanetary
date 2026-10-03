"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scopeSuggestionPools } from "@/lib/data/suggestions";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import type { Mode } from "@/lib/mirror-types";

/** How many suggestions ride the strip at once. */
const WINDOW = 8;

/**
 * The suggestion strip — small quiet bars sliding in a single line just
 * above the input. A fresh window of the scope's question pool on every
 * visit, scope change and reload; one tap sends the question.
 */
export function SuggestionStrip() {
  const activeMode = useMirror((s) => s.activeMode);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const askMirror = useMirror((s) => s.askMirror);
  const t = useT();

  /* Deterministic offset (0) at first render so server and client agree;
     the random window is drawn in a client effect after hydration. */
  const [offset, setOffset] = useState(0);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    setOffset(Math.floor(Math.random() * scopeSuggestionPools[activeMode].length));
  }, [activeMode]);

  const pool = scopeSuggestionPools[activeMode];
  const visible = pool
    .map((_, i) => pool[(offset + i) % pool.length])
    .slice(0, WINDOW);
  const loading = status === "loading";

  const reload = () => {
    setOffset(Math.floor(Math.random() * pool.length));
    setSpin((n) => n + 1);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[760px]"
      role="group"
      aria-label={t("Suggested questions")}
      data-testid="suggestion-strip"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${activeMode}-${offset}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-1 py-1 sm:gap-2"
        >
          {visible.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                if (!loading) void askMirror(q);
              }}
              disabled={loading}
              aria-disabled={loading}
              data-testid="suggestion-chip"
              title={t(q)}
              className="focus-glow shrink-0 whitespace-nowrap rounded-full border hairline bg-[var(--glass-bg)] px-3.5 py-1.5 font-serif text-[12.5px] italic leading-snug text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
            >
              {t(q)}
            </button>
          ))}
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            aria-label={t("Reload suggestions")}
            title={t("Reload suggestions")}
            data-testid="suggestion-reload"
            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <motion.span
              aria-hidden="true"
              animate={{ rotate: spin * 180 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </motion.span>
          </button>
        </motion.div>
      </AnimatePresence>
      {/* edge fade — the strip dissolves instead of clipping */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent"
      />
    </div>
  );
}
