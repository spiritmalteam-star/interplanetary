"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";

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
/*  THE SCROLL LAW — the hand reads the reader: at the very top of     */
/*  the threshold the sigil stands at the very top, full and warm;     */
/*  the moment the visitor walks down among the sections, it slides    */
/*  into the screen's very corner and shrinks to its quiet mark,      */
/*  covering nothing — and one upward breath brings the whole hand    */
/*  back to the top. Transform and opacity only; stillness honored.   */
/* ------------------------------------------------------------------ */

const CORNER_AFTER_PX = 48;

export default function LivingNetwork() {
  const t = useT();
  const open = useMirror((s) => s.gatheringPortalOpen);
  const openGatheringPortal = useMirror((s) => s.openGatheringPortal);

  /* THE SCROLL EAR — the landing root is the scroller; one capture
     listener hears every scroll beneath it and tracks the depth. */
  const [inCorner, setInCorner] = useState(false);
  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (!el.closest('[data-testid="landing-root"]')) return;
      setInCorner(el.scrollTop > CORNER_AFTER_PX);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

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
        className="focus-glow fixed z-[46] flex items-center rounded-full border border-white/14 bg-[rgba(7,10,17,0.82)] shadow-[0_8px_28px_-14px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:border-[rgba(232,217,176,0.55)] hover:shadow-[0_10px_34px_-14px_rgba(232,217,176,0.35)]"
        style={{
          /* THE TOP HAND — full pill at the very top; the corner hand —
             a quiet mark in the screen's very corner while the visitor
             walks the sections. One transform, one opacity, no jumps. */
          ...(inCorner
            ? {
                bottom: "max(0.75rem, env(safe-area-inset-bottom))",
                right: "max(0.75rem, env(safe-area-inset-right))",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                opacity: 0.72,
                transform: "scale(0.82)",
              }
            : {
                top: "calc(max(0.75rem, env(safe-area-inset-top)) + 0.15rem)",
                left: "max(0.75rem, env(safe-area-inset-left))",
                paddingLeft: "0.625rem",
                paddingRight: "0.75rem",
                opacity: 1,
                transform: "scale(1)",
              }),
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
        {!inCorner && (
          <span className="mono-label hidden text-[9.5px] uppercase tracking-[0.26em] text-[#d9c99a] sm:inline">
            {t("The Gathering")}
          </span>
        )}
      </button>
    </>
  );
}
