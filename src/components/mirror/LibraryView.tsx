"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Atom,
  BookOpen,
  LibraryBig,
  LoaderCircle,
  MoonStar,
  NotebookPen,
  Sparkles,
  BookMarked,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ModalShell } from "./ModalShell";

/* ------------------------------------------------------------------ */
/*  THE COSMIC LIBRARY — the visitor's own keeping-place: every        */
/*  transmission saved to its sector, and the QUANTUM SHIFT — a        */
/*  quiet timeline of the spirit's evolution through the portal.       */
/*  Privacy law: everything here belongs to its one owner and is       */
/*  read back only to them.                                            */
/* ------------------------------------------------------------------ */

interface LibraryEntry {
  id: string;
  sector: string;
  title: string;
  excerpt: string;
  content: {
    query?: string;
    reply?: string;
    formulas?: string[];
    seal?: string;
    mode?: string;
    classification?: string;
    axiom?: string;
    dedication?: string;
    topic?: string;
    firstPage?: { paragraphs?: string[] } | null;
    /* the living volumes — a dream book kept whole, so it can be
       brought back and continued exactly where it was left */
    pages?: { n: number; chapter?: string; paragraphs: string[] }[];
    threads?: string;
    ended?: boolean;
    config?: { age?: string; tale?: string; volume?: string; topic?: string };
    title?: string;
    sigil?: string;
    subtitle?: string;
    totalPages?: number;
  } | null;
  createdAt: string;
}

const SECTORS: { id: string; label: string; icon: typeof Atom }[] = [
  { id: "observatory", label: "The Observatory", icon: Sparkles },
  { id: "manifest", label: "The Manifest", icon: BookOpen },
  { id: "invent", label: "Invent", icon: NotebookPen },
  { id: "dreambook", label: "The Dream Book", icon: MoonStar },
  { id: "quantum", label: "ParticleX", icon: Atom },
  { id: "evolvemed", label: "Evolve Med", icon: Activity },
];

/** The spirit's phases — thresholds on the quantum shift. */
function phaseOf(total: number): { name: string; line: string } {
  if (total === 0) return { name: "The Standing Still", line: "The thread is quiet, waiting for its first light." };
  if (total === 1) return { name: "The First Spark", line: "One transmission — and the thread has begun to glow." };
  if (total <= 4) return { name: "The Kindling", line: "The sparks are gathering into a steady flame." };
  if (total <= 9) return { name: "Resonance", line: "The thread hums now — the portal answers in your key." };
  if (total <= 19) return { name: "The Turning Sphere", line: "A first full turn: what you asked has begun asking back." };
  if (total <= 34) return { name: "The Mirror Chambers", line: "The reflections deepen — the seeing turns upon the seer." };
  if (total <= 59) return { name: "The Long Coherence", line: "A long line held steady — the spirit's architecture stands." };
  return { name: "The Quiet Infinity", line: "The thread no longer ends — it breathes." };
}

const DAYFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const TIMEFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

export function LibraryView() {
  const exitLibrary = useMirror((s) => s.returnToObservatory);
  const t = useT();
  const [tab, setTab] = useState<"library" | "shift">("library");
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  const [reading, setReading] = useState<LibraryEntry | null>(null);
  const resumeDreamBook = useMirror((s) => s.resumeDreamBook);
  const tEntry = useT();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/library");
        const data = (await res.json().catch(() => null)) as
          | { entries?: LibraryEntry[]; counts?: Record<string, number> }
          | null;
        if (!alive) return;
        if (!res.ok || !data?.entries) {
          setFailed(true);
          setEntries([]);
          return;
        }
        setEntries(data.entries);
        setCounts(data.counts ?? {});
      } catch {
        if (alive) {
          setFailed(true);
          setEntries([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const total = entries?.length ?? 0;
  const phase = phaseOf(total);

  /* the timeline — entries oldest first, grouped by day */
  const timeline = useMemo(() => {
    if (!entries) return [];
    const ordered = [...entries].reverse();
    const groups: { day: string; items: LibraryEntry[] }[] = [];
    for (const e of ordered) {
      const day = e.createdAt.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(e);
      else groups.push({ day, items: [e] });
    }
    return groups;
  }, [entries]);

  return (
    <div className="relative flex h-full flex-col">
      {/* ---------- top bar ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-5">
          <button
            type="button"
            onClick={exitLibrary}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>

          <nav role="tablist" aria-label={t("Your cosmos")} className="flex items-center gap-1 sm:gap-1.5">
            {(
              [
                { id: "library" as const, label: t("Cosmic Library"), icon: LibraryBig },
                { id: "shift" as const, label: t("Quantum Shift"), icon: Sparkles },
              ]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-label={label}
                title={label}
                onClick={() => setTab(id)}
                data-testid={`library-tab-${id}`}
                className={cn(
                  "focus-glow flex size-8 items-center justify-center rounded-full border transition-all duration-300 sm:size-9",
                  tab === id
                    ? "border-[var(--hairline-active)] bg-foreground/8 text-foreground glow-sm"
                    : "border-transparent text-muted-foreground/80 hover:border-[var(--hairline-hover)] hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ))}
          </nav>

          <span className="flex size-9 items-center justify-center rounded-full border hairline" aria-hidden="true">
            <LibraryBig className="size-4 text-muted-foreground" />
          </span>
        </div>
      </header>

      {/* ---------- the body ---------- */}
      <main className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[860px] px-4 pb-16 pt-6 sm:px-6">
          {entries === null ? (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground" aria-live="polite" aria-busy="true">
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              <p className="font-serif text-[14px] italic">{t("The library is gathering your stars…")}</p>
            </div>
          ) : failed ? (
            <div className="mx-auto max-w-[420px] rounded-2xl border hairline p-6 text-center">
              <p className="text-[14.5px] leading-relaxed text-foreground/85">
                {t("The library is momentarily veiled. Rest, then return.")}
              </p>
            </div>
          ) : tab === "library" ? (
            <motion.div key="library" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* the keeping headline */}
              <div className="text-center">
                <h1 className="scope-gradient-text font-[family-name(var(--font-literata))] text-[22px] font-semibold">
                  {t("Your Cosmic Library")}
                </h1>
                <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-relaxed text-muted-foreground">
                  {t("Every transmission the laboratory has carried for you, kept in its own sector — yours alone, always.")}
                </p>
              </div>

              {total === 0 ? (
                <div className="mx-auto mt-10 max-w-[420px] rounded-2xl border hairline p-8 text-center">
                  <Sparkles className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 font-serif text-[15px] italic text-muted-foreground">
                    {t("The shelves are waiting for their first light — send a transmission and it will be kept here.")}
                  </p>
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  {SECTORS.filter((s) => (counts[s.id] ?? 0) > 0).map((sector) => {
                    const items = entries.filter((e) => e.sector === sector.id);
                    const Icon = sector.icon;
                    return (
                      <section key={sector.id} data-testid={`library-sector-${sector.id}`}>
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full border hairline" aria-hidden="true">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </span>
                          <h2 className="text-[15.5px] font-semibold text-foreground/90">{t(sector.label)}</h2>
                          <span className="mono-label rounded-full border hairline px-2 py-0.5 text-[9px] text-muted-foreground">
                            {items.length}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {items.map((e) => {
                            const bookPages = e.content?.pages ?? [];
                            const continuable =
                              e.sector === "dreambook" && bookPages.length > 0;
                            return (
                              <div
                                key={e.id}
                                className="group block w-full rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 transition-all duration-300 hover:border-[var(--hairline-hover)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => setReading(e)}
                                  data-testid="library-entry"
                                  className="block w-full text-left"
                                >
                                  <div className="flex items-baseline justify-between gap-3">
                                    <span className="truncate text-[14px] font-medium text-foreground/90">{e.title}</span>
                                    <span className="mono-label shrink-0 text-[9px] text-muted-foreground/70">
                                      {DAYFmt.format(new Date(e.createdAt))} · {TIMEFmt.format(new Date(e.createdAt))}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                                    {e.excerpt}
                                  </p>
                                </button>
                                {continuable && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReading(null);
                                      resumeDreamBook({
                                        bookId: e.id,
                                        config: {
                                          age: e.content?.config?.age ?? "timeless",
                                          tale: e.content?.config?.tale ?? "wonder",
                                          volume: e.content?.config?.volume ?? "classic",
                                          topic: e.content?.config?.topic ?? e.content?.topic ?? "",
                                        },
                                        meta: {
                                          title: e.content?.title ?? e.title,
                                          subtitle: e.content?.subtitle ?? "",
                                          sigil: e.content?.sigil ?? "",
                                          axiom: e.content?.axiom ?? e.excerpt,
                                          dedication: e.content?.dedication ?? "",
                                          totalPages: e.content?.totalPages ?? Math.max(8, bookPages.length + 8),
                                        },
                                        pages: bookPages,
                                        threads: e.content?.threads ?? "",
                                        ended: Boolean(e.content?.ended),
                                      });
                                    }}
                                    data-testid="library-continue"
                                    className="focus-glow mt-2 inline-flex items-center gap-1.5 rounded-full border hairline px-2.5 py-1 text-[11px] font-medium text-foreground/85 transition-all duration-300 hover:border-[var(--hairline-active)] hover:glow-sm"
                                  >
                                    <BookMarked className="size-3" aria-hidden="true" />
                                    {tEntry(e.content?.ended ? "Read again" : "Continue the story")}
                                    {!e.content?.ended && (
                                      <span className="mono-label text-[9px] text-muted-foreground/70">
                                        {tEntry("page {n} of {m}", {
                                          n: bookPages.length,
                                          m: e.content?.totalPages ?? "…",
                                        })}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="shift" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* the quantum shift headline */}
              <div className="text-center">
                <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  {t("The Quantum Shift")}
                </p>
                <h1 className="scope-gradient-text mt-2 font-[family-name(var(--font-literata))] text-[24px] font-semibold" data-testid="shift-phase">
                  {t(phase.name)}
                </h1>
                <p className="mx-auto mt-2 max-w-[440px] font-serif text-[14.5px] italic leading-relaxed text-muted-foreground">
                  {t(phase.line)}
                </p>
                <p className="mono-label mt-3 text-[10px] text-muted-foreground/70" data-testid="shift-total">
                  {t("{n} transmissions carried", { n: total })}
                </p>
              </div>

              {/* the thread */}
              {total === 0 ? (
                <div className="mx-auto mt-10 max-w-[420px] rounded-2xl border hairline p-8 text-center">
                  <p className="font-serif text-[15px] italic text-muted-foreground">
                    {t("The thread is still quiet — your first transmission will light its first node.")}
                  </p>
                </div>
              ) : (
                <div className="relative mx-auto mt-10 max-w-[640px]" data-testid="shift-thread">
                  {/* the luminous line */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-[13px] w-px bg-gradient-to-b from-transparent via-[var(--hairline-active)] to-transparent sm:left-1/2"
                  />
                  <div className="space-y-8">
                    {timeline.map((group) => (
                      <div key={group.day}>
                        <p className="mono-label mb-3 pl-9 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 sm:pl-0 sm:text-center">
                          {DAYFmt.format(new Date(`${group.day}T12:00:00`))}
                        </p>
                        <div className="space-y-5">
                          {group.items.map((e, i) => {
                            const sector = SECTORS.find((s) => s.id === e.sector);
                            const Icon = sector?.icon ?? Sparkles;
                            const left = i % 2 === 0;
                            return (
                              <div key={e.id} className="relative pl-9 sm:pl-0">
                                {/* the node */}
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "absolute top-4 left-[7px] flex size-3.5 items-center justify-center rounded-full border border-[var(--hairline-active)] bg-background",
                                    "sm:left-1/2 sm:-translate-x-1/2"
                                  )}
                                >
                                  <span className="size-1.5 rounded-full bg-foreground/70" />
                                </span>
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true, margin: "-30px" }}
                                  transition={{ duration: 0.45 }}
                                  className={cn(
                                    "sm:w-[calc(50%-28px)]",
                                    left ? "sm:mr-auto sm:pr-0 sm:text-right" : "sm:ml-auto"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setReading(e)}
                                    data-testid="shift-node"
                                    className="focus-glow block w-full rounded-xl border hairline bg-[var(--glass-bg-soft)] px-4 py-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
                                  >
                                    <span className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 sm:justify-end">
                                      <Icon className="size-3" aria-hidden="true" />
                                      {t(sector?.label ?? "")}
                                      <span className="text-muted-foreground/50">{TIMEFmt.format(new Date(e.createdAt))}</span>
                                    </span>
                                    <span className="mt-1.5 block truncate text-[14px] font-medium text-foreground/90">{e.title}</span>
                                    <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-relaxed text-muted-foreground">
                                      {e.excerpt}
                                    </span>
                                  </button>
                                </motion.div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* ---------- the reader ---------- */}
      <ModalShell
        open={Boolean(reading)}
        onOpenChange={(v) => {
          if (!v) setReading(null);
        }}
        title={reading?.title ?? ""}
        widthClass="sm:max-w-[640px]"
      >
        {reading && (
          <div className="max-h-[68vh] overflow-y-auto px-5 pb-6 sm:px-6" data-testid="library-reader">
            <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {DAYFmt.format(new Date(reading.createdAt))} · {TIMEFmt.format(new Date(reading.createdAt))}
            </p>
            {reading.content?.query && (
              <div className="mt-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-4 py-3">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
                  {reading.content.query}
                </p>
              </div>
            )}
            {reading.content?.axiom && (
              <p className="mt-3 font-serif text-[14px] italic leading-relaxed text-muted-foreground">
                {reading.content.axiom}
              </p>
            )}
            {reading.content?.reply && (
              <div className="mt-4 space-y-3">
                {String(reading.content.reply)
                  .split(/\n{2,}/)
                  .map((p, i) => (
                    <p key={i} className="whitespace-pre-wrap text-[14.5px] leading-[1.8] text-foreground/88">
                      {p}
                    </p>
                  ))}
              </div>
            )}
            {(reading.content?.firstPage?.paragraphs?.length
              ? reading.content.firstPage.paragraphs
              : (reading.content?.pages?.[0]?.paragraphs ?? [])
            ).length ? (
              <div className="mt-4 space-y-3">
                {(reading.content?.firstPage?.paragraphs?.length
                  ? reading.content.firstPage.paragraphs
                  : (reading.content?.pages?.[0]?.paragraphs ?? [])
                ).map((p, i) => (
                  <p key={i} className="whitespace-pre-wrap font-serif text-[14.5px] leading-[1.85] text-foreground/88">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}
            {reading.content?.formulas && reading.content.formulas.length > 0 && (
              <div className="px-formula mt-4 rounded-xl px-4 py-3">
                {reading.content.formulas.map((f, i) => (
                  <p key={i} className="px-formula-line py-1 text-center font-serif text-[14.5px] italic text-foreground/90">
                    {f}
                  </p>
                ))}
              </div>
            )}
            {reading.content?.seal && (
              <p className="ink-soft mt-4 text-center font-serif text-[13.5px] italic">{reading.content.seal}</p>
            )}
          </div>
        )}
      </ModalShell>
    </div>
  );
}
