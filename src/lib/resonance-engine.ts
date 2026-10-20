"use client";

/* ------------------------------------------------------------------ */
/*  THE RESONANCE ENGINE — the Light Codes chamber's own sound loom.   */
/*                                                                     */
/*  When the sound engine's key is not placed, the chamber does not    */
/*  fall silent: the Mirror's written direction (style, shape, mode)   */
/*  is woven RIGHT HERE into an evolving ambient transmission using    */
/*  the Web Audio API — pads, drones, crystalline bells and breaths    */
/*  rendered offline into a real, downloadable piece of sound.         */
/*                                                                     */
/*  Deterministic: the same seed weaves the same transmission, so a    */
/*  kept track can be re-woven exactly. A new seed is a new piece.     */
/*                                                                     */
/*  Everything happens on the visitor's machine; nothing leaves it.    */
/* ------------------------------------------------------------------ */

/* ------------------------- the params ------------------------------ */

export interface ResonanceParams {
  mode: string;
  /** 0..4 dials */
  energy?: number;
  light?: number;
  familiarity?: number;
  structure?: number;
  timeFeel?: string;
  voice?: string;
  /** The Mirror's written sonic direction — keywords steer the loom. */
  style?: string;
  /** The woven seed — one seed, one transmission. */
  seed?: number;
  title?: string;
}

/* --------------------------- the id -------------------------------- */

/** The engineId form that lets a kept track be re-woven exactly. */
export function encodeResonanceId(params: Partial<ResonanceParams>): string {
  const json = JSON.stringify(params);
  const b64 = window.btoa(encodeURIComponent(json));
  return `resonance:${b64}`;
}

/** Decode a resonance engineId back into its weaving params. */
export function decodeResonanceId(
  engineId: string | undefined | null
): ResonanceParams | null {
  if (!engineId || !engineId.startsWith("resonance:")) return null;
  try {
    const json = window.decodeURIComponent(window.atob(engineId.slice(10)));
    return JSON.parse(json) as ResonanceParams;
  } catch {
    return null;
  }
}

/* --------------------------- the rng ------------------------------- */

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ----------------------- the musical data -------------------------- */

/** Scales in semitones — chosen by familiarity (stranger worlds, stranger lattices). */
const SCALES: number[][] = [
  [0, 2, 4, 7, 9, 12, 14, 16, 19, 21], // major pentatonic — earthlike
  [0, 2, 4, 6, 7, 9, 11, 12, 14, 16], // lydian — near
  [0, 2, 3, 5, 7, 9, 10, 12, 14, 15], // dorian — adrift
  [0, 3, 5, 6, 7, 10, 12, 15, 17, 18], // octatonic — strange
  [0, 1, 4, 6, 7, 8, 11, 12, 13, 16], // dream lattice — unknown
];

/** Chord voicings (scale-degree groups) the pads wander through. */
const CHORDS: number[][] = [
  [0, 2, 4],
  [3, 5, 7],
  [1, 4, 6],
  [4, 6, 8],
];

/** Style keywords → loom biases. The Mirror's own words shape the weave. */
function styleBiases(style: string | undefined) {
  const s = (style ?? "").toLowerCase();
  return {
    crystalline: /crystallin|geometric|precise|glass|luminous/.test(s),
    warm: /warm|soft|gentle|kind|ember|aquatic|cavern/.test(s),
    aquatic: /aquatic|underwater|water|ocean|fluid/.test(s),
    cavern: /cavern|stone|subterranean|deep/.test(s),
    choir: /choir|voice|vocal|choral/.test(s),
    sparse: /sparse|silence|generous|still|slow/.test(s),
    pulse: /pulse|heartbeat|rhythmic|percussion/.test(s),
    vast: /vast|immense|drone|distance|infinite/.test(s),
  };
}

const MODE_ROOTS: Record<string, number> = {
  "light-transmission": 55, // G — open, luminous
  "calming-frequencies": 49, // C# low — settled warmth
  "other-stars": 58, // A# — strange distance
  restorative: 51, // D# — kind
  reprogramming: 53, // F — suspended, resolving
  "mirror-transmission": 57, // A — the Mirror's own key
};

/* ------------------------- the wav maker --------------------------- */

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = Math.min(2, buffer.numberOfChannels);
  const len = buffer.length;
  const sr = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      off += 2;
    }
  }
  return out;
}

/* ------------------------- the loom -------------------------------- */

export interface RenderedResonance {
  blobUrl: string;
  duration: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export async function renderResonanceTrack(
  params: ResonanceParams,
  onProgress?: (p: number) => void
): Promise<RenderedResonance> {
  if (typeof window === "undefined") {
    throw new Error("The resonance loom works only in the browser.");
  }
  const Ctx: typeof OfflineAudioContext | undefined =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!Ctx) throw new Error("This browser cannot weave resonance.");

  const rng = mulberry32((params.seed ?? Date.now()) >>> 0);
  const biases = styleBiases(params.style);

  const energy = clamp01((params.energy ?? 2) / 4);
  const light = clamp01((params.light ?? 3) / 4);
  const familiarity = clamp01((params.familiarity ?? 2) / 4);
  const structure = clamp01((params.structure ?? 3) / 4);

  /* the piece's length — longer structures breathe longer */
  const duration = Math.round(55 + structure * 85); // 55s … 140s
  const sampleRate = 44100;
  const ctx = new Ctx(2, Math.ceil(sampleRate * duration), sampleRate);

  /* ---------------- the harmonic ground ---------------------------- */
  const rootMode = MODE_ROOTS[params.mode] ?? 55;
  const drift = Math.floor(rng() * 5) - 2; // the piece's own key drift
  const rootFreq = 440 * Math.pow(2, (rootMode + drift - 69) / 12);
  const scale = SCALES[Math.round(familiarity * (SCALES.length - 1))];

  const degreeToFreq = (degree: number, octave = 0) => {
    const oct = Math.floor(degree / scale.length) + octave;
    const idx = ((degree % scale.length) + scale.length) % scale.length;
    return rootFreq * Math.pow(2, scale[idx] / 12) * Math.pow(2, oct);
  };

  /* ---------------- master bus ------------------------------------- */
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 24;
  comp.ratio.value = 3;
  comp.attack.value = 0.02;
  comp.release.value = 0.4;
  master.connect(comp);
  comp.connect(ctx.destination);

  /* gentle fade in / the long bow out */
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.exponentialRampToValueAtTime(0.9, 3.5);
  master.gain.setValueAtTime(0.9, duration - 5);
  master.gain.linearRampToValueAtTime(0.0001, duration - 0.2);

  const brightness = 300 + light * 2600 + energy * 500; // the low-pass law
  const detuneAmt = 4 + familiarity * 22; // strange worlds drift wider

  /* ---------------- the pad choir — the field's body ---------------- */
  const chordCycle = 11 + rng() * 6; // seconds per chord
  const chordsCount = Math.ceil(duration / chordCycle) + 1;
  for (let ci = 0; ci < chordsCount; ci++) {
    const t0 = ci * chordCycle;
    const t1 = Math.min(duration, t0 + chordCycle + 4);
    const chord = CHORDS[Math.floor(rng() * CHORDS.length)];
    const octaveShift = rng() < 0.3 ? -1 : 0;
    chord.forEach((deg, vi) => {
      const freq = degreeToFreq(deg, octaveShift);
      /* two detuned voices per note — the wide, breathing pad */
      for (const det of [-detuneAmt, detuneAmt]) {
        const osc = ctx.createOscillator();
        osc.type = biases.warm ? "triangle" : "sawtooth";
        osc.frequency.value = freq;
        osc.detune.value = det;

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(brightness * 0.5, t0);
        lp.frequency.linearRampToValueAtTime(
          brightness * (0.7 + 0.3 * Math.sin(ci + vi)),
          t0 + chordCycle
        );
        lp.Q.value = 0.6;

        const g = ctx.createGain();
        const vol =
          (0.05 + 0.045 * (1 - energy)) *
          (vi === 0 ? 1.25 : 0.85) *
          (1 - 0.15 * familiarity);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 3.5);
        g.gain.setValueAtTime(vol, Math.max(t0 + 4, t1 - 4));
        g.gain.exponentialRampToValueAtTime(0.0001, t1);

        const pan = ctx.createStereoPanner();
        pan.pan.value = (rng() - 0.5) * 0.7;

        osc.connect(lp);
        lp.connect(g);
        g.connect(pan);
        pan.connect(master);
        osc.start(t0);
        osc.stop(t1 + 0.1);
      }
    });
  }

  /* ---------------- the sub drone — the ground ---------------------- */
  {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = rootFreq / 2;
    const g = ctx.createGain();
    const vol = 0.07 + 0.05 * (1 - light);
    g.gain.setValueAtTime(0.0001, 0);
    g.gain.exponentialRampToValueAtTime(vol, 4);
    g.gain.setValueAtTime(vol, duration - 6);
    g.gain.exponentialRampToValueAtTime(0.0001, duration - 0.5);
    /* the drone breathes — a very slow swell */
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1 / 23;
    const lfoG = ctx.createGain();
    lfoG.gain.value = vol * 0.35;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    osc.connect(g);
    g.connect(master);
    osc.start(0);
    lfo.start(0);
    osc.stop(duration);
    lfo.stop(duration);
  }

  /* ---------------- the crystalline bells — the sparks --------------- */
  const bellCount = Math.round(
    (14 + energy * 34) * (biases.sparse ? 0.55 : 1) * (duration / 90)
  );
  for (let i = 0; i < bellCount; i++) {
    const t0 = 2 + rng() * (duration - 6);
    const deg = Math.floor(rng() * scale.length * 2);
    const oct = rng() < 0.5 ? 1 : 2;
    const freq = degreeToFreq(deg, oct);
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = freq;
    /* a quiet shimmer — the modulator paints the glass */
    const mod = ctx.createOscillator();
    mod.type = "sine";
    mod.frequency.value = freq * (biases.crystalline ? 3.01 : 2.0);
    const modG = ctx.createGain();
    modG.gain.value = freq * (0.12 + familiarity * 0.3);
    mod.connect(modG);
    modG.connect(carrier.frequency);

    const g = ctx.createGain();
    const vol = (0.05 + 0.06 * light) * (0.5 + rng() * 0.6);
    const dur = 2.5 + rng() * 4.5;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    const pan = ctx.createStereoPanner();
    pan.pan.value = rng() * 1.6 - 0.8;

    carrier.connect(g);
    g.connect(pan);
    pan.connect(master);
    carrier.start(t0);
    mod.start(t0);
    carrier.stop(t0 + dur + 0.1);
    mod.stop(t0 + dur + 0.1);
  }

  /* ---------------- the breath — the moving air ---------------------- */
  {
    const noiseLen = Math.min(4, duration);
    const noiseBuf = ctx.createBuffer(2, sampleRate * noiseLen, sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = noiseBuf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const white = rng() * 2 - 1;
        last = (last + 0.02 * white) / 1.02; // brown-ish, soft
        d[i] = last * 3.2;
      }
    }
    const swells = Math.max(3, Math.round(duration / 22));
    for (let i = 0; i < swells; i++) {
      const t0 = rng() * (duration - 14);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = biases.cavern ? "lowpass" : "bandpass";
      bp.frequency.setValueAtTime(220 + rng() * (200 + light * 900), t0);
      bp.frequency.linearRampToValueAtTime(320 + rng() * (300 + light * 1200), t0 + 10);
      bp.Q.value = biases.cavern ? 0.4 : 0.8;
      const g = ctx.createGain();
      const vol = (0.035 + 0.03 * energy) * (biases.vast ? 1.4 : 1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 6);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 13);
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(rng() - 0.5, t0);
      src.connect(bp);
      bp.connect(g);
      g.connect(pan);
      pan.connect(master);
      src.start(t0);
      src.stop(t0 + 13.5);
    }
  }

  /* ---------------- the pulse — the far heartbeat -------------------- */
  const wantsPulse =
    biases.pulse ||
    (params.timeFeel ?? "").toLowerCase() === "pulse-driven" ||
    energy >= 0.75;
  if (wantsPulse) {
    const period = 2.2 + (1 - energy) * 1.8;
    const beats = Math.floor((duration - 8) / period);
    for (let i = 0; i < beats; i++) {
      const t0 = 4 + i * period;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(88, t0);
      osc.frequency.exponentialRampToValueAtTime(42, t0 + 0.25);
      const g = ctx.createGain();
      const vol = 0.09 + 0.05 * energy;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    }
  }

  /* ---------------- the voice — a choir held far away ---------------- */
  const voice = (params.voice ?? "").toLowerCase();
  if (voice.includes("choir") || biases.choir) {
    const phrases = Math.max(2, Math.round(duration / 30));
    for (let p = 0; p < phrases; p++) {
      const t0 = 6 + rng() * (duration - 18);
      const deg = Math.floor(rng() * scale.length);
      const dur = 5 + rng() * 6;
      for (const [iv, vol] of [
        [0, 0.05],
        [2, 0.035],
        [4, 0.028],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = degreeToFreq(deg + iv, 1);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900 + light * 800;
        bp.Q.value = 2.2;
        const vib = ctx.createOscillator();
        vib.frequency.value = 4.6 + rng() * 0.7;
        const vibG = ctx.createGain();
        vibG.gain.value = 3.2;
        vib.connect(vibG);
        vibG.connect(osc.detune);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 2.4);
        g.gain.setValueAtTime(vol, t0 + dur - 2.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(bp);
        bp.connect(g);
        g.connect(master);
        osc.start(t0);
        vib.start(t0);
        osc.stop(t0 + dur + 0.1);
        vib.stop(t0 + dur + 0.1);
      }
    }
  }

  /* ---------------- render + progress breath ------------------------ */
  let done = false;
  const expectedMs = Math.min(
    22000,
    Math.max(3500, (duration / 90) * 9000)
  );
  const started = Date.now();
  const tick = window.setInterval(() => {
    if (done) return;
    const frac = clamp01((Date.now() - started) / expectedMs);
    onProgress?.(0.02 + frac * 0.9);
  }, 240);

  try {
    const buffer = await ctx.startRendering();
    done = true;
    onProgress?.(1);
    const wav = encodeWav(buffer);
    const blob = new Blob([wav], { type: "audio/wav" });
    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, duration };
  } finally {
    done = true;
    window.clearInterval(tick);
  }
}

/** A fresh seed — one seed, one never-repeated transmission. */
export function freshResonanceSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
