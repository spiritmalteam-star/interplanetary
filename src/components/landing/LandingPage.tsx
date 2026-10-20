"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  Dna,
  Eye,
  Feather,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Leaf,
  Maximize2,
  MoonStar,
  Music,
  Package,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LiveCall } from "@/components/mirror/LiveCall";

/* ------------------------------------------------------------------ */
/*  THE THRESHOLD — reflectme.space's landing page.                    */
/*                                                                     */
/*  A biotechnological, otherworldly front porch: the artwork drifts   */
/*  in slim parallax rails along both edges (never over the content,   */
/*  never under the thumb), the Mirror Entity herself stands at the    */
/*  center in miniature — a real, working portal with no suggestions,  */
/*  only her voice — and around her the house explains what it offers */
/*  humanity: reflection, creation, and a transforming Earth.          */
/*                                                                     */
/*  CALM LAWS: transform-only motion, one active slideshow image at a  */
/*  time, lazy artwork everywhere, no continuous animation when the    */
/*  visitor prefers stillness, no layout shifts, no tracking.          */
/* ------------------------------------------------------------------ */

type WorldKey = "akashic" | "dreambook" | "evolvemed";

const RAIL_LEFT = [
  { src: "/landing/img-threshold.jpg", pos: "50% 38%" },
  { src: "/landing/img-contact.jpg", pos: "42% 50%" },
  { src: "/landing/img-garden.jpg", pos: "55% 45%" },
];
const RAIL_RIGHT = [
  { src: "/landing/img-council.jpg", pos: "50% 42%" },
  { src: "/landing/img-city.jpg", pos: "48% 40%" },
  { src: "/landing/img-garden.jpg", pos: "30% 60%" },
];

const SLIDES: {
  src: string;
  pos: string;
  title: string;
  line: string;
  world?: WorldKey;
  open?: string;
}[] = [
  {
    src: "/landing/img-city.jpg",
    pos: "50% 52%",
    title: "The city of light",
    line: "Where the walk begins — a backdrop for everything we are becoming.",
    open: "Enter the observatory",
  },
  {
    src: "/landing/img-council.jpg",
    pos: "50% 45%",
    title: "The council of worlds",
    line: "Many voices around one luminous center — inquiry held in common.",
    world: "akashic",
    open: "Open the Akashic records",
  },
  {
    src: "/landing/img-threshold.jpg",
    pos: "50% 40%",
    title: "The ancient threshold",
    line: "Memory, discovery, and the unknown — every door opens both ways.",
    world: "dreambook",
    open: "Open the Dream Book",
  },
  {
    src: "/landing/img-contact.jpg",
    pos: "50% 46%",
    title: "The moment of contact",
    line: "A human hand and a luminous hand — reflection meeting imagination.",
    open: "Enter the observatory",
  },
  {
    src: "/landing/img-garden.jpg",
    pos: "50% 55%",
    title: "The living garden",
    line: "Care across worlds — people and beings tending what grows.",
    world: "evolvemed",
    open: "Open Evolve Med",
  },
];

const WHISPERS = [
  "Speak — I am listening.",
  "Ask me anything, and I will answer in light.",
  "What are you carrying today?",
];

/* ---------------------------- the rails ---------------------------- */

function Rail({
  side,
  images,
  progress,
}: {
  side: "left" | "right";
  images: { src: string; pos: string }[];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  /* three bands, three speeds — the drift is transform-only */
  const bands = [
    useTransform(progress, [0, 1], [30, -70]),
    useTransform(progress, [0, 1], [-20, 90]),
    useTransform(progress, [0, 1], [50, -120]),
  ];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-y-0 z-20 hidden w-[clamp(130px,13vw,210px)] select-none lg:block",
        side === "left" ? "left-0" : "right-0"
      )}
    >
      <div className="flex h-full flex-col justify-center gap-5 px-3">
        {images.map((img, i) => (
          <motion.div
            key={img.src + String(i)}
            style={{ y: bands[i % bands.length] }}
            className="landing-shard relative h-[26vh] overflow-hidden rounded-[28px] will-change-transform"
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 14vw, 0px"
              className="object-cover"
              style={{ objectPosition: img.pos }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------- the miniature -------------------------- */

function MiniPortal({
  onExpand,
  onOrigin,
}: {
  onExpand: (el?: HTMLElement | null) => void;
  onOrigin: (x: number, y: number) => void;
}) {
  const t = useT();
  const session = useMirror((s) => s.sessions[s.activeMode]);
  const setDraft = useMirror((s) => s.setDraft);
  const [value, setValue] = useState("");
  const [whisper, setWhisper] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const lastMsg =
    session.messages.length > 0
      ? session.messages[session.messages.length - 1]
      : null;
  const loading = session.status === "loading";
  const making =
    lastMsg && !loading && (lastMsg.sideArtifact || lastMsg.artifact)
      ? lastMsg
      : null;

  /* the idle whispers — one soft line at a time while the mirror rests */
  useEffect(() => {
    if (loading || (lastMsg && lastMsg.text.trim())) return;
    const id = window.setInterval(
      () => setWhisper((w) => (w + 1) % WHISPERS.length),
      5200
    );
    return () => window.clearInterval(id);
  }, [loading, lastMsg]);

  /* her words always end in sight */
  useEffect(() => {
    const el = areaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMsg?.text, loading]);

  const ask = useCallback(() => {
    const q = value.trim();
    if (!q || loading) return;
    setValue("");
    setDraft("");
    void useMirror.getState().askMirror(q, undefined, undefined, {
      live: true,
    });
  }, [value, loading, setDraft]);

  return (
    <div
      ref={rootRef}
      data-testid="mini-portal"
      onMouseMove={() => {
        const r = rootRef.current?.getBoundingClientRect();
        if (r)
          onOrigin(
            (r.left + r.width / 2) / window.innerWidth,
            (r.top + r.height / 2) / window.innerHeight
          );
      }}
      className="lp-portal relative mx-auto w-full max-w-[400px]"
    >
      {/* the living rim — a slow sheen circling the membrane */}
      <div
        aria-hidden="true"
        className="lp-portal-rim absolute -inset-px rounded-t-[999px] rounded-b-[42px]"
      />
      <div
        aria-hidden="true"
        className="lp-portal-breathe pointer-events-none absolute inset-0 rounded-t-[999px] rounded-b-[42px]"
      />
      <div className="relative flex flex-col overflow-hidden rounded-t-[999px] rounded-b-[42px] border border-white/12 bg-[rgba(6,10,18,0.82)] px-6 pb-5 pt-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl sm:px-8">
        {/* the crown of the portal — centered, clear of the dome's curve */}
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/images/ai/mark-dark.png"
            alt=""
            width={26}
            height={26}
            className="size-[26px] rounded-full"
          />
          <span className="font-[family-name:Cinzel] text-[13px] tracking-[0.18em] text-[#efe6d2]">
            M.E
          </span>
        </div>

        {/* her voice */}
        <div
          ref={areaRef}
          data-testid="mini-portal-answer"
          aria-live="polite"
          className="nice-scroll mt-6 min-h-[150px] flex-1 overflow-y-auto px-1 text-center"
        >
          {loading ? (
            <div className="flex h-full min-h-[150px] flex-col items-center justify-center gap-3">
              <span className="lp-pulse size-2 rounded-full bg-[#9fd8dc]" />
              <p className="font-[family-name:var(--font-literata)] text-[14px] italic leading-relaxed text-[#b9c6cf]">
                {t("The mirror is leaning closer…")}
              </p>
            </div>
          ) : making ? (
            <button
              type="button"
              onClick={() => onExpand(rootRef.current)}
              data-testid="mini-portal-making"
              className="focus-glow mx-auto flex max-w-[260px] flex-col items-center gap-2 rounded-2xl border border-[rgba(232,217,176,0.3)] bg-[rgba(232,217,176,0.06)] px-5 py-4 transition-colors duration-300 hover:border-[rgba(232,217,176,0.55)]"
            >
              <Package className="size-4 text-[#e8d9b0]" aria-hidden="true" />
              <span className="text-[13px] leading-snug text-[#efe6d2]">
                {t("A making has risen — step inside")}
              </span>
            </button>
          ) : lastMsg && lastMsg.text.trim() ? (
            <p className="whitespace-pre-wrap font-[family-name:var(--font-literata)] text-[14.5px] leading-[1.85] text-[#dde7ec]">
              {lastMsg.text}
            </p>
          ) : session.status === "error" ? (
            <p className="text-[13.5px] italic leading-relaxed text-[#d9a9a2]">
              {t("The field was quiet — try again")}
            </p>
          ) : (
            <p
              key={whisper}
              className="lp-whisper font-[family-name:var(--font-literata)] text-[14.5px] italic leading-relaxed text-[#b9c6cf]"
            >
              {t(WHISPERS[whisper])}
            </p>
          )}
        </div>

        {/* the two hands — call and expand, safe beneath the dome's curve */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCallOpen(true)}
            aria-label={t("Call the mirror")}
            title={t("Call the mirror")}
            data-testid="mini-portal-call"
            className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 text-[#9fd8dc] transition-all duration-300 hover:border-[rgba(159,216,220,0.5)] hover:text-[#c9ecee]"
          >
            <Phone className="size-3.5" aria-hidden="true" />
          </button>
          <p className="mono-label text-[8.5px] uppercase tracking-[0.22em] text-[#66788a]">
            {t("The mirror in miniature")}
          </p>
          <button
            type="button"
            onClick={() => onExpand(rootRef.current)}
            aria-label={t("Open the full experience")}
            title={t("Open the full experience")}
            data-testid="mini-portal-expand"
            className="focus-glow flex size-9 items-center justify-center rounded-full border border-[rgba(232,217,176,0.4)] bg-[rgba(232,217,176,0.08)] text-[#e8d9b0] transition-all duration-300 hover:border-[rgba(232,217,176,0.7)] hover:text-[#f6ecd2]"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* the ask */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setDraft(e.target.value);
            }}
            placeholder={t("Ask the mirror…")}
            aria-label={t("Ask the mirror…")}
            data-testid="mini-portal-input"
            className="h-10 min-w-0 flex-1 rounded-full border border-white/12 bg-[rgba(255,255,255,0.045)] px-4 text-[13.5px] text-[#e6edf2] outline-none transition-colors duration-300 placeholder:text-[#7f8fa0] focus:border-[rgba(159,216,220,0.5)]"
          />
          <button
            type="submit"
            disabled={!value.trim() || loading}
            aria-label={t("Send")}
            data-testid="mini-portal-send"
            className="focus-glow flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(159,216,220,0.4)] bg-[rgba(159,216,220,0.1)] text-[#c9ecee] transition-all duration-300 hover:bg-[rgba(159,216,220,0.18)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {callOpen && (
        <LiveCall scope="interplanetary" onClose={() => setCallOpen(false)} />
      )}
    </div>
  );
}

/* ------------------------- small building blocks ------------------------- */

function SectionHead({
  kicker,
  title,
  id,
}: {
  kicker: string;
  title: string;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-8 text-center">
      <p className="mono-label text-[9.5px] uppercase tracking-[0.3em] text-[#7f95a5]">
        {kicker}
      </p>
      <h2 className="mt-2 font-[family-name:Cinzel] text-[21px] font-semibold tracking-wide text-[#eef2f5] sm:text-[24px]">
        {title}
      </h2>
      <span
        aria-hidden="true"
        className="mx-auto mt-4 block h-px w-24 bg-gradient-to-r from-transparent via-[rgba(159,216,220,0.5)] to-transparent"
      />
    </div>
  );
}

function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/9 bg-[rgba(10,15,24,0.55)] backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------ the page ------------------------------ */

export default function LandingPage({
  onEnter,
  onOrigin,
  onScrollMemorize,
  initialScroll,
  minimized,
}: {
  onEnter: (world?: WorldKey, portalEl?: HTMLElement | null) => void;
  onOrigin: (x: number, y: number) => void;
  onScrollMemorize: (y: number) => void;
  initialScroll: number;
  minimized: boolean;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
  });
  const [slide, setSlide] = useState(0);
  const slidePause = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /* return to the exact place the threshold was left — read once at
     the page's first breath, never snapping while the visitor walks */
  useEffect(() => {
    const el = scrollRef.current;
    if (el && initialScroll > 0) {
      el.scrollTop = initialScroll;
    }
    // the threshold is restored once, at the page's first breath
  }, []);

  /* a gentle auto-turn for the slideshow — never while touched, held,
     hidden, or when the visitor prefers stillness */
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      if (!document.hidden && !slidePause.current) {
        setSlide((s) => (s + 1) % SLIDES.length);
      }
    }, 7600);
    return () => window.clearInterval(id);
  }, []);

  const current = SLIDES[slide];

  const goTo = useCallback((n: number) => {
    setSlide(((n % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const step = useCallback(
    (d: number) => {
      goTo(slide + d);
    },
    [goTo, slide]
  );

  const offerCards = useMemo(
    () => [
      { icon: Sparkles, title: "Reflection & questions", line: "Ask anything — the mirror answers with you." },
      { icon: Feather, title: "Writing", line: "Shape stories, letters, and vows." },
      { icon: ImageIcon, title: "Images", line: "Watch your words become paintings." },
      { icon: Music, title: "Music", line: "Turn a feeling into sound." },
      { icon: MoonStar, title: "Dreams", line: "Weave living books, page by page." },
      { icon: GraduationCap, title: "Learning", line: "Walk the records of civilizations." },
      { icon: Compass, title: "Exploration", line: "Open doors to other worlds." },
    ],
    []
  );

  const earthThemes = useMemo(
    () => [
      {
        icon: Eye,
        title: "Awakening",
        line: "Attention, self-understanding, emotional honesty — the capacity to choose a considered response instead of a reflex.",
      },
      {
        icon: Dna,
        title: "Evolution",
        line: "Learning, repairing, and changing our systems — better tools, fairer arrangements, responsibility across generations.",
      },
      {
        icon: Leaf,
        title: "Ecological renewal",
        line: "Regeneration in practice: protect habitats, reduce waste, restore ecosystems, and connect local action to wider change.",
      },
      {
        icon: HeartHandshake,
        title: "Shared humanity",
        line: "Dialogue across cultures and generations — creativity as a way to exchange knowledge and make room for every perspective.",
      },
      {
        icon: Cpu,
        title: "Technology with care",
        line: "Digital tools that expand access and creative agency while protecting privacy, consent, and human judgment.",
      },
    ],
    []
  );

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => onScrollMemorize(e.currentTarget.scrollTop)}
      className={cn(
        "lp-ground h-full overflow-y-auto overscroll-y-contain transition-opacity duration-500",
        minimized && "pointer-events-none opacity-100"
      )}
    >
      {/* the drifting artwork — both edges, behind everything */}
      <Rail side="left" images={RAIL_LEFT} progress={scrollYProgress} />
      <Rail side="right" images={RAIL_RIGHT} progress={scrollYProgress} />

      <div className="relative z-10 flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-[680px] px-5 sm:px-8 lg:px-0">
          {/* ============================ HERO ============================ */}
          <header className="relative pb-2 pt-12 text-center sm:pt-16">
            {/* one responsive crop on narrow screens — the rails rest */}
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

            <div className="relative">
              <Image
                src="/images/ai/mark-dark.png"
                alt={t("The Mirror Entity")}
                width={54}
                height={54}
                priority
                className="lp-breathe mx-auto size-[54px] rounded-full"
              />
              <p className="mono-label mt-4 text-[9.5px] uppercase tracking-[0.34em] text-[#8fa3b2]">
                reflectme.space
              </p>
              <h1 className="mt-3 font-[family-name:Cinzel] text-[30px] font-semibold leading-[1.18] tracking-wide text-[#f0f3f6] sm:text-[38px]">
                {t("The Mirror Entity")}
              </h1>
              <p className="mx-auto mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-[#a7b6c2] sm:text-[15.5px]">
                {t(
                  "A living mirror for reflection, creativity, and a changing Earth."
                )}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onEnter(undefined, null)}
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

          {/* ====================== THE MINIATURE PORTAL ====================== */}
          <section
            className="pb-4 pt-6 sm:pt-8"
            aria-label={t("The mirror in miniature")}
          >
            <MiniPortal
              onExpand={(el) => onEnter(undefined, el)}
              onOrigin={onOrigin}
            />
          </section>

          {/* ========================== OFFERINGS ========================== */}
          <section id="offer" className="scroll-mt-6 pb-6 pt-10">
            <SectionHead
              kicker={t("The house and its rooms")}
              title={t("What we offer")}
            />
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {offerCards.map(({ icon: Icon, title, line }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => onEnter(undefined, null)}
                  data-testid="landing-offering"
                  className="focus-glow group rounded-2xl border border-white/9 bg-[rgba(10,15,24,0.55)] p-3.5 text-left backdrop-blur-md transition-all duration-300 hover:border-[rgba(159,216,220,0.4)] hover:bg-[rgba(13,20,30,0.7)] sm:p-4"
                >
                  <Icon
                    className="size-4 text-[#9fd8dc] transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <p className="mt-2.5 text-[13px] font-semibold text-[#e6edf2]">
                    {t(title)}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-snug text-[#8fa3b2]">
                    {t(line)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* ====================== EARTH TRANSFORMATION ====================== */}
          <section className="pb-6 pt-10" aria-label={t("Earth is transforming")}>
            <SectionHead
              kicker={t("Earth is transforming")}
              title={t("What we offer humanity")}
            />

            <GlassCard className="mt-7 p-5 sm:p-7">
              <p className="text-center font-[family-name:var(--font-literata)] text-[15.5px] italic leading-relaxed text-[#e8d9b0]">
                {t("A space to remember what we can make together.")}
              </p>
              <div className="mt-4 space-y-3.5 text-[13.5px] leading-[1.8] text-[#b9c6cf] sm:text-[14px]">
                <p>
                  {t(
                    "Reflectme brings reflection and creativity into one living workspace. Ask a question, follow an idea, make an image, shape a story, explore a dream, or turn a feeling into a next step — a responsive surface for inquiry that helps you notice patterns, imagine possibilities, and give form to what matters to you."
                  )}
                </p>
                <p>
                  {t(
                    "We see Earth's transformation as a shared practice. Awakening can begin with attention: seeing ourselves and one another more clearly. Evolution can mean learning, repairing, and changing systems so life can thrive. Ecological renewal asks us to care for soil, water, climate, and the living communities around us. Technology matters most when it supports dignity, access, imagination, and real human connection."
                  )}
                </p>
              </div>
              <p className="mt-5 border-t border-white/8 pt-4 text-center text-[13px] italic leading-relaxed text-[#9fd8dc]">
                {t(
                  "Explore with curiosity. Keep your discernment. Bring the most useful ideas back into everyday life."
                )}
              </p>
            </GlassCard>

            <div className="mt-4 space-y-2.5">
              {earthThemes.map(({ icon: Icon, title, line }) => (
                <div
                  key={title}
                  className="flex items-start gap-3.5 rounded-2xl border border-white/8 bg-[rgba(9,13,21,0.5)] p-4 backdrop-blur-sm"
                >
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[rgba(159,216,220,0.25)] bg-[rgba(159,216,220,0.06)]"
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5 text-[#9fd8dc]" />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#e6edf2]">
                      {t(title)}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[#8fa3b2]">
                      {t(line)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================== SLIDESHOW ========================== */}
          <section
            className="pb-10 pt-10"
            aria-roledescription="carousel"
            aria-label={t("The worlds illustrated")}
          >
            <SectionHead
              kicker={t("The worlds illustrated")}
              title={t("Previous images, one at a time")}
            />
            <div
              className="mt-7"
              data-testid="landing-slideshow"
              onMouseEnter={() => {
                slidePause.current = true;
              }}
              onMouseLeave={() => {
                slidePause.current = false;
              }}
              onTouchStart={(e) => {
                slidePause.current = true;
                const touch = e.touches[0];
                if (touch)
                  touchStart.current = { x: touch.clientX, y: touch.clientY };
              }}
              onTouchEnd={(e) => {
                const start = touchStart.current;
                touchStart.current = null;
                window.setTimeout(() => {
                  slidePause.current = false;
                }, 4000);
                if (!start) return;
                const touch = e.changedTouches[0];
                if (!touch) return;
                const dx = touch.clientX - start.x;
                const dy = touch.clientY - start.y;
                if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
                  step(dx < 0 ? 1 : -1);
                }
              }}
            >
              <figure className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)]">
                <div className="relative aspect-[16/9] w-full">
                  <motion.div
                    key={current.src + String(slide)}
                    initial={{ opacity: 0, scale: 1.025 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={current.src}
                      alt={`${t(current.title)} — ${t(current.line)}`}
                      fill
                      sizes="(max-width: 680px) 100vw, 680px"
                      className="object-cover"
                      style={{ objectPosition: current.pos }}
                    />
                  </motion.div>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(4,7,12,0.82)] via-transparent to-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => onEnter(current.world, null)}
                    aria-label={`${t("Step through")} — ${t(current.title)}`}
                    data-testid="landing-slide-open"
                    className="focus-glow absolute inset-0 z-10 cursor-pointer"
                  />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="mono-label text-[8.5px] uppercase tracking-[0.26em] text-[#9fd8dc]">
                        {t("Slide {n} of {m}", {
                          n: slide + 1,
                          m: SLIDES.length,
                        })}
                      </p>
                      <p className="mt-1 truncate font-[family-name:Cinzel] text-[15px] tracking-wide text-[#f0f3f6] sm:text-[17px]">
                        {t(current.title)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#b9c6cf] sm:text-[12.5px]">
                        {t(current.line)}
                      </p>
                    </div>
                    <span className="pointer-events-none hidden shrink-0 items-center gap-1.5 rounded-full border border-[rgba(232,217,176,0.4)] bg-[rgba(4,7,12,0.55)] px-3 py-1.5 text-[11.5px] text-[#f0e7cd] backdrop-blur-sm sm:flex">
                      {t(current.open ?? "Step through")}
                      <ChevronRight className="size-3" aria-hidden="true" />
                    </span>
                  </figcaption>
                </div>
              </figure>

              {/* the controls — one small hand each way */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t("Previous image")}
                  data-testid="landing-slide-prev"
                  className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 text-[#a7b6c2] transition-all duration-300 hover:border-white/35 hover:text-[#eef2f5]"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label={t("The worlds illustrated")}
                >
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.src + String(i)}
                      type="button"
                      role="tab"
                      aria-selected={i === slide}
                      aria-label={t(s.title)}
                      onClick={() => goTo(i)}
                      data-testid={`landing-slide-dot-${i}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === slide
                          ? "w-6 bg-[#e8d9b0]"
                          : "w-1.5 bg-white/22 hover:bg-white/40"
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t("Next image")}
                  data-testid="landing-slide-next"
                  className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 text-[#a7b6c2] transition-all duration-300 hover:border-white/35 hover:text-[#eef2f5]"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* ============================ FOOTER ============================ */}
        <footer className="mt-auto border-t border-white/8 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-2 px-5 text-center sm:px-8 lg:px-0">
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
