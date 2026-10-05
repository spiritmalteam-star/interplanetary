/* ------------------------------------------------------------------ */
/*  THE WEIGHING STONES — what each operation costs, in credits.       */
/*                                                                     */
/*  The SERVER decides the cost of everything. No client ever sends    */
/*  an amount, a price or a plan — the browser may ask, but the        */
/*  ledger here decides. Costs are env-tunable (COST_<OP>).            */
/* ------------------------------------------------------------------ */

function cost(name: string, fallback: number): number {
  const raw = process.env[`COST_${name.toUpperCase()}`];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const COSTS: Record<string, number> = {
  chat: cost("chat", 5),
  transmission: cost("transmission", 20),
  akashic: cost("akashic", 20),
  dream_book: cost("dream_book", 40),
  manifest: cost("manifest", 15),
  mirror_os: cost("mirror_os", 15),
  forge: cost("forge", 25),
  poem: cost("poem", 15),
  account_settings: cost("account_settings", 0),
  invent_tool: cost("invent_tool", 15),
  remedy: cost("remedy", 15),
  visualize: cost("visualize", 30),
  image: cost("image", 150), // painted inside chat & friends (charged extra)
  light_codes: cost("light_codes", 20),
  star_play: cost("star_play", 25),
  particlex: cost("particlex", 20),
  evolve_med: cost("evolve_med", 20),
  communion: cost("communion", 20),
  tts: cost("tts", 10),
  asr: cost("asr", 10),
  parse_doc: cost("parse_doc", 5),
  pdf: cost("pdf", 10),
  v1_chat: cost("v1_chat", 10),
  suggestion_bud: cost("suggestion_bud", 2),
};

export function costOf(operation: string): number {
  return COSTS[operation] ?? 10;
}
