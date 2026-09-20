/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — AI image pipeline                      */
/*  Phase 1: bespoke AI masters for every section (modes, families,   */
/*           orders, lab, federation, domains, fields, scopes, hero)  */
/*  Phase 2: 1072 unique per-entity derived images (seeded crop +     */
/*           color grade + geometric sigil overlay via sharp)         */
/*  Phase 3: remaining section masters                                */
/*  Resume-safe: skips outputs that already exist.                    */
/* ------------------------------------------------------------------ */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const AI_DIR = "public/images/ai";
const RAW_DIR = "public/images/ai/raw";
const ENTITY_DIR = "public/images/entities";
fs.mkdirSync(AI_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(ENTITY_DIR, { recursive: true });

/* ---------------- bespoke prompts ---------------- */
const Q = "cinematic, ethereal, dignified, volumetric light, high detail, no text, no letters, no watermark";
const BESPOKE = [
  /* modes */
  ["mode-interplanetary", `A vast serene council chamber of translucent light orbiting a gentle blue planet, cathedral-like starships in the far distance, soft cyan and violet nebula clouds, calm benevolent presence, ${Q}`],
  ["mode-science", `A pristine crystalline laboratory made of light, floating holographic DNA helix and orbital diagrams, emerald and teal palette, white marble and glass, ${Q}`],
  ["mode-quantum", `Abstract sacred art of quantum interference, overlapping probability waves of violet and magenta light, double-slit glow, deep indigo space, elegant calm, ${Q}`],
  ["mode-healing", `Soft aurora of rose and spring green light enveloping a luminous meditating silhouette, gentle floating light particles, warm peaceful sanctuary, ${Q}`],
  /* manifestation laboratory */
  ["lab-chamber", `An alchemical manifestation chamber, rotating rings of ancient golden geometry around a floating orb of amber light, obsidian floor engraved with sigils, golden particles, ${Q}`],
  ["lab-orb", `A perfect sphere of liquid golden light suspended between two ornate brass rings, alchemical laboratory in shadow, warm amber glow, dark background, ${Q}`],
  ["lab-sigil", `A glowing golden alchemical sigil circle engraved in a dark stone floor, intricate sacred geometry, thin amber light rising from the lines, viewed from above, ${Q}`],
  ["lab-desk", `An ancient-futuristic alchemist workbench with brass instruments and glass vessels filled with golden light, star charts and candles, warm amber and deep shadow, ${Q}`],
  /* civilization families */
  ["fam-pleiadian", `Luminous gentle star family beings of light in flowing robes of dawn colors before a Taygetan crystal temple city, warm violet-gold sky, ${Q}`],
  ["fam-sirian", `A sacred geometry temple rising from a starlit ocean, cetacean beings of light leaping through an aurora, blue and gold palette, ${Q}`],
  ["fam-arcturian", `A crystalline blueprint city of structured light floating in blue-violet space, serene geometric beings of light, precise sacred geometry, ${Q}`],
  ["fam-lyran", `Majestic feline humanoid elders of light in a golden savanna under twin suns, regal and warm, amber atmosphere, ${Q}`],
  ["fam-andromedan", `Fluid shapeshifting beings of iridescent light drifting between two spiral galaxies, wind and freedom, teal silver palette, ${Q}`],
  ["fam-inner-earth", `A crystalline underground city with vast luminescent gardens beneath a mountain, a soft inner sun, emerald and gold, ${Q}`],
  ["fam-solar-neighbors", `Golden venusian temple spires above a sea of clouds with a ringed planet in the dawn sky, ${Q}`],
  ["fam-nordic", `Tall luminous gentle humanoids of light standing in aurora-lit snow fields, serene, silver blue palette, ${Q}`],
  ["fam-feline-canine", `Noble feline and canine beings of light gathered beside a fire of stars, warm guardianship, cozy cosmic camp, ${Q}`],
  ["fam-aquatic-reptilian", `Bioluminescent ocean depths with dolphin beings of light and ancient wise sea guardians, teal and emerald, ${Q}`],
  ["fam-insectoid-mantid", `Tall gentle mantid beings of light in a vast observatory of prismatic glass, patient stillness, jade and gold, ${Q}`],
  ["fam-avian", `A great blue-plumed bird guardian of light spreading wings across a portal of dawn, feathers of light, ${Q}`],
  ["fam-crystalline", `Living crystals of pure light singing in harmonic resonance inside a prismatic cave of geometry, ${Q}`],
  ["fam-hybrid", `Gentle children of two worlds holding a sphere of light between their hands, soft violet dawn, compassionate mood, ${Q}`],
  ["fam-other-nations", `A quiet flotilla of diverse small starships of light gathered around a young green world, hopeful, ${Q}`],
  ["fam-tau-ceti", `A frontier outpost of light on a young terran world, explorers charting new skies at hopeful dawn, ${Q}`],
  ["fam-vega", `Harmonic spires of a stellar concordium ringing with visible music, silver and lilac light, ${Q}`],
  ["fam-epsilon-eridani", `Vast orbital gardens growing living starships, greenhouses of light, verdant and bright, ${Q}`],
  ["fam-zeta-reticuli", `A vast quiet archive hall where grey luminous keepers tend holographic records of worlds, silver teal, solemn beauty, ${Q}`],
  ["fam-mintaka", `An ember-orange belt star city with warm forges of light shaping dawn, bronze and gold, ${Q}`],
  /* interdimensional orders */
  ["ord-archangels", `A vast winged presence of white and gold light beyond a cathedral of clouds, axes of gentle rays, ${Q}`],
  ["ord-ascended-masters", `An assembly of radiant robed teachers on a mountain above the world at dawn, serene, golden rose light, ${Q}`],
  ["ord-devic-elemental", `Elemental spirits of leaf, water, flame and stone dancing in an ancient forest glade at dusk, emerald sparkles, ${Q}`],
  ["ord-cosmic-councils", `A circle of beings of light seated in a ring of stars around a glowing planet, deliberation and calm, ${Q}`],
  ["ord-guardians", `A vast luminous gatekeeper standing in the doorway between two realities, a threshold of light and void, ${Q}`],
  ["ord-celestial", `A being whose heart is a star, robes of nebula, galaxy-scale serenity, ${Q}`],
  ["ord-oversouls", `One soul branching into rivers of luminous selves across dimensions, golden threads of light, ${Q}`],
  ["ord-record-keepers", `An infinite library of light, akashic halls with scrolls of glowing script, violet and gold, ${Q}`],
];

const BESPOKE_LATER = [
  /* federation bodies — emblems */
  ["fed-gfw", `A grand holographic council emblem of many stars orbiting a single blue world inside a golden ring, floating above dark glass, ${Q}`],
  ["fed-ashtar", `A grand holographic emblem of a fleet of luminous starships in triangular formation inside a silver ring, ${Q}`],
  ["fed-andromedan", `A grand holographic emblem of a spiral galaxy with free-flying birds of light inside a teal ring, ${Q}`],
  ["fed-arcturian", `A grand holographic emblem of a crystalline healing geometry flower inside a violet ring, ${Q}`],
  ["fed-sirian", `A grand holographic emblem of a sacred triangle over ocean waves inside a blue gold ring, ${Q}`],
  ["fed-pleiadian", `A grand holographic emblem of seven stars arranged as a heart inside a rose gold ring, ${Q}`],
  ["fed-lyran", `A grand holographic emblem of a regal lion of light crest inside a golden ring, ${Q}`],
  ["fed-agarthan", `A grand holographic emblem of a mountain with a glowing inner sun inside an emerald ring, ${Q}`],
  ["fed-universal", `A grand holographic emblem of twelve rays forming a crown of light, white gold on dark glass, ${Q}`],
  ["fed-centaurian", `A grand holographic emblem of twin orbits crossing in fair exchange inside an amber ring, ${Q}`],
  ["fed-vegan", `A grand holographic emblem of a lyre harp with star strings inside a lilac silver ring, ${Q}`],
  ["fed-procyon", `A grand holographic emblem of a dove of light carrying an atom inside a pale blue ring, ${Q}`],
  /* treaties */
  ["treaty-prime", `An ancient illuminated treaty scroll of light with a galactic wax seal, ribbons of holographic calligraphy, deep gold palette, ${Q}`],
  ["treaty-freewill", `An illuminated charter of light with an untouched radiant key motif, silver blue palette, ${Q}`],
  ["treaty-lyran", `A founding treaty scroll with a lion crest seal, warm amber palette, ${Q}`],
  ["treaty-earth", `A provisional observer protocol hologram of Earth circled by patient lights, blue rose palette, ${Q}`],
  ["treaty-bio", `An illuminated accord with a seed of light cradled in geometry, green gold palette, ${Q}`],
  ["treaty-dream", `An illuminated accord with a sleeping figure and visiting lights, violet silver palette, ${Q}`],
  ["treaty-academy", `An illuminated accord with an open book radiating starlight, amber teal palette, ${Q}`],
  ["treaty-sanctuary", `An illuminated accord with a sheltering dome of light over a small world, rose gold palette, ${Q}`],
  /* principles */
  ["principle-service", `A minimal holographic sigil of open hands offering light inside a fine ring, gold on dark glass, sacred geometry, ${Q}`],
  ["principle-freewill", `A minimal holographic sigil of a radiant untouched key inside a fine ring, silver on dark glass, ${Q}`],
  ["principle-unity", `A minimal holographic sigil of many constellations linked by threads inside a ring, gold teal, ${Q}`],
  ["principle-love", `A minimal holographic sigil of a heart-shaped waveform inside a ring, rose gold, ${Q}`],
  ["principle-mirror", `A minimal holographic sigil of two mirrors reflecting stars inside a ring, cyan violet, ${Q}`],
  ["principle-steward", `A minimal holographic sigil of an elder hand guiding a sapling of light, emerald gold, ${Q}`],
  ["principle-quiet", `A minimal holographic sigil of a single candle in a cathedral of silence, warm white, ${Q}`],
  ["principle-joy", `A minimal holographic sigil of sparks of celebration rising inside a ring, gold rose, ${Q}`],
  /* profession domains */
  ["dom-healing-arts", `A healing sanctuary of light where luminous hands weave golden threads above a resting figure, rose and gold palette, ${Q}`],
  ["dom-light-technology", `An engineer of light shaping a glowing plasma lattice structure with bare hands, geometric arcs, cyan and gold, ${Q}`],
  ["dom-cosmic-navigation", `A pilot at the helm of a lightship navigating a glowing star-gate ring road through deep space, ${Q}`],
  ["dom-planetary-stewardship", `Gardeners of worlds tending a young planet's aurora and forests from orbital terraces, green gold, ${Q}`],
  ["dom-genetic-soul-architecture", `Weavers of luminous double helices and soul patterns at great looms of light, violet gold, ${Q}`],
  ["dom-dream-astral", `Architects building luminous bridges inside a sleeping mind, surreal astral dreamscape, silver violet, ${Q}`],
  ["dom-sound-vibration", `Cosmic musicians playing instruments of light whose tones become visible ripples of color, indigo gold, ${Q}`],
  ["dom-cosmic-history", `A historian of stars reading events in a holographic orrery of glowing timelines, amber blue, ${Q}`],
  ["dom-diplomacy-treaties", `Two emissaries of different star nations exchanging a blossom of light over a treaty table, white gold, ${Q}`],
  ["dom-celestial-arts", `Artists of light painting nebulae onto the canvas of space with brushes of aurora, vivid serene, ${Q}`],
  ["dom-exploration-first-contact", `First contact emissaries planting a garden flag of light on a new world's shore, dawn palette, ${Q}`],
  ["dom-temple-ritual", `Keepers of ceremony lighting a thousand small flames in a vast starlit temple, warm gold, ${Q}`],
  /* science fields */
  ["field-math", `Floating luminous equations and geometric proofs inside a cathedral of mathematics, chalk of light on dark glass, ${Q}`],
  ["field-biology", `A luminous DNA helix blooming like a garden vine, emerald and gold bioluminescence, ${Q}`],
  ["field-chemistry", `Alchemy of glowing molecular bonds, crystal vessels with orbiting atoms, teal gold, ${Q}`],
  ["field-physics", `An elegant sculpture of field lines and orbiting particles, brass rings and light, ${Q}`],
  ["field-astronomy", `A great observatory lens gazing into a spiral galaxy, starlight pooling on the floor, ${Q}`],
  ["field-geology", `A crystal strata canyon glowing with the colors of deep time, amber and jade layers, ${Q}`],
  ["field-neuroscience", `A constellation of neurons like a galaxy inside a luminous silhouette, rose violet, ${Q}`],
  ["field-quantum-mech", `Probability clouds blooming from a double slit, particles and waves as one, magenta indigo, ${Q}`],
  /* directions */
  ["dir-energy", `Rivers of pure energy flowing between stars, lightning of gentle light, ${Q}`],
  ["dir-consciousness", `A radiant mind-lotus unfolding above a still sea, awareness made visible, ${Q}`],
  ["dir-matter", `Crystal lattice structures growing from stardust, geometric matter, silver gold, ${Q}`],
  ["dir-life", `A seed of light sprouting into a tree of worlds, green gold dawn, ${Q}`],
  ["dir-spacetime", `A woven fabric of spacetime curving around glowing planets, indigo gold, ${Q}`],
  ["dir-information", `A library of light where knowledge flows as luminous threads, cyan violet, ${Q}`],
  /* scope chat backdrops — deliberately subtle & dark */
  ["scope-interplanetary", `An extremely dark, almost black, subtle starfield backdrop with faint cyan and violet nebula wisps, very low contrast, ambient, minimal, ${Q}`],
  ["scope-science", `An extremely dark, almost black, subtle backdrop of faint emerald grid lines and glass reflections, very low contrast, minimal, ${Q}`],
  ["scope-quantum", `An extremely dark, almost black, subtle backdrop of faint magenta interference wave bands, very low contrast, minimal, ${Q}`],
  ["scope-healing", `An extremely dark, almost black, subtle backdrop with a faint rose and green aurora glow at the edges, very low contrast, minimal, ${Q}`],
  ["scope-manifesting", `An extremely dark, almost black, subtle backdrop of faint golden alchemical circle engravings, very low contrast, minimal, ${Q}`],
  /* hero */
  ["hero-nebula", `A breathtaking serene nebula vista, soft violet cyan and rose clouds, sparse stars, deep space, painterly and calm, ${Q}`],
  ["hero-observatory", `A luminous observatory dome opening to the galaxy, silhouette of a telescope, ethereal dawn light, ${Q}`],
];

/* ---------------- helpers ---------------- */
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function generateOne(zai, id, prompt, size = "1024x1024") {
  const outJpg = path.join(AI_DIR, `${id}.jpg`);
  if (fs.existsSync(outJpg)) return { id, ok: true, skipped: true };
  const tmpPng = path.join(RAW_DIR, `${id}.png`);
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt, size });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty base64");
      fs.writeFileSync(tmpPng, Buffer.from(b64, "base64"));
      await sharp(tmpPng).jpeg({ quality: 84, mozjpeg: true }).toFile(outJpg);
      fs.rmSync(tmpPng, { force: true });
      return { id, ok: true };
    } catch (err) {
      lastErr = err;
      const is429 = /429|Too many/i.test(String(err?.message ?? err));
      const wait = is429 ? 20000 + attempt * 10000 : 5000 * attempt;
      console.log(`  [retry ${attempt}] ${id}: ${err.message} (waiting ${Math.round(wait / 1000)}s)`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return { id, ok: false, error: String(lastErr?.message ?? lastErr) };
}

async function runBespoke(jobs, workers = 2) {
  const zai = await ZAI.create();
  const queue = [...jobs];
  const results = [];
  let done = 0;
  async function worker(wid) {
    // stagger worker starts to soften the rate limit
    await new Promise((r) => setTimeout(r, wid * 8000));
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      const r = await generateOne(zai, job[0], job[1]);
      done++;
      console.log(`[${done}/${jobs.length}] ${r.ok ? (r.skipped ? "skip" : "ok") : "FAIL"} ${r.id}${r.error ? ` — ${r.error}` : ""}`);
      results.push(r);
    }
  }
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)));
  return results;
}

/* ---------------- entity derivation ---------------- */
function sigilSvg(seed) {
  const h = seed >>> 0;
  const rnd = mulberry32(h);
  const cx = 256, cy = 256;
  const palettes = [
    "rgba(240,214,150,0.34)", // gold
    "rgba(150,225,255,0.30)", // cyan
    "rgba(255,190,210,0.30)", // rose
    "rgba(190,160,255,0.30)", // violet
  ];
  const col = palettes[h % palettes.length];
  const sides = 3 + Math.floor(rnd() * 6); // 3..8
  const spokes = 6 + Math.floor(rnd() * 7); // 6..12
  const rot = Math.floor(rnd() * 360);
  const r1 = 198, r2 = 138 + Math.floor(rnd() * 22), r3 = 90;
  const dash = `${7 + Math.floor(rnd() * 18)} ${4 + Math.floor(rnd() * 12)}`;

  // polygon points
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rot + (360 / sides) * i) * Math.PI) / 180;
    pts.push(`${(cx + r2 * Math.cos(a)).toFixed(1)},${(cy + r2 * Math.sin(a)).toFixed(1)}`);
  }
  // vertex dots
  const dots = pts
    .map((p) => p.split(","))
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${col}"/>`)
    .join("");
  // spokes
  const lines = [];
  const spokeRot = rot + 15;
  for (let i = 0; i < spokes; i++) {
    const a = ((spokeRot + (360 / spokes) * i) * Math.PI) / 180;
    lines.push(`<line x1="${(cx + 56 * Math.cos(a)).toFixed(1)}" y1="${(cy + 56 * Math.sin(a)).toFixed(1)}" x2="${(cx + 172 * Math.cos(a)).toFixed(1)}" y2="${(cy + 172 * Math.sin(a)).toFixed(1)}" stroke="${col}" stroke-width="1"/>`);
  }
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vig" cx="50%" cy="46%" r="72%">
      <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(2,2,8,0.42)"/>
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${col}" stroke-width="1.4"/>
  <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${col}" stroke-width="0.9" stroke-dasharray="${dash}"/>
  <polygon points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="1.2"/>
  ${lines.join("")}
  ${dots}
  <circle cx="${cx}" cy="${cy}" r="6" fill="${col}"/>
  <rect width="512" height="512" fill="url(#vig)"/>
</svg>`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CIV_GROUP_IDS = [
  "pleiadian", "sirian", "arcturian", "lyran", "andromedan", "inner-earth",
  "solar-neighbors", "nordic", "feline-canine", "aquatic-reptilian",
  "insectoid-mantid", "avian", "crystalline", "hybrid", "other-nations",
  "tau-ceti", "vega", "epsilon-eridani", "zeta-reticuli", "mintaka",
];
const INT_GROUP_IDS = [
  "archangels", "ascended-masters", "devic-elemental", "cosmic-councils",
  "guardians", "celestial", "oversouls", "record-keepers",
];

async function deriveEntities() {
  let made = 0, skipped = 0, missingMasters = new Set();
  const jobs = [];
  for (const gid of CIV_GROUP_IDS) {
    const n = gid === "pleiadian" ? 50 : gid === "sirian" ? 50 : gid === "arcturian" ? 50 : gid === "lyran" ? 50 : gid === "andromedan" ? 50 : gid === "inner-earth" ? 49 : gid === "solar-neighbors" ? 49 : gid === "nordic" ? 46 : gid === "feline-canine" ? 47 : gid === "aquatic-reptilian" ? 46 : gid === "insectoid-mantid" ? 45 : gid === "avian" ? 44 : gid === "crystalline" ? 43 : gid === "hybrid" ? 42 : gid === "other-nations" ? 41 : gid === "tau-ceti" ? 36 : gid === "vega" ? 35 : gid === "epsilon-eridani" ? 34 : gid === "zeta-reticuli" ? 33 : 30;
    for (let i = 1; i <= n; i++) jobs.push({ id: `civ-${gid}-${String(i).padStart(3, "0")}`, group: gid, prefix: "fam" });
  }
  for (const gid of INT_GROUP_IDS) {
    const n = gid === "archangels" ? 30 : gid === "ascended-masters" ? 29 : gid === "devic-elemental" || gid === "cosmic-councils" ? 26 : gid === "guardians" || gid === "celestial" || gid === "oversouls" ? 23 : 22;
    for (let i = 1; i <= n; i++) jobs.push({ id: `int-${gid}-${String(i).padStart(3, "0")}`, group: gid, prefix: "ord" });
  }

  for (const job of jobs) {
    const out = path.join(ENTITY_DIR, `${job.id}.jpg`);
    if (fs.existsSync(out)) { skipped++; continue; }
    const master = path.join(AI_DIR, `${job.prefix}-${job.group}.jpg`);
    if (!fs.existsSync(master)) { missingMasters.add(master); continue; }
    const h = hash32(job.id);
    const rnd = mulberry32(h);
    const cropX = Math.floor(rnd() * 5) * 64; // 0..256 step 64
    const cropY = Math.floor(rnd() * 5) * 64;
    const hue = Math.floor(rnd() * 61) - 30;
    const sat = 0.9 + rnd() * 0.3;
    const bri = 0.86 + rnd() * 0.28;
    const svg = Buffer.from(sigilSvg(h));
    await sharp(master)
      .extract({ left: cropX, top: cropY, width: 768, height: 768 })
      .modulate({ hue, saturation: sat, brightness: bri })
      .resize(512, 512)
      .composite([{ input: svg, blend: "over" }])
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(out);
    made++;
    if (made % 100 === 0) console.log(`  derived ${made} entity images…`);
  }
  console.log(`Entity derivation: ${made} made, ${skipped} skipped, ${missingMasters.size ? `missing masters: ${[...missingMasters].join(", ")}` : "all masters present"}`);
}

/* ---------------- main ---------------- */
process.on("unhandledRejection", (e) =>
  console.log("unhandledRejection (continuing):", String(e))
);

console.log("=== PHASE 1: core masters (modes, families, orders, lab) ===");
await runBespoke(BESPOKE, 2);

console.log("=== PHASE 2: entity image derivation (1072) ===");
await deriveEntities();

console.log("=== PHASE 3: remaining section masters ===");
await runBespoke(BESPOKE_LATER, 2);

console.log("=== re-deriving any entities whose masters arrived late ===");
await deriveEntities();

console.log("IMAGE PIPELINE COMPLETE");
