"use client";

import { useCallback } from "react";
import { Hammer, Layers, Store } from "lucide-react";
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
/*  QUANTUM AND HEALX — the two deep rooms no longer wear marks in the */
/*  crown: they rest at the SCOPES' shore alone (the visitor named     */
/*  them there), opened from the fields' own workplace.                */
/*                                                                     */
/*  SCOPES — the fields' hand opens the scopes workplace the same way: */
/*  a full room where the fields wear their light, and the one back    */
/*  hand returns to the main chat landing.                             */
/*                                                                     */
/*  THE MARKET — the crown's own corner hand: one touch opens the      */
/*  house's open hall, where every visitor's creations are displayed.  */
/* ------------------------------------------------------------------ */

export function LandingChatNav() {
  const t = useT();
  const openToolTab = useMirror((s) => s.openToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const toolTabs = useMirror((s) => s.toolTabs);
  const lastMakerTab = useMirror((s) => s.lastMakerTab);

  /* IN DREAM — the workplace already stands (and the scopes are not
     standing over it)? One touch re-enters it (the window never
     re-stacks). The scopes window stands, or nothing stands? The last
     maker's room rises (the Book serves when the visit is new). The
     scopes are independent — they never count as the InDream window. */
  const openInDream = useCallback(() => {
    if (
      activeToolTab &&
      activeToolTab !== "scopes" &&
      activeToolTab !== "market"
    ) {
      activateToolTab(activeToolTab);
      return;
    }
    openToolTab(lastMakerTab ?? "dreambook");
  }, [activeToolTab, activateToolTab, openToolTab, lastMakerTab]);

  /* SCOPES — the fields' own workplace rises (or re-enters when the
     visitor stands in another room of the same window). */
  const openScopes = useCallback(() => {
    if (toolTabs.includes("scopes")) activateToolTab("scopes");
    else openToolTab("scopes");
  }, [toolTabs, activateToolTab, openToolTab]);

  /* THE MARKET — the house's open hall rises (or re-enters when it
     already stands open among the rooms). */
  const openMarket = useCallback(() => {
    if (toolTabs.includes("market")) activateToolTab("market");
    else openToolTab("market");
  }, [toolTabs, activateToolTab, openToolTab]);

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

      {/* ---------------------------- MARKET ---------------------------- */}
      <button
        type="button"
        onClick={openMarket}
        aria-haspopup="dialog"
        aria-expanded={activeToolTab === "market"}
        aria-label={t("Market — the hall of creations")}
        title={t("Market — the hall of creations")}
        data-testid="landing-nav-market"
        className={cn(
          hand,
          "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
        )}
      >
        <Store className="size-3" aria-hidden="true" />
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
