/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY DIGITAL CHAMBER — universal translation layer             */
/*  Keys are the English source strings themselves. A missing entry    */
/*  gracefully falls back to English, so the app never breaks.         */
/* ------------------------------------------------------------------ */

export type LanguageCode =
  | "en"
  | "sq"
  | "ar"
  | "zh"
  | "fr"
  | "hi"
  | "pt"
  | "ru"
  | "es"
  | "it"
  | "el"
  | "de"
  | "tr";

export interface LanguageMeta {
  code: LanguageCode;
  native: string;
  english: string;
}

/** The laboratory's full registry of tongues — every dict that exists.
    The picker (PICKER_LANGUAGES) shows the nine the keeper chose;
    the older tongues stay valid here so a saved setting never breaks. */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", native: "English", english: "English" },
  { code: "sq", native: "Shqip", english: "Albanian" },
  { code: "ar", native: "العربية", english: "Arabic" },
  { code: "zh", native: "中文", english: "Chinese" },
  { code: "fr", native: "Français", english: "French" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "pt", native: "Português", english: "Portuguese" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "it", native: "Italiano", english: "Italian" },
  { code: "el", native: "Ελληνικά", english: "Greek" },
  { code: "de", native: "Deutsch", english: "German" },
  { code: "tr", native: "Türkçe", english: "Turkish" },
];

/* THE NINE VOICES OF THE BUTTON — Albanian first (the keeper's own
   tongue leads), then the eight most-spoken languages of the world in
   alphabetical order. English is the default; this exact order is the
   law of every language button in the house. */
export const PICKER_LANGUAGES: LanguageMeta[] = [
  { code: "sq", native: "Shqip", english: "Albanian" },
  { code: "ar", native: "العربية", english: "Arabic" },
  { code: "zh", native: "中文", english: "Chinese" },
  { code: "en", native: "English", english: "English" },
  { code: "fr", native: "Français", english: "French" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "pt", native: "Português", english: "Portuguese" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "es", native: "Español", english: "Spanish" },
];

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  sq: "Albanian",
  ar: "Arabic",
  zh: "Chinese",
  fr: "French",
  hi: "Hindi",
  pt: "Portuguese",
  ru: "Russian",
  es: "Spanish",
  it: "Italian",
  el: "Greek",
  de: "German",
  tr: "Turkish",
};

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === "string" && LANGUAGES.some((l) => l.code === v);
}

/** BCP-47 locale per archive language, for numbers and dates. */
export const LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  sq: "sq-AL",
  ar: "ar-SA",
  zh: "zh-CN",
  fr: "fr-FR",
  hi: "hi-IN",
  pt: "pt-BR",
  ru: "ru-RU",
  es: "es-ES",
  it: "it-IT",
  el: "el-GR",
  de: "de-DE",
  tr: "tr-TR",
};

/** Locale-aware archive number (e.g. 1200 → "1,200" / "1.200" / "1 200"). */
export function formatArchiveNumber(n: number, language: LanguageCode): string {
  return n.toLocaleString(LOCALES[language] ?? "en-US");
}

/* THE LAZY VOICES — the seven dictionaries are no longer carried in
   the first breath of the app: each tongue travels only when it is
   spoken (one dynamic import per language, deduped), and until it
   arrives every key falls back to its English source (the law the
   translation layer was born with). The app's first paint sheds
   megabytes of parsed words, and the whole house breathes lighter —
   the lag was the luggage. */
type Dict = Record<string, string>;

const DICTS: Partial<Record<Exclude<LanguageCode, "en">, Dict>> = {};
const DICTS_PENDING = new Set<Exclude<LanguageCode, "en">>();

let dictVersion = 0;
const dictListeners = new Set<() => void>();

/** React's subscription — translators wake when a tongue arrives. */
export function subscribeDicts(onChange: () => void): () => void {
  dictListeners.add(onChange);
  return () => dictListeners.delete(onChange);
}

/** Snapshot for useSyncExternalStore — the version alone. */
export function getDictVersion(): number {
  return dictVersion;
}

/** Load one tongue on demand (idempotent, safe to call anywhere). */
export async function ensureDict(language: LanguageCode): Promise<void> {
  if (language === "en") return;
  const lang = language as Exclude<LanguageCode, "en">;
  if (DICTS[lang] || DICTS_PENDING.has(lang)) return;
  DICTS_PENDING.add(lang);
  try {
    const mod =
      lang === "sq" ? await import("./dicts/sq")
      : lang === "ar" ? await import("./dicts/ar")
      : lang === "zh" ? await import("./dicts/zh")
      : lang === "fr" ? await import("./dicts/fr")
      : lang === "hi" ? await import("./dicts/hi")
      : lang === "pt" ? await import("./dicts/pt")
      : lang === "ru" ? await import("./dicts/ru")
      : lang === "es" ? await import("./dicts/es")
      : lang === "it" ? await import("./dicts/it")
      : lang === "el" ? await import("./dicts/el")
      : lang === "de" ? await import("./dicts/de")
      : await import("./dicts/tr");
    DICTS[lang] = (mod as unknown as { [k: string]: Dict })[lang];
    dictVersion += 1;
    for (const wake of dictListeners) wake();
  } catch {
    /* the tongue stayed home — the English source keeps speaking */
  } finally {
    DICTS_PENDING.delete(lang);
  }
}

/** Pure translation — usable outside React (API helpers, tests). */
export function translate(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  let out: string =
    language !== "en" ? (DICTS[language as Exclude<LanguageCode, "en">]?.[key] ?? key) : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}


/* ------------------------------------------------------------------ */
/*  Transcript voices — one male presence, one kind lady, registers.   */
/*  Every voice of the Laboratory's transmissions is THE SAME MAN:     */
/*  the synthesis engine is "xiaochen" (a measured, low, male voice —  */
/*  measured at ~123 Hz), and each register below differs only in      */
/*  pace and use. The ONE exception is "reader" — the kind lady who    */
/*  reads the Dream Books aloud (engine "tongtong", warm and gentle).  */
/* ------------------------------------------------------------------ */

export type VoiceId =
  | "aurora"
  | "sage"
  | "regent"
  | "harbor"
  | "nova"
  | "pixie"
  | "lumen"
  | "reader";

/** The one male engine every transmission register speaks through. */
const MALE_ENGINE = "xiaochen";

/** The kind lady reader of the books — warm, gentle, patient. */
export const FEMALE_ENGINE = "tongtong";

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
  {
    id: "reader",
    name: "Reader",
    character: "A woman · the kind lady reader of the books",
    engine: FEMALE_ENGINE,
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
