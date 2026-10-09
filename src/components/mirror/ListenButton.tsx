"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, LoaderCircle, Square } from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { DEFAULT_VOICE, type VoiceId } from "@/lib/i18n/core";
import type { VoiceProfile } from "@/lib/voice-profiles";
import {
  browserVoiceAvailable,
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
  stopBrowserVoice,
} from "@/lib/browser-voice";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ListenButton — documentary-grade narration of any generation.      */
/*  One voice sounds at a time; narrations are cached per              */
/*  text+voice+pace+language so replay is instant.                     */
/* ------------------------------------------------------------------ */

const audioCache = new Map<string, string>();
const MAX_CACHE = 24;

type ActiveHandle = { key: string; stop: () => void; reset: () => void };
let active: ActiveHandle | null = null;

function stopActive() {
  /* THE HANDLE IS RELEASED FIRST — a stop can settle the voice's end
     synchronously (the traveler's browser voice does exactly that:
     cancel() fires onend before cancel() returns), and the settled end
     must never reach back into a handle already laid to rest. The
     handle is captured and the one active seat emptied BEFORE its own
     stop runs, so neither the stop nor the settled end can null it
     mid-flight. */
  const current = active;
  if (!current) return;
  active = null;
  try {
    current.stop();
  } catch {
    /* already stopped */
  }
  try {
    current.reset();
  } catch {
    /* the voice is already at rest */
  }
}
export function ListenButton({
  text,
  cacheKey,
  variant = "pill",
  className,
  /** A fixed voice — when given it wins over the visitor's setting
      (e.g. ParticleX's gentle gentleman narrator). */
  voice: fixedVoice,
  /** A fixed pace — the category's own rhythm, when it must not
      follow the visitor's global setting. */
  pace: fixedPace,
  /** The category's full profile — voice and rhythm together. When
      given it wins over everything: THE CATEGORY VOICE LAW. */
  profile,
}: {
  text: string;
  cacheKey: string;
  variant?: "pill" | "icon";
  className?: string;
  voice?: VoiceId;
  pace?: number;
  profile?: VoiceProfile;
}) {
  const t = useT();
  const storeVoice = useMirror((s) => s.voice);
  const storePace = useMirror((s) => s.pace);
  /* THE ONE MAN LAW — no chat ever answers in a woman's voice. The
     kind lady reader belongs to the Dream Books alone; if the visitor's
     global setting carries her, every chat register falls back to the
     male house voice. */
  const voice = profile?.voice ?? fixedVoice ?? (storeVoice === "reader" ? DEFAULT_VOICE : storeVoice);
  const pace = profile?.pace ?? fixedPace ?? storePace;
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const stateRef = useRef<"idle" | "loading" | "playing">("idle");
  /* A long narration fetch can outlive the browser's click-activation;
     when play() is refused the prepared voice is kept and the next
     press releases it (the dream-book lesson, generalized). */
  const prepared = useRef<{ key: string; audio: HTMLAudioElement } | null>(null);

  const setSafe = useCallback((s: "idle" | "loading" | "playing") => {
    stateRef.current = s;
    setState(s);
  }, []);

  /* Preferences changed — silence narration so settings always win. */
  useEffect(() => {
    if (active && active.key.startsWith(`${cacheKey}::`)) stopActive();
    prepared.current = null;
  }, [cacheKey, voice, pace, language, profile]);

  /* Unmount — release the voice if this button owns it. */
  useEffect(() => {
    return () => {
      if (active && active.key.startsWith(`${cacheKey}::`)) stopActive();
    };
  }, [cacheKey, voice, profile]);

  /* THE TRAVELER'S VOICE — when the house voice cannot travel (a sky
     without a tongue, a fallen wire), the visitor's own browser reads
     in its stead. No Listen button ever falls silent. */
  const speakWithTravelerVoice = useCallback(
    (spoken: string, key: string) => {
      if (!browserVoiceAvailable()) return false;
      stopBrowserVoice();
      const handle = speakWithBrowserVoice({
        text: spoken,
        lang: language,
        rate: Math.min(1.15, pace),
        onEnd: () => {
          if (active?.key === key) {
            active = null;
            setSafe("idle");
          }
        },
      });
      if (!handle) return false;
      noteBrowserVoiceFallback(() =>
        toast.info(t("The house voice rests — your browser reads in its stead."))
      );
      active = { key, stop: handle.stop, reset: () => setSafe("idle") };
      setSafe("playing");
      return true;
    },
    [language, pace, setSafe, t]
  );

  const toggle = useCallback(async () => {
    if (stateRef.current === "loading") return;
    if (stateRef.current === "playing") {
      stopActive();
      return;
    }
    if (!text.trim()) return;

    const key = `${cacheKey}::${voice}::${pace}::${language}`;

    /* The prepared voice from a refused first play — release it now. */
    const ready = prepared.current;
    if (ready && ready.key === key) {
      prepared.current = null;
      const audio = ready.audio;
      const handle: ActiveHandle = {
        key,
        stop: () => audio.pause(),
        reset: () => setSafe("idle"),
      };
      audio.onended = () => {
        if (active === handle) active = null;
        setSafe("idle");
      };
      audio.onerror = () => {
        if (active === handle) active = null;
        setSafe("idle");
      };
      try {
        await ready.audio.play();
        active = handle;
        setSafe("playing");
      } catch {
        setSafe("idle");
      }
      return;
    }
    prepared.current = null;
    stopActive();

    setSafe("loading");
    try {
      let url = audioCache.get(key);
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice, pace }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            (data && data.error) || "The voice field is momentarily quiet."
          );
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (audioCache.size >= MAX_CACHE) {
          const oldest = audioCache.keys().next().value;
          if (oldest) {
            const oldUrl = audioCache.get(oldest);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            audioCache.delete(oldest);
          }
        }
        audioCache.set(key, url);
      }
      const audio = new Audio(url);
      const handle: ActiveHandle = {
        key,
        stop: () => audio.pause(),
        reset: () => setSafe("idle"),
      };
      audio.onended = () => {
        if (active === handle) active = null;
        setSafe("idle");
      };
      audio.onerror = () => {
        if (active === handle) active = null;
        setSafe("idle");
      };
      try {
        await audio.play();
        active = handle;
        setSafe("playing");
      } catch (playErr) {
        if (playErr instanceof DOMException && playErr.name === "NotAllowedError") {
          /* The press that fetched the voice grew old while the voice
             traveled. Keep it warm — one more press and it speaks. */
          prepared.current = { key, audio };
          setSafe("idle");
          toast.info(t("The voice is ready — press once more."));
          return;
        }
        throw playErr;
      }
    } catch {
      /* every refusal speaks — nothing is swallowed silently. The
         traveler's voice stands in first; only a browser without a
         voice at all hears the quiet note. */
      setSafe("idle");
      if (speakWithTravelerVoice(text, key)) return;
      toast.error(t("The voice field is momentarily quiet."), {
        description: t("Rest, then listen again."),
      });
    }
  }, [text, cacheKey, voice, pace, language, t, setSafe, speakWithTravelerVoice]);

  const playing = state === "playing";
  const loading = state === "loading";

  const inner = (
    <>
      {loading ? (
        <LoaderCircle className={cn("size-3.5 animate-spin", playing && "hidden")} aria-hidden="true" />
      ) : playing ? (
        <Square className="size-3 fill-current" aria-hidden="true" />
      ) : (
        <AudioLines className="size-3.5" aria-hidden="true" />
      )}
      {variant === "pill" && (
        <span>{playing ? t("Stop") : loading ? t("Gathering voice") : t("Listen")}</span>
      )}
    </>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("Stop") : t("Listen to this transmission")}
        title={playing ? t("Stop") : t("Listen to this transmission")}
        className={cn(
          "focus-glow inline-flex size-7 items-center justify-center rounded-full border transition-all duration-300",
          playing
            ? "text-[var(--scope-a)]"
            : "border-[var(--hairline)] text-muted-foreground hover:text-foreground",
          className
        )}
        style={
          playing
            ? { borderColor: "color-mix(in srgb, var(--scope-a) 55%, transparent)" }
            : undefined
        }
      >
        {inner}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? t("Stop") : t("Listen to this transmission")}
      className={cn(
        "focus-glow mono-label inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] transition-all duration-300",
        playing
          ? "text-[var(--scope-a)]"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      style={{
        borderColor: playing
          ? "color-mix(in srgb, var(--scope-a) 55%, transparent)"
          : "var(--hairline)",
      }}
    >
      {inner}
    </button>
  );
}
