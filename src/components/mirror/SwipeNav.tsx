"use client";

import { useEffect, useRef } from "react";
import { useMirror } from "@/lib/mirror-store";

/* The chamber as a hand-held book: a swipe to the right turns one
   view back, a swipe to the left turns one forward — anywhere in any
   world, no button needed. The gesture listens quietly on the window
   and answers only through a two-pixel hairline that fills along the
   top edge while the finger travels. Typing fields, menus, dialogs
   and anything that scrolls sideways keep their own touch. */

/* a touch beginning inside any of these belongs to the control,
   never to the page-turn */
const KEEP_YOUR_TOUCH = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  "[data-no-swipe]",
  '[role="dialog"]',
  "[data-radix-popper-content-wrapper]",
  '[role="menu"]',
].join(", ");

/* six steps up the family tree — far enough to spare every carousel,
   tab strip and page-flip lane that scrolls sideways */
function insideSidewaysScroller(target: HTMLElement): boolean {
  let el: HTMLElement | null = target;
  for (let depth = 0; el && depth <= 6; depth++) {
    if (el.scrollWidth > el.clientWidth + 4) {
      const overflowX = window.getComputedStyle(el).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function SwipeNav() {
  const hairlineRef = useRef<HTMLDivElement | null>(null);
  const gesture = useRef({ x: 0, y: 0, t: 0, armed: false });

  useEffect(() => {
    const hairline = hairlineRef.current;
    if (!hairline) return;

    /* styles are written straight to the node — no re-render may
       stand between the finger and the glass */
    const fill = (dx: number) => {
      const reach = Math.min(Math.abs(dx) / 90, 1);
      hairline.style.transformOrigin = dx > 0 ? "left" : "right";
      /* a negative scaleX would mirror the bar off-screen; the edge
         anchor above carries the direction, the gradient mirrors to
         keep the glow rooted at the edge it grows from */
      hairline.style.backgroundImage = `linear-gradient(to ${
        dx > 0 ? "right" : "left"
      }, var(--scope-a, var(--gd)), transparent)`;
      hairline.style.transform = `scaleX(${reach})`;
      hairline.style.opacity = "0.9";
    };
    const fade = () => {
      hairline.style.opacity = "0";
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(KEEP_YOUR_TOUCH)) return;
      if (insideSidewaysScroller(target)) return;
      gesture.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        t: Date.now(),
        armed: true,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!gesture.current.armed) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - gesture.current.x;
      const dy = touch.clientY - gesture.current.y;
      if (Math.abs(dx) > Math.abs(dy) * 1.4 && Math.abs(dx) > 12) fill(dx);
      else fade();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!gesture.current.armed) return;
      gesture.current.armed = false;
      fade();
      /* any open surface — dialog, sheet, passage — keeps the turn */
      const s = useMirror.getState();
      if (
        s.modal ||
        s.mobileNavOpen ||
        s.communionOpen ||
        s.authOpen ||
        s.profileOpen ||
        s.accountOpen ||
        s.profilePageOpen
      )
        return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - gesture.current.x;
      const dy = touch.clientY - gesture.current.y;
      const dt = Date.now() - gesture.current.t;
      if (dt < 900 && Math.abs(dx) >= 90 && Math.abs(dx) >= 2.2 * Math.abs(dy)) {
        if (dx > 0) s.navigateBack();
        else s.navigateForward();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    /* the OS may claim the touch mid-gesture — never leave the
       hairline hanging in the sky */
    window.addEventListener("touchcancel", fade, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", fade);
    };
  }, []);

  /* always rendered, never in the way: a hairline in the scope's own
     color that breathes in only while a swipe is in flight */
  return (
    <div
      ref={hairlineRef}
      data-testid="swipe-nav-indicator"
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[90] h-[2px] bg-gradient-to-r from-[var(--scope-a,var(--gd))] to-transparent opacity-0 transition-opacity duration-200"
    />
  );
}
