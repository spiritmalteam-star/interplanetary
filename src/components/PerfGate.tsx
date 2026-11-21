"use client";

import { useEffect } from "react";
import { applyPerfAttribute } from "@/lib/perf-mode";
import { bootPageLifecycle } from "@/lib/page-lifecycle";
import { bootPerfTelemetry } from "@/lib/perf-telemetry";

/* THE HOUSE'S QUIET TAILOR — mounts once at the very root and hangs
   the measured performance tier on <html> as data-perf="eco|high",
   so every stylesheet in the house (the landing and the world views
   included) can dress the room without a single React re-render.
   Also boots the page-lifecycle ear (visibility / resume / network)
   and the private, in-memory performance telemetry. Dev builds may
   read window.__reflectmePerf.snapshot().
   Renders nothing; costs one effect. */
export function PerfGate() {
  useEffect(() => {
    applyPerfAttribute();
    bootPageLifecycle();
    bootPerfTelemetry();
    if (process.env.NODE_ENV !== "production") {
      import("@/lib/perf-telemetry").then((m) => {
        (window as unknown as Record<string, unknown>).__reflectmePerf = {
          snapshot: m.perfSnapshot,
        };
      });
    }
  }, []);
  return null;
}
