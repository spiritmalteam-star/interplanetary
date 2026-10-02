"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMirror } from "@/lib/mirror-store";
import { POSITIVE_REMINDERS } from "@/lib/data/reminders";

/* ------------------------------------------------------------------ */
/*  ReminderBubbles — the quiet whispers of the blank page.            */
/*                                                                     */
/*  Only when the main chat is TOTALLY blank (no messages, the scope   */
/*  resting, the composer empty) do they reveal: five positive         */
/*  reminders pop onto the open field at random hours of silence,      */
/*  linger a while, and dissolve. The moment the visitor begins to     */
/*  write, they pop and disappear — and the field waits for the next   */
/*  stillness.                                                         */
/* ------------------------------------------------------------------ */

/** How many whispers rise at once. */
const RISE = 5;

interface Bubble {
  id: number;
  text: string;
  top: number; /* % of the quiet field */
  left: number; /* % of the quiet field */
  delay: number; /* stagger before each pop */
}

/** Five distinct reminders at fresh positions in the open field. */
function rise(): Bubble[] {
  const picked = new Set<number>();
  while (picked.size < RISE) {
    picked.add(Math.floor(Math.random() * POSITIVE_REMINDERS.length));
  }
  return [...picked].map((i) => ({
    id: i * 1000 + Math.floor(Math.random() * 1000),
    text: POSITIVE_REMINDERS[i],
    top: 4 + Math.random() * 66,
    left: Math.random() * 66,
    delay: Math.random() * 1.1,
  }));
}

export function ReminderBubbles() {
  const activeMode = useMirror((s) => s.activeMode);
  const messageCount = useMirror((s) => s.sessions[s.activeMode].messages.length);
  const status = useMirror((s) => s.sessions[s.activeMode].status);
  const draft = useMirror((s) => s.sessions[s.activeMode].draft);

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);
  const firstRef = useRef(true);

  /* the chat is totally blank — no messages, the scope at rest,
     and the visitor has not begun to write */
  const blank = messageCount === 0 && status === "idle" && draft.trim() === "";

  useEffect(() => {
    if (!blank) return;
    let alive = true;
    let showT: ReturnType<typeof setTimeout> | undefined;
    let hideT: ReturnType<typeof setTimeout> | undefined;
    const cycle = () => {
      /* the first visit rises sooner; the hours between are random */
      const wait = firstRef.current
        ? 2600 + Math.random() * 2600
        : 7000 + Math.random() * 9000;
      firstRef.current = false;
      showT = setTimeout(() => {
        if (!alive) return;
        const next = rise().map((b) => ({ ...b, id: idRef.current++ }));
        setBubbles(next);
        hideT = setTimeout(() => {
          if (!alive) return;
          setBubbles([]);
          cycle();
        }, 9000 + Math.random() * 5000);
      }, wait);
    };
    cycle();
    return () => {
      alive = false;
      if (showT) clearTimeout(showT);
      if (hideT) clearTimeout(hideT);
    };
  }, [blank]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-[46vh] select-none"
    >
      <AnimatePresence>
        {(blank ? bubbles : []).map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.82, y: 16 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                delay: b.delay,
                type: "spring",
                stiffness: 240,
                damping: 19,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.88,
              y: -14,
              transition: { duration: 0.4, ease: "easeOut" },
            }}
            style={{ top: `${b.top}%`, left: `${b.left}%` }}
            className="absolute flex max-w-[250px] items-start gap-1.5 rounded-2xl border hairline bg-[var(--glass-bg)] px-3.5 py-2 text-[12.5px] leading-snug text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <span
              className="mt-px font-[family-name(var(--font-literata))] text-[10px] text-foreground/30"
              aria-hidden="true"
            >
              ✦
            </span>
            <span className="min-w-0">{b.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
