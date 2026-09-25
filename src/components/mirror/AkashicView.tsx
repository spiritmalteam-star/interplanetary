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
  Scroll,
  Share2,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { detectVisualIntent, type VisualizationArtifact } from "@/lib/visualization";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import {
  PreparedPromptFallback,
  VisualizationCard,
  VisualizationPending,
} from "./VisualizationCard";
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
 * AkashicView — the ancient one's reading room. A wall of golden
 * light codes, and one sheet of papyrus on which the Librarian sets
 * down a record retrieved by the visitor's resonance. The hand is
 * old but readable; the voice, an old man behind a great desk.
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
  /* whether the attempt in flight (or the one that failed) was a reply */
  const [replyAttempt, setReplyAttempt] = useState(false);

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
        setRecord({
          title: data.title ?? "A Record Set Aside",
          era: data.era ?? "inscribed in an age the shelves remember",
          record: data.record,
          seal: data.seal ?? "— the Keeper of Records",
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
    ? `${record.title}\n${record.era}\n\n${record.record}\n\n${record.seal}`
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

  const handleListen = useCallback(async () => {
    if (voiceState === "loading") return;
    if (voiceState === "playing") {
      stopVoice();
      return;
    }
    if (!record) return;
    /* The Librarian reads aloud himself — the old man's own voice,
       slower than the world, from behind the great desk. */
    setVoiceState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${record.title}. ${record.era}. ${record.record.replaceAll(
            /\s*\n\s*/g,
            " "
          )} ${record.seal}`,
          voice: "regent",
          pace: 0.82,
        }),
      });
      if (!res.ok) throw new Error("voice quiet");
      const blob = await res.blob();
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
      setVoiceState("idle");
      toast.error(t("The Librarian is quiet. Rest, then listen again."));
    }
  }, [record, voiceState, stopVoice, t]);

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

  /* ---------- composer ---------- */

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

  /* the voice becomes words on the desk — visible for a breath — then
     the resonance is sought on its own */
  const sendTextRef = useRef(sendText);
  sendTextRef.current = sendText;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const handleVoiceSubmit = (text: string) => {
    const prev = draftRef.current.trim();
    const finalText = prev ? `${prev} ${text}` : text;
    setDraft(finalText);
    window.setTimeout(() => sendTextRef.current(finalText), 650);
  };

  const listening = voiceState === "playing";
  /* once a record lies open on the desk, everything written becomes a reply */
  const replying = Boolean(record) && !seeking;
  /* the reveal: while a record's text lies open before the visitor, the
     room recedes — the wall of light codes dims so the parchment may
     draw near (the sheet itself zooms gently toward the reader). */
  const revealed = replying;

  return (
    <div
      className="akashic-world relative flex h-full flex-col overflow-hidden"
      data-testid="akashic-view"
    >
      {/* ---------- the wall of light codes ---------- */}
      <div aria-hidden="true" className="akashic-veil absolute inset-0" />
      <div
        aria-hidden="true"
        className="animate-drift-a pointer-events-none absolute -left-28 top-[-8%] size-[380px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--gd)_14%,transparent),transparent_65%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-drift-c pointer-events-none absolute -right-24 bottom-[-10%] size-[340px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,#b06a2c_12%,transparent),transparent_65%)] blur-3xl"
      />

      {/* the reveal veil — rises only when a record's text is open, deepening
          the room so the parchment stands out and reads easier */}
      <div
        aria-hidden="true"
        data-testid="akashic-dimveil"
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] bg-[#070409] transition-opacity duration-[1200ms] ease-out",
          revealed ? "opacity-[0.74]" : "opacity-0"
        )}
      />

      {/* ---------- threshold: return · the name · a new record ---------- */}
      <header className="relative z-20 flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--gd)_20%,transparent)] bg-[color-mix(in_srgb,#0c0806_66%,transparent)] px-3 py-2.5 backdrop-blur-md sm:px-5">
        <button
          type="button"
          onClick={exitAkashic}
          data-testid="akashic-return"
          aria-label={t("Return from the Library")}
          className="focus-glow group flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] text-[12px] text-foreground/85 transition-all duration-300 hover:-translate-x-px hover:border-[var(--hairline-hover)] hover:text-foreground sm:size-auto sm:justify-start sm:px-3 sm:py-2"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t("Return")}</span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
          <span className="flex items-center gap-2">
            <span className="akashic-halo flex size-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_45%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,transparent)]">
              <Scroll className="size-3 text-[var(--gd)]" aria-hidden="true" />
            </span>
            <h1 className="font-ancient min-w-0 truncate text-[15px] font-semibold tracking-[0.14em] text-[var(--gd)] sm:text-[17px]">
              {t("The Akashic Library")}
            </h1>
          </span>
          <span className="mono-label hidden text-[9px] uppercase tracking-[0.26em] text-muted-foreground/70 sm:block">
            {t("resonance · records · the ancient one")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void seek(null, false)}
          disabled={seeking}
          data-testid="akashic-new"
          aria-label={t("New record")}
          className="focus-glow group flex size-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] text-[12px] text-foreground/85 transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:size-auto sm:justify-start sm:px-3 sm:py-2"
        >
          <RotateCcw
            className="size-3.5 transition-transform duration-500 group-hover:-rotate-180"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t("New record")}</span>
        </button>
      </header>

      {/* ---------- the reading room: one papyrus, one record ---------- */}
      <div className="nice-scroll relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[780px] flex-col px-3 pb-10 pt-5 sm:px-6 sm:pt-7">
          <AnimatePresence mode="wait">
            {/* the unopened shelf — an invitation, before the first record */}
            {!record && !seeking && !error && (
              <motion.div
                key="invitation"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-12 text-center sm:px-12 sm:py-16"
                data-testid="akashic-invitation"
              >
                <span
                  aria-hidden="true"
                  className="ink-gold mb-5 block text-[22px] leading-none"
                >
                  ❧
                </span>
                <p className="ink-hand mx-auto max-w-[460px] text-[18px] leading-[1.9] sm:text-[20px]">
                  {t(
                    "Set down a resonance — a name, a question, a feeling — and the Librarian will draw out the record it belongs to. Or leave the desk silent, and the Library will choose for you."
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => void seek(null, false)}
                  data-testid="akashic-receive"
                  className="papyrus-btn focus-glow mt-8 inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-[13px] font-semibold tracking-[0.1em]"
                >
                  <Feather className="size-4" aria-hidden="true" />
                  {t("Receive a record")}
                </button>
              </motion.div>
            )}

            {/* the ink forming — the Librarian walks the shelves */}
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
                <span
                  aria-hidden="true"
                  className="ink-gold mb-6 block text-center text-[22px] leading-none"
                >
                  ❧
                </span>
                <div className="mx-auto flex max-w-[480px] flex-col gap-3.5">
                  {[86, 70, 92, 60, 78].map((w, i) => (
                    <div
                      key={i}
                      className="ink-shimmer h-[11px] rounded-full"
                      style={{ width: `${w}%`, animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </div>
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
                  className="papyrus-btn focus-glow mt-7 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[12.5px] font-semibold tracking-[0.08em]"
                >
                  <Feather className="size-4" aria-hidden="true" />
                  {replyAttempt
                    ? t("Set the reply down again")
                    : t("Ask again, softly")}
                </button>
              </motion.div>
            )}

            {/* the record itself — ink on papyrus. As the text is revealed
                the sheet zooms gently toward the reader (anchored at the
                title edge) so the old hand reads easier. */}
            {record && !seeking && (
              <motion.article
                key="record"
                initial={{ opacity: 0, y: 16, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1.035 }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                  scale: { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
                }}
                style={{ transformOrigin: "50% 0%" }}
                className="papyrus papyrus-frame relative mx-auto w-full rounded-2xl px-6 py-9 sm:px-12 sm:py-12"
                data-testid="akashic-record"
              >
                {/* corner light codes */}
                <span
                  aria-hidden="true"
                  className="ink-gold pointer-events-none absolute left-3 top-2.5 text-[11px] opacity-70"
                >
                  ◆
                </span>
                <span
                  aria-hidden="true"
                  className="ink-gold pointer-events-none absolute right-3 top-2.5 text-[11px] opacity-70"
                >
                  ◆
                </span>
                <span
                  aria-hidden="true"
                  className="ink-gold pointer-events-none absolute bottom-2.5 left-3 text-[11px] opacity-70"
                >
                  ◆
                </span>
                <span
                  aria-hidden="true"
                  className="ink-gold pointer-events-none absolute bottom-2.5 right-3 text-[11px] opacity-70"
                >
                  ◆
                </span>

                {/* title & era */}
                <header className="text-center">
                  <h2
                    className="ink-title text-[24px] font-semibold leading-tight tracking-[0.05em] sm:text-[28px]"
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
                        "linear-gradient(90deg, transparent, rgba(112,82,36,0.55), transparent)",
                    }}
                  />
                </header>

                {/* the record, in the old hand — readable */}
                <div className="mt-7 space-y-5" data-testid="akashic-body">
                  {record.record.split(/\n{2,}/).map((para, i) => (
                    <p
                      key={i}
                      className="ink-hand text-[18.5px] leading-[1.95] sm:text-[20px]"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* the seal */}
                <p
                  className="ink-hand ink-gold mt-8 text-center text-[16.5px] italic"
                  data-testid="akashic-seal"
                >
                  {record.seal}
                </p>

                {/* the desk actions — reply · copy · share · the Librarian's voice */}
                <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5 border-t border-[rgba(112,82,36,0.28)] pt-6">
                  <button
                    type="button"
                    onClick={() => void seek(null, true)}
                    disabled={seeking}
                    data-testid="akashic-continue"
                    className="papyrus-btn focus-glow inline-flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-semibold tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <BookOpen className="size-3.5" aria-hidden="true" />
                    {t("Continue the story")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    data-testid="akashic-copy"
                    className="papyrus-btn focus-glow inline-flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-semibold tracking-[0.1em]"
                  >
                    {copied ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="size-3.5" aria-hidden="true" />
                    )}
                    {copied ? t("copied") : t("Copy")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    data-testid="akashic-share"
                    className="papyrus-btn focus-glow inline-flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-semibold tracking-[0.1em]"
                  >
                    <Share2 className="size-3.5" aria-hidden="true" />
                    {t("Share")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleListen()}
                    data-testid="akashic-listen"
                    aria-label={
                      listening
                        ? t("Stop")
                        : t("Listen to the Librarian's voice")
                    }
                    className={cn(
                      "papyrus-btn focus-glow inline-flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-semibold tracking-[0.1em]",
                      listening && "bg-[rgba(122,90,30,0.18)]"
                    )}
                  >
                    {voiceState === "loading" ? (
                      <LoaderCircle
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : listening ? (
                      <Square className="size-3 fill-current" aria-hidden="true" />
                    ) : (
                      <Feather className="size-3.5" aria-hidden="true" />
                    )}
                    {listening
                      ? t("Stop")
                      : voiceState === "loading"
                        ? t("Gathering voice")
                        : t("The Librarian reads")}
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
                  accent="var(--gd)"
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
                    className="papyrus-btn focus-glow mt-5 inline-flex h-10 items-center gap-2 rounded-full px-5 text-[12px] font-semibold tracking-[0.08em]"
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
                      accent="var(--gd)"
                      testIdPrefix="akashic-visual"
                      onRegenerate={() =>
                        void requestVisualization(visual.request)
                      }
                    />
                  ) : (
                    <PreparedPromptFallback
                      artifact={visual.artifact}
                      accent="var(--gd)"
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

      {/* ---------- setting the resonance on the desk ---------- */}
      <div className="relative z-20 border-t border-[color-mix(in_srgb,var(--gd)_20%,transparent)] bg-[color-mix(in_srgb,#0c0806_66%,transparent)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-5">
        <form
          onSubmit={send}
          className="mx-auto w-full max-w-[680px]"
          data-testid="akashic-composer"
        >
          <AttachmentChips
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            accentVar="var(--gd)"
            testId="akashic-attachments"
          />
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void seek(null, false)}
            disabled={seeking}
            aria-label={t("Receive unasked")}
            title={t("Receive unasked")}
            data-testid="akashic-unprompted"
            className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_30%,transparent)] text-[var(--gd)] transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:shadow-[0_0_22px_-8px_color-mix(in_srgb,var(--gd)_75%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Orbit className="size-4" aria-hidden="true" />
          </button>

          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              replying
                ? t(
                    "Reply — ask the Librarian anything, or let the story go on"
                  )
                : t(
                    "Write your resonance — a name, a question, a feeling — or leave it still"
                  )
            }
            aria-label={replying ? t("Reply to the record") : t("Write your resonance")}
            data-testid="akashic-input"
            className="focus-glow h-11 min-w-0 flex-1 rounded-full border border-[color-mix(in_srgb,var(--gd)_26%,transparent)] bg-[color-mix(in_srgb,#1a1108_45%,transparent)] px-4 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-[color-mix(in_srgb,var(--gd)_50%,transparent)] focus:shadow-[0_0_28px_-10px_color-mix(in_srgb,var(--gd)_70%,transparent)] focus:outline-none"
          />

          <ChatInputExtras
            scope="akashic"
            accentVar="var(--gd)"
            disabled={seeking}
            onTranscript={(text) =>
              setDraft((prev) => (prev ? `${prev} ${text}` : text))
            }
            onVoiceSubmit={handleVoiceSubmit}
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
            data-testid="akashic-seek"
            className="akashic-btn focus-glow flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Feather className="size-4" aria-hidden="true" />
          </button>
          </div>
        </form>
        <p className="mono-label mt-2.5 text-center text-[9px] uppercase tracking-[0.26em] text-muted-foreground/50">
          {t("received by resonance — the ancient one remembers")}
        </p>
      </div>
    </div>
  );
}
