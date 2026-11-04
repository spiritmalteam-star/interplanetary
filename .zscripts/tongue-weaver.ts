/* THE TONGUE WEAVER — fills the dictionaries the house is missing.
   1. sq: every used key the Albanian dict lacks → translated to Albanian.
   2. pt: a full Portuguese dictionary over every used key (the file
      that never existed, breaking the build).
   Batched through the LLM with the house's own voice as few-shot law. */
import ZAI from "z-ai-web-dev-sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";

const audit = JSON.parse(
  readFileSync("/home/z/my-project/.zscripts/i18n-audit-out.json", "utf8")
) as { used: string[]; report: Record<string, { list: string[] }> };

/* keys that are template literals in the app (handled by params in code) */
const TEMPLATE_KEYS = new Set([
  "A fresh letter may fly in ${resendCool}s",
  "Go to slide ${i + 1} — ${s.title}",
]);

/* data-driven keys the static extraction cannot see */
const EXTRA_KEYS = [
  "Dream Books",
  "A man · warm documentary narrator",
  "A man · calm, steady, professional",
  "A man · classic narrator's register",
  "A man · natural, flowing storyteller",
  "A man · expressive cinematic narrator",
  "A man · bright, luminous tone",
  "A man · clear, precise signal",
  "A woman · the kind lady reader of the books",
  "A fresh letter may fly in {n}s",
];

function dictKeys(lang: string): Set<string> {
  const src = readFileSync(`/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`, "utf8");
  const set = new Set<string>();
  const re = /\n\s*(["'`])((?:\\.|(?!\1).)*)\1\s*:/g;
  for (const m of src.matchAll(re)) set.add(m[2]);
  return set;
}

/* few-shot samples from the existing dict — the house's own voice.
   A tongue whose dict is still unborn borrows the English keys alone. */
function samples(lang: string, n: number): Array<[string, string]> {
  const p = `/home/z/my-project/src/lib/i18n/dicts/${lang}.ts`;
  if (!existsSync(p)) return [];
  const src = readFileSync(p, "utf8");
  const pairs: Array<[string, string]> = [];
  const re = /\n\s*"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const m of src.matchAll(re)) {
    try {
      pairs.push([JSON.parse(`"${m[1]}"`), JSON.parse(`"${m[2]}"`)]);
    } catch { /* skip malformed */ }
    if (pairs.length >= n) break;
  }
  return pairs;
}

const HOUSE_LAW = `You are the tongue-weaver of reflectme.space — "The Mirror Entity Digital Chamber", a poetic spiritual platform (a mirror that advises, dream books, quantum lab, transmissions, music, healing rooms). The interface's English voice is gentle, ceremonial, slightly archaic-poetic but always clear. Buttons are short imperatives ("Save to the Library"), labels are quiet nouns, messages speak in full calm sentences.

Your task: translate UI strings into the target language for the platform's interface dictionary. Rules:
- Keep the same register: warm, reverent-but-plain. Match how the platform already speaks.
- "{n}" style placeholders and words in {curly braces} must remain EXACTLY as-is, untranslated.
- Do NOT translate product names: "HyperX", "Evolve Med", "Manifest", "Quantum", "Ethermix", "M.E.", "PDF", "BPM", "LRC", "Markdown", "Wi-Fi", "Stripe", "Vessel", "Admin", "API".
- Keep punctuation style (— em dashes, · middle dots, … ellipses).
- Short strings stay short. Never add explanations.
- If a string is already mostly a product name or number, keep it nearly as-is.
- Output STRICT JSON only: one object mapping each input string to its translation. No markdown fences, no commentary.`;

interface ZaiLike {
  chat: {
    completions: {
      create: (args: {
        messages: Array<{ role: string; content: string }>;
        thinking?: { type: string };
      }) => Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
  };
}

let zai: ZaiLike | null = null;
async function getZai(): Promise<ZaiLike> {
  if (!zai) zai = (await ZAI.create()) as unknown as ZaiLike;
  return zai;
}

/* when the gate stays shut through every patient wait, the whole run
   stands down at once — later runs resume from the saved purse */
class GateClosed extends Error {}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJsonLoose(raw: string): Record<string, string> {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s) as Record<string, string>;
}

async function translateBatch(
  target: string,
  batch: string[],
  fewShot: Array<[string, string]>,
  attempt = 1
): Promise<Record<string, string>> {
  const z = await getZai();
  const shot = fewShot
    .slice(0, 24)
    .map(([k, v]) => `${JSON.stringify(k)} → ${JSON.stringify(v)}`)
    .join("\n");
  const sys = `${HOUSE_LAW}\n\nTarget language: ${target}.\n\nExamples of the house's existing voice in this language (source → translation):\n${shot}`;
  const user =
    `Translate every string below into ${target}. Return a JSON object mapping each ORIGINAL string to its translation. Keep {placeholders} untouched.\n\n${JSON.stringify(batch, null, 0)}`;
  try {
    const completion = await z.chat.completions.create({
      messages: [
        { role: "assistant", content: sys },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const parsed = parseJsonLoose(raw);
    const out: Record<string, string> = {};
    for (const k of batch) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
    }
    return out;
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (attempt >= 5) {
      if (msg.includes("429")) throw new GateClosed("the gate stayed shut through five waits");
      console.error(`batch failed after 5 tries (${batch.length} keys):`, msg);
      return {};
    }
    /* the gate breathes: 429 needs a long wait, others a short one */
    const wait = msg.includes("429") ? 45000 * attempt : 2500 * attempt;
    console.log(`  … the gate is busy (attempt ${attempt}), resting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    return translateBatch(target, batch, fewShot, attempt + 1);
  }
}

async function weaveLanguage(opts: {
  lang: string;
  targetName: string;
  keys: string[];
  outPath: string;
  batchSize?: number;
}) {
  const { lang, targetName, keys, outPath, batchSize = 55 } = opts;
  const fewShot = samples(lang, 60);
  const result: Record<string, string> = {};
  if (existsSync(outPath)) {
    Object.assign(result, JSON.parse(readFileSync(outPath, "utf8")));
  }
  const todo = keys.filter((k) => !(k in result));
  console.log(`[${lang}] ${keys.length} keys, ${todo.length} to weave`);
  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    let got: Record<string, string>;
    try {
      got = await translateBatch(targetName, batch, fewShot);
    } catch (err) {
      if (err instanceof GateClosed) {
        console.log(`[${lang}] gate closed — standing down (resume later, progress saved)`);
        writeFileSync(outPath, JSON.stringify(result, null, 2));
        return;
      }
      throw err;
    }
    Object.assign(result, got);
    const missing = batch.length - Object.keys(got).length;
    console.log(`[${lang}] batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(todo.length / batchSize)}: got ${Object.keys(got).length}/${batch.length}${missing ? ` (missing ${missing})` : ""}`);
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    /* a small breath between batches — the gate counts the rush */
    await sleep(8000);
  }
  /* second pass for stragglers */
  const still = keys.filter((k) => !(k in result));
  if (still.length > 0) {
    console.log(`[${lang}] second pass for ${still.length} stragglers`);
    for (let i = 0; i < still.length; i += 20) {
      const batch = still.slice(i, i + 20);
      let got: Record<string, string>;
      try {
        got = await translateBatch(targetName, batch, fewShot);
      } catch (err) {
        if (err instanceof GateClosed) {
          console.log(`[${lang}] gate closed in the second pass — standing down`);
          break;
        }
        throw err;
      }
      Object.assign(result, got);
      writeFileSync(outPath, JSON.stringify(result, null, 2));
      await sleep(8000);
    }
  }
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  const final = keys.filter((k) => !(k in result));
  console.log(`[${lang}] done: ${keys.length - final.length}/${keys.length} woven${final.length ? `, ${final.length} unwooven` : ""}`);
}

const SQ_TARGET = "Albanian (shqip) — natural modern Albanian as spoken in Albania";

const PT_TARGET =
  "Portuguese (Português) — natural Brazilian Portuguese, neutral register";

async function main() {
  const used = audit.used.filter((k) => !TEMPLATE_KEYS.has(k));
  const sqMissing = audit.report.sq.list.filter(
    (k) => !TEMPLATE_KEYS.has(k) && !EXTRA_KEYS.includes(k)
  );
  const sqKeys = [...new Set([...sqMissing, ...EXTRA_KEYS])];
  console.log(`sq needs ${sqKeys.length} new keys`);
  await weaveLanguage({
    lang: "sq",
    targetName: SQ_TARGET,
    keys: sqKeys,
    outPath: "/home/z/my-project/.zscripts/sq-missing.json",
  });

  /* Portuguese — full dictionary over every used key + data-driven keys */
  const ptKeys = [...new Set([...used, ...EXTRA_KEYS])];
  console.log(`pt needs ${ptKeys.length} keys for a full dictionary`);
  await weaveLanguage({
    lang: "pt",
    targetName: PT_TARGET,
    keys: ptKeys,
    outPath: "/home/z/my-project/.zscripts/pt-full.json",
  });
}

await main();
