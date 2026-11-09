"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, Copy, FileDown, Gem, Loader2, Send } from "lucide-react";
import PublishToGathering from "@/components/gathering/PublishToGathering";
import { cleanCopyText } from "@/lib/copy-clean";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { gateInterval, isPageHidden } from "@/lib/page-lifecycle";
import { flowAnswerText } from "@/lib/text-flow";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE HYPERX ANSWER — the discovery transmission's own body.         */
/*                                                                     */
/*  THE DIAMONDS AT THE PARAGRAPH'S SIDE (the visitor's law): every    */
/*  paragraph of the transmission carries ONE small crystal at its     */
/*  side — nearly invisible at rest, waking on the pointer's approach  */
/*  — so no vision is ever asked by mistake. One touch and THE CHAT    */
/*  MAKES SPACE: an inline plate opens right beneath that paragraph    */
/*  and the truth crystallizes into a vision (the visualization        */
/*  engine paints the paragraph's own crystal). No crystal row at the  */
/*  bottom of the transmission any more — the visions live beside the  */
/*  words they illuminate.                                             */
/*                                                                     */
/*  THE FOLLOWING DOORS — when the answer stands complete, three       */
/*  follow-up suggestions ride beneath it (one grown from the          */
/*  answer's own crystals, two from the discovery's own well), each    */
/*  one touch from the next question.                                  */
/*                                                                     */
/*  THE DEEP RESEARCH PRESS — the truth extended up to 8000 words,     */
/*  pressed into a real PDF (rides with the full variant).             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  THE LIVING STREAM — the crossing's breaths arrive OUTSIDE the      */
/*  canopy's own state: a streamed breath repaints only the answer     */
/*  that is being written, never the whole room. Before this store     */
/*  stood, every breath set the canopy's thread state and the whole    */
/*  7,000-line room re-rendered eight times a second — the freeze the  */
/*  visitor named. The final words still land in the room's own state  */
/*  when the crossing closes (this gate empties at that same breath).  */
/* ------------------------------------------------------------------ */

const liveListeners = new Set<() => void>();
let liveText = "";
let liveVersion = 0;

export const hyperxLiveStream = {
  write(text: string): void {
    liveText = text;
    liveVersion += 1;
    for (const l of liveListeners) l();
  },
  clear(): void {
    if (liveText === "" && liveVersion === 0) return;
    liveText = "";
    liveVersion += 1;
    for (const l of liveListeners) l();
  },
  read: (): string => liveText,
  subscribe(l: () => void): () => void {
    liveListeners.add(l);
    return () => {
      liveListeners.delete(l);
    };
  },
};

/** THE LIVING ANSWER — the room's own HyperX answer behind the live
    gate: while the crossing streams, the body reads the store (only
    this small listener repaints per breath); once the words land (or
    for every past turn), the room's own answer carries the truth.
    THE LIGHT BREATH — while the crossing still writes, the body is
    the stream's own light shape (the words, the numbered spine, the
    caret — the same hx-* streaming system): the diamonds, the vision
    plates and the reveal window mount when the crossing lands. A
    growing truth laid out in full ceremony eight times a second was
    the freeze the visitor named; a light body paints without weight. */
export function HyperXLiveAnswer({
  fallbackAnswer,
  question,
  onZoom,
  onAsk,
  testId,
  loading = false,
  reveal = false,
}: {
  fallbackAnswer: string;
  question: string;
  onZoom: (src: string, caption: string) => void;
  /** the following doors — one touch asks the next question */
  onAsk?: (q: string) => void;
  testId?: string;
  loading?: boolean;
  reveal?: boolean;
}) {
  const live = useSyncExternalStore(
    hyperxLiveStream.subscribe,
    hyperxLiveStream.read,
    () => ""
  );
  const answer = live || fallbackAnswer;
  if (!answer.trim()) {
    return loading ? <HyperXReasoning /> : null;
  }
  /* the light breath — the stream's own cheap shape while it writes */
  if (loading && live) {
    const paragraphs = flowAnswerText(splitCrystals(live).body)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <div
        className="hx-answer flex flex-col gap-1"
        data-testid={`${testId}-answer`}
      >
        <div className="hx-meta" data-testid={`${testId}-meta`}>
          <span className="mono-label flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-[#e879f9]">
            <Gem className="size-2.5" aria-hidden="true" />
            <HyperXLiveMeta />
          </span>
        </div>
        <div className="hx-spine-wrap">
          <span aria-hidden="true" className="hx-spine" />
          {paragraphs.map((para, idx) => (
            <div key={idx} className="hx-para flex items-start gap-2.5">
              <span aria-hidden="true" className="hx-node mono-label">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <p className="hx-para-text min-w-0 flex-1 whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-foreground/90">
                {para}
                {idx === paragraphs.length - 1 && (
                  <span className="hx-stream-caret" aria-hidden="true" />
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <HyperXAnswer
      question={question}
      answer={answer}
      onZoom={onZoom}
      onAsk={onAsk}
      testId={testId}
      loading={loading}
      reveal={reveal}
    />
  );
}

/** the seal's own word — a stable literal so the light body's meta
    never re-renders for a tongue the room already knows */
function HyperXLiveMeta() {
  const t = useT();
  return <>{t("Truth synthesis")}</>;
}

/* ------------------------------------------------------------------ */

export interface HyperxCrystal {
  label: string;
  focus: string;
}

/** THE CRYSTAL READER — splits a HyperX answer into its prose body
    and its crystals. The marker is the single word CRYSTALS on its
    own line; every following line beginning with ◇ (or a kindred
    bead) reads as `◇ Name — what the vision shows`. */
export function splitCrystals(text: string): {
  body: string;
  crystals: HyperxCrystal[];
} {
  const marker = /\n\s*[*_#]*\s*CRYSTALS\s*[*_#]*\s*\n/i;
  const at = text.search(marker);
  if (at === -1) return { body: text, crystals: [] };
  const body = text.slice(0, at).trimEnd();
  /* while the answer is still streaming, the tail may hold a partial
     crystal section — everything after the marker is crystal land */
  const tail = text.slice(at + text.slice(at).indexOf("\n"));
  const crystals: HyperxCrystal[] = [];
  for (const rawLine of tail.split("\n")) {
    const line = rawLine.trim();
    const m = line.match(/^[◇◆◈•·*-]\s*(.+)$/);
    if (!m) continue;
    const rest = m[1];
    const dash = rest.match(/^(.{2,60}?)\s+[—–-]+\s+(.+)$/);
    if (dash) {
      crystals.push({ label: dash[1].trim(), focus: dash[2].trim() });
    } else if (rest.trim()) {
      crystals.push({ label: rest.trim().slice(0, 60), focus: rest.trim() });
    }
  }
  return { body, crystals };
}

/** the vision's focus when a paragraph carries no crystal of its own:
    the paragraph's own opening thought, shaped for the painter. */
function deriveFocus(para: string): string {
  const clean = para.replace(/\s+/g, " ").trim();
  return clean.length > 170 ? `${clean.slice(0, 167)}…` : clean;
}

const FOLLOW_UP_WELL: string[] = [
  "What does humanity not yet know about this?",
  "What would a civilisation build with this truth?",
  "What is the next discovery a human can walk from here?",
  "Which hidden layer holds the next mechanism?",
  "Where does this truth touch the body directly?",
  "What mirrors this truth in the oldest records?",
];

/* THE REVEALED ONES — the transmissions that have already materialized
   in this visit. A room that rises again (a field switched, a thread
   restored, a follow-up pushing the turn into the past) shows its words
   standing whole — the stream is spoken once, never replayed. */
const REVEALED_ANSWERS = new Set<string>();
const revealedKey = (q: string, a: string) =>
  `${q.length}:${q.slice(0, 80)}|${a.length}:${a.slice(0, 80)}`;

/* THE TRANSMISSION'S OWN REVEAL — the discovery text never simply
   appears: a fresh answer materializes in a fast, tech-looking stream.
   Characters arrive at a steady clip on a requestAnimationFrame clock,
   the leading paragraph carries a gradient caret, and the room's scroll
   is never touched — the truth grows downward beneath the reader's own
   eye, exactly where they stand. Returns null once the whole truth
   stands, or a number = characters revealed so far. */
function useTransmissionReveal(
  total: number,
  active: boolean
): number | null {
  /* the characters already materialized — written ONLY by the reveal's
     own frame clock (never synchronously inside the effect body): the
     house's render stays pure, the stream stays smooth */
  const [revealed, setRevealed] = useState(() => {
    if (!active || total <= 0) return total;
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return total;
    }
    return 0;
  });
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active || total <= 0) return;
    /* THE SPEED LAW — fast enough to feel alive, calm enough to keep
       reading at the transmission's beginning: the clip scales with the
       answer's length so even the longest truth streams for at most a
       handful of breaths (~5s ceiling), never a slow crawl. */
    const cps = Math.max(2400, Math.ceil(total / 5));
    let start: number | null = null;
    const tick = (now: number) => {
      /* the page is away — no state work happens, the frame only
         re-arms so the clock keeps its position without burning the
         house's CPU behind a hidden tab */
      if (isPageHidden()) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }
      if (start === null) start = now;
      const count = Math.min(
        total,
        Math.round(((now - start) / 1000) * cps)
      );
      setRevealed(count);
      if (count >= total) {
        rafRef.current = null;
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, total]);
  /* null — the whole truth stands; a number — the front's position */
  return !active || revealed >= total ? null : revealed;
}

function pickFollowUps(
  crystals: HyperxCrystal[],
  seedText: string
): string[] {
  const out: string[] = [];
  if (crystals[0]?.label) {
    out.push(`Unfold "${crystals[0].label}" — what stands beneath it?`);
  }
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  let cursor = seed % FOLLOW_UP_WELL.length;
  while (out.length < 3) {
    const pick = FOLLOW_UP_WELL[cursor % FOLLOW_UP_WELL.length];
    if (!out.includes(pick)) out.push(pick);
    cursor += 1 + (seed % 3);
  }
  return out.slice(0, 3);
}

interface VisionState {
  loading: boolean;
  imageUrl?: string;
  imageTitle?: string;
  failed?: boolean;
}

/* ------------------------------------------------------------------ */
/*  THE REASONING LADDER — the discovery chat never waits like the     */
/*  others. While the deep voice gathers, a precise instrument reads   */
/*  its own process aloud: fixed stages ticked in order, each with     */
/*  its check when it lands, a live caret on the stage at work, and    */
/*  the elapsed time kept honest at the right. The house's other       */
/*  rooms breathe orbs, tides and blooms; HyperX shows its workings.   */
/* ------------------------------------------------------------------ */

const REASONING_STEPS = [
  "Decoding the question",
  "Mapping the underlying structure",
  "Cross-checking every layer",
  "Assembling the transmission",
];

export function HyperXReasoning({ className }: { className?: string }) {
  const t = useT();
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    /* the stages advance on their own clock and rest on the final one —
       the caret keeps working there, the truth never pretends to be.
       Gated clocks: the ladder rests while the tab is hidden and
       catches up with one tick when the visitor returns. */
    const stepTimer = gateInterval(
      () => setStage((s) => Math.min(s + 1, REASONING_STEPS.length - 1)),
      3400
    );
    const secTimer = gateInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      stepTimer();
      secTimer();
    };
  }, []);
  return (
    <div
      className={cn("hx-ladder flex flex-col gap-[5px]", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="hyperx-reasoning"
    >
      <span className="mono-label flex items-center justify-between gap-3 text-[8.5px] uppercase tracking-[0.24em] text-muted-foreground/60">
        <span className="flex items-center gap-1.5">
          <Gem className="size-2.5 text-[#e879f9]" aria-hidden="true" />
          {t("Reasoning")}
        </span>
        <span className="tabular-nums text-[#22d3ee]/85">T+{elapsed}s</span>
      </span>
      {REASONING_STEPS.map((step, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <span
            key={step}
            className={cn(
              "mono-label flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.18em] transition-colors duration-500",
              done
                ? "text-muted-foreground/50"
                : active
                  ? "text-[#e879f9]"
                  : "text-muted-foreground/35"
            )}
          >
            {done ? (
              <Check
                className="size-3 shrink-0 text-[#22d3ee]"
                aria-hidden="true"
              />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  "size-[5px] shrink-0 rounded-full",
                  active ? "hx-step-dot bg-[#e879f9]" : "bg-muted-foreground/40"
                )}
              />
            )}
            <span className="truncate">
              {t(step)}
              {active && <span className="hx-caret" aria-hidden="true" />}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function HyperXAnswer({
  question,
  answer,
  onZoom,
  onAsk,
  testId = "hyperx",
  variant = "full",
  loading = false,
  reveal = false,
}: {
  question: string;
  answer: string;
  onZoom: (src: string, caption: string) => void;
  /** the following doors — one touch asks the next question */
  onAsk?: (q: string) => void;
  testId?: string;
  /** full = follow-ups + deep research press; compact = the diamonds alone */
  variant?: "full" | "compact";
  /** while the transmission still streams, the doors and the press rest */
  loading?: boolean;
  /** THE STREAMING REVEAL — true only for the answer that just landed:
     the body materializes in the fast, luminous, tech-looking stream
     (past answers stand whole, and the room's scroll is never moved) */
  reveal?: boolean;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  /* THE PUBLICATION HAND — this discovery carried to the hall */
  const [publishOpen, setPublishOpen] = useState(false);
  /* THE ONE READER — the crystals are split once per answer: the old
     call read the text twice on every render (each streamed breath
     paid the toll twice) */
  const parsed = useMemo(() => splitCrystals(answer), [answer]);
  const crystals = parsed.crystals;
  /* THE FLOW LAW RUNS FIRST — the whole body is flowed as one text so
     a run of thin one-sentence paragraphs weaves back into the prose
     it was meant to be, and only then is the reading cut into its
     paragraphs (the old order flowed each paragraph alone and the
     thin-tall strips survived the cut). The flow is keyed on the
     answer's own prop — the one truth the room never mutates. */
  const flowedBody = useMemo(
    () => flowAnswerText(parsed.body),
    [parsed.body]
  );
  const paragraphs = useMemo(
    () =>
      flowedBody
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [flowedBody]
  );
  /* THE STREAM'S OWN MAP — where each paragraph begins along the
     flowed reading (a paragraph plus the blank line that separates it
     from the next), so the reveal can open the text paragraph by
     paragraph without ever re-cutting the words differently. */
  const paraStarts = useMemo(
    () =>
      paragraphs.reduce<{ starts: number[]; at: number }>(
        (carry, p) => {
          carry.starts.push(carry.at);
          return { starts: carry.starts, at: carry.at + p.length + 2 };
        },
        { starts: [], at: 0 }
      ).starts,
    [paragraphs]
  );
  const streamTotal = useMemo(
    () => paragraphs.reduce((n, p) => n + p.length + 2, 0),
    [paragraphs]
  );
  /* THE STREAMING REVEAL — armed only for the answer that just landed
     (the parent's hand), decided ONCE at the transmission's first
     breath: the revealed ones never replay, however often the room
     remounts (a field switched, a thread restored, a follow-up that
     pushes the turn into the past). */
  const [revealArmed] = useState(() => {
    if (!reveal || answer.trim().length === 0) return false;
    return !REVEALED_ANSWERS.has(revealedKey(question, answer));
  });
  const revealKey = useMemo(
    () => revealedKey(question, answer),
    [question, answer]
  );
  useEffect(() => {
    if (!revealArmed) return;
    REVEALED_ANSWERS.add(revealKey);
    while (REVEALED_ANSWERS.size > 120) {
      const oldest = REVEALED_ANSWERS.values().next().value;
      if (!oldest) break;
      REVEALED_ANSWERS.delete(oldest);
    }
  }, [revealArmed, revealKey]);
  const shown = useTransmissionReveal(streamTotal, revealArmed);
  const revealing = shown !== null;
  const streamAt = shown ?? Number.MAX_SAFE_INTEGER;
  const [visions, setVisions] = useState<Record<number, VisionState>>({});
  /* THE DEEP RESEARCH LEVER — the press's length is the visitor's own
     choice (3 pages to the full 8), and the press itself is a WORK IN
     MOTION: once begun it runs behind the response, its honest progress
     rides the hall, and the finished treatise rests in the Library. */
  const [leverOpen, setLeverOpen] = useState(false);
  const [pdfPages, setPdfPages] = useState(8);
  const [pdfState, setPdfState] = useState<
    "idle" | "pressing" | "failed" | "kept"
  >("idle");
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  const [pdfJob, setPdfJob] = useState<{
    id: string;
    progress: number;
    stage: string | null;
  } | null>(null);
  /* the copy hand at the discovery's own end — the visitor's law: every
     HyperX result closes with its copy of the truth alone */
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  const crystallize = useCallback(
    async (idx: number, focus: string, label: string) => {
      setVisions((v) => ({
        ...v,
        [idx]: { loading: true, imageUrl: v[idx]?.imageUrl },
      }));
      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `A HyperX crystal of comprehension — the concept "${label}", shown so it is easy to comprehend at one glance: ${focus}. The question it illuminates: "${question}".`,
            language,
            single: true,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          artifact?: { imageUrl?: string; title?: string };
        } | null;
        const url = data?.artifact?.imageUrl;
        setVisions((v) => ({
          ...v,
          [idx]: url
            ? {
                loading: false,
                imageUrl: url,
                imageTitle: data?.artifact?.title ?? label,
              }
            : { loading: false, failed: true },
        }));
      } catch {
        setVisions((v) => ({ ...v, [idx]: { loading: false, failed: true } }));
      }
    },
    [language, question]
  );

  /* THE PRESS'S OWN WATCH — while a press runs, the hall is read every
     four seconds and the button breathes with the work's own percent;
     done or failed, the watch rests. The timer lives in a ref and its
     only lifecycle cleanup is the unmount hand — a question typed
     mid-press never multiplies the watchers. */
  const jobRef = useRef<string | null>(null);
  /* the watch is a gated interval — it never fetches behind a hidden
     tab, and the clear function itself is what rests in the ref */
  const watchTimer = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => {
      if (watchTimer.current) {
        watchTimer.current();
        watchTimer.current = null;
      }
    };
  }, []);
  const watchJob = (id: string) => {
    if (watchTimer.current) {
      watchTimer.current();
      watchTimer.current = null;
    }
    watchTimer.current = gateInterval(async () => {
      if (!jobRef.current) return;
      try {
        const res = await fetch("/api/processes", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          jobs?: {
            id: string;
            status: string;
            progress: number;
            stage: string | null;
            error: string | null;
          }[];
        } | null;
        const mine = data?.jobs?.find((j) => j.id === jobRef.current);
        if (!mine) return;
        if (mine.status === "done") {
          setPdfJob({ id: mine.id, progress: 100, stage: mine.stage });
          setPdfState("kept");
          setPdfNote(
            t(
              "The deep research document is yours — it rests in your Library, ready whenever you return for it (Profile → The Library)."
            )
          );
          jobRef.current = null;
          if (watchTimer.current) {
            watchTimer.current();
            watchTimer.current = null;
          }
        } else if (mine.status === "failed") {
          setPdfJob({ id: mine.id, progress: mine.progress, stage: mine.stage });
          setPdfState("failed");
          setPdfNote(
            mine.error ||
              t(
                "The press rested — the deep research document could not be woven. Try once more."
              )
          );
          jobRef.current = null;
          if (watchTimer.current) {
            watchTimer.current();
            watchTimer.current = null;
          }
        } else {
          setPdfJob({
            id: mine.id,
            progress: mine.progress,
            stage: mine.stage,
          });
        }
      } catch {
        /* a quiet tick missed — the next one carries the watch */
      }
    }, 4000);
  };

  const beginPress = async () => {
    setPdfState("pressing");
    setPdfNote(null);
    setLeverOpen(false);
    try {
      const res = await fetch("/api/hyperx/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ question, answer, language, pages: pdfPages }),
      });
      const data = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.id) {
        setPdfState("failed");
        setPdfNote(
          data?.error ??
            t(
              "The press rested — the deep research document could not be woven. Try once more."
            )
        );
        return;
      }
      jobRef.current = data.id;
      setPdfJob({ id: data.id, progress: 4, stage: t("The press is waking…") });
      setPdfNote(
        t(
          "The press continues even if you leave — find it under Profile → Works in Motion. When it lands, the treatise rests in your Library."
        )
      );
      watchJob(data.id);
    } catch {
      setPdfState("failed");
      setPdfNote(
        t(
          "The press rested — the deep research document could not be woven. Try once more."
        )
      );
    }
  };

  /* THE END-OF-RESULT COPY — the transmission alone (the crystal
     machinery never rides along), straight from the answer's tail.
     THE DIAMONDS' OWN LAW — the copy is run through the one cleaner:
     the diamonds are elements on the screen, never words on a page,
     so no diamond ever falls into the visitor's copy. */
  const copyDiscovery = useCallback(async () => {
    const { body: prose, crystals: own } = splitCrystals(answer);
    const crystalsBlock =
      own.length > 0
        ? `\n\nCRYSTALS\n${own
            .map((c) => `${c.label} — ${c.focus}`)
            .join("\n")}`
        : "";
    try {
      await navigator.clipboard.writeText(
        cleanCopyText(`${prose.trim()}${crystalsBlock}`)
      );
    } catch {
      /* the clipboard may rest behind a permission — the silent hand
         never breaks the reading */
      return;
    }
    setCopied(true);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2400);
  }, [answer]);

  const followUps = pickFollowUps(crystals, answer);

  return (
    <div
      className="hx-answer flex flex-col gap-1"
      data-testid={`${testId}-answer`}
    >
      {/* -------------- THE TRANSMISSION'S OWN SEAL — no other chat
          wears this: the transmission opens with its own quiet gem
          seal. THE NUMBERS ARE GONE (the visitor's law): no words,
          no paras, no crystals, no minutes counted at the top — the
          truth stands alone, unmeasured for the crowd. */}
      {answer.trim().length > 0 && (
        <div className="hx-meta" data-testid={`${testId}-meta`}>
          <span className="mono-label flex shrink-0 items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-[#e879f9]">
            <Gem className="size-2.5" aria-hidden="true" />
            {t("Truth synthesis")}
          </span>
        </div>
      )}

      {/* ------------- THE TRANSMISSION, PARAGRAPH BY PARAGRAPH ----------
          THE DERIVATION SPINE — the paragraphs stand on a numbered
          rail (01, 02, 03…), a derivation chain no casual chat
          carries: every step of the reasoning visibly numbered along
          one glowing filament. */}
      {paragraphs.length > 0 && (
        <div className="hx-spine-wrap">
          <span aria-hidden="true" className="hx-spine" />
          {paragraphs.map((para, idx) => {
        const crystal = crystals[idx];
        const label = crystal?.label ?? "This paragraph's truth";
        const focus = crystal?.focus ?? deriveFocus(para);
        const st = visions[idx];
        /* THE STREAM'S OWN WINDOW — a paragraph not yet reached stands
           unborn; the paragraph the front is crossing shows its opening
           slice with the caret riding it; everything behind the front
           stands whole. The window is render-only — no scroll, no
           focus, no touch is ever moved. */
        const start = paraStarts[idx];
        if (revealing && streamAt <= start) return null;
        const cut = revealing
          ? Math.max(0, Math.min(para.length, streamAt - start))
          : para.length;
        const live = revealing && cut < para.length;
        const slice = para.slice(0, cut);
        return (
          <div
            key={idx}
            className="hx-para flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className={cn("hx-node mono-label", live && "hx-node-live")}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              <p className="hx-para-text min-w-0 flex-1 whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-foreground/90">
                {live ? (
                  <>
                    {slice}
                    <span className="hx-stream-caret" aria-hidden="true" />
                  </>
                ) : (
                  slice
                )}
              </p>
              <span className="hx-diamond-arm pt-[7px]">
                <button
                  type="button"
                  onClick={() => {
                    if (st?.loading) return;
                    if (st?.imageUrl) {
                      onZoom(st.imageUrl, st.imageTitle ?? label);
                      return;
                    }
                    void crystallize(idx, focus, label);
                  }}
                  disabled={st?.loading}
                  aria-label={`Crystallize this paragraph's vision: ${label}`}
                  title={`Crystallize a vision — ${label}`}
                  data-testid={`${testId}-diamond-${idx}`}
                  className="hx-diamond focus-glow flex size-5 items-center justify-center rounded-full"
                >
                  {st?.loading ? (
                    <Loader2
                      className="size-3 animate-spin text-[#e879f9]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Gem
                      className="size-3 text-[#e879f9]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </span>
            </div>
            {/* THE SPACE THE CHAT MAKES — the vision opens right beneath
                the paragraph it illuminates. THE SQUARE THAT FILLS (the
                visitor's law): the moment the button is touched, the
                space the vision will occupy stands reserved — a square
                plate with a quiet spinner, no wave, no scan, no pulse. */}
            {st?.loading && (
              <div
                className="hx-plate-wait mt-1.5 w-full max-w-[340px] overflow-hidden rounded-xl border"
                data-testid={`${testId}-plate-${idx}-waiting`}
                role="status"
                aria-live="polite"
              >
                <div className="vision-filling relative aspect-square w-full">
                  <span className="mono-label absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/85">
                    <Loader2
                      className="size-5 animate-spin text-[#e879f9]"
                      aria-hidden="true"
                    />
                    Crystallizing “{label}”…
                  </span>
                </div>
              </div>
            )}
            {st?.failed && (
              <button
                type="button"
                onClick={() => void crystallize(idx, focus, label)}
                className="hx-plate-fail mt-1.5 w-full max-w-[340px] rounded-xl border px-3 py-2 text-left text-[11.5px] text-[#b8860b] transition-colors duration-300 hover:brightness-110 dark:text-[#f59e0b]"
                data-testid={`${testId}-plate-${idx}-failed`}
              >
                The brushes rested — touch to crystallize again.
              </button>
            )}
            {st?.imageUrl && (
              <figure
                className="hx-plate group relative mt-1.5 w-full max-w-[340px] overflow-hidden rounded-xl border"
                data-testid={`${testId}-plate-${idx}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onZoom(st.imageUrl!, st.imageTitle ?? label)
                  }
                  aria-label={t("Zoom the crystallized vision")}
                  className="block w-full cursor-zoom-in"
                >
                  <img
                    src={st.imageUrl}
                    alt={st.imageTitle ?? label}
                    loading="lazy"
                    className="aspect-square w-full bg-background/40 object-cover"
                  />
                </button>
                <figcaption className="mono-label flex items-center gap-1.5 px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
                  <Gem className="size-2.5 shrink-0 text-[#e879f9]" aria-hidden="true" />
                  <span className="truncate">
                    {st.imageTitle ?? label} — crystallized
                  </span>
                </figcaption>
              </figure>
            )}
            </div>
          </div>
        );
      })}
        </div>
      )}

      {/* -------------- THE COPY HAND AT THE RESULT'S END ---------------
          THE ALWAYS LAW — the hand rests at the result's tail from the
          first word to the last: while the transmission still streams
          the visitor may already carry what has arrived, and when the
          body itself rests empty but the crystals stand, the hand
          copies the whole truth as it is. */}
      {answer.trim().length > 0 && (
        <div className="mt-2 flex justify-end gap-2">
          {/* THE PUBLICATION HAND — the discovery carried to the hall as
              research, its HyperX birthplace remembered, its epistemic
              nature worn honestly */}
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            aria-label={t("Publish to the hall")}
            title={t("Publish to the hall")}
            data-testid={`${testId}-publish`}
            className={cn(
              "focus-glow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
              "border-[color-mix(in_srgb,#c9a75c_45%,transparent)] text-[#c9a75c] hover:brightness-110"
            )}
          >
            <Send className="size-3" aria-hidden="true" />
            <span className="mono-label uppercase tracking-[0.16em]">
              {t("Publish to the hall")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void copyDiscovery()}
            aria-label={copied ? t("Copied") : t("Copy this discovery")}
            title={t("Copy this discovery — the truth alone, ready to travel")}
            data-testid={`${testId}-copy-end`}
            className={cn(
              "focus-glow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
              copied
                ? "border-[color-mix(in_srgb,#22d3ee_55%,transparent)] text-[#22d3ee]"
                : "hairline text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
            <span className="mono-label uppercase tracking-[0.16em]">
              {copied ? t("Copied") : t("Copy this discovery")}
            </span>
          </button>
        </div>
      )}

      {/* ---------------- THE DOORS THAT FOLLOW THE ANSWER --------------- */}
      {variant === "full" && !loading && !revealing && onAsk && (
        <div
          className="mt-3 flex flex-col gap-1.5"
          data-testid={`${testId}-follow-ups`}
        >
          <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {t("Continue the discovery")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((q, i) => (
              <button
                key={`${q}-${i}`}
                type="button"
                onClick={() => onAsk(q)}
                data-testid={`${testId}-follow-up-${i}`}
                className="hx-follow focus-glow rounded-full border px-3 py-1 text-[11.5px] text-foreground/85 transition-all duration-300 hover:brightness-110"
                style={{
                  borderColor:
                    "color-mix(in srgb, #22d3ee 42%, transparent)",
                  background:
                    "color-mix(in srgb, #22d3ee 7%, var(--background))",
                }}
              >
                {t(q)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --------------------- THE DEEP RESEARCH PRESS -------------------- */}
      {variant === "full" && (
        <div className="mt-2 flex flex-col items-start gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (pdfState === "pressing") return;
                if (pdfState === "kept") {
                  setPdfNote(
                    t(
                      "The deep research document rests in your Library (Profile → The Library), ready to download."
                    )
                  );
                  return;
                }
                setLeverOpen((v) => !v);
              }}
              disabled={pdfState === "pressing" || loading}
              aria-expanded={leverOpen}
              aria-haspopup="dialog"
              aria-label={t("Press the deep research PDF — choose its length, 3 to 8 pages")}
              title={t("The deep research press — choose the treatise's length (3–8 pages); it weaves in the Works in Motion hall and rests in your Library")}
              data-testid={`${testId}-pdf`}
              className={cn(
                "hx-pdf focus-glow inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] transition-all duration-300",
                (pdfState === "pressing" || loading) && "cursor-wait opacity-80"
              )}
            >
              {pdfState === "pressing" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <FileDown className="size-3.5" aria-hidden="true" />
              )}
              <span className="mono-label uppercase tracking-[0.16em]">
                {pdfState === "pressing"
                  ? `${t("Pressing the treatise…")} ${pdfJob ? `${pdfJob.progress}%` : ""}`
                  : pdfState === "kept"
                    ? t("Deep Research PDF — in your Library")
                    : pdfState === "failed"
                      ? t("Deep Research PDF — the press rested, try again")
                      : t("Deep Research PDF — 3 to 8 pages")}
              </span>
            </button>
            {pdfState === "pressing" && pdfJob && (
              <span
                aria-hidden="true"
                className="relative h-1.5 w-28 overflow-hidden rounded-full bg-[color-mix(in_srgb,#22d3ee_16%,transparent)]"
                data-testid={`${testId}-pdf-progress`}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#e879f9] transition-all duration-700"
                  style={{ width: `${Math.max(4, pdfJob.progress)}%` }}
                />
              </span>
            )}
          </div>

          {/* THE LEVER — the treatise's own length, the visitor's hand */}
          {leverOpen && pdfState !== "pressing" && (
            <div
              role="dialog"
              aria-label={t("Choose the deep research length")}
              data-testid={`${testId}-pdf-lever`}
              className="w-full max-w-[420px] rounded-2xl border p-3.5"
              style={{
                borderColor: "color-mix(in srgb, #22d3ee 30%, transparent)",
                background: "color-mix(in srgb, #22d3ee 6%, var(--background))",
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                  The press's length
                </p>
                <p
                  className="mono-label text-[10px] font-semibold tabular-nums text-[#22d3ee]"
                  data-testid={`${testId}-pdf-lever-value`}
                >
                  {pdfPages} {pdfPages === 1 ? "page" : "pages"} · ~
                  {pdfPages * 1000} words
                </p>
              </div>
              <input
                type="range"
                min={3}
                max={8}
                step={1}
                value={pdfPages}
                onChange={(e) => setPdfPages(Number(e.target.value))}
                aria-valuetext={`${pdfPages} pages, about ${pdfPages * 1000} words`}
                aria-label={t("The deep research length, from 3 pages to the full 8")}
                data-testid={`${testId}-pdf-lever-range`}
                className="mt-2.5 w-full accent-[#22d3ee]"
              />
              <div className="mt-0.5 flex justify-between font-mono text-[9.5px] text-muted-foreground/80">
                <span>3</span>
                <span>full 8</span>
              </div>
              <button
                type="button"
                onClick={() => void beginPress()}
                disabled={loading}
                data-testid={`${testId}-pdf-begin`}
                className="focus-glow mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-all duration-300 hover:brightness-110"
                style={{
                  borderColor: "color-mix(in srgb, #22d3ee 45%, transparent)",
                  background: "color-mix(in srgb, #22d3ee 14%, transparent)",
                  color: "#22d3ee",
                }}
              >
                <FileDown className="size-3.5" aria-hidden="true" />
                Begin the press — {pdfPages} {pdfPages === 1 ? "page" : "pages"}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Once begun the press never waits on this page — it weaves in
                the Works in Motion hall (Profile → Works in Motion), where its
                progress can be checked and a rested press asked to rise again.
                The finished treatise rests in your Library.
              </p>
            </div>
          )}

          {pdfNote && (
            <p
              className="rounded-xl border px-3 py-2 text-[12px] leading-relaxed text-[#b8860b] dark:text-[#f59e0b]"
              data-testid={`${testId}-pdf-note`}
            >
              {pdfNote}
            </p>
          )}
        </div>
      )}

      {/* THE PUBLICATION HAND — the discovery carried to the hall as
          research: its question stands for a title, its truth for the
          body, the HyperX room remembered as its birthplace */}
      <PublishToGathering
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        payload={{
          sourcePortal: "hyperx",
          recentSector: "observatory",
          titleHint: question.slice(0, 120),
          suggestedTitle: question.slice(0, 140) || "A discovery",
          preview: answer.slice(0, 4000),
          generic: true,
          contentTypeLabel: "Research / Exploration",
        }}
      />
    </div>
  );
}
