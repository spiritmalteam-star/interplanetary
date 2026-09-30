"use client";

import { useEffect, useRef } from "react";
import { Menu, RotateCcw, Sparkles } from "lucide-react";
import { modes } from "@/lib/data/metaphysics";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { SCOPE_META } from "@/lib/entity-utils";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE HEADER — 58px of instrument panel: the breathing orb, the      */
/*  wordmark, the four scope tabs (always ONE line, even on mobile),   */
/*  the single Astral Protocol button, the theme dial and New chat.    */
/* ------------------------------------------------------------------ */

/** The breathing orb — the laboratory's living sigil. */
function OrbLogo() {
  return (
    <span className="relative inline-flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
      <span
        className="scope-halo absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--cy) 45%, transparent)" }}
      />
      <span
        className="breath absolute inset-[5px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--cy) 85%, white), var(--cy) 46%, transparent 78%)",
          boxShadow: "0 0 14px -2px color-mix(in srgb, var(--cy) 70%, transparent)",
        }}
      />
      <span
        className="absolute inset-[13px] rounded-full"
        style={{ background: "var(--background)" }}
      />
      <span
        className="absolute inset-[15px] rounded-full"
        style={{ background: "var(--cy)" }}
      />
    </span>
  );
}

export function TopNavigation() {
  const openModal = useMirror((s) => s.openModal);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const activeMode = useMirror((s) => s.activeMode);
  const setMode = useMirror((s) => s.setMode);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const view = useMirror((s) => s.view);
  const clearChannel = useMirror((s) => s.clearChannel);
  const t = useT();
  const trayRef = useRef<HTMLDivElement>(null);

  /* the active scope tab always centers itself in the one-line tray */
  useEffect(() => {
    const tray = trayRef.current;
    const el = tray?.querySelector(
      `[data-testid="scope-tab-${activeMode}"]`
    ) as HTMLElement | null;
    if (tray && el) {
      const target = el.offsetLeft - (tray.clientWidth - el.clientWidth) / 2;
      tray.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [activeMode]);

  /* NEW CHAT — the active scope's channel returns to its quiet origin.
     One law: available at ALL scopes, always one breath away. */
  const handleNewChat = () => {
    clearChannel(activeMode);
    returnToObservatory();
    toast({
      title: t("New chat"),
      description: t("The {scope} channel has returned to its quiet origin.", {
        scope: t(SCOPE_META[activeMode].label),
      }),
    });
  };

  return (
    <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="flex h-[58px] items-center gap-3 px-3 sm:px-5">
        {/* Left — the breathing sigil + wordmark */}
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("Open galactic encyclopedia")}
            className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>

          <OrbLogo />

          <div className="hidden min-w-0 lg:block">
            <h1 className="alien-text truncate text-[15px] font-semibold tracking-[0.14em]">
              MIRROR ENTITY LABORATORY
            </h1>
            <p className="kicker mt-0.5 truncate text-muted-foreground/80">
              {t(SCOPE_META[activeMode].label)}
            </p>
          </div>
        </div>

        {/* Center — the scope tabs: ONE line, at every width */}
        <nav
          aria-label={t("Channel mode")}
          className="flex min-w-0 flex-1 justify-center"
        >
          <div
            ref={trayRef}
            className="no-scrollbar flex max-w-full items-center overflow-x-auto py-1"
          >
            <div className="pill-tray min-w-max">
              {modes.map((m) => {
                const active = m.id === activeMode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      active && view !== "observatory"
                        ? returnToObservatory()
                        : setMode(m.id)
                    }
                    aria-pressed={active}
                    data-testid={`scope-tab-${m.id}`}
                    title={
                      active && view !== "observatory"
                        ? t("Return to the Observatory")
                        : t(m.label)
                    }
                    data-active={active}
                    className={cn(
                      "pillbtn flex items-center gap-1.5 px-3 py-1.5 text-[13px]",
                      active && "font-semibold"
                    )}
                  >
                    <span aria-hidden="true" className="text-[13.5px] leading-none">
                      {m.emoji}
                    </span>
                    {t(m.label)}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Right — one protocol dial, the theme, and New chat */}
        <nav
          aria-label={t("Primary")}
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <button
            type="button"
            onClick={() => openModal({ type: "astral-protocol" })}
            data-testid="astral-protocol-open"
            aria-label={t("Open the Astral Protocol — Federation, ET Technology and Astral Jobs in one dial")}
            title={t("Astral Protocol")}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-2.5 text-[13.5px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm sm:px-3.5"
          >
            <Sparkles
              className="size-3.5 text-[var(--cy)]"
              aria-hidden="true"
            />
            <span className="hidden md:inline">{t("Astral Protocol")}</span>
          </button>

          <ThemeToggle />

          <button
            type="button"
            onClick={handleNewChat}
            data-testid="new-chat"
            aria-label={t("New chat — return this channel to its quiet origin")}
            title={t("New chat")}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-2.5 text-[13.5px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground hover:glow-sm sm:px-3.5"
          >
            <RotateCcw
              className="size-4 transition-transform duration-500 group-hover:-rotate-180"
              aria-hidden="true"
            />
            <span className="hidden md:inline">{t("New chat")}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
