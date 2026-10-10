"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Mode } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  ScopeFrame — when a Second-Octave scope is selected, the whole     */
/*  frame of the Laboratory begins to breathe with that scope's own    */
/*  physics. Science dons a calibrated instrument skin, Quantum wears  */
/*  a living charge, Healing grows a soft membrane. All three stay     */
/*  whisper-quiet: behind the content, pointer-dead, reduced-motion    */
/*  safe — the cosmic vibe of the Laboratory is never broken, it       */
/*  simply changes its temperature.                                    */
/* ------------------------------------------------------------------ */

/* ---------- SCIENCE — the calibrated frame (techy) ---------- */

const HUD_READOUTS = [
  { label: "MEL·SCI-04 // LEDGER", pos: "left", corner: "tl" },
  { label: "CAL 1.6180339", pos: "right", corner: "tr" },
  { label: "FUSION RAIL · READY", pos: "left", corner: "bl" },
  { label: "FIELD // ACTIVE", pos: "right", corner: "br" },
] as const;

function ScienceFrame() {
  return (
    <>
      {/* blueprint grid — a masked lattice of fine instrument lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--frame-a) 9%, transparent) 1px, transparent 1px)," +
            "linear-gradient(to bottom, color-mix(in srgb, var(--frame-a) 9%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 42%, black 18%, transparent 76%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 42%, black 18%, transparent 76%)",
        }}
      />

      {/* ruler ticks along the bottom edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-2.5 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--frame-a) 45%, transparent) 0 1px, transparent 1px 56px)",
          maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
        }}
      />

      {/* HUD corner brackets with quiet readouts */}
      {HUD_READOUTS.map((r) => (
        <div
          key={r.corner}
          className={`absolute hidden sm:block ${
            r.pos === "left" ? "left-4" : "right-4"
          } ${r.corner.startsWith("t") ? "top-4" : "bottom-4"}`}
        >
          <div className="flex items-center gap-2">
            {r.pos === "right" && (
              <span
                className="frame-node size-1 rounded-full"
                style={{ background: "var(--frame-a)" }}
              />
            )}
            <span
              className="mono-label text-[9px] uppercase tracking-[0.26em]"
              style={{ color: "color-mix(in srgb, var(--frame-a) 62%, transparent)" }}
            >
              {r.label}
            </span>
            {r.pos === "left" && (
              <span
                className="frame-node size-1 rounded-full"
                style={{ background: "var(--frame-a)" }}
              />
            )}
          </div>
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 ${
              r.corner === "tl"
                ? "-left-2 -top-2 border-l border-t"
                : r.corner === "tr"
                  ? "-right-2 -top-2 border-r border-t"
                  : r.corner === "bl"
                    ? "-bottom-2 -left-2 border-b border-l"
                    : "-bottom-2 -right-2 border-b border-r"
            }`}
            style={{ borderColor: "color-mix(in srgb, var(--frame-a) 55%, transparent)" }}
          />
        </div>
      ))}
    </>
  );
}

/* ---------- QUANTUM — the charged frame (electric) ---------- */

const SPARKS = [
  { top: "18%", left: "12%", delay: "0s", tone: "var(--frame-a)" },
  { top: "64%", left: "6%", delay: "1.3s", tone: "var(--frame-b)" },
  { top: "26%", left: "88%", delay: "2.1s", tone: "var(--frame-b)" },
  { top: "78%", left: "92%", delay: "0.7s", tone: "var(--frame-a)" },
  { top: "45%", left: "50%", delay: "2.8s", tone: "var(--frame-a)" },
] as const;

function QuantumFrame() {
  return (
    <>
      {/* charged vignette — a faint held charge above the horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 55% at 50% -12%, color-mix(in srgb, var(--frame-a) 14%, transparent), transparent 62%)",
        }}
      />

      {/* current lines — charge flowing along the top and bottom edges */}
      <div
        className="frame-current absolute inset-x-0 top-0 h-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--frame-a) 70%, transparent) 0 34px, transparent 34px 88px)",
          boxShadow:
            "0 0 12px color-mix(in srgb, var(--frame-a) 38%, transparent)",
        }}
      />
      <div
        className="frame-current-rev absolute inset-x-0 bottom-0 h-px"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--frame-b) 65%, transparent) 0 26px, transparent 26px 74px)",
          boxShadow:
            "0 0 12px color-mix(in srgb, var(--frame-b) 34%, transparent)",
        }}
      />

      {/* discharge needles — two faint vertical potentials at the edges */}
      <div
        className="frame-discharge absolute left-[8%] top-[10%] h-[22vh] w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--frame-a) 55%, transparent), transparent)",
        }}
      />
      <div
        className="frame-discharge absolute right-[10%] bottom-[12%] h-[18vh] w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--frame-b) 55%, transparent), transparent)",
          animationDelay: "1.6s",
        }}
      />

      {/* spark nodes — small held charges flickering in the field */}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="frame-spark absolute size-[5px] rounded-full"
          style={{
            top: s.top,
            left: s.left,
            background: s.tone,
            animationDelay: s.delay,
          }}
        />
      ))}
    </>
  );
}

/* ---------- HEALING — the living frame (biologic) ---------- */

const SPORES = [
  { left: "14%", size: 7, delay: "0s", duration: "17s", tone: "var(--frame-a)" },
  { left: "38%", size: 5, delay: "6s", duration: "21s", tone: "var(--frame-b)" },
  { left: "66%", size: 8, delay: "3s", duration: "19s", tone: "var(--frame-b)" },
  { left: "87%", size: 5, delay: "9s", duration: "23s", tone: "var(--frame-a)" },
] as const;

function HealingFrame() {
  return (
    <>
      {/* organic washes — two soft cell-warmths drifting at the edges */}
      <div
        className="animate-drift-b absolute -left-[16%] top-[16%] h-[58vh] w-[52vw] min-w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--frame-a) 16%, transparent), transparent 72%)",
          filter: "blur(6px)",
        }}
      />
      <div
        className="animate-drift-c absolute -right-[14%] bottom-[6%] h-[54vh] w-[48vw] min-w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--frame-b) 15%, transparent), transparent 70%)",
          filter: "blur(6px)",
        }}
      />

      {/* the membrane — the frame itself breathes, slowly, like a chest at rest */}
      <div
        className="frame-membrane absolute inset-2 rounded-[34px] sm:inset-4"
        style={{
          border:
            "1px solid color-mix(in srgb, var(--frame-a) 22%, transparent)",
          boxShadow:
            "inset 0 0 60px -30px color-mix(in srgb, var(--frame-a) 45%, transparent)," +
            " inset 0 0 90px -50px color-mix(in srgb, var(--frame-b) 40%, transparent)",
        }}
      />

      {/* spores — tiny lights drifting upward through still air */}
      {SPORES.map((s, i) => (
        <span
          key={i}
          className="frame-spore absolute bottom-[-12px] rounded-full"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            background: `color-mix(in srgb, ${s.tone} 65%, white)`,
            boxShadow: `0 0 10px color-mix(in srgb, ${s.tone} 55%, transparent)`,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </>
  );
}

/* ---------- the switch ---------- */

export function ScopeFrame({ mode }: { mode: Mode }) {
  return (
    <AnimatePresence>
      {mode !== "interplanetary" && (
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden"
        >
          {mode === "science" && <ScienceFrame />}
          {mode === "quantum" && <QuantumFrame />}
          {mode === "healing" && <HealingFrame />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
