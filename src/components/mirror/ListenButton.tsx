"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, LoaderCircle, Square } from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import type { VoiceId } from "@/lib/i18n/core";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ListenButton — documentary-grade narration of any generation.      */
/*  One voice sounds at a time; narrations are cached per              */
/*  text+voice+pace+language so replay is instant.                     */
/* ------------------------------------------------------------------ */

const audioCache = new Map<string, string>();
const MAX_CACHE = 24;

type ActiveHandle = { key: string; audio: HTMLAudioElement; reset: () => void };
let active: ActiveHandle | null = null;

function stopActive() {
  if (!active) return;
  try {
    active.audio.pause();
  } catch {
    /* already stopped */
  }
  const current = active;
  active = null;
  current.reset();
}
export function ListenButton({
  text,
  cacheKey,
  variant = "pill",
  className,
  /** A fixed voice — when given it wins over the visitor's setting
      (e.g. ParticleX's gentle gentleman narrator). */
  voice: fixedVoice,
}: {
  text: string;
  cacheKey: string;
  variant?: "pill" | "icon";
  className?: string;
  voice?: VoiceId;
}) {
  const t = useT();
  const storeVoice = useMirror((s) => s.voice);
  const voice = fixedVoice ?? storeVoice;
  const pace = useMirror((s) => s.pace);
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
  }, [cacheKey, voice, pace, language]);

  /* Unmount — release the voice if this button owns it. */
  useEffect(() => {
    return () => {
      if (active && active.key.startsWith(`${cacheKey}::`)) stopActive();
    };
  }, [cacheKey, voice]);

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
      const handle: ActiveHandle = {
        key,
        audio: ready.audio,
        reset: () => setSafe("idle"),
      };
      ready.audio.onended = () => {
        if (active === handle) active = null;
        setSafe("idle");
      };
      ready.audio.onerror = () => {
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
      const handle: ActiveHandle = { key, audio, reset: () => setSafe("idle") };
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
    } catch (err) {
      setSafe("idle");
      if (!(err instanceof DOMException && err.name === "NotSupportedError")) {
        toast.error(t("The voice field is momentarily quiet."), {
          description: t("Rest, then listen again."),
        });
      }
    }
  }, [text, cacheKey, voice, pace, language, t, setSafe]);

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
