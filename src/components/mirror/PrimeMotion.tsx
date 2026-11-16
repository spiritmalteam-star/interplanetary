"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  PRIME MOTION — the two small public voices of the house's tactile  */
/*  layer. Compositor-only: every animated thing here moves on         */
/*  transform and opacity alone, and the infinite motions live in the  */
/*  pm- styles of globals.css behind prefers-reduced-motion.           */
/* ------------------------------------------------------------------ */

/** THE SHIMMERING WORD — a label a blade of light crosses (the
    "Proceeding" of the streaming room): the text breathes, the sheen
    sweeps, nothing reflows. */
export function ShimmerLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("pm-shimmer", className)}>
      <span className="pm-shimmer-text">{children}</span>
      <span aria-hidden="true" className="pm-shimmer-sheen" />
    </span>
  );
}

/** THE SPARK TRAIL — three staggered motes rising and fading, one
    breath of the crossing made visible. Decorative only. */
export function SparkTrail({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pm-motes", className)}>
      <i className="pm-mote" />
      <i className="pm-mote" />
      <i className="pm-mote" />
    </span>
  );
}
