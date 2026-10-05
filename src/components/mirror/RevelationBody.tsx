"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE REVELATION BODY — the shared reader of the narrator's          */
/*  structured transmissions (ParticleX · Evolve Med). Two movements:  */
/*  RevelationProse, the doorway paragraphs; RevelationSections, the   */
/*  named movements that carry the teaching — each a small-caps mono   */
/*  heading in the scope's own light over a short gradient rule, then  */
/*  flowing ink. The formulas block stays each surface's own.          */
/* ------------------------------------------------------------------ */

export interface RevelationSection {
  heading: string;
  body: string;
}

/** The body ink — one size for the worlds' threads, one for the
    instrument cards' tighter chambers. */
const BODY_SIZES = {
  md: "text-[15px] leading-[1.8] text-foreground/88",
  sm: "text-[14px] leading-[1.8] text-foreground/88",
} as const;

type BodySize = keyof typeof BODY_SIZES;

/** The doorway prose — the revelation's paragraphs, split on blank
    lines exactly as the surfaces always read them. */
export function RevelationProse({
  text,
  size = "md",
  className,
  paragraphClassName,
}: {
  text: string;
  size?: BodySize;
  className?: string;
  paragraphClassName?: string;
}) {
  if (!text || !text.trim()) return null;
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  if (paragraphs.length === 0) return null;
  return (
    <div className={cn("space-y-3", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className={cn(BODY_SIZES[size], paragraphClassName)}>
          {p}
        </p>
      ))}
    </div>
  );
}

/** The named movements — the structured teaching sitting between the
    revelation and the formulas block. Null or empty renders nothing,
    so older replies (doorway prose only) keep their old shape. */
export function RevelationSections({
  sections,
  size = "md",
  boxed = true,
  className,
}: {
  sections?: RevelationSection[] | null;
  size?: BodySize;
  /** Boxed: each movement seated in its own glass panel (the worlds'
      threads). Unboxed: bare ink for surfaces already inside a card. */
  boxed?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (!sections || sections.length === 0) return null;
  return (
    <div className={cn("space-y-2.5", className)}>
      {sections.map((section, i) => {
        const heading = section.heading?.trim();
        const body = section.body?.trim();
        if (!heading || !body) return null;
        return (
          <motion.section
            key={`${i}-${heading.slice(0, 32)}`}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: reduced ? 0 : 0.08 * i,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(boxed && "glass rounded-xl px-4 py-3.5")}
          >
            <div className="flex items-center gap-2.5">
              <h4 className="mono-label min-w-0 text-[9.5px] tracking-[0.22em] text-[var(--scope-a)]">
                {heading}
              </h4>
              <span
                aria-hidden="true"
                className="h-px w-9 shrink-0"
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 70%, transparent), transparent)",
                }}
              />
            </div>
            <p className={cn("mt-1.5", BODY_SIZES[size])}>{body}</p>
          </motion.section>
        );
      })}
    </div>
  );
}
