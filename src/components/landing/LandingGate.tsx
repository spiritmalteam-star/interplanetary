"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import AppShell from "@/components/mirror/AppShell";
import LandingPage from "./LandingPage";

/* ------------------------------------------------------------------ */
/*  THE GATE — a two-way door now.                                     */
/*                                                                     */
/*  ENTERING: the chamber is mounted from the very first breath and    */
/*  warms beneath the porch (hidden but alive), so when the visitor    */
/*  presses the arch there is nothing left to load — the porch folds   */
/*  itself into the arch (clip-path swallow + a golden bloom) and the  */
/*  chamber settles beneath it like breath on glass. No lag, no loader.*/
/*                                                                     */
/*  LEAVING: a small M.E medallion (the About Us seal) rides at the    */
/*  chamber's foot. Press it and the whole chamber folds back into     */
/*  that medallion while the porch unfurls from the same mouth — the   */
/*  same door, walked through in the other direction.                  */
/* ------------------------------------------------------------------ */

type Stage = "landing" | "opening" | "through" | "closing";

type Gate = {
  stage: Stage;
  portal: { x: number; y: number };
  porchOut: boolean; /* the porch's reverse bloom: 0% → 142% while closing */
};

const THROUGH_AFTER_MS = 1250;
const HOME_AFTER_MS = 1350;

const toPct = (px: number, size: number, fallback: number) =>
  typeof window !== "undefined" && size > 0 ? (px / size) * 100 : fallback;

export default function LandingGate() {
  const [gate, setGate] = useState<Gate>({
    stage: "landing",
    portal: { x: 50, y: 45 },
    porchOut: false,
  });

  const enter = useCallback((x: number, y: number) => {
    setGate((g) =>
      g.stage !== "landing"
        ? g
        : {
            stage: "opening",
            porchOut: false,
            portal: {
              x: toPct(x, window.innerWidth, 50),
              y: toPct(y, window.innerHeight, 45),
            },
          },
    );
  }, []);

  const exit = useCallback((x: number, y: number) => {
    setGate((g) =>
      g.stage !== "through"
        ? g
        : {
            stage: "closing",
            porchOut: false,
            portal: {
              x: toPct(x, window.innerWidth, 12),
              y: toPct(y, window.innerHeight, 92),
            },
          },
    );
  }, []);

  useEffect(() => {
    if (gate.stage === "opening") {
      const t = setTimeout(
        () =>
          setGate((g) => (g.stage === "opening" ? { ...g, stage: "through" } : g)),
        THROUGH_AFTER_MS,
      );
      return () => clearTimeout(t);
    }
    if (gate.stage === "closing") {
      /* two frames in, unfurl the porch from the portal mouth */
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setGate((g) => (g.stage === "closing" ? { ...g, porchOut: true } : g)),
        ),
      );
      const t = setTimeout(
        () => setGate((g) => (g.stage === "closing" ? { ...g, stage: "landing" } : g)),
        HOME_AFTER_MS,
      );
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  }, [gate.stage]);

  const { stage, portal, porchOut } = gate;
  const chamberHidden = stage === "landing";
  const chamberSwallowed = stage === "closing";

  return (
    <>
      {/* the chamber — mounted early, invisible until the arch opens */}
      <div
        aria-hidden={chamberHidden || chamberSwallowed}
        inert={chamberHidden || chamberSwallowed}
        className={stage === "through" ? "chamber-through" : undefined}
        style={
          {
            visibility: chamberHidden ? "hidden" : "visible",
            ...(chamberSwallowed
              ? {
                  /* the chamber folds back into the M.E medallion */
                  clipPath: porchOut
                    ? `ellipse(0% 0% at ${portal.x}% ${portal.y}%)`
                    : `ellipse(142% 142% at ${portal.x}% ${portal.y}%)`,
                  transition:
                    "clip-path 0.9s cubic-bezier(0.8, 0, 0.18, 1) 0.05s",
                }
              : {}),
          } as CSSProperties
        }
      >
        <AppShell />
      </div>

      {/* the porch — the front of the house until the visitor passes */}
      {stage !== "through" && (
        <LandingPage
          onEnter={enter}
          opening={stage === "opening"}
          closing={stage === "closing"}
          porchOut={porchOut}
          portal={portal}
        />
      )}

      {/* the bloom at the mouth of the portal — both directions */}
      {(stage === "opening" || stage === "closing") && (
        <span
          aria-hidden
          className="landing-bloom"
          style={{ left: `${portal.x}%`, top: `${portal.y}%` }}
        />
      )}

      {/* the way home — the M.E medallion rises at the chamber's foot */}
      {stage === "through" && (
        <button
          type="button"
          data-testid="chamber-exit"
          aria-label="Return to the front porch"
          title="Return to the front porch"
          onClick={(e) => exit(e.clientX, e.clientY)}
          className="me-exit-in focus-glow fixed z-[95] flex h-11 items-center gap-2 rounded-full border bg-[var(--glass-bg)] px-4 text-foreground backdrop-blur-md transition-colors duration-300 hover:border-[var(--hairline-hover)]"
          style={{
            left: "0.9rem",
            /* raised above the composer floor so it never covers the
               whisper input on either phone or desktop */
            bottom: "calc(5.75rem + env(safe-area-inset-bottom))",
            borderColor: "var(--hairline)",
            boxShadow: "0 12px 34px -16px rgba(0, 0, 0, 0.55)",
          }}
        >
          <img
            src="/images/ai/mark-light.png"
            alt=""
            aria-hidden
            className="size-5 object-contain dark:hidden"
          />
          <img
            src="/images/ai/mark-dark.png"
            alt=""
            aria-hidden
            className="hidden size-5 object-contain dark:block"
          />
          <span className="mono-label text-[10.5px] tracking-[0.3em]">M.E</span>
        </button>
      )}
    </>
  );
}
