import { sq } from "./dicts/sq";
import { it } from "./dicts/it";
import { el } from "./dicts/el";
import { de } from "./dicts/de";
import { fr } from "./dicts/fr";
import { es } from "./dicts/es";
import { tr } from "./dicts/tr";

/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY LABORATORY — universal translation layer             */
/*  Keys are the English source strings themselves. A missing entry    */
/*  gracefully falls back to English, so the app never breaks.         */
/* ------------------------------------------------------------------ */

export type LanguageCode = "en" | "sq" | "it" | "el" | "de" | "fr" | "es" | "tr";

export interface LanguageMeta {
  code: LanguageCode;
  native: string;
  english: string;
}

/** The eight voices of the laboratory — Albanian included. */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", native: "English", english: "English" },
  { code: "sq", native: "Shqip", english: "Albanian" },
  { code: "it", native: "Italiano", english: "Italian" },
  { code: "el", native: "Ελληνικά", english: "Greek" },
  { code: "de", native: "Deutsch", english: "German" },
  { code: "fr", native: "Français", english: "French" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "tr", native: "Türkçe", english: "Turkish" },
];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === "string" && LANGUAGES.some((l) => l.code === v);
}

/** BCP-47 locale per archive language, for numbers and dates. */
export const LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  sq: "sq-AL",
  it: "it-IT",
  el: "el-GR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  tr: "tr-TR",
};

/** Locale-aware archive number (e.g. 1200 → "1,200" / "1.200" / "1 200"). */
export function formatArchiveNumber(n: number, language: LanguageCode): string {
  return n.toLocaleString(LOCALES[language] ?? "en-US");
}

const DICTS: Record<Exclude<LanguageCode, "en">, Record<string, string>> = {
  sq, it, el, de, fr, es, tr,
};

/** Pure translation — usable outside React (API helpers, tests). */
export function translate(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  let out: string =
    language !== "en" ? (DICTS[language]?.[key] ?? key) : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}


/* ------------------------------------------------------------------ */
/*  Transcript voices — one male presence, seven registers.            */
/*  Every voice of the Laboratory is THE SAME MAN: the synthesis       */
/*  engine is "xiaochen" (a measured, low, male voice — measured at    */
/*  ~123 Hz), and each register below differs only in pace and use.    */
/* ------------------------------------------------------------------ */

export type VoiceId =
  | "aurora"
  | "sage"
  | "regent"
  | "harbor"
  | "nova"
  | "pixie"
  | "lumen";

/** The one male engine every register speaks through. */
const MALE_ENGINE = "xiaochen";

export interface VoiceMeta {
  id: VoiceId;
  name: string;
  character: string;
  /** Underlying synthesis engine voice. */
  engine: string;
}

export const VOICES: VoiceMeta[] = [
  {
    id: "aurora",
    name: "Aurora",
    character: "A man · warm documentary narrator",
    engine: MALE_ENGINE,
  },
  {
    id: "sage",
    name: "Sage",
    character: "A man · calm, steady, professional",
    engine: MALE_ENGINE,
  },
  {
    id: "regent",
    name: "Regent",
    character: "A man · classic narrator's register",
    engine: MALE_ENGINE,
  },
  {
    id: "harbor",
    name: "Harbor",
    character: "A man · natural, flowing storyteller",
    engine: MALE_ENGINE,
  },
  {
    id: "nova",
    name: "Nova",
    character: "A man · expressive cinematic narrator",
    engine: MALE_ENGINE,
  },
  {
    id: "pixie",
    name: "Pixie",
    character: "A man · bright, luminous tone",
    engine: MALE_ENGINE,
  },
  {
    id: "lumen",
    name: "Lumen",
    character: "A man · clear, precise signal",
    engine: MALE_ENGINE,
  },
];

export const DEFAULT_VOICE: VoiceId = "aurora";

export function isVoiceId(v: unknown): v is VoiceId {
  return typeof v === "string" && VOICES.some((v2) => v2.id === v);
}

export function voiceEngine(id: VoiceId): string {
  return VOICES.find((v) => v.id === id)?.engine ?? MALE_ENGINE;
}

/* Narration pace — documentary by default. */
export const PACES = [
  { value: 0.85, key: "Measured — slow, contemplative" },
  { value: 0.95, key: "Documentary — the signature pace" },
  { value: 1.1, key: "Natural — relaxed conversation" },
] as const;
