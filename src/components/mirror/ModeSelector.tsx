"use client";

import { motion } from "framer-motion";
import { modes, modeContext } from "@/lib/data/metaphysics";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ModeSelector() {
  const activeMode = useMirror((s) => s.activeMode);
  const setMode = useMirror((s) => s.setMode);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const view = useMirror((s) => s.view);
  const t = useT();
  const context = modeContext[activeMode];

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="flex w-full max-w-full justify-start overflow-x-auto py-0.5 no-scrollbar sm:justify-center"
        role="group"
        aria-label={t("Channel mode")}
      >
        <div className="flex min-w-max items-center gap-1.5 sm:gap-2 px-1">
          <span className="mono-label mr-1 hidden text-[11.5px] text-muted-foreground/70 sm:inline">
            {t("Mode:")}
          </span>
          {modes.map((m) => {
            const active = m.id === activeMode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => (active && view !== "observatory" ? returnToObservatory() : setMode(m.id))}
                aria-pressed={active}
                title={
                  active && view !== "observatory"
                    ? t("Return to the Observatory")
                    : t(m.label)
                }
                className={cn(
                  "focus-glow flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[14.5px] transition-all duration-300 sm:px-4",
                  active
                    ? "animate-pill-breathe border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground"
                    : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                )}
              >
                <span aria-hidden="true" className="text-[14.5px] leading-none">
                  {m.emoji}
                </span>
                {t(m.label)}
              </button>
            );
          })}
        </div>
      </div>

      {context && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mono-label text-center text-[10.5px] text-muted-foreground/70"
        >
          {t(context)}
        </motion.p>
      )}
    </div>
  );
}
