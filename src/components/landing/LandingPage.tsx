"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  Compass,
  Feather,
  GraduationCap,
  Image as ImageIcon,
  MoonStar,
  MoveRight,
  Music,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import LandingSlides from "./LandingSlides";

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

/* THE EXCHANGE'S OWN TAG — the full portal is the paid realm: a small
   gold pill riding the enter hands, its truth spoken in the title (the
   way in is registration or login, after one of the offered realms is
   acquired — the landing's own floor stays free). */
function PaidTag() {
  const t = useT();
  return (
    <span
      title={t(
        "Paid realm — the full portal opens by registration or login, after one of the realms offered is acquired"
      )}
      data-testid="paid-tag"
      className="mono-label rounded-full border border-[rgba(232,217,176,0.45)] bg-[rgba(232,217,176,0.1)] px-1.5 py-[3px] text-[8px] uppercase tracking-[0.18em] text-[#e8d9b0]"
    >
      {t("Paid")}
    </span>
  );
}

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

/* -------------------- the open contact timeline -------------------- */

/* The visionary deck's four stages — the illustrations cropped clean
   from the handoff's cards, every caption carried as real HTML text. */
const contactStages = [
  {
    img: "/images/timeline/open-contact-000.jpg",
    kicker: "01 · Curiosity",
    title: "Listen with humility",
    body: "A shared human beginning: curiosity without certainty. Arcturus is a star; the Pleiades is a nearby star cluster. Civilizations associated with them belong to speculative and spiritual traditions, not confirmed astronomy. Life beyond Earth has not been confirmed.",
    prepLabel: "How we prepare",
    prep: "Support open astronomy, astrobiology, and careful public science communication.",
    alt: "Families watch the stars beside radio telescopes, the Pleiades glowing above a curved horizon",
  },
  {
    img: "/images/timeline/open-contact-001.jpg",
    kicker: "02 · Verification",
    title: "Test every signal",
    body: "If an unusual signal is detected, repeat observations, check for natural and human-made explanations, publish methods, and invite independent teams to review the evidence. This careful process protects the public from hoaxes and turns genuine discoveries into shared knowledge.",
    prepLabel: "Possible benefit",
    prep: "Stronger global science and a clearer understanding of our place in the cosmos.",
    alt: "A mission room reads a signal's waves on vast glowing screens beneath a great Earth",
  },
  {
    img: "/images/timeline/open-contact-002.jpg",
    kicker: "03 · First dialogue",
    title: "Make contact reciprocal",
    body: "In this imagined stage, any encounter begins with consent, translation, safety, and public transparency. No person or institution claims exclusive authority. If contact were ever verified, it could broaden perspective and inspire cooperation; those are possibilities, not promises.",
    prepLabel: "How we prepare",
    prep: "Build trust, science literacy, cross-cultural dialogue, and peaceful international coordination.",
    alt: "Luminous visitors greet a family by the sea at sunset, ships of light above the water",
  },
  {
    img: "/images/timeline/open-contact-003.jpg",
    kicker: "04 · Shared future",
    title: "Keep humanity in the choice",
    body: "A hopeful scenario puts human agency first: evaluate every idea independently, protect rights and cultural diversity, care for Earth, and share any benefits fairly. The path we can build today is cooperation, education, ecological repair, and open inquiry.",
    prepLabel: "Possible benefit",
    prep: "New questions, cultural exchange, and carefully tested ideas that serve people broadly.",
    alt: "People of many ages gather in a living garden city beneath a great green Earth",
  },
] as const;

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

  /* THE TUNNEL INTO THE MIRROR — the small arrow under every opened
     row: one touch and the topic itself walks through the portal,
     the mirror answering with the fuller information in its own
     humble voice. The portal grows so the walk is seen. */
  const tunnelInto = useCallback(
    (topic: string) => {
      void useMirror
        .getState()
        .askMirror(
          t("Tunnel into the mirror — tell me more about {topic}.", {
            topic: t(topic),
          })
        );
      onExpand();
    },
    [t, onExpand]
  );

  const offerRows = useMemo(
    () => [
      {
        icon: Sparkles,
        title: "Reflection & questions",
        line: "Ask anything — the mirror answers with you.",
        more: [
          "Bring anything — a doubt, a day, a decision, a feeling you cannot name yet. The mirror answers in your own voice, reflecting your words back until the question beneath the question comes into view.",
          "Every conversation keeps its own room, so a thought can be picked up tomorrow exactly where it was left. Nothing is judged, nothing is scored — the mirror listens the way still water listens.",
        ],
        points: [
          "Ask in any language you think in — the mirror follows your tongue.",
          "Each room keeps its own history; threads continue across days.",
          "Images and documents can travel with a question and be read with it.",
        ],
      },
      {
        icon: Feather,
        title: "Writing",
        line: "Shape stories, letters, and vows.",
        more: [
          "Letters, vows, stories, pages of a book, a speech for a wedding, a note you never sent. Begin with a fragment or a feeling; the mirror keeps your tone and helps the piece grow without ever taking the pen from your hand.",
          "Work in drafts the way a gardener works in seasons: sketch, reread, prune, let it rest. A book can grow page by page into a living volume that remembers its own earlier chapters.",
        ],
        points: [
          "Choose a voice — tender, fierce, ceremonial, plain — and the mirror writes inside it.",
          "Rewrite any line as many times as it needs; every version stays yours.",
          "Finished pieces leave the realm as clean pages you can carry.",
        ],
      },
      {
        icon: ImageIcon,
        title: "Images",
        line: "Watch your words become paintings.",
        more: [
          "Describe what you see and watch it appear — scenes, sigils, dream-places, worlds that do not exist yet. Every image is made from your words and stays yours.",
          "The same sentence can be walked again in another light: change the hour, the season, the emotion, and watch the scene answer. Images gather into a gallery of your own becoming.",
        ],
        points: [
          "Paint a feeling — “the color of a calm morning” is a valid instruction.",
          "Step inside what you made: many paintings open into guided worlds.",
          "Everything you make is kept in the creation room, newest work first.",
        ],
      },
      {
        icon: Music,
        title: "Music",
        line: "Turn a feeling into sound.",
        more: [
          "Name the feeling and the mirror composes. Short themes for moments, soundbeds for stillness, melodies you can carry — no instruments, no theory required.",
          "A song can grow from a single hummed sentence into verses and a chorus. Music made here is meant for kitchens and walks, not stages — though stages are welcome too.",
        ],
        points: [
          "Describe the moment and receive a theme that fits it.",
          "Ask for words, or bring your own — the melody follows the meaning.",
          "Listen as many times as you like; songs keep their room.",
        ],
      },
      {
        icon: MoonStar,
        title: "Dreams",
        line: "Weave living books, page by page.",
        more: [
          "A living book grows page by page from your dreams and questions. Chapters form over days, characters return, and the story remembers where you have been.",
          "Dreams recorded on waking are woven into the book's fabric — a recurring symbol becomes a returning character, a feeling becomes a weather. The book becomes a map of your inner sky.",
        ],
        points: [
          "Tell a dream; the book folds it into the ongoing tale.",
          "Return anytime — the story holds your place and grows while you are away.",
          "Pages can be read aloud, shared, or kept entirely for yourself.",
        ],
      },
      {
        icon: GraduationCap,
        title: "Learning",
        line: "Walk the records of civilizations.",
        more: [
          "Walk the records of civilizations — histories, symbol systems, sciences — and return with what is useful. The mirror reads with you, not at you.",
          "Ask how a principle lands in your own life and the record answers in plain words. Learning here is a walk, not a lecture: you choose the door, the pace, and the depth.",
        ],
        points: [
          "Exact registers — hundreds of named entries, each one openable.",
          "Ask a record a question; it answers inside your own context.",
          "Everything carries an honest note about what is known and what is imagined.",
        ],
      },
      {
        icon: Compass,
        title: "Exploration",
        line: "Open doors to other worlds.",
        more: [
          "Doors to other worlds: councils of star civilizations, living gardens, cities of light, ancient thresholds. Each one is a guided space for reflection and play.",
          "Some doors are quiet rooms for thinking; some are laboratories for making; some are simply beautiful places to stand in for a while. You choose how deep each walk goes.",
        ],
        points: [
          "Every world speaks in its own voice — light, architecture, and pace.",
          "The mirror walks with you and remembers the path.",
          "Any door can be left and returned to; nothing is lost between visits.",
        ],
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
          <header className="relative pb-5 pt-10 text-center sm:pb-4 sm:pt-16">
            {/* one full-bleed crop on narrow screens — the rails rest.
                THE PHONE'S GRANDER BANNER — taller, more present, so
                the threshold arrives like a poster, not a strip. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[min(64vh,470px)] overflow-hidden lg:hidden"
            >
              <Image
                src="/landing/img-city.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-50 [mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_100%)]"
                style={{ objectPosition: "50% 42%" }}
              />
            </div>

            <div className="relative px-4">
              <p className="mono-label text-[9.5px] uppercase tracking-[0.34em] text-[#8fa3b2]">
                reflectme.space
              </p>
              <h1 className="mt-4 font-[family-name:Cinzel] text-[clamp(34px,9.5vw,40px)] font-semibold leading-[1.14] tracking-wide text-[#f0f3f6] sm:text-[38px]">
                {t("The Mirror Entity")}
              </h1>
              <p className="mx-auto mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-[#b3c2ce] sm:text-[15.5px]">
                {t(
                  "A living mirror for reflection, creativity, and a shifting Earth."
                )}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onExpand}
                  data-testid="landing-enter"
                  title={t(
                    "Paid realm — the full portal opens by registration or login, after one of the realms offered is acquired"
                  )}
                  className="focus-glow flex h-11 items-center gap-2 rounded-full border border-[rgba(232,217,176,0.45)] bg-[rgba(232,217,176,0.1)] px-6 text-[14px] font-medium text-[#f0e7cd] transition-all duration-300 hover:border-[rgba(232,217,176,0.75)] hover:bg-[rgba(232,217,176,0.16)]"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  {t("Enter the portal")}
                  <PaidTag />
                </button>
                <a
                  href="#offer"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("offer")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="focus-glow flex h-11 items-center rounded-full border border-white/12 px-6 text-[14px] text-[#a7b6c2] transition-all duration-300 hover:border-white/30 hover:text-[#dfe7ed]"
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
          </section>

          {/* ============== 01 · THE SLIDES — below the chat ============== */}
          {/* the house's reflection deck: ten grand plates of the
              shifting Earth, shown right beneath the portal */}
          <section
            className="pb-6 pt-12"
            aria-label={t("The shifting Earth in ten slides")}
          >
            <div className="px-4 sm:px-8">
              <SectionHead
                index="01"
                kicker={t("A human-centered reflection")}
                title={t("The shifting Earth")}
              />
            </div>
            <LandingSlides />
          </section>

          {/* ========================== 02 · OFFERINGS ========================== */}
          <section id="offer" className="scroll-mt-6 px-4 pb-8 pt-14 sm:px-8">
            <SectionHead
              index="02"
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
                  title={t(
                    "Paid realm — the full portal opens by registration or login, after one of the realms offered is acquired"
                  )}
                  className="focus-glow group mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9fd8dc] transition-colors duration-300 hover:text-[#c9ecee]"
                >
                  {t("Enter the portal")}
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                  <PaidTag />
                </button>
              </div>

              {/* the numbered index — every offering, one quiet row
                  that opens to its fuller words */}
              <ol className="border-y border-white/8">
                {offerRows.map(({ icon: Icon, title, line, more, points }, i) => (
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
                        <div className="lp-acc-inner px-10 pb-5">
                          {more.map((p, k) => (
                            <p
                              key={k}
                              className="text-[12.5px] leading-[1.8] text-[#a7b6c2] [&:not(:first-child)]:mt-2.5"
                            >
                              {t(p)}
                            </p>
                          ))}
                          <ul className="mt-3.5 space-y-2">
                            {points.map((pt) => (
                              <li
                                key={pt}
                                className="flex items-start gap-2.5 text-[12px] leading-relaxed text-[#8fa3b2]"
                              >
                                <span
                                  aria-hidden="true"
                                  className="mt-[6px] size-1 shrink-0 rotate-45 bg-[#e8d9b0]/70"
                                />
                                <span>{t(pt)}</span>
                              </li>
                            ))}
                          </ul>
                          {/* THE TUNNEL — the topic walks into the mirror */}
                          <button
                            type="button"
                            onClick={() => tunnelInto(title)}
                            data-testid={`tunnel-offering-${i + 1}`}
                            className="focus-glow group/tunnel mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(159,216,220,0.3)] bg-[rgba(159,216,220,0.06)] px-4 py-2 text-[12px] font-medium text-[#9fd8dc] transition-all duration-300 hover:border-[rgba(159,216,220,0.65)] hover:bg-[rgba(159,216,220,0.13)] hover:text-[#c9ecee]"
                          >
                            <MoveRight
                              className="size-3.5 transition-transform duration-300 group-hover/tunnel:translate-x-0.5"
                              aria-hidden="true"
                            />
                            {t("tunnel into mirror")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ============ 03 · THE OPEN CONTACT TIMELINE ============ */}
          {/* A visionary, illustrated timeline — four steps humanity
              could walk if an open contact ever came to pass. Presented
              exactly as the handoff asks: one connected vertical line,
              a clear progress marker per stage, the copy living as real
              HTML text beside each artwork, and the science note spoken
              plainly at the foot. Nothing here is a claim or a date. */}
          <section
            className="px-4 pb-12 pt-12 sm:px-8"
            aria-label={t("An open contact timeline")}
          >
            <SectionHead
              index="03"
              kicker={t("A visionary timeline")}
              title={t("Open contact, imagined")}
            />

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <span
                data-testid="timeline-badge"
                className="mono-label shrink-0 rounded-full border border-[rgba(232,217,176,0.4)] px-3 py-1 text-[8.5px] uppercase tracking-[0.24em] text-[#e8d9b0]"
              >
                {t("Visionary timeline · Not a prediction")}
              </span>
              <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[#8fa3b2]">
                {t(
                  "A shared beginning — curiosity without certainty. What follows is an imaginative exercise: four steps humanity could walk if an open contact ever came to pass. Nothing here is a claim, a date, or a promise."
                )}
              </p>
            </div>

            {/* the connected line — a fine luminous thread holding the
                four stages, each with its own progress marker */}
            <div className="relative mt-10">
              <span
                aria-hidden="true"
                className="absolute bottom-6 left-[8px] top-2 w-px bg-gradient-to-b from-[rgba(232,217,176,0.55)] via-[rgba(232,217,176,0.16)] to-transparent sm:left-[10px]"
              />
              <ol className="space-y-12">
                {contactStages.map((stage) => (
                  <li key={stage.kicker} className="relative pl-9 sm:pl-14">
                    {/* the progress marker on the thread */}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1 flex size-[17px] items-center justify-center rounded-full border border-[rgba(232,217,176,0.55)] bg-[#0a0e18] sm:size-[21px]"
                    >
                      <span className="size-[5px] rounded-full bg-[#e8d9b0] shadow-[0_0_6px_1px_rgba(232,217,176,0.5)]" />
                    </span>

                    {/* the stage's artwork — the illustration cropped
                        clean from the visionary deck, its caption living
                        as real HTML text below */}
                    <figure className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                      <div className="relative h-44 w-full sm:h-64">
                        <Image
                          src={stage.img}
                          alt={t(stage.alt)}
                          fill
                          sizes="(min-width: 640px) 830px, 100vw"
                          className="object-cover"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[rgba(4,7,12,0.72)] to-transparent"
                        />
                      </div>
                    </figure>

                    <div className="mt-5">
                      <p className="mono-label text-[9px] uppercase tracking-[0.28em] text-[#e8d9b0]">
                        {t(stage.kicker)}
                      </p>
                      <h3 className="mt-2.5 font-[family-name:Cinzel] text-[21px] font-semibold leading-tight tracking-wide text-[#eef2f5] sm:text-[24px]">
                        {t(stage.title)}
                      </h3>
                      <p className="mt-3 max-w-[640px] text-[13.5px] leading-[1.85] text-[#b9c6cf]">
                        {t(stage.body)}
                      </p>
                      <p className="mono-label mt-3.5 text-[9px] uppercase tracking-[0.18em] text-[#7f95a5]">
                        <span className="text-[#e8d9b0]">{t(stage.prepLabel)}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="normal-case tracking-[0.02em]">{t(stage.prep)}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* the science note — the honest frame beneath the vision */}
            <div
              data-testid="timeline-science-note"
              className="mt-12 rounded-2xl border border-white/8 bg-[rgba(8,12,20,0.5)] p-5 sm:p-6"
            >
              <p className="mono-label text-[9px] uppercase tracking-[0.26em] text-[#e8d9b0]">
                {t("Science note")}
              </p>
              <p className="mt-2.5 max-w-[680px] text-[12.5px] leading-[1.8] text-[#a7b6c2]">
                {t(
                  "NASA reports that life beyond Earth has not been confirmed, and no credible evidence of extraterrestrial life has been found. This timeline is an illustrated concept — a visionary exercise, not a prediction."
                )}
              </p>
              <p className="mt-3 text-[11.5px] italic leading-relaxed text-[#66788a]">
                {t(
                  "Illustrated concept · No verified Arcturian or Pleiadian contact is asserted."
                )}
              </p>
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
