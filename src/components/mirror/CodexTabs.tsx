"use client";

import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { archiveTotals } from "@/lib/mirror-store";
import { idmArchiveTotal } from "@/lib/data/idm-archive";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE CODEX'S OWN TABS — the four categories of the codex, one       */
/*  shared rail: Civilisations · Interdimensional · Hyperspace and     */
/*  the Interdimensional Archive (the sibling collection stands        */
/*  INSIDE the codex as its own category, never as a door of its       */
/*  own at the top of the chat). Every register branch wears the       */
/*  same rail, so the codex is one room with four categories.          */
/* ------------------------------------------------------------------ */

export const CODEX_TABS: {
  kind: "civilization" | "interdim" | "hyperspace" | "archive";
  label: string;
  count: number;
}[] = [
  { kind: "civilization", label: "Civilisations", count: archiveTotals.civilizations },
  { kind: "interdim", label: "Interdimensional", count: archiveTotals.interdim },
  { kind: "hyperspace", label: "Hyperspace", count: archiveTotals.innerearth },
  { kind: "archive", label: "Interdim. Archive", count: idmArchiveTotal },
];

export function CodexTabs({
  registerKind,
  className,
}: {
  registerKind: string;
  className?: string;
}) {
  const openRegister = useMirror((s) => s.openRegister);
  const t = useT();
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-wrap items-stretch justify-center gap-1.5",
        className
      )}
      role="tablist"
      aria-label={t("The codex registers")}
      data-testid="codex-rail"
    >
      {CODEX_TABS.map((tab) => {
        const active = registerKind === tab.kind;
        return (
          <button
            key={tab.kind}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => openRegister(tab.kind)}
            data-testid={`codex-kind-${tab.kind}`}
            className={cn(
              "focus-glow flex min-w-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-all duration-300",
              active
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] font-semibold text-foreground"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="truncate">{t(tab.label)}</span>
            <span className="mono-label shrink-0 tabular-nums text-[9.5px] text-muted-foreground/75">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
