"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { GUIDES } from "@/lib/guides";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GUIDES' SHOWCASE — a massive exhibition beneath the offerings: */
/*  seven plates, one for every illustrated guide of the house. The    */
/*  hand sweeps the stage (no arrows anywhere); a quiet row of         */
/*  numbers below steers the walk; every plate speaks its own title,   */
/*  and one touch steps through into the guide's own page.             */
/*                                                                     */
/*  CALM LAWS: opacity-and-transform motion only, neighbours-only      */
/*  mounting, autoplay rests when unseen / hidden / held / reduced.    */
/* ------------------------------------------------------------------ */

/* how long each plate rests on the eye before the walk continues */
const DWELL = 7600;
/* after a held touch, the walk resumes after this much quiet */
const RESUME = 9000;

export default function GuideShowcase({
  onOpen,
}: {
  onOpen: (slug: string) => void;
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (i: number) =>
      setActive(((i % GUIDES.length) + GUIDES.length) % GUIDES.length),
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

  /* the walk rests while the eye is elsewhere */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") {
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

  /* THE QUIET WALK */
  useEffect(() => {
    if (reduced || !inView || held) return;
    const id = window.setTimeout(
      () => setActive((a) => (a + 1) % GUIDES.length),
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
    (active + GUIDES.length - 1) % GUIDES.length,
    active,
    (active + 1) % GUIDES.length,
  ]);
  const current = GUIDES[active];

  return (
    <div className="mt-8">
      {/* the stage — massive, edge to edge on the phone, a grand hall
          plate on the desk; the whole image is the door */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("The house's guides")}
        className="relative mx-auto w-full max-w-[900px]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        <div
          data-testid="guide-showcase-stage"
          className="guide-stage relative aspect-[4/5] w-full overflow-hidden bg-[#101b30] ring-1 ring-white/10 sm:aspect-[16/10] sm:rounded-[26px] lg:aspect-[2/1]"
        >
          {GUIDES.map((g, i) =>
            near.has(i) ? (
              <button
                key={g.slug}
                type="button"
                role="group"
                aria-roledescription="slide"
                aria-label={t("Open the guide") + ` — ${g.title}`}
                aria-hidden={i !== active}
                data-testid={`guide-slide-${i + 1}`}
                onClick={() => onOpen(g.slug)}
                className={cn(
                  "group absolute inset-0 cursor-pointer transition-[opacity,transform] duration-[900ms] ease-out motion-reduce:transition-none",
                  i === active
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-[1.045] opacity-0"
                )}
              >
                <Image
                  src={g.image}
                  alt={i === active ? g.title : ""}
                  fill
                  sizes="(min-width: 1024px) 900px, 100vw"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="object-cover"
                />
                {/* the crystal breath — this guide's own two colors,
                    static shadows only (the phone pays nothing) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow: `inset 0 0 90px -30px ${g.crystalA}, inset 0 -60px 90px -50px ${g.crystalB}`,
                  }}
                />
                {/* the reading floor — the words sit on a deepening
                    gradient, real HTML text, never baked into the art */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[rgba(4,7,12,0.92)] via-[rgba(4,7,12,0.45)] to-transparent"
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-5 text-center sm:p-7">
                  <span className="mono-label text-[8.5px] uppercase tracking-[0.3em] text-[#9fb3c2]">
                    {g.subtitle}
                  </span>
                  <span className="font-[family-name:Cinzel] text-[20px] font-semibold leading-tight tracking-wide text-[#f0f3f6] drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)] sm:text-[26px]">
                    {g.title}
                  </span>
                  <span className="hidden max-w-[560px] font-[family-name:var(--font-literata)] text-[13px] italic leading-relaxed text-[#c9d5df] sm:block">
                    {g.tagline}
                  </span>
                  <span
                    className="mono-label mt-1 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[8.5px] uppercase tracking-[0.22em] transition-colors duration-300 group-hover:bg-[rgba(232,217,176,0.14)]"
                    style={{
                      borderColor: g.crystalA,
                      color: "#f0e7cd",
                    }}
                  >
                    {t("Open the guide")}
                    <ArrowUpRight
                      className="size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </button>
            ) : null
          )}
        </div>
      </div>

      {/* the standing plate's words beneath the stage — the title of
          the slide, always written where the eye rests */}
      <p
        data-testid="guide-showcase-title"
        className="mx-auto mt-4 max-w-[900px] px-4 text-center font-[family-name:var(--font-literata)] text-[15px] italic leading-relaxed text-[#e8d9b0]"
      >
        {current.tagline}
      </p>

      {/* the reading rail — no arrows: the hand sweeps the stage, and
          the numbers below carry the walk */}
      <div
        role="tablist"
        aria-label={t("Choose a slide by its number")}
        className="mx-auto mt-3.5 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-1.5 px-4"
      >
        {GUIDES.map((g, i) => (
          <button
            key={g.slug}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => go(i)}
            aria-label={`${i + 1} — ${g.title}`}
            title={g.title}
            data-testid={`guide-num-${i + 1}`}
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
        {t("Ten illustrated guides — one image each")}
      </p>
    </div>
  );
}
