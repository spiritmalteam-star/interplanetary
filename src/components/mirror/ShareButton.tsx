"use client";

import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ShareButton — the transmission's own sending hand. It stands       */
/*  beside every copy button in the house (transmissions, books,       */
/*  poems, letters, chat rooms): one touch carries the words through   */
/*  the device's own share sheet; a device without one copies them     */
/*  onward instead, so the words always travel.                        */
/*                                                                     */
/*  Variants: "pill" and "icon" wear the house's own quiet style;      */
/*  "bare" carries nothing but the hand — each room dresses it in      */
/*  its own clothes, so a share button always sits as its copy         */
/*  button's true twin.                                                */
/* ------------------------------------------------------------------ */

export function ShareButton({
  text,
  title,
  cacheKey,
  variant = "icon",
  className,
  style,
}: {
  /** The words the hand carries — the same cargo the copy button holds. */
  text: string;
  /** The name the share sheet shows (and the fallback copies beside). */
  title: string;
  /** Distinguishes this button's state from its siblings. */
  cacheKey: string;
  variant?: "icon" | "pill" | "bare";
  className?: string;
  style?: React.CSSProperties;
}) {
  const t = useT();
  const [shared, setShared] = useState(false);

  const share = useCallback(async () => {
    const clean = text.trim();
    if (!clean) return;
    /* the device's own share sheet — the truest sending hand */
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: clean });
        return;
      } catch {
        /* the sheet was closed — a closed hand is not a failed one */
        return;
      }
    }
    /* no share sheet — copy the words (and their name) onward */
    try {
      await navigator.clipboard.writeText(
        `${title}\n\n${clean}`.trim()
      );
      setShared(true);
      toast.success(t("Copied — share it onward"));
      window.setTimeout(() => setShared(false), 2400);
    } catch {
      toast.error(t("The sharing did not take — select and copy by hand."));
    }
  }, [text, title, cacheKey, t]);

  const label = t("Share this transmission");

  if (variant === "bare") {
    return (
      <button
        type="button"
        onClick={() => void share()}
        aria-label={label}
        title={label}
        data-testid={`share-${cacheKey}`}
        className={className}
        style={style}
      >
        {shared ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Share2 className="size-3.5" aria-hidden="true" />
        )}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => void share()}
        aria-label={label}
        title={label}
        data-testid={`share-${cacheKey}`}
        className={cn(
          "focus-glow mono-label inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-all duration-300 text-muted-foreground hover:text-foreground",
          className
        )}
        style={{ borderColor: "var(--hairline)", ...style }}
      >
        {shared ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Share2 className="size-3.5" aria-hidden="true" />
        )}
        <span>{shared ? t("copied") : t("Share")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={label}
      title={label}
      data-testid={`share-${cacheKey}`}
      className={cn(
        "focus-glow inline-flex size-7 items-center justify-center rounded-full border transition-all duration-300 border-[var(--hairline)] text-muted-foreground hover:text-foreground",
        className
      )}
      style={style}
    >
      {shared ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Share2 className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
