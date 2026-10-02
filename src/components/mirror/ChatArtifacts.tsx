"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Hammer,
  LoaderCircle,
  Minus,
  NotebookText,
  Plus,
  RotateCcw,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SideArtifactKind } from "@/lib/artifact-intent";
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

export function KindleReader({ record, onClose }: { record: LetterRecord; onClose: () => void }) {
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
                  "ink-hand leading-[1.95]",
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
            {t("The Akashic Library")}
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
          <p className="mt-3 border-t hairline pt-3 text-[11.5px] italic leading-relaxed text-muted-foreground/80">{blueprint.caution}</p>
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

function ForgeStrike() {
  const t = useT();
  const language = useMirror((s) => s.language);
  const [dials, setDials] = useState({
    domain: pick(forgeDomains).id,
    scale: pick(forgeScales).id,
    spark: pick(forgeSparks).id,
  });
  const [stage, setStage] = useState<"idle" | "forging" | "ready" | "error">("idle");
  const [mystery, setMystery] = useState<MiniMystery | null>(null);
  const [phase, setPhase] = useState(0);

  const strike = async () => {
    if (stage === "forging") return;
    setStage("forging");
    setMystery(null);
    const cycle = window.setInterval(() => setPhase((p) => (p + 1) % forgePhases.length), 650);
    try {
      const [res] = await Promise.all([
        fetch("/api/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dials, language }),
        }),
        new Promise((r) => window.setTimeout(r, 2000)), /* let the embers breathe */
      ]);
      const data = (await (res as Response).json()) as { mystery?: MiniMystery; error?: string };
      if (!(res as Response).ok || !data.mystery) throw new Error(data.error ?? "quiet");
      window.clearInterval(cycle);
      setMystery(data.mystery);
      setStage("ready");
    } catch {
      window.clearInterval(cycle);
      setStage("error");
    }
  };

  const dialRow = (label: string, options: typeof forgeDomains, key: "domain" | "scale" | "spark", testid: string) => (
    <div>
      <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-[var(--scope-a)]">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = dials[key] === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => { setDials((d) => ({ ...d, [key]: o.id })); setStage("idle"); setMystery(null); }}
              aria-pressed={active}
              title={t(o.hint)}
              data-testid={`${testid}-${o.id}`}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-all duration-300",
                active
                  ? "border-[var(--scope-a)] font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={active ? { background: "color-mix(in srgb, var(--scope-a) 12%, transparent)" } : undefined}
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
      {dialRow(t("What it is"), forgeDomains, "domain", "chat-forge-domain")}
      <div className="mt-3">{dialRow(t("How much world"), forgeScales, "scale", "chat-forge-scale")}</div>
      <div className="mt-3">{dialRow(t("Which energy"), forgeSparks, "spark", "chat-forge-spark")}</div>

      <div className="mt-4 flex justify-center">
        <button type="button" onClick={() => void strike()} disabled={stage === "forging"} data-testid="chat-forge-strike" className={btnSolid}>
          <Hammer className="size-3.5" aria-hidden="true" />
          {t("Strike the Forge")}
        </button>
      </div>

      {stage === "forging" && (
        <p className="mono-label mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground" aria-busy="true">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          {t(forgePhases[phase])}
        </p>
      )}
      {stage === "error" && (
        <p className="mt-4 text-center text-[13px] italic text-muted-foreground">
          {t("The forge stayed quiet — strike again.")}
        </p>
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
/*  THE DISPATCHER — one artifact, mounted beneath the reply.          */
/* ================================================================== */

export function SideArtifact({ kind, resonance }: { kind: SideArtifactKind; resonance: string }) {
  const t = useT();
  const icon = kind === "akashic" ? ScrollText : kind === "forge" ? Hammer : Sparkles;
  const Icon = icon;
  const label =
    kind === "akashic"
      ? t("Brought from the Akashic Library")
      : kind === "star"
        ? t("Dealt from the Star Play")
        : kind === "manifest"
          ? t("The Manifesting Chamber")
          : t("Struck from the Forge");

  return (
    <div className="mt-6 border-t hairline pt-5" data-testid={`chat-artifact-${kind}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <Icon className="size-3.5 shrink-0" style={{ color: "var(--scope-a)" }} aria-hidden="true" />
        <span className="mono-label text-[9px] uppercase tracking-[0.24em] text-muted-foreground/75">{label}</span>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--scope-a) 22%, transparent), transparent)" }} aria-hidden="true" />
      </div>
      {kind === "akashic" && <AkashicLetter resonance={resonance} />}
      {kind === "star" && <StarDraw />}
      {kind === "manifest" && <ManifestRitual resonance={resonance} />}
      {kind === "forge" && <ForgeStrike />}
    </div>
  );
}
