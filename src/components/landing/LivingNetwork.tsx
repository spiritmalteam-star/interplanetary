"use client";

import { AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import GatheringPortal from "@/components/gathering/GatheringPortal";

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
/*  CALM LAWS: transform-and-opacity motion only, nothing forced,      */
/*  stillness honored when asked.                                      */
/* ------------------------------------------------------------------ */

export default function LivingNetwork() {
  const t = useT();
  const open = useMirror((s) => s.gatheringPortalOpen);
  const openGatheringPortal = useMirror((s) => s.openGatheringPortal);

  return (
    <>
      {/* ============== THE SIGIL — the doorway at the edge ============== */}
      <button
        type="button"
        onClick={() => openGatheringPortal()}
        aria-label={t("The Gathering")}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t("The Gathering")}
        data-testid="living-network-gate"
        className="focus-glow fixed z-[46] flex h-9 items-center gap-2.5 rounded-full border border-white/14 bg-[rgba(7,10,17,0.82)] pl-2.5 pr-3 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(232,217,176,0.55)] hover:shadow-[0_10px_34px_-14px_rgba(232,217,176,0.35)]"
        style={{
          top: "calc(max(0.75rem, env(safe-area-inset-top)) + 0.15rem)",
          left: "max(0.75rem, env(safe-area-inset-left))",
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

      {/* ============== THE PORTAL — the hall itself ============== */}
      <AnimatePresence>
        {open && <GatheringPortal key="gathering-portal" />}
      </AnimatePresence>
    </>
  );
}
