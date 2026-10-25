"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
/* the light shelf — plates only (title, cover, crystals); the full
   books stay behind the guide view's own door */
import { GUIDE_METAS } from "@/lib/guides/meta";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GUIDES' SHOWCASE — a massive exhibition beneath the offerings: */
/*  seven plates, one for every illustrated guide of the house. The    */
/*  hand sweeps the stage, quiet flanking arrows and the keyboard's    */
/*  own left and right steer the walk, and a row of numbers below      */
/*  offers the direct door; every plate speaks its own title, and one  */
/*  touch steps through into the guide's own page.                     */
/*                                                                     */
/*  CALM LAWS: opacity-and-transform motion only, neighbours-only      */
/*  mounting, the walk answers the visitor's hand alone — the plates   */
/*  never turn by themselves (no clock drives the exhibition).         */
/* ------------------------------------------------------------------ */

export default function GuideShowcase({
  onOpen,
}: {
  onOpen: (slug: string) => void;
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (i: number) =>
      setActive(((i % GUIDE_METAS.length) + GUIDE_METAS.length) % GUIDE_METAS.length),
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
      go(GUIDE_METAS.length - 1);
    }
  };

  /* only the neighbours stand mounted — the deep plates sleep */
  const near = new Set<number>([
    (active + GUIDE_METAS.length - 1) % GUIDE_METAS.length,
    active,
    (active + 1) % GUIDE_METAS.length,
  ]);
  const current = GUIDE_METAS[active];

  return (
    <div className="mt-8">
      {/* the stage — massive, edge to edge on the phone, a grand hall
          plate on the desk; the whole image is the door */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("The house's guides")}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative mx-auto w-full max-w-[900px] rounded-[26px] outline-none focus-visible:ring-1 focus-visible:ring-[var(--hairline-active)]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
      >
        <div
          data-testid="guide-showcase-stage"
          className="guide-stage relative aspect-[4/5] w-full overflow-hidden bg-[var(--lp-deep)] ring-1 ring-[var(--lp-edge)] sm:aspect-[4/3] sm:rounded-[26px] lg:aspect-[3/2]"
        >
          {GUIDE_METAS.map((g, i) =>
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
                  {/* THE BRIGHT WORDS ON THE PLATE — the words resting on
                      the artwork always wear their own light ink (the
                      deep reading floor beneath is their constant), so
                      they stay bright and readable in both skies. */}
                  <span className="mono-label text-[9.5px] uppercase tracking-[0.3em] text-[rgba(240,231,205,0.78)]">
                    {g.subtitle}
                  </span>
                  <span className="font-[family-name:Cinzel] text-[21px] font-semibold leading-tight tracking-wide text-[#f7f2e2] drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] sm:text-[27px]">
                    {g.title}
                  </span>
                  <span className="hidden max-w-[560px] font-[family-name:var(--font-literata)] text-[14px] italic leading-relaxed text-[rgba(240,231,205,0.82)] drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)] sm:block">
                    {g.tagline}
                  </span>
                  <span
                    className="mono-label mt-1 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[9.5px] uppercase tracking-[0.22em] transition-colors duration-300 group-hover:bg-[rgba(232,217,176,0.22)]"
                    style={{
                      borderColor: g.crystalA,
                      color: "#eed9a4",
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
        aria-live="polite"
        className="mx-auto mt-4 max-w-[900px] px-4 text-center font-[family-name:var(--font-literata)] text-[16px] italic leading-relaxed text-[var(--lp-gold)]"
      >
        {current.tagline}
      </p>

      {/* the reading rail — the numbers below carry the walk, flanked
          by two calm arrows for the hand that prefers a named door */}
      <div
        role="tablist"
        aria-label={t("Choose a slide by its number")}
        className="mx-auto mt-3.5 flex w-full max-w-[900px] flex-wrap items-center justify-center gap-1.5 px-4"
      >
        <button
          type="button"
          onClick={prev}
          aria-label={t("Previous guide plate")}
          data-testid="guide-showcase-prev"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-[var(--lp-body)] active:scale-95 motion-reduce:transition-none"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        {GUIDE_METAS.map((g, i) => (
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
              "focus-glow mono-label flex size-7 items-center justify-center rounded-full border text-[10px] tracking-normal transition-all duration-300 motion-reduce:transition-none",
              i === active
                ? "border-[rgba(232,217,176,0.85)] bg-[rgba(232,217,176,0.14)] text-[var(--lp-gold-ink)]"
                : "border-[var(--lp-edge)] text-[var(--lp-mute)] hover:border-[var(--hairline-hover)] hover:text-[#c6d2db]"
            )}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={next}
          aria-label={t("Next guide plate")}
          data-testid="guide-showcase-next"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-[var(--lp-body)] active:scale-95 motion-reduce:transition-none"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="mono-label mt-3 text-center text-[9.5px] uppercase tracking-[0.26em] text-[var(--lp-faint)]">
        {t("Ten illustrated guides — one image each")}
      </p>
    </div>
  );
}
