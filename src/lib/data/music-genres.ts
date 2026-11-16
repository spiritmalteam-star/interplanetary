/* ------------------------------------------------------------------ */
/*  MUSICAL STYLE — the professional genre taxonomy of the studio.     */
/*                                                                      */
/*  Music Engine 2.0's first law: the visitor's chosen genre is a       */
/*  CONTRACT, not a suggestion. Nothing here defaults to the            */
/*  spiritual family — it is the last family, chosen only when the      */
/*  visitor asks for it. Genres may fuse (multi-select); the            */
/*  interpreter must render the fusion faithfully.                      */
/* ------------------------------------------------------------------ */

export interface MusicGenre {
  id: string;
  name: string;
  /** Short sonic hint folded into the interpreter's contract. */
  hint: string;
}

export interface MusicGenreFamily {
  id: string;
  name: string;
  /** Suggested visualizer style when this family leads the fusion. */
  visual: string;
  genres: MusicGenre[];
}

export const MUSIC_GENRE_FAMILIES: MusicGenreFamily[] = [
  {
    id: "pop",
    name: "Pop",
    visual: "pearl-gold",
    genres: [
      { id: "pop", name: "Pop", hint: "hook-forward contemporary pop with polished radio production" },
      { id: "dance-pop", name: "Dance Pop", hint: "dance-pop with club-ready groove and bright toplines" },
      { id: "synth-pop", name: "Synth Pop", hint: "synth-pop, analog-era keyboards, catchy and glossy" },
      { id: "indie-pop", name: "Indie Pop", hint: "indie pop, warm intimate production, handmade charm" },
      { id: "electropop", name: "Electropop", hint: "electropop, saturated synths, crisp programmed drums" },
      { id: "dream-pop", name: "Dream Pop", hint: "dream pop, reverb-washed guitars, soft airy vocals" },
      { id: "hyperpop", name: "Hyperpop", hint: "hyperpop, pitch-shifted vocals, maximalist candy production" },
      { id: "k-pop", name: "K-Pop", hint: "K-pop, precision arrangement, dynamic section switches, polished mix" },
      { id: "latin-pop", name: "Latin Pop", hint: "latin pop, warm acoustic rhythm, romantic melodic phrasing" },
    ],
  },
  {
    id: "electronic",
    name: "Electronic",
    visual: "neon-club",
    genres: [
      { id: "house", name: "House", hint: "four-on-the-floor house, warm bassline, soulful swing" },
      { id: "deep-house", name: "Deep House", hint: "deep house, muted chords, rolling sub bass, laid-back groove" },
      { id: "tech-house", name: "Tech House", hint: "tech house, tight percussion loop, bass-driven groove" },
      { id: "progressive-house", name: "Progressive House", hint: "progressive house, long builds, wide stereo atmosphere" },
      { id: "techno", name: "Techno", hint: "techno, hypnotic loop, machine precision, warehouse energy" },
      { id: "minimal-techno", name: "Minimal Techno", hint: "minimal techno, micro-grooves, sparse and precise" },
      { id: "hard-techno", name: "Hard Techno", hint: "hard techno, relentless drive, rumbling kick, raw power" },
      { id: "industrial-techno", name: "Industrial Techno", hint: "industrial techno, distorted kicks, metallic percussion, mechanical aggression" },
      { id: "trance", name: "Trance", hint: "trance, euphoric supersaw leads, long breakdown, hands-up drop" },
      { id: "psytrance", name: "Psytrance", hint: "psytrance, rolling bassline, fractal arpeggios, accelerating energy" },
      { id: "goa-trance", name: "Goa Trance", hint: "goa trance, acidic 303 lines, organic-machined textures" },
      { id: "drum-and-bass", name: "Drum & Bass", hint: "drum & bass, 174 BPM breaks, sub-heavy reese bass" },
      { id: "jungle", name: "Jungle", hint: "jungle, chopped amen breaks, ragga bass heritage" },
      { id: "dubstep", name: "Dubstep", hint: "dubstep, half-time growl bass, snare-forward drops" },
      { id: "hardcore", name: "Hardcore", hint: "hardcore, thundering kick at high BPM, euphoric hoover leads" },
      { id: "gabber", name: "Gabber", hint: "gabber, distorted 200 BPM kicks, raw and unhinged" },
      { id: "breakbeat", name: "Breakbeat", hint: "breakbeat, funky broken drums, bass-led bounce" },
      { id: "uk-garage", name: "UK Garage", hint: "UK garage, shuffled 2-step drums, chopped vocal hooks" },
      { id: "ambient", name: "Ambient", hint: "ambient, expansive drones, slow bloom of texture" },
      { id: "idm", name: "IDM", hint: "IDM, intricate programmed rhythm, cerebral sound design" },
    ],
  },
  {
    id: "latin",
    name: "Latin",
    visual: "pearl-gold",
    genres: [
      { id: "reggaeton", name: "Reggaeton", hint: "reggaeton, signature dembow groove, syncopated Spanish-language rhythm" },
      { id: "dembow", name: "Dembow", hint: "dembow, raw street groove, deep sub kick pattern" },
      { id: "latin-trap", name: "Latin Trap", hint: "latin trap, rolling hi-hats, dark 808s, Spanish flow" },
      { id: "salsa", name: "Salsa", hint: "salsa, clave-driven brass, montuno piano, dance-floor heat" },
      { id: "bachata", name: "Bachata", hint: "bachata, requinto guitar leads, romantic bongo pulse" },
      { id: "merengue", name: "Merengue", hint: "merengue, brisk tambora drive, bright brass stabs" },
      { id: "cumbia", name: "Cumbia", hint: "cumbia, hypnotic guacharaca texture, rolling accordion" },
      { id: "latin-house", name: "Latin House", hint: "latin house, club percussion fused with tropical horns" },
    ],
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    visual: "cinematic-particles",
    genres: [
      { id: "rap", name: "Rap", hint: "rap, hard-hitting drums, confident lyrical flow" },
      { id: "trap", name: "Trap", hint: "trap, booming 808 glides, triplet hi-hats, dark atmosphere" },
      { id: "drill", name: "Drill", hint: "drill, sliding 808s, icy melodic loops, urgent delivery" },
      { id: "boom-bap", name: "Boom Bap", hint: "boom bap, dusty sampled drums, jazz-tinged chops" },
      { id: "lofi-hiphop", name: "Lo-Fi Hip-Hop", hint: "lo-fi hip-hop, tape warmth, mellow jazzy keys, head-nod groove" },
      { id: "alt-hiphop", name: "Alternative Hip-Hop", hint: "alternative hip-hop, genre-bending production, experimental arrangements" },
      { id: "cloud-rap", name: "Cloud Rap", hint: "cloud rap, hazy pads, floating melodic delivery" },
    ],
  },
  {
    id: "rock",
    name: "Rock & Metal",
    visual: "neon-club",
    genres: [
      { id: "classic-rock", name: "Classic Rock", hint: "classic rock, vintage guitar crunch, organic 70s drum sound" },
      { id: "alt-rock", name: "Alternative Rock", hint: "alternative rock, dynamic quiet-loud architecture, textured guitars" },
      { id: "indie-rock", name: "Indie Rock", hint: "indie rock, jangly guitars, driving live-band energy" },
      { id: "punk", name: "Punk", hint: "punk, fast raw chords, defiant shouted energy" },
      { id: "metal", name: "Metal", hint: "metal, downpicked guitars, double-kick drive, commanding vocals" },
      { id: "heavy-metal", name: "Heavy Metal", hint: "heavy metal, galloping riffs, soaring lead guitar, monumental drums" },
      { id: "metalcore", name: "Metalcore", hint: "metalcore, breakdowns, screamed-to-sung dynamics, precise brutality" },
      { id: "prog-metal", name: "Progressive Metal", hint: "progressive metal, odd meters, virtuosic interplay, epic scope" },
    ],
  },
  {
    id: "rnb",
    name: "R&B & Soul",
    visual: "liquid-glass",
    genres: [
      { id: "rnb", name: "R&B", hint: "R&B, silky production, supple vocal runs, deep groove" },
      { id: "neo-soul", name: "Neo-Soul", hint: "neo-soul, lush jazz chords, organic live feel, warm bass" },
      { id: "funk", name: "Funk", hint: "funk, popping bass, tight horn stabs, irrepressible groove" },
      { id: "disco", name: "Disco", hint: "disco, four-on-the-floor sheen, string sweeps, octave bass" },
      { id: "gospel", name: "Gospel", hint: "gospel, stirring Hammond organ, powerful choir harmonies" },
      { id: "contemporary-soul", name: "Contemporary Soul", hint: "contemporary soul, intimate vocals, retro-modern blend" },
    ],
  },
  {
    id: "world",
    name: "World & Traditional",
    visual: "organic-resonance",
    genres: [
      { id: "afrobeats", name: "Afrobeats", hint: "afrobeats, syncopated log-drum groove, buoyant melody" },
      { id: "amapiano", name: "Amapiano", hint: "amapiano, log drum bass, airy pads, unhurried house sway" },
      { id: "reggae", name: "Reggae", hint: "reggae, offbeat skank, deep dubwise bass, easy skanking" },
      { id: "dancehall", name: "Dancehall", hint: "dancehall, digital riddim, punchy toasting energy" },
      { id: "balkan-folk", name: "Balkan Folk", hint: "Balkan folk, asymmetric meters, brass band fire, clarinet wail" },
      { id: "albanian-folk", name: "Albanian Folk", hint: "Albanian folk, iso-polyphonic drone voices, çifteli strings, mountain soul" },
      { id: "flamenco", name: "Flamenco", hint: "flamenco, fierce palmas, phrygian guitar falsetas, cante jondo" },
      { id: "arabic-fusion", name: "Arabic Fusion", hint: "arabic fusion, oud taqsim, maqam color over modern beats" },
      { id: "indian-classical", name: "Indian Classical", hint: "indian classical, raga development, tanpura drone, tabla interplay" },
      { id: "traditional-fusion", name: "Traditional Fusion", hint: "traditional fusion, ancestral instruments woven with modern production" },
    ],
  },
  {
    id: "classical",
    name: "Classical & Cinematic",
    visual: "cinematic-particles",
    genres: [
      { id: "orchestral", name: "Orchestral", hint: "orchestral, full symphonic palette, sweeping dynamic arches" },
      { id: "piano-solo", name: "Piano Solo", hint: "solo piano, intimate room tone, unhurried harmonic space" },
      { id: "chamber", name: "Chamber Music", hint: "chamber music, conversational strings and keys, close acoustic detail" },
      { id: "opera", name: "Opera", hint: "opera, theatrical staged drama, full-voiced arias over orchestra" },
      { id: "film-score", name: "Film Score", hint: "film score, narrative cue architecture, thematic development" },
      { id: "epic-trailer", name: "Epic Trailer", hint: "epic trailer, braams and risers, monumental percussion hits" },
      { id: "neoclassical", name: "Neoclassical", hint: "neoclassical, minimalist piano figures over subtle electronics" },
    ],
  },
  {
    id: "experimental",
    name: "Experimental",
    visual: "organic-resonance",
    genres: [
      { id: "glitch", name: "Glitch", hint: "glitch, rhythmic buffer stutters, bit-crushed micro-edit percussion" },
      { id: "noise-music", name: "Noise Music", hint: "noise music, dense harmonic static, sculpted dynamic walls" },
      { id: "avant-garde", name: "Avant-Garde", hint: "avant-garde, rule-breaking form, prepared instruments, radical space" },
      { id: "experimental-electronic", name: "Experimental Electronic", hint: "experimental electronic, modular exploration, unrepeatable patches" },
      { id: "generative-ambient", name: "Generative Ambient", hint: "generative ambient, self-organizing loops, endless slow variation" },
      { id: "sound-design", name: "Sound Design", hint: "sound design, morphing textures, spectral processing as composition" },
    ],
  },
  {
    id: "consciousness",
    name: "Consciousness & Spiritual",
    visual: "cosmic-purple",
    genres: [
      { id: "meditation", name: "Meditation", hint: "meditation music, slow breathing pace, sustained calming tones" },
      { id: "healing-ambient", name: "Healing Ambient", hint: "healing ambient, soft harmonic beds, restorative gentle motion" },
      { id: "sacred-chant", name: "Sacred Chant", hint: "sacred chant, reverent layered voices, ceremonial space" },
      { id: "cosmic-ambient", name: "Cosmic Ambient", hint: "cosmic ambient, vast starfield drones, slow orbital motion" },
      { id: "ethereal", name: "Ethereal", hint: "ethereal, weightless soprano textures, cathedral reverb" },
      { id: "ritual", name: "Ritual", hint: "ritual music, heartbeat frame drums, ceremonial incantation" },
      { id: "light-codes", name: "Light Codes", hint: "frequency transmissions, crystalline tones, luminous harmonic codes" },
    ],
  },
];

export const MUSIC_GENRE_LIMIT = 4; // fusion cap — keeps the contract legible

const GENRE_INDEX: Map<string, { genre: MusicGenre; family: MusicGenreFamily }> = (() => {
  const map = new Map<string, { genre: MusicGenre; family: MusicGenreFamily }>();
  for (const family of MUSIC_GENRE_FAMILIES) {
    for (const genre of family.genres) {
      map.set(genre.id, { genre, family });
    }
  }
  return map;
})();

export function genreById(id: string): { genre: MusicGenre; family: MusicGenreFamily } | null {
  return GENRE_INDEX.get(id) ?? null;
}

export function genreName(id: string): string {
  return GENRE_INDEX.get(id)?.genre.name ?? id;
}

/** The sonic contract of a fusion — spoken to the interpreter verbatim. */
export function genreContract(ids: string[]): string {
  const parts = ids
    .map((id) => GENRE_INDEX.get(id))
    .filter((v): v is { genre: MusicGenre; family: MusicGenreFamily } => !!v)
    .map((v) => v.genre.hint);
  if (parts.length === 0) return "";
  return parts.join(" fused with ");
}

/** Which visualizer style the leading genre suggests — a suggestion only. */
export function suggestedVisual(ids: string[]): string | null {
  for (const id of ids) {
    const hit = GENRE_INDEX.get(id);
    if (hit) return hit.family.visual;
  }
  return null;
}

/** Genres whose intentional distortion/effects must never be flagged as defects. */
const EFFECT_TOLERANT = new Set([
  "glitch",
  "noise-music",
  "avant-garde",
  "experimental-electronic",
  "industrial-techno",
  "gabber",
  "hardcore",
  "sound-design",
  "dubstep",
  "metalcore",
  "metal",
  "heavy-metal",
]);

export function effectsTolerant(ids: string[]): boolean {
  return ids.some((id) => EFFECT_TOLERANT.has(id));
}
