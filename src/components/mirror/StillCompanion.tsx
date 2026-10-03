"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  StillCompanion — the two small figures in the empty observatory.   */
/*                                                                     */
/*  When the main chat is TOTALLY blank, the scene is revealed         */
/*  INSTANTLY the moment the visitor enters: a stickman draws itself   */
/*  in above the mirror line and its reflection folds below — both     */
/*  sway gently in place while the one question is asked. The first    */
/*  touch or letter makes every limb let go and fall, the reflection   */
/*  going with it.                                                     */
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
  const messageCount = useMirror((s) => s.sessions[s.activeMode].messages.length);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);

  const [crumbled, setCrumbled] = useState(false);

  /* the chat is totally blank — no messages, the scope at rest,
     and the visitor has not begun to write */
  const blank = messageCount === 0 && status === "idle" && draft.trim() === "";

  /* rising is derived — the figures are revealed INSTANTLY the moment
     the stillness holds and they have not crumbled */
  const risen = blank && !crumbled;

  /* crumble: the first touch of the screen while the figures stand */
  useEffect(() => {
    if (!risen) return;
    const crumble = () => setCrumbled(true);
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
                transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
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

              {/* the reflection — the mirrored being below the glass */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.32 }}
                exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.3 } }}
                transition={{ duration: 0.9, delay: 0.45 }}
              >
                <motion.g
                  animate={{
                    skewX: [0, 2.4, 0, -2, 0],
                    scaleY: [1, 0.985, 1],
                    rotate: [1.1, -1.1, 1.1],
                  }}
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
                      transition={{ duration: 0.55, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    />
                  ))}
                </motion.g>
              </motion.g>

              {/* the figure itself — it draws in, then sways gently in place */}
              <motion.g
                animate={{
                  rotate: [-1.1, 1.1, -1.1],
                  y: [0, -1.5, 0],
                }}
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
                      pathLength: { duration: 0.5, delay: 0.08 + i * 0.09, ease: "easeInOut" },
                      opacity: { duration: 0.25, delay: 0.08 + i * 0.09 },
                    }}
                  />
                ))}
              </motion.g>
            </svg>

            {/* the one question — asked as soon as the two have arrived */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
              transition={{ duration: 0.9, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
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
