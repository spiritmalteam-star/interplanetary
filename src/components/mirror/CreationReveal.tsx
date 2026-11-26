"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  THE CREATION'S REVEAL — the light a making arrives inside.          */
/*                                                                     */
/*  When a creation stands up inside the chat (a painting, a woven      */
/*  book, a song, a record), ONE simple authentic light announces it:   */
/*  a single ring of gold breathes outward from the heart of the room,  */
/*  and the making rises into its place inside that breath. One         */
/*  motion, about a second, then the actor leaves the stage: the        */
/*  resting DOM carries the making alone. (The owner's word: one        */
/*  simple authentic reveal — never five dancing for the same           */
/*  arrival.)                                                           */
/*                                                                     */
/*  THE STILLNESS LAW — the motion is opacity and transform alone,      */
/*  the play runs exactly once, nothing loops, and under                */
/*  prefers-reduced-motion it folds into one plain fade.                */
/* ------------------------------------------------------------------ */

export function CreationReveal({
  signature,
  children,
  testIdPrefix = "creation-reveal",
}: {
  /** What the making is — kind and id; keeps the reveal honest per making. */
  signature: string;
  children: React.ReactNode;
  testIdPrefix?: string;
}) {
  const reduced = useReducedMotion();
  /* THE CLEAN STAGE — when the reveal has played, the actor unmounts;
     the making rests alone (the smoothness law). Under
     prefers-reduced-motion the stage is simply never built. */
  const [played, setPlayed] = useState(false);
  const done = reduced || played;

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setPlayed(true), 1100);
    return () => window.clearTimeout(t);
  }, [reduced, signature]);

  return (
    <div className="relative" data-testid={testIdPrefix} data-reveal-signature={signature}>
      {/* -------- THE ONE BREATH — a single ring of gold -------- */}
      {!done && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-2 z-0 flex justify-center"
        >
          <div className="relative flex h-[120px] w-full max-w-[420px] items-start justify-center">
            <motion.span
              className="absolute top-[16px] size-[104px] rounded-full border-[1.5px]"
              style={{
                borderColor: "rgba(232,217,176,0.75)",
                boxShadow: "0 0 24px -6px rgba(232,217,176,0.5)",
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0.85, scale: 0.5 }}
              animate={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.55 }}
              transition={{ duration: 0.95, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* ------------------- THE MAKING RISES -------------------------- */}
      <motion.div
        className="relative z-[5]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: reduced ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
