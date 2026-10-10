"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, Feather } from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  codexChapters,
  codexIntro,
  codexSubtitle,
  codexTitle,
  type CodexChapter,
} from "@/lib/data/codex";
import { cn } from "@/lib/utils";
import { ListenButton } from "./ListenButton";

/* ------------------------------------------------------------------ */
/*  The Codex — the fourth book on the laboratory shelf.               */
/*  Bound in dawn-rose; follows the Manifest's craft (frame cards,     */
/*  corners, mono-label headings, gradient titles, golden seals) but   */
/*  stays COMPACT: a slim rail of chapter tabs turns the volume, and   */
/*  every chapter is a folded accordion — one open at a time, so the   */
/*  reader never has to scroll far.                                    */
/* ------------------------------------------------------------------ */

/* ---------------- spoken text of a chapter (for narration) ---------------- */

function spokenOf(chapter: CodexChapter): string {
  const parts: string[] = [chapter.title];
  for (const s of chapter.sections) {
    if (s.heading) parts.push(s.heading);
    if (s.body) parts.push(...s.body);
    if (s.list) parts.push(...s.list);
    if (s.seal) parts.push(s.seal);
  }
  return parts.join(". ");
}

/* ---------------- one chapter — a folded leaf ---------------- */

function ChapterCard({
  chapter,
  open,
  onToggle,
}: {
  chapter: CodexChapter;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const spoken = useMemo(() => spokenOf(chapter), [chapter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative overflow-hidden rounded-2xl glass"
      data-testid={`codex-chapter-${chapter.id}`}
    >
      <span className="scope-corner scope-corner-tl" aria-hidden="true" />
      <span className="scope-corner scope-corner-tr" aria-hidden="true" />
      <span className="scope-corner scope-corner-bl" aria-hidden="true" />
      <span className="scope-corner scope-corner-br" aria-hidden="true" />

      {/* the folded spine of the chapter */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-glow flex w-full items-center gap-3.5 px-5 py-4 text-left sm:px-6"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full border text-[17px]"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
          }}
          aria-hidden="true"
        >
          {chapter.glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="scope-gradient-text block text-[15.5px] font-semibold sm:text-[17px]">
            {t(chapter.title)}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] text-muted-foreground">
            {t(chapter.tagline)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* the open leaf */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="border-t hairline px-5 pb-5 pt-4 sm:px-6">
            {chapter.sections.map((section, i) => (
              <section
                key={i}
                className={cn(i > 0 && "mt-5 border-t hairline pt-5")}
              >
                {section.heading && (
                  <h4 className="mono-label text-[11px] text-[var(--scope-a)]">
                    {t(section.heading)}
                  </h4>
                )}

                {section.body?.map((paragraph, j) => (
                  <p
                    key={j}
                    className={cn(
                      "text-[14.5px] leading-[1.8] text-foreground/88",
                      (section.heading || j > 0) && "mt-2.5"
                    )}
                  >
                    {t(paragraph)}
                  </p>
                ))}

                {section.list && section.list.length > 0 && (
                  <ul className="mt-3 space-y-2.5">
                    {section.list.map((line, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <span
                          className="mt-[9px] inline-block size-1.5 shrink-0 rotate-45"
                          style={{ background: "var(--scope-a)" }}
                          aria-hidden="true"
                        />
                        <span className="text-[14.5px] leading-[1.7] text-foreground/85">
                          {t(line)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.seal && (
                  <div
                    className="mt-4 rounded-xl border py-4 text-center"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--scope-a) 26%, transparent)",
                      background:
                        "color-mix(in srgb, var(--scope-a) 6%, transparent)",
                    }}
                  >
                    <p className="mono-label text-[10px] text-[var(--scope-a)]">
                      {t("Seal")}
                    </p>
                    <p className="scope-gradient-text mx-auto mt-1.5 max-w-[420px] font-serif text-[16px] italic leading-relaxed">
                      “{t(section.seal)}”
                    </p>
                  </div>
                )}
              </section>
            ))}

            <div className="mt-4 flex justify-end">
              <ListenButton text={spoken} cacheKey={`codex-${chapter.id}`} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---------------- the volume ---------------- */

export function CodexView() {
  const exitCodex = useMirror((s) => s.exitCodex);
  /* one chapter open at a time — the compactness of the volume */
  const [openId, setOpenId] = useState<string | null>(
    codexChapters[0]?.id ?? null
  );
  const t = useT();

  const openChapter = (id: string) => {
    setOpenId((prev) => {
      const next = prev === id ? null : id;
      if (next) {
        /* let the leaf unfold, then bring it into view */
        requestAnimationFrame(() => {
          document
            .getElementById(`codex-chapter-${id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  return (
    <div className="scope-codex relative flex h-full flex-col">
      {/* ---------- top bar with the single bridge back to the app ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
          <button
            type="button"
            onClick={exitCodex}
            data-testid="codex-back"
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {t("Return to the Observatory")}
            </span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <div className="min-w-0 text-center">
            <h1 className="title-gradient truncate text-[15.5px] font-semibold tracking-[0.12em] sm:text-[17px]">
              CODEX
            </h1>
            <p className="mono-label mt-0.5 truncate text-[10px] text-muted-foreground/80 sm:text-[11px]">
              {t(codexSubtitle)}
            </p>
          </div>

          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline"
            aria-hidden="true"
          >
            <Feather className="size-4 text-[var(--cx-a)]" />
          </span>
        </div>
      </header>

      {/* ---------- the volume ---------- */}
      <main
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="codex-view"
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pb-8 sm:px-6">
          {/* slim greeting */}
          <div className="pt-5 text-center sm:pt-6">
            <p
              className="mono-label text-[11px]"
              style={{ color: "var(--scope-a)" }}
            >
              CODEX · {t(codexSubtitle)}
            </p>
            <h2 className="scope-gradient-text mt-2 text-[22px] font-semibold leading-tight sm:text-[26px]">
              {t(codexTitle)}
            </h2>
            <div className="mx-auto mt-2 max-w-[540px] space-y-2">
              {codexIntro.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[14px] leading-relaxed text-muted-foreground"
                >
                  {t(paragraph)}
                </p>
              ))}
            </div>
          </div>

          {/* the slim rail of chapters — sticky, so turning pages is
              always one tap away and the reader never scrolls far */}
          <div
            className="sticky top-0 z-20 -mx-4 mt-4 border-b hairline bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
            role="tablist"
            aria-label={t("The chapters of the Codex")}
            data-testid="codex-rail"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:justify-center">
              {codexChapters.map((chapter) => {
                const active = openId === chapter.id;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => openChapter(chapter.id)}
                    className={cn(
                      "focus-glow flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13.5px] transition-all duration-300",
                      active
                        ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] font-semibold text-foreground glow-sm"
                        : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    )}
                  >
                    <span aria-hidden="true">{chapter.glyph}</span>
                    {t(chapter.title)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* the chapters — folded leaves, one open at a time */}
          <div className="space-y-3 pt-4">
            {codexChapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                open={openId === chapter.id}
                onToggle={() => openChapter(chapter.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
