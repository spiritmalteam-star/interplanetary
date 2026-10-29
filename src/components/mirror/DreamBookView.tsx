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
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  BookDown,
  BookOpenText,
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Feather,
  Focus,
  History,
  LoaderCircle,
  MoonStar,
  Pause,
  PenLine,
  Play,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
  stopBrowserVoice,
} from "@/lib/browser-voice";
import { BOOK_DEPTHS, READERS, TALES, VOLUMES } from "@/lib/data/book-options";
import { dedupeChapters } from "@/lib/book-text";
import { bookToText } from "@/lib/book-text";
import { formatArchiveNumber } from "@/lib/i18n/core";
import { registerWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { MirrorBridge } from "./living/MirrorBridge";
import {
  forgetVolume,
  keepVolume,
  loadShelf,
  type ShelfVolume,
} from "@/lib/book-shelf";
import type { DreamBookResume } from "@/lib/mirror-store";
import { bookReadingKey, useWorkspaceMemory } from "@/lib/workspace-memory";
import type { VoiceId } from "@/lib/i18n/core";
import type { BookAudit, BookLedger } from "@/lib/book-ledger";
import { AUDIT_DIMENSIONS } from "@/lib/book-ledger";
import { downloadBookPdf } from "@/lib/book-pdf";
import { recordDownload } from "@/lib/downloads-log";
import { cn } from "@/lib/utils";
import { ShareButton } from "./ShareButton";
import { paragraphsFromEditorText, plainTextToManuscriptHtml } from "./dreambook/manuscript-text";
import "./dreambook/manuscript-editor.css";

/* THE INK DESK'S PEN — the manuscript editor rides its own chunk
   (Tiptap is a quiet passenger until a leaf is opened for the hand) */
const MirrorManuscriptEditor = dynamic(
  () => import("@/components/mirror/dreambook/ManuscriptEditor"),
  {
    ssr: false,
    loading: () => (
      <div
        className="manuscript-editor-frame min-h-[320px] w-full animate-pulse rounded-[14px]"
        aria-hidden="true"
      />
    ),
  }
);

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
  part?: string;
  chapter?: string;
  paragraphs: string[];
  /* THE PEN'S OWN FORM — the page's rich manuscript (the ink desk's
     HTML) once a hand has touched it; pages the loom wove alone keep
     only their clean paragraphs. Every consumer outside the desk
     (voice, presses, shelf) reads the paragraphs beside it. */
  html?: string;
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

/* THE ATELIER'S CHIP FACES — the weaving-selection wears small glass
   chips now (the music selector's own law): each option keeps its full
   name for the aria-label and the title, while the chip wears the
   short face, so the whole sheet stays one screen tall. The accent is
   the room's own yellow — var(--scope-a) — so the chips, the depth
   bar and the pages dial all light with one ink. */
const DB_CHIP_FACES: Record<string, string> = {
  "The Eternal Dreamer": "Eternal Dreamer",
  "Little dreamers (4–8)": "Ages 4–8",
  "Young readers (9–12)": "Ages 9–12",
  "Teens (13–17)": "Teens",
  "Grown dreamers": "Grown",
  "Gentle mystery": "Mystery",
  "Cosmic journey": "Cosmic",
  "Creature friends": "Creatures",
  "Fantasy quest": "Fantasy",
  "Dreamlike calm": "Dreamlike",
  "Everyday wonder": "Wonder",
  "Short book": "Short",
  "Bedtime treasure": "Bedtime",
  "Classic tale": "Classic",
  "Grand saga": "Saga",
};
const chipFace = (label: string) => DB_CHIP_FACES[label] ?? label;

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
  const me = useMirror((s) => s.me);
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
  /* THE VEIN — the big choice of the loom: ephemeral (metaphysical,
     mystique) or ground (a normal book). The channel's own breath has
     always been ephemeral, so it is the resting hand. */
  const [vein, setVein] = useState<"ephemeral" | "ground">("ephemeral");
  /* THE PAGES IN THE PLAN — the visitor may name the book's length:
     20 to 300 pages, spoken as a number. Zero means the loom chooses
     from the volume's own plan. */
  const [pageCount, setPageCount] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  const WEAVING_PHASES = useMemo(
    () => [
      t("Tuning the loom to your subject…"),
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
  const narrateRef = useRef<((auto?: boolean) => Promise<void> | void) | null>(null);
  const [pages, setPages] = useState<WeavePage[]>([]);
  const [ended, setEnded] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  /* ADAPTIVE READING — the page's own mirror, so the volume's snapshot
     and the workspace memory can speak of the leaf without re-rendering */
  const pageIdxRef = useRef(0);
  pageIdxRef.current = pageIdx;
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
  /* THE VOICE TOGGLE — when held, every page the visitor turns reads
     itself aloud; when released, the pages keep their silence. One
     switch governing the whole volume, resting beside the reading. */
  const [autoNarrate, setAutoNarrate] = useState(false);

  /* ---- the rewriting hand ---- */
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteDraft, setRewriteDraft] = useState("");
  const [rewrites, setRewrites] = useState<string[]>([]);

  /* ---- the whole book (V10 + the full reveal) ----
     THE LEDGER — the volume's own durable memory (canon, characters,
     objects, chronology, promises, motifs), handed to the loom at
     every continuation and kept here while the volume lives. */
  const ledgerRef = useRef<BookLedger | null>(null);
  /* the ledgers of the kept volumes, remembered per book id so a
     volume brought back from the shelf continues with its bones */
  const ledgerByBookRef = useRef<Map<string, BookLedger>>(new Map());
  /* the whole-book reveal — channeling every remaining page in one
     unbroken breath, with the loom's progress spoken while it works */
  const [wholeReveal, setWholeReveal] = useState<{
    woven: number;
    total: number;
  } | null>(null);
  /* the visitor's own hand on the loom — raised the moment they let
     the whole-book channeling rest; the loop reads it between strides
     and keeps everything already woven */
  const cancelRevealRef = useRef(false);
  /* the whole-book reading — every woven page in one continuous scroll */
  const [wholeMode, setWholeMode] = useState(false);
  /* THE INK DESK — the leaf in hand, opened for the visitor's own pen.
     The desk writes the page's rich manuscript (html) and derives the
     page's plain paragraphs beside it, so every other hand in the house
     — the voice, the presses, the shelf — reads the very same words. */
  const [inkDeskOpen, setInkDeskOpen] = useState(false);
  /* THE FOCUS READING — the column widens and the frame quiets: the
     visitor's own toggle, a layout simplification, never an overlay */
  const [focusRead, setFocusRead] = useState(false);
  /* the loom's private honest audit — carried from the close and kept
     OUT of the book unless the reader asks to see it */
  const [audit, setAudit] = useState<BookAudit | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  /* the binding press — while the PDF is gathered */
  const [binding, setBinding] = useState(false);

  const pagesRef = useRef<WeavePage[]>([]);
  const threadsRef = useRef("");
  const metaRef = useRef<BookMeta | null>(null);
  const endedRef = useRef(false);
  const weavingRef = useRef(false);
  const rewritesRef = useRef<string[]>([]);
  const configRef = useRef({ age, tale, volume, level, topic, vein, pageCount });
  /* the book's own place in its keeper's cosmic library — a fresh
     volume is given it on open; a volume brought back already has one,
     and every woven page keeps that entry alive */
  const bookIdRef = useRef("");
  const narrRef = useRef<{ audio: HTMLAudioElement | null; ready: boolean }>({
    audio: null,
    ready: false,
  });
  /* THE VOICE'S OWN GENERATION — every narrate raises it, every stop
     raises it: a slow fetch for a page already left behind comes home
     to a stale generation and is dropped unplayed, so a turned page
     can never be dragged back by its own late voice (the glitch's
     root — a race between the wire and the reader's finger). */
  const narrSeqRef = useRef(0);
  /* THE LIFECYCLE HAND — when the visitor turns this page away (or the
     tab hides), the narrator's voice is laid down; the work itself is
     never touched, only the device's breath is released. */
  useEffect(() => {
    const un = registerWorkspaceCleanup("dreambook", () => {
      narrRef.current.audio?.pause();
    });
    const onHide = () => {
      if (document.hidden) narrRef.current.audio?.pause();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      un();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
  /* THE CHANNELING DOT'S OWN MEMORY — where the reader stood before
     the dot's jump, so the same small hand carries them back */
  const dotReturnRef = useRef(0);

  /* ---------------- THE INK DESK'S WRITE-THROUGH ----------------
     The pen streams its changes into a pending hand first (a quiet
     320ms stride — the reading room never re-renders per keystroke)
     and every consumer that reads the book (the presses, the voice,
     the shelf, the loom, a page turn) calls flushInkEdit() first, so
     nothing ever reads a stale leaf. The pending edit rides refs
     alone: a flush is pure ref-work plus one setPages. */
  const inkPendingRef = useRef<{ n: number; html: string; text: string } | null>(
    null
  );
  const inkTimerRef = useRef<number | null>(null);
  /* the leaf the pen is currently writing (its page number), and the
     desk's own open mark for the keyboard's page-turn guard */
  const inkNRef = useRef<number | null>(null);
  const inkOpenRef = useRef(false);

  const flushInkEdit = useCallback(() => {
    if (inkTimerRef.current !== null) {
      window.clearTimeout(inkTimerRef.current);
      inkTimerRef.current = null;
    }
    const pend = inkPendingRef.current;
    if (!pend) return;
    inkPendingRef.current = null;
    const paragraphs = paragraphsFromEditorText(pend.text);
    pagesRef.current = pagesRef.current.map((p) =>
      p.n === pend.n
        ? {
            ...p,
            paragraphs,
            /* an emptied leaf lays its richness down too — the pen has
               spoken; only a page the pen never touched keeps none */
            ...(pend.html ? { html: pend.html } : {}),
          }
        : p
    );
    setPages(pagesRef.current);
  }, []);

  const handleInkUpdate = useCallback(
    (html: string, text: string) => {
      const n = inkNRef.current;
      if (!n) return;
      inkPendingRef.current = { n, html, text };
      if (inkTimerRef.current !== null) window.clearTimeout(inkTimerRef.current);
      inkTimerRef.current = window.setTimeout(() => {
        inkTimerRef.current = null;
        flushInkEdit();
      }, 320);
    },
    [flushInkEdit]
  );

  /* the pen's own page — the leaf in hand (pages keep n === their
     position + 1, so the woven leaf under pageIdx is the desk's leaf);
     a page turn or a desk close carries the pending ink home at once */
  const inkPageN =
    pageIdx >= 1 && pageIdx <= pages.length ? pageIdx : null;
  useEffect(() => {
    inkOpenRef.current = inkDeskOpen;
    inkNRef.current = inkDeskOpen ? inkPageN : null;
    if (inkDeskOpen) return;
    flushInkEdit();
  }, [inkDeskOpen, inkPageN, flushInkEdit]);

  /* the desk laid down with the room — no timer outlives it */
  useEffect(
    () => () => {
      if (inkTimerRef.current !== null) window.clearTimeout(inkTimerRef.current);
    },
    []
  );

  useEffect(() => {
    configRef.current = { age, tale, volume, level, topic, vein, pageCount };
  }, [age, tale, volume, level, topic, vein, pageCount]);

  /* -------- a volume brought back from the cosmic library --------
     The DreamBookView mounts fresh when the library hands a volume
     over: the whole book — its pages, its thread, its voice config —
     is restored, and the reading resumes exactly where it was left. */
  const dreamResume = useMirror((s) => s.dreamResume);
  const clearDreamResume = useMirror((s) => s.clearDreamResume);
  const resumeAppliedRef = useRef(false);

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
    narrSeqRef.current += 1;
    const a = narrRef.current.audio;
    if (a) {
      try {
        a.pause();
      } catch {
        /* already stopped */
      }
      /* the carved breath is freed — no blob lingers unheard */
      try {
        URL.revokeObjectURL(a.src);
      } catch {
        /* already freed */
      }
    }
    narrRef.current.audio = null;
    narrRef.current.ready = false;
    /* the traveler's fallback voice is silenced with the same hand —
       a page turn never leaves the browser still reading the old leaf */
    stopBrowserVoice();
    setNarrating(false);
    setNarrPaused(false);
    setNarrLoading(false);
  }, []);

  /* -------- a volume brought back — from library or shelf --------
     The whole book — its pages, its thread, its voice config — is
     restored, and the reading resumes exactly where it was left. */
  const applyResume = useCallback(
    (r: DreamBookResume) => {
      stopNarration();
      setInkDeskOpen(false);
      bookIdRef.current = r.bookId;
      pagesRef.current = r.pages.map((p) => ({
        ...p,
        paragraphs: [...p.paragraphs],
        /* the pen's own form rides the shelf and the library when a
           volume was written by hand — carried back so the desk reopens
           the leaf exactly as it was left */
        ...(typeof (p as { html?: unknown }).html === "string" &&
        (p as { html?: string }).html
          ? { html: (p as { html?: string }).html }
          : {}),
      }));
      threadsRef.current = r.threads;
      metaRef.current = { ...r.meta };
      endedRef.current = r.ended;
      /* the volume's bones return with it — the ledger kept per book */
      ledgerRef.current = ledgerByBookRef.current.get(r.bookId) ?? null;
      configRef.current = {
        age: r.config.age,
        tale: r.config.tale,
        volume: r.config.volume,
        level: r.config.level ?? "",
        topic: r.config.topic,
        vein: "ephemeral",
        pageCount: 0,
      };
      setAge(r.config.age);
      setTale(r.config.tale);
      setVolume(r.config.volume);
      setLevel(r.config.level ?? "");
      setTopic(r.config.topic);
      setPageCount(0);
      setPages(pagesRef.current);
      setMeta(metaRef.current);
      setEnded(r.ended);
      /* ADAPTIVE READING — the volume returns to the leaf it was left
         on: the resume carries the page when it knows one */
      setPageIdx(Math.max(0, Math.min(r.pageIdx ?? 0, Math.max(0, pagesRef.current.length - 1))));
      setSlideDir(1);
      setZoom(1);
      setStage("reading");
    },
    [stopNarration]
  );

  useEffect(() => {
    if (resumeAppliedRef.current || !dreamResume) return;
    resumeAppliedRef.current = true;
    applyResume(dreamResume);
    clearDreamResume();
  }, [dreamResume, applyResume, clearDreamResume]);

  /* THE BRANCH'S OWN VOLUME — a creation chip's whisper rides here
     from the living tree: the atelier opens with the branch's own
     words already spoken into the loom's one input, and one thread
     held (the tale's shape, drawn from the branch's own words), so a
     single touch of the channel begins a book born of that branch —
     made in this moment, never the same volume twice. The loom never
     starts by itself: the weaving waits for the visitor's own hand. */
  const branchSeed = useMirror((s) => s.branchCreationSeed);
  const setBranchCreationSeed = useMirror((s) => s.setBranchCreationSeed);
  const seedTakenRef = useRef(false);
  useEffect(() => {
    if (seedTakenRef.current || !branchSeed || branchSeed.kind !== "book")
      return;
    seedTakenRef.current = true;
    const topic = branchSeed.topic;
    setBranchCreationSeed(null);
    let h = 2166136261;
    for (let i = 0; i < topic.length; i++) {
      h ^= topic.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h = h >>> 0;
    const tale = TALES[h % TALES.length];
    setTopicDraft(topic);
    setTopic(topic);
    if (tale) setTale(tale.id);
  }, [branchSeed, setBranchCreationSeed]);

  /* ---------------- the shelf of kept volumes ----------------
     A volume that took an evening to weave never vanishes when the
     visitor turns away: it rests on the shelf — kept on this device,
     and in the keeper's library history. The history button brings
     the past volumes back, ready to be read or continued. */
  const [shelfOpen, setShelfOpen] = useState(false);
  const [localShelf, setLocalShelf] = useState<ShelfVolume[]>([]);
  const [libraryVolumes, setLibraryVolumes] = useState<ShelfVolume[] | null>(
    null
  );
  const [shelfLoading, setShelfLoading] = useState(false);

  const snapshotCurrent = useCallback((): ShelfVolume | null => {
    /* the pen's pending ink lands before the volume is measured */
    flushInkEdit();
    const m = metaRef.current;
    if (!m || pagesRef.current.length === 0) return null;
    return {
      bookId: bookIdRef.current,
      title: m.title,
      subtitle: m.subtitle,
      sigil: m.sigil,
      axiom: m.axiom,
      dedication: m.dedication,
      totalPages: m.totalPages,
      ended: endedRef.current,
      savedAt: new Date().toISOString(),
      config: { ...configRef.current },
      threads: threadsRef.current,
      pageIdx: pageIdxRef.current,
      pages: pagesRef.current.map((p) => ({
        n: p.n,
        ...(p.part ? { part: p.part } : {}),
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: [...p.paragraphs],
        /* the shelf keeps the pen's form too, so a volume reopened
           from its shelf reopens exactly as it was written */
        ...(p.html ? { html: p.html } : {}),
      })),
    };
  }, [flushInkEdit]);

  /* the volume in hand never vanishes — it keeps itself before any
     turn away (a new dream, a walk back to the atelier, an exit) */
  const keepCurrent = useCallback(() => {
    const snap = snapshotCurrent();
    if (!snap) return;
    keepVolume(snap);
  }, [snapshotCurrent]);

  /* ADAPTIVE READING — the workspace remembers where the reading
     rested: one quiet write per settled page, so "continue where you
     left off" and the universal search can reopen the exact leaf */
  useEffect(() => {
    if (stage !== "reading") return;
    const bookId = bookIdRef.current;
    if (!bookId) return;
    const tm = window.setTimeout(() => {
      const m = metaRef.current;
      const title = m?.title ?? "";
      if (!title) return;
      useWorkspaceMemory.getState().setReading(bookReadingKey(bookId), {
        title,
        view: "dreambook",
        pageIdx: pageIdxRef.current,
        bookId,
      });
    }, 900);
    return () => window.clearTimeout(tm);
  }, [stage, pageIdx]);

  const openShelf = useCallback(() => {
    stopNarration();
    keepCurrent();
    setLocalShelf(loadShelf());
    setLibraryVolumes(null);
    setShelfLoading(true);
    setShelfOpen(true);
    void (async () => {
      try {
        const res = await fetch("/api/library", {
          signal: AbortSignal.timeout(20000),
        });
        const data = await res.json().catch(() => null);
        const entries: Array<{
          id: string;
          sector: string;
          title: string;
          excerpt: string;
          content: Record<string, unknown>;
          createdAt: string;
        }> = Array.isArray(data?.entries) ? data.entries : [];
        const vols: ShelfVolume[] = entries
          .filter(
            (e) =>
              (e.sector === "dreambook" || e.sector === "dreambook_archive") &&
              Array.isArray(e.content?.pages) &&
              (e.content?.pages as unknown[]).length > 0
          )
          .map((e) => {
            const c = e.content as Record<string, unknown>;
            const cfg = (c.config ?? {}) as Record<string, unknown>;
            /* the volume's bones ride in its own entry — kept per book
               id so a resumed volume continues with its ledger */
            if (c.ledger && typeof c.ledger === "object") {
              ledgerByBookRef.current.set(e.id, c.ledger as BookLedger);
            }
            return {
              bookId: e.id,
              title: String(c.title ?? e.title ?? "A Dream Book"),
              subtitle: String(c.subtitle ?? ""),
              sigil: String(c.sigil ?? ""),
              axiom: String(c.axiom ?? e.excerpt ?? ""),
              dedication: String(c.dedication ?? ""),
              totalPages: Number(c.totalPages ?? 0),
              ended: Boolean(c.ended),
              savedAt: e.createdAt,
              config: {
                age: String(cfg.age ?? "timeless"),
                tale: String(cfg.tale ?? "wonder"),
                volume: String(cfg.volume ?? "classic"),
                level: String(cfg.level ?? ""),
                topic: String(cfg.topic ?? c.topic ?? ""),
              },
              threads: String(c.threads ?? ""),
              pages: c.pages as ShelfVolume["pages"],
            };
          });
        setLibraryVolumes(vols);
      } catch {
        setLibraryVolumes([]);
      } finally {
        setShelfLoading(false);
      }
    })();
  }, [keepCurrent, stopNarration]);

  const resumeVolume = useCallback(
    (v: ShelfVolume) => {
      applyResume({
        bookId: v.bookId,
        config: v.config,
        meta: {
          title: v.title,
          subtitle: v.subtitle,
          sigil: v.sigil,
          axiom: v.axiom,
          dedication: v.dedication ?? "",
          totalPages: v.totalPages || Math.max(8, v.pages.length + 8),
        },
        pages: v.pages,
        threads: v.threads,
        ended: v.ended,
        pageIdx: v.pageIdx,
      });
      setShelfOpen(false);
    },
    [applyResume]
  );

  const forgetLocal = useCallback((bookId: string) => {
    forgetVolume(bookId);
    setLocalShelf(loadShelf());
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

  /* the toggle's own law — a page turned with the voice held reads
     itself; the toggle released silences the room at once. The short
     breath lets the stop settle before the fresh voice is drawn. */
  useEffect(() => {
    if (!autoNarrate || stage !== "reading") return;
    const t = window.setTimeout(() => void narrateRef.current?.(true), 180);
    return () => window.clearTimeout(t);
  }, [pageIdx, autoNarrate, stage]);

  /* ---------------- the weaver's fetch ----------------
     A generous timeout and one quiet retry: if a thread slips
     (network, a sleeping gateway) the loom simply tries again
     before ever troubling the visitor. */

  /* the weaving phase — the loom keeps count. THE FLAVOR: a "batch"
     breath channels the next six pages in the background while the
     visitor reads; the "reveal" flavor is the whole-book channeling. */
  const weave = useCallback(
    async (
      phase: "open" | "next" | "close" | "extend",
      pageNumber: number,
      span = 2,
      timeoutMs = 150000,
      flavor: "batch" | "reveal" = "batch"
    ): Promise<boolean> => {
      /* the pen's pending ink lands before the loom reads the volume */
      flushInkEdit();
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
                ...(p.part ? { part: p.part } : {}),
                ...(p.chapter ? { chapter: p.chapter } : {}),
                paragraphs: p.paragraphs,
              })),
              bookMeta: metaRef.current ? { ...metaRef.current } : undefined,
              bookConfig: { ...configRef.current },
            }
          : {};
        /* THE STRIDE'S OWN SEED — every breath carries the exact second
           of its conjuring, so no stride can ever repeat another: not
           this volume's earlier pages, not any other book's bones */
        const strideSeed = `${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const payload = JSON.stringify({
          phase,
          language,
          config: {
            ...configRef.current,
            /* the visitor's own chosen length (20–300), named as pages —
               the loom lands the whole story inside it */
            pages: configRef.current.pageCount > 0 ? configRef.current.pageCount : undefined,
            /* the exact second of this conjuring — a seed that has never
               been woven and will never be woven again */
            seed: strideSeed,
          },
          /* the birth echo of the LAST volume this session conjured —
             carried by the visitor alone, so the new draw refuses it
             bone by bone and no two books share a single axis */
          ...(phase === "open"
            ? { priorResonance: useMirror.getState().lastBookResonance ?? undefined }
            : {}),
          ...carrying,
          threads: threadsRef.current || undefined,
          /* THE LEDGER (V10) — the volume's own bones ride back */
          ...(phase !== "open" && ledgerRef.current
            ? { ledger: ledgerRef.current }
            : {}),
          /* THE SPAN — the seven-page breath, or the whole-book
             reveal's own wider stride */
          ...(span > 2 ? { span } : {}),
          /* THE FLAVOR — the whole-book reveal asks for swift leaves;
             the background batch reads at full depth */
          ...(flavor === "reveal" ? { reveal: true } : {}),
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
            signal: AbortSignal.timeout(timeoutMs),
          });
        let res: Response;
        try {
          res = await attempt();
          /* a sleeping gateway answers 5xx — one quiet retry before
             the visitor ever feels it */
          if (res.status >= 500) {
            res = await attempt();
          }
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

        /* THE LEDGER — the loom's updated memory of the volume */
        if (data.ledger && typeof data.ledger === "object") {
          ledgerRef.current = data.ledger as BookLedger;
          if (bookIdRef.current) {
            ledgerByBookRef.current.set(bookIdRef.current, ledgerRef.current);
          }
        }
        /* THE HONEST AUDIT — carried privately from the close */
        if (phase === "close" && data.audit && typeof data.audit === "object") {
          setAudit(data.audit as BookAudit);
        }

        const fresh: WeavePage[] = data.pages;
        /* THE LOOM NEVER WRITES A PAGE TWICE — a page whose number the
           volume already holds is dropped, so a retried stride (or a
           weave answered twice) can never double a leaf nor clash the
           reader's keys */
        const held = new Set(pagesRef.current.map((p) => p.n));
        const novel = fresh.filter((p) => !held.has(p.n));
        if (novel.length > 0) {
          pagesRef.current = [...pagesRef.current, ...novel];
          setPages(pagesRef.current);
        }
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
          /* the new volume's birth echo enters the session's keeping —
             the next conjuring will refuse every one of its bones */
          if (data.resonance && typeof data.resonance === "object") {
            useMirror.getState().setLastBookResonance(
              data.resonance as Record<string, string>
            );
          }
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
    [language, t, flushInkEdit]
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
    /* THE SIX-PAGE FIRST BREATH — the loom opens the volume with
       six pages at once, so the visitor can truly begin reading
       while the rest of the book channels in the background */
    const ok = await weave("open", 1, 6, 240000);
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
      /* the one gate — the words themselves. When no thread is held,
         the loom chooses its own (the telling's middle depth stands
         in): nothing more is ever forced, nothing blocks the ask. */
      if (!text || weavingRef.current) return;
      setTopicDraft("");
      setTopic(text);
      if (!(age || tale || volume || level)) setLevel("d3");
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

  /* THE SIX-PAGE BREATH — the loom weaves SIX pages at a time, in
     the background: when the visitor is three pages from the woven
     edge, the next six begin channeling while they keep reading — the
     reader never waits on the loom again. */
  useEffect(() => {
    if (stage !== "reading" || endedRef.current || !metaRef.current) return;
    const have = pagesRef.current.length;
    if (have >= metaRef.current.totalPages) return; /* the choice will ask */
    if (have - pageIdx > 3) return;
    void weave("next", have + 1, 6, 240000);
  }, [pageIdx, pages.length, stage, weave]);

  /* THE READER'S OWN CRANK — one hand-weave of the next six pages,
     the button the visitor presses while they read: the loom answers
     at once, no waiting for the edge to come near. */
  const weaveNextSix = useCallback(async () => {
    const atFrontier = pageIdx >= pagesRef.current.length;
    const ok = await weave("next", pagesRef.current.length + 1, 6, 240000);
    if (ok && atFrontier) setPageIdx((s) => s + 1);
  }, [weave, pageIdx]);

  const goPage = useCallback(
    (dir: 1 | -1) => {
      /* the pen's pending ink lands before the leaf is turned */
      flushInkEdit();
      stopNarration();
      setSlideDir(dir);
      setPageIdx((s) => {
        const next = s + dir;
        if (next < 0) return s;
        if (dir === 1 && next > limitIdx) return s;
        return next;
      });
    },
    [limitIdx, stopNarration, flushInkEdit]
  );

  /* keyboard page turns (the whole-book reading scrolls freely) —
     and while the ink desk holds the pen, the arrows belong to the
     caret, not to the pages */
  useEffect(() => {
    if (stage !== "reading" || wholeMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (inkOpenRef.current) return;
      if (e.key === "ArrowRight") goPage(1);
      if (e.key === "ArrowLeft") goPage(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, wholeMode, goPage]);

  const newDream = useCallback(() => {
    stopNarration();
    setInkDeskOpen(false);
    keepCurrent(); /* the volume in hand rests on the shelf first */
    clearDreamResume(); /* a stale hand-off can never seed this volume */
    pagesRef.current = [];
    threadsRef.current = "";
    metaRef.current = null;
    endedRef.current = false;
    rewritesRef.current = [];
    bookIdRef.current = "";
    ledgerRef.current = null;
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
    setAudit(null);
    setAuditOpen(false);
    setWholeMode(false);
    setWholeReveal(null);
    setStage("atelier");
  }, [stopNarration, keepCurrent, clearDreamResume]);

  const weaveOnward = useCallback(async () => {
    const ok = await weave("extend", pagesRef.current.length + 1);
    if (ok) setPageIdx((s) => s + 1);
  }, [weave]);

  const letRest = useCallback(async () => {
    const ok = await weave("close", pagesRef.current.length + 1);
    if (ok) setPageIdx((s) => s + 1);
  }, [weave]);

  /* ---------------- THE WHOLE BOOK — one unbroken channeling --------
     The visitor no longer turns the loom's crank two pages at a time:
     one touch and the loom weaves every remaining page of the volume,
     a stride of four at a time, the thread and the ledger riding
     beneath every stride — and the progress spoken while it works.
     THE LOOM'S RESILIENCE — a slipped stride never ends the telling:
     every stride is tried again (three silent strides in a row are the
     only surrender), a stalled stride cannot trap the loop, and the
     visitor's own X rests the loom at once, keeping every page woven.
     When the last page lands, the whole book stands open at once. */
  const revealWholeBook = useCallback(async () => {
    if (wholeReveal || !metaRef.current) return;
    /* the pen's pending ink lands before the long channeling begins,
       and the whole-book reading is no desk — the pen rests */
    flushInkEdit();
    setInkDeskOpen(false);
    stopNarration();
    setWholeMode(false);
    cancelRevealRef.current = false;
    const total = metaRef.current.totalPages;
    setWholeReveal({ woven: pagesRef.current.length, total });
    let started = false;
    let silentStrides = 0;
    try {
      /* THE QUEUED HAND — the reader's own prefetch may already hold
         the loom (it weaves the next pages the moment the book opens).
         The whole reveal never fights it and never dies silently: it
         waits for the current breath to land, then takes the loom and
         channels everything that remains. The wait now covers a FULL
         stride's own lifetime (the 300s ceiling), so a long, slow,
         alive breath can never be abandoned mid-air. */
      for (let wait = 0; wait < 1600 && weavingRef.current; wait++) {
        if (cancelRevealRef.current) return;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (weavingRef.current || cancelRevealRef.current) return;
      started = true;
      /* the loom's own patience — before every stride, the reveal lets
         any breath already in the loom land (the reader's prefetch),
         so a stride is never swallowed by a held door. The same full
         stride lifetime is honored here. */
      const waitForLoom = async () => {
        for (let wait = 0; wait < 1600 && weavingRef.current; wait++) {
          if (cancelRevealRef.current) return false;
          await new Promise((r) => setTimeout(r, 200));
        }
        return !weavingRef.current && !cancelRevealRef.current;
      };
      /* a generous guard: two hundred strides are more than any
         volume can ask for — the loop always ends by the book's own
         plan, the loom's honest silence, or the visitor's hand */
      for (let stride = 0; stride < 200; stride++) {
        if (cancelRevealRef.current) break;
        if (!(await waitForLoom())) break;
        const have = pagesRef.current.length;
        const plan = metaRef.current?.totalPages ?? total;
        if (endedRef.current || have >= plan + 1) break;
        if (!cancelRevealRef.current) {
          setWholeReveal({ woven: have, total: plan });
        }
        if (have >= plan) {
          /* the planned end reached — the Seal of Closing is woven.
             A long breath is given to the seal too: the audit and the
             ending ride the same slow ink as any stride. */
          const ok = await weave("close", have + 1, 2, 240000, "reveal");
          if (cancelRevealRef.current) break;
          if (!ok) {
            if (weavingRef.current) continue; /* contention, not silence */
            silentStrides += 1;
            if (silentStrides >= 3) break;
            continue;
          }
          silentStrides = 0;
          continue;
        }
        const before = pagesRef.current.length;
        const ok = await weave("next", have + 1, 8, 300000, "reveal");
        if (cancelRevealRef.current) break;
        if (!ok) {
          /* a weave refused because another breath held the loom is
             not a silent stride — the patience above simply lets it
             land, and the telling goes on */
          if (weavingRef.current) continue;
          silentStrides += 1;
          /* three silent strides in a row — only then does the loom
             rest; every single slip is woven again on its own breath */
          if (silentStrides >= 3) break;
          continue;
        }
        silentStrides = 0;
        /* the stall guard — a stride that returns no NEW pages (its
           numbers were already held — a raced twin) is a stumble, not
           the end: it counts as one silent stride and the telling
           goes on. Only three silent strides in a row rest the loom;
           the book is never abandoned for a single raced breath. */
        if (pagesRef.current.length === before) {
          silentStrides += 1;
          if (silentStrides >= 3) break;
          continue;
        }
      }
    } finally {
      cancelRevealRef.current = false;
      setWholeReveal(null);
      /* the whole book opens only when the reveal truly ran — a click
         that was released before taking the loom leaves the reader
         exactly as it was */
      if (started) {
        setWholeMode(true);
        if (navigator.vibrate) navigator.vibrate(18);
      }
    }
  }, [weave, wholeReveal, stopNarration, flushInkEdit]);

  /* the visitor lets the loom rest — the channeling stops between
     strides and the book opens whole with everything already woven */
  const restTheLoom = useCallback(() => {
    cancelRevealRef.current = true;
    setWholeReveal(null);
    setWholeMode(true);
    /* the whole-book reading is no desk — the pen rests with the loom */
    setInkDeskOpen(false);
    if (navigator.vibrate) navigator.vibrate(12);
  }, []);

  /* THE BINDING PRESS — the whole book, pages and front matter, bound
     into one ink PDF and handed to the visitor's own hands */
  const downloadWhole = useCallback(async () => {
    if (binding || !meta || pagesRef.current.length === 0) return;
    setBinding(true);
    try {
      /* the pen's pending ink lands before the volume is bound */
      flushInkEdit();
      const bound = dedupeChapters(pagesRef.current).map((p) => ({
        n: p.n,
        ...(p.part ? { part: p.part } : {}),
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: p.paragraphs,
      }));
      await downloadBookPdf(
        {
          title: meta.title,
          subtitle: meta.subtitle,
          sigil: meta.sigil,
          axiom: meta.axiom,
          dedication: meta.dedication,
          totalPages: meta.totalPages,
        },
        bound
      );
      /* the shelf of bound works — the volume keeps itself on the
         visitor's own device so the profile's downloads can hand it
         back, bound again, whenever it is wanted */
      recordDownload({
        title: meta.title,
        subtitle: meta.subtitle,
        pages: bound.length,
        meta: {
          title: meta.title,
          subtitle: meta.subtitle,
          sigil: meta.sigil,
          axiom: meta.axiom,
          dedication: meta.dedication,
          totalPages: meta.totalPages,
        },
        pageList: bound,
      });
      toast.success(t("The book is bound — the PDF is yours"));
    } catch {
      toast.error(t("The binding press needs a breath — try again"));
    } finally {
      setBinding(false);
    }
  }, [binding, meta, t, flushInkEdit]);

  /* THE QUIET COUNT — the book's own weight in words, said honestly */
  const bookWords = useMemo(() => {
    if (pages.length === 0) return 0;
    return dedupeChapters(pages).reduce(
      (acc, p) => acc + pageText(p).split(/\s+/).filter(Boolean).length,
      0
    );
  }, [pages]);

  /* THE LOOSE-LEAF PRESS — the whole book as clean Markdown: title,
     front matter, every page its own section — the visitor's file,
     theirs to keep and open anywhere */
  const exportMarkdown = useCallback(() => {
    if (!meta) return;
    try {
      /* the pen's pending ink lands before the loose leaves are cut */
      flushInkEdit();
      const pages = pagesRef.current;
      if (pages.length === 0) return;
      const bound = dedupeChapters(pages);
      const lines: string[] = [];
      lines.push(`# ${meta.title}`);
      if (meta.subtitle) lines.push(`*${meta.subtitle}*`);
      const front = [meta.sigil, meta.axiom, meta.dedication]
        .filter((s): s is string => !!s && !!s.trim());
      for (const f of front) lines.push("> " + f.replace(/\n/g, "\n> "));
      for (const p of bound) {
        lines.push("");
        lines.push("---");
        lines.push("");
        if (p.part) lines.push(`## ${p.part}`);
        if (p.chapter) lines.push(`### ${p.chapter}`);
        lines.push(p.paragraphs.join("\n\n"));
      }
      const slug =
        meta.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "book";
      const blob = new Blob([lines.join("\n")], {
        type: "text/markdown;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 400);
      toast.success(t("The book is yours — the Markdown file is yours"));
    } catch {
      toast.error(t("The loose-leaf press needs a breath — try again"));
    }
  }, [meta, t, flushInkEdit]);

  /* THE MIRROR BRIDGE — the work at hand: the book's own opening, so
     the advice lands on THIS volume (only what is needed travels) */
  const buildBridgeContext = useCallback(() => {
    if (!meta) return null;
    /* the pen's pending ink lands before the Mirror reads the volume */
    flushInkEdit();
    const pages = pagesRef.current;
    if (pages.length === 0) return null;
    const text = bookToText(
      meta,
      pages.map((p) => ({
        n: p.n,
        ...(p.part ? { part: p.part } : {}),
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: p.paragraphs,
      }))
    );
    return text.slice(0, 600);
  }, [meta, flushInkEdit]);

  /* ---------------- the narrator ---------------- */

  const narrate = useCallback(async (auto = false) => {
    /* a voice holding its breath — let it go on from the same word
       (only a human press resumes; the auto voice turns the page) */
    const held = narrRef.current.audio;
    if (held && narrPaused && held.paused) {
      if (!auto) {
        await resumeNarration();
        return;
      }
      stopNarration();
    }
    /* a voice already prepared and waiting for a fresh touch? */
    const prepared = narrRef.current.audio;
    if (!auto && prepared && narrRef.current.ready && prepared.paused) {
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
      /* the auto voice on a page turn: the old page's voice is let go
         and the new page's voice begins — never merely silenced */
      if (!auto) return;
    }
    stopNarration();
    setNarrLoading(true);
    /* this voice's own generation — the stamp every awaited reply
       carries home to be checked against */
    const seq = ++narrSeqRef.current;
    const opening = pageIdx === 0 && meta
      ? `${meta.title}. ${meta.subtitle} ${meta.sigil} ${meta.axiom} ${meta.dedication}`
      : "";
    /* the pen's pending ink lands before the voice reads the leaf —
       the spoken words are the freshest the page holds */
    flushInkEdit();
    const spokenPage = pagesRef.current.find((p) => p.n === pageIdxRef.current);
    const body = spokenPage ? pageText(spokenPage) : "";
    const text = (opening || body).trim();
    try {
      if (!text) return;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: BOOK_VOICE, pace: 0.85 }),
      });
      if (!res.ok) throw new Error("quiet");
      const blob = await res.blob();
      /* the reader moved on while the wire carried this voice — the
         stale breath is freed unplayed and the fresh page keeps its
         own voice (the glitch is dead here) */
      if (seq !== narrSeqRef.current) {
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      const freeVoice = () => {
        if (narrRef.current.audio === audio) narrRef.current.audio = null;
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* already freed */
        }
      };
      narrRef.current.audio = audio;
      audio.onended = () => {
        freeVoice();
        setNarrating(false);
        setNarrPaused(false);
      };
      audio.onerror = () => {
        freeVoice();
        setNarrating(false);
        setNarrPaused(false);
      };
      await audio.play();
      if (seq !== narrSeqRef.current) {
        /* a stop or a page turn landed in the play's own breath */
        try {
          audio.pause();
        } catch {
          /* already quiet */
        }
        freeVoice();
        setNarrating(false);
        setNarrPaused(false);
        return;
      }
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
  }, [narrating, narrLoading, narrPaused, pageIdx, meta, stopNarration, resumeNarration, t, flushInkEdit]);

  /* the auto-voice effect reads the freshest narrate without re-firing */
  narrateRef.current = narrate;

  /* ---------------- shared ---------------- */

  /* THE QUIET X — one clear close in every room of the book: it rests
     the voice, keeps the volume on the shelf, and returns the visitor
     to the tree in a single touch (THE ONE BACK in the workplace's
     own header wears the same law for the atelier) */
  const exitTheBook = () => {
    /* the pen's pending ink lands before the volume is kept */
    flushInkEdit();
    stopNarration();
    keepCurrent();
    exitDreamBook();
  };

  const backFromWeaving = () => {
    setWeaveError(false);
    setStage("atelier");
  };

  const backFromReader = () => {
    stopNarration();
    keepCurrent(); /* the volume rests on the shelf before the turn */
    setStage("atelier");
  };

  const readPageOf = meta ? Math.min(pageIdx, meta.totalPages) : 0;
  const progress = meta ? Math.min(1, readPageOf / meta.totalPages) : 0;

  /* the chosen depth of the telling — how deep the book reads */
  const levelMeta = useMemo(
    () => BOOK_DEPTHS.find((l) => l.id === level) ?? null,
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
    <div
      className="relative flex h-full flex-col overflow-hidden bg-background text-foreground"
    >
      {/* THE SHELF'S QUIET MARKS — the house's light language resting in
          the empty shoulders of the book selection: bronze ink on the
          daylight paper, silver glow in the crystal night. They never
          take a touch, never cover a word and never move (the stillness
          law); the top-right mark lives above the cards, the wide mark
          only visits the desktop's empty left margin. */}
      {/* the scope's own quiet wash — a still yellow breath in the
          shoulders of the atelier (the stillness law: it never moves) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(46% 34% at 100% 0%, color-mix(in srgb, var(--scope-a) 10%, transparent), transparent 70%), radial-gradient(40% 30% at 0% 100%, color-mix(in srgb, var(--scope-a) 7%, transparent), transparent 72%)",
          }}
        />
      </div>
      <Image
        src="/sigils/sigil_08.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        width={300}
        height={300}
        className="lp-sigil-img pointer-events-none absolute -top-8 -right-9 z-0 size-[clamp(130px,30vw,250px)] select-none opacity-[0.13] [transform:rotate(10deg)]"
      />
      <Image
        src="/sigils/intricate_07.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        width={340}
        height={340}
        className="lp-sigil-img pointer-events-none absolute left-[-34px] top-[36%] z-0 hidden size-[clamp(150px,16vw,230px)] select-none opacity-[0.1] [transform:rotate(-8deg)] lg:block"
      />
      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        {/* THE TOP BAR HAS RESTED — the category line, the per-room back
            and the X are gone from the house (THE ONE BACK stands in
            the workplace's own header, the same for every tool). Only
            the shelf keeps its place, at the row's right. */}
        <span className="min-w-2 flex-1" aria-hidden="true" />
        {/* THE KEPT VOLUMES — the books' own history: every volume woven
            rests here, on this device and in the keeper's library. */}
        <button
          type="button"
          onClick={openShelf}
          aria-label={t("The kept volumes")}
          title={t("The kept volumes")}
          data-testid="dream-shelf"
          className={inkIconBtn}
        >
          <History className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[620px] flex-col px-4 pb-4 pt-2 sm:px-6">
          {/* the compact face of the atelier — one line, one panel, the
              book plainly indicated: everything the visitor needs held
              in a single quiet sheet, nothing to scroll past */}
          <div className="mt-1 flex items-center gap-2.5">
            <span
              className="font-[family-name(var(--font-literata))] text-lg text-foreground/30"
              aria-hidden="true"
            >
              ❧
            </span>
            <h1 className="ink-title text-[22px] leading-tight sm:text-[25px]">
              {t("Dream Book")}
            </h1>
            {/* the title's own gold hairline — the house's gold drawn
                out thin, fading into the paper's quiet */}
            <span
              className="h-px flex-1 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--scope-a)_55%,transparent),color-mix(in_srgb,var(--scope-a)_18%,transparent)_72%,transparent)]"
              aria-hidden="true"
            />
          </div>

          {/* THE TWO VEINS — the loom's big categorisation, two small
              glass chips now: a normal, grounded book, or The Eternal
              Dreamer — the one that breathes the metaphysical and the
              mystique. The full character of each vein rides the hint
              (title + aria); the chip stays one line tall. */}
          <div
            className="mt-3 flex flex-wrap items-center gap-1.5"
            role="radiogroup"
            aria-label={t("The vein of the book")}
            data-testid="dream-vein"
          >
            {(
              [
                {
                  id: "ephemeral" as const,
                  glyph: "☾",
                  label: t("The Eternal Dreamer"),
                  hint: t("Metaphysical · mystique — omens, symbols and the invisible breathing through the tale"),
                },
                {
                  id: "ground" as const,
                  glyph: "❧",
                  label: t("Ground"),
                  hint: t("A normal book — grounded people, real places, cause and consequence you can touch"),
                },
              ]
            ).map((v) => {
              const active = vein === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setVein(v.id)}
                  data-testid={`dream-vein-${v.id}`}
                  title={v.hint}
                  aria-label={`${v.label} — ${v.hint}`}
                  className={cn(
                    "btn-chip h-8 text-[12.5px]",
                    active && "btn-chip-active"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="font-[family-name(var(--font-literata))] text-[13px] leading-none"
                  >
                    {v.glyph}
                  </span>
                  {chipFace(v.label)}
                </button>
              );
            })}
          </div>

          {/* the shapes — reader / tale / book, one tight sheet of
              small glass chips, the held one lit in the room's own ink */}
          <div className="mt-3 rounded-2xl border border-border bg-card/40 p-3">
            <div className="space-y-3">
              <ShapeRow
                label={t("The reader")}
                options={READERS}
                active={age}
                onPick={(id) => choose("reader", id)}
                testIdPrefix="dream-reader"
              />
              <ShapeRow
                label={t("The tale")}
                options={TALES}
                active={tale}
                onPick={(id) => choose("tale", id)}
                testIdPrefix="tale-option"
              />
              <ShapeRow
                label={t("The book")}
                options={VOLUMES}
                active={volume}
                onPick={(id) => choose("volume", id)}
                testIdPrefix="dream-volume"
              />
            </div>

            {/* the depth bar — five compact steps on one line; the
                active step speaks its own one-line whisper beneath */}
            <div className="mt-3.5 border-t border-border/60 pt-3" data-testid="dream-depth-bar">
              <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("The depth of the telling")}
              </p>
              <div className="flex items-end gap-1.5">
                {BOOK_DEPTHS.map((lv, i) => {
                  const active = level === lv.id;
                  const fills = [0.07, 0.12, 0.18, 0.26, 0.36];
                  const heights = [18, 22, 26, 30, 34];
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => choose("level", lv.id)}
                      aria-pressed={active}
                      aria-label={`${t(lv.label)} — depth ${lv.numeral}`}
                      data-testid={`dream-depth-${lv.id}`}
                      title={t(lv.label)}
                      className="focus-glow flex min-w-0 flex-1 items-end justify-center"
                    >
                      <span
                        className={cn(
                          "relative flex w-full items-end justify-center overflow-hidden rounded-md border transition-all duration-300",
                          active && "glow-sm"
                        )}
                        style={{
                          height: `${heights[i]}px`,
                          borderColor: active
                            ? "color-mix(in srgb, var(--scope-a) 70%, transparent)"
                            : "var(--border)",
                          background: active
                            ? "var(--scope-a)"
                            : `color-mix(in srgb, var(--foreground) ${fills[i]}%, transparent)`,
                          boxShadow: active
                            ? "0 0 14px -6px color-mix(in srgb, var(--scope-a) 55%, transparent)"
                            : undefined,
                        }}
                      >
                        {/* the numeral keeps a breath above the marker —
                            the two never touch */}
                        <span
                          className="pb-[3px] font-[family-name(var(--font-literata))] text-[11px] font-semibold leading-none tracking-[0.08em]"
                          style={{
                            color: active
                              ? "#221a04"
                              : "var(--muted-foreground)",
                          }}
                        >
                          {lv.numeral}
                        </span>
                        {active && (
                          <motion.span
                            layoutId="dream-depth-marker"
                            className="absolute inset-x-0 bottom-0 h-[2.5px] bg-[var(--scope-a)]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* the held step's own name — one full-width line beneath
                  the steps, so no name is ever squeezed or cut; the row
                  keeps its height whether a step is held or not */}
              <div className="mt-1.5 flex h-5 items-center justify-center" aria-live="polite">
                {levelMeta && (
                  <span
                    className="font-[family-name(var(--font-literata))] text-[11.5px] italic tracking-wide text-foreground/85"
                    data-testid="dream-depth-name"
                  >
                    {levelMeta.numeral} · {t(levelMeta.label)}
                  </span>
                )}
              </div>
            </div>

            {/* THE PAGES IN THE PLAN — the visitor may name the book's
                length: 20 to 300 pages, honored exactly by the loom */}
            <div className="mt-3.5 border-t border-border/60 pt-3" data-testid="dream-pages">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("The pages")}
                </p>
                <p
                  className="font-[family-name(var(--font-literata))] text-[12.5px] italic text-foreground/85"
                  data-testid="dream-pages-value"
                >
                  {pageCount > 0
                    ? t("{n} pages", { n: pageCount })
                    : t("the loom chooses")}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={20}
                  value={pageCount > 0 ? pageCount : 20}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  aria-label={t("The pages")}
                  data-testid="dream-pages-range"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-[var(--scope-a)]"
                />
                {pageCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPageCount(0)}
                    aria-label={t("Let the loom choose the length")}
                    title={t("Let the loom choose the length")}
                    className="focus-glow shrink-0 rounded-full border border-border px-2 py-1 text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="h-2" />
        </div>
      </div>

      {/* THE ONE COMPOSER — standing IN FLOW at the foot of the room,
          the same structure and position the Invent and Manifest rooms
          carry: one quiet rounded bar with the words inside it and the
          book's own signature channel hand (the waves) at its right.
          No saying beneath, no gate saying above — the loom chooses its
          own threads when none are held, and the whole sheet stays one
          screen tall. */}
      <div className="shrink-0 px-3 pb-3 pt-1 sm:px-4">
        <form
          onSubmit={channelBook}
          className="relative w-full rounded-2xl border px-2.5 py-1.5"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 32%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 10%, transparent)",
          }}
          data-testid="dream-composer"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="dream-topic" className="sr-only">
              {t("Speak anything — a subject, a wish, a whole world…")}
            </label>
            <textarea
              id="dream-topic"
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder={t("Speak anything — a subject, a wish, a whole world…")}
              maxLength={600}
              data-testid="dream-topic-input"
              className="nice-scroll max-h-24 min-h-[26px] min-w-0 flex-1 resize-none bg-transparent py-1 font-[family-name(var(--font-literata))] text-[15px] italic leading-relaxed text-foreground outline-none placeholder:font-[family-name(var(--font-sans))] placeholder:not-italic placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={!topicDraft.trim()}
              aria-label={t("Channel the book")}
              title={t("Channel the book")}
              data-testid="dream-channel-send"
              className="akashic-btn focus-glow flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Waves className="size-4" aria-hidden="true" />
            </button>
          </div>
        </form>
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
            <p className="ink-hand ink-soft mt-8 max-w-[420px] text-center text-[16px] italic">
              {t("The loom fell silent for a moment.")}
            </p>
            <p className="ink-hand ink-faint mt-2 text-center text-[14px] italic">
              {t("Rest, then weave again.")}
            </p>
            <div className="mt-7 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={openBook}
                className="akashic-btn focus-glow flex h-10 items-center justify-center gap-2 rounded-full px-7 text-[14.5px] font-medium"
              >
                <Feather className="size-3.5" aria-hidden="true" />
                {t("Weave again")}
              </button>
              <button
                type="button"
                onClick={backFromWeaving}
                className="papyrus-btn focus-glow flex h-10 items-center justify-center rounded-full px-6 text-[14px]"
              >
                {t("Return to the atelier")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 min-h-[26px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={phaseIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="ink-hand ink-soft max-w-[420px] text-center text-[16px] italic"
                >
                  {WEAVING_PHASES[phaseIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-4 h-px w-40 overflow-hidden rounded-full bg-foreground/10">
              <div className="ink-shimmer h-full w-full" />
            </div>
            {/* the resonance law — the book is drawn from this second
                alone: no shelf, no record, no remembering */}
            <p className="ink-hand ink-faint mt-6 max-w-[360px] text-center text-[13px] italic">
              {t(
                "The mirror listens by resonance — drawn fresh from this very second, kept by no one."
              )}
            </p>
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

  /* THE PEN'S REST — while the voice reads the leaf in hand (or the
     loom channels the whole volume in one breath), the desk stands in
     its readOnly silence: the words stay, the writing waits */
  const inkLocked = narrating || narrLoading || !!wholeReveal;

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
    <div
      className="relative flex h-full flex-col overflow-hidden bg-background text-foreground"
    >
      <header
        className={cn(
          "relative z-20 shrink-0 overflow-hidden px-3 transition-all duration-500 sm:px-5",
          immersed
            ? "pointer-events-none max-h-0 -translate-y-5 opacity-0"
            : "max-h-44 translate-y-0 pt-[max(0.75rem,env(safe-area-inset-top))] opacity-100"
        )}
      >
        {/* THE READING DESK — two calm rows that can wrap but never
            squeeze: the book's name keeps its own width between the two
            quiet hands, and the instruments rest in a centered row
            beneath, wrapping instead of colliding on narrow screens */}
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={backFromReader}
          aria-label={t("Begin a new dream")}
          title={t("Begin a new dream")}
          className={inkIconBtn}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        {/* the kept volumes — the past books are always one touch away */}
        <button
          type="button"
          onClick={openShelf}
          aria-label={t("The kept volumes")}
          title={t("The kept volumes")}
          data-testid="dream-shelf-reading"
          className={cn(inkIconBtn, "hidden sm:flex")}
        >
          <History className="size-4" aria-hidden="true" />
        </button>
        <h1 className="ink-hand min-w-0 flex-1 truncate text-center text-[15px] text-foreground/85 sm:text-[17px]">
          {meta?.title ?? ""}
        </h1>
        {/* THE QUIET X — one touch closes the book and returns to the
            branches, from the reader and from the whole-book alike */}
        <button
          type="button"
          onClick={exitTheBook}
          aria-label={t("Close the book")}
          title={t("Close the book")}
          data-testid="dream-reader-close"
          className={inkIconBtn}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 pb-1">
          {/* the rewriting hand — a fancy button at the very top */}
          <button
            type="button"
            onClick={() => setRewriteOpen(true)}
            aria-label={t("Rewrite the coming pages")}
            title={t("Rewrite the coming pages")}
            className="dream-fancy focus-glow relative flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-3.5"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="font-[family-name(var(--font-literata))] text-[13.5px] italic tracking-wide">
              {t("Rewrite")}
            </span>
            {rewrites.length > 0 && (
              <span
                className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground"
                aria-hidden="true"
              />
            )}
          </button>
          {/* THE WHOLE BOOK — one touch channels every remaining page
              in one unbroken breath; when the volume is already
              complete, the same touch simply opens it whole */}
          <button
            type="button"
            onClick={() => void revealWholeBook()}
            disabled={!!wholeReveal}
            aria-label={t("Whole book")}
            title={t("Whole book")}
            data-testid="dream-whole-reveal"
            className="dream-fancy focus-glow relative flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-3 pr-3.5 disabled:opacity-55"
          >
            <BookOpenText className="size-3.5" aria-hidden="true" />
            <span className="hidden font-[family-name(var(--font-literata))] text-[13.5px] italic tracking-wide sm:inline">
              {t("Whole book")}
            </span>
          </button>
          {/* THE BINDING PRESS — the whole book as one PDF */}
          <button
            type="button"
            onClick={() => void downloadWhole()}
            disabled={binding || pages.length === 0}
            aria-label={t("Download the whole book")}
            title={t("Download the whole book")}
            data-testid="dream-download"
            className={cn(inkIconBtn, "shrink-0 disabled:opacity-35")}
          >
            {binding ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
          </button>
          {/* THE LOOSE-LEAF PRESS — the whole book as one Markdown file */}
          <button
            type="button"
            onClick={exportMarkdown}
            disabled={pages.length === 0}
            aria-label={t("Export the book as Markdown")}
            title={t("Export the book as Markdown")}
            data-testid="dream-export"
            className={cn(inkIconBtn, "shrink-0 disabled:opacity-35")}
          >
            <BookDown className="size-4" aria-hidden="true" />
          </button>
          {/* THE FOCUS READING — the column widens, the frame quiets */}
          <button
            type="button"
            onClick={() => setFocusRead((v) => !v)}
            aria-pressed={focusRead}
            aria-label={t("Focus reading")}
            title={t("Focus reading")}
            data-testid="dream-focus"
            className={cn(
              inkIconBtn,
              "shrink-0",
              focusRead &&
                "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_50%,transparent)] text-[color:var(--scope-a,var(--gd))]"
            )}
          >
            <Focus className="size-4" aria-hidden="true" />
          </button>
          {/* THE INK DESK — the leaf in hand, opened for the visitor's
              own pen: a real writing surface on the page itself. The
              whole-book column is no desk, and neither is the title
              leaf nor the tale's crossroads. */}
          {!wholeMode && (
            <button
              type="button"
              onClick={() => setInkDeskOpen((v) => !v)}
              disabled={!currentPage}
              aria-pressed={inkDeskOpen}
              aria-label={t("The ink desk")}
              title={t("The ink desk")}
              data-testid="dream-ink-desk"
              className={cn(
                inkIconBtn,
                "shrink-0 disabled:opacity-35",
                inkDeskOpen &&
                  "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_50%,transparent)] text-[color:var(--scope-a,var(--gd))]"
              )}
            >
              <PenLine className="size-4" aria-hidden="true" />
            </button>
          )}
          {/* THE QUIET COUNT — the volume's own weight, honestly said */}
          {pages.length > 0 && (
            <span
              className="mono-label hidden shrink-0 whitespace-nowrap text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70 md:inline"
              data-testid="dream-wordcount"
            >
              {formatArchiveNumber(bookWords, language)} {t("words")} · {formatArchiveNumber(pages.length, language)} {t("pages")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void narrate()}
            aria-label={narrating ? t("Stop") : t("Listen to the story")}
            title={narrating ? t("Stop") : t("Listen to the story")}
            className={cn(
              inkIconBtn,
              "shrink-0",
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
          {/* THE VOICE TOGGLE — held: every page reads itself aloud,
              one after another, for the whole volume; released: the
              pages keep their silence. It governs every page. */}
          <button
            type="button"
            onClick={() =>
              setAutoNarrate((v) => {
                if (v) stopNarration();
                return !v;
              })
            }
            data-testid="book-voice-toggle"
            aria-pressed={autoNarrate}
            aria-label={
              autoNarrate
                ? t("The voice reads every page — release for silence")
                : t("Let every page read itself aloud")
            }
            title={
              autoNarrate
                ? t("The voice reads every page — release for silence")
                : t("Let every page read itself aloud")
            }
            className={cn(
              inkIconBtn,
              "shrink-0",
              autoNarrate &&
                "border-transparent bg-foreground text-background hover:opacity-90"
            )}
          >
            {autoNarrate ? (
              <Volume2 className="size-4" aria-hidden="true" />
            ) : (
              <VolumeX className="size-4" aria-hidden="true" />
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
                "shrink-0",
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
            className={cn(inkIconBtn, "shrink-0 disabled:opacity-35")}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
            disabled={zoom === ZOOM_STEPS.length - 1}
            aria-label={t("Larger text")}
            title={t("Larger text")}
            className={cn(inkIconBtn, "shrink-0 disabled:opacity-35")}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* the book itself — one page at a time, sliding, each page
          stretching the full height of the screen once revealed — or,
          in the whole-book reading, every woven page in one continuous
          column the visitor scrolls like a real bound volume */}
      <div
        {...(wholeMode ? {} : readerScroll)}
        className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {wholeMode ? (
          /* THE WHOLE BOOK — the title leaf, every woven page and the
             seal of closing in one quiet column */
          <div className={cn("mx-auto w-full px-3 pb-24 pt-3 sm:px-8", focusRead ? "max-w-[920px]" : "max-w-[700px]")}>
            <div
              className="dream-page dream-page-single mb-7 flex flex-col items-center px-6 py-12 text-center sm:px-12"
              data-testid="dream-whole-title"
            >
              <span
                className="font-[family-name(var(--font-literata))] text-2xl text-[var(--dream-ink-faint)]"
                aria-hidden="true"
              >
                ❧
              </span>
              {meta?.sigil && (
                <p className="mt-4 max-w-[360px] font-[family-name(var(--font-literata))] text-[13.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.sigil}
                </p>
              )}
              <h2 className="mt-5 max-w-[360px] font-[family-name(var(--font-literata))] text-[27px] leading-snug text-[var(--dream-ink)] sm:text-[33px]">
                {meta?.title}
              </h2>
              {meta?.subtitle && (
                <p className="mt-3 font-[family-name(var(--font-literata))] text-[14px] italic text-[var(--dream-ink-soft)] sm:text-sm">
                  {meta.subtitle}
                </p>
              )}
              {meta?.axiom && (
                <p className="mt-5 max-w-[400px] font-[family-name(var(--font-literata))] text-[13.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.axiom}
                </p>
              )}
              {meta?.dedication && (
                <p className="mt-3 max-w-[300px] font-[family-name(var(--font-literata))] text-[13px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.dedication}
                </p>
              )}
            </div>
            {displayPages.map((p) => (
              <BookPage
                key={`whole-${p.n}`}
                page={p}
                fontSize={ZOOM_STEPS[zoom]}
                bookTitle={meta?.title}
              />
            ))}
            <div className="dream-page dream-page-single mt-7 flex flex-col items-center px-6 py-12 text-center">
              <span
                className="font-[family-name(var(--font-literata))] text-4xl text-[var(--dream-ink-soft)]"
                aria-hidden="true"
              >
                ❦
              </span>
              <h2 className="mt-5 font-[family-name(var(--font-literata))] text-[25px] text-[var(--dream-ink)]">
                {t("The End")}
              </h2>
              <p className="mt-2 font-[family-name(var(--font-literata))] text-[14.5px] italic text-[var(--dream-ink-soft)]">
                {meta?.title}
              </p>
              {!ended && (
                <>
                  <p className="mono-label mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--dream-ink-faint)]">
                    {t("The loom is still weaving — the book returns whole when the seal lands")}
                  </p>
                  {!wholeReveal && (
                    <button
                      type="button"
                      onClick={() => void revealWholeBook()}
                      disabled={weavingNext}
                      data-testid="dream-whole-continue"
                      className="dream-ink-btn focus-glow mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-[13.5px] font-medium disabled:opacity-60"
                    >
                      <Feather className="size-3.5" aria-hidden="true" />
                      {t("Channel the rest of the book")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className={cn("mx-auto flex h-full w-full items-stretch justify-center px-3 pb-7 pt-3 sm:px-8 sm:pb-9", focusRead ? "max-w-[1100px]" : "max-w-[760px]")}>
          <div className={cn("relative flex min-h-full w-full flex-col", focusRead ? "max-w-[880px]" : "max-w-[640px]")}>
            {/* THE CHANNELING DOT — one small light at the top of the
                first page. Amber and breathing while the loom channels
                the coming seven pages; green when they stand ready.
                One touch carries the reader to the last woven page —
                exactly where the book was about to channel more story
                — and a second touch brings them back. */}
            {stage === "reading" && !wholeMode && !!meta && pages.length > 0 && (pageIdx <= 1 || pageIdx >= pages.length) && !ended && (
              <button
                type="button"
                onClick={() => {
                  stopNarration();
                  const frontier = pages.length;
                  if (pageIdx >= frontier) {
                    const back = dotReturnRef.current < frontier ? dotReturnRef.current : 0;
                    dotReturnRef.current = 0;
                    setPageIdx(back);
                    setSlideDir(-1);
                  } else {
                    dotReturnRef.current = pageIdx;
                    setPageIdx(frontier);
                    setSlideDir(1);
                  }
                }}
                aria-label={
                  weavingNext
                    ? t("The loom is channeling the coming pages — jump to the last woven page")
                    : pageIdx >= pages.length
                      ? t("Return to where you left off")
                      : t("The coming pages are ready — jump to the last woven page")
                }
                title={
                  weavingNext
                    ? t("The loom is channeling the coming pages — jump to the last woven page")
                    : pageIdx >= pages.length
                      ? t("Return to where you left off")
                      : t("The coming pages are ready — jump to the last woven page")
                }
                data-testid="dream-channel-dot"
                className="focus-glow absolute -top-1.5 left-1/2 z-30 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border transition-colors duration-500"
                style={{
                  borderColor: weavingNext
                    ? "rgba(245, 158, 11, 0.75)"
                    : "rgba(34, 197, 94, 0.7)",
                  backgroundColor: weavingNext
                    ? "rgba(245, 158, 11, 0.9)"
                    : "rgba(34, 197, 94, 0.85)",
                  boxShadow: weavingNext
                    ? "0 0 10px rgba(245, 158, 11, 0.55)"
                    : "0 0 8px rgba(34, 197, 94, 0.4)",
                }}
              >
                {weavingNext && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-[rgba(245,158,11,0.45)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            )}
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
                    <h2 className="mt-4 font-[family-name(var(--font-literata))] text-[23px] text-[var(--dream-ink)]">
                      {t("The tale can go on")}
                    </h2>
                    <p className="mt-2 font-[family-name(var(--font-literata))] text-[14.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                      {t(
                        "The loom is warm and the story is not finished — unless you wish it to be."
                      )}
                    </p>
                    <div className="mt-7 flex w-full flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={weaveOnward}
                        disabled={weavingNext}
                        className="dream-ink-btn focus-glow flex h-11 items-center justify-center gap-2 rounded-full text-[15px] font-medium disabled:opacity-60"
                      >
                        <Feather className="size-4" aria-hidden="true" />
                        {t("Weave onward")}
                      </button>
                      <button
                        type="button"
                        onClick={letRest}
                        disabled={weavingNext}
                        className="dream-ink-outline focus-glow flex h-11 items-center justify-center rounded-full font-[family-name(var(--font-literata))] text-[14.5px] disabled:opacity-60"
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
                    <h2 className="mt-5 font-[family-name(var(--font-literata))] text-[25px] text-[var(--dream-ink)]">
                      {t("The End")}
                    </h2>
                    <p className="mt-2 font-[family-name(var(--font-literata))] text-[14.5px] italic text-[var(--dream-ink-soft)]">
                      {meta?.title}
                    </p>
                    <button
                      type="button"
                      onClick={newDream}
                      className="dream-ink-btn focus-glow mt-8 flex h-11 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium"
                    >
                      <MoonStar className="size-4" aria-hidden="true" />
                      {t("Begin a new dream")}
                    </button>
                    {/* THE HONEST AUDIT — the loom's private report on
                        the finished volume, kept outside the book and
                        revealed only when the reader asks */}
                    {audit && (
                      <div className="mt-7 w-full max-w-[420px]">
                        <button
                          type="button"
                          onClick={() => setAuditOpen((o) => !o)}
                          aria-expanded={auditOpen}
                          data-testid="dream-audit-toggle"
                          className="focus-glow mx-auto flex h-9 items-center gap-2 rounded-full border border-[var(--dream-ink-faint)]/35 px-4 font-[family-name(var(--font-literata))] text-[13px] italic text-[var(--dream-ink-soft)] transition-all duration-300 hover:border-[var(--dream-ink-soft)] hover:text-[var(--dream-ink)]"
                        >
                          <Feather className="size-3.5" aria-hidden="true" />
                          {t("The loom's honest audit")}
                          <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
                        </button>
                        {auditOpen && (
                          <ul
                            className="nice-scroll mt-4 max-h-[38vh] space-y-1.5 overflow-y-auto text-left"
                            data-testid="dream-audit-list"
                          >
                            {AUDIT_DIMENSIONS.map(({ key, label }) =>
                              audit[key] ? (
                                <li
                                  key={key}
                                  className="rounded-xl border border-[var(--dream-ink-faint)]/25 px-3 py-2"
                                >
                                  <p className="flex items-baseline justify-between gap-2">
                                    <span className="font-[family-name(var(--font-literata))] text-[13px] text-[var(--dream-ink-soft)]">
                                      {t(label)}
                                    </span>
                                    <span className="mono-label text-[11px] tabular-nums text-[var(--dream-ink)]">
                                      {audit[key]!.score}/10
                                    </span>
                                  </p>
                                  <p className="mt-1 font-[family-name(var(--font-literata))] text-[12.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                                    {audit[key]!.evidence}
                                  </p>
                                </li>
                              ) : null
                            )}
                          </ul>
                        )}
                      </div>
                    )}
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
                        <p className="mt-4 max-w-[360px] font-[family-name(var(--font-literata))] text-[13.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                          {meta.sigil}
                        </p>
                      )}
                      <h2 className="mt-5 max-w-[340px] font-[family-name(var(--font-literata))] text-[27px] leading-snug text-[var(--dream-ink)] sm:text-[33px]">
                        {meta?.title}
                      </h2>
                      {meta?.subtitle && (
                        <p className="mt-3 font-[family-name(var(--font-literata))] text-[14px] italic text-[var(--dream-ink-soft)] sm:text-sm">
                          {meta.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      {meta?.axiom && (
                        <p className="max-w-[380px] font-[family-name(var(--font-literata))] text-[13.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                          {meta.axiom}
                        </p>
                      )}
                      {meta?.axiom && meta?.dedication && (
                        <span
                          className="my-3 h-px w-10 bg-[var(--dream-ink-faint)]/40"
                          aria-hidden="true"
                        />
                      )}
                      <p className="max-w-[300px] font-[family-name(var(--font-literata))] text-[13px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                        {meta?.dedication}
                      </p>
                      {levelMeta && (
                        <p
                          className="mono-label mt-3 text-[10px] uppercase tracking-[0.24em] text-[var(--dream-ink-faint)]"
                          data-testid="dream-depth-badge"
                        >
                          {levelMeta.numeral} · {t(levelMeta.label)}
                        </p>
                      )}
                    </div>
                    <p className="pb-2 font-[family-name(var(--font-literata))] text-[11.5px] uppercase tracking-[0.24em] text-[var(--dream-ink-faint)]">
                      {t("woven for you, this very hour")}
                    </p>
                  </div>
                ) : inkDeskOpen && currentPage ? (
                  /* THE INK DESK — the leaf in hand, opened for the
                     visitor's own pen. The page's own header stays; the
                     body becomes a real writing surface that hands every
                     word back to the same state the whole book saves. */
                  <div
                    className="dream-page dream-page-single nice-scroll flex min-h-0 w-full flex-1 flex-col px-3 py-5 sm:px-7"
                    data-testid="dream-ink-desk-panel"
                  >
                    {currentPage.part && (
                      <p className="mb-1 text-center font-[family-name(var(--font-literata))] text-[12px] uppercase tracking-[0.3em] text-[var(--dream-ink-faint)]">
                        {currentPage.part}
                      </p>
                    )}
                    {currentPage.chapter && (
                      <p className="mb-3 text-center font-[family-name(var(--font-literata))] text-[16px] italic text-[var(--dream-ink-soft)] sm:text-[18px]">
                        {currentPage.chapter}
                      </p>
                    )}
                    <MirrorManuscriptEditor
                      key={`ink-${currentPage.n}`}
                      content={
                        currentPage.html && currentPage.html.trim()
                          ? currentPage.html
                          : plainTextToManuscriptHtml(
                              currentPage.paragraphs.join("\n\n")
                            )
                      }
                      onUpdate={handleInkUpdate}
                      placeholder={t("The page waits for your hand…")}
                      readOnly={inkLocked}
                      formatNumber={(n) => formatArchiveNumber(n, language)}
                      className="mt-1"
                    />
                    <p className="mt-2.5 text-center font-[family-name(var(--font-literata))] text-[11.5px] italic leading-relaxed text-[var(--dream-ink-faint)]">
                      {inkLocked
                        ? t("The voice holds the page — the pen waits for it to finish.")
                        : t("The ink flows onto this leaf — the voice, the press and the shelf read the very same words.")}
                    </p>
                  </div>
                ) : (
                  <BookPage
                    page={currentPage}
                    fontSize={ZOOM_STEPS[zoom]}
                    bookTitle={meta?.title}
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
                  className="mono-label mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  <span
                    className="size-1 animate-pulse rounded-full bg-foreground/50"
                    aria-hidden="true"
                  />
                  {t("The loom weaves the next pages…")}
                </motion.p>
              )}
            </AnimatePresence>

            {/* THE READER'S OWN CRANK — one hand-weave of the next six
                pages, standing whenever the woven edge draws near: the
                visitor presses it while they read and the loom answers */}
            {stage === "reading" &&
              !wholeMode &&
              !ended &&
              !weavingNext &&
              !showChoice &&
              !showEnd &&
              !!meta &&
              pages.length < meta.totalPages &&
              pageIdx >= pages.length - 1 && (
                <button
                  type="button"
                  onClick={() => void weaveNextSix()}
                  data-testid="dream-weave-next-six"
                  className="dream-ink-outline focus-glow mx-auto mt-4 flex h-10 items-center gap-2 rounded-full px-5 font-[family-name(var(--font-literata))] text-[13.5px]"
                >
                  <Feather className="size-3.5" aria-hidden="true" />
                  {t("Weave the next six pages")}
                </button>
              )}
          </div>
          </div>
        )}
      </div>

      {/* THE WHOLE BOOK'S OWN RETURN — a floating hand that folds the
          continuous volume back into page-by-page reading, with the
          quiet X beside it that closes the book for the branches */}
      <AnimatePresence>
        {wholeMode && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute bottom-6 right-5 z-30 flex items-center gap-2"
          >
            <motion.button
              type="button"
              onClick={exitTheBook}
              aria-label={t("Close the book")}
              title={t("Close the book")}
              data-testid="dream-whole-close"
              className="dream-turn focus-glow flex size-11 items-center justify-center rounded-full"
            >
              <X className="size-4" aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setWholeMode(false);
                setPageIdx(Math.min(pageIdx, Math.max(1, pages.length)));
              }}
              aria-label={t("Read page by page")}
              title={t("Read page by page")}
              data-testid="dream-whole-return"
              className="dream-turn focus-glow flex h-11 items-center gap-2 rounded-full px-4"
            >
              <BookOpenText className="size-4" aria-hidden="true" />
              <span className="font-[family-name(var(--font-literata))] text-[13px] italic">
                {t("Read page by page")}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE MIRROR BRIDGE — the reading stage's own advisor: it sees
          the volume at hand and advises; only the reader's own hand
          carries anything onward. It rests while the frame is already
          full (whole-book mode, immersed reading, small screens). */}
      {stage === "reading" &&
        !wholeMode &&
        !immersed &&
        !!meta &&
        pages.length > 0 && (
          <MirrorBridge
            workspaceKey="dreambook"
            buildContext={buildBridgeContext}
          />
        )}

      {/* the progress thread + the slide buttons (they rest while the
          reading is immersed — the page alone fills the screen) */}
      {!wholeMode && (
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
            <p className="mono-label mt-1.5 text-center text-[11px] tracking-[0.18em] text-muted-foreground">
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
      )}

      {/* the one button that remains while immersed — the next page,
          floating alone over the reading; beside it, the voice toggle
          so the reading aloud follows the visitor onto every page */}
      <AnimatePresence>
        {immersed && canNext && !wholeMode && (
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
      <AnimatePresence>
        {immersed && !wholeMode && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            type="button"
            onClick={() =>
              setAutoNarrate((v) => {
                if (v) stopNarration();
                return !v;
              })
            }
            data-testid="book-voice-toggle-immersed"
            aria-pressed={autoNarrate}
            aria-label={
              autoNarrate
                ? t("The voice reads every page — release for silence")
                : t("Let every page read itself aloud")
            }
            title={
              autoNarrate
                ? t("The voice reads every page — release for silence")
                : t("Let every page read itself aloud")
            }
            className={cn(
              "dream-turn focus-glow absolute bottom-6 left-5 z-30 flex size-12 items-center justify-center rounded-full",
              autoNarrate && "dream-turn-active"
            )}
            style={
              autoNarrate
                ? { background: "var(--foreground)", color: "var(--background)" }
                : undefined
            }
          >
            {autoNarrate ? (
              <Volume2 className="size-5" aria-hidden="true" />
            ) : (
              <VolumeX className="size-5" aria-hidden="true" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* THE WHOLE-BOOK REVEAL — the loom channels every remaining page
          in one unbroken breath: the quill dips, the ring turns, and
          the progress of the weaving is spoken while it works */}
      <AnimatePresence>
        {wholeReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            data-testid="dream-whole-overlay"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[color-mix(in_srgb,var(--background)_94%,transparent)] px-6 backdrop-blur-[3px]"
            role="status"
            aria-live="polite"
          >
            {/* THE VISITOR'S HAND — one touch lets the loom rest: the
                channeling stops between strides and the book opens
                with every page already woven */}
            <button
              type="button"
              onClick={restTheLoom}
              aria-label={t("Let the loom rest")}
              title={t("Let the loom rest")}
              data-testid="dream-whole-cancel"
              className="focus-glow absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground sm:right-6 sm:top-6"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <div className="relative flex size-20 items-center justify-center">
              <span
                aria-hidden="true"
                className="ink-turn-anim absolute inset-0 rounded-full border border-dashed border-foreground/25"
              />
              <span
                aria-hidden="true"
                className="absolute inset-3 rounded-full border border-foreground/12"
              />
              <Feather
                className="ink-pour-anim size-8 text-foreground/80"
                aria-hidden="true"
              />
            </div>
            <p className="mono-label mt-6 text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
              {t("The loom channels the whole book…")}
            </p>
            <p
              className="ink-hand ink-soft mt-2 font-[family-name(var(--font-literata))] text-[14.5px] italic text-foreground/85"
              data-testid="dream-whole-progress"
            >
              {t("{n} of {y} pages woven")
                .replace("{n}", String(Math.min(wholeReveal.woven, wholeReveal.total)))
                .replace("{y}", String(wholeReveal.total))}
            </p>
            <div className="mt-5 h-[3px] w-60 overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-foreground/65 transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round((wholeReveal.woven / Math.max(1, wholeReveal.total)) * 100))}%`,
                }}
              />
            </div>
            <p className="ink-hand ink-faint mt-5 max-w-[320px] text-center text-[12.5px] italic leading-relaxed text-muted-foreground">
              {t(
                "The loom weaves in swift strides — long books take their time; the telling never breaks."
              )}
            </p>
            {/* THE BINDING HAND DURING THE WALK — the visitor never has
                to wait for the whole breath: whatever the loom has
                already woven can be bound into its PDF right now */}
            <button
              type="button"
              onClick={() => void downloadWhole()}
              disabled={binding || wholeReveal.woven === 0}
              data-testid="dream-download-mid-reveal"
              className="focus-glow mt-5 flex h-9 items-center gap-2 rounded-full border border-foreground/25 px-4 text-[13.5px] text-foreground/85 transition-all duration-300 hover:border-foreground/45 hover:text-foreground disabled:opacity-35"
            >
              {binding ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-3.5" aria-hidden="true" />
              )}
              {t("Bind what is woven")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the rewriting hand's panel */}
      <ModalShell
        open={rewriteOpen}
        onOpenChange={setRewriteOpen}
        title={t("The rewriting hand")}
        description={t(
          "Whisper what must change — the coming events, the number of pages (up to 220), the chapters, the very voice of the writing, even the face of the subject itself. The loom will bend the book to your hand."
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
            className="nice-scroll w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/35 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REWRITE_STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRewriteDraft((d) => (d ? `${d} ${s}` : s))}
                className="focus-glow rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          {rewrites.length > 0 && (
            <div className="mt-4">
              <p className="mono-label text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("Already whispered into the weave")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {rewrites.map((r, i) => (
                  <li
                    key={`${i}-${r.slice(0, 12)}`}
                    className="flex items-start gap-2 rounded-xl border border-border/70 bg-card/50 px-3 py-2"
                  >
                    <span className="ink-hand ink-soft min-w-0 flex-1 text-[13.5px] italic leading-relaxed">
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
            className="akashic-btn focus-glow mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium tracking-wide disabled:opacity-50"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {t("Bend the tale")}
          </button>
        </form>
      </ModalShell>
    </div>
  );

  /* ================================================================ */
  /*  THE KEPT VOLUMES — the books' own history                        */
  /* ================================================================ */

  const shelfRow = (v: ShelfVolume, local: boolean) => (
    <div
      key={`${local ? "local" : "lib"}-${v.bookId}-${v.savedAt}`}
      className="rounded-xl border border-border/80 bg-card/40 px-3.5 py-3"
      data-testid={local ? "shelf-volume-local" : "shelf-volume-library"}
    >
      {/* the volume's words — the title, the whisper and the keeping
          line own their full width, with no button pressing against
          them at narrow sizes */}
      <div className="flex items-start gap-3">
        <span
          className="ink-hand flex size-9 shrink-0 items-center justify-center text-[17px] text-foreground/40"
          aria-hidden="true"
        >
          {v.sigil || "❧"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-medium text-foreground/90">
            {v.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {v.axiom || v.subtitle || v.pages[0]?.paragraphs[0]?.slice(0, 120) || "…"}
          </p>
          <p className="mono-label mt-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {(v.savedAt || "").slice(0, 10)} · {t("page {n} of {m}", { n: Math.min(v.pages.length, v.totalPages || v.pages.length), m: v.totalPages || v.pages.length })}
            {v.ended ? ` · ${t("Read again")}` : ""}
          </p>
        </div>
      </div>
      {/* the volume's own hands — a quiet row beneath the words, so
          the buttons never collide with the title on narrow widths */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-border/50 pt-2.5">
        {local && (
          <button
            type="button"
            onClick={() => forgetLocal(v.bookId)}
            aria-label={t("Forget this volume")}
            title={t("Forget this volume")}
            className="focus-glow flex size-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => resumeVolume(v)}
          data-testid="shelf-continue"
          className="focus-glow inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-foreground/40 hover:glow-sm"
        >
          <Feather className="size-3" aria-hidden="true" />
          {v.ended ? t("Read again") : t("Continue the story")}
        </button>
      </div>
    </div>
  );

  const shelfPanel = (
    <ModalShell
      open={shelfOpen}
      onOpenChange={setShelfOpen}
      title={t("The kept volumes")}
      description={t(
        "Every volume you weave is kept here — on this device, and in your library when you are signed in."
      )}
      widthClass="sm:max-w-[560px]"
    >
      <div className="nice-scroll max-h-[60dvh] space-y-5 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
        {shelfLoading && libraryVolumes === null ? (
          <div aria-busy="true" aria-live="polite">
            {/* the shelves' shape arriving — quiet rows where the
                volumes will stand, instead of a lone turning wheel */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border/80 bg-card/40 px-3.5 py-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="mt-2 h-3 w-4/5" />
                    <Skeleton className="mt-1.5 h-2.5 w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {localShelf.length > 0 && (
              <section>
                <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("On this device")}
                </p>
                <div className="space-y-2" data-testid="shelf-local-list">
                  {localShelf.map((v) => shelfRow(v, true))}
                </div>
              </section>
            )}
            {libraryVolumes !== null && libraryVolumes.length > 0 && (
              <section>
                <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("In your library")}
                </p>
                <div className="space-y-2" data-testid="shelf-library-list">
                  {libraryVolumes
                    .filter(
                      (v) =>
                        !localShelf.some(
                          (l) => l.bookId && l.bookId === v.bookId
                        )
                    )
                    .map((v) => shelfRow(v, false))}
                </div>
              </section>
            )}
            {localShelf.length === 0 &&
              (libraryVolumes === null || libraryVolumes.length === 0) && (
                <p className="ink-hand ink-soft py-4 text-center text-[14.5px] italic text-muted-foreground" data-testid="shelf-empty">
                  {t("The shelf rests empty — your first volume will keep itself here.")}
                </p>
              )}
          </>
        )}
      </div>
    </ModalShell>
  );

  if (stage === "weaving")
    return (
      <>
        {weaving}
        {shelfPanel}
      </>
    );
  if (stage === "reading")
    return (
      <>
        {reader}
        {shelfPanel}
      </>
    );
  return (
    <>
      {atelier}
      {shelfPanel}
    </>
  );
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

function ShapeRow({
  label,
  options,
  active,
  onPick,
  testIdPrefix,
}: {
  label: string;
  options: { id: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
  testIdPrefix: string;
}) {
  const t = useT();
  return (
    <div role="group" aria-label={label}>
      <p className="mono-label mb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
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
              aria-label={t(o.label)}
              title={t(o.label)}
              data-testid={`${testIdPrefix}-${o.id}`}
              className={cn(
                "btn-chip h-7 text-[12px]",
                isActive && "btn-chip-active"
              )}
            >
              {t(chipFace(o.label))}
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
  bookTitle,
}: {
  page?: WeavePage;
  fontSize: number;
  stalled?: boolean;
  onRetry?: () => void;
  bookTitle?: string;
}) {
  const t = useT();
  /* THE PAGE'S OWN COPY — one quiet button at the end of every page:
     the page's whole text carried to the clipboard, nothing more. */
  const [copied, setCopied] = useState(false);
  const copyPage = async () => {
    if (!page) return;
    try {
      const header = `${page.part ? `${page.part}\n\n` : ""}${page.chapter ? `${page.chapter}\n\n` : ""}`;
      await navigator.clipboard.writeText(`${header}${pageText(page)}`);
      setCopied(true);
      toast.success(t("The page is copied."));
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error(t("The copying did not take — select and copy by hand."));
    }
  };
  return (
    <div
      className={cn(
        "dream-page dream-page-single nice-scroll mx-auto flex min-h-0 w-full flex-1 flex-col px-6 py-8 sm:px-10"
      )}
    >
      {page ? (
        <>
          {page.part && (
            <p className="mb-1 text-center font-[family-name(var(--font-literata))] text-[12px] uppercase tracking-[0.3em] text-[var(--dream-ink-faint)]">
              {page.part}
            </p>
          )}
          {page.chapter && (
            <p className="mb-4 text-center font-[family-name(var(--font-literata))] text-[16px] italic text-[var(--dream-ink-soft)] sm:text-[18px]">
              {page.chapter}
            </p>
          )}
          <div
            className="dream-body flex-1"
            style={{ fontSize, lineHeight: 1.78 }}
          >
            {page.html ? (
              /* A PAGE THE PEN HAS TOUCHED — its rich manuscript is
                 rendered as the room itself wrote it (same ink, same
                 voice, headings and lists dressed like the desk). */
              <div
                className={cn(
                  "manuscript-prose",
                  page.chapter && "manuscript-drop"
                )}
                dangerouslySetInnerHTML={{ __html: page.html }}
              />
            ) : (
              page.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    "mb-4 whitespace-pre-wrap text-[var(--dream-ink)] last:mb-0",
                    page.chapter && i === 0 && "dream-drop"
                  )}
                >
                  {p}
                </p>
              ))
            )}
          </div>
          {/* the end of the page — its number, and the copy of its words */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <p className="font-[family-name(var(--font-literata))] text-[12px] text-[var(--dream-ink-faint)]">
              {page.n}
            </p>
            <span
              className="h-px w-6 bg-[var(--dream-ink-faint)]/30"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => void copyPage()}
              data-testid={`book-page-copy-${page.n}`}
              aria-label={t("Copy this page")}
              title={t("Copy this page")}
              className="focus-glow inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--dream-ink-faint)]/30 px-2.5 font-[family-name(var(--font-literata))] text-[11.5px] italic text-[var(--dream-ink-soft)] transition-all duration-300 hover:border-[var(--dream-ink-soft)] hover:text-[var(--dream-ink)]"
            >
              {copied ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                <Copy className="size-3" aria-hidden="true" />
              )}
              {copied ? t("copied") : t("Copy page")}
            </button>
            <ShareButton
              cacheKey={`dream-page-${page.n}`}
              title={bookTitle ?? t("A woven book")}
              text={`${page.part ? `${page.part}\n\n` : ""}${page.chapter ? `${page.chapter}\n\n` : ""}${pageText(page)}`}
              variant="bare"
              className="focus-glow inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--dream-ink-faint)]/30 px-2.5 font-[family-name(var(--font-literata))] text-[11.5px] italic text-[var(--dream-ink-soft)] transition-all duration-300 hover:border-[var(--dream-ink-soft)] hover:text-[var(--dream-ink)]"
            />
          </div>
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
          <p className="font-[family-name(var(--font-literata))] text-[13.5px] italic text-[var(--dream-ink-faint)]">
            {t("The loom weaves the next pages…")}
          </p>
          <div className="h-px w-28 rounded-full bg-[var(--dream-ink-faint)]/25 overflow-hidden">
            <div className="ink-shimmer h-full w-full" />
          </div>
          {stalled && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="dream-ink-btn focus-glow mt-2 flex h-8 items-center justify-center rounded-full px-4 text-[13px] font-medium"
            >
              {t("Weave again")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
