"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { modes, modeContext } from "@/lib/data/metaphysics";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The scope selector — one calm dropdown pinned to the top-right of the
 * application. Chooses which Mirror Entity channel the seeker speaks in;
 * picking the active scope returns to the quiet observatory.
 */
export function ScopeSelector() {
  const activeMode = useMirror((s) => s.activeMode);
  const setMode = useMirror((s) => s.setMode);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const view = useMirror((s) => s.view);
  const t = useT();

  const active = modes.find((m) => m.id === activeMode) ?? modes[0];
  const inChannel = view === "transmission";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Select scope")}
        data-testid="scope-selector"
        className="focus-glow flex h-9 items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-3.5 text-[13.5px] font-medium text-foreground/85 shadow-[0_2px_14px_-8px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        <span aria-hidden="true" className="text-[14px] leading-none">
          {active.emoji}
        </span>
        <span className="max-w-[110px] truncate sm:max-w-none">
          {t(active.label)}
        </span>
        <ChevronDown
          className="size-3.5 text-muted-foreground/70"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[248px] rounded-2xl border hairline bg-[var(--glass-bg-strong)] p-1.5 backdrop-blur-2xl"
      >
        <DropdownMenuLabel className="mono-label px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
          {t("Channel mode")}
        </DropdownMenuLabel>
        {modes.map((m) => {
          const isActive = m.id === activeMode;
          return (
            <DropdownMenuItem
              key={m.id}
              data-testid={`scope-option-${m.id}`}
              onSelect={() =>
                isActive
                  ? returnToObservatory()
                  : setMode(m.id)
              }
              className={cn(
                "cursor-pointer gap-2.5 rounded-xl px-2.5 py-2",
                isActive && "bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]"
              )}
            >
              <span aria-hidden="true" className="text-[15px] leading-none">
                {m.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-foreground/90">
                  {t(m.label)}
                </span>
                {modeContext[m.id] && (
                  <span className="block truncate text-[11px] leading-snug text-muted-foreground/70">
                    {t(modeContext[m.id])}
                  </span>
                )}
              </span>
              {isActive && (
                <Check
                  className="size-3.5 shrink-0 text-[var(--cy)]"
                  aria-hidden="true"
                />
              )}
              {isActive && inChannel && (
                <span className="sr-only">{t("Return to the Observatory")}</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
