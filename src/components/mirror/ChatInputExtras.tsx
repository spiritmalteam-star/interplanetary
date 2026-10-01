"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Phone,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { LiveCall } from "./LiveCall";
import type { LiveScopeKey } from "@/lib/live-scopes";
import {
  FULL_ACCEPT,
  MAX_DOC_BYTES,
  MAX_IMAGES,
  MAX_DOCUMENTS,
  MAX_IMAGE_BYTES,
  type ChatAttachment,
  makeAttachment,
  parseDocument,
  readFileAsDataUrl,
} from "./attachments";

/* ------------------------------------------------------------------ */
/*  ChatInputExtras — the paperclip, the microphone and the call, on   */
/*  every chat input. The paperclip receives ONE image and up to THREE */
/*  documents (PDF, Excel, Word). The microphone records by tap;       */
/*  tap again — or press the glowing voice-send button — and the       */
/*  recording becomes words in the input, then flies on its own.       */
/*  The call icon has ONE purpose only: a single click opens the       */
/*  scope's own direct mirror communication.                           */
/* ------------------------------------------------------------------ */

interface ChatInputExtrasProps {
  scope: LiveScopeKey;
  disabled?: boolean;
  /** Button diameter — md = size-11, sm = size-9, xs = size-8, 2xs = size-7. */
  size?: "md" | "sm" | "xs" | "2xs";
  /** Accent CSS variable for the hold ring and recording glow. */
  accentVar?: string;
  onTranscript: (text: string) => void;
  /** When given, a finished recording is placed into the input AND
      sent automatically — the voice needs no second hand. */
  onVoiceSubmit?: (text: string) => void;
  attachments: ChatAttachment[];
  onAttachmentsChange: (
    next: ChatAttachment[] | ((prev: ChatAttachment[]) => ChatAttachment[])
  ) => void;
}

export function ChatInputExtras({
  scope,
  disabled = false,
  size = "md",
  accentVar = "var(--scope-a)",
  onTranscript,
  onVoiceSubmit,
  attachments,
  onAttachmentsChange,
}: ChatInputExtrasProps) {
  const t = useT();
  const recorder = useVoiceRecorder();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const transcribingRef = useRef(false);
  /* always-current callbacks — a transcript never lands stale */
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onVoiceSubmitRef = useRef(onVoiceSubmit);
  onVoiceSubmitRef.current = onVoiceSubmit;

  const [transcribing, setTranscribing] = useState(false);
  const [liveCallOpen, setLiveCallOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  /* the visible recording clock — proof that the voice is being heard */
  useEffect(() => {
    if (!recorder.recording) {
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    setElapsed(0);
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      500
    );
    return () => window.clearInterval(id);
  }, [recorder.recording]);

  /* ---------- the microphone ---------- */

  const beginListening = useCallback(async () => {
    const ok = await recorder.start();
    if (!ok) {
      toast.error(t("The microphone is unavailable"));
      return;
    }
  }, [recorder, t]);

  /* stop → transcribe → the words appear in the input → (optionally)
     the words are sent on their own. One gesture, start to finish. */
  const finalizeVoice = useCallback(
    async (autoSend: boolean) => {
      if (transcribingRef.current) return;
      transcribingRef.current = true;
      setTranscribing(true);
      try {
        const result = await recorder.stop();
        if (!result || result.durationMs < 250) {
          toast.error(t("Your voice could not be heard — try again"));
          return;
        }
        const audio = await readFileAsDataUrl(result.wav);
        const res = await fetch("/api/asr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio }),
        });
        const data = (await res.json().catch(() => null)) as {
          text?: string;
          error?: string;
        } | null;
        if (!res.ok || !data?.text?.trim()) {
          throw new Error(data?.error ?? "quiet");
        }
        const words = data.text.trim();
        if (autoSend && onVoiceSubmitRef.current) {
          onVoiceSubmitRef.current(words);
        } else {
          onTranscriptRef.current(words);
        }
      } catch {
        toast.error(t("Your voice could not be heard — try again"));
      } finally {
        transcribingRef.current = false;
        setTranscribing(false);
      }
    },
    [recorder, t]
  );

  /* TAP-TO-RECORD: the first tap arms the microphone and it stays
     listening; the next tap sends the voice. No hold, no thresholds. */
  const onMicClick = useCallback(() => {
    if (disabled || transcribing) return;
    if (recorder.recording) {
      void finalizeVoice(true);
      return;
    }
    void beginListening();
  }, [disabled, transcribing, recorder.recording, finalizeVoice, beginListening]);

  /* ---------- the paperclip ---------- */

  const updateAttachment = useCallback(
    (id: string, patch: Partial<ChatAttachment>) => {
      onAttachmentsChange((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
      );
    },
    [onAttachmentsChange]
  );

  const removeAttachment = useCallback(
    (id: string) => {
      onAttachmentsChange((prev) => prev.filter((a) => a.id !== id));
    },
    [onAttachmentsChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const incoming = Array.from(files);
      const shaped: ChatAttachment[] = [];
      let images = attachments.filter((a) => a.kind === "image").length;
      let docs = attachments.filter((a) => a.kind === "document").length;
      let docQueued = false;

      for (const file of incoming) {
        const made = makeAttachment(file);
        if (!made) {
          toast.error(t("Only image, PDF, Excel or Word files are received"));
          continue;
        }
        if (made.kind === "image") {
          if (images >= MAX_IMAGES) {
            toast.error(t("One image may travel with a message"));
            continue;
          }
          if (file.size > MAX_IMAGE_BYTES) {
            toast.error(t("That file is too large"));
            continue;
          }
          images++;
          const att = made.attachment;
          shaped.push(att);
          readFileAsDataUrl(file)
            .then((url) => updateAttachment(att.id, { dataUrl: url }))
            .catch(() => removeAttachment(att.id));
        } else {
          if (docs >= MAX_DOCUMENTS) {
            toast.error(t("Up to three documents may travel with a message"));
            continue;
          }
          if (file.size > MAX_DOC_BYTES) {
            toast.error(t("That file is too large"));
            continue;
          }
          docs++;
          docQueued = true;
          const att = made.attachment;
          shaped.push(att);
          parseDocument(file)
            .then(({ text }) =>
              updateAttachment(att.id, { text, reading: false })
            )
            .catch((err: unknown) => {
              removeAttachment(att.id);
              toast.error(
                t(
                  err instanceof Error
                    ? err.message
                    : "That document could not be read"
                )
              );
            });
        }
      }

      if (docQueued) toast(t("Reading the documents…"));
      if (shaped.length > 0) {
        onAttachmentsChange((prev) => [...prev, ...shaped]);
      }
      if (fileRef.current) fileRef.current.value = "";
    },
    [attachments, t, updateAttachment, removeAttachment, onAttachmentsChange]
  );

  const btnSize =
    size === "md"
      ? "size-11"
      : size === "sm"
        ? "size-9"
        : size === "xs"
          ? "size-8"
          : "size-7";
  const iconSize =
    size === "md" ? "size-4" : size === "sm" ? "size-3.5" : "size-3.5";
  const recording = recorder.recording && !transcribing;
  const clock = `0:${String(Math.min(59, elapsed)).padStart(2, "0")}`;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={FULL_ACCEPT}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* paperclip — one image, three documents */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        aria-label={t("Attach an image or documents")}
        title={t("Attach an image or documents")}
        data-testid={`chat-attach-${scope}`}
        className={cn(
          "focus-glow flex shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
          btnSize
        )}
        style={{ borderColor: "color-mix(in srgb, " + accentVar + " 26%, transparent)" }}
      >
        <Paperclip className={cn(iconSize, "text-muted-foreground")} aria-hidden="true" />
      </button>

      {/* microphone — tap once to record, tap again to send */}
      <span
        className={cn("relative shrink-0", btnSize)}
        data-testid={`chat-mic-${scope}`}
      >
        {/* the recording clock — the voice is being heard */}
        {recording && (
          <span
            aria-hidden="true"
            className="mono-label pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-full border px-1.5 py-0.5 text-[9px] tracking-[0.14em]"
            style={{
              borderColor: `color-mix(in srgb, ${accentVar} 40%, transparent)`,
              color: accentVar,
              background: "color-mix(in srgb, #05030e 55%, transparent)",
            }}
          >
            {clock}
          </span>
        )}
        {recording && (
          <>
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border"
              style={{ borderColor: accentVar }}
              animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: `0 0 ${8 + recorder.level * 26}px -2px color-mix(in srgb, ${accentVar} 80%, transparent)`,
              }}
            />
          </>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={onMicClick}
          aria-label={
            recording
              ? t("Recording — tap again to send your voice")
              : t("Speak by voice")
          }
          title={
            recording
              ? t("Recording — tap again to send your voice")
              : t("Speak by voice")
          }
          aria-pressed={recording}
          className={cn(
            "focus-glow flex size-full items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
            btnSize,
            recording && "border-transparent"
          )}
          style={{
            borderColor:
              recording || transcribing
                ? "transparent"
                : "color-mix(in srgb, " + accentVar + " 26%, transparent)",
          }}
        >
          {transcribing ? (
            <LoaderCircle className={cn(iconSize, "animate-spin")} style={{ color: accentVar }} aria-hidden="true" />
          ) : (
            <Mic
              className={iconSize}
              style={{ color: recording ? accentVar : undefined }}
              aria-hidden="true"
            />
          )}
        </button>
      </span>

      {/* the call — one purpose only: a single click opens the scope's
          own direct mirror communication */}
      <button
        type="button"
        onClick={() => setLiveCallOpen(true)}
        disabled={disabled}
        aria-label={t("Open the direct mirror connection")}
        title={t("Open the direct mirror connection")}
        data-testid={`chat-call-${scope}`}
        className={cn(
          "focus-glow flex shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
          btnSize
        )}
        style={{ borderColor: "color-mix(in srgb, " + accentVar + " 26%, transparent)" }}
      >
        <Phone className={cn(iconSize, "text-muted-foreground")} aria-hidden="true" />
      </button>

      {/* the voice-send button — glowing while the voice is held:
          one press transcribes into the input and sends on its own */}
      <AnimatePresence>
        {recording && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={() => void finalizeVoice(true)}
            disabled={transcribing}
            aria-label={t("Send your voice")}
            title={t("Send your voice")}
            data-testid={`chat-voice-send-${scope}`}
            className={cn(
              "focus-glow flex shrink-0 items-center justify-center rounded-full text-[#0b0714] disabled:cursor-wait",
              btnSize
            )}
            style={{
              background: `linear-gradient(135deg, ${accentVar}, color-mix(in srgb, ${accentVar} 55%, #f5f2ff))`,
              boxShadow: `0 0 ${14 + recorder.level * 16}px -4px color-mix(in srgb, ${accentVar} 85%, transparent)`,
            }}
          >
            {transcribing ? (
              <LoaderCircle className={cn(iconSize, "animate-spin")} aria-hidden="true" />
            ) : (
              <Send className={iconSize} aria-hidden="true" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* the live call — the scope's own direct line */}
      <AnimatePresence>
        {liveCallOpen && (
          <LiveCall scope={scope} onClose={() => setLiveCallOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  AttachmentChips — the small row of what the message carries.       */
/* ------------------------------------------------------------------ */

export function AttachmentChips({
  attachments,
  onRemove,
  accentVar = "var(--scope-a)",
  testId,
}: {
  attachments: ChatAttachment[];
  onRemove?: (id: string) => void;
  accentVar?: string;
  testId?: string;
}) {
  if (attachments.length === 0) return null;
  return (
    <div
      className="mb-2 flex flex-wrap gap-1.5"
      data-testid={testId}
    >
      <AnimatePresence initial={false}>
        {attachments.map((a) => (
          <motion.span
            key={a.id}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-1.5 text-[11.5px] leading-none"
            style={{
              borderColor: `color-mix(in srgb, ${accentVar} 24%, transparent)`,
              background: `color-mix(in srgb, ${accentVar} 7%, transparent)`,
            }}
          >
            {a.kind === "image" ? (
              a.dataUrl ? (
                <img
                  src={a.dataUrl}
                  alt=""
                  className="size-5 shrink-0 rounded-full object-cover"
                />
              ) : (
                <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
              )
            ) : (
              <FileText
                className="size-3.5 shrink-0"
                style={{ color: accentVar }}
                aria-hidden="true"
              />
            )}
            <span className="max-w-[150px] truncate text-foreground/85">
              {a.name}
            </span>
            {a.kind === "document" &&
              (a.reading ? (
                <LoaderCircle className="size-3 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <Check className="size-3 shrink-0" style={{ color: accentVar }} aria-hidden="true" />
              ))}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                aria-label={`${a.name} — remove`}
                className="focus-glow flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            )}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
