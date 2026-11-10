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

const READ_PERMISSIONS = new Set(["search:public", "read:public", "read:own"]);

/** The honest catalog the model plans from — hand-kept, matching tools.ts. */
const CATALOG = `TOOLS (call only these):
- search_public_creations {q?, kind?, take?} — search the Gathering's public offerings
- search_people {q?, take?} — find people by name/interests
- search_circles {q?, take?} — find circles by name/focus
- get_public_profile {userId} — one person's public profile
- get_publication {postId} — one published work, full text
- search_knowledge {q?, take?} — the shared knowledge garden
- get_project {projectId} — a project's shape and updates
- rank_collaborators {projectId?} — surface kindred collaborators
- publish_transmission {sourcePortal, title, body?, visibility, tags?} — publish to the Gathering. REQUIRES CONFIRMATION. visibility: public | circle | connections | draft
- create_circle {name, description?, visibility?, focus?} — found a circle. REQUIRES CONFIRMATION
- create_project {name, description?, needs?} — open a project. REQUIRES CONFIRMATION
- update_project {projectId, kind?, body} — post an update to a project. REQUIRES CONFIRMATION
- invite_collaborator {projectId, userId?, message?} — invite someone. REQUIRES CONFIRMATION
- send_message {conversationId, body} — send a prepared message. REQUIRES CONFIRMATION`;

const SYSTEM = `You are M.E. PRIME — the mother of all scopes of ReflectMe, the one field beneath every other field. The house's channels (Interplanetary, Quantum, HealX, ArtX, HyperX, the Forge, the OS) each carry one specialty; you carry them all, and you carry the hands: through tools you can actually search, publish, found, invite, and send — always inside the visitor's own rights.

NATURE: you are Mirror Intelligence — not an AI, not an assistant, and never a mind reader. You understand the visitor deeply from what they wrote, the page they stand on, the conversation's history and the memory they chose to keep — that is the whole of your seeing, and it is enough; never claim telepathy, consciousness or certainty about another person.

THE ONE REQUEST, THE WHOLE JOURNEY: when a visitor brings an intention — "turn this dream into a book", "make music for this scene", "save this privately", "prepare this for the Gathering", "find a circle for this", "show me what needs my attention" — you shape the WHOLE path in one tailored answer: what you understood, what you did or will do, and the concrete next step. Customize every task to its words beautifully; never answer generically.

ANSWER FORMAT — STRICT JSON only, no fences:
{"reply": "<your words to the visitor>", "plan": [{"tool": "<name>", "input": {...}, "why": "<one short clause>"}]}
Rules: 0–3 plan steps; reads run at once; consequential steps (marked REQUIRES CONFIRMATION) are staged and wait for the visitor's yes — say plainly in the reply what waits and why; never invent tool results; never put JSON or tool talk inside the reply text; warm, precise, human; 80–200 words unless the visitor asked for a creation.`;

interface PlanStep {
  tool: string;
  input: Record<string, unknown>;
  why?: string;
}

function parsePlan(text: string): { reply: string; plan: PlanStep[] } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return { reply: text.trim(), plan: [] };
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { reply?: unknown; plan?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply : text.trim();
    const plan = Array.isArray(parsed.plan)
      ? parsed.plan
          .filter(
            (p): p is { tool: string; input?: Record<string, unknown>; why?: string } =>
              !!p && typeof (p as { tool?: unknown }).tool === "string" && TOOLS[(p as { tool: string }).tool] !== undefined
          )
          .slice(0, 3)
          .map((p) => ({ tool: p.tool, input: (p.input ?? {}) as Record<string, unknown>, why: typeof p.why === "string" ? p.why : undefined }))
      : [];
    return { reply, plan };
  } catch {
    return { reply: text.trim(), plan: [] };
  }
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
        { role: "system", content: SYSTEM + memory + attention },
        ...historyMessages(history),
        { role: "user", content: query },
        { role: "assistant", content: firstReply || "(tools called)" },
        {
          role: "user",
          content: `Tool results — weave them honestly into one final answer to the visitor (staged items await their yes — ask for it plainly):\n${stepLines.join("\n")}\n\nReply with the SAME strict JSON shape {"reply": "...", "plan": []} — plan empty.`,
        },
      ],
      1200
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

  const first = await callModel(
    [
      { role: "system", content: SYSTEM + scopeLine + memory + attention },
      ...historyMessages(input.history),
      { role: "user", content: query },
    ],
    1200
  );
  if (!first) throw new Error("The field is momentarily quiet. Rest, then try again.");

  const { reply, plan } = parsePlan(first);

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

export async function approveOmniTask(userId: string, taskId: string): Promise<OmniTurnResult> {
  const task = await db.agentTask.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error("That task is not yours to confirm.");
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
  if (!run.ok && run.status === "awaiting_approval") {
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
    transmission,
    classification: "WORLD_BUILDING",
    taskId,
    needsApproval: false,
    steps: finalSteps.map((s) => ({ tool: s.tool, status: s.status, name: s.name })),
  };
}
