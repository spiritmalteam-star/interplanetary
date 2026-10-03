"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  StillCompanion — the little figure in the empty observatory.       */
/*                                                                     */
/*  When the main chat is TOTALLY blank (no messages, the scope        */
/*  resting, the composer empty), a small stickman quietly draws       */
/*  itself in at the middle of the field, leans toward the mirror      */
/*  line beneath it — its reflection breathing a waver of its own —    */
/*  and asks its one question. The moment the visitor types or         */
/*  touches the screen, the figure crumbles: every limb lets go and    */
/*  falls, the reflection going with it. It rises again only when      */
/*  the stillness has been broken once and returned — the page must    */
/*  know a beginning before the figure comes back.                     */
/* ------------------------------------------------------------------ */

/** One drawn stroke of the figure. */
interface Stroke {
  d: string;
  width: number;
}

/** The stickman above the mirror line — every path drawn separately so
    each can draw itself in, and crumble away on its own. */
const FIGURE: Stroke[] = [
  { d: "M100 34 a10 10 0 1 1 -0.1 0", width: 2.4 }, // head
  { d: "M100 56 L100 90", width: 2.4 }, // body
  { d: "M100 63 L84 76", width: 2.2 }, // left arm, resting
  { d: "M100 63 L117 74", width: 2.2 }, // right arm, reaching toward the glass
  { d: "M100 90 L89 109", width: 2.2 }, // left leg
  { d: "M100 90 L111 109", width: 2.2 }, // right leg
];

/** Where the mirror glass sits — the reflection folds across it. */
const GLASS_Y = 118;

export function StillCompanion() {
  const t = useT();
  const activeMode = useMirror((s) => s.activeMode);
  const messageCount = useMirror((s) => s.sessions[s.activeMode].messages.length);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);

  const [risen, setRisen] = useState(false);
  /* the figure has crumbled — it may not rise again until the stillness
     has been broken (something was written) and returned */
  const crumbledRef = useRef(false);

  /* the chat is totally blank — no messages, the scope at rest,
     and the visitor has not begun to write */
  const blank = messageCount === 0 && status === "idle" && draft.trim() === "";

  /* the stillness was broken — the figure may rise again when it returns */
  useEffect(() => {
    if (!blank) crumbledRef.current = false;
  }, [blank]);

  /* rise: only in total stillness, after a short, respectful wait.
     (The figure hides through the render gate below — when `blank`
     or `risen` falls, AnimatePresence plays the crumble exit.) */
  useEffect(() => {
    if (!blank || crumbledRef.current) return;
    let alive = true;
    const waitT = setTimeout(() => {
      if (alive && !crumbledRef.current) setRisen(true);
    }, 1600);
    return () => {
      alive = false;
      clearTimeout(waitT);
    };
  }, [blank]);

  /* crumble: the first touch of the screen while the figure stands */
  useEffect(() => {
    if (!risen) return;
    const crumble = () => {
      if (crumbledRef.current) return;
      crumbledRef.current = true;
      setRisen(false);
    };
    window.addEventListener("pointerdown", crumble, { once: true });
    window.addEventListener("touchstart", crumble, { once: true });
    return () => {
      window.removeEventListener("pointerdown", crumble);
      window.removeEventListener("touchstart", crumble);
    };
  }, [risen]);

  const show = blank && risen;

  return (
    <div
      data-testid="still-companion"
      className="pointer-events-none relative flex h-[46vh] select-none flex-col items-center justify-center"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            key="companion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.75 } }}
            className="flex flex-col items-center"
          >
            <svg
              viewBox="0 0 200 224"
              className="h-52 w-[186px] sm:h-60 sm:w-[214px]"
              fill="none"
              aria-hidden="true"
            >
              {/* the mirror glass — a single held line */}
              <motion.line
                x1={46}
                y1={GLASS_Y}
                x2={154}
                y2={GLASS_Y}
                stroke="currentColor"
                strokeWidth={1}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.32 }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              />
              {/* the glass's faint breath */}
              <motion.line
                x1={58}
                y1={GLASS_Y + 5}
                x2={142}
                y2={GLASS_Y + 5}
                stroke="currentColor"
                strokeWidth={0.6}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.14, 0.08] }}
                transition={{ duration: 3.4, delay: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* the reflection — the figure folded across the glass,
                  breathing with a slow waver the original does not have */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.32 }}
                exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.3 } }}
                transition={{ duration: 1.2, delay: 1.7 }}
              >
                <motion.g
                  animate={{ skewX: [0, 2.4, 0, -2, 0], scaleY: [1, 0.985, 1] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: `100px ${GLASS_Y}px` }}
                >
                  {FIGURE.map((s, i) => (
                    <motion.path
                      key={`refl-${i}`}
                      d={s.d}
                      stroke="currentColor"
                      strokeWidth={s.width}
                      strokeLinecap="round"
                      transform={`translate(0 ${GLASS_Y * 2}) scale(1 -1)`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.7, delay: 1.8 + i * 0.14, ease: "easeOut" }}
                    />
                  ))}
                </motion.g>
              </motion.g>

              {/* the figure itself — it sways gently on its feet */}
              <motion.g
                animate={{ rotate: [-1.1, 1.1, -1.1] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "100px 109px" }}
              >
                {FIGURE.map((s, i) => (
                  <motion.path
                    key={i}
                    d={s.d}
                    stroke="currentColor"
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{
                      /* the crumble — every stroke lets go */
                      pathLength: 0.3,
                      opacity: 0,
                      y: 26 + i * 9,
                      x: (i % 2 === 0 ? -1 : 1) * (8 + i * 5),
                      rotate: (i % 2 === 0 ? -1 : 1) * (24 + i * 10),
                      transition: {
                        duration: 0.62 + i * 0.07,
                        delay: i * 0.045,
                        ease: "easeIn",
                      },
                    }}
                    transition={{
                      pathLength: { duration: 0.66, delay: 0.3 + i * 0.17, ease: "easeInOut" },
                      opacity: { duration: 0.3, delay: 0.3 + i * 0.17 },
                    }}
                  />
                ))}
              </motion.g>
            </svg>

            {/* the one question */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
              transition={{ duration: 0.9, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
              className="ink-soft mt-4 max-w-[300px] text-center font-[family-name(var(--font-literata))] text-[15.5px] italic leading-relaxed sm:max-w-[360px] sm:text-[16.5px]"
            >
              {t("What do you wish to remember, dear one?")}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
