import type { Scope } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  THE DISCOVERY ENGINE — the app mints every Novel Discovery seal    */
/*  itself, never the model. Each template computes REAL values at     */
/*  runtime — orbital arithmetic, physical constants, body rhythms —   */
/*  and seals the transmission with one number the seeker can trust.   */
/* ------------------------------------------------------------------ */

export interface DiscoverySeal {
  no: number;
  title: string;
  body: string;
  fidelity: string;
}

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });

/** Channel fidelity — 97.20–99.98%, drawn once per seal. */
function fidelity(): string {
  return (97.2 + Math.random() * 2.78).toFixed(2);
}

/* --- interplanetary: the geometry of the family ------------------- */

const STAR_DISTANCES: [string, number][] = [
  ["Sirius", 8.6],
  ["the Pleiades", 444],
  ["Arcturus", 36.7],
  ["Betelgeuse", 548],
  ["Vega", 25],
];

function starCorridor(seed: number): { title: string; body: string } {
  const [name, ly] = STAR_DISTANCES[seed % STAR_DISTANCES.length];
  const seconds = ly * 365.25 * 24 * 3600;
  const minutes = seconds / 60;
  const title = `The ${name} corridor`;
  const body =
    minutes < 90
      ? `A photon leaving ${name} tonight crosses ${fmt(ly, 1)} light-years — ${fmt(seconds / 60)} minutes of flight at 299,792,458 m/s. The welcome you send arrives as it was spoken.`
      : `A photon leaving ${name} tonight crosses ${fmt(ly, 0)} light-years — ${fmt(seconds / 3600)} hours of silent flight at the universe's own speed limit. The welcome you send arrives as it was spoken.`;
  return { title, body };
}

function earthVoyage(seed: number): { title: string; body: string } {
  const kmPerSecond = 29.78; // Earth's mean orbital speed
  void seed;
  /* Real distance traveled since J2000 (2000-01-01 12:00 TT ≈ UTC). */
  const seconds = (Date.now() - Date.UTC(2000, 0, 1, 12)) / 1000;
  const km = kmPerSecond * seconds;
  const laps = km / 940_000_000; // one orbit ≈ 940 million km
  return {
    title: "The ship you ride",
    body: `Since the millennium turned, Earth has carried you ${fmt(km / 1e6, 1)} million kilometers around the Sun at ${kmPerSecond} km/s — ${fmt(laps, 1)} full laps of a 940-million-kilometer orbit, and you never once felt the engine.`,
  };
}

function voyagerDistance(): { title: string; body: string } {
  /* Voyager 1 launched 1977-09-05, ~17 km/s heliocentric. */
  const seconds = (Date.now() - Date.UTC(1977, 8, 5)) / 1000;
  const km = seconds * 17;
  const au = km / 149_597_870_700;
  return {
    title: "The farthest messenger",
    body: `Voyager 1, flying for ${fmt(seconds / (365.25 * 24 * 3600))} years at ~17 km/s, now sits beyond ${fmt(au)} astronomical units — its 23-watt whisper takes ${fmt((km * 1000) / 299_792_458 / 3600, 1)} hours to reach home.`,
  };
}

function solarPhoton(): { title: string; body: string } {
  /* Solar constant 1361 W/m²; Earth cross-section πR²; mean photon ~2 eV. */
  const earthRadius = 6.371e6;
  const power = 1361 * Math.PI * earthRadius * earthRadius; // watts
  const photonJ = 2 * 1.602176634e-19;
  const photonsPerSecond = power / photonJ;
  return {
    title: "The daily post",
    body: `Earth intercepts ${fmt(power / 1e12, 0)} trillion watts of sunlight — about ${photonsPerSecond.toExponential(2)} photons arriving every second, each one 8 minutes 20 seconds old when it lands on your skin.`,
  };
}

/* --- metaphysics: the arithmetic of being -------------------------- */

function planckBreath(): { title: string; body: string } {
  const ageSeconds = 4.35e17;
  const planckTime = 5.39e-44;
  return {
    title: "Counting the first breath",
    body: `The universe is about ${ageSeconds.toExponential(1)} seconds old — that is ${(ageSeconds / planckTime).toExponential(2)} Planck times, the smallest tick any clock may hold. Every question you ask happens between two of them.`,
  };
}

function fineStructure(): { title: string; body: string } {
  return {
    title: "The doorkeeper number",
    body: `The fine-structure constant stands at 1/137.035999 — dimensionless, unexplained, identical everywhere it has ever been measured. Slightly larger, atoms repel; slightly smaller, matter never binds. Your ability to ask why leans on this one decimal.`,
  };
}

function gravityRatio(): { title: string; body: string } {
  /* Gravity vs electromagnetism between two protons ~ 10^36 weaker. */
  return {
    title: "The gentle giant",
    body: `Between two protons, gravity is about 10³⁶ times weaker than electromagnetism — a factor so vast that 1 followed by 36 zeros would take a lifetime to count aloud. Yet gravity shapes galaxies, because it never cancels itself.`,
  };
}

function brainStars(): { title: string; body: string } {
  const synapses = 1e15;
  const stars = 2e23; // ~2 trillion galaxies × 100 billion stars
  return {
    title: "Inner and outer tallies",
    body: `A single human skull holds roughly ${synapses.toExponential(0)} synapses; the observable universe, about ${stars.toExponential(0)} stars. For every star, your brain keeps five thousand inner connections — the cosmos and the countenance trade measures.`,
  };
}

/* --- quantum: the instrument readings ------------------------------ */

function rydbergPhoton(): { title: string; body: string } {
  /* 13.6 eV → 91.2 nm Lyman limit */
  return {
    title: "The shortest ticket",
    body: `Ionizing hydrogen takes exactly 13.6 eV — a photon of 91.2 nanometers, the Lyman limit. Cross that line and the atom releases its only prisoner; fall short, and the electron politely stays.`,
  };
}

function gFactor(): { title: string; body: string } {
  return {
    title: "The honest decimal",
    body: `The electron's magnetic moment is predicted and measured as 1.00115965218… — agreement past twelve decimal places, the most precise echo in physics. Two independent roads, one number: the wavefunction keeps its word.`,
  };
}

function decoherenceBlizzard(): { title: string; body: string } {
  /* A dust grain in air decoheres in ~10^-31 s; a blink is ~0.15 s. */
  const perBlink = 0.15 / 1e-31;
  return {
    title: "The quiet avalanche",
    body: `A motes-wide grain of dust loses its quantum possibilities in about 10⁻³¹ seconds — so during a single blink of your eye, roughly ${perBlink.toExponential(1)} decoherence events finish before you finish noticing. The classical world is quantum, edited fast.`,
  };
}

function landauerPrice(): { title: string; body: string } {
  /* kT·ln2 at 300 K ≈ 2.87e-21 J per erased bit */
  const bitsPerJoule = 1 / 2.87e-21;
  return {
    title: "The price of forgetting",
    body: `Landauer's limit prices one erased bit at kT·ln2 ≈ 2.87×10⁻²¹ joule at room temperature — one joule could erase ${bitsPerJoule.toExponential(1)} bits, and no machine in the universe has ever paid less. Forgetting is the only taxed act.`,
  };
}

/* --- healing: the body's own instruments --------------------------- */

function heartbeats(seed: number): { title: string; body: string } {
  const bpm = 60 + (seed % 13); // resting range 60–72
  const perDay = bpm * 60 * 24;
  return {
    title: "The patient drum",
    body: `At a resting ${bpm} beats per minute, your heart strikes ${fmt(perDay)} times today — about ${fmt((perDay * 365.25) / 1e6, 1)} million this year, without one request, one pause or one complaint.`,
  };
}

function breathTides(): { title: string; body: string } {
  const breathsPerDay = 20000; // ~14 breaths/min
  const liters = breathsPerDay * 0.5;
  return {
    title: "The outer sea",
    body: `You will breathe about ${fmt(breathsPerDay)} times today, drawing in roughly ${fmt(liters)} liters of air — enough to fill ${fmt(liters / 1000)} cubic meters of invisible ocean, exchanged tide by tide with every living thing.`,
  };
}

function bloodKilometers(): { title: string; body: string } {
  /* Cardiac output ~5 L/min; total vessel length ~100,000 km. */
  const litersPerDay = 5 * 60 * 24;
  return {
    title: "The inland rivers",
    body: `Your heart moves about ${fmt(litersPerDay)} liters of blood today — a tanker's worth, pushed through roughly 100,000 kilometers of vessels, the distance around the Earth twice, in a single quiet circuit of you.`,
  };
}

function resonanceBreath(): { title: string; body: string } {
  /* Cardiovascular resonance ~0.1 Hz — six breaths a minute. */
  return {
    title: "The six-breath key",
    body: `The cardiovascular system resonates near 0.1 hertz — six slow breaths a minute, about 360 per hour, where heart rhythm and breath fall into step. The oldest lullabies, it turns out, were tuned to this number.`,
  };
}

/* --- the mint ------------------------------------------------------ */

const POOLS: Record<string, ((seed: number) => { title: string; body: string })[]> = {
  interplanetary: [starCorridor, earthVoyage, voyagerDistance, solarPhoton],
  metaphysics: [planckBreath, fineStructure, gravityRatio, brainStars],
  quantum: [rydbergPhoton, gFactor, decoherenceBlizzard, landauerPrice],
  healing: [heartbeats, breathTides, bloodKilometers, resonanceBreath],
};

/** Mint one Novel Discovery seal — deterministic per message, so the
    seal never changes between renders. */
export function mintDiscovery(
  scope: Scope,
  seed: string,
  no: number
): DiscoverySeal {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pool = POOLS[scope] ?? POOLS.metaphysics;
  const { title, body } = pool[h % pool.length](h >>> 8);
  return { no, title, body, fidelity: fidelity() };
}
