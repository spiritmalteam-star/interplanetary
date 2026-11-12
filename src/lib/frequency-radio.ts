/* ------------------------------------------------------------------ */
/*  THE FREQUENCY RADIO — the gathering's own sound.                   */
/*                                                                     */
/*  Every track in the radio is a definition kept in the database      */
/*  (title, intent, base frequency, seed, duration) — the AUDIO ITSELF */
/*  is woven locally, on the visitor's own machine, by this engine:    */
/*  a deterministic OfflineAudioContext render keyed to the seed, so   */
/*  the same track always sounds the same and no files ever travel.    */
/*                                                                     */
/*  The intents mirror the entity's healing frequencies: release       */
/*  (396 Hz), grounding (432 Hz), defragment (528 Hz), heart (639 Hz), */
/*  theta (4 Hz beat over 210 Hz), crown (741 Hz), aura (852 Hz),      */
/*  pineal (963 Hz).                                                   */
/* ------------------------------------------------------------------ */

export interface RadioTrackDef {
  id: string;
  title: string;
  intent: string;
  freq: number;
  seed: number;
  duration: number;
  authorName: string;
}

/* --------------------------- the generator ------------------------- */

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The beat frequency each intent breathes on (Hz between the ears). */
const INTENT_BEAT: Record<string, number> = {
  release: 4.0,
  grounding: 7.83,
  defragment: 6.0,
  heart: 5.0,
  theta: 4.5,
  crown: 9.0,
  aura: 8.0,
  pineal: 10.0,
};

const PENTATONIC = [0, 3, 5, 7, 10]; // the minor pentatonic's five steps

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const data = new DataView(new ArrayBuffer(44 + len * numCh * 2));
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) data.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  data.setUint32(4, 36 + len * numCh * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, numCh, true);
  data.setUint32(24, buffer.sampleRate, true);
  data.setUint32(28, buffer.sampleRate * numCh * 2, true);
  data.setUint16(32, numCh * 2, true);
  data.setUint16(34, 16, true);
  writeStr(36, "data");
  data.setUint32(40, len * numCh * 2, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      data.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([data.buffer], { type: "audio/wav" });
}

/** One deterministic render — the track definition becomes sound. */
export async function renderRadioTrack(
  track: RadioTrackDef,
  onProgress?: (p: number) => void
): Promise<string> {
  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error("offline audio unavailable");

  const sr = 22050;
  const duration = Math.max(20, Math.min(180, track.duration || 66));
  const rnd = mulberry32((track.seed || 1) >>> 0 || 1);
  const ctx = new OfflineCtx(2, Math.ceil(sr * duration), sr);

  const beat = INTENT_BEAT[track.intent] ?? 6;
  const base = track.freq || 432;
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  /* THE DEEP DRONE — the base tone and its fifth and octave, each with
     its own slow breathing (a sine LFO on the gain). */
  const droneSpecs: [number, number, number][] = [
    [base / 2, 0.16, 11],
    [base, 0.1, 17],
    [base * 1.5, 0.05, 23],
    [base * 2, 0.045, 29],
  ];
  droneSpecs.forEach(([f, g, lfoHz], i) => {
    const osc = ctx.createOscillator();
    osc.type = i === 0 ? "sine" : "sine";
    osc.frequency.value = f * (1 + (rnd() - 0.5) * 0.0016);
    const gain = ctx.createGain();
    gain.gain.value = g;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = lfoHz / 10 + rnd() * 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = g * 0.55;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(master);
    osc.start(0);
    lfo.start(0);
  });

  /* THE BEATING PAIR — two close tones whose difference is the intent's
     own beat: the binaural heart of the frequency work. Panned wide. */
  const pannerL = ctx.createStereoPanner();
  pannerL.pan.value = -0.85;
  const pannerR = ctx.createStereoPanner();
  pannerR.pan.value = 0.85;
  [base / 2 + beat / 2, base / 2 - beat / 2].forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.value = 0.055;
    osc.connect(gain).connect(i === 0 ? pannerL : pannerR);
    osc.start(0);
  });
  pannerL.connect(master);
  pannerR.connect(master);

  /* THE BREATH — filtered noise that rises and falls like slow tide. */
  const noiseLen = Math.ceil(sr * 2);
  const noiseBuf = ctx.createBuffer(1, noiseLen, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) nd[i] = rnd() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 300 + rnd() * 260;
  bp.Q.value = 1.6;
  const nGain = ctx.createGain();
  nGain.gain.value = 0.02;
  const breathLfo = ctx.createOscillator();
  breathLfo.frequency.value = 0.07 + rnd() * 0.05;
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = 0.014;
  breathLfo.connect(breathDepth).connect(nGain.gain);
  noise.connect(bp).connect(nGain).connect(master);
  noise.start(0);
  breathLfo.start(0);

  /* THE BELLS — sparse seeded chimes at pentatonic steps above the
     base, each with a long exponential decay; the track's stars. */
  const bellCount = 8 + Math.floor(rnd() * 7);
  for (let i = 0; i < bellCount; i++) {
    const t0 = 1.2 + rnd() * (duration - 4);
    const step = PENTATONIC[Math.floor(rnd() * PENTATONIC.length)];
    const octave = rnd() < 0.4 ? 2 : 1;
    const f = base * Math.pow(2, step / 12) * octave;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = ctx.createGain();
    const amp = 0.05 + rnd() * 0.06;
    const decay = 3.5 + rnd() * 5;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0004, t0 + decay);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(Math.min(duration, t0 + decay + 0.1));
  }

  /* THE EDGES — a gentle rise, a gentle rest. */
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.9, 2.4);
  master.gain.setValueAtTime(0.9, Math.max(2.6, duration - 3.5));
  master.gain.linearRampToValueAtTime(0.0001, duration);

  onProgress?.(0.15);
  const rendered = await ctx.startRendering();
  onProgress?.(0.8);
  const blob = encodeWav(rendered);
  onProgress?.(1);
  return URL.createObjectURL(blob);
}

/* ------------------------- the render cache ------------------------ */

const rendered = new Map<string, string>();

/** A track's sound, woven once and kept for the whole visit. */
export async function trackUrl(
  track: RadioTrackDef,
  onProgress?: (p: number) => void
): Promise<string> {
  const hit = rendered.get(track.id);
  if (hit) return hit;
  const url = await renderRadioTrack(track, onProgress);
  rendered.set(track.id, url);
  return url;
}

export function dropTrack(id: string): void {
  const hit = rendered.get(id);
  if (hit) {
    URL.revokeObjectURL(hit);
    rendered.delete(id);
  }
}

/* ------------------- the radio's house definitions ------------------ */

const INTENT_NAMES = [
  "release",
  "grounding",
  "defragment",
  "heart",
  "theta",
  "crown",
  "aura",
  "pineal",
] as const;

const INTENT_FREQ: Record<string, number> = {
  release: 396,
  grounding: 432,
  defragment: 528,
  heart: 639,
  theta: 210,
  crown: 741,
  aura: 852,
  pineal: 963,
};

/* The voice of the naming — the entity names every house work; the
   pairs are stable so the hundred names feel like one hand wrote them. */
const NAME_FIRST = [
  "Still",
  "Amber",
  "Quiet",
  "Vast",
  "Gentle",
  "Inner",
  "Slow",
  "Clear",
  "Deep",
  "Radiant",
  "Silver",
  "Whole",
  "Soft",
  "Open",
  "First",
  "Last",
  "Fine",
  "Warm",
  "Cool",
  "Low",
];
const NAME_SECOND: Record<string, string[]> = {
  release: ["Letting", "Unbinding", "Unwinding", "Release", "Shedding", "Exhale"],
  grounding: ["Root", "Ground", "Anchor", "Soil", "Stone", "Field"],
  defragment: ["Ordering", "Reassembly", "Clearing", "Uncluttering", "Sorting", "Defragment"],
  heart: ["Chamber", "Covenant", "Ember", "Wing", "Covenant", "Gate"],
  theta: ["Threshold", "Threshold", "Drift", "Slumber", "Crossing", "Veil"],
  crown: ["Crown", "Aperture", "Beacon", "Summit", "Chalice", "Antenna"],
  aura: ["Mantle", "Halo", "Veil", "Bloom", "Aureole", "Sheath"],
  pineal: ["Lamp", "Lamp", "Eye", "Seer", "Dawn", "Window"],
};

const DURATIONS = [58, 62, 66, 70, 74, 78, 82, 90];

/**
 * The hundred house works — woven once into the database by the radio
 * route when the shelf stands empty. Deterministic: the same intent
 * always carries the same frequency and the same naming family.
 */
export function houseTrackDefs(count = 100): {
  title: string;
  intent: string;
  freq: number;
  seed: number;
  duration: number;
}[] {
  const out: {
    title: string;
    intent: string;
    freq: number;
    seed: number;
    duration: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    const intent = INTENT_NAMES[i % INTENT_NAMES.length];
    const seed = Math.floor(Math.random() * 2_000_000_000) + 1;
    const first = NAME_FIRST[(i * 7 + 3) % NAME_FIRST.length];
    const seconds = NAME_SECOND[intent];
    const second = seconds[(i * 5 + 2) % seconds.length];
    const numeral = Math.floor(i / INTENT_NAMES.length) + 1;
    const suffix = numeral > 1 ? ` ${["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"][numeral - 2] ?? numeral}` : "";
    out.push({
      title: `${first} ${second}${suffix}`,
      intent,
      freq: INTENT_FREQ[intent],
      seed,
      duration: DURATIONS[(i * 3) % DURATIONS.length],
    });
  }
  return out;
}
