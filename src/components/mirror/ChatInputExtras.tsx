"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
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
/*  ChatInputExtras — the microphone and the paperclip, on every       */
/*  chat input. The paperclip receives ONE image and up to THREE       */
/*  documents (PDF, Excel, Word). The microphone records by tap;       */
/*  held for more than 1.5 seconds it opens the scope's own live       */
/*  call — a mini tab in the exact theme of the room it came from.     */
/* ------------------------------------------------------------------ */

const HOLD_MS = 1500;

interface ChatInputExtrasProps {
  scope: LiveScopeKey;
  disabled?: boolean;
  /** Button diameter — md = size-11, sm = size-9, xs = size-8. */
  size?: "md" | "sm" | "xs";
  /** Accent CSS variable for the hold ring and recording glow. */
  accentVar?: string;
  onTranscript: (text: string) => void;
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
  attachments,
  onAttachmentsChange,
}: ChatInputExtrasProps) {
  const t = useT();
  const recorder = useVoiceRecorder();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef(0);
  const pressStartRef = useRef(0);
  const holdFiredRef = useRef(false);
  const wantingTranscriptRef = useRef(false);

  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [liveCallOpen, setLiveCallOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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
      wantingTranscriptRef.current = false;
      toast.error(t("The microphone is unavailable"));
      return;
    }
  }, [recorder, t]);

  const finishTranscript = useCallback(async () => {
    wantingTranscriptRef.current = false;
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
      onTranscript(data.text.trim());
    } catch {
      toast.error(t("Your voice could not be heard — try again"));
    } finally {
      setTranscribing(false);
    }
  }, [recorder, onTranscript, t]);

  const cancelPress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setHolding(false);
    setHoldProgress(0);
  }, []);

  const onMicPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || transcribing) return;
    e.preventDefault();

    /* already recording — this press places the words into the field */
    if (recorder.recording) {
      void finishTranscript();
      return;
    }

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer capture unavailable — the handlers still work */
    }
    holdFiredRef.current = false;
    pressStartRef.current = performance.now();
    setHolding(true);
    wantingTranscriptRef.current = true;

    const tick = () => {
      const p = Math.min(1, (performance.now() - pressStartRef.current) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        /* the 1.5 second threshold — the live call opens itself */
        holdFiredRef.current = true;
        wantingTranscriptRef.current = false;
        cancelPress();
        recorder.cancel();
        setLiveCallOpen(true);
        try {
          navigator.vibrate?.(35);
        } catch {
          /* no haptics here */
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    void beginListening();
  };

  const onMicPointerUp = () => {
    if (holdFiredRef.current) return;
    cancelPress();
    /* TAP-TO-RECORD: the first tap arms the microphone and it stays
       listening; the next tap places the words into the input. Whether
       the release lands before or after the mic finished opening, the
       recording continues — the voice is never lost. */
  };

  const onMicKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (disabled || transcribing) return;
      if (recorder.recording) {
        void finishTranscript();
        return;
      }
      void beginListening();
    }
  };

  const onMicKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      /* toggle mode — the recording simply continues after release */
    }
  };

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
    size === "md" ? "size-11" : size === "sm" ? "size-9" : "size-8";
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

      {/* microphone — tap once to record, tap again to place the words · hold for the live call */}
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
        {holding && (
          <svg
            aria-hidden="true"
            viewBox="0 0 44 44"
            className="pointer-events-none absolute inset-0 size-full -rotate-90"
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke={accentVar}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - holdProgress)}
              opacity={0.35 + holdProgress * 0.65}
            />
          </svg>
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
          onPointerDown={onMicPointerDown}
          onPointerUp={onMicPointerUp}
          onPointerCancel={onMicPointerUp}
          onKeyDown={onMicKeyDown}
          onKeyUp={onMicKeyUp}
          aria-label={
            recording
              ? t("Recording — tap again to place your words")
              : t("Speak by voice")
          }
          title={
            recording
              ? t("Recording — tap again to place your words")
              : `${t("Speak by voice")} — ${t("Hold for a live call")}`
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
