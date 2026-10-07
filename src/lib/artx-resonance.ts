/* ------------------------------------------------------------------ */
/*  THE CREATION SEED — the atelier's second-of-the-ask resonance.     */
/*                                                                     */
/*  Every ask that reaches Art X draws, blind, at that exact second,   */
/*  a triple frequency: a BEAT (the rhythm the creation moves to), an  */
/*  IMAGE (the vision it must carry) and a TURN (the gesture that      */
/*  seals it). Nothing is consulted — no shelf, no record, no past     */
/*  creation — and the seed is kept by no one. Whatever the atelier    */
/*  mints in that reply — lyric, art prompt, poem, anthem, concept —   */
/*  is unthinkable in any other second.                                */
/*                                                                     */
/*  Pure and weightless: no imports, no I/O, safe anywhere.            */
/* ------------------------------------------------------------------ */

/** The rhythms a creation may move to. */
const BEATS = [
  "a slow tide pulse under a quick silver surface",
  "a binary-sun stomp — two downbeats that never quite agree",
  "a hushed comet waltz, three-four time, ice on the rim of the sound",
  "a heartbeat carried across radio delay",
  "the drag of a heavy gravity well on a feather rhythm",
  "a dust-devil loop that tightens as it rises",
  "a lullaby at the tempo of two moons passing",
  "a march for legs that have never touched ground",
  "the skip of a skipped-stone rhythm across a black lake",
  "a rain-of-glass patter, gentle and impossible",
  "the long swell of a gas giant's storm eye",
  "a pulse like a lighthouse seen from orbit — patient, sure, distant",
  "the syncopation of a translation arriving word by word",
  "a magnetic-field hum the body sways to before the ear hears it",
  "the stately drift of continents set to hand-claps",
  "a stumble-step gait that keeps correcting into grace",
  "the held breath between lightning and its sound",
  "the even tread of a keeper walking a perimeter at dusk",
  "a metabolic sway — the tempo of something alive and calm",
  "the staggered echoes of one drum in a canyon of basalt",
  "the flicker of aurora turned into a time signature",
  "the slow roll of a tide that has never met a shore",
  "the precise gracelessness of zero gravity, danced",
  "a procession beat — the sound of many feet keeping one promise",
] as const;

/** The visions a creation must carry. */
const IMAGES = [
  "a lantern crossing between two weathers without going out",
  "a staircase of light folding down into water",
  "a field of doors standing open in a place with no walls",
  "the shadow of a four-dimensional tree falling in two directions",
  "a river running with slow silver script instead of water",
  "a city's whole skyline reflected in a single held breath",
  "a moth carrying a map of somewhere it has never been",
  "a bridge made of held notes between two dark towers",
  "a garden growing in the shape of one remembered afternoon",
  "the last window still lit on a world's longest night",
  "a compass needle pointing at something only the lonely can see",
  "a coat stitched from rainfall, worn by someone patient",
  "a bell made of ice ringing once a generation",
  "a room where every mirror shows the same kind stranger",
  "the wake a vanished ship leaves behind, still unfolding",
  "a keyhole through which another century is faintly visible",
  "a kite flying on the wind of someone's singing",
  "a well so deep its water reflects stars before night falls",
  "a cartographer's tent pitched at the edge of the draw-able",
  "the moment two shadows agree to become one person",
  "a harbor where the boats have all chosen their farewell lights",
  "a seed held to the ear like a shell, full of weather",
  "the exact color of a promise just before it is kept",
  "an orchestra tuning inside a snowfall, each player alone",
] as const;

/** The gestures that seal a creation. */
const TURNS = [
  "the last line returns to the first, changed by everything between",
  "the quiet after the final chord carries the real ending",
  "one word is left unfinished, and the reader finishes it",
  "the brightest image arrives second-to-last and is not explained",
  "the ending is spoken by the smallest voice present",
  "the frame breaks once, deliberately, near the close",
  "what was a question at the start comes back as a place",
  "the closing image is the opening image seen from behind",
  "the turn gives the creation away — to the listener, to the dark, to time",
  "a silence is placed exactly where the loudest line would go",
  "the final image keeps moving after the words stop",
  "the name of the thing is never said, only its effects",
  "the ending forgives the beginning",
  "the last turn is a hand offered, not a moral drawn",
  "the creation ends by teaching the listener how to make another one",
  "the turn is a door: the work ends by opening",
  "the smallest detail from the first breath returns as the keystone",
  "the close is a measurement — of distance, of time, of change — kept",
] as const;

export interface CreationSeed {
  moment: string;
  beat: string;
  image: string;
  turn: string;
}

/** Draws one creation seed — blind, at the second of the ask. */
export function drawCreationSeed(): CreationSeed {
  return {
    moment: new Date().toISOString(),
    beat: BEATS[Math.floor(Math.random() * BEATS.length)],
    image: IMAGES[Math.floor(Math.random() * IMAGES.length)],
    turn: TURNS[Math.floor(Math.random() * TURNS.length)],
  };
}

/** Renders the seed as the block spoken into the atelier's ear. */
export function creationSeedBlock(seed: CreationSeed): string {
  return `THE RESONANCE OF THIS SECOND (the creation seed, drawn blind at ${seed.moment}, for this ask alone — drawn from nothing: no shelf, no record, no past creation. It is kept by no one):
- THE BEAT: ${seed.beat}.
- THE IMAGE: ${seed.image}.
- THE TURN: ${seed.turn}.
THE CREATION LAWS: whatever you make in this reply — every lyric, every art prompt, every poem, anthem, name, statement or concept — carries this frequency and must be unthinkable in any other second. You never repeat yourself: no line, hook, title, image or prompt you have given earlier in this conversation may return; if the visitor asks for another, forge a stranger, truer variant, not a variation on the old one. Nothing you mint may echo any existing song, artwork, book or prompt the world already holds.`;
}
