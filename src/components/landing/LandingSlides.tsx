"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE SLIDES — the threshold's own exhibition, shown below the       */
/*  chat: ten plates of the house's reflection deck (awareness ·       */
/*  connection · change), each a full artwork carrying its words.      */
/*                                                                     */
/*  CALM LAWS: opacity-and-transform motion only, neighbours-only      */
/*  mounting, the walk answers the visitor's hand alone — the plates   */
/*  never turn by themselves (no clock drives the exhibition).         */
/*  Three ways to steer: the sweeping hand, quiet flanking arrows,     */
/*  and the keyboard's own left and right — every way arrives at       */
/*  the same gentle crossfade.                                         */
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

export default function LandingSlides() {
  const t = useT();
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (i: number) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length),
    []
  );
  const next = useCallback(() => go(active + 1), [active, go]);
  const prev = useCallback(() => go(active - 1), [active, go]);

  /* a firm horizontal stroke carries the walk — everything else stays
     still; no clock ever turns the plates */
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
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
    }
  };
  const onPointerCancel = () => {
    swipe.current = null;
  };

  /* the keyboard's own quiet steer — left and right walk the plates
     when the stage holds the focus; Home and End jump to the ends */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(SLIDES.length - 1);
    }
  };

  /* only the neighbours stand mounted — the deep plates sleep */
  const near = new Set<number>([
    (active + SLIDES.length - 1) % SLIDES.length,
    active,
    (active + 1) % SLIDES.length,
  ]);

  return (
    <div className="mt-7 sm:mt-9">
      {/* the stage — edge to edge on the phone, a grand plate on the desk.
          THE WHOLE PLATE — every artwork is a square 1152×1152 plate, so
          the stage is a square too: nothing is cropped away, each image
          fits perfectly and stands fully visible, edge to edge. */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("The shifting Earth in ten slides")}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative mx-auto w-full max-w-[660px] rounded-[26px] outline-none focus-visible:ring-1 focus-visible:ring-[var(--hairline-active)] sm:px-0 lg:max-w-[720px]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        <div
          data-testid="landing-slides-stage"
          className="relative aspect-square w-full overflow-hidden bg-[var(--lp-deep)] sm:rounded-[26px]"
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
                  sizes="(min-width: 1024px) 720px, (min-width: 768px) 660px, 100vw"
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
        aria-live="polite"
        className="mx-auto mt-4 max-w-[660px] px-4 text-center font-[family-name:var(--font-literata)] text-[15.5px] italic leading-relaxed text-[var(--lp-gold)] lg:max-w-[720px]"
      >
        {t(SLIDES[active].title)}
      </p>

      {/* the reading rail — a quiet row of numbers flanked by two calm
          arrows: the stage is swept by the hand, the keyboard, or a
          neighbouring arrow; no clock ever turns the plates */}
      <div
        role="tablist"
        aria-label={t("Choose a slide by its number")}
        className="mx-auto mt-3.5 flex w-full max-w-[660px] flex-wrap items-center justify-center gap-1.5 px-4 lg:max-w-[720px]"
      >
        <button
          type="button"
          onClick={prev}
          aria-label={t("Previous slide")}
          data-testid="landing-slides-prev"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-[var(--lp-body)] active:scale-95 motion-reduce:transition-none"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
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
              "focus-glow mono-label flex size-7 items-center justify-center rounded-full border text-[10px] tracking-normal transition-all duration-300 motion-reduce:transition-none",
              i === active
                ? "border-[rgba(232,217,176,0.85)] bg-[rgba(232,217,176,0.14)] text-[var(--lp-gold-ink)]"
                : "border-[var(--lp-edge)] text-[var(--lp-mute)] hover:border-[var(--hairline-hover)] hover:text-[var(--lp-body)]"
            )}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={next}
          aria-label={t("Next slide")}
          data-testid="landing-slides-next"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-[var(--lp-body)] active:scale-95 motion-reduce:transition-none"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="mono-label mt-3 text-center text-[9.5px] uppercase tracking-[0.26em] text-[var(--lp-faint)]">
        {t("Awareness · Connection · Change")}
      </p>
    </div>
  );
}
