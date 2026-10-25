"use client";

/* ------------------------------------------------------------------ */
/*  THE MINIMAL TOP CONTROL — the house's one small universal tab.     */
/*                                                                     */
/*   ◉ Profile | Scopes ▾ | Tools ▾ | History | ☰                      */
/*                                                                     */
/*  One quiet pill floats over the canvas, anchored inside the safe    */
/*  viewport: the Passage hand (the visitor's own profile) stands at   */
/*  the beginning of the pill, the Scopes hand carries the fields of   */
/*  the house (General, Interplanetary, Quantum, ArtX, HealX — one     */
/*  touch walks the tree into that field), the Tools hand opens the    */
/*  making rooms (Manifest, Akashic, Book, Music, Invent) as mini      */
/*  tabs, the History hand reopens the conversation's own past, and    */
/*  the Menu hand keeps the one universal menu whole. The old root     */
/*  diamond rests — the walk's own hands and the menu carry the        */
/*  return home. On small screens the words rest and the marks remain. */
/*                                                                     */
/*  No second toolbar was stacked; the vertical arm keeps only the     */
/*  walk's hands and starts folded. The canvas keeps every pixel.      */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  ChevronDown,
  History as HistoryIcon,
  Hammer,
  ListTree,
  Menu as MenuIcon,
  UserRound,
} from "lucide-react";
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

/* THE FIVE SCOPES — the fields of the house the visitor walks between.
   Each rides one of the walk's own categories: picking one focuses the
   whole tree on that field of branches (the canopy's focus law). */
const SCOPES: {
  key: string;
  label: string;
  spirit: string;
  accent: string;
}[] = [
  { key: "general", label: "General", spirit: "The whole house, mixed", accent: "" },
  { key: "interplanetary", label: "Interplanetary", spirit: "The star families and worlds", accent: "#22d3ee" },
  { key: "quantum", label: "Quantum", spirit: "The deep nature of reality", accent: "#a78bfa" },
  { key: "artx", label: "ArtX", spirit: "The atelier of visions", accent: "#e879f9" },
  { key: "healing", label: "HealX", spirit: "The body's quiet evolution", accent: "#2dd4bf" },
];

/* the tools' own quiet subtitles, by door key */
const DOOR_SPIRITS: Record<string, string> = {
  manifest: "The manifesting chamber",
  akashic: "The records' hall",
  book: "The dream loom",
  music: "The songs of light",
  invent: "The inventor's studio",
};

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
  onHistory,
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
  /** the conversation's own past — the history hand */
  onHistory: () => void;
  onPassage: () => void;
  /** the portal's own hands (the landing/landing-return button) */
  realmControls?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const t = useT();
  /* the navigator's clarity, reported as it changes — the menu's foot
     wears its honest pressed state */
  const [railState, setRailState] = useState<RailLiteState>(RAIL_LITE_EMPTY);
  /* the pill's own two dropdowns — scopes and tools, closed by default */
  const [pill, setPill] = useState<"scopes" | "tools" | null>(null);

  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<Partial<RailLiteState>>).detail;
      if (!d || d.clarity === undefined) return;
      setRailState((s) => ({ ...s, clarity: d.clarity as boolean }));
    };
    window.addEventListener("nav:rail-state", onState);
    return () => window.removeEventListener("nav:rail-state", onState);
  }, []);

  /* Escape lays the pill's own dropdowns down */
  useEffect(() => {
    if (!pill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPill(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pill]);

  const scopeFocused = useCallback(
    (key: string) => {
      if (key === "general") return generalFocused;
      return cats.some((c) => c.key === key && c.focused);
    },
    [cats, generalFocused]
  );

  const pickScope = useCallback(
    (key: string) => {
      setPill(null);
      onPickCategory(key);
    },
    [onPickCategory]
  );

  const pickTool = useCallback(
    (door: TopDoor) => {
      setPill(null);
      door.on();
    },
    []
  );

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
        {/* THE PASSAGE HAND — the visitor's own profile, standing at
            the beginning of the pill */}
        <button
          type="button"
          onClick={onPassage}
          aria-label={t("Open your profile")}
          title={t("Open your profile")}
          data-testid={`${testIdPrefix}-top-profile`}
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-foreground/90 transition-colors duration-200 hover:bg-foreground/5"
        >
          <UserRound
            className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
            aria-hidden="true"
          />
          <span className="hidden text-[12.5px] font-medium tracking-wide md:inline">
            {t("Profile")}
          </span>
        </button>

        <i
          aria-hidden="true"
          className="h-4 w-px shrink-0"
          style={{ backgroundColor: "var(--hairline)" }}
        />

        {/* THE SCOPES HAND — the fields of the house: General,
            Interplanetary, Quantum, ArtX, HealX. One touch walks the
            tree into that field of branches. */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPill((p) => (p === "scopes" ? null : "scopes"))}
            aria-haspopup="menu"
            aria-expanded={pill === "scopes"}
            aria-label={t("The scopes of the house")}
            title={t("The scopes of the house")}
            data-testid={`${testIdPrefix}-top-scopes`}
            className={cn(
              "focus-glow flex h-8 items-center gap-1 rounded-full px-2.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground",
              pill === "scopes" && "bg-foreground/10 text-foreground"
            )}
          >
            <ListTree className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden text-[12px] sm:inline">
              {t("Scopes")}
            </span>
            <ChevronDown
              className={cn(
                "size-2.5 shrink-0 transition-transform duration-300",
                pill === "scopes" && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          {pill === "scopes" && (
            <div
              data-testid={`${testIdPrefix}-top-scopes-panel`}
              className="nice-scroll absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[248px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-2 lift-lg"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
              role="menu"
            >
              {SCOPES.map((s) => {
                const focused = scopeFocused(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={focused}
                    onClick={() => pickScope(s.key)}
                    title={t(s.spirit)}
                    data-testid={`${testIdPrefix}-top-scope-${s.key}`}
                    className={cn(
                      "focus-glow flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]",
                      focused &&
                        "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: s.accent || "var(--scope-a,var(--gd))",
                        boxShadow: focused
                          ? `0 0 0 3px color-mix(in srgb, ${
                              s.accent || "var(--scope-a,var(--gd))"
                            } 22%, transparent)`
                          : undefined,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-foreground">
                        {t(s.label)}
                      </span>
                      <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                        {t(s.spirit)}
                      </span>
                    </span>
                    {focused && (
                      <span
                        className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]"
                      >
                        {t("Here")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* THE TOOLS HAND — the making rooms of the house, each opening
            as a mini tab over the walk: Manifest, Akashic, Book,
            Music, Invent. */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPill((p) => (p === "tools" ? null : "tools"))}
            aria-haspopup="menu"
            aria-expanded={pill === "tools"}
            aria-label={t("The tools of the house")}
            title={t("The tools of the house")}
            data-testid={`${testIdPrefix}-top-tools`}
            className={cn(
              "focus-glow flex h-8 items-center gap-1 rounded-full px-2.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground",
              pill === "tools" && "bg-foreground/10 text-foreground"
            )}
          >
            <Hammer className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden text-[12px] sm:inline">
              {t("Tools")}
            </span>
            <ChevronDown
              className={cn(
                "size-2.5 shrink-0 transition-transform duration-300",
                pill === "tools" && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          {pill === "tools" && (
            <div
              data-testid={`${testIdPrefix}-top-tools-panel`}
              className="nice-scroll absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[236px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-2 lift-lg"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
              role="menu"
            >
              {doors.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  role="menuitem"
                  onClick={() => pickTool(d)}
                  title={t(DOOR_SPIRITS[d.key] ?? d.label)}
                  data-testid={`${testIdPrefix}-top-tool-${d.key}`}
                  className="focus-glow flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]"
                >
                  <d.icon
                    className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-foreground">
                      {t(d.label)}
                    </span>
                    {DOOR_SPIRITS[d.key] && (
                      <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                        {t(DOOR_SPIRITS[d.key])}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* THE HISTORY HAND — the conversation's own past returns */}
        <button
          type="button"
          onClick={onHistory}
          aria-label={t("Conversation history")}
          title={t("Conversation history")}
          data-testid={`${testIdPrefix}-top-history`}
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
        >
          <HistoryIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden text-[12px] md:inline">
            {t("History")}
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

      {/* the pill's own dropdowns close on any outside touch */}
      {pill && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30"
          onClick={() => setPill(null)}
        />
      )}

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
