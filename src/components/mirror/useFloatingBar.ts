"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  THE READING BAR LAW — the floating controls read the reader,       */
/*  never the reverse. They appear when a world opens, then quietly    */
/*  sink away: after one second of stillness, or the moment the        */
/*  thread flows downward beneath them. A single upward breath — a     */
/*  scroll toward the beginning, a wheel tilted toward the sky, a      */
/*  finger drawn down the glass — and they rise again. While the       */
/*  hand or the keyboard rests upon them, or one of their own menus    */
/*  stands open, they hold their place.                                */
/*                                                                     */
/*  One hook serves every chamber: the main channel's floating         */
/*  handles and the four worlds' floating top bars (Manifest,          */
/*  Quantum, Evolve Med, Invent).                                      */
/* ------------------------------------------------------------------ */

export function useFloatingBarAutoHide({
  /** An ancestor of every scroller whose movement should hide the bar —
      scroll is listened to in the capture phase here, so the outer
      chamber, the chat thread and any inner scroller beneath it all
      speak to the bar through one ear. */
  rootRef,
  /** The floating bar itself — hover or focus inside holds it visible. */
  barRef,
  /** An external hold (an open menu of the bar) — while true the bar
      stays, and closing the menu returns it to the stillness law. */
  hold = false,
  /** The stillness after which the bar sinks away. */
  delayMs = 1000,
  /** Change to re-bind the listeners when the scroller remounts
      (the conversation is keyed by view). */
  rebindKey,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  barRef: React.RefObject<HTMLElement | null>;
  hold?: boolean;
  delayMs?: number;
  rebindKey?: string;
}): boolean {
  /* whether the bar has sunk; an external hold (an open menu) raises
     it again for as long as it lasts — derived, never doubled */
  const [sank, setSank] = useState(false);
  const hidden = sank && !hold;

  const timerRef = useRef<number | null>(null);
  const hoverRef = useRef(false);
  const edgeRef = useRef(false);
  const holdRef = useRef(hold);
  useEffect(() => {
    holdRef.current = hold;
  }, [hold]);
  const lastTopsRef = useRef(new Map<Element, number>());
  const touchYRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* the stillness law: one second of quiet, then the bar sinks */
  const arm = useCallback(() => {
    if (holdRef.current) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (!holdRef.current && !hoverRef.current) {
        edgeRef.current = false; /* the edge may lean the bar back in */
        setSank(true);
      }
    }, delayMs);
  }, [clearTimer, delayMs]);

  const show = useCallback(() => {
    clearTimer();
    setSank(false);
    arm();
  }, [clearTimer, arm]);

  const sink = useCallback(() => {
    /* a gesture wins over proximity: only the hand truly resting on
       the bar, or one of its menus standing open, can refuse the sink */
    if (holdRef.current || hoverRef.current) return;
    clearTimer();
    edgeRef.current = false;
    setSank(true);
  }, [clearTimer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /* the thread flows — direction decides */
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof Element) || typeof (el as HTMLElement).scrollTop !== "number")
        return;
      const tops = lastTopsRef.current;
      const prev = tops.get(el);
      const y = (el as HTMLElement).scrollTop;
      tops.set(el, y);
      if (prev === undefined) return; /* first sight — take inventory only */
      const dy = y - prev;
      if (dy > 2) sink();
      else if (dy < -2) show();
    };

    /* a wheel tilted toward the sky raises the bar even at the very top */
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) show();
      else if (e.deltaY > 0) sink();
    };

    /* a finger drawn down the glass is an upward breath */
    const onTouchStart = (e: TouchEvent) => {
      touchYRef.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      const start = touchYRef.current;
      if (y == null || start == null) return;
      const dy = y - start;
      touchYRef.current = y;
      if (dy > 6) show();
      else if (dy < -6) sink();
    };

    /* the hand or the keyboard upon the bar holds it in place */
    const onBarOver = () => {
      hoverRef.current = true;
      edgeRef.current = false;
      clearTimer();
      setSank(false);
    };
    const onBarOut = (e: MouseEvent) => {
      const bar = barRef.current;
      if (bar && e.relatedTarget instanceof Node && bar.contains(e.relatedTarget)) return;
      hoverRef.current = false;
      arm();
    };
    const onBarFocusIn = () => {
      hoverRef.current = true;
      edgeRef.current = false;
      clearTimer();
      setSank(false);
    };
    const onBarFocusOut = (e: FocusEvent) => {
      const bar = barRef.current;
      if (bar && e.relatedTarget instanceof Node && bar.contains(e.relatedTarget)) return;
      hoverRef.current = false;
      arm();
    };

    /* the leaning edge — a pointer that wanders into the top band of
        the window leans the bar back into view, so a sunken bar can
        still be reached by hand (hit-testing cannot see it). The edge
        alone never holds: the stillness law still applies, and a
        downward gesture always wins over mere proximity. */
    const EDGE = 56;
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY <= EDGE) {
        if (!edgeRef.current) {
          edgeRef.current = true;
          clearTimer();
          setSank(false);
          arm();
        }
        return;
      }
      if (!edgeRef.current) return;
      const bar = barRef.current;
      if (bar && e.target instanceof Node && bar.contains(e.target)) return;
      edgeRef.current = false;
      arm();
    };
    /* the pointer leaving the window entirely releases the lean */
    const onDocLeave = () => {
      if (!edgeRef.current) return;
      edgeRef.current = false;
      arm();
    };

    root.addEventListener("scroll", onScroll, { capture: true, passive: true });
    root.addEventListener("wheel", onWheel, { passive: true });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("mousemove", onMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onDocLeave);

    const bar = barRef.current;
    bar?.addEventListener("mouseover", onBarOver);
    bar?.addEventListener("mouseout", onBarOut);
    bar?.addEventListener("focusin", onBarFocusIn);
    bar?.addEventListener("focusout", onBarFocusOut);

    arm();

    return () => {
      clearTimer();
      root.removeEventListener("scroll", onScroll, { capture: true });
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onDocLeave);
      bar?.removeEventListener("mouseover", onBarOver);
      bar?.removeEventListener("mouseout", onBarOut);
      bar?.removeEventListener("focusin", onBarFocusIn);
      bar?.removeEventListener("focusout", onBarFocusOut);
    };
    /* rebindKey — the scroller may remount (the conversation is keyed
        by view); the world roots are stable for the life of a world. */
  }, [rootRef, barRef, show, sink, arm, rebindKey]);

  /* an open menu holds the bar (the `hidden` derivation keeps it up);
     closing the menu lets it breathe visible once more, then returns
     it to the stillness law. Async so the transition can play instead
     of snapping. */
  useEffect(() => {
    if (hold) {
      clearTimer();
      return;
    }
    const breathe = window.setTimeout(() => setSank(false), 0);
    arm();
    return () => window.clearTimeout(breathe);
  }, [hold, clearTimer, arm]);

  return hidden;
}
