"use client";

import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ====================================================================
   THE COMPOSER'S OWN FIELD — one calm, growing line of words.

   It replaces the single-line input in every chat composer:
   · it grows with the words (up to a few lines, then scrolls inside
     itself) so a long thought is never hidden behind a scrolling line;
   · Enter sends, Shift+Enter breaks the line — and Enter never sends
     while an input method (IME) is still composing a character;
   · the text is 16px on touch screens, so iOS never zooms the page
     when the field is focused (the zoom that used to push the whole
     frame off-centre); it returns to the finer size on wide screens;
   · the send key on the on-screen keyboard reads "send".
   ==================================================================== */

const MAX_PX = 128; // about five lines, then the field scrolls itself

export interface ComposerFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export const ComposerField = forwardRef<HTMLTextAreaElement, ComposerFieldProps>(
  function ComposerField(
    { id, value, onChange, onSubmit, placeholder, disabled, className, ...rest },
    forwardedRef
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    /* fit the height to the words: collapse, measure, set — before paint,
       so the line never flashes at the wrong height */
    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_PX)}px`;
    }, [value]);

    return (
      <textarea
        ref={setRefs}
        id={id}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.nativeEvent.isComposing &&
            e.keyCode !== 229
          ) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="on"
        enterKeyHint="send"
        data-testid={rest["data-testid"]}
        className={cn(
          "composer-field nice-scroll block min-w-0 flex-1 resize-none bg-transparent py-[5px] text-[16px] leading-[1.4] text-foreground",
          "placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          "sm:text-[14.5px]",
          className
        )}
        style={{ maxHeight: MAX_PX }}
      />
    );
  }
);
