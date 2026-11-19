/* ------------------------------------------------------------------ */
/*  THE MUSICAL TAXONOMY — ten families, one hundred voices. The       */
/*  searchable shelf the studio selects from, and the one contract     */
/*  the engine is asked to honor. Pure data and deterministic text —   */
/*  no state, no network.                                              */
/* ------------------------------------------------------------------ */

export interface MusicGenre {
  id: string;
  name: string;
}

export interface MusicGenreFamily {
  id: string;
  name: string;
  /** the family's one-line voice, spoken inside the engine's contract */
  voice: string;
  /** heavy studio effects are the family's own nature — the audio
      analysis reads them honestly when this stands */
  effectsBorn: boolean;
  genres: MusicGenre[];
}

export const MUSIC_GENRE_LIMIT = 4;

export const MUSIC_GENRE_FAMILIES: MusicGenreFamily[] = [
  {
    id: "ambient",
    name: "Ambient & Atmospheres",
    voice: "spacious drones, slow breaths and air that carries light",
    effectsBorn: true,
    genres: [
      { id: "ambient", name: "Ambient" },
      { id: "dark-ambient", name: "Dark Ambient" },
      { id: "space-music", name: "Space Music" },
      { id: "drone", name: "Drone" },
      { id: "field-recording", name: "Field Recording" },
      { id: "ambient-house", name: "Ambient House" },
      { id: "organic-ambient", name: "Organic Ambient" },
      { id: "healing-ambient", name: "Healing Ambient" },
      { id: "isolationism", name: "Isolationism" },
      { id: "soundscape", name: "Soundscape" },
    ],
  },
  {
    id: "electronic",
    name: "Electronic & Dance",
    voice: "driven rhythms, synthesizers awake and floors that move",
    effectsBorn: true,
    genres: [
      { id: "house", name: "House" },
      { id: "techno", name: "Techno" },
      { id: "trance", name: "Trance" },
      { id: "progressive-house", name: "Progressive House" },
      { id: "drum-and-bass", name: "Drum & Bass" },
      { id: "dubstep", name: "Dubstep" },
      { id: "electro", name: "Electro" },
      { id: "synthwave", name: "Synthwave" },
      { id: "vaporwave", name: "Vaporwave" },
      { id: "idm", name: "IDM" },
    ],
  },
  {
    id: "cinematic",
    name: "Cinematic & Score",
    voice: "wide stages, swelling arcs and pictures made of sound",
    effectsBorn: false,
    genres: [
      { id: "cinematic", name: "Cinematic" },
      { id: "orchestral", name: "Orchestral" },
      { id: "epic-orchestral", name: "Epic Orchestral" },
      { id: "neoclassical", name: "Neoclassical" },
      { id: "trailer-music", name: "Trailer Music" },
      { id: "minimal-score", name: "Minimal Score" },
      { id: "choral-score", name: "Choral Score" },
      { id: "dark-score", name: "Dark Score" },
      { id: "fantasy-score", name: "Fantasy Score" },
      { id: "sci-fi-score", name: "Sci-Fi Score" },
    ],
  },
  {
    id: "classical",
    name: "Classical & Chamber",
    voice: "written lines, acoustic halls and instruments that breathe",
    effectsBorn: false,
    genres: [
      { id: "classical", name: "Classical" },
      { id: "baroque", name: "Baroque" },
      { id: "romantic-era", name: "Romantic" },
      { id: "piano-solo", name: "Solo Piano" },
      { id: "string-quartet", name: "String Quartet" },
      { id: "harp", name: "Harp" },
      { id: "guitar-classical", name: "Classical Guitar" },
      { id: "chamber-ensemble", name: "Chamber Ensemble" },
      { id: "opera-aria", name: "Opera Aria" },
      { id: "sacred-choral", name: "Sacred Choral" },
    ],
  },
  {
    id: "rock",
    name: "Rock & Metal",
    voice: "strings under pressure, drums that answer and rooms that roar",
    effectsBorn: true,
    genres: [
      { id: "indie-rock", name: "Indie Rock" },
      { id: "alternative", name: "Alternative" },
      { id: "post-rock", name: "Post-Rock" },
      { id: "progressive-rock", name: "Progressive Rock" },
      { id: "classic-rock", name: "Classic Rock" },
      { id: "punk", name: "Punk" },
      { id: "metal", name: "Metal" },
      { id: "doom", name: "Doom" },
      { id: "stoner", name: "Stoner" },
      { id: "math-rock", name: "Math Rock" },
    ],
  },
  {
    id: "world",
    name: "Folk & World",
    voice: "old instruments, open landscapes and hands passed through generations",
    effectsBorn: false,
    genres: [
      { id: "folk", name: "Folk" },
      { id: "celtic", name: "Celtic" },
      { id: "nordic", name: "Nordic" },
      { id: "mediterranean", name: "Mediterranean" },
      { id: "balkan", name: "Balkan" },
      { id: "indian-classical", name: "Indian Classical" },
      { id: "middle-eastern", name: "Middle Eastern" },
      { id: "west-african", name: "West African" },
      { id: "latin", name: "Latin" },
      { id: "japanese-traditional", name: "Japanese Traditional" },
    ],
  },
  {
    id: "jazz",
    name: "Jazz & Blues",
    voice: "moving chords, riding swing and voices that wander and return",
    effectsBorn: false,
    genres: [
      { id: "jazz", name: "Jazz" },
      { id: "smooth-jazz", name: "Smooth Jazz" },
      { id: "jazz-fusion", name: "Jazz Fusion" },
      { id: "big-band", name: "Big Band" },
      { id: "bebop", name: "Bebop" },
      { id: "soul-jazz", name: "Soul Jazz" },
      { id: "blues", name: "Blues" },
      { id: "delta-blues", name: "Delta Blues" },
      { id: "gospel", name: "Gospel" },
      { id: "swing", name: "Swing" },
    ],
  },
  {
    id: "urban",
    name: "Hip-Hop & Urban",
    voice: "weighted drums, spoken truth and low ends you feel before you hear",
    effectsBorn: true,
    genres: [
      { id: "boom-bap", name: "Boom Bap" },
      { id: "trap", name: "Trap" },
      { id: "lo-fi-hiphop", name: "Lo-fi Hip-Hop" },
      { id: "conscious-rap", name: "Conscious Rap" },
      { id: "g-funk", name: "G-Funk" },
      { id: "rnb", name: "R&B" },
      { id: "neo-soul", name: "Neo-Soul" },
      { id: "funk", name: "Funk" },
      { id: "reggae", name: "Reggae" },
      { id: "dancehall", name: "Dancehall" },
    ],
  },
  {
    id: "pop",
    name: "Pop & Song",
    voice: "songs with doors in them — melodies that open and refrains that stay",
    effectsBorn: true,
    genres: [
      { id: "pop", name: "Pop" },
      { id: "dream-pop", name: "Dream Pop" },
      { id: "synth-pop", name: "Synth-Pop" },
      { id: "indie-pop", name: "Indie Pop" },
      { id: "art-pop", name: "Art Pop" },
      { id: "singer-songwriter", name: "Singer-Songwriter" },
      { id: "chamber-pop", name: "Chamber Pop" },
      { id: "shoegaze", name: "Shoegaze" },
      { id: "folk-pop", name: "Folk Pop" },
      { id: "ballad", name: "Ballad" },
    ],
  },
  {
    id: "healing",
    name: "Healing & Meditation",
    voice: "held tones, long decays and rooms the nervous system trusts",
    effectsBorn: false,
    genres: [
      { id: "meditation", name: "Meditation" },
      { id: "singing-bowls", name: "Singing Bowls" },
      { id: "mantra", name: "Mantra" },
      { id: "chakra", name: "Chakra" },
      { id: "theta-waves", name: "Theta Waves" },
      { id: "nature-sounds", name: "Nature Sounds" },
      { id: "reiki", name: "Reiki" },
      { id: "yoga-flow", name: "Yoga Flow" },
      { id: "sleep-music", name: "Sleep Music" },
      { id: "solfeggio", name: "Solfeggio" },
    ],
  },
];

const GENRE_INDEX = new Map<string, { genre: MusicGenre; family: MusicGenreFamily }>();
for (const family of MUSIC_GENRE_FAMILIES) {
  for (const genre of family.genres) GENRE_INDEX.set(genre.id, { genre, family });
}

export function genreById(id: string): MusicGenre | undefined {
  return GENRE_INDEX.get(id)?.genre;
}

export function genreFamilyOf(id: string): MusicGenreFamily | undefined {
  return GENRE_INDEX.get(id)?.family;
}

export function genreName(id: string): string {
  return GENRE_INDEX.get(id)?.genre.name ?? id;
}

/** the visitor's fusion, spoken as one honest contract the engine reads */
export function genreContract(ids: string[]): string {
  const known = ids.map((id) => GENRE_INDEX.get(id)).filter(Boolean) as
    { genre: MusicGenre; family: MusicGenreFamily }[];
  if (known.length === 0) return "";
  const voices = known.map((k) => `${k.genre.name.toLowerCase()} (${k.family.voice})`);
  const born = known.some((k) => k.family.effectsBorn);
  return `a fusion of ${voices.join(", ")} — one continuous palette, ${
    born
      ? "studio effects worn openly where they belong"
      : "effects kept honest and hidden in service of the instruments"
  }`;
}

/** whether the sound's own family wears heavy studio effects — the
    analyzer reads loudness and compression with that in mind */
export function effectsTolerant(ids: string[]): boolean {
  return ids.some((id) => GENRE_INDEX.get(id)?.family.effectsBorn === true);
}
