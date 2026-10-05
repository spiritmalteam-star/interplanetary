/* ------------------------------------------------------------------ */
/*  THE TRAVELER'S OWN VOICE — the browser's speech synthesis as the   */
/*  quiet fallback of the house voice.                                 */
/*                                                                     */
/*  The house voice (Z.ai CogTTS) is the only reader of the            */
/*  laboratory; but a sky can refuse, a gateway can lack a tongue, or  */
/*  the wire can fall. When the house voice cannot travel, the         */
/*  visitor's own browser reads in its stead — so no Listen button,    */
/*  no live call, no book, no akashic letter ever falls silent.        */
/*  It never replaces the house voice: it only stands in.              */
/* ------------------------------------------------------------------ */

/** Map the laboratory's language codes to BCP47 the synthesizers know. */
const LANG_TO_BCP47: Record<string, string> = {
  en: "en-US",
  el: "el-GR",
  de: "de-DE",
  fr: "fr-FR",
  it: "it-IT",
  es: "es-ES",
  tr: "tr-TR",
  sq: "sq-AL",
};

export function browserVoiceAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

export interface BrowserVoiceHandle {
  stop: () => void;
}

/** Speak once with the browser's own voice. Returns null when the
    browser has no voice to lend. One voice sounds at a time — a new
    speaking cancels the previous one, exactly like the house voice. */
export function speakWithBrowserVoice(opts: {
  text: string;
  /** The laboratory's language code ("en", "el", …). */
  lang?: string;
  /** The house pace (0.5–2) speaks as the browser's rate. */
  rate?: number;
  onEnd?: () => void;
  onError?: () => void;
}): BrowserVoiceHandle | null {
  if (!browserVoiceAvailable()) return null;
  const text = opts.text.trim();
  if (!text) return null;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000));
    if (opts.lang) {
      utterance.lang = LANG_TO_BCP47[opts.lang] ?? "en-US";
      /* prefer a natural voice of the same tongue when the browser
         keeps a choir of its own */
      const prefix = utterance.lang.slice(0, 2).toLowerCase();
      const voices = synth.getVoices();
      const match =
        voices.find(
          (v) =>
            (v.lang ?? "").toLowerCase().replace("_", "-").startsWith(prefix) &&
            /neural|natural|premium|enhanced/i.test(v.name)
        ) ??
        voices.find((v) =>
          (v.lang ?? "").toLowerCase().replace("_", "-").startsWith(prefix)
        );
      if (match) utterance.voice = match;
    }
    if (typeof opts.rate === "number" && opts.rate > 0) {
      utterance.rate = Math.min(2, Math.max(0.5, opts.rate));
    }
    let ended = false;
    const settle = (fn?: () => void) => {
      if (ended) return;
      ended = true;
      fn?.();
    };
    utterance.onend = () => settle(opts.onEnd);
    utterance.onerror = () => settle(opts.onError ?? opts.onEnd);
    synth.speak(utterance);
    return {
      stop: () => {
        try {
          synth.cancel();
        } catch {
          /* already quiet */
        }
        settle(opts.onEnd);
      },
    };
  } catch {
    return null;
  }
}

/** Silence the browser's voice — used by every stop path. */
export function stopBrowserVoice(): void {
  if (browserVoiceAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* quiet */
    }
  }
}

/** A gentle note shown once per session the first time the traveler's
    voice stands in for the house voice — honesty without noise. */
let fallbackNoted = false;
export function noteBrowserVoiceFallback(note: () => void): void {
  if (fallbackNoted) return;
  fallbackNoted = true;
  note();
}
