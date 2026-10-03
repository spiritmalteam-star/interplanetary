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
/*  in above the mirror line and its reflection below — and the        */
/*  moment they land they DANCE together, then HUG across the glass    */
/*  while love sparks rise from where their hands meet — and only      */
/*  then do they return to their places, swaying gently, while the     */
/*  one question is asked. The first touch or letter makes every       */
/*  limb let go and fall, the reflection going with it.                */
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

/** The hug — arms that curve down and across the glass. Drawn in the
    figure's own space; the reflection flips them, so both pairs of
    hands arrive at the same two places on the line. */
const REACH: Stroke[] = [
  { d: "M100 63 C116 76 126 96 122 113", width: 2.2 },
  { d: "M100 63 C84 76 74 96 78 113", width: 2.2 },
];

/** The love sparks — tiny outline hearts and crosses rising from the
    place the two pairs of hands meet on the glass. */
const SPARKS: { x: number; delay: number; heart: boolean; drift: number }[] = [
  { x: -10, delay: 0.0, heart: true, drift: -6 },
  { x: 12, delay: 0.3, heart: false, drift: 7 },
  { x: -3, delay: 0.6, heart: true, drift: 4 },
  { x: 18, delay: 0.9, heart: true, drift: -8 },
  { x: -16, delay: 1.2, heart: false, drift: 5 },
  { x: 5, delay: 1.5, heart: true, drift: -4 },
];

const HEART_D =
  "M0 1.8 C-1.3 0.1 -3.4 0.9 -3.4 2.5 C-3.4 4 -1.7 5.1 0 6.6 C1.7 5.1 3.4 4 3.4 2.5 C3.4 0.9 1.3 0.1 0 1.8 Z";
const CROSS_D = "M0 -2.2 L0 2.2 M-2.2 0 L2.2 0";

/** Where the mirror glass sits — the reflection folds across it. */
const GLASS_Y = 118;

/** The landing sequence: draw → dance → hug → settle. */
type Phase = "draw" | "dance" | "hug" | "settle";

export function StillCompanion() {
  const t = useT();
  const messageCount = useMirror((s) => s.sessions[s.activeMode].messages.length);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);

  const [crumbled, setCrumbled] = useState(false);
  const [phase, setPhase] = useState<Phase>("draw");

  /* the chat is totally blank — no messages, the scope at rest,
     and the visitor has not begun to write */
  const blank = messageCount === 0 && status === "idle" && draft.trim() === "";

  /* rising is derived — the figures are revealed INSTANTLY the moment
     the stillness holds and they have not crumbled */
  const risen = blank && !crumbled;

  /* when the stillness breaks and returns, the landing begins again —
     state adjusted during render (the React-endorsed pattern) */
  const [risenSnapshot, setRisenSnapshot] = useState(risen);
  if (risenSnapshot !== risen) {
    setRisenSnapshot(risen);
    if (risen) setPhase("draw");
  }

  /* the landing sequence itself — every beat is timer-driven */
  useEffect(() => {
    if (!risen) return;
    const t1 = window.setTimeout(() => setPhase("dance"), 750);
    const t2 = window.setTimeout(() => setPhase("hug"), 2900);
    const t3 = window.setTimeout(() => setPhase("settle"), 5100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [risen]);

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
  const hugging = phase === "hug";

  /* the standing figure's pose through the sequence */
  const figPose =
    phase === "dance"
      ? {
          rotate: [-6.5, 6.5, -6.5],
          y: [0, -5, 0],
          transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" as const },
        }
      : phase === "hug"
        ? { rotate: 0, y: 4, transition: { duration: 0.55, ease: "easeInOut" as const } }
        : phase === "settle"
          ? {
              rotate: [-1.1, 1.1, -1.1],
              y: 0,
              transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut" as const },
            }
          : { rotate: 0, y: 0 };

  /* the reflection answers every move, mirrored */
  const reflPose =
    phase === "dance"
      ? {
          rotate: [6.5, -6.5, 6.5],
          y: [0, 5, 0],
          transition: { duration: 0.55, repeat: Infinity, ease: "easeInOut" as const },
        }
      : phase === "hug"
        ? { rotate: 0, y: -4, transition: { duration: 0.55, ease: "easeInOut" as const } }
        : phase === "settle"
          ? {
              rotate: [1.1, -1.1, 1.1],
              y: 0,
              transition: { duration: 4.6, repeat: Infinity, ease: "easeInOut" as const },
            }
          : { rotate: 0, y: 0 };

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
                <motion.g animate={reflPose} style={{ transformOrigin: `100px 109px` }}>
                  {/* its breathing waver */}
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
                        transition={{ duration: 0.55, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                      />
                    ))}
                    {/* its arms of the hug */}
                    <AnimatePresence>
                      {hugging &&
                        REACH.map((s, i) => (
                          <motion.path
                            key={`refl-reach-${i}`}
                            d={s.d}
                            stroke="currentColor"
                            strokeWidth={s.width}
                            strokeLinecap="round"
                            transform={`translate(0 ${GLASS_Y * 2}) scale(1 -1)`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.45 } }}
                            transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                          />
                        ))}
                    </AnimatePresence>
                  </motion.g>
                </motion.g>
              </motion.g>

              {/* the place the hands meet — a quiet pulse while they hug */}
              <AnimatePresence>
                {hugging && (
                  <motion.g key="meeting">
                    <motion.circle
                      cx={100}
                      cy={GLASS_Y}
                      r={2}
                      stroke="currentColor"
                      strokeWidth={0.8}
                      initial={{ opacity: 0 }}
                      animate={{ r: [2, 14], opacity: [0.45, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.15, repeat: Infinity, ease: "easeOut" }}
                    />
                    <motion.circle
                      cx={100}
                      cy={GLASS_Y}
                      r={1.6}
                      fill="currentColor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0, transition: { duration: 0.4 } }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </motion.g>
                )}
              </AnimatePresence>

              {/* the love sparks — hearts and crosses rising from the hug */}
              <AnimatePresence>
                {hugging &&
                  SPARKS.map((sp, i) => (
                    <motion.path
                      key={`spark-${i}`}
                      d={sp.heart ? HEART_D : CROSS_D}
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeLinecap="round"
                      fill="none"
                      initial={{ opacity: 0, x: 100 + sp.x, y: GLASS_Y - 2, scale: 0.5 }}
                      animate={{
                        opacity: [0, 0.75, 0],
                        y: GLASS_Y - 52,
                        x: 100 + sp.x + sp.drift,
                        scale: [0.5, 1, 0.75],
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.35 } }}
                      transition={{
                        duration: 1.7,
                        delay: sp.delay,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  ))}
              </AnimatePresence>

              {/* the figure itself — it lands, dances, hugs, and settles */}
              <motion.g animate={figPose} style={{ transformOrigin: "100px 109px" }}>
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
                {/* its arms of the hug */}
                <AnimatePresence>
                  {hugging &&
                    REACH.map((s, i) => (
                      <motion.path
                        key={`reach-${i}`}
                        d={s.d}
                        stroke="currentColor"
                        strokeWidth={s.width}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.45 } }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.12, ease: "easeOut" }}
                      />
                    ))}
                </AnimatePresence>
              </motion.g>
            </svg>

            {/* the one question — asked once the two have gone to their places */}
            <AnimatePresence>
              {phase === "settle" && (
                <motion.p
                  key="question"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="ink-soft mt-4 max-w-[300px] text-center font-[family-name(var(--font-literata))] text-[15.5px] italic leading-relaxed sm:max-w-[360px] sm:text-[16.5px]"
                >
                  {t("What do you wish to remember, dear one?")}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
