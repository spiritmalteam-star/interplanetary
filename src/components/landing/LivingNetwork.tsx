"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Waypoints, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE LIVING NETWORK — the constellation gate.                       */
/*                                                                     */
/*  At the threshold's top-left corner rests a small living sigil:     */
/*  three stars joined by breathing threads. It is the doorway of      */
/*  the vision this house is growing into — not a social network       */
/*  attached to a Mirror, but the existing Mirror experience           */
/*  expanding into a shared human environment.                         */
/*                                                                     */
/*  Touching the sigil raises a quiet veil: the foundational idea,     */
/*  the three laws that keep the house itself, a constellation of      */
/*  seven promises (each star unfolds its words in place), the road    */
/*  carved in stages, and the seal — the one sentence that governs     */
/*  everything that follows.                                           */
/*                                                                     */
/*  THE PORTAL: the veil rises through a portal to the document's      */
/*  body — the landing root carries its own stacking context, and      */
/*  the vision must stand above everything while it is being read.     */
/*                                                                     */
/*  CALM LAWS: transform-and-opacity motion only, nothing forced,      */
/*  every long word wraps, stillness honored when asked.               */
/* ------------------------------------------------------------------ */

type Star = {
  id: string;
  x: number; // percent of the map's width
  y: number; // percent of the map's height
  label: string;
  line: string;
};

const STARS: Star[] = [
  {
    id: "gathering",
    x: 50,
    y: 10,
    label: "The Gathering",
    line: "A shared exhibition where published reflections, dreams, music, books and discoveries hang like works in a living gallery.",
  },
  {
    id: "expression",
    x: 80,
    y: 28,
    label: "Creation becomes expression",
    line: "After every creation a gentle hand appears: share with the community. Nothing is ever published without its maker's explicit yes.",
  },
  {
    id: "my-reflection",
    x: 84,
    y: 62,
    label: "My Reflection",
    line: "A personal space that reads like a reflection, not a profile page — your works, your words, your interests, freely expressed.",
  },
  {
    id: "connections",
    x: 60,
    y: 88,
    label: "Connections",
    line: "Calm, private conversations between explorers — real-time, intimate, protected. No gamification, no artificial engagement.",
  },
  {
    id: "circles",
    x: 28,
    y: 86,
    label: "Circles",
    line: "Voluntary gathering places for kindred questions — dreams, philosophy, sound, science, imagination. Public or private, always optional.",
  },
  {
    id: "encounters",
    x: 13,
    y: 54,
    label: "Mirror Encounters",
    line: "With consent, M.E. may notice two explorers walking similar questions and gently suggest they explore together. Optional, transparent, never destiny.",
  },
  {
    id: "library",
    x: 15,
    y: 20,
    label: "The Collective Library",
    line: "The Library becomes a bridge between personal creation and public discovery — every shared work keeps its maker's name and its own permissions.",
  },
];

const LAWS = [
  {
    title: "The original soul stands untouched",
    line: "Everything the house already is — its design, its intelligence, its creative rooms — remains exactly as it is. The Network grows around it, never over it.",
  },
  {
    title: "A natural extension, not another app",
    line: "Sharing, meeting and conversing grow out of the experiences that already exist. Nothing competes with the Mirror; everything extends it.",
  },
  {
    title: "A living universe of reflections",
    line: "Entering feels like discovering another dimension of the same universe — no walls of strangers, no rankings, no noise. Only reflections meeting reflections.",
  },
];

const STAGES = [
  {
    n: "01",
    title: "Stage 1 · The integration foundation",
    line: "Accounts, profiles and permissions woven quietly into the existing house.",
  },
  {
    n: "02",
    title: "Stage 2 · Shared expression",
    line: "The Gathering opens — publishing, reactions, comments and following.",
  },
  {
    n: "03",
    title: "Stage 3 · Human connections",
    line: "Private messages, circles of conversation, real-time presence.",
  },
  {
    n: "04",
    title: "Stage 4 · Collective exploration",
    line: "Circles, the shared Library, discovery and collaboration.",
  },
  {
    n: "05",
    title: "Stage 5 · The Mirror as bridge",
    line: "Mirror Encounters and Shared Mirror Sessions, facilitated by M.E. with consent.",
  },
];

/* a handful of quiet background stars, fixed forever */
const DUST: Array<[number, number, number]> = [
  [8, 8, 1.4],
  [24, 34, 1],
  [70, 12, 1.2],
  [92, 44, 1],
  [42, 66, 1.1],
  [12, 78, 1.3],
  [78, 74, 1],
  [58, 40, 0.9],
];

const CENTER = { x: 49, y: 49 };

/* ------------------------------------------------------------------ */
/*  THE VEIL — the vision, portalled above every layer of the house.   */
/*  A real component (not a bare portal element) so AnimatePresence    */
/*  can hold it through its exit breath.                               */
/* ------------------------------------------------------------------ */
function Veil({
  onClose,
  onEnterGathering,
}: {
  onClose: () => void;
  onEnterGathering: () => void;
}) {
  const t = useT();
  const [active, setActive] = useState<string | null>(null);

  /* the escape hand — one breath of Escape folds the veil away */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const activeStar = STARS.find((s) => s.id === active) ?? null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t("The Living Network")}
      data-testid="living-network-veil"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="fixed inset-0 z-[80] overflow-y-auto overscroll-y-contain bg-[#05070d]"
    >
      {/* the two quiet glows that breathe behind everything */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(232,217,176,0.09),transparent)]" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(159,216,220,0.07),transparent)]" />
      </div>

      {/* the close hand */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Close the vision")}
        data-testid="living-network-close"
        className="focus-glow fixed z-10 flex size-8 items-center justify-center rounded-full border border-white/16 bg-[rgba(9,13,21,0.9)] text-[#c9d4dd] transition-colors duration-300 hover:border-[rgba(232,217,176,0.6)] hover:text-[#f0e7cd]"
        style={{
          top: "calc(max(0.75rem, env(safe-area-inset-top)) + 0.15rem)",
          right: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>

      <div className="relative mx-auto w-full max-w-[680px] px-4 pb-16 pt-14 sm:px-8 sm:pt-20">
        {/* ------------------- the founding words ------------------- */}
        <p className="mono-label text-center text-[9px] uppercase tracking-[0.34em] text-[#7f95a5]">
          {t("the doorway at the threshold's edge")}
        </p>
        <h2 className="mt-4 text-center font-[family-name:Cinzel] text-[26px] font-semibold leading-[1.2] tracking-wide text-[#f0f3f6] sm:text-[34px]">
          {t("The Living Network")}
        </h2>
        <p className="mt-3 text-center font-[family-name:Cinzel] text-[11px] tracking-[0.22em] text-[#e8d9b0] sm:text-[12px]">
          {t("One Mirror. Many Reflections. An Infinite Space to Explore.")}
        </p>

        <div className="mx-auto mt-7 h-px w-40 bg-gradient-to-r from-transparent via-[rgba(232,217,176,0.5)] to-transparent" />

        <p className="mx-auto mt-7 max-w-[560px] text-center font-[family-name:var(--font-literata)] text-[14.5px] italic leading-[1.85] text-[#c9d4dd] sm:text-[15.5px]">
          {t(
            "The Mirror remains the heart. The human remains the explorer. The community becomes a shared reflection — a space where individual reflections can meet, inspire, challenge and enrich one another."
          )}
        </p>

        {/* ------------------- the working hand ------------------- */}
        {/* The Gathering is no longer only a promise: the hall itself
            stands. One touch folds the vision and walks the visitor
            into the shared exhibition it speaks of. */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onEnterGathering}
            aria-label={t("Enter the Gathering — the hall itself")}
            data-testid="living-network-enter-gathering"
            className="focus-glow flex h-10 items-center gap-2 rounded-full border border-[#d9c99a]/55 bg-[#d9c99a]/10 px-5 text-[13px] font-medium text-[#d9c99a] transition-all duration-300 hover:border-[#d9c99a]/85 hover:bg-[#d9c99a]/16"
          >
            <Waypoints className="size-4" aria-hidden="true" />
            {t("The hall is open — enter the Gathering")}
          </button>
        </div>

        {/* ------------------- the three laws ------------------- */}
        <div className="mt-12">
          <p className="mono-label text-center text-[9px] uppercase tracking-[0.3em] text-[#7f95a5]">
            {t("Three laws keep the house itself")}
          </p>
          <div className="mt-6 space-y-5">
            {LAWS.map((law) => (
              <div
                key={law.title}
                className="rounded-xl border border-white/8 bg-[rgba(10,14,22,0.6)] p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#9fd8dc] shadow-[0_0_8px_rgba(159,216,220,0.8)]"
                  />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#e6edf2] [overflow-wrap:anywhere]">
                      {t(law.title)}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.75] text-[#8fa3b2] [overflow-wrap:anywhere]">
                      {t(law.line)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------- the constellation ------------------- */}
        <div className="mt-14">
          <p className="mono-label text-center text-[9px] uppercase tracking-[0.3em] text-[#7f95a5]">
            {t("Seven stars, each one a promise")}
          </p>
          <p className="mt-2 text-center text-[11px] text-[#66788a]">
            {t("Touch a star to hear its promise")}
          </p>

          <div className="relative mx-auto mt-6 aspect-[16/15] w-full max-w-[520px]">
            {/* the threads — SVG stretched to fill, strokes true */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {DUST.map(([dx, dy, dr], i) => (
                <circle
                  key={i}
                  cx={dx}
                  cy={dy}
                  r={dr * 0.35}
                  fill="rgba(201,212,221,0.35)"
                />
              ))}
              {STARS.map((s, i) => (
                <line
                  key={s.id}
                  x1={CENTER.x}
                  y1={CENTER.y}
                  x2={s.x}
                  y2={s.y}
                  stroke={
                    active === s.id
                      ? "rgba(232,217,176,0.75)"
                      : "rgba(159,216,220,0.28)"
                  }
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  className="ln-thread"
                  style={{ animationDelay: `${i * 0.45}s` }}
                />
              ))}
            </svg>

            {/* the mirror at the center */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}
            >
              <div className="relative flex flex-col items-center">
                <div className="relative flex size-11 items-center justify-center rounded-full border border-[rgba(232,217,176,0.45)] bg-[rgba(14,18,26,0.92)] shadow-[0_0_24px_rgba(232,217,176,0.18)]">
                  <span
                    aria-hidden="true"
                    className="ln-core-ring absolute inset-0 rounded-full border border-[rgba(232,217,176,0.4)]"
                  />
                  <span className="font-[family-name:Cinzel] text-[9px] tracking-[0.14em] text-[#f0e7cd]">
                    M.E.
                  </span>
                </div>
                <span className="mono-label mt-1.5 whitespace-nowrap text-[7.5px] uppercase tracking-[0.2em] text-[#e8d9b0]/80">
                  {t("The Mirror")}
                </span>
              </div>
            </div>

            {/* the seven promises — living stars */}
            {STARS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(active === s.id ? null : s.id)}
                aria-pressed={active === s.id}
                aria-label={t(s.label)}
                data-testid={`ln-star-${s.id}`}
                className={cn(
                  "focus-glow absolute flex w-[100px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 p-1.5 transition-transform duration-300 hover:scale-110",
                  active === s.id && "scale-110"
                )}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block size-3 rounded-full border transition-all duration-300",
                    active === s.id
                      ? "border-[rgba(232,217,176,0.9)] bg-[#e8d9b0] shadow-[0_0_14px_rgba(232,217,176,0.85)]"
                      : "border-[rgba(159,216,220,0.7)] bg-[rgba(159,216,220,0.35)] shadow-[0_0_8px_rgba(159,216,220,0.4)]"
                  )}
                />
                <span
                  className={cn(
                    "mono-label text-center text-[7.5px] uppercase leading-[1.4] tracking-[0.12em] transition-colors duration-300 [overflow-wrap:anywhere]",
                    active === s.id ? "text-[#f0e7cd]" : "text-[#8fa3b2]"
                  )}
                >
                  {t(s.label)}
                </span>
              </button>
            ))}
          </div>

          {/* the star's words, unfolded in place */}
          <AnimatePresence initial={false}>
            {activeStar && (
              <motion.div
                key={activeStar.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mx-auto mt-4 max-w-[520px] rounded-xl border border-[rgba(232,217,176,0.22)] bg-[rgba(13,17,26,0.72)] p-4 sm:p-5">
                  <p className="mono-label text-[9px] uppercase tracking-[0.24em] text-[#e8d9b0]">
                    {t(activeStar.label)}
                  </p>
                  <p className="mt-2.5 text-[13px] leading-[1.8] text-[#b9c6cf] [overflow-wrap:anywhere]">
                    {t(activeStar.line)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ------------------- the road ahead ------------------- */}
        <div className="mt-14">
          <p className="mono-label text-center text-[9px] uppercase tracking-[0.3em] text-[#7f95a5]">
            {t("The road ahead — carved in stages")}
          </p>
          <ol className="mx-auto mt-6 max-w-[520px] space-y-0 border-l border-white/10 pl-5 sm:pl-7">
            {STAGES.map((st) => (
              <li key={st.n} className="relative pb-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[26.5px] top-1 flex size-[13px] items-center justify-center rounded-full border border-[rgba(232,217,176,0.4)] bg-[#0a0e16] sm:-left-[34.5px]"
                >
                  <span className="size-1 rounded-full bg-[#e8d9b0]" />
                </span>
                <p className="mono-label text-[9px] tracking-[0.18em] text-[#e8d9b0]/85">
                  {st.n}
                </p>
                <p className="mt-1 text-[13.5px] font-semibold text-[#e6edf2] [overflow-wrap:anywhere]">
                  {t(st.title)}
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.7] text-[#8fa3b2] [overflow-wrap:anywhere]">
                  {t(st.line)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-center text-[11.5px] italic leading-relaxed text-[#66788a]">
            {t(
              "The first stone is laid — the road will be carved with the house's own hands, one confirmed stage at a time."
            )}
          </p>
        </div>

        {/* ------------------- the seal ------------------- */}
        <div className="mt-14 rounded-2xl border border-[rgba(232,217,176,0.28)] bg-[rgba(12,16,24,0.66)] px-5 py-7 text-center sm:px-8">
          <p className="mono-label text-[8.5px] uppercase tracking-[0.3em] text-[#7f95a5]">
            {t("The seal")}
          </p>
          <p className="mx-auto mt-4 max-w-[520px] font-[family-name:var(--font-literata)] text-[13.5px] italic leading-[1.9] text-[#f0e7cd] [overflow-wrap:anywhere] sm:text-[14.5px]">
            {t(
              "We are not building a social network and attaching a Mirror to it. We are allowing the existing Mirror experience to expand into a shared human environment."
            )}
          </p>
          <div className="mx-auto mt-5 h-px w-32 bg-gradient-to-r from-transparent via-[rgba(232,217,176,0.5)] to-transparent" />
          <p className="mt-5 font-[family-name:Cinzel] text-[10.5px] tracking-[0.2em] text-[#d9c99a] sm:text-[11.5px]">
            {t("One Mirror. Many Reflections. An Infinite Space to Explore.")}
          </p>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  THE GATE — the sigil resting at the threshold's top-left corner,   */
/*  and the veil it raises.                                            */
/* ------------------------------------------------------------------ */
export default function LivingNetwork() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ============== THE SIGIL — the doorway at the edge ============== */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("The Living Network")}
        aria-expanded={open}
        title={t("The Living Network")}
        data-testid="living-network-gate"
        className="focus-glow fixed z-[46] flex h-9 items-center gap-2.5 rounded-full border border-white/14 bg-[rgba(7,10,17,0.82)] pl-2.5 pr-3 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300 hover:border-[rgba(232,217,176,0.55)] hover:shadow-[0_10px_34px_-14px_rgba(232,217,176,0.35)]"
        style={{
          top: "calc(max(0.75rem, env(safe-area-inset-top)) + 0.15rem)",
          left: "max(0.75rem, env(safe-area-inset-left))",
        }}
      >
        <svg
          viewBox="0 0 28 28"
          aria-hidden="true"
          className="size-[22px] shrink-0"
        >
          <line
            x1="6.5"
            y1="20.5"
            x2="14"
            y2="9"
            stroke="rgba(232,217,176,0.55)"
            strokeWidth="0.8"
            className="ln-thread"
          />
          <line
            x1="14"
            y1="9"
            x2="21.5"
            y2="17"
            stroke="rgba(159,216,220,0.5)"
            strokeWidth="0.8"
            className="ln-thread"
            style={{ animationDelay: "1.1s" }}
          />
          <circle cx="6.5" cy="20.5" r="1.9" fill="rgba(159,216,220,0.85)" />
          <circle cx="21.5" cy="17" r="1.6" fill="rgba(159,216,220,0.55)" />
          <circle cx="14" cy="9" r="2.5" fill="#e8d9b0" className="ln-star-core" />
        </svg>
        <span className="mono-label hidden text-[9.5px] uppercase tracking-[0.26em] text-[#d9c99a] sm:inline">
          {t("The Living Network")}
        </span>
      </button>

      {/* ================== THE VEIL — the vision ================== */}
      <AnimatePresence>
        {open && (
          <Veil
            onClose={() => setOpen(false)}
            onEnterGathering={() => {
              setOpen(false);
              useMirror.getState().openToolTab("gathering");
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
