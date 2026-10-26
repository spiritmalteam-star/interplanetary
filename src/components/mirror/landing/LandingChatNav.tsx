"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Atom,
  BookOpen,
  Hammer,
  Layers,
  Music,
  ScrollText,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  useMirror,
  type LandingScopeKey,
} from "@/lib/mirror-store";
import { SCOPE_META, SCOPE_ORDER } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE ONE CHAT'S OWN NAV — the main navigator of the one and only    */
/*  chat, standing in both of its gears (docked and fullscreen).       */
/*  Create opens the house's making rooms as tabs at the chat's own    */
/*  size (the window is the chat's own exact frame; the never-yank     */
/*  store law keeps the realm beneath the visitor's feet); Scopes     */
/*  tints the chat with one field's light; Profile opens the           */
/*  visitor's own room WITHIN the frame.                               */
/*                                                                     */
/*  CALM LAWS: closed by default, one panel at a time; outside-click   */
/*  and Escape lay them down; the only motion is a 0.2s opacity/       */
/*  translate settle — no continuous animation, nothing runs forever.  */
/* ------------------------------------------------------------------ */

/* THE FIVE FIELDS — the house's own scopes, read from the registry's
   one truth (SCOPE_META): the crown can never fall out of tune with
   the gate, the canopy or the library again. THE MIRROR stands first:
   the house's own reflection, the standing default — the whole
   house's own voice answering from the open floor. Each field wears
   its own representative light, and the whole chat tints by it. */
const NAV_SCOPES: {
  key: LandingScopeKey;
  label: string;
  spirit: string;
  accent: string;
}[] = SCOPE_ORDER.map((key) => ({
  key,
  label: SCOPE_META[key].label,
  spirit: SCOPE_META[key].spirit,
  accent: SCOPE_META[key].accent,
}));

/* THE SIX MAKING ROOMS — the house's own tool names, verbatim (the
   canonical labels of the workspace's own registry), each opening its
   store opener: the never-yank law keeps the realm where it stands —
   the room rises as a tab at the chat's own size. The Quantum
   Laboratory rides here too: a genuine local bench (its gates run in
   pure arithmetic on the device), not a chat with a new title. */
const NAV_TOOLS: {
  key:
    | "dreambook"
    | "lightcodes"
    | "akashic"
    | "mirroros"
    | "invent"
    | "qlab";
  label: string;
  icon: typeof BookOpen;
}[] = [
  { key: "dreambook", label: "Book", icon: BookOpen },
  { key: "lightcodes", label: "Music", icon: Music },
  { key: "akashic", label: "Akashic", icon: ScrollText },
  { key: "mirroros", label: "Manifest", icon: Sparkles },
  { key: "invent", label: "Invent", icon: Hammer },
  { key: "qlab", label: "Quantum Lab", icon: Atom },
];

export function LandingChatNav() {
  const t = useT();
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const openDreamBook = useMirror((s) => s.openDreamBook);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const openAkashic = useMirror((s) => s.openAkashic);
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const openInvent = useMirror((s) => s.openInvent);
  const openQlab = useMirror((s) => s.openQlab);
  const openProfilePage = useMirror((s) => s.openProfilePage);

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
    (
      key:
        | "dreambook"
        | "lightcodes"
        | "akashic"
        | "mirroros"
        | "invent"
        | "qlab"
    ) => {
      setOpen(null);
      const bare = { bare: true };
      if (key === "dreambook") openDreamBook(bare);
      else if (key === "lightcodes") openLightCodes(undefined, bare);
      else if (key === "akashic") openAkashic(bare);
      else if (key === "mirroros") openMirrorOS();
      else if (key === "qlab") openQlab(bare);
      else openInvent();
    },
    [openDreamBook, openLightCodes, openAkashic, openMirrorOS, openInvent, openQlab]
  );

  /* THE VISITOR'S OWN ROOM — the profile opens within the chat's own
     frame (ProfilePage is mounted in AppShell's passageModals); any
     standing nav panel is laid down first. */
  const openProfileRoom = useCallback(() => {
    setOpen(null);
    openProfilePage();
  }, [openProfilePage]);

  const pickScope = useCallback(
    (key: LandingScopeKey) => {
      setOpen(null);
      /* every field is its own world — the choice is final: the chat
         wears the field's light, speaks its language and wakes its
         own conversation and memory. The Mirror is always there to
         come home to. */
      setLandingScope(key);
    },
    [setLandingScope]
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
            /* THE MIDDLE OF THE HOUSE — the fields' own panel stands
               CENTERED on the Scopes hand, so the row of fields opens
               exactly where the eye already rests. */
            "absolute left-1/2 top-[calc(100%+0.5rem)] z-40 w-[292px] max-w-[calc(100vw-2.5rem)] -translate-x-1/2 rounded-2xl border bg-background p-2 lift-lg transition-all duration-200",
            open === "scopes"
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
          }}
        >
          {/* the panel's own quiet head — the choice it offers */}
          <p
            className="mono-label px-2 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70"
            aria-hidden="true"
          >
            {t("The field the chat wears")}
          </p>
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
                  "focus-glow group relative flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-all duration-300",
                  focused
                    ? "border-transparent"
                    : "border-transparent hover:border-[var(--hairline)]"
                )}
                style={
                  focused
                    ? {
                        background: `color-mix(in srgb, ${s.accent} 10%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.accent} 38%, transparent)`,
                      }
                    : undefined
                }
              >
                {/* the field's own light — a small orb that carries
                    the color the whole chat will wear */}
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `color-mix(in srgb, ${s.accent} 16%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.accent} 45%, transparent)`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: s.accent,
                      boxShadow: `0 0 6px 0 color-mix(in srgb, ${s.accent} 75%, transparent)`,
                    }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-foreground">
                    {t(s.label)}
                  </span>
                  <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {t(s.spirit)}
                  </span>
                </span>
                {/* THE FIELD'S OWN DEPTH — the Quantum field carries its
                    laboratory on its own row: one small hand that opens
                    the genuine local bench (a span, for a button may
                    never nest inside a button). */}
                {s.key === "quantum" && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(null);
                      openQlab({ bare: true });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setOpen(null);
                        openQlab({ bare: true });
                      }
                    }}
                    aria-label={t("Open the laboratory")}
                    title={t("Open the laboratory")}
                    data-testid="landing-nav-scope-qlab"
                    className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-foreground/10"
                    style={{
                      color: s.accent,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${s.accent} 40%, transparent)`,
                    }}
                  >
                    <Atom className="size-3.5" aria-hidden="true" />
                  </span>
                )}
                {focused && (
                  <span
                    className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.14em]"
                    style={{
                      color: s.accent,
                      borderColor: `color-mix(in srgb, ${s.accent} 40%, transparent)`,
                      background: `color-mix(in srgb, ${s.accent} 9%, transparent)`,
                    }}
                  >
                    {t("Here")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------- PROFILE ---------------------------- */}
      {/* THE VISITOR'S OWN HAND — styled like the other hands: one
          quiet pill that opens the profile room within the frame */}
      <button
        type="button"
        onClick={openProfileRoom}
        aria-haspopup="dialog"
        aria-label={t("Profile")}
        title={t("Profile")}
        data-testid="landing-nav-profile"
        className="focus-glow relative flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-[''] hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
      >
        <UserRound className="size-3" aria-hidden="true" />
        <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
          {t("Profile")}
        </span>
      </button>

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
