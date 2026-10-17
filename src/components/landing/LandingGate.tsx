"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/mirror/AppShell";
import LandingPage from "./LandingPage";

/* ------------------------------------------------------------------ */
/*  THE GATE.                                                          */
/*                                                                     */
/*  The chamber is mounted from the very first breath and warms        */
/*  beneath the porch (hidden but alive), so that when the visitor     */
/*  presses the arch there is nothing left to load — the porch simply  */
/*  folds itself into the arch (a clip-path swallow + a golden bloom)  */
/*  and the chamber is already standing there. No lag, no loader.      */
/* ------------------------------------------------------------------ */

type Stage = "landing" | "opening" | "through";

type Gate = { stage: Stage; portal: { x: number; y: number } };

const THROUGH_AFTER_MS = 1250;

export default function LandingGate() {
  const [gate, setGate] = useState<Gate>({
    stage: "landing",
    portal: { x: 50, y: 45 },
  });

  const enter = useCallback((x: number, y: number) => {
    setGate((g) => {
      if (g.stage !== "landing") return g;
      return {
        stage: "opening",
        portal: {
          x: typeof window !== "undefined" ? (x / window.innerWidth) * 100 : 50,
          y: typeof window !== "undefined" ? (y / window.innerHeight) * 100 : 45,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (gate.stage !== "opening") return;
    const t = setTimeout(
      () => setGate((g) => (g.stage === "opening" ? { ...g, stage: "through" } : g)),
      THROUGH_AFTER_MS,
    );
    return () => clearTimeout(t);
  }, [gate.stage]);

  const { stage, portal } = gate;
  const appHidden = stage === "landing";

  return (
    <>
      {/* the chamber — mounted early, invisible until the arch opens */}
      <div
        aria-hidden={appHidden}
        inert={appHidden}
        style={{ visibility: appHidden ? "hidden" : "visible" }}
      >
        <AppShell />
      </div>

      {/* the porch — the front of the house until the visitor passes */}
      {stage !== "through" && (
        <LandingPage onEnter={enter} opening={stage === "opening"} portal={portal} />
      )}
    </>
  );
}
