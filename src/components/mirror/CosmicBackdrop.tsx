"use client";

/**
 * CosmicBackdrop — soft, blurred atmospheric gradients positioned
 * behind the hero. Extremely subtle; never flat or bright.
 */
export function CosmicBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* central nebula behind the hero */}
      <div
        className="animate-drift-a absolute -top-[28%] left-1/2 h-[85vh] w-[120vw] min-w-[900px] rounded-full transition-colors duration-700"
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-1), transparent 72%)",
        }}
      />
      {/* deep indigo, lower left */}
      <div
        className="animate-drift-b absolute top-[38%] -left-[22%] h-[70vh] w-[75vw] min-w-[700px] rounded-full transition-colors duration-700"
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-2), transparent 70%)",
        }}
      />
      {/* cyan / teal, lower right */}
      <div
        className="animate-drift-c absolute -right-[18%] -bottom-[30%] h-[75vh] w-[85vw] min-w-[760px] rounded-full transition-colors duration-700"
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-3), transparent 72%)",
        }}
      />
      {/* faint pink, upper right */}
      <div
        className="animate-drift-b absolute top-[6%] right-[4%] h-[45vh] w-[55vw] min-w-[520px] rounded-full transition-colors duration-700"
        style={{
          background:
            "radial-gradient(closest-side, var(--atmo-4), transparent 70%)",
        }}
      />
    </div>
  );
}
