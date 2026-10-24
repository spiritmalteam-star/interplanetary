"use client";

/* ------------------------------------------------------------------ */
/*  THE MINIMAL TOP CONTROL — the Universal Evolution Protocol's one   */
/*  small universal top tab.                                           */
/*                                                                     */
/*      ◈ Mirror · Quantum World        Search        Menu             */
/*                                                                     */
/*  One quiet pill floats over the canvas, anchored inside the safe    */
/*  viewport: the Mirror hand returns to the root of the walk, the     */
/*  Search hand opens the one universal menu with its field lit, the   */
/*  Menu hand opens the same menu whole. Everything else — the walk's  */
/*  ledger, the trail, the categories, the doors of the house, the     */
/*  light, the passage — lives behind the menu, which stays closed by  */
/*  default. On small screens the words rest and the marks remain.     */
/*                                                                     */
/*  No second toolbar was stacked; the vertical arm keeps only the     */
/*  walk's hands and starts folded. The canvas keeps every pixel.      */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useState, type ReactNode } from "react";
import { Diamond, Menu as MenuIcon, Search as SearchIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  UniversalMenu,
  type TopCatItem,
  type TopDoor,
  type TopLedger,
} from "./UniversalMenu";

interface RailLiteState {
  clarity: boolean;
}

const RAIL_LITE_EMPTY: RailLiteState = { clarity: false };

export const TopControl = memo(function TopControl({
  testIdPrefix,
  open,
  onOpenChange,
  mixLabel,
  lineage,
  onTrailStep,
  onRecalibrate,
  ledger,
  onLedgerVolume,
  onLedgerChat,
  generalFocused,
  cats,
  onPickCategory,
  doors,
  onPassage,
  realmControls,
  headerExtra,
}: {
  testIdPrefix: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** the walk's own context — "General", "Quantum World", … */
  mixLabel: string;
  lineage: { id: string | null; text: string }[];
  onTrailStep: (step: { id: string | null; text: string }) => void;
  onRecalibrate: () => void;
  ledger: TopLedger | null;
  onLedgerVolume: (key: string) => void;
  onLedgerChat: (key: string) => void;
  generalFocused: boolean;
  cats: TopCatItem[];
  onPickCategory: (key: string | "general") => void;
  doors: TopDoor[];
  onPassage: () => void;
  /** the portal's own hands (the landing/landing-return button) */
  realmControls?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const t = useT();
  /* the navigator's clarity, reported as it changes — the menu's foot
     wears its honest pressed state */
  const [railState, setRailState] = useState<RailLiteState>(RAIL_LITE_EMPTY);

  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<Partial<RailLiteState>>).detail;
      if (!d || d.clarity === undefined) return;
      setRailState((s) => ({ ...s, clarity: d.clarity as boolean }));
    };
    window.addEventListener("nav:rail-state", onState);
    return () => window.removeEventListener("nav:rail-state", onState);
  }, []);

  const send = useCallback((name: string) => {
    window.dispatchEvent(new CustomEvent(name));
  }, []);

  return (
    <div
      className="absolute z-40"
      style={{
        top: "max(0.5rem, env(safe-area-inset-top))",
        left: "max(0.5rem, env(safe-area-inset-left))",
      }}
      data-testid={`${testIdPrefix}-top`}
    >
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full border bg-background/92 p-1 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] transition-colors duration-300"
        )}
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, var(--hairline))",
        }}
      >
        {/* THE MIRROR HAND — the root's own mark: one touch returns the
            walk to the welcoming heart of the tree. The context rides
            beside it (the standing category), words resting on phones. */}
        <button
          type="button"
          onClick={() => send("nav:rail-home")}
          aria-label={t("Return to the root of the walk")}
          title={`${t("Return to the root of the walk")} — ${mixLabel}`}
          data-testid={`${testIdPrefix}-top-home`}
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-foreground/90 transition-colors duration-200 hover:bg-foreground/5"
        >
          <Diamond
            className="size-3 shrink-0 text-[var(--scope-a,var(--gd))]"
            aria-hidden="true"
          />
          <span className="hidden text-[12.5px] font-medium tracking-wide sm:inline">
            Mirror
          </span>
          <span
            className="mono-label hidden max-w-[130px] truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80 md:inline"
            aria-hidden="true"
          >
            · {mixLabel}
          </span>
        </button>

        <i
          aria-hidden="true"
          className="h-4 w-px shrink-0"
          style={{ backgroundColor: "var(--hairline)" }}
        />

        {/* THE SEARCH HAND — one field finds everything */}
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t("Search everything")}
          title={t("Search everything")}
          data-testid={`${testIdPrefix}-top-search`}
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
        >
          <SearchIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden text-[12px] sm:inline">
            {t("Search")}
          </span>
        </button>

        {/* THE MENU HAND — the one menu, closed by default */}
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t("Menu")}
          title={t("Menu")}
          data-testid={`${testIdPrefix}-top-menu`}
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground",
            open && "bg-foreground/10 text-foreground"
          )}
        >
          <MenuIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden text-[12px] sm:inline">{t("Menu")}</span>
        </button>

        {/* the portal's own hands and the page's extras keep their slot */}
        {realmControls && (
          <div className="flex shrink-0 items-center gap-1 pl-0.5">
            {realmControls}
          </div>
        )}
        {headerExtra && (
          <div className="hidden shrink-0 items-center gap-1.5 pl-0.5 sm:flex">
            {headerExtra}
          </div>
        )}
      </div>

      {/* THE UNIVERSAL MENU — one popover below the pill, closed by
          default, closed again by every choice it serves */}
      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50">
            <UniversalMenu
              testIdPrefix={testIdPrefix}
              clarity={railState.clarity}
              onClose={() => onOpenChange(false)}
              mixTitle={mixLabel}
              lineage={lineage}
              onTrailStep={onTrailStep}
              onRecalibrate={onRecalibrate}
              ledger={ledger}
              onLedgerVolume={onLedgerVolume}
              onLedgerChat={onLedgerChat}
              generalFocused={generalFocused}
              cats={cats}
              onPickCategory={onPickCategory}
              doors={doors}
              onPassage={onPassage}
            />
          </div>
        </>
      )}
    </div>
  );
});
