"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, RefreshCw, Orbit } from "lucide-react";
import { scopeSuggestionPools } from "@/lib/data/suggestions";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import type { Mode } from "@/lib/mirror-types";
import { cn } from "@/lib/utils";

/** How many suggestions are visible at once (wrap-around window). */
const WINDOW = 6;

/**
 * Keyed by mode (see QuestionCards below) so offset/spin state resets
 * naturally when the scope changes — no setState-in-effect required.
 */
function SuggestionGrid({ mode }: { mode: Mode }) {
  const status = useMirror((s) => s.sessions[mode].status);
  const askMirror = useMirror((s) => s.askMirror);
  const t = useT();
  /* Every visit (and every reload) opens a different window of the
     scope's 66-question pool. The offset starts DETERMINISTIC (0) so
     server and client render identically — the random window is drawn
     in a client effect after hydration. */
  const [offset, setOffset] = useState(0);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    setOffset(Math.floor(Math.random() * scopeSuggestionPools[mode].length));
  }, [mode]);

  const pool = scopeSuggestionPools[mode];
  const visible = pool
    .map((_, i) => pool[(offset + i) % pool.length])
    .slice(0, WINDOW);
  const loading = status === "loading";

  const reload = () => {
    setOffset(Math.floor(Math.random() * pool.length));
    setSpin((n) => n + 1);
  };

  const send = (q: string) => {
    if (loading) return;
    void askMirror(q);
  };

  return (
    <section
      aria-label={t("Suggested questions")}
      className="mx-auto mt-10 w-full max-w-[820px] px-1"
    >
      {/* header row — label + reload suggestions */}
      <div className="flex items-center justify-between">
        <span className="mono-label text-[10.5px] text-muted-foreground/70">
          {t("Suggested questions")}
        </span>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          aria-label={t("Reload suggestions")}
          title={t("Reload suggestions")}
          className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground/80 transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <motion.span
            aria-hidden="true"
            animate={{ rotate: spin * 180 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      {/* window of six suggestions — a fresh random window on every
          visit, scope change and reload of the 66-question pool */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${mode}-${offset}`}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "mt-3 grid grid-cols-1 gap-3 md:grid-cols-2",
            loading && "pointer-events-none opacity-60"
          )}
        >
          {visible.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              aria-disabled={loading}
              className="focus-glow group flex min-h-[64px] items-center gap-3.5 rounded-[18px] glass px-5 py-3.5 text-left shadow-[0_2px_16px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:bg-[color-mix(in_srgb,var(--cy)_7%,var(--glass-bg))] hover:glow-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] transition-transform duration-300 group-hover:scale-105">
                <Orbit
                  className="size-3.5 text-[var(--cy)]"
                  aria-hidden="true"
                />
              </span>
              <span className="flex-1 text-[14.5px] leading-snug text-foreground/85 sm:text-[15px]">
                {t(q)}
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--cy)]"
                aria-hidden="true"
              />
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function QuestionCards() {
  const activeMode = useMirror((s) => s.activeMode);
  return <SuggestionGrid key={activeMode} mode={activeMode} />;
}
