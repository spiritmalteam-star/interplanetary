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

/* ------------------------------------------------------------------ */
/*  THE TRAVELER'S OWN EAR — the browser's speech recognition as the   */
/*  quiet fallback of the house ear. The house ear (Z.ai GLM-ASR)      */
/*  hears through the laboratory's own sky; when that sky cannot       */
/*  serve (no balance, no service, a fallen wire), the visitor's       */
/*  browser listens in its stead — so a held orb always finds an ear.  */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

export function browserEarAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return (
    typeof w.SpeechRecognition === "function" ||
    typeof w.webkitSpeechRecognition === "function"
  );
}

export interface BrowserEarHandle {
  stop: () => void;
}

/** Listen once with the browser's own ear: resolve the words the
    visitor spoke (final transcript wins, the latest interim stands
    in when the engine ends without a final). Returns null when the
    browser has no ear to lend. */
export function listenWithBrowserEar(opts: {
  /** The laboratory's language code ("en", "sq", …). */
  lang?: string;
  onResult: (text: string) => void;
  /** The ear heard nothing it could trust, or failed. */
  onError: () => void;
}): BrowserEarHandle | null {
  if (!browserEarAvailable()) return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | RecognitionCtor
    | undefined;
  if (!Ctor) return null;
  try {
    const rec = new Ctor();
    rec.lang = LANG_TO_BCP47[opts.lang ?? "en"] ?? "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let settled = false;
    let finalText = "";
    let liveText = "";
    rec.onresult = (e: unknown) => {
      const ev = e as {
        resultIndex: number;
        results: { length: number; [i: number]: { isFinal: boolean; 0?: { transcript?: string } } };
      };
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r?.[0]?.transcript ?? "";
        if (r.isFinal) finalText += text;
        else liveText = text;
      }
    };
    rec.onerror = () => {
      if (settled) return;
      settled = true;
      opts.onError();
    };
    rec.onend = () => {
      if (settled) return;
      settled = true;
      const text = (finalText || liveText).trim();
      if (text) opts.onResult(text);
      else opts.onError();
    };
    rec.start();
    return {
      stop: () => {
        try {
          rec.stop();
        } catch {
          /* already ended */
        }
      },
    };
  } catch {
    return null;
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
