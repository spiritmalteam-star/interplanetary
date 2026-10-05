"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type TouchEvent as ReactTouchEvent,
  type UIEvent as ReactUIEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  Check,
  ChevronsUpDown,
  Feather,
  LoaderCircle,
  MoonStar,
  Pause,
  Play,
  Sparkles,
  Square,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
} from "@/lib/browser-voice";
import { LECTURE_LEVELS, READERS, TALES, VOLUMES } from "@/lib/data/book-options";
import { dedupeChapters } from "@/lib/book-text";
import type { VoiceId } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  DreamBookView — the Dream Book: a world of its own.                */
/*                                                                     */
/*  THREE ROOMS:                                                       */
/*  ① THE ATELIER — a quiet ink workshop in the same classic theme     */
/*     as every other chat. The visitor shapes the book (reader ·      */
/*     tale · book), whispers wishes into the chat, and presses        */
/*     "Weave my book".                                                */
/*  ② THE WEAVING — an unseen ink emblem draws itself while magical    */
/*     phrases drift by (never the word "loading"). If the loom ever   */
/*     falls silent, the room says so in place and offers to weave     */
/*     again — the visitor is never left wondering.                    */
/*  ③ THE READER — a clean black-and-white book revealing ONE page     */
/*     at a time; the next button slides the page away and draws the   */
/*     following one out of the loom. A fancy "Rewrite" button waits   */
/*     at the very top: its panel lets the visitor bend anything —     */
/*     coming events, the number of pages, the chapters, the very      */
/*     voice of the writing. While the visitor reads, the loom weaves  */
/*     ahead in the background. A voice narrator reads aloud, the      */
/*     page zooms, and one back button begins a new dream.             */
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
  sigil: string;
  axiom: string;
  dedication: string;
  totalPages: number;
}

/* The narrator voice each book speaks with — THE KIND LADY READER,
   one warm woman's voice for every volume (never the man). */
const BOOK_VOICE: VoiceId = "reader";

const ZOOM_STEPS = [15.5, 17.5, 19.5, 21.5, 24];

const pageText = (p: WeavePage) => p.paragraphs.join(" ");

/* the slide of the pages — one leaf glides out, the next glides in.
   Resolved through `custom` so the leaving page knows the freshest
   direction (AnimatePresence hands the newest custom to the exit). */
const pageSlide = {
  enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 84 : -84 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -84 : 84 }),
};

/* ------------------------------------------------------------------ */

export function DreamBookView() {
  const exitDreamBook = useMirror((s) => s.exitDreamBook);
  const language = useMirror((s) => s.language);
  const t = useT();

  const [stage, setStage] = useState<"atelier" | "weaving" | "reading">(
    "atelier"
  );

  /* ---- the atelier ----
     NO shape is pre-selected: the loom starts with an empty hand.
     Every thread below may be chosen — and let go — freely, and
     the channeling waits until at least one thread is held. */
  const [age, setAge] = useState("");
  const [tale, setTale] = useState("");
  const [volume, setVolume] = useState("");
  const [level, setLevel] = useState("");
  const [topic, setTopic] = useState("");
  const [topicDraft, setTopicDraft] = useState("");
  const [phaseIdx, setPhaseIdx] = useState(0);

  const WEAVING_PHASES = useMemo(
    () => [
      t("Tuning the loom to your frequency…"),
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
  const [pageIdx, setPageIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [weavingNext, setWeavingNext] = useState(false);
  const [weaveError, setWeaveError] = useState(false);
  const [weaveFailed, setWeaveFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  /* the immersive reading — when the visitor scrolls down, only the
     page remains (one next button); scrolling up reveals the top */
  const [immersed, setImmersed] = useState(false);
  const wheelAccum = useRef(0);
  const lastTop = useRef(0);
  const touchY = useRef<number | null>(null);
  const [narrating, setNarrating] = useState(false);
  const [narrPaused, setNarrPaused] = useState(false);
  const [narrLoading, setNarrLoading] = useState(false);

  /* ---- the rewriting hand ---- */
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteDraft, setRewriteDraft] = useState("");
  const [rewrites, setRewrites] = useState<string[]>([]);

  const pagesRef = useRef<WeavePage[]>([]);
  const threadsRef = useRef("");
  const metaRef = useRef<BookMeta | null>(null);
  const endedRef = useRef(false);
  const weavingRef = useRef(false);
  const rewritesRef = useRef<string[]>([]);
  const configRef = useRef({ age, tale, volume, level, topic });
  /* the book's own place in its keeper's cosmic library — a fresh
     volume is given it on open; a volume brought back already has one,
     and every woven page keeps that entry alive */
  const bookIdRef = useRef("");
  const narrRef = useRef<{ audio: HTMLAudioElement | null; ready: boolean }>({
    audio: null,
    ready: false,
  });

  useEffect(() => {
    configRef.current = { age, tale, volume, level, topic };
  }, [age, tale, volume, level, topic]);

  /* -------- a volume brought back from the cosmic library --------
     The DreamBookView mounts fresh when the library hands a volume
     over: the whole book — its pages, its thread, its voice config —
     is restored, and the reading resumes exactly where it was left. */
  const dreamResume = useMirror((s) => s.dreamResume);
  const clearDreamResume = useMirror((s) => s.clearDreamResume);
  const resumeAppliedRef = useRef(false);
  useEffect(() => {
    if (resumeAppliedRef.current) return;
    const r = dreamResume;
    if (!r) return;
    resumeAppliedRef.current = true;
    bookIdRef.current = r.bookId;
    pagesRef.current = r.pages.map((p) => ({ ...p, paragraphs: [...p.paragraphs] }));
    threadsRef.current = r.threads;
    metaRef.current = { ...r.meta };
    endedRef.current = r.ended;
    configRef.current = {
      age: r.config.age,
      tale: r.config.tale,
      volume: r.config.volume,
      level: r.config.level ?? "",
      topic: r.config.topic,
    };
    setAge(r.config.age);
    setTale(r.config.tale);
    setVolume(r.config.volume);
    setLevel(r.config.level ?? "");
    setTopic(r.config.topic);
    setPages(pagesRef.current);
    setMeta(metaRef.current);
    setEnded(r.ended);
    setPageIdx(0);
    setSlideDir(1);
    setZoom(1);
    setStage("reading");
    clearDreamResume();
  }, [dreamResume, clearDreamResume]);

  /* the rewriting hand — wishes that bend the pages yet to come */
  const addRewrite = useCallback((text: string) => {
    const clean = text.trim().slice(0, 500);
    if (!clean) return;
    rewritesRef.current = [...rewritesRef.current, clean].slice(-6);
    setRewrites(rewritesRef.current);
  }, []);

  const removeRewrite = useCallback((idx: number) => {
    rewritesRef.current = rewritesRef.current.filter((_, i) => i !== idx);
    setRewrites(rewritesRef.current);
  }, []);

  /* drift the weaving phrases while the loom works */
  useEffect(() => {
    if (stage !== "weaving" || weaveError) return;
    const iv = setInterval(
      () => setPhaseIdx((i) => (i + 1) % WEAVING_PHASES.length),
      2600
    );
    return () => clearInterval(iv);
  }, [stage, weaveError, WEAVING_PHASES]);

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
    narrRef.current.ready = false;
    setNarrating(false);
    setNarrPaused(false);
    setNarrLoading(false);
  }, []);

  /* the pause — the lady's voice holds its breath exactly where it was,
     and one touch lets it go on from the same word */
  const pauseNarration = useCallback(() => {
    const a = narrRef.current.audio;
    if (!a) return;
    try {
      a.pause();
    } catch {
      /* already paused */
    }
    setNarrating(false);
    setNarrPaused(true);
  }, []);

  const resumeNarration = useCallback(async () => {
    const a = narrRef.current.audio;
    if (!a) {
      setNarrPaused(false);
      return;
    }
    try {
      await a.play();
      setNarrating(true);
      setNarrPaused(false);
    } catch {
      /* the browser wants a fresher touch — the button remains ready */
      narrRef.current.ready = true;
    }
  }, []);

  useEffect(() => stopNarration, [stopNarration]);

  /* ---------------- the weaver's fetch ----------------
     A generous timeout and one quiet retry: if a thread slips
     (network, a sleeping gateway) the loom simply tries again
     before ever troubling the visitor. */

  /* the weaving phase — the loom keeps count */
  const weave = useCallback(
    async (
      phase: "open" | "next" | "close" | "extend",
      pageNumber: number
    ): Promise<boolean> => {
      if (weavingRef.current) return false;
      weavingRef.current = true;
      setWeavingNext(true);
      setWeaveFailed(false);

      try {
        const recent = pagesRef.current.slice(-2).map(pageText);
        /* the book's own keeping — when a volume continues (from the
           cosmic library or from this same evening), its identity and
           the pages woven so far ride along, so the library entry grows
           with the story instead of repeating itself */
        const carrying = phase !== "open" && bookIdRef.current
          ? {
              bookId: bookIdRef.current,
              bookPages: pagesRef.current.map((p) => ({
                n: p.n,
                ...(p.chapter ? { chapter: p.chapter } : {}),
                paragraphs: p.paragraphs,
              })),
              bookMeta: metaRef.current ? { ...metaRef.current } : undefined,
              bookConfig: { ...configRef.current },
            }
          : {};
        const payload = JSON.stringify({
          phase,
          language,
          config: {
            ...configRef.current,
            /* the exact second of this conjuring — a seed that has never
               been woven and will never be woven again */
            ...(phase === "open"
              ? {
                  seed: `${Date.now().toString(36)}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
                }
              : {}),
          },
          ...carrying,
          threads: threadsRef.current || undefined,
          recentPages: recent.length ? recent : undefined,
          pageNumber,
          totalPages: metaRef.current?.totalPages,
          rewrites:
            phase !== "open" && rewritesRef.current.length
              ? rewritesRef.current
              : undefined,
        });
        const attempt = () =>
          fetch("/api/dream-book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            signal: AbortSignal.timeout(150000),
          });
        let res: Response;
        try {
          res = await attempt();
        } catch {
          res = await attempt();
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.pages?.length) {
          /* the loom simply speaks for itself when a thread slips —
             everything in the laboratory is free, so no threshold
             can ever interrupt the weaving */
          throw new Error(
            data?.error ||
              "The loom fell silent for a moment. Breathe, then weave again."
          );
        }

        /* a fresh volume's place in the library rides home with it */
        if (phase === "open" && typeof data.libraryId === "string") {
          bookIdRef.current = data.libraryId;
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
            sigil: typeof data.sigil === "string" ? data.sigil : "",
            axiom: typeof data.axiom === "string" ? data.axiom : "",
            dedication: data.dedication ?? "",
            totalPages: data.totalPages ?? 96,
          };
          setMeta(metaRef.current);
        }
        if (
          phase !== "open" &&
          typeof data.totalPages === "number" &&
          metaRef.current
        ) {
          /* the loom may widen or narrow the book when the rewriting
             hand asks for a different length */
          metaRef.current = { ...metaRef.current, totalPages: data.totalPages };
          setMeta(metaRef.current);
        }
        if (phase === "close") {
          endedRef.current = true;
          setEnded(true);
        }
        if (phase === "open") {
          void useMirror.getState().refreshMe();
        }
        return true;
      } catch {
        setWeaveFailed(true);
        if (phase !== "open") {
          toast.error(t("The loom fell silent for a moment."), {
            description: t("Rest, then weave again."),
          });
        }
        return false;
      } finally {
        weavingRef.current = false;
        setWeavingNext(false);
      }
    },
    [language, t]
  );

  /* ---------------- the atelier ---------------- */

  /* one thread held or let go — every shape toggles freely, and the
     selection may empty itself again before the channeling begins */
  const choose = useCallback(
    (kind: "reader" | "tale" | "volume" | "level", id: string) => {
      if (kind === "reader") setAge((cur) => (cur === id ? "" : id));
      if (kind === "tale") setTale((cur) => (cur === id ? "" : id));
      if (kind === "volume") setVolume((cur) => (cur === id ? "" : id));
      if (kind === "level") setLevel((cur) => (cur === id ? "" : id));
    },
    []
  );

  const openBook = useCallback(async () => {
    if (weavingRef.current) return;
    setWeaveError(false);
    setStage("weaving");
    setPhaseIdx(0);
    const ok = await weave("open", 1);
    if (ok) {
      setStage("reading");
      setPageIdx(0);
      setSlideDir(1);
    } else {
      /* stay in the weaving room — it now speaks for itself */
      setWeaveError(true);
    }
  }, [weave]);

  /* the one input — whatever is spoken, its send begins the channeling:
     a totally authentic, never-repeating volume, woven in real time */
  const channelBook = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = topicDraft.trim().slice(0, 600);
      /* the final gate — at least one thread must be held before the
         loom may begin; nothing beyond that is ever forced */
      if (!text || weavingRef.current || !(age || tale || volume || level)) return;
      setTopicDraft("");
      setTopic(text);
      configRef.current = { ...configRef.current, topic: text };
      void openBook();
    },
    [topicDraft, age, tale, volume, level, openBook]
  );

  /* ---------------- the reader's logic ----------------
     page 0 = the title page; page k ≥ 1 = story page n k.
     ONE page is revealed at a time — the next button slides it
     away and draws the following one out of the loom. */

  /* the coherent chapter — only the first page of each distinct
     chapter title keeps its chapter (and with it the great letter);
     the loom sometimes repeats a title on every page it returns, and
     a book where every page opens with a big letter is no book */
  const displayPages = useMemo(() => dedupeChapters(pages), [pages]);

  const currentPage = useMemo(
    () => (pageIdx >= 1 ? displayPages.find((p) => p.n === pageIdx) : undefined),
    [displayPages, pageIdx]
  );

  const maxIdx = pages.length;

  const atPlannedEnd = !!meta && pages.length >= meta.totalPages && !ended;

  /* one page past the woven ones may always be slid into: it is
     either the crossroads, the ending, or the loom itself — where the
     next pages are being revealed (with a weave-again thread if
     the loom ever fell silent). The visitor is never walled in. */
  const limitIdx = maxIdx + 1;
  const showChoice = atPlannedEnd && pageIdx === maxIdx + 1;
  const showEnd = ended && pageIdx === maxIdx + 1;

  /* prefetch — while the visitor reads page k, the loom weaves k+1 */
  useEffect(() => {
    if (stage !== "reading" || endedRef.current || !metaRef.current) return;
    const have = pagesRef.current.length;
    if (have >= pageIdx + 1) return;
    if (have >= metaRef.current.totalPages) return; /* the choice will ask */
    void weave("next", have + 1);
  }, [pageIdx, pages.length, stage, weave]);

  const goPage = useCallback(
    (dir: 1 | -1) => {
      stopNarration();
      setSlideDir(dir);
      setPageIdx((s) => {
        const next = s + dir;
        if (next < 0) return s;
        if (dir === 1 && next > limitIdx) return s;
        return next;
      });
    },
    [limitIdx, stopNarration]
  );

  /* keyboard page turns */
  useEffect(() => {
    if (stage !== "reading") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goPage(1);
      if (e.key === "ArrowLeft") goPage(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, goPage]);

  const newDream = useCallback(() => {
    stopNarration();
    pagesRef.current = [];
    threadsRef.current = "";
    metaRef.current = null;
    endedRef.current = false;
    rewritesRef.current = [];
    bookIdRef.current = "";
    setPages([]);
    setMeta(null);
    setEnded(false);
    setRewrites([]);
    setPageIdx(0);
    setSlideDir(1);
    setZoom(1);
    setWeaveFailed(false);
    setTopic("");
    setTopicDraft("");
    setLevel("");
    setStage("atelier");
  }, [stopNarration]);

  const weaveOnward = useCallback(async () => {
    const ok = await weave("extend", pagesRef.current.length + 1);
    if (ok) setPageIdx((s) => s + 1);
  }, [weave]);

  const letRest = useCallback(async () => {
    const ok = await weave("close", pagesRef.current.length + 1);
    if (ok) setPageIdx((s) => s + 1);
  }, [weave]);

  /* ---------------- the narrator ---------------- */

  const narrate = useCallback(async () => {
    /* a voice holding its breath — let it go on from the same word */
    const held = narrRef.current.audio;
    if (held && narrPaused && held.paused) {
      await resumeNarration();
      return;
    }
    /* a voice already prepared and waiting for a fresh touch? */
    const prepared = narrRef.current.audio;
    if (prepared && narrRef.current.ready && prepared.paused) {
      narrRef.current.ready = false;
      try {
        await prepared.play();
        setNarrating(true);
        setNarrPaused(false);
      } catch {
        stopNarration();
      }
      return;
    }
    if (narrating || narrLoading) {
      stopNarration();
      return;
    }
    stopNarration();
    setNarrLoading(true);
    const opening = pageIdx === 0 && meta
      ? `${meta.title}. ${meta.subtitle} ${meta.sigil} ${meta.axiom} ${meta.dedication}`
      : "";
    const body = currentPage ? pageText(currentPage) : "";
    const text = (opening || body).trim();
    try {
      const voice = BOOK_VOICE;
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
        setNarrPaused(false);
      };
      audio.onerror = () => {
        if (narrRef.current.audio === audio) narrRef.current.audio = null;
        setNarrating(false);
        setNarrPaused(false);
      };
      await audio.play();
      setNarrating(true);
      setNarrPaused(false);
    } catch (err) {
      const waiting =
        narrRef.current.audio &&
        err instanceof DOMException &&
        err.name === "NotAllowedError";
      if (waiting) {
        /* the voice is ready but the browser wants a fresher touch —
           one more press on the same button lets it speak */
        narrRef.current.ready = true;
        toast(t("The voice is ready — press once more."));
      } else {
        /* the house voice could not travel — the browser reads the
           page aloud in its stead */
        const handle = speakWithBrowserVoice({
          text,
          lang: language,
          rate: 0.85,
          onEnd: () => {
            narrRef.current.audio = null;
            setNarrating(false);
            setNarrPaused(false);
          },
          onError: () => {
            narrRef.current.audio = null;
            setNarrating(false);
            setNarrPaused(false);
          },
        });
        if (handle) {
          noteBrowserVoiceFallback(() =>
            toast.info(t("The house voice rests — your browser reads in its stead."))
          );
          setNarrating(true);
          setNarrPaused(false);
          return;
        }
        narrRef.current.audio = null;
        toast.error(t("The voice of the book is resting."), {
          description: t("Rest, then listen again."),
        });
      }
    } finally {
      setNarrLoading(false);
    }
  }, [narrating, narrLoading, narrPaused, currentPage, pageIdx, meta, stopNarration, resumeNarration, t]);

  /* ---------------- shared ---------------- */

  const backFromAtelier = () => {
    stopNarration();
    exitDreamBook();
  };

  const backFromWeaving = () => {
    setWeaveError(false);
    setStage("atelier");
  };

  const backFromReader = () => {
    stopNarration();
    setStage("atelier");
  };

  const readPageOf = meta ? Math.min(pageIdx, meta.totalPages) : 0;
  const progress = meta ? Math.min(1, readPageOf / meta.totalPages) : 0;

  /* the chosen level of lecture — the depth the book reads at */
  const levelMeta = useMemo(
    () => LECTURE_LEVELS.find((l) => l.id === level) ?? null,
    [level]
  );

  /* the rewriting hand — starters the visitor may lean on */
  const REWRITE_STARTERS = [
    t("Let the coming events turn toward…"),
    t("I wish the book to be about … pages"),
    t("Write in a different voice — …"),
    t("Add chapters where…"),
    t("Tune the book toward…"),
  ];

  const applyRewrite = useCallback(() => {
    const text = rewriteDraft.trim();
    if (!text) return;
    addRewrite(text);
    setRewriteDraft("");
    setRewriteOpen(false);
    toast(t("Your hand is upon the loom — the coming pages will bend to it."));
  }, [rewriteDraft, addRewrite, t]);

  /* the shared ink icon button — the same quiet circle as every chat */
  const inkIconBtn =
    "focus-glow flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground";

  /* ================================================================ */
  /*  THE ATELIER                                                      */
  /* ================================================================ */

  const atelier = (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-3 sm:px-5">
        <button
          type="button"
          onClick={backFromAtelier}
          aria-label={t("Back to the laboratory")}
          title={t("Back to the laboratory")}
          className={inkIconBtn}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <MoonStar className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("The atelier of tales")}</span>
        </span>
      </header>

      <div className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[680px] flex-col px-4 pb-6 pt-4 sm:px-6">
          {/* the hero — pure ink, no colours, the book's own face */}
          <div className="flex flex-col items-center pb-1 pt-2 text-center">
            <span
              className="font-[family-name(var(--font-literata))] text-2xl text-foreground/30"
              aria-hidden="true"
            >
              ❧
            </span>
            <h1 className="ink-title mt-3 text-[28px] leading-tight sm:text-[34px]">
              {t("Dream Book")}
            </h1>
            <p className="ink-hand ink-soft mt-2 max-w-[440px] text-[12.5px] italic leading-relaxed sm:text-sm">
              {t(
                "Name any subject, era, or universe — the loom tunes itself, and the book begins."
              )}
            </p>
            <div className="mt-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px w-14 bg-border" />
              <span className="font-[family-name(var(--font-literata))] text-[10px] text-foreground/30">
                ✦
              </span>
              <span className="h-px w-14 bg-border" />
            </div>
          </div>

          {/* the welcome — the room's own greeting, set in the reading
              hand. No transcript, no bubbles: one page of prose that
              waits like a dedication, and the input below begins the
              tale exactly as it always has. */}
          <div className="mx-auto mt-7 max-w-[440px]">
            <p className="ink-hand text-[16.5px] leading-[1.95] first-letter:float-left first-letter:mr-3 first-letter:mt-[7px] first-letter:text-[50px] first-letter:font-semibold first-letter:leading-[0.78] sm:text-[18px]">
              {t(
                "Welcome, keeper of wishes. Speak anything — a subject, a wish, a whole world — and the book begins."
              )}
            </p>
          </div>

          {/* the page-marker slide — pass between the Book and the
              Akashic Library without ever leaving the reading rooms */}
          <div className="mt-7 flex justify-center">
          </div>

          {/* the shapes — reader / tale / book */}
          <div className="mt-5 space-y-4">
            <ShapeRow
              label={t("The reader")}
              options={READERS}
              active={age}
              onPick={(id) => choose("reader", id)}
            />
            <ShapeMenu
              label={t("The tale")}
              options={TALES}
              active={tale}
              onPick={(id) => choose("tale", id)}
            />
            <ShapeRow
              label={t("The book")}
              options={VOLUMES}
              active={volume}
              onPick={(id) => choose("volume", id)}
            />
          </div>

          {/* the level bar — the depth of lecture, four strata of reading */}
          <div className="mt-7" data-testid="dream-level-bar">
            <p className="mono-label mb-2.5 text-center text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("The level of lecture")}
            </p>
            <div className="flex items-end gap-1.5">
              {LECTURE_LEVELS.map((lv, i) => {
                const active = level === lv.id;
                const intensities = [0.14, 0.32, 0.58, 0.92];
                return (
                  <button
                    key={lv.id}
                    type="button"
                    onClick={() => choose("level", lv.id)}
                    aria-pressed={active}
                    aria-label={`${t(lv.label)} — ${lv.numeral}`}
                    data-testid={`dream-level-${lv.id}`}
                    className="focus-glow group flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "relative flex h-7 w-full items-end overflow-hidden rounded-md border transition-all duration-300",
                        active && "glow-sm"
                      )}
                      style={{
                        borderColor: active
                          ? "var(--foreground)"
                          : "var(--border)",
                        background: `color-mix(in srgb, var(--foreground) ${intensities[i]}%, transparent)`,
                      }}
                    >
                      <span
                        className="absolute inset-x-0 top-0 flex justify-center pt-0.5 font-[family-name(var(--font-literata))] text-[9px] tracking-[0.14em]"
                        style={{
                          color:
                            i >= 2
                              ? "var(--background)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {lv.numeral}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="dream-level-marker"
                          className="absolute inset-x-0 bottom-0 h-[3px] bg-foreground"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "w-full truncate text-center font-[family-name(var(--font-literata))] text-[10.5px] italic leading-tight transition-colors duration-300",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground/75 group-hover:text-foreground"
                      )}
                    >
                      {t(lv.label)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="ink-hand ink-soft mt-2.5 min-h-[2.6em] text-center text-[12px] italic leading-relaxed">
              {levelMeta
                ? t(levelMeta.depth)
                : t("Choose how deep the book reads — from the clearest daylight to the multidimensional legacy voice.")}
            </p>
          </div>
          <div aria-hidden="true" className="h-4" />
        </div>
      </div>

      {/* the one input — speak, send, and the channeling begins */}
      <div className="relative z-10 shrink-0 border-t border-border bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6">
        <div className="mx-auto w-full max-w-[680px]">
          {/* the one gentle gate — the loom only asks for a single
              thread before it may begin; nothing more is ever forced */}
          <AnimatePresence>
            {topicDraft.trim() && !(age || tale || volume) && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.3 }}
                className="ink-hand ink-soft mb-2 text-center text-[12.5px] italic"
              >
                {t(
                  "The loom waits for a thread — choose the reader, the tale, the book, or the level below."
                )}
              </motion.p>
            )}
          </AnimatePresence>
          <form
            onSubmit={channelBook}
            className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-4 pr-1 transition-all duration-300 focus-within:border-foreground/35"
          >
            <input
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              placeholder={t("Speak anything — a subject, a wish, a whole world…")}
              aria-label={t("Speak anything — a subject, a wish, a whole world…")}
              maxLength={600}
              className="min-w-0 flex-1 bg-transparent py-2 font-[family-name(var(--font-literata))] text-[13.5px] italic text-foreground placeholder:font-[family-name(var(--font-sans))] placeholder:not-italic placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!topicDraft.trim() || !(age || tale || volume || level)}
              aria-label={t("Channel the book")}
              title={t("Channel the book")}
              className="akashic-btn focus-glow flex size-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Waves className="size-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  THE WEAVING — the unseen ink emblem                              */
  /* ================================================================ */

  const weaving = (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <DreamEmblem />

        {weaveError ? (
          <>
            <p className="ink-hand ink-soft mt-8 max-w-[420px] text-center text-[15px] italic">
              {t("The loom fell silent for a moment.")}
            </p>
            <p className="ink-hand ink-faint mt-2 text-center text-[13px] italic">
              {t("Rest, then weave again.")}
            </p>
            <div className="mt-7 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={openBook}
                className="akashic-btn focus-glow flex h-10 items-center justify-center gap-2 rounded-full px-7 text-[13.5px] font-medium"
              >
                <Feather className="size-3.5" aria-hidden="true" />
                {t("Weave again")}
              </button>
              <button
                type="button"
                onClick={backFromWeaving}
                className="papyrus-btn focus-glow flex h-10 items-center justify-center rounded-full px-6 text-[13px]"
              >
                {t("Return to the atelier")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 h-[26px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={phaseIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="ink-hand ink-soft max-w-[420px] text-center text-[15px] italic"
                >
                  {WEAVING_PHASES[phaseIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-4 h-px w-40 overflow-hidden rounded-full bg-foreground/10">
              <div className="ink-shimmer h-full w-full" />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );

  /* ================================================================ */
  /*  THE READER                                                       */
  /* ================================================================ */

  const canNext = pageIdx < limitIdx && !showChoice && !showEnd;
  const canPrev = pageIdx > 0;

  /* ================================================================ */
  /*  the immersive scroll — down: only the page; up: the top returns */
  /* ================================================================ */
  useEffect(() => {
    if (stage !== "reading") setImmersed(false);
  }, [stage]);

  const readerScroll = useMemo(
    () => ({
      onScroll: (e: ReactUIEvent<HTMLDivElement>) => {
        const top = e.currentTarget.scrollTop;
        if (top > lastTop.current + 4 && top > 64) setImmersed(true);
        else if (top < lastTop.current - 4) setImmersed(false);
        lastTop.current = top;
      },
      onWheel: (e: ReactWheelEvent<HTMLDivElement>) => {
        wheelAccum.current += e.deltaY;
        if (wheelAccum.current > 90) {
          setImmersed(true);
          wheelAccum.current = 0;
        } else if (wheelAccum.current < -80) {
          setImmersed(false);
          wheelAccum.current = 0;
        }
      },
      onTouchStart: (e: ReactTouchEvent<HTMLDivElement>) => {
        touchY.current = e.touches[0]?.clientY ?? null;
      },
      onTouchMove: (e: ReactTouchEvent<HTMLDivElement>) => {
        const y = e.touches[0]?.clientY ?? null;
        if (touchY.current != null && y != null) {
          const dy = touchY.current - y;
          if (dy > 18) setImmersed(true);
          else if (dy < -18) setImmersed(false);
        }
        touchY.current = y;
      },
      onTouchEnd: () => {
        touchY.current = null;
        wheelAccum.current = 0;
      },
    }),
    []
  );

  const reader = (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <header
        className={cn(
          "relative z-20 flex shrink-0 items-center gap-2 overflow-hidden px-3 transition-all duration-500 sm:px-5",
          immersed
            ? "pointer-events-none max-h-0 -translate-y-5 opacity-0"
            : "max-h-24 translate-y-0 pt-3 opacity-100"
        )}
      >
        <button
          type="button"
          onClick={backFromReader}
          aria-label={t("Begin a new dream")}
          title={t("Begin a new dream")}
          className={inkIconBtn}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <h1 className="ink-hand min-w-0 flex-1 truncate text-center text-[14px] text-foreground/85 sm:text-[16px]">
          {meta?.title ?? ""}
        </h1>
        <div className="flex items-center gap-1.5">
          {/* the rewriting hand — a fancy button at the very top */}
          <button
            type="button"
            onClick={() => setRewriteOpen(true)}
            aria-label={t("Rewrite the coming pages")}
            title={t("Rewrite the coming pages")}
            className="dream-fancy focus-glow relative flex h-9 items-center gap-1.5 rounded-full pl-3 pr-3.5"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="font-[family-name(var(--font-literata))] text-[12.5px] italic tracking-wide">
              {t("Rewrite")}
            </span>
            {rewrites.length > 0 && (
              <span
                className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground"
                aria-hidden="true"
              />
            )}
          </button>
          <button
            type="button"
            onClick={narrate}
            aria-label={narrating ? t("Stop") : t("Listen to the story")}
            title={narrating ? t("Stop") : t("Listen to the story")}
            className={cn(
              inkIconBtn,
              (narrating || narrLoading) &&
                "border-transparent bg-foreground text-background hover:opacity-90"
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
          {/* the pause — the lady's voice holds its breath, one touch
              returns it to the same word */}
          {(narrating || narrPaused) && !narrLoading && (
            <button
              type="button"
              onClick={() => {
                if (narrPaused) void resumeNarration();
                else pauseNarration();
              }}
              data-testid="book-narration-pause"
              aria-label={narrPaused ? t("Play") : t("Pause")}
              title={narrPaused ? t("Play") : t("Pause")}
              className={cn(
                inkIconBtn,
                narrPaused &&
                  "border-transparent bg-foreground text-background hover:opacity-90"
              )}
            >
              {narrPaused ? (
                <Play className="size-4 fill-current" aria-hidden="true" />
              ) : (
                <Pause className="size-4 fill-current" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0, z - 1))}
            disabled={zoom === 0}
            aria-label={t("Smaller text")}
            title={t("Smaller text")}
            className={cn(inkIconBtn, "disabled:opacity-35")}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
            disabled={zoom === ZOOM_STEPS.length - 1}
            aria-label={t("Larger text")}
            title={t("Larger text")}
            className={cn(inkIconBtn, "disabled:opacity-35")}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
          {/* the page-marker slide — it rests among the reading's own
              instruments and vanishes with the whole top bar the moment
              the reading immerses; narrow hands keep the bar uncluttered
              and change rooms from the atelier instead */}
          <div className="hidden md:block">
          </div>
        </div>
      </header>

      {/* the book itself — one page at a time, sliding, each page
          stretching the full height of the screen once revealed */}
      <div
        {...readerScroll}
        className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex h-full w-full max-w-[760px] items-stretch justify-center px-3 pb-7 pt-3 sm:px-8 sm:pb-9">
          <div className="relative flex min-h-full w-full max-w-[640px] flex-col">
            {/* the slide buttons — desktop (the previous one rests while
                the reading is immersed — only the next page remains) */}
            {canPrev && !immersed && (
              <button
                type="button"
                onClick={() => goPage(-1)}
                aria-label={t("Previous page")}
                className="dream-turn focus-glow absolute -left-5 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full md:flex"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
            )}
            {canNext && (
              <button
                type="button"
                onClick={() => goPage(1)}
                aria-label={t("Next page")}
                className="dream-turn focus-glow absolute -right-5 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full md:flex"
              >
                <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
              </button>
            )}

            <AnimatePresence mode="wait" custom={slideDir} initial={false}>
              <motion.div
                key={`page-${pageIdx}`}
                custom={slideDir}
                variants={pageSlide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.38, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {showChoice ? (
                  /* the crossroads — the tale can go on */
                  <div className="dream-page dream-page-single mx-auto my-auto flex max-w-[460px] flex-col items-center justify-center px-8 py-14 text-center">
                    <span
                      className="font-[family-name(var(--font-literata))] text-3xl text-[var(--dream-ink-faint)]"
                      aria-hidden="true"
                    >
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
                        className="dream-ink-btn focus-glow flex h-11 items-center justify-center gap-2 rounded-full text-[14px] font-medium disabled:opacity-60"
                      >
                        <Feather className="size-4" aria-hidden="true" />
                        {t("Weave onward")}
                      </button>
                      <button
                        type="button"
                        onClick={letRest}
                        disabled={weavingNext}
                        className="dream-ink-outline focus-glow flex h-11 items-center justify-center rounded-full font-[family-name(var(--font-literata))] text-[13.5px] disabled:opacity-60"
                      >
                        {t("Let the story rest")}
                      </button>
                    </div>
                  </div>
                ) : showEnd ? (
                  /* the last page of the book */
                  <div className="dream-page dream-page-single mx-auto my-auto flex max-w-[460px] flex-col items-center justify-center px-8 py-16 text-center">
                    <span
                      className="font-[family-name(var(--font-literata))] text-4xl text-[var(--dream-ink-soft)]"
                      aria-hidden="true"
                    >
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
                      className="dream-ink-btn focus-glow mt-8 flex h-11 items-center justify-center gap-2 rounded-full px-7 text-[14px] font-medium"
                    >
                      <MoonStar className="size-4" aria-hidden="true" />
                      {t("Begin a new dream")}
                    </button>
                  </div>
                ) : pageIdx === 0 ? (
                  /* the title page — the Liminal Threshold, one leaf,
                     tall as the screen itself */
                  <div className="dream-page dream-page-single mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-between px-8 py-10 text-center sm:px-12">
                    <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
                      <span
                        className="font-[family-name(var(--font-literata))] text-2xl text-[var(--dream-ink-faint)]"
                        aria-hidden="true"
                      >
                        ❧
                      </span>
                      {meta?.sigil && (
                        <p className="mt-4 max-w-[360px] font-[family-name(var(--font-literata))] text-[12.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                          {meta.sigil}
                        </p>
                      )}
                      <h2 className="mt-5 max-w-[340px] font-[family-name(var(--font-literata))] text-[26px] leading-snug text-[var(--dream-ink)] sm:text-[32px]">
                        {meta?.title}
                      </h2>
                      {meta?.subtitle && (
                        <p className="mt-3 font-[family-name(var(--font-literata))] text-[13px] italic text-[var(--dream-ink-soft)] sm:text-sm">
                          {meta.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      {meta?.axiom && (
                        <p className="max-w-[380px] font-[family-name(var(--font-literata))] text-[12.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                          {meta.axiom}
                        </p>
                      )}
                      {meta?.axiom && meta?.dedication && (
                        <span
                          className="my-3 h-px w-10 bg-[var(--dream-ink-faint)]/40"
                          aria-hidden="true"
                        />
                      )}
                      <p className="max-w-[300px] font-[family-name(var(--font-literata))] text-[12px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                        {meta?.dedication}
                      </p>
                      {levelMeta && (
                        <p
                          className="mono-label mt-3 text-[9px] uppercase tracking-[0.24em] text-[var(--dream-ink-faint)]"
                          data-testid="dream-reading-level-badge"
                        >
                          {levelMeta.numeral} · {t(levelMeta.label)}
                        </p>
                      )}
                    </div>
                    <p className="pb-2 font-[family-name(var(--font-literata))] text-[10.5px] uppercase tracking-[0.24em] text-[var(--dream-ink-faint)]">
                      {t("woven for you, this very hour")}
                    </p>
                  </div>
                ) : (
                  <BookPage
                    page={currentPage}
                    fontSize={ZOOM_STEPS[zoom]}
                    stalled={weaveFailed && !weavingNext}
                    onRetry={() =>
                      void weave("next", pagesRef.current.length + 1)
                    }
                  />
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
                  className="mono-label mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  <span
                    className="size-1 animate-pulse rounded-full bg-foreground/50"
                    aria-hidden="true"
                  />
                  {t("The loom weaves the next pages…")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* the progress thread + the slide buttons (they rest while the
          reading is immersed — the page alone fills the screen) */}
      <footer
        className={cn(
          "relative z-20 shrink-0 overflow-hidden px-4 transition-all duration-500",
          immersed
            ? "pointer-events-none max-h-0 translate-y-5 pb-0 pt-0 opacity-0"
            : "max-h-24 translate-y-0 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 opacity-100"
        )}
      >
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-3">
          <button
            type="button"
            onClick={() => goPage(-1)}
            disabled={!canPrev}
            aria-label={t("Previous page")}
            className="dream-turn focus-glow flex size-10 shrink-0 items-center justify-center rounded-full md:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-foreground/60 transition-all duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="mono-label mt-1.5 text-center text-[10px] tracking-[0.18em] text-muted-foreground">
              {meta
                ? pageIdx === 0
                  ? t("the title page")
                  : t("page {n} of {total}")
                      .replace("{n}", String(readPageOf))
                      .replace("{total}", String(meta.totalPages))
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => goPage(1)}
            disabled={!canNext}
            aria-label={t("Next page")}
            className="dream-turn focus-glow flex size-10 shrink-0 items-center justify-center rounded-full md:hidden"
          >
            <ArrowLeft className="size-4 rotate-180" aria-hidden="true" />
          </button>
        </div>
      </footer>

      {/* the one button that remains while immersed — the next page,
          floating alone over the reading */}
      <AnimatePresence>
        {immersed && canNext && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            type="button"
            onClick={() => goPage(1)}
            aria-label={t("Next page")}
            title={t("Next page")}
            className="dream-turn focus-glow absolute bottom-6 right-5 z-30 flex size-12 items-center justify-center rounded-full"
          >
            <ArrowLeft className="size-5 rotate-180" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* the rewriting hand's panel */}
      <ModalShell
        open={rewriteOpen}
        onOpenChange={setRewriteOpen}
        title={t("The rewriting hand")}
        description={t(
          "Whisper what must change — the coming events, the number of pages, the chapters, the very voice of the writing, even the frequency of the subject itself. The loom will bend the book to your hand."
        )}
        widthClass="sm:max-w-[500px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyRewrite();
          }}
          className="px-5 pb-5 sm:px-6 sm:pb-6"
        >
          <textarea
            value={rewriteDraft}
            onChange={(e) => setRewriteDraft(e.target.value)}
            rows={4}
            placeholder={t("What do you wish to change?")}
            aria-label={t("What do you wish to change?")}
            className="nice-scroll w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-[14px] leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/35 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REWRITE_STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRewriteDraft((d) => (d ? `${d} ${s}` : s))}
                className="focus-glow rounded-full border border-border px-3 py-1.5 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          {rewrites.length > 0 && (
            <div className="mt-4">
              <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("Already whispered into the weave")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {rewrites.map((r, i) => (
                  <li
                    key={`${i}-${r.slice(0, 12)}`}
                    className="flex items-start gap-2 rounded-xl border border-border/70 bg-card/50 px-3 py-2"
                  >
                    <span className="ink-hand ink-soft min-w-0 flex-1 text-[12.5px] italic leading-relaxed">
                      {r}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRewrite(i)}
                      aria-label={t("Let the wish go")}
                      className="focus-glow mt-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="submit"
            disabled={!rewriteDraft.trim()}
            className="akashic-btn focus-glow mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium tracking-wide disabled:opacity-50"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {t("Bend the tale")}
          </button>
        </form>
      </ModalShell>
    </div>
  );

  if (stage === "weaving") return weaving;
  if (stage === "reading") return reader;
  return atelier;
}

/* ------------------------------------------------------------------ */
/*  The unseen emblem — an ink loom that draws a book out of threads. */
/*  Pure line art in the theme's own ink: it draws itself, the quill  */
/*  breathes, the thread flows, lines write themselves, sparks of ink */
/*  twinkle. No colours, no words — only the work being done.         */
/* ------------------------------------------------------------------ */

function DreamEmblem() {
  return (
    <svg
      viewBox="0 0 220 170"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="dream-emblem h-44 w-56 text-foreground sm:h-52 sm:w-64"
      aria-hidden="true"
    >
      {/* the thread-ring of the loom, turning very slowly */}
      <circle
        cx="110"
        cy="92"
        r="78"
        className="de-ring"
        strokeDasharray="1 7"
        strokeWidth="1"
        opacity="0.45"
      />

      {/* sparks of ink */}
      <path
        className="de-spark"
        style={{ animationDelay: "0s" }}
        strokeWidth="1"
        d="M42 30 Q42 36 48 36 Q42 36 42 42 Q42 36 36 36 Q42 36 42 30 Z"
      />
      <path
        className="de-spark"
        style={{ animationDelay: "0.9s" }}
        strokeWidth="1"
        d="M182 40 Q182 45 187 45 Q182 45 182 50 Q182 45 177 45 Q182 45 182 40 Z"
      />
      <path
        className="de-spark"
        style={{ animationDelay: "1.7s" }}
        strokeWidth="1"
        d="M170 128 Q170 132 174 132 Q170 132 170 136 Q170 132 166 132 Q170 132 170 128 Z"
      />

      {/* the open book, drawn once in a single breath */}
      <g strokeWidth="1.4">
        <path
          className="de-draw"
          pathLength={1}
          d="M110 74 C 96 64, 76 60, 58 63 L58 100 C 76 97, 96 101, 110 110"
        />
        <path
          className="de-draw"
          pathLength={1}
          style={{ animationDelay: "0.18s" }}
          d="M110 74 C 124 64, 144 60, 162 63 L162 100 C 144 97, 124 101, 110 110"
        />
        <path
          className="de-draw"
          pathLength={1}
          style={{ animationDelay: "0.42s" }}
          opacity="0.55"
          d="M110 74 L110 110"
        />
      </g>

      {/* the tale writing itself, line by line */}
      <g strokeWidth="1.1" opacity="0.7">
        <path
          className="de-line"
          pathLength={1}
          style={{ animationDelay: "1s" }}
          d="M68 77 C 80 74, 92 76, 101 80"
        />
        <path
          className="de-line"
          pathLength={1}
          style={{ animationDelay: "1.5s" }}
          d="M67 85 C 79 82, 91 84, 101 88"
        />
        <path
          className="de-line"
          pathLength={1}
          style={{ animationDelay: "2s" }}
          d="M119 80 C 129 76, 141 74, 152 77"
        />
        <path
          className="de-line"
          pathLength={1}
          style={{ animationDelay: "2.5s" }}
          d="M119 88 C 129 84, 143 82, 152 85"
        />
      </g>

      {/* the quill, breathing above the page */}
      <g className="de-quill" strokeWidth="1.3">
        <path d="M152 16 C 142 30, 134 47, 131 62" />
        <path d="M152 16 C 146 28, 139 45, 132 60 C 143 51, 150 34, 152 16 Z" />
      </g>

      {/* the thread of ink flowing from the nib to the page */}
      <path
        className="de-thread"
        strokeWidth="1"
        opacity="0.65"
        d="M131 62 C 127 72, 123 78, 117 84"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function ShapeMenu({
  label,
  options,
  active,
  onPick,
}: {
  label: string;
  options: { id: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
}) {
  const t = useT();
  const current = options.find((o) => o.id === active);
  return (
    <div>
      <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="tale-menu-trigger"
            aria-label={current ? `${label}: ${t(current.label)}` : label}
            className="focus-glow flex min-w-[190px] items-center justify-between gap-3 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground transition-all duration-300 hover:border-foreground/40"
          >
            {current ? (
              <span className="truncate">{t(current.label)}</span>
            ) : (
              <span className="truncate font-[family-name(var(--font-literata))] italic text-muted-foreground/70">
                {t("Choose the tale")}
              </span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-[290px] w-[220px] overflow-y-auto nice-scroll"
        >
          {options.map((o) => {
            const isActive = o.id === active;
            return (
              <DropdownMenuItem
                key={o.id}
                onSelect={() => onPick(o.id)}
                data-testid={`tale-option-${o.id}`}
                className={cn(
                  "cursor-pointer justify-between gap-3 text-[13px]",
                  isActive && "bg-foreground/8 font-medium text-foreground"
                )}
              >
                <span className="truncate">{t(o.label)}</span>
                {isActive && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
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
  onPick: (id: string) => void;
}) {
  const t = useT();
  return (
    <div>
      <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isActive = o.id === active;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              aria-pressed={isActive}
              className={cn(
                "focus-glow rounded-full border px-3 py-1.5 text-[12px] transition-all duration-300",
                isActive
                  ? "border-transparent bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
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
  fontSize,
  stalled,
  onRetry,
}: {
  page?: WeavePage;
  fontSize: number;
  stalled?: boolean;
  onRetry?: () => void;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "dream-page dream-page-single nice-scroll mx-auto flex min-h-0 w-full flex-1 flex-col px-6 py-8 sm:px-10"
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
                  "mb-4 whitespace-pre-wrap text-[var(--dream-ink)] last:mb-0",
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
          <span
            className="font-[family-name(var(--font-literata))] text-lg text-[var(--dream-ink-faint)]"
            aria-hidden="true"
          >
            ❧
          </span>
          <p className="font-[family-name(var(--font-literata))] text-[12.5px] italic text-[var(--dream-ink-faint)]">
            {t("The loom weaves the next pages…")}
          </p>
          <div className="h-px w-28 rounded-full bg-[var(--dream-ink-faint)]/25 overflow-hidden">
            <div className="ink-shimmer h-full w-full" />
          </div>
          {stalled && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="dream-ink-btn focus-glow mt-2 flex h-8 items-center justify-center rounded-full px-4 text-[12px] font-medium"
            >
              {t("Weave again")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
