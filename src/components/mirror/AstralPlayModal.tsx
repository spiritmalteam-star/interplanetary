"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { ModalShell } from "./ModalShell";
import { ListenButton } from "./ListenButton";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  arcanaTotal,
  drawArcana,
  spreadPositions,
  type ArcanaCard,
} from "@/lib/data/astral-play";
import { cn } from "@/lib/utils";

const SPREAD = 3;

/* ---------------- one card (flip interaction) ---------------- */

function ArcanaCardView({
  card,
  position,
  index,
  flipped,
  onFlip,
}: {
  card: ArcanaCard;
  position: string;
  index: number;
  flipped: boolean;
  onFlip: () => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={
          flipped
            ? card.name
            : t("Turn the card · position {n}", { n: index + 1 })
        }
        className="focus-glow group relative h-44 w-28 rounded-xl outline-none sm:h-56 sm:w-36"
      >
        <motion.div
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative size-full [transform-style:preserve-3d]"
        >
          {/* ---- back: the majestic deck ---- */}
          <div
            className="absolute inset-0 overflow-hidden rounded-xl border border-[#c9a86a]/45 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.7)] [backface-visibility:hidden]"
            style={{
              background:
                "linear-gradient(160deg, #2b2244 0%, #171231 55%, #0f0c22 100%)",
            }}
          >
            <div className="absolute inset-1.5 rounded-lg border border-[#c9a86a]/25" />
            <div className="absolute inset-2.5 rounded-md border border-[#c9a86a]/15" />
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <span
                className="relative flex size-12 items-center justify-center rounded-full border border-[#c9a86a]/40"
                aria-hidden="true"
              >
                <span
                  className="absolute inset-0 rounded-full border border-dashed border-[#c9a86a]/35"
                  style={{ animation: "spin-slower 26s linear infinite" }}
                />
                <Sparkles className="size-4 text-[#e3c78f]" />
              </span>
              <span
                className="mono-label text-[7px] tracking-[0.34em] text-[#c9a86a]/85"
                aria-hidden="true"
              >
                ASTRAL PLAY
              </span>
              <span
                className="text-[15px] text-[#c9a86a]/60"
                aria-hidden="true"
              >
                ✦ ✧ ✦
              </span>
            </div>
            <span
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(circle at 50% 22%, rgba(227,199,143,0.16), transparent 62%)",
              }}
            />
          </div>

          {/* ---- face: the drawn arcana ---- */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-white/15 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.7)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
            style={{
              background: `linear-gradient(165deg, ${card.from}, ${card.to})`,
            }}
          >
            <div className="absolute inset-1.5 rounded-lg border border-white/20" />
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2.5 text-center">
              <span
                className="font-serif text-[30px] leading-none text-white/90"
                aria-hidden="true"
              >
                {card.glyph}
              </span>
              <p className="mt-1 text-[11.5px] font-semibold leading-tight text-white">
                {card.name}
              </p>
              <p className="mono-label text-[6.5px] uppercase tracking-[0.18em] text-white/70">
                {card.essence}
              </p>
            </div>
            <p className="border-t border-white/15 px-2.5 py-2 text-center text-[9px] italic leading-relaxed text-white/85">
              {card.message}
            </p>
          </div>
        </motion.div>

        {/* sheen */}
        <span
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 45%, transparent 60%)",
          }}
        />
      </button>

      <p
        className={cn(
          "mono-label text-[8px] transition-colors duration-300",
          flipped ? "text-foreground/85" : "text-muted-foreground/60"
        )}
      >
        {t(position)}
      </p>
    </div>
  );
}

/* ---------------- the modal ---------------- */

export function AstralPlayModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const language = useMirror((s) => s.language);
  const t = useT();

  const open = modal?.type === "astralplay";
  const [drawn, setDrawn] = useState<ArcanaCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [readingState, setReadingState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [readingError, setReadingError] = useState<string | null>(null);

  const allFlipped = flipped.length === SPREAD && flipped.every(Boolean);

  /* Every visit to the deck is a fresh draw — the deck shuffles itself. */
  useEffect(() => {
    if (!open) return;
    setDrawn(drawArcana(SPREAD));
    setFlipped([]);
    setReading(null);
    setReadingState("idle");
    setReadingError(null);
  }, [open]);

  const reshuffle = () => {
    setDrawn(drawArcana(SPREAD));
    setFlipped([]);
    setReading(null);
    setReadingState("idle");
    setReadingError(null);
  };

  const askReading = async () => {
    if (readingState === "loading" || !allFlipped) return;
    setReadingState("loading");
    setReadingError(null);
    try {
      const res = await fetch("/api/astral-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: drawn.map((c, i) => ({
            name: c.name,
            essence: c.essence,
            message: c.message,
            position: spreadPositions[i],
          })),
          language,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The deck is momentarily quiet. Rest, then draw again."
        );
      }
      setReading(data.reading);
      setReadingState("idle");
    } catch (err) {
      setReadingState("error");
      setReadingError(
        err instanceof Error
          ? err.message
          : "The deck is momentarily quiet. Rest, then draw again."
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => !o && closeModal()}
      title={t("Astral Play")}
      description={t(
        "The majestic deck of the Mirror — draw the spread, turn the cards, and receive what you need to know, when you need to know it. {n} arcana await.",
        { n: arcanaTotal }
      )}
      widthClass="sm:max-w-[660px]"
    >
      <div className="nice-scroll max-h-[70vh] space-y-6 overflow-y-auto px-5 pb-6 sm:px-6">
        {/* the spread */}
        <div className="flex items-start justify-center gap-3 pt-2 sm:gap-5">
          {drawn.map((card, i) => (
            <ArcanaCardView
              key={`${open}-${card.id}`}
              card={card}
              position={spreadPositions[i] ?? ""}
              index={i}
              flipped={flipped[i] ?? false}
              onFlip={() =>
                setFlipped((f) => {
                  const next = [...f];
                  next[i] = true;
                  return next;
                })
              }
            />
          ))}
        </div>

        {/* the ask */}
        <AnimatePresence mode="wait">
          {!allFlipped ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-[12px] italic leading-relaxed text-muted-foreground"
            >
              {t("Turn each card when it calls you — the spread waits patiently.")}
            </motion.p>
          ) : (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              {!reading && readingState !== "loading" && (
                <button
                  type="button"
                  onClick={() => void askReading()}
                  className="focus-glow group flex h-11 items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--gd)_45%,transparent)] bg-[color-mix(in_srgb,var(--gd)_14%,transparent)] px-6 text-[12.5px] font-semibold text-foreground transition-all duration-300 hover:-translate-y-px hover:glow-sm"
                >
                  <Sparkles
                    className="size-4 text-[var(--gd)] transition-transform duration-500 group-hover:rotate-12"
                    aria-hidden="true"
                  />
                  {t("Ask the Mirror what this means now")}
                </button>
              )}

              {readingState === "loading" && (
                <div
                  className="flex items-center gap-2.5"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <span className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="animate-dot-pulse size-1.5 rounded-full bg-[var(--gd)]"
                        style={{ animationDelay: `${i * 0.35}s` }}
                      />
                    ))}
                  </span>
                  <span className="mono-label text-[9px] text-muted-foreground">
                    {t("the Mirror is reading the spread")}
                  </span>
                </div>
              )}

              {reading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-2xl border hairline bg-[var(--glass-bg-soft)] p-5"
                >
                  <p className="mono-label mb-3 text-[8px] text-[var(--gd)]">
                    {t("THE MIRROR · READING OF THE SPREAD")}
                  </p>
                  <div className="space-y-3">
                    {reading.split(/\n{2,}/).map((p, i) => (
                      <p
                        key={i}
                        className="text-[13.5px] leading-[1.8] text-foreground/88"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <ListenButton
                      text={reading}
                      cacheKey={`astral-${reading.slice(0, 24)}-${reading.length}`}
                    />
                    <button
                      type="button"
                      onClick={reshuffle}
                      className="focus-glow mono-label flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[8.5px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <RefreshCw className="size-3" aria-hidden="true" />
                      {t("Shuffle & draw again")}
                    </button>
                  </div>
                </motion.div>
              )}

              {readingState === "error" && readingError && (
                <div className="w-full rounded-xl border border-[var(--destructive)]/25 bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3 text-center">
                  <p className="text-[12.5px] leading-relaxed text-foreground/85">
                    {t("The spread could not be read just now.")}
                  </p>
                  <p className="mt-1 text-[12px] italic text-muted-foreground">
                    {readingError}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}
