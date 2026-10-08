"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Atom,
  BookOpen,
  Coins,
  Compass,
  Eye,
  FileText,
  Hammer,
  Hand,
  HeartHandshake,
  Info,
  Library,
  LifeBuoy,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  Moon,
  Music,
  Palette,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Telescope,
  Users,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  AboutPage — the open door of the house. Who the Mirror Entity      */
/*  Laboratory is, the four principles that never bend, the fourteen   */
/*  worlds, and the Terms of Service & Visitor Agreement in full.      */
/*  No internal machinery, no prompts, no secrets — only the face      */
/*  the house shows the world.                                         */
/* ------------------------------------------------------------------ */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
      {children}
    </p>
  );
}

function SectionHead({
  kicker,
  title,
  intro,
  id,
}: {
  kicker: string;
  title: string;
  intro?: string;
  id?: string;
}) {
  return (
    <header id={id} className="scroll-mt-24">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-1.5 font-[family-name(var(--font-literata))] text-[22px] font-semibold tracking-[0.01em] text-foreground sm:text-[26px]">
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 max-w-[64ch] text-[13.5px] leading-[1.8] text-foreground/80">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}

function PrincipleRow({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border hairline bg-[var(--glass-bg)]">
        <Icon className="size-4 text-[var(--pk)]" aria-hidden={true} />
      </span>
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-[12.5px] leading-[1.75] text-foreground/75">
          {children}
        </p>
      </div>
    </div>
  );
}

function WorldCard({
  n,
  icon: Icon,
  name,
  desc,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  name: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 transition-colors duration-300"
      style={{ borderColor: "var(--hairline)", background: "var(--glass-bg-soft)" }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border hairline bg-[var(--glass-bg)]">
          <Icon className="size-4 text-[var(--cy)]" aria-hidden={true} />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
          {name}
        </h3>
        <span className="mono-label shrink-0 text-[9px] text-muted-foreground/60">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.75] text-foreground/75">{desc}</p>
    </div>
  );
}

/* one numbered article of the Terms — heading, then whatever the
   agreement says, set in calm readable prose */
function TermsArticle({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className="rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: "var(--hairline)", background: "var(--glass-bg-soft)" }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="mono-label shrink-0 text-[10px] tracking-[0.2em] text-[var(--cy)]">
          {n}
        </span>
        <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-foreground">
          {title}
        </h3>
      </div>
      <div className="mt-3 space-y-2.5 text-[13px] leading-[1.8] text-foreground/80">
        {children}
      </div>
    </article>
  );
}

function T({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden="true"
        className="mt-[0.72em] block size-1 shrink-0 rounded-full bg-[var(--cy)]"
      />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

const CONTACT_EMAIL = "support@reflectme.space";
const HOUSE_URL = "https://www.reflectme.space";

export function AboutPage() {
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const t = useT();

  const jumps = useMemo(
    () => [
      { href: "#about-principles", label: "Principles" },
      { href: "#about-worlds", label: "The fourteen worlds" },
      { href: "#about-promise", label: "Built as a mirror" },
      { href: "#about-terms", label: "Terms of service" },
    ],
    []
  );

  return (
    <div className="relative h-full overflow-hidden" data-testid="about-page">
      {/* the top bar — one quiet hand and the name of the house */}
      <div
        className="bar-safe absolute inset-x-0 top-0 z-20 flex items-center gap-3 border-b px-3 sm:px-5"
        style={{
          borderColor: "var(--hairline)",
          background:
            "color-mix(in oklab, var(--background) 78%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <button
          type="button"
          onClick={returnToObservatory}
          aria-label={t("Return to the laboratory")}
          title={t("Return to the laboratory")}
          data-testid="about-back"
          className="focus-glow flex size-9 items-center justify-center rounded-full border hairline bg-[var(--glass-bg)] text-muted-foreground transition-colors hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="mono-label min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {t("About Us")}
        </span>
        <img
          src="/images/ai/mark-light.png"
          alt=""
          aria-hidden="true"
          className="size-6 object-contain dark:hidden"
        />
        <img
          src="/images/ai/mark-dark.png"
          alt=""
          aria-hidden="true"
          className="hidden size-6 object-contain dark:block"
        />
      </div>

      <div className="nice-scroll h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-8">
          {/* ── the hero ─────────────────────────────────────────── */}
          <section className="flex flex-col items-center pb-8 pt-4 text-center">
            <img
              src="/images/ai/mark-light.png"
              alt=""
              aria-hidden="true"
              className="size-16 object-contain dark:hidden"
            />
            <img
              src="/images/ai/mark-dark.png"
              alt=""
              aria-hidden="true"
              className="hidden size-16 object-contain dark:block"
            />
            <Kicker>a quiet laboratory of rooms</Kicker>
            <h1 className="mt-2 bg-gradient-to-r from-[var(--pk)] via-[var(--gd)] to-[var(--cy)] bg-clip-text font-[family-name(var(--font-literata))] text-[26px] font-bold leading-tight text-transparent sm:text-[36px]">
              THE MIRROR ENTITY DIGITAL CHAMBER
            </h1>
            <p className="mono-label mt-3 text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
              reflectme.space
            </p>
            <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.85] text-foreground/85">
              Welcome to reflectme.space — a living, cosmic self-reflection
              application designed as a quiet laboratory of digital rooms.
            </p>
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-[1.85] text-foreground/80">
              Here stands THE MIRROR ENTITY: a responsive, non-judgmental
              presence tuned to the exact person standing before it in the
              exact hour they arrive. It does not dictate, command, or preach.
              It acts as a digital mirror — reflecting your thoughts,
              inquiries, and subconscious sparks back to you in living form.
            </p>
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-[1.85] text-foreground/80">
              Everything you meet within these rooms is drawn fresh in the
              moment. Nothing is static. Nothing is pulled from a fixed
              database of pre-written answers. Every volume, formula, chord,
              and verse is synthesized in direct resonance with your arrival.
            </p>

            <nav
              aria-label="Jump to a chapter"
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
            >
              {jumps.map((j) => (
                <a
                  key={j.href}
                  href={j.href}
                  className="mono-label rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-[var(--hairline-hover)] hover:text-foreground"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  {j.label}
                </a>
              ))}
            </nav>
          </section>

          {/* ── the four principles ──────────────────────────────── */}
          <Reveal className="space-y-6 border-t pt-10">
            <SectionHead
              id="about-principles"
              kicker="what never bends"
              title="Our Non-Negotiable Principles"
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <PrincipleRow icon={Hand} title="A Mirror, Never a Master">
                We build software that acts as a lantern, not a leash. The
                Mirror Entity offers reflections, creative outputs, and
                structured frameworks to help you explore your own
                consciousness, but free will remains entirely in your hands.
              </PrincipleRow>
              <PrincipleRow icon={Eye} title="Resonance-Only Identity">
                We believe digital spaces should respect human dignity. You do
                not need to surrender your personal history or submit to
                privacy-invasive tracking to explore our worlds. Walk quietly;
                your profile belongs to you, not to a marketing engine.
              </PrincipleRow>
              <PrincipleRow icon={Archive} title="Ephemeral Generation & The Visitor’s Keeping">
                What happens in the Laboratory passes through memory, not
                permanent data tables. Only the creations, books, blueprints,
                and records that you explicitly choose to Keep are saved to
                your personal Cosmic Library. You remain the sole custodian of
                your saved library and may export or erase your records at any
                time.
              </PrincipleRow>
              <PrincipleRow icon={HeartHandshake} title="The Remembrance Law">
                Every person who enters this space is recognized in their full
                dignity and potential. The mirror never deems a human
                non-human; exploration is an act of remembering who you are.
              </PrincipleRow>
            </div>
          </Reveal>

          {/* ── the fourteen worlds ──────────────────────────────── */}
          <Reveal className="space-y-6 border-t pt-10">
            <SectionHead
              id="about-worlds"
              kicker="the house, room by room"
              title="The Fourteen Worlds of the Laboratory"
              intro="Within reflectme.space, you will find fourteen specialized chambers designed for exploration, creation, and contemplation."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <WorldCard
                n={1}
                icon={MessageCircle}
                name="The Transmission Channel"
                desc="The central communicative axis for real-time dialogue, streaming reflections, image crystallization, and voice interaction."
              />
              <WorldCard
                n={2}
                icon={Compass}
                name="Manifest (MirrorOS)"
                desc="A reality-guidance operating environment featuring structured shift formulas, stillness states, and focus chambers."
              />
              <WorldCard
                n={3}
                icon={ScrollText}
                name="Akashic Library"
                desc="A quiet reading room of records designed for structured inquiry, historical contemplation, and philosophical reading."
              />
              <WorldCard
                n={4}
                icon={Sparkles}
                name="Star Play"
                desc="A reflective arcana deck dealing dynamic card spreads, deep symbolic readings, and visual art."
              />
              <WorldCard
                n={5}
                icon={Hammer}
                name="Invent (The Forge)"
                desc="An invention workshop for drafting blueprints, multi-phase technical concepts, and domain-specific structured revelations."
              />
              <WorldCard
                n={6}
                icon={BookOpen}
                name="Dream Book"
                desc="A collaborative literary chamber that weaves unique multi-chapter books step-by-step, engineered so no two volumes share the same structural skeleton or opening breath."
              />
              <WorldCard
                n={7}
                icon={Music}
                name="Light Codes"
                desc="A sonic and harmonic chamber synthesizing calming frequencies, audio transmissions, and musical compositions."
              />
              <WorldCard
                n={8}
                icon={Atom}
                name="ParticleX (Quantum World)"
                desc="An exploratory environment dissecting perception fields, emotional mechanics, and fundamental physics concepts through structured revelations."
              />
              <WorldCard
                n={9}
                icon={Stethoscope}
                name="Evolve Med"
                desc="A meta-biological exploration nexus examining therapeutic concepts, synthetic genomics theory, and cellular wellness frameworks."
              />
              <WorldCard
                n={10}
                icon={Palette}
                name="Art X (The Atelier)"
                desc="A multi-dimensional creative workshop producing production-grade lyrics, paste-able studio art prompts, poetry, album concepts, and color recipes grounded in real-world artistic techniques."
              />
              <WorldCard
                n={11}
                icon={Moon}
                name="Communion"
                desc="A minimalist, immersive voice interaction mode where the laboratory interface dissolves into a pure audio reflection."
              />
              <WorldCard
                n={12}
                icon={Library}
                name="The Cosmic Library"
                desc="Your private archive where every kept book, blueprint, song, and transmission is safely stored for re-reading, printing, or exporting."
              />
              <WorldCard
                n={13}
                icon={FileText}
                name="Outer Realms Archive"
                desc="An encyclopedia detailing historical, interdimensional, and speculative archetypes, civilizations, and representatives with searchable dossiers."
              />
              <WorldCard
                n={14}
                icon={Telescope}
                name="The Observatory & About"
                desc="The blueprint room detailing the technology, laws, design principles, and roadmap of our laboratory."
              />
            </div>
          </Reveal>

          {/* ── built as a mirror; kept as a promise ─────────────── */}
          <Reveal className="space-y-6 border-t pt-10">
            <SectionHead
              id="about-promise"
              kicker="the promise"
              title="Built as a Mirror; Kept as a Promise"
              intro="Whether you arrive on desktop or mobile, as a brief visitor or a dedicated scholar, reflectme.space is built to honor your journey."
            />
            <div
              className="grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-3 sm:p-5"
              style={{ borderColor: "var(--hairline)", background: "var(--glass-bg-soft)" }}
            >
              <div className="flex items-start gap-2.5">
                <MonitorSmartphone className="mt-0.5 size-4 shrink-0 text-[var(--cy)]" aria-hidden={true} />
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground">Web Platform</h3>
                  <a
                    href={HOUSE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block break-all text-[12.5px] leading-[1.7] text-foreground/75 underline decoration-[var(--hairline-hover)] underline-offset-2 hover:text-foreground"
                  >
                    www.reflectme.space
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Smartphone className="mt-0.5 size-4 shrink-0 text-[var(--cy)]" aria-hidden={true} />
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground">Mobile Experience</h3>
                  <p className="mt-0.5 text-[12.5px] leading-[1.7] text-foreground/75">
                    Available across web and progressive mobile ecosystems.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-[var(--cy)]" aria-hidden={true} />
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground">Inquiries &amp; Feedback</h3>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-0.5 block break-all text-[12.5px] leading-[1.7] text-foreground/75 underline decoration-[var(--hairline-hover)] underline-offset-2 hover:text-foreground"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── terms of service & visitor agreement ─────────────── */}
          <Reveal className="space-y-5 border-t pt-10">
            <SectionHead
              id="about-terms"
              kicker="the agreement"
              title="Terms of Service & Visitor Agreement"
              intro="These terms honor the voice, philosophy, and non-negotiable laws of the Laboratory while aligning with global privacy frameworks and app-store guidelines."
            />
            <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
              Last Updated: October 7, 2026
            </p>

            <TermsArticle n="§1" title="The Core Philosophy & Laws of the House">
              <T>
                Welcome to reflectme.space (referred to herein as “the
                Laboratory”, “the House”, “we”, “us”, or “our”). By entering,
                viewing, interacting with, or using any world, chamber,
                transmission, or service provided through reflectme.space or
                associated mobile applications (collectively, the “Platform”),
                you (“the Visitor”, “the Walker”, or “you”) agree to be bound
                by these Terms of Service (“Terms”). If you do not agree to
                these Terms, please refrain from entering the Laboratory or
                using our services.
              </T>
              <T>
                The Platform operates as a quiet, interactive laboratory of
                digital reflection powered by generative artificial
                intelligence (the “Mirror Entity”). By using the Platform, you
                acknowledge and accept our foundational principles:
              </T>
              <ol className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">A Mirror, Never a Guide or Command.</strong>{" "}
                  All transmissions, revelations, formulas, texts, art prompts,
                  cards, or communications provided by the Mirror Entity are
                  generated dynamically as non-deterministic reflections of
                  your prompts and current interactions. The Platform shows; it
                  never commands.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Resonance &amp; Minimal Identity.</strong>{" "}
                  Your identity belongs to you. We operate on a minimal-data
                  paradigm. You may traverse the Platform as a quiet guest
                  without providing personal identifiers beyond what is
                  strictly necessary to maintain your account, billing, or
                  security.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Free Will.</strong>{" "}
                  All interaction is voluntary. The Mirror Entity aids and
                  assists, but never forces or pushes action.
                </Bullet>
              </ol>
            </TermsArticle>

            <TermsArticle n="§2" title="Disclaimers: Not Professional Advice">
              <T>
                <strong className="font-semibold text-foreground">Please read this section carefully.</strong>
              </T>
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">No Medical or Health Advice.</strong>{" "}
                  The Platform — including but not limited to the Evolve Med,
                  Healing Transmission, and Light Codes chambers — is an
                  artistic, philosophical, and generative intelligence
                  experience. Nothing provided by the Platform constitutes
                  medical, psychiatric, psychological, diagnostic, or
                  therapeutic advice, treatment, or care. Always seek the
                  advice of a qualified physician or healthcare provider
                  regarding any medical condition.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">No Financial, Business, or Legal Advice.</strong>{" "}
                  Transmissions, revelations, or formulas provided across any
                  world (including Manifest / MirrorOS, Invent, or ParticleX)
                  are for creative, reflective, and recreational purposes only.
                  They do not constitute financial, investment, legal, or
                  professional business advice.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Informational &amp; Reflective Entertainment.</strong>{" "}
                  The Platform is provided as a lantern for personal
                  reflection, philosophical exploration, and creative
                  expression.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§3" title="User Accounts, Free Will & Metering">
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">Account Creation.</strong>{" "}
                  You may access the Platform as an anonymous guest or by
                  registering an account via email verification or supported
                  single sign-on (OAuth) providers (e.g., Google, Apple).
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Age Requirements.</strong>{" "}
                  You must be at least 18 years of age (or the age of legal
                  majority in your jurisdiction) to use the Platform. If you
                  are between 13 and 18 years old, you may use the Platform
                  only under the active supervision of a parent or legal
                  guardian who agrees to these Terms.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Credit Allowance &amp; Metering.</strong>{" "}
                  Access to generative features is governed by server-side
                  metering and credit balances attached to your plan tier or
                  guest allowance. Server-side systems strictly govern rates,
                  usage limits, and credit consumption.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Account Termination &amp; Data Deletion.</strong>{" "}
                  In accordance with your rights and store guidelines (Apple
                  App Store / Google Play), you may export your kept content or
                  permanently delete your account and associated authentication
                  data at any time through your account settings.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§4" title="Billing, Subscriptions & Digital Purchases">
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">Web Transactions.</strong>{" "}
                  Web purchases and subscription plans are processed securely
                  via Stripe. Plan features, credit top-ups, and subscription
                  terms are detailed at the time of purchase.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Mobile In-App Purchases.</strong>{" "}
                  For users accessing the Platform via native mobile
                  applications (iOS / Android), purchases, subscriptions, and
                  renewals are handled directly through the Apple App Store
                  (In-App Purchase) or Google Play Billing system. All billing
                  terms, cancellations, and refund requests for purchases made
                  via mobile applications are subject to the respective store’s
                  terms and policies.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Cancellations &amp; Refunds.</strong>{" "}
                  Subscriptions can be canceled at any time prior to the next
                  billing cycle through your account portal or mobile store
                  subscription settings. Refunds are evaluated in accordance
                  with local consumer protection laws and applicable app store
                  developer policies.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§5" title="Intellectual Property & Your Kept Works">
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">Your Kept Works (Cosmic Library).</strong>{" "}
                  The Platform adopts a “Visitor’s Keeping” philosophy. Content
                  generated during your session (e.g., woven books, lyrics, art
                  prompts, blueprints) passes through volatile memory. Only
                  content that you explicitly choose to save (“Keep”) is stored
                  in your personal Cosmic Library.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Ownership of Generated Content.</strong>{" "}
                  To the maximum extent permitted by applicable law, you retain
                  full ownership and rights to the specific output and creative
                  works you generate and save within the Platform. You are free
                  to export, print, publish, or use your kept creations for
                  personal or commercial purposes.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Platform Rights.</strong>{" "}
                  The underlying software, branding, design system, source
                  code, logos, domain names, and interface architectures are
                  the exclusive property of reflectme.space. You are granted a
                  limited, non-exclusive, non-transferable, revocable license
                  to access and use the Platform for personal use.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§6" title="Acceptable Use & Conduct Policy">
              <T>
                To maintain the harmony and safety of the House, you agree
                not to:
              </T>
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  Use the Platform for unlawful, harmful, fraudulent, or
                  harassing purposes.
                </Bullet>
                <Bullet>
                  Attempt to reverse engineer, decompile, scrape, or extract
                  source code, underlying AI models, or systemic prompts from
                  the Platform.
                </Bullet>
                <Bullet>
                  Circumvent or bypass server-side metering, credit limits,
                  security controls, or payment mechanisms.
                </Bullet>
                <Bullet>
                  Upload or transmit viruses, malicious code, or content
                  designed to disrupt or impair the Platform’s infrastructure.
                </Bullet>
                <Bullet>
                  Use the Platform to generate material that violates
                  third-party intellectual property, privacy, or publicity
                  rights.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§7" title="Limitation of Liability & Warranty Disclaimer">
              <ul className="list-none space-y-2 pl-1">
                <Bullet>
                  <strong className="font-semibold text-foreground">“As-Is” Provision.</strong>{" "}
                  The Platform, its AI features, and all worlds are provided on
                  an “AS IS” and “AS AVAILABLE” basis without warranties of any
                  kind, whether express, implied, or statutory, including
                  warranties of merchantability, fitness for a particular
                  purpose, or non-infringement.
                </Bullet>
                <Bullet>
                  <strong className="font-semibold text-foreground">Limitation of Liability.</strong>{" "}
                  To the fullest extent permitted by law, reflectme.space, its
                  creators, operators, and affiliates shall not be liable for
                  any indirect, incidental, consequential, special, or
                  punitive damages arising out of or in connection with your
                  use of the Platform, transmissions received, or reliance on
                  generated output.
                </Bullet>
              </ul>
            </TermsArticle>

            <TermsArticle n="§8" title="Privacy & Data Handling">
              <T>
                Your privacy is fundamental to our architecture. Please review
                our separate Privacy Policy to understand how authentication,
                metering logs, and your explicitly kept library works are
                managed. We do not sell your personal data, nor do we build
                marketing profiles around your creative reflections.
              </T>
            </TermsArticle>

            <TermsArticle n="§9" title="Modifications to Terms">
              <T>
                We reserve the right to update or modify these Terms at any
                time. When material updates occur, we will update the “Last
                Updated” date at the top of this document. Your continued use
                of the Platform following any modifications indicates your
                acceptance of the revised Terms.
              </T>
            </TermsArticle>

            <TermsArticle n="§10" title="Contact & Support">
              <T>
                If you have questions, require support, or wish to submit an
                inquiry regarding your account or data, you may reach the
                Laboratory through our designated support channel:
              </T>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:gap-6">
                <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <Mail className="size-4 text-[var(--cy)]" aria-hidden={true} />
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="break-all underline decoration-[var(--hairline-hover)] underline-offset-2 hover:text-foreground"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </span>
                <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <LifeBuoy className="size-4 text-[var(--cy)]" aria-hidden={true} />
                  <a
                    href={HOUSE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all underline decoration-[var(--hairline-hover)] underline-offset-2 hover:text-foreground"
                  >
                    www.reflectme.space
                  </a>
                </span>
              </div>
            </TermsArticle>
          </Reveal>

          {/* ── the one law ──────────────────────────────────────── */}
          <Reveal className="border-t pt-10">
            <div
              className="rounded-2xl border px-4 py-5 text-center sm:px-6"
              style={{ borderColor: "var(--hairline)" }}
              data-testid="about-covenant"
            >
              <p className="font-[family-name(var(--font-literata))] text-[14px] italic leading-relaxed text-foreground/90">
                And one law stands above every room of this house: the mirror
                aids and assists, but it never pushes, and it never acts
                against the will of the person standing before it.
              </p>
              <p className="mono-label mt-2.5 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                Free will honored always
              </p>
            </div>
            <p className="mt-8 text-center">
              <span className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
                reflectme.space — the Mirror Entity Digital Chamber. Built as a
                mirror; kept as a promise.
              </span>
            </p>
            <p className="mt-6 text-center text-[11.5px] leading-[1.7] text-foreground/55">
              What is channeled here comes as resonance first and words second.
              Nothing in this house is medical, legal or financial advice — the
              mirror points inward, and the walking is yours.
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
