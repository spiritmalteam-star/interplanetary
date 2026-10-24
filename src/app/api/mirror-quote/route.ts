import { NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";

/* ------------------------------------------------------------------ */
/*  GET /api/mirror-quote — THE MIRROR'S HOURLY WORDS                  */
/*                                                                     */
/*  The threshold's side rails wear six short quotes from the Mirror   */
/*  Entity — one set per UTC hour, generated once and held in memory   */
/*  so the hour stays stable for every visitor. If the sky is silent   */
/*  the house speaks its own curated words instead (cached under the   */
/*  same hour, so the hour never flickers). This door never 500s: a    */
/*  stumble anywhere lands on the static shelf.                        */
/*                                                                     */
/*  Weightless by law: no meter, no body, no state beyond the hour's   */
/*  little map. force-dynamic + revalidate 0 keep Vercel from serving  */
/*  a stale hour.                                                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SYSTEM_PROMPT =
  "You are the Mirror Entity (M.E) — a warm, precise, wonder-carrying mirror for reflection. Write 6 short standalone quotes (max 18 words each), each one line, no numbering, no quotes marks inside, warm and honest, never mystical filler, each grounded in everyday human life (rest, attention, courage, beginnings, remembering, tenderness). Answer with ONLY a JSON array of 6 strings.";

/* the house's own shelf — spoken whenever the sky is silent */
const FALLBACK_QUOTES: string[] = [
  "You do not have to carry it all today.",
  "What you notice, you nourish.",
  "The question is already a door.",
  "Rest is not a reward; it is a rhythm.",
  "You are allowed to begin again, quietly.",
  "What keeps pulling your attention is worth a gentle look.",
  "Small honesty outlasts loud certainty.",
  "The mirror does not judge; it remembers with you.",
];

/* the hour's little memory — one generation serves every visitor of
   that hour; the key is the UTC hour, "YYYY-MM-DDTHH" */
const cache = new Map<string, string[]>();

function utcHourKey(date = new Date()): string {
  return date.toISOString().slice(0, 13);
}

/* the same loose JSON net the bud route casts: strict parse first,
   then the first bracketed array anywhere, then quoted lines */
function extractJsonArray(raw: string): unknown[] {
  const text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* loose second below */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through to the loosest net */
    }
  }
  return [...text.matchAll(/"([^"\n]{10,200})"/g)].map((m) => m[1]);
}

/* the quality gate: a quote is a trimmed line, 20..160 chars, no
   numbering, no wrapped quote marks — at most 8 survive */
function sanitizeQuotes(raw: unknown[]): string[] {
  const kept: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const quote = item
      .trim()
      .replace(/^[-•*\d.)\s]+/, "")
      .replace(/^["“”']+|["“”']+$/g, "")
      .trim();
    if (quote.length < 20 || quote.length > 160) continue;
    if (kept.some((q) => q.toLowerCase() === quote.toLowerCase())) continue;
    kept.push(quote);
    if (kept.length >= 8) break;
  }
  return kept;
}

function respond(quotes: string[], hour: string): NextResponse {
  return NextResponse.json(
    { quotes, hour },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function GET() {
  const hour = utcHourKey();

  /* this hour already has its words — speak them as they are */
  const cached = cache.get(hour);
  if (cached) return respond(cached, hour);

  /* let the hour's map forget hours that will never be asked again */
  while (cache.size > 6) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined || oldest === hour) break;
    cache.delete(oldest);
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Write this hour's six quotes. The hour is ${hour} (UTC). Six different everyday human moods — rest, attention, courage, beginnings, remembering, tenderness — one quote each.`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 400,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const quotes = sanitizeQuotes(extractJsonArray(raw));

    /* a thin hour is padded from the house's own shelf so the rails
       always hang a full set (6 minimum, 8 at most) */
    for (const fallback of FALLBACK_QUOTES) {
      if (quotes.length >= 6) break;
      if (!quotes.some((q) => q.toLowerCase() === fallback.toLowerCase())) {
        quotes.push(fallback);
      }
    }

    const settled = quotes.length >= 6 ? quotes : FALLBACK_QUOTES;
    cache.set(hour, settled);
    return respond(settled, hour);
  } catch {
    /* the sky is silent — the house speaks, and the hour keeps its
       words so the fallback never flickers mid-hour either */
    cache.set(hour, FALLBACK_QUOTES);
    return respond(FALLBACK_QUOTES, hour);
  }
}
