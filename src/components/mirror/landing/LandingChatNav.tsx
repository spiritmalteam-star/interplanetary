"use client";

import { useCallback } from "react";
import { Hammer, Layers, Sparkles } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE ONE CHAT'S OWN NAV — the main navigator of the one and only    */
/*  chat, standing in both of its gears (docked and fullscreen).       */
/*                                                                     */
/*  IN DREAM — the making hand no longer drops a menu down: one touch  */
/*  opens the workplace itself (the rooms stand as horizontal tab      */
/*  buttons in its own header), named InDream after the house's own    */
/*  dream-work. The last maker the visitor stood in reopens. The       */
/*  ATELIER stands among the makers (the ArtX atelier rides the rail). */
/*                                                                     */
/*  SCOPES — the fields' hand opens the scopes workplace the same way: */
/*  a full room where the fields wear their light, and the one back    */
/*  hand returns to the main chat landing.                             */
/*                                                                     */
/*  THE MARKET — its OWN WORLD entirely: separate from the workplace   */
/*  and the scopes, it opens over everything and returns the visitor   */
/*  exactly where they stood. Its hand wears the world's own violet    */
/*  light — a gem among the quiet hands of the crown.                  */
/* ------------------------------------------------------------------ */

export function LandingChatNav() {
  const t = useT();
  const openToolTab = useMirror((s) => s.openToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const openMarket = useMirror((s) => s.openMarket);
  const marketOpen = useMirror((s) => s.marketOpen);
  const lastMakerTab = useMirror((s) => s.lastMakerTab);

  /* IN DREAM — the workplace already stands (and the scopes are not
     standing over it)? One touch re-enters it (the window never
     re-stacks). The scopes window stands, or nothing stands? The last
     maker's room rises (the Book serves when the visit is new). The
     scopes are independent — they never count as the InDream window. */
  const openInDream = useCallback(() => {
    if (activeToolTab && activeToolTab !== "scopes") {
      activateToolTab(activeToolTab);
      return;
    }
    openToolTab(lastMakerTab ?? "dreambook");
  }, [activeToolTab, activateToolTab, openToolTab, lastMakerTab]);

  /* SCOPES — the fields' own workplace rises (or re-enters when the
     visitor stands in another room of the same window). */
  const openScopes = useCallback(() => {
    openToolTab("scopes");
  }, [openToolTab]);

  const hand =
    "focus-glow relative flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-['']";

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* --------------------------- IN DREAM --------------------------- */}
      <button
        type="button"
        onClick={openInDream}
        aria-haspopup="dialog"
        aria-expanded={Boolean(activeToolTab) && activeToolTab !== "scopes"}
        aria-label={t("InDream — the making rooms")}
        title={t("InDream — the making rooms")}
        data-testid="landing-nav-indream"
        className={cn(
          hand,
          "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
        )}
      >
        <Hammer className="size-3" aria-hidden="true" />
        <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
          {t("InDream")}
        </span>
      </button>

      {/* ---------------------------- SCOPES ---------------------------- */}
      <button
        type="button"
        onClick={openScopes}
        aria-haspopup="dialog"
        aria-expanded={activeToolTab === "scopes"}
        aria-label={t("Scopes")}
        title={t("Scopes")}
        data-testid="landing-nav-scopes"
        className={cn(
          hand,
          "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
        )}
      >
        <Layers className="size-3" aria-hidden="true" />
        <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
          {t("Scopes")}
        </span>
      </button>

      {/* ------------------------- ABOUT US HAS MOVED HOME ------------- */}
      {/* The About hand left the chat tab: it now lives at the very top
          right of the website — a question mark in a circle, standing
          in the crown's far corner (BranchCanopy wears it), always one
          touch from the eight-slide welcome. */}

      {/* ---------------------------- MARKET ---------------------------- */}
      {/* ITS OWN WORLD — a small violet gem in the crown's corner: the
          gradient breathes once when it is laid, the glow answers the
          hover, and one touch opens the world itself. */}
      <button
        type="button"
        onClick={openMarket}
        aria-haspopup="dialog"
        aria-expanded={marketOpen}
        aria-label={t("Market — the hall of creations")}
        title={t("Market — the hall of creations")}
        data-testid="landing-nav-market"
        className={cn(
          hand,
          "border-transparent font-medium text-[#f3e8ff] shadow-[0_0_0_1px_rgba(216,180,254,0.35),0_2px_14px_-4px_rgba(168,85,247,0.55)] hover:shadow-[0_0_0_1px_rgba(216,180,254,0.6),0_4px_20px_-4px_rgba(168,85,247,0.8)] hover:brightness-110"
        )}
        style={{
          background:
            "linear-gradient(120deg, #4c1d95 0%, #7e22ce 45%, #a855f7 78%, #d8b571 130%)",
        }}
      >
        <Sparkles className="size-3" aria-hidden="true" />
        <span className="mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]">
          {t("Market")}
        </span>
      </button>

      {/* THE VISITOR'S OWN HAND HAS MOVED HOME — the profile icon now
          stands at the crown's very beginning, before the light's
          toggle (BranchCanopy wears it): an icon, not a pill, in both
          of the chat's gears. */}
    </div>
  );
}
