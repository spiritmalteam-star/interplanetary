"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  THE CREATION'S REVEAL — the light a making arrives inside.          */
/*                                                                     */
/*  When a creation stands up inside the chat (a painting, a woven      */
/*  book, a song, a record), it is not simply placed there: a rare      */
/*  light-language seal blooms at the heart of the room, a ring of      */
/*  gold breathes outward, two curtains — the feathered green and the   */
/*  plum violet, the house's two kind colors — part like a zip of       */
/*  light, a handful of sparks drift free, and the making rises into    */
/*  its place. One breath, about 1.2 seconds, then every actor leaves   */
/*  the stage: the resting DOM carries the making alone.                */
/*                                                                     */
/*  THE STILLNESS LAW — every motion is opacity and transform alone,    */
/*  the whole play runs exactly once, nothing loops, and under          */
/*  prefers-reduced-motion the entire ceremony folds into one plain     */
/*  fade.                                                               */
/* ------------------------------------------------------------------ */

/** The seals that rarely walk the realm — each reveal draws one. */
const REVEAL_SIGILS = [
  "/sigils/sigil_01.png",
  "/sigils/sigil_03.png",
  "/sigils/sigil_04.png",
  "/sigils/sigil_06.png",
  "/sigils/sigil_07.png",
  "/sigils/sigil_10.png",
  "/sigils/intricate_01.png",
  "/sigils/intricate_03.png",
];

/** A tiny deterministic hash — the same making always draws the same seal. */
function sealFor(signature: string): string {
  let h = 0;
  for (let i = 0; i < signature.length; i++) {
    h = (h * 31 + signature.charCodeAt(i)) | 0;
  }
  return REVEAL_SIGILS[Math.abs(h) % REVEAL_SIGILS.length];
}

/** The sparks — six small lights drifting outward from the heart. */
const SPARKS = [
  { x: -120, y: -64, d: 0.0 },
  { x: 112, y: -74, d: 0.08 },
  { x: -96, y: 58, d: 0.16 },
  { x: 128, y: 46, d: 0.06 },
  { x: -24, y: -108, d: 0.22 },
  { x: 30, y: 104, d: 0.12 },
] as const;

export function CreationReveal({
  signature,
  children,
  testIdPrefix = "creation-reveal",
}: {
  /** What the making is — kind and id; picks the seal and the memory. */
  signature: string;
  children: React.ReactNode;
  testIdPrefix?: string;
}) {
  const reduced = useReducedMotion();
  /* THE CLEAN STAGE — when the ceremony has played, every actor
     unmounts; the making rests alone (the smoothness law). Under
     prefers-reduced-motion the stage is simply never built. */
  const [played, setPlayed] = useState(false);
  const seal = useMemo(() => sealFor(signature), [signature]);
  const done = reduced || played;

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setPlayed(true), 1600);
    return () => window.clearTimeout(t);
  }, [reduced, signature]);

  return (
    <div className="relative" data-testid={testIdPrefix}>
      {/* ---------------- THE CEREMONY (one breath, then gone) --------- */}
      {!done && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-2 z-0 flex justify-center"
        >
          <div className="relative flex h-[150px] w-full max-w-[420px] items-start justify-center">
            {/* the seal blooms at the heart */}
            <motion.img
              src={seal}
              alt=""
              className="absolute top-0 size-[92px] rounded-full object-contain"
              style={{ filter: "drop-shadow(0 0 16px rgba(232,217,176,0.65))" }}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.55, rotate: -14 }
              }
              animate={
                reduced
                  ? { opacity: 0 }
                  : { opacity: [0, 0.95, 0.85, 0], scale: [0.55, 1, 1.06, 1.14], rotate: [-14, 0, 4, 8] }
              }
              transition={{ duration: 1.35, times: [0, 0.3, 0.62, 1], ease: "easeOut" }}
            />
            {/* the ring of gold breathes outward once */}
            <motion.span
              className="absolute top-[10px] size-[112px] rounded-full border-[1.5px]"
              style={{ borderColor: "rgba(232,217,176,0.75)" }}
              initial={reduced ? { opacity: 0 } : { opacity: 0.85, scale: 0.5 }}
              animate={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.1, delay: 0.12, ease: "easeOut" }}
            />
            {/* a second, violet echo — the kind colors answering */}
            <motion.span
              className="absolute top-[22px] size-[88px] rounded-full border"
              style={{ borderColor: "color-mix(in srgb, var(--lp-violet, #7c5f8f) 65%, transparent)" }}
              initial={reduced ? { opacity: 0 } : { opacity: 0.6, scale: 0.4 }}
              animate={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.7 }}
              transition={{ duration: 1.2, delay: 0.22, ease: "easeOut" }}
            />
            {/* the sparks — a handful of lights drifting free */}
            {!reduced &&
              SPARKS.map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute top-[52px] size-[4px] rounded-full"
                  style={{
                    background:
                      i % 2 === 0
                        ? "var(--lp-gold, #e8d9b0)"
                        : "color-mix(in srgb, var(--lp-feather, #5c7a52) 80%, white)",
                    boxShadow: "0 0 8px 1px rgba(232,217,176,0.55)",
                  }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.9, 0], x: [0, s.x], y: [0, s.y], scale: [0.6, 1, 0.5] }}
                  transition={{ duration: 1.05, delay: 0.34 + s.d, ease: "easeOut" }}
                />
              ))}
          </div>
        </div>
      )}

      {/* ------------- THE CURTAINS — the zip of two kind lights -------
          Two soft veils (feathered green above, plum violet beneath)
          cover the making and part upward and downward like a zip of
          light. They only play while the ceremony stands. */}
      {!done && !reduced && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--lp-feather, #5c7a52) 22%, var(--background)) 0%, color-mix(in srgb, var(--lp-feather, #5c7a52) 8%, transparent) 100%)",
            }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: "-101%", opacity: 0.9 }}
            transition={{ duration: 0.75, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--lp-violet, #7c5f8f) 20%, var(--background)) 0%, color-mix(in srgb, var(--lp-violet, #7c5f8f) 8%, transparent) 100%)",
            }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: "101%", opacity: 0.9 }}
            transition={{ duration: 0.75, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}

      {/* ------------------- THE MAKING RISES -------------------------- */}
      <motion.div
        className="relative z-[5]"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
