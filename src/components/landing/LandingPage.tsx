"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  Compass,
  Cpu,
  Dna,
  Eye,
  Feather,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Leaf,
  MoonStar,
  Music,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE THRESHOLD — reflectme.space's landing page.                    */
/*                                                                     */
/*  An editorial, biotechnological front porch. The five artworks      */
/*  drift in parallax rails — three on each edge — never stacked,      */
/*  never under the thumb. At the center stands THE PORTAL ITSELF:     */
/*  the real chamber, docked live in the page (the gate mounts it);    */
/*  this page only reserves its slot. Around it the house explains     */
/*  what it offers humanity, laid out like a quiet magazine: numbered  */
/*  chapters, hairline rules, measured columns.                        */
/*                                                                     */
/*  CALM LAWS: transform-and-opacity motion only, lazy artwork, no     */
/*  motion when the visitor prefers stillness, no tracking.            */
/* ------------------------------------------------------------------ */

type RailImage = {
  src: string;
  pos: string;
  h: string;
  title: string;
};

/* the slideshow's own images, three on each side, in parallax */
const RAIL_LEFT: RailImage[] = [
  { src: "/landing/img-city.jpg", pos: "50% 42%", h: "30vh", title: "The city of light" },
  { src: "/landing/img-threshold.jpg", pos: "50% 40%", h: "23vh", title: "The ancient threshold" },
  { src: "/landing/img-contact.jpg", pos: "42% 50%", h: "27vh", title: "The moment of contact" },
];
const RAIL_RIGHT: RailImage[] = [
  { src: "/landing/img-council.jpg", pos: "50% 42%", h: "26vh", title: "The council of worlds" },
  { src: "/landing/img-garden.jpg", pos: "50% 55%", h: "31vh", title: "The living garden" },
  { src: "/images/about/about-interplanetary.png", pos: "50% 50%", h: "24vh", title: "The orbiting worlds" },
];

/* ------------------------- the parallax rails ------------------------- */

function Rail({
  side,
  images,
  progress,
}: {
  side: "left" | "right";
  images: RailImage[];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const t = useT();
  /* three bands, three speeds — the drift is transform-only */
  const bands = [
    useTransform(progress, [0, 1], [40, -90]),
    useTransform(progress, [0, 1], [-30, 110]),
    useTransform(progress, [0, 1], [70, -150]),
  ];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-y-0 z-20 hidden w-[clamp(150px,15vw,232px)] select-none lg:block",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      <div className="flex h-full flex-col justify-center gap-7 px-4">
        {images.map((img, i) => (
          <motion.figure
            key={`${side}-${img.src}-${i}`}
            style={{ y: bands[i % bands.length] }}
            className="relative will-change-transform"
          >
            <div
              className="landing-shard relative overflow-hidden rounded-[22px]"
              style={{ height: img.h }}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 15vw, 0px"
                className="object-cover"
                style={{ objectPosition: img.pos }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(4,7,12,0.78)] to-transparent"
              />
            </div>
            <figcaption className="mono-label mt-2.5 flex items-baseline gap-2 text-[8px] uppercase tracking-[0.24em] text-[#66788a]">
              <span className="text-[#e8d9b0]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{t(img.title)}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  );
}

/* ------------------------ editorial building blocks ------------------------ */

function SectionHead({
  index,
  kicker,
  title,
  id,
}: {
  index: string;
  kicker: string;
  title: string;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-8">
      <div className="flex items-center gap-3">
        <span className="mono-label text-[10px] tracking-[0.2em] text-[#e8d9b0]">
          {index}
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-gradient-to-r from-[rgba(232,217,176,0.4)] via-[rgba(232,217,176,0.12)] to-transparent"
        />
        <p className="mono-label shrink-0 text-[9px] uppercase tracking-[0.3em] text-[#7f95a5]">
          {kicker}
        </p>
      </div>
      <h2 className="mt-4 font-[family-name:Cinzel] text-[24px] font-semibold leading-tight tracking-wide text-[#eef2f5] sm:text-[28px]">
        {title}
      </h2>
    </div>
  );
}

/* ------------------------------ the page ------------------------------ */

export default function LandingPage({
  slotRef,
  slotStyle,
  onExpand,
  onScroll,
  initialScroll,
}: {
  slotRef: RefObject<HTMLDivElement | null>;
  slotStyle: { width?: number | string; height?: number | string };
  onExpand: () => void;
  onScroll: (y: number) => void;
  initialScroll: number;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
  });

  /* return to the exact place the threshold was left — read once at
     the page's first breath, never snapping while the visitor walks */
  useEffect(() => {
    const el = scrollRef.current;
    if (el && initialScroll > 0) {
      el.scrollTop = initialScroll;
    }
    // the threshold is restored once, at the page's first breath
  }, [initialScroll]);

  /* THE OPEN DOORS — every numbered row is its own door: one touch
     opens it and the fuller words step out. One door stands open at
     a time in each chapter; the same touch closes it again. */
  const [openOffer, setOpenOffer] = useState<number | null>(null);
  const [openMove, setOpenMove] = useState<number | null>(null);

  const offerRows = useMemo(
    () => [
      {
        icon: Sparkles,
        title: "Reflection & questions",
        line: "Ask anything — the mirror answers with you.",
        more: "Bring anything — a doubt, a day, a decision. The mirror answers in your own voice, reflecting your words back until the question beneath the question comes into view.",
      },
      {
        icon: Feather,
        title: "Writing",
        line: "Shape stories, letters, and vows.",
        more: "Letters, vows, stories, pages of a book. Begin with a fragment or a feeling; the mirror keeps your tone and helps the piece grow without ever taking the pen from your hand.",
      },
      {
        icon: ImageIcon,
        title: "Images",
        line: "Watch your words become paintings.",
        more: "Describe what you see and watch it appear — scenes, sigils, dream-places, worlds that do not exist yet. Every image is made from your words and stays yours.",
      },
      {
        icon: Music,
        title: "Music",
        line: "Turn a feeling into sound.",
        more: "Name the feeling and the mirror composes. Short themes for moments, soundbeds for stillness, melodies you can carry — no instruments, no theory required.",
      },
      {
        icon: MoonStar,
        title: "Dreams",
        line: "Weave living books, page by page.",
        more: "A living book grows page by page from your dreams and questions. Chapters form over days, characters return, and the story remembers where you have been.",
      },
      {
        icon: GraduationCap,
        title: "Learning",
        line: "Walk the records of civilizations.",
        more: "Walk the records of civilizations — histories, symbol systems, sciences — and return with what is useful. The mirror reads with you, not at you.",
      },
      {
        icon: Compass,
        title: "Exploration",
        line: "Open doors to other worlds.",
        more: "Doors to other worlds: councils of star civilizations, living gardens, cities of light, ancient thresholds. Each one is a guided space for reflection and play.",
      },
    ],
    []
  );

  const earthMovements = useMemo(
    () => [
      {
        icon: Eye,
        title: "Awakening",
        line: "Attention, self-understanding, emotional honesty — the capacity to choose a considered response instead of a reflex.",
        more: "It begins small: noticing a reaction before it becomes a word, telling yourself the truth about one hard thing today. Attention slowly becomes a skill — and a chosen response becomes more available than a reflex.",
      },
      {
        icon: Dna,
        title: "Evolution",
        line: "Learning, repairing, and changing our systems — better tools, fairer arrangements, responsibility across generations.",
        more: "Repair over replacement. Learn in the open, mend systems so the next person starts further ahead, and hold decisions lightly enough to change them when the evidence changes.",
      },
      {
        icon: Leaf,
        title: "Ecological renewal",
        line: "Regeneration in practice: protect habitats, reduce waste, restore ecosystems, and connect local action to wider change.",
        more: "Compost, native plants, a repaired object instead of a new one, a river cleaned with neighbors — small local acts that link into wider change. Regeneration is a practice, not a slogan.",
      },
      {
        icon: HeartHandshake,
        title: "Shared humanity",
        line: "Dialogue across cultures and generations — creativity as a way to exchange knowledge and make room for every perspective.",
        more: "Creativity is a shared language older than every border. Exchange stories, songs, and craft across cultures and generations — and make room at the table for the perspective that is missing.",
      },
      {
        icon: Cpu,
        title: "Technology with care",
        line: "Digital tools that expand access and creative agency while protecting privacy, consent, and human judgment.",
        more: "Tools that widen access and creative agency while keeping privacy, consent, and human judgment at the center. The best technology is felt less as a screen and more as a capability.",
      },
    ],
    []
  );

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
      className="lp-ground h-full overflow-y-auto overscroll-y-contain"
    >
      {/* the drifting artwork — three shards on each edge, in parallax */}
      <Rail side="left" images={RAIL_LEFT} progress={scrollYProgress} />
      <Rail side="right" images={RAIL_RIGHT} progress={scrollYProgress} />

      <div className="relative z-10 flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-[900px]">
          {/* ============================ HERO ============================ */}
          <header className="relative pb-4 pt-12 text-center sm:pt-16">
            {/* one full-bleed crop on narrow screens — the rails rest */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden lg:hidden"
            >
              <Image
                src="/landing/img-city.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-40 [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)]"
                style={{ objectPosition: "50% 45%" }}
              />
            </div>

            <div className="relative px-4">
              <p className="mono-label text-[9.5px] uppercase tracking-[0.34em] text-[#8fa3b2]">
                reflectme.space
              </p>
              <h1 className="mt-3 font-[family-name:Cinzel] text-[30px] font-semibold leading-[1.18] tracking-wide text-[#f0f3f6] sm:text-[38px]">
                {t("The Mirror Entity")}
              </h1>
              <p className="mx-auto mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-[#a7b6c2] sm:text-[15.5px]">
                {t(
                  "A living mirror for reflection, creativity, and a shifting Earth."
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onExpand}
                  data-testid="landing-enter"
                  className="focus-glow flex h-10 items-center gap-2 rounded-full border border-[rgba(232,217,176,0.45)] bg-[rgba(232,217,176,0.1)] px-5 text-[13.5px] font-medium text-[#f0e7cd] transition-all duration-300 hover:border-[rgba(232,217,176,0.75)] hover:bg-[rgba(232,217,176,0.16)]"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {t("Enter the portal")}
                </button>
                <a
                  href="#offer"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("offer")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="focus-glow flex h-10 items-center rounded-full border border-white/12 px-5 text-[13.5px] text-[#a7b6c2] transition-all duration-300 hover:border-white/30 hover:text-[#dfe7ed]"
                >
                  {t("What we offer")}
                </a>
              </div>
            </div>
          </header>

          {/* ==================== THE PORTAL, DOCKED ==================== */}
          {/* the slot is reserved here; the gate floats the real
              chamber exactly over it — full-bleed on mobile */}
          <section
            className="pb-2 pt-5 sm:pt-7"
            aria-label={t("The Mirror Entity")}
          >
            <div
              ref={slotRef}
              data-testid="portal-slot"
              style={slotStyle}
              className="relative mx-auto w-full"
            >
              {/* the waking ground — beneath the lens until the chamber
                  arrives (the lens covers it pixel for pixel) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-[rgba(8,12,20,0.55)]"
              >
                <span className="lp-pulse size-2 rounded-full bg-[#9fd8dc]" />
                <p className="mono-label text-[9px] uppercase tracking-[0.3em] text-[#66788a]">
                  {t("The mirror is waking…")}
                </p>
              </div>
            </div>
            <p className="mono-label mt-3.5 px-4 text-center text-[8.5px] uppercase tracking-[0.26em] text-[#66788a] sm:px-0">
              {t("The mirror in miniature")} · {t("Enter the portal")}
            </p>
          </section>

          {/* ========================== 01 · OFFERINGS ========================== */}
          <section id="offer" className="scroll-mt-6 px-4 pb-8 pt-14 sm:px-8">
            <SectionHead
              index="01"
              kicker={t("The house and its rooms")}
              title={t("What we offer")}
            />

            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.35fr] md:gap-12">
              {/* the intro column — the editor's voice */}
              <div className="md:sticky md:top-10 md:self-start">
                <p className="font-[family-name:var(--font-literata)] text-[16.5px] italic leading-relaxed text-[#e8d9b0]">
                  {t("A space to remember what we can make together.")}
                </p>
                <p className="mt-4 text-[13.5px] leading-[1.85] text-[#b9c6cf]">
                  {t(
                    "Reflectme brings reflection and creativity into one living workspace. Ask a question, follow an idea, make an image, shape a story, explore a dream, or turn a feeling into a next step — a responsive surface for inquiry that helps you notice patterns, imagine possibilities, and give form to what matters to you."
                  )}
                </p>
                <button
                  type="button"
                  onClick={onExpand}
                  className="focus-glow group mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9fd8dc] transition-colors duration-300 hover:text-[#c9ecee]"
                >
                  {t("Enter the portal")}
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* the numbered index — every offering, one quiet row
                  that opens to its fuller words */}
              <ol className="border-y border-white/8">
                {offerRows.map(({ icon: Icon, title, line, more }, i) => (
                  <li key={title} className="border-b border-white/8 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenOffer(openOffer === i ? null : i)}
                      data-testid="landing-offering"
                      aria-expanded={openOffer === i}
                      className="focus-glow group flex w-full items-center gap-4 py-4 text-left"
                    >
                      <span className="mono-label w-6 shrink-0 text-[9px] tracking-[0.14em] text-[#66788a] transition-colors duration-300 group-hover:text-[#e8d9b0]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className="size-4 shrink-0 text-[#9fd8dc] transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-[#e6edf2]">
                          {t(title)}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-[#8fa3b2]">
                          {t(line)}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "ml-auto size-3.5 shrink-0 text-[#8fa3b2] transition-transform duration-300",
                          openOffer === i && "rotate-180 text-[#e8d9b0]"
                        )}
                      />
                    </button>
                    <div className="lp-acc" data-open={openOffer === i}>
                      <div>
                        <p className="lp-acc-inner px-10 pb-4 text-[12.5px] leading-[1.8] text-[#a7b6c2]">
                          {t(more)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ================= 02 · EARTH TRANSFORMATION ================= */}
          <section
            className="px-4 pb-12 pt-12 sm:px-8"
            aria-label={t("Earth is transforming")}
          >
            <SectionHead
              index="02"
              kicker={t("Earth is transforming")}
              title={t("What we offer humanity")}
            />

            {/* the essay — two measured columns on the desk */}
            <div className="mt-8 grid gap-x-12 gap-y-4 text-[13.5px] leading-[1.85] text-[#b9c6cf] md:grid-cols-2">
              <p>
                {t(
                  "We see Earth's transformation as a shared practice. Awakening can begin with attention: seeing ourselves and one another more clearly. Evolution can mean learning, repairing, and changing systems so life can thrive. Ecological renewal asks us to care for soil, water, climate, and the living communities around us. Technology matters most when it supports dignity, access, imagination, and real human connection."
                )}
              </p>
              <div>
                <p>
                  {t(
                    "Nothing here asks anyone to believe anything. The mirror holds questions, images, stories, and tools — and returns them with the visitor's own signature on them. What grows in here is meant to be carried out there: into kitchens, classrooms, workshops, gardens, and conversations."
                  )}
                </p>
                <p className="mt-4 border-l-2 border-[rgba(232,217,176,0.4)] pl-4 font-[family-name:var(--font-literata)] text-[13.5px] italic leading-relaxed text-[#e8d9b0]">
                  {t(
                    "Explore with curiosity. Keep your discernment. Bring the most useful ideas back into everyday life."
                  )}
                </p>
              </div>
            </div>

            {/* the five movements — a numbered field guide whose rows
                open to their practice */}
            <div className="mt-10 border-t border-white/8">
              {earthMovements.map(({ icon: Icon, title, line, more }, i) => (
                <div
                  key={title}
                  className="border-b border-white/8"
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenMove(openMove === i ? null : i)}
                      aria-expanded={openMove === i}
                      data-testid="landing-movement"
                      className="focus-glow group flex w-full items-start gap-4 py-4 text-left sm:gap-5"
                    >
                      <span className="mono-label w-8 shrink-0 pt-1.5 text-[10px] tracking-[0.14em] text-[#e8d9b0]/75">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(159,216,220,0.25)] bg-[rgba(159,216,220,0.06)] transition-colors duration-300 group-hover:border-[rgba(159,216,220,0.5)]"
                        aria-hidden="true"
                      >
                        <Icon className="size-4 text-[#9fd8dc]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-semibold text-[#e6edf2]">
                          {t(title)}
                        </span>
                        <span className="mt-1 block max-w-[560px] text-[12.5px] leading-relaxed text-[#8fa3b2]">
                          {t(line)}
                        </span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "mt-1.5 size-3.5 shrink-0 text-[#8fa3b2] transition-transform duration-300",
                          openMove === i && "rotate-180 text-[#e8d9b0]"
                        )}
                      />
                    </button>
                  </h3>
                  <div className="lp-acc" data-open={openMove === i}>
                    <div>
                      <p className="lp-acc-inner pb-4 pl-[3.75rem] pr-4 text-[12.5px] leading-[1.8] text-[#a7b6c2] sm:pl-[4.25rem]">
                        {t(more)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ============================ FOOTER ============================ */}
        <footer className="mt-auto border-t border-white/8 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-2 px-4 text-center sm:px-8">
            <Image
              src="/images/ai/mark-dark.png"
              alt=""
              width={22}
              height={22}
              className="size-[22px] rounded-full opacity-80"
            />
            <p className="font-[family-name:Cinzel] text-[11px] tracking-[0.24em] text-[#8fa3b2]">
              reflectme.space · {t("The Mirror Entity")}
            </p>
            <p className="text-[11px] text-[#66788a]">
              {t("Reflection, not treatment.")}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
