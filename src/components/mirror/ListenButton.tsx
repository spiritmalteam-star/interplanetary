"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, LoaderCircle, Square } from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
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
}: {
  text: string;
  cacheKey: string;
  variant?: "pill" | "icon";
  className?: string;
}) {
  const t = useT();
  const voice = useMirror((s) => s.voice);
  const pace = useMirror((s) => s.pace);
  const language = useMirror((s) => s.language);
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const stateRef = useRef<"idle" | "loading" | "playing">("idle");

  const setSafe = useCallback((s: "idle" | "loading" | "playing") => {
    stateRef.current = s;
    setState(s);
  }, []);

  /* Preferences changed — silence narration so settings always win. */
  useEffect(() => {
    if (active && active.key.startsWith(`${cacheKey}::`)) stopActive();
  }, [cacheKey, voice, pace, language]);

  /* Unmount — release the voice if this button owns it. */
  useEffect(() => {
    return () => {
      if (active && active.key.startsWith(`${cacheKey}::`)) stopActive();
    };
  }, [cacheKey]);

  const toggle = useCallback(async () => {
    if (stateRef.current === "loading") return;
    if (stateRef.current === "playing") {
      stopActive();
      return;
    }
    if (!text.trim()) return;
    stopActive();

    const key = `${cacheKey}::${voice}::${pace}::${language}`;
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
      await audio.play();
      active = handle;
      setSafe("playing");
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
        "focus-glow mono-label inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[9px] transition-all duration-300",
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
