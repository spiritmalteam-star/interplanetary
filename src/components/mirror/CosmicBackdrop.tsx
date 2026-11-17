"use client";

import { usePerfMode } from "@/lib/perf-mode";
import { cn } from "@/lib/utils";

/**
 * CosmicBackdrop — soft, blurred atmospheric gradients positioned
 * behind the hero. Extremely subtle; never flat or bright.
 *
 * THE ADAPTIVE ATMOSPHERE — the drift rides only on the house's high
 * visual tier: balanced and eco devices see the same atmosphere drawn
 * still (the blobs keep their exact geometry and gradients — zero
 * layout shift, zero animation cost). The centering that rode the
 * drift-a keyframes' rest transform is carried inline in the still
 * branch, and the curtains' small-screen hiding law holds in every
 * tier.
 */
export function CosmicBackdrop() {
  const tier = usePerfMode((s) => s.tier);
  const drift = tier === "high";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* central nebula behind the hero */}
      <div
        className={cn(
          "absolute -top-[28%] h-[85vh] w-[120vw] min-w-[900px] rounded-full transition-colors duration-700",
          drift
            ? "animate-drift-a left-1/2"
            : "left-1/2 hidden sm:block [transform:translate(-50%,0)]"
        )}
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-1), transparent 72%)",
        }}
      />
      {/* deep indigo, lower left */}
      <div
        className={cn(
          "animate-drift-b absolute top-[38%] -left-[22%] h-[70vh] w-[75vw] min-w-[700px] rounded-full transition-colors duration-700",
          !drift && "[animation:none]"
        )}
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-2), transparent 70%)",
        }}
      />
      {/* cyan / teal, lower right */}
      <div
        className={cn(
          "absolute -right-[18%] -bottom-[30%] h-[75vh] w-[85vw] min-w-[760px] rounded-full transition-colors duration-700",
          drift ? "animate-drift-c" : "hidden sm:block"
        )}
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-3), transparent 72%)",
        }}
      />
      {/* faint pink, upper right */}
      <div
        className={cn(
          "animate-drift-b absolute top-[6%] right-[4%] h-[45vh] w-[55vw] min-w-[520px] rounded-full transition-colors duration-700",
          !drift && "[animation:none]"
        )}
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-4), transparent 70%)",
        }}
      />
    </div>
  );
}
