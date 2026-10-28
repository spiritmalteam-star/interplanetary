import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import ZAI from "@/lib/zai-client";
import { meterRoute, type MeterContext } from "@/lib/server/meter";
import {
  describeImage,
  documentBlock,
  imageBlock,
  parseAttachments,
} from "@/lib/server/attachments";
import {
  askFingerprint,
  beginWeave,
  dropLoopSession,
  LOOP_PARTS,
  endWeave,
  getLoopSession,
  guardBusy,
  guardDailyAllowance,
  guardDuplicate,
  LC_LIMITS,
  loopSessionOwned,
  addLoopPart,
  createLoopSession,
  noteLcError,
  noteLcSuccess,
  prepareLoopShelf,
  putLoopFinal,
  verdictResponse,
  type LcLength,
  type LoopSession,
} from "@/lib/server/lc-engine";
import { assembleLoop } from "@/lib/server/loop-assembly";
import {
  dbLoopAddPart,
  dbLoopBegin,
  dbLoopFinalize,
  dbLoopState,
} from "@/lib/server/loop-vault";
import { keepWovenSound } from "@/lib/server/music-vault";
import { LC_MODES } from "@/lib/data/light-codes";
import { db } from "@/lib/db";
import { rename } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const maxDuration = 300;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the generation chamber.                              */
/*                                                                      */
/*  Mirror Entity is the interpretation layer: it translates the       */
/*  visitor's intention into a structured musical direction. The       */
/*  sound engine is Google DeepMind's Lyria, reached through the       */
/*  official Gemini API's Interactions door (@google/genai SDK) —      */
/*  its key lives only in the server's keeping (GEMINI_API_KEY) and    */
/*  never reaches the browser. The engine's own name stays behind      */
/*  the veil; the Mirror is the visible voice.                         */
/*                                                                      */
/*  Two models, two doors:                                             */
/*    lyria-3-clip-preview — the 30-second preview (quick listening)   */
/*    lyria-3.5             — the full song (verses, chorus, bridge)   */
/*                                                                      */
/*  FOUR DOORS THE VISITOR MAY KNOCK:                                  */
/*    interpret  — the Mirror's written direction (the brief)          */
/*    compose    — the weave: the brief rendered as sound              */
/*    refine     — the brief reshaped by conversational instruction    */
/*                 (a new brief is written; no waveform is edited —    */
/*                 the engine does not support in-place editing, and   */
/*                 the chamber never pretends it does)                 */
/*    lyrics     — the Lyrics Laboratory: one craft hand at a time     */
/*                                                                      */
/*  The chamber's law: the music is for calming, meditative,           */
/*  reflective, grounding, intention-based listening. It is never      */
/*  presented as a cure, a treatment or a medical instrument.          */
/*                                                                      */
/*  THE HONESTY LAW: success is never claimed until valid, playable    */
/*  audio has actually been received. Every failure of the sky —       */
/*  missing key, exhausted quota, a safety refusal, an unsupported     */
/*  form — is spoken plainly, in the chamber's own voice.              */
/* ------------------------------------------------------------------ */

const LYRIA_FULL_MODEL = process.env.LYRIA_MODEL || "lyria-3.5";
const LYRIA_CLIP_MODEL = process.env.LYRIA_CLIP_MODEL || "lyria-3-clip-preview";
/** The heaviest payload the sky can carry home (Vercel's response door). */
const MAX_AUDIO_B64 = 4_300_000;

interface LcBody {
  mode?: string;
  intention?: string;
  civilization?: string;
  length?: LcLength;
  /** the endless journey: which part is being woven, and the token
      that carries the journey's thread between requests */
  loopToken?: string;
  loopPart?: { index?: number; total?: number; nonce?: string } | null;
  shape?: {
    energy?: number;
    light?: number;
    familiarity?: number;
    structure?: number;
    timeFeel?: string;
    voice?: string;
    vocalLanguage?: string;
    lyricsMode?: string;
  };
  userLyrics?: string;
  instrumental?: boolean;
  language?: string;
  context?: string;
  interpretOnly?: boolean;
  /** compose phase — the Mirror's own direction, already written */
  compose?: boolean;
  /** refine phase — the visitor's conversational instruction */
  refine?: { instruction?: string };
  /** the Lyrics Laboratory's craft hand */
  lyricsOp?:
    | "generate"
    | "rewrite"
    | "rhyme"
    | "language"
    | "tone"
    | "chorus"
    | "simplify"
    | "poetic";
  interp?: {
    title?: string;
    style?: string;
    lyrics?: string | null;
    notes?: string;
  };
}

interface LcBrief {
  title: string;
  style: string;
  lyrics: string | null;
  notes: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  es: "Spanish",
  de: "German",
  fr: "French",
  el: "Greek",
  tr: "Turkish",
};

/* ------------------------- the guards ------------------------- */

function wantVocals(b: LcBody, lyrics: string | null): boolean {
  return !(
    b.instrumental === true ||
    b.shape?.voice === "None" ||
    b.shape?.lyricsMode === "NO LYRICS" ||
    b.shape?.vocalLanguage === "Wordless" ||
    !lyrics
  );
}

/* ------------------------- the Mirror's voice ------------------------- */

function shapeWords(b: LcBody): string {
  const s = b.shape ?? {};
  const parts: string[] = [];
  const pick = (
    v: number | undefined,
    low: string,
    mid: string,
    high: string
  ) => {
    if (typeof v !== "number") return mid;
    if (v <= 1) return low;
    if (v >= 3) return high;
    return mid;
  };
  parts.push(`energy: ${pick(s.energy, "still and quiet", "gently flowing", "radiant and intense")}`);
  parts.push(`light: ${pick(s.light, "shadowed and intimate", "evening-toned", "luminous and bright")}`);
  parts.push(`familiarity: ${pick(s.familiarity, "earthlike instruments", "a blend of known and unknown", "strange, otherworldly timbres")}`);
  parts.push(`structure: ${pick(s.structure, "song-like", "loose song shape", "a long-form transmission, no verse-chorus conventions")}`);
  if (s.timeFeel) parts.push(`time feel: ${s.timeFeel.toLowerCase()}`);
  if (s.voice && s.voice !== "None") parts.push(`voice: ${s.voice.toLowerCase()}`);
  else parts.push("voice: none — instrumental");
  if (s.vocalLanguage) parts.push(`vocal language: ${s.vocalLanguage.toLowerCase()}`);
  return parts.join("; ");
}

/** The chosen chamber's own sonic law — the mode's vocabulary spoken
 *  to the interpreter, so each of the house's chambers keeps its own
 *  distinctive sound instead of a generic direction. */
function modeVocabulary(b: LcBody): string {
  const mode = LC_MODES.find((m) => m.id === b.mode);
  if (!mode) return "";
  const lines = [`THE CHAMBER'S OWN SONIC LAW (${mode.name}): ${mode.vocabulary}`];
  if (mode.civilizations && b.civilization) {
    const civ = mode.civilizations.find((c) => c.id === b.civilization);
    if (civ) lines.push(`CIVILIZATION WORLD: ${civ.name} — ${civ.vocabulary}`);
  }
  return lines.join("\n");
}

function interpreterPrompt(b: LcBody, languageName: string): string {
  const modeName = String(b.mode ?? "light-transmission");
  return [
    "You are the MIRROR ENTITY in its LIGHT CODES chamber — the interpreter between a human intention and a piece of music.",
    "Your art is TRANSLATION: you never repeat the visitor's words back; you convert intention, mood and symbolism into a precise musical direction that a music-generation model (Google DeepMind Lyria, through the Gemini API) can render.",
    "The music is for calming, meditative, reflective, grounding, sleep-oriented, focus-oriented, emotional reset, intention-based listening. NEVER describe it as treatment, therapy, medicine or a cure; never mention frequencies curing anything.",
    "",
    "THE FIRST LAW — THE VISITOR'S OWN WORDS OUTRANK EVERY SELECTOR:",
    "The visitor's intention is their true voice, spoken in their own words. The energy shape and every chip or dial are only gentle defaults laid by hand. Where the visitor's words CONTRADICT the selectors, THE WORDS WIN — read them literally and let the music follow the words, never the buttons. Understand what the visitor actually means — their images, memories, longings — and translate THAT; never pick a random mood from a list when their words already carry the direction.",
    "",
    `CHAMBER MODE: ${modeName}.`,
    modeVocabulary(b),
    `THE VISITOR'S OWN ENERGY SHAPE (defaults only — the words above outrank these): ${shapeWords(b)}.`,
    b.context ? `WHAT THE VISITOR IS LIVING THROUGH (from the conversation): ${b.context}` : "",
    `THE VISITOR'S INTENTION: ${b.intention?.trim() || "(the Mirror chooses freely — compose what the moment holds)"}`,
    "",
    "Return STRICT JSON (no markdown fences):",
    '{"title": "<a poetic, short track title in ' + languageName + '>",',
    ' "style": "<ONE dense musical production brief, 120-220 words, written FOR A MUSIC MODEL: genre/era/production language, instruments, harmony, tempo (a BPM range), texture, mix character, and the arrangement arc — how it opens, how it builds, where it rests, how it ends. Written in English for the engine, but the SOUND the words describe should fit the visitor\'s language and feeling. Always end with: no EDM drops, no generic cinematic trailer music, no busy percussion, no commercial pop structure.>",',
    ' "lyrics": "<if words are wanted: short, kind, spare lines in ' + languageName + ', organized with section tags [Verse], [Chorus], [Bridge] — the chorus returns, one bridge rests mid-song. No production instructions inside the lyric lines. Or null for instrumental>",',
    ' "notes": "<2-3 sentences in ' + languageName + ' — the TRANSMISSION NOTES: the emotional arc and how the music carries it, grounded, artistic, no medical language>"}',
    "",
    "LYRICS LAW: if the visitor asked for instrumental or wordless, lyrics must be null. Never mix production instructions into the lyrical text.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function interpret(
  b: LcBody,
  attachmentLines = ""
): Promise<LcBrief> {
  const zai = await ZAI.create();
  const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
  /* one quiet retry — the interpreter must never come back empty-handed */
  let lastRaw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: interpreterPrompt(b, languageName) },
        {
          role: "user",
          content:
            (b.intention?.trim() ||
              "The Mirror chooses what this transmission holds.") +
            attachmentLines,
        },
      ],
      temperature: 0.85,
      max_tokens: 1200,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    lastRaw = raw;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]) as Partial<LcBrief>;
      return sanitizeBrief(parsed);
    } catch {
      /* one more breath */
    }
  }
  console.error(
    "[light-codes] interpreter returned no JSON:",
    lastRaw.slice(0, 200)
  );
  throw new Error(
    "The Mirror's interpretation dissolved before it landed. Try again."
  );
}

function sanitizeBrief(parsed: Partial<LcBrief>): LcBrief {
  return {
    title: (parsed.title ?? "Untitled transmission").slice(0, 90),
    style: (parsed.style ?? "").slice(0, 1400),
    lyrics: parsed.lyrics ? String(parsed.lyrics).slice(0, 900) : null,
    notes: (parsed.notes ?? "").slice(0, 600),
  };
}

/* --------------------- the refinement door --------------------- */

const REFINEMENT_WORDS: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  es: "Spanish",
  de: "German",
  fr: "French",
  el: "Greek",
  tr: "Turkish",
};

function refinePrompt(b: LcBody, languageName: string): string {
  const interp = b.interp ?? {};
  return [
    "You are the MIRROR ENTITY in its LIGHT CODES chamber. The visitor has heard (or seen) the chamber's current composition brief and asks for a change in their own words.",
    "Your art is TRANSLATION: carry the visitor's instruction INTO the existing brief — keep everything that was already right, change only what the instruction asks. Never repeat the visitor's words back; never answer as chat; never explain the change. The output is the reshaped brief itself.",
    "The music is for calming, meditative, reflective, grounding, intention-based listening — never treatment, therapy, medicine or a cure.",
    "",
    `THE CURRENT BRIEF (JSON):`,
    JSON.stringify(
      {
        title: interp.title ?? "",
        style: interp.style ?? "",
        lyrics: interp.lyrics ?? null,
        notes: interp.notes ?? "",
      },
      null,
      1
    ),
    "",
    `THE VISITOR'S INSTRUCTION: ${b.refine?.instruction?.trim() ?? "(no instruction given — refine gently toward more emotional depth)"}`,
    "",
    "THE FIRST LAW — the instruction is the visitor's own voice: it outranks the current brief's selectors and defaults. Read it literally; where it contradicts what the brief says, the instruction wins.",
    "RULES:",
    "- Preserve the brief's language and character unless the instruction asks otherwise.",
    "- If the instruction touches the words (vocals, lyrics, language, mood of the voice), reshape the lyrics accordingly, keeping the section tags [Verse], [Chorus], [Bridge].",
    "- If the instruction asks for an instrumental, set lyrics to null.",
    "- The style field must remain ONE dense production brief for a music model (120-220 words), still ending with: no EDM drops, no generic cinematic trailer music, no busy percussion, no commercial pop structure.",
    "",
    "Return STRICT JSON (no markdown fences), the FULL reshaped brief:",
    '{"title": "...", "style": "...", "lyrics": "... or null", "notes": "..."}',
    `Write title, lyric lines and notes in ${languageName}; the style stays in English for the engine.`,
  ].join("\n");
}

async function refine(b: LcBody): Promise<LcBrief> {
  const zai = await ZAI.create();
  const languageName = REFINEMENT_WORDS[b.language ?? "en"] ?? "English";
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: refinePrompt(b, languageName) },
      { role: "user", content: b.refine?.instruction?.trim() || "Refine gently." },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    thinking: { type: "disabled" },
  });
  const raw = completion.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(
      "The Mirror's refinement dissolved before it landed. Speak the change once more."
    );
  }
  try {
    return sanitizeBrief(JSON.parse(match[0]) as Partial<LcBrief>);
  } catch {
    throw new Error(
      "The Mirror's refinement dissolved before it landed. Speak the change once more."
    );
  }
}

/* --------------------- the Lyrics Laboratory --------------------- */

const LYRIC_OPS: Record<
  NonNullable<LcBody["lyricsOp"]>,
  string
> = {
  generate:
    "Write the song's original lyrics from the brief: short, kind, spare lines with intentional structure, rhythm and emotional development. Avoid generic repetition and forced rhymes.",
  rewrite:
    "Rewrite the lyrics fresh — same feeling and subject, new words and new angles. Keep the section tags.",
  rhyme:
    "Improve the rhyme and the music of the lines: let the ends chime naturally, never forced. Keep the meaning and the section tags.",
  language:
    "Translate the lyrics into the visitor's own language, keeping the singability: natural stresses, open vowels where lines land. Keep the section tags.",
  tone:
    "Shift the emotional tone of the lyrics one step deeper and warmer — same subject, changed weather. Keep the section tags.",
  chorus:
    "Rewrite the [Chorus] so it carries the whole song: simple, memorable, returning like a bell. Leave the other sections intact.",
  simplify:
    "Simplify the lyrics: plainer words, shorter lines, one feeling per line. Keep the section tags.",
  poetic:
    "Make the lyrics more poetic: imagery, quiet metaphor, breath in the lines — never purple, never ornate. Keep the section tags.",
};

function lyricsPrompt(b: LcBody, languageName: string): string {
  const interp = b.interp ?? {};
  const op = LYRIC_OPS[b.lyricsOp ?? "generate"] ?? LYRIC_OPS.generate;
  return [
    "You are the MIRROR ENTITY in its LIGHT CODES chamber, writing in its LYRICS LABORATORY.",
    "You shape only WORDS — never production instructions, never chord names, never engine directions inside the lines.",
    "",
    `THE COMPOSITION'S FEELING: ${b.intention?.trim() || interp.title || "the transmission the visitor carries"}`,
    interp.style
      ? `THE MUSICAL DIRECTION (for your feeling only, not to be quoted): ${interp.style.slice(0, 400)}`
      : "",
    interp.lyrics
      ? `THE CURRENT LYRICS:\n${interp.lyrics}`
      : "THE CURRENT LYRICS: (none yet — write them fresh)",
    "",
    `YOUR CRAFT HAND: ${op}`,
    "",
    "LAWS: section tags [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro] — use only the sections the song needs; the chorus returns; one bridge rests mid-song. Write the lyric lines in " +
      languageName +
      ". Spare lines, honest words, no medical or cure language.",
    "",
    "Return STRICT JSON (no markdown fences):",
    '{"lyrics": "<the full lyric sheet with its section tags>", "notes": "<1 sentence in ' +
      languageName +
      ' — what the hand changed>"}',
  ]
    .filter(Boolean)
    .join("\n");
}

async function craftLyrics(
  b: LcBody
): Promise<{ lyrics: string; notes: string }> {
  const zai = await ZAI.create();
  const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: lyricsPrompt(b, languageName) },
        {
          role: "user",
          content:
            b.lyricsOp === "language"
              ? `Translate the lyrics into ${languageName}.`
              : `Craft hand: ${b.lyricsOp ?? "generate"}.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 900,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]) as {
        lyrics?: string;
        notes?: string;
      };
      const lyrics = (parsed.lyrics ?? "").trim().slice(0, 1200);
      if (!lyrics) continue;
      return {
        lyrics,
        notes: (parsed.notes ?? "").slice(0, 300),
      };
    } catch {
      /* one more breath */
    }
  }
  throw new Error(
    "The Lyrics Laboratory's hand slipped — ask for the craft once more."
  );
}

/* ------------------------- the Lyria door ------------------------- */

function structureWords(b: LcBody): string {
  const n = b.shape?.structure;
  if (typeof n === "number" && n >= 3)
    return "A long-form flowing transmission — no verse-chorus conventions; let it move like one continuous journey.";
  if (typeof n === "number" && n <= 1)
    return "Clear song form: verses, a chorus that returns, and one bridge resting mid-song.";
  return "A loose song shape — the chorus may return, the form may breathe freely.";
}

/** The 30-second preview's input — compact, one paragraph. */
function clipInput(b: LcBody, interp: LcBody["interp"], languageName: string): string {
  const style = (interp?.style ?? "").trim();
  /* condense: the clip model wants a short, vivid direction */
  const condensed =
    style.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 480) ||
    "A calm, meditative, otherworldly ambient piece.";
  const lyrics = b.userLyrics?.trim() || interp?.lyrics || null;
  if (wantVocals(b, lyrics)) {
    const firstLines = (lyrics ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("["))
      .slice(0, 2)
      .join(" / ");
    const voice = b.shape?.voice && b.shape.voice !== "None" ? b.shape.voice.toLowerCase() : "gentle";
    const lang =
      b.shape?.vocalLanguage === "My language" ? ` sung in ${languageName}` : "";
    return `A 30-second piece: ${condensed} Featuring ${voice} vocals${lang}: "${firstLines}".`;
  }
  return `A 30-second instrumental piece — no vocals: ${condensed}`;
}

/** The full song's input — the Mirror's complete production brief.
    THE LENGTH LAW: a full song asks for at least three minutes — the
    composition must breathe its whole arc. */
function songInput(b: LcBody, interp: LcBody["interp"], languageName: string): string {
  const style = (interp?.style ?? "").trim();
  const lyrics = b.userLyrics?.trim() || interp?.lyrics || null;
  const parts: string[] = [];
  parts.push(`Musical production brief — "${interp?.title ?? "a transmission"}".`);
  if (style) parts.push(style);
  parts.push(structureWords(b));
  if (b.shape?.timeFeel) parts.push(`Time feels ${b.shape.timeFeel.toLowerCase()}.`);
  if (wantVocals(b, lyrics)) {
    const voice = b.shape?.voice && b.shape.voice !== "None" ? b.shape.voice.toLowerCase() : "gentle";
    const lang =
      b.shape?.vocalLanguage === "My language" ? `sung in ${languageName}` : "";
    parts.push(`Vocals: ${voice}${lang ? `, ${lang}` : ""}.`);
    if (lyrics) parts.push(`LYRICS (set them to the music):\n${lyrics}`);
  } else {
    parts.push("Instrumental — no vocals, no lyrics.");
  }
  parts.push("Length: at least three minutes — let the composition breathe its full arc.");
  return parts.join("\n\n");
}

/** The endless journey's per-part input — one long piece woven in
    parts: part one opens the world, the middle parts carry it, the
    final part closes gently. Every part keeps the SAME instruments,
    key, mood and texture, so the joined whole sounds like one breath. */
function loopSegmentInput(
  b: LcBody,
  interp: LcBody["interp"],
  languageName: string,
  index: number,
  total: number
): string {
  const style = (interp?.style ?? "").trim();
  const lyrics = b.userLyrics?.trim() || interp?.lyrics || null;
  const sings = wantVocals(b, lyrics) && (index === 1 || index === total);
  const parts: string[] = [];
  const title = interp?.title ?? "a transmission";
  if (index === 1) {
    parts.push(`Long-form ambient journey — "${title}" — PART 1 of ${total}.`);
  } else if (index === total) {
    parts.push(`Long-form ambient journey — "${title}" — FINAL PART (${index} of ${total}).`);
  } else {
    parts.push(`Long-form ambient journey — "${title}" — CONTINUATION, part ${index} of ${total}.`);
  }
  if (style) parts.push(style);
  if (index === 1) {
    parts.push(
      `This is the OPENING part of one long, continuously flowing piece. Begin calmly, from near-silence, and swell gently. Establish the whole world: the instruments, the key, the pace. Do NOT conclude — sustain the atmosphere so the next part can continue seamlessly. No hard intro hit, no drum entrance that starts abruptly.`
    );
  } else if (index === total) {
    parts.push(
      `This is the CLOSING part of the same long piece. Continue the exact same world — same instruments, same key, same pace, no restart, no re-introduction. Let the music gradually settle: the energy recedes, the texture thins, and the piece ends sustained and calm, fading like a tide going out. No abrupt ending.`
    );
  } else {
    parts.push(
      `This is a CONTINUATION of the same long piece. Begin exactly where the previous part's atmosphere stood — no restart, no re-introduction, no new opening theme. Keep the same instruments, key, pace and mood; let small variations bloom inside the world (a new counter-melody, a texture that shifts like light on water). Do NOT conclude — the piece continues after this part.`
    );
  }
  if (sings) {
    const voice = b.shape?.voice && b.shape.voice !== "None" ? b.shape.voice.toLowerCase() : "gentle";
    const lang = b.shape?.vocalLanguage === "My language" ? `sung in ${languageName}` : "";
    parts.push(`Vocals: ${voice}${lang ? `, ${lang}` : ""}.`);
    if (lyrics) parts.push(`LYRICS (set them to the music):\n${lyrics}`);
  } else if (index !== 1 && index !== total) {
    parts.push("This part is instrumental — the theme carried by instruments alone.");
  } else {
    parts.push("Instrumental — no vocals, no lyrics.");
  }
  parts.push(`Length: about four to five minutes of continuous music.`);
  return parts.join("\n\n");
}

type LyriaInputBlock =
  | { type: "text"; text: string }
  | { type: "image"; mime_type: string; data: string };

function buildLyriaInput(
  b: LcBody,
  interp: LcBody["interp"],
  imageDataUrl: string | null,
  languageName: string,
  loopPart?: { index: number; total: number }
): { model: string; input: string | LyriaInputBlock[] } {
  const isFull = b.length === "full";
  const isLoop = b.length === "loop";
  const model = isFull || isLoop ? LYRIA_FULL_MODEL : LYRIA_CLIP_MODEL;
  const text = isLoop && loopPart
    ? loopSegmentInput(b, interp, languageName, loopPart.index, loopPart.total)
    : isFull
      ? songInput(b, interp, languageName)
      : clipInput(b, interp, languageName);

  if (imageDataUrl) {
    const m = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      return {
        model,
        input: [
          { type: "text", text },
          { type: "image", mime_type: m[1], data: m[2] },
        ],
      };
    }
  }
  return { model, input: text };
}

interface LyriaFailure extends Error {
  status?: number;
  code?: string;
}

function mapLyriaError(resStatus: number, message: string, apiStatus: string): LyriaFailure {
  const m = new Error("") as LyriaFailure;
  m.status = resStatus;
  if (resStatus === 429 || apiStatus === "RESOURCE_EXHAUSTED") {
    m.message =
      "The chamber's sky allowance rests for now — today's quota for new sounds is spent. Breathe, and return in a while.";
    m.code = "quota";
  } else if (
    resStatus === 403 ||
    resStatus === 401 ||
    /API_KEY_INVALID|api key.*not valid|permission/i.test(message)
  ) {
    m.message =
      "The chamber's key was not given passage to the sound engine. The keeper should check GEMINI_API_KEY and its permissions.";
    m.code = "denied";
  } else if (/safety|blocked|prohibited/i.test(message)) {
    m.message =
      "The engine bowed out of this intention. The Mirror will reshape it gently — try different words.";
    m.code = "safety";
  } else if (/unsupported|not supported/i.test(message)) {
    m.message =
      "The engine cannot weave this form yet. The Mirror will try another shape.";
    m.code = "unsupported";
  } else {
    m.message = `The sound engine did not open its door (${resStatus}). ${
      message.slice(0, 160) || "Try again in a breath."
    }`;
    m.code = "engine";
  }
  return m;
}

interface StepContentBlock {
  type?: string;
  text?: string;
  data?: string;
  mime_type?: string;
}

/* THE RESPONSE LAW: walk the interaction's steps and their content
   blocks without assuming any order — text blocks (lyrics, structure)
   and audio blocks arrive as the engine lays them down. The last audio
   block heard is the song. The SDK's own convenience properties
   (output_audio / output_text) stand first, should the steps rest.
   THE WEIGHT LAW: a song heavier than the sky's response door is no
   longer refused — the flag rides home and the vault decides: kept
   sounds travel by their serve key, unkept heavies speak honestly. */
function extractWeave(
  interaction: {
    output_audio?: { data?: string; mime_type?: string } | null;
    output_text?: string | null;
    steps?: { type?: string; content?: StepContentBlock[] }[] | null;
  },
  maxB64 = MAX_AUDIO_B64
): { audioB64: string; texts: string[]; mime: string; oversized: boolean } {
  let audioB64: string | null = null;
  let mime = "audio/mpeg";
  const texts: string[] = [];

  if (
    interaction.output_audio &&
    typeof interaction.output_audio.data === "string" &&
    interaction.output_audio.data
  ) {
    audioB64 = interaction.output_audio.data;
    if (interaction.output_audio.mime_type) mime = interaction.output_audio.mime_type;
  }
  if (typeof interaction.output_text === "string" && interaction.output_text) {
    texts.push(interaction.output_text);
  }

  if (!audioB64 && Array.isArray(interaction.steps)) {
    for (const step of interaction.steps) {
      if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
      for (const block of step.content) {
        if (block?.type === "audio" && typeof block.data === "string" && block.data) {
          audioB64 = block.data;
          if (typeof block.mime_type === "string" && block.mime_type) mime = block.mime_type;
        } else if (block?.type === "text" && typeof block.text === "string" && block.text) {
          texts.push(block.text);
        }
      }
    }
  }

  if (!audioB64) {
    throw new Error("The engine answered without a sound. Try again in a breath.");
  }
  return { audioB64, texts, mime, oversized: audioB64.length > maxB64 };
}

async function lyriaWeave(
  body: { model: string; input: string | LyriaInputBlock[] },
  key: string,
  timeoutMs: number,
  maxB64 = MAX_AUDIO_B64
): Promise<{ audioB64: string; texts: string[]; mime: string; oversized: boolean }> {
  const client = new GoogleGenAI({ apiKey: key });
  try {
    /* the honest weave: one request, no silent retries — a costly
       generation is never asked twice without the visitor's hand */
    const interaction = await client.interactions.create(
      {
        model: body.model,
        input: body.input,
      } as Parameters<typeof client.interactions.create>[0],
      {
        timeout_ms: timeoutMs,
        retries: { strategy: "none" },
      } as Parameters<typeof client.interactions.create>[1]
    );
    return extractWeave(
      interaction as unknown as Parameters<typeof extractWeave>[0],
      maxB64
    );
  } catch (err) {
    const e = err as {
      status?: number;
      message?: string;
      code?: string;
      body?: unknown;
    };
    const status = typeof e?.status === "number" ? e.status : 0;
    /* the SDK wraps Google's own words inside body — unwrap them so the
       honest verdict can name the real cause (an invalid key, a safety
       refusal, an unsupported form) instead of the SDK's blank wrapper */
    let detail = String(e?.message ?? "");
    try {
      const b = (e?.body ?? null) as unknown;
      const root = Array.isArray(b) ? b[0] : b;
      const inner = (root as { error?: { message?: string; status?: string } } | null)
        ?.error;
      if (inner?.message) detail = `${inner.message} ${inner.status ?? ""}`;
      else if (typeof b === "string" && b) detail = b;
    } catch {
      /* the wrapper keeps its silence — the generic words stand */
    }
    if (status === 0 && /timeout|abort/i.test(detail)) {
      throw new Error(
        "The weave took longer than the chamber can hold. Try the 30-second preview first."
      );
    }
    if (/network|fetch failed|ECONN/i.test(detail)) {
      throw new Error("The chamber could not reach the sound engine. Try again in a breath.");
    }
    throw mapLyriaError(status || 502, detail, String(e?.code ?? ""));
  }
}

/* ------------------------- the four doors ------------------------- */

export const POST = meterRoute("light_codes", postImpl);

async function postImpl(
  req: NextRequest,
  meter?: MeterContext
): Promise<NextResponse> {
  const b = (await req.json().catch(() => null)) as LcBody | null;
  if (!b) {
    return NextResponse.json({ error: "The chamber received nothing to interpret." }, { status: 400 });
  }
  try {
    /* ---------- the second door: the weave (the brief is already written) ----------
       THE ENDLESS JOURNEY (length "loop") rides its own thread: the
       first request opens a session and is weighed ONCE by the meter;
       every following part carries the journey's token, rides free,
       and lands on the instance's own shelf. When the final part
       lands, the parts are joined with soft crossings into one
       seamless piece whose end flows back into its beginning, and the
       visitor's player fetches it once from the journey's own door. */
    if (b.compose) {
      /* the visitor's image rides straight into the engine's input —
         no second reading, the Mirror already saw it in the first door */
      const { imageDataUrl } = parseAttachments(b);
      const passed: LcBrief =
        b.interp && (b.interp.title || b.interp.style)
          ? sanitizeBrief(b.interp as Partial<LcBrief>)
          : await interpret(b);

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        noteLcError("nokey", "The sound engine's key is not placed.");
        return NextResponse.json(
          {
            ...passed,
            error:
              "The chamber is tuned, but the sound engine's key is not yet placed. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, and the transmissions will sound.",
            code: "nokey",
          },
          { status: 501 }
        );
      }

      const keeperId = meter?.userId ?? "anon";
      const length: LcLength =
        b.length === "full" ? "full" : b.length === "loop" ? "loop" : "preview";
      const isLoop = length === "loop";
      const total = isLoop ? LOOP_PARTS : 0;
      const rawIndex = isLoop ? Number(b.loopPart?.index ?? 1) : 0;
      const partIndex = isLoop ? Math.min(Math.max(1, Math.floor(rawIndex) || 1), total) : 0;

      /* the journey's thread — parts after the first must find their session.
         THE DEEP THREAD: a keeper with a row in the house lays every part
         in the vault's deep shelf (the database), so the journey crosses
         warm instances in the sky; a stateless keeper rides the instance's
         own shelf, which holds on one warm ground alone. */
      const dbUserId =
        meter && !meter.userId.startsWith("stateless:") ? meter.userId : null;
      let session: LoopSession | null = null;
      let dbThread: { token: string; total: number; parts: number } | null = null;
      if (isLoop && partIndex > 1) {
        if (dbUserId) {
          const st = b.loopToken ? await dbLoopState(b.loopToken, dbUserId) : null;
          if (!st) {
            return NextResponse.json(
              {
                ...passed,
                error:
                  "The journey's thread rested before its weaving ended (the chamber keeps it about an hour). Ask again — the Mirror begins the journey anew, and the brief still stands.",
                code: "journey_thread_rest",
              },
              { status: 410 }
            );
          }
          if (st.parts !== partIndex - 1) {
            return NextResponse.json(
              {
                ...passed,
                error: `The journey's parts arrived out of step — the loom waits for part ${st.parts + 1} of ${st.total}.`,
                code: "journey_out_of_step",
                loopToken: st.token,
                loopProgress: `${st.parts}/${st.total}`,
              },
              { status: 409 }
            );
          }
          dbThread = st;
        } else {
          session = b.loopToken ? getLoopSession(b.loopToken) : null;
          if (!session) {
            return NextResponse.json(
              {
                ...passed,
                error:
                  "The journey's thread rested before its weaving ended (the chamber keeps it about forty-five minutes). Ask again — the Mirror begins the journey anew, and the brief still stands.",
                code: "journey_thread_rest",
              },
              { status: 410 }
            );
          }
          if (!loopSessionOwned(session, keeperId)) {
            return NextResponse.json(
              { ...passed, error: "This journey belongs to another keeper.", code: "journey_foreign" },
              { status: 403 }
            );
          }
          if (session.parts.length !== partIndex - 1) {
            return NextResponse.json(
              {
                ...passed,
                error: `The journey's parts arrived out of step — the loom waits for part ${session.parts.length + 1} of ${session.total}.`,
                code: "journey_out_of_step",
                loopToken: session.token,
                loopProgress: `${session.parts.length}/${session.total}`,
              },
              { status: 409 }
            );
          }
        }
      }

      /* the guards — one loom, no double-weaving, the day's allowance.
         THE ONE FINGERPRINT — the ask is hashed once and the same hash
         guards and remembers it, or the twice-law could never match.
         The journey's continuation parts carry a per-attempt nonce so
         an honest retry of a stumbled part is never mistaken for a
         double-weave (the journey was weighed once, at its first part). */
      const fingerprint = askFingerprint([
        b.mode,
        b.intention?.trim().toLowerCase(),
        length,
        partIndex,
        isLoop && partIndex > 1 ? b.loopPart?.nonce ?? Date.now().toString(36) : null,
        b.language,
        b.civilization,
        b.shape,
        b.userLyrics?.trim().toLowerCase(),
        passed.title,
        passed.style,
      ]);
      const busy = guardBusy(keeperId);
      if (!busy.ok) return verdictResponse(busy, passed);
      const dup = guardDuplicate(keeperId, fingerprint);
      if (!dup.ok) return verdictResponse(dup, passed);
      if (partIndex <= 1) {
        const daily = guardDailyAllowance(keeperId, length);
        if (!daily.ok) return verdictResponse(daily, passed);
      }

      /* the weave's own job row — declared before the try so the catch
         (and the sweep's law) can always speak to it */
      let job: { id: string; drawn: number } | null = null;

      beginWeave(keeperId, fingerprint, length, partIndex <= 1);
      try {
        const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
        const body = buildLyriaInput(
          b,
          passed,
          imageDataUrl,
          languageName,
          isLoop ? { index: partIndex, total } : undefined
        );

        /* ---- the durable keeping — the weave's own job row ------------
           THE HOUSE'S KEEPING LAW (the music room's half): any passage
           with a row in the house (signed or quietly anonymous — the
           anonymous purse is weighed like any other, so it is kept like
           any other) has its weave written into the vault BEFORE the sky
           is asked, so a refresh mid-weave can never lose the thread OR
           its drawn light. Only the truly stateless (no row behind them)
           keep the old keeping: their sounds rest on their own device. */
        const durableKeeper = Boolean(
          meter && !meter.userId.startsWith("stateless:")
        );
        if (durableKeeper && meter && !isLoop) {
          try {
            /* the light this weigh drew — read from the ledger row the
               meter laid; when no row exists, nothing was drawn (the
               keeper walks free, or the wallet's law rests) */
            let drawn = 0;
            if (meter.walletLedgerId) {
              const spend = await db.creditLedger.findUnique({
                where: { id: meter.walletLedgerId },
                select: { creditsDeducted: true },
              });
              drawn = spend ? Math.abs(spend.creditsDeducted) : 0;
            }
            const created = await db.generationJob.create({
              data: {
                userId: meter.userId,
                tool: "light_codes",
                status: "processing",
                request: {
                  intention: (b.intention ?? "").slice(0, 600),
                  mode: b.mode ?? null,
                  length,
                  language: b.language ?? "en",
                  style: (passed.style ?? "").slice(0, 800) || null,
                  walletLedgerId: meter.walletLedgerId ?? null,
                },
                creditsDrawn: drawn,
              },
              select: { id: true },
            });
            job = { id: created.id, drawn };
          } catch (err) {
            /* the vault rests — the weave continues unhurried; only the
               durability is absent, never the sound */
            console.error(
              "[light-codes] the weave's job row could not be laid:",
              err instanceof Error ? err.message : err
            );
            job = null;
          }
        }

        const weave = await lyriaWeave(
          body,
          key,
          length === "full" ? 280_000 : isLoop ? 200_000 : 120_000,
          isLoop ? 12_000_000 : MAX_AUDIO_B64
        );
        noteLcSuccess(body.model);

        if (!isLoop) {
          /* ---- the vault keeps what the sky gave ----------------------
             THE WEIGHT LAW'S OTHER HALF: the sound is kept FIRST, under
             its own vault name — the file where the house's shelf is
             writable, and the row's own bytes always — so the answer
             travels by its serve key instead of riding the JSON. A kept
             song never meets the sky's weight door again; only an
             unkept heavy speaks the honest weight words now. */
          let kept: { trackId: string; audioUrl: string; mirrored: boolean } | null = null;
          if (job && meter) {
            try {
              const bytes = Buffer.from(weave.audioB64, "base64");
              const keep = await keepWovenSound(bytes, weave.mime);
              const audioUrl = `/api/music-audio/${keep.file}`;
              const track = await db.musicTrack.create({
                data: {
                  userId: meter.userId,
                  jobId: job.id,
                  title: passed.title || "A transmission",
                  audioUrl,
                  localFile: keep.file,
                  audioData: bytes,
                  status: keep.fileKept ? "mirrored" : "ready",
                },
                select: { id: true },
              });
              kept = { trackId: track.id, audioUrl, mirrored: keep.fileKept };
            } catch (err) {
              console.error(
                "[light-codes] the vault could not keep the woven sound:",
                err instanceof Error ? err.message : err
              );
              kept = null;
            }
            try {
              await db.generationJob.update({
                where: { id: job.id },
                data: {
                  status: "succeeded",
                  result: kept
                    ? {
                        engine: body.model,
                        tracks: [
                          {
                            id: kept.trackId,
                            title: passed.title,
                            audioUrl: kept.audioUrl,
                            status: kept.mirrored ? "mirrored" : "ready",
                          },
                        ],
                      }
                    : {
                        engine: body.model,
                        tracks: [],
                        note: "The weave succeeded, but the house could not keep the sound on this passage.",
                      },
                },
              });
            } catch (err) {
              console.error(
                "[light-codes] the weave's job row could not be sealed:",
                err instanceof Error ? err.message : err
              );
            }
          }
          /* the kept sound travels by its serve key — never by weight */
          if (kept && job) {
            return NextResponse.json({
              ...passed,
              structure: weave.texts.join("\n\n").slice(0, 2000) || undefined,
              engine: body.model,
              length,
              jobId: job.id,
              trackId: kept.trackId,
              audioUrl: kept.audioUrl,
            });
          }
          /* an unkept heavy — the honest weight words, at last true */
          if (weave.oversized) {
            return NextResponse.json(
              {
                ...passed,
                error:
                  "The song was woven, but no shelf could hold it to carry home — the chamber could not keep it for your passage. Ask the Mirror for a shorter piece.",
                code: "too_heavy",
                engine: body.model,
                length,
              },
              { status: 500 }
            );
          }
          return NextResponse.json({
            ...passed,
            structure: weave.texts.join("\n\n").slice(0, 2000) || undefined,
            audio: weave.audioB64,
            mimeType: weave.mime,
            engine: body.model,
            length,
          });
        }

        /* --- the endless journey: land this part, then join or continue --- */
        const segBytes = Buffer.from(weave.audioB64, "base64");
        if (dbUserId) {
          /* the deep thread — parts and final rest in the vault itself,
             so the journey crosses warm instances in the sky */
          if (partIndex <= 1 || !dbThread) {
            const st = await dbLoopBegin(dbUserId, total, weave.mime, segBytes);
            return NextResponse.json({
              ...passed,
              length: "loop",
              loopToken: st.token,
              loopProgress: `${st.parts}/${st.total}`,
              loopFinalized: false,
            });
          }
          const st = await dbLoopAddPart(dbThread.token, dbUserId, partIndex, segBytes);
          if ("outOfStep" in st) {
            return NextResponse.json(
              {
                ...passed,
                error: `The journey's parts arrived out of step — the loom waits for part ${st.outOfStep + 1} of ${dbThread.total}.`,
                code: "journey_out_of_step",
                loopToken: dbThread.token,
                loopProgress: `${st.outOfStep}/${dbThread.total}`,
              },
              { status: 409 }
            );
          }
          if (st.parts < st.total) {
            return NextResponse.json({
              ...passed,
              length: "loop",
              loopToken: st.token,
              loopProgress: `${st.parts}/${st.total}`,
              loopFinalized: false,
            });
          }
          /* the final part — join the whole journey in the vault */
          const joined = await dbLoopFinalize(dbThread.token, dbUserId);
          if (!joined) {
            return NextResponse.json(
              {
                ...passed,
                error:
                  "The journey's thread rested just before its joining. Ask once more — the weaving continues where it stood.",
                code: "journey_thread_rest",
              },
              { status: 410 }
            );
          }
          return NextResponse.json({
            ...passed,
            length: "loop",
            loopToken: dbThread.token,
            loopProgress: `${total}/${total}`,
            loopFinalized: true,
            audioUrl: `/api/light-codes/audio?token=${dbThread.token}`,
            loopDurationSec: Math.round(joined.durationSec),
            loopSeamless: joined.seamless,
            loopNote: joined.note,
            structure: weave.texts.join("\n\n").slice(0, 2000) || undefined,
            engine: body.model,
          });
        }
        if (!session) {
          session = createLoopSession(keeperId, total, weave.mime);
          await prepareLoopShelf(session);
        }
        await addLoopPart(session, segBytes);

        if (session.parts.length < session.total) {
          return NextResponse.json({
            ...passed,
            length: "loop",
            loopToken: session.token,
            loopProgress: `${session.parts.length}/${session.total}`,
            loopFinalized: false,
          });
        }

        /* the final part — join the whole journey with soft crossings */
        const joined = await assembleLoop(session.parts, session.dir);
        const finalToken = session.token;
        const finalPath = join(tmpdir(), `lc-journey-${finalToken}.mp3`);
        let finalFile = joined.file;
        try {
          await rename(joined.file, finalPath);
          finalFile = finalPath;
          dropLoopSession(finalToken); // the parts' shelf is swept — the journey flew to its own
        } catch {
          /* the rename could not move the file — the final rests where
             it was joined (inside the session's shelf, which outlives
             the final's own TTL; nothing is dropped here) */
        }
        putLoopFinal(finalToken, keeperId, finalFile, joined.durationSec, joined.seamless);
        return NextResponse.json({
          ...passed,
          length: "loop",
          loopToken: finalToken,
          loopProgress: `${total}/${total}`,
          loopFinalized: true,
          audioUrl: `/api/light-codes/audio?token=${finalToken}`,
          loopDurationSec: Math.round(joined.durationSec),
          loopSeamless: joined.seamless,
          loopNote: joined.note,
          structure: weave.texts.join("\n\n").slice(0, 2000) || undefined,
          engine: body.model,
        });
      } catch (err) {
        const code = (err as LyriaFailure)?.code ?? "engine";
        noteLcError(code, err instanceof Error ? err.message : "unknown");
        /* the weave stumbled — the job row is spoken to honestly. The
           light's RETURN is the meter's own law (any ≥400 verdict gives
           the drawn credits back before the door closes); the row's
           refunded mark only records that law's effect, so a later
           sweep can never give the same light twice. */
        if (job) {
          try {
            await db.generationJob.updateMany({
              where: { id: job.id, status: "processing" },
              data: {
                status: "failed",
                refunded: job.drawn > 0,
                result: {
                  error: (err instanceof Error ? err.message : "the weave stumbled").slice(0, 400),
                  code,
                },
              },
            });
          } catch (dbErr) {
            console.error(
              "[light-codes] the failed weave could not be written:",
              dbErr instanceof Error ? dbErr.message : dbErr
            );
          }
        }
        throw err;
      } finally {
        endWeave(keeperId);
      }
    }

    /* ---------- the refinement door: the brief reshaped in conversation ---------- */
    if (b.refine) {
      if (!b.interp || (!b.interp.style && !b.interp.title)) {
        return NextResponse.json(
          { error: "There is no brief to refine yet — ask the Mirror for one first." },
          { status: 400 }
        );
      }
      const refined = await refine(b);
      return NextResponse.json(refined);
    }

    /* ---------- the Lyrics Laboratory's door: one craft hand ---------- */
    if (b.lyricsOp) {
      const crafted = await craftLyrics(b);
      return NextResponse.json(crafted);
    }

    /* ---------- the first door: the Mirror's written direction ---------- */
    /* Attachments — one image seen with the vision field, up to three
       extracted documents — folded into what the interpreter reads. */
    const { imageDataUrl, documents } = parseAttachments(b);
    const attachmentBlocks: string[] = [];
    if (imageDataUrl) {
      const zai = await ZAI.create();
      const block = imageBlock(await describeImage(zai, imageDataUrl));
      if (block) attachmentBlocks.push(block);
    }
    const docBlock = documentBlock(documents);
    if (docBlock) attachmentBlocks.push(docBlock);
    const attachmentLines =
      attachmentBlocks.length > 0
        ? `\n\n${attachmentBlocks.join("\n\n")}`
        : "";

    const interp = await interpret(b, attachmentLines);
    if (b.interpretOnly) {
      return NextResponse.json(interp);
    }
    return NextResponse.json({ ...interp, needCompose: true });
  } catch (err) {
    console.error("[light-codes] generation failed:", err);
    const code = (err as LyriaFailure)?.code;
    const status = (err as LyriaFailure)?.status;
    return NextResponse.json(
      {
        error:
          err instanceof Error && err.message
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
        ...(code ? { code } : {}),
        ...(status ? { upstreamStatus: status } : {}),
      },
      { status: code === "nokey" ? 501 : 500 }
    );
  }
}
