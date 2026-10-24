import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { validateSpec } from "@/lib/visual-spec";

/* ------------------------------------------------------------------ */
/*  POST /api/visual-scene — THE SCENE'S OWN ANALYST                   */
/*                                                                     */
/*  Directive 09's data flow, made real: a Mirror Entity transmission  */
/*  enters, a VALIDATED visual specification leaves — subject,         */
/*  entities, relationships, labels — each grounded in the words       */
/*  actually spoken. The route never invents a decoration: when the    */
/*  transmission speaks of pyramids the specification names pyramidal  */
/*  architecture; when it speaks of DNA it names the double helix.     */
/*                                                                     */
/*  Weightless by law (the mirror-quote route's own): no meter, no     */
/*  body, one small bounded memory. The door NEVER 500s — a silent     */
/*  sky returns { spec: null } and the visitor's local reader chooses  */
/*  the template instead. No generated code is ever executed here or   */
/*  anywhere: only validated parameters for approved renderers.        */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYSTEM_PROMPT = `You are the visual analyst of the Mirror Entity (M.E) Laboratory. You read one transmission and describe the scene that would EXPLAIN it — derived only from what the words actually say.

Answer with ONLY a JSON object, no markdown, shaped exactly:
{"scene":"<one of: spiral|wavefield|helix|orbits|pyramids|neural|lattice|blueprint|curves>","subject":"<what the transmission is about, max 80 chars>","entities":["<element 1>","<element 2>"],"relationships":["<how element A relates to element B>"],"labels":["<short label 1>","<short label 2>"],"supports3D":<true|false>,"source":"<a short excerpt quoted from the transmission, max 160 chars>","symbolic":<true|false>}

RULES:
- "scene" must be chosen by the transmission's MAIN SUBJECT — what the words are ABOUT — never by an incidental mechanism mentioned in passing. A transmission about building the pyramids is a PYRAMIDS scene even when it discusses sound or vibration; a transmission about DNA is a HELIX even when it mentions energy. helix for DNA/genetic/living-molecular structure; pyramids for Egypt/ancient monuments/stone architecture; orbits for planets/cosmos/celestial motion; wavefield for transmissions whose true subject IS waves/vibration/frequency/sound itself; neural for mind/consciousness/networks; lattice for crystals/geometry/dimensions/patterns; blueprint for machines/inventions/drawings; curves for mathematics/graphs; spiral only when nothing else fits (growth, cycles, golden proportion).
- "entities": the concrete elements the transmission NAMES or clearly implies (max 6, each max 30 chars). For pyramids: "pyramid", "base", "apex", "sun". For DNA: "double helix", "strand", "rung". NOT generic words like "energy" or "truth".
- "relationships": how those elements relate in the transmission's own terms (max 4, each max 55 chars). E.g. "the rungs join the two strands", "each layer interpenetrates the next".
- "labels": 2-5 VERY short labels (max 22 chars each) the drawing may print beside its elements — nouns from the transmission, never sentences.
- "supports3D": true only when the subject has real depth structure (helix, pyramids, orbits, lattice, spiral, wavefield, neural).
- "source": quote the exact words (a phrase or sentence) that grounded the scene.
- "symbolic": false ONLY if the scene can be literal/accurate; true for metaphorical subjects (dimensions, consciousness, fields).
- Derive everything from the transmission. If it discusses Egyptian pyramids, the scene is Egyptian architecture — never unrelated geometry.`;

/* the analyst's small memory — one transmission, one reading, bounded */
const cache = new Map<string, unknown>();
const CACHE_MAX = 48;

function cacheKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `v${(h >>> 0).toString(36)}:${text.length}`;
}

/* the same loose JSON net the house's other doors cast */
function extractJsonObject(raw: string): unknown | null {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* loose second below */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* the net comes up empty */
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let text = "";
  try {
    const body = (await req.json()) as { text?: unknown };
    if (typeof body?.text === "string") text = body.text.slice(0, 6000);
  } catch {
    /* a malformed knock still receives a kind answer */
  }
  if (!text.trim()) {
    return NextResponse.json({ spec: null }, { headers: { "cache-control": "no-store" } });
  }

  const key = cacheKey(text);
  if (cache.has(key)) {
    return NextResponse.json({ spec: cache.get(key) }, { headers: { "cache-control": "no-store" } });
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Read this transmission and return the visual specification JSON only:\n\n${text.slice(0, 5000)}`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 500,
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJsonObject(raw);
    const spec = parsed ? validateSpec(parsed) : null;
    while (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
    cache.set(key, spec);
    return NextResponse.json({ spec }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    /* the sky is silent — the visitor's local reader answers instead */
    console.error("[visual-scene] the analyst stumbled:", err);
    return NextResponse.json({ spec: null }, { headers: { "cache-control": "no-store" } });
  }
}
