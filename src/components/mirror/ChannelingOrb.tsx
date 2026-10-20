import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE CHANNELING ORB — the mirror's tiny companion while a           */
/*  transmission forms. A breathing core of light inside a turning     */
/*  ring, one bright mote riding its own orbit (a second, slower       */
/*  one drifting the other way), the whole wrapped in a soft aura —    */
/*  the same kind of living ornament the great houses show while       */
/*  they think, wearing this chamber's own scope light.                */
/*                                                                     */
/*  THE COOL LAW: every motion is transform-and-opacity only, so the   */
/*  orb lives on the compositor and costs almost nothing; it rests     */
/*  with the stillness law and with the docked lens' dormant law.      */
/* ------------------------------------------------------------------ */

export function ChannelingOrb({
  size = 28,
  className,
}: {
  /** the orb's full diameter in px — the ring and aura scale with it */
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-orb"
      className={cn("chn-orb relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* the soft aura — breathing wider and quieter than all else */}
      <span className="chn-orb-aura absolute inset-0 rounded-full" />
      {/* the turning ring of light — a conic blade circling the core */}
      <span className="chn-orb-ring absolute inset-0 rounded-full" />
      {/* two motes on their own orbits, one counter-turning */}
      <span className="chn-orb-spin absolute inset-0">
        <i className="chn-orb-mote absolute left-1/2 top-0 size-[3px] -translate-x-1/2 rounded-full" />
      </span>
      <span className="chn-orb-spin chn-orb-spin-slow absolute inset-0">
        <i className="chn-orb-mote chn-orb-mote-dim absolute left-1/2 top-px size-0.5 -translate-x-1/2 rounded-full" />
      </span>
      {/* the breathing core — last painted, always on top */}
      <span
        className="chn-orb-core absolute rounded-full"
        style={{ inset: Math.max(4, Math.round(size * 0.28)) }}
      />
    </span>
  );
}

/** the shimmering word — a sweep of light crossing a small label */
export function ShimmerLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("chn-shimmer relative inline-block", className)}>
      {children}
    </span>
  );
}
