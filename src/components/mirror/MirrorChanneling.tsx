"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE MIRROR'S CHANNELING LIGHT.                                     */
/*                                                                     */
/*  When the mirror is channeling an answer, this tiny tell stands     */
/*  where the words will land — the same kind of thinking light the    */
/*  other intelligences wear: three soft orbs rippling in the          */
/*  scope's own hue, while a narrow sheen sweeps the word once and     */
/*  again. Transform-and-opacity only; the stillness law (and the      */
/*  lens's dormant law) rest it entirely.                              */
/* ------------------------------------------------------------------ */

export function MirrorChanneling({
  label,
  className,
  compact = false,
}: {
  label: string;
  className?: string;
  /** the thread's own smaller voice */
  compact?: boolean;
}) {
  return (
    <span
      className={cn("mc-inline", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={compact ? "mirror-channeling-compact" : "mirror-channeling"}
    >
      <span className="mc-orbs" aria-hidden="true">
        <i className="mc-orb" />
        <i className="mc-orb" />
        <i className="mc-orb" />
      </span>
      <span className="mc-word">
        <span className="mc-word-text">{label}</span>
        <span className="mc-sheen" aria-hidden="true" />
      </span>
    </span>
  );
}
