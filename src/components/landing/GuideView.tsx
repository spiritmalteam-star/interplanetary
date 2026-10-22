"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Diamond } from "lucide-react";
import { useT } from "@/lib/i18n";
import { guideBySlug, type GuideBlock } from "@/lib/guides";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GUIDE'S OWN PAGE — one of the house's seven illustrated        */
/*  guides, opened full-screen above the threshold. It is not a        */
/*  route: the threshold stays mounted beneath, so the visitor's       */
/*  walk (the slideshow's own plate, the page's exact place) is        */
/*  untouched — the back hand simply folds the page away and the       */
/*  slideshow stands exactly where it was left.                        */
/*                                                                     */
/*  THE HASH AS THE DOOR: opening sets #guide/<slug>, so the           */
/*  browser's own back button returns to the slideshow as naturally    */
/*  as the page's own back hands do.                                   */
/* ------------------------------------------------------------------ */

function Block({ block, a, b }: { block: GuideBlock; a: string; b: string }) {
  const t = useT();
  switch (block.type) {
    case "intro":
      return (
        <p className="mx-auto max-w-[620px] text-center font-[family-name:var(--font-literata)] text-[16px] italic leading-[1.85] text-[#d8e2ea]">
          {block.text}
        </p>
      );
    case "section":
      return (
        <section className="mx-auto max-w-[680px]">
          {block.kicker ? (
            <p
              className="mono-label text-[9px] uppercase tracking-[0.28em]"
              style={{ color: a }}
            >
              {block.kicker}
            </p>
          ) : null}
          <h2 className="mt-2.5 font-[family-name:Cinzel] text-[22px] font-semibold leading-tight tracking-wide text-[#eef2f5] sm:text-[26px]">
            {block.heading}
          </h2>
          <div className="mt-4 space-y-3.5">
            {block.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[14px] leading-[1.9] text-[#b9c6cf]"
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      );
    case "list":
      return (
        <section className="mx-auto max-w-[680px] rounded-2xl border border-white/10 bg-[rgba(8,12,20,0.5)] p-5 sm:p-6">
          <h3 className="font-[family-name:Cinzel] text-[15px] font-semibold tracking-wide text-[#e8d9b0]">
            {block.heading}
          </h3>
          <ul className="mt-3.5 space-y-2.5">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#a7b6c2]"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-1.5 shrink-0 rotate-45"
                  style={{ backgroundColor: b }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    case "practice":
      return (
        <section
          className="mx-auto max-w-[680px] rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: `color-mix(in srgb, ${a} 34%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${a} 7%, rgba(8,12,20,0.6))`,
          }}
        >
          <p className="mono-label text-[9px] uppercase tracking-[0.26em]" style={{ color: a }}>
            {t("The practice")}
          </p>
          <h3 className="mt-2 font-[family-name:Cinzel] text-[15.5px] font-semibold tracking-wide text-[#eef2f5]">
            {block.title}
          </h3>
          <ol className="mt-3.5 space-y-2.5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[13.5px] leading-[1.8] text-[#b9c6cf]">
                <span
                  className="mono-label mt-[3px] flex size-5 shrink-0 items-center justify-center rounded-full border text-[8.5px]"
                  style={{ borderColor: `color-mix(in srgb, ${a} 45%, transparent)`, color: a }}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>
      );
    case "reflect":
      return (
        <section
          className="mx-auto max-w-[680px] rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: `color-mix(in srgb, ${b} 30%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${b} 6%, rgba(8,12,20,0.6))`,
          }}
        >
          <p className="mono-label text-[9px] uppercase tracking-[0.26em]" style={{ color: b }}>
            {t("Pause & reflect")}
          </p>
          <p className="mt-2.5 font-[family-name:var(--font-literata)] text-[15px] italic leading-[1.8] text-[#d8e2ea]">
            {block.question}
          </p>
        </section>
      );
    case "quote":
      return (
        <blockquote className="mx-auto max-w-[560px] text-center">
          <Diamond
            aria-hidden="true"
            className="mx-auto size-3 rotate-45"
            style={{ color: a }}
          />
          <p className="mt-3 font-[family-name:var(--font-literata)] text-[17px] italic leading-[1.75] text-[#e8d9b0]">
            {block.text}
          </p>
        </blockquote>
      );
  }
}

export default function GuideView({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const t = useT();
  const guide = guideBySlug(slug);
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* each page opens at its own top — the threshold beneath keeps its
     own place, so nothing needs restoring here */
  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 });
  }, [slug]);

  if (!guide) return null;

  return (
    <div
      ref={rootRef}
      data-testid="guide-view"
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-y-contain bg-[#05070d]"
      role="dialog"
      aria-modal="true"
      aria-label={guide.title}
    >
      <div className="mx-auto w-full max-w-[900px] px-4 pb-16 sm:px-8">
        {/* the back hand — one touch folds the page away and the
            slideshow stands exactly where it was left */}
        <div className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-3 border-b border-white/8 bg-[rgba(5,7,13,0.88)] px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            data-testid="guide-back"
            className="focus-glow group inline-flex h-9 items-center gap-2 rounded-full border border-white/14 bg-white/[0.04] px-4 text-[12.5px] text-[#b9c6cf] transition-all duration-300 hover:border-[rgba(232,217,176,0.55)] hover:text-[#eee3c2]"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            {t("Back to the slideshow")}
          </button>
          <span className="mono-label hidden text-[8.5px] uppercase tracking-[0.26em] text-[#66788a] sm:block">
            {guide.subtitle}
          </span>
        </div>

        {/* the hero — the guide's own artwork and name */}
        <header className="pt-6 text-center sm:pt-10">
          <p className="mono-label text-[9px] uppercase tracking-[0.3em] text-[#8fa3b2]">
            {guide.subtitle}
          </p>
          <h1 className="mt-3.5 font-[family-name:Cinzel] text-[clamp(28px,7.5vw,42px)] font-semibold leading-[1.14] tracking-wide text-[#f0f3f6]">
            {guide.title}
          </h1>
          <div className="relative mx-auto mt-7 aspect-[2/1] w-full overflow-hidden rounded-[22px] ring-1 ring-white/10">
            <Image
              src={guide.image}
              alt={guide.title}
              fill
              priority
              sizes="(min-width: 768px) 836px, 100vw"
              className="object-cover"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: `inset 0 0 110px -40px ${guide.crystalA}, inset 0 -80px 110px -60px ${guide.crystalB}`,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(4,7,12,0.8)] to-transparent"
            />
          </div>
          <p className="mx-auto mt-6 max-w-[620px] font-[family-name:var(--font-literata)] text-[16.5px] italic leading-[1.8] text-[#e8d9b0]">
            {guide.tagline}
          </p>
        </header>

        {/* the walk — every chapter, practice and question of the
            guide, in the house's own hand */}
        <div
          className={cn("mt-12 flex flex-col gap-9")}
          data-testid="guide-blocks"
        >
          {guide.blocks.map((block, i) => (
            <Block key={i} block={block} a={guide.crystalA} b={guide.crystalB} />
          ))}
        </div>

        {/* the foot — the way back to the shelf of guides */}
        <div className="mt-14 flex flex-col items-center gap-4 border-t border-white/8 pt-10 text-center">
          <p className="mono-label text-[8.5px] uppercase tracking-[0.28em] text-[#66788a]">
            {t("A guide of the house")}
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="guide-back-bottom"
            className="focus-glow group inline-flex h-11 items-center gap-2.5 rounded-full border border-[rgba(232,217,176,0.5)] bg-[linear-gradient(180deg,rgba(232,217,176,0.14),rgba(232,217,176,0.05)_55%,rgba(232,217,176,0.09))] px-6 text-[13.5px] font-medium text-[#f0e7cd] transition-all duration-300 hover:border-[rgba(232,217,176,0.85)]"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            {t("Choose another guide")}
          </button>
        </div>
      </div>
    </div>
  );
}
