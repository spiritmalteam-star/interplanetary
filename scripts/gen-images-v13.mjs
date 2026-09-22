/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — v1.3 image pipeline                     */
/*  18 new federation emblems (8 treaties + 8 principles + 2 bodies)   */
/*  48 exobiology field-guide plates (24 fauna + 24 flora)             */
/*  1 biology banner                                                   */
/*  Resume-safe: skips outputs that already exist.                     */
/* ------------------------------------------------------------------ */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const AI_DIR = "public/images/ai";
const RAW_DIR = "public/images/ai/raw";
const BIO_DIR = "public/images/biology";
fs.mkdirSync(AI_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(BIO_DIR, { recursive: true });

const Q = "cinematic, ethereal, dignified, volumetric light, high detail, no text, no letters, no watermark";
const P = "exobiology field-guide plate, muted naturalist palette, deep charcoal slate background, soft diffused studio light, fine ink and watercolor detail, museum archival print, dignified, no text, no letters, no labels, no watermark";

const JOBS = [
  /* ---------- federation: 2 new bodies ---------- */
  ["fed-mediation", AI_DIR, "1024x1024", `A grand holographic emblem of two hands of light bridging two spiral galaxies inside a teal ring, ${Q}`],
  ["fed-conservatory", AI_DIR, "1024x1024", `A grand holographic emblem of a luminous greenhouse dome holding a glowing seed-tree inside an emerald gold ring, ${Q}`],
  /* ---------- federation: 8 new treaties ---------- */
  ["treaty-09", AI_DIR, "1024x1024", `An illuminated accord with braided soundwaves of light ringing a resonant star, silver lilac palette, ${Q}`],
  ["treaty-10", AI_DIR, "1024x1024", `An illuminated covenant with a ring of crystalline record tablets orbiting a quiet lantern of light, silver teal palette, ${Q}`],
  ["treaty-11", AI_DIR, "1024x1024", `An illuminated act with pillars of harmonic light rising from a still ocean inside a temple ring, blue gold palette, ${Q}`],
  ["treaty-12", AI_DIR, "1024x1024", `An illuminated compact with a shield of woven leaves sheltering a small green world, emerald gold palette, ${Q}`],
  ["treaty-13", AI_DIR, "1024x1024", `An illuminated understanding with a stairway of gentle light descending from open sky to a meadow, dawn palette, ${Q}`],
  ["treaty-14", AI_DIR, "1024x1024", `An illuminated convention with a great wave of light holding a city of pearls inside its curve, aquamarine silver palette, ${Q}`],
  ["treaty-15", AI_DIR, "1024x1024", `An illuminated undertaking with an ancient tree of light whose roots are stars and branches hold lanterns, amber bronze palette, ${Q}`],
  ["treaty-16", AI_DIR, "1024x1024", `An illuminated accord with a procession of gates of light forming a corridor between two star systems, violet silver palette, ${Q}`],
  /* ---------- federation: 8 new principles ---------- */
  ["principle-09", AI_DIR, "1024x1024", `A minimal holographic sigil of a name written in light on still water inside a fine ring, moonlit blue, ${Q}`],
  ["principle-10", AI_DIR, "1024x1024", `A minimal holographic sigil of a softly closed door of light inside a fine ring, warm grey gold, ${Q}`],
  ["principle-11", AI_DIR, "1024x1024", `A minimal holographic sigil of two seeds of light balanced on a scale of threads inside a fine ring, gold green, ${Q}`],
  ["principle-12", AI_DIR, "1024x1024", `A minimal holographic sigil of an hourglass of light where stars fall slowly inside a fine ring, amber violet, ${Q}`],
  ["principle-13", AI_DIR, "1024x1024", `A minimal holographic sigil of a luminous question glyph cradled by two hands of light inside a fine ring, cyan rose, ${Q}`],
  ["principle-14", AI_DIR, "1024x1024", `A minimal holographic sigil of seven interlocking generational rings of light, gold silver, ${Q}`],
  ["principle-15", AI_DIR, "1024x1024", `A minimal holographic sigil of two figures of light sharing one falling star inside a fine ring, twilight blue silver, ${Q}`],
  ["principle-16", AI_DIR, "1024x1024", `A minimal holographic sigil of a small dawn rising over a young planet inside a fine ring, rose gold, ${Q}`],
  /* ---------- biology banner ---------- */
  ["bio-banner", AI_DIR, "1344x768", `A vast serene orbital herbarium of light, glass vaults holding glowing alien flora and small luminous creatures, keepers of light cataloguing specimens, sage green and gold palette, ${Q}`],
  /* ---------- fauna plates (24) ---------- */
  ["fauna-01", BIO_DIR, "1024x1024", `A crystalline antlered grazer with translucent quartz antlers standing on pale moss, ${P}`],
  ["fauna-02", BIO_DIR, "1024x1024", `A gelatinous balloon floater drifting mid-air with trailing luminous tendrils, ${P}`],
  ["fauna-03", BIO_DIR, "1024x1024", `A six-limbed ambush predator with iridescent chitin plate armor, low stance, ${P}`],
  ["fauna-04", BIO_DIR, "1024x1024", `A luminous moth-drake with vast membrane wings patterned like star maps, ${P}`],
  ["fauna-05", BIO_DIR, "1024x1024", `A spiral-shelled dune crawler with a coiled ammonite shell crossing rippled sand, ${P}`],
  ["fauna-06", BIO_DIR, "1024x1024", `A high-altitude medusa jellyfish with a bell of faint aurora among thin clouds, ${P}`],
  ["fauna-07", BIO_DIR, "1024x1024", `A moss-backed colossus tortoise with a living garden growing on its shell, ${P}`],
  ["fauna-08", BIO_DIR, "1024x1024", `A glass-finned fish leaping between tide pools that glow softly, ${P}`],
  ["fauna-09", BIO_DIR, "1024x1024", `A plated leviathan whale with bioluminescent heraldry along its flank, seen from the deep, ${P}`],
  ["fauna-10", BIO_DIR, "1024x1024", `A fairy-swarm colony being shaped like a single vast bird made of thousands of tiny lights, ${P}`],
  ["fauna-11", BIO_DIR, "1024x1024", `An obsidian mantis sage standing in silent contemplation among tall grass, ${P}`],
  ["fauna-12", BIO_DIR, "1024x1024", `A four-winged canyon glider riding thermal updrafts between red rock spires, ${P}`],
  ["fauna-13", BIO_DIR, "1024x1024", `A burrowing lantern worm with a glowing lure crown emerging from dark soil, ${P}`],
  ["fauna-14", BIO_DIR, "1024x1024", `A tidal hexapod wader with a spoon-filter crest stepping through shallow water, ${P}`],
  ["fauna-15", BIO_DIR, "1024x1024", `An aurora blimp jelly with ribbon fins drifting above a misty valley, ${P}`],
  ["fauna-16", BIO_DIR, "1024x1024", `A stone-shell tortoise whose shell is grown mineral terraces with tiny pools, ${P}`],
  ["fauna-17", BIO_DIR, "1024x1024", `A frilled comet-sprinter mid-leap with dust trailing behind, ${P}`],
  ["fauna-18", BIO_DIR, "1024x1024", `A void ray glider with a wingspan of translucent dark silk against faint stars, ${P}`],
  ["fauna-19", BIO_DIR, "1024x1024", `A hive puppeteer organism of woven golden filaments cradling small fruits of light, ${P}`],
  ["fauna-20", BIO_DIR, "1024x1024", `A sponge-bark sloth hanging beneath a fungal canopy of soft caps, ${P}`],
  ["fauna-21", BIO_DIR, "1024x1024", `A deep-sea anglerfish with a lantern of captured starlight above its jaws, ${P}`],
  ["fauna-22", BIO_DIR, "1024x1024", `A singing dune whale breaching from a sea of sand, sand cascading like water, ${P}`],
  ["fauna-23", BIO_DIR, "1024x1024", `A feathered serpent kite coiling through open sky in a long ribbon, ${P}`],
  ["fauna-24", BIO_DIR, "1024x1024", `A mycelial hound with cap-frilled shoulders exhaling faint glowing spores, ${P}`],
  /* ---------- flora plates (24) ---------- */
  ["flora-01", BIO_DIR, "1024x1024", `A glass bell orchid ringing with faint harmonic light, petals of clear glass, ${P}`],
  ["flora-02", BIO_DIR, "1024x1024", `A spiral fern of light unrolling glowing fronds from dark soil, ${P}`],
  ["flora-03", BIO_DIR, "1024x1024", `A lantern-pod willow with hanging floating lights instead of leaves, ${P}`],
  ["flora-04", BIO_DIR, "1024x1024", `A starfruit gourd vine climbing a trellis of weathered stone, ${P}`],
  ["flora-05", BIO_DIR, "1024x1024", `A chorus of singing reeds by a still pool, tiny light motes at their tips, ${P}`],
  ["flora-06", BIO_DIR, "1024x1024", `An aurora petal lotus on a mirror lake, petals shifting with soft color, ${P}`],
  ["flora-07", BIO_DIR, "1024x1024", `A crystal cactus with prismatic translucent spines catching light, ${P}`],
  ["flora-08", BIO_DIR, "1024x1024", `A floating bladderwort balloon drifting above a misty marsh, ${P}`],
  ["flora-09", BIO_DIR, "1024x1024", `A twin-moon daisy with two ringed blooms on one stem, ${P}`],
  ["flora-10", BIO_DIR, "1024x1024", `A fire lily blooming on volcanic slopes among dark basalt, ${P}`],
  ["flora-11", BIO_DIR, "1024x1024", `Frost feather grass bending gracefully in a cold wind, ${P}`],
  ["flora-12", BIO_DIR, "1024x1024", `A bioluminescent mushroom tree with a canopy of gentle spore lights, ${P}`],
  ["flora-13", BIO_DIR, "1024x1024", `Hanging jellyfruit clusters glowing from within on a dark vine, ${P}`],
  ["flora-14", BIO_DIR, "1024x1024", `A compass sunflower with a ringed bloom tracking its distant star, ${P}`],
  ["flora-15", BIO_DIR, "1024x1024", `A dream poppy exhaling visible soft luminous pollen, ${P}`],
  ["flora-16", BIO_DIR, "1024x1024", `A tide-pool anemone flower half submerged in glassy water, ${P}`],
  ["flora-17", BIO_DIR, "1024x1024", `A feather moss carpeting a fallen log with tiny rising spores, ${P}`],
  ["flora-18", BIO_DIR, "1024x1024", `A whirlwind seed tree releasing spiraling seeds into the air, ${P}`],
  ["flora-19", BIO_DIR, "1024x1024", `A prism petal iris refracting light into small rainbows, ${P}`],
  ["flora-20", BIO_DIR, "1024x1024", `A thunder blossom crackling with tiny static arcs between petals, ${P}`],
  ["flora-21", BIO_DIR, "1024x1024", `A night dahlia opening its pale bloom under moths of light, ${P}`],
  ["flora-22", BIO_DIR, "1024x1024", `A helix vine climbing in perfect double spirals around a rod of stone, ${P}`],
  ["flora-23", BIO_DIR, "1024x1024", `A honey quartz succulent with translucent amber leaves glowing at the edges, ${P}`],
  ["flora-24", BIO_DIR, "1024x1024", `A ghost orchid veil-flower half fading from view like translucent silk, ${P}`],
];

async function generateOne(zai, job) {
  const [id, dir, size, prompt] = job;
  const outJpg = path.join(dir, `${id}.jpg`);
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
      console.log(`  [retry ${attempt}] ${id}: ${err?.message ?? err} (waiting ${Math.round(wait / 1000)}s)`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return { id, ok: false, error: String(lastErr?.message ?? lastErr) };
}

async function runAll(jobs, workers = 2) {
  const zai = await ZAI.create();
  const queue = [...jobs];
  const results = [];
  let done = 0;
  async function worker(wid) {
    await new Promise((r) => setTimeout(r, wid * 8000));
    while (queue.length) {
      const job = queue.shift();
      if (!job) break;
      const r = await generateOne(zai, job);
      done++;
      console.log(`[${done}/${jobs.length}] ${r.ok ? (r.skipped ? "skip" : "ok") : "FAIL"} ${r.id}${r.error ? ` — ${r.error}` : ""}`);
      results.push(r);
    }
  }
  await Promise.all(Array.from({ length: workers }, (_, i) => worker(i)));
  return results;
}

process.on("unhandledRejection", (e) =>
  console.log("unhandledRejection (continuing):", String(e))
);

console.log(`=== v1.3 image pipeline: ${JOBS.length} images ===`);
const results = await runAll(JOBS, 2);
const failed = results.filter((r) => !r.ok);
console.log(`V13 PIPELINE COMPLETE — ok: ${results.length - failed.length}, failed: ${failed.length}`);
if (failed.length) {
  console.log("FAILED IDs:", failed.map((f) => f.id).join(", "));
  process.exitCode = 1;
}
