/* ------------------------------------------------------------------ */
/*  THE VISUALIZATION FIELD — a thousand ways to see one song.          */
/*                                                                      */
/*  A deterministic, client-side generator that derives 1,000+ distinct */
/*  visualization presets from 10 families x 105 parameter variations.  */
/*  Every preset carries its own palette (the house cream/pearl/gold    */
/*  wheel, hue-shifted), its motion parameters and a `match` signature  */
/*  — an energy bias the AUTO mode scores against the live sound.       */
/*                                                                      */
/*  Performance laws:                                                   */
/*   - no per-frame allocations (all point buffers pre-built);          */
/*   - no live blur filters — glow comes from a pre-rendered sprite;    */
/*   - one rAF loop, owned by the canvas component;                     */
/*   - the engine only draws: `step(dt, frame)`.                        */
/*                                                                      */
/*  AUTO mode listens to the AnalyserNode's bands (bass / mid / treble  */
/*  energy, level, a cheap BPM estimate), scores the field against the  */
/*  rolling signature, and cross-fades to a well-matching preset every  */
/*  45–90 seconds or on a big track change. prefers-reduced-motion      */
/*  stills the field: one calm frame per preset, no loop.               */
/* ------------------------------------------------------------------ */

export type VizEnergyBias = "calm" | "flowing" | "rhythmic" | "epic";

export interface VizParams {
  /** master motion, 0.15..1.4 */
  speed: number;
  /** 0..1 — drives element counts */
  complexity: number;
  /** 0..1 — sprite glow strength */
  glow: number;
  /** 0..1 — fold count for radial families */
  symmetry: number;
  /** 0..1 — element density */
  density: number;
  /** 0..1 — organic chaos of the motion */
  drift: number;
  /** -0.5..0.5 — rotates the pearl/gold hue wheel */
  hueShift: number;
  /** 0..1 — how hard the bass moves the picture */
  pulse: number;
  /** 0.55..1.45 — element size */
  scale: number;
}

export interface VizMatch {
  energyBias: VizEnergyBias;
  /** 0..1 — the bass energy this style loves */
  bassAffinity: number;
  /** bpm affinity window; tempoMax 0 → any tempo */
  tempoMin: number;
  tempoMax: number;
}

export interface VizPreset {
  id: string;
  family: string;
  familyName: string;
  name: string;
  /** [soft base, bright accent, deep shadow] */
  palette: [string, string, string];
  params: VizParams;
  match: VizMatch;
}

export interface VizFamily {
  id: string;
  name: string;
  /** short hint for the shelf */
  hint: string;
  bias: VizEnergyBias;
}

/** One frame of the live sound, prepared by the canvas component. */
export interface AudioFrame {
  time: number; // seconds since the visualizer woke
  level: number; // 0..1 overall energy
  bass: number; // 0..1
  mid: number; // 0..1
  treble: number; // 0..1
  bpm: number | null;
  /** 32 log bands, 0..1 — shared buffer, never reallocated */
  bands: Float32Array;
}

/* --------------------------- the families --------------------------- */

export const VIZ_FAMILIES: VizFamily[] = [
  { id: "ribbon-field", name: "Ribbon Field", hint: "Wide silken ribbons folding over the song", bias: "flowing" },
  { id: "particle-bloom", name: "Particle Bloom", hint: "A cloud of light blooming with the bass", bias: "rhythmic" },
  { id: "radial-spectrum", name: "Radial Spectrum", hint: "The frequency itself, drawn as a rose of rays", bias: "rhythmic" },
  { id: "aurora-veils", name: "Aurora Veils", hint: "Slow luminous curtains breathing overhead", bias: "calm" },
  { id: "star-lattice", name: "Star Lattice", hint: "Constellations waking, lines between the lights", bias: "calm" },
  { id: "liquid-rings", name: "Liquid Rings", hint: "Concentric rings swelling on quiet water", bias: "flowing" },
  { id: "crystal-shards", name: "Crystal Shards", hint: "Faceted glass turning in the high air", bias: "epic" },
  { id: "pulse-mandala", name: "Pulse Mandala", hint: "A symmetric mandala beating with the drum", bias: "rhythmic" },
  { id: "ink-drift", name: "Ink Drift", hint: "Pearl ink blooming in still water", bias: "calm" },
  { id: "golden-spiral", name: "Golden Spiral", hint: "Arms of gold turning on the long spiral", bias: "epic" },
];

const VARIATIONS_PER_FAMILY = 105; // 10 x 105 = 1050 presets

/* --------------------------- name lists ----------------------------- */

const ADJECTIVES = [
  "Quiet", "Velvet", "Pale", "Gilded", "Wandering", "Hidden", "Liminal",
  "Amber", "Silken", "Slow", "Weightless", "Fractal", "Evening", "Opaline",
  "Distant", "Tender", "Liquid", "Lucid", "Ancient", "Radiant", "Hollow",
  "Northern", "Solar", "Nacreous", "Ultramarine", "Vernal", "Midnight",
];

const FAMILY_NOUNS: Record<string, string[]> = {
  "ribbon-field": ["Ribbons", "Banners", "Weave", "Threads", "Currents", "Shoals", "Cascades", "Folds", "Meridians", "Silks"],
  "particle-bloom": ["Bloom", "Blossom", "Swarm", "Garden", "Pollen", "Embers", "Spawn", "Orchard", "Motes", "Flurry"],
  "radial-spectrum": ["Rose", "Halo", "Crown", "Sunburst", "Iris", "Aureole", "Choir of Rays", "Compass", "Fan", "Corona"],
  "aurora-veils": ["Veils", "Curtains", "Drapes", "Shawls", "Canopy", "Banners of Dawn", "Gauze", "Vestments", "Awnings", "Reverie"],
  "star-lattice": ["Constellation", "Lattice", "Sky Chart", "Network", "Web", "Cartography", "Firmament", "Grid", "Nexus", "Skyward Weave"],
  "liquid-rings": ["Rings", "Ripples", "Wells", "Tides", "Basins", "Echoes", "Harbor", "Lagoon", "Pools", "Ondulation"],
  "crystal-shards": ["Shards", "Prisms", "Facets", "Splinters", "Geodes", "Chandeliers", "Icicles", "Glasswork", "Quarry", "Kaleidoscope"],
  "pulse-mandala": ["Mandala", "Rosette", "Sanctum", "Kaleido", "Lotos", "Sigil", "Reliquary", "Chakra", "Bloomwork", "Throne"],
  "ink-drift": ["Ink", "Eddy", "Smoke", "Milkway", "Undertow", "Sediment", "Nebula", "Suspension", "Billow", "Sepia Dream"],
  "golden-spiral": ["Spiral", "Vortex", "Galaxy", "Nautilus", "Helix", "Whorl", "Pinwheel", "Coil", "Labyrinth", "Compass Rose"],
};

/* --------------------------- color wheel ---------------------------- */
/*  The house palette: cream #fefcf6, pearl #f0e6cf, gold #d8b571.      */
/*  hueShift walks the accent around gold; the base stays pearl-soft.   */

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function paletteFor(hueShift: number, variant: number): [string, string, string] {
  const accentHue = 42 + hueShift * 130; // gold (42) ± 65°
  const sat = 0.34 + ((variant * 7) % 13) / 100; // gentle variance
  const base = hsl(44 + hueShift * 60, 0.3 + sat * 0.4, 0.9 - ((variant * 3) % 5) / 100);
  const accent = hsl(accentHue, clamp(sat + 0.28, 0.35, 0.72), 0.6);
  const deep = hsl(accentHue + 14, 0.42, 0.24 + ((variant * 5) % 6) / 100);
  return [base, accent, deep];
}

/* --------------------------- the generator -------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashFamily(familyId: string): number {
  let h = 2166136261;
  for (let i = 0; i < familyId.length; i++) {
    h ^= familyId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const BIAS_BY_INDEX: VizEnergyBias[] = ["calm", "flowing", "rhythmic", "epic"];

function buildPreset(family: VizFamily, i: number): VizPreset {
  const rng = mulberry32(hashFamily(family.id) + i * 2654435761);
  const hueShift = Math.round((rng() * 2 - 1) * 100) / 100;
  const params: VizParams = {
    speed: Math.round((0.18 + rng() * 1.1) * 100) / 100,
    complexity: Math.round(rng() * 100) / 100,
    glow: Math.round((0.25 + rng() * 0.7) * 100) / 100,
    symmetry: Math.round(rng() * 100) / 100,
    density: Math.round(rng() * 100) / 100,
    drift: Math.round(rng() * 100) / 100,
    hueShift,
    pulse: Math.round((0.2 + rng() * 0.8) * 100) / 100,
    scale: Math.round((0.6 + rng() * 0.8) * 100) / 100,
  };
  const adjectives = ADJECTIVES;
  const nouns = FAMILY_NOUNS[family.id] ?? ["Form"];
  const name = `${adjectives[(i * 7 + Math.floor(rng() * adjectives.length)) % adjectives.length]} ${nouns[i % nouns.length]}`;
  /* the bias mostly follows the family, with a slow wander across the
     spectrum so every family can serve every kind of song */
  const wander = (i + Math.floor(rng() * 3)) % 4;
  const bias = rng() < 0.62 ? family.bias : BIAS_BY_INDEX[wander];
  const bassAffinity = Math.round((bias === "rhythmic" ? 0.55 + rng() * 0.4 : bias === "epic" ? 0.45 + rng() * 0.4 : rng() * 0.45) * 100) / 100;
  /* tempo windows: some styles love the dance, some the drift */
  const tempoRoll = rng();
  const tempo: [number, number] =
    bias === "rhythmic"
      ? [96 + Math.floor(rng() * 30), 150 + Math.floor(rng() * 40)]
      : bias === "epic"
        ? [70 + Math.floor(rng() * 30), 120 + Math.floor(rng() * 50)]
        : bias === "calm"
          ? [0, 0]
          : tempoRoll < 0.4
            ? [0, 0]
            : [60 + Math.floor(rng() * 40), 110 + Math.floor(rng() * 40)];
  return {
    id: `${family.id}-${String(i + 1).padStart(3, "0")}`,
    family: family.id,
    familyName: family.name,
    name,
    palette: paletteFor(hueShift, i),
    params,
    match: { energyBias: bias, bassAffinity, tempoMin: tempo[0], tempoMax: tempo[1] },
  };
}

let presetCache: VizPreset[] | null = null;

/** The whole field — 1,050 presets, built once, deterministic forever. */
export function allPresets(): VizPreset[] {
  if (presetCache) return presetCache;
  const out: VizPreset[] = [];
  for (const family of VIZ_FAMILIES) {
    for (let i = 0; i < VARIATIONS_PER_FAMILY; i++) out.push(buildPreset(family, i));
  }
  presetCache = out;
  return out;
}

export function presetById(id: string | null | undefined): VizPreset | null {
  if (!id) return null;
  const all = allPresets();
  /* ids are sortable by family — a binary probe is plenty */
  for (let i = 0; i < all.length; i++) {
    if (all[i].id === id) return all[i];
  }
  return null;
}

export function presetsByFamily(familyId: string): VizPreset[] {
  return allPresets().filter((p) => p.family === familyId);
}

export const VIZ_PRESET_COUNT = VIZ_FAMILIES.length * VARIATIONS_PER_FAMILY;

/* ------------------------- the live signature ----------------------- */

interface Signature {
  level: number; // EMA of overall energy
  bass: number;
  mid: number;
  treble: number;
  bpm: number | null;
  bias: VizEnergyBias;
}

function biasOf(sig: { level: number; bass: number; mid: number }): VizEnergyBias {
  if (sig.level < 0.2) return "calm";
  if (sig.level < 0.42) return "flowing";
  if (sig.bass > sig.mid * 1.18) return "rhythmic";
  return "epic";
}

const BIAS_ADJACENT: Record<VizEnergyBias, VizEnergyBias[]> = {
  calm: ["flowing"],
  flowing: ["calm", "rhythmic"],
  rhythmic: ["flowing", "epic"],
  epic: ["rhythmic"],
};

/* --------------------------- the engine ----------------------------- */

/** Scratch state of the active family — rebuilt on preset change only. */
interface VizState {
  pts: Float32Array | null;
  aux: Float32Array | null;
  count: number;
  sprite: HTMLCanvasElement | null;
  sprite2: HTMLCanvasElement | null;
  bg: CanvasGradient | null;
  bgKey: string;
}

type FamilyRenderer = (
  ctx: CanvasRenderingContext2D,
  s: VizState,
  w: number,
  h: number,
  t: number,
  frame: AudioFrame,
  p: VizParams,
  palette: [string, string, string]
) => void;

/* A pre-rendered radial glow sprite — the only "blur" in the house. */
function makeGlowSprite(color: string, size = 64): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.globalAlpha = 1;
  g.fillStyle = grad;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fill();
  return c;
}

/* --------------------------- the renderers --------------------------- */

function drawBackground(
  ctx: CanvasRenderingContext2D,
  s: VizState,
  w: number,
  h: number,
  palette: [string, string, string],
  key: string,
  fade: number
) {
  if (!s.bg || s.bgKey !== key) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, palette[0]);
    grad.addColorStop(1, palette[1]);
    s.bg = grad;
    s.bgKey = key;
  }
  ctx.globalAlpha = fade;
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

const renderRibbonField: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const ribbons = Math.max(3, Math.round(3 + p.complexity * 6));
  if (!s.pts || s.count !== ribbons) {
    s.pts = new Float32Array(ribbons * 4); // [phase, amp, speed, drift] per ribbon
    for (let i = 0; i < ribbons; i++) {
      const r = mulberry32(i * 7919 + 13);
      s.pts[i * 4] = r() * Math.PI * 2;
      s.pts[i * 4 + 1] = 0.5 + r() * 1.5;
      s.pts[i * 4 + 2] = 0.5 + r() * 1.2;
      s.pts[i * 4 + 3] = r() * 2 - 1;
    }
    s.count = ribbons;
  }
  const st = s.pts;
  const segs = 48;
  const bassBoost = 1 + frame.bass * p.pulse * 1.6;
  for (let i = 0; i < ribbons; i++) {
    const phase = st[i * 4] + t * (0.18 + p.speed * 0.32) * st[i * 4 + 2];
    const yBase = h * (0.2 + (0.6 * i) / Math.max(1, ribbons - 1));
    const amp = h * 0.06 * st[i * 4 + 1] * bassBoost * p.scale;
    const hue = palette[1];
    ctx.beginPath();
    for (let k = 0; k <= segs; k++) {
      const x = (k / segs) * w;
      const y =
        yBase +
        Math.sin(phase + (k / segs) * Math.PI * (2.2 + p.drift * 2.5)) * amp +
        Math.sin(phase * 1.7 + (k / segs) * Math.PI * 4.1) * amp * 0.35;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hue;
    ctx.globalAlpha = 0.16 + p.glow * 0.3;
    ctx.lineWidth = (1 + frame.mid * 2.2) * p.scale;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const renderParticleBloom: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const n = Math.max(60, Math.round(60 + p.density * 200));
  if (!s.pts || s.count !== n) {
    s.pts = new Float32Array(n * 4); // angle, radius(0..1), size, speed
    const r = mulberry32(40961);
    for (let i = 0; i < n; i++) {
      s.pts[i * 4] = r() * Math.PI * 2;
      s.pts[i * 4 + 1] = r();
      s.pts[i * 4 + 2] = 0.4 + r() * 1.6;
      s.pts[i * 4 + 3] = (0.3 + r() * 0.9) * (r() < 0.5 ? 1 : -1);
    }
    s.count = n;
    if (!s.sprite) s.sprite = makeGlowSprite(palette[1]);
    if (!s.sprite2) s.sprite2 = makeGlowSprite(palette[2]);
  }
  const st = s.pts;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.46 * p.scale;
  const bloom = 1 + frame.bass * p.pulse * 0.9;
  const sprite = s.sprite;
  if (sprite) {
    for (let i = 0; i < n; i++) {
      const ang = st[i * 4] + t * p.speed * 0.35 * st[i * 4 + 3];
      const rad = (0.12 + st[i * 4 + 1] * 0.88) * bloom + Math.sin(t * p.speed * 1.4 + i) * 0.02 * (1 + p.drift);
      const x = cx + Math.cos(ang) * rad * maxR;
      const y = cy + Math.sin(ang) * rad * maxR * 0.92;
      const size = (3 + st[i * 4 + 2] * 7) * (0.7 + frame.treble * 0.9) * p.scale;
      ctx.globalAlpha = clamp(0.14 + p.glow * 0.4 + frame.treble * 0.25, 0, 0.9);
      ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
    }
    const deep = s.sprite2;
    if (deep) {
      const coreSize = (26 + frame.bass * 46) * p.scale;
      ctx.globalAlpha = 0.2 + p.glow * 0.3;
      ctx.drawImage(deep, cx - coreSize, cy - coreSize, coreSize * 2, coreSize * 2);
    }
  }
  ctx.globalAlpha = 1;
};

const renderRadialSpectrum: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const bands = frame.bands;
  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.18 * p.scale;
  const maxLen = Math.min(w, h) * 0.26 * (0.8 + p.complexity * 0.5);
  const rays = 64;
  if (!s.aux || s.count !== rays) {
    s.aux = new Float32Array(rays);
    for (let i = 0; i < rays; i++) s.aux[i] = mulberry32(i * 31 + 7)();
    s.count = rays;
  }
  const jitter = s.aux;
  const rot = t * p.speed * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  for (let i = 0; i < rays; i++) {
    const bandIdx = i < rays / 2 ? i : rays - 1 - i; // mirrored symmetry
    const v = clamp(bands[bandIdx % 32] + jitter[i] * 0.05 * p.drift, 0, 1);
    const len = maxLen * (0.12 + v * (0.6 + p.pulse * 0.5));
    const ang = (i / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * baseR, Math.sin(ang) * baseR);
    ctx.lineTo(Math.cos(ang) * (baseR + len), Math.sin(ang) * (baseR + len));
    ctx.strokeStyle = i % 3 === 0 ? palette[2] : palette[1];
    ctx.globalAlpha = 0.3 + v * 0.6;
    ctx.lineWidth = 1 + v * 3 * p.scale;
    ctx.stroke();
  }
  /* the beating core */
  const core = baseR * (0.7 + frame.bass * p.pulse * 0.8);
  ctx.globalAlpha = 0.24 + frame.bass * 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, core, 0, Math.PI * 2);
  ctx.fillStyle = palette[1];
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
};

const renderAuroraVeils: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const veils = Math.max(4, Math.round(4 + p.complexity * 6));
  if (!s.pts || s.count !== veils) {
    s.pts = new Float32Array(veils * 3); // x0, width, speed
    const r = mulberry32(911);
    for (let i = 0; i < veils; i++) {
      s.pts[i * 3] = r();
      s.pts[i * 3 + 1] = 0.1 + r() * 0.22;
      s.pts[i * 3 + 2] = 0.4 + r() * 1.1;
    }
    s.count = veils;
  }
  const st = s.pts;
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < veils; i++) {
    const x0 = st[i * 3];
    const width = st[i * 3 + 1];
    const speed = st[i * 3 + 2];
    const cx = (x0 + Math.sin(t * (0.08 + p.speed * 0.12) * speed + i) * 0.12 * (1 + p.drift)) * w;
    const vw = width * w * (0.9 + frame.mid * 0.5 * p.pulse);
    const grad = ctx.createLinearGradient(cx - vw, 0, cx + vw, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, palette[i % 2 === 0 ? 1 : 2]);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 0.1 + p.glow * 0.14 + frame.level * 0.12;
    ctx.fillStyle = grad;
    ctx.fillRect(cx - vw, 0, vw * 2, h);
  }
  ctx.globalAlpha = 1;
};

const renderStarLattice: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const cols = Math.max(6, Math.round(8 + p.density * 10));
  const rows = Math.max(4, Math.round((cols * h) / Math.max(1, w)) + 3);
  const n = cols * rows;
  if (!s.pts || s.count !== n) {
    s.pts = new Float32Array(n * 4); // x, y, twinklePhase, size
    const r = mulberry32(7717);
    for (let i = 0; i < n; i++) {
      const cxi = i % cols;
      const cyi = Math.floor(i / cols);
      s.pts[i * 4] = ((cxi + 0.5) / cols + (r() - 0.5) * 0.5 / cols) * w;
      s.pts[i * 4 + 1] = ((cyi + 0.5) / rows + (r() - 0.5) * 0.5 / rows) * h;
      s.pts[i * 4 + 2] = r() * Math.PI * 2;
      s.pts[i * 4 + 3] = 0.6 + r() * 1.6;
    }
    s.count = n;
    if (!s.sprite) s.sprite = makeGlowSprite(palette[1]);
  }
  const st = s.pts;
  const breathe = 1 + frame.bass * p.pulse * 0.06;
  const cx = w / 2;
  const cy = h / 2;
  const sprite = s.sprite;
  /* connect near neighbors — a quiet web of light */
  ctx.globalAlpha = 0.12 + p.glow * 0.1;
  ctx.strokeStyle = palette[2];
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i % cols === cols - 1) continue;
    const x1 = cx + (st[i * 4] - cx) * breathe;
    const y1 = cy + (st[i * 4 + 1] - cy) * breathe;
    const j = i + 1;
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx + (st[j * 4] - cx) * breathe, cy + (st[j * 4 + 1] - cy) * breathe);
    if (i + cols < n) {
      const k = i + cols;
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx + (st[k * 4] - cx) * breathe, cy + (st[k * 4 + 1] - cy) * breathe);
    }
  }
  ctx.stroke();
  if (sprite) {
    for (let i = 0; i < n; i++) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * p.speed * 1.6 + st[i * 4 + 2]));
      const x = cx + (st[i * 4] - cx) * breathe;
      const y = cy + (st[i * 4 + 1] - cy) * breathe;
      const size = (2.2 + st[i * 4 + 3] * 3.4) * (0.8 + frame.treble * 0.8) * p.scale;
      ctx.globalAlpha = clamp(tw * (0.3 + p.glow * 0.5), 0, 0.95);
      ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
    }
  }
  ctx.globalAlpha = 1;
};

const renderLiquidRings: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const rings = Math.max(4, Math.round(4 + p.complexity * 9));
  if (!s.aux || s.count !== rings) {
    s.aux = new Float32Array(rings * 2); // phase, wobble
    for (let i = 0; i < rings; i++) {
      s.aux[i * 2] = mulberry32(i * 131 + 3)();
      s.aux[i * 2 + 1] = 0.5 + mulberry32(i * 977 + 1)();
    }
    s.count = rings;
  }
  const st = s.aux;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.44 * p.scale;
  const swell = 1 + frame.bass * p.pulse * 0.5;
  for (let i = rings; i >= 1; i--) {
    const base = (i / rings) * maxR * swell;
    const wob = st[(i - 1) * 2 + 1] * 0.06 * (1 + p.drift);
    const phase = st[(i - 1) * 2] + t * p.speed * 0.4;
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      base * (1 + Math.sin(phase) * wob),
      base * (1 + Math.cos(phase * 0.8 + i) * wob),
      phase * 0.3,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = palette[i % 2 === 0 ? 1 : 2];
    ctx.globalAlpha = 0.14 + p.glow * 0.26 + frame.mid * 0.15;
    ctx.lineWidth = (1 + frame.bass * 2.4) * p.scale;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const renderCrystalShards: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const shards = Math.max(5, Math.round(5 + p.density * 16));
  if (!s.pts || s.count !== shards) {
    s.pts = new Float32Array(shards * 5); // x, y, radius, rot, sides
    const r = mulberry32(3301);
    for (let i = 0; i < shards; i++) {
      s.pts[i * 5] = r();
      s.pts[i * 5 + 1] = r();
      s.pts[i * 5 + 2] = 0.06 + r() * 0.16;
      s.pts[i * 5 + 3] = r() * Math.PI * 2;
      s.pts[i * 5 + 4] = 3 + Math.floor(r() * 4);
    }
    s.count = shards;
    if (!s.sprite) s.sprite = makeGlowSprite(palette[1]);
  }
  const st = s.pts;
  const sprite = s.sprite;
  const spin = t * p.speed * (0.2 + frame.treble * 0.8);
  for (let i = 0; i < shards; i++) {
    const x = (st[i * 5] + Math.sin(t * p.speed * 0.3 + i * 2.1) * 0.03 * (1 + p.drift)) * w;
    const y = (st[i * 5 + 1] + Math.cos(t * p.speed * 0.24 + i * 1.7) * 0.03 * (1 + p.drift)) * h;
    const rad = st[i * 5 + 2] * Math.min(w, h) * (0.8 + frame.bass * p.pulse * 0.5) * p.scale;
    const rot = st[i * 5 + 3] + spin * (0.4 + st[i * 5 + 2]);
    const sides = st[i * 5 + 4];
    ctx.beginPath();
    for (let k = 0; k <= sides; k++) {
      const ang = rot + (k / sides) * Math.PI * 2;
      const rr = k % 2 === 0 ? rad : rad * 0.55;
      const px = x + Math.cos(ang) * rr;
      const py = y + Math.sin(ang) * rr;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.1 + p.glow * 0.22;
    ctx.fillStyle = palette[1];
    ctx.fill();
    ctx.globalAlpha = 0.4 + frame.treble * 0.4;
    ctx.strokeStyle = palette[2];
    ctx.lineWidth = 1.1 * p.scale;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const renderPulseMandala: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const folds = Math.max(6, Math.round(6 + p.symmetry * 14));
  const petals = Math.max(1, Math.round(1 + p.complexity * 3));
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.42 * p.scale;
  const beat = 0.7 + frame.bass * p.pulse * 0.9;
  const rot = t * p.speed * 0.14;
  for (let layer = petals; layer >= 1; layer--) {
    const lr = (maxR * layer) / petals;
    for (let i = 0; i < folds; i++) {
      const ang = rot + (i / folds) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(lr * 0.42 * beat, -lr * 0.3, 0, lr * 0.72 * beat);
      ctx.quadraticCurveTo(-lr * 0.42 * beat, -lr * 0.3, 0, 0);
      ctx.strokeStyle = i % 2 === 0 ? palette[1] : palette[2];
      ctx.fillStyle = palette[1];
      ctx.globalAlpha = 0.1 + p.glow * 0.18;
      ctx.fill();
      ctx.globalAlpha = 0.34 + frame.mid * 0.3;
      ctx.lineWidth = 0.9 * p.scale;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 0.3 + frame.bass * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.1 * beat, 0, Math.PI * 2);
  ctx.fillStyle = palette[1];
  ctx.fill();
  ctx.globalAlpha = 1;
};

const renderInkDrift: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const blobs = Math.max(3, Math.round(3 + p.density * 6));
  if (!s.pts || s.count !== blobs) {
    s.pts = new Float32Array(blobs * 4); // x0, y0, size, speed
    const r = mulberry32(60661);
    for (let i = 0; i < blobs; i++) {
      s.pts[i * 4] = 0.15 + r() * 0.7;
      s.pts[i * 4 + 1] = 0.15 + r() * 0.7;
      s.pts[i * 4 + 2] = 0.12 + r() * 0.2;
      s.pts[i * 4 + 3] = 0.2 + r() * 0.8;
    }
    s.count = blobs;
    if (!s.sprite) s.sprite = makeGlowSprite(palette[2], 128);
    if (!s.sprite2) s.sprite2 = makeGlowSprite(palette[1], 128);
  }
  const st = s.pts;
  const main = s.sprite;
  const warm = s.sprite2;
  for (let i = 0; i < blobs; i++) {
    const sp = st[i * 4 + 3] * p.speed;
    const x = (st[i * 4] + Math.sin(t * 0.11 * sp + i * 3.3) * 0.16 * (1 + p.drift)) * w;
    const y = (st[i * 4 + 1] + Math.cos(t * 0.09 * sp + i * 2.2) * 0.16 * (1 + p.drift)) * h;
    const size = st[i * 4 + 2] * Math.min(w, h) * (1.4 + frame.level * p.pulse * 0.8) * p.scale;
    const img = i % 3 === 0 ? warm : main;
    if (img) {
      ctx.globalAlpha = 0.08 + p.glow * 0.16 + frame.level * 0.1;
      ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
    }
  }
  ctx.globalAlpha = 1;
};

const renderGoldenSpiral: FamilyRenderer = (ctx, s, w, h, t, frame, p, palette) => {
  const arms = Math.max(2, Math.round(2 + p.symmetry * 4));
  const dotsPerArm = Math.max(40, Math.round(50 + p.density * 130));
  const n = arms * dotsPerArm;
  if (!s.pts || s.count !== n) {
    s.pts = new Float32Array(n * 3); // tAlong(0..1), jitter, size
    const r = mulberry32(15485863);
    for (let i = 0; i < n; i++) {
      s.pts[i * 3] = r();
      s.pts[i * 3 + 1] = (r() - 0.5) * 0.12 * (1 + p.drift);
      s.pts[i * 3 + 2] = 0.5 + r();
    }
    s.count = n;
    if (!s.sprite) s.sprite = makeGlowSprite(palette[1]);
  }
  const st = s.pts;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.46 * p.scale;
  const rot = t * p.speed * 0.3;
  const bands = frame.bands;
  const sprite = s.sprite;
  if (sprite) {
    for (let i = 0; i < n; i++) {
      const arm = i % arms;
      const along = st[i * 3];
      const logR = Math.pow(along, 1.6);
      const ang = rot + (arm / arms) * Math.PI * 2 + along * Math.PI * 3.2 + st[i * 3 + 1];
      const rad = logR * maxR * (0.9 + frame.bass * p.pulse * 0.25);
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * 0.94;
      const band = bands[Math.floor(along * 31)];
      const size = (1.6 + st[i * 3 + 2] * 4.4) * (0.7 + band * 1.5) * p.scale;
      ctx.globalAlpha = clamp(0.14 + p.glow * 0.4 + band * 0.3, 0, 0.9);
      ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
    }
  }
  ctx.globalAlpha = 1;
};

const RENDERERS: Record<string, FamilyRenderer> = {
  "ribbon-field": renderRibbonField,
  "particle-bloom": renderParticleBloom,
  "radial-spectrum": renderRadialSpectrum,
  "aurora-veils": renderAuroraVeils,
  "star-lattice": renderStarLattice,
  "liquid-rings": renderLiquidRings,
  "crystal-shards": renderCrystalShards,
  "pulse-mandala": renderPulseMandala,
  "ink-drift": renderInkDrift,
  "golden-spiral": renderGoldenSpiral,
};

/* ------------------------ the engine itself -------------------------- */

const AUTO_MIN_HOLD_SEC = 45;
const AUTO_MAX_HOLD_SEC = 90;
const TRANSITION_SEC = 2.6;

export class VisualizationEngine {
  private ctx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private t = 0;

  private current: VizPreset;
  private incoming: VizPreset | null = null;
  private fadeT = 0;

  private state: VizState = { pts: null, aux: null, count: 0, sprite: null, sprite2: null, bg: null, bgKey: "" };
  private incomingState: VizState | null = null;

  private auto = true;
  private holdTimer = 0;
  private nextHold = AUTO_MAX_HOLD_SEC;

  /* rolling signature + bpm detection */
  private emaLevel = 0;
  private emaBass = 0;
  private emaMid = 0;
  private emaTreble = 0;
  private lastOnset = -1;
  private intervals: number[] = [];
  private biasStreakSec = 0;
  private lastBias: VizEnergyBias = "calm";
  private lastTrackKey = "";

  private rng = mulberry32(Date.now() & 0x7fffffff);

  constructor(canvas: HTMLCanvasElement, preset?: VizPreset | null) {
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.current = preset ?? allPresets()[Math.floor(this.rng() * 40)]; // a calm opening, deterministic-ish
    this.initFamilyState(this.state, this.current);
  }

  get activePreset(): VizPreset {
    return this.incoming && this.fadeT >= TRANSITION_SEC ? this.incoming : this.current;
  }

  get isAuto(): boolean {
    return this.auto;
  }

  resize(cssW: number, cssH: number): void {
    this.w = Math.max(1, Math.floor(cssW));
    this.h = Math.max(1, Math.floor(cssH));
    this.state.bg = null;
    this.state.bgKey = "";
    if (this.incomingState) {
      this.incomingState.bg = null;
      this.incomingState.bgKey = "";
    }
  }

  setAuto(auto: boolean): void {
    /* the caller may assert AUTO every frame — timers only reset when
       the choice itself changes, so the rotation keeps its rhythm */
    if (this.auto === auto) return;
    this.auto = auto;
    if (auto) {
      this.holdTimer = 0;
      this.nextHold = AUTO_MIN_HOLD_SEC + this.rng() * (AUTO_MAX_HOLD_SEC - AUTO_MIN_HOLD_SEC);
    }
  }

  setPreset(p: VizPreset): void {
    if (p.id === this.current.id && !this.incoming) return;
    this.beginTransition(p);
  }

  /** A new song began — AUTO answers with a fresh well-matched style. */
  noteTrackChange(trackKey: string): void {
    if (this.lastTrackKey === trackKey) return;
    this.lastTrackKey = trackKey;
    if (this.auto) {
      this.holdTimer = 0;
      this.nextHold = AUTO_MIN_HOLD_SEC + this.rng() * (AUTO_MAX_HOLD_SEC - AUTO_MIN_HOLD_SEC);
    }
  }

  destroy(): void {
    this.ctx = null;
    this.state.pts = null;
    this.state.aux = null;
    this.incomingState = null;
  }

  /* ------------------------- the frame ---------------------------- */

  step(dtSec: number, frame: AudioFrame | null): void {
    const ctx = this.ctx;
    if (!ctx || this.w <= 0 || this.h <= 0) return;
    const dt = clamp(dtSec, 0, 0.1);
    this.t += dt;

    if (frame) this.observe(frame, dt);

    /* the fade between presets */
    if (this.incoming) {
      this.fadeT += dt;
      if (this.fadeT >= TRANSITION_SEC) {
        this.current = this.incoming;
        /* the incoming family's scratch state becomes THE state — its
           sprites were born with the right palette */
        if (this.incomingState) this.state = this.incomingState;
        this.incoming = null;
        this.incomingState = null;
      }
    }

    /* AUTO: the scheduled rotation and the big-change rotation */
    if (this.auto) {
      this.holdTimer += dt;
      const biasNow = biasOf({ level: this.emaLevel, bass: this.emaBass, mid: this.emaMid });
      if (biasNow === this.lastBias) this.biasStreakSec += dt;
      else {
        this.lastBias = biasNow;
        this.biasStreakSec = 0;
      }
      const bigChange = this.biasStreakSec > 4 && this.biasStreakSec < 4.2 && this.holdTimer > 8;
      if (this.holdTimer >= this.nextHold || bigChange) {
        this.holdTimer = 0;
        this.nextHold = AUTO_MIN_HOLD_SEC + this.rng() * (AUTO_MAX_HOLD_SEC - AUTO_MIN_HOLD_SEC);
        const pick = this.pickForSignature();
        if (pick.id !== this.current.id) this.beginTransition(pick);
      }
    }

    this.draw(ctx, frame ?? idleFrame(this.t));
  }

  private draw(ctx: CanvasRenderingContext2D, frame: AudioFrame): void {
    const w = this.w;
    const h = this.h;
    const fading = this.incoming !== null && this.incomingState !== null;
    const halfFade = this.fadeT >= TRANSITION_SEC / 2;
    /* the palette of the moment — the incoming one past halfway */
    const bgPalette = fading && halfFade && this.incoming ? this.incoming.palette : this.current.palette;
    const bgKey = fading && halfFade && this.incoming ? this.incoming.id : this.current.id;

    /* a soft cream wash instead of a hard clear — trails stay kind */
    drawBackground(ctx, this.state, w, h, bgPalette, bgKey, 0.22);

    if (fading && this.incoming && this.incomingState) {
      if (!halfFade) {
        /* first half: both families paint; the wash dissolves the old */
        (RENDERERS[this.current.family] ?? renderRibbonField)(
          ctx, this.state, w, h, this.t, frame, this.current.params, this.current.palette
        );
      }
      (RENDERERS[this.incoming.family] ?? renderRibbonField)(
        ctx, this.incomingState, w, h, this.t, frame, this.incoming.params, this.incoming.palette
      );
      ctx.globalAlpha = 1;
      return;
    }

    (RENDERERS[this.current.family] ?? renderRibbonField)(
      ctx, this.state, w, h, this.t, frame, this.current.params, this.current.palette
    );
    ctx.globalAlpha = 1;
  }

  private initFamilyState(s: VizState, p: VizPreset): void {
    s.pts = null;
    s.aux = null;
    s.count = 0;
    s.sprite = null;
    s.sprite2 = null;
    s.bg = null;
    s.bgKey = "";
    void p;
  }

  private beginTransition(p: VizPreset): void {
    this.incoming = p;
    this.fadeT = 0;
    const st: VizState = { pts: null, aux: null, count: 0, sprite: null, sprite2: null, bg: null, bgKey: "" };
    this.initFamilyState(st, p);
    this.incomingState = st;
  }

  /* ------------------------ listening ----------------------------- */

  private observe(frame: AudioFrame, dt: number): void {
    const k = 1 - Math.exp(-dt * 1.6);
    this.emaLevel += (frame.level - this.emaLevel) * k;
    this.emaBass += (frame.bass - this.emaBass) * k;
    this.emaMid += (frame.mid - this.emaMid) * k;
    this.emaTreble += (frame.treble - this.emaTreble) * k;

    /* cheap onset clock: the bass crossing its own tide */
    const now = frame.time;
    if (frame.bass > this.emaBass * 1.45 + 0.09 && now - this.lastOnset > 0.24) {
      const interval = now - this.lastOnset;
      this.lastOnset = now;
      if (interval > 0.28 && interval < 1.6) {
        this.intervals.push(interval);
        if (this.intervals.length > 8) this.intervals.shift();
      }
    }
  }

  private bpmEstimate(): number | null {
    if (this.intervals.length < 4) return null;
    const sorted = [...this.intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    let bpm = 60 / median;
    while (bpm < 60) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    return Math.round(bpm);
  }

  private signature(): Signature {
    const bpm = this.bpmEstimate();
    return {
      level: this.emaLevel,
      bass: this.emaBass,
      mid: this.emaMid,
      treble: this.emaTreble,
      bpm,
      bias: biasOf({ level: this.emaLevel, bass: this.emaBass, mid: this.emaMid }),
    };
  }

  /** Score the whole field against the rolling signature; return a
      well-matching preset (weighted random among the leaders). */
  pickForSignature(): VizPreset {
    const sig = this.signature();
    const all = allPresets();
    const lastFamily = this.current.family;
    let bestScore = -Infinity;
    /* one pass: compute scores into a compact winner list without
       allocating — keep the top 12 by rescanning with the threshold */
    const scores = new Float64Array(12);
    const picks: VizPreset[] = [];
    for (let i = 0; i < all.length; i++) {
      const p = all[i];
      let s = 0;
      if (p.match.energyBias === sig.bias) s += 2;
      else if (BIAS_ADJACENT[sig.bias].includes(p.match.energyBias)) s += 0.5;
      else s -= 1.1;
      s -= Math.abs(p.match.bassAffinity - clamp(sig.bass * 1.4, 0, 1)) * 1.5;
      if (sig.bpm !== null && p.match.tempoMax > 0) {
        s += sig.bpm >= p.match.tempoMin && sig.bpm <= p.match.tempoMax ? 0.7 : -0.5;
      }
      if (p.family === lastFamily) s -= 1.3;
      s += this.rng() * 0.8;
      if (picks.length < 12) {
        picks.push(p);
        scores[picks.length - 1] = s;
        if (s > bestScore) bestScore = s;
      } else {
        /* replace the weakest below this score */
        let worst = 0;
        for (let j = 1; j < picks.length; j++) if (scores[j] < scores[worst]) worst = j;
        if (s > scores[worst]) {
          picks[worst] = p;
          scores[worst] = s;
          if (s > bestScore) bestScore = s;
        }
      }
    }
    /* weighted choice among the leaders */
    let total = 0;
    for (let j = 0; j < picks.length; j++) total += Math.max(0.01, scores[j] - bestScore + 2.4);
    let roll = this.rng() * total;
    for (let j = 0; j < picks.length; j++) {
      roll -= Math.max(0.01, scores[j] - bestScore + 2.4);
      if (roll <= 0) return picks[j];
    }
    return picks[picks.length - 1] ?? this.current;
  }
}

/* --------------------- the idle frame -------------------------------- */
/*  No analyser yet — the field still breathes, slowly and kindly.      */

let idleBands: Float32Array | null = null;

function idleFrame(t: number): AudioFrame {
  if (!idleBands) idleBands = new Float32Array(32);
  const b = idleBands;
  for (let i = 0; i < 32; i++) {
    b[i] = 0.1 + 0.07 * Math.sin(t * 0.9 + i * 0.5) + 0.03 * Math.sin(t * 1.7 + i);
    if (b[i] < 0.02) b[i] = 0.02;
  }
  return {
    time: t,
    level: 0.14,
    bass: 0.12,
    mid: 0.1,
    treble: 0.08,
    bpm: null,
    bands: b,
  };
}

/* --------------------- the static frame ------------------------------ */
/*  prefers-reduced-motion: draw once, hold still — the field becomes   */
/*  a painting of the moment rather than a motion.                      */

export function drawStaticFrame(
  ctx: CanvasRenderingContext2D,
  preset: VizPreset,
  w: number,
  h: number
): void {
  const engineLike = new VisualizationEngine(ctx.canvas, preset);
  engineLike.resize(w, h);
  engineLike.step(0.016, idleFrame(2.2));
  engineLike.destroy();
}
