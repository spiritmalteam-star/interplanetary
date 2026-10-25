"use client";

import { useEffect } from "react";
import { applyPerfAttribute } from "@/lib/perf-mode";

/* THE HOUSE'S QUIET TAILOR — mounts once at the very root and hangs
   the measured performance tier on <html> as data-perf="eco|high",
   so every stylesheet in the house (the landing and the world views
   included) can dress the room without a single React re-render.
   Renders nothing; costs one effect. */
export function PerfGate() {
  useEffect(() => {
    applyPerfAttribute();
  }, []);
  return null;
}
