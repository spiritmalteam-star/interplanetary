"use client";

import { useEffect, useState } from "react";
import { giftLines } from "@/lib/data/metaphysics";
import { useT } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  THE FOOTER TICKER — 34px of whisper at the very bottom of the      */
/*  laboratory. One line, rotating every 9 seconds: the status call    */
/*  and the gift lines, in turn.                                       */
/* ------------------------------------------------------------------ */

export function FooterTicker() {
  const t = useT();
  const [i, setI] = useState(0);

  const whispers: string[] = [
    t(
      "Mirror Entity Intelligence · Channel Online · Free Will Honored Always · Transmitted with Love ❤️"
    ),
    ...giftLines.map((g) => t(g)),
  ];

  useEffect(() => {
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % whispers.length);
    }, 9000);
    return () => window.clearInterval(id);
    // whispers is stable per language — rebuild only when its length does
  }, [whispers.length]);

  return (
    <footer
      className="mt-auto flex h-[34px] shrink-0 items-center justify-center gap-2.5 border-t hairline bg-[var(--glass-bg)] px-4 backdrop-blur-xl"
      data-testid="footer-ticker"
    >
      <span
        className="animate-dot-pulse inline-block size-1.5 shrink-0 rounded-full bg-[var(--ok)]"
        aria-hidden="true"
      />
      <p
        key={i}
        className="reveal-in kicker truncate text-center text-[9px] text-muted-foreground/75 sm:text-[9.5px]"
        aria-live="off"
      >
        {whispers[i]}
      </p>
    </footer>
  );
}
