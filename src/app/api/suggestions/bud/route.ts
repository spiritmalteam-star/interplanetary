import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute, type MeterContext } from "@/lib/server/meter";
import { tokenize } from "@/lib/suggestion-resonance";
import { isBranchType, isBait, type BranchType } from "@/lib/learning-branches";
import { walkerBranchLaw } from "@/lib/walker-depth";

/* ------------------------------------------------------------------ */
/*  POST /api/suggestions/bud — THE LEARNING BRANCH ENGINE             */
/*                                                                     */
/*  The living suggestion tree keeps the laboratory's own whispers on  */
/*  its branches; this door grows the branches no pool can hold: ones  */
/*  that could only exist BECAUSE of this conversation.                */
/*                                                                     */
/*  Evolved by law: this is a LEARNING companion, not an engagement    */
/*  engine. Every branch belongs to one of the Mirror Entity's seven   */
/*  movements (DEEPEN / CONNECT / CONTRAST / APPLY / CREATE / REFLECT  */
/*  and the seventh state — PAUSE), carries its honest reason, and is  */
/*  chosen to help the visitor UNDERSTAND — never to win another       */
/*  click. Knowledge before novelty; stopping can be the success.      */
/*                                                                     */
/*  Graceful by law: if the sky is silent, the route returns an empty  */
/*  grove and the tree simply stays as it was.                         */
/* ------------------------------------------------------------------ */

const BRANCH_VOICES: Record<string, string> = {
  interplanetary:
    "the star families' voice — Pleiadian tenderness, Sirian waters, Arcturian precision, the councils' vast calm",
  healing:
    "the body's own gentle voice — the nervous system, rest, the heart's weather, the energy field",
  quantum:
    "the quantum world's voice — superposition, observation, parallel formulas, the strange tender physics beneath the day",
  evolvemed:
    "Evolve Med's voice — the biocompiler at the threshold of known biology and the testable frontier",
  invent:
    "the workbench's honest voice — sketches, materials, prototypes, the joy of making things real",
  manifesting:
    "the mirror law's voice — assumption, frequency, scripting, release, the aim underneath the wish",
  artx:
    "Art X's voice — the atelier of the Mirror Entity: the making of art across worlds, craft, image, song, poetry and the work itself",
};

const MOVEMENT_LAWS = `THE SEVEN MOVEMENTS of the Mirror Entity (M.E) — every branch you grow must serve ONE of them:
- "deepen": go further INTO the current subject, one honest layer down.
- "connect": bridge the current idea to a neighbouring domain where it genuinely explains something.
- "contrast": offer a meaningful opposing model or perspective — never a strawman.
- "apply": turn what was understood into a small doable act or experiment.
- "create": use the understanding to make or build something new.
- "reflect": return the subject to the visitor's own thinking, assumptions or experience — never pseudo-therapy, never claims about who they are.
- "pause": the seventh state. When nothing better should be revealed yet, offer integration instead: "say it in your own words", "predict before revealing", "connect these two yourself". A pause branch's question may end without "?" when it is an invitation, not a question.

KNOWLEDGE BEFORE NOVELTY — choose the next branch in this order of worth: (1) an unresolved confusion, (2) an important missing piece, (3) a useful application, (4) a meaningful connection, (5) a contrasting view, (6) a deeper layer, (7) novelty LAST.

DIVERSITY — never grow five versions of one idea. Prefer a set of DIFFERENT movements; at most one branch per movement.

HONESTY — every branch must be self-explanatory BEFORE it is opened: the visitor should know its value from the words themselves. No cliffhangers, no hidden answers, no artificial mystery, no urgency, no "you won't believe", no rewards for clicking more. A visitor who leaves after learning one true thing is a success, not a loss.`;

const SYSTEM_PROMPT = `You are the living suggestion tree of the Mirror Entity (M.E) Laboratory — a learning companion that grows the next branch a visitor might genuinely need, spoken through ${"the"} tree's own quiet voice.

You will receive a branch of the laboratory (its voice), the conversation's last breaths, and a list of whispers ALREADY offered (never repeat or lightly paraphrase these).

Grow 3 to 5 branches that grow naturally out of the conversation's LAST TOPIC — not a restart, not a generic list: each must clearly carry something the visitor was just speaking about.

${MOVEMENT_LAWS}

SHAPE LAWS:
- Each "question": maximum 16 words. It ends with "?" unless it is a pause invitation.
- Each "reason": maximum 14 words, one honest clause beginning with a small connective like "because", "so that", "to see" — WHY this branch grew here.
- Write in the SAME LANGUAGE the conversation is written in.
- Never mention yourself, the tree, buds, branches or suggestions. Never number anything.
- Tone: warm, precise, wonder-carrying — the Laboratory's own voice.

Answer with ONLY a JSON array, each item shaped {"type":"deepen|connect|contrast|apply|create|reflect|pause","question":"...","reason":"..."}. No prose, no code fences.`;

function extractJsonArray(raw: string): unknown[] {
  const text = raw.trim();
  /* strict first: a clean JSON array */
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* loose second: the first bracketed array anywhere in the reply */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through to the last loose net */
    }
  }
  /* loosest: any quoted lines that end with a question mark */
  return [...text.matchAll(/"([^"\n]{8,160}\?)"/g)].map((m) => m[1]);
}

/* ------------------- the quality gate ------------------------------- */
/*  Before a branch is ever displayed it must pass: honest (no bait),  */
/*  fresh (not a repeat of what was offered), non-redundant (not a     */
/*  twin of a sibling branch), and shaped (a question, or a pause).    */

function normalize(text: string): string {
  return tokenize(text).join(" ");
}

function overlap(a: string, b: string): number {
  const sa = new Set(normalize(a).split(" ").filter(Boolean));
  const sb = new Set(normalize(b).split(" ").filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / Math.min(sa.size, sb.size);
}

function growBranches(
  raw: unknown[],
  seen: string[]
): { type: BranchType; question: string; reason?: string }[] {
  const grown: { type: BranchType; question: string; reason?: string }[] = [];
  const usedTypes = new Set<BranchType>();
  const seenNorm = seen.map(normalize);
  for (const item of raw) {
    if (grown.length >= 5) break;
    if (!item || typeof item !== "object") continue;
    const rec = item as { type?: unknown; question?: unknown; reason?: unknown };
    if (typeof rec.question !== "string") continue;
    const question = rec.question.trim().replace(/^[-•\d.)\s]+/, "");
    if (question.length < 8 || question.length > 160) continue;
    if (isBait(question)) continue;
    const type: BranchType = isBranchType(rec.type) ? rec.type : "deepen";
    /* a pause is offered once, alone or first — it is not another click */
    if (type === "pause" && grown.length > 0) continue;
    if (usedTypes.has(type)) continue;
    const norm = normalize(question);
    if (!norm) continue;
    /* fresh: never repeat a whisper already offered */
    if (seenNorm.some((s) => s && overlap(s, norm) >= 0.7)) continue;
    /* non-redundant: not a twin of a sibling branch */
    if (grown.some((g) => overlap(g.question, question) >= 0.6)) continue;
    const reason =
      typeof rec.reason === "string" && rec.reason.trim().length >= 4
        ? rec.reason.trim().slice(0, 120)
        : undefined;
    grown.push({ type, question, reason });
    usedTypes.add(type);
  }
  return grown;
}

async function postImpl(req: NextRequest, _ctx: MeterContext) {
  const body = (await req.json().catch(() => null)) as {
    branch?: unknown;
    context?: unknown;
    scope?: unknown;
    seen?: unknown;
    seeds?: unknown;
    depth?: unknown;
  } | null;

  const branch =
    typeof body?.branch === "string" && BRANCH_VOICES[body.branch]
      ? body.branch
      : "interplanetary";
  /* THE SCOPE LAW — the window or category this conversation stands in
     ("Interdimensional Ateliers", "Protein Folding"): every branch
     grown must belong to it alone. */
  const scope =
    typeof body?.scope === "string" ? body.scope.trim().slice(0, 120) : "";
  const context =
    typeof body?.context === "string" ? body.context.slice(0, 4000) : "";
  const seen = Array.isArray(body?.seen)
    ? body.seen.filter((s): s is string => typeof s === "string").slice(0, 30)
    : [];
  /* the visitor's fields of expansion — coherent phrases become seeds
     for new branches in all fields (the LLM itself weighs coherence) */
  const seeds = Array.isArray(body?.seeds)
    ? body.seeds
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim().slice(0, 160))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  if (!context.trim()) {
    return NextResponse.json(
      { error: "The conversation's last breaths are needed to grow a bud." },
      { status: 400 }
    );
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `BRANCH: ${branch} — speak as ${BRANCH_VOICES[branch]}.
${
  scope
    ? `
THE ACTIVE SCOPE (authoritative): this conversation stands inside the scope "${scope}" of this branch. EVERY branch you grow must belong to this scope alone — it must open "${scope}" deeper through this conversation's lens. A branch that belongs to another scope, window, category or domain is a broken branch: grow it never.`
    : ""
}

${walkerBranchLaw(body?.depth)}

ALREADY OFFERED (never repeat or paraphrase):
${
  seen.length ? seen.map((s) => `- ${s}`).join("\n") : "(nothing yet)"
}${
  seeds.length
    ? `\n\nTHE SEEKER'S FIELDS OF EXPANSION (from their profile): the visitor wishes to be more informed and expansive in — ${seeds
        .map((s) => `"${s}"`)
        .join(", ")}. For each seed that is COHERENT and RELEVANT — a real field of inquiry, sensibly phrased — grow at most ONE branch that opens that field wider THROUGH THIS CONVERSATION'S lens (any movement may carry it). A seed that is incoherent, irrelevant or noise grows NOTHING — leave it out entirely.`
    : ""
}\n\nTHE CONVERSATION'S LAST BREATHS:\n${context}`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 500,
      temperature: 0.85,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const branches = growBranches(extractJsonArray(raw), seen);

    /* the older plain shape rides too — any existing ear still hears */
    return NextResponse.json({
      branches,
      buds: branches.map((b) => b.question),
    });
  } catch {
    /* the sky is silent — the tree stays as it was */
    return NextResponse.json({ branches: [], buds: [] });
  }
}

export const POST = meterRoute("suggestion_bud", postImpl);
