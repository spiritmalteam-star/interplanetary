"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Hammer, Layers, Music, ScrollText } from "lucide-react";
import {
  useMirror,
  type LandingScopeKey,
} from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE LANDING'S OWN NAV — the walk's two quiet hands, carried small  */
/*  on the docked crown. Create opens the house's making rooms as      */
/*  mini tabs over the docked chat (the tab window is the chat's own   */
/*  exact size); Scopes walks the threshold's floor into one field's   */
/*  light. They exist ONLY for the landing's bare crown — the full     */
/*  portal keeps its own pill, doors and menus untouched.              */
/*                                                                     */
/*  CALM LAWS: closed by default, one panel at a time; outside-click   */
/*  and Escape lay them down; the only motion is a 0.2s opacity/       */
/*  translate settle — no continuous animation, nothing runs forever.  */
/* ------------------------------------------------------------------ */

/* THE FOUR FIELDS — the same scopes the walk's own Scopes hand
   speaks (TopControl's panel), worn here verbatim: same names, same
   spirits, same lights. No "General" item stands — choosing a lit
   scope again lays it back down, and the whole house returns. */
const NAV_SCOPES: {
  key: LandingScopeKey;
  label: string;
  spirit: string;
  accent: string;
}[] = [
  {
    key: "interplanetary",
    label: "Interplanetary",
    spirit: "The star families and worlds",
    accent: "#22d3ee",
  },
  {
    key: "quantum",
    label: "Quantum",
    spirit: "The deep nature of reality",
    accent: "#a78bfa",
  },
  {
    key: "artx",
    label: "ArtX",
    spirit: "The atelier of visions",
    accent: "#e879f9",
  },
  {
    key: "healing",
    label: "HealX",
    spirit: "The body's quiet evolution",
    accent: "#2dd4bf",
  },
];

/* THE MAKING ROOMS — the walk's own tool names, verbatim (the same
   words the walk's tools panel wears), each opening its store opener
   with the bare law: the tab rises over the docked chat, the
   threshold never moves. */
const NAV_TOOLS: {
  key: "dreambook" | "lightcodes" | "akashic";
  label: string;
  icon: typeof BookOpen;
}[] = [
  { key: "dreambook", label: "Book", icon: BookOpen },
  { key: "lightcodes", label: "Music", icon: Music },
  { key: "akashic", label: "Akashic", icon: ScrollText },
];

export function LandingChatNav() {
  const t = useT();
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const openDreamBook = useMirror((s) => s.openDreamBook);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const openAkashic = useMirror((s) => s.openAkashic);

  /* the two panels — closed by default, one at a time */
  const [open, setOpen] = useState<"create" | "scopes" | null>(null);

  /* Escape lays the open panel down */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = useCallback((panel: "create" | "scopes") => {
    setOpen((cur) => (cur === panel ? null : panel));
  }, []);

  const openTool = useCallback(
    (key: "dreambook" | "lightcodes" | "akashic") => {
      setOpen(null);
      const bare = { bare: true };
      if (key === "dreambook") openDreamBook(bare);
      else if (key === "lightcodes") openLightCodes(undefined, bare);
      else openAkashic(bare);
    },
    [openDreamBook, openLightCodes, openAkashic]
  );

  const pickScope = useCallback(
    (key: LandingScopeKey) => {
      setOpen(null);
      /* lit again — the field is laid back down and General returns */
      setLandingScope(landingScope === key ? "" : key);
    },
    [landingScope, setLandingScope]
  );

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* ---------------------------- CREATE ---------------------------- */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => toggle("create")}
          aria-haspopup="menu"
          aria-expanded={open === "create"}
          aria-label={t("Create")}
          title={t("Create")}
          data-testid="landing-nav-create"
          className={cn(
            "focus-glow relative flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-['']",
            open === "create"
              ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
              : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
          )}
        >
          <Hammer className="size-3" aria-hidden="true" />
          <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
            {t("Create")}
          </span>
        </button>
        {/* the panel — always mounted so the settle stays a quiet
            0.2s breath; closed it is only air (no pointer, no eye) */}
        <div
          data-testid="landing-nav-create-panel"
          role="menu"
          aria-hidden={open !== "create"}
          className={cn(
            "absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[220px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-2 lift-lg transition-all duration-200",
            open === "create"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
          }}
        >
          {NAV_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                role="menuitem"
                onClick={() => openTool(tool.key)}
                data-testid={`landing-nav-tool-${tool.key}`}
                className="focus-glow flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]"
              >
                <Icon
                  className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
                  {t(tool.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------- SCOPES ---------------------------- */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => toggle("scopes")}
          aria-haspopup="menu"
          aria-expanded={open === "scopes"}
          aria-label={t("Scopes")}
          title={t("Scopes")}
          data-testid="landing-nav-scopes"
          className={cn(
            "focus-glow relative flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-['']",
            open === "scopes"
              ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
              : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
          )}
        >
          <Layers className="size-3" aria-hidden="true" />
          <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
            {t("Scopes")}
          </span>
        </button>
        <div
          data-testid="landing-nav-scopes-panel"
          role="menu"
          aria-hidden={open !== "scopes"}
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[248px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-2 lift-lg transition-all duration-200",
            open === "scopes"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
          }}
        >
          {NAV_SCOPES.map((s) => {
            const focused = landingScope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="menuitemradio"
                aria-checked={focused}
                onClick={() => pickScope(s.key)}
                title={t(s.spirit)}
                data-testid={`landing-nav-scope-${s.key}`}
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
                    backgroundColor: s.accent,
                    boxShadow: focused
                      ? `0 0 0 3px color-mix(in srgb, ${s.accent} 22%, transparent)`
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
                  <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                    {t("Here")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* the outside-click veil — only while a panel stands open */}
      {open !== null && (
        <div
          aria-hidden="true"
          data-testid="landing-nav-veil"
          className="fixed inset-0 z-30"
          onClick={() => setOpen(null)}
        />
      )}
    </div>
  );
}
