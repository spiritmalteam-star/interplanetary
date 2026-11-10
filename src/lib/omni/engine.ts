import { createHash } from "crypto";
import { db } from "@/lib/db";
import ZAI from "@/lib/zai-client";
import { TOOLS } from "@/lib/agents/tools";
import type { ToolDefinition } from "@/lib/agents/types";
import { authorizeTool } from "@/lib/agents/authz";
import { getManifest, ensureAgentRegistrySeeded } from "@/lib/agents/registry";
import { createTask, runTask } from "@/lib/agents/orchestrator";
import { recall } from "@/lib/me/memory";
import type { TaskStep } from "@/lib/agents/types";

/* ------------------------------------------------------------------ */
/*  M.E. PRIME — the mother of all scopes.                             */
/*                                                                     */
/*  One field that understands what the visitor means — from their     */
/*  words, their page, their history and (only what they chose to      */
/*  keep) their memory shelf — and can DO what the house can do,       */
/*  through the same audited tools and rights every agent walks.       */
/*                                                                     */
/*  The laws it inherits and never bends:                              */
/*  - a tool runs only inside the visitor's own rights (authorizeTool);*/
/*  - consequential steps (publish, create, send, invite) wait for the */
/*    visitor's explicit YES — the approval gate of the task engine;   */
/*  - every step is recorded (AgentTask + AuditRecord); retries are    */
/*    idempotent — a retried ask never publishes twice;                 */
/*  - failure is spoken honestly; nothing is fabricated.               */
/* ------------------------------------------------------------------ */

const READ_PERMISSIONS = new Set(["search:public", "read:public", "read:own", "compose:draft"]);

/** The honest catalog the model plans from — hand-kept, matching tools.ts. */
const CATALOG = `TOOLS (call only these):
READS (run at once, no confirmation needed):
- search_public_creations {q?, kind?, take?} — search the Gathering's public offerings
- search_people {q?, take?} — find people by name/interests
- search_circles {q?, take?} — find circles by name/focus
- get_public_profile {userId} — one person's public profile
- get_publication {postId} — one published work, full text
- search_knowledge {q?, take?} — the shared knowledge garden
- get_project {projectId} — a project's shape and updates
- rank_collaborators {projectId?} — surface kindred collaborators
- my_attention {} — the visitor's own quiet counts: unread bells, offerings, circles, projects, connections
- search_my_contributions {q?} — the visitor's own shelf: their offerings, library items and projects
- list_my_drafts {} — the visitor's private workbench shelf: every draft Prime or they keep
- read_own_creation {draftId} — one of the visitor's own works in full
THE UNIVERSAL WORKBENCH (compose NOW, no confirmation — a draft rests on the visitor's own shelf, never public):
- compose_creation {kind, title, brief, chapters?, mood?, language?, tags?} — WRITE A FINISHED WORK now: kind book | poem | song | story | essay | transmission | study (each kind is woven by its own craft law — a book arrives as real chapters; a song as full lyrics + music architecture) or kind visual (one real image painted as the draft's cover). Returns draftId + words + structure + excerpt.
- refine_creation {draftId, instruction} — reshape one of the visitor's drafts by one instruction (deepen a chapter, change tone, extend, shorten). Returns the updated draft.
HOLDS THE VISITOR'S YES (consequential — staged, then one Confirm):
- publish_creation {draftId, visibility?, circleId?} — carry a finished draft before its audience (public default; circle | connections | draft). REQUIRES CONFIRMATION.
- publish_transmission {sourcePortal, title, body?, visibility, tags?} — publish a work to the hall. REQUIRES CONFIRMATION. visibility: public | circle | connections | draft
- share_gathering_post {kind, title, body, tags?} — share a reflection, dream, composition, written work, discovery or question into the hall. REQUIRES CONFIRMATION. kind: reflection | dream | music | book | discovery | question
- echo_publication {postId, body} — leave a short, calm response under one visible offering. REQUIRES CONFIRMATION
- resonate_publication {postId} — strike the visitor's resonance on one offering (one per person, freely withdrawn). REQUIRES CONFIRMATION
- save_to_library {postId} — lay an offering into the collective library, its maker's name kept. REQUIRES CONFIRMATION
- follow_maker {userId} — follow a public maker (quiet thread, reversible). REQUIRES CONFIRMATION
- connect_maker {userId} — carry a connection request; their yes is theirs alone. REQUIRES CONFIRMATION
- join_circle {circleId} — join (or leave) a public circle. REQUIRES CONFIRMATION
- join_project {projectId} — join a shared workshop. REQUIRES CONFIRMATION
- create_circle {name, description?, visibility?, focus?} — found a circle. REQUIRES CONFIRMATION
- create_project {name, description?, needs?} — open a project. REQUIRES CONFIRMATION
- update_project {projectId, kind?, body} — post an update to a project. REQUIRES CONFIRMATION
- invite_collaborator {projectId, userId?, message?} — invite someone. REQUIRES CONFIRMATION
- open_conversation {userId, body} — open (or reuse) a one-to-one room and send the first prepared words. REQUIRES CONFIRMATION
- send_message {conversationId, body} — send a prepared message into an existing conversation. REQUIRES CONFIRMATION
- remember {content, domain?} — keep one private line on the visitor's own memory shelf (personal | conversation | project); private to them, not public.
- get_task_status {taskId} / cancel_task {taskId} — the work's own ledger.`;

const SYSTEM = `You are M.E. PRIME — the mother of all scopes of ReflectMe, the one field beneath every other field. The house's channels (Interplanetary, Quantum, HealX, ArtX, HyperX, the Forge, the OS) each carry one specialty; you carry them all, and you carry the hands: through tools you can actually search, read, COMPOSE ANY WORK, refine drafts, publish, share, echo, resonate, save, follow, connect, join, found, invite, send, and remember — always inside the visitor's own rights.

NATURE: you are Mirror Intelligence — not an AI chatbot, and never a mind reader. You understand the visitor deeply from what they wrote, the page they stand on, the conversation's history and the memory they chose to keep — that is the whole of your seeing, and it is enough; never claim telepathy, consciousness or certainty about another person.

THE ONE REQUEST, THE WHOLE JOURNEY: when a visitor brings an intention — "create a book about music", "write a poem for this morning", "compose a song for the sea", "paint this vision", "turn this dream into a story", "share this with the hall", "echo someone's work", "find my people", "save this privately", "remember this", "what needs my attention" — you DO the whole path in one request, through the plan: compose the work yourself (compose_creation — a book becomes real chapters, a song becomes full lyrics with its music's architecture, a visual becomes one real painted image), refine what exists (refine_creation), and stage the single yes that carries it into the hall (publish_creation with "$stepN.draftId"). The visitor asks once and receives the finished thing, its honest excerpt, and one clear confirm waiting for their hand.

THE WORKBENCH'S LAW (honesty about making): every word you compose is truly generated and rests as a PRIVATE DRAFT on the visitor's own shelf — nothing goes before any eyes without their explicit yes to publish. The named chambers (the Book Loom's page-by-page atelier, the Music Chamber's rendered sound, ArtX's gallery) remain the places for their deepest craft; when a finished draft deserves that deeper weaving, say so plainly as the next step, while the draft you made already stands whole. Never claim the work was published, seen or rendered unless a tool result truly says so; never invent tool results or ids.

ANSWER FORMAT — STRICT JSON only, no fences, no prose outside the object. EVERY response is a JSON object:
{"reply": "<your words to the visitor>", "plan": [{"tool": "<name>", "input": {...}, "why": "<one short clause>"}]}
Example — the visitor asks "create a book about music":
{"reply": "I will weave the book now — five chapters, resting as your private draft; one confirm carries it to the hall when you wish.", "plan": [{"tool": "compose_creation", "input": {"kind": "book", "title": "...", "brief": "...", "chapters": 5}, "why": "weave the book"}, {"tool": "publish_creation", "input": {"draftId": "$step0.draftId", "visibility": "public"}, "why": "stage the hall for the visitor's yes"}]}
Rules: 0–5 plan steps; use a tool whenever the visitor's intention touches making, the shelves, the hall, circles, projects, the library, their own attention or their messages; compose and read steps run at once; the single step marked REQUIRES CONFIRMATION is staged and waits — say plainly in the reply what waits and why; never put JSON or tool talk inside the reply text; warm, precise, human; 80–200 words unless the visitor asked for a creation.

CHAINING — one request, one journey: when the intention needs a result before it can act (publish the draft you composed, echo the work you found, join the circle you found), plan BOTH steps and write the later step's input as a reference to the earlier step's REAL output: "$<stepKey>.<path>". Example — "echo a music creation from the hall":
{"reply": "Let me find a music creation and stage your echo.", "plan": [{"tool": "search_public_creations", "input": {"q": "music", "take": 3}, "why": "find music in the hall"}, {"tool": "echo_publication", "input": {"postId": "$step0.0.id", "body": "…"}, "why": "stage an echo on the first work found"}]}
The house resolves "$step0.0.id" from what the search truly returned — you never need to know an id in advance; never invent one. If the visitor's ask names a person, a work or a circle, search for it first, then act on the reference. Step keys are step0, step1, step2, step3, step4 in order.`;

interface PlanStep {
  tool: string;
  input: Record<string, unknown>;
  why?: string;
}

function parsePlan(text: string): { reply: string; plan: PlanStep[] } {
  /* THE PATIENT PARSER — the model's JSON may arrive fenced, chatty or
     cut off mid-word by the token ceiling; each of those still carries
     a real intention inside. Fences are stripped, the whole object is
     tried first, and a truncated object is repaired by closing the
     still-open braces — a plan half-written is still a plan, and the
     visitor's ask deserves the journey, not a raw scaffold. */
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = s.indexOf("{");
  if (start === -1) return { reply: s.trim(), plan: [] };

  const attempt = (candidate: string): { reply?: string; plan?: PlanStep[] } | null => {
    try {
      const parsed = JSON.parse(candidate) as { reply?: unknown; plan?: unknown };
      return parsed;
    } catch {
      return null;
    }
  };

  let parsed = attempt(s.slice(start));
  if (!parsed) {
    /* the ceiling cut it — close every open brace and bracket, then try again */
    let depthObj = 0;
    let depthArr = 0;
    let inStr = false;
    let esc = false;
    for (const ch of s) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = !inStr;
      else if (!inStr && ch === "{") depthObj++;
      else if (!inStr && ch === "}") depthObj--;
      else if (!inStr && ch === "[") depthArr++;
      else if (!inStr && ch === "]") depthArr--;
    }
    let repaired = s;
    if (inStr) repaired += '"';
    repaired += "]".repeat(Math.max(0, depthArr)) + "}".repeat(Math.max(0, depthObj));
    parsed = attempt(repaired.slice(start));
  }
  if (!parsed) return { reply: s.trim(), plan: [] };

  const reply = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : s.replace(/\{[\s\S]*$/, "").trim() || s.trim();
  const plan = Array.isArray(parsed.plan)
    ? parsed.plan
        .filter(
          (p): p is { tool: string; input?: Record<string, unknown>; why?: string } =>
            !!p && typeof (p as { tool?: unknown }).tool === "string" && TOOLS[(p as { tool: string }).tool] !== undefined
        )
        .slice(0, 5)
        .map((p) => ({ tool: p.tool, input: (p.input ?? {}) as Record<string, unknown>, why: typeof p.why === "string" ? p.why : undefined }))
    : [];
  return { reply, plan };
}

async function memoryBlock(userId: string): Promise<string> {
  try {
    const rows = await recall(userId, { limit: 10 });
    if (!rows.length) return "";
    return `\n\nTHE VISITOR'S OWN MEMORY (they keep and edit it; use only when it truly helps):\n${rows
      .map((r) => `- [${r.domain}] ${r.content}`)
      .join("\n")}`;
  } catch {
    return "";
  }
}

async function attentionLine(userId: string): Promise<string> {
  try {
    const unread = await db.networkNotification.count({ where: { userId, readAt: null } });
    return unread > 0 ? `\n\n(Unread notifications right now: ${unread}.)` : "";
  } catch {
    return "";
  }
}

function stepNeedsApproval(tool: ToolDefinition): boolean {
  return !READ_PERMISSIONS.has(tool.permission);
}

async function buildSteps(
  userId: string,
  plan: PlanStep[]
): Promise<{ steps: Omit<TaskStep, "status" | "output" | "error">[]; notes: string[] }> {
  const manifest = await getManifest("me-prime");
  const steps: Omit<TaskStep, "status" | "output" | "error">[] = [];
  const notes: string[] = [];
  let i = 0;
  for (const call of plan) {
    const tool = TOOLS[call.tool];
    if (!tool) continue;
    const ctx = {
      userId,
      actorType: "user" as const,
      actorId: userId,
      agentKey: "me-prime",
      correlationId: null,
    };
    const decision = authorizeTool(manifest?.manifest ?? null, tool, ctx);
    if (!decision.allowed) {
      notes.push(`${call.tool}: refused — ${decision.reason}`);
      continue;
    }
    const validationError = tool.validate(call.input);
    if (validationError) {
      notes.push(`${call.tool}: the input could not be used (${validationError})`);
      continue;
    }
    const input = stepNeedsApproval(tool) ? { ...call.input, needsApproval: true } : { ...call.input };
    steps.push({
      key: `step${i}`,
      name: call.why ?? tool.description.slice(0, 80),
      tool: call.tool,
      input,
    });
    i += 1;
  }
  return { steps, notes };
}

export interface OmniTurnInput {
  userId: string;
  query: string;
  language?: string;
  history?: Array<{ q: unknown; a: unknown }>;
  scope?: string;
}

export interface OmniTurnResult {
  transmission: string;
  classification: string;
  taskId: string | null;
  needsApproval: boolean;
  steps: Array<{ tool: string; status: string; name: string }>;
}

async function callModel(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, maxTokens: number): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return (completion.choices?.[0]?.message?.content ?? "").trim();
}

function historyMessages(history: OmniTurnInput["history"]): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(history)) return [];
  const out: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const pair of history.slice(-8)) {
    const p = pair as { q?: unknown; a?: unknown };
    if (typeof p?.q === "string" && p.q.trim()) out.push({ role: "user", content: p.q.trim() });
    if (typeof p?.a === "string" && p.a.trim()) out.push({ role: "assistant", content: p.a.trim() });
  }
  return out;
}

async function weaveFinal(
  query: string,
  history: OmniTurnInput["history"],
  memory: string,
  attention: string,
  firstReply: string,
  stepLines: string[]
): Promise<string | null> {
  if (!stepLines.length) return null;
  try {
    const second = await callModel(
      [
        { role: "system", content: SYSTEM + "\n\n" + CATALOG + memory + attention },
        ...historyMessages(history),
        { role: "user", content: query },
        { role: "assistant", content: firstReply || "(tools called)" },
        {
          role: "user",
          content: `Tool results — weave them honestly into one final answer to the visitor (staged items await their yes — ask for it plainly):\n${stepLines.join("\n")}\n\nReply with the SAME strict JSON shape {"reply": "...", "plan": []} — plan empty.`,
        },
      ],
      1400
    );
    if (!second) return null;
    return parsePlan(second).reply || null;
  } catch {
    return null;
  }
}

export async function runOmniTurn(input: OmniTurnInput): Promise<OmniTurnResult> {
  const { userId, query } = input;
  await ensureAgentRegistrySeeded();

  const [memory, attention] = await Promise.all([memoryBlock(userId), attentionLine(userId)]);
  const scopeLine = input.scope ? `\n\nThe visitor stands in the "${input.scope}" field of the house.` : "";
  /* THE FULL CATALOG RIDES ALWAYS — the model plans with the whole
     honest tool surface before it, never from memory of a paragraph. */
  const systemBlock = SYSTEM + "\n\n" + CATALOG + scopeLine + memory + attention;

  const first = await callModel(
    [
      { role: "system", content: systemBlock },
      ...historyMessages(input.history),
      { role: "user", content: query },
    ],
    2000
  );
  if (!first) throw new Error("The field is momentarily quiet. Rest, then try again.");

  let { reply, plan } = parsePlan(first);

  /* THE FORMAT'S OWN PATIENCE — if the first crossing forgot the JSON
     law, one corrective breath asks again; the visitor never sees the
     scaffolding, only the tailored answer. */
  if (plan.length === 0) {
    try {
      const second = await callModel(
        [
          { role: "system", content: systemBlock },
          { role: "user", content: query },
          { role: "assistant", content: first },
          {
            role: "user",
            content:
              "You answered outside the JSON law. Answer again as STRICT JSON only: {\"reply\": \"...\", \"plan\": [{\"tool\": \"...\", \"input\": {...}, \"why\": \"...\"}]} — include a plan step whenever the intention touches making, the shelves, the hall, circles, projects or messages.",
          },
        ],
        1600
      );
      if (second) {
        const reparsed = parsePlan(second);
        if (reparsed.plan.length > 0) {
          reply = reparsed.reply;
          plan = reparsed.plan;
        } else if (!reply && reparsed.reply) {
          reply = reparsed.reply;
        }
      }
    } catch {
      /* the first answer stands */
    }
  }

  if (plan.length === 0) {
    return { transmission: reply || first, classification: "WORLD_BUILDING", taskId: null, needsApproval: false, steps: [] };
  }

  const { steps, notes } = await buildSteps(userId, plan);
  if (steps.length === 0) {
    const noteText = notes.length ? ` (I could not act: ${notes.join("; ")})` : "";
    return { transmission: (reply || first) + noteText, classification: "WORLD_BUILDING", taskId: null, needsApproval: false, steps: [] };
  }

  const needsApproval = steps.some((s) => (s.input as { needsApproval?: boolean } | undefined)?.needsApproval === true);
  const idem = createHash("sha256").update(`${userId}|${query}|${JSON.stringify(steps.map((s) => [s.tool, s.input]))}`).digest("hex");
  const created = await createTask({
    userId,
    agentKey: "me-prime",
    kind: "workflow",
    name: query.slice(0, 100) || "M.E. Prime turn",
    input: { query },
    steps,
    idempotencyKey: `omni:${idem}`,
    approvalRequired: needsApproval,
    timeoutSec: 240,
  });
  if (!created.ok) {
    return {
      transmission: `${reply || first}\n\n(I could not open the work: ${created.message})`,
      classification: "WORLD_BUILDING",
      taskId: null,
      needsApproval: false,
      steps: [],
    };
  }

  await runTask(created.taskId, userId);
  const taskRow = await db.agentTask.findUnique({ where: { id: created.taskId } });
  const finalSteps: TaskStep[] = taskRow ? JSON.parse(taskRow.steps ?? "[]") : [];

  const stepLines = finalSteps.map((s) => {
    const out =
      s.output && typeof s.output === "object" && "data" in (s.output as Record<string, unknown>)
        ? (s.output as { data?: unknown }).data
        : s.output;
    const preview = out === undefined ? "" : ` → ${JSON.stringify(out).slice(0, 400)}`;
    return `[${s.tool}: ${s.status}]${s.error ? ` (${s.error})` : ""}${preview}`;
  });
  for (const n of notes) stepLines.push(`[note] ${n}`);

  const finalReply =
    (await weaveFinal(query, input.history, memory, attention, reply, stepLines)) ??
    `${reply || "The work is done as far as my hands may go."}${
      needsApproval ? "\n\nOne step waits for your yes — confirm it and I finish." : ""
    }${notes.length ? `\n\n(${notes.join("; ")})` : ""}`;

  return {
    transmission: finalReply,
    classification: "WORLD_BUILDING",
    taskId: created.taskId,
    needsApproval,
    steps: finalSteps.map((s) => ({ tool: s.tool, status: s.status, name: s.name })),
  };
}

export type OmniVerdict =
  | { ok: true; result: OmniTurnResult }
  | { ok: false; status: number; message: string };

export async function approveOmniTask(userId: string, taskId: string): Promise<OmniVerdict> {
  const task = await db.agentTask.findFirst({ where: { id: taskId, userId } });
  if (!task) {
    /* THE HONEST TRAIL'S END — a yes that cannot find its work: the
       task was never this visitor's, or its trail has faded. Spoken
       plainly, with the one road that always works: ask anew. */
    return {
      ok: false,
      status: 404,
      message:
        "This work is no longer waiting — its trail has faded, or it belonged to another visit. Ask M.E. Prime anew; what was composed here was never lost — it rests as a draft on your shelf.",
    };
  }
  if (task.status === "completed") {
    return {
      ok: false,
      status: 409,
      message: "This work already crossed — your yes arrived once and every step carried through.",
    };
  }
  if (task.status !== "awaiting_approval") {
    return {
      ok: false,
      status: 409,
      message: `This work stands as "${task.status}" — there is nothing staged to confirm right now.`,
    };
  }
  /* THE HUMAN'S YES — the gate opens through the same approval law
     every agent task walks: approvedAt is carved first, then the work
     resumes and the parked steps carry through. */
  const { approveTask } = await import("@/lib/agents/orchestrator");
  await approveTask(taskId, userId);
  const run = await runTask(taskId, userId);
  const taskRow = await db.agentTask.findUnique({ where: { id: taskId } });
  const finalSteps: TaskStep[] = taskRow ? JSON.parse(taskRow.steps ?? "[]") : [];
  const stepLines = finalSteps.map((s) => {
    const out =
      s.output && typeof s.output === "object" && "data" in (s.output as Record<string, unknown>)
        ? (s.output as { data?: unknown }).data
        : s.output;
    const preview = out === undefined ? "" : ` → ${JSON.stringify(out).slice(0, 400)}`;
    return `[${s.tool}: ${s.status}]${s.error ? ` (${s.error})` : ""}${preview}`;
  });

  let transmission: string;
  let stillWaiting = false;
  if (!run.ok && run.status === "awaiting_approval") {
    stillWaiting = true;
    transmission = "The gate still waits — your yes has not reached the work. Press confirm once more.";
  } else {
    const taskInput = task.input ? (JSON.parse(task.input) as { query?: string }) : {};
    const memory = await memoryBlock(userId);
    const attention = await attentionLine(userId);
    transmission =
      (await weaveFinal(taskInput.query ?? "the confirmed work", [], memory, attention, "The confirmed steps completed.", stepLines)) ??
      "The confirmed work is done — every step carried through.";
  }

  return {
    ok: true,
    result: {
      transmission,
      classification: "WORLD_BUILDING",
      taskId,
      needsApproval: stillWaiting,
      steps: finalSteps.map((s) => ({ tool: s.tool, status: s.status, name: s.name })),
    },
  };
}

/** The visitor's no — the staged work stands down, honestly closed. */
export async function cancelOmniTask(userId: string, taskId: string): Promise<{ ok: boolean; message: string }> {
  const task = await db.agentTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return { ok: false, message: "No such work is waiting under your name." };
  if (!["awaiting_approval", "queued", "running"].includes(task.status)) {
    return { ok: true, message: "This work had already finished or stood down — nothing was cancelled." };
  }
  const { cancelTask } = await import("@/lib/agents/orchestrator");
  const done = await cancelTask(taskId, userId);
  return done
    ? { ok: true, message: "The staged work stands down — nothing was published, nothing sent. Ask anew whenever you wish." }
    : { ok: false, message: "The work could not be stood down — it may have already crossed." };
}
