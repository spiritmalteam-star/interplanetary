"use client";

import {
  forwardRef,
  useCallback,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Library } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ReadingToggle — the page-marker slide between the two reading      */
/*  worlds. A pill-shaped leather groove set on the reading room's     */
/*  own paper (card / border / foreground — the same ink in both       */
/*  hours), with two sides in the Literata serif: the Book and the     */
/*  Akashic Library. A bookmark-ribbon thumb — its folded notch        */
/*  hanging out of the groove like a ribbon slipped between pages —    */
/*  glides from side to side on a spring.                              */
/*                                                                     */
/*  It belongs to the reading environment itself: no trip back to      */
/*  the sidebar is needed. It hides wherever the reading hides its     */
/*  chrome (the immersive page, the scrolled letter).                  */
/* ------------------------------------------------------------------ */

type ReadingSide = "book" | "akashic";

export function ReadingToggle() {
  const t = useT();
  const isAkashic = useMirror((s) => s.view === "akashic");
  const openDreamBook = useMirror((s) => s.openDreamBook);
  const openAkashic = useMirror((s) => s.openAkashic);
  const reduceMotion = useReducedMotion();

  const bookRef = useRef<HTMLButtonElement | null>(null);
  const akashicRef = useRef<HTMLButtonElement | null>(null);

  const choose = useCallback(
    (side: ReadingSide) => {
      if (side === "akashic") openAkashic();
      else openDreamBook();
    },
    [openAkashic, openDreamBook]
  );

  /* arrow keys walk the two sides, focus following the marker */
  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        choose("akashic");
        akashicRef.current?.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        choose("book");
        bookRef.current?.focus();
      }
    },
    [choose]
  );

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 430, damping: 34, mass: 0.9 };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
      }
      data-testid="reading-toggle"
      data-active={isAkashic ? "akashic" : "book"}
    >
      <div
        role="radiogroup"
        aria-label={t("Reading worlds")}
        onKeyDown={onKeyDown}
        className={cn(
          "relative grid w-[212px] grid-cols-2 rounded-full border border-border bg-card p-1 sm:w-[224px]",
          "shadow-[inset_0_2px_6px_-2px_color-mix(in_srgb,var(--foreground)_20%,transparent),0_1px_0_color-mix(in_srgb,var(--background)_45%,transparent),0_14px_34px_-22px_color-mix(in_srgb,var(--foreground)_55%,transparent)]"
        )}
      >
        {/* the sliding page marker — a bookmark ribbon whose folded
            notch hangs out of the groove, the way a ribbon rests
            between the pages of a well-read book */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: isAkashic ? "100%" : "0%" }}
          transition={spring}
          className="absolute left-1 top-1 z-0 h-[calc(100%_+_6px)] w-[calc(50%_-_4px)]"
        >
          <span
            className="absolute inset-0 rounded-t-full bg-foreground shadow-[inset_0_1px_0_color-mix(in_srgb,var(--background)_32%,transparent),0_12px_24px_-12px_color-mix(in_srgb,var(--foreground)_70%,transparent)]"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 9px), 0 100%)",
            }}
          />
          {/* the quiet brass sheen crossing the ribbon */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%_-_10px)] rounded-t-full bg-[linear-gradient(115deg,transparent_32%,color-mix(in_srgb,var(--background)_26%,transparent)_48%,transparent_64%)]"
          />
        </motion.span>

        <ReadingSideButton
          ref={bookRef}
          side="book"
          active={!isAkashic}
          icon={<Bookmark className="size-3.5" aria-hidden="true" />}
          label={t("Book")}
          onSelect={choose}
        />
        <ReadingSideButton
          ref={akashicRef}
          side="akashic"
          active={isAkashic}
          icon={<Library className="size-3.5" aria-hidden="true" />}
          label={t("Akashic")}
          onSelect={choose}
        />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  One side of the groove — a radio in the group.                     */
/* ------------------------------------------------------------------ */

interface ReadingSideButtonProps {
  side: ReadingSide;
  active: boolean;
  icon: ReactNode;
  label: string;
  onSelect: (side: ReadingSide) => void;
}

const ReadingSideButton = forwardRef<HTMLButtonElement, ReadingSideButtonProps>(
  function ReadingSideButton(
    { side, active, icon, label, onSelect },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={active}
        tabIndex={active ? 0 : -1}
        data-testid={`reading-toggle-${side}`}
        onClick={() => onSelect(side)}
        className={cn(
          "focus-glow relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-full px-2",
          "font-[family-name(var(--font-literata))] text-[12.5px] italic tracking-[0.04em] transition-colors duration-300",
          active
            ? "text-background"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
    );
  }
);
