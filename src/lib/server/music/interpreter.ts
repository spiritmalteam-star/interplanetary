import type { LightCodesMode } from "@/lib/data/light-codes";
import { genreContract, genreName } from "@/lib/data/music-genres";

/* ------------------------------------------------------------------ */
/*  THE CHAMBER'S INTERPRETER — the quiet hand between the visitor's   */
/*  ask and the sound engine's contract. Deterministic, honest,        */
/*  instant: the studio's own words, the genres' contract and the      */
/*  intention itself are composed into one brief per track — no sky    */
/*  call can fail between the ask and the direction.                   */
/* ------------------------------------------------------------------ */

/** The full studio specification, exactly as the browser keeps it
    (mirror-lc-studio). Every field optional — the defaults stand. */
export interface StudioTuning {
  bpm?: number | null;
  key?: string;
  moods?: string[];
  energy?: number;
  vocalMode?: string;
  vocalLanguage?: string;
  duration?: string;
  structure?: string[];
  instruments?: string;
  texture?: string;
  acousticBalance?: number;
  experimental?: number;
  exclusions?: string;
  lyricsMode?: string;
  genres?: string[];
}

export interface TrackBrief {
  title: string;
  /** the production direction, written for the engine */
  style: string;
  /** the lyric sheet, or null for an instrumental */
  lyrics: string | null;
  /** the transmission notes — why it sounds the way it sounds */
  notes: string;
  /** the full text the engine is asked to weave */
  promptText: string;
}

/* the chamber's own title pools — one house, many rooms */
const TITLE_POOLS: Record<string, string[]> = {
  freestyle: ["The Room Answers", "A World in Sound", "The Vibe Made Audible"],
  "light-transmission": ["A Loom of Quiet Light", "The Field Between Stars", "Luminous Drift"],
  "calming-frequencies": ["The Settling", "Slow Harbour", "Breath of the Quiet Hour"],
  "other-stars": ["Signals from a Kind Star", "The Distant Chorus", "A World Made of Listening"],
  restorative: ["The Kind Return", "Held by the Evening", "A Gentle Ending"],
  reprogramming: ["The New Pattern", "Trust, Slowly", "The Open Door Within"],
  "mirror-transmission": ["What the Mirror Holds", "The Unnamed Resonance", "A Transmission for Now"],
  soundtrack: ["The Scene Awakens", "Wide and Moving", "The Story in Sound"],
};

const TITLE_SUFFIXES = [
  "I", "II", "III", "IV", "V", "VI",
  "Dawn Turn", "Dusk Turn", "Deep Turn", "Far Turn", "Quiet Turn", "Full Turn",
];

const MODE_NOTES: Record<string, string> = {
  freestyle: "the room's own frequency, made audible",
  "light-transmission": "a transmission woven from quiet light",
  "calming-frequencies": "frequencies that settle the nervous water",
  "other-stars": "a listening across the deep — a signal answered in sound",
  restorative: "a gentle restoration, note by note",
  reprogramming: "an old pattern rewritten into a kinder one",
  "mirror-transmission": "the Mirror's own transmission for this hour",
  soundtrack: "a wide scene painted in moving sound",
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** the studio's own words, spoken verbatim into the contract */
export function studioWords(st: StudioTuning | null | undefined): string[] {
  if (!st) return [];
  const parts: string[] = [];
  if (typeof st.bpm === "number" && st.bpm > 0) parts.push(`tempo ${Math.round(st.bpm)} BPM`);
  if (st.key && st.key !== "Auto") parts.push(`key of ${st.key}`);
  if (st.moods?.length) parts.push(`mood: ${st.moods.join(", ").toLowerCase()}`);
  if (typeof st.energy === "number") {
    parts.push(
      st.energy >= 4 ? "high energy" : st.energy <= 2 ? "low, resting energy" : "moderate energy"
    );
  }
  if (st.vocalMode && st.vocalMode !== "Auto") parts.push(`voice: ${st.vocalMode.toLowerCase()}`);
  if (st.vocalLanguage && st.vocalLanguage !== "Auto") parts.push(`vocal language: ${st.vocalLanguage}`);
  if (st.duration && st.duration !== "Auto") parts.push(`length ${st.duration.replace("~", "about ")}`);
  if (st.structure?.length) parts.push(`structure: ${st.structure.join(" → ")}`);
  if (st.instruments?.trim()) parts.push(`instruments: ${st.instruments.trim().slice(0, 160)}`);
  if (st.texture && st.texture !== "Auto") parts.push(`texture: ${st.texture.toLowerCase()}`);
  if (typeof st.acousticBalance === "number") {
    parts.push(
      st.acousticBalance >= 66
        ? "fully acoustic air"
        : st.acousticBalance <= 33
          ? "fully electronic air"
          : "a balanced electronic-acoustic air"
    );
  }
  if (typeof st.experimental === "number" && st.experimental >= 60) {
    parts.push("experimentation welcome at the edges");
  }
  if (st.exclusions?.trim()) {
    parts.push(`EXPLICITLY EXCLUDED (honor absolutely): ${st.exclusions.trim().slice(0, 220)}`);
  }
  return parts;
}

/** the shape dials' own words (the chamber's four dials + selects) */
function shapeWords(shape: Record<string, unknown> | null | undefined): string {
  if (!shape || typeof shape !== "object") return "";
  const s = shape as {
    timeFeel?: string; voice?: string; vocalLanguage?: string; lyricsMode?: string;
    energy?: number; light?: number; familiarity?: number; structure?: number;
  };
  const parts: string[] = [];
  if (s.timeFeel && s.timeFeel !== "Auto") parts.push(`time feels ${s.timeFeel.toLowerCase()}`);
  if (s.voice && s.voice !== "Auto") parts.push(`voice: ${s.voice.toLowerCase()}`);
  if (s.vocalLanguage && s.vocalLanguage !== "Auto") parts.push(`sung in ${s.vocalLanguage}`);
  if (s.lyricsMode && s.lyricsMode !== "Auto") parts.push(`lyrics: ${s.lyricsMode.toLowerCase()}`);
  if (typeof s.energy === "number") parts.push(`energy ${s.energy}/5`);
  if (typeof s.light === "number") parts.push(`light ${s.light}/5`);
  if (typeof s.familiarity === "number") parts.push(`familiarity ${s.familiarity}/5`);
  if (typeof s.structure === "number") parts.push(`structure ${s.structure}/5`);
  return parts.join("; ");
}

export interface BriefArgs {
  mode: string;
  intention: string;
  civilization?: string | null;
  shape?: Record<string, unknown> | null;
  studio?: StudioTuning | null;
  userLyrics?: string | null;
  instrumental?: boolean;
  language?: string | null;
  count: number;
}

/** the whole job's brief — the direction every track of the set walks */
export function buildJobBrief(args: BriefArgs): TrackBrief {
  const mode = args.mode || "mirror-transmission";
  const intention = (args.intention ?? "").trim();
  const genres = Array.isArray(args.studio?.genres) ? args.studio!.genres!.slice(0, MUSIC_LIMIT_SAFE) : [];
  const genreNames = genres.map((g) => genreName(g)).join(" + ");
  const h = hashStr(`${intention}|${genreNames}|${mode}`);
  const pool = TITLE_POOLS[mode] ?? TITLE_POOLS["mirror-transmission"];
  const studio = studioWords(args.studio);
  const shape = shapeWords(args.shape);

  const lyrics =
    !args.instrumental &&
    args.userLyrics?.trim()
      ? args.userLyrics.trim().slice(0, 600)
      : null;

  const style = genres.length
    ? `${genreNames}: ${genreContract(genres)}. ${
        studio.length ? studio.join("; ") + ". " : ""
      }${intention ? `The visitor's own direction: ${intention.slice(0, 200)}. ` : ""}` +
      "One continuous, seamlessly connected piece — no abrupt breaks, no long silent gaps."
    : `${MODE_NOTES[mode] ?? "a transmission woven from quiet light"}. ${
        shape ? shape + ". " : ""
      }${studio.length ? studio.join("; ") + ". " : ""}` +
      "One continuous, seamlessly connected piece — no abrupt breaks, no long silent gaps.";

  const notes = `The chamber wove the direction itself: ${
    genres.length ? genreNames.toLowerCase() : MODE_NOTES[mode] ?? mode
  } shaped by your words${intention ? ` — “${intention.slice(0, 80)}”` : ""}. The sound follows the shape you set.`;

  const promptParts = [
    `Weave one continuous piece of music: ${style}`,
    lyrics
      ? `The lyrics below are the visitor's own words — set them exactly, section by section, in the language they are written:\n${lyrics}`
      : args.instrumental
        ? "No vocals — a purely instrumental weave. No voice, no words."
        : args.studio?.vocalMode && args.studio.vocalMode !== "Auto"
          ? `Vocal treatment: ${args.studio.vocalMode.toLowerCase()}.`
          : "If a voice appears, let it sing wordless or gentle — no lead lyrics.",
    args.civilization
      ? `The texture carries the character of the ${args.civilization} presence — their own stillness, their own light.`
      : "",
    args.language && args.language !== "en"
      ? `Honor the language of the visitor's direction (${args.language}) in any spoken or sung word.`
      : "",
    "No abrupt breaks and no long silent gaps. The end flows naturally; the mix is balanced and gentle on the ears.",
  ].filter(Boolean);

  return {
    title: pool[h % pool.length],
    style,
    lyrics,
    notes,
    promptText: promptParts.join("\n\n"),
  };
}

const MUSIC_LIMIT_SAFE = 4;

/** one track's own walk of the brief — each song of a set is a real
    variation, never a copy: its turn rotates the palette honestly */
export function buildTrackBrief(
  base: TrackBrief,
  index: number,
  total: number,
  mode: string,
  intention: string
): TrackBrief {
  const h = hashStr(`${base.title}|${index}`);
  const suffix = TITLE_SUFFIXES[h % TITLE_SUFFIXES.length];
  const variation =
    total > 1
      ? `\n\nThis is take ${index + 1} of ${total} in one set: keep the same contract, but let this take find its own face — vary the arrangement, the opening and the small details, so no two takes are twins.`
      : "";
  return {
    ...base,
    title: total > 1 ? `${base.title} · ${suffix}` : base.title,
    promptText: `${base.promptText}${variation}`,
    style: base.style,
    notes: total > 1 ? `${base.notes} (take ${index + 1} of ${total})` : base.notes,
  };
}
