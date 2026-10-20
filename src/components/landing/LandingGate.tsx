"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Minimize2 } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import LandingPage from "./LandingPage";

/* The chamber arrives as its own chunk — but it is asked for the moment
   the browser first idles, so by the time the visitor steps through the
   fold there is nothing left to load. */

type Phase = "landing" | "opening" | "through" | "closing";
type WorldKey = "akashic" | "dreambook" | "evolvemed";

const FOLD_EASE = "clip-path 0.82s cubic-bezier(0.7, 0, 0.84, 0)";
const UNFOLD_EASE = "clip-path 0.9s cubic-bezier(0.16, 1, 0.3, 1)";

export default function LandingGate() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("landing");
  const [Chamber, setChamber] = useState<ComponentType | null>(null);
  const [landingClip, setLandingClip] = useState<string | null>(null);
  const [chamberClip, setChamberClip] = useState<string | null>(null);
  const origin = useRef({ x: 0.5, y: 0.44 });
  const landingScroll = useRef(0);
  const busy = useRef(false);

  /* THE WARMING FLOOR — the chamber's chunk is pulled the first moment
     the browser rests. Nothing renders early; the promise is only that
     the door will open instantly when it is asked for. */
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
        if (!cancelled) setChamber(() => mod.default as ComponentType);
      });
    };
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(pull);
      /* some engines starve idle callbacks on busy pages — a quiet
         backstop guarantees the pull happens */
      timer = window.setTimeout(pull, 1800);
    } else {
      timer = window.setTimeout(pull, 1100);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  /* THE SWALLOW — the whole landing folds itself into the miniature
     portal's mouth (an inline clip-path ellipse; the CSS transformer
     drops ellipse+var declarations, so every value lives inline). */
  const enterPortal = useCallback(
    (world?: WorldKey, portalEl?: HTMLElement | null) => {
      if (busy.current) return;
      busy.current = true;
      if (world) {
        const s = useMirror.getState();
        if (world === "akashic") s.openAkashic();
        else if (world === "dreambook") s.openDreamBook();
        else if (world === "evolvemed") s.openEvolveMed();
      }
      let px = Math.round(origin.current.x * window.innerWidth);
      let py = Math.round(origin.current.y * window.innerHeight);
      if (portalEl) {
        const r = portalEl.getBoundingClientRect();
        px = Math.round(r.left + r.width / 2);
        py = Math.round(r.top + r.height / 2);
      }
      setPhase("opening");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setLandingClip(`ellipse(0% at ${px}px ${py}px)`);
        })
      );
      window.setTimeout(() => {
        setPhase("through");
        busy.current = false;
      }, 880);
    },
    []
  );

  /* THE RETURN — the chamber folds itself into a drop of light and the
     landing stands beneath it again, exactly where it was left. */
  const minimize = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPhase("closing");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setChamberClip("ellipse(0% at 50% 44%)");
      })
    );
    window.setTimeout(() => {
      setPhase("landing");
      setChamberClip(null);
      busy.current = false;
    }, 860);
  }, []);

  const landingVisible =
    phase === "landing" || phase === "opening" || phase === "closing";
  const chamberMounted = Chamber !== null;

  return (
    <>
      {/* THE CHAMBER — mounted from the first idle breath, resting
          beneath the landing until the fold asks for it */}
      {chamberMounted && (
        <div
          aria-hidden={phase !== "through" && phase !== "closing"}
          inert={phase !== "through" && phase !== "closing"}
          data-testid="chamber-layer"
          className="fixed inset-0 z-10 bg-background"
          style={
            chamberClip
              ? {
                  clipPath: chamberClip,
                  transition: UNFOLD_EASE,
                }
              : undefined
          }
        >
          <Chamber />
        </div>
      )}

      {/* THE LANDING — the threshold above the floor */}
      {landingVisible && (
        <div
          data-testid="landing-root"
          className="fixed inset-0 z-30 overflow-y-auto overscroll-y-contain bg-[#05070d]"
          style={
            landingClip
              ? {
                  clipPath: landingClip,
                  transition: FOLD_EASE,
                }
              : undefined
          }
        >
          <LandingPage
            onEnter={enterPortal}
            onOrigin={(x, y) => {
              origin.current = { x, y };
            }}
            onScrollMemorize={(y) => {
              landingScroll.current = y;
            }}
            initialScroll={landingScroll.current}
            minimized={phase === "closing"}
          />
        </div>
      )}

      {/* THE MINIMIZE MEDALLION — rides above the chamber, one small
          hand that carries the visitor back to the threshold */}
      {phase === "through" && (
        <button
          type="button"
          onClick={minimize}
          aria-label={t("Return to the landing")}
          title={t("Return to the landing")}
          data-testid="chamber-exit"
          className="rm-me-exit focus-glow fixed z-[95] flex size-11 items-center justify-center rounded-full border border-white/16 bg-[color-mix(in_srgb,var(--background)_62%,transparent)] text-foreground/85 shadow-[0_2px_18px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-[var(--hairline-active)] hover:text-foreground"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "calc(5.9rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <Minimize2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
