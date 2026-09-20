"use client";

import { AnimatePresence, motion } from "framer-motion";
import { directions, fusionFields } from "@/lib/data/science";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

function PillRow({
  label,
  pills,
  activeId,
  onSelect,
}: {
  label: string;
  pills: { id: string; emoji: string; label: string }[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-3">
      <span className="mono-label shrink-0 text-[9px] text-muted-foreground/70">
        {label}
      </span>
      <div className="flex w-full justify-start overflow-x-auto py-0.5 no-scrollbar sm:min-w-0 sm:flex-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
        <div className="flex min-w-max items-center gap-1.5 px-0.5 sm:min-w-0 sm:flex-wrap sm:justify-center">
          {pills.map((p) => {
            const active = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                aria-pressed={active}
                className={cn(
                  "focus-glow flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
                  active
                    ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_13%,transparent)] font-semibold text-foreground glow-sm"
                    : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                )}
              >
                <span aria-hidden="true" className="text-[11.5px] leading-none">
                  {p.emoji}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ScienceFilters() {
  const activeMode = useMirror((s) => s.activeMode);
  const activeScienceField = useMirror((s) => s.activeScienceField);
  const activeDirection = useMirror((s) => s.activeDirection);
  const setScienceField = useMirror((s) => s.setScienceField);
  const setDirection = useMirror((s) => s.setDirection);

  return (
    <AnimatePresence initial={false}>
      {activeMode === "science" && (
        <motion.div
          key="science-filters"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto mt-4 flex w-full max-w-[820px] flex-col gap-2 rounded-2xl glass px-3 py-3 sm:px-5"
          aria-label="Science calibration filters"
        >
          <PillRow
            label="Fusion fields:"
            pills={fusionFields}
            activeId={activeScienceField}
            onSelect={setScienceField}
          />
          <PillRow
            label="Direction:"
            pills={directions}
            activeId={activeDirection}
            onSelect={setDirection}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
