"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Diamond } from "lucide-react";
import { useT } from "@/lib/i18n";
import { guideBySlug, type GuideBlock } from "@/lib/guides";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE GUIDE'S OWN PAGE — one of the house's illustrated guides,      */
/*  opened full-screen above the threshold. It is not a route: the     */
/*  threshold stays mounted beneath, so the visitor's walk (the        */
/*  slideshow's own plate, the page's exact place) is untouched — the  */
/*  back hand simply folds the page away and the slideshow stands      */
/*  exactly where it was left.                                         */
/*                                                                     */
/*  THE HASH AS THE DOOR: opening sets #guide/<slug>, so the           */
/*  browser's own back button returns to the slideshow as naturally    */
/*  as the page's own back hands do.                                   */
/*                                                                     */
/*  THE MILKY VANILLA PAGES — the guide reads on warm, milky vanilla-  */
/*  yellow paper (the visitor asked for light pages): sepia ink on     */
/*  cream, warm hairlines, the crystals still breathing at the edges.  */
/*  THE READER'S OWN PAGE — everything here speaks to the reader:      */
/*  informative, funny, precise — the guide serves, it never takes     */
/*  the stage.                                                         */
/*  THE LIGHT LANGUAGE — the house's sigils stand scattered across     */
/*  every page at their own random rest (seeded by the slug, so a      */
/*  page always wears the same sky), quiet behind the words, never     */
/*  in their way.                                                      */
/* ------------------------------------------------------------------ */

/* the light language's marks — the family the threshold wears:
   the ten originals plus the grand collection (the light-language
   seals and the intricate lights) at their full resolution */
const GUIDE_SIGILS = [
  "/images/landing/sigils/sigil-01.png",
  "/images/landing/sigils/sigil-02.png",
  "/images/landing/sigils/sigil-03.png",
  "/images/landing/sigils/sigil-04.png",
  "/images/landing/sigils/sigil-05.png",
  "/images/landing/sigils/sigil-06.png",
  "/images/landing/sigils/sigil-07.png",
  "/images/landing/sigils/sigil-08.png",
  "/images/landing/sigils/sigil-09.png",
  "/images/landing/sigils/sigil-10.png",
  "/sigils/sigil_01.png",
  "/sigils/sigil_03.png",
  "/sigils/sigil_05.png",
  "/sigils/sigil_07.png",
  "/sigils/sigil_09.png",
  "/sigils/intricate_01.png",
  "/sigils/intricate_03.png",
  "/sigils/intricate_05.png",
  "/sigils/intricate_07.png",
  "/sigils/intricate_09.png",
] as const;

/* a seeded wanderer — the same slug always draws the same sky */
function seededRand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SigilPlace = {
  src: string;
  top: string;
  side: "left" | "right";
  offset: string;
  size: string;
  opacity: number;
  rotate: number;
};

/* twelve marks drawn down the page's whole height — grand, quiet,
   resting at the page's shoulders where the words are not */
function drawSigilSky(slug: string): SigilPlace[] {
  const rand = seededRand(`guide-sky:${slug}`);
  const places: SigilPlace[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const step = 100 / count;
    const top = 2 + i * step + rand() * (step * 0.72);
    const side: "left" | "right" = rand() > 0.5 ? "left" : "right";
    const offset = `${(rand() * 7).toFixed(1)}%`;
    const sizePx = 170 + Math.round(rand() * 260);
    places.push({
      src: GUIDE_SIGILS[Math.floor(rand() * GUIDE_SIGILS.length)],
      top: `${Math.min(top, 97).toFixed(1)}%`,
      side,
      offset,
      size: `${sizePx}px`,
      opacity: 0.09 + rand() * 0.08,
      rotate: Math.round(-22 + rand() * 44),
    });
  }
  return places;
}

function SigilSky({ slug }: { slug: string }) {
  const sky = useMemo(() => drawSigilSky(slug), [slug]);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {sky.map((s, i) => (
        <Image
          key={i}
          src={s.src}
          alt=""
          draggable={false}
          loading="lazy"
          width={560}
          height={560}
          sizes="(max-width: 640px) 40vw, 400px"
          className="lp-sigil-img absolute select-none"
          style={{
            top: s.top,
            ...(s.side === "left" ? { left: s.offset } : { right: s.offset }),
            width: s.size,
            maxWidth: "42vw",
            height: "auto",
            opacity: s.opacity,
            transform: `rotate(${s.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* --------------------- the milky vanilla palette -------------------- */
/* warm sepia ink on cream paper — the crystals keep breathing at the
   seams through their own rgba accents (a/b ride in from the data) */
const PAGE_BG = "#f6efdc";
const INK = "#3a3121";
const INK_SOFT = "#5a4c33";
const INK_FAINT = "#8d7c5c";
const GOLD = "#9a781e";
const CARD_BG = "rgba(255, 253, 244, 0.75)";
const EDGE = "rgba(122, 100, 58, 0.24)";

function Block({ block, a, b }: { block: GuideBlock; a: string; b: string }) {
  const t = useT();
  switch (block.type) {
    case "intro":
      return (
        <p className="mx-auto max-w-[620px] text-center font-[family-name:var(--font-literata)] text-[17px] italic leading-[1.85] text-[#6d5c3c]">
          {block.text}
        </p>
      );
    case "section":
      return (
        <section className="mx-auto max-w-[680px]">
          {block.kicker ? (
            <p
              className="mono-label text-[10px] uppercase tracking-[0.28em]"
              style={{ color: `color-mix(in srgb, ${a} 62%, ${GOLD})` }}
            >
              {block.kicker}
            </p>
          ) : null}
          <h2 className="mt-2.5 font-[family-name:Cinzel] text-[23px] font-semibold leading-tight tracking-wide text-[#372e1c] sm:text-[27px]">
            {block.heading}
          </h2>
          <div className="mt-4 space-y-3.5">
            {block.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.9] text-[#544731]"
              >
                {p}
              </p>
            ))}
          </div>
          {/* a note in the margin — a direct word to the reader between
              the chapters: informative, a little funny, always precise */}
          {block.mirror ? (
            <div
              className="mt-5 border-l-2 pl-4"
              style={{
                borderColor: `color-mix(in srgb, ${a} 55%, ${EDGE})`,
              }}
              data-mirror-whisper=""
            >
              <p
                className="mono-label text-[9.5px] uppercase tracking-[0.26em]"
                style={{ color: `color-mix(in srgb, ${a} 55%, ${GOLD})` }}
              >
                {t("A note in the margin")}
              </p>
              <p className="mt-2 font-[family-name:var(--font-literata)] text-[15.5px] italic leading-[1.8] text-[#7a5c14]">
                {block.mirror}
              </p>
            </div>
          ) : null}
          {/* the chapter's own artwork, carried from its PDF page */}
          {block.image ? (
            <figure className="mt-6 overflow-hidden rounded-2xl shadow-[0_18px_44px_-30px_rgba(90,70,30,0.55)] ring-1 ring-[rgba(122,100,58,0.28)]">
              <div className="relative aspect-[21/10] w-full">
                <Image
                  src={block.image}
                  alt={block.heading}
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 680px, 100vw"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow: `inset 0 0 90px -42px ${a}, inset 0 -70px 90px -56px ${b}`,
                  }}
                />
              </div>
            </figure>
          ) : null}
        </section>
      );
    case "list":
      return (
        <section
          className="mx-auto max-w-[680px] rounded-2xl border p-5 sm:p-6"
          style={{ borderColor: EDGE, backgroundColor: CARD_BG }}
        >
          <h3 className="font-[family-name:Cinzel] text-[16px] font-semibold tracking-wide text-[#7a5c14]">
            {block.heading}
          </h3>
          <ul className="mt-3.5 space-y-2.5">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#544731]"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] size-1.5 shrink-0 rotate-45"
                  style={{ backgroundColor: `color-mix(in srgb, ${b} 70%, ${GOLD})` }}
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
            borderColor: `color-mix(in srgb, ${a} 40%, ${EDGE})`,
            backgroundColor: `color-mix(in srgb, ${a} 7%, ${CARD_BG})`,
          }}
        >
          <p
            className="mono-label text-[10px] uppercase tracking-[0.26em]"
            style={{ color: `color-mix(in srgb, ${a} 55%, ${GOLD})` }}
          >
            {t("The practice")}
          </p>
          <h3 className="mt-2 font-[family-name:Cinzel] text-[16.5px] font-semibold tracking-wide text-[#372e1c]">
            {block.title}
          </h3>
          <ol className="mt-3.5 space-y-2.5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[14.5px] leading-[1.8] text-[#544731]">
                <span
                  className="mono-label mt-[3px] flex size-5 shrink-0 items-center justify-center rounded-full border text-[9.5px]"
                  style={{
                    borderColor: `color-mix(in srgb, ${a} 50%, ${EDGE})`,
                    color: `color-mix(in srgb, ${a} 55%, ${GOLD})`,
                  }}
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
            borderColor: `color-mix(in srgb, ${b} 36%, ${EDGE})`,
            backgroundColor: `color-mix(in srgb, ${b} 7%, ${CARD_BG})`,
          }}
        >
          <p
            className="mono-label text-[10px] uppercase tracking-[0.26em]"
            style={{ color: `color-mix(in srgb, ${b} 50%, ${GOLD})` }}
          >
            {t("Pause & reflect")}
          </p>
          <p className="mt-2.5 font-[family-name:var(--font-literata)] text-[16px] italic leading-[1.8] text-[#5f5033]">
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
            style={{ color: `color-mix(in srgb, ${a} 60%, ${GOLD})` }}
          />
          <p className="mt-3 font-[family-name:var(--font-literata)] text-[18px] italic leading-[1.75] text-[#7a5c14]">
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
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-y-contain overflow-x-clip"
      style={{
        background: `radial-gradient(120% 60% at 50% -10%, rgba(255, 250, 226, 0.9), transparent 60%), radial-gradient(80% 46% at 106% 104%, color-mix(in srgb, ${guide.crystalB} 12%, transparent), transparent 58%), radial-gradient(70% 42% at -6% 102%, color-mix(in srgb, ${guide.crystalA} 10%, transparent), transparent 56%), ${PAGE_BG}`,
        color: INK,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={guide.title}
    >
      {/* the light language's sky — the sigils wander behind the words */}
      <div className="relative mx-auto w-full max-w-[900px] px-4 pb-16 sm:px-8">
        <SigilSky slug={guide.slug} />

        <div className="relative z-10">
          {/* the back hand — one touch folds the page away and the
              slideshow stands exactly where it was left. THE SMALL,
              FINE HAND — a single quiet circle now: a thin gold ring,
              a soft sheen on hover, no heavy bar of words. */}
          <div
            className="sticky top-0 z-10 -mx-4 mb-2 flex items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur-sm sm:-mx-8 sm:px-8"
            style={{ borderColor: EDGE, backgroundColor: "rgba(246, 238, 218, 0.88)" }}
          >
            <button
              type="button"
              onClick={onClose}
              data-testid="guide-back"
              title={t("Back to the slideshow")}
              aria-label={t("Back to the slideshow")}
              className="focus-glow group relative flex size-8 shrink-0 items-center justify-center rounded-full border bg-[rgba(255,253,244,0.78)] text-[#6d5410] shadow-[0_6px_18px_-10px_rgba(122,100,58,0.55)] transition-all duration-300 hover:-translate-x-0.5 hover:border-[rgba(154,120,30,0.7)] hover:bg-[rgba(255,253,244,0.95)] hover:shadow-[0_9px_24px_-10px_rgba(154,120,30,0.6)]"
              style={{ borderColor: "rgba(154, 120, 30, 0.38)" }}
            >
              <ArrowLeft
                className="size-3.5 transition-transform duration-300 group-hover:-translate-x-px"
                aria-hidden="true"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(120deg,transparent_35%,rgba(255,246,214,0.55)_50%,transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </button>
            <span className="mono-label truncate text-[9.5px] uppercase tracking-[0.26em] text-[#8d7c5c]">
              {guide.subtitle}
            </span>
          </div>

          {/* the hero — the guide's own artwork and name */}
          <header className="pt-6 text-center sm:pt-10">
            <p className="mono-label text-[10px] uppercase tracking-[0.3em] text-[#8d7c5c]">
              {guide.subtitle}
            </p>
            <h1 className="mt-3.5 font-[family-name:Cinzel] text-[clamp(28px,7.5vw,42px)] font-semibold leading-[1.14] tracking-wide text-[#332b1a]">
              {guide.title}
            </h1>
            <div className="relative mx-auto mt-7 aspect-[2/1] w-full overflow-hidden rounded-[22px] shadow-[0_26px_60px_-38px_rgba(90,70,30,0.6)] ring-1 ring-[rgba(122,100,58,0.28)]">
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
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(246,238,218,0.85)] to-transparent"
              />
            </div>
            <p className="mx-auto mt-6 max-w-[620px] font-[family-name:var(--font-literata)] text-[17.5px] italic leading-[1.8] text-[#7a5c14]">
              {guide.tagline}
            </p>
          </header>

          {/* the opening hand — a short word to the reader before the
              walk begins: what this guide holds, how to read it */}
          {guide.mirrorOpening ? (
            <div
              data-testid="guide-mirror-opening"
              className="relative mx-auto mt-10 max-w-[640px] rounded-2xl border p-5 text-center sm:p-6"
              style={{
                borderColor: `color-mix(in srgb, ${guide.crystalA} 36%, ${EDGE})`,
                backgroundColor: CARD_BG,
                boxShadow: `0 24px 70px -46px color-mix(in srgb, ${guide.crystalA} 60%, rgba(90,70,30,0.4))`,
              }}
            >
              <Diamond
                aria-hidden="true"
                className="mx-auto size-3 rotate-45"
                style={{ color: `color-mix(in srgb, ${guide.crystalA} 60%, ${GOLD})` }}
              />
              <p
                className="mono-label mt-3 text-[10px] uppercase tracking-[0.3em]"
                style={{ color: `color-mix(in srgb, ${guide.crystalA} 50%, ${GOLD})` }}
              >
                {t("Before you step in")}
              </p>
              <p className="mt-3 font-[family-name:var(--font-literata)] text-[16px] italic leading-[1.85] text-[#5f5033]">
                {guide.mirrorOpening}
              </p>
            </div>
          ) : null}

          {/* the walk — every chapter, practice and question of the
              guide, each chapter carrying its margin note and its own
              artwork */}
          <div
            className={cn("mt-12 flex flex-col gap-9")}
            data-testid="guide-blocks"
          >
            {guide.blocks.map((block, i) => (
              <Block key={i} block={block} a={guide.crystalA} b={guide.crystalB} />
            ))}
          </div>

          {/* the closing hand — a short send-off at the walk's end */}
          {guide.mirrorClosing ? (
            <div
              data-testid="guide-mirror-closing"
              className="mx-auto mt-12 max-w-[640px] text-center"
            >
              <Diamond
                aria-hidden="true"
                className="mx-auto size-3 rotate-45"
                style={{ color: `color-mix(in srgb, ${guide.crystalB} 55%, ${GOLD})` }}
              />
              <p className="mt-3 font-[family-name:var(--font-literata)] text-[16.5px] italic leading-[1.85] text-[#5f5033]">
                {guide.mirrorClosing}
              </p>
            </div>
          ) : null}

          {/* the foot — a quiet mark where the walk ends (the bottom
              back hand is gone: the small circle at the page's head and
              the browser's own back carry the way home) */}
          <div
            className="mt-14 flex flex-col items-center gap-3 border-t pt-9 text-center"
            style={{ borderColor: EDGE }}
          >
            <Diamond
              aria-hidden="true"
              className="size-2.5 rotate-45"
              style={{ color: `color-mix(in srgb, ${guide.crystalB} 55%, ${GOLD})` }}
            />
            <p className="mono-label text-[9.5px] uppercase tracking-[0.28em] text-[#8d7c5c]">
              {t("A guide of the house")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
