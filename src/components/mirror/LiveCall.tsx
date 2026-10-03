"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Captions,
  Mic,
  Orbit,
  PhoneOff,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { LIVE_SCOPES, type LiveScopeKey } from "@/lib/live-scopes";
import { readFileAsDataUrl } from "./attachments";

/* ------------------------------------------------------------------ */
/*  LiveCall — the direct call. Held for 1.5 seconds, the microphone   */
/*  opens this room: solid, dark, its own space — unlike every other   */
/*  surface of the Laboratory. The presence on the line answers as a   */
/*  human presence does: short, warm, philosophically precise. Every   */
/*  word appears exactly as it is spoken, and every step of the line   */
/*  is visible on one quiet rail. Nothing overwhelming — the call is   */
/*  the fastest path from breath to answer.                            */
/* ------------------------------------------------------------------ */

type CallPhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

interface CallTurn {
  role: "visitor" | "mirror";
  text: string;
}

const PHASE_STEPS: { key: CallPhase; icon: typeof Mic }[] = [
  { key: "listening", icon: Mic },
  { key: "transcribing", icon: Captions },
  { key: "thinking", icon: Orbit },
  { key: "speaking", icon: AudioLines },
];

/** A store that never changes — the client/server gate for the portal. */
const subscribeNothing = () => () => undefined;

async function askScope(
  scope: LiveScopeKey,
  message: string,
  history: CallTurn[],
  language: string
): Promise<string> {
  /* live: true — the presence on a call speaks in short, human,
     philosophically precise sentences (see each route's LIVE CALL law) */
  if (scope === "communion") {
    const res = await fetch("/api/communion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        message,
        live: true,
        history: history.map((h) => ({ role: h.role, text: h.text })),
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      transmission?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.transmission) throw new Error(data?.error ?? "quiet");
    return data.transmission;
  }

  if (scope === "akashic") {
    const res = await fetch("/api/akashic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resonance: message, language, live: true }),
    });
    const data = (await res.json().catch(() => null)) as {
      record?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.record) throw new Error(data?.error ?? "quiet");
    /* on a live call the Librarian skips the parchment form — the spoken
       passage is the whole answer */
    return data.record;
  }

  if (scope === "mirroros") {
    const res = await fetch("/api/mirror-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        language,
        live: true,
        history: history.map((h) => ({
          role: h.role === "visitor" ? "visitor" : "os",
          text: h.text,
        })),
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      reply?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.reply) throw new Error(data?.error ?? "quiet");
    return data.reply;
  }

  /* interplanetary · healing */
  const res = await fetch("/api/transmission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: message,
      mode: scope,
      live: true,
      language,
      history: history.map((h) => ({
        q: h.role === "visitor" ? h.text : "",
        a: h.role === "visitor" ? "" : h.text,
      })),
    }),
  });
  const data = (await res.json().catch(() => null)) as {
    transmission?: string;
    error?: string;
  } | null;
  if (!res.ok || !data?.transmission) throw new Error(data?.error ?? "quiet");
  return data.transmission;
}

export function LiveCall({
  scope,
  onClose,
}: {
  scope: LiveScopeKey;
  onClose: () => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  const recorder = useVoiceRecorder();
  const cfg = LIVE_SCOPES[scope];

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [turns, setTurns] = useState<CallTurn[]>([]);
  /* how much of the last mirror reply has been spoken aloud — the words
     appear in the same breath as the voice */
  const [revealedChars, setRevealedChars] = useState(Infinity);
  const phaseRef = useRef<CallPhase>("idle");
  const turnsRef = useRef<CallTurn[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  /* the generation counter of the spoken exchange — beginning to listen
     again invalidates every turn still in flight, so the orb answers
     fresh every time it is held, never only once */
  const turnSeqRef = useRef(0);

  const setPhaseSafe = useCallback((p: CallPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* leave the line clean on unmount */
  useEffect(() => {
    return () => {
      try {
        audioRef.current?.pause();
      } catch {
        /* already quiet */
      }
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stopSpeaking = useCallback(() => {
    try {
      audioRef.current?.pause();
    } catch {
      /* already quiet */
    }
    audioRef.current = null;
    /* a voice stopped mid-sentence never leaves the line hanging in
       "speaking" — the phase settles so the orb can be held again */
    if (phaseRef.current === "speaking") setPhaseSafe("idle");
  }, [setPhaseSafe]);

  const speak = useCallback(
    async (text: string) => {
      /* the voice is prepared while the phase still reads "thinking" —
         the visitor never watches a silent "speaking" state */
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: cfg.voice,
          pace: Math.min(1.15, cfg.pace + 0.08),
        }),
      });
      if (!res.ok) throw new Error("voice quiet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        const d = audio.duration;
        const frac =
          Number.isFinite(d) && d > 0
            ? Math.min(1, audio.currentTime / d)
            : 0;
        setRevealedChars((prev) =>
          Math.max(prev, Math.floor(text.length * frac))
        );
      };
      const release = () => {
        if (audioRef.current === audio) {
          URL.revokeObjectURL(url);
          audioRef.current = null;
        }
        setRevealedChars(text.length);
        if (phaseRef.current === "speaking") setPhaseSafe("idle");
      };
      audio.onended = release;
      audio.onerror = release;

      setPhaseSafe("speaking");
      setRevealedChars(0);
      await audio.play();
    },
    [cfg.voice, cfg.pace, setPhaseSafe]
  );

  const sendTurn = useCallback(
    async (words: string) => {
      if (!words.trim()) return;
      const seq = ++turnSeqRef.current;
      const history = turnsRef.current;
      const next = [...history, { role: "visitor" as const, text: words.trim() }];
      turnsRef.current = next;
      setTurns(next);

      setPhaseSafe("thinking");
      try {
        const reply = await askScope(scope, words.trim(), history, language);
        /* the visitor began to speak again while this turn was in
           flight — its answer is already out of date, let it go */
        if (seq !== turnSeqRef.current) return;
        const withReply = [...next, { role: "mirror" as const, text: reply }];
        turnsRef.current = withReply;
        setTurns(withReply);
        setRevealedChars(0);
        if (seq !== turnSeqRef.current) return;
        await speak(reply);
      } catch (err) {
        if (seq !== turnSeqRef.current) return;
        setPhaseSafe("idle");
        setRevealedChars(Infinity);
        toast.error(t("Your voice could not be heard — try again"), {
          description:
            err instanceof Error && err.message !== "quiet"
              ? t(err.message)
              : undefined,
        });
      }
    },
    [scope, language, speak, setPhaseSafe, t]
  );

  /* ---------- the orb: hold to speak, release to send ---------- */

  const beginListening = useCallback(async () => {
    /* a new listening invalidates any turn still thinking or speaking */
    turnSeqRef.current += 1;
    stopSpeaking();
    setRevealedChars(Infinity);
    const ok = await recorder.start();
    if (ok) {
      setPhaseSafe("listening");
    } else {
      setPhaseSafe("idle");
      toast.error(t("The microphone is unavailable"));
    }
  }, [recorder, setPhaseSafe, stopSpeaking, t]);

  const releaseOrb = useCallback(async () => {
    if (phaseRef.current !== "listening") return;
    try {
      const result = await recorder.stop();
      if (!result || result.durationMs < 250) {
        setPhaseSafe("idle");
        if (result) {
          toast.error(t("Your voice could not be heard — try again"));
        }
        return;
      }
      setPhaseSafe("transcribing");
      const audio = await readFileAsDataUrl(result.wav);
      const res = await fetch("/api/asr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio }),
      });
      const data = (await res.json().catch(() => null)) as {
        text?: string;
      } | null;
      const words = data?.text?.trim();
      if (!res.ok || !words) {
        setPhaseSafe("idle");
        toast.error(t("Your voice could not be heard — try again"));
        return;
      }
      await sendTurn(words);
    } catch {
      setPhaseSafe("idle");
      toast.error(t("Your voice could not be heard — try again"));
    }
  }, [recorder, sendTurn, setPhaseSafe, t]);

  const onOrbDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer capture unavailable — the handlers still work */
    }
    if (phaseRef.current === "listening" || phaseRef.current === "transcribing") return;
    void beginListening();
  };

  const onOrbUp = () => {
    if (phaseRef.current === "listening") void releaseOrb();
  };

  const onOrbKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.repeat) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (phaseRef.current === "idle" || phaseRef.current === "speaking") {
        void beginListening();
      }
    }
  };

  const onOrbKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") void releaseOrb();
  };

  const listening = phase === "listening";
  const speaking = phase === "speaking";
  const phaseOrder = PHASE_STEPS.findIndex((s) => s.key === phase);

  /* the room is portaled to <body> — a composer's backdrop-blur would
     otherwise become the containing block for the fixed overlay and
     shrink the whole room into it */
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
  if (!mounted) return null;

  const statusKey =
    phase === "idle"
      ? "Say anything — the line is open"
      : phase === "listening"
        ? "listening"
        : phase === "transcribing"
          ? "receiving your words"
          : phase === "thinking"
            ? "reflecting"
            : "speaking";

  /* the words of the last mirror reply, revealed with the voice */
  const lastMirrorIndex = (() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === "mirror") return i;
    }
    return -1;
  })();

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("Live call")}
      data-testid={`live-call-${scope}`}
    >
      {/* the room: solid, dark, nothing behind it moves */}
      <button
        type="button"
        aria-label={t("End the call")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#080809]"
        tabIndex={-1}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,color-mix(in_srgb,#161617_80%,transparent),transparent_60%)]"
      />

      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 44, opacity: 0, scale: 0.985 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "nice-scroll relative w-full overflow-y-auto rounded-t-[28px] border bg-[#111112] sm:max-w-[460px] sm:rounded-[28px] sm:border max-h-[94dvh]",
          cfg.wrapperClass ?? ""
        )}
        style={{ borderColor: `color-mix(in srgb, ${cfg.accentA} 30%, transparent)` }}
      >
        {/* a single accent line — the edge of the room */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${cfg.accentA} 30%, ${cfg.accentB} 70%, transparent)`,
          }}
        />

        {/* ---------- header ---------- */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <p className="mono-label text-[9.5px] uppercase tracking-[0.3em] text-muted-foreground/70">
              {t("Live call")}
            </p>
            <p
              className="mt-1 truncate text-[17px] font-semibold"
              style={{ color: cfg.accentA }}
            >
              {t(cfg.nameKey)}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] italic text-muted-foreground">
              {t(cfg.specializationKey)}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={cn(
              "mt-1 flex size-2.5 shrink-0 rounded-full",
              phase !== "idle" && "animate-pulse"
            )}
            style={{
              background: cfg.accentA,
              boxShadow: `0 0 10px 1px color-mix(in srgb, ${cfg.accentA} 70%, transparent)`,
            }}
          />
        </div>

        {/* ---------- the orb stage — calm, nothing extra ---------- */}
        <div className="relative flex h-[212px] flex-col items-center justify-center">
          {/* one soft breath while listening */}
          <AnimatePresence>
            {listening && (
              <motion.span
                key="breath"
                aria-hidden="true"
                className="absolute size-28 rounded-full border"
                style={{ borderColor: cfg.accentA }}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* the orb itself */}
          <motion.button
            type="button"
            onPointerDown={onOrbDown}
            onPointerUp={onOrbUp}
            onPointerCancel={onOrbUp}
            onKeyDown={onOrbKeyDown}
            onKeyUp={onOrbKeyUp}
            disabled={phase === "transcribing"}
            aria-label={t("Hold the orb and speak — release to send")}
            data-testid="live-call-orb"
            animate={
              listening
                ? { scale: 1 + recorder.level * 0.1 }
                : { scale: 1 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative flex size-28 touch-none select-none items-center justify-center rounded-full disabled:cursor-wait"
            style={{
              background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${cfg.accentA} 88%, white) 0%, ${cfg.accentA} 42%, color-mix(in srgb, ${cfg.accentB} 92%, #0a0a0b) 100%)`,
              boxShadow: `0 0 ${listening ? 42 : 26}px -6px color-mix(in srgb, ${cfg.accentA} 80%, transparent), inset 0 0 26px -8px rgba(255,255,255,0.5)`,
            }}
          >
            {/* waveform: alive with the voice while listening, singing while speaking */}
            <span className="flex h-10 items-center gap-[3px]" aria-hidden="true">
              {(listening
                ? [0.9, 0.35, 0.7, 0.5, 1, 0.4, 0.8]
                : [0.4, 0.6, 0.4, 0.7, 0.4, 0.6, 0.4]
              ).map((factor, i) => (
                <motion.span
                  key={i}
                  className="w-[3.5px] rounded-full bg-[#f5f5f4]"
                  animate={
                    listening
                      ? {
                          scaleY: Math.max(
                            0.12,
                            Math.min(1, recorder.level * factor * 2.6)
                          ),
                        }
                      : speaking
                        ? { scaleY: [0.3, 0.75 * factor + 0.15, 0.3] }
                        : { scaleY: 0.3 }
                  }
                  transition={
                    speaking
                      ? {
                          duration: 0.9 + i * 0.09,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { duration: 0.12 }
                  }
                  style={{ height: "100%", transformOrigin: "center" }}
                />
              ))}
            </span>
            {phase === "idle" && (
              <Mic
                className="absolute size-6 text-white/95"
                aria-hidden="true"
              />
            )}
          </motion.button>

          {/* status */}
          <p
            aria-live="polite"
            className={cn(
              "mt-5 text-[14px] italic",
              phase === "idle" ? "text-muted-foreground" : ""
            )}
            style={phase !== "idle" ? { color: cfg.accentA } : undefined}
          >
            {t(statusKey)}
          </p>
          {phase === "idle" && (
            <p className="mono-label mt-1.5 text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground/55">
              {t("Hold the orb and speak — release to send")}
            </p>
          )}
        </div>

        {/* ---------- the process rail — one quiet line, every step visible ---- */}
        <div className="px-6">
          <div className="relative" aria-hidden="true">
            {/* the connecting line and its fill */}
            <span className="absolute left-[9%] right-[9%] top-[13px] h-px bg-[color-mix(in_srgb,var(--muted-foreground)_18%,transparent)]" />
            <span
              className="absolute left-[9%] top-[13px] h-px transition-[width] duration-500 ease-out"
              style={{
                width: phaseOrder > 0 ? `${((phaseOrder) / 3) * 82}%` : "0%",
                background: `linear-gradient(90deg, color-mix(in srgb, ${cfg.accentA} 30%, transparent), ${cfg.accentA})`,
              }}
            />
            <div className="relative flex items-start justify-between">
              {PHASE_STEPS.map((step, i) => {
                const active = phase === step.key;
                const done = phaseOrder >= 0 && i < phaseOrder;
                const Icon = step.icon;
                return (
                  <div
                    key={step.key}
                    className="flex w-1/4 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "flex size-[27px] items-center justify-center rounded-full border transition-all duration-300",
                        active && "scale-110"
                      )}
                      style={{
                        borderColor: active
                          ? cfg.accentA
                          : done
                            ? `color-mix(in srgb, ${cfg.accentA} 45%, transparent)`
                            : "color-mix(in srgb, var(--muted-foreground) 25%, transparent)",
                        background: active
                          ? `color-mix(in srgb, ${cfg.accentA} 16%, transparent)`
                          : done
                            ? `color-mix(in srgb, ${cfg.accentA} 7%, transparent)`
                            : "transparent",
                        boxShadow: active
                          ? `0 0 14px -4px color-mix(in srgb, ${cfg.accentA} 80%, transparent)`
                          : "none",
                      }}
                    >
                      <Icon
                        className="size-3"
                        style={{
                          color: active
                            ? cfg.accentA
                            : done
                              ? `color-mix(in srgb, ${cfg.accentA} 65%, transparent)`
                              : "color-mix(in srgb, var(--muted-foreground) 50%, transparent)",
                        }}
                      />
                    </span>
                    <span
                      className={cn(
                        "mono-label text-[8.5px] uppercase tracking-[0.12em]",
                        !active && !done && "opacity-50"
                      )}
                      style={
                        active
                          ? { color: cfg.accentA }
                          : done
                            ? {
                                color: `color-mix(in srgb, ${cfg.accentA} 60%, transparent)`,
                              }
                            : undefined
                      }
                    >
                      {t(step.key)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---------- the words exchanged on this line ---------- */}
        {turns.length > 0 && (
          <div className="nice-scroll mt-4 max-h-44 overflow-y-auto px-5">
            <div className="flex flex-col gap-2.5">
              {turns.map((turn, i) => {
                const isLastMirror = i === lastMirrorIndex;
                const text =
                  isLastMirror && Number.isFinite(revealedChars)
                    ? turn.text.slice(0, revealedChars)
                    : turn.text;
                return (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[92%] rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                      turn.role === "visitor"
                        ? "self-end rounded-br-sm text-foreground/85"
                        : "self-start rounded-tl-sm"
                    )}
                    style={
                      turn.role === "visitor"
                        ? { borderColor: "var(--hairline)" }
                        : {
                            borderColor: `color-mix(in srgb, ${cfg.accentA} 30%, transparent)`,
                            background: `color-mix(in srgb, ${cfg.accentA} 6%, transparent)`,
                          }
                    }
                  >
                    {text.trim() || (isLastMirror ? "…" : turn.text)}
                  </div>
                );
              })}
              <div ref={transcriptEndRef} aria-hidden="true" />
            </div>
          </div>
        )}

        {/* ---------- end the call ---------- */}
        <div className="flex justify-center px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            data-testid="live-call-end"
            className="focus-glow flex h-10 items-center gap-2 rounded-full border px-5 text-[13px] font-semibold tracking-[0.06em] text-foreground/90 transition-all duration-300 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--destructive)_45%,transparent)] hover:text-[var(--destructive)]"
            style={{ borderColor: "var(--hairline)" }}
          >
            <PhoneOff className="size-3.5" aria-hidden="true" />
            {t("End the call")}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
