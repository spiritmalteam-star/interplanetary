"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  LoaderCircle,
  MoonStar,
  Sparkles,
  Square,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import type { VoiceId } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  DreamBookView — the Dream Book: a world of its own.                */
/*                                                                     */
/*  THREE ROOMS:                                                       */
/*  ① THE ATELIER — a magical workshop at night. The visitor shapes    */
/*     the book (reader · tale · book), whispers wishes into the       */
/*     chat, and presses "Weave my book".                              */
/*  ② THE WEAVING — the loom gathers the tale while phases drift by.   */
/*  ③ THE READER — a clean black-and-white open book. Two pages are    */
/*     revealed at once; while the visitor reads, the next two are     */
/*     woven elsewhere in the loom. A voice narrator reads aloud,      */
/*     the page zooms, and one back button begins a new dream.         */
/*                                                                     */
/*  The magic stays magic: nothing here is named, explained or         */
/*  traced back to any chamber of the laboratory.                      */
/* ------------------------------------------------------------------ */

interface WeavePage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

interface BookMeta {
  title: string;
  subtitle: string;
  dedication: string;
  totalPages: number;
}

interface AtelierLine {
  id: string;
  from: "weaver" | "visitor";
  text: string;
}

const READERS = [
  { id: "little", label: "Little dreamers (4–8)" },
  { id: "young", label: "Young readers (9–12)" },
  { id: "teen", label: "Teens (13–17)" },
  { id: "grown", label: "Grown dreamers" },
  { id: "timeless", label: "All ages" },
];

const TALES = [
  { id: "fairytale", label: "Fairy tale" },
  { id: "adventure", label: "Adventure" },
  { id: "mystery", label: "Gentle mystery" },
  { id: "cosmic", label: "Cosmic journey" },
  { id: "creatures", label: "Creature friends" },
  { id: "fantasy", label: "Fantasy quest" },
  { id: "bedtime", label: "Dreamlike calm" },
  { id: "wonder", label: "Everyday wonder" },
];

const VOLUMES = [
  { id: "bedtime", label: "Bedtime treasure" },
  { id: "classic", label: "Classic tale" },
  { id: "saga", label: "Grand saga" },
];

/* The narrator voice each book speaks with, chosen by its reader */
const NARRATOR_VOICE: Record<string, VoiceId> = {
  little: "pixie",
  young: "aurora",
  teen: "nova",
  grown: "regent",
  timeless: "aurora",
};

const ZOOM_STEPS = [15.5, 17.5, 19.5, 21.5, 24];

let lineCounter = 0;
const nextLineId = () => `l-${Date.now().toString(36)}-${(lineCounter++).toString(36)}`;

const pageText = (p: WeavePage) => p.paragraphs.join(" ");

/* ------------------------------------------------------------------ */

export function DreamBookView() {
  const exitDreamBook = useMirror((s) => s.exitDreamBook);
  const language = useMirror((s) => s.language);
  const t = useT();

  const [stage, setStage] = useState<"atelier" | "weaving" | "reading">(
    "atelier"
  );

  /* ---- the atelier ---- */
  const [lines, setLines] = useState<AtelierLine[]>([]);
  const [age, setAge] = useState("timeless");
  const [tale, setTale] = useState("wonder");
  const [volume, setVolume] = useState("classic");
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement | null>(null);
  const [phaseIdx, setPhaseIdx] = useState(0);

  const WEAVING_PHASES = useMemo(
    () => [
      t("Gathering threads from the far side of sleep…"),
      t("Choosing names the stars have not used yet…"),
      t("Folding the first pages of the world…"),
      t("Sharpening the ink of beginnings…"),
      t("Waking the characters one by one…"),
      t("Binding the book with a breath…"),
    ],
    [t]
  );

  /* ---- the book ---- */
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [pages, setPages] = useState<WeavePage[]>([]);
  const [ended, setEnded] = useState(false);
  const [spread, setSpread] = useState(0);
  const [weavingNext, setWeavingNext] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [narrating, setNarrating] = useState(false);
  const [narrLoading, setNarrLoading] = useState(false);

  const pagesRef = useRef<WeavePage[]>([]);
  const threadsRef = useRef("");
  const metaRef = useRef<BookMeta | null>(null);
  const endedRef = useRef(false);
  const weavingRef = useRef(false);
  const configRef = useRef({ age, tale, volume });
  const narrRef = useRef<{ audio: HTMLAudioElement | null }>({ audio: null });

  useEffect(() => {
    configRef.current = { age, tale, volume };
  }, [age, tale, volume]);

  const pushLine = useCallback((from: AtelierLine["from"], text: string) => {
    setLines((prev) => [...prev, { id: nextLineId(), from, text }]);
  }, []);

  /* keep the atelier thread pinned to its newest line */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, stage]);

  /* drift the weaving phases while the loom works */
  useEffect(() => {
    if (stage !== "weaving") return;
    const iv = setInterval(
      () => setPhaseIdx((i) => (i + 1) % WEAVING_PHASES.length),
      2600
    );
    return () => clearInterval(iv);
  }, [stage, WEAVING_PHASES]);

  /* ---------------- the narrator (declared early — others call it) --- */

  const stopNarration = useCallback(() => {
    const a = narrRef.current.audio;
    if (a) {
      try {
        a.pause();
      } catch {
        /* already stopped */
      }
    }
    narrRef.current.audio = null;
    setNarrating(false);
    setNarrLoading(false);
  }, []);

  useEffect(() => stopNarration, [stopNarration]);

  /* ---------------- the weaver's fetch ---------------- */

  const weave = useCallback(
    async (
      phase: "open" | "next" | "close" | "extend",
      pageNumber: number
    ): Promise<boolean> => {
      if (weavingRef.current) return false;
      weavingRef.current = true;
      setWeavingNext(true);

      try {
        const recent = pagesRef.current.slice(-2).map(pageText);
        const res = await fetch("/api/dream-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase,
            language,
            config: configRef.current,
            threads: threadsRef.current || undefined,
            recentPages: recent.length ? recent : undefined,
            pageNumber,
            totalPages: metaRef.current?.totalPages,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.pages?.length) {
          throw new Error(
            data?.error ||
              "The loom fell silent for a moment. Breathe, then weave again."
          );
        }

        const fresh: WeavePage[] = data.pages;
        pagesRef.current = [...pagesRef.current, ...fresh];
        setPages(pagesRef.current);
        if (typeof data.threads === "string" && data.threads) {
          threadsRef.current = data.threads;
        }
        if (phase === "open") {
          metaRef.current = {
            title: data.title ?? "The Unnamed Book",
            subtitle: data.subtitle ?? "",
            dedication: data.dedication ?? "",
            totalPages: data.totalPages ?? 96,
          };
          setMeta(metaRef.current);
        }
        if (phase === "extend" && typeof data.totalPages === "number") {
          metaRef.current = metaRef.current
            ? { ...metaRef.current, totalPages: data.totalPages }
            : null;
          setMeta(metaRef.current);
        }
        if (phase === "close") {
          endedRef.current = true;
          setEnded(true);
        }
        return true;
      } catch {
        toast.error(t("The loom fell silent for a moment."), {
          description: t("Rest, then weave again."),
        });
        return false;
      } finally {
        weavingRef.current = false;
        setWeavingNext(false);
      }
    },
    [language, t]
  );

  /* ---------------- the atelier ---------------- */

  const sendWish = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = draft.trim();
      if (!text) return;
      setDraft("");
      pushLine("visitor", text);
      pushLine(
        "weaver",
        t("Your wish is woven into the warp. The threads are listening.")
      );
    },
    [draft, pushLine, t]
  );

  const choose = useCallback(
    (kind: "reader" | "tale" | "volume", id: string, label: string) => {
      if (kind === "reader") setAge(id);
      if (kind === "tale") setTale(id);
      if (kind === "volume") setVolume(id);
      pushLine("visitor", label);
      const next =
        kind === "reader"
          ? t("The reader is held. Now the tale.")
          : kind === "tale"
            ? t("A fine shape for a tale. And the book itself?")
            : t("The loom is set. Whisper anything you wish — or let me weave.");
      pushLine("weaver", next);
    },
    [pushLine, t]
  );

  const openBook = useCallback(async () => {
    if (weavingRef.current) return;
    setStage("weaving");
    setPhaseIdx(0);
    const ok = await weave("open", 1);
    if (ok) {
      setStage("reading");
      setSpread(0);
    } else {
      setStage("atelier");
    }
  }, [weave]);

  /* ---------------- the reader's logic ----------------
     spread 0 = title spread (frontispiece + endpaper)
     spread k ≥ 1 = pages (2k-1 | 2k) — two pages revealed at once */

  const spreadPages = useMemo(() => {
    if (spread === 0) return [];
    const left = pages.find((p) => p.n === spread * 2 - 1);
    const right = pages.find((p) => p.n === spread * 2);
    return [left, right].filter(Boolean) as WeavePage[];
  }, [pages, spread]);

  const maxSpread = useMemo(
    () => (pages.length ? Math.ceil(pages.length / 2) : 0),
    [pages.length]
  );

  const atPlannedEnd = !!meta && pages.length >= meta.totalPages && !ended;

  /* the choice page and the ending live one spread past the last */
  const limitSpread =
    atPlannedEnd || ended ? maxSpread + 1 : maxSpread;
  const showChoice = atPlannedEnd && spread === maxSpread + 1;
  const showEnd = ended && spread === maxSpread + 1;

  /* prefetch — while the visitor reads spread k, the loom weaves k+1 */
  useEffect(() => {
    if (stage !== "reading" || endedRef.current || !metaRef.current) return;
    const needNext = (spread + 1) * 2;
    const have = pagesRef.current.length;
    if (have >= needNext) return;
    if (have + 2 > metaRef.current.totalPages) return; /* the choice will ask */
    void weave("next", have + 1);
  }, [spread, pages.length, stage, weave]);

  const goSpread = useCallback(
    (dir: 1 | -1) => {
      stopNarration();
      setSpread((s) => {
        const next = s + dir;
        if (next < 0) return s;
        if (dir === 1 && next > limitSpread) return s;
        return next;
      });
    },
    [limitSpread, stopNarration]
  );

  /* keyboard page turns */
  useEffect(() => {
    if (stage !== "reading") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goSpread(1);
      if (e.key === "ArrowLeft") goSpread(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, goSpread]);

  const newDream = useCallback(() => {
    stopNarration();
    pagesRef.current = [];
    threadsRef.current = "";
    metaRef.current = null;
    endedRef.current = false;
    setPages([]);
    setMeta(null);
    setEnded(false);
    setSpread(0);
    setZoom(1);
    setStage("atelier");
    pushLine(
      "weaver",
      t("A new book waits in the loom. Shape it below, or simply whisper.")
    );
  }, [pushLine, stopNarration, t]);

  const weaveOnward = useCallback(async () => {
    const ok = await weave("extend", pagesRef.current.length + 1);
    if (ok) setSpread((s) => s + 1);
  }, [weave]);

  const letRest = useCallback(async () => {
    const ok = await weave("close", pagesRef.current.length + 1);
    if (ok) setSpread((s) => s + 1);
  }, [weave]);

  /* ---------------- the narrator ---------------- */

  const narrate = useCallback(async () => {
    if (narrating || narrLoading) {
      stopNarration();
      return;
    }
    stopNarration();
    setNarrLoading(true);
    try {
      const voice = NARRATOR_VOICE[configRef.current.age] ?? "aurora";
      const opening = spread === 0 && meta
        ? `${meta.title}. ${meta.subtitle} ${meta.dedication}`
        : "";
      const body = spreadPages.map(pageText).join(" ");
      const text = (opening || body).trim();
      if (!text) return;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, pace: 0.85 }),
      });
      if (!res.ok) throw new Error("quiet");
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      narrRef.current.audio = audio;
      audio.onended = () => {
        if (narrRef.current.audio === audio) narrRef.current.audio = null;
        setNarrating(false);
      };
      audio.onerror = () => {
        if (narrRef.current.audio === audio) narrRef.current.audio = null;
        setNarrating(false);
      };
      await audio.play();
      setNarrating(true);
    } catch {
      toast.error(t("The voice of the book is resting."), {
        description: t("Rest, then listen again."),
      });
    } finally {
      setNarrLoading(false);
    }
  }, [narrating, narrLoading, spreadPages, spread, meta, stopNarration, t]);

  /* ---------------- shared ---------------- */

  const backFromAtelier = () => {
    stopNarration();
    exitDreamBook();
  };

  const backFromReader = () => {
    stopNarration();
    setStage("atelier");
  };

  const readPageOf =
    spread === 0 ? 0 : Math.min(spread * 2, Math.max(pages.length, 0));
  const progress = meta ? Math.min(1, readPageOf / meta.totalPages) : 0;

  /* ================================================================ */
  /*  THE ATELIER                                                      */
  /* ================================================================ */

  const atelier = (
    <div className="dream-night relative flex h-full flex-col overflow-hidden">
      <div aria-hidden="true" className="dream-dust pointer-events-none absolute inset-0" />

      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-3 sm:px-5">
        <button
          type="button"
          onClick={backFromAtelier}
          aria-label={t("Back to the laboratory")}
          title={t("Back to the laboratory")}
          className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 backdrop-blur-xl transition-all duration-300 hover:border-[var(--dream-gold-soft)] hover:text-[var(--dream-gold)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-white/45">
          <MoonStar className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("The atelier of tales")}</span>
        </span>
      </header>

      <div className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[680px] flex-col px-4 pb-6 pt-4 sm:px-6">
          {/* the hero — the book on the desk */}
          <div className="dream-hero relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
            <img
              src="/images/ai/dream-book-atelier.jpg"
              alt=""
              aria-hidden="true"
              className="h-44 w-full object-cover sm:h-56"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120c1c] via-[#120c1c]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <h1 className="font-[family-name(var(--font-literata))] text-[26px] leading-tight text-[#f5ead2] drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] sm:text-[32px]">
                {t("Dream Book")}
              </h1>
              <p className="mt-1 font-[family-name(var(--font-literata))] text-[12.5px] italic text-white/70 sm:text-sm">
                {t(
                  "Where tales are woven from your resonance — choose, whisper, and the book begins."
                )}
              </p>
            </div>
          </div>

          {/* the thread — the weaver and the visitor */}
          <div
            ref={threadRef}
            className="nice-scroll mt-4 max-h-[34vh] min-h-[110px] space-y-2.5 overflow-y-auto rounded-2xl border border-white/8 bg-black/25 p-3 backdrop-blur-md sm:p-4"
            aria-live="polite"
          >
            <AtelierBubble from="weaver">
              {t(
                "Welcome, keeper of wishes. Shape the book below — or simply whisper, and I will listen."
              )}
            </AtelierBubble>
            {lines.map((l) => (
              <AtelierBubble key={l.id} from={l.from}>
                {l.text}
              </AtelierBubble>
            ))}
          </div>

          {/* the shapes — reader / tale / book */}
          <div className="mt-4 space-y-3.5">
            <ShapeRow
              label={t("The reader")}
              options={READERS}
              active={age}
              onPick={(id, label) => choose("reader", id, label)}
            />
            <ShapeRow
              label={t("The tale")}
              options={TALES}
              active={tale}
              onPick={(id, label) => choose("tale", id, label)}
            />
            <ShapeRow
              label={t("The book")}
              options={VOLUMES}
              active={volume}
              onPick={(id, label) => choose("volume", id, label)}
            />
          </div>
        </div>
      </div>

      {/* the whisper composer + the weaving button */}
      <div className="relative z-10 shrink-0 border-t border-white/8 bg-black/30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto w-full max-w-[680px]">
          <form
            onSubmit={sendWish}
            className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1 pl-4 pr-1 backdrop-blur-xl focus-within:border-[var(--dream-gold-soft)]"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("Whisper a wish for the tale…")}
              aria-label={t("Whisper a wish for the tale…")}
              className="min-w-0 flex-1 bg-transparent py-2 text-[13.5px] text-white/90 placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t("Whisper the wish")}
              className="dream-send focus-glow flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
            </button>
          </form>
          <button
            type="button"
            onClick={openBook}
            className="dream-weave focus-glow mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium tracking-wide"
          >
            <BookOpen className="size-4" aria-hidden="true" />
            {t("Weave my book")}
          </button>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  THE WEAVING                                                      */
  /* ================================================================ */

  const weaving = (
    <div className="dream-night relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
      <div aria-hidden="true" className="dream-dust pointer-events-none absolute inset-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
          <motion.div
            className="dream-loom-ring absolute -inset-8 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          />
          <div className="dream-loom-book relative flex size-28 items-center justify-center rounded-3xl border border-[var(--dream-gold-soft)]/40 bg-black/40 shadow-[0_0_60px_-12px_var(--dream-gold)] backdrop-blur-xl">
            <BookOpen className="size-10 text-[var(--dream-gold)]" aria-hidden="true" />
          </div>
        </div>
        <p className="mt-8 max-w-[420px] text-center font-[family-name(var(--font-literata))] text-[15px] italic text-white/75">
          {WEAVING_PHASES[phaseIdx]}
        </p>
        <div className="mt-5 h-px w-40 overflow-hidden rounded-full bg-white/10">
          <div className="ink-shimmer h-full w-full" />
        </div>
      </motion.div>
    </div>
  );

  /* ================================================================ */
  /*  THE READER                                                       */
  /* ================================================================ */

  const canNext = spread < limitSpread && !showChoice && !showEnd;
  const canPrev = spread > 0;

  const reader = (
    <div className="dream-night relative flex h-full flex-col overflow-hidden">
      <div aria-hidden="true" className="dream-dust pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-20 flex shrink-0 items-center gap-2 px-3 pt-3 sm:px-5">
        <button
          type="button"
          onClick={backFromReader}
          aria-label={t("Begin a new dream")}
          title={t("Begin a new dream")}
          className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 backdrop-blur-xl transition-all duration-300 hover:border-[var(--dream-gold-soft)] hover:text-[var(--dream-gold)]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center font-[family-name(var(--font-literata))] text-[14px] text-white/85 sm:text-[16px]">
          {meta?.title ?? ""}
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={narrate}
            aria-label={narrating ? t("Stop") : t("Listen to the story")}
            title={narrating ? t("Stop") : t("Listen to the story")}
            className={cn(
              "focus-glow flex size-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300",
              narrating
                ? "border-[var(--dream-gold)] text-[var(--dream-gold)]"
                : "border-white/12 bg-white/5 text-white/70 hover:border-[var(--dream-gold-soft)] hover:text-[var(--dream-gold)]"
            )}
          >
            {narrLoading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : narrating ? (
              <Square className="size-3.5 fill-current" aria-hidden="true" />
            ) : (
              <AudioLines className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0, z - 1))}
            disabled={zoom === 0}
            aria-label={t("Smaller text")}
            title={t("Smaller text")}
            className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 backdrop-blur-xl transition-all duration-300 hover:border-[var(--dream-gold-soft)] hover:text-[var(--dream-gold)] disabled:opacity-35"
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
            disabled={zoom === ZOOM_STEPS.length - 1}
            aria-label={t("Larger text")}
            title={t("Larger text")}
            className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 backdrop-blur-xl transition-all duration-300 hover:border-[var(--dream-gold-soft)] hover:text-[var(--dream-gold)] disabled:opacity-35"
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* the book itself */}
      <div className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-[980px] items-start justify-center px-3 pb-24 pt-4 sm:px-8 sm:pb-28">
          <div className="relative w-full md:w-auto">
            {/* floating turn buttons — desktop */}
            {canPrev && (
              <button
                type="button"
                onClick={() => goSpread(-1)}
                aria-label={t("Previous page")}
                className="dream-turn focus-glow absolute -left-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full md:flex xl:-left-16"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
            )}
            {canNext && (
              <button
                type="button"
                onClick={() => goSpread(1)}
                aria-label={t("Next page")}
                className="dream-turn focus-glow absolute -right-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full md:flex xl:-right-16"
              >
                <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`spread-${spread}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                {showChoice ? (
                  /* the crossroads — the tale can go on */
                  <div className="dream-page dream-page-single mx-auto flex max-w-[460px] flex-col items-center justify-center px-8 py-14 text-center">
                    <span className="font-[family-name(var(--font-literata))] text-3xl text-[var(--dream-ink-soft)]" aria-hidden="true">
                      ✦
                    </span>
                    <h2 className="mt-4 font-[family-name(var(--font-literata))] text-[22px] text-[var(--dream-ink)]">
                      {t("The tale can go on")}
                    </h2>
                    <p className="mt-2 font-[family-name(var(--font-literata))] text-[13.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                      {t(
                        "The loom is warm and the story is not finished — unless you wish it to be."
                      )}
                    </p>
                    <div className="mt-7 flex w-full flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={weaveOnward}
                        disabled={weavingNext}
                        className="dream-weave focus-glow flex h-11 items-center justify-center gap-2 rounded-full text-[14px] font-medium disabled:opacity-60"
                      >
                        <Sparkles className="size-4" aria-hidden="true" />
                        {t("Weave onward")}
                      </button>
                      <button
                        type="button"
                        onClick={letRest}
                        disabled={weavingNext}
                        className="focus-glow flex h-11 items-center justify-center rounded-full border border-[var(--dream-ink-line)] font-[family-name(var(--font-literata))] text-[13.5px] text-[var(--dream-ink)] transition-all duration-300 hover:bg-black/[0.045] disabled:opacity-60"
                      >
                        {t("Let the story rest")}
                      </button>
                    </div>
                  </div>
                ) : showEnd ? (
                  /* the last page of the book */
                  <div className="dream-page dream-page-single mx-auto flex max-w-[460px] flex-col items-center justify-center px-8 py-16 text-center">
                    <span className="font-[family-name(var(--font-literata))] text-4xl text-[var(--dream-gold-deep)]" aria-hidden="true">
                      ❦
                    </span>
                    <h2 className="mt-5 font-[family-name(var(--font-literata))] text-[24px] text-[var(--dream-ink)]">
                      {t("The End")}
                    </h2>
                    <p className="mt-2 font-[family-name(var(--font-literata))] text-[13.5px] italic text-[var(--dream-ink-soft)]">
                      {meta?.title}
                    </p>
                    <button
                      type="button"
                      onClick={newDream}
                      className="dream-weave focus-glow mt-8 flex h-11 items-center justify-center gap-2 rounded-full px-7 text-[14px] font-medium"
                    >
                      <MoonStar className="size-4" aria-hidden="true" />
                      {t("Begin a new dream")}
                    </button>
                  </div>
                ) : (
                  <div className="dream-book md:grid md:grid-cols-2">
                    {/* LEFT — the frontispiece or the odd page */}
                    {spread === 0 ? (
                      <div className="dream-page dream-page-left flex flex-col items-center justify-between px-7 py-9 sm:px-10">
                        <div className="flex flex-col items-center pt-6 text-center sm:pt-10">
                          <span className="font-[family-name(var(--font-literata))] text-2xl text-[var(--dream-gold-deep)]" aria-hidden="true">
                            ❧
                          </span>
                          <h2 className="mt-6 max-w-[300px] font-[family-name(var(--font-literata))] text-[26px] leading-snug text-[var(--dream-ink)] sm:text-[30px]">
                            {meta?.title}
                          </h2>
                          {meta?.subtitle && (
                            <p className="mt-3 font-[family-name(var(--font-literata))] text-[13px] italic text-[var(--dream-ink-soft)] sm:text-sm">
                              {meta.subtitle}
                            </p>
                          )}
                        </div>
                        <p className="max-w-[280px] text-center font-[family-name(var(--font-literata))] text-[12px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                          {meta?.dedication}
                        </p>
                        <p className="pb-2 font-[family-name(var(--font-literata))] text-[10.5px] uppercase tracking-[0.24em] text-[var(--dream-ink-faint)]">
                          {t("woven for you, this very hour")}
                        </p>
                      </div>
                    ) : (
                      <BookPage
                        page={spreadPages[0]}
                        side="left"
                        fontSize={ZOOM_STEPS[zoom]}
                      />
                    )}

                    {/* RIGHT — the endpaper or the even page */}
                    {spread === 0 ? (
                      <div className="dream-page dream-page-right hidden items-center justify-center md:flex">
                        <span className="font-[family-name(var(--font-literata))] text-xl text-[var(--dream-gold-deep)] opacity-70" aria-hidden="true">
                          ❧
                        </span>
                      </div>
                    ) : (
                      <BookPage
                        page={spreadPages[1]}
                        side="right"
                        fontSize={ZOOM_STEPS[zoom]}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* the loom at work while the visitor reads */}
            <AnimatePresence>
              {weavingNext && !showChoice && !showEnd && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mono-label mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40"
                >
                  <Sparkles className="size-3 animate-pulse" aria-hidden="true" />
                  {t("The loom weaves the next pages…")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* the progress thread + mobile turns */}
      <footer className="relative z-20 shrink-0 px-4 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-[980px] items-center gap-3">
          <button
            type="button"
            onClick={() => goSpread(-1)}
            disabled={!canPrev}
            aria-label={t("Previous page")}
            className="dream-turn focus-glow flex size-10 shrink-0 items-center justify-center rounded-full md:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--dream-gold)] transition-all duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mono-label mt-1.5 text-center text-[10px] tracking-[0.18em] text-white/45">
              {meta
                ? spread === 0
                  ? t("the title page")
                  : t("page {n} of {total}")
                      .replace("{n}", String(readPageOf))
                      .replace("{total}", String(meta.totalPages))
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => goSpread(1)}
            disabled={!canNext}
            aria-label={t("Next page")}
            className="dream-turn focus-glow flex size-10 shrink-0 items-center justify-center rounded-full md:hidden"
          >
            <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );

  if (stage === "weaving") return weaving;
  if (stage === "reading") return reader;
  return atelier;
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function AtelierBubble({
  from,
  children,
}: {
  from: "weaver" | "visitor";
  children: React.ReactNode;
}) {
  if (from === "weaver") {
    return (
      <div className="flex justify-start">
        <p className="dream-bubble max-w-[92%] rounded-2xl rounded-tl-md px-3.5 py-2.5 font-[family-name(var(--font-literata))] text-[13.5px] leading-relaxed text-[#efe6d4] sm:text-sm">
          {children}
        </p>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <p className="max-w-[92%] rounded-2xl rounded-tr-md border border-[var(--dream-gold-soft)]/30 bg-[var(--dream-gold)]/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-[#f6edd9] sm:text-[13.5px]">
        {children}
      </p>
    </div>
  );
}

function ShapeRow({
  label,
  options,
  active,
  onPick,
}: {
  label: string;
  options: { id: string; label: string }[];
  active: string;
  onPick: (id: string, label: string) => void;
}) {
  const t = useT();
  return (
    <div>
      <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isActive = o.id === active;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id, t(o.label))}
              aria-pressed={isActive}
              className={cn(
                "focus-glow rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
                isActive
                  ? "border-[var(--dream-gold)] bg-[var(--dream-gold)]/15 text-[#f6e7c4] shadow-[0_0_18px_-6px_var(--dream-gold)]"
                  : "border-white/12 bg-white/[0.04] text-white/65 hover:border-[var(--dream-gold-soft)] hover:text-white/90"
              )}
            >
              {t(o.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookPage({
  page,
  side,
  fontSize,
}: {
  page?: WeavePage;
  side: "left" | "right";
  fontSize: number;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "dream-page nice-scroll flex flex-col px-6 py-8 sm:px-9",
        side === "left" ? "dream-page-left" : "dream-page-right",
        "max-h-[58vh] md:max-h-[66vh]"
      )}
    >
      {page ? (
        <>
          {page.chapter && (
            <p className="mb-4 text-center font-[family-name(var(--font-literata))] text-[15px] italic text-[var(--dream-ink-soft)] sm:text-[17px]">
              {page.chapter}
            </p>
          )}
          <div
            className="dream-body flex-1"
            style={{ fontSize, lineHeight: 1.78 }}
          >
            {page.paragraphs.map((p, i) => (
              <p
                key={i}
                className={cn(
                  "mb-4 text-[var(--dream-ink)] last:mb-0",
                  page.chapter && i === 0 && "dream-drop"
                )}
              >
                {p}
              </p>
            ))}
          </div>
          <p className="mt-5 text-center font-[family-name(var(--font-literata))] text-[11px] text-[var(--dream-ink-faint)]">
            {page.n}
          </p>
        </>
      ) : (
        /* the page still in the loom */
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles className="size-4 animate-pulse text-[var(--dream-ink-faint)]" aria-hidden="true" />
          <p className="font-[family-name(var(--font-literata))] text-[12.5px] italic text-[var(--dream-ink-faint)]">
            {t("The loom weaves the next pages…")}
          </p>
          <div className="ink-shimmer h-px w-28 rounded-full bg-black/[0.06]" />
        </div>
      )}
    </div>
  );
}
