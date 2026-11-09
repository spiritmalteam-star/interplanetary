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
import { isPageHidden } from "@/lib/page-lifecycle";
import PublishToGathering from "@/components/gathering/PublishToGathering";
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
  Maximize2,
  Minimize2,
  MoonStar,
  Pause,
  PenLine,
  PenTool,
  Play,
  Sparkles,
  Square,
  Send,
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
import { formatArchiveNumber } from "@/lib/i18n/core";
import { registerWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { SketchPad, type SketchMeta } from "./dreambook/SketchPad";
import {
  forgetVolume,
  keepVolume,
  loadShelf,
  type ShelfVolume,
} from "@/lib/book-shelf";
import type { DreamBookResume } from "@/lib/mirror-store";
import { bookReadingKey, useWorkspaceMemory } from "@/lib/workspace-memory";
import type { VoiceId } from "@/lib/i18n/core";
import type { BookEstimate } from "@/lib/book-pricing";
import type { BookLedger } from "@/lib/book-ledger";
import { downloadBookPdf } from "@/lib/book-pdf";
import { recordDownload } from "@/lib/downloads-log";
import { cn } from "@/lib/utils";
import { ShareButton } from "./ShareButton";
import { paragraphsFromEditorText, plainTextToManuscriptHtml } from "./dreambook/manuscript-text";
import "./dreambook/manuscript-editor.css";
import type { GateItem } from "@/lib/book-press";

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

/* THE BACKGROUND LOOM'S OWN STATES — off (resting or done), weaving
   (the whole plan channels in the background), paused (parked between
   strides by the visitor's own hand or the purse's rest). */
type LoomMode = "off" | "weaving" | "paused";

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
  /* THE BOUND-PAGE PLAN — the visitor's number is a plan of BOUND
     sheets in the exported book (the ONE layout law); the story-page
     count above serves it, never replaces it. */
  boundPages?: number;
  age?: string;
}

/* THE TRUTHFUL MEASUREMENTS — the five numbers that may never be
   equated: the bound-page plan, the words woven, the story pages,
   the press's own estimate, and the honest status. */
interface BookMeasures {
  targetPages?: number;
  wordBudget?: number;
  wordsWoven?: number;
  storyPages?: number;
  layoutEstimate?: number;
  completionStatus?: string;
  exportedPages?: number;
}

/* The narrator voice each book speaks with — THE KIND LADY READER,
   one warm woman's voice for every volume (never the man). */
const BOOK_VOICE: VoiceId = "reader";

/* the plate's own weight law — the sky's raw paintings ride heavy
   (over a megabyte each); the reader dresses them down to a shelf-
   sized face before they ride to the row, so the shelf, the resume
   and the market's table all carry them lightly. */
async function dressPlate(dataUrl: string): Promise<string> {
  try {
    const img = document.createElement("img");
    img.src = dataUrl;
    await img.decode();
    const maxDim = 640;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

const ZOOM_STEPS = [15.5, 17.5, 19.5, 21.5, 24];

/* GENERATION TRANSPARENCY — the honest labels of the studio's stages.
   The word COMPLETE appears only when the gate has actually passed. */
const STAGE_LABELS: Record<string, string> = {
  drafting: "Draft in progress",
  architecture: "Story architecture complete",
  "draft-complete": "First draft complete — the press room reads it",
  editorial: "Editorial review in progress",
  revising: "Mending pass in progress",
  approved: "Manuscript approved",
  plates: "Painting the illustration plates",
  "publication-ready": "Publication-ready",
};

/* THE BOOK'S OWN FACE — the album cover the sky painted for this
   story, worn at the head of the title leaf. While the brush still
   works, a quiet empty frame stands in its place (never a spinner). */
function CoverPlate({
  src,
  painting,
}: {
  src: string | null;
  painting: boolean;
}) {
  if (!src && !painting) return null;
  return (
    <div
      className="relative mx-auto mb-6 w-full max-w-[240px] overflow-hidden rounded-xl"
      style={{
        aspectRatio: "3 / 4",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--dream-ink-faint, gray) 30%, transparent), 0 18px 50px -24px rgba(0,0,0,0.55)",
      }}
      data-testid="dream-cover-plate"
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="size-full animate-pulse bg-[color-mix(in_srgb,var(--dream-ink-faint,gray)_10%,transparent)]"
        />
      )}
    </div>
  );
}

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

/* THE THOUSAND WORDS — the loom's one input holds up to a thousand
   words now: a whisper, a scene, or a whole world spoken in full.
   The count is honest and the clamp is gentle — past the limit, the
   extra breath simply never lands. */
const WORD_LIMIT = 1000;
const countWords = (s: string) => {
  const trimmed = s.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};
const clampWords = (s: string, limit = WORD_LIMIT) => {
  const words = s.split(/\s+/).filter(Boolean);
  return words.length <= limit ? s : words.slice(0, limit).join(" ");
};

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

  /* ---- THE DRAWN BOOK — the visitor draws the story into existence ----
     The small pen button above the input opens the sketch atelier; the
     finished drawing rides into the loom and the loom answers with the
     world the hand described. The vision's own reading of the sketch
     (sketchVision) returns with the opening and rides the config, so
     every later page keeps the drawn world's law. */
  const [drawOpen, setDrawOpen] = useState(false);
  const [sketch, setSketch] = useState<string | null>(null);
  const [sketchMeta, setSketchMeta] = useState<SketchMeta | null>(null);
  const sketchRef = useRef<string | null>(null);
  const sketchMetaRef = useRef<SketchMeta | null>(null);
  const sketchVisionRef = useRef<string>("");
  /* WHAT THE DRAWING SAID — the vision's own transcription of the
     sketch into words ("a little bird", "golden coins"…), shown to
     the young maker so they see their drawing was truly understood,
     and carried into every page the loom weaves from it. */
  const [sketchSubjects, setSketchSubjects] = useState<string[]>([]);
  const sketchSubjectsRef = useRef<string[]>([]);

  /* ---- THE ZOOMED PAGE — the composer opened wide ----
     The expand button lifts the input into a full-room sheet where
     five hundred words can be seen, changed and arranged with ease;
     the minimize lays it back into its standing bar. */
  const [zoomOpen, setZoomOpen] = useState(false);

  /* THE CHANNELING'S OWN VOICE — the loom speaks while it works: a
     slow drift of small, true, strange comforts (never the word
     "loading"), one every few breaths until the book arrives. */
  const WEAVING_PHASES = useMemo(
    () => [
      t("Tuning the loom to your subject…"),
      t("Gathering threads from the far side of sleep…"),
      t("Choosing names the stars have not used yet…"),
      t("Folding the first pages of the world…"),
      t("Sharpening the ink of beginnings…"),
      t("Waking the characters one by one…"),
      t("Laying the four corners of the story…"),
      t("The first sentence is testing its own voice…"),
      t("Somewhere, a door only your book can open…"),
      t("Weather is being decided for chapter one…"),
      t("A name is being whispered for the first time ever…"),
      t("The villain is learning their reasons…"),
      t("Old prophecies are being reworded so they come true…"),
      t("Maps are drawing themselves along the story's edges…"),
      t("Two strangers are about to meet for the plot's sake…"),
      t("The ending is being kept secret from everyone, even you…"),
      t("Paper is learning patience…"),
      t("Ink is flowing uphill to reach the right page…"),
      t("Every borrowed idea is being sent home — this one is only yours…"),
      t("The quill dips. The loom breathes. The pages turn…"),
      t("Binding the book with a breath…"),
      t("The hero's shadow is being measured for its fit…"),
      t("A door is being hung where no wall stood…"),
      t("This world's moon is being given its own face…"),
      t("A whole life is being folded into one sentence…"),
      t("The first storm is learning which way to blow…"),
      t("Voices are being tuned so each stays its own…"),
      t("A secret is being buried where you will dig it up later…"),
      t("The chapter edges are being gilded by hand…"),
      t("Small wonders are being hidden between the lines…"),
      t("The road is being laid through the plot's deep forest…"),
      t("Sleep is being taught to rhyme with the story…"),
      t("Every chapter is promised its own little thunder…"),
      t("The last page is sending letters to the first…"),
      t("A lighthouse is being lit for the middle of the book…"),
      t("The cast is rehearsing their entrances in the dark…"),
      t("Time inside the book is being wound like a watch…"),
      t("The world's laws are written where only the story reads them…"),
      t("Yesterday inside the book must fit tomorrow — threads are checked…"),
      t("The margins are being swept clean of every borrowed word…"),
      t("Dust is being shaken off a never-before-told idea…"),
      t("The inkwell refills itself whenever no one is watching…"),
    ],
    [t]
  );

  /* THE ARCHITECT'S OWN VOICE — the studio's first room speaks too:
     while the story's architecture is designed (before one page is
     written) its own drift of comforts rotates here, so the waiting
     hand always sees a living sentence, never one frozen line. */
  const ARCHITECTURE_PHASES = useMemo(
    () => [
      t("Designing the story's architecture — the cast, the world, the chapter-by-chapter plan…"),
      t("The architect is weighing what the story is truly about…"),
      t("Foundations are being laid beneath the world…"),
      t("Faces and voices are being chosen for the cast…"),
      t("The road from first page to last is being mapped…"),
      t("Each chapter is being given its own honest work…"),
      t("The central conflict is being sharpened on both edges…"),
      t("Places are being named that will feel lived-in…"),
      t("The ending is being designed before the beginning is written…"),
      t("Secrets are being planted where the chapters will find them…"),
      t("The book's spine is being set straight and true…"),
      t("The blueprint is nearly drawn — the pens are next…"),
    ],
    [t]
  );

  /* ---- the book ---- */
  const [meta, setMeta] = useState<BookMeta | null>(null);
  /* THE PUBLICATION HAND — the finished volume carried to the hall */
  const [publishOpen, setPublishOpen] = useState(false);
  /* THE TRUTHFUL MEASUREMENTS — carried beside the book, spoken in
     the reader, the reveal and the binding (never a false COMPLETE) */
  const [measures, setMeasures] = useState<BookMeasures>({});
  const measuresRef = useRef<BookMeasures>({});
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
  /* ---- THE BACKGROUND LOOM — the whole book, rendered while read ----
     The loom weaves the whole plan in the background from the moment
     the first pages land, stride by stride, while the visitor reads:
     the honest count stands beside the reading, and the visitor's own
     hands (pause · cancel · resume) govern it between strides. */
  const [loomMode, setLoomMode] = useState<LoomMode>("off");
  const loomPausedRef = useRef(false);
  const loomCancelRef = useRef(false);
  const loomRunRef = useRef(0);
  /* the purse's own rest — a stride the wallet could not weigh parks
     the loom honestly (never an error storm): the visitor brings more
     light and the same loom resumes where it stood. */
  const [loomWalletStop, setLoomWalletStop] = useState(false);
  /* ---- the scales at the door — the honest price of this weaving ---- */
  const [estimate, setEstimate] = useState<BookEstimate | null>(null);
  const [spendable, setSpendable] = useState<number | null>(null);
  const [pricingEnforced, setPricingEnforced] = useState(false);
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
  /* ---- THE STUDIO — the open tunnel's honest workflow ----
     The Mirror Entity writes alone; the code gate measures the binding
     in technical terms only; the director paints. Every stage is
     spoken honestly — COMPLETE exists only after the gate. */
  type StudioStage =
    | "drafting"
    | "architecture"
    | "draft-complete"
    | "editorial"
    | "revising"
    | "approved"
    | "plates"
    | "publication-ready";
  const [studioStage, setStudioStage] = useState<StudioStage>("drafting");
  const [gate, setGate] = useState<{ pass: boolean; items: GateItem[] } | null>(null);
  const [artPlan, setArtPlan] = useState<{
    style: string;
    plates: {
      page: number;
      title?: string;
      scene: string;
      characters?: string[];
      setting?: string;
      mood?: string;
      composition?: string;
    }[];
  } | null>(null);
  const [paintedPlates, setPaintedPlates] = useState<
    { page?: number; title?: string; url: string }[]
  >([]);
  const [plateProgress, setPlateProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [pressRoomBusy, setPressRoomBusy] = useState(false);
  /* the studio's mirrors — the refs the calls read and carry back */
  const gateRef = useRef<{ pass: boolean; items: GateItem[] } | null>(null);
  const artPlanRef = useRef<Record<string, unknown> | null>(null);
  const artRef = useRef<{ style?: string; plates?: { page?: number; title?: string; url: string }[] } | null>(null);
  const pressRoomBusyRef = useRef(false);
  /* the stage's own mirror — snapshots read it without re-rendering */
  const studioStageRef = useRef<StudioStage>("drafting");
  studioStageRef.current = studioStage;
  /* the binding press — while the PDF is gathered */
  const [binding, setBinding] = useState(false);
  /* the shelf's own mark — the library row this volume keeps (a state,
     not only a ref, so the publish hand can rise with the book) */
  const [savedBookId, setSavedBookId] = useState("");

  const pagesRef = useRef<WeavePage[]>([]);
  const threadsRef = useRef("");
  const metaRef = useRef<BookMeta | null>(null);
  const endedRef = useRef(false);
  const weavingRef = useRef(false);
  /* the channeling's own hand — a confirmed X raises the token and
     every later checkpoint of the open breath yields to it */
  const channelTokenRef = useRef(0);
  const [pendingOpen, setPendingOpen] = useState(false);
  /* the X of the weaving room — one press arms it, a second confirms */
  const [cancelArmed, setCancelArmed] = useState(false);
  const rewritesRef = useRef<string[]>([]);
  const configRef = useRef<{
    age: string;
    tale: string;
    volume: string;
    level: string;
    topic: string;
    vein: "ephemeral" | "ground";
    pageCount: number;
    /* the vision's own reading of the drawn sketch — rides the config
       so every later page keeps the drawn world's law */
    sketchVision?: string;
    /* what the drawing was seen to hold — the transcribed elements
       (a bird, coins…) that name the book's own imagery */
    sketchSubjects?: string[];
  }>({ age, tale, volume, level, topic, vein, pageCount });
  /* THE BOOK'S OWN FACE — the album cover the sky's own Gemini paints
     for every woven story (the visitor named it): painted a breath
     after the open lands, worn on the title leaf, the shelf and the
     market's table alike. */
  const [cover, setCover] = useState<string | null>(null);
  const coverRef = useRef<string | null>(null);
  const [coverPainting, setCoverPainting] = useState(false);
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
    configRef.current = {
      age,
      tale,
      volume,
      level,
      topic,
      vein,
      pageCount,
      /* the drawn world's law rides every weave once the vision has
         spoken it — the sync never drops what the sketch earned */
      ...(sketchVisionRef.current
        ? { sketchVision: sketchVisionRef.current }
        : {}),
      ...(sketchSubjectsRef.current.length
        ? { sketchSubjects: sketchSubjectsRef.current }
        : {}),
    };
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

  /* the phrases the weaving room speaks right now — the architect's
     while the blueprint is drawn, the loom's once the pages flow */
  const weavingPhrases =
    studioStage === "architecture" ? ARCHITECTURE_PHASES : WEAVING_PHASES;

  /* drift the weaving phrases while the loom works — whichever voice
     is the room's own right now (the architect's or the loom's) */
  useEffect(() => {
    if (stage !== "weaving" || weaveError) return;
    const iv = setInterval(
      () => {
        /* the hidden loom weaves no phrases — the beat waits for eyes */
        if (isPageHidden()) return;
        setPhaseIdx((i) => (i + 1) % weavingPhrases.length);
      },
      2600
    );
    return () => clearInterval(iv);
  }, [stage, weaveError, weavingPhrases]);

  /* THE ZOOMED PAGE'S OWN ESCAPE — the keyboard lays the wide page
     back into the quiet bar as surely as the minimize does */
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

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
      setSavedBookId(r.bookId);
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
      /* the volume's own face returns with it (older volumes rest bare) */
      coverRef.current = r.cover ?? null;
      setCover(r.cover ?? null);
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
        /* the drawn world's law returns with the volume when the shelf
           kept it (volumes woven before the sketch atelier rest bare) */
        ...(typeof r.config.sketchVision === "string" && r.config.sketchVision
          ? { sketchVision: r.config.sketchVision }
          : {}),
        ...(Array.isArray(r.config.sketchSubjects)
          ? { sketchSubjects: r.config.sketchSubjects }
          : {}),
      };
      sketchVisionRef.current =
        typeof r.config.sketchVision === "string" ? r.config.sketchVision : "";
      sketchSubjectsRef.current = Array.isArray(r.config.sketchSubjects)
        ? r.config.sketchSubjects
            .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
            .slice(0, 12)
        : [];
      setSketchSubjects(sketchSubjectsRef.current);
      setAge(r.config.age);
      setTale(r.config.tale);
      setVolume(r.config.volume);
      setLevel(r.config.level ?? "");
      setTopic(r.config.topic);
      setPageCount(0);
      setPages(pagesRef.current);
      setMeta(metaRef.current);
      setEnded(r.ended);
      /* THE STUDIO RETURNS — the publishing state rides home with the
         volume: its gate report, its plates and the honest stage it
         stood on when it was left */
      gateRef.current =
        r.gate && typeof r.gate === "object"
          ? (r.gate as { pass: boolean; items: GateItem[] })
          : null;
      setGate(gateRef.current);
      artRef.current =
        r.art && typeof r.art === "object"
          ? (r.art as { style?: string; plates?: { page?: number; title?: string; url: string }[] })
          : null;
      setPaintedPlates(artRef.current?.plates ?? []);
      artPlanRef.current =
        r.artPlan && typeof r.artPlan === "object"
          ? (r.artPlan as Record<string, unknown>)
          : null;
      const restoredPlan = artPlanRef.current as {
        style?: string;
        plates?: { page: number; title?: string; scene: string; characters?: string[]; setting?: string; mood?: string; composition?: string }[];
      } | null;
      setArtPlan(
        restoredPlan && Array.isArray(restoredPlan.plates) && restoredPlan.plates.length
          ? { style: String(restoredPlan.style ?? ""), plates: restoredPlan.plates }
          : null
      );
      const restoredStage = (typeof r.stage === "string" ? r.stage : "") as StudioStage;
      const stageOk: StudioStage[] = [
        "drafting",
        "architecture",
        "draft-complete",
        "editorial",
        "revising",
        "approved",
        "plates",
        "publication-ready",
      ];
      const stage: StudioStage = stageOk.includes(restoredStage)
        ? restoredStage
        : r.ended
          ? "draft-complete"
          : "drafting";
      setStudioStage(stage);
      studioStageRef.current = stage;
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
      ...(coverRef.current ? { cover: coverRef.current } : {}),
      /* THE STUDIO — the publishing state rides the shelf with the book */
      ...(gateRef.current ? { gate: gateRef.current } : {}),
      ...(artRef.current ? { art: artRef.current } : {}),
      ...(artPlanRef.current ? { artPlan: artPlanRef.current } : {}),
      stage: studioStageRef.current,
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
          cover?: string | null;
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
              /* THE STUDIO — the publishing state rides home */
              ...(c.gate && typeof c.gate === "object" ? { gate: c.gate } : {}),
              ...(c.art && typeof c.art === "object" ? { art: c.art } : {}),
              ...(c.artPlan && typeof c.artPlan === "object" ? { artPlan: c.artPlan } : {}),
              ...(typeof c.stage === "string" ? { stage: c.stage } : {}),
              ...(typeof e.cover === "string" && e.cover
                ? { cover: e.cover }
                : {}),
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
        /* THE STUDIO — the publishing state returns with the volume */
        ...(v.gate ? { gate: v.gate } : {}),
        ...(v.art ? { art: v.art } : {}),
        ...(v.artPlan ? { artPlan: v.artPlan } : {}),
        ...(v.stage ? { stage: v.stage } : {}),
        ...(v.cover ? { cover: v.cover } : {}),
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
  /* THE COVER'S OWN BRUSH — one breath after the open lands, the sky
     paints the volume's album cover from its own title, sigil and
     subject; the plate rides home to the library entry (PATCH), so
     the shelf, the reader and the market all wear the same face. */
  const paintCover = useCallback(async () => {
    const m = metaRef.current;
    if (!m || coverRef.current || coverPainting) return;
    setCoverPainting(true);
    try {
      const res = await fetch("/api/dream-book/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: m.title,
          sigil: m.sigil,
          axiom: m.axiom,
          subject: configRef.current.topic,
          vein: configRef.current.vein,
          /* a drawn book wears the drawing's world on its face — the
             vision's reading AND the exact elements it transcribed */
          ...(sketchVisionRef.current
            ? {
                sketchHint:
                  sketchSubjectsRef.current.length
                    ? `${sketchVisionRef.current} The elements seen in the drawing: ${sketchSubjectsRef.current.join(", ")}.`
                    : sketchVisionRef.current,
              }
            : {}),
          language,
        }),
        signal: AbortSignal.timeout(110000),
      });
      const data = (await res.json().catch(() => null)) as {
        cover?: string;
      } | null;
      if (res.ok && typeof data?.cover === "string" && data.cover.startsWith("data:image/")) {
        const dressed = await dressPlate(data.cover);
        coverRef.current = dressed;
        setCover(dressed);
        /* the shelf and the market read the face from the entry's own
           column — one quiet PATCH, and every table wears the plate */
        if (bookIdRef.current) {
          void fetch("/api/library", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: bookIdRef.current, cover: dressed }),
          }).catch(() => {});
        }
      }
    } catch {
      /* the plate may rest unpainted — the book stands whole without it */
    } finally {
      setCoverPainting(false);
    }
  }, [language, coverPainting]);

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
      /* a fresh conjuring arrives bare — the last volume's face never
         rides onto the new book's title leaf */
      if (phase === "open") {
        coverRef.current = null;
        setCover(null);
        /* a fresh conjuring arrives bare — the last volume's plan and
           its truthful measurements never ride onto the new book */
        measuresRef.current = {};
        setMeasures({});
        /* and the last drawing's transcription never rides either — a
           book summoned without a brush is not told it was drawn */
        sketchSubjectsRef.current = [];
        setSketchSubjects([]);
      }

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
               the loom lands the whole story inside it. When the visitor
               chose none but the architect planned one, the plan rides. */
            pages:
              configRef.current.pageCount > 0
                ? configRef.current.pageCount
                : undefined,
            /* the exact second of this conjuring — a seed that has never
               been woven and will never be woven again */
            seed: strideSeed,
          },
          /* THE VISITOR'S DRAWING — the book drawn into existence by
             hand: the sketch rides only the opening breath, and the
             vision's reading of it (sketchVision) carries the drawn
             world into every page after */
          ...(phase === "open" && sketchRef.current
            ? {
                sketch: sketchRef.current,
                ...(sketchMetaRef.current
                  ? { sketchMeta: sketchMetaRef.current }
                  : {}),
              }
            : {}),

          ...carrying,
          threads: threadsRef.current || undefined,
          /* THE LEDGER (V10) — the volume's own bones ride back */
          ...(phase !== "open" && ledgerRef.current
            ? { ledger: ledgerRef.current }
            : {}),
          /* THE SPAN — the one-page threshold, the seven-page breath, or
             the whole-book reveal's own wider stride (span 2 is every
             phase's own resting pair — it never rides) */
          ...(span !== 2 ? { span } : {}),
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
        /* THE WEAVE'S OWN DEADLINE — the retries compose: a hanging
           attempt, a 5xx retry and a dropped-crossing retry could once
           chain past nine minutes and hold the loom longer than any
           waiting hand. One hard deadline bounds the whole breath: the
           loom is never held beyond timeoutMs + a grace of 45s, so
           every waiter (the whole-book reveal above all) can outlast
           any single weave and take its turn. */
        const deadline = Date.now() + timeoutMs + 45_000;
        const attempt = () => {
          const remain = deadline - Date.now();
          if (remain <= 15_000) throw new Error("weave-deadline");
          return fetch("/api/dream-book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            signal: AbortSignal.timeout(remain),
          });
        };
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
        /* THE PURSE'S OWN REST — a stride the wallet could not weigh
           parks the loom gently (never an error storm): the pages it
           never wove never left the visitor's purse, and the same loom
           resumes where it stood once more light arrives. The open
           breath with a dry purse simply ends the conjuring honestly. */
        if (res.status === 402) {
          loomPausedRef.current = true;
          setLoomMode((m) => (m === "off" ? m : "paused"));
          setLoomWalletStop(true);
          toast.error(t("The purse rests — the loom pauses for more light"), {
            description: t(
              "The pages it never wove never left your purse — bring more light and the weaving continues."
            ),
          });
          return false;
        }
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
          setSavedBookId(data.libraryId);
        }

        /* THE LEDGER — the loom's updated memory of the volume */
        if (data.ledger && typeof data.ledger === "object") {
          ledgerRef.current = data.ledger as BookLedger;
          if (bookIdRef.current) {
            ledgerByBookRef.current.set(bookIdRef.current, ledgerRef.current);
          }
        }
        /* THE HONEST AUDIT — carried privately from the close */

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
          /* THE DRAWN WORLD'S LAW — the vision's reading of the sketch
             enters the keeping: it rides the config into every later
             page, so the book the visitor drew stays the book they read */
          if (typeof data.sketchVision === "string" && data.sketchVision.trim()) {
            sketchVisionRef.current = data.sketchVision.trim().slice(0, 1200);
            configRef.current = {
              ...configRef.current,
              sketchVision: sketchVisionRef.current,
            };
          }
          /* WHAT THE DRAWING SAID — the transcribed elements (a bird,
             coins…) enter the keeping too: shown to the young maker,
             spoken to the loom, worn by the cover */
          if (Array.isArray(data.sketchSubjects) && data.sketchSubjects.length) {
            sketchSubjectsRef.current = data.sketchSubjects
              .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
              .map((s) => s.trim().slice(0, 60))
              .slice(0, 12);
            setSketchSubjects(sketchSubjectsRef.current);
            configRef.current = {
              ...configRef.current,
              ...(sketchSubjectsRef.current.length
                ? { sketchSubjects: sketchSubjectsRef.current }
                : {}),
            };
          }
          metaRef.current = {
            title: data.title ?? "The Unnamed Book",
            subtitle: data.subtitle ?? "",
            sigil: typeof data.sigil === "string" ? data.sigil : "",
            axiom: typeof data.axiom === "string" ? data.axiom : "",
            dedication: data.dedication ?? "",
            totalPages: data.totalPages ?? 96,
            /* THE BOUND-PAGE PLAN — the plan the book was born with */
            ...(typeof data.boundPages === "number"
              ? { boundPages: data.boundPages }
              : {}),
            ...(typeof data.age === "string" ? { age: data.age } : {}),
          };
          setMeta(metaRef.current);
          if (
            data.measurements &&
            typeof data.measurements === "object"
          ) {
            measuresRef.current = {
              ...measuresRef.current,
              ...(data.measurements as BookMeasures),
            };
            setMeasures(measuresRef.current);
          }
          /* THE BOOK'S OWN FACE — the cover brush starts the moment the
             volume has a name: the plate paints while the reader reads */
          void paintCover();
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
        /* THE TRUTHFUL MEASUREMENTS — every stride reports the real
           numbers: words woven, story pages, the press's estimate and
           the honest status (never a false COMPLETE). THE MONOTONIC
           LAW — strides may land out of order (the reader's prefetch
           races the reveal), so the words woven may only ever climb:
           a stale response can never unread what the loom has
           already written. */
        if (
          data.measurements &&
          typeof data.measurements === "object"
        ) {
          const incoming = data.measurements as BookMeasures;
          const prev = measuresRef.current;
          const woven =
            Math.max(prev.wordsWoven ?? 0, incoming.wordsWoven ?? 0) ||
            incoming.wordsWoven;
          measuresRef.current = {
            ...prev,
            ...incoming,
            ...(woven ? { wordsWoven: woven } : {}),
          };
          setMeasures(measuresRef.current);
        }
        /* GENERATION TRANSPARENCY — the stage the studio speaks */
        if (typeof data.stage === "string") {
          setStudioStage(data.stage as StudioStage);
        }
        if (phase === "close") {
          /* THE HONEST SEAL — the room calls the book finished only when
             the loom's examiner allowed the closing: a blocking verdict
             keeps the volume open, never wearing a false "The End" */
          const honestEnd = data.ended !== false;
          endedRef.current = honestEnd;
          setEnded(honestEnd);
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
    [language, t, flushInkEdit, paintCover]
  );

  /* ---------------- THE STUDIO'S OWN HAND ----------------
     Every studio room (architecture, press, mender, gallery, gate)
     speaks through one door: the same endpoint, its own payload, the
     whole book's state mirrored faithfully so nothing is lost between
     the rooms. */
  const studioFetch = useCallback(
    async (
      payload: Record<string, unknown>,
      timeoutMs = 290000
    ): Promise<Record<string, unknown> | null> => {
      const body = JSON.stringify({
        language,
        config: { ...configRef.current },
        /* the book's own keeping — every studio call can persist */
        ...(bookIdRef.current
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
          : {}),
        ...(threadsRef.current ? { threads: threadsRef.current } : {}),
        ...(ledgerRef.current ? { ledger: ledgerRef.current } : {}),
        /* the studio's own witnesses ride home with every call */
        ...(artRef.current ? { art: artRef.current } : {}),
        ...payload,
      });
      const attempt = () =>
        fetch("/api/dream-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(timeoutMs),
        });
      let res: Response;
      try {
        res = await attempt();
        if (res.status >= 500) res = await attempt();
      } catch {
        try {
          res = await attempt();
        } catch {
          return null;
        }
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(t("A studio room fell silent."), {
          description: String(data?.error ?? t("Breathe, then try again.")),
        });
        return null;
      }
      return data;
    },
    [language, t]
  );

  /* ---------------- THE HONEST GATE → PLATES ----------------
     One unbroken workflow after the draft rests: the CODE-MEASURED
     gate admits the manuscript on technical terms only (chapter
     seams, clean characters, the honest word measure — no verdict on
     taste, no rewriting), the director paints the plates from the
     actual scenes. The stage is spoken the whole way. */
  const runPressRoom = useCallback(async () => {
    if (pressRoomBusyRef.current || !metaRef.current) return;
    pressRoomBusyRef.current = true;
    setPressRoomBusy(true);
    try {
      /* THE ACCEPTANCE GATE — the word COMPLETE is earned in code */
      setStudioStage("draft-complete");
      const sealData = await studioFetch({ phase: "seal" });
      if (sealData?.gate && typeof sealData.gate === "object") {
        gateRef.current = sealData.gate as { pass: boolean; items: GateItem[] };
        setGate(gateRef.current);
      }
      const gatePassed =
        gateRef.current?.pass === true ||
        sealData?.stage === "publication-ready";
      /* THE PLATES — painted only for an admitted book */
      if (gatePassed) {
        setStudioStage("plates");
        const artData = await studioFetch({ phase: "art" });
        const plan = artData?.artPlan as
          | { style: string; plates: { page: number; title?: string; scene: string; characters?: string[]; setting?: string; mood?: string; composition?: string }[] }
          | undefined;
        if (plan?.plates?.length) {
          artPlanRef.current = plan;
          setArtPlan(plan);
          setPlateProgress({ done: 0, total: plan.plates.length });
          for (let i = 0; i < plan.plates.length; i++) {
            const plate = plan.plates[i];
            const pData = await studioFetch({
              phase: "plate",
              plate: { ...plate, style: plan.style },
              art: artRef.current ?? undefined,
            });
            if (pData?.art && typeof pData.art === "object") {
              artRef.current = pData.art as { style?: string; plates?: { page?: number; title?: string; url: string }[] };
              setPaintedPlates(artRef.current.plates ?? []);
            }
            setPlateProgress({ done: i + 1, total: plan.plates.length });
          }
        }
        setStudioStage("publication-ready");
      }
    } finally {
      pressRoomBusyRef.current = false;
      setPressRoomBusy(false);
      setPlateProgress(null);
    }
  }, [studioFetch]);

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

  /* ---------------- THE BACKGROUND LOOM ----------------
     The whole book, rendered while it is read: one quiet loop that
     strides six pages at a time through the plan from the moment the
     reading begins, never fighting the reader's own crank (the loom
     door is one — the loop simply waits for a held breath to land),
     stopping honestly at the plan's end, and governed between strides
     by the visitor's own hands: pause (parked, resumable), cancel
     (resting for good — every woven page stays), resume. */
  const startBackgroundLoom = useCallback(async () => {
    const myRun = ++loomRunRef.current;
    loomPausedRef.current = false;
    loomCancelRef.current = false;
    setLoomWalletStop(false);
    setLoomMode("weaving");
    const sleep = (ms: number) =>
      new Promise<void>((r) => window.setTimeout(r, ms));
    while (!loomCancelRef.current && !endedRef.current) {
      if (loomRunRef.current !== myRun) return; /* a newer loom took over */
      if (loomPausedRef.current) {
        await sleep(400);
        continue;
      }
      const plan = metaRef.current?.totalPages ?? 0;
      const have = pagesRef.current.length;
      if (!plan || have >= plan) break; /* the plan stands woven */
      if (weavingRef.current) {
        /* the reader's own crank holds the loom — one breath, then again */
        await sleep(300);
        continue;
      }
      await weave("next", have + 1, 6, 240000, "batch");
      await sleep(350);
    }
    if (loomRunRef.current === myRun && !loomCancelRef.current) {
      setLoomMode("off");
    }
  }, [weave]);

  /* the visitor's own hands on the background loom — each lands
     BETWEEN strides, so a page mid-weave always finishes honestly */
  const pauseBackgroundLoom = useCallback(() => {
    loomPausedRef.current = true;
    setLoomMode((m) => (m === "off" ? m : "paused"));
  }, []);

  const resumeBackgroundLoom = useCallback(() => {
    loomPausedRef.current = false;
    setLoomWalletStop(false);
    setLoomMode((m) => (m === "off" ? "weaving" : m));
    /* a loom that had fully rested rises again */
    void startBackgroundLoom();
  }, [startBackgroundLoom]);

  const cancelBackgroundLoom = useCallback(() => {
    loomCancelRef.current = true;
    loomRunRef.current += 1; /* any parked loop lets go at once */
    setLoomMode("off");
    setLoomWalletStop(false);
  }, []);

  /* the scales' own breath — the honest price of the weaving, read
     from the house's scales whenever the shapes of the ask change */
  useEffect(() => {
    if (stage !== "atelier") return;
    const handle = window.setTimeout(() => {
      fetch("/api/dream-book/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            volume,
            level,
            age,
            tale,
            topic: topicDraft,
            ...(typeof configRef.current.pageCount === "number" &&
            configRef.current.pageCount > 0
              ? { pages: configRef.current.pageCount }
              : {}),
          },
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { estimate?: BookEstimate; spendable?: number; enforced?: boolean } | null) => {
          if (d?.estimate) setEstimate(d.estimate);
          setSpendable(typeof d?.spendable === "number" ? d.spendable : null);
          setPricingEnforced(d?.enforced !== false);
        })
        .catch(() => undefined);
    }, 450);
    return () => window.clearTimeout(handle);
  }, [stage, volume, level, age, tale, topicDraft]);

  const openBook = useCallback(async () => {
    if (weavingRef.current || pendingOpen) return;
    /* the channeling's own token — a confirmed X raises it, and every
       later checkpoint in this breath yields to the visitor's hand */
    const token = ++channelTokenRef.current;
    const cancelled = () => token !== channelTokenRef.current;
    setWeaveError(false);
    setCancelArmed(false);
    setStage("weaving");
    setPhaseIdx(0);
    setPendingOpen(true);
    /* THE TWO-PAGE THRESHOLD — the loom opens the volume with its
       first TWO pages, so the visitor steps into the book with a real
       opening in hand and reads while the loom keeps channeling the
       whole plan in the background (the background loom rises the
       moment the reading begins). */
    const ok = await weave("open", 1, 2, 240000);
    if (cancelled()) return;
    setPendingOpen(false);
    if (ok) {
      setStage("reading");
      setPageIdx(0);
      setSlideDir(1);
      /* THE BACKGROUND LOOM RISES — the whole plan channels stride by
         stride while the visitor reads the opening. */
      void startBackgroundLoom();
    } else {
      /* stay in the weaving room — it now speaks for itself */
      setWeaveError(true);
    }
  }, [weave, studioFetch, pendingOpen, startBackgroundLoom]);

  /* the one input — up to five hundred words, or a drawing, or both.
     Whatever is spoken (or drawn), its send begins the channeling:
     a totally authentic, never-repeating volume, woven in real time */
  const channelBook = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = clampWords(topicDraft.trim());
      /* the one gate — the words themselves (a drawing may fly alone).
         When no thread is held, the loom chooses its own (the telling's
         middle depth stands in): nothing more is ever forced, nothing
         blocks the ask. */
      if ((!text && !sketchRef.current) || weavingRef.current) return;
      setTopicDraft("");
      setTopic(text);
      /* the drawn book's own handoff — the sketch leaves the composer
         and enters the loom; its vision's law will ride every page */
      setSketch(null);
      setSketchMeta(null);
      setDrawOpen(false);
      setZoomOpen(false);
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

  /* THE PLATES — a painted plate rides above the page it illustrates */
  const plateForPage = useCallback(
    (n: number) => paintedPlates.find((p) => p.page === n) ?? null,
    [paintedPlates]
  );

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
    /* the background loom lets go at once — a new conjuring takes the room */
    loomCancelRef.current = true;
    loomRunRef.current += 1;
    setLoomMode("off");
    setLoomWalletStop(false);
    pagesRef.current = [];
    threadsRef.current = "";
    metaRef.current = null;
    endedRef.current = false;
    rewritesRef.current = [];
    bookIdRef.current = "";
    ledgerRef.current = null;
    /* THE STUDIO RESTS — every room emptied for the next book */
    gateRef.current = null;
    artPlanRef.current = null;
    artRef.current = null;
    pressRoomBusyRef.current = false;
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
    setWholeMode(false);
    setWholeReveal(null);
    setStudioStage("drafting");
    setGate(null);
    setArtPlan(null);
    setPaintedPlates([]);
    setPlateProgress(null);
    setPressRoomBusy(false);
    setStage("atelier");
  }, [stopNarration, keepCurrent, clearDreamResume]);

  const weaveOnward = useCallback(async () => {
    const ok = await weave("extend", pagesRef.current.length + 1);
    if (ok) setPageIdx((s) => s + 1);
  }, [weave]);

  const letRest = useCallback(async () => {
    const ok = await weave("close", pagesRef.current.length + 1);
    if (ok) {
      setPageIdx((s) => s + 1);
      /* THE PRESS ROOM OPENS — the draft is complete; now it is
         judged, mended, gated and painted, one honest stage at a time */
      void runPressRoom();
    }
  }, [weave, runPressRoom]);

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
    if (wholeReveal || !metaRef.current) {
      console.warn("[reveal] guard: wholeReveal=", !!wholeReveal, "meta=", !!metaRef.current);
      return;
    }
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
      /* the wait now covers a weave's own worst breath (the hard
         deadline bounds it at timeoutMs + 45s) — a hung chain can
         never outlast the reveal's patience again */
      for (let wait = 0; wait < 3400 && weavingRef.current; wait++) {
        if (cancelRevealRef.current) {
          console.warn("[reveal] exit: cancelled during queued wait");
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (weavingRef.current || cancelRevealRef.current) {
        console.warn("[reveal] exit: loom held=", weavingRef.current, "cancel=", cancelRevealRef.current);
        return;
      }
      started = true;
      /* the loom's own patience — before every stride, the reveal lets
         any breath already in the loom land (the reader's prefetch),
         so a stride is never swallowed by a held door. The same full
         stride lifetime is honored here. */
      const waitForLoom = async () => {
        for (let wait = 0; wait < 3400 && weavingRef.current; wait++) {
          if (cancelRevealRef.current) return false;
          await new Promise((r) => setTimeout(r, 200));
        }
        return !weavingRef.current && !cancelRevealRef.current;
      };
      /* a generous guard: two hundred strides are more than any
         volume can ask for — the loop always ends by the book's own
         plan, the loom's honest silence, or the visitor's hand */
      for (let stride = 0; stride < 200; stride++) {
        if (cancelRevealRef.current) {
          console.warn("[reveal] exit: cancelled between strides");
          break;
        }
        if (!(await waitForLoom())) {
          console.warn("[reveal] exit: waitForLoom false, weaving=", weavingRef.current, "cancel=", cancelRevealRef.current);
          break;
        }
        const have = pagesRef.current.length;
        const plan = metaRef.current?.totalPages ?? total;
        if (endedRef.current) {
          console.warn("[reveal] exit: already ended");
          break;
        }
        if (!cancelRevealRef.current) {
          setWholeReveal({ woven: have, total: plan });
        }
        /* THE OVERSHOOT LAW — a wide stride can land past the plan
           (six open pages, then eight more: 14 against a plan of 12).
           The old guard broke here and the book never received its
           Seal of Closing. Now the seal lands wherever the story
           stands: at or past the plan, the close is woven.
           THE WORD BUDGET'S OWN LAW — the plan's pages are not the
           narrative length: the close is woven only when the pages
           stand AND the manuscript holds near its word budget (the
           bound-page plan's own measure). A book whose leaves ran
           lean keeps weaving — the seal is never asked to bless a
           volume the press would bind short of its promise. The
           stride cap keeps the law honest when the sky keeps
           running light: eight strides past the plan, the close is
           attempted anyway and the gate speaks its true verdict. */
        const budget = measuresRef.current.wordBudget ?? 0;
        const wordsNow = measuresRef.current.wordsWoven ?? 0;
        const wordsMet =
          !(budget > 0) || wordsNow >= Math.round(budget * 0.88);
        if (have >= plan && (wordsMet || have >= plan + 48)) {
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
        /* the draft rests — the press room opens: judged, mended,
           gated and painted, one honest stage at a time */
        if (endedRef.current) void runPressRoom();
      }
    }
  }, [weave, wholeReveal, stopNarration, flushInkEdit, runPressRoom]);

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
     into one ink PDF and handed to the visitor's own hands. THE HONEST
     LABEL — the press's verified sheet count is spoken as measured;
     a manuscript that has not passed its gate binds as a DRAFT, never
     wearing a completion it has not earned. */
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
      const boundPdf = await downloadBookPdf(
        {
          title: meta.title,
          subtitle: meta.subtitle,
          sigil: meta.sigil,
          axiom: meta.axiom,
          dedication: meta.dedication,
          totalPages: meta.totalPages,
          /* the seal of closing is bound only when the volume truly
             concluded — a book still being woven never carries a
             false "The End" */
          concluded: endedRef.current,
          /* the sheet's own typography — the age's layout law */
          age: meta.age,
        },
        bound
      );
      /* THE EXPORT'S OWN TRUTH — the verified count against the plan:
         a book short of its bound-page plan is labeled a draft, and
         the label speaks the numbers, never a vague comfort */
      const target = measuresRef.current.targetPages ?? meta.boundPages ?? 0;
      const wordsBound = boundPdf.words;
      const isDraft =
        !endedRef.current || (target > 0 && boundPdf.pdfPages < target * 0.85);
      /* the shelf of bound works — the volume keeps itself on the
         visitor's own device so the profile's downloads can hand it
         back, bound again, whenever it is wanted */
      recordDownload({
        title: meta.title,
        subtitle: meta.subtitle,
        pages: boundPdf.pdfPages,
        ...(target > 0 ? { targetPages: target } : {}),
        words: wordsBound,
        contentHash: boundPdf.contentHash,
        draft: isDraft,
        meta: {
          title: meta.title,
          subtitle: meta.subtitle,
          sigil: meta.sigil,
          axiom: meta.axiom,
          dedication: meta.dedication,
          totalPages: meta.totalPages,
          ...(meta.age ? { age: meta.age } : {}),
        },
        pageList: bound,
      });
      if (isDraft && target > 0) {
        toast.success(
          t("Draft bound — {n} of {y} pages, {w} words", {
            n: boundPdf.pdfPages,
            y: target,
            w: wordsBound,
          }),
          {
            description: t(
              "The telling is still being woven or awaits its seal — bind again once the loom rests."
            ),
          }
        );
      } else {
        toast.success(
          t("The book is bound — {n} pages, {w} words", {
            n: boundPdf.pdfPages,
            w: wordsBound,
          })
        );
      }
      /* the export's verified count joins the truthful measurements */
      measuresRef.current = {
        ...measuresRef.current,
        exportedPages: boundPdf.pdfPages,
      };
      setMeasures(measuresRef.current);
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

  /* THE MIRROR BRIDGE HAS LEFT THE BOOK — the reader asked the Mirror's
     small hand away from the reading stage's corner (the work-at-hand
     context builder rests with it). */
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
    setCancelArmed(false);
    setPendingOpen(false);
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
    "focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground sm:size-9";

  /* ================================================================ */
  /*  THE ATELIER                                                      */
  /* ================================================================ */

  const atelier = (
    <>
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
          Above the words now stand the hand's own small doors — the
          DRAW atelier (the book drawn into existence), the ZOOMED page
          (the input opened wide), the honest word count of the
          thousand words, and the sketch chip when a drawing rides. */}
      <div className="shrink-0 px-3 pb-3 pt-1 sm:px-4">
        {/* WHAT THE DRAWING SAID — the vision's own transcription of the
            young maker's sketch, spoken back as small word-chips: the
            child sees their bird, their coins, their world was truly
            SEEN, and knows the book grows from their own hand. */}
        {sketchSubjects.length > 0 && (
          <div
            className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-2"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
            }}
            data-testid="dream-perception"
          >
            <Sparkles
              className="size-3.5 shrink-0 text-[var(--scope-a)]"
              aria-hidden="true"
            />
            <span className="text-[12px] italic text-foreground/75">
              {t("We saw in your drawing:")}
            </span>
            {sketchSubjects.map((s, i) => (
              <span
                key={`${i}-${s}`}
                className="rounded-full border border-border/70 bg-card/60 px-2 py-0.5 font-[family-name(var(--font-literata))] text-[12px] italic text-foreground/85"
              >
                {s}
              </span>
            ))}
            <span className="text-[12px] italic text-muted-foreground/70">
              {t("— your book grows from these.")}
            </span>
          </div>
        )}
        {/* THE SCALES AT THE DOOR — the honest price of this weaving,
            spoken BEFORE the loom begins: pages × depth × the reader's
            own page measure. The loom draws stride by stride as it
            weaves, so a paused or resting visitor keeps every credit
            the unwoven pages would have cost. */}
        {pricingEnforced && estimate && (
          <div
            className="mb-2 w-full rounded-xl border px-3 py-2"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 22%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 6%, transparent)",
            }}
            data-testid="dream-estimate"
          >
            <p className="mono-label flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="size-3 text-[var(--scope-a)]" aria-hidden="true" />
              {t("This weaving, by its own scales:")}
              <span className="text-foreground">
                {estimate.creditsMin === estimate.creditsMax
                  ? t("≈ {n} credits", { n: estimate.creditsMin })
                  : t("≈ {min}–{max} credits", {
                      min: estimate.creditsMin,
                      max: estimate.creditsMax,
                    })}
              </span>
              <span className="text-muted-foreground/80">
                {estimate.pagesMin === estimate.pagesMax
                  ? t("{pages} pages · depth {depth}", {
                      pages: estimate.pagesMin,
                      depth: estimate.depthKey,
                    })
                  : t("{min}–{max} pages · depth {depth}", {
                      min: estimate.pagesMin,
                      max: estimate.pagesMax,
                      depth: estimate.depthKey,
                    })}
              </span>
              {typeof spendable === "number" && (
                <span
                  className={cn(
                    "ml-auto",
                    spendable < estimate.creditsMin
                      ? "text-[var(--destructive)]"
                      : "text-muted-foreground/80"
                  )}
                >
                  {t("Your purse: {n} credits", { n: spendable })}
                </span>
              )}
            </p>
            <p className="mt-1 text-[12px] italic leading-relaxed text-muted-foreground/85">
              {t(
                "Weighed page by page as the loom weaves — pause or let it rest anytime, and the unwoven pages never leave your purse."
              )}
            </p>
          </div>
        )}
        <form
          onSubmit={channelBook}
          id="dream-composer-form"
          className="relative w-full rounded-2xl border px-2.5 py-1.5"
          style={{
            borderColor: "color-mix(in srgb, var(--scope-a) 32%, transparent)",
            background: "color-mix(in srgb, var(--scope-a) 10%, transparent)",
          }}
          data-testid="dream-composer"
        >
          {/* THE HAND'S OWN ROW — draw · zoom · the words' own count */}
          <div className="flex items-center gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setDrawOpen((s) => !s)}
              aria-pressed={drawOpen}
              aria-expanded={drawOpen}
              title={t("Draw the book into existence")}
              data-testid="dream-draw-toggle"
              className={cn(
                "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition-all duration-300",
                drawOpen || sketch
                  ? "border-[var(--scope-a)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] text-foreground glow-sm"
                  : "border-border/80 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              <PenTool className="size-3.5" aria-hidden="true" />
              {t("Draw")}
            </button>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              title={t("Open the page wide")}
              aria-label={t("Open the page wide")}
              data-testid="dream-zoom-open"
              className="focus-glow flex size-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
            >
              <Maximize2 className="size-3.5" aria-hidden="true" />
            </button>

            <span className="ml-auto flex items-center gap-1.5">
              {sketch && (
                <span
                  className="flex items-center gap-1 rounded-full border border-border bg-card/60 py-0.5 pl-0.5 pr-1"
                  data-testid="dream-sketch-chip"
                  title={t("A drawing rides with the words")}
                >
                  <span
                    aria-hidden="true"
                    className="size-5 shrink-0 rounded-full border border-border/70 bg-cover bg-center"
                    style={{ backgroundImage: `url(${sketch})` }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSketch(null);
                      setSketchMeta(null);
                      sketchRef.current = null;
                      sketchMetaRef.current = null;
                    }}
                    aria-label={t("Let the drawing go")}
                    title={t("Let the drawing go")}
                    data-testid="dream-sketch-remove"
                    className="focus-glow flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              )}
              <span
                className={cn(
                  "mono-label text-[10px] tabular-nums tracking-[0.14em] transition-colors duration-300",
                  countWords(topicDraft) >= WORD_LIMIT
                    ? "text-rose-500/90"
                    : countWords(topicDraft) >= WORD_LIMIT - 40
                      ? "text-amber-600/90"
                      : "text-muted-foreground/70"
                )}
                data-testid="dream-wordcount-input"
              >
                {countWords(topicDraft)}/{WORD_LIMIT}
              </span>
            </span>
          </div>

          {/* THE SKETCH ATELIER — unfolds above the words when the pen
              is asked for; the finished drawing rides into the loom.
              THE WHOLE SECTION, ALWAYS REACHABLE: the atelier lives in
              its own height-bounded, scrollable sheet, so no hand —
              however small the screen — ever loses the brushes, the
              elements or the send row below the room's edge. */}
          <AnimatePresence initial={false}>
            {drawOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pb-2 pt-0.5">
                  <div
                    className="nice-scroll max-h-[min(56dvh,560px)] overflow-y-auto overscroll-contain"
                    data-testid="dream-sketch-zone"
                  >
                    <SketchPad
                      onDone={(dataUrl, meta) => {
                        sketchRef.current = dataUrl;
                        sketchMetaRef.current = meta;
                        setSketch(dataUrl);
                        setSketchMeta(meta);
                        setDrawOpen(false);
                      }}
                      onCancel={() => setDrawOpen(false)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <label htmlFor="dream-topic" className="sr-only">
              {t("Speak anything — a subject, a wish, a whole world…")}
            </label>
            <textarea
              id="dream-topic"
              value={topicDraft}
              onChange={(e) => setTopicDraft(clampWords(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder={t(
                "Pour your imagination onto these pages — up to 1000 words, or draw the book into existence: everything you give becomes living ink…"
              )}
              data-testid="dream-topic-input"
              className="nice-scroll max-h-24 min-h-[26px] min-w-0 flex-1 resize-none bg-transparent py-1 font-[family-name(var(--font-literata))] text-[15px] italic leading-relaxed text-foreground outline-none placeholder:font-[family-name(var(--font-sans))] placeholder:not-italic placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={(!topicDraft.trim() && !sketch) || undefined}
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

    {/* THE ZOOMED PAGE — the input opened wide: a full-room sheet where
        the thousand words can be seen, changed and arranged with
        ease. Enter makes a new line here (the sending waits for its
        button), and the minimize lays everything back into the quiet
        standing bar, exactly as it was left. */}
    <AnimatePresence>
      {zoomOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-[80] flex flex-col bg-background/[0.985] backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={t("The zoomed page")}
          data-testid="dream-zoom-overlay"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
            <p className="font-[family-name(var(--font-literata))] text-[15px] italic text-foreground/90">
              {t("The zoomed page")}
            </p>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "mono-label text-[10px] tabular-nums tracking-[0.14em] transition-colors duration-300",
                  countWords(topicDraft) >= WORD_LIMIT
                    ? "text-rose-500/90"
                    : countWords(topicDraft) >= WORD_LIMIT - 40
                      ? "text-amber-600/90"
                      : "text-muted-foreground/70"
                )}
                data-testid="dream-zoom-wordcount"
              >
                {countWords(topicDraft)}/{WORD_LIMIT}
              </span>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                title={t("Back to the quiet bar")}
                aria-label={t("Back to the quiet bar")}
                data-testid="dream-zoom-minimize"
                className="focus-glow flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
              >
                <Minimize2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
            <label htmlFor="dream-zoom-input" className="sr-only">
              {t("Speak anything — a subject, a wish, a whole world…")}
            </label>
            <textarea
              id="dream-zoom-input"
              value={topicDraft}
              onChange={(e) => setTopicDraft(clampWords(e.target.value))}
              autoFocus
              placeholder={t(
                "The page is wide now — write the whole world: its people, its places, how it begins and how it ends…"
              )}
              data-testid="dream-zoom-input"
              className="nice-scroll flex-1 resize-none bg-transparent font-[family-name(var(--font-literata))] text-[16.5px] italic leading-[1.85] text-foreground outline-none placeholder:font-[family-name(var(--font-sans))] placeholder:not-italic placeholder:text-muted-foreground/50"
            />

            {sketch && (
              <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/50 px-3 py-2">
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-lg border border-border/70 bg-cover bg-center"
                  style={{ backgroundImage: `url(${sketch})` }}
                />
                <p className="min-w-0 flex-1 font-[family-name(var(--font-literata))] text-[13px] italic text-foreground/80">
                  {t("The drawing rides with the words — the book will be born from both.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSketch(null);
                    setSketchMeta(null);
                    sketchRef.current = null;
                    sketchMetaRef.current = null;
                  }}
                  aria-label={t("Let the drawing go")}
                  title={t("Let the drawing go")}
                  className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              <p className="hidden text-[12px] italic text-muted-foreground/80 sm:block">
                {t("Enter makes a new line — the sending waits for its button.")}
              </p>
              <button
                type="submit"
                form="dream-composer-form"
                disabled={(!topicDraft.trim() && !sketch) || undefined}
                data-testid="dream-zoom-send"
                className="akashic-btn focus-glow ml-auto flex h-10 items-center gap-2 rounded-full px-6 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Waves className="size-4" aria-hidden="true" />
                {t("Channel the book")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );

  /* ================================================================ */
  /*  THE WEAVING — the unseen ink emblem                              */
  /* ================================================================ */

  const weaving = (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      {/* THE X OF THE CHANNELING — one press asks, a second confirms:
          the weaving is never ended by a stray touch. Confirmed, the
          loom rests and the atelier receives the visitor back; the
          late reply, if any, lands unheard. */}
      {!weaveError && (
        <button
          type="button"
          onClick={() => setCancelArmed(true)}
          aria-label={t("Cancel the channeling")}
          title={t("Cancel the channeling")}
          data-testid="dream-weaving-cancel"
          disabled={cancelArmed}
          className="focus-glow absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground disabled:opacity-40 sm:right-6"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      {/* the confirmation — small, honest, unhurried (portaled so the
          narrow columns of the house can never clip it) */}
      <ModalShell
        open={cancelArmed && !weaveError}
        onOpenChange={(o) => {
          if (!o) setCancelArmed(false);
        }}
        title={t("Stop the channeling?")}
        description={t(
          "The loom will let the threads rest and return you to the atelier — nothing woven is kept."
        )}
        widthClass="sm:max-w-[380px]"
      >
        <div
          className="flex items-center justify-end gap-2 px-5 pb-5 sm:px-6 sm:pb-6"
          data-testid="dream-cancel-confirm"
        >
          <button
            type="button"
            onClick={() => setCancelArmed(false)}
            data-testid="dream-cancel-keep"
            className="focus-glow flex h-9 items-center rounded-full border border-border px-4 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:border-foreground/40"
          >
            {t("Keep weaving")}
          </button>
          <button
            type="button"
            onClick={() => {
              channelTokenRef.current += 1;
              setCancelArmed(false);
              setPendingOpen(false);
              setWeaveError(false);
              backFromWeaving();
            }}
            data-testid="dream-cancel-stop"
            className="focus-glow flex h-9 items-center rounded-full bg-foreground px-4 text-[12.5px] font-medium text-background transition-all duration-300 hover:opacity-90"
          >
            {t("Yes, stop it")}
          </button>
        </div>
      </ModalShell>
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
                  {weavingPhrases[phaseIdx % weavingPhrases.length]}
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
        {/* THE READING DESK — two calm rows that never squeeze: the
            book's name keeps its own width between the two quiet
            hands; beneath, THE MAKERS' ROW (the hands that shape the
            volume) and THE INSTRUMENTS' ROW (the hands that serve the
            reading) stand apart — smaller and quieter on the phone,
            centered, wrapping instead of colliding (the visitor named
            the cleaner desk) */}
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
        {/* THE MAKERS' ROW — rewrite, whole book, publish */}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 pb-0.5">
          {/* the rewriting hand — a fancy button at the very top */}
          <button
            type="button"
            onClick={() => setRewriteOpen(true)}
            aria-label={t("Rewrite the coming pages")}
            title={t("Rewrite the coming pages")}
            className="dream-fancy focus-glow relative flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-3 sm:h-9 sm:pl-3 sm:pr-3.5"
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
            className="dream-fancy focus-glow relative flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-3 disabled:opacity-55 sm:h-9 sm:pl-3 sm:pr-3.5"
          >
            <BookOpenText className="size-3.5" aria-hidden="true" />
            <span className="hidden font-[family-name(var(--font-literata))] text-[13.5px] italic tracking-wide sm:inline">
              {t("Whole book")}
            </span>
          </button>
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
          {/* THE BINDING HAND — the whole volume bound into its ink PDF
              from the reader itself: the press verifies the sheet count
              by reopening the finished document, and the toast speaks
              the truth (a book short of its plan binds labeled a
              draft). No finished volume should wait for a reveal to
              hold its own bound copy. */}
          <button
            type="button"
            onClick={() => void downloadWhole()}
            disabled={binding || pages.length === 0}
            aria-label={t("Bind the book as PDF")}
            title={t("Bind the book as PDF")}
            data-testid="dream-bind-pdf"
            className={cn(inkIconBtn, "shrink-0 disabled:opacity-35")}
          >
            {binding ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
          </button>
          {/* THE PUBLICATION HAND — the finished volume carried to the
              hall: the whole book, its maker's name on it, the Dream
              Book room remembered as its birthplace */}
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            disabled={!bookIdRef.current}
            aria-label={t("Publish to the hall")}
            title={t("Publish to the hall")}
            data-testid="dream-publish"
            className={cn(
              inkIconBtn,
              "shrink-0 text-[#a1844a] disabled:opacity-35"
            )}
          >
            <Send className="size-4" aria-hidden="true" />
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
          {/* THE QUIET COUNT — the volume's own weight, honestly said:
              the words woven, the loom's leaves, and — when the volume
              carries a bound-page plan — the sheets the press would
              bind from what stands so far, against the plan's truth */}
          {pages.length > 0 && (
            <span
              className="mono-label hidden shrink-0 whitespace-nowrap text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70 md:inline"
              data-testid="dream-wordcount"
            >
              {formatArchiveNumber(bookWords, language)} {t("words")} · {formatArchiveNumber(pages.length, language)} {t("pages")}
              {measures.targetPages ? (
                <> · ≈{formatArchiveNumber(measures.layoutEstimate ?? 0, language)}/{formatArchiveNumber(measures.targetPages, language)} {t("bound")}</>
              ) : null}
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

      {/* WHAT THE DRAWING SAID — the transcription of the young maker's
          sketch stands above the book while they read: the child sees
          their bird, their sun, their world was truly SEEN and the
          volume in their hands grew from their own drawing. */}
      {sketchSubjects.length > 0 && !immersed && (
        <div className="relative z-10 shrink-0 px-3 pb-1 pt-1 sm:px-5">
          <div
            className="mx-auto flex max-w-[700px] flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-1.5"
            style={{
              borderColor: "color-mix(in srgb, var(--scope-a) 26%, transparent)",
              background: "color-mix(in srgb, var(--scope-a) 8%, transparent)",
            }}
            data-testid="dream-perception-reading"
          >
            <Sparkles className="size-3.5 shrink-0 text-[var(--scope-a)]" aria-hidden="true" />
            <span className="text-[12px] italic text-foreground/75">
              {t("We saw in your drawing:")}
            </span>
            {sketchSubjects.map((s, i) => (
              <span
                key={`r-${i}-${s}`}
                className="rounded-full border border-border/70 bg-card/60 px-2 py-0.5 font-[family-name(var(--font-literata))] text-[12px] italic text-foreground/85"
              >
                {s}
              </span>
            ))}
            <span className="text-[12px] italic text-muted-foreground/70">
              {t("— your book grows from these.")}
            </span>
          </div>
        </div>
      )}

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
              <div className="mt-4 w-full">
                <CoverPlate src={cover} painting={coverPainting} />
              </div>
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
              {/* THE PRESS ROOM IN WHOLE MODE — the publishing desk
                  speaks here too: the honest stage, the gate's verdict,
                  and one touch that opens the full press room leaf */}
              {ended && (
                <div className="mt-6 w-full" data-testid="dream-press-brief">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span
                      className="mono-label inline-flex items-center gap-2 rounded-full border border-[var(--dream-ink-faint)]/35 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--dream-ink)]"
                      data-testid="dream-stage-label"
                    >
                      {pressRoomBusy && (
                        <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                      )}
                      {t(STAGE_LABELS[studioStage] ?? STAGE_LABELS.drafting)}
                    </span>
                    {gate && (
                      <span
                        className={cn(
                          "mono-label inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em]",
                          gate.pass
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "border-amber-500/40 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {gate.pass ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
                        {gate.pass ? t("The gate admits this book") : t("The gate returned it")}
                      </span>
                    )}
                  </div>
                  {plateProgress && (
                    <p className="mono-label mt-2 text-[11px] tabular-nums text-[var(--dream-ink-soft)]">
                      {t("{done} of {total} plates painted", {
                        done: plateProgress.done,
                        total: plateProgress.total,
                      })}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      stopNarration();
                      setWholeMode(false);
                      setPageIdx(displayPages.length + 1);
                      setSlideDir(1);
                    }}
                    data-testid="dream-open-press-room"
                    className="dream-ink-btn focus-glow mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-[13.5px] font-medium"
                  >
                    <Feather className="size-3.5" aria-hidden="true" />
                    {t("Open the press room")}
                  </button>
                </div>
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
                  /* THE PRESS ROOM — the last leaf is now the publishing
                     desk: the honest stage, the editorial verdict, the
                     code-measured findings, the gate checklist, the
                     plates. COMPLETE is spoken only when it was earned. */
                  <div
                    className="dream-page dream-page-single nice-scroll mx-auto my-auto flex max-w-[560px] flex-col items-center px-6 py-12 text-center sm:px-10"
                    data-testid="dream-press-room"
                  >
                    <span
                      className="font-[family-name(var(--font-literata))] text-4xl text-[var(--dream-ink-soft)]"
                      aria-hidden="true"
                    >
                      ❦
                    </span>
                    <h2 className="mt-5 font-[family-name(var(--font-literata))] text-[25px] text-[var(--dream-ink)]">
                      {studioStage === "publication-ready"
                        ? t("The End")
                        : t("The Press Room")}
                    </h2>
                    <p className="mt-2 font-[family-name(var(--font-literata))] text-[14.5px] italic text-[var(--dream-ink-soft)]">
                      {meta?.title}
                    </p>
                    {/* THE STAGE — generation transparency, spoken plainly */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <span
                        className="mono-label inline-flex items-center gap-2 rounded-full border border-[var(--dream-ink-faint)]/35 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--dream-ink)]"
                        data-testid="dream-stage-label"
                      >
                        {pressRoomBusy && (
                          <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                        )}
                        {t(STAGE_LABELS[studioStage] ?? STAGE_LABELS.drafting)}
                      </span>
                    </div>
                    {pressRoomBusy && (
                      <p className="mt-3 max-w-[400px] font-[family-name(var(--font-literata))] text-[13px] italic leading-relaxed text-[var(--dream-ink-soft)]">
                        {studioStage === "editorial"
                          ? t("The editor reads every page — structure, continuity, pacing, age, craft…")
                          : studioStage === "revising"
                            ? t("The mender rewrites the named pages — the story stays, the seams close…")
                            : studioStage === "plates"
                              ? t("The illustration director chooses the scenes; the plates are painted one by one…")
                              : t("The studio works…")}
                      </p>
                    )}
                    {plateProgress && (
                      <p className="mono-label mt-2 text-[11px] tabular-nums text-[var(--dream-ink-soft)]">
                        {t("{done} of {total} plates painted", {
                          done: plateProgress.done,
                          total: plateProgress.total,
                        })}
                      </p>
                    )}

                    {/* THE PLATES — painted from the actual scenes */}
                    {paintedPlates.length > 0 && (
                      <div className="mt-6 w-full" data-testid="dream-plates-gallery">
                        <p className="mono-label mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--dream-ink-faint)]">
                          {t("The plates")}
                        </p>
                        <div className="nice-scroll flex max-h-[42vh] snap-y flex-col gap-3 overflow-y-auto">
                          {paintedPlates.map((pl, i) => (
                            <figure
                              key={`${pl.url}-${i}`}
                              className="overflow-hidden rounded-2xl border border-[var(--dream-ink-faint)]/30"
                            >                              <img
                                src={pl.url}
                                alt={pl.title || t("An illustration plate from this book")}
                                className="h-auto w-full"
                                loading="lazy"
                              />
                              <figcaption className="flex items-baseline justify-between gap-2 bg-[var(--dream-ink-faint)]/10 px-3 py-1.5 text-left">
                                <span className="font-[family-name(var(--font-literata))] text-[12px] italic text-[var(--dream-ink-soft)]">
                                  {pl.title || t("Plate")}
                                </span>
                                {pl.page ? (
                                  <span className="mono-label text-[10px] text-[var(--dream-ink-faint)]">
                                    {t("page {n}", { n: pl.page })}
                                  </span>
                                ) : null}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* THE GATE — the checklist a book must pass */}
                    {gate && (
                      <div className="mt-6 w-full" data-testid="dream-gate">
                        <p className="mono-label mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--dream-ink-faint)]">
                          {t("The acceptance gate")}
                        </p>
                        <ul className="space-y-1.5 text-left">
                          {gate.items.map((item) => (
                            <li
                              key={item.key}
                              className="flex items-start gap-2 rounded-xl border border-[var(--dream-ink-faint)]/25 px-3 py-2"
                            >
                              {item.pass ? (
                                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                              ) : (
                                <X className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                              )}
                              <span>
                                <span className="font-[family-name(var(--font-literata))] text-[13px] text-[var(--dream-ink)]">
                                  {t(item.label)}
                                </span>
                                <span className="mt-0.5 block font-[family-name(var(--font-literata))] text-[12px] leading-relaxed text-[var(--dream-ink-soft)]">
                                  {item.detail}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

</div>
                ) : pageIdx === 0 ? (
                  /* the title page — the Liminal Threshold, one leaf,
                     tall as the screen itself */
                  <div className="dream-page dream-page-single mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-between px-8 py-10 text-center sm:px-12">
                    <div className="flex w-full flex-col items-center pt-4 text-center sm:pt-8">
                      <span
                        className="font-[family-name(var(--font-literata))] text-2xl text-[var(--dream-ink-faint)]"
                        aria-hidden="true"
                      >
                        ❧
                      </span>
                      <div className="mt-4 w-full">
                        <CoverPlate src={cover} painting={coverPainting} />
                      </div>
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
                      placeholder={t(
                        "Write here and the book keeps your energy — every image, every wonder you add becomes part of its living pages…"
                      )}
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
                  <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
                    {currentPage && plateForPage(currentPage.n) && (
                      <figure
                        className="mb-4 w-full max-w-[560px] shrink-0 overflow-hidden rounded-2xl border border-[var(--dream-ink-faint)]/30 shadow-sm"
                        data-testid="dream-plate"
                      >                        <img
                          src={plateForPage(currentPage.n)!.url}
                          alt={
                            plateForPage(currentPage.n)!.title ||
                            t("An illustration plate from this book")
                          }
                          className="h-auto w-full"
                          loading="lazy"
                        />
                        {plateForPage(currentPage.n)!.title && (
                          <figcaption className="bg-[var(--dream-ink-faint)]/10 px-3 py-1.5 text-center font-[family-name(var(--font-literata))] text-[11.5px] italic text-[var(--dream-ink-soft)]">
                            {plateForPage(currentPage.n)!.title}
                          </figcaption>
                        )}
                      </figure>
                    )}
                    <BookPage
                      page={currentPage}
                      fontSize={ZOOM_STEPS[zoom]}
                      bookTitle={meta?.title}
                      stalled={weaveFailed && !weavingNext}
                      /* THE LOOM'S OWN COUNT — the frontier page speaks the
                         honest number too: what stands woven, what the
                         whole plan holds, while the loom works below */
                      progress={
                        meta && !ended
                          ? { woven: pages.length, total: meta.totalPages }
                          : undefined
                      }
                      onRetry={() =>
                        void weave("next", pagesRef.current.length + 1)
                      }
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* the loom at work while the visitor reads — the honest
                count of what stands woven against the book's own plan,
                so the background channeling is never a silent guess,
                and the visitor's own hands (pause · cancel · resume)
                standing beside it: the reading is governed, never
                interrupted — every hand lands between strides */}
            <AnimatePresence>
              {(weavingNext || loomMode !== "off") &&
                !showChoice &&
                !showEnd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex flex-col items-center gap-1.5"
                    data-testid="dream-loom-indicator"
                  >
                    <p className="mono-label flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      <span
                        className={cn(
                          "size-1 rounded-full bg-foreground/50",
                          loomMode === "paused" ? "" : "animate-pulse"
                        )}
                        aria-hidden="true"
                      />
                      {loomMode === "paused"
                        ? t(
                            "The loom rests — {woven} of {total} pages are yours",
                            { woven: pages.length, total: meta?.totalPages ?? 0 }
                          )
                        : meta
                          ? t(
                              "The loom weaves ahead — {woven} of {total} pages are yours, the rest are coming…",
                              { woven: pages.length, total: meta.totalPages }
                            )
                          : t("The loom weaves the next pages…")}
                    </p>
                    <div
                      className="flex items-center gap-1.5"
                      data-testid="dream-loom-controls"
                    >
                      {loomMode === "weaving" && (
                        <button
                          type="button"
                          onClick={pauseBackgroundLoom}
                          data-testid="dream-loom-pause"
                          className="focus-glow flex h-7 items-center gap-1.5 rounded-full border border-border/80 px-3 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
                        >
                          <Pause className="size-3" aria-hidden="true" />
                          {t("Pause the weaving")}
                        </button>
                      )}
                      {loomMode === "paused" && (
                        <button
                          type="button"
                          onClick={resumeBackgroundLoom}
                          data-testid="dream-loom-resume"
                          className="focus-glow flex h-7 items-center gap-1.5 rounded-full border border-[var(--scope-a)]/50 bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] px-3 text-[11.5px] text-foreground transition-all duration-300 hover:opacity-90"
                        >
                          <Play className="size-3" aria-hidden="true" />
                          {t("Resume the weaving")}
                        </button>
                      )}
                      {loomMode !== "off" && (
                        <button
                          type="button"
                          onClick={cancelBackgroundLoom}
                          data-testid="dream-loom-cancel"
                          className="focus-glow flex h-7 items-center gap-1.5 rounded-full border border-border/80 px-3 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
                        >
                          <X className="size-3" aria-hidden="true" />
                          {t("Let the loom rest")}
                        </button>
                      )}
                    </div>
                    {loomWalletStop && loomMode === "paused" && (
                      <p className="mono-label text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground/80">
                        {t(
                          "The purse rests — the unwoven pages never left it"
                        )}
                      </p>
                    )}
                  </motion.div>
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

      {/* THE MIRROR BRIDGE HAS LEFT THE BOOK — the reader asked the
          Mirror's small hand away from the reading stage's corner: the
          volume speaks for itself now, and the Mirror waits in the
          chat's own floor (one back hand away, always). */}

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
            {/* THE TRUTHFUL MEASUREMENTS — the reveal never equates the
                loom's leaves with the bound book: the plan's own words
                stand beneath the page count, honestly, while it walks */}
            {measures.targetPages ? (
              <p
                className="mono-label mt-1 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70"
                data-testid="dream-whole-measures"
              >
                {formatArchiveNumber(measures.wordsWoven ?? 0, language)}/{formatArchiveNumber(measures.wordBudget ?? 0, language)} {t("words")} · ≈{formatArchiveNumber(measures.layoutEstimate ?? 0, language)}/{formatArchiveNumber(measures.targetPages, language)} {t("bound pages")}
              </p>
            ) : null}
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
      className="flex items-stretch gap-3 rounded-xl border border-border/80 bg-card/40 p-3"
      data-testid={local ? "shelf-volume-local" : "shelf-volume-library"}
    >
      {/* THE COVER-LED CARD — a fixed-ratio cover leads every card
          (object-fit, never squeezed), the title and the whisper run
          in normal flow with room to wrap, and the hands stand in
          their own row beneath — nothing overlaps at any width. */}
      {v.cover ? (
        <span
          className="block aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg sm:w-24"
          style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--foreground) 12%, transparent)" }}
        >
          <img src={v.cover} alt="" loading="lazy" className="size-full object-cover" />
        </span>
      ) : (
        <span
          className="ink-hand flex aspect-[3/4] w-20 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-[22px] text-foreground/35 sm:w-24"
          aria-hidden="true"
        >
          {v.sigil || "❧"}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="break-words text-[14.5px] font-medium leading-snug text-foreground/90">
          {v.title}
        </p>
        <p className="mt-0.5 line-clamp-2 break-words text-[13px] leading-relaxed text-muted-foreground">
          {v.axiom || v.subtitle || v.pages[0]?.paragraphs[0]?.slice(0, 120) || "…"}
        </p>
        <p className="mono-label mt-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
          {(v.savedAt || "").slice(0, 10)} · {t("page {n} of {m}", { n: Math.min(v.pages.length, v.totalPages || v.pages.length), m: v.totalPages || v.pages.length })}
          {v.ended ? ` · ${t("Read again")}` : ""}
        </p>
        {/* the volume's own hands — a quiet row beneath the words, so
            the buttons never collide with the title on narrow widths */}
        <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-border/50 pt-2.5">
          {local && (
            <button
              type="button"
              onClick={() => forgetLocal(v.bookId)}
              aria-label={t("Forget this volume")}
              title={t("Forget this volume")}
              className="focus-glow mr-auto flex size-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground"
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
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" data-testid="shelf-local-list">
                  {localShelf.map((v) => shelfRow(v, true))}
                </div>
              </section>
            )}
            {libraryVolumes !== null && libraryVolumes.length > 0 && (
              <section>
                <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("In your library")}
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" data-testid="shelf-library-list">
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

  /* THE PUBLICATION HAND — the whole volume carried to the hall:
     its title, its cover, its first page's own words, the Dream
     Book room remembered as its birthplace. The private manuscript
     itself never leaves the maker's shelf. */
  const publishPanel = (
    <PublishToGathering
      open={publishOpen}
      onClose={() => setPublishOpen(false)}
      payload={
        bookIdRef.current
          ? {
              sourcePortal: "book",
              sourceId: bookIdRef.current,
              refKind: "library",
              suggestedTitle: meta?.title || "An untitled volume",
              preview:
                (pages[0]?.paragraphs ?? []).join("\n\n").slice(0, 4000) ||
                "A written work born in the Dream Book room.",
              cover: cover,
              generic: false,
              contentTypeLabel: "Book / Story",
            }
          : null
      }
    />
  );

  if (stage === "weaving")
    return (
      <>
        {weaving}
        {shelfPanel}
        {publishPanel}
      </>
    );
  if (stage === "reading")
    return (
      <>
        {reader}
        {shelfPanel}
        {publishPanel}
      </>
    );
  return (
    <>
      {atelier}
      {shelfPanel}
      {publishPanel}
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
  progress,
}: {
  page?: WeavePage;
  fontSize: number;
  stalled?: boolean;
  onRetry?: () => void;
  bookTitle?: string;
  /* the loom's own honest count while the frontier page waits:
     what stands woven against the book's whole plan */
  progress?: { woven: number; total: number };
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
        /* the page still in the loom — the honest count spoken beside
           the shimmer, so the background channeling is never a guess */
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <span
            className="font-[family-name(var(--font-literata))] text-lg text-[var(--dream-ink-faint)]"
            aria-hidden="true"
          >
            ❧
          </span>
          <p className="font-[family-name(var(--font-literata))] text-[13.5px] italic text-[var(--dream-ink-faint)]">
            {progress
              ? t(
                  "The loom weaves ahead — {woven} of {total} pages are yours, the rest are coming…",
                  { woven: progress.woven, total: progress.total }
                )
              : t("The loom weaves the next pages…")}
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
