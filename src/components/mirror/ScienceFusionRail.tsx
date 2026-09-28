"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eraser, Layers } from "lucide-react";
import { ALL_LENS_IDS, scienceLenses } from "@/lib/data/science";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * ScienceFusionRail — the fusion lens rail of the science scope, mounted
 * VERTICALLY at the side of the chat, hugging the right edge of the
 * screen. The eight lenses are multi-select: one lit lens sees alone,
 * two or more fused lenses open the fusion document, none lit means the
 * plain science channel. ALL eight are lit by default.
 */
export function ScienceFusionRail() {
  const activeMode = useMirror((s) => s.activeMode);
  const view = useMirror((s) => s.view);
  const activeLenses = useMirror((s) => s.scienceLenses);
  const toggleScienceLens = useMirror((s) => s.toggleScienceLens);
  const setScienceLenses = useMirror((s) => s.setScienceLenses);
  const t = useT();
  const [open, setOpen] = useState(false);

  const visible =
    activeMode === "science" && (view === "observatory" || view === "transmission");

  const count = activeLenses.length;
  const fused = count >= 2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="science-fusion-rail"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed right-0 top-1/2 z-30 -translate-y-1/2"
          data-testid="science-fusion-rail"
        >
          <div className="relative flex items-center">
            {/* ---------- vertical lens popover ---------- */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute right-full top-1/2 mr-2 max-h-[68dvh] w-60 -translate-y-1/2 overflow-y-auto nice-scroll rounded-2xl glass-strong border hairline p-3.5 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.55)]"
                  role="group"
                  aria-label={t("Fusion lenses")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono-label text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                      {t("Fusion lenses")}
                    </p>
                    <span
                      className="mono-label rounded-full border px-1.5 py-0.5 text-[10px]"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--cy) 40%, transparent)",
                        color: "var(--cy)",
                      }}
                    >
                      {count}/8
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground/75">
                    {fused
                      ? t("Fusion mode — the lenses answer as one document")
                      : t("Light one lens to see alone, two or more to fuse")}
                  </p>

                  <div className="mt-3 flex flex-col gap-1">
                    {scienceLenses.map((lens) => {
                      const active = activeLenses.includes(lens.id);
                      return (
                        <button
                          key={lens.id}
                          type="button"
                          onClick={() => toggleScienceLens(lens.id)}
                          aria-pressed={active}
                          className={cn(
                            "focus-glow flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13.5px] transition-all duration-200",
                            active
                              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground glow-sm"
                              : "border-transparent text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="text-[13.5px] leading-none"
                          >
                            {lens.emoji}
                          </span>
                          <span className="flex-1">
                            <span className="block leading-tight">
                              {lens.name.charAt(0) + lens.name.slice(1).toLowerCase()}
                            </span>
                            <span className="mono-label block text-[9.5px] font-normal tracking-[0.08em] text-muted-foreground/70">
                              {t(lens.tag)}
                            </span>
                          </span>
                          {active && (
                            <Check
                              className="size-3.5 shrink-0 text-[var(--cy)]"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScienceLenses(ALL_LENS_IDS)}
                      className="focus-glow flex flex-1 items-center justify-center gap-1 rounded-lg border hairline px-2 py-1.5 text-[12.5px] text-muted-foreground transition-all duration-200 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <Layers className="size-3" aria-hidden="true" />
                      {t("All eight")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScienceLenses([])}
                      className="focus-glow flex flex-1 items-center justify-center gap-1 rounded-lg border hairline px-2 py-1.5 text-[12.5px] text-muted-foreground transition-all duration-200 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <Eraser className="size-3" aria-hidden="true" />
                      {t("Clear")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---------- the vertical tab ---------- */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={t("Fusion lenses")}
              title={t("Fusion lenses")}
              className={cn(
                "focus-glow flex flex-col items-center gap-2 rounded-l-xl border border-r-0 py-4 pl-1.5 pr-2 transition-all duration-300",
                open || fused
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_14%,var(--glass-bg-strong))] glow-sm"
                  : "hairline bg-[var(--glass-bg-soft)] backdrop-blur-md hover:bg-[color-mix(in_srgb,var(--cy)_10%,var(--glass-bg-soft))]"
              )}
            >
              <Layers
                className={cn(
                  "size-4 transition-colors duration-300",
                  count > 0 ? "text-[var(--cy)]" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span
                className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-foreground/80"
                style={{ writingMode: "vertical-rl" }}
              >
                {t("Fusion")}
              </span>
              {count > 0 && (
                <span
                  className="flex size-4 items-center justify-center rounded-full border hairline bg-[color-mix(in_srgb,var(--cy)_16%,transparent)] font-mono text-[10.5px] leading-none text-[var(--cy)]"
                  aria-hidden="true"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
