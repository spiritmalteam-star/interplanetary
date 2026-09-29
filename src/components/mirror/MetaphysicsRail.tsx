"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eraser, Moon } from "lucide-react";
import { schools, veils } from "@/lib/data/metaphysics";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * MetaphysicsRail — the veil button of the metaphysics scope, mounted
 * VERTICALLY at the side of the chat, hugging the right edge of the
 * screen. It never enters the text column: the closed rail is a slim
 * vertical tab in the margin, and the calibration popover only opens
 * on demand, floating beside the tab. A school (where the question
 * comes from) and a veil (the depth through which it is read) fuse
 * into one contemplative seeing.
 */
export function MetaphysicsRail() {
  const activeMode = useMirror((s) => s.activeMode);
  const view = useMirror((s) => s.view);
  const activeSchool = useMirror((s) => s.activeSchool);
  const activeVeil = useMirror((s) => s.activeVeil);
  const setSchool = useMirror((s) => s.setSchool);
  const setVeil = useMirror((s) => s.setVeil);
  const t = useT();
  const [open, setOpen] = useState(false);

  const visible =
    activeMode === "metaphysics" && (view === "observatory" || view === "transmission");

  const calibrationCount = (activeSchool ? 1 : 0) + (activeVeil ? 1 : 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="metaphysics-veil-rail"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed right-0 top-1/2 z-30 -translate-y-1/2"
          data-testid="metaphysics-veil-rail"
        >
          <div className="relative flex items-center">
            {/* ---------- vertical calibration popover ---------- */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="absolute right-full top-1/2 mr-2 max-h-[68dvh] w-56 -translate-y-1/2 overflow-y-auto nice-scroll rounded-2xl glass-strong border hairline p-3.5 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.55)]"
                  role="group"
                  aria-label={t("Veil calibration")}
                >
                  <p className="mono-label text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                    {t("Schools of the unseen")}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {schools.map((p) => {
                      const active = p.id === activeSchool;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSchool(p.id)}
                          aria-pressed={active}
                          className={cn(
                            "focus-glow flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13.5px] transition-all duration-200",
                            active
                              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground glow-sm"
                              : "border-transparent text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                          )}
                        >
                          <span aria-hidden="true" className="text-[13.5px] leading-none">
                            {p.emoji}
                          </span>
                          {t(p.label)}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mono-label mt-4 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                    {t("Veils")}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {veils.map((p) => {
                      const active = p.id === activeVeil;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setVeil(p.id)}
                          aria-pressed={active}
                          className={cn(
                            "focus-glow flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13.5px] transition-all duration-200",
                            active
                              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground glow-sm"
                              : "border-transparent text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                          )}
                        >
                          <span aria-hidden="true" className="text-[13.5px] leading-none">
                            {p.emoji}
                          </span>
                          {t(p.label)}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeSchool) setSchool(activeSchool);
                      if (activeVeil) setVeil(activeVeil);
                    }}
                    className="focus-glow mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border hairline px-2 py-1.5 text-[12.5px] text-muted-foreground transition-all duration-200 hover:border-[var(--hairline-hover)] hover:text-foreground"
                  >
                    <Eraser className="size-3" aria-hidden="true" />
                    {t("Clear calibration")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---------- the vertical tab ---------- */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={t("Veil calibration")}
              title={t("Veil calibration")}
              className={cn(
                "focus-glow flex flex-col items-center gap-2 rounded-l-xl border border-r-0 py-4 pl-1.5 pr-2 transition-all duration-300",
                open
                  ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_14%,var(--glass-bg-strong))] glow-sm"
                  : "hairline bg-[var(--glass-bg-soft)] backdrop-blur-md hover:bg-[color-mix(in_srgb,var(--cy)_10%,var(--glass-bg-soft))]"
              )}
            >
              <Moon
                className={cn(
                  "size-4 transition-colors duration-300",
                  calibrationCount > 0 ? "text-[var(--cy)]" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span
                className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-foreground/80"
                style={{ writingMode: "vertical-rl" }}
              >
                {t("Veils")}
              </span>
              {calibrationCount > 0 && (
                <span
                  className="flex size-4 items-center justify-center rounded-full border hairline bg-[color-mix(in_srgb,var(--cy)_16%,transparent)] font-mono text-[10.5px] leading-none text-[var(--cy)]"
                  aria-hidden="true"
                >
                  {calibrationCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
