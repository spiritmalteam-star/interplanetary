"use client";

import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE LIVING NETWORK — the doorway at the threshold's edge.          */
/*                                                                     */
/*  At the landing's top-left corner rests a small living sigil:       */
/*  three stars joined by breathing threads. One touch raises the      */
/*  Gathering's own portal — a completely independent social space     */
/*  (its own structure, its own porcelain weather, its own address),   */
/*  never a tab of the chat, never a veil of words: the hall itself    */
/*  is the vision. Nothing is written about what the hall might       */
/*  become; the hall simply stands, and the walking tells it.          */
/*                                                                     */
/*  ONE HAND, ONE DOOR — the sigil and the portal share one truth:     */
/*  the store's gatheringPortalOpen. The sigil raises it, the          */
/*  portal's own return hand (and Escape, and the browser's Back)      */
/*  folds it — and the sigil always tells the truth about which way    */
/*  the door stands.                                                   */
/*                                                                     */
/*  THE TOP LAW — the doorway has ONE home: the very top of the        */
/*  house, opposite the visitor's own mark. It is FIXED there and it   */
/*  never follows the reader: walking down among the sections, the     */
/*  sigil stays exactly where it stands (the owner's word: when we     */
/*  scroll it must stay where it is and not follow). Only the deeper  */
/*  rooms can rest it.                                                 */
/* ------------------------------------------------------------------ */

/* THE VEILED DOOR — the sigil steps out of the eye when the house's
   deeper rooms stand open: a workplace (the codex register among
   them), a room zoomed to its own sky, or the Gathering's hall
   itself. The door tells no lie about the room it opens — when the
   visitor walks in a deeper room, the threshold's doorway rests.
   (Shared with the phone's profile mark — both top hands obey the
   same law: when a deeper room stands open, the doorway rests.) */
function useVeiledDoor(): boolean {
  const workplaceOpen = useMirror((s) => s.activeToolTab !== null);
  const zoomed = useMirror((s) => s.workspaceZoomed);
  const gatheringOpen = useMirror((s) => s.gatheringPortalOpen);
  /* THE VISITOR'S OWN PAGE — while the profile stands as its own
     individual page over the house, the doorway rests with the rest. */
  const profileOpen = useMirror((s) => s.profilePageOpen);
  return workplaceOpen || zoomed || gatheringOpen || profileOpen;
}

export { useVeiledDoor };

export default function LivingNetwork() {
  const t = useT();
  const open = useMirror((s) => s.gatheringPortalOpen);
  const openGatheringPortal = useMirror((s) => s.openGatheringPortal);
  const veiled = useVeiledDoor();

  return (
    <>
      {/* ============== THE SIGIL — the doorway at the edge ============== */}
      <button
        type="button"
        onClick={() => openGatheringPortal()}
        aria-label={t("The Gathering")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-hidden={veiled || undefined}
        tabIndex={veiled ? -1 : 0}
        title={t("The Gathering")}
        data-testid="living-network-gate"
        className={cn(
          /* THE BROWNISH GLASS — the doorway wears warm amber-brown
             glass (the owner's word: never black), a translucent
             walnut wash blurred over the threshold, its rim a soft
             brass hairline that warms on the hover. */
          "focus-glow fixed z-[46] flex items-center rounded-full border border-[rgba(196,158,110,0.34)] bg-[rgba(64,45,27,0.62)] shadow-[0_8px_28px_-14px_rgba(20,12,5,0.9)] backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:border-[rgba(232,217,176,0.6)] hover:shadow-[0_10px_34px_-14px_rgba(232,217,176,0.35)]",
          veiled && "pointer-events-none"
        )}
        style={{
          /* THE TOP HAND — the sigil stands at the very top, full and
             warm, on every device, at every depth of the walk. THE
             VEILED DOOR — transform and opacity only: the doorway
             folds away while a deeper room stands open and returns
             the breath the visitor walks home; never unmounted, so
             the house never re-renders a single word. */
          ...(veiled
            ? {
                opacity: 0,
                transform: "scale(0.72)",
              }
            : {
                top: "calc(max(0.75rem, env(safe-area-inset-top)) + 0.15rem)",
                left: "max(0.75rem, env(safe-area-inset-left))",
                opacity: 1,
                transform: "scale(1)",
              }),
          paddingLeft: "0.625rem",
          paddingRight: "0.75rem",
          height: "2.25rem",
        }}
      >
        <svg
          viewBox="0 0 28 28"
          aria-hidden="true"
          className="size-[22px] shrink-0"
        >
          <line
            x1="6.5"
            y1="20.5"
            x2="14"
            y2="9"
            stroke="rgba(232,217,176,0.55)"
            strokeWidth="0.8"
            className="ln-thread"
          />
          <line
            x1="14"
            y1="9"
            x2="21.5"
            y2="17"
            stroke="rgba(159,216,220,0.5)"
            strokeWidth="0.8"
            className="ln-thread"
            style={{ animationDelay: "1.1s" }}
          />
          <circle cx="6.5" cy="20.5" r="1.9" fill="rgba(159,216,220,0.85)" />
          <circle cx="21.5" cy="17" r="1.6" fill="rgba(159,216,220,0.55)" />
          <circle cx="14" cy="9" r="2.5" fill="#e8d9b0" className="ln-star-core" />
        </svg>
        <span className="mono-label hidden text-[9.5px] uppercase tracking-[0.26em] text-[#d9c99a] sm:inline">
          {t("The Gathering")}
        </span>
      </button>
    </>
  );
}
