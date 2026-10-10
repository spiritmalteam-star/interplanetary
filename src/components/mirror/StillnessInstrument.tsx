"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  StillnessInstrument — the drawing that fills the blank page.       */
/*                                                                     */
/*  While the main chat is totally blank, a fine ink instrument        */
/*  draws itself in the middle of the field — rings, spokes, dial      */
/*  ticks, an eccentric wheel, a stand, a few stars. The moment the    */
/*  visitor types or touches the screen, it crumbles: every stroke     */
/*  falls away on its own path and fades. In renewed stillness it      */
/*  gathers itself again.                                              */
/* ------------------------------------------------------------------ */

const CX = 160;
const CY = 110;
/** Stagger between strokes while the drawing writes itself. */
const DRAW_STEP = 0.02;

interface Frag {
  d: string;
  w: number; /* stroke width (0 = filled dot) */
  o: number; /* resting opacity */
  fill?: boolean;
}

const ringAt = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
const ring = (r: number) => ringAt(CX, CY, r);

const dot = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`;

const star = (x: number, y: number, s: number) =>
  `M ${x} ${y - s} L ${x + s * 0.3} ${y - s * 0.3} L ${x + s} ${y} L ${x + s * 0.3} ${y + s * 0.3} L ${x} ${y + s} L ${x - s * 0.3} ${y + s * 0.3} L ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.3} Z`;

/** The instrument, stroke by stroke — a fixed drawing, never random. */
const FRAGS: Frag[] = (() => {
  const f: Frag[] = [];
  /* the rings */
  f.push({ d: ring(78), w: 1.15, o: 0.4 });
  f.push({ d: ring(66), w: 0.6, o: 0.18 });
  f.push({ d: ring(54), w: 0.85, o: 0.3 });
  f.push({ d: ring(26), w: 0.95, o: 0.36 });
  /* the spokes */
  for (const a of [90, 30, 150]) {
    const rad = (a * Math.PI) / 180;
    const x = CX + 78 * Math.cos(rad);
    const y = CY + 78 * Math.sin(rad);
    f.push({
      d: `M ${x.toFixed(1)} ${y.toFixed(1)} L ${(2 * CX - x).toFixed(1)} ${(2 * CY - y).toFixed(1)}`,
      w: 0.6,
      o: 0.2,
    });
  }
  /* the ticks of the outer dial */
  for (let i = 0; i < 36; i++) {
    const rad = (i * 10 * Math.PI) / 180;
    const major = i % 3 === 0;
    const r2 = major ? 88 : 83.5;
    f.push({
      d: `M ${(CX + 78 * Math.cos(rad)).toFixed(1)} ${(CY + 78 * Math.sin(rad)).toFixed(1)} L ${(CX + r2 * Math.cos(rad)).toFixed(1)} ${(CY + r2 * Math.sin(rad)).toFixed(1)}`,
      w: major ? 0.95 : 0.55,
      o: major ? 0.32 : 0.16,
    });
  }
  /* the plumb line and its hang-point */
  f.push({ d: `M ${CX} 12 L ${CX} ${CY - 78}`, w: 0.75, o: 0.28 });
  f.push({ d: dot(CX, 9, 2.2), w: 0, o: 0.4, fill: true });
  /* the eccentric wheel riding the middle ring */
  const gx = CX + 54 * Math.cos((-36 * Math.PI) / 180);
  const gy = CY + 54 * Math.sin((-36 * Math.PI) / 180);
  f.push({ d: ringAt(gx, gy, 11), w: 0.85, o: 0.34 });
  f.push({ d: dot(gx, gy, 1.7), w: 0, o: 0.48, fill: true });
  /* the small moon beyond the dial */
  f.push({ d: ringAt(246, 46, 9), w: 0.85, o: 0.32 });
  f.push({ d: dot(246, 46, 1.3), w: 0, o: 0.42, fill: true });
  /* riders on the outer ring */
  for (const a of [20, 160, 305]) {
    const rad = (a * Math.PI) / 180;
    f.push({
      d: dot(CX + 78 * Math.cos(rad), CY + 78 * Math.sin(rad), 2),
      w: 0,
      o: 0.42,
      fill: true,
    });
  }
  /* the stand */
  f.push({ d: `M ${CX} ${CY + 78} L ${CX} ${CY + 122}`, w: 1.05, o: 0.38 });
  f.push({
    d: `M ${CX} ${CY + 122} L 116 ${CY + 158}`,
    w: 0.95,
    o: 0.34,
  });
  f.push({
    d: `M ${CX} ${CY + 122} L 204 ${CY + 158}`,
    w: 0.95,
    o: 0.34,
  });
  /* the ground */
  f.push({ d: `M 98 ${CY + 158} L 222 ${CY + 158}`, w: 1.05, o: 0.36 });
  f.push({ d: `M 108 ${CY + 164} L 118 ${CY + 164}`, w: 0.6, o: 0.2 });
  f.push({ d: `M 202 ${CY + 164} L 212 ${CY + 164}`, w: 0.6, o: 0.2 });
  /* the stars around it */
  for (const [x, y, s] of [
    [44, 64, 4],
    [276, 92, 3.4],
    [64, 178, 3],
    [258, 196, 4.4],
    [132, 26, 3],
    [236, 20, 2.6],
  ] as const) {
    f.push({ d: star(x, y, s), w: 0.75, o: 0.28 });
  }
  return f;
})();

export function StillnessInstrument() {
  const t = useT();
  const messageCount = useMirror((s) => s.sessions[s.activeMode].messages.length);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);
  const reduce = useReducedMotion() ?? false;

  /* the chat is totally blank — no messages, the scope at rest,
     and the visitor has not begun to write */
  const blank = messageCount === 0 && status === "idle" && draft.trim() === "";

  const [touched, setTouched] = useState(false);

  /* A touch or a click anywhere crumbles the instrument while the
     chat is blank. While the visitor is writing or reading, touches
     quietly clear the memory so renewed stillness can draw it again. */
  useEffect(() => {
    const onDown = () => setTouched(blank);
    const onKey = () => {
      if (!blank) setTouched(false);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [blank]);

  const crumbled = !blank || touched;

  /* each stroke falls its own way */
  const falls = useMemo(
    () =>
      FRAGS.map(() => ({
        x: (Math.random() - 0.5) * 130,
        y: 70 + Math.random() * 150,
        r: (Math.random() - 0.5) * 110,
        delay: Math.random() * 0.28,
        dur: 0.75 + Math.random() * 0.55,
      })),
    []
  );

  const strokeVariants: Variants = {
    assembled: (i: number) => ({
      opacity: FRAGS[i].o,
      pathLength: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: {
        pathLength: {
          delay: 0.15 + i * DRAW_STEP,
          duration: 0.8,
          ease: "easeInOut",
        },
        opacity: { delay: 0.15 + i * DRAW_STEP, duration: 0.45 },
        x: { delay: 0.05 + i * 0.01, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        y: { delay: 0.05 + i * 0.01, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        rotate: {
          delay: 0.05 + i * 0.01,
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    }),
    crumbled: (i: number) =>
      reduce
        ? { opacity: 0, transition: { duration: 0.25 } }
        : {
            opacity: 0,
            x: falls[i].x,
            y: falls[i].y,
            rotate: falls[i].r,
            transition: {
              delay: falls[i].delay,
              duration: falls[i].dur,
              ease: [0.5, 0, 0.85, 0.4],
            },
          },
  };

  const captionVariants: Variants = {
    assembled: () => ({
      opacity: 0.55,
      x: 0,
      y: 0,
      rotate: 0,
      transition: { delay: 0.5 + FRAGS.length * DRAW_STEP, duration: 0.7 },
    }),
    crumbled: () =>
      reduce
        ? { opacity: 0, transition: { duration: 0.25 } }
        : {
            opacity: 0,
            y: 34,
            rotate: 3,
            transition: { delay: 0.1, duration: 0.7, ease: [0.5, 0, 0.85, 0.4] },
          },
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative flex h-[46vh] select-none flex-col items-center justify-center"
    >
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 320 284"
          role="presentation"
          focusable="false"
          className="h-auto w-[min(320px,72vw)] text-foreground"
        >
          {FRAGS.map((f, i) => (
            <motion.path
              key={i}
              d={f.d}
              custom={i}
              variants={strokeVariants}
              initial={{ opacity: 0, pathLength: 0, x: 0, y: 0, rotate: 0 }}
              animate={crumbled ? "crumbled" : "assembled"}
              fill={f.fill ? "currentColor" : "none"}
              stroke={f.fill ? "none" : "currentColor"}
              strokeWidth={f.w || undefined}
              strokeLinecap="round"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
        </svg>
        <motion.p
          variants={captionVariants}
          initial={{ opacity: 0 }}
          animate={crumbled ? "crumbled" : "assembled"}
          className="mt-6 font-[family-name(var(--font-literata))] text-[13px] italic text-foreground"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {t("The stillness before the first question.")}
        </motion.p>
      </div>
    </div>
  );
}
