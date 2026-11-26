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
/*                                                                     */
/*  THE MARGIN'S OWN HAND — the rail no longer stands as a centered    */
/*  row of fat identical pills: it sits at the margin like index       */
/*  tags laid by hand — each wing a slim card with a hairline rim,     */
/*  a small brass tick and its own slight lean and offset, so the      */
/*  row reads as scattered slips in a codex, never a machine row.      */
/*  (The lean rests on the palm — straight tags tap truer there.)      */
/* ------------------------------------------------------------------ */

export const CODEX_TABS: {
  kind: "civilization" | "interdim" | "hyperspace" | "archive";
  label: string;
  count: number;
}[] = [
  { kind: "civilization", label: "Civilisations", count: archiveTotals.civilizations },
  { kind: "hyperspace", label: "Hyperspace", count: archiveTotals.innerearth },
  /* THE INTERDIMENSIONAL INSIDE THE CODEX — the visitor named it home:
     its own wing, standing directly NEXT TO the Hyperspace wing, with
     its profiles wearing the same dossier structure as every other
     category. The scopes' shore carries its door no more. */
  { kind: "interdim", label: "Interdimensional", count: archiveTotals.interdim },
  { kind: "archive", label: "Interdim. Archive", count: idmArchiveTotal },
];

/* each wing's own lean and offset — the hand-laid, non-symmetric row */
const TAB_POSTURE = [
  "sm:-rotate-[0.8deg] sm:translate-y-[1px]",
  "sm:rotate-[0.6deg] sm:-translate-y-[2px] sm:translate-x-[2px]",
  "sm:-rotate-[0.4deg] sm:translate-y-[2px]",
  "sm:rotate-[1deg] sm:-translate-y-[1px] sm:translate-x-[1px]",
] as const;

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
        "flex max-w-full flex-wrap items-start gap-x-2 gap-y-2.5 sm:gap-x-3",
        className
      )}
      role="tablist"
      aria-label={t("The codex registers")}
      data-testid="codex-rail"
    >
      {CODEX_TABS.map((tab, i) => {
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
              "focus-glow group flex min-w-0 origin-center items-center gap-1.5 rounded-[9px] border px-2 py-1 text-[10.5px] transition-all duration-300",
              TAB_POSTURE[i % TAB_POSTURE.length],
              active
                ? "border-[rgba(196,158,110,0.5)] bg-[color-mix(in_srgb,var(--cy)_9%,transparent)] font-semibold text-foreground shadow-[0_6px_18px_-10px_rgba(20,12,5,0.55)]"
                : "border-[var(--hairline)] bg-transparent text-muted-foreground hover:border-[rgba(196,158,110,0.4)] hover:text-foreground"
            )}
          >
            {/* the brass tick — a small seal mark before the name */}
            <span
              aria-hidden="true"
              className={cn(
                "block size-[4px] shrink-0 rounded-[1px] transition-all duration-300",
                active
                  ? "bg-[rgba(196,158,110,0.95)] shadow-[0_0_6px_rgba(196,158,110,0.6)]"
                  : "bg-[rgba(196,158,110,0.35)] group-hover:bg-[rgba(196,158,110,0.6)]"
              )}
            />
            <span className="mono-label truncate tracking-[0.05em]">{t(tab.label)}</span>
            <span className="mono-label shrink-0 tabular-nums text-[8.5px] text-muted-foreground/70">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
