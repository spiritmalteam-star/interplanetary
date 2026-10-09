"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Feather,
  LoaderCircle,
  Orbit,
  RotateCcw,
  Share2,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
} from "@/lib/browser-voice";
import { cn } from "@/lib/utils";
import { detectVisualIntent, type VisualizationArtifact } from "@/lib/visualization";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";
import { AkashicLoading } from "./ThemedLoadings";
import {
  attachmentsToPayload,
  hasPendingAttachments,
  type ChatAttachment,
} from "./attachments";

interface AkashicRecord {
  title: string;
  era: string;
  record: string;
  seal: string;
}

interface AkashicResponse extends AkashicRecord {
  entrance?: string;
  error?: string;
}

/**
 * AkashicView — the reading room of records, reduced to the letter
 * itself. No top bar, no input bar: one sheet of paper on the desk.
 * A small inkwell floats at the foot of the room — press it to tell
 * the Librarian what you wish to read about (or leave it empty and
 * receive unasked). The way back lives in the letter's own top-right
 * corner and vanishes the moment you scroll down to read. No two
 * records ever open the same way — the openings the visitor has
 * already read are remembered across visits and never repeated.
 */
export function AkashicView() {
  const exitAkashic = useMirror((s) => s.exitAkashic);
  const language = useMirror((s) => s.language);
  const t = useT();

  const [record, setRecord] = useState<AkashicRecord | null>(null);
  const [seeking, setSeeking] = useState(false);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  /* the ask bar — the visitor's own line to the Librarian, always at
     the foot of the room: a request makes the next transmission an
     asked-for one, an empty send lets the Library choose unasked */

  /* the letter's corner back door — it hides once you scroll to read */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrolledDown, setScrolledDown] = useState(false);

  /* the Universal Visualization Engine — the Library also answers in
     images when the visitor asks to see */
  const [visual, setVisual] = useState<{
    state: "pending" | "error" | "ready";
    request: string;
    artifact?: VisualizationArtifact;
  } | null>(null);
  const visualContextRef = useRef<{ subject: string; mode: string } | null>(
    null
  );
  const visualBusyRef = useRef(false);

  const seekingRef = useRef(false);
  /* the last entrance kinds the Librarian used — never the same door twice */
  const recentEntrancesRef = useRef<string[]>([]);
  /* the openings the visitor has already read — remembered across visits */
  const recentOpeningsRef = useRef<string[]>([]);
  /* whether the attempt in flight (or the one that failed) was a reply */
  const [replyAttempt, setReplyAttempt] = useState(false);

  /* remember the doors and openings across visits — the Library never
     opens the same way twice, not even on another evening */
  useEffect(() => {
    try {
      const doors = JSON.parse(
        window.localStorage.getItem("mirror-akashic-doors") ?? "[]"
      );
      if (Array.isArray(doors)) {
        recentEntrancesRef.current = doors
          .filter((k: unknown): k is string => typeof k === "string")
          .slice(0, 4);
      }
      const openings = JSON.parse(
        window.localStorage.getItem("mirror-akashic-openings") ?? "[]"
      );
      if (Array.isArray(openings)) {
        recentOpeningsRef.current = openings
          .filter((o: unknown): o is string => typeof o === "string")
          .slice(0, 3);
      }
    } catch {
      /* a first visit — the shelves are all unread */
    }
  }, []);

  const seek = useCallback(
    async (
      resonance: string | null,
      asReply: boolean,
      carried?: ChatAttachment[]
    ) => {
      if (seekingRef.current) return;
      seekingRef.current = true;
      setReplyAttempt(asReply);
      setSeeking(true);
      setError(false);
      setVisual(null);

      try {
        const payload = carried ? attachmentsToPayload(carried) : null;
        const res = await fetch("/api/akashic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            resonance,
            thread:
              asReply && record
                ? {
                    title: record.title,
                    era: record.era,
                    record: record.record,
                    seal: record.seal,
                  }
                : undefined,
            recentEntrances: recentEntrancesRef.current,
            recentOpenings: recentOpeningsRef.current,
            ...(payload ?? {}),
          }),
        });
        const data = (await res.json()) as AkashicResponse;
        if (!res.ok || !data.record) {
          throw new Error(data.error ?? "the shelf stayed quiet");
        }
        if (data.entrance) {
          recentEntrancesRef.current = [
            data.entrance,
            ...recentEntrancesRef.current.filter((k) => k !== data.entrance),
          ].slice(0, 4);
        }
        /* keep the opening itself, so no two records ever begin alike */
        const opening = data.record.split(/\n{2,}/)[0]?.slice(0, 220) ?? "";
        recentOpeningsRef.current = [opening, ...recentOpeningsRef.current].slice(0, 3);
        try {
          window.localStorage.setItem(
            "mirror-akashic-doors",
            JSON.stringify(recentEntrancesRef.current)
          );
          window.localStorage.setItem(
            "mirror-akashic-openings",
            JSON.stringify(recentOpeningsRef.current)
          );
        } catch {
          /* private mode — the memory lives only for the evening */
        }
        setRecord({
          title: data.title ?? "A Record Set Aside",
          era: data.era ?? "inscribed in an age the shelves remember",
          record: data.record,
          seal: typeof data.seal === "string" ? data.seal : "",
        });
      } catch {
        setError(true);
      } finally {
        seekingRef.current = false;
        setSeeking(false);
      }
    },
    [language, record]
  );

  /* ---------- copy · share · the Librarian's own voice ---------- */

  const recordText = record
    ? `${record.title}\n${record.era}\n\n${record.record}${record.seal ? `\n\n${record.seal}` : ""}`
    : "";

  const handleCopy = async () => {
    if (!recordText) return;
    try {
      await navigator.clipboard.writeText(recordText);
      setCopied(true);
      toast.success(t("The record is copied."));
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error(t("The copying did not take — select and copy by hand."));
    }
  };

  const handleShare = async () => {
    if (!recordText) return;
    const shareTitle = record ? `Akashic Library — ${record.title}` : "Akashic Library";
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: shareTitle, text: recordText });
        return;
      }
      throw new Error("share unavailable");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(recordText);
        toast.success(t("Sharing is quiet here — the record is copied instead."));
      } catch {
        toast.error(t("The copying did not take — select and copy by hand."));
      }
    }
  };

  const [voiceState, setVoiceState] = useState<
    "idle" | "loading" | "playing"
  >("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /* THE VOICE TOGGLE — when held, every record the Librarian draws is
     read aloud the moment it touches the desk; released, the letters
     keep their silence. One switch governing the whole room. */
  const [autoVoice, setAutoVoice] = useState(false);
  const listenRef = useRef<((auto?: boolean) => Promise<void> | void) | null>(null);
  const recordSeq = useRef(0);
  const voiceFetchSeq = useRef(0);

  const stopVoice = useCallback(() => {
    try {
      audioRef.current?.pause();
    } catch {
      /* already stopped */
    }
    audioRef.current = null;
    setVoiceState("idle");
  }, []);

  useEffect(() => stopVoice, [stopVoice]);

  const handleListen = useCallback(async (auto = false) => {
    if (voiceState === "loading") {
      if (!auto) return;
    } else if (voiceState === "playing") {
      stopVoice();
      if (!auto) return;
    }
    if (!record) return;
    /* The Librarian reads aloud himself — the old man's own voice,
       slower than the world, from behind the great desk. */
    setVoiceState("loading");
    /* a newer voice demand always wins — an older gather never speaks */
    const seq = ++voiceFetchSeq.current;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${record.title}. ${record.era}. ${record.record.replaceAll(
            /\s*\n\s*/g,
            " "
          )}${record.seal ? ` ${record.seal}` : ""}`,
          voice: "regent",
          pace: 0.82,
        }),
      });
      if (!res.ok) throw new Error("voice quiet");
      const blob = await res.blob();
      if (voiceFetchSeq.current !== seq) return;
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
        setVoiceState("idle");
      };
      audio.onerror = () => {
        if (audioRef.current === audio) audioRef.current = null;
        setVoiceState("idle");
      };
      await audio.play();
      setVoiceState("playing");
    } catch {
      /* the house voice could not travel — the browser reads the
         record in its stead, the Librarian is never mute */
      const handle = speakWithBrowserVoice({
        text: `${record.title}. ${record.era}. ${record.record.replaceAll(/\s*\n\s*/g, " ")}`,
        lang: language,
        rate: 0.82,
        onEnd: () => setVoiceState("idle"),
        onError: () => setVoiceState("idle"),
      });
      if (handle) {
        noteBrowserVoiceFallback(() =>
          toast.info(t("The house voice rests — your browser reads in its stead."))
        );
        setVoiceState("playing");
        return;
      }
      setVoiceState("idle");
      toast.error(t("The Librarian is quiet. Rest, then listen again."));
    }
  }, [record, voiceState, stopVoice, t, language]);

  /* the freshest listen, without re-firing the effect that calls it */
  listenRef.current = handleListen;

  /* the toggle's own law — a record set down while the voice is held
     reads itself aloud at once; the toggle released silences the room */
  useEffect(() => {
    if (!autoVoice || !record) return;
    recordSeq.current += 1;
    const seq = recordSeq.current;
    const timer = window.setTimeout(() => {
      if (recordSeq.current === seq) void listenRef.current?.(true);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [record, autoVoice]);

  /* ---------------------------------------------------------------- */
  /*  The Universal Visualization Engine — a request to SEE becomes    */
  /*  a vision the Library sets beside the open record.                */
  /* ---------------------------------------------------------------- */
  const requestVisualization = useCallback(
    async (request: string) => {
      if (visualBusyRef.current) return;
      visualBusyRef.current = true;
      setVisual({ state: "pending", request });

      try {
        const res = await fetch("/api/visualize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            message: request,
            history: record
              ? [
                  {
                    role: "mirror",
                    text: `${record.title}. ${record.era}. ${record.record}`,
                  },
                ]
              : [],
            ...(visualContextRef.current
              ? {
                  contextSubject: visualContextRef.current.subject,
                  previousMode: visualContextRef.current.mode,
                }
              : {}),
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          artifact?: VisualizationArtifact;
          error?: string;
        } | null;
        if (!res.ok || !data?.artifact) {
          throw new Error(data?.error ?? "the atelier stayed quiet");
        }
        const artifact = data.artifact;
        visualContextRef.current = {
          subject: artifact.subject,
          mode: artifact.mode,
        };
        setVisual({ state: "ready", request, artifact });
      } catch {
        setVisual((prev) =>
          prev ? { ...prev, state: "error" } : { state: "error", request }
        );
      } finally {
        visualBusyRef.current = false;
      }
    },
    [language, record]
  );

  /* ---------- the wish, once written ---------- */

  const sendText = (v: string) => {
    if (seeking) return;
    const val = v.trim();
    if (!val && attachments.length === 0) return;
    const carried = attachments.length > 0 ? attachments : undefined;
    /* No button — a request to see simply is one. Ordinary words
       never wake the atelier. */
    const intent = detectVisualIntent(val);
    const wantsVisual =
      val &&
      (intent.direct ||
        (intent.followUp && visualContextRef.current !== null));
    setDraft("");
    setAttachments([]);
    if (wantsVisual) {
      void requestVisualization(val);
    } else {
      void seek(val || null, Boolean(record), carried);
    }
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    sendText(draft);
  };

  /* receive unasked — the Library chooses, no words set down */
  const receiveUnasked = () => {
    if (seekingRef.current) return;
    setDraft("");
    setAttachments([]);
    void seek(null, false);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrolledDown(el.scrollTop > 28);
  };

  const listening = voiceState === "playing";
  /* once a record lies open on the desk, everything written becomes a reply */
  const replying = Boolean(record) && !seeking;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-background"
      data-testid="akashic-view"
    >
      {/* ---------- the reading room: one sheet, one record ---------- */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="nice-scroll relative z-10 flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex w-full max-w-[780px] flex-col px-3 pb-28 pt-5 sm:px-6 sm:pt-7">
          <AnimatePresence mode="wait">
            {/* the unopened shelf — an invitation, before the first record */}
            {!record && !seeking && !error && (
              <motion.div
                key="invitation"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-14 text-center sm:px-12 sm:py-20"
                data-testid="akashic-invitation"
              >
                <span
                  aria-hidden="true"
                  className="ink-soft mb-5 block text-[22px] leading-none"
                >
                  ❧
                </span>
                <p className="ink-hand mx-auto max-w-[460px] text-[18px] leading-[1.9] sm:text-[20px]">
                  {t(
                    "Set down a resonance — a name, a question, a feeling — and the Librarian will draw out the record it belongs to. Or leave the desk silent, and the Library will choose for you."
                  )}
                </p>
              </motion.div>
            )}

            {/* the ink forming — the record-keeper's tome opens, the
                knowing eye hovers, runes rise while the Librarian walks */}
            {seeking && (
              <motion.div
                key="seeking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-12 sm:px-12"
                aria-live="polite"
                aria-busy="true"
                data-testid="akashic-seeking"
              >
                <AkashicLoading className="mx-auto size-24 text-foreground sm:size-28" />
                <p className="ink-hand ink-faint mt-8 text-center text-[16px] italic">
                  {replyAttempt
                    ? t("the Librarian weighs your reply...")
                    : t("the Librarian is fetching your record...")}
                </p>
              </motion.div>
            )}

            {/* when the shelves keep their silence */}
            {error && !seeking && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-12 text-center sm:px-12"
                data-testid="akashic-error"
              >
                <p className="ink-hand mx-auto max-w-[420px] text-[17px] leading-[1.85]">
                  {t(
                    "The shelf is momentarily quiet. Rest a breath, then ask the Library again."
                  )}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void seek(draft.trim() || null, Boolean(record))
                  }
                  data-testid="akashic-retry"
                  className="papyrus-btn focus-glow mt-7 inline-flex h-10 items-center gap-2 rounded-full px-5 text-[12px] font-semibold tracking-[0.08em]"
                >
                  <Feather className="size-3.5" aria-hidden="true" />
                  {replyAttempt
                    ? t("Set the reply down again")
                    : t("Ask again, softly")}
                </button>
              </motion.div>
            )}

            {/* the record itself — ink on the page. The first paragraph
                opens with a drop cap, the way old chapters do. */}
            {record && !seeking && (
              <motion.article
                key="record"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-9 sm:px-12 sm:py-12"
                data-testid="akashic-record"
              >
                {/* corner folios — the top-right corner belongs to the way back */}
                <span
                  aria-hidden="true"
                  className="ink-soft pointer-events-none absolute left-3 top-2.5 text-[11px] opacity-60"
                >
                  ◆
                </span>
                <span
                  aria-hidden="true"
                  className="ink-soft pointer-events-none absolute bottom-2.5 left-3 text-[11px] opacity-60"
                >
                  ◆
                </span>
                <span
                  aria-hidden="true"
                  className="ink-soft pointer-events-none absolute bottom-2.5 right-3 text-[11px] opacity-60"
                >
                  ◆
                </span>

                {/* title & era */}
                <header className="text-center">
                  <h2
                    className="ink-title text-[24px] font-semibold leading-tight tracking-[0.04em] sm:text-[28px]"
                    data-testid="akashic-title"
                  >
                    {record.title}
                  </h2>
                  <p
                    className="ink-hand ink-faint mt-2 text-[15.5px] italic"
                    data-testid="akashic-era"
                  >
                    {record.era}
                  </p>
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-5 block h-px w-40"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, color-mix(in srgb, var(--foreground) 42%, transparent), transparent)",
                    }}
                  />
                </header>

                {/* the record, in the reading voice — a drop cap opens it */}
                <div className="mt-7 space-y-5" data-testid="akashic-body">
                  {record.record.split(/\n{2,}/).map((para, i) => (
                    <p
                      key={i}
                      className={cn(
                        "ink-hand whitespace-pre-wrap text-[18.5px] leading-[1.95] sm:text-[20px]",
                        i === 0 &&
                          "first-letter:float-left first-letter:mr-3 first-letter:mt-[7px] first-letter:text-[54px] first-letter:font-semibold first-letter:leading-[0.78]"
                      )}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* the closing line — unsigned; the letter simply ends in the hand */}
                {record.seal ? (
                  <p
                    className="ink-hand ink-soft mt-9 text-center text-[16.5px] italic"
                    data-testid="akashic-seal"
                  >
                    {record.seal}
                  </p>
                ) : null}

                {/* the desk actions — one quiet line at the foot of the letter */}
                <div className="mt-8 flex items-center justify-center gap-1.5 border-t hairline pt-5">
                  <button
                    type="button"
                    onClick={() => void seek(null, true)}
                    disabled={seeking}
                    title={t("Continue the story")}
                    data-testid="akashic-continue"
                    className="papyrus-btn focus-glow inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10.5px] font-medium tracking-[0.05em] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
                  >
                    <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {t("Continue the story")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    title={t("Copy")}
                    data-testid="akashic-copy"
                    className="papyrus-btn focus-glow inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10.5px] font-medium tracking-[0.05em] sm:px-3.5"
                  >
                    {copied ? (
                      <Check className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Copy className="size-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {copied ? t("copied") : t("Copy")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    title={t("Share")}
                    data-testid="akashic-share"
                    className="papyrus-btn focus-glow inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10.5px] font-medium tracking-[0.05em] sm:px-3.5"
                  >
                    <Share2 className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("Share")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAutoVoice((v) => {
                        if (v) stopVoice();
                        return !v;
                      })
                    }
                    data-testid="akashic-voice-toggle"
                    aria-pressed={autoVoice}
                    aria-label={
                      autoVoice
                        ? t("The Librarian reads every record — release for silence")
                        : t("Let every record read itself aloud")
                    }
                    title={
                      autoVoice
                        ? t("The Librarian reads every record — release for silence")
                        : t("Let every record read itself aloud")
                    }
                    className={cn(
                      "papyrus-btn focus-glow inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10.5px] font-medium tracking-[0.05em] sm:px-3.5",
                      autoVoice &&
                        "bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
                    )}
                  >
                    {autoVoice ? (
                      <Volume2 className="size-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <VolumeX className="size-3.5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleListen()}
                    title={
                      listening
                        ? t("Stop")
                        : t("Listen to the Librarian's voice")
                    }
                    data-testid="akashic-listen"
                    aria-label={
                      listening
                        ? t("Stop")
                        : t("Listen to the Librarian's voice")
                    }
                    className={cn(
                      "papyrus-btn focus-glow inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[10.5px] font-medium tracking-[0.05em] sm:px-3.5",
                      listening &&
                        "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                    )}
                  >
                    {voiceState === "loading" ? (
                      <LoaderCircle
                        className="size-3.5 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    ) : listening ? (
                      <Square className="size-3 shrink-0 fill-current" aria-hidden="true" />
                    ) : (
                      <Feather className="size-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {listening
                        ? t("Stop")
                        : voiceState === "loading"
                          ? t("Gathering voice")
                          : t("The Librarian reads")}
                    </span>
                  </button>
                </div>
              </motion.article>
            )}
          </AnimatePresence>

          {/* the vision — the Library sets it beside the record when asked to see */}
          {visual && !seeking && (
            <motion.div
              key="akashic-visual"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto mt-8 w-full"
              data-testid="akashic-visual"
            >
              {visual.state === "pending" && (
                <VisualizationPending
                  accent="var(--foreground)"
                  testIdPrefix="akashic-visual"
                  repaint
                />
              )}
              {visual.state === "error" && (
                <div
                  className="papyrus papyrus-frame rounded-2xl px-6 py-8 text-center"
                  data-testid="akashic-visual-error"
                >
                  <p className="ink-hand text-[16px] leading-[1.85]">
                    {t(
                      "The atelier is quiet — the vision could not be composed. Rest a breath, then ask again."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void requestVisualization(visual.request)}
                    data-testid="akashic-visual-retry"
                    className="papyrus-btn focus-glow mt-5 inline-flex h-9 items-center gap-2 rounded-full px-4 text-[11.5px] font-semibold tracking-[0.06em]"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    {t("Be still and receive")}
                  </button>
                </div>
              )}
              {visual.state === "ready" && visual.artifact && (
                <>
                  {visual.artifact.imageUrl ||
                  visual.artifact.slides.length > 0 ? (
                    <VisualizationCard
                      artifact={visual.artifact}
                      accent="var(--foreground)"
                      testIdPrefix="akashic-visual"
                      onRegenerate={() =>
                        void requestVisualization(visual.request)
                      }
                    />
                  ) : (
                    <PreparedPromptFallback
                      artifact={visual.artifact}
                      accent="var(--foreground)"
                      testIdPrefix="akashic-visual"
                      onPaint={() =>
                        void requestVisualization(visual.request)
                      }
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ---------- the way back — the letter's own right corner,
                     fading the moment you scroll down to read ---------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-[780px] justify-end px-3 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-7">
          <AnimatePresence>
            {!scrolledDown && (
              <motion.button
                key="akashic-back"
                type="button"
                onClick={exitAkashic}
                data-testid="akashic-return"
                aria-label={t("Return from the Library")}
                title={t("Return from the Library")}
                initial={{ opacity: 0, y: -6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, delay: 0.35 },
                }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.28 } }}
                className="pointer-events-auto mr-2 mt-2 flex size-9 items-center justify-center rounded-full border hairline bg-card/90 text-foreground/85 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ---------- the ask bar — the visitor's own line to the Librarian,
          always waiting at the foot of the room: write a request and the
          next transmission is a asked-for one, pressed send with nothing
          set down and the Library chooses unasked ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-5">
        <form
          onSubmit={send}
          className="pointer-events-auto relative w-full max-w-[640px] rounded-2xl border hairline bg-card/95 p-2.5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.42)] backdrop-blur-md"
          data-testid="akashic-ask-bar"
        >
          <AttachmentChips
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            accentVar="var(--foreground)"
            testId="akashic-attachments"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                replying
                  ? t(
                      "Reply — ask the Librarian anything, or let the story go on"
                    )
                  : t("What do you wish to read about?")
              }
              aria-label={
                replying
                  ? t("Reply to the record")
                  : t("What do you wish to read about?")
              }
              data-testid="akashic-wish-input"
              className="focus-glow h-11 min-w-0 flex-1 rounded-full border hairline bg-background/70 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 transition-all duration-300"
            />
            <ChatInputExtras
              scope="akashic"
              size="2xs"
              mobileLarger
              accentVar="var(--foreground)"
              disabled={seeking}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
            <button
              type="submit"
              disabled={
                seeking ||
                (!draft.trim() && attachments.length === 0) ||
                hasPendingAttachments(attachments)
              }
              aria-label={replying ? t("Send the reply") : t("Receive by resonance")}
              data-testid="akashic-wish-send"
              className="akashic-btn focus-glow flex size-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Feather className="size-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={receiveUnasked}
            disabled={seeking}
            title={t("Receive unasked")}
            data-testid="akashic-unasked"
            className="mono-label mx-auto mt-1.5 flex h-6 items-center justify-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground/70 transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Orbit className="size-3" aria-hidden="true" />
            {t("or leave it empty — receive unasked")}
          </button>
        </form>
      </div>
    </div>
  );
}
