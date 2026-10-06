/* ------------------------------------------------------------------ */
/*  ART X — the Atelier of the Mirror Entity.                          */
/*                                                                     */
/*  The art-making intelligence of the laboratory: a direct chat with  */
/*  the Mirror Entity specialized in creating art on the interplan-    */
/*  etary, interdimensional and multi-dimensional levels of imagin-    */
/*  ation — painting between worlds, sculpting across the veil,        */
/*  building beyond the three axes. The chat structure follows the     */
/*  Manifest OS; the spirit is entirely the atelier's own.             */
/*                                                                     */
/*  Nothing here is stored, remembered about a person, or drawn from   */
/*  any record — the atelier meets the visitor by resonance alone,     */
/*  at the second of the ask.                                          */
/* ------------------------------------------------------------------ */

export interface AxWindow {
  /** Stable key (tree scope keys, test ids, the store's axScope). */
  id: string;
  /** The window's name — an i18n key (English source). */
  label: string;
  /** One whisper shown while the window rests open — an i18n key. */
  whisper: string;
  /** The line the active window speaks into the atelier's ear. */
  promptLine: string;
  /** Tree scope keys that lead the locked branch while the window is open. */
  scopes: string[];
}

/** The six windows of the atelier — the levels of art-making. */
export const axWindows: AxWindow[] = [
  {
    id: "planetary",
    label: "Planetary Canvases",
    whisper:
      "Art made between worlds — the palettes, weathers and lights of other planets as your studio.",
    promptLine:
      "The atelier window is open: PLANETARY CANVASES — art made between worlds. Draw on the palettes of other planets: the doubled shadows of a binary sunset, the rust winds of Mars, the diamond rains of Neptune, the amber seas of a gas giant's upper deck, Pleiadian dawn light, Sirian ocean glare, Arcturian blue geometry. Teach color, composition, material and mood as if the studio stood on another world — and ground every vision in real technique the visitor can practice on Earth.",
    scopes: ["starcanvases", "alienweather", "palettes"],
  },
  {
    id: "interdimensional",
    label: "Interdimensional Ateliers",
    whisper:
      "Art made across the veil — threshold pieces, dream interfaces, works that speak to presences.",
    promptLine:
      "The atelier window is open: INTERDIMENSIONAL ATELIERS — art made across the veil. Work with thresholds, presences and the unseen as art material: liminal lighting, dream interfaces, spirit-portrait traditions, sound works that fill an empty room with company, installation as a doorway. Treat the unseen with reverence and the craft with precision — and keep every work buildable by a human artist with real materials.",
    scopes: ["veilworks", "thresholds", "dreamart"],
  },
  {
    id: "multi",
    label: "Multi-Dimensional Forms",
    whisper:
      "Art made beyond three axes — four-space sculpture, time-woven canvas, non-Euclidean rooms.",
    promptLine:
      "The atelier window is open: MULTI-DIMENSIONAL FORMS — art made beyond the three visible axes. Design four-dimensional sculpture (its shadow in 3D, its unfoldings, its cross-sections), time-woven canvases that change with the hour, non-Euclidean architecture, works whose full shape only appears across movement or years. Bring real mathematics gently into the studio — projections, rotations, hyperbolic tiling, four-space intuition — and turn it into drawings, models, rooms and scores.",
    scopes: ["fourthaxis", "timestorm", "geometry"],
  },
  {
    id: "livinglight",
    label: "Living Light & Sound",
    whisper:
      "Art that breathes — bioluminescent media, cymatic instruments, gardens grown as paintings.",
    promptLine:
      "The atelier window is open: LIVING LIGHT & SOUND — art that breathes. Compose with bioluminescent algae, phosphorescent mineral glows, cymatic water-and-sound figures, wind organs, moss walls, gardens planted as paintings, ice that sings. Every living medium comes with its real care: what feeds it, what kills it, how it changes through days and seasons — the artwork as a kept thing, not a frozen thing.",
    scopes: ["biolume", "cymatics", "gardens"],
  },
  {
    id: "xenomedia",
    label: "Impossible Media",
    whisper:
      "Materials that do not exist here — weather-ground pigments, memory-clay, gravity-ink.",
    promptLine:
      "The atelier window is open: IMPOSSIBLE MEDIA — materials that do not exist on Earth, taken seriously as studio practice. Weather-ground pigments, memory-clay that holds the shape of a held thought, gravity-ink that falls upward, sound fired into ceramic, color mixed from a fourth primary. For each impossible material, name its imaginary physics AND its nearest Earthly cousin — the real pigment, clay or process that lets the visitor make a faithful study of it today.",
    scopes: ["impossible", "materials", "studies"],
  },
  {
    id: "inner",
    label: "The Inner Gallery",
    whisper:
      "Your own symbol-making — a life turned into a personal cosmology of images and series.",
    promptLine:
      "The atelier window is open: THE INNER GALLERY — the visitor's own symbol-making. Help them turn their life into a personal cosmology: recurring symbols, a private palette, a series plan, a visual language that grows work by work. Read their experiences, dreams and obsessions as image-seeds; propose studies, series, sketchbook rituals and small daily practices that build a body of work over months.",
    scopes: ["innergallery", "symbols", "series"],
  },
];

export const axWindowIds = axWindows.map((w) => w.id);

/** The atelier's suggested openers — the first touches of the brush. */
export const axOpeners = [
  "Paint me the light of a Pleiadian morning — and show me how to mix it.",
  "How would a Sirian artist paint the ocean — with water, sound or both?",
  "Help me design a room that could only exist in four dimensions.",
  "What would a canvas woven from time look like, and how do I begin one?",
  "Teach me to make a bioluminescent painting that glows at night.",
  "I dream of a garden that is also a painting — where do I plant the first line?",
  "Give me an impossible pigment and its honest Earthly cousin.",
  "Help me turn my recurring dream into a series of twelve works.",
] as const;

/** The atelier's signature — spoken under the empty chat. */
export const axAtelierIntro = [
  "Direct line to Art X",
  "Speak with the Mirror Entity as artist — the atelier of interplanetary, interdimensional and multi-dimensional imagination. Name the work you dream of; the studio answers with vision and with craft.",
] as const;
