"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE SLIDES — the threshold's own exhibition, shown below the       */
/*  chat: ten plates of the house's reflection deck (awareness ·       */
/*  connection · change), each a full artwork carrying its words.      */
/*                                                                     */
/*  CALM LAWS: opacity-and-transform motion only, neighbours-only      */
/*  mounting, autoplay rests when the page hides, the eye looks away,  */
/*  or the visitor holds the stage; stillness for reduced motion.      */
/* ------------------------------------------------------------------ */

type Slide = { src: string; title: string };

const SLIDES: Slide[] = [
  { src: "/landing/slides/slide-01.jpg", title: "Awakening begins with attention" },
  { src: "/landing/slides/slide-02.jpg", title: "Empathy makes connection visible" },
  { src: "/landing/slides/slide-03.jpg", title: "Belonging includes the living Earth" },
  { src: "/landing/slides/slide-04.jpg", title: "Presence steadies the inner world" },
  { src: "/landing/slides/slide-05.jpg", title: "Cooperation turns care into action" },
  { src: "/landing/slides/slide-06.jpg", title: "Discernment keeps wonder grounded" },
  { src: "/landing/slides/slide-07.jpg", title: "“5D” as an expanded perspective" },
  { src: "/landing/slides/slide-08.jpg", title: "Kindness is a daily practice" },
  { src: "/landing/slides/slide-09.jpg", title: "A better future is designed together" },
  { src: "/landing/slides/slide-10.jpg", title: "Transformation is a path we walk" },
];

/* how long each plate rests on the eye before the walk continues */
const DWELL = 6800;
/* after a held touch, the walk resumes after this much quiet */
const RESUME = 9000;

export default function LandingSlides() {
  const t = useT();
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (i: number) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length),
    []
  );
  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  /* stillness for those who choose it */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* the walk rests while the eye is elsewhere — the exhibition only
     turns when its stage is actually on the screen */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") {
      /* no observer to be had — assume seen, via a quiet tick */
      const id = window.setTimeout(() => setInView(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries[entries.length - 1]?.isIntersecting ?? true),
      { threshold: 0.25 }
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  /* the walk rests while the page itself is hidden */
  useEffect(() => {
    const onVis = () =>
      setHeld(document.visibilityState === "hidden" ? true : false);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* THE QUIET WALK — one step every dwell, only while the stage is
     seen, unheld, and the visitor allows motion */
  useEffect(() => {
    if (reduced || !inView || held) return;
    const id = window.setTimeout(
      () => setActive((a) => (a + 1) % SLIDES.length),
      DWELL
    );
    return () => window.clearTimeout(id);
  }, [active, reduced, inView, held]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  /* holding the stage pauses the walk; a firm horizontal stroke
     carries it — everything else stays still */
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    setHeld(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHeld(false), RESUME);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) next();
      else prev();
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => setHeld(false), RESUME);
    }
  };
  const onPointerCancel = () => {
    swipe.current = null;
  };

  /* only the neighbours stand mounted — the deep plates sleep */
  const near = new Set<number>([
    (active + SLIDES.length - 1) % SLIDES.length,
    active,
    (active + 1) % SLIDES.length,
  ]);

  return (
    <div className="mt-7 sm:mt-9">
      {/* the stage — edge to edge on the phone, a grand plate on the desk */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("The shifting Earth in ten slides")}
        className="relative mx-auto w-full max-w-[660px] sm:px-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        <div
          data-testid="landing-slides-stage"
          className="relative aspect-square w-full overflow-hidden bg-[#101b30] sm:rounded-[26px]"
        >
          {SLIDES.map((s, i) =>
            near.has(i) ? (
              <div
                key={s.src}
                role="group"
                aria-roledescription="slide"
                aria-label={t(`${i + 1} of 10 — ${s.title}`)}
                aria-hidden={i !== active}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-out motion-reduce:transition-none",
                  i === active
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-[1.04] opacity-0"
                )}
              >
                <Image
                  src={s.src}
                  alt={i === active ? t(s.title) : ""}
                  fill
                  sizes="(min-width: 768px) 660px, 100vw"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="object-cover"
                />
              </div>
            ) : null
          )}

        </div>
      </div>

      {/* the plate's own words — the standing slide speaks its title */}
      <p
        data-testid="landing-slides-title"
        className="mx-auto mt-4 max-w-[660px] px-4 text-center font-[family-name:var(--font-literata)] text-[14.5px] italic leading-relaxed text-[#e8d9b0]"
      >
        {t(SLIDES[active].title)}
      </p>

      {/* the reading rail — no arrows anywhere: the stage is swept by
          the hand, and a quiet row of numbers steers it from below */}
      <div
        role="tablist"
        aria-label={t("Choose a slide by its number")}
        className="mx-auto mt-3.5 flex w-full max-w-[660px] flex-wrap items-center justify-center gap-1.5 px-4"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => go(i)}
            aria-label={t(`Go to slide ${i + 1} — ${s.title}`)}
            data-testid="landing-slides-num"
            className={cn(
              "focus-glow mono-label flex size-7 items-center justify-center rounded-full border text-[9px] tracking-normal transition-all duration-300",
              i === active
                ? "border-[rgba(232,217,176,0.85)] bg-[rgba(232,217,176,0.14)] text-[#f0e7cd]"
                : "border-white/12 text-[#8fa3b2] hover:border-white/30 hover:text-[#c6d2db]"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="mono-label mt-3 text-center text-[8.5px] uppercase tracking-[0.26em] text-[#66788a]">
        {t("Awareness · Connection · Change")}
      </p>
    </div>
  );
}
