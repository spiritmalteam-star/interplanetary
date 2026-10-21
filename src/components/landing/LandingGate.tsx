"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useTheme } from "next-themes";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import LandingPage from "./LandingPage";

/* ------------------------------------------------------------------ */
/*  THE THRESHOLD'S GATE.                                              */
/*                                                                     */
/*  There is only ONE portal in this house. The chamber itself — the   */
/*  whole living application — stands docked inside the landing page   */
/*  as the miniature portal: the real realm at its true proportions,   */
/*  live and working, without its suggestion wall. The expand hand     */
/*  opens nothing and carries nothing — the very same portal simply    */
/*  grows to fill the screen, every word of the conversation already   */
/*  inside it, and the minimize hand folds it back into its slot.      */
/*                                                                     */
/*  THE LENS: the chamber renders at the viewport's true size and is   */
/*  read through a clipped window — on the phone the window is the     */
/*  full width (the portal stretches fully on both sides at 1:1); on   */
/*  the desk it is a diorama at four fifths, cropped around the        */
/*  realm's own heart. Expand and minimize are transform-and-clip      */
/*  animations only — the chamber never re-mounts, never re-lays out,  */
/*  never loses a breath.                                              */
/* ------------------------------------------------------------------ */

type Phase = "landing" | "opening" | "through" | "closing";

/* the docked geometry — how the real chamber presents its miniature */
type Geo = {
  w: number | string;
  h: number | string;
  s: number;
  tx: number;
  ty: number;
  radius: number;
};

function computeGeo(): Geo {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  /* THE PHONE'S LAW — the portal stretches fully on both sides and
     stands at its true size: the whole realm, edge to edge. dvh keeps
     the window and the chamber in lockstep when the keyboard rises. */
  if (vw < 640) {
    return { w: "100vw", h: "100dvh", s: 1, tx: 0, ty: 0, radius: 0 };
  }
  /* THE DESK'S DIORAMA — the realm at four fifths, cropped around its
     own heart: the crown above, the whisper line below. */
  const s = 0.8;
  const rail = Math.min(210, Math.max(130, Math.round(vw * 0.13)));
  const clear = vw >= 1024 ? 2 * rail + 44 : 44;
  const w = Math.max(340, Math.min(600, Math.floor(s * vw) - 24, vw - clear));
  const h = Math.max(420, Math.min(660, Math.floor(s * vh) - 16));
  const cropW = w / s;
  const cropH = h / s;
  const cropX = Math.max(0, (vw - cropW) / 2);
  const cropY = Math.max(0, (vh - cropH) * 0.82);
  return {
    w,
    h,
    s,
    tx: -Math.round(s * cropX),
    ty: -Math.round(s * cropY),
    radius: 18,
  };
}

export default function LandingGate() {
  const t = useT();
  const { setTheme } = useTheme();
  const [phase, setPhase] = useState<Phase>("landing");
  const [Chamber, setChamber] = useState<ComponentType<
    { bare?: boolean }
  > | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [pending, setPending] = useState(false);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);
  const landingScroll = useRef(0);
  const phaseRef = useRef<Phase>("landing");
  phaseRef.current = phase;

  /* THE THRESHOLD'S OWN LIGHT — the portal grows out of a midnight
     page, so the chamber wears its dark vestment here (the realm's
     own light-toggle keeps working; a chosen light stays chosen).
     THE ONE SEAL — the midnight is sealed exactly once, at the
     gate's first breath: `setTheme`'s own identity changes whenever
     the theme changes, so a bare [setTheme] dependency would slam
     the door shut again the moment the visitor's hand picks the
     light — the toggle would never leave the dark. */
  const darkSealed = useRef(false);
  useEffect(() => {
    if (darkSealed.current) return;
    darkSealed.current = true;
    setTheme("dark");
  }, [setTheme]);

  /* THE WARMING FLOOR — the chamber's chunk is pulled the first moment
     the browser rests, so the miniature portal arrives alive. */
  useEffect(() => {
    let cancelled = false;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timer: number | undefined;
    const pull = () => {
      if (cancelled) return;
      void import("@/components/mirror/AppShell").then((mod) => {
        if (!cancelled)
          setChamber(
            () => mod.default as ComponentType<{ bare?: boolean }>
          );
      });
    };
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(pull);
      /* a quiet backstop guarantees the pull on busy pages */
      timer = window.setTimeout(pull, 1500);
    } else {
      timer = window.setTimeout(pull, 900);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  /* the geometry follows the viewport, never the keyboard */
  useEffect(() => {
    const apply = () => setGeo(computeGeo());
    apply();
    let tm: number | undefined;
    const onResize = () => {
      window.clearTimeout(tm);
      tm = window.setTimeout(apply, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(tm);
    };
  }, []);

  /* THE DOCK — while the visitor walks the landing, the lens rides
     exactly over its slot: one transform per scroll breath (rAF-held,
     never more than one read-write pair per frame — the page stays
     liquid and the phone stays cool). */
  const syncLens = useCallback(() => {
    const lens = lensRef.current;
    const slot = slotRef.current;
    if (!lens || !slot) return;
    const r = slot.getBoundingClientRect();
    lens.style.transform = `translate3d(${Math.round(r.left)}px, ${Math.round(
      r.top
    )}px, 0)`;
  }, []);
  const syncRaf = useRef(false);
  const syncLensFrame = useCallback(() => {
    if (syncRaf.current) return;
    syncRaf.current = true;
    requestAnimationFrame(() => {
      syncRaf.current = false;
      if (phaseRef.current === "landing") syncLens();
    });
  }, [syncLens]);

  useLayoutEffect(() => {
    if (phase !== "landing") return;
    syncLens();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled && phaseRef.current === "landing") syncLens();
    });
    return () => {
      cancelled = true;
    };
  }, [phase, geo, Chamber, syncLens]);

  const handleLandingScroll = useCallback(
    (y: number) => {
      landingScroll.current = y;
      syncLensFrame();
    },
    [syncLensFrame]
  );

  /* THE DORMANT LAW — while the docked portal is scrolled away from
     the eye, every breath inside it rests: no animation frames are
     spent on what nobody sees. The realm wakes the moment its slot
     returns. */
  useEffect(() => {
    if (phase !== "landing") return;
    const lens = lensRef.current;
    if (!lens || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries[entries.length - 1];
        lens.classList.toggle("lens-dormant", !(seen?.isIntersecting ?? true));
      },
      { threshold: 0.02 }
    );
    io.observe(lens);
    return () => {
      io.disconnect();
      lens.classList.remove("lens-dormant");
    };
  }, [phase, geo, Chamber]);

  /* THE EXPAND — nothing is opened: the same portal simply grows.
     The landing sinks beneath it; every word stays where it was. */
  const expandPortal = useCallback(() => {
    if (busy.current) return;
    if (!Chamber) {
      setPending(true);
      return;
    }
    busy.current = true;
    setPhase("opening");
    window.setTimeout(() => {
      setPhase("through");
      busy.current = false;
    }, 680);
  }, [Chamber]);

  /* an early ask to enter — honored the moment the chamber arrives */
  useEffect(() => {
    if (pending && Chamber) {
      setPending(false);
      expandPortal();
    }
  }, [pending, Chamber, expandPortal]);

  /* THE RETURN — the portal folds back into its slot in the page */
  const minimize = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPhase("closing");
    window.setTimeout(() => {
      setPhase("landing");
      busy.current = false;
    }, 700);
  }, []);

  /* the expanding lens flies to the screen's corners */
  useLayoutEffect(() => {
    if (phase !== "opening") return;
    const lens = lensRef.current;
    if (lens) lens.style.transform = "translate3d(0, 0, 0)";
  }, [phase]);

  /* during the closing the landing remounts and restores its own
     scroll; only then can the lens find its slot again */
  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(syncLens));
    }, 80);
    return () => window.clearTimeout(id);
  }, [phase, syncLens]);

  const animating = phase === "opening" || phase === "closing";
  const fullscreen = phase === "opening" || phase === "through";
  const bare = phase !== "through";

  const docked = phase === "landing";

  return (
    <>
      {/* ---------------- THE LANDING — the threshold ---------------- */}
      {phase !== "through" && (
        <div
          data-testid="landing-root"
          className={cn(
            "fixed inset-0 z-30 overflow-y-auto overscroll-y-contain bg-[#05070d] transition-opacity duration-500",
            phase === "opening" && "pointer-events-none opacity-0"
          )}
        >
          <LandingPage
            slotRef={slotRef}
            slotStyle={
              geo
                ? { width: geo.w, height: geo.h }
                : { height: "min(100dvh, 660px)" }
            }
            onExpand={expandPortal}
            onScroll={handleLandingScroll}
            initialScroll={landingScroll.current}
          />
        </div>
      )}

      {/* ------------- THE LENS — the one portal, docked ------------- */}
      {Chamber && geo && (
        <div
          ref={lensRef}
          className={cn(
            "fixed left-0 top-0 z-[45]",
            docked && "lens-docked",
            animating && "lens-anim"
          )}
          style={{
            width: fullscreen ? "100vw" : geo.w,
            height: fullscreen ? "100dvh" : geo.h,
          }}
        >
          <div
            data-testid="portal-lens"
            className="lens-frame absolute inset-0 overflow-hidden border border-white/10 bg-background shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
            style={{ borderRadius: fullscreen ? 0 : geo.radius }}
          >
            <div
              className={cn(
                "absolute left-0 top-0 h-[var(--app-h,100dvh)] w-screen",
                animating && "lens-inner-anim"
              )}
              style={{
                transformOrigin: "0 0",
                transform:
                  phase === "landing" || phase === "closing"
                    ? `translate3d(${geo.tx}px, ${geo.ty}px, 0) scale(${geo.s})`
                    : "translate3d(0, 0, 0) scale(1)",
              }}
            >
              <Chamber bare={bare} onExpand={expandPortal} onMinimize={minimize} />
            </div>
          </div>

          {/* THE EXPAND HAND — the portal's own crown carries it now:
              the fullscreen control stands between the about door and
              the visitor's passage, exactly where the threshold's
              other hands live. The hero's “Enter the portal” on the
              page carries the same growth. */}
        </div>
      )}

      {/* THE RETURN HAND — the portal's own crown carries it now: the
          landing control stands between the about door and the
          visitor's passage, one touch folding the realm back into its
          slot on the threshold. */}
    </>
  );
}
