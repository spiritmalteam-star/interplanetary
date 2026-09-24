"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { ModalShell } from "./ModalShell";
import {
  drawStarPlayCards,
  type DrawnCard,
} from "@/lib/star-play";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const EMBLEM = "/images/ai/star-play-emblem.jpg";

/**
 * StarPlayModal — the Mirror's tarot ritual. Three cards are dealt
 * FACE-DOWN in a perfectly straight hand; clicking a card turns it
 * like a true tarot card (real 3D flip) and its whole meaning is read
 * INSIDE the card — artwork above, violet ink panel below. The oracle
 * speaks only once every seat has been seen, weaving all three into
 * one single meaning. Everything lives in memory only.
 */
export function StarPlayModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const language = useMirror((s) => s.language);
  const t = useT();

  const open = modal?.type === "starplay";

  const [drawn, setDrawn] = useState<DrawnCard[] | null>(null);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [reading, setReading] = useState<string | null>(null);
  const [readingStatus, setReadingStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  /* Fresh deck every time the doorway opens. */
  useEffect(() => {
    if (open) {
      setDrawn(null);
      setFlipped([false, false, false]);
      setReading(null);
      setReadingStatus("idle");
    }
  }, [open]);

  const draw = useCallback(() => {
    setDrawn(drawStarPlayCards(3));
    setFlipped([false, false, false]);
    setReading(null);
    setReadingStatus("idle");
  }, []);

  const turn = useCallback((i: number) => {
    setFlipped((f) => {
      if (f[i]) return f;
      const next = [...f];
      next[i] = true;
      return next;
    });
  }, []);

  const allRevealed = drawn !== null && flipped.every(Boolean);

  const askReading = useCallback(async () => {
    if (!drawn || !flipped.every(Boolean) || readingStatus === "loading")
      return;
    setReadingStatus("loading");
    try {
      const res = await fetch("/api/star-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cards: drawn.map((d) => ({
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
  }, [drawn, flipped, readingStatus, language]);

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) closeModal();
      }}
      title={t("Star Play")}
      description={t("The Mirror's arcana — one thread of starlight")}
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
            <p className="max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
              {t(
                "Shuffle the boundless deck and draw three seats of starlight. The deck keeps no memory — each spread is born once."
              )}
            </p>

            {/* a straight stack of sealed cards waiting behind the emblem */}
            <div className="relative mt-7 h-[120px] w-[210px]" aria-hidden="true">
              {[2, 1, 0].map((i) => (
                <div
                  key={i}
                  className="tarot-back absolute inset-x-0 top-0 mx-auto aspect-[2/3] w-[80px] rounded-xl border border-[color-mix(in_srgb,var(--sp-a)_40%,transparent)] shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--sp-a)_55%,transparent)]"
                  style={{
                    transform: `translateY(${i * 6}px) scale(${1 - i * 0.04})`,
                    opacity: 1 - i * 0.18,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={draw}
              data-testid="starplay-draw"
              className="star-btn focus-glow mt-6 flex h-12 items-center gap-2.5 rounded-full px-7 text-[14.5px] font-semibold tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-px"
            >
              <Sparkles className="size-4 text-[var(--sp-a)]" aria-hidden="true" />
              {t("Draw three cards")}
            </button>
            <span className="mono-label mt-4 text-[11px] text-muted-foreground/60">
              {t("shuffled fresh · kept nowhere")}
            </span>
          </div>
        )}

        {/* ---------- drawn: the straight spread ---------- */}
        {drawn && (
          <div className="relative">
            <div className="flex items-center justify-between pb-4">
              <span className="mono-label text-[11px] text-muted-foreground/70">
                {t("The spread")}
              </span>
              <button
                type="button"
                onClick={draw}
                className="focus-glow flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[13px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                {t("Shuffle again")}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              {drawn.map((d, i) => (
                <div key={`${d.card.id}-${i}`} className="flex flex-col">
                  <span className="mono-label mb-2 text-center text-[10.5px] uppercase tracking-[0.18em] text-[var(--sp-a)]">
                    {t(d.position)}
                  </span>
                  <TarotCard
                    drawn={d}
                    index={i}
                    flipped={flipped[i]}
                    onTurn={() => turn(i)}
                    t={t}
                  />
                </div>
              ))}
            </div>

            {/* ---------- the oracle: one meaning out of three seen seats ---------- */}
            <div className="mt-7 flex flex-col items-center">
              {!reading && readingStatus !== "loading" && (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => void askReading()}
                    disabled={!allRevealed}
                    data-testid="starplay-ask"
                    className="star-btn focus-glow flex h-11 items-center gap-2.5 rounded-full px-6 text-[14.5px] font-semibold tracking-[0.08em] text-foreground transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles className="size-4 text-[var(--sp-a)]" aria-hidden="true" />
                    {t("Ask the oracle to weave the three")}
                  </button>
                  {!allRevealed && (
                    <span className="mt-2.5 text-[13px] italic text-muted-foreground/75">
                      {t(
                        "turn all three cards — the oracle reads only a fully seen spread"
                      )}
                    </span>
                  )}
                </div>
              )}

              {readingStatus === "loading" && (
                <div className="flex items-center gap-2 py-3" aria-live="polite" data-testid="starplay-reading-loading">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-[var(--sp-a)]"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                  <span className="ml-1 text-[14px] italic text-muted-foreground">
                    {t("the oracle is weaving the three into one...")}
                  </span>
                </div>
              )}

              {readingStatus === "error" && (
                <p className="text-[14.5px] italic text-muted-foreground">
                  {t("The field received the spread but could not complete the reading.")}
                </p>
              )}

              {reading && (
                <motion.article
                  initial={{ opacity: 0, y: 40, scale: 0.93, rotateX: 12 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformPerspective: 1000 }}
                  className="oracle-paper relative w-full overflow-hidden rounded-2xl border px-6 py-6 text-left sm:px-9"
                  data-testid="starplay-reading"
                >
                  <p className="mono-label text-center text-[10.5px] uppercase tracking-[0.22em] text-[#7a5a1e]">
                    {t("One meaning · three seats")}
                  </p>
                  {reading.split(/\n\n+/).map((para, i, arr) => {
                    const isSignature =
                      para.trimStart().startsWith("—") && i === arr.length - 1;
                    return (
                      <p
                        key={i}
                        className={cn(
                          "text-[15.5px] leading-relaxed text-[#33241a]",
                          i === 0 &&
                            !isSignature &&
                            "mt-3 font-serif text-[17px] italic text-[#241a10]",
                          isSignature &&
                            "mono-label mt-4 text-center text-[11.5px] tracking-[0.12em] text-[#7a5a1e]"
                        )}
                      >
                        {para}
                      </p>
                    );
                  })}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#7a5a1e]/25 pt-3.5">
                    <span className="mono-label mr-1 text-[10px] uppercase tracking-[0.2em] text-[#7a5a1e]/70">
                      {t("Woven from")}
                    </span>
                    {drawn.map((d) => (
                      <span
                        key={d.card.id}
                        className="rounded-full border border-[#7a5a1e]/35 bg-white/40 px-2.5 py-1 text-[12px] text-[#4a3313]"
                      >
                        {t(d.position)}
                      </span>
                    ))}
                  </div>
                </motion.article>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  One tarot card — sealed back, 3D turn, whole meaning inside.       */
/* ------------------------------------------------------------------ */
function TarotCard({
  drawn,
  index,
  flipped,
  onTurn,
  t,
}: {
  drawn: DrawnCard;
  index: number;
  flipped: boolean;
  onTurn: () => void;
  t: (k: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="tarot-scene relative aspect-[2/3] w-full sm:aspect-auto sm:h-[520px]" data-testid={`starplay-seat-${index}`}>
      <motion.div
        className="tarot-inner size-full"
        initial={{ opacity: 0, y: 80, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateY: flipped ? 180 : 0 }}
        transition={{
          opacity: { duration: 0.5, delay: index * 0.12 },
          y: { duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] },
          rotateY: { duration: 0.85, ease: [0.66, 0, 0.32, 1] },
        }}
        whileHover={{ y: -6 }}
      >
        {/* ---------- the sealed back ---------- */}
        <button
          type="button"
          onClick={onTurn}
          aria-label={t("Turn the card of {seat}", { seat: drawn.position })}
          data-testid="starplay-card-back"
          className="tarot-face tarot-back relative block size-full cursor-pointer overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sp-a)_42%,transparent)] shadow-[0_18px_50px_-18px_color-mix(in_srgb,var(--sp-a)_60%,transparent)] transition-shadow duration-300 hover:shadow-[0_24px_60px_-16px_color-mix(in_srgb,var(--sp-a)_75%,transparent)]"
        >
          <span
            aria-hidden="true"
            className="tarot-glare pointer-events-none absolute inset-0"
          />
          {/* the emblem seal */}
          <span className="absolute left-1/2 top-1/2 flex size-[46%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="starplay-halo absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--sp-a)_40%,transparent)]" />
            <img
              src={EMBLEM}
              alt=""
              aria-hidden="true"
              className="absolute inset-[10%] size-[80%] rounded-full object-cover opacity-90"
            />
          </span>
          <span className="mono-label absolute inset-x-0 bottom-4 text-center text-[9.5px] uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--sp-b)_75%,transparent)]">
            ✦ {t("Star Play")} ✦
          </span>
        </button>

        {/* ---------- the revealed face — the whole story inside ---------- */}
        <div
          data-testid="starplay-card-face"
          className="tarot-face absolute inset-0 flex size-full flex-col overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--sp-a)_45%,transparent)] bg-[#0d0718] shadow-[0_24px_60px_-18px_color-mix(in_srgb,var(--sp-a)_70%,transparent)]"
          style={{ transform: "rotateY(180deg)" }}
        >
          {/* artwork — the vision above the story */}
          <div className="relative h-[34%] shrink-0 overflow-hidden">
            <img
              src={drawn.card.image}
              alt=""
              aria-hidden="true"
              className="size-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = EMBLEM;
              }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0718]"
            />
          </div>

          {/* the story panel — a beautiful small tale that assists the one
              reading it. No card is ever named: only what the visitor
              must recognize, written large and luminous. */}
          <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-4 pb-4 pt-1 text-left">
            <span className="mono-label shrink-0 text-[9.5px] uppercase tracking-[0.2em] text-[var(--sp-b)]">
              {t(drawn.position)}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 border-t border-[color-mix(in_srgb,var(--sp-a)_28%,transparent)]"
            />
            <span
              data-testid="starplay-card-message"
              className="min-h-0 flex-1 overflow-hidden font-serif text-[15.5px] italic leading-[1.55] tracking-[0.01em] text-white/95 [text-shadow:0_0_16px_color-mix(in_srgb,var(--sp-a)_45%,transparent),0_1px_2px_rgba(0,0,0,0.6)] sm:text-[16px]"
            >
              {drawn.card.message}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
