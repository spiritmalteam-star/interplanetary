"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE SECRET HAND — a four-second hold that opens every gate.        */
/*                                                                     */
/*  The visitor rests their finger (or the mouse) on a gate — the      */
/*  passage's door, the purse's modal, the book maker's threshold —    */
/*  for four full seconds, and the house lets them through: a small    */
/*  dummy passage is carved on the spot (a wanderer address), its      */
/*  purse is filled to the pro plan, and the visitor is signed in      */
/*  without ever typing a word.                                        */
/*                                                                     */
/*  LAWS: a moving hand is never a held hand (any drag past a dozen    */
/*  pixels cancels); the veil shows the second glass filling so the    */
/*  hold is never a mystery; the hand that fired once cannot fire      */
/*  again until it is lifted.                                          */
/* ------------------------------------------------------------------ */

export const HOLD_MS = 4000;

/** Forge the dummy passage and wake the house's memory of its keeper. */
export async function bypassIntoPro(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    const data = (await res.json().catch(() => null)) as {
      user?: { email: string; name: string | null; tier: string };
      error?: string;
    } | null;
    if (!res.ok || !data?.user) {
      toast.error(data?.error ?? "The secret hand slipped. Rest, then hold again.");
      return false;
    }
    const st = useMirror.getState();
    st.setMe(data.user);
    await Promise.allSettled([st.refreshMe(), st.refreshWallet()]);
    toast.success("The secret hand held — the pro doors stand open.", {
      description: "A wanderer's passage was carved for you and the purse was filled.",
    });
    return true;
  } catch {
    toast.error("The secret hand slipped. Rest, then hold again.");
    return false;
  }
}

export interface HoldBypass {
  /** spread onto any element — pointer handlers that watch the hold */
  bind: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
  };
  holding: boolean;
  /** 0..1 — the second glass filling */
  pct: number;
}

/** Watch a four-second hold on an element. `enabled` gates the whole
    watch (the hand never fires for a keeper already inside). */
export function useHoldBypass(
  onFire: () => void | Promise<void>,
  enabled = true
): HoldBypass {
  const [holding, setHolding] = useState(false);
  const [pct, setPct] = useState(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const onFireRef = useRef(onFire);
  useEffect(() => {
    onFireRef.current = onFire;
  }, [onFire]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHolding(false);
    setPct(0);
    originRef.current = null;
  }, []);

  const release = useCallback(() => {
    if (firedRef.current) {
      firedRef.current = false;
    }
    clear();
  }, [clear]);

  /* the filling glass — one self-rescheduling frame loop, kept in a
     ref so the callback may re-reference itself cleanly */
  const tickRef = useRef<() => void>(() => {});
  useEffect(() => {
    tickRef.current = () => {
      const frac = Math.min(1, (Date.now() - startRef.current) / HOLD_MS);
      setPct(frac);
      if (frac >= 1) return;
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  }, []);

  const down = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || firedRef.current) return;
      originRef.current = { x: e.clientX, y: e.clientY };
      startRef.current = Date.now();
      firedRef.current = true; /* one hold, one fire — released by `up` */
      setHolding(true);
      setPct(0);
      rafRef.current = requestAnimationFrame(() => tickRef.current());
      timerRef.current = window.setTimeout(() => {
        clear();
        if (navigator.vibrate) navigator.vibrate(24);
        void onFireRef.current();
      }, HOLD_MS);
    },
    [enabled, clear]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      const o = originRef.current;
      if (!o) return;
      /* a wandering hand is not a holding hand */
      if (Math.abs(e.clientX - o.x) > 12 || Math.abs(e.clientY - o.y) > 12) {
        release();
      }
    },
    [release]
  );

  useEffect(() => clear, [clear]);

  return {
    bind: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
    },
    holding,
    pct,
  };
}

/** The veil — a slim filling glass at the screen's foot that speaks
    only while the hand holds. One bar, no ceremony. */
export function HoldVeil({
  holding,
  pct,
  label,
}: {
  holding: boolean;
  pct: number;
  label: string;
}) {
  if (!holding) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[200] flex justify-center px-4"
    >
      <div className="flex w-full max-w-[300px] flex-col items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-4 py-2.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <p className="text-[11px] font-medium tracking-wide text-white/90">{label}</p>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#9fd8dc] transition-[width] duration-75"
            style={{ width: `${Math.round(pct * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
