"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Check, LoaderCircle, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { useMirror } from "@/lib/mirror-store";
import { LANGUAGES, PACES, VOICES, useT, type VoiceId } from "@/lib/i18n";
import {
  noteBrowserVoiceFallback,
  speakWithBrowserVoice,
} from "@/lib/browser-voice";
import { cn } from "@/lib/utils";

const SAMPLE_TEXT_KEY =
  "Across the quiet field, a warm signal gathers into light.";

/**
 * SettingsModal — opened from the button at the top of the sidebar.
 * Language (eight, Albanian included) · transcript voice · narration pace.
 */
export function SettingsModal() {
  const modal = useMirror((s) => s.modal);
  const closeModal = useMirror((s) => s.closeModal);
  const language = useMirror((s) => s.language);
  const voice = useMirror((s) => s.voice);
  const pace = useMirror((s) => s.pace);
  const setLanguage = useMirror((s) => s.setLanguage);
  const setVoice = useMirror((s) => s.setVoice);
  const setPace = useMirror((s) => s.setPace);
  const t = useT();

  const open = modal?.type === "settings";
  const [previewing, setPreviewing] = useState<VoiceId | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
    }
    setPreviewing(null);
  }, []);

  useEffect(() => {
    if (!open) stopPreview();
  }, [open, stopPreview]);

  useEffect(() => {
    return () => {
      if (previewRef.current) previewRef.current.pause();
    };
  }, []);

  const handleLanguage = (code: (typeof LANGUAGES)[number]["code"]) => {
    setLanguage(code);
    const meta = LANGUAGES.find((l) => l.code === code);
    toast.success(t("Language woven through the laboratory"), {
      description: `${meta?.english ?? "English"} — ${meta?.native ?? ""}`,
    });
  };

  const handlePreview = async (id: VoiceId) => {
    if (previewing === id) {
      stopPreview();
      return;
    }
    if (previewRef.current) previewRef.current.pause();
    setPreviewing(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: t(SAMPLE_TEXT_KEY),
          voice: id,
          pace,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && data.error) || "The voice field is momentarily quiet."
        );
      }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      previewRef.current = audio;
      audio.onended = () => setPreviewing(null);
      audio.onerror = () => setPreviewing(null);
      await audio.play();
    } catch {
      /* the house voice could not travel — the browser's own voice
         previews in its stead */
      const handle = speakWithBrowserVoice({
        text: t(SAMPLE_TEXT_KEY),
        lang: language,
        rate: pace,
        onEnd: () => setPreviewing(null),
        onError: () => setPreviewing(null),
      });
      if (handle) {
        previewRef.current = null;
        noteBrowserVoiceFallback(() =>
          toast.info(t("The house voice rests — your browser reads in its stead."))
        );
        return;
      }
      setPreviewing(null);
      toast.error(t("The voice field is momentarily quiet."), {
        description: t("Rest, then listen again."),
      });
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(o) => {
        if (!o) closeModal();
      }}
      title={t("Laboratory Settings")}
      description={t(
        "Choose the language of every word and the voice that reads your transmissions."
      )}
      widthClass="sm:max-w-[600px]"
    >
      <div className="nice-scroll max-h-[62vh] space-y-6 overflow-y-auto px-5 pb-6 sm:px-6 max-md:max-h-[60dvh]">
        {/* ---------------- Language ---------------- */}
        <section aria-label={t("Language")}>
          <p className="mono-label mb-2.5 text-[11.5px] text-muted-foreground">
            {t("Language of everything")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => {
              const selected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguage(l.code)}
                  aria-pressed={selected}
                  className={cn(
                    "focus-glow flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition-all duration-300",
                    selected
                      ? "border-[var(--hairline-active)] bg-[var(--accent)]"
                      : "hairline hover:border-[var(--hairline-hover)]"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-foreground">
                      {l.native}
                    </span>
                    <span className="mono-label mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                      {l.english}
                    </span>
                  </span>
                  {selected && (
                    <Check
                      className="size-4 shrink-0 text-[var(--cy)]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---------------- Transcript voice ---------------- */}
        <section aria-label={t("Voice for transcript")}>
          <p className="mono-label mb-2.5 text-[11.5px] text-muted-foreground">
            {t("Voice for transcript")}
          </p>
          <div className="space-y-2">
            {/* THE ONE MAN LAW — the transcript voice of every chat is
                the man of the GLM engine. The kind lady reader is the
                Dream Books' own narrator and is never offered here. */}
            {VOICES.filter((v) => v.id !== "reader").map((v) => {
              const selected = voice === v.id;
              const isPreviewing = previewing === v.id;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300",
                    selected
                      ? "border-[var(--hairline-active)] bg-[var(--accent)]"
                      : "hairline"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setVoice(v.id)}
                    aria-pressed={selected}
                    className="focus-glow flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                  >
                    <AudioLines
                      className={cn(
                        "size-4 shrink-0",
                        selected ? "text-[var(--cy)]" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-semibold text-foreground">
                        {v.name}
                      </span>
                      <span className="block truncate text-[13.5px] text-muted-foreground">
                        {v.id === "aurora"
                          ? t(v.character)
                          : v.character}
                      </span>
                    </span>
                    {selected && (
                      <Check
                        className="size-4 shrink-0 text-[var(--cy)]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreview(v.id)}
                    aria-label={
                      isPreviewing ? t("Stop") : t("Preview this voice")
                    }
                    className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {isPreviewing ? (
                      <LoaderCircle
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Volume2 className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------------- Narration pace ---------------- */}
        <section aria-label={t("Narration pace")}>
          <p className="mono-label mb-2.5 text-[11.5px] text-muted-foreground">
            {t("Narration pace")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PACES.map((p) => {
              const selected = Math.abs(pace - p.value) < 0.001;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPace(p.value)}
                  aria-pressed={selected}
                  className={cn(
                    "focus-glow rounded-full border px-4 py-2 text-[14px] font-medium transition-all duration-300",
                    selected
                      ? "border-[var(--hairline-active)] bg-[var(--accent)] text-foreground"
                      : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                  )}
                >
                  {t(p.key)}
                </button>
              );
            })}
          </div>
        </section>

        <p className="mono-label text-center text-[10.5px] leading-relaxed text-muted-foreground/70">
          {t(
            "Every word of the interface and every new transmission follows the selected language."
          )}
        </p>
      </div>
    </ModalShell>
  );
}
