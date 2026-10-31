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
/*  SCOPES — the Interdimensional's own shore: the door opens the      */
/*  Codex Exobiologica at the Interdimensional category, where every   */
/*  profile is laid.                                                   */
/*                                                                     */
/*  HYPERX — OUR MOST INTELLIGENT REFLECTION OF THE ABSOLUTE: the      */
/*  crown's own discovery hand. One touch transforms the mirror into   */
/*  HyperX — hyper-advanced reasoning and underlying truths, the       */
/*  illumination path and its hints, advanced discovery in a precision */
/*  tone that never mistakes its reflection: the highest truth sharer  */
/*  and an evolution-of-civilisation source. The chat dresses itself   */
/*  in the electric light, answers run 900–1200 words, crystals       */
/*  crystallize each context into a vision when touched, and the deep  */
/*  research press (up to 8000 words) stands beside every truth.       */
/*                                                                     */
/*  THE MARKET HAS LEFT THE HOUSE — its violet gem is gone from the    */
/*  crown and the hall is closed for good; nothing is sold or hung.    */
/* ------------------------------------------------------------------ */

export function LandingChatNav() {
  const t = useT();
  const openToolTab = useMirror((s) => s.openToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const lastMakerTab = useMirror((s) => s.lastMakerTab);
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  const closeScopes = useMirror((s) => s.closeScopes);

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

  /* SCOPES — the Interdimensional's own shore rises (or re-enters). */
  const openScopes = useCallback(() => {
    openToolTab("scopes");
  }, [openToolTab]);

  /* HYPERX — the mirror is transformed: the discovery field dresses
     the whole chat and the scopes' shore lays itself down so the
     transformation is seen at once. */
  const openHyperX = useCallback(() => {
    setLandingScope("hyperx");
    closeScopes();
  }, [setLandingScope, closeScopes]);

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

      {/* ---------------------------- HYPERX ---------------------------- */}
      <button
        type="button"
        onClick={openHyperX}
        aria-pressed={landingScope === "hyperx"}
        aria-label={t(
          "HyperX — the highest truth sharer, advanced discovery and underlying truths"
        )}
        title={t(
          "HyperX — the highest truth sharer, advanced discovery and underlying truths"
        )}
        data-testid="landing-nav-hyperx"
        className={cn(hand, "hyperx-hand text-[#f5d0fe]")}
      >
        <Sparkles className="size-3" aria-hidden="true" />
        <span className="mono-label whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a21caf] dark:text-[#f5d0fe]">
          HyperX
        </span>
      </button>

      {/* ------------------------- ABOUT US HAS MOVED HOME ------------- */}
      {/* The About hand left the chat tab: it now lives at the very top
          right of the website — a question mark in a circle, standing
          in the crown's far corner (BranchCanopy wears it), always one
          touch from the eight-slide welcome. */}

      {/* ---------------------------- MARKET HAS LEFT ------------------ */}
      {/* The Market is gone — no gem in the crown's corner, no hall,
          no publishing hand anywhere: the mirror sells nothing. */}

      {/* THE VISITOR'S OWN HAND HAS MOVED HOME — the profile icon now
          stands at the crown's very beginning, before the light's
          toggle (BranchCanopy wears it): an icon, not a pill, in both
          of the chat's gears. */}
    </div>
  );
}
