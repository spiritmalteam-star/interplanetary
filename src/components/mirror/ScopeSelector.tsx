"use client";

import { Check } from "lucide-react";
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

/* Each scope has its own small engraved image — the picture speaks,
   never the category name. Interplanetary remains the resting default. */
const SCOPE_ART: Record<string, string> = {
  interplanetary: "/images/ai/scope-art-interplanetary.png",
  metaphysics: "/images/ai/scope-art-metaphysics.png",
  quantum: "/images/ai/scope-art-quantum.png",
  healing: "/images/ai/scope-art-healing.png",
};

const artFor = (id: string) => SCOPE_ART[id] ?? "/images/ai/cosmic-mark.png";

/**
 * The scope selector — one engraved scope image floating at the very
 * top-right of the application, never interfering with the text.
 * Chooses which Mirror Entity channel the seeker speaks in; picking
 * the active scope returns to the quiet observatory.
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
        id="scope-selector-trigger"
        aria-label={t("Select scope")}
        title={t("Select scope")}
        data-testid="scope-selector"
        className="focus-glow flex size-10 items-center justify-center overflow-hidden rounded-full border hairline bg-white shadow-[0_2px_14px_-8px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)]"
      >
        <img
          src={artFor(active.id)}
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[264px] rounded-2xl border hairline bg-[var(--glass-bg-strong)] p-1.5 backdrop-blur-2xl"
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
              <img
                src={artFor(m.id)}
                alt=""
                aria-hidden="true"
                className="size-7 shrink-0 rounded-lg border hairline bg-white object-cover"
              />
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
