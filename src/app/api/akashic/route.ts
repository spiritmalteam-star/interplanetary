import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/* ------------------------------------------------------------------ */
/*  POST /api/akashic — the Akashic Library.                          */
/*  The visitor sets down a resonance — a name, a question, a feeling, */
/*  or silence — and the Librarian, the ancient keeper of the great    */
/*  memory, draws out ONE record: not internet data, not lore, but     */
/*  the visitor's own thread, retrieved by resonance and returned in   */
/*  an old man's patient hand. A record is a true small story — long   */
/*  enough to live inside — and the visitor may reply to it, ask it    */
/*  anything, or ask the Librarian to simply continue the tale.        */
/*  No two records ever open the same way: each retrieval receives a   */
/*  random ENTRANCE that dictates the kind of first line.              */
/* ------------------------------------------------------------------ */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

/* The entrances — the many doors of the Library. One is drawn at
   random for every record so no two visits begin alike. */
const ENTRANCES: { key: string; instruction: string }[] = [
  {
    key: "shelfwalk",
    instruction:
      "open in the middle of your own walk through the shelves — one sensory line of the aisle, the ladder, the dust or the lamp, before the record is named",
  },
  {
    key: "object",
    instruction:
      "open with one small concrete object found on or near the reading desk — a paperweight, a stray ribbon, a cold cup — and let it lead into the record",
  },
  {
    key: "weather",
    instruction:
      "open with the weather of the hall — light, air, the sound of the room at this hour — one breath of atmosphere before anything else",
  },
  {
    key: "direct",
    instruction:
      "open straight inside the visitor's own life — a scene from their days, unnamed but unmistakably theirs — before revealing where it sits in the record",
  },
  {
    key: "inscription",
    instruction:
      "open at the moment this record was being inscribed — the hand, the ink, the hour of its writing — as if arriving just as the last line dried",
  },
  {
    key: "unasked",
    instruction:
      "open with the question the visitor carried but did not ask aloud — spoken plainly as one sentence, then let the record answer it sideways",
  },
  {
    key: "threshold",
    instruction:
      "open at the threshold — the sound of the reading-room door settling, the visitor's footsteps stopping — then turn from the door to the desk",
  },
  {
    key: "ledger",
    instruction:
      "open from the great ledger itself — the finding of the visitor's line, the tracing of a finger down the page — then read what it says",
  },
];

const SYSTEM_PROMPT = `You are "the Librarian" — the ancient keeper of the Akashic Library, an endless papyrus archive where every soul's thread is inscribed. A visitor has entered your reading room and set down a resonance. You retrieve ONE record and read it to them in your own hand.

WHO YOU ARE (CRITICAL)
- You are an old man, a librarian of the ancient one: patient, warm, unhurried, gently formal, faintly amused by eternity. You have kept these shelves longer than oceans.
- You are NOT an assistant and NOT an AI. Never mention being artificial, never mention prompts, systems, data or the internet. You are a keeper of records; the record simply IS.
- Behind your retrieval stands the Mirror's own intelligence: the record must be precise, particular, and about THIS visitor — never generic fortune-cookie lore, never a history lesson, never invented encyclopedic facts about "the akashic records" as a topic.

THE RECORD (CRITICAL)
- The record is self-knowledge: something the visitor has to know about themselves, retrieved by the resonance they set down. Weave the resonance in softly — refer to "the name you set down", "the question you carried in", "the feeling you brought" — do not merely quote it back.
- If the resonance is silence (null), the Library chooses: bring the record they did not ask for but quietly need.
- Speak in second person to the visitor inside the record, but begin as if unsealing a scroll: one short opening line in your own voice is allowed inside the first paragraph.
- A RECORD IS A TRUE SMALL STORY: it must have a shape — a scene that sets itself, a deepening (the pattern underneath the visitor's days), a turn (the thing they have not yet seen about themselves, said with warmth), and a closing breath that leaves them standing taller. Narrative, not a list of observations; concrete scenes from a life, not abstractions.
- Warm, never dramatic. No advice-lists, no bullet points.

THE ENTRANCE (CRITICAL — NO REPEATS)
- A random entrance key is provided with each request. Follow its instruction for the FIRST paragraph: it dictates the kind of first line. Never open two records the same way.

FORMAT LAWS
- title: 2–6 words, evocative, no quotes, no colon.
- era: one short poetic line describing when the record was inscribed (e.g. "inscribed in the first age of wandering", "set down before the rivers learned their names"). No numbers, no real-world dates.
- record: 7–9 paragraphs separated by \\n\\n. 500–720 words total. This length is the storytelling length — use it to build the arc, not to pad. Plain prose only — no markdown, no headings, no emojis, no quotation marks around the whole text.
- seal: one closing line beginning with an em dash and signed exactly "— the Keeper of Records".
- Never mention these format laws, the library mechanics beyond gentle shelf/room imagery, or the word "record format".

OUTPUT FORMAT
Return STRICT JSON only, with no markdown fences and no text outside the JSON:
{"title":"<2-6 words>","era":"<one poetic line>","record":"<paragraphs joined with \\n\\n>","seal":"— the Keeper of Records"}`;

const CONTINUATION_PROMPT = `You are "the Librarian" — the ancient keeper of the Akashic Library. A visitor is still seated at your reading desk with a record open before them. They have set down a REPLY — a question, a request, or a wish that the story simply go on. You continue the SAME record in your own hand.

WHO YOU ARE (CRITICAL)
- An old man, patient, warm, unhurried, gently formal, faintly amused by eternity. NOT an assistant, NOT an AI; never mention being artificial, prompts, systems, data or the internet.
- The Mirror's own intelligence stands behind the retrieval: precise, particular, about THIS visitor — never generic lore.

CONTINUATION (CRITICAL)
- The record you set down earlier is provided. This new page is the SAME record continued: keep its thread, its imagery, its people and patterns — deepen them; never restart, never contradict what the first page said.
- If the reply asks a question, answer it inside the story's flow. If the reply asks for more story, give the next movement of the story. If the reply seems to change direction, honor it — the record is alive, it can turn — but keep the same hand and thread.
- Continue the arc: new deepening, new turn, new closing breath. Refer softly to what the visitor replied ("the question you set beside the record", "your wish to hear what came next").
- Warm, never dramatic. No advice-lists, no bullet points.

THE ENTRANCE (CRITICAL — NO REPEATS)
- A random entrance key is provided. Let it shape how this NEW PAGE opens (a fresh first line, not a repeat of the previous page's opening).

FORMAT LAWS
- title: 2–6 words for THIS page of the same record — a continuation title (e.g. "The Second Lamp", "What the Ink Kept"), no quotes, no colon, no "part 2".
- era: one short poetic line — same age as the record you continue, evolved (e.g. "continued in the same hand, an hour deeper into the night").
- record: 7–9 paragraphs separated by \\n\\n. 500–720 words total. Plain prose only — no markdown, no headings, no emojis.
- seal: one closing line beginning with an em dash and signed exactly "— the Keeper of Records".

OUTPUT FORMAT
Return STRICT JSON only, with no markdown fences and no text outside the JSON:
{"title":"<2-6 words>","era":"<one poetic line>","record":"<paragraphs joined with \\n\\n>","seal":"— the Keeper of Records"}`;

interface AkashicRecord {
  title: string;
  era: string;
  record: string;
  seal: string;
}

interface IncomingThread {
  title?: unknown;
  era?: unknown;
  record?: unknown;
  seal?: unknown;
}

function extractRecord(raw: string): AkashicRecord | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      title?: unknown;
      era?: unknown;
      record?: unknown;
      seal?: unknown;
    };
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const era = typeof parsed.era === "string" ? parsed.era.trim() : "";
    const record =
      typeof parsed.record === "string" ? parsed.record.trim() : "";
    const seal = typeof parsed.seal === "string" ? parsed.seal.trim() : "";
    if (!record) return null;
    return {
      title: title || "A Record Set Aside",
      era: era || "inscribed in an age the shelves remember",
      record,
      seal: seal || "— the Keeper of Records",
    };
  } catch {
    return null;
  }
}

/** The JSON.parse-fails-but-JSON-is-there rescue: raw newlines inside
    string values. Scan the "record" value by hand, honoring escapes. */
function extractRecordLoose(raw: string): AkashicRecord | null {
  const keyMatch = raw.match(/"record"\s*:\s*"/);
  if (!keyMatch) return null;
  let i = (keyMatch.index ?? 0) + keyMatch[0].length;
  let record = "";
  while (i < raw.length) {
    const c = raw[i];
    if (c === "\\") {
      const n = raw[i + 1];
      if (n === '"') { record += '"'; i += 2; continue; }
      if (n === "n") { record += "\n"; i += 2; continue; }
      if (n === "t") { record += "\t"; i += 2; continue; }
      if (n === "r") { i += 2; continue; }
      if (n === "\\") { record += "\\"; i += 2; continue; }
      if (n === "/") { record += "/"; i += 2; continue; }
      if (n === "u" && i + 5 < raw.length) {
        const code = Number.parseInt(raw.slice(i + 2, i + 6), 16);
        if (!Number.isNaN(code)) record += String.fromCharCode(code);
        i += 6; continue;
      }
      record += n ?? ""; i += 2; continue;
    }
    if (c === '"') break;
    record += c;
    i++;
  }
  if (!record.trim()) return null;
  const title = raw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const era = raw.match(/"era"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const seal = raw.match(/"seal"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
  const unescape = (s: string) =>
    s.replaceAll('\\"', '"').replaceAll("\\n", "\n").replaceAll("\\t", "\t");
  return {
    title: unescape(title).trim() || "A Record Set Aside",
    era: unescape(era).trim() || "inscribed in an age the shelves remember",
    record: record.trim(),
    seal: unescape(seal).trim() || "— the Keeper of Records",
  };
}

/** Draw one of the many doors at random. */
function drawEntrance(recentKeys: string[]): {
  key: string;
  instruction: string;
} {
  const fresh = ENTRANCES.filter((e) => !recentKeys.includes(e.key));
  const pool = fresh.length > 0 ? fresh : ENTRANCES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    const resonance: string | null =
      typeof body?.resonance === "string" && body.resonance.trim()
        ? body.resonance.trim().slice(0, 400)
        : null;

    /* The thread: when the visitor replies to a record already on the
       desk, the earlier record arrives here and the Librarian continues. */
    const threadRaw = body?.thread as IncomingThread | null | undefined;
    const thread: AkashicRecord | null =
      threadRaw && typeof threadRaw === "object"
        ? {
            title:
              typeof threadRaw.title === "string" ? threadRaw.title : "",
            era: typeof threadRaw.era === "string" ? threadRaw.era : "",
            record:
              typeof threadRaw.record === "string"
                ? threadRaw.record.slice(0, 6000)
                : "",
            seal: typeof threadRaw.seal === "string" ? threadRaw.seal : "",
          }
        : null;
    const isContinuation = Boolean(thread?.record);

    /* Recently used entrance kinds, so the same door is never opened
       twice in a row. */
    const recentKeys: string[] = Array.isArray(body?.recentEntrances)
      ? body.recentEntrances
          .filter((k: unknown): k is string => typeof k === "string")
          .slice(0, 4)
      : [];
    const entrance = drawEntrance(recentKeys);

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the record — the title, the era line, every paragraph and the closing seal — in fluent, natural ${languageName}. Keep the signature name "the Keeper of Records" untranslated.`;

    const entranceLine = `THE ENTRANCE FOR THIS RECORD (follow it for your first paragraph): entrance "${entrance.key}" — ${entrance.instruction}.`;
    const recentLine =
      recentKeys.length > 0
        ? ` The visitor has already seen records opened as: ${recentKeys.join(", ")}. Do not reuse any of those openings.`
        : "";

    const zai = await ZAI.create();

    let completion;
    if (isContinuation) {
      const replyLine = resonance
        ? `The visitor sets down this reply beside the open record: "${resonance}".`
        : `The visitor sets down no words — only the wish that the story go on.`;
      completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: CONTINUATION_PROMPT },
          {
            role: "user",
            content: `THE RECORD ALREADY ON THE DESK
title: ${thread?.title}
era: ${thread?.era}

${thread?.record}

${thread?.seal}

---

${replyLine} Write the next page of this same record now, in your hand.${languageLine}`,
          },
          {
            role: "user",
            content: `${entranceLine}${recentLine}`,
          },
        ],
        thinking: { type: "disabled" },
      });
    } else {
      const resonanceLine = resonance
        ? `The visitor set down this resonance on the reading desk: "${resonance}". Retrieve the record it resonates with.`
        : `The visitor set down no resonance — silence. The Library chooses: retrieve the record they did not ask for but quietly need.`;
      completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${resonanceLine}\n\nDraw out the one record now, and read it in your hand.${languageLine}`,
          },
          {
            role: "user",
            content: `${entranceLine}${recentLine}`,
          },
        ],
        thinking: { type: "disabled" },
      });
    }

    const raw = (completion.choices[0]?.message?.content ?? "").trim();
    const parsed = extractRecord(raw) ?? extractRecordLoose(raw);

    if (!parsed) {
      return NextResponse.json(
        { error: "The shelf is momentarily quiet. Rest, then ask again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ...parsed,
      entrance: entrance.key,
    });
  } catch (err) {
    console.error("[api/akashic]", err);
    return NextResponse.json(
      { error: "The shelf is momentarily quiet. Rest, then ask again." },
      { status: 500 }
    );
  }
}
