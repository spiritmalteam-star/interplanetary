"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE DEEP READING KIT — the image's own zoom: the wheel and the     */
/*  +/− hands zoom on desks, two fingers pinch on phones (the page's   */
/*  own zoom stays asleep), a drag pans while enlarged, a double       */
/*  touch returns to the whole.                                        */
/*                                                                     */
/*  ZoomStage — the whole craft in one component: the frame, the       */
/*  image, the pinch and the small control bar.                        */
/*  ZoomableImageSurface — the dressed frame for cards;                */
/*  ZoomableLightbox — the full-screen portal room.                    */
/* ------------------------------------------------------------------ */

const MIN_SCALE = 1;
const MAX_SCALE = 6;

const clampScale = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

function ZoomStage({
  src,
  alt,
  testId,
  className,
  imgClassName,
  controlsClass,
  onLoad,
  zoomedCursor = "zoom-in",
}: {
  src: string;
  alt: string;
  testId: string;
  /** the frame's own classes (it carries touch-none) */
  className?: string;
  imgClassName?: string;
  controlsClass?: string;
  onLoad?: () => void;
  /** the resting cursor: "zoom-in" opens, "grab" pans */
  zoomedCursor?: "zoom-in" | "default";
}) {
  const t = useT();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  /* the gesture's own breath — a state, so the render stays pure (the
     transition rests only while fingers or a pointer are truly moving) */
  const [interacting, setInteracting] = useState(false);
  /* the fingers move faster than a state batch — the pinch and the
     drag ride refs and land on the transform */
  const pinch = useRef<{
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const drag = useRef<{ x: number; y: number; baseX: number; baseY: number } | null>(
    null
  );
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  useEffect(() => {
    scaleRef.current = scale;
    offsetRef.current = offset;
  }, [scale, offset]);

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => {
      const next = clampScale(s * factor);
      if (next <= 1.001) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  /* THE WHEEL HAND — one notch, one step closer or farther */
  const bindWheel = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const on = (e: WheelEvent) => {
        e.preventDefault();
        zoomBy(e.deltaY < 0 ? 1.12 : 0.89);
      };
      el.addEventListener("wheel", on, { passive: false });
    },
    [zoomBy]
  );

  /* THE FINGERS' OWN LAW — two fingers pinch; the browser page zoom
     never wakes (the frame prevents the gesture's default). */
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = {
        startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startScale: scaleRef.current,
        startX: (a.clientX + b.clientX) / 2,
        startY: (a.clientY + b.clientY) / 2,
        baseX: offsetRef.current.x,
        baseY: offsetRef.current.y,
      };
      drag.current = null;
      setInteracting(true);
    } else if (e.touches.length === 1 && scaleRef.current > 1.001) {
      const touch = e.touches[0];
      drag.current = {
        x: touch.clientX,
        y: touch.clientY,
        baseX: offsetRef.current.x,
        baseY: offsetRef.current.y,
      };
      setInteracting(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (pinch.current && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      const p = pinch.current;
      const next = clampScale(p.startScale * (dist / Math.max(p.startDist, 1)));
      setScale(next);
      setOffset({
        x: p.baseX + (midX - p.startX),
        y: p.baseY + (midY - p.startY),
      });
    } else if (drag.current && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const d = drag.current;
      setOffset({
        x: d.baseX + (touch.clientX - d.x),
        y: d.baseY + (touch.clientY - d.y),
      });
    }
  };

  const onTouchEnd = () => {
    if (pinch.current) {
      pinch.current = null;
      /* the fingers left — a whole-out pinch lays the image back down */
      setScale((s) => {
        if (s < 1.05) setOffset({ x: 0, y: 0 });
        return s;
      });
    }
    drag.current = null;
    setInteracting(false);
  };

  /* THE DESK'S OWN DRAG — a pressed pointer pans while enlarged */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scaleRef.current <= 1.001 || e.pointerType === "touch") return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      baseX: offsetRef.current.x,
      baseY: offsetRef.current.y,
    };
    setInteracting(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || e.pointerType === "touch") return;
    const d = drag.current;
    setOffset({
      x: d.baseX + (e.clientX - d.x),
      y: d.baseY + (e.clientY - d.y),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
    setInteracting(false);
  };

  const zoomed = scale > 1.001;

  return (
    <div
      ref={bindWheel}
      className={cn("relative touch-none select-none", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      data-testid={`${testId}-frame`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={onLoad}
        onDoubleClick={() => (zoomed ? reset() : setScale(2.5))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transition: interacting ? "none" : "transform 220ms ease-out",
          cursor: zoomed ? "grab" : zoomedCursor,
        }}
        className={cn(
          "mx-auto block max-w-full object-contain",
          imgClassName
        )}
        data-testid={`${testId}-img`}
      />
      {/* the zoom hands — always standing, the depth they carry shown */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-1.5 py-1 backdrop-blur-md",
          controlsClass
        )}
        data-testid={`${testId}-controls`}
      >
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          disabled={!zoomed}
          aria-label={t("Zoom out")}
          data-testid={`${testId}-out`}
          className="focus-glow flex size-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 disabled:opacity-35"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <span
          className="mono-label min-w-[3.2em] text-center text-[10px] text-white/80"
          aria-live="polite"
        >
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          disabled={scale >= MAX_SCALE - 0.01}
          aria-label={t("Zoom in")}
          data-testid={`${testId}-in`}
          className="focus-glow flex size-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 disabled:opacity-35"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-white/20" />
        <button
          type="button"
          onClick={reset}
          disabled={!zoomed}
          aria-label={t("Fit the whole image")}
          data-testid={`${testId}-fit`}
          className="focus-glow flex size-8 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 disabled:opacity-35"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- the dressed frame for cards ---------------- */

/**
 * ZoomableImageSurface — one image the visitor may come closer to:
 * wheel + pinch + drag + double-click, with the small control bar
 * floating at a corner. The surface itself carries no frame — the
 * host dresses it.
 */
export function ZoomableImageSurface({
  src,
  alt,
  className,
  imgClassName,
  testId,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  testId: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("relative", className)} style={style}>
      <ZoomStage
        src={src}
        alt={alt}
        testId={testId}
        imgClassName={imgClassName}
        controlsClass="absolute bottom-2 right-2 z-10"
      />
    </div>
  );
}

/* ---------------- the full-screen lightbox room ---------------- */

export function ZoomableLightbox({
  src,
  caption,
  onClose,
  testId = "zoom-lightbox",
}: {
  src: string;
  caption?: string;
  onClose: () => void;
  testId?: string;
}) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
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
      data-testid={testId}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/92 p-1.5 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      {/* the close hand */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("Close the enlarged image")}
        data-testid={`${testId}-close`}
        className="focus-glow absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white/90 transition-all duration-300 hover:scale-105 hover:bg-black/60 sm:right-5 sm:top-5"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <figure
        className="relative m-0 flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!loaded && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="size-7 animate-spin rounded-full border-2 border-white/25 border-t-white/70" />
          </span>
        )}
        <ZoomStage
          src={src}
          alt={caption ?? ""}
          testId={testId}
          className="max-h-[94vh] max-w-[98vw] sm:max-w-[96vw]"
          imgClassName="max-h-[94vh] max-w-[98vw] rounded-lg border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] sm:max-w-[96vw]"
          onLoad={() => setLoaded(true)}
        />
        {caption && (
          <figcaption className="mono-label pointer-events-none max-w-[86vw] truncate rounded-full border border-white/15 bg-black/50 px-3 py-1 text-center text-[11px] text-white/80">
            {caption}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
  );
}
