"use client";

import { useCallback } from "react";
import { Atom, Hammer, HeartPulse, Layers } from "lucide-react";
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
/*  dream-work. The last maker the visitor stood in reopens.           */
/*                                                                     */
/*  QUANTUM AND HEALX — the two deep rooms stand between the InDream   */
/*  and the Scopes hands: one touch opens each room directly (their    */
/*  words travel, and the image crystallizes only at the visitor's     */
/*  own hand). On the narrow phone they wear their marks alone; the    */
/*  labels unfold on wider frames.                                     */
/*                                                                     */
/*  SCOPES — the fields' hand opens the scopes workplace the same way: */
/*  a full room where the fields wear their light and the Manifest     */
/*  keeps its own card. Both rooms carry the one back hand — the main  */
/*  chat landing is always one arrow away.                             */
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
    if (activeToolTab && activeToolTab !== "scopes") {
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

  /* THE DEEP ROOMS — one touch, one room; already standing in it?
     The window re-enters (never re-stacks). */
  const openRoom = useCallback(
    (key: "quantum" | "healx") => {
      if (activeToolTab === key) {
        activateToolTab(key);
        return;
      }
      openToolTab(key);
    },
    [activeToolTab, activateToolTab, openToolTab]
  );

  const hand =
    "focus-glow relative flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-['']";
  const iconHand =
    "focus-glow relative flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 after:absolute after:-inset-2 after:rounded-full after:content-[''] sm:w-auto sm:px-2.5";

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

      {/* --------------------- QUANTUM · THE DEEP ----------------------- */}
      <button
        type="button"
        onClick={() => openRoom("quantum")}
        aria-haspopup="dialog"
        aria-expanded={activeToolTab === "quantum"}
        aria-label={t("Quantum — the deep room")}
        title={t("Quantum — the deep room")}
        data-testid="landing-nav-quantum"
        className={cn(
          iconHand,
          "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground",
          activeToolTab === "quantum" && "text-[#a78bfa]"
        )}
      >
        <Atom
          className="size-3 shrink-0 text-[#a78bfa]"
          aria-hidden="true"
        />
        <span className="mono-label hidden whitespace-nowrap text-[10px] uppercase tracking-[0.14em] sm:inline">
          {t("Quantum")}
        </span>
      </button>

      {/* ---------------------- HEALX · THE QUIET ----------------------- */}
      <button
        type="button"
        onClick={() => openRoom("healx")}
        aria-haspopup="dialog"
        aria-expanded={activeToolTab === "healx"}
        aria-label={t("HealX — the body's quiet room")}
        title={t("HealX — the body's quiet room")}
        data-testid="landing-nav-healx"
        className={cn(
          iconHand,
          "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground",
          activeToolTab === "healx" && "text-[#2dd4bf]"
        )}
      >
        <HeartPulse
          className="size-3 shrink-0 text-[#2dd4bf]"
          aria-hidden="true"
        />
        <span className="mono-label hidden whitespace-nowrap text-[10px] uppercase tracking-[0.14em] sm:inline">
          {t("HealX")}
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

      {/* THE VISITOR'S OWN HAND HAS MOVED HOME — the profile icon now
          stands at the crown's very beginning, before the light's
          toggle (BranchCanopy wears it): an icon, not a pill, in both
          of the chat's gears. */}
    </div>
  );
}
