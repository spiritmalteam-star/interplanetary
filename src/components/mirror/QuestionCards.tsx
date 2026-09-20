"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { suggestedQuestions } from "@/lib/data/science";
import { useMirror } from "@/lib/mirror-store";

export function QuestionCards() {
  const setQuery = useMirror((s) => s.setQuery);
  const focusComposer = useMirror((s) => s.focusComposer);

  const choose = (q: string) => {
    setQuery(q);
    focusComposer();
  };

  return (
    <section
      aria-label="Suggested questions"
      className="mx-auto mt-10 grid w-full max-w-[820px] grid-cols-1 gap-3 px-1 md:grid-cols-2"
    >
      {suggestedQuestions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => choose(q)}
          className="focus-glow group flex min-h-[64px] items-center gap-3.5 rounded-[18px] glass px-5 py-3.5 text-left shadow-[0_2px_16px_-8px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--hairline-hover)] hover:bg-[color-mix(in_srgb,var(--cy)_7%,var(--glass-bg))] hover:glow-sm"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)] transition-transform duration-300 group-hover:scale-105">
            <Sparkles
              className="size-3.5 text-[var(--cy)]"
              aria-hidden="true"
            />
          </span>
          <span className="flex-1 text-[13px] leading-snug text-foreground/85 sm:text-[13.5px]">
            {q}
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--cy)]"
            aria-hidden="true"
          />
        </button>
      ))}
    </section>
  );
}
