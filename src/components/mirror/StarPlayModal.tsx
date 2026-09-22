"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw, Sparkles } from "lucide-react";
import { ModalShell } from "./ModalShell";
import {
  STAR_PLAY_CARDS,
  STAR_PLAY_TOTAL,
  drawStarPlayCards,
  type DrawnCard,
} from "@/lib/star-play";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const EMBLEM = "/images/ai/star-play-emblem.jpg";

/**
 * StarPlayModal — the Mirror's arcana. Violet mysticism: draw three big
 * cards, open any card fully, and receive one single channeled core
 * message woven from the whole spread. Everything lives in memory only.
 */
export function StarPlayModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const language = useMirror((s) => s.language);
  const t = useT();

  const open = modal?.type === "starplay";

  const [drawn, setDrawn] = useState<DrawnCard[] | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [readingStatus, setReadingStatus] = useState<"idle" | "loading" | "error">("idle");

  /* Fresh deck every time the doorway opens. */
  useEffect(() => {
    if (open) {
      setDrawn(null);
      setOpenIndex(null);
      setReading(null);
      setReadingStatus("idle");
    }
  }, [open]);

  const draw = useCallback(() => {
    setDrawn(drawStarPlayCards(3));
    setOpenIndex(null);
    setReading(null);
    setReadingStatus("idle");
  }, []);

  const askReading = useCallback(async () => {
    if (!drawn || readingStatus === "loading") return;
    setReadingStatus("loading");
    try {
      const res = await fetch("/api/star-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cards: drawn.map((d) => ({
            name: d.card.name,
            essence: d.card.essence,
            message: d.card.message,
            position: d.position,
          })),
        }),
      });
      const data = (await res.json()) as { reading?: string; error?: string };
      if (!res.ok || !data.reading) {
        throw new Error(data.error ?? "the deck stayed quiet");
      }
      setReading(data.reading);
      setReadingStatus("idle");
    } catch {
      setReadingStatus("error");
    }
  }, [drawn, readingStatus, language]);

  const openedCard = openIndex !== null && drawn ? drawn[openIndex] : null;

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) closeModal();
      }}
      title={t("Star Play")}
      description={t(
        "The Mirror's arcana — {n} cards, one thread of starlight",
        { n: STAR_PLAY_CARDS.length }
      )}
      widthClass="sm:max-w-[940px]"
    >
      <div
        className="starplay-aura relative max-h-[calc(100dvh-8rem)] min-h-[420px] overflow-y-auto nice-scroll px-5 pb-6 pt-2 sm:px-8"
        data-testid="starplay-body"
      >
        {/* ---------- idle: the sealed deck ---------- */}
        {!drawn && (
          <div className="flex flex-col items-center py-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="starplay-halo relative mb-6 size-28 overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--sp-a)_45%,transparent)] shadow-[0_0_60px_-12px_color-mix(in_srgb,var(--sp-a)_60%,transparent)]"
            >
              <img
                src={EMBLEM}
                alt={t("The Star Play emblem — a violet star sealed in light")}
                className="size-full object-cover"
              />
            </motion.div>
            <p className="max-w-[420px] text-[13.5px] leading-relaxed text-muted-foreground">
              {t(
                "Shuffle the one thousand four hundred and forty-three and draw three seats of starlight. The deck keeps no memory — each spread is born once."
              )}
            </p>
            <button
              type="button"
              onClick={draw}
              className="star-btn focus-glow mt-7 flex h-12 items-center gap-2.5 rounded-full px-7 text-[13px] font-semibold tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-px"
            >
              <Sparkles className="size-4 text-[var(--sp-a)]" aria-hidden="true" />
              {t("Draw three cards")}
            </button>
            <span className="mono-label mt-4 text-[9px] text-muted-foreground/60">
              {t("{n} cards · shuffled fresh, kept nowhere", { n: STAR_PLAY_TOTAL })}
            </span>
          </div>
        )}

        {/* ---------- drawn: the spread ---------- */}
        {drawn && (
          <div className="relative">
            <div className="flex items-center justify-between pb-4">
              <span className="mono-label text-[9px] text-muted-foreground/70">
                {t("The spread")}
              </span>
              <button
                type="button"
                onClick={draw}
                className="focus-glow flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[11px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                {t("Shuffle again")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              {drawn.map((d, i) => (
                <motion.div
                  key={`${d.card.id}-${i}`}
                  initial={{ opacity: 0, y: 14, rotate: i === 1 ? 0 : i === 0 ? -1.5 : 1.5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col"
                >
                  <span className="mono-label mb-2 text-center text-[8.5px] uppercase tracking-[0.18em] text-[var(--sp-a)]">
                    {t(d.position)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={t("Open {name} fully", { name: d.card.name })}
                    className={cn(
                      "starplay-card group relative block w-full overflow-hidden rounded-2xl border",
                      "border-[color-mix(in_srgb,var(--sp-a)_38%,transparent)]",
                      "shadow-[0_18px_50px_-20px_color-mix(in_srgb,var(--sp-a)_55%,transparent)]",
                      "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-18px_color-mix(in_srgb,var(--sp-a)_70%,transparent)]"
                    )}
                  >
                    <img
                      src={d.card.image}
                      alt={d.card.name}
                      className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(20,8,38,0.92)] via-[rgba(30,12,54,0.25)] to-transparent"
                      aria-hidden="true"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5 text-left">
                      <span className="block text-[13px] font-semibold leading-snug text-white/95">
                        {d.card.name}
                      </span>
                      <span className="mt-1 block truncate text-[10.5px] italic leading-snug text-white/65">
                        {d.card.essence}
                      </span>
                    </span>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* ---------- the single core message ---------- */}
            <div className="mt-7 flex flex-col items-center">
              {!reading && readingStatus !== "loading" && (
                <button
                  type="button"
                  onClick={() => void askReading()}
                  className="star-btn focus-glow flex h-11 items-center gap-2.5 rounded-full px-6 text-[12.5px] font-semibold tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-px"
                >
                  <Sparkles className="size-4 text-[var(--sp-a)]" aria-hidden="true" />
                  {t("Ask the deck to speak")}
                </button>
              )}

              {readingStatus === "loading" && (
                <div className="flex items-center gap-2 py-3" aria-live="polite">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-[var(--sp-a)]"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                  <span className="ml-1 text-[12px] italic text-muted-foreground">
                    {t("the deck is gathering its one thread...")}
                  </span>
                </div>
              )}

              {readingStatus === "error" && (
                <p className="text-[12.5px] italic text-muted-foreground">
                  {t("The field received the spread but could not complete the reading.")}
                </p>
              )}

              {reading && (
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="starplay-reading w-full rounded-2xl border border-[color-mix(in_srgb,var(--sp-a)_30%,transparent)] bg-[color-mix(in_srgb,var(--sp-a)_7%,var(--glass-bg))] px-6 py-5 text-left shadow-[0_18px_50px_-24px_color-mix(in_srgb,var(--sp-a)_50%,transparent)]"
                >
                  {reading.split(/\n\n+/).map((para, i) => (
                    <p
                      key={i}
                      className="text-[13.5px] leading-relaxed text-foreground/90 first:text-[14.5px] first:italic first:text-foreground"
                    >
                      {para}
                    </p>
                  ))}
                </motion.article>
              )}
            </div>
          </div>
        )}

        {/* ---------- fully opened card ---------- */}
        <AnimatePresence>
          {openedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 overflow-y-auto nice-scroll rounded-2xl bg-[color-mix(in_srgb,var(--glass-bg-strong)_92%,transparent)] p-5 backdrop-blur-2xl sm:p-7"
              data-testid="starplay-card-detail"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="focus-glow mb-5 flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[11px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                {t("Back to the spread")}
              </button>

              <div className="flex flex-col items-start gap-6 sm:flex-row">
                <div className="starplay-card mx-auto w-full max-w-[300px] shrink-0 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sp-a)_40%,transparent)] shadow-[0_24px_70px_-24px_color-mix(in_srgb,var(--sp-a)_65%,transparent)] sm:mx-0">
                  <img
                    src={openedCard.card.image}
                    alt={openedCard.card.name}
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-[var(--sp-a)]">
                    {t(openedCard.position)}
                  </span>
                  <h3 className="mt-2 text-[19px] font-semibold leading-snug text-foreground">
                    {openedCard.card.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] italic leading-relaxed text-[var(--sp-b)]">
                    {openedCard.card.essence}
                  </p>
                  <p className="mt-4 text-[13.5px] leading-relaxed text-foreground/85">
                    {openedCard.card.message}
                  </p>
                  <p className="mono-label mt-6 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
                    {openedCard.card.suit} · {openedCard.card.id}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}
