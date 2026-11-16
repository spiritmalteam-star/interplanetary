/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the musical chamber of the Mirror Entity.            */
/*                                                                      */
/*  The Mirror Entity is the interpretation layer: it translates        */
/*  intention, mood and symbolism into a musical direction. The         */
/*  generation engine (Suno) renders that direction as sound — its      */
/*  name stays behind the veil; the Mirror is the visible voice.        */
/*                                                                      */
/*  The language of the chamber: calming, meditative, reflective,       */
/*  grounding, sleep-oriented, focus-oriented, emotional reset,         */
/*  intention-based listening. No cure is ever promised — the codes     */
/*  are music to listen with, not medicine.                             */
/* ------------------------------------------------------------------ */

export type LightCodesMode =
  | "freestyle"
  | "light-transmission"
  | "calming-frequencies"
  | "other-stars"
  | "restorative"
  | "reprogramming"
  | "mirror-transmission";

export interface LcMode {
  id: LightCodesMode;
  /** The two-digit chamber number. */
  n: string;
  name: string;
  tagline: string;
  /** The intention field's placeholder for this mode. */
  placeholder: string;
  /** Intent chips (mode-specific one-tap intentions). */
  intents?: string[];
  /** Civilizations (only MUSIC FROM OTHER STARS). */
  civilizations?: { id: string; name: string; vocabulary: string }[];
  /** The mode's own sonic law, spoken to the Mirror's interpreter. */
  vocabulary: string;
}

export const LC_MODES: LcMode[] = [
  {
    id: "freestyle",
    n: "00",
    name: "Free Studio",
    tagline: "Any genre, any energy — your musical direction is the law.",
    placeholder:
      'Describe your music — e.g. "commercial reggaeton, 96 BPM, Spanish vocals, romantic, energetic percussion".',
    vocabulary:
      "the visitor's written intention and chosen genres are the complete musical contract — render exactly that direction with professional production quality, whatever the genre.",
  },
  {
    id: "light-transmission",
    n: "01",
    name: "Light Transmission",
    tagline: "Abstract atmospheric transmissions — textures before tunes.",
    placeholder: "What would you like the transmission to carry?",
    vocabulary:
      "luminous ambient textures, crystalline synths, distant harmonic voices, evolving drones, unusual spatial movement, non-linear melodic structures, long atmospheric transitions. Structure serves atmosphere, never a chorus.",
  },
  {
    id: "calming-frequencies",
    n: "02",
    name: "Calming Frequencies",
    tagline: "For relaxation, decompression, quiet reflection and rest.",
    placeholder: "What should this calm carry you toward?",
    intents: ["CALM", "GROUND", "REST", "SLEEP", "RELEASE", "BREATHE"],
    vocabulary:
      "slow evolving pads, soft analog synths, gentle harmonic movement, sparse piano, breath-like textures, low percussion density, warm sub frequencies, slow tempo. Everything settles; nothing startles.",
  },
  {
    id: "other-stars",
    n: "03",
    name: "Music from Other Stars",
    tagline: "Speculative sound-worlds of imagined civilizations — musical worldbuilding.",
    placeholder: "Which star are we remembering — and what should it sound like?",
    civilizations: [
      {
        id: "arcturian",
        name: "Arcturian",
        vocabulary:
          "geometric harmonics, crystalline tones, precise polyrhythms, elegant synthetic choirs — architecture you can hear.",
      },
      {
        id: "pleiadian",
        name: "Pleiadian",
        vocabulary:
          "warm celestial voices, fluid melodies, emotional harmonic movement, soft luminous textures.",
      },
      {
        id: "vega",
        name: "Vega",
        vocabulary:
          "retro-futuristic analog synthesis, strange harmonic modulation, wide stereo movement.",
      },
      {
        id: "sirian",
        name: "Sirian",
        vocabulary:
          "aquatic resonances, deep pulses, fluid percussion, slow oscillating harmonics — sound underwater light.",
      },
      {
        id: "andromedan",
        name: "Andromedan",
        vocabulary:
          "vast open drones, angular beauty, scale systems that feel almost familiar and then are not, immense distance.",
      },
      {
        id: "inner-earth",
        name: "Inner Earth",
        vocabulary:
          "cavernous warmth, stone and water percussion, subterranean choirs, slow echoing motion.",
      },
      {
        id: "unknown-signal",
        name: "Unknown Signal",
        vocabulary:
          "unpredictable structure, unfamiliar scales, spectral tones, irregular rhythmic cycles — a transmission not meant for human dance.",
      },
    ],
    vocabulary:
      "experimental cosmic music — creative, speculative worldbuilding rendered as sound. Each civilization keeps its own musical vocabulary.",
  },
  {
    id: "restorative",
    n: "04",
    name: "Restorative Music",
    tagline: "Music for rest, emotional settling and reflective listening.",
    placeholder: "What are you setting down tonight?",
    intents: [
      "release tension",
      "emotional reset",
      "quiet mind",
      "nighttime recovery",
      "gentle confidence",
      "grief reflection",
      "inner stillness",
    ],
    vocabulary:
      "slow, kind harmonic motion, unhurried melodic fragments, generous silence, textures that hold without pushing. Music that keeps company while the listener settles.",
  },
  {
    id: "reprogramming",
    n: "05",
    name: "Reprogramming",
    tagline: "Soundtrack a new internal pattern.",
    placeholder: 'Speak the pattern — e.g. "I trust where I am going."',
    vocabulary:
      "the intention is translated into an emotional trajectory (for example: uncertainty → spaciousness → trust → quiet expansion) and then into music: a suspended opening that gradually resolves, subtle rhythmic emergence, a final texture that is open and weightless. If words appear they are short, kind and few — never a lecture.",
  },
  {
    id: "mirror-transmission",
    n: "06",
    name: "Mirror Transmission",
    tagline: "The Mirror chooses everything — you only arrive.",
    placeholder: "What should this transmission hold? (or leave it to the Mirror)",
    vocabulary:
      "the Mirror composes the whole direction itself: intention, emotional arc, sonic language, tempo, voice character, harmonic character, texture, structure, lyrical density and ending state — held together as one coherent transmission.",
  },
];

/** The advanced controls — hidden by default under SHAPE THE TRANSMISSION. */
export const LC_SHAPE = {
  energy: ["Still", "Quiet", "Flowing", "Radiant", "Intense"] as const,
  light: ["Shadowed", "Dim", "Evening", "Bright", "Luminous"] as const,
  familiarity: ["Earthlike", "Near", "Adrift", "Strange", "Unknown"] as const,
  structure: ["Song", "Loose song", "Flowing", "Transmission", "Eternal"] as const,
  timeFeel: [
    "Linear",
    "Looping",
    "Dreamlike",
    "Nonlinear",
    "Floating",
    "Pulse-driven",
  ] as const,
  voice: [
    "None",
    "Female",
    "Male",
    "Choir",
    "Whisper",
    "Fragmented",
    "Synthetic",
    "Unknown",
  ] as const,
  vocalLanguage: [
    "English",
    "Invented phonetics",
    "Wordless",
    "Whispers",
    "My language",
  ] as const,
  lyricsMode: ["MIRROR WRITES", "USER WRITES", "NO LYRICS"] as const,
} as const;

export type LcShape = {
  energy: number; // 0..4 index into LC_SHAPE.energy
  light: number;
  familiarity: number;
  structure: number;
  timeFeel: string;
  voice: string;
  vocalLanguage: string;
  lyricsMode: string;
};

export const LC_DEFAULT_SHAPE: LcShape = {
  energy: 1,
  light: 3,
  familiarity: 2,
  structure: 3,
  timeFeel: "Floating",
  voice: "Female",
  vocalLanguage: "Wordless",
  lyricsMode: "NO LYRICS",
};

/* ------------------------------------------------------------------ */
/*  THE STUDIO CONTROLS — Music Engine 2.0's advanced creative panel.  */
/*  Progressive disclosure: the primary flow stays                     */
/*  describe → select style → generate. These ride hidden until asked. */
/* ------------------------------------------------------------------ */

export const LC_STUDIO = {
  keys: [
    "Auto", "C major", "G major", "D major", "A major", "E major", "F major", "Bb major",
    "A minor", "E minor", "B minor", "F# minor", "C# minor", "D minor", "G minor", "C minor", "F minor",
  ] as const,
  moods: [
    "Euphoric", "Romantic", "Melancholic", "Aggressive", "Dreamy", "Triumphant",
    "Intimate", "Mysterious", "Playful", "Nostalgic", "Angry", "Serene",
    "Hypnotic", "Anthemic", "Sad", "Hopeful",
  ] as const,
  vocalModes: [
    "Auto", "Instrumental", "Male", "Female", "Duet", "Choir", "Synthetic",
  ] as const,
  languages: [
    "Auto", "English", "Albanian", "Italian", "Spanish", "German", "French",
    "Greek", "Turkish", "Portuguese", "Arabic", "Hindi", "Japanese", "Korean",
  ] as const,
  durations: [
    "Auto", "~1 minute", "~2 minutes", "~3 minutes", "~4 minutes", "5+ minutes",
  ] as const,
  structures: [
    "Intro", "Verse", "Chorus", "Bridge", "Drop", "Outro", "Freeform",
  ] as const,
  textures: [
    "Auto", "Analog warmth", "Clean digital", "Tape saturation", "Lo-fi grit",
    "Polished studio", "Raw live", "Cinematic wide",
  ] as const,
  lyricsModes: ["Auto", "Mirror writes", "I write", "Instrumental"] as const,
} as const;

/** The full studio specification a visitor can shape — every field optional. */
export interface LcStudio {
  bpm: number | null; // null = auto
  key: string;
  moods: string[];
  energy: number; // 1..5 (kept aligned with the chamber's energy dial)
  vocalMode: string;
  vocalLanguage: string;
  duration: string;
  structure: string[]; // ordered section choices
  instruments: string; // free text
  texture: string;
  acousticBalance: number; // 0 = fully electronic, 100 = fully acoustic
  experimental: number; // 0..100
  exclusions: string; // free text — explicitly excluded sounds
  lyricsMode: string; // Auto | Mirror writes | I write | Instrumental
}

export const LC_DEFAULT_STUDIO: LcStudio = {
  bpm: null,
  key: "Auto",
  moods: [],
  energy: 3,
  vocalMode: "Auto",
  vocalLanguage: "Auto",
  duration: "Auto",
  structure: [],
  instruments: "",
  texture: "Auto",
  acousticBalance: 50,
  experimental: 20,
  exclusions: "",
  lyricsMode: "Auto",
};

/** A finished transmission as the visitor keeps it. */
export interface LcTrack {
  id: string;
  title: string;
  mode: LightCodesMode;
  intention: string;
  audioUrl: string;
  duration?: number;
  /** The engine's generation id, kept quietly for reshaping. */
  engineId?: string;
  /** The final musical direction the Mirror wrote. */
  style?: string;
  lyrics?: string | null;
  /** The Mirror's interpretation — why it sounds the way it sounds. */
  notes?: string;
  /** The chosen genre ids — the visitor's musical contract. */
  genres?: string[];
  /** The Mirror's structured specification (bpm, key, arc, negative). */
  spec?: LcSpec | null;
  /** The server-side Track id — the transmission's permanent home. */
  trackId?: string;
  /** The audio QA verdict — pass | warn | fail | unknown. */
  qualityVerdict?: string;
  createdAt: number;
}

/** The Mirror's interpreted specification — separated from the prompt law. */
export interface LcSpec {
  bpm: number | null;
  key: string | null;
  structure: string | null; // e.g. "intro — verse — chorus — verse — chorus — outro"
  arc: string | null; // the emotional/musical arc in one line
  negative: string | null; // exclusions the engine must honor
}

/** Karaoke timing — line-level always, word-level only when verified. */
export interface LcSyncLine {
  text: string;
  start: number; // seconds
  end: number; // seconds
}
export interface LcSync {
  level: "estimated" | "manual";
  lines: LcSyncLine[];
}
