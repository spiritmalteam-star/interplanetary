"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ABOUT US — THE MINI TAB.                                           */
/*                                                                     */
/*  The house's story no longer stands as a great section at the       */
/*  page's foot: a quiet hand at the corner opens it as a small, warm  */
/*  tab resting above the page — close it, and the walk continues      */
/*  exactly where it was.                                              */
/*                                                                     */
/*  THE VOICE — the words here speak to the visitor: informative,      */
/*  kind, a little gentle humor, and honest about what this place is   */
/*  and why it exists. No stage, no crown, no showing off — the page   */
/*  serves, it never performs.                                         */
/* ------------------------------------------------------------------ */

export default function AboutUsTab() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /* the tab rides the body itself — the threshold's own stacking
     context would hold it beneath the anchored chat's glass; outside,
     the mini tab floats above every layer of the page as a tab should.
     (The mount flag turns on a breath after hydration — async, so the
     engine never renders inside the effect.) */
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  /* the tab opens at its top, every time — a fresh page each visit */
  useEffect(() => {
    if (open) panelRef.current?.scrollTo({ top: 0 });
  }, [open]);

  /* the escape hand — the page's own kindness */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* THE QUIET HAND — a small pill at the walk's end, always warm,
          never insisting. It opens the mini tab; the page keeps its
          own ground (the great bottom section is gone). */}
      <div className="relative mx-auto flex w-full max-w-[830px] justify-center px-4 pb-16 pt-12 sm:px-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="dialog"
          data-testid="about-tab-button"
          className="focus-glow group inline-flex h-11 items-center gap-2.5 rounded-full border border-[var(--lp-edge)] bg-[var(--lp-veil)] px-6 text-[14.5px] font-medium tracking-[0.02em] text-[var(--lp-body)] shadow-[0_14px_34px_-22px_rgba(60,45,20,0.55)] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--lp-gold)_55%,transparent)] hover:text-[var(--lp-gold-soft)]"
        >
          <Info
            className="size-3.5 text-[var(--lp-gold)] transition-transform duration-300 group-hover:rotate-12"
            aria-hidden="true"
          />
          {t("About us")}
        </button>
      </div>

      {/* THE MINI TAB — a small warm card above the page's corner:
          the house's purpose, told kindly, at the visitor's own pace.
          It rides the body (portaled), so it stands above the anchored
          glass the way a true tab does. */}
      {mounted && createPortal(
        <div
          aria-hidden={!open}
          className={cn(
            "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[68] w-[min(94vw,400px)] transition-all duration-300 sm:right-5",
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-3 opacity-0"
          )}
        >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={t("About us")}
          data-testid="about-tab-panel"
          className="nice-scroll max-h-[min(68vh,520px)] overflow-y-auto overscroll-y-contain rounded-2xl border border-[var(--lp-edge)] bg-[var(--lp-veil)] p-5 shadow-[0_30px_80px_-30px_rgba(40,30,10,0.5),0_0_0_1px_rgba(255,253,244,0.35)] backdrop-blur-md sm:p-6"
          style={{ backgroundColor: "var(--lp-veil)" }}
        >
          {/* the tab's own little crown row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mono-label text-[10px] uppercase tracking-[0.28em] text-[var(--lp-gold)]">
                {t("A word from the house")}
              </p>
              <h2 className="mt-2 font-[family-name:Cinzel] text-[22px] font-semibold leading-tight tracking-wide text-[var(--lp-head)]">
                {t("About us")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("Close")}
              title={t("Close")}
              data-testid="about-tab-close"
              className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--lp-edge)] text-[var(--lp-mute)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-[var(--lp-head)]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <p className="text-[14.5px] leading-[1.85] text-[var(--lp-body)]">
              {t(
                "Reflectme began with a simple wish: to build a calm corner of the internet where a person can think out loud, create without pressure, and be answered kindly. No feed, no noise, no one watching over your shoulder — just a quiet room that is always glad to see you."
              )}
            </p>
            <p className="text-[14.5px] leading-[1.85] text-[var(--lp-body)]">
              {t(
                "Inside, you can talk with the mirror — a reflective companion that answers your questions in your own words. You can write together, watch your descriptions become paintings, turn a feeling into music, walk the records of old civilizations, and keep a living book that weaves your dreams page by page. Everything you make stays yours; the house only keeps the lamp lit."
              )}
            </p>
            <p className="text-[14.5px] leading-[1.85] text-[var(--lp-body)]">
              {t(
                "Our purpose is not to impress you — it is to be useful. An honest answer when you ask for one, a soft place when the day is loud, and a door you can step through whenever you need one. If a thing here feels unclear, just ask: nothing in this house minds repeating itself."
              )}
            </p>
            <p className="text-[14.5px] leading-[1.85] text-[var(--lp-body)]">
              {t(
                "The threshold you are standing on is free to walk. The deeper rooms open by registration, once one of the offered realms is acquired — and until then, the floor asks nothing."
              )}
            </p>
          </div>

          <p className="mono-label mt-5 border-t border-[var(--lp-edge)] pt-4 text-[10px] uppercase tracking-[0.2em] text-[var(--lp-faint)]">
            {t("reflectme.space · made with patience")}
          </p>
        </div>
      </div>,
        document.body
      )}
    </>
  );
}
