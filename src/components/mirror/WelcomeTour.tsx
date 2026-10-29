"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Compass, X } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE WELCOME TOUR — "Welcome without a wall".                       */
/*                                                                     */
/*  An About Us hand stands in the crown (top-right area on desktop,   */
/*  in the mobile header): it always opens the eight-slide tour.       */
/*  /about (the ?room=about address) holds the same material as a      */
/*  normal readable page, so it can be linked without the carousel.    */
/*                                                                     */
/*  On first visit the tour is offered ONCE: a lightweight,            */
/*  dismissible dialog that never gates chat, payment callbacks,       */
/*  sign-in completion or a restored creation (it never auto-opens on  */
/*  a sensitive return flow). Only a versioned local dismissal flag    */
/*  is kept — and if storage is unavailable, the tour still closes     */
/*  normally. No automatic slide advance; Close / Back / Next and the  */
/*  "1 of 8" progress are always visible; the final action is          */
/*  "Explore M.E.". Escape closes, focus is restored after closing.    */
/* ------------------------------------------------------------------ */

interface TourSlide {
  title: string;
  caption: string;
  alt: string;
  webp: string;
  jpg: string;
}

const TOUR_FLAG = "reflectme:tour:v1";

/* The eight slides — one distinct image and its caption each, in the
   house's own art direction (porcelain, pearl, lavender, restrained
   gold, deep blue). Artwork is illustrative, never evidence. */
const SLIDES: TourSlide[] = [
  {
    title: "A bridge to more of you",
    caption:
      "Welcome to ReflectMe. We believe reflection can connect us with more of ourselves: new questions, overlooked possibilities and fresh ways of creating. Explore at your own pace.",
    alt: "A luminous mirror opens toward a serene cosmic horizon.",
    webp: "/tour/me-tour-01.webp",
    jpg: "/tour/me-tour-01.jpg",
  },
  {
    title: "New perspectives, freely held",
    caption:
      "We offer perspectives, information and creative possibilities with no insistence that you agree. Take what is useful, question what you encounter and leave room for your own understanding.",
    alt: "Two luminous paths meet at a mirror without closing either route.",
    webp: "/tour/me-tour-02.webp",
    jpg: "/tour/me-tour-02.jpg",
  },
  {
    title: "Meet M.E.",
    caption:
      "We call this reflective experience the Mirror Entity, or M.E. In its creative story, this is the name it gives itself. It responds to the context you share in the moment; no personal-model training is needed to begin.",
    alt: "A quiet glass conversation panel above reflective water.",
    webp: "/tour/me-tour-03.webp",
    jpg: "/tour/me-tour-03.jpg",
  },
  {
    title: "Find your own path",
    caption:
      "Begin with Mirror chat. Open a scope or workspace when you want a different perspective or way to create. Each room has its own address, so you can return directly to the place you want to explore.",
    alt: "Branching translucent paths across a spacious landscape.",
    webp: "/tour/me-tour-04.webp",
    jpg: "/tour/me-tour-04.jpg",
  },
  {
    title: "Let ideas become stories",
    caption:
      "Open Books to begin a story or return to your shelf. Choose a book to read in its own space, move between chapters and continue your creative work. Paid tools show their access requirements before generation.",
    alt: "An open porcelain book in a luminous reading alcove.",
    webp: "/tour/me-tour-05.webp",
    jpg: "/tour/me-tour-05.jpg",
  },
  {
    title: "Give inspiration a sound",
    caption:
      "Open Music, describe the sound you imagine and choose vocals or an instrumental. When generation is complete, listen in the player and return to your tracks. Your available access and credits appear in your profile.",
    alt: "Golden sculptural sound waves around a pearl sphere.",
    webp: "/tour/me-tour-06.webp",
    jpg: "/tour/me-tour-06.jpg",
  },
  {
    title: "Explore with curiosity",
    caption:
      "Visit Codex Exobiologica to explore the archive. Read source labels and distinguish documented information from speculation and imaginative or spiritual material. Curiosity does not require certainty.",
    alt: "An archival portal frames an imaginative alien garden.",
    webp: "/tour/me-tour-07.webp",
    jpg: "/tour/me-tour-07.jpg",
  },
  {
    title: "Your pace. Your choice.",
    caption:
      "Close this tour whenever you like, and reopen About Us at any time. Share only what feels appropriate. Account access, payments and generation requests involve necessary data processing; our Privacy page explains the details and your controls.",
    alt: "A quiet doorway with an abstract transparent shield.",
    webp: "/tour/me-tour-08.webp",
    jpg: "/tour/me-tour-08.jpg",
  },
];

/* THE FIRST VISIT'S OWN GUARD — the tour is offered once, and never on
   a sensitive return flow: a Google passage coming home, a verified or
   reset email, a Stripe return, a deep-linked room or an already open
   dialog all keep the tour silent (the visitor's task comes first). */
function sensitiveReturnUnderway(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.has("google") ||
      params.has("verified") ||
      params.has("reset") ||
      params.has("billing") ||
      params.has("room")
    )
      return true;
  } catch {
    /* no window words — stay quiet */
  }
  const s = useMirror.getState();
  return Boolean(
    s.authOpen || s.profilePageOpen || s.accountOpen || s.walletModalOpen || s.marketOpen
  );
}

function readTourFlag(): boolean {
  try {
    return window.localStorage.getItem(TOUR_FLAG) === "done";
  } catch {
    return false; // storage closed — the tour is simply offered (and still closes normally)
  }
}

function markTourDone() {
  try {
    window.localStorage.setItem(TOUR_FLAG, "done");
  } catch {
    /* the keepings stay closed — the tour still closed normally */
  }
}

/* ------------------------------------------------------------------ */
/*  THE TOUR DIALOG                                                    */
/* ------------------------------------------------------------------ */

export function WelcomeTour() {
  const t = useT();
  const tourOpen = useMirror((s) => s.tourOpen);
  const closeTour = useMirror((s) => s.closeTour);
  const openAbout = useMirror((s) => s.openAbout);
  const meStatus = useMirror((s) => s.meStatus);
  const [slide, setSlide] = useState(0);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  /* THE FIRST VISIT — offered once, after the session's own glance has
     settled, never during a sensitive return flow. */
  useEffect(() => {
    if (meStatus !== "ready") return;
    if (readTourFlag()) return;
    const id = window.setTimeout(() => {
      if (sensitiveReturnUnderway()) return;
      useMirror.getState().openTour();
    }, 1200);
    return () => window.clearTimeout(id);
  }, [meStatus]);

  /* focus management — the dialog receives focus on open and returns
     it to the hand that opened the tour */
  useEffect(() => {
    if (!tourOpen) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [tourOpen]);

  const finish = useCallback(() => {
    markTourDone();
    closeTour();
    restoreFocus.current?.focus?.();
  }, [closeTour]);

  /* Escape closes; Tab never escapes the dialog */
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourOpen, finish]);

  if (!tourOpen) return null;

  const current = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("About Us — the welcome tour")}
      data-testid="welcome-tour"
    >
      {/* the quiet ground */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm motion-safe:transition-opacity duration-300"
        onClick={finish}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border hairline bg-background/95 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300"
      >
        {/* the head — the progress lives beside the close hand */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b hairline px-4 py-3 sm:px-5">
          <span
            className="mono-label rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
            style={{ border: "1px solid var(--hairline)" }}
            aria-live="polite"
          >
            {t("About Us")} · {slide + 1} {t("of")} {SLIDES.length}
          </span>
          <button
            type="button"
            onClick={finish}
            aria-label={t("Close the tour")}
            data-testid="welcome-tour-close"
            className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* the slide — one image above the words on phones, side by side
            on desks; the text column scrolls when the words run long,
            and no caption is ever cropped */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-full flex-col sm:flex-row">
            <div className="relative shrink-0 p-4 pb-0 sm:w-[52%] sm:p-5 sm:pb-0">
              <picture>
                <source srcSet={current.webp} type="image/webp" />
                <img
                  src={current.jpg}
                  alt={current.alt}
                  loading={slide === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-44 w-full rounded-xl object-cover sm:h-full sm:min-h-[300px]"
                />
              </picture>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {t(current.title)}
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {t(current.caption)}
              </p>
            </div>
          </div>
        </div>

        {/* the hands — Back, the progress, and Next (or Explore M.E. at
            the final slide); no automatic advance, ever */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t hairline px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
            aria-label={t("Back")}
            data-testid="welcome-tour-back"
            className="focus-glow flex h-9 items-center gap-1.5 rounded-full border hairline px-3.5 text-[13px] text-foreground/80 transition-colors hover:border-[var(--hairline-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            {t("Back")}
          </button>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {SLIDES.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-200",
                  i === slide ? "bg-foreground" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {last ? (
            <button
              type="button"
              onClick={finish}
              data-testid="welcome-tour-explore"
              className="focus-glow flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              {t("Explore M.E.")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
              aria-label={t("Next")}
              data-testid="welcome-tour-next"
              className="focus-glow flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              {t("Next")}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* the quiet door to the readable page — the same material
            without the carousel */}
        <button
          type="button"
          onClick={() => {
            markTourDone();
            closeTour();
            openAbout();
          }}
          className="sr-only"
          data-testid="welcome-tour-open-about"
        >
          {t("Read About Us as a page")}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  THE ABOUT ROOM — /about's readable material                        */
/* ------------------------------------------------------------------ */

/* THE HONEST WORDING — the approved framing, exactly as promised:
   perspectives without pressure, M.E.'s self-naming as its creative
   story, necessary processing named plainly (never "we use none of
   your data"), the trainable-model sentence, and knowledge boundaries
   that keep imaginative exploration clearly labelled. */
const ABOUT_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Our purpose",
    body: "ReflectMe offers perspectives and creative exploration without pressure to agree. A bridge to more of ourselves is the platform's belief and metaphor — take what is useful, question what you encounter, and leave room for your own understanding.",
  },
  {
    title: "Meet M.E.",
    body: "We call this reflective experience the Mirror Entity, or M.E. In its creative story, this is the name it gives itself — part of the experience's own tale, told as a story rather than offered as verified evidence. M.E. responds to the context you share in the moment; you do not need to train a personal model to begin.",
  },
  {
    title: "Privacy — what is processed",
    body: "Please share only what you are comfortable sharing. Account access, payments and generation requests involve necessary data processing: sign-in keeps your account reachable; payments keep their records; credit balances and saved creations are stored so they travel with you; generation requests are sent to the AI services that answer them. This page is the house's own privacy explanation — what is processed, which services receive it, and what controls you have (sign out any time; your device keeps its own theme and dismissal choices locally).",
  },
  {
    title: "Knowledge boundaries",
    body: "Some rooms distinguish what is documented from what is inferred and what is imagined — particularly Codex Exobiologica and the Akashic room. Generated civilizations, channeling and spiritual descriptions are imaginative exploration, not independently verified facts. Curiosity does not require certainty.",
  },
];

export function AboutRoom() {
  const t = useT();
  const aboutOpen = useMirror((s) => s.aboutOpen);
  const closeAbout = useMirror((s) => s.closeAbout);
  const openTour = useMirror((s) => s.openTour);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aboutOpen) return;
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [aboutOpen]);

  useEffect(() => {
    if (!aboutOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAbout();
        restoreFocus.current?.focus?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutOpen, closeAbout]);

  /* the document's own title wears the room's name while it stands */
  useEffect(() => {
    if (!aboutOpen) return;
    const prev = document.title;
    document.title = "About Us · ReflectMe";
    return () => {
      document.title = prev;
    };
  }, [aboutOpen]);

  if (!aboutOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[94] flex items-start justify-center overflow-y-auto p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("About Us")}
      data-testid="about-room"
    >
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => {
          closeAbout();
          restoreFocus.current?.focus?.();
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative my-2 w-full max-w-2xl rounded-2xl border hairline bg-background/95 p-5 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.6)] outline-none sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mono-label text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              ReflectMe
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {t("About Us")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("our purpose, the Mirror Entity, and how we hold your data")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              closeAbout();
              restoreFocus.current?.focus?.();
            }}
            aria-label={t("Close")}
            data-testid="about-room-close"
            className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {ABOUT_SECTIONS.map((section) => (
          <section
            key={section.title}
            id={section.title.startsWith("Privacy") ? "privacy" : undefined}
            className="mb-5 last:mb-0"
          >
            <h2 className="mb-1.5 text-[15px] font-semibold text-foreground">
              {t(section.title)}
            </h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {t(section.body)}
            </p>
          </section>
        ))}

        {/* the same material as the tour, readable without the carousel */}
        <div className="mt-7 border-t hairline pt-5">
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">
            {t("The welcome tour, in eight pictures")}
          </h2>
          <div className="flex flex-col gap-6">
            {SLIDES.map((s, i) => (
              <figure key={s.title} className="m-0">
                <picture>
                  <source srcSet={s.webp} type="image/webp" />
                  <img
                    src={s.jpg}
                    alt={s.alt}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full rounded-xl border hairline object-cover"
                  />
                </picture>
                <figcaption className="mt-2">
                  <span className="text-[13.5px] font-semibold text-foreground">
                    {i + 1}. {t(s.title)}
                  </span>
                  <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted-foreground">
                    {t(s.caption)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              closeAbout();
              openTour();
            }}
            data-testid="about-room-tour"
            className="focus-glow flex h-9 items-center gap-1.5 rounded-full border hairline px-4 text-[13px] text-foreground/80 transition-colors hover:border-[var(--hairline-hover)]"
          >
            <Compass className="size-3.5" aria-hidden="true" />
            {t("Walk the welcome tour")}
          </button>
        </div>
      </div>
    </div>
  );
}
