/* THE MERGE — folds the woven JSON into the living dictionaries:
   1. sq-missing.json → appended into src/lib/i18n/dicts/sq.ts
   2. pt-full.json    → born as    src/lib/i18n/dicts/pt.ts
   Keys are emitted with JSON.stringify so every quote and newline is
   escaped exactly as the source string spells it. */
import { readFileSync, writeFileSync, existsSync } from "fs";

function load(path: string): Record<string, string> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
}

/* the two composite-pattern keys (code now uses {i}/{title} params) */
const HAND_KEYS: Record<string, Record<string, string>> = {
  sq: {
    "{i} of 10 — {title}": "{i} nga 10 — {title}",
    "Go to slide {i} — {title}": "Shko te slidi {i} — {title}",
  },
  pt: {
    "{i} of 10 — {title}": "{i} de 10 — {title}",
    "Go to slide {i} — {title}": "Ir para o slide {i} — {title}",
  },
};

function renderEntries(dict: Record<string, string>): string {
  const entries = Object.entries(dict)
    .filter(([k, v]) => k.trim() && v.trim())
    .sort((a, b) => a[0].localeCompare(b[0], "en"));
  return entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
}

/* QA — the woven voice must keep its placeholders and not echo the
   English source on long prose (short/brand strings may coincide). */
function qa(dict: Record<string, string>, lang: string) {
  let bad = 0;
  for (const [k, v] of Object.entries(dict)) {
    const kp = (k.match(/\{[a-z]+\}/g) ?? []).sort().join(",");
    const vp = (v.match(/\{[a-z]+\}/g) ?? []).sort().join(",");
    if (kp !== vp) {
      console.warn(`[qa:${lang}] placeholder mismatch: ${JSON.stringify(k.slice(0, 60))}`);
      bad++;
    }
    if (k.length > 45 && k === v) {
      console.warn(`[qa:${lang}] untranslated echo: ${JSON.stringify(k.slice(0, 60))}`);
      bad++;
    }
  }
  if (bad === 0) console.log(`[qa:${lang}] clean`);
}

/* ---- sq: append the missing voices ---- */
{
  const path = "/home/z/my-project/src/lib/i18n/dicts/sq.ts";
  const src = readFileSync(path, "utf8");
  const woven: Record<string, string> = { ...HAND_KEYS.sq };
  /* the LLM-woven purse first, then the hand-woven batches over it */
  if (existsSync("/home/z/my-project/.zscripts/sq-missing.json")) {
    Object.assign(woven, load("/home/z/my-project/.zscripts/sq-missing.json"));
  }
  for (const part of ["sq-hand-1", "sq-hand-2", "sq-hand-3", "sq-easy", "sq-hyperx"]) {
    const p = `/home/z/my-project/.zscripts/${part}.json`;
    if (existsSync(p)) Object.assign(woven, load(p));
  }
  qa(woven, "sq");

  const existing = new Set<string>();
  const re = /\n\s*(["'`])((?:\\.|(?!\1).)*)\1\s*:/g;
  for (const m of src.matchAll(re)) existing.add(m[2]);

  const fresh = Object.entries(woven).filter(([k]) => !existing.has(k));
  if (fresh.length === 0) {
    console.log("sq: nothing new to add");
  } else {
    const insertAt = src.lastIndexOf("};");
    if (insertAt < 0) throw new Error("sq.ts closing brace not found");
    const block =
      `\n  /* --- THE WOVEN REST — the keys the audit found missing, woven to full coverage (task 84) --- */\n` +
      fresh.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n") +
      "\n";
    const next = src.slice(0, insertAt) + block + src.slice(insertAt);
    writeFileSync(path, next);
    console.log(`sq: added ${fresh.length} entries (dict now ~${existing.size + fresh.length} keys)`);
  }
}

/* ---- pt: the dictionary is born ---- */
{
  const path = "/home/z/my-project/src/lib/i18n/dicts/pt.ts";
  const woven: Record<string, string> = { ...HAND_KEYS.pt };
  if (existsSync("/home/z/my-project/.zscripts/pt-full.json")) {
    Object.assign(woven, load("/home/z/my-project/.zscripts/pt-full.json"));
  }
  /* the hand-woven core always stands — the weaver's purse rides over it */
  if (existsSync("/home/z/my-project/.zscripts/pt-hand-core.json")) {
    Object.assign(woven, load("/home/z/my-project/.zscripts/pt-hand-core.json"));
  }
  const count = Object.entries(woven).filter(([k, v]) => k.trim() && v.trim()).length;
  qa(woven, "pt");
  const body = renderEntries(woven);
  const file = `import type { TranslationDict } from "../types";

/** pt — Português. Mirror Entity Digital Chamber dictionary (task 84).
    The full tongue: every key the house speaks, carried in Portuguese. */
export const pt: TranslationDict = {
${body}
};
`;
  writeFileSync(path, file);
  console.log(`pt: born with ${count} entries`);
}
