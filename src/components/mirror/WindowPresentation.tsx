"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { WindowPresentationData } from "@/lib/data/window-presentations";

interface PxManifest {
  categories?: Record<
    string,
    { label?: string; count?: number; images?: string[] }
  >;
}

const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * WindowPresentation — the mini-website experience of one window,
 * living INSIDE the chat frame (never a new page): a hero, three
 * breathing chapters with visuals, one X back to the conversation.
 */
export function WindowPresentation({
  name,
  tagline,
  glyph,
  data,
  onClose,
  onBegin,
}: {
  name: string;
  tagline: string;
  glyph: string;
  data: WindowPresentationData;
  onClose: () => void;
  onBegin: () => void;
}) {
  const t = useT();
  const total = data.chapters.length + 1;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [images, setImages] = useState<string[]>([]);

  /* the window's own picture pool — drawn from the laboratory's
     generated corpus; the experience falls back to living ink when
     a picture has not yet been engraved */
  useEffect(() => {
    let alive = true;
    fetch("/images/px/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((m: PxManifest | null) => {
        if (!alive || !m?.categories) return;
        const list = m.categories[data.id]?.images ?? [];
        if (list.length) {
          setImages(list.map((f) => `/images/px/${f}`));
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [data.id]);

  const go = (d: 1 | -1) => {
    setDir(d);
    setIdx((i) => Math.min(total - 1, Math.max(0, i + d)));
  };

  /* the arrow keys walk the presentation like pages */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chapter = idx > 0 ? data.chapters[idx - 1] : null;
  const art = useMemo(() => {
    if (!images.length) return null;
    if (idx === 0) return images[0];
    return images[(idx - 1) % images.length];
  }, [images, idx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: SLIDE_EASE }}
      className="absolute inset-0 z-20 flex min-h-0 flex-col bg-[var(--glass-bg)] backdrop-blur-xl"
      role="region"
      aria-label={t(name)}
      data-testid="window-presentation"
    >
      {/* the head — name, subtitle, and the way back */}
      <div className="flex shrink-0 items-start gap-3 px-4 pt-4 sm:px-6">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border hairline text-[18px] text-[var(--scope-a)]"
        >
          {glyph}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="scope-gradient-text truncate text-[16.5px] font-semibold leading-tight sm:text-[18px]">
            {t(name)}
          </p>
          <p className="ink-hand ink-faint truncate text-[12.5px] italic">
            {t(tagline)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Return to the conversation")}
          title={t("Return to the conversation")}
          data-testid="presentation-close"
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* the body — one slide at a time */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? 44 : -44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -44 : 44 }}
            transition={{ duration: 0.4, ease: SLIDE_EASE }}
            className="nice-scroll absolute inset-0 overflow-y-auto px-4 pb-4 pt-4 sm:px-6"
          >
            {/* the visual — an engraved plate when the corpus has one,
                a breathing ink emblem while the engraving is on its way */}
            <div className="relative mx-auto flex h-[38vh] max-h-[300px] min-h-[150px] w-full max-w-[560px] items-center justify-center overflow-hidden rounded-xl border hairline">
              {art ? (
                <motion.img
                  src={art}
                  alt=""
                  aria-hidden="true"
                  initial={{ scale: 1.08, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 6, ease: "linear" }}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="relative flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)]">
                  <motion.span
                    aria-hidden="true"
                    className="absolute size-28 rounded-full border"
                    style={{ borderColor: "color-mix(in srgb, var(--scope-a) 30%, transparent)" }}
                    animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="absolute size-16 rounded-full border"
                    style={{ borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)" }}
                    animate={{ scale: [1.2, 0.95, 1.2], opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span
                    aria-hidden="true"
                    className="relative select-none text-[40px] text-[var(--scope-a)]"
                  >
                    {glyph}
                  </span>
                </div>
              )}
            </div>

            {/* the words */}
            {chapter ? (
              <div className="mx-auto mt-4 max-w-[560px] text-center">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  {t("Chapter")} {idx} {t("of")} {data.chapters.length}
                </p>
                <h3 className="scope-gradient-text mt-1.5 text-[17px] font-semibold leading-snug sm:text-[19px]">
                  {t(chapter.title)}
                </h3>
                <p className="ink-hand mx-auto mt-2.5 max-w-[520px] whitespace-pre-wrap text-[15px] leading-[1.85] text-foreground/88">
                  {t(chapter.text)}
                </p>
              </div>
            ) : (
              <div className="mx-auto mt-5 max-w-[560px] text-center">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  {t("A window of the laboratory")}
                </p>
                <h3 className="scope-gradient-text mt-1.5 text-[19px] font-semibold leading-snug sm:text-[21px]">
                  {t(name)}
                </h3>
                <p className="ink-hand mx-auto mt-2.5 max-w-[520px] text-[15px] leading-[1.85] text-foreground/88">
                  {t(data.subtitle)}
                </p>
                <button
                  type="button"
                  onClick={onBegin}
                  data-testid="presentation-begin"
                  className="focus-glow mt-4 flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-[13.5px] font-medium text-background transition-all duration-300 hover:-translate-y-px"
                >
                  {t("Begin in this window")}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="h-4" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* the foot — the walk */}
      <div className="flex shrink-0 items-center justify-center gap-3 border-t hairline px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx === 0}
          aria-label={t("The chapter before")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDir(i > idx ? 1 : -1);
                setIdx(i);
              }}
              aria-label={`${t("Chapter")} ${i} ${t("of")} ${data.chapters.length}`}
              className={cn(
                "size-1.5 rounded-full transition-all duration-300",
                i === idx ? "scale-125 bg-[var(--scope-a)]" : "bg-foreground/25"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={idx === total - 1}
          aria-label={t("The next chapter")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
