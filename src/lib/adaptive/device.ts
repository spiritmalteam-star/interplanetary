"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  THE ADAPTIVE ENGINE — one experience, all devices.                 */
/*                                                                     */
/*  A single device-capability profile every surface may read: form    */
/*  factor, input nature, spatial support, motion comfort. Components  */
/*  describe themselves by function and relationship; THIS decides     */
/*  how they present. No business logic per device — presentation      */
/*  only, graceful fallbacks everywhere.                               */
/* ------------------------------------------------------------------ */

export type FormFactor = "mobile" | "tablet" | "desktop";
export type InputNature = "touch" | "pointer" | "hybrid";

export interface DeviceCapability {
  ready: boolean;
  form: FormFactor;
  input: InputNature;
  /** WebXR immersive-vr support, when the browser answers honestly */
  spatialSupported: boolean;
  spatialChecked: boolean;
  /** the visitor asked the machine to keep still */
  reducedMotion: boolean;
  /** coarse viewport class for adaptive grids */
  viewport: "compact" | "medium" | "wide";
}

function readForm(): FormFactor {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function readInput(): InputNature {
  if (typeof window === "undefined" || !window.matchMedia) return "pointer";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (coarse && fine) return "hybrid";
  return coarse ? "touch" : "pointer";
}

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readViewport(): DeviceCapability["viewport"] {
  if (typeof window === "undefined") return "wide";
  const w = window.innerWidth;
  if (w < 640) return "compact";
  if (w < 1024) return "medium";
  return "wide";
}

/** The one hook — subscribe once, read everywhere. */
export function useDeviceCapability(): DeviceCapability {
  const [cap, setCap] = useState<DeviceCapability>({
    ready: false,
    form: "desktop",
    input: "pointer",
    spatialSupported: false,
    spatialChecked: false,
    reducedMotion: false,
    viewport: "wide",
  });

  useEffect(() => {
    let alive = true;

    const measure = () => {
      if (!alive) return;
      setCap((prev) => ({
        ...prev,
        ready: true,
        form: readForm(),
        input: readInput(),
        reducedMotion: readReducedMotion(),
        viewport: readViewport(),
      }));
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    // the spatial question — asked once, answered honestly
    const xr = (
      navigator as Navigator & {
        xr?: { isSessionSupported(m: string): Promise<boolean> };
      }
    ).xr;
    if (xr?.isSessionSupported) {
      xr.isSessionSupported("immersive-vr")
        .then((ok) => {
          if (alive)
            setCap((prev) => ({ ...prev, spatialSupported: ok, spatialChecked: true }));
        })
        .catch(() => {
          if (alive) setCap((prev) => ({ ...prev, spatialChecked: true }));
        });
    } else {
      // no WebXR to ask — the answer is already the graceful fallback
      queueMicrotask(() => {
        if (alive) setCap((prev) => ({ ...prev, spatialChecked: true }));
      });
    }

    return () => {
      alive = false;
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return cap;
}
