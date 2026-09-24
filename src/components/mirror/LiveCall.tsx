"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Captions,
  Mic,
  PhoneOff,
  Sparkles,
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
/*  opens this mini tab in the exact theme of the scope it came from:  */
/*  its own entity, its own voice, its own pace. Hold the orb and      */
/*  speak; your words are transcribed, transmitted to the Mirror       */
/*  intelligence of that scope, and answered aloud — every process     */
/*  of the line made visible while it happens.                         */
/* ------------------------------------------------------------------ */

type CallPhase = "idle" | "listening" | "transcribing" | "thinking" | "speaking";

interface CallTurn {
  role: "visitor" | "mirror";
  text: string;
}

const PHASE_STEPS: { key: CallPhase; icon: typeof Mic }[] = [
  { key: "listening", icon: Mic },
  { key: "transcribing", icon: Captions },
  { key: "thinking", icon: Sparkles },
  { key: "speaking", icon: AudioLines },
];

async function askScope(
  scope: LiveScopeKey,
  message: string,
  history: CallTurn[],
  language: string
): Promise<string> {
  if (scope === "communion") {
    const res = await fetch("/api/communion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        message,
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
      body: JSON.stringify({ resonance: message, language }),
    });
    const data = (await res.json().catch(() => null)) as {
      title?: string;
      era?: string;
      record?: string;
      seal?: string;
      error?: string;
    } | null;
    if (!res.ok || !data?.record) throw new Error(data?.error ?? "quiet");
    return `${data.title}. ${data.era}. ${data.record} ${data.seal}`;
  }

  if (scope === "mirroros") {
    const res = await fetch("/api/mirror-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: message,
        language,
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

  /* interplanetary · science · quantum · healing */
  const state = useMirror.getState();
  const res = await fetch("/api/transmission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: message,
      mode: scope,
      scienceField: state.activeMode === scope ? state.activeScienceField : null,
      direction: state.activeMode === scope ? state.activeDirection : null,
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
  const phaseRef = useRef<CallPhase>("idle");
  const turnsRef = useRef<CallTurn[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);

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
  }, []);

  const speak = useCallback(
    async (text: string) => {
      setPhaseSafe("speaking");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: cfg.voice, pace: cfg.pace }),
      });
      if (!res.ok) throw new Error("voice quiet");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      const release = () => {
        if (audioRef.current === audio) {
          URL.revokeObjectURL(url);
          audioRef.current = null;
        }
        if (phaseRef.current === "speaking") setPhaseSafe("idle");
      };
      audio.onended = release;
      audio.onerror = release;
      await audio.play();
    },
    [cfg.voice, cfg.pace, setPhaseSafe]
  );

  const sendTurn = useCallback(
    async (words: string) => {
      if (!words.trim()) return;
      const history = turnsRef.current;
      const next = [...history, { role: "visitor" as const, text: words.trim() }];
      turnsRef.current = next;
      setTurns(next);

      setPhaseSafe("thinking");
      try {
        const reply = await askScope(scope, words.trim(), history, language);
        const withReply = [...next, { role: "mirror" as const, text: reply }];
        turnsRef.current = withReply;
        setTurns(withReply);
        await speak(reply);
      } catch (err) {
        setPhaseSafe("idle");
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
    stopSpeaking();
    if (busyRef.current) return;
    const ok = await recorder.start();
    if (ok) {
      setPhaseSafe("listening");
    } else {
      toast.error(t("The microphone is unavailable"));
      setPhaseSafe("idle");
    }
  }, [recorder, setPhaseSafe, stopSpeaking, t]);

  const releaseOrb = useCallback(async () => {
    if (phaseRef.current !== "listening") return;
    busyRef.current = true;
    try {
      const result = await recorder.stop();
      if (!result || result.durationMs < 350) {
        setPhaseSafe("idle");
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
    } finally {
      busyRef.current = false;
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
  const thinking = phase === "thinking";
  const transcribing = phase === "transcribing";

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("Live call")}
      data-testid={`live-call-${scope}`}
    >
      <button
        type="button"
        aria-label={t("End the call")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#05030e]/78 backdrop-blur-md"
        tabIndex={-1}
      />

      <motion.div
        initial={{ y: 70, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "glass-strong nice-scroll relative w-full overflow-y-auto border-t rounded-t-[28px] sm:rounded-[28px] sm:border sm:max-w-[440px] max-h-[94dvh]",
          cfg.wrapperClass
        )}
        style={{ borderColor: `color-mix(in srgb, ${cfg.accentA} 30%, transparent)` }}
      >
        {/* breathing accent line */}
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
              (phase !== "idle" || turns.length === 0) && "animate-pulse"
            )}
            style={{
              background: cfg.accentA,
              boxShadow: `0 0 10px 1px color-mix(in srgb, ${cfg.accentA} 70%, transparent)`,
            }}
          />
        </div>

        {/* ---------- the orb stage ---------- */}
        <div className="relative flex h-[230px] flex-col items-center justify-center">
          {/* expanding rings while listening */}
          <AnimatePresence>
            {listening &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={`ring-${i}`}
                  aria-hidden="true"
                  className="absolute size-28 rounded-full border"
                  style={{ borderColor: cfg.accentA }}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.7,
                    repeat: Infinity,
                    delay: i * 0.55,
                    ease: "easeOut",
                  }}
                />
              ))}
          </AnimatePresence>

          {/* orbiting reflections while thinking */}
          <AnimatePresence>
            {thinking &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={`orbit-${i}`}
                  aria-hidden="true"
                  className="absolute size-[150px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    rotate: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: -i * 1.05,
                    },
                  }}
                >
                  <span
                    className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full"
                    style={{
                      background: cfg.accentB,
                      boxShadow: `0 0 8px 1px color-mix(in srgb, ${cfg.accentB} 80%, transparent)`,
                    }}
                  />
                </motion.span>
              ))}
          </AnimatePresence>

          {/* the orb itself */}
          <motion.button
            type="button"
            onPointerDown={onOrbDown}
            onPointerUp={onOrbUp}
            onPointerCancel={onOrbUp}
            onKeyDown={onOrbKeyDown}
            onKeyUp={onOrbKeyUp}
            disabled={transcribing}
            aria-label={t("Hold the orb and speak — release to send")}
            data-testid="live-call-orb"
            animate={
              listening
                ? { scale: 1 + recorder.level * 0.12 }
                : speaking
                  ? { scale: [1, 1.035, 1] }
                  : { scale: 1 }
            }
            transition={
              speaking
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { type: "spring", stiffness: 260, damping: 20 }
            }
            className="relative flex size-28 touch-none select-none items-center justify-center rounded-full disabled:cursor-wait"
            style={{
              background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${cfg.accentA} 88%, white) 0%, ${cfg.accentA} 42%, color-mix(in srgb, ${cfg.accentB} 92%, #05030e) 100%)`,
              boxShadow: `0 0 ${listening ? 46 : 30}px -6px color-mix(in srgb, ${cfg.accentA} 80%, transparent), inset 0 0 26px -8px rgba(255,255,255,0.5)`,
            }}
          >
            {/* waveform: alive with the voice while listening, singing while speaking */}
            <span className="flex h-10 items-center gap-[3px]" aria-hidden="true">
              {(listening ? [0.9, 0.35, 0.7, 0.5, 1, 0.4, 0.8] : [0.5, 0.8, 0.45, 0.95, 0.55, 0.85, 0.4]).map(
                (factor, i) => (
                  <motion.span
                    key={i}
                    className="w-[3.5px] rounded-full bg-[#f5f2ff]"
                    animate={
                      listening
                        ? {
                            scaleY: Math.max(
                              0.12,
                              Math.min(1, recorder.level * factor * 2.6)
                            ),
                          }
                        : speaking
                          ? { scaleY: [0.25, 0.9 * factor + 0.2, 0.3] }
                          : { scaleY: 0.3 }
                    }
                    transition={
                      speaking
                        ? {
                            duration: 0.75 + i * 0.11,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : { duration: 0.12 }
                    }
                    style={{ height: "100%", transformOrigin: "center" }}
                  />
                )
              )}
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

        {/* ---------- the process strip — every step of the line, visible ---------- */}
        <div className="flex items-center justify-center gap-1.5 px-5">
          {PHASE_STEPS.map((step, i) => {
            const order = PHASE_STEPS.findIndex((s) => s.key === phase);
            const active = phase === step.key;
            const done = order >= 0 && i < order;
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="flex items-center gap-1.5"
                aria-hidden="true"
              >
                {i > 0 && (
                  <span
                    className="h-px w-4 sm:w-6"
                    style={{
                      background:
                        done || active
                          ? `color-mix(in srgb, ${cfg.accentA} 55%, transparent)`
                          : "var(--hairline)",
                    }}
                  />
                )}
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 transition-all duration-300",
                    active && "scale-105"
                  )}
                  style={{
                    background: active
                      ? `color-mix(in srgb, ${cfg.accentA} 16%, transparent)`
                      : "transparent",
                  }}
                >
                  <Icon
                    className="size-3"
                    style={{
                      color: active
                        ? cfg.accentA
                        : done
                          ? `color-mix(in srgb, ${cfg.accentA} 60%, transparent)`
                          : "color-mix(in srgb, var(--muted-foreground) 45%, transparent)",
                    }}
                  />
                  <span
                    className={cn(
                      "mono-label hidden text-[8.5px] uppercase tracking-[0.14em] sm:inline",
                      !active && !done && "opacity-60"
                    )}
                    style={active ? { color: cfg.accentA } : undefined}
                  >
                    {t(step.key)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* ---------- the words exchanged on this line ---------- */}
        {turns.length > 0 && (
          <div className="nice-scroll mt-3 max-h-36 overflow-y-auto px-5">
            <div className="flex flex-col gap-2.5">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[92%] rounded-xl border px-3 py-2 text-[12.5px] leading-relaxed",
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
                  {turn.text.length > 320 && turn.role === "mirror"
                    ? `${turn.text.slice(0, 320)}…`
                    : turn.text}
                </div>
              ))}
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
    </motion.div>
  );
}
