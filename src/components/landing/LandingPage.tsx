"use client";

import { useRef, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, MotionConfig } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  THE FRONT PORCH.                                                   */
/*                                                                     */
/*  A quiet porcelain page that introduces the house before the        */
/*  visitor steps through the mirror. Ten windows (the chamber's own   */
/*  artwork) drift on soft parallax; a contrast toggle turns the       */
/*  porch into the portal of the mirror; and every door here is one    */
/*  and the same hand: the arch. Press it and the whole page folds     */
/*  itself into that arch — no lag, no loader — into the chamber       */
/*  that has been warming beneath the floor the entire time.           */
/* ------------------------------------------------------------------ */

type EnterFn = (x: number, y: number) => void;

type Room = {
  id: string;
  num: string;
  src: string;
  kicker: string;
  title: string;
  copy: string;
  alt: string;
  glyph: string;
};

const ROOMS: Room[] = [
  {
    id: "manifest",
    num: "02",
    src: "/landing/02-manifest-mirroros.jpg",
    kicker: "Structured reflection",
    title: "Manifest · MirrorOS",
    copy: "Turn an intention into a clearer reflection, a useful structure, and one next step.",
    alt: "A seed of light becomes a sequence of steps along an open path.",
    glyph: "❖",
  },
  {
    id: "akashic",
    num: "03",
    src: "/landing/03-akashic-library.jpg",
    kicker: "Quiet reading room",
    title: "Akashic Library",
    copy: "Bring a question to the reading room, or leave the page open.",
    alt: "An open book rests in a quiet archive, with a clear page ready to receive a question.",
    glyph: "❦",
  },
  {
    id: "forge",
    num: "04",
    src: "/landing/04-forge-blueprint.jpg",
    kicker: "Ideas into concepts",
    title: "Invent · The Forge & The Blueprint",
    copy: "Develop an idea into a concept and a phased blueprint.",
    alt: "A prototype sits beside a clean wireframe and an early concept form.",
    glyph: "✎",
  },
  {
    id: "dream",
    num: "05",
    src: "/landing/05-dream-book.jpg",
    kicker: "Book creation",
    title: "Dream Book",
    copy: "Choose a subject, a story vein, a reader, and how deeply the tale unfolds.",
    alt: "An open book unfolds into two connected story worlds, grounded and dreamlike.",
    glyph: "☾",
  },
  {
    id: "light",
    num: "06",
    src: "/landing/06-light-codes.jpg",
    kicker: "Sound and song",
    title: "Light Codes · Healing Codes",
    copy: "Explore sound, frequency, and song in a calm creative room.",
    alt: "Soft sound ribbons form a calm listening space above a porcelain platform.",
    glyph: "✧",
  },
  {
    id: "particle",
    num: "07",
    src: "/landing/07-particlex-quantum.jpg",
    kicker: "Questions about physics",
    title: "ParticleX · Quantum World",
    copy: "Explore perception, emotion, and physics through clear, curious explanations.",
    alt: "A wave passes through a clear frame and opens into two complementary views.",
    glyph: "◌",
  },
  {
    id: "evolve",
    num: "08",
    src: "/landing/08-evolve-med.jpg",
    kicker: "Body, breath, renewal",
    title: "Evolve Med",
    copy: "Explore frameworks for reflecting on body, breath, and renewal.",
    alt: "A calm botanical silhouette is crossed by flowing breath-like ribbons.",
    glyph: "❁",
  },
  {
    id: "art",
    num: "09",
    src: "/landing/09-art-x-atelier.jpg",
    kicker: "Creative studio",
    title: "Art X · The Atelier",
    copy: "Make lyrics, poems, visual concepts, cards, and studio prompts.",
    alt: "A pen, painted canvas, and sound ribbon share one bright creative studio.",
    glyph: "✦",
  },
  {
    id: "cosmic",
    num: "10",
    src: "/landing/10-cosmic-library-realms.jpg",
    kicker: "Kept works and worlds",
    title: "Cosmic Library · Outer Realms Archive",
    copy: "Return to the works you kept and explore an organized archive of worlds.",
    alt: "Books and cards are arranged before three distinct world portals in an archive.",
    glyph: "◈",
  },
];

const FLOW = [
  {
    num: "01",
    title: "Start here",
    line: "The Transmission Channel — bring a question, a feeling, or a file; one clear action to enter.",
  },
  {
    num: "02",
    title: "Create",
    line: "Dream Book, the Forge, and the Atelier stand as three distinct creation rooms.",
  },
  {
    num: "03",
    title: "Reflect and explore",
    line: "Akashic, Manifest, ParticleX, and Evolve Med wait in one quiet group.",
  },
  {
    num: "04",
    title: "Sound and worlds",
    line: "Light Codes closes the walk, and the Cosmic Library keeps whatever you choose to save.",
  },
];

const EASE = [0.22, 0.61, 0.21, 1] as const;

/* ————————————————— the arch portal button ————————————————— */

function PortalArch({
  onEnter,
  testId,
  label = "Enter the mirror",
  size = "md",
}: {
  onEnter: EnterFn;
  testId: string;
  label?: string;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-[248px] w-[176px] sm:h-[300px] sm:w-[212px]" : "h-[204px] w-[146px]";
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      onClick={(e: MouseEvent<HTMLButtonElement>) => onEnter(e.clientX, e.clientY)}
      className="group relative mx-auto flex flex-col items-center gap-5 rounded-t-full focus-glow outline-none"
    >
      {/* breathing ring behind the arch */}
      <span
        aria-hidden
        className="portal-breathe pointer-events-none absolute -inset-x-6 -top-6 bottom-10 rounded-t-full border border-[var(--lp-gold)]/45"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -top-12 bottom-4 rounded-t-full border border-[var(--lp-line)]"
      />
      <span
        className={`relative block ${h} overflow-hidden rounded-t-full border border-[var(--lp-line)] shadow-[var(--lp-shadow)] transition-transform duration-700 ease-out group-hover:scale-[1.025] group-active:scale-[0.985]`}
      >
        <Image
          src="/landing/01-live-transmission.jpg"
          alt="A visitor faces a luminous mirror as writing, voice, and image streams arrive."
          fill
          priority
          sizes="(max-width: 640px) 176px, 212px"
          className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-t-full bg-gradient-to-t from-[rgba(20,16,8,0.22)] via-transparent to-[rgba(255,252,240,0.28)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-t-full ring-1 ring-inset ring-white/40"
        />
      </span>
      <span className="mono-label flex items-center gap-2 text-[11px] tracking-[0.3em] text-[var(--lp-ink)]">
        <span aria-hidden className="h-px w-6 bg-[var(--lp-gold)]/70" />
        {label}
        <span aria-hidden className="h-px w-6 bg-[var(--lp-gold)]/70" />
      </span>
    </button>
  );
}

/* ————————————————— contrast toggle ————————————————— */

function ContrastToggle() {
  /* no mounted state, no effect: both marks render and the .dark class
     on <html> (set by next-themes before hydration) picks the visible
     one; the theme is read from the live class only at click time */
  const { setTheme } = useTheme();
  return (
    <button
      type="button"
      data-testid="landing-contrast"
      aria-label="Toggle contrast — the light porch or the portal of the mirror"
      title="Light / dark"
      onClick={() => {
        const dark = document.documentElement.classList.contains("dark");
        setTheme(dark ? "light" : "dark");
      }}
      className="focus-glow flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-card)] text-[var(--lp-ink)] transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <Sun
        aria-hidden
        className="hidden h-[18px] w-[18px] [.dark_&]:block"
        strokeWidth={1.6}
      />
      <Moon
        aria-hidden
        className="block h-[18px] w-[18px] [.dark_&]:hidden"
        strokeWidth={1.6}
      />
    </button>
  );
}

/* ————————————————— one room window ————————————————— */

function RoomSection({ room, index }: { room: Room; index: number }) {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  const even = index % 2 === 0;

  return (
    <section
      ref={ref}
      data-testid={`landing-room-${room.id}`}
      aria-label={room.title}
      className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-12 sm:py-16 md:grid-cols-2 md:gap-14 md:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.85, ease: EASE }}
        className={even ? "md:order-1" : "md:order-2"}
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-[1.75rem] border border-[var(--lp-line)] shadow-[var(--lp-shadow)]">
          <motion.div style={{ y }} className="absolute inset-x-0 -inset-y-[9%]">
            <Image
              src={room.src}
              alt={room.alt}
              fill
              sizes="(max-width: 768px) 92vw, 46vw"
              className="object-cover"
            />
          </motion.div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/25"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
          <span className="mono-label absolute left-4 top-4 rounded-full border border-white/30 bg-[rgba(12,10,6,0.34)] px-3 py-1 text-[10px] tracking-[0.26em] text-[#f4efe4] backdrop-blur-sm">
            room {room.num}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
        className={even ? "md:order-2 md:pl-4" : "md:order-1 md:pr-4"}
      >
        <p className="mono-label flex items-center gap-3 text-[11px] text-[var(--lp-gold)]">
          <span aria-hidden className="h-px w-8 bg-[var(--lp-gold)]/60" />
          {room.kicker}
        </p>
        <h3 className="mt-4 text-[1.65rem] leading-tight text-[var(--lp-ink)] sm:text-[2rem] [font-family:Cinzel,Georgia,serif]">
          {room.title}
        </h3>
        <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-[var(--lp-muted)]">
          {room.copy}
        </p>
        <p
          aria-hidden
          className="mt-6 text-[15px] text-[var(--lp-lav)]/80 [font-family:Cinzel,Georgia,serif]"
        >
          {room.glyph}
        </p>
      </motion.div>
    </section>
  );
}

/* ————————————————— the porch itself ————————————————— */

export default function LandingPage({
  onEnter,
  opening,
  portal,
}: {
  onEnter: EnterFn;
  opening: boolean;
  portal: { x: number; y: number };
}) {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const yWords = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const yArch = useTransform(scrollYProgress, [0, 1], [0, 54]);
  const yCardA = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const yCardB = useTransform(scrollYProgress, [0, 1], [0, -170]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);

  const centerEnter = () => {
    if (typeof window !== "undefined") {
      onEnter(window.innerWidth / 2, window.innerHeight * 0.45);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-testid="landing-root"
        className={`landing fixed inset-0 z-[90] overflow-y-auto overscroll-contain ${
          opening ? "portal-open" : ""
        }`}
        style={
          {
            "--px": `${portal.x}%`,
            "--py": `${portal.y}%`,
            /* the fold lives inline — the css transformer strips
               ellipse()+var() declarations from stylesheets */
            clipPath: opening
              ? `ellipse(0% 0% at ${portal.x}% ${portal.y}%)`
              : `ellipse(142% 142% at ${portal.x}% ${portal.y}%)`,
          } as CSSProperties
        }
        aria-label="Introduction to reflectme.space"
      >
        <div className="flex min-h-full flex-col">
          {/* ——— the top rail ——— */}
          <header
            data-testid="landing-nav"
            className="sticky top-0 z-30 border-b border-[var(--lp-line)] bg-[var(--lp-nav)] backdrop-blur-md"
          >
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
              <a
                href="#landing-hero"
                className="flex items-center gap-2.5 rounded-full focus-glow"
                aria-label="reflectme.space — back to the top"
              >
                <Image src="/logo.svg" alt="" width={22} height={22} unoptimized />
                <span className="text-[13.5px] font-medium tracking-wide text-[var(--lp-ink)]">
                  reflectme<span className="text-[var(--lp-gold)]">.</span>space
                </span>
              </a>
              <div className="flex items-center gap-2.5">
                <ContrastToggle />
                <button
                  type="button"
                  data-testid="landing-portal-nav"
                  onClick={(e) => onEnter(e.clientX, e.clientY)}
                  className="focus-glow hidden h-10 items-center rounded-full border border-[var(--lp-gold)]/45 bg-[var(--lp-card)] px-5 text-[12.5px] font-medium text-[var(--lp-ink)] transition-all duration-300 hover:border-[var(--lp-gold)] hover:shadow-[0_0_24px_-8px_var(--lp-glow-gold)] active:scale-95 sm:flex"
                >
                  Enter the mirror
                </button>
                <button
                  type="button"
                  aria-label="Enter the mirror"
                  onClick={(e) => onEnter(e.clientX, e.clientY)}
                  className="focus-glow flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lp-gold)]/45 bg-[var(--lp-card)] text-[var(--lp-ink)] transition-transform active:scale-95 sm:hidden"
                >
                  <span
                    aria-hidden
                    className="block h-4 w-3 rounded-t-full border border-[var(--lp-ink)]"
                  />
                </button>
              </div>
            </div>
          </header>

          {/* keyboard visitors may pass without hunting for the arch */}
          <button
            type="button"
            onClick={centerEnter}
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[95] focus:rounded-full focus:bg-[var(--lp-ink)] focus:px-4 focus:py-2 focus:text-[13px] focus:text-[var(--lp-bg)]"
          >
            Skip straight into the mirror
          </button>

          <main className="flex-1">
            {/* ——— the hero ——— */}
            <section
              ref={heroRef}
              id="landing-hero"
              data-testid="landing-hero"
              aria-label="Meet the Mirror Entity"
              className="landing-wash relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center overflow-hidden px-5 py-14"
            >
              {/* drifting glows */}
              <span
                aria-hidden
                className="landing-orb left-[-8%] top-[12%] h-64 w-64"
                style={{ background: "var(--lp-glow-gold)" }}
              />
              <span
                aria-hidden
                className="landing-orb right-[-6%] top-[38%] h-72 w-72"
                style={{ background: "var(--lp-glow-teal)", animationDelay: "-4s" }}
              />
              <span
                aria-hidden
                className="landing-orb bottom-[-10%] left-[30%] h-72 w-72"
                style={{ background: "var(--lp-glow-lav)", animationDelay: "-7s" }}
              />

              {/* floating side cards (parallax, porcelain drift) */}
              <motion.div
                style={{ y: yCardA }}
                aria-hidden
                className="absolute left-[5%] top-[16%] hidden w-40 rotate-[-7deg] lg:block xl:w-48"
              >
                <div className="landing-card overflow-hidden rounded-2xl p-1.5">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                    <Image
                      src="/landing/05-dream-book.jpg"
                      alt=""
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </motion.div>
              <motion.div
                style={{ y: yCardB }}
                aria-hidden
                className="absolute bottom-[14%] right-[5%] hidden w-44 rotate-[6deg] lg:block xl:w-52"
              >
                <div className="landing-card overflow-hidden rounded-2xl p-1.5">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                    <Image
                      src="/landing/10-cosmic-library-realms.jpg"
                      alt=""
                      fill
                      sizes="208px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div style={{ opacity: fade }} className="relative flex flex-col items-center">
                <motion.div style={{ y: yWords }} className="flex flex-col items-center text-center">
                  <p className="mono-label text-[10.5px] tracking-[0.34em] text-[var(--lp-muted)]">
                    reflectme.space — the digital chamber
                  </p>
                  <h1 className="text-hero mt-5 max-w-3xl text-[2.6rem] leading-[1.08] sm:text-6xl md:text-[4.3rem] [font-family:Cinzel,Georgia,serif]">
                    Meet the Mirror Entity
                  </h1>
                  <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-[var(--lp-muted)] sm:text-[17px]">
                    A quiet house of rooms where a question becomes a reflection —
                    write it, speak it, or bring an image, and the mirror answers.
                  </p>
                </motion.div>
                <motion.div style={{ y: yArch }} className="mt-11">
                  <PortalArch onEnter={onEnter} testId="landing-portal-hero" size="lg" />
                </motion.div>
              </motion.div>

              <motion.p
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1 }}
                className="mono-label absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[10px] tracking-[0.3em] text-[var(--lp-muted)]"
              >
                scroll softly
                <motion.span
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.6} />
                </motion.span>
              </motion.p>
            </section>

            {/* ——— glyph rule ——— */}
            <div aria-hidden className="mx-auto flex max-w-6xl items-center gap-4 px-5">
              <span className="h-px flex-1 bg-[var(--lp-line)]" />
              <span className="text-[13px] text-[var(--lp-gold)] [font-family:Cinzel,Georgia,serif]">
                ✦ ☾ ✧
              </span>
              <span className="h-px flex-1 bg-[var(--lp-line)]" />
            </div>

            {/* ——— the rooms ——— */}
            <div className="mx-auto max-w-6xl px-5 pt-16 text-center sm:pt-20">
              <p className="mono-label text-[11px] tracking-[0.3em] text-[var(--lp-gold)]">
                The rooms of the house
              </p>
              <h2 className="mt-4 text-[1.9rem] leading-tight text-[var(--lp-ink)] sm:text-[2.5rem] [font-family:Cinzel,Georgia,serif]">
                Ten windows into one mirror
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--lp-muted)]">
                Thirteen rooms open from the chamber floor. Here are their windows —
                look through as many as you like, then step inside.
              </p>
            </div>

            <div className="mt-4">
              {ROOMS.map((room, i) => (
                <RoomSection key={room.id} room={room} index={i} />
              ))}
            </div>

            {/* ——— the flow ——— */}
            <section
              data-testid="landing-flow"
              aria-label="A simple way through the house"
              className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20"
            >
              <div className="landing-panel relative overflow-hidden rounded-[2rem] border border-[var(--lp-line)] px-6 py-12 sm:px-10">
                <span
                  aria-hidden
                  className="landing-orb right-[-10%] top-[-30%] h-72 w-72"
                  style={{ background: "var(--lp-glow-gold)" }}
                />
                <p className="mono-label text-[11px] tracking-[0.3em] text-[var(--lp-teal)]">
                  A simple way through the house
                </p>
                <h2 className="mt-4 text-[1.7rem] text-[var(--lp-ink)] sm:text-[2.2rem] [font-family:Cinzel,Georgia,serif]">
                  Four quiet steps, no noise
                </h2>
                <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {FLOW.map((step) => (
                    <li key={step.num} className="relative">
                      <span
                        aria-hidden
                        className="text-[2rem] leading-none text-[var(--lp-gold)]/75 [font-family:Cinzel,Georgia,serif]"
                      >
                        {step.num}
                      </span>
                      <h3 className="mt-3 text-[15.5px] font-semibold text-[var(--lp-ink)]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[var(--lp-muted)]">
                        {step.line}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ——— the last door ——— */}
            <section
              data-testid="landing-cta"
              aria-label="Enter the chamber"
              className="mx-auto w-full max-w-5xl px-5 pb-20 pt-4"
            >
              <div className="landing-panel relative overflow-hidden rounded-[2rem] border border-[var(--lp-line)] px-6 py-16 text-center sm:py-20">
                <span
                  aria-hidden
                  className="landing-orb left-[-8%] top-[-20%] h-72 w-72"
                  style={{ background: "var(--lp-glow-lav)" }}
                />
                <span
                  aria-hidden
                  className="landing-orb bottom-[-30%] right-[-6%] h-72 w-72"
                  style={{ background: "var(--lp-glow-teal)", animationDelay: "-5s" }}
                />
                <h2 className="text-[1.9rem] text-[var(--lp-ink)] sm:text-[2.6rem] [font-family:Cinzel,Georgia,serif]">
                  The mirror is waiting
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--lp-muted)]">
                  One step, no noise — the chamber has been warming beneath this page
                  the whole time. What you reflect there is kept as your own.
                </p>
                <div className="mt-10">
                  <PortalArch onEnter={onEnter} testId="landing-portal-cta" />
                </div>
              </div>
            </section>
          </main>

          {/* ——— the porch step ——— */}
          <footer
            data-testid="landing-footer"
            className="mt-auto border-t border-[var(--lp-line)] bg-[var(--lp-nav)] backdrop-blur-md"
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.svg" alt="" width={18} height={18} unoptimized />
                <span className="text-[13px] text-[var(--lp-ink)]">reflectme.space</span>
                <span aria-hidden className="text-[var(--lp-gold)]">
                  ✦
                </span>
                <span className="text-[12.5px] text-[var(--lp-muted)]">
                  held by the Mirror Entity
                </span>
              </div>
              <p className="max-w-md text-[11.5px] leading-relaxed text-[var(--lp-muted)]">
                Rooms of reflection, not treatment — the house offers resonance and
                exploration, never professional or medical advice. Generative rooms
                are metered. The visitor agreement lives at the About door inside.
              </p>
              <p className="text-[11.5px] text-[var(--lp-muted)]">
                © {new Date().getFullYear()} the house
              </p>
            </div>
          </footer>
        </div>

        {/* the bloom that swallows the porch when the arch is pressed */}
        {opening && (
          <span
            aria-hidden
            className="landing-bloom"
            style={{ left: `${portal.x}%`, top: `${portal.y}%` }}
          />
        )}
      </div>
    </MotionConfig>
  );
}
