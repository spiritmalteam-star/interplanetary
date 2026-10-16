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
  BookOpenText,
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  Feather,
  History,
  LoaderCircle,
  MoonStar,
  Pause,
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
  stopBrowserVoice,
} from "@/lib/browser-voice";
import { BOOK_DEPTHS, READERS, TALES, VOLUMES } from "@/lib/data/book-options";
import { dedupeChapters } from "@/lib/book-text";
import {
  forgetVolume,
  keepVolume,
  loadShelf,
  type ShelfVolume,
} from "@/lib/book-shelf";
import type { DreamBookResume } from "@/lib/mirror-store";
import type { VoiceId } from "@/lib/i18n/core";
import type { BookAudit, BookLedger } from "@/lib/book-ledger";
import { AUDIT_DIMENSIONS } from "@/lib/book-ledger";
import { downloadBookPdf } from "@/lib/book-pdf";
import { recordDownload } from "@/lib/downloads-log";
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
  /* THE VEIN — the big choice of the loom: ephemeral (metaphysical,
     mystique) or ground (a normal book). The channel's own breath has
     always been ephemeral, so it is the resting hand. */
  const [vein, setVein] = useState<"ephemeral" | "ground">("ephemeral");
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
  const configRef = useRef({ age, tale, volume, level, topic, vein });
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

  useEffect(() => {
    configRef.current = { age, tale, volume, level, topic, vein };
  }, [age, tale, volume, level, topic, vein]);

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
      bookIdRef.current = r.bookId;
      pagesRef.current = r.pages.map((p) => ({
        ...p,
        paragraphs: [...p.paragraphs],
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
      pages: pagesRef.current.map((p) => ({
        n: p.n,
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: [...p.paragraphs],
      })),
    };
  }, []);

  /* the volume in hand never vanishes — it keeps itself before any
     turn away (a new dream, a walk back to the atelier, an exit) */
  const keepCurrent = useCallback(() => {
    const snap = snapshotCurrent();
    if (!snap) return;
    keepVolume(snap);
  }, [snapshotCurrent]);

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

  /* the weaving phase — the loom keeps count */
  const weave = useCallback(
    async (
      phase: "open" | "next" | "close" | "extend",
      pageNumber: number,
      span = 2,
      timeoutMs = 150000
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
          /* THE SPAN — the whole-book reveal strides four at a time */
          ...(span > 2 ? { span } : {}),
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

  /* keyboard page turns (the whole-book reading scrolls freely) */
  useEffect(() => {
    if (stage !== "reading" || wholeMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goPage(1);
      if (e.key === "ArrowLeft") goPage(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, wholeMode, goPage]);

  const newDream = useCallback(() => {
    stopNarration();
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
         channels everything that remains. */
      for (let wait = 0; wait < 600 && weavingRef.current; wait++) {
        if (cancelRevealRef.current) return;
        await new Promise((r) => setTimeout(r, 250));
      }
      if (weavingRef.current || cancelRevealRef.current) return;
      started = true;
      /* the loom's own patience — before every stride, the reveal lets
         any breath already in the loom land (the reader's prefetch),
         so a stride is never swallowed by a held door */
      const waitForLoom = async () => {
        for (let wait = 0; wait < 600 && weavingRef.current; wait++) {
          if (cancelRevealRef.current) return false;
          await new Promise((r) => setTimeout(r, 250));
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
          const ok = await weave("close", have + 1, 2, 240000);
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
        const ok = await weave("next", have + 1, 8, 300000);
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
        /* the stall guard — a stride that returns no pages can never
           hold the loop; the book simply opens with what is woven */
        if (pagesRef.current.length === before) break;
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
  }, [weave, wholeReveal, stopNarration]);

  /* the visitor lets the loom rest — the channeling stops between
     strides and the book opens whole with everything already woven */
  const restTheLoom = useCallback(() => {
    cancelRevealRef.current = true;
    setWholeReveal(null);
    setWholeMode(true);
    if (navigator.vibrate) navigator.vibrate(12);
  }, []);

  /* THE BINDING PRESS — the whole book, pages and front matter, bound
     into one ink PDF and handed to the visitor's own hands */
  const downloadWhole = useCallback(async () => {
    if (binding || !meta || pagesRef.current.length === 0) return;
    setBinding(true);
    try {
      const bound = dedupeChapters(pagesRef.current).map((p) => ({
        n: p.n,
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
  }, [binding, meta, t]);

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
    const body = currentPage ? pageText(currentPage) : "";
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
  }, [narrating, narrLoading, narrPaused, currentPage, pageIdx, meta, stopNarration, resumeNarration, t]);

  /* the auto-voice effect reads the freshest narrate without re-firing */
  narrateRef.current = narrate;

  /* ---------------- shared ---------------- */

  const backFromAtelier = () => {
    stopNarration();
    keepCurrent(); /* the volume rests on the shelf before the exit */
    exitDreamBook();
  };

  /* THE QUIET X — one clear close in every room of the book: it rests
     the voice, keeps the volume on the shelf, and returns the visitor
     to the tree in a single touch */
  const exitTheBook = () => {
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
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 flex shrink-0 items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <button
          type="button"
          onClick={backFromAtelier}
          aria-label={t("Back to the laboratory")}
          title={t("Back to the laboratory")}
          className={inkIconBtn}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
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
        <span className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <MoonStar className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("The atelier of tales")}</span>
        </span>
        <span className="min-w-2 flex-1" aria-hidden="true" />
        {/* THE QUIET X — one touch returns to the branches */}
        <button
          type="button"
          onClick={exitTheBook}
          aria-label={t("Close the book")}
          title={t("Close the book")}
          data-testid="dream-atelier-close"
          className={inkIconBtn}
        >
          <X className="size-4" aria-hidden="true" />
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
            <h1 className="ink-title text-[21px] leading-tight sm:text-[24px]">
              {t("Dream Book")}
            </h1>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <p className="ink-hand ink-soft mt-1.5 text-[12.5px] italic leading-relaxed sm:text-[13.5px]">
            {t("Name any subject, era, or universe — the loom tunes itself, and the book begins.")}
          </p>

          {/* THE TWO VEINS — the loom's big categorisation: a normal,
              grounded book, or an ephemeral one that breathes the
              metaphysical and the mystique. Two cards, plainly lit —
              the first choice the atelier asks. */}
          <div
            className="mt-4 grid grid-cols-2 gap-2.5"
            role="radiogroup"
            aria-label={t("The vein of the book")}
            data-testid="dream-vein"
          >
            {(
              [
                {
                  id: "ephemeral" as const,
                  glyph: "☾",
                  label: t("Ephemeral"),
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
                  className={cn(
                    "focus-glow relative flex flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-all duration-300",
                    active
                      ? "glow-sm border-foreground/45 bg-foreground/[0.06]"
                      : "border-border bg-card/30 hover:border-foreground/25"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "font-[family-name(var(--font-literata))] text-[15px] leading-none transition-colors duration-300",
                        active ? "text-foreground" : "text-muted-foreground/60"
                      )}
                    >
                      {v.glyph}
                    </span>
                    <span
                      className={cn(
                        "font-[family-name(var(--font-literata))] text-[13.5px] font-semibold tracking-wide transition-colors duration-300",
                        active ? "text-foreground" : "text-foreground/70"
                      )}
                    >
                      {v.label}
                    </span>
                  </span>
                  <span className="text-[10.5px] italic leading-snug text-muted-foreground/85">
                    {v.hint}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="dream-vein-marker"
                      className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-foreground/70"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* the shapes — reader / tale / book, one compact sheet */}
          <div className="mt-4 rounded-2xl border border-border bg-card/40 p-3.5 sm:p-4">
            <div className="space-y-3">
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

            {/* the depth bar — five compact steps on one line; the
                active step speaks its own one-line whisper beneath */}
            <div className="mt-3.5 border-t border-border/60 pt-3" data-testid="dream-depth-bar">
              <p className="mono-label mb-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("The depth of the telling")}
              </p>
              <div className="flex items-end gap-1.5">
                {BOOK_DEPTHS.map((lv, i) => {
                  const active = level === lv.id;
                  const fills = [0.07, 0.12, 0.18, 0.26, 0.36];
                  const heights = [16, 20, 24, 28, 32];
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => choose("level", lv.id)}
                      aria-pressed={active}
                      aria-label={`${t(lv.label)} — depth ${lv.numeral}`}
                      data-testid={`dream-depth-${lv.id}`}
                      title={t(lv.label)}
                      className="focus-glow group flex min-w-0 flex-1 flex-col items-center gap-1"
                    >
                      <span
                        className={cn(
                          "relative flex w-full items-end justify-center overflow-hidden rounded-md border transition-all duration-300",
                          active && "glow-sm"
                        )}
                        style={{
                          height: `${heights[i]}px`,
                          borderColor: active
                            ? "var(--foreground)"
                            : "var(--border)",
                          background: active
                            ? "var(--foreground)"
                            : `color-mix(in srgb, var(--foreground) ${fills[i]}%, transparent)`,
                        }}
                      >
                        <span
                          className="font-[family-name(var(--font-literata))] text-[10px] font-semibold leading-none tracking-[0.08em]"
                          style={{
                            color: active
                              ? "var(--background)"
                              : "var(--muted-foreground)",
                          }}
                        >
                          {lv.numeral}
                        </span>
                        {active && (
                          <motion.span
                            layoutId="dream-depth-marker"
                            className="absolute inset-x-0 bottom-0 h-[2.5px] bg-foreground"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "w-full truncate text-center font-[family-name(var(--font-literata))] text-[9.5px] italic leading-tight transition-colors duration-300",
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
              {/* the active depth's own whisper — one line, only when held */}
              <AnimatePresence initial={false} mode="wait">
                <motion.p
                  key={levelMeta?.id ?? "none"}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.25 }}
                  className="ink-hand ink-soft mt-2 min-h-[1.6em] text-center text-[11px] italic leading-snug"
                >
                  {levelMeta
                    ? t(levelMeta.depth)
                    : t("Choose how deep the telling goes.")}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div aria-hidden="true" className="h-2" />
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
                  "The loom waits for a thread — choose the reader, the tale, the book, or the depth below."
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
            {/* the resonance law — the book is drawn from this second
                alone: no shelf, no record, no remembering */}
            <p className="ink-hand ink-faint mt-6 max-w-[360px] text-center text-[12px] italic">
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
            className="dream-fancy focus-glow relative flex h-9 items-center gap-1.5 rounded-full pl-3 pr-3.5 disabled:opacity-55"
          >
            <BookOpenText className="size-3.5" aria-hidden="true" />
            <span className="hidden font-[family-name(var(--font-literata))] text-[12.5px] italic tracking-wide sm:inline">
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
            className={cn(inkIconBtn, "disabled:opacity-35")}
          >
            {binding ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void narrate()}
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
          {/* THE QUIET X — one touch closes the book and returns to the
              branches, from the reader and from the whole-book alike */}
          <button
            type="button"
            onClick={exitTheBook}
            aria-label={t("Close the book")}
            title={t("Close the book")}
            data-testid="dream-reader-close"
            className={cn(inkIconBtn, "ml-0.5")}
          >
            <X className="size-4" aria-hidden="true" />
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
          <div className="mx-auto w-full max-w-[700px] px-3 pb-24 pt-3 sm:px-8">
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
                <p className="mt-4 max-w-[360px] font-[family-name(var(--font-literata))] text-[12.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.sigil}
                </p>
              )}
              <h2 className="mt-5 max-w-[360px] font-[family-name(var(--font-literata))] text-[26px] leading-snug text-[var(--dream-ink)] sm:text-[32px]">
                {meta?.title}
              </h2>
              {meta?.subtitle && (
                <p className="mt-3 font-[family-name(var(--font-literata))] text-[13px] italic text-[var(--dream-ink-soft)] sm:text-sm">
                  {meta.subtitle}
                </p>
              )}
              {meta?.axiom && (
                <p className="mt-5 max-w-[400px] font-[family-name(var(--font-literata))] text-[12.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.axiom}
                </p>
              )}
              {meta?.dedication && (
                <p className="mt-3 max-w-[300px] font-[family-name(var(--font-literata))] text-[12px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                  {meta.dedication}
                </p>
              )}
            </div>
            {displayPages.map((p) => (
              <BookPage
                key={`whole-${p.n}`}
                page={p}
                fontSize={ZOOM_STEPS[zoom]}
              />
            ))}
            <div className="dream-page dream-page-single mt-7 flex flex-col items-center px-6 py-12 text-center">
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
              {!ended && (
                <p className="mono-label mt-3 text-[9px] uppercase tracking-[0.2em] text-[var(--dream-ink-faint)]">
                  {t("The loom is still weaving — the book returns whole when the seal lands")}
                </p>
              )}
            </div>
          </div>
        ) : (
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
                          className="focus-glow mx-auto flex h-9 items-center gap-2 rounded-full border border-[var(--dream-ink-faint)]/35 px-4 font-[family-name(var(--font-literata))] text-[12px] italic text-[var(--dream-ink-soft)] transition-all duration-300 hover:border-[var(--dream-ink-soft)] hover:text-[var(--dream-ink)]"
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
                                    <span className="font-[family-name(var(--font-literata))] text-[12px] text-[var(--dream-ink-soft)]">
                                      {t(label)}
                                    </span>
                                    <span className="mono-label text-[10px] tabular-nums text-[var(--dream-ink)]">
                                      {audit[key]!.score}/10
                                    </span>
                                  </p>
                                  <p className="mt-1 font-[family-name(var(--font-literata))] text-[11.5px] italic leading-relaxed text-[var(--dream-ink-soft)]">
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
                          data-testid="dream-depth-badge"
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
              <span className="font-[family-name(var(--font-literata))] text-[12px] italic">
                {t("Read page by page")}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="mono-label mt-6 text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              {t("The loom channels the whole book…")}
            </p>
            <p
              className="ink-hand ink-soft mt-2 font-[family-name(var(--font-literata))] text-[13.5px] italic text-foreground/85"
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
            <p className="ink-hand ink-faint mt-5 max-w-[320px] text-center text-[11.5px] italic leading-relaxed text-muted-foreground">
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
              className="focus-glow mt-5 flex h-9 items-center gap-2 rounded-full border border-foreground/25 px-4 text-[12.5px] text-foreground/85 transition-all duration-300 hover:border-foreground/45 hover:text-foreground disabled:opacity-35"
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

  /* ================================================================ */
  /*  THE KEPT VOLUMES — the books' own history                        */
  /* ================================================================ */

  const shelfRow = (v: ShelfVolume, local: boolean) => (
    <div
      key={`${local ? "local" : "lib"}-${v.bookId}-${v.savedAt}`}
      className="flex items-start gap-3 rounded-xl border border-border/80 bg-card/40 px-3.5 py-3"
      data-testid={local ? "shelf-volume-local" : "shelf-volume-library"}
    >
      <span
        className="ink-hand flex size-9 shrink-0 items-center justify-center text-[16px] text-foreground/40"
        aria-hidden="true"
      >
        {v.sigil || "❧"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-foreground/90">
          {v.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {v.axiom || v.subtitle || v.pages[0]?.paragraphs[0]?.slice(0, 120) || "…"}
        </p>
        <p className="mono-label mt-1.5 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
          {(v.savedAt || "").slice(0, 10)} · {t("page {n} of {m}", { n: Math.min(v.pages.length, v.totalPages || v.pages.length), m: v.totalPages || v.pages.length })}
          {v.ended ? ` · ${t("Read again")}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => resumeVolume(v)}
          data-testid="shelf-continue"
          className="focus-glow inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-foreground/40 hover:glow-sm"
        >
          <Feather className="size-3" aria-hidden="true" />
          {v.ended ? t("Read again") : t("Continue the story")}
        </button>
        {local && (
          <button
            type="button"
            onClick={() => forgetLocal(v.bookId)}
            aria-label={t("Forget this volume")}
            title={t("Forget this volume")}
            className="focus-glow text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
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
          <p
            className="flex items-center gap-2 py-4 text-[13px] text-muted-foreground"
            aria-busy="true"
          >
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            {t("The shelves are being read…")}
          </p>
        ) : (
          <>
            {localShelf.length > 0 && (
              <section>
                <p className="mono-label mb-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("On this device")}
                </p>
                <div className="space-y-2" data-testid="shelf-local-list">
                  {localShelf.map((v) => shelfRow(v, true))}
                </div>
              </section>
            )}
            {libraryVolumes !== null && libraryVolumes.length > 0 && (
              <section>
                <p className="mono-label mb-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
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
                <p className="ink-hand ink-soft py-4 text-center text-[13.5px] italic text-muted-foreground" data-testid="shelf-empty">
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
  /* THE PAGE'S OWN COPY — one quiet button at the end of every page:
     the page's whole text carried to the clipboard, nothing more. */
  const [copied, setCopied] = useState(false);
  const copyPage = async () => {
    if (!page) return;
    try {
      const header = page.chapter ? `${page.chapter}\n\n` : "";
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
          {/* the end of the page — its number, and the copy of its words */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <p className="font-[family-name(var(--font-literata))] text-[11px] text-[var(--dream-ink-faint)]">
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
              className="focus-glow inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--dream-ink-faint)]/30 px-2.5 font-[family-name(var(--font-literata))] text-[10.5px] italic text-[var(--dream-ink-soft)] transition-all duration-300 hover:border-[var(--dream-ink-soft)] hover:text-[var(--dream-ink)]"
            >
              {copied ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                <Copy className="size-3" aria-hidden="true" />
              )}
              {copied ? t("copied") : t("Copy page")}
            </button>
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
