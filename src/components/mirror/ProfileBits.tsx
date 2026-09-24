"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, X, ZoomIn } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ProfileBits — the shared encyclopedia-page kit:                    */
/*  ZoomableImage (fallback chain + zoom lightbox), ProfileGallery     */
/*  (the three context images every profile carries), ProfileSection   */
/*  (numbered, labeled sections), FactTile (at-a-glance facts) and     */
/*  ContextNote (the archive's discernment note).                      */
/* ------------------------------------------------------------------ */

/* ---------------- the zoom lightbox ---------------- */

function ImageLightbox({
  src,
  caption,
  onClose,
}: {
  src: string;
  caption?: string;
  onClose: () => void;
}) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? t("Enlarged image")}
      data-testid="profile-lightbox"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("Close the enlarged image")}
        data-testid="profile-lightbox-close"
        className="focus-glow absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white/90 transition-all duration-300 hover:scale-105 hover:bg-black/60 sm:right-5 sm:top-5"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <figure
        className="relative m-0 flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!loaded && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle
              className="size-7 animate-spin text-white/60"
              aria-hidden="true"
            />
          </span>
        )}
        <img
          src={src}
          alt={caption ?? ""}
          onLoad={() => setLoaded(true)}
          className={cn(
            "max-h-[80vh] max-w-[92vw] rounded-xl border border-white/15 object-contain shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] transition-opacity duration-500 sm:max-w-[86vw]",
            loaded ? "opacity-100" : "opacity-0"
          )}
          data-testid="profile-lightbox-img"
        />
        {caption && (
          <figcaption className="mono-label max-w-[86vw] rounded-full border border-white/15 bg-black/50 px-3 py-1 text-center text-[10px] text-white/80">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
  );
}

/* ---------------- zoomable image with a fallback chain ---------------- */

/**
 * ZoomableImage — renders the first source that loads (onerror walks
 * the chain), overlays a quiet zoom button, and opens a lightbox.
 * When every source fails, a quiet ink plate is shown instead.
 */
export function ZoomableImage({
  sources,
  alt,
  caption,
  className,
  imgClassName,
  zoomAria,
}: {
  /** Fallback chain: primary (the profile's own painting) first. */
  sources: string[];
  alt: string;
  caption?: string;
  /** Wrapper classes — include sizing/aspect here. */
  className?: string;
  imgClassName?: string;
  zoomAria?: string;
}) {
  const t = useT();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const exhausted = idx >= sources.length;

  return (
    <span
      className={cn(
        "profile-img relative block overflow-hidden rounded-xl border hairline bg-[color-mix(in_srgb,var(--register-ink)_88%,var(--sp-a)_12%)]",
        className
      )}
      data-testid="profile-image"
    >
      {exhausted ? (
        <span
          aria-hidden="true"
          className="flex size-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cy)_10%,transparent),color-mix(in_srgb,var(--sp-a)_8%,transparent))]"
        >
          <span className="text-[18px] opacity-40">✦</span>
        </span>
      ) : (
        <img
          src={sources[idx]}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setIdx((i) => i + 1)}
          className={cn("size-full object-cover", imgClassName)}
        />
      )}

      {!exhausted && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={zoomAria ?? t("Zoom the image")}
          title={zoomAria ?? t("Zoom the image")}
          data-testid="profile-zoom"
          className="focus-glow group/btn absolute bottom-2 right-2 z-10 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/85 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/65"
        >
          <ZoomIn
            className="size-3.5 transition-transform duration-300 group-hover/btn:scale-110"
            aria-hidden="true"
          />
        </button>
      )}

      {caption && (
        <span className="mono-label pointer-events-none absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] text-white/75 backdrop-blur-sm">
          {caption}
        </span>
      )}

      {open && !exhausted && (
        <ImageLightbox src={sources[idx]} caption={caption ?? alt} onClose={() => setOpen(false)} />
      )}
    </span>
  );
}

/* ---------------- the three context images of a profile ---------------- */

/**
 * ProfileGallery — one wide impression plus two supporting scenes,
 * each zoomable. `slots` is exactly the profile's visual identity:
 * slot 0 = the profile's own painting, slots 1–2 = its context.
 */
export function ProfileGallery({
  slots,
  alts,
  captions,
  testid,
}: {
  /** Three fallback chains, widest first. */
  slots: [string[], string[], string[]];
  alts: [string, string, string];
  captions?: [string?, string?, string?];
  testid?: string;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2"
      data-testid={testid ?? "profile-gallery"}
    >
      <ZoomableImage
        sources={slots[0]}
        alt={alts[0]}
        caption={captions?.[0]}
        className="col-span-2 aspect-[16/9] sm:aspect-[21/9]"
      />
      <ZoomableImage
        sources={slots[1]}
        alt={alts[1]}
        caption={captions?.[1]}
        className="aspect-[4/3]"
      />
      <ZoomableImage
        sources={slots[2]}
        alt={alts[2]}
        caption={captions?.[2]}
        className="aspect-[4/3]"
      />
    </div>
  );
}

/* ---------------- numbered, labeled encyclopedia section ---------------- */

export function ProfileSection({
  index,
  label,
  children,
  tone = "cy",
}: {
  /** Two-digit ordering, e.g. "01" — omit for unnumbered sections. */
  index?: string;
  label: string;
  children: React.ReactNode;
  tone?: "cy" | "gd" | "pk";
}) {
  const color =
    tone === "gd" ? "var(--gd)" : tone === "pk" ? "var(--pk)" : "var(--cy)";
  return (
    <section>
      <h4
        className="mono-label flex items-center gap-2 text-[10.5px]"
        style={{ color }}
      >
        {index && (
          <span
            aria-hidden="true"
            className="opacity-55"
            style={{ color }}
          >
            {index}
          </span>
        )}
        <span aria-hidden="true" className="h-px w-4 opacity-40" style={{ background: color }} />
        {label}
      </h4>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

/* ---------------- at-a-glance fact tile ---------------- */

export function FactTile({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border hairline bg-[var(--glass-bg-soft)] px-2.5 py-2">
      <p className="mono-label text-[9px] text-muted-foreground/80">{label}</p>
      <p
        className={cn(
          "mt-1 text-[13px] leading-snug text-foreground/90",
          mono && "font-mono tabular-nums"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ---------------- the archive's discernment note ---------------- */

export function ContextNote({ tone = "gd" }: { tone?: "gd" | "cy" }) {
  const t = useT();
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        tone === "gd"
          ? "border-[color-mix(in_srgb,var(--gd)_22%,transparent)] bg-[color-mix(in_srgb,var(--gd)_6%,transparent)]"
          : "border-[color-mix(in_srgb,var(--cy)_22%,transparent)] bg-[color-mix(in_srgb,var(--cy)_6%,transparent)]"
      )}
    >
      <h4 className="mono-label text-[10px]" style={{ color: tone === "gd" ? "var(--gd)" : "var(--cy)" }}>
        {t("Context note")}
      </h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {t(
          "This dossier reflects channeled tradition and worldbuilding within the Mirror archive. It is offered for reflection and wonder — not as established science."
        )}
      </p>
    </div>
  );
}
