/* ------------------------------------------------------------------ */
/*  MUSIC ENGINE 2.0 — THE GENRE TAXONOMY.                             */
/*                                                                     */
/*  Ten families, one hundred voices. The genre the visitor chooses    */
/*  is a BINDING AGREEMENT: the chamber renders it exactly, never      */
/*  replacing, diluting or softening it — and spiritual, healing or    */
/*  cosmic color is introduced ONLY when a family below is chosen.     */
/*                                                                     */
/*  Every genre carries its own sonic language (the contract spoken    */
/*  to the engine), a suggested visualizer style, and an honest flag   */
/*  for whether rhythmic distortion and buffer effects are part of     */
/*  the genre's own voice (the ear must never call art a defect).      */
/* ------------------------------------------------------------------ */

export interface MusicGenre {
  id: string;
  name: string;
  /** the genre's own sonic language, spoken verbatim to the engine */
  contract: string;
  /** rhythmic distortion, bitcrush, glitch and drive are the genre's voice */
  effects?: boolean;
  /** one of the house's visualizer styles (string — not imported, no cycle) */
  visual?: string;
}

export interface MusicGenreFamily {
  id: string;
  name: string;
  genres: MusicGenre[];
}

export const MUSIC_GENRE_LIMIT = 4;

export const MUSIC_GENRE_FAMILIES: MusicGenreFamily[] = [
  {
    id: "pop",
    name: "Pop",
    genres: [
      { id: "pop", name: "Pop", contract: "bright modern pop: tight radio mix, memorable melodic hooks, polished drums, wide chorus stacks" },
      { id: "dance-pop", name: "Dance Pop", contract: "dance-pop: four-on-the-floor kick, punchy sidechained synths, glossy toplines, club-ready 120-126 BPM energy" },
      { id: "synth-pop", name: "Synth Pop", contract: "synth-pop: analog lead pads, arpeggiated retro synths, gated reverb drums, 1980s melodic romance" },
      { id: "indie-pop", name: "Indie Pop", contract: "indie pop: warm guitars, intimate close-mic vocals, organic light percussion, honest hand-played feel" },
      { id: "electropop", name: "Electropop", contract: "electropop: crisp digital synths, vocoder shimmer, tight punchy low end, sleek modern production" },
      { id: "dream-pop", name: "Dream Pop", contract: "dream pop: hazy reverb-washed guitars, soft breathy vocals, slow luminous textures, gentle drive" },
      { id: "hyperpop", name: "Hyperpop", contract: "hyperpop: pitched-up vocals, exaggerated bright synths, hyper-compressed drums, maximalist playful chaos", effects: true, visual: "neon-club" },
      { id: "k-pop", name: "K-Pop", contract: "K-pop: hybrid genre-blending production, sharp rhythmic switches, layered group vocals, pristine widescreen mix" },
      { id: "latin-pop", name: "Latin Pop", contract: "latin pop: warm acoustic guitars over modern pop drums, romantic melodic phrasing, gentle latin percussion" },
    ],
  },
  {
    id: "electronic",
    name: "Electronic",
    genres: [
      { id: "house", name: "House", contract: "house music: warm four-on-the-floor groove, swung hi-hats, rounded bassline, soulful chord stabs, 122-126 BPM" },
      { id: "deep-house", name: "Deep House", contract: "deep house: muted deep bass, jazzy dusty chords, smooth rolling groove, late-night warm atmosphere" },
      { id: "tech-house", name: "Tech House", contract: "tech house: tight punchy drum machine groove, rolling sub bass, minimal percussive hooks, 124-127 BPM" },
      { id: "progressive-house", name: "Progressive House", contract: "progressive house: long evolving builds, layered arpeggios, wide atmospheric pads, patient hypnotic arrangement" },
      { id: "techno", name: "Techno", contract: "techno: relentless driving kick, hypnotic repeating sequences, industrial percussive texture, cavernous space, 130-140 BPM" },
      { id: "minimal", name: "Minimal", contract: "minimal techno: sparse precise elements, micro-rhythmic clicks, deep sub pulses, vast negative space" },
      { id: "hard-techno", name: "Hard Techno", contract: "hard techno: distorted slamming kick, aggressive acid lines, relentless warehouse energy, punishing drive, 145-155 BPM", effects: true, visual: "neon-club" },
      { id: "industrial-techno", name: "Industrial Techno", contract: "industrial techno: brutal distorted kick drums, metallic machine percussion, harsh noise textures, dark mechanical atmosphere, uncompromising power", effects: true, visual: "neon-club" },
      { id: "trance", name: "Trance", contract: "trance: soaring supersaw leads, emotional breakdown, driving pumping bass, euphoric 136-140 BPM lift" },
      { id: "psytrance", name: "Psytrance", contract: "psytrance: rolling triplet bassline, psychedelic acid squelches, hypnotic tribal percussion, fast cosmic energy" },
      { id: "goa-trance", name: "Goa Trance", contract: "goa trance: cascading resonant lead lines, eastern modal scales, frenetic arpeggios, retro-psychedelic burner energy" },
      { id: "dnb", name: "Drum & Bass", contract: "drum & bass: breakneck breakbeat drums, deep weighty reese bass, half-time drops, 172-176 BPM urgency" },
      { id: "jungle", name: "Jungle", contract: "jungle: chopped amen breaks, sub-heavy bass, ragga vocal chops, raw 90s rave energy", effects: true },
      { id: "dubstep", name: "Dubstep", contract: "dubstep: half-time 140 BPM frame, serrated growling bass wobbles, massive filtered drops, deep space between hits", effects: true, visual: "neon-club" },
      { id: "hardcore", name: "Hardcore", contract: "hardcore: thundering distorted kick, euphoric aggressive leads, relentless rave urgency, 160-180 BPM", effects: true, visual: "neon-club" },
      { id: "gabber", name: "Gabber", contract: "gabber: overdriven hollow kick drums, screaming distorted leads, raw Dutch hardcore ferocity, 180-200 BPM", effects: true, visual: "neon-club" },
      { id: "breakbeat", name: "Breakbeat", contract: "breakbeat: fat funky broken drums, bouncy bassline, big-party groove with rave attitude" },
      { id: "uk-garage", name: "UK Garage", contract: "UK garage: shuffled 2-step drums, warm sub bass, pitched vocal snippets, smooth late-night swing" },
      { id: "ambient", name: "Ambient", contract: "ambient: slow breathing pads, vast spacious reverb, no percussive pressure, still luminous atmosphere" },
      { id: "idm", name: "IDM", contract: "intelligent dance music: intricate glitched programming, layered digital textures, emotional synths over braindance complexity", effects: true, visual: "liquid-glass" },
    ],
  },
  {
    id: "latin",
    name: "Latin",
    genres: [
      { id: "reggaeton", name: "Reggaeton", contract: "reggaeton: classic dembow rhythm (boom-ch-boom-chick), deep punchy sub bass, smooth spanish-language melodic flow, romantic street energy, 88-96 BPM" },
      { id: "dembow", name: "Dembow", contract: "dembow: raw Dominican dembow pattern, sparse hypnotic drums, heavy low end, street-level swagger" },
      { id: "latin-trap", name: "Latin Trap", contract: "latin trap: rolling 808 glides, dark trap hats, spanish melodic autotuned flow, moody neon atmosphere" },
      { id: "salsa", name: "Salsa", contract: "salsa: live clave groove, bright brass section, montuno piano tumbao, congas and timbales, joyful danceable heat" },
      { id: "bachata", name: "Bachata", contract: "bachata: requinto guitar lead, bongos and güira pulse, romantic 4/4 sway, intimate heartfelt vocals" },
      { id: "merengue", name: "Merengue", contract: "merengue: fast driving tambora and güira, bright brass stabs, joyful quick-step dance energy" },
      { id: "cumbia", name: "Cumbia", contract: "cumbia: hypnotic guacharaca scrape, deep bouncing bassline, layered folk percussion, warm dance-floor nostalgia" },
      { id: "latin-house", name: "Latin House", contract: "latin house: four-on-the-floor club groove fused with latin percussion, salsa and cumbia hooks over deep house bass" },
    ],
  },
  {
    id: "hip-hop",
    name: "Hip-Hop",
    genres: [
      { id: "rap", name: "Rap", contract: "rap: punchy drum loop, commanding vocal presence, sample-led beat with clean headroom for the voice" },
      { id: "trap", name: "Trap", contract: "trap: booming 808 bass, rapid triplet hi-hats, dark cinematic pads, modern southern weight" },
      { id: "drill", name: "Drill", contract: "drill: sliding 808s, icy cold melody loops, skittering hats, tense street-level atmosphere" },
      { id: "boom-bap", name: "Boom Bap", contract: "boom bap: dusty sampled drums, chopped soul loops, vinyl warmth, raw 90s east-coast head-nod" },
      { id: "lofi-hiphop", name: "Lo-Fi Hip-Hop", contract: "lo-fi hip-hop: tape-saturated drums, warm filtered keys, lazy swung groove, cozy nostalgic hiss", visual: "organic-resonance" },
      { id: "alt-hiphop", name: "Alternative Hip-Hop", contract: "alternative hip-hop: unconventional beat architecture, genre-fusing instrumentation, experimental but grounded rhythm" },
      { id: "cloud-rap", name: "Cloud Rap", contract: "cloud rap: ethereal ambient pads, dreamy distant vocals, hazy 808 lows, floating melancholic space" },
    ],
  },
  {
    id: "rock",
    name: "Rock & Metal",
    genres: [
      { id: "rock", name: "Rock", contract: "rock: driving electric guitars, live drum pocket, big honest chorus, amps pushed into warm break-up" },
      { id: "alt-rock", name: "Alternative Rock", contract: "alternative rock: textured guitar layers, dynamic quiet-loud shifts, angular modern riffing" },
      { id: "indie-rock", name: "Indie Rock", contract: "indie rock: jangly guitars, roomy natural drums, heartfelt loose energy, hand-played imperfection kept" },
      { id: "punk", name: "Punk", contract: "punk: fast raw three-chord urgency, stripped distorted guitars, shout-along energy, no gloss" },
      { id: "metal", name: "Metal", contract: "metal: down-tuned heavy riffing, double-kick drive, aggressive commanding vocals, massive tight wall of guitars", effects: true },
      { id: "metalcore", name: "Metalcore", contract: "metalcore: breakdown-heavy low-tuned riffs, blistering blast sections, harsh/clean vocal contrast, surgical heaviness", effects: true },
      { id: "post-rock", name: "Post-Rock", contract: "post-rock: slow cinematic crescendos, layered tremolo guitars, patient wordless build, wide emotional release" },
    ],
  },
  {
    id: "rnb",
    name: "R&B & Soul",
    genres: [
      { id: "rnb", name: "R&B", contract: "contemporary R&B: silky velvet vocals, lush chord movement, crisp modern drums, intimate late-night warmth" },
      { id: "neo-soul", name: "Neo-Soul", contract: "neo-soul: rich extended chords, organic live-feel groove, warm Rhodes and bass, effortless soulful phrasing" },
      { id: "soul", name: "Soul", contract: "soul: heartfelt powerhouse vocals, vintage rhythm section, gospel-rooted warmth, honest analog room" },
      { id: "funk", name: "Funk", contract: "funk: syncopated slapping bass, tight rhythm guitar chops, brassy stabs, irrepressible groove" },
      { id: "gospel", name: "Gospel", contract: "gospel: uplifting choir stacks, Hammond organ beds, full band praise energy, transcendent climax" },
      { id: "motown", name: "Motown", contract: "motown: tambourine backbeat, walking melodic bass, sparkling vintage production, singalong hook craft" },
    ],
  },
  {
    id: "world",
    name: "World & Traditional",
    genres: [
      { id: "albanian-folk", name: "Albanian Folk", contract: "Albanian folk: çifteli plucked strings, iso-polyphonic layered voices, llahuta bowing, mountain-high heartfelt traditional modes" },
      { id: "balkan-brass", name: "Balkan Brass", contract: "balkan brass: wild trumpet and tuba fanfare, fast odd-meter groove, celebratory village-band fire" },
      { id: "mediterranean", name: "Mediterranean", contract: "mediterranean: bouzouki and oud shimmer, warm sea-breeze strings, sunlit modal melody" },
      { id: "middle-eastern", name: "Middle Eastern", contract: "middle eastern: oud taqsim ornamentation, darbuka pulse, maqam modal depth, ancient-modern fusion" },
      { id: "indian-classical", name: "Indian Classical", contract: "indian classical: sitar and tanpura drone, tabla rhythmic cycles, raga-derived melodic development" },
      { id: "african", name: "African", contract: "african: interlocking polyrhythmic percussion, bright highlife guitar lines, communal joyful vocals" },
      { id: "celtic", name: "Celtic", contract: "celtic: tin whistle and fiddle reels, bodhrán pulse, green-hills modal warmth" },
      { id: "flamenco", name: "Flamenco", contract: "flamenco: fierce rasgueado guitars, palmas and cajón clapping rhythms, deepAndalusian phrygian cry" },
      { id: "east-asian", name: "East Asian", contract: "east asian: guzheng and koto plucks, pentatonic melodic calm, silk-and-ink atmosphere" },
    ],
  },
  {
    id: "classical",
    name: "Classical & Cinematic",
    genres: [
      { id: "classical", name: "Classical", contract: "classical: orchestral strings and woodwinds, formal harmonic development, concert-hall space and dynamics" },
      { id: "orchestral", name: "Orchestral", contract: "orchestral: full symphonic palette, sweeping string sections, french horn swells, grand dynamic arch" },
      { id: "cinematic", name: "Cinematic", contract: "cinematic score: huge reverberant strings, pulsing ostinato under tension, hybrid orchestral-electronic climax" },
      { id: "neoclassical", name: "Neoclassical", contract: "neoclassical: intimate felt piano, restrained string quartet shading, modern-minimal harmonic patience" },
      { id: "solo-piano", name: "Solo Piano", contract: "solo piano: close felt-key intimacy, gentle pedalled resonance, unhurried melodic honesty" },
      { id: "choral", name: "Choral", contract: "choral: layered human voices in sacred harmony, cathedral reverb, breath and vowel as instrument" },
      { id: "opera", name: "Opera", contract: "opera: dramatic operatic voice over orchestral staging, theatrical dynamic extremes, old-world grandeur" },
    ],
  },
  {
    id: "experimental",
    name: "Experimental",
    genres: [
      { id: "glitch", name: "Glitch", contract: "glitch: rhythmically controlled buffer stutters, digital bit-crush, precision clicks and cuts — intentional musical artifacts, never accidental damage", effects: true, visual: "liquid-glass" },
      { id: "noise", name: "Noise", contract: "noise: full-spectrum dense sound masses, sculpted feedback and texture, powerfully intentional abrasion", effects: true },
      { id: "avant-garde", name: "Avant-Garde", contract: "avant-garde: boundary-breaking form and timbre, unexpected structural turns, rigorous artistic experimentation", effects: true },
      { id: "musique-concrete", name: "Musique Concrète", contract: "musique concrète: recorded real-world sound transformed into composition, tape-spliced montage, acoustic object music", effects: true },
      { id: "drone", name: "Drone", contract: "drone: sustained slowly-evolving tonal masses, deep overtone listening, meditative immersion in length" },
      { id: "granular", name: "Granular", contract: "granular synthesis: sound shattered into cloud-grains, shimmering time-stretched recombination, microscopic texture design", effects: true },
      { id: "sound-collage", name: "Sound Collage", contract: "sound collage: layered found-sound montage, juxtaposed fragments woven with intent, dreamlike assembled narrative", effects: true },
    ],
  },
  {
    id: "spiritual",
    name: "Consciousness & Spiritual (optional — chosen, never imposed)",
    genres: [
      { id: "meditation", name: "Meditation", contract: "meditation music: slow breathing drones, soft bell accents, effortless spacious calm engineered for stillness" },
      { id: "healing-ambient", name: "Healing Ambient", contract: "healing ambient: warm ethereal pads, gentle air and light textures, tender restorative embrace" },
      { id: "sacred-chant", name: "Sacred Chant", contract: "sacred chant: devotional layered voices, ancient ceremonial tone, reverent slow harmonic breath" },
      { id: "mantra", name: "Mantra", contract: "mantra music: repeated sacred phrases, hypnotic devotional groove, heart-opening gradual build" },
      { id: "binaural", name: "Binaural Frequencies", contract: "binaural frequencies: precise dual-tone beat differential beneath soft carriers, engineered for focus and deep rest" },
      { id: "shamanic", name: "Shamanic", contract: "shamanic: earth drum heartbeat, plant-medicine flute calls, journey-depth trance texture" },
      { id: "devotional", name: "Devotional", contract: "devotional: tender worshipful arrangement, humble acoustic warmth, upward-turned melodic prayer" },
    ],
  },
];

/* ------------------------- flat registries ------------------------- */

const GENRE_BY_ID = new Map<string, MusicGenre>();
for (const family of MUSIC_GENRE_FAMILIES) {
  for (const genre of family.genres) GENRE_BY_ID.set(genre.id, genre);
}

export function genreById(id: string): MusicGenre | undefined {
  return GENRE_BY_ID.get(id);
}

export function genreName(id: string): string {
  return GENRE_BY_ID.get(id)?.name ?? id;
}

export function genreContract(ids: string[]): string {
  const parts: string[] = [];
  for (const id of ids.slice(0, MUSIC_GENRE_LIMIT)) {
    const g = GENRE_BY_ID.get(id);
    if (g) parts.push(g.contract);
  }
  return parts.join("; ");
}

/** Rhythmic distortion, bitcrush, buffer stutter and drive are the
    chosen genre's own voice — the ear must never call art a defect. */
export function effectsTolerant(ids: string[]): boolean {
  return ids.slice(0, MUSIC_GENRE_LIMIT).some((id) => GENRE_BY_ID.get(id)?.effects === true);
}

/** A genre family whose whole voice IS the spiritual register — used
    only to keep the non-default optional family honest elsewhere. */
const SPIRITUAL_IDS = new Set(
  MUSIC_GENRE_FAMILIES.find((f) => f.id === "spiritual")?.genres.map((g) => g.id) ?? []
);

export function spiritualChosen(ids: string[]): boolean {
  return ids.slice(0, MUSIC_GENRE_LIMIT).some((id) => SPIRITUAL_IDS.has(id));
}

/** The visualizer style a genre breathes with — style stays decoupled
    from genre (the visitor may always pick their own), this is only
    the opening suggestion. Calm/default genres keep the house's
    pearl & gold; nothing forces cosmic on a reggaeton record. */
export function suggestedVisual(ids: string[]): string {
  for (const id of ids.slice(0, MUSIC_GENRE_LIMIT)) {
    const visual = GENRE_BY_ID.get(id)?.visual;
    if (visual) return visual;
  }
  return "pearl-gold";
}
