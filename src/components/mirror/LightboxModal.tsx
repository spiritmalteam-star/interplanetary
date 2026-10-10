"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * LightboxButton — the small full-screen button that lives on the app's
 * AI images. Stop propagation so it never triggers a parent card click.
 */
export function LightboxButton({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const openLightbox = useMirror((s) => s.openLightbox);
  const t = useT();
  /* A span with role="button" — several hosts of this control are card
     <button>s themselves, and a nested <button> is invalid DOM (React
     hydration error). The span keeps full keyboard activation. */
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(src, alt);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          openLightbox(src, alt);
        }
      }}
      aria-label={t("View full screen")}
      title={t("View full screen")}
      className={cn(
        "focus-glow absolute right-1.5 top-1.5 z-10 flex size-6.5 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white/90 opacity-75 backdrop-blur-sm transition-all duration-300 hover:opacity-100 hover:glow-sm",
        className
      )}
    >
      <Maximize2 className="size-3" aria-hidden="true" />
    </span>
  );
}

/**
 * LightboxModal — the full-screen image viewer: the image fills the
 * screen, one quiet close button, ESC / backdrop click close.
 */
export function LightboxModal() {
  const lightbox = useMirror((s) => s.lightbox);
  const closeLightbox = useMirror((s) => s.closeLightbox);
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lightbox) return;
    /* Capture-phase ESC: closes ONLY the lightbox, so an open dialog
       beneath it (Radix) is not dismissed at the same time. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeLightbox();
      }
    };
    window.addEventListener("keydown", onKey, true);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lightbox, closeLightbox]);

  return (
    <AnimatePresence>
      {lightbox && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t("Full-screen image viewer")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={closeLightbox}
        >
          <motion.figure
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative m-0 max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[84vh] max-w-[92vw] rounded-xl object-contain shadow-[0_40px_140px_-30px_rgba(0,0,0,0.95)]"
            />
            {lightbox.alt && (
              <figcaption className="mono-label mt-2.5 text-center text-[8.5px] text-white/60">
                {lightbox.alt}
              </figcaption>
            )}
          </motion.figure>

          <button
            ref={closeRef}
            type="button"
            onClick={closeLightbox}
            aria-label={t("Close image viewer")}
            className="focus-glow absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/90 backdrop-blur-sm transition-all duration-300 hover:rotate-90 hover:bg-white/20"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
