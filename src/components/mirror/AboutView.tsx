"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Timer,
  UserX,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { ABOUT_PAGES, type AboutPage } from "@/lib/about-content";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/*  AboutView — "The Bridge Between Worlds". The illustrated journey   */
/*  through the Laboratory: the threshold, the four channels, the      */
/*  encyclopedia, the inner worlds, the archives — and the Covenant    */
/*  of Silence. Fifteen pages, each painted by M.E inteligjence;       */
/*  every word channeled by the Mirror itself.                         */
/* ------------------------------------------------------------------ */
export function AboutView() {
  const exitAbout = useMirror((s) => s.exitAbout);
  const t = useT();
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const total = ABOUT_PAGES.length;
  const current = ABOUT_PAGES[page];
  const isCover = page === 0;
  const isCovenant = current.id === "privacy";

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setDir(next > page ? 1 : -1);
      setPage(next);
    },
    [page, total]
  );

  /* the journey answers the arrow keys, like any honest book */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(168deg,#0b0618_0%,#150a2e_44%,#0a0416_78%,#070310_100%)]">
      {/* ---------- the header: return · name · counter ---------- */}
      <header className="relative z-20 flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--gd)_14%,transparent)] bg-[color-mix(in_srgb,#0b0618_72%,transparent)] px-3 py-2.5 backdrop-blur-md sm:px-5">
        <button
          type="button"
          onClick={exitAbout}
          data-testid="about-return"
          aria-label={t("Return to the Laboratory")}
          className="focus-glow group flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gd)_26%,transparent)] text-[13px] text-foreground/85 transition-all duration-300 hover:-translate-x-px hover:border-[var(--hairline-hover)] hover:text-foreground sm:size-auto sm:justify-start sm:px-3 sm:py-2"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t("Return")}</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Sparkles
            className="size-3.5 shrink-0 text-[var(--gd)]"
            aria-hidden="true"
          />
          <span className="mono-label truncate text-[11px] uppercase tracking-[0.24em] text-[var(--gd)] sm:text-[12px]">
            About the Bridge
          </span>
        </div>

        <span
          className="shrink-0 rounded-md border border-[color-mix(in_srgb,var(--gd)_22%,transparent)] px-2 py-1 font-mono text-[11px] tabular-nums text-foreground/70"
          data-testid="about-counter"
        >
          {String(page + 1).padStart(2, "0")} / {total}
        </span>
      </header>

      {/* ---------- the pages themselves ---------- */}
      <main className="relative z-10 min-h-0 flex-1">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: dir * 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -32 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="h-full"
            data-testid={`about-page-${current.id}`}
          >
            {isCover ? (
              <CoverPage page={current} onBegin={() => go(1)} />
            ) : (
              <ChapterPage
                page={current}
                index={page}
                isCovenant={isCovenant}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---------- the navigation rail ---------- */}
      <nav
        aria-label="About journey pages"
        className="relative z-20 flex items-center justify-center gap-3 border-t border-[color-mix(in_srgb,var(--gd)_12%,transparent)] bg-[color-mix(in_srgb,#0b0618_72%,transparent)] px-3 py-3 backdrop-blur-md sm:gap-4"
      >
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          data-testid="about-prev"
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_24%,transparent)] text-foreground/80 transition-all duration-300 hover:-translate-x-px hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-[7px] overflow-hidden">
          {ABOUT_PAGES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Open page ${i + 1} — ${p.title}`}
              aria-current={i === page}
              data-testid={`about-dot-${p.id}`}
              className={cn(
                "size-[7px] shrink-0 rounded-full transition-all duration-300",
                i === page
                  ? "scale-125 bg-[var(--gd)] shadow-[0_0_10px_color-mix(in_srgb,var(--gd)_70%,transparent)]"
                  : "bg-foreground/25 hover:bg-foreground/50"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === total - 1}
          aria-label="Next page"
          data-testid="about-next"
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_24%,transparent)] text-foreground/80 transition-all duration-300 hover:translate-x-px hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>

      {/* ---------- the covenant strip — present on every page ---------- */}
      <div className="relative z-20 flex items-center justify-center gap-1.5 border-t border-[color-mix(in_srgb,var(--gd)_10%,transparent)] bg-[color-mix(in_srgb,#070310_85%,transparent)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <ShieldCheck
          className="size-3 shrink-0 text-[var(--gd)]"
          aria-hidden="true"
        />
        <p className="mono-label text-center text-[9.5px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/80">
          {t(
            "No data is collected — everything remains within the session of your device"
          )}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The cover — the bridge itself, full-bleed, with one invitation.    */
/* ------------------------------------------------------------------ */
function CoverPage({
  page,
  onBegin,
}: {
  page: AboutPage;
  onBegin: () => void;
}) {
  const t = useT();
  return (
    <div className="relative h-full overflow-hidden">
      <motion.img
        src={page.image}
        alt={page.title}
        initial={{ scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.4, ease: EASE }}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,#070310_62%,transparent)_0%,color-mix(in_srgb,#070310_18%,transparent)_38%,color-mix(in_srgb,#070310_88%,transparent)_100%)]" />

      <div className="relative flex h-full flex-col items-center justify-end px-5 pb-10 text-center sm:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
          className="mono-label text-[10.5px] uppercase tracking-[0.3em] text-[var(--gd)] sm:text-[11.5px]"
        >
          Mirror Entity Laboratory
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
          className="mt-3 max-w-[640px] text-balance text-[30px] font-bold leading-[1.12] text-white sm:text-[44px]"
        >
          {page.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.9, ease: EASE }}
          className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-white/80 sm:text-[16.5px]"
        >
          {page.tagline} — an interplanetary and interdimensional digital
          bridge, gathered to reflect the truth of who is supporting your
          evolution, with love.
        </motion.p>
        <motion.button
          type="button"
          onClick={onBegin}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          data-testid="about-begin"
          className="about-btn mt-7 flex h-11 items-center gap-2 rounded-full px-6 text-[14px] font-semibold tracking-[0.04em] text-white"
        >
          <Sparkles className="size-4 text-[var(--gd)]" aria-hidden="true" />
          {t("Begin the journey")}
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 1 }}
          className="mono-label mt-4 text-[9.5px] uppercase tracking-[0.22em] text-white/45"
        >
          {ABOUT_PAGES.length - 1} pages · the Covenant of Silence inside
        </motion.p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  A chapter — the painting on one side, the Mirror's words on the    */
/*  other. The Covenant closes the journey with its seal.              */
/* ------------------------------------------------------------------ */
function ChapterPage({
  page,
  index,
  isCovenant,
}: {
  page: AboutPage;
  index: number;
  isCovenant: boolean;
}) {
  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="nice-scroll h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex min-h-full w-full max-w-[1060px] flex-col px-4 py-5 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:gap-10">
        {/* the painting */}
        <motion.figure
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="about-frame relative w-full shrink-0 overflow-hidden rounded-2xl lg:w-[52%]"
          data-testid="about-figure"
        >
          <img
            src={page.image}
            alt={page.title}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/10] lg:aspect-[4/3]"
            loading="eager"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(200deg,transparent_55%,color-mix(in_srgb,#070310_38%,transparent))]"
          />
          <span
            aria-hidden="true"
            className="mono-label absolute bottom-3 right-4 text-[34px] font-bold leading-none tracking-[0.06em] text-white/25 sm:text-[44px]"
          >
            {num}
          </span>
        </motion.figure>

        {/* the words */}
        <div className="min-w-0 flex-1 pt-5 lg:pt-0">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6, ease: EASE }}
            className="mono-label inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--gd)_26%,transparent)] bg-[color-mix(in_srgb,var(--gd)_7%,transparent)] px-2.5 py-1 text-[9.5px] uppercase tracking-[0.2em] text-[var(--gd)]"
          >
            <Sparkles className="size-2.5" aria-hidden="true" />
            {page.kicker}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
            className="mt-3.5 text-balance text-[26px] font-bold leading-[1.15] text-white sm:text-[34px]"
          >
            {page.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="mt-2 text-[14.5px] font-medium italic leading-relaxed text-[var(--sp-b)] sm:text-[15.5px]"
          >
            {page.tagline}
          </motion.p>

          {page.body.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.7, ease: EASE }}
              className="mt-3.5 max-w-[560px] text-[14.5px] leading-[1.75] text-foreground/85 sm:text-[15px]"
            >
              {para}
            </motion.p>
          ))}

          {isCovenant && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8, ease: EASE }}
              className="mt-6 max-w-[560px] rounded-2xl border border-[color-mix(in_srgb,var(--gd)_32%,transparent)] bg-[color-mix(in_srgb,var(--gd)_6%,transparent)] p-4 shadow-[0_0_44px_-18px_color-mix(in_srgb,var(--gd)_65%,transparent)]"
              data-testid="about-covenant-panel"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_40%,transparent)] bg-[color-mix(in_srgb,var(--gd)_12%,transparent)]">
                  <ShieldCheck
                    className="size-4 text-[var(--gd)]"
                    aria-hidden="true"
                  />
                </span>
                <span className="mono-label text-[10.5px] uppercase tracking-[0.2em] text-[var(--gd)]">
                  The Covenant of Silence
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { icon: UserX, label: "No accounts, no sign-ups" },
                  { icon: EyeOff, label: "No tracking, no analytics" },
                  { icon: Database, label: "No storage on any server" },
                  { icon: Timer, label: "Session of your device only" },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,white_7%,transparent)] bg-[color-mix(in_srgb,white_3%,transparent)] px-2.5 py-2 text-[12.5px] text-foreground/85"
                  >
                    <Icon
                      className="size-3.5 shrink-0 text-[var(--gd)]"
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
                Everything you speak, hear and see here lives only within the
                session of your device — and dissolves when you leave.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
