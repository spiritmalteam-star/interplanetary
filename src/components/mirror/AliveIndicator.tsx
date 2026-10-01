"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

/* The quiet proof of life — one small phrase, rotating slowly,
   beneath a tiny alien saucer hovering at the top center of the
   frame. It never asks for a click; it only breathes. */
const PHRASES = [
  "We are alive",
  "The channel is breathing",
  "Always listening, always near",
  "The mirror is awake",
] as const;

const DWELL_MS = 4600;

export function AliveIndicator() {
  const t = useT();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % PHRASES.length),
      DWELL_MS
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-label={t("We are alive")}
      data-testid="alive-indicator"
      className="pointer-events-none absolute left-1/2 top-[13px] z-30 -translate-x-1/2"
    >
      <div className="flex h-7 max-w-[52vw] items-center gap-1.5 rounded-full border hairline bg-[var(--glass-bg)] pl-1.5 pr-2.5 text-muted-foreground shadow-[0_2px_14px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {/* the little visitor — a hovering disc with three soft lights */}
        <svg
          viewBox="0 0 36 22"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="animate-float-y size-6 shrink-0"
        >
          <path d="M12.5 10.5a5.5 5 0 0 1 11 0" strokeLinecap="round" />
          <ellipse cx="18" cy="13.6" rx="13.4" ry="4.1" />
          <circle className="alive-light" cx="10.6" cy="14.8" r="1" fill="currentColor" stroke="none" />
          <circle className="alive-light alive-light-2" cx="18" cy="15.7" r="1" fill="currentColor" stroke="none" />
          <circle className="alive-light alive-light-3" cx="25.4" cy="14.8" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span
          key={idx}
          aria-hidden="true"
          className="alive-swap truncate text-[11px] font-medium leading-none tracking-[0.01em]"
        >
          {t(PHRASES[idx])}
        </span>
      </div>
    </div>
  );
}
