"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent as ReactUIEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  AudioLines,
  BookMarked,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Hammer,
  LoaderCircle,
  Maximize2,
  Minus,
  NotebookText,
  Plus,
  RotateCcw,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { bookToText, dedupeChapters } from "@/lib/book-text";
import { toast } from "@/hooks/use-toast";
import type { SideArtifactKind } from "@/lib/artifact-intent";
import { forgeDirective, guessLightCodesMode } from "@/lib/artifact-intent";
import type { LightCodesMode } from "@/lib/data/light-codes";
import { WorldSigil, type WorldSigilKey } from "./WorldSigils";
import { READERS, TALES, VERSE_FORMS } from "@/lib/data/book-options";
import {
  drawStarPlayCards,
  STAR_PLAY_POSITIONS,
  type DrawnCard,
} from "@/lib/star-play";
import {
  forgeDomains,
  forgePhases,
  forgeScales,
  forgeSparks,
} from "@/lib/data/invent";
import { labFrequencies } from "@/lib/data/metaphysics";

/* ================================================================== */
/*  THE GENERATIVE SIDE-ACTIVITY ARTIFACTS                             */
/*  Whole side activities brought INTO the channel: not their full     */
/*  worlds — one focused, tactile, generative piece each, living       */
/*  beneath the mirror's words. Clear, precise, playful.               */
/* ================================================================== */

/* ---------- a small deterministic ink sigil (currentColor) ---------- */

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function InkSigil({ text, size = 44 }: { text: string; size?: number }) {
  const svg = useMemo(() => {
    const rnd = mulberry32(hash32(text.trim() || "mirror"));
    const c = 60;
    const sides = 3 + Math.floor(rnd() * 6);
    const rot = rnd() * 360;
    const r2 = 34 + rnd() * 10;
    const dash = `${5 + rnd() * 14} ${3 + rnd() * 9}`;
    const pts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const a = ((rot + (360 / sides) * i) * Math.PI) / 180;
      pts.push(`${(c + r2 * Math.cos(a)).toFixed(1)},${(c + r2 * Math.sin(a)).toFixed(1)}`);
    }
    const spokes = 5 + Math.floor(rnd() * 6);
    const lines: string[] = [];
    for (let i = 0; i < spokes; i++) {
      const a = ((rot + 12 + (360 / spokes) * i) * Math.PI) / 180;
      lines.push(
        `<line x1="${(c + 16 * Math.cos(a)).toFixed(1)}" y1="${(c + 16 * Math.sin(a)).toFixed(1)}" x2="${(c + 47 * Math.cos(a)).toFixed(1)}" y2="${(c + 47 * Math.sin(a)).toFixed(1)}" stroke="currentColor" stroke-opacity="0.38" stroke-width="1"/>`
      );
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.4"/>
      <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="${dash}"/>
      <polygon points="${pts.join(" ")}" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.2"/>
      ${lines.join("")}
      <circle cx="60" cy="60" r="3.2" fill="currentColor" fill-opacity="0.85"/>
    </svg>`;
  }, [text, size]);

  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* ---------- shared bits ---------- */

const btnGhost =
  "focus-glow inline-flex h-9 items-center gap-2 rounded-full border hairline px-4 text-[12.5px] font-medium text-foreground/90 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:text-foreground";
const btnSolid =
  "focus-glow inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[12.5px] font-semibold text-background transition-all duration-300 hover:-translate-y-px hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-35";
const inkLine =
  "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 40%, transparent), transparent)";

function ArtifactLoading({ phrase, bars = 3 }: { phrase: string; bars?: number }) {
  return (
    <div className="mx-auto max-w-[440px] py-1">
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="ink-shimmer h-[9px] rounded-full"
            style={{ width: `${[88, 70, 80][i % 3]}%`, animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <p className="ink-hand ink-faint mt-4 text-center text-[13.5px] italic">{phrase}</p>
    </div>
  );
}

function ArtifactError({ message, onRetry, retryLabel, testid }: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
  testid: string;
}) {
  const t = useT();
  return (
    <div className="py-1 text-center">
      <p className="text-[13.5px] italic leading-relaxed text-muted-foreground">{t(message)}</p>
      <button type="button" onClick={onRetry} data-testid={testid} className={cn(btnGhost, "mt-3")}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t(retryLabel)}
      </button>
    </div>
  );
}

/* ================================================================== */
/*  1 · THE AKASHIC LETTER — a record drawn into the channel, with     */
/*      a zoom that opens it to be read like a tablet.                 */
/* ================================================================== */

export interface LetterRecord {
  title: string;
  era: string;
  record: string;
  seal: string;
}

const READER_SIZES = [17, 19.5, 22];

export function KindleReader({
  record,
  onClose,
  footerLabel,
}: {
  record: LetterRecord;
  onClose: () => void;
  /** The small mono line at the novel's foot — defaults to the
      Library's own name. */
  footerLabel?: string;
}) {
  const t = useT();
  const [sizeIdx, setSizeIdx] = useState(1);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const paras = record.record.split(/\n{2,}/);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      data-testid="kindle-reader"
      role="dialog"
      aria-modal="true"
      aria-label={record.title}
    >
      {/* reader head — title · type size · progress · the way out */}
      <div className="flex shrink-0 items-center gap-3 border-b hairline px-4 py-3 sm:px-6">
        <ScrollText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="ink-title truncate text-[15px] font-semibold leading-tight">{record.title}</p>
          <p className="ink-faint truncate text-[11.5px] italic">{record.era}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
            disabled={sizeIdx === 0}
            aria-label={t("Smaller text")}
            data-testid="kindle-font-minus"
            className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSizeIdx((i) => Math.min(READER_SIZES.length - 1, i + 1))}
            disabled={sizeIdx === READER_SIZES.length - 1}
            aria-label={t("Larger text")}
            data-testid="kindle-font-plus"
            className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <span className="mono-label hidden w-10 shrink-0 text-right text-[10px] text-muted-foreground sm:block">
          {Math.round(progress)}%
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close the letter")}
          data-testid="kindle-close"
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="h-px w-full bg-foreground/8">
        <div
          className="h-px transition-[width] duration-200"
          style={{ width: `${progress}%`, background: "var(--scope-a)" }}
        />
      </div>

      {/* the page itself — one long sheet, read at the chosen size */}
      <div
        ref={scrollRef}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          const max = el.scrollHeight - el.clientHeight;
          setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 100);
        }}
        className="nice-scroll flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-[680px] px-6 py-10 sm:px-8 sm:py-14">
          <h1
            className="ink-title text-center text-[26px] font-semibold leading-tight tracking-[0.03em] sm:text-[30px]"
            style={{ fontSize: undefined }}
          >
            {record.title}
          </h1>
          <p className="ink-hand ink-faint mt-2 text-center text-[15px] italic">{record.era}</p>
          <span aria-hidden="true" className="mx-auto mt-6 block h-px w-40" style={{ background: inkLine }} />
          <div className="mt-8 space-y-5">
            {paras.map((para, i) => (
              <p
                key={i}
                className={cn(
                  "ink-hand whitespace-pre-wrap leading-[1.95]",
                  i === 0 &&
                    "first-letter:float-left first-letter:mr-3 first-letter:mt-[7px] first-letter:text-[54px] first-letter:font-semibold first-letter:leading-[0.78]"
                )}
                style={{ fontSize: READER_SIZES[sizeIdx] }}
              >
                {para}
              </p>
            ))}
          </div>
          <p className="ink-hand ink-soft mt-10 text-center text-[15.5px] italic">{record.seal}</p>
          <p className="mono-label mt-8 text-center text-[9px] uppercase tracking-[0.26em] text-muted-foreground/50">
            {footerLabel ?? t("The Akashic Library")}
          </p>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

function AkashicLetter({ resonance }: { resonance: string }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [record, setRecord] = useState<LetterRecord | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const busyRef = useRef(false);

  const fetchRecord = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("loading");
    try {
      const res = await fetch("/api/akashic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, resonance: resonance || null }),
      });
      const data = (await res.json()) as Partial<LetterRecord> & { error?: string };
      if (!res.ok || !data.record) throw new Error(data.error ?? "quiet");
      setRecord({
        title: data.title ?? "A Record Set Aside",
        era: data.era ?? "inscribed in an age the shelves remember",
        record: data.record,
        seal: data.seal ?? "— the Keeper of Records",
      });
      setState("ready");
    } catch {
      setState("error");
    } finally {
      busyRef.current = false;
    }
  }, [language, resonance]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  const preview = record ? record.record.split(/\n{2,}/).slice(0, 2) : [];

  return (
    <div>
      {state === "loading" && (
        <ArtifactLoading phrase={t("the Librarian is drawing a record into the channel...")} bars={4} />
      )}
      {state === "error" && (
        <ArtifactError
          message="The record stayed quiet — rest, then ask again."
          onRetry={() => void fetchRecord()}
          retryLabel="Ask again, softly"
          testid="chat-akashic-retry"
        />
      )}
      {state === "ready" && record && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* the letter, lying on the channel's desk */}
          <div className="relative mx-auto max-w-[560px] rounded-xl border hairline bg-card/70 px-5 py-6 sm:px-7">
            <span aria-hidden="true" className="ink-faint pointer-events-none absolute right-3 top-2 text-[10px] opacity-60">◆</span>
            <h4 className="ink-title text-[17.5px] font-semibold leading-snug" data-testid="chat-akashic-title">
              {record.title}
            </h4>
            <p className="ink-faint mt-1 text-[13px] italic">{record.era}</p>
            <span aria-hidden="true" className="mt-3.5 block h-px w-full" style={{ background: inkLine }} />
            <div className="relative mt-4">
              <div className="ink-hand space-y-3.5 text-[14.5px] leading-[1.9]">
                {preview.map((para, i) => (
                  <p key={i} className={cn(i === 0 && "first-letter:float-left first-letter:mr-2.5 first-letter:mt-[5px] first-letter:text-[42px] first-letter:font-semibold first-letter:leading-[0.8]")}>
                    {para}
                  </p>
                ))}
              </div>
              {/* the rest of the letter waits behind the zoom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{ background: "linear-gradient(180deg, transparent, var(--card))" }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setReaderOpen(true)}
              data-testid="chat-akashic-zoom"
              className={btnGhost}
              style={{ borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)" }}
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              {t("Read the full letter")}
            </button>
            <button type="button" onClick={() => void fetchRecord()} data-testid="chat-akashic-another" className={btnGhost}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("Another record")}
            </button>
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {readerOpen && record && (
          <KindleReader record={record} onClose={() => setReaderOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  1·b · THE TIMELINE RECORD — the quiet notebook at the end of       */
/*      every transmission: one press and the Librarian opens the      */
/*      seeker's OWN book. The question and the transmission above     */
/*      are the key; the record inscribes the trajectory of their      */
/*      own timeline — long, detailed, true — never a random shelf.    */
/* ================================================================== */

export interface PriorExchange {
  q: string;
  t: string;
}

function TimelineRecord({
  question,
  transmission,
  prior,
  testid,
  onAway,
}: {
  question: string;
  transmission: string;
  prior: PriorExchange[];
  testid: string;
  onAway: () => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [record, setRecord] = useState<LetterRecord | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const busyRef = useRef(false);
  /* The record is bound to the exchange as it stood when the notebook
     was opened — a snapshot, never re-keyed by later renders. */
  const initial = useRef({ question, transmission, prior }).current;

  const fetchRecord = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("loading");
    try {
      const res = await fetch("/api/akashic/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, ...initial }),
      });
      const data = (await res.json()) as Partial<LetterRecord> & { error?: string };
      if (!res.ok || !data.record) throw new Error(data.error ?? "quiet");
      setRecord({
        title: data.title ?? "The Volume of Your Days",
        era: data.era ?? "set down in the volume no other hand may open",
        record: data.record,
        seal: data.seal ?? "— The Mirror Entity",
      });
      setState("ready");
    } catch {
      setState("error");
    } finally {
      busyRef.current = false;
    }
  }, [language, initial]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  const preview = record ? record.record.split(/\n{2,}/).slice(0, 2) : [];

  return (
    <div data-testid={testid}>
      {state === "loading" && (
        <ArtifactLoading phrase={t("the Librarian opens your own book...")} bars={4} />
      )}
      {state === "error" && (
        <ArtifactError
          message="The record stayed quiet — rest, then ask again."
          onRetry={() => void fetchRecord()}
          retryLabel="Ask again, softly"
          testid={`${testid}-retry`}
        />
      )}
      {state === "ready" && record && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* the seeker's own book, lying open beneath the words */}
          <div className="relative mx-auto max-w-[560px] rounded-xl border hairline bg-card/70 px-5 py-6 sm:px-7">
            <span aria-hidden="true" className="ink-faint pointer-events-none absolute right-3 top-2 text-[10px] opacity-60">◆</span>
            <p className="mono-label flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
              <NotebookText className="size-3 shrink-0" aria-hidden="true" />
              {t("Drawn from your own timeline")}
            </p>
            <h4 className="ink-title mt-2 text-[17.5px] font-semibold leading-snug" data-testid={`${testid}-title`}>
              {record.title}
            </h4>
            <p className="ink-faint mt-1 text-[13px] italic">{record.era}</p>
            <span aria-hidden="true" className="mt-3.5 block h-px w-full" style={{ background: inkLine }} />
            <div className="relative mt-4">
              <div className="ink-hand space-y-3.5 text-[14.5px] leading-[1.9]">
                {preview.map((para, i) => (
                  <p key={i} className={cn(i === 0 && "first-letter:float-left first-letter:mr-2.5 first-letter:mt-[5px] first-letter:text-[42px] first-letter:font-semibold first-letter:leading-[0.8]")}>
                    {para}
                  </p>
                ))}
              </div>
              {/* the rest of the record waits behind the zoom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                style={{ background: "linear-gradient(180deg, transparent, var(--card))" }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setReaderOpen(true)}
              data-testid={`${testid}-zoom`}
              className={btnGhost}
              style={{ borderColor: "color-mix(in srgb, var(--scope-a) 38%, transparent)" }}
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              {t("Read the full letter")}
            </button>
            <button type="button" onClick={onAway} data-testid={`${testid}-away`} className={btnGhost}>
              <X className="size-3.5" aria-hidden="true" />
              {t("Put the letter away")}
            </button>
          </div>
          <AnimatePresence>
            {readerOpen && (
              <KindleReader record={record} onClose={() => setReaderOpen(false)} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ---------- the end-of-transmission row: label + the notebook pill -- */

export function TimelineRecordSection({
  question,
  transmission,
  prior,
  index,
}: {
  question: string;
  transmission: string;
  prior: PriorExchange[];
  index: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 border-t hairline pt-4" data-testid={`timeline-section-${index}`}>
      {open ? (
        <TimelineRecord
          question={question}
          transmission={transmission}
          prior={prior}
          testid={`timeline-record-${index}`}
          onAway={() => setOpen(false)}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="mono-label text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
            {t("The record of your own timeline")}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-testid={`exchange-akashic-${index}`}
            aria-label={t("Open your record")}
            title={t("Open your record")}
            className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border hairline px-3 text-[11.5px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:text-foreground"
          >
            <NotebookText className="size-3.5" aria-hidden="true" />
            {t("Akashic")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  2 · THE STAR DRAW — three seats dealt in the channel; tap to       */
/*      turn, then let the deck speak.                                 */
/* ================================================================== */

const STAR_EMBLEM = "/images/ai/star-play-emblem.jpg";

function StarDraw() {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [drawn, setDrawn] = useState<DrawnCard[] | null>(null);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [reading, setReading] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    setDrawn(drawStarPlayCards(3));
    setFlipped([false, false, false]);
    setReading(null);
    setState("idle");
  }, []);

  const shuffle = () => {
    setDrawn(drawStarPlayCards(3));
    setFlipped([false, false, false]);
    setReading(null);
    setState("idle");
  };

  const turn = (i: number) =>
    setFlipped((f) => {
      if (f[i]) return f;
      const next = [...f];
      next[i] = true;
      return next;
    });

  const allUp = drawn !== null && flipped.every(Boolean);

  const speak = useCallback(async () => {
    if (!drawn || !allUp || state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/star-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cards: drawn.map((d) => ({
            essence: d.card.essence,
            message: d.card.message,
            position: d.position,
          })),
        }),
      });
      const data = (await res.json()) as { reading?: string; error?: string };
      if (!res.ok || !data.reading) throw new Error(data.error ?? "quiet");
      setReading(data.reading);
      setState("idle");
    } catch {
      setState("error");
    }
  }, [drawn, allUp, state, language]);

  const readingParas = reading ? reading.split(/\n{2,}/) : [];

  return (
    <div>
      {/* the three seats */}
      {drawn && (
        <div className="flex items-start justify-center gap-3 sm:gap-5" data-testid="chat-star-cards">
          {drawn.map((d, i) => (
            <div key={d.card.id} className="flex w-[96px] flex-col items-center sm:w-[116px]">
              <div className="tarot-scene relative h-[150px] w-full sm:h-[176px]" data-testid={`chat-star-card-${i}`}>
                <motion.div
                  className="tarot-inner size-full"
                  initial={{ opacity: 0, y: 26, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateY: flipped[i] ? 180 : 0 }}
                  transition={{
                    opacity: { duration: 0.4, delay: i * 0.1 },
                    y: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.5, delay: i * 0.1 },
                    rotateY: { duration: 0.8, ease: [0.66, 0, 0.32, 1] },
                  }}
                  whileHover={{ y: -4 }}
                >
                  {/* sealed back */}
                  <button
                    type="button"
                    onClick={() => turn(i)}
                    aria-label={t("Turn the card of {seat}", { seat: t(STAR_PLAY_POSITIONS[i]) })}
                    data-testid={`chat-star-turn-${i}`}
                    className="tarot-face tarot-back relative block size-full cursor-pointer overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--scope-a)_38%,transparent)] transition-shadow duration-300"
                  >
                    <span className="tarot-glare pointer-events-none absolute inset-0" aria-hidden="true" />
                    <span className="absolute left-1/2 top-1/2 flex size-[52%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                      <span className="starplay-halo absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_36%,transparent)]" />
                      <img
                        src={STAR_EMBLEM}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-[10%] size-[80%] rounded-full object-cover opacity-90"
                      />
                    </span>
                    <span className="mono-label absolute inset-x-0 bottom-2.5 text-center text-[8px] uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--scope-b)_80%,transparent)]">
                      ◆ {t("Star Play")} ◆
                    </span>
                  </button>
                  {/* the face */}
                  <div
                    className="tarot-face absolute inset-0 flex size-full flex-col overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--scope-a)_42%,transparent)] bg-card"
                    style={{ transform: "rotateY(180deg)" }}
                    data-testid={`chat-star-face-${i}`}
                  >
                    <div className="relative h-[52%] shrink-0 overflow-hidden">
                      <img src={d.card.image} alt="" aria-hidden="true" className="size-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-1.5 text-center">
                      <p className="ink-hand text-[10.5px] font-semibold leading-tight">{d.card.name}</p>
                      <p className="ink-faint mt-1 line-clamp-2 text-[8.5px] italic leading-snug">{d.card.essence}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              <span className="mono-label mt-2 text-center text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/75">
                {t(STAR_PLAY_POSITIONS[i])}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* speak / shuffle — one quiet row */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {!allUp && (
          <p className="text-[12px] italic text-muted-foreground/75">{t("Turn each card when it calls you")}</p>
        )}
        {allUp && !reading && state !== "loading" && (
          <button type="button" onClick={() => void speak()} data-testid="chat-star-speak" className={btnSolid}>
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("Let the deck speak")}
          </button>
        )}
        {state === "loading" && (
          <span className="mono-label flex items-center gap-2 text-[10px] text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            {t("the deck is speaking...")}
          </span>
        )}
        <button type="button" onClick={shuffle} data-testid="chat-star-shuffle" className={btnGhost}>
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t("Shuffle again")}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-3 text-center text-[13px] italic text-muted-foreground">
          {t("The deck stayed quiet — shuffle, then draw again.")}
        </p>
      )}

      {/* the reading — one thread through the three seats */}
      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-[560px] border-t hairline pt-4"
            data-testid="chat-star-reading"
          >
            {readingParas.map((para, i) => {
              const isSignature = para.trim().startsWith("—");
              return (
                <p
                  key={i}
                  className={cn(
                    isSignature
                      ? "mono-label mt-3 text-center text-[10px] tracking-[0.12em] text-muted-foreground"
                      : "ink-hand text-[14.5px] leading-[1.9] text-foreground/90",
                    i === 0 && !isSignature && "font-medium"
                  )}
                >
                  {para}
                </p>
              );
            })}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t hairline pt-3.5">
              <span className="mono-label mr-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
                {t("Woven from")}
              </span>
              {drawn?.map((d) => (
                <span key={d.card.id} className="rounded-full border hairline px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  {t(d.position)}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  3 · THE MANIFESTING RITUAL — intention, one carrier wave, one      */
/*      dial; charged right here into a compact blueprint.             */
/* ================================================================== */

interface MiniBlueprint {
  title: string;
  field_state: string;
  visualization: string;
  micro_actions: string[];
  affirmation: string;
  window: string;
  caution: string;
}

function ManifestRitual({ resonance }: { resonance: string }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [stage, setStage] = useState<"compose" | "charging" | "blueprint">("compose");
  const [intention, setIntention] = useState(resonance.slice(0, 400));
  const [emotion, setEmotion] = useState(labFrequencies[0].id);
  const [intensity, setIntensity] = useState(6);
  const [blueprint, setBlueprint] = useState<MiniBlueprint | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const charge = async () => {
    if (!intention.trim() || stage === "charging") return;
    setStage("charging");
    setError(false);
    setProgress(0);
    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(92, p + 3 + Math.random() * 5));
    }, 90);
    try {
      const [res] = await Promise.all([
        fetch("/api/manifest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intention: intention.trim(), emotion, intensity, language }),
        }),
        new Promise((r) => window.setTimeout(r, 2100)), /* let the orb breathe */
      ]);
      const data = (await (res as Response).json()) as { blueprint?: MiniBlueprint; error?: string };
      if (!(res as Response).ok || !data.blueprint) throw new Error(data.error ?? "quiet");
      window.clearInterval(tick);
      setProgress(100);
      setBlueprint(data.blueprint);
      setStage("blueprint");
    } catch {
      window.clearInterval(tick);
      setError(true);
      setStage("compose");
    }
  };

  const R = 30;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="mx-auto max-w-[560px]" data-testid="chat-manifest">
      {stage === "compose" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label htmlFor="chat-manifest-intention" className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-[var(--scope-a)]">
            {t("Intention · what do you choose to create?")}
          </label>
          <textarea
            id="chat-manifest-intention"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder={t("Speak it plainly — the chamber understands plain words best…")}
            data-testid="chat-manifest-intention"
            className="focus-glow mt-2 w-full resize-none rounded-xl border hairline bg-background/50 px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
          />
          <p className="mono-label mt-3 text-[9.5px] uppercase tracking-[0.2em] text-[var(--scope-a)]">
            {t("Emotional frequency · the carrier wave")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("Emotional frequency · the carrier wave")}>
            {labFrequencies.map((f) => {
              const active = f.id === emotion;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={t(f.hint)}
                  onClick={() => setEmotion(f.id)}
                  data-testid={`chat-manifest-freq-${f.id}`}
                  className={cn(
                    "focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-all duration-300",
                    active
                      ? "border-[var(--scope-a)] font-semibold text-foreground"
                      : "hairline text-muted-foreground hover:text-foreground"
                  )}
                  style={active ? { background: "color-mix(in srgb, var(--scope-a) 12%, transparent)" } : undefined}
                >
                  <span aria-hidden="true" className="emoji-ink">{f.glyph}</span>
                  {t(f.label)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="mono-label shrink-0 text-[9.5px] uppercase tracking-[0.2em] text-[var(--scope-a)]">
              {t("Chamber intensity")}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              aria-label={t("Chamber intensity")}
              data-testid="chat-manifest-intensity"
              className="h-1 min-w-0 flex-1 accent-[var(--scope-a)]"
            />
            <span className="mono-label w-8 text-right text-[11px] text-muted-foreground">{intensity}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => void charge()} disabled={!intention.trim()} data-testid="chat-manifest-charge" className={btnSolid}>
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("Charge the intention")}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-center text-[13px] italic text-muted-foreground">
              {t("The chamber stayed quiet — rest, then charge again.")}
            </p>
          )}
        </motion.div>
      )}

      {stage === "charging" && (
        <div className="flex flex-col items-center py-2" aria-busy="true">
          <div className="relative size-[88px]" aria-hidden="true">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r={R} fill="none" stroke="color-mix(in srgb, var(--scope-a) 16%, transparent)" strokeWidth="2.5" />
              <circle
                cx="44" cy="44" r={R}
                fill="none"
                stroke="var(--scope-a)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress / 100)}
                style={{ transition: "stroke-dashoffset 120ms linear" }}
              />
            </svg>
            <span className="mono-label absolute inset-0 flex items-center justify-center text-[13px] font-semibold" style={{ color: "var(--scope-a)" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <p className="ink-faint mt-3 text-[13.5px] italic">{t("Charging the field…")}</p>
        </div>
      )}

      {stage === "blueprint" && blueprint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          data-testid="chat-manifest-blueprint"
        >
          <div className="flex items-center gap-3.5">
            <InkSigil text={blueprint.title} size={52} />
            <div className="min-w-0">
              <h4 className="ink-title text-[17px] font-semibold leading-snug">{blueprint.title}</h4>
              <p className="ink-faint mt-0.5 text-[12.5px] italic">{t("A charged blueprint")}</p>
            </div>
          </div>
          <p className="ink-hand mt-4 text-[14px] leading-[1.85] text-foreground/90">{blueprint.field_state}</p>
          <p className="ink-faint mt-3 border-l-2 pl-3 text-[13.5px] italic leading-[1.8]" style={{ borderColor: "color-mix(in srgb, var(--scope-a) 45%, transparent)" }}>
            {blueprint.visualization}
          </p>
          <ol className="mt-4 space-y-2">
            {blueprint.micro_actions.slice(0, 3).map((a, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mono-label mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[9px]"
                  style={{ borderColor: "color-mix(in srgb, var(--scope-a) 40%, transparent)", color: "var(--scope-a)" }}
                >
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-relaxed text-foreground/88">{a}</span>
              </li>
            ))}
          </ol>
          <p className="ink-hand mt-4 text-center text-[15px] font-medium italic leading-[1.8]">“{blueprint.affirmation}”</p>
          <p className="ink-faint mt-3 text-center text-[12px] italic">{blueprint.window}</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => { setStage("compose"); setBlueprint(null); }}
              data-testid="chat-manifest-again"
              className={btnGhost}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("Charge a new intention")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  4 · THE FORGE STRIKE — turn three small dials, strike, and one     */
/*      unasked creation cools in the channel.                         */
/* ================================================================== */

interface MiniMystery {
  name: string;
  essence: string;
  purpose: string;
  first_stroke: string;
  whisper: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ForgeStrike({ resonance }: { resonance: string }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  /* The seeker's own words — a complete ask strikes directly, the
     dial bench yielding to the vision already spoken. A bare naming
     ("the forge") keeps the bench: the dials wait for the hand. */
  const directive = useMemo(() => forgeDirective(resonance), [resonance]);
  const [manual, setManual] = useState(false);
  const [dials, setDials] = useState({
    domain: pick(forgeDomains).id,
    scale: pick(forgeScales).id,
    spark: pick(forgeSparks).id,
  });
  const [stage, setStage] = useState<"idle" | "forging" | "ready" | "error">("idle");
  const [mystery, setMystery] = useState<MiniMystery | null>(null);
  const [phase, setPhase] = useState(0);
  const struckRef = useRef(false);

  const strike = async (directiveOverride?: string | null) => {
    if (stage === "forging") return;
    const useDirective =
      directiveOverride === undefined ? directive : directiveOverride;
    setStage("forging");
    setMystery(null);
    const cycle = window.setInterval(
      () => setPhase((p) => (p + 1) % forgePhases.length),
      650,
    );
    try {
      const [res] = await Promise.all([
        fetch("/api/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dials,
            language,
            ...(useDirective ? { directive: useDirective } : {}),
          }),
        }),
        new Promise((r) => window.setTimeout(r, 2000)), /* let the embers breathe */
      ]);
      const data = (await (res as Response).json()) as {
        mystery?: MiniMystery;
        error?: string;
      };
      if (!(res as Response).ok || !data.mystery)
        throw new Error(data.error ?? "quiet");
      window.clearInterval(cycle);
      setMystery(data.mystery);
      setStage("ready");
    } catch {
      window.clearInterval(cycle);
      setStage("error");
    }
  };

  /* the directive strikes the moment the bench is mounted — the ask
     was already complete, nothing waits for another click */
  useEffect(() => {
    if (!directive || manual || struckRef.current) return;
    struckRef.current = true;
    void strike();
  }, [directive, manual]);

  const dialRow = (
    label: string,
    options: typeof forgeDomains,
    key: "domain" | "scale" | "spark",
    testid: string,
  ) => (
    <div>
      <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-[var(--scope-a)]">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = dials[key] === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setDials((d) => ({ ...d, [key]: o.id }));
                setStage("idle");
                setMystery(null);
              }}
              aria-pressed={active}
              title={t(o.hint)}
              data-testid={`${testid}-${o.id}`}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground",
              )}
              style={
                active
                  ? { background: "color-mix(in srgb, var(--scope-a) 12%, transparent)" }
                  : undefined
              }
            >
              <span aria-hidden="true" className="emoji-ink">{o.emoji}</span>
              {t(o.label)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[560px]" data-testid="chat-forge">
      {directive && !manual ? (
        <div className="text-center">
          <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("the forge heard your words — shaping them now")}
          </p>
          {stage === "idle" && (
            <button
              type="button"
              onClick={() => setManual(true)}
              data-testid="chat-forge-manual"
              className="mono-label mt-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 underline-offset-2 transition-colors duration-300 hover:text-foreground hover:underline"
            >
              {t("turn the dials instead")}
            </button>
          )}
        </div>
      ) : (
        <>
          {dialRow(t("What it is"), forgeDomains, "domain", "chat-forge-domain")}
          <div className="mt-3">{dialRow(t("How much world"), forgeScales, "scale", "chat-forge-scale")}</div>
          <div className="mt-3">{dialRow(t("Which energy"), forgeSparks, "spark", "chat-forge-spark")}</div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => void strike(null)}
              disabled={stage === "forging"}
              data-testid="chat-forge-strike"
              className={btnSolid}
            >
              <Hammer className="size-3.5" aria-hidden="true" />
              {t("Strike the Forge")}
            </button>
          </div>
        </>
      )}

      {stage === "forging" && (
        <p
          className="mono-label mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"
          aria-busy="true"
        >
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          {t(forgePhases[phase])}
        </p>
      )}
      {stage === "error" && (
        <p className="mt-4 text-center text-[13px] italic text-muted-foreground">
          {t("The forge stayed quiet — strike again.")}
        </p>
      )}
      {stage === "error" && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => void strike(manual || !directive ? null : directive)}
            data-testid="chat-forge-retry"
            className={btnGhost}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("Strike again")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {stage === "ready" && mystery && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 border-t hairline pt-4"
            data-testid="chat-forge-mystery"
          >
            <div className="flex items-center gap-3.5">
              <InkSigil text={mystery.name} size={48} />
              <h4 className="ink-title text-[16.5px] font-semibold leading-snug">{mystery.name}</h4>
            </div>
            <p className="mt-3 text-[13.5px] leading-[1.85] text-foreground/88">{mystery.essence}</p>
            <p className="mt-2.5 text-[13.5px] leading-[1.85] text-foreground/88">
              <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("What it changes")}</span>
              {mystery.purpose}
            </p>
            <div
              className="mt-3.5 rounded-lg border-l-2 px-3 py-2"
              style={{
                borderColor: "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                background: "color-mix(in srgb, var(--scope-a) 7%, transparent)",
              }}
            >
              <span className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{t("The first stroke")}</span>
              <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/92">{mystery.first_stroke}</p>
            </div>
            <p className="ink-faint mt-3.5 text-center text-[12.5px] italic">{mystery.whisper}</p>
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => void strike()} data-testid="chat-forge-again" className={btnGhost}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                {t("Forge another")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  THE POOM CARD — a poem woven as its own artifact, straight into    */
/*  the channel. No mirror speech around it: the ink itself is the     */
/*  reply. The visitor's words are the loom's tuning; the poem weaves  */
/*  the moment the card mounts, and another can be woven at will.      */
/* ================================================================== */

interface WovenPoem {
  title: string;
  epigraph: string;
  stanzas: string[][];
  seal: string;
}

function PoemCard({ resonance }: { resonance: string }) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [poem, setPoem] = useState<WovenPoem | null>(null);
  const [copied, setCopied] = useState(false);
  const busyRef = useRef(false);

  const weave = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("loading");
    setCopied(false);
    try {
      const res = await fetch("/api/poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resonance, language }),
      });
      const data = (await res.json()) as { poem?: WovenPoem; error?: string };
      if (!res.ok || !data.poem) throw new Error(data.error ?? "quiet");
      setPoem(data.poem);
      setState("ready");
    } catch {
      setState("error");
    } finally {
      busyRef.current = false;
    }
  }, [language, resonance]);

  useEffect(() => {
    void weave();
  }, [weave]);

  const copyPoem = async () => {
    if (!poem) return;
    const text = [
      poem.title,
      ...(poem.epigraph ? [poem.epigraph] : []),
      ...poem.stanzas.map((s) => s.join("\n")),
      ...(poem.seal ? [`— ${poem.seal}`] : []),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ description: t("copied") });
    } catch {
      /* the clipboard may be sealed — the poem remains on the page */
    }
  };

  return (
    <div className="mx-auto max-w-[560px]" data-testid="chat-poem">
      {state === "loading" && (
        <ArtifactLoading phrase={t("the loom is writing your poem...")} bars={4} />
      )}
      {state === "error" && (
        <ArtifactError
          message={t("The loom fell silent — the poem could not be woven. Rest a breath, then reach again.")}
          onRetry={() => void weave()}
          retryLabel={t("Weave again")}
          testid="chat-poem-retry"
        />
      )}
      {state === "ready" && poem && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          data-testid="chat-poem-body"
        >
          <div className="text-center">
            <h4 className="ink-title text-[17px] font-semibold leading-snug">
              {poem.title}
            </h4>
            {poem.epigraph && (
              <p className="ink-faint mt-1.5 text-[12.5px] italic">{poem.epigraph}</p>
            )}
          </div>
          <div
            className="mx-auto mt-4 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--scope-a) 55%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
          <div className="mt-5 space-y-5">
            {poem.stanzas.map((stanza, i) => (
              <div key={i} className="space-y-1 text-center">
                {stanza.map((line, j) => (
                  <p
                    key={j}
                    className="ink-hand text-[14.5px] leading-[1.9] text-foreground/90"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
          {poem.seal && (
            <p className="ink-faint mt-5 text-right text-[12.5px] italic">
              — {poem.seal}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void copyPoem()}
              data-testid="chat-poem-copy"
              className={btnGhost}
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied ? t("copied") : t("copy")}
            </button>
            <button
              type="button"
              onClick={() => void weave()}
              data-testid="chat-poem-again"
              className={btnGhost}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("Weave another poem")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  THE BOOK WEAVER — a volume woven inside the conversation.          */
/*  The mirror asks about the book (what it breathes, who reads it,    */
/*  what shape the tale takes), then the loom binds it right here:     */
/*  pages readable in the chat box, onward and rest, and a full        */
/*  screen reader. No journey to any other room is ever needed.        */
/* ================================================================== */

interface WeaverPage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

interface WeaverMeta {
  title?: string;
  subtitle?: string;
  sigil?: string;
  axiom?: string;
  dedication?: string;
  totalPages?: number;
}

const WEAVE_INK_LINE =
  "linear-gradient(90deg, transparent, color-mix(in srgb, var(--foreground) 28%, transparent), transparent)";

/**
 * The clean page — scroll-reveal handlers for a reading room: drift
 * down and the buttons fade away; drift up and they return. The
 * reveal only arms when the room actually overflows, so a short
 * page keeps its buttons steady.
 */
function useScrollReveal(setVisible: (v: boolean) => void) {
  const lastTop = useRef(0);
  const touchY = useRef<number | null>(null);
  return useMemo(
    () => ({
      onScroll: (e: ReactUIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const top = el.scrollTop;
        const scrollable = el.scrollHeight > el.clientHeight + 8;
        if (top <= 2) {
          setVisible(true);
        } else if (scrollable) {
          if (top > lastTop.current + 4 && top > 48) setVisible(false);
          else if (top < lastTop.current - 4) setVisible(true);
        }
        lastTop.current = top;
      },
      onWheel: (e: ReactWheelEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight <= el.clientHeight + 8) return;
        if (e.deltaY > 10) setVisible(false);
        else if (e.deltaY < -10) setVisible(true);
      },
      onTouchStart: (e: ReactTouchEvent<HTMLDivElement>) => {
        touchY.current = e.touches[0]?.clientY ?? null;
      },
      onTouchMove: (e: ReactTouchEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight <= el.clientHeight + 8) return;
        const y = e.touches[0]?.clientY ?? null;
        if (touchY.current != null && y != null) {
          const dy = touchY.current - y;
          if (dy > 14) setVisible(false);
          else if (dy < -14) setVisible(true);
        }
        touchY.current = y;
      },
      onTouchEnd: () => {
        touchY.current = null;
      },
    }),
    [setVisible]
  );
}

function BookWeaver({
  resonance,
  resume,
}: {
  resonance: string;
  /** The visitor asked for their paused volume back — the weaver
      mounts open at the exact spread where the book was laid to rest. */
  resume?: boolean;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const pauseChatBook = useMirror((s) => s.pauseChatBook);
  const savedBook = useMirror((s) => s.chatBook);

  const [stage, setStage] = useState<"ask" | "weaving" | "reading">("ask");
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  /* carry the visitor's own words in, lightly unhooked from the ask —
     when they hold a subject, the boot below begins the weaving at
     once, so the loom's first question never waits */
  const [topicDraft, setTopicDraft] = useState(() => {
    const stripped = resonance
      .replace(
        /\b(please\s+)?(can|could|would)\s+you\b/i,
        ""
      )
      .replace(
        /\b(make|create|craft|write|weave|compose|manifest|start|begin|open)\b[^.?!]{0,32}\b(a|an|the|my|me|us)?\s*(book|storybook|volume|tale|story|novel)\b/i,
        ""
      )
      .replace(/^\s*(about|on|of|for)\s+/i, "")
      .replace(/[\s.!?]+$/, "")
      .trim();
    return stripped.slice(0, 300);
  });
  const [age, setAge] = useState("timeless");
  const [tale, setTale] = useState("wonder");

  const [meta, setMeta] = useState<WeaverMeta | null>(null);
  const [pages, setPages] = useState<WeaverPage[]>([]);
  const [spread, setSpread] = useState(0);
  const [ended, setEnded] = useState(false);
  const [weaving, setWeaving] = useState(false);
  const [weaveFailed, setWeaveFailed] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [copied, setCopied] = useState(false);

  /* the pages already woven AHEAD of the turn — when the reader
     reaches the last ready spread, the loom quietly prepares the
     next two pages in the background, so the turn is instant */
  const [buffer, setBuffer] = useState<{
    pages: WeaverPage[];
    threads: string;
  } | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [awaitingBuffer, setAwaitingBuffer] = useState(false);

  /* the clean page — the buttons reveal when the reader drifts up
     and fade away when they drift down, the words alone remaining */
  const [chromeShown, setChromeShown] = useState(true);
  const [readerChromeShown, setReaderChromeShown] = useState(true);
  const [resumed, setResumed] = useState(false);

  const weaveToken = useRef(0);
  const bookIdRef = useRef("");

  const readerLabel = READERS.find((r) => r.id === age)?.label ?? "";
  const taleLabel = TALES.find((tl) => tl.id === tale)?.label ?? "";

  const stripTopic = () => {
    const v = topicDraft.trim();
    if (!v) return;
    setTopic(v.slice(0, 600));
    setStep(1);
  };

  const pagesRef = useRef<WeaverPage[]>([]);
  const threadsRef = useRef("");
  const metaRef = useRef<WeaverMeta | null>(null);
  const endedRef = useRef(false);
  const bufferRef = useRef<{
    pages: WeaverPage[];
    threads: string;
  } | null>(null);
  const prefetchBlocked = useRef(false);
  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);

  const bodyFor = useCallback(
    (phase: "open" | "next" | "close", topicOverride?: string) => {
      const theTopic = topicOverride ?? topic;
      return phase === "open"
        ? {
            phase,
            language,
            config: { age, tale, volume: "classic", topic: theTopic },
          }
        : {
            phase,
            language,
            config: { age, tale, volume: "classic", topic: theTopic },
            /* the loom remembers the volume it already bound */
            bookId: bookIdRef.current,
            bookMeta: metaRef.current ?? {},
            bookConfig: { age, tale, volume: "classic", topic: theTopic },
            threads: threadsRef.current,
            bookPages: pagesRef.current,
            pageNumber: pagesRef.current.length + 1,
            totalPages: metaRef.current?.totalPages ?? 120,
            recentPages: pagesRef.current
              .slice(-2)
              .map((p) => p.paragraphs.join(" ")),
            rewrites: [],
          };
    },
    [age, tale, topic, language]
  );

  const weave = useCallback(
    async (phase: "open" | "next" | "close", topicOverride?: string) => {
      const token = ++weaveToken.current;
      setWeaving(true);
      setWeaveFailed(false);
      try {
        const res = await fetch("/api/dream-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyFor(phase, topicOverride)),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.pages?.length) {
          throw new Error(data?.error || "the loom fell silent");
        }
        if (token !== weaveToken.current) return;
        if (typeof data.threads === "string" && data.threads)
          threadsRef.current = data.threads;
        if (typeof data.libraryId === "string" && data.libraryId) {
          bookIdRef.current = data.libraryId;
        }
        if (phase === "open") {
          const m: WeaverMeta = {
            title: data.title,
            subtitle: data.subtitle,
            sigil: data.sigil,
            axiom: data.axiom,
            dedication: data.dedication,
            totalPages: data.totalPages,
          };
          metaRef.current = m;
          setMeta(m);
          pagesRef.current = data.pages as WeaverPage[];
          setPages(pagesRef.current);
          setSpread(0);
          setEnded(false);
          endedRef.current = false;
          setBuffer(null);
          setBuffering(false);
          bufferToken.current += 1;
          setResumed(false);
          setStage("reading");
          setChromeShown(true);
        } else {
          const next = [...pagesRef.current, ...(data.pages as WeaverPage[])];
          pagesRef.current = next;
          setPages(next);
          if (
            typeof data.totalPages === "number" &&
            metaRef.current
          ) {
            metaRef.current = {
              ...metaRef.current,
              totalPages: data.totalPages,
            };
            setMeta(metaRef.current);
          }
          if (phase === "close") {
            endedRef.current = true;
            setEnded(true);
            /* any pages still waiting in the loom's hands are let go —
               the seal of closing supersedes them */
            bufferToken.current += 1;
            setBuffer(null);
          }
          setSpread((prev) => prev + 1);
          setChromeShown(true);
        }
      } catch {
        if (token === weaveToken.current) setWeaveFailed(true);
      } finally {
        if (token === weaveToken.current) setWeaving(false);
      }
    },
    [bodyFor]
  );

  /* the loom's quiet hands — the next two pages prepared in the
     background the moment the reader reaches the last ready spread,
     so turning the page never waits for the weaving */
  const bufferToken = useRef(0);
  const prefetch = useCallback(async () => {
    if (bufferRef.current || endedRef.current) return;
    const token = ++bufferToken.current;
    setBuffering(true);
    try {
      const res = await fetch("/api/dream-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyFor("next")),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.pages?.length) return;
      if (token !== bufferToken.current) return;
      setBuffer({
        pages: data.pages as WeaverPage[],
        threads:
          typeof data.threads === "string" && data.threads
            ? data.threads
            : threadsRef.current,
      });
    } catch {
      /* silent — the turn itself will call the loom aloud */
      prefetchBlocked.current = true;
    } finally {
      if (token === bufferToken.current) setBuffering(false);
    }
  }, [bodyFor]);

  /** Lay the waiting pages into the book and advance one spread. */
  const applyBuffer = useCallback(() => {
    const buf = bufferRef.current;
    if (!buf) return;
    bufferRef.current = null;
    setBuffer(null);
    if (buf.threads) threadsRef.current = buf.threads;
    const next = [...pagesRef.current, ...buf.pages];
    pagesRef.current = next;
    setPages(next);
    setSpread((s) => s + 1);
    setChromeShown(true);
  }, []);

  const turnPage = useCallback(() => {
    if (!ended && spread < Math.max(1, Math.ceil(pages.length / 2)) - 1) {
      setSpread((s) => s + 1);
      return;
    }
    if (bufferRef.current) {
      applyBuffer();
      return;
    }
    if (buffering) {
      /* the loom is already at work — turn the moment it lands */
      setAwaitingBuffer(true);
      return;
    }
    void weave("next");
  }, [applyBuffer, buffering, ended, pages.length, spread, weave]);

  /* the waiting turn — the visitor asked for the next page while the
     loom was still preparing it: the moment the pages land, the
     page turns by itself */
  useEffect(() => {
    if (awaitingBuffer && buffer) {
      setAwaitingBuffer(false);
      applyBuffer();
    }
  }, [awaitingBuffer, buffer, applyBuffer]);

  /* the ready hands — viewing the last ready spread wakes the loom's
     quiet preparation of the next two pages (one attempt per spread:
     a silent loom must never spin in the dark forever) */
  const spreadCount = Math.max(1, Math.ceil(pages.length / 2));
  useEffect(() => {
    prefetchBlocked.current = false;
  }, [spread]);
  useEffect(() => {
    if (stage !== "reading" || ended || weaving || buffering || buffer) return;
    if (prefetchBlocked.current) return;
    if (spread < spreadCount - 1) return;
    void prefetch();
  }, [stage, ended, weaving, buffering, buffer, spread, spreadCount, prefetch]);

  /* the latest weaving, callable from the one-time boot */
  const weaveRef = useRef(weave);
  useEffect(() => {
    weaveRef.current = weave;
  }, [weave]);

  /* -------- the boot: a returned volume opens where it rested;
     a spoken subject begins the weaving at once — the book is
     created from the visitor's own words, no further steps -------- */
  const bootRef = useRef(false);
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    if (resume && savedBook && savedBook.pages.length > 0) {
      bookIdRef.current = savedBook.bookId;
      setAge(savedBook.config.age);
      setTale(savedBook.config.tale);
      setTopic(savedBook.config.topic);
      setTopicDraft(savedBook.config.topic);
      metaRef.current = { ...savedBook.meta };
      setMeta(metaRef.current);
      pagesRef.current = savedBook.pages.map((p) => ({
        ...p,
        paragraphs: [...p.paragraphs],
      }));
      setPages(pagesRef.current);
      threadsRef.current = savedBook.threads;
      endedRef.current = savedBook.ended;
      setEnded(savedBook.ended);
      setSpread(
        Math.min(
          savedBook.spread,
          Math.max(0, Math.ceil(pagesRef.current.length / 2) - 1)
        )
      );
      setStage("reading");
      setResumed(true);
      return;
    }
    /* the visitor's own words are the thread — the subject they spoke
       is already unhooked from the ask: the loom begins at once */
    const firstTopic = topicDraft.trim();
    if (firstTopic) {
      setTopic(firstTopic.slice(0, 600));
      setStage("weaving");
      void weaveRef.current("open", firstTopic.slice(0, 600));
    }
  }, []);

  /* the chrome revealers — the clean page law of this reading room */
  const spreadScroll = useScrollReveal(setChromeShown);
  const readerScroll = useScrollReveal(setReaderChromeShown);

  /* the whole volume, ready to travel — the copy button's cargo */
  const copyBook = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bookToText(metaRef.current, pagesRef.current));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — quiet fail */
    }
  }, []);

  /* the pause — the volume laid to rest at the exact spread the
     visitor stands on; asking the mirror brings it back here */
  const saveBook = useCallback(() => {
    pauseChatBook({
      bookId: bookIdRef.current,
      config: { age, tale, topic },
      meta: metaRef.current ?? {},
      pages: pagesRef.current,
      threads: threadsRef.current,
      spread,
      ended,
      savedAt: new Date().toISOString(),
    });
    toast({
      title: t("The volume rests at page {n}.", { n: String(spread * 2 + 1) }),
      description: t(
        "Ask the mirror to bring your book back, and it will open exactly here."
      ),
    });
  }, [age, ended, pauseChatBook, spread, t, tale, topic]);

  /* escape leaves the full reader, as every quiet room does */
  useEffect(() => {
    if (!fullOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullOpen]);

  const displayPages = useMemo(() => dedupeChapters(pages), [pages]);
  const spreadPages = displayPages.slice(spread * 2, spread * 2 + 2);

  /* ---------------- the asking ---------------- */
  if (stage === "ask") {
    return (
      <div className="mt-1" data-testid="book-weaver">
        {/* settled answers — the shape already chosen */}
        <div className="mb-3 space-y-1.5">
          {topic && (
            <p className="ink-hand text-[14px] italic text-muted-foreground">
              <span className="mono-label mr-2 text-[8.5px] uppercase tracking-[0.2em] not-italic">
                {t("The subject")}
              </span>
              {topic}
            </p>
          )}
          {step > 1 && (
            <p className="ink-hand text-[14px] italic text-muted-foreground">
              <span className="mono-label mr-2 text-[8.5px] uppercase tracking-[0.2em] not-italic">
                {t("The reader")}
              </span>
              {t(readerLabel)}
            </p>
          )}
          {step > 2 && (
            <p className="ink-hand text-[14px] italic text-muted-foreground">
              <span className="mono-label mr-2 text-[8.5px] uppercase tracking-[0.2em] not-italic">
                {t("The shape")}
              </span>
              {t(taleLabel)}
            </p>
          )}
        </div>

        {step === 0 && (
          <div>
            <p className="ink-hand text-[15.5px] leading-relaxed text-foreground/90">
              {t(
                "A volume, woven right here. What shall it breathe — name the subject, the world, the wish it carries?"
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                stripTopic();
              }}
              className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-4 pr-1 transition-all duration-300 focus-within:border-foreground/35"
            >
              <input
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                autoFocus
                maxLength={600}
                data-testid="book-topic-input"
                placeholder={t("A book about…")}
                aria-label={t("The subject of the book")}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!topicDraft.trim()}
                aria-label={t("Continue")}
                className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </form>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="ink-hand text-[15.5px] leading-relaxed text-foreground/90">
              {t("And who will hold it — whose eyes are these pages for?")}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {READERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setAge(r.id);
                    setStep(2);
                  }}
                  data-testid={`book-reader-${r.id}`}
                  className="focus-glow rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
                >
                  {t(r.label)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="ink-hand text-[15.5px] leading-relaxed text-foreground/90">
              {t("And what shape shall the tale take?")}
            </p>
            <div className="mt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-testid="book-tale-trigger"
                    className="focus-glow flex min-w-[190px] items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground transition-all duration-300 hover:border-foreground/40"
                  >
                    <span className="truncate">{t(taleLabel)}</span>
                    <ChevronsUpDown
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="nice-scroll max-h-[290px] w-[220px] overflow-y-auto"
                >
                  {TALES.map((tl) => (
                    <DropdownMenuItem
                      key={tl.id}
                      onSelect={() => {
                        setTale(tl.id);
                        setStep(3);
                      }}
                      data-testid={`book-tale-${tl.id}`}
                      className={cn(
                        "cursor-pointer justify-between gap-3 text-[13px]",
                        tl.id === tale &&
                          "bg-foreground/8 font-medium text-foreground"
                      )}
                    >
                      <span className="truncate">{t(tl.label)}</span>
                      {tl.id === tale && (
                        <Check className="size-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="ink-hand text-[15.5px] leading-relaxed text-foreground/90">
              {t("So it is set:")}{" "}
              <span className="italic">
                {t(taleLabel)} · {t(readerLabel)}
              </span>
              {topic ? (
                <>
                  {" — "}
                  <span className="italic">{topic}</span>
                </>
              ) : null}
              . {t("Shall I begin the weaving?")}
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStage("weaving");
                  void weave("open");
                }}
                data-testid="book-weave-btn"
                className="focus-glow flex h-9 items-center gap-2 rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-all duration-300 hover:-translate-y-px"
              >
                <BookMarked className="size-3.5" aria-hidden="true" />
                {t("Weave the book")}
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="focus-glow flex h-9 items-center gap-2 rounded-full border border-border px-4 text-[13px] text-muted-foreground transition-all duration-300 hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                {t("Adjust the shape")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- the weaving ---------------- */
  if (stage === "weaving") {
    return (
      <div
        className="mt-1 flex flex-col items-center gap-3 py-10 text-center"
        data-testid="book-weaving"
      >
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="ink-hand text-[14.5px] italic text-muted-foreground">
          {t("The loom weaves the first pages…")}
        </p>
        {weaveFailed && (
          <p className="ink-hand text-[13.5px] italic text-muted-foreground">
            {t(
              "The loom fell silent for a moment. Breathe, then weave again."
            )}{" "}
            <button
              type="button"
              onClick={() => void weave("open")}
              data-testid="book-weaving-retry"
              className="focus-glow underline underline-offset-4 hover:text-foreground"
            >
              {t("Weave again")}
            </button>
          </p>
        )}
      </div>
    );
  }

  /* ---------------- the reading ---------------- */
  return (
    <div className="mt-1" data-testid="book-reader">
      {/* the book's face */}
      {meta?.title && (
        <div className="mb-4 text-center">
          <p className="ink-title text-[19px] font-semibold leading-snug">
            {meta.title}
          </p>
          {meta.subtitle && (
            <p className="ink-hand ink-faint mt-1 text-[13px] italic">
              {meta.subtitle}
            </p>
          )}
          {meta.sigil && (
            <p className="ink-hand ink-faint mt-1.5 text-[12.5px] italic">
              ✦ {meta.sigil}
            </p>
          )}
          <span
            aria-hidden="true"
            className="mx-auto mt-3 block h-px w-32"
            style={{ background: WEAVE_INK_LINE }}
          />
        </div>
      )}

      {/* the returned volume — one quiet line telling the reader
          exactly where the book came back to them */}
      {resumed && (
        <p
          className="ink-hand mb-3 text-center text-[13px] italic text-muted-foreground"
          data-testid="book-resumed-note"
        >
          ✦ {t("Brought back to page {n}.", { n: String(spread * 2 + 1) })}
        </p>
      )}

      {/* the spread — two pages at rest */}
      <div
        {...spreadScroll}
        className="nice-scroll max-h-[440px] space-y-5 overflow-y-auto rounded-xl border border-border bg-card/40 px-4 py-5 sm:px-6"
      >
        {spreadPages.map((p) => (
          <div key={p.n}>
            {p.chapter && (
              <p className="ink-hand mb-2.5 text-center text-[14px] italic text-muted-foreground">
                {p.chapter}
              </p>
            )}
            <div className="space-y-3">
              {p.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={cn(
                    "ink-hand whitespace-pre-wrap text-[15.5px] leading-[1.9] text-foreground/92",
                    /* the great letter rises only where a chapter truly
                       opens — most pages begin as plain, clean prose */
                    p.chapter &&
                      i === 0 &&
                      "first-letter:float-left first-letter:mr-3 first-letter:mt-[6px] first-letter:text-[42px] first-letter:font-semibold first-letter:leading-[0.8]"
                  )}
                >
                  {para}
                </p>
              ))}
            </div>
            <p className="mt-3 text-center text-[10.5px] text-muted-foreground/60">
              {p.n}
            </p>
          </div>
        ))}
      </div>

      {/* the fading chrome — the clean page law: drifting down lets the
          buttons fade away, drifting up reveals them again */}
      <div
        data-testid="book-chrome"
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          chromeShown
            ? "max-h-56 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        )}
      >
        {/* the sheet navigation */}
        {pages.length > 0 && (
          <div className="mt-2.5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSpread((s) => Math.max(0, s - 1))}
              disabled={spread === 0}
              aria-label={t("The page before")}
              className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            <span className="mono-label text-[9.5px] tracking-[0.18em] text-muted-foreground">
              {t("page")} {spread * 2 + 1}
              {spreadPages[1] ? `–${spreadPages[1].n}` : ""} /{" "}
              {meta?.totalPages ?? pages.length}
            </span>
            <button
              type="button"
              onClick={turnPage}
              disabled={ended}
              aria-label={t("The next page")}
              className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* the loom's row — full screen, the turn, the copy, the pause */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFullOpen(true)}
            data-testid="book-fullscreen"
            className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
          >
            <Maximize2 className="size-3" aria-hidden="true" />
            {t("Full screen")}
          </button>
          {!ended && (
            <button
              type="button"
              onClick={turnPage}
              disabled={weaving}
              data-testid="book-turn"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[12px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:opacity-40"
            >
              <BookOpen className="size-3" aria-hidden="true" />
              {buffer
                ? t("Turn the page")
                : weaving
                  ? t("The loom weaves the next pages…")
                  : t("Weave onward")}
            </button>
          )}
          <button
            type="button"
            onClick={() => void copyBook()}
            data-testid="book-copy"
            aria-label={copied ? t("Book copied") : t("Copy the book")}
            title={copied ? t("Book copied") : t("Copy the book")}
            className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
            {copied ? t("Book copied") : t("Copy the book")}
          </button>
          <button
            type="button"
            onClick={saveBook}
            data-testid="book-save"
            className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
          >
            <Bookmark className="size-3" aria-hidden="true" />
            {t("Rest the book here")}
          </button>
          {!ended && (
            <button
              type="button"
              onClick={() => void weave("close")}
              disabled={weaving}
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-40"
            >
              {t("Let the story rest")}
            </button>
          )}
          {(weaving || buffering) && (
            <LoaderCircle
              className="size-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {weaveFailed && (
        <p className="ink-hand mt-2.5 text-[13.5px] italic text-muted-foreground">
          {t("The loom fell silent for a moment. Breathe, then weave again.")}{" "}
          <button
            type="button"
            onClick={() => void weave("next")}
            className="focus-glow underline underline-offset-4 hover:text-foreground"
          >
            {t("Weave again")}
          </button>
        </p>
      )}
      {ended && (
        <p className="ink-hand mt-3 text-center text-[14px] italic text-muted-foreground">
          ❧ {t("The end")}
        </p>
      )}

      {/* the full screen reader — one portal, the whole volume, the
          same clean page law: drift down and the head fades away */}
      {fullOpen &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] flex flex-col bg-background"
            data-testid="book-fullscreen-reader"
            role="dialog"
            aria-modal="true"
            aria-label={meta?.title ?? t("The weaving instrument")}
          >
            <div
              className={cn(
                "shrink-0 overflow-hidden border-b border-border transition-all duration-500 ease-out",
                readerChromeShown
                  ? "max-h-24 translate-y-0 opacity-100"
                  : "pointer-events-none max-h-0 -translate-y-4 opacity-0"
              )}
            >
              <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
                <BookMarked
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="ink-title truncate text-[15px] font-semibold leading-tight">
                    {meta?.title}
                  </p>
                  {meta?.subtitle && (
                    <p className="ink-faint truncate text-[11.5px] italic">
                      {meta.subtitle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFontSize((i) => Math.max(0, i - 1))}
                    disabled={fontSize === 0}
                    aria-label={t("Smaller text")}
                    className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize((i) => Math.min(2, i + 1))}
                    disabled={fontSize === 2}
                    aria-label={t("Larger text")}
                    className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyBook()}
                    data-testid="book-fullscreen-copy"
                    aria-label={copied ? t("Book copied") : t("Copy the book")}
                    title={copied ? t("Book copied") : t("Copy the book")}
                    className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFullOpen(false)}
                  aria-label={t("Close the full reader")}
                  data-testid="book-fullscreen-close"
                  className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              {...readerScroll}
              className="nice-scroll flex-1 overflow-y-auto"
            >
              <div className="mx-auto max-w-[680px] px-6 py-10 sm:px-8 sm:py-14">
                <h1 className="ink-title text-center text-[26px] font-semibold leading-tight tracking-[0.03em] sm:text-[30px]">
                  {meta?.title}
                </h1>
                {meta?.sigil && (
                  <p className="ink-hand ink-faint mt-2 text-center text-[14px] italic">
                    ✦ {meta.sigil}
                  </p>
                )}
                {meta?.axiom && (
                  <p className="ink-hand ink-faint mt-1.5 text-center text-[13.5px] italic">
                    {meta.axiom}
                  </p>
                )}
                <span
                  aria-hidden="true"
                  className="mx-auto mt-6 block h-px w-40"
                  style={{ background: WEAVE_INK_LINE }}
                />
                <div className="mt-8 space-y-7">
                  {displayPages.map((p) => (
                    <div key={p.n}>
                      {p.chapter && (
                        <p className="ink-hand mb-2.5 text-center text-[15px] italic text-muted-foreground">
                          {p.chapter}
                        </p>
                      )}
                      <div className="space-y-3">
                        {p.paragraphs.map((para, i) => (
                          <p
                            key={i}
                            className={cn(
                              "ink-hand whitespace-pre-wrap leading-[1.95] text-foreground/92",
                              /* the great letter only at a true chapter
                                 opening — every other page stays clean */
                              p.chapter &&
                                i === 0 &&
                                "first-letter:float-left first-letter:mr-3 first-letter:mt-[6px] first-letter:text-[46px] first-letter:font-semibold first-letter:leading-[0.8]"
                            )}
                            style={{ fontSize: [16.5, 18.5, 20.5][fontSize] }}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                      <p className="mt-3 text-center text-[10.5px] text-muted-foreground/50">
                        {p.n}
                      </p>
                    </div>
                  ))}
                </div>
                {ended ? (
                  <p className="ink-hand ink-soft mt-10 text-center text-[15.5px] italic">
                    ❧ {t("The end")}
                  </p>
                ) : (
                  <div className="mt-10 flex flex-col items-center gap-2.5">
                    <button
                      type="button"
                      onClick={turnPage}
                      disabled={weaving}
                      data-testid="book-fullscreen-turn"
                      className="focus-glow flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-medium text-background transition-all duration-300 hover:-translate-y-px disabled:opacity-40"
                    >
                      <BookOpen className="size-3.5" aria-hidden="true" />
                      {buffer
                        ? t("Turn the page")
                        : weaving
                          ? t("The loom weaves the next pages…")
                          : t("Weave onward")}
                    </button>
                    <p className="h-5 text-[12px] italic text-muted-foreground/70">
                      {buffering && !buffer
                        ? t("The loom weaves the next pages…")
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
}

/* ================================================================== */
/*  6 · THE LIGHT CODES TRANSMISSION — the chamber tunes a sound       */
/*      transmission OF THIS CONVERSATION, right inside the channel:   */
/*      its golden waveform, its title, the Mirror's transmission      */
/*      notes — and one touch sounds it fully in the chamber.          */
/* ================================================================== */

interface CodesInterp {
  title: string;
  style: string;
  lyrics: string | null;
  notes: string;
}

/* the tuned transmission's own waveform — deterministic, golden */
function codesWaveBars(seed: string, bars = 36): number[] {
  const rnd = mulberry32(hash32(seed.trim() || "light-codes"));
  return Array.from({ length: bars }, (_, i) => {
    const envelope = 0.35 + 0.65 * Math.sin((i / (bars - 1)) * Math.PI);
    return Math.max(0.12, Math.min(1, envelope * (0.35 + rnd() * 0.85)));
  });
}

function CodesTransmission({
  resonance,
  themes,
}: {
  resonance: string;
  themes?: string;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [interp, setInterp] = useState<
    (CodesInterp & { mode: LightCodesMode }) | null
  >(null);
  const busyRef = useRef(false);

  const tune = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("loading");
    const mode = guessLightCodesMode(resonance);
    try {
      const res = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          intention: resonance,
          context: themes || undefined,
          interpretOnly: true,
          language,
        }),
      });
      const data = (await res.json()) as Partial<CodesInterp> & {
        error?: string;
      };
      if (!res.ok || !data.title || !data.notes)
        throw new Error(data.error ?? "quiet");
      setInterp({
        title: data.title,
        style: data.style ?? "",
        lyrics: data.lyrics ?? null,
        notes: data.notes,
        mode,
      });
      setState("ready");
    } catch {
      setState("error");
    } finally {
      busyRef.current = false;
    }
  }, [language, resonance, themes]);

  useEffect(() => {
    void tune();
  }, [tune]);

  return (
    <div>
      {state === "loading" && (
        <ArtifactLoading
          phrase={t("the chamber is tuning a transmission from your words...")}
          bars={4}
        />
      )}
      {state === "error" && (
        <ArtifactError
          message="The transmission could not be tuned — rest, then ask again."
          onRetry={() => void tune()}
          retryLabel="Tune it again"
          testid="chat-codes-retry"
        />
      )}
      {state === "ready" && interp && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="mx-auto max-w-[560px] rounded-xl border hairline bg-card/70 px-5 py-6 sm:px-7"
            data-testid="chat-codes-card"
          >
            {/* the transmission's own golden waveform */}
            <div
              className="flex h-14 items-end justify-center gap-[3px]"
              aria-hidden="true"
              data-testid="chat-codes-wave"
            >
              {codesWaveBars(interp.title + resonance).map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{
                    height: `${Math.round(h * 100)}%`,
                    background:
                      "linear-gradient(180deg, var(--scope-a), color-mix(in srgb, var(--scope-a) 30%, transparent))",
                    opacity: 0.3 + h * 0.6,
                  }}
                />
              ))}
            </div>
            <h4
              className="ink-title mt-4 text-center text-[17px] font-semibold leading-snug"
              data-testid="chat-codes-title"
            >
              {interp.title}
            </h4>
            <span
              aria-hidden="true"
              className="mt-3.5 block h-px w-full"
              style={{ background: inkLine }}
            />
            <p
              className="ink-hand mt-3.5 text-[14px] leading-[1.85]"
              data-testid="chat-codes-notes"
            >
              {interp.notes}
            </p>
            {interp.lyrics && (
              <p className="ink-hand ink-faint mt-3 border-t hairline pt-3 text-[13.5px] italic leading-relaxed">
                {interp.lyrics}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                openLightCodes({
                  mode: interp.mode,
                  intention: resonance,
                  title: interp.title,
                  notes: interp.notes,
                  style: interp.style,
                  context: themes,
                  autoGenerate: true,
                })
              }
              data-testid="chat-codes-sound"
              className={btnSolid}
            >
              <AudioLines className="size-3.5" aria-hidden="true" />
              {t("Sound it in the chamber")}
            </button>
            <button
              type="button"
              onClick={() => void tune()}
              data-testid="chat-codes-another"
              className={btnGhost}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("Another transmission")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  7 · THE NEXUS REVEALS — ParticleX and Evolve Med speak in their    */
/*      own voices right inside the channel: a revelation, the         */
/*      formulas that run it, a signed seal — and a door into each     */
/*      world for those who wish to walk further.                      */
/* ================================================================== */

interface NexusReply {
  revelation: string;
  formulas: string[];
  seal: string;
}

function NexusReveal({
  endpoint,
  resonance,
  tool,
  testid,
  loadingPhrase,
  errorText,
  retryLabel,
  againLabel,
  doorLabel,
  onDoor,
}: {
  endpoint: string;
  resonance: string;
  tool?: string;
  testid: string;
  loadingPhrase: string;
  errorText: string;
  retryLabel: string;
  againLabel: string;
  doorLabel?: string;
  onDoor?: () => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reply, setReply] = useState<NexusReply | null>(null);
  const busyRef = useRef(false);

  const reveal = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setState("loading");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: resonance,
          language,
          ...(tool ? { tool } : {}),
        }),
      });
      const data = (await res.json()) as Partial<NexusReply> & {
        error?: string;
      };
      if (!res.ok || !data.revelation) throw new Error(data.error ?? "quiet");
      setReply({
        revelation: data.revelation,
        formulas: Array.isArray(data.formulas) ? data.formulas : [],
        seal: data.seal ?? "",
      });
      setState("ready");
    } catch {
      setState("error");
    } finally {
      busyRef.current = false;
    }
  }, [endpoint, language, resonance, tool]);

  useEffect(() => {
    void reveal();
  }, [reveal]);

  const paragraphs = reply
    ? reply.revelation.split(/\n{2,}/).filter((p) => p.trim())
    : [];

  return (
    <div>
      {state === "loading" && <ArtifactLoading phrase={t(loadingPhrase)} bars={4} />}
      {state === "error" && (
        <ArtifactError
          message={errorText}
          onRetry={() => void reveal()}
          retryLabel={retryLabel}
          testid={`${testid}-retry`}
        />
      )}
      {state === "ready" && reply && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="mx-auto max-w-[600px] rounded-xl border hairline bg-card/70 px-5 py-6 sm:px-7"
            data-testid={`${testid}-card`}
          >
            {paragraphs.map((para, i) => (
              <p
                key={i}
                className={cn(
                  "ink-hand text-[14.5px] leading-[1.9]",
                  i > 0 && "mt-3.5",
                  i === paragraphs.length - 1 &&
                    paragraphs.length > 1 &&
                    "ink-faint border-t hairline pt-3.5 italic"
                )}
              >
                {para}
              </p>
            ))}
            {reply.formulas.length > 0 && (
              <div
                className="mt-4 border-t hairline pt-4"
                data-testid={`${testid}-formulas`}
              >
                <p className="mono-label text-[8.5px] uppercase tracking-[0.24em] text-muted-foreground/70">
                  {t("The formulas beneath it")}
                </p>
                <div className="mt-2.5 space-y-2">
                  {reply.formulas.map((f, i) => (
                    <p
                      key={i}
                      className="rounded-lg border hairline bg-background/40 px-3.5 py-2.5 text-center font-mono text-[13px] leading-relaxed"
                      style={{ color: "var(--scope-a)" }}
                    >
                      {f}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {reply.seal && (
              <p className="ink-faint mt-4 text-right text-[12.5px] italic">
                {reply.seal}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void reveal()}
              data-testid={`${testid}-again`}
              className={btnGhost}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t(againLabel)}
            </button>
            {onDoor && doorLabel && (
              <button
                type="button"
                onClick={onDoor}
                data-testid={`${testid}-door`}
                className={btnGhost}
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a) 38%, transparent)",
                }}
              >
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                {t(doorLabel)}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  THE DISPATCHER — one artifact, mounted beneath the reply. Each     */
/*  door wears its world's own golden sigil — the whole sidebar        */
/*  living inside the chat, revealed when asked, never parked below.   */
/* ================================================================== */

const KIND_SIGIL: Record<SideArtifactKind, WorldSigilKey> = {
  akashic: "akashic",
  star: "starplay",
  manifest: "mirroros",
  forge: "invent",
  book: "dreambook",
  poem: "dreambook",
  codes: "lightcodes",
  quantum: "particlex",
  remedy: "evolvemed",
};

export function SideArtifact({
  kind,
  resonance,
  resume,
  themes,
  tool,
}: {
  kind: SideArtifactKind;
  resonance: string;
  /** The book door only: the visitor asked for their paused volume
      back — the weaver mounts open at the page where it rested. */
  resume?: boolean;
  /** The Light Codes door: the thread's themes, carried into the
      chamber's interpretation. */
  themes?: string;
  /** The Quantum World door: the narrator instrument reading through. */
  tool?: string;
}) {
  const t = useT();
  const openParticleX = useMirror((s) => s.openParticleX);
  const openEvolveMed = useMirror((s) => s.openEvolveMed);
  const label =
    kind === "akashic"
      ? t("Brought from the Akashic Library")
      : kind === "star"
        ? t("Dealt from the Star Play")
        : kind === "manifest"
          ? t("The Manifesting Chamber")
          : kind === "book"
            ? t("The weaving instrument")
            : kind === "poem"
              ? t("Woven as a poem")
              : kind === "codes"
                ? t("Tuned in the Light Codes chamber")
                : kind === "quantum"
                  ? t("Revealed by ParticleX")
                  : kind === "remedy"
                    ? t("Routed through Evolve Med")
                    : t("Struck from the Forge");

  return (
    <div className="mt-6 border-t hairline pt-5" data-testid={`chat-artifact-${kind}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="relative block size-[18px] shrink-0">
          <WorldSigil world={KIND_SIGIL[kind]} />
        </span>
        <span className="mono-label text-[9px] uppercase tracking-[0.24em] text-muted-foreground/75">{label}</span>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 22%, transparent), transparent)" }} aria-hidden="true" />
      </div>
      {kind === "akashic" && <AkashicLetter resonance={resonance} />}
      {kind === "star" && <StarDraw />}
      {kind === "manifest" && <ManifestRitual resonance={resonance} />}
      {kind === "forge" && <ForgeStrike resonance={resonance} />}
      {kind === "book" && <BookWeaver resonance={resonance} resume={resume} />}
      {kind === "poem" && <PoemCard resonance={resonance} />}
      {kind === "codes" && <CodesTransmission resonance={resonance} themes={themes} />}
      {kind === "quantum" && (
        <NexusReveal
          endpoint="/api/particlex"
          resonance={resonance}
          tool={tool}
          testid="chat-quantum"
          loadingPhrase="ParticleX is opening the underside of things..."
          errorText="ParticleX stayed quiet — rest, then reach again."
          retryLabel="Reach again"
          againLabel="Reveal it again"
          doorLabel="Enter the Quantum World"
          onDoor={openParticleX}
        />
      )}
      {kind === "remedy" && (
        <NexusReveal
          endpoint="/api/evolve-med"
          resonance={resonance}
          testid="chat-remedy"
          loadingPhrase="the nexus is routing your question..."
          errorText="The nexus stayed quiet — rest, then reach again."
          retryLabel="Reach again"
          againLabel="Ask the nexus again"
          doorLabel="Enter Evolve Med"
          onDoor={openEvolveMed}
        />
      )}
    </div>
  );
}
