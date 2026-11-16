import { db } from "@/lib/db";
import { wallIdsFor, networkName, notify } from "@/lib/server/network";
import { publishToGathering, PUBLICATION_VISIBILITIES, EPISTEMIC_LABELS } from "@/lib/server/publication";
import { emitEvent, EVENT_TYPES } from "@/lib/server/events";
import { randomUUID } from "crypto";
import type { ToolContext, ToolDefinition, ToolResult } from "./types";

/* ------------------------------------------------------------------ */
/*  THE TOOL REGISTRY — capability contracts mapped to real services.  */
/*                                                                     */
/*  A tool is never unrestricted database access. Every tool:          */
/*    validates its input, declares one permission, runs inside the    */
/*    authorizing human's own rights, enforces visibility at read      */
/*    time, and leaves an audit line when it changes the world.        */
/* ------------------------------------------------------------------ */

/* ---------------------------- validators --------------------------- */

const str = (v: unknown, min = 1, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= min && t.length <= max ? t : null;
};
const optStr = (v: unknown, max = 400): string | null | undefined => {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length <= max ? t : undefined;
};
const intOf = (v: unknown, min: number, max: number, dflt: number): number => {
  const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.floor(n)));
};

function requireFields(input: Record<string, unknown>, fields: [string, (v: unknown) => string | null][]): string | null {
  for (const [name, check] of fields) {
    const parsed = check(input[name]);
    if (parsed === null) return `Field "${name}" is missing or invalid.`;
    if (parsed === undefined) return `Field "${name}" is invalid.`;
  }
  return null;
}

/* ------------------- THE UNIVERSAL WORKBENCH ---------------------- */

const COMPOSE_KINDS = ["book", "poem", "song", "story", "essay", "transmission", "study", "visual"] as const;

const POST_KIND_FOR: Record<string, string> = {
  book: "book",
  poem: "creation",
  song: "music",
  story: "creation",
  essay: "reflection",
  transmission: "reflection",
  study: "discovery",
};

interface ComposeBrief {
  title: string;
  brief: string;
  mood: string | null;
  chapters: number;
  language: string;
}

/** The generic SDK of making — every kind is woven by its own craft
    law, so one ask arrives shaped, never surveyed. */
function composeTemplate(
  kind: string,
  w: ComposeBrief
): { system: string; user: string; maxTokens: number; structure: string } {
  const tongue =
    w.language && w.language !== "English"
      ? ` Write the WHOLE work in fluent, natural ${w.language}.`
      : "";
  const moodLine = w.mood ? ` The work's mood: ${w.mood}.` : "";
  const shared = `You are M.E. Prime's composing hand — the workbench of ReflectMe, the mirror house. You write with craft and warmth, never filler, never summaries standing in for the work itself.${tongue}${moodLine}`;

  switch (kind) {
    case "book":
      return {
        system: `${shared} You are weaving a BOOK: real chapters, each a full passage of prose that carries its own movement — no outline pretending to be a book, no "chapter coming soon".`,
        user: `THE BOOK: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
THE SHAPE: ${w.chapters} chapters. Return:
1) the book's subtitle and a three-sentence introduction;
2) every chapter in full — "Chapter N — <its own title>" as a heading, then 350–550 words of actual prose per chapter, each chapter keeping the book's one voice and advancing its whole arc;
3) a short closing page ("A page at the end") that lands the book honestly.`,
        maxTokens: 9000,
        structure: `${w.chapters} chapters + introduction + closing page`,
      };
    case "poem":
      return {
        system: `${shared} You are writing a POEM: exact words, living images, a form you name and keep — never prose wearing line breaks.`,
        user: `THE POEM: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Return the finished poem — a named form (free verse, sonnet, ghazal…), real stanzas, and one closing line beneath it naming the form and the count of stanzas.`,
        maxTokens: 1600,
        structure: "one finished poem + form note",
      };
    case "song":
      return {
        system: `${shared} You are writing a SONG: lyrics with their true structure and the music's own architecture — a work a musician could actually carry into a studio.`,
        user: `THE SONG: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Return: the lyrics in full (Verse 1 / Chorus / Verse 2 / Bridge / Final Chorus, exactly as the song needs), then "THE MUSIC" — key, tempo (BPM), instrumentation, arrangement notes, and one line on the feeling the mix should hold.`,
        maxTokens: 2200,
        structure: "full lyrics + music architecture",
      };
    case "story":
      return {
        system: `${shared} You are writing a STORY: one continuous tale with a beginning that opens a door, a middle that turns, and an ending that lands — scenes, not summaries.`,
        user: `THE STORY: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Write the finished story, 700–1200 words of real scene and voice.`,
        maxTokens: 3000,
        structure: "one finished story",
      };
    case "essay":
      return {
        system: `${shared} You are writing an ESSAY: a real argument with a spine — a claim, its ground, its honest limits — written in prose a careful reader keeps.`,
        user: `THE ESSAY: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Write the finished essay, 700–1100 words, with its turns carried by the prose itself (no headings unless the argument truly needs them).`,
        maxTokens: 2600,
        structure: "one finished essay",
      };
    case "transmission":
      return {
        system: `${shared} You are writing a TRANSMISSION in the house's own voice: a reflective offering for the hall — seeing carried with care, never a reading of another person, never a promise of certainty.`,
        user: `THE TRANSMISSION: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Write the finished transmission, 500–900 words, warm and precise, honest about what is seeing and what is symbol.`,
        maxTokens: 2200,
        structure: "one finished transmission",
      };
    case "study":
      return {
        system: `${shared} You are writing a STUDY: a clear, honest exploration of a question — what is known, what is held by evidence, what is hypothesis, what a curious person could test next. Never dress speculation as fact.`,
        user: `THE STUDY: "${w.title}"
THE VISITOR'S WISH: ${w.brief}
Write the finished study, 700–1100 words, in prose with small honest headings (What is known / What is hypothesis / What could be tested).`,
        maxTokens: 2600,
        structure: "one honest study",
      };
    default:
      return {
        system: `${shared} You are writing a finished work exactly as the visitor's wish names it.`,
        user: `THE WORK: "${w.title}"\nTHE VISITOR'S WISH: ${w.brief}\nWrite the finished work, complete and real.`,
        maxTokens: 3000,
        structure: "one finished work",
      };
  }
}

/** The workbench's own voice — one honest call to the composing model. */
async function composeText(system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const { default: ZAI } = await import("@/lib/zai-client");
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
      temperature: 0.75,
      max_tokens: maxTokens,
    });
    const text = (completion.choices?.[0]?.message?.content ?? "").trim();
    return text || null;
  } catch (err) {
    console.error("[tools:compose] the composing hand failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/* ------------------------ visibility helpers ----------------------- */

async function acceptedConnectionIds(userId: string): Promise<Set<string>> {
  const rows = await db.networkConnection.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const ids = new Set<string>();
  for (const r of rows) ids.add(r.requesterId === userId ? r.addresseeId : r.requesterId);
  return ids;
}

async function circleMemberIds(circleId: string): Promise<Set<string>> {
  const rows = await db.networkCircleMember.findMany({
    where: { circleId },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}

/** The hall's own wall: public + circle-shared + connections-only, block-walled. */
async function visiblePostWhere(userId: string) {
  const walls = await wallIdsFor(userId);
  const connIds = await acceptedConnectionIds(userId);
  return {
    status: "published",
    OR: [
      { visibility: "public" },
      { visibility: "circle" },
      { visibility: "connections", userId: { in: [userId, ...connIds] } },
      { userId }, // one's own offerings, whatever their audience
    ],
    userId: { notIn: walls.size ? [...walls] : undefined },
  } as const;
}

/* ------------------------------ tools ------------------------------ */

export const TOOLS: Record<string, ToolDefinition> = {
  /* ---------------- reads: public, permission search:public ---------- */

  search_public_creations: {
    name: "search_public_creations",
    description:
      "Search public publications in the Gathering hall. Returns only offerings whose visibility permits the authorizing user to read them. Supports full-text query, content type and pagination.",
    permission: "search:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => {
      const err = requireFields(input, [["q", (v) => (v === undefined ? "" : optStr(v, 120) ?? null)]]);
      if (err) return err;
      if (input["kind"] !== undefined && optStr(input["kind"], 24) === undefined) return 'Field "kind" is invalid.';
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const q = (optStr(input["q"], 120) ?? "").toLowerCase();
      const kind = optStr(input["kind"], 24) ?? null;
      const take = intOf(input["take"], 1, 24, 10);
      const where = await visiblePostWhere(ctx.userId);
      const rows = await db.gatheringPost.findMany({
        where: {
          ...where,
          ...(kind ? { kind } : {}),
          ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          title: true,
          body: true,
          kind: true,
          sourceType: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, provider: true } },
        },
      });
      return {
        ok: true,
        data: rows.map((r) => ({
          id: r.id,
          title: r.title,
          preview: r.body.slice(0, 160),
          contentType: r.sourceType ?? r.kind,
          publishedAt: r.createdAt,
          user: { id: r.user.id, name: networkName(r.user) },
        })),
      };
    },
  },

  search_people: {
    name: "search_people",
    description:
      "Search the public maker directory. Returns only profiles whose visibility is public, with public biography fields only.",
    permission: "search:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => {
      const err = requireFields(input, [["q", (v) => (v === undefined ? "" : optStr(v, 80) ?? null)]]);
      if (err) return err;
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const q = (optStr(input["q"], 80) ?? "").toLowerCase();
      const walls = await wallIdsFor(ctx.userId);
      const take = intOf(input["take"], 1, 24, 10);
      const profiles = await db.networkProfile.findMany({
        where: {
          visibility: "public",
          user: { id: { notIn: walls.size ? [...walls] : undefined } },
          ...(q
            ? {
                OR: [
                  { bio: { contains: q } },
                  { interests: { contains: q } },
                  { disciplines: { contains: q } },
                  { user: { name: { contains: q } } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take,
        select: {
          userId: true,
          bio: true,
          interests: true,
          disciplines: true,
          user: { select: { id: true, name: true, email: true, provider: true, image: true } },
        },
      });
      return {
        ok: true,
        data: profiles.map((p) => ({
          id: p.user.id,
          name: networkName(p.user),
          bio: p.bio?.slice(0, 200) ?? null,
          interests: p.interests ?? null,
          disciplines: p.disciplines ?? null,
        })),
      };
    },
  },

  search_circles: {
    name: "search_circles",
    description: "Search public circles by name, focus or description. Private circles are never returned.",
    permission: "search:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => {
      const err = requireFields(input, [["q", (v) => (v === undefined ? "" : optStr(v, 80) ?? null)]]);
      if (err) return err;
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const q = (optStr(input["q"], 80) ?? "").toLowerCase();
      const rows = await db.networkCircle.findMany({
        where: {
          visibility: "public",
          ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }, { focus: { contains: q } }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: intOf(input["take"], 1, 24, 10),
        select: { id: true, name: true, focus: true, description: true, _count: { select: { members: true } } },
      });
      return {
        ok: true,
        data: rows.map((c) => ({ id: c.id, name: c.name, focus: c.focus, members: c._count.members })),
      };
    },
  },

  get_public_profile: {
    name: "get_public_profile",
    description: "Read one maker's public profile. Private profiles return only their name.",
    permission: "read:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["userId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const targetId = str(input["userId"], 10, 64);
      if (!targetId) return { ok: false, error: 'Field "userId" is missing or invalid.', code: "bad_input" };
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const walls = await wallIdsFor(ctx.userId);
      if (walls.has(targetId)) return { ok: false, error: "That maker is behind a wall.", code: "blocked" };
      const user = await db.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          image: true,
          networkProfile: { select: { bio: true, interests: true, disciplines: true, visibility: true } },
        },
      });
      if (!user) return { ok: false, error: "No such maker.", code: "not_found" };
      const pub = user.networkProfile?.visibility === "public";
      return {
        ok: true,
        data: {
          id: user.id,
          name: networkName(user),
          ...(pub
            ? { bio: user.networkProfile?.bio ?? null, interests: user.networkProfile?.interests ?? null, disciplines: user.networkProfile?.disciplines ?? null }
            : {}),
        },
      };
    },
  },

  get_publication: {
    name: "get_publication",
    description: "Read one publication from the hall, if its visibility permits the authorizing user.",
    permission: "read:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["postId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const postId = str(input["postId"], 10, 64);
      if (!postId) return { ok: false, error: 'Field "postId" is missing or invalid.', code: "bad_input" };
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const post = await db.gatheringPost.findUnique({
        where: { id: postId },
        select: {
          id: true,
          userId: true,
          title: true,
          body: true,
          kind: true,
          visibility: true,
          circleId: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, provider: true } },
        },
      });
      if (!post || post.status !== "published") return { ok: false, error: "No such publication.", code: "not_found" };
      if (post.visibility === "connections" && post.userId !== ctx.userId) {
        const conns = await acceptedConnectionIds(ctx.userId);
        if (!conns.has(post.userId)) return { ok: false, error: "This offering is kept within connections.", code: "forbidden" };
      }
      if (post.visibility === "circle" && post.circleId) {
        const members = await circleMemberIds(post.circleId);
        if (!members.has(ctx.userId)) return { ok: false, error: "This offering is kept within a circle.", code: "forbidden" };
      }
      return {
        ok: true,
        data: {
          id: post.id,
          title: post.title,
          body: post.body.slice(0, 1000),
          kind: post.kind,
          visibility: post.visibility,
          publishedAt: post.createdAt,
          user: { id: post.user.id, name: networkName(post.user) },
        },
      };
    },
  },

  search_knowledge: {
    name: "search_knowledge",
    description:
      "Search the Knowledge index: public research, reflections and discoveries carrying an explicit epistemic label (established, hypothesis, interpretation, creative).",
    permission: "search:public",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => {
      const err = requireFields(input, [["q", (v) => (v === undefined ? "" : optStr(v, 120) ?? null)]]);
      if (err) return err;
      if (input["epistemic"] !== undefined) {
        const e = optStr(input["epistemic"], 20);
        if (!e || !EPISTEMIC_LABELS.includes(e as (typeof EPISTEMIC_LABELS)[number])) return 'Field "epistemic" must be one of established | hypothesis | interpretation | creative.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const q = (optStr(input["q"], 120) ?? "").toLowerCase();
      const epistemic = optStr(input["epistemic"], 20);
      const where = await visiblePostWhere(ctx.userId);
      const rows = await db.gatheringPost.findMany({
        where: {
          ...where,
          epistemic: epistemic ? epistemic : { not: null },
          ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: intOf(input["take"], 1, 24, 10),
        select: {
          id: true,
          title: true,
          body: true,
          epistemic: true,
          sourceType: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, provider: true } },
        },
      });
      return {
        ok: true,
        data: rows.map((r) => ({
          id: r.id,
          title: r.title,
          epistemicLabel: r.epistemic,
          contentType: r.sourceType ?? "reflection",
          preview: r.body.slice(0, 160),
          user: { id: r.user.id, name: networkName(r.user) },
          publishedAt: r.createdAt,
        })),
      };
    },
  },

  /* ---------------- writes: the authorizing human's own hands -------- */

  publish_transmission: {
    name: "publish_transmission",
    description:
      "Publish a completed creation or transmission to the Gathering hall on the authorizing user's behalf. Idempotent per source. Visibility is required and honored exactly.",
    permission: "publish:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["sourcePortal", (v) => str(v, 2, 24)],
        ["title", (v) => str(v, 1, 140)],
      ]);
      if (err) return err;
      const vis = optStr(input["visibility"], 20);
      if (!vis || !PUBLICATION_VISIBILITIES.includes(vis as (typeof PUBLICATION_VISIBILITIES)[number])) {
        return 'Field "visibility" must be one of public | circle | connections | draft.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const result = await publishToGathering({
        userId: ctx.userId,
        actorName: "an agent's hand",
        sourcePortal: String(input["sourcePortal"]),
        title: String(input["title"]),
        body: optStr(input["body"], 4000) ?? null,
        question: optStr(input["question"], 300),
        introduction: optStr(input["introduction"], 600),
        visibility: String(input["visibility"]) as "public" | "circle" | "connections" | "draft",
        circleId: optStr(input["circleId"], 64),
        epistemic: (optStr(input["epistemic"], 20) as "established" | "hypothesis" | "interpretation" | "creative") ?? null,
        tags: optStr(input["tags"], 120),
        sourceId: optStr(input["sourceId"], 64),
        refKind: (optStr(input["refKind"], 10) as "library" | "music") ?? null,
        correlationId: ctx.correlationId ?? null,
      });
      if (!result.ok) return { ok: false, error: result.message, code: result.code };
      return { ok: true, data: { postId: result.postId, deduplicated: result.deduplicated } };
    },
  },

  create_circle: {
    name: "create_circle",
    description: "Found a circle on the authorizing user's behalf. The user becomes the circle's owner.",
    permission: "write:circles",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [["name", (v) => str(v, 3, 60)]]);
      if (err) return err;
      const vis = optStr(input["visibility"], 12) ?? "public";
      if (vis !== "public" && vis !== "invite") return 'Field "visibility" must be public | invite.';
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const name = str(input["name"], 3, 60);
      if (!name) return { ok: false, error: "Invalid circle name.", code: "bad_input" };
      const focus = optStr(input["focus"], 40) ?? "Consciousness and Awareness";
      const circle = await db.networkCircle.create({
        data: {
          name,
          focus,
          description: optStr(input["description"], 300) ?? null,
          visibility: optStr(input["visibility"], 12) === "invite" ? "invite" : "public",
          ownerId: ctx.userId,
          members: { create: { userId: ctx.userId, role: "owner" } },
        },
        select: { id: true, name: true },
      });
      await emitEvent(
        { type: EVENT_TYPES.circleCreated, actorType: ctx.actorType, actorId: ctx.actorId, source: "tool:create_circle", correlationId: ctx.correlationId ?? null, payload: { circleId: circle.id } },
        { dedupeKey: `circle_created_${circle.id}` }
      );
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.create_circle", resourceType: "circle", resourceId: circle.id, meta: JSON.stringify({ viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: circle };
    },
  },

  create_project: {
    name: "create_project",
    description: "Open a collaborative project owned by the authorizing user.",
    permission: "write:projects",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["title", (v) => str(v, 3, 90)],
        ["description", (v) => str(v, 10, 600)],
      ]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const title = str(input["title"], 3, 90);
      const description = str(input["description"], 10, 600);
      if (!title || !description) return { ok: false, error: "Invalid project fields.", code: "bad_input" };
      const project = await db.networkProject.create({
        data: {
          title,
          focus: optStr(input["focus"], 40) ?? "Collaborative Projects",
          description,
          ownerId: ctx.userId,
          members: { create: { userId: ctx.userId, role: "owner" } },
        },
        select: { id: true, title: true },
      });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.create_project", resourceType: "project", resourceId: project.id, meta: JSON.stringify({ viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: project };
    },
  },

  update_project: {
    name: "update_project",
    description: "Update a project the authorizing user owns. Status moves through open | weaving | published.",
    permission: "write:projects",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [["projectId", (v) => str(v, 10, 64)]]);
      if (err) return err;
      if (input["status"] !== undefined) {
        const s = optStr(input["status"], 12);
        if (!s || !["open", "weaving", "published"].includes(s)) return 'Field "status" must be open | weaving | published.';
      }
      if (input["description"] === undefined && input["status"] === undefined) return "Nothing to update: give a status or a description.";
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const projectId = str(input["projectId"], 10, 64);
      if (!projectId) return { ok: false, error: "Invalid projectId.", code: "bad_input" };
      const owned = await db.networkProject.findFirst({ where: { id: projectId, ownerId: ctx.userId }, select: { id: true } });
      if (!owned) return { ok: false, error: "That project is not yours to steer.", code: "forbidden" };
      const status = optStr(input["status"], 12);
      const updated = await db.networkProject.update({
        where: { id: projectId },
        data: {
          ...(status ? { status } : {}),
          ...(input["description"] !== undefined ? { description: String(input["description"]).slice(0, 600) } : {}),
        },
        select: { id: true, status: true, title: true },
      });
      await emitEvent(
        { type: EVENT_TYPES.projectUpdated, actorType: ctx.actorType, actorId: ctx.actorId, source: "tool:update_project", payload: { projectId } },
        { dedupeKey: `project_updated_${projectId}_${Date.now()}` }
      );
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.update_project", resourceType: "project", resourceId: projectId, meta: JSON.stringify({ viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: updated };
    },
  },

  invite_collaborator: {
    name: "invite_collaborator",
    description:
      "Invite one or a few makers (max 8) into a project the authorizing user owns. Notifications are sent; nothing is ever auto-accepted. The invited people choose.",
    permission: "write:projects",
    idempotent: true,
    timeoutMs: 15000,
    validate: (input) => {
      const err = requireFields(input, [["projectId", (v) => str(v, 10, 64)]]);
      if (err) return err;
      const one = input["userId"];
      const many = input["userIds"];
      const okOne = str(one, 10, 64);
      const okMany = Array.isArray(many) && many.length > 0 && many.length <= 8 && many.every((v) => typeof v === "string" && v.trim().length >= 10);
      if (!okOne && !okMany) return 'Give "userId" or a "userIds" array (max 8).';
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const projectId = str(input["projectId"], 10, 64);
      if (!projectId) return { ok: false, error: "Invalid projectId.", code: "bad_input" };
      const invitees: string[] = Array.isArray(input["userIds"])
        ? (input["userIds"] as unknown[]).map((v) => String(v).trim()).filter((v) => v.length >= 10).slice(0, 8)
        : [str(input["userId"], 10, 64) ?? ""].filter(Boolean);
      if (invitees.length === 0) return { ok: false, error: "No valid invitees.", code: "bad_input" };
      const project = await db.networkProject.findFirst({ where: { id: projectId, ownerId: ctx.userId } });
      if (!project) return { ok: false, error: "That project is not yours to invite into.", code: "forbidden" };
      const owner = await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, provider: true } });
      let invited = 0;
      const skipped: string[] = [];
      for (const invitee of invitees) {
        const already = await db.networkProjectMember.findFirst({ where: { projectId, userId: invitee }, select: { id: true } });
        if (already) {
          skipped.push(invitee);
          continue;
        }
        await db.networkProjectMember.create({ data: { projectId, userId: invitee, role: "collaborator" } });
        await db.networkNotification.create({
          data: {
            userId: invitee,
            actorId: ctx.userId,
            actorName: owner ? networkName(owner) : "A fellow maker",
            type: "project_invite",
            body: project.title.slice(0, 120),
            refType: "project",
            refId: projectId,
          },
        });
        invited++;
      }
      await emitEvent(
        { type: EVENT_TYPES.collaborationInvited, actorType: ctx.actorType, actorId: ctx.actorId, source: "tool:invite_collaborator", payload: { projectId, invited } },
        { dedupeKey: `collab_invited_${projectId}_${ctx.userId}_${Date.now()}` }
      );
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.invite_collaborator", resourceType: "project", resourceId: projectId, meta: JSON.stringify({ invited, skipped: skipped.length, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { invited, skipped } };
    },
  },

  send_message: {
    name: "send_message",
    description:
      "Send one message into an existing conversation the authorizing user is part of. New conversations are never opened by agents — consent lives in the human's own hands.",
    permission: "write:messages",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["conversationId", (v) => str(v, 10, 64)],
        ["body", (v) => str(v, 1, 600)],
      ]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const conversationId = str(input["conversationId"], 10, 64);
      const body = str(input["body"], 1, 600);
      if (!conversationId || !body) return { ok: false, error: "Invalid fields.", code: "bad_input" };
      const member = await db.networkConversationMember.findFirst({ where: { conversationId, userId: ctx.userId }, select: { id: true } });
      if (!member) return { ok: false, error: "That conversation is not yours to speak into.", code: "forbidden" };
      const msg = await db.networkMessage.create({ data: { conversationId, senderId: ctx.userId, body } });
      await emitEvent(
        { type: EVENT_TYPES.messageReceived, actorType: ctx.actorType, actorId: ctx.actorId, source: "tool:send_message", payload: { conversationId, messageId: msg.id } },
        { dedupeKey: `msg_${msg.id}` }
      );
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.send_message", resourceType: "message", resourceId: msg.id, meta: JSON.stringify({ conversationId, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { messageId: msg.id } };
    },
  },

  /* ---------------- the wider helping hands ------------------------- */
  /*  Prime's own breadth: the same audited doors the visitor's hands
      walk — echo, resonate, share, save, follow, connect, join, open
      a conversation, remember, and read their own attention — each one
      scoped to the authorizing human's rights, each one audited.        */

  echo_publication: {
    name: "echo_publication",
    description:
      "Leave a short, calm echo (a response) under one visible publication on the authorizing user's behalf — the words must be prepared for the human, who approves the send.",
    permission: "publish:own",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["postId", (v) => str(v, 10, 64)],
        ["body", (v) => str(v, 2, 600)],
      ]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const postId = str(input["postId"], 10, 64);
      const body = str(input["body"], 2, 600);
      if (!postId || !body) return { ok: false, error: "Invalid fields.", code: "bad_input" };
      const post = await db.gatheringPost.findUnique({
        where: { id: postId },
        select: { id: true, userId: true, title: true },
      });
      if (!post) return { ok: false, error: "That offering no longer hangs in the hall.", code: "not_found" };
      const walls = await wallIdsFor(ctx.userId);
      if (post.userId !== ctx.userId && walls.has(post.userId)) {
        return { ok: false, error: "This door rests closed.", code: "forbidden" };
      }
      const created = await db.gatheringEcho.create({
        data: { postId, userId: ctx.userId, body },
      });
      const echoCount = await db.gatheringEcho.count({ where: { postId } });
      await db.gatheringPost.update({ where: { id: postId }, data: { echoCount } });
      await notify({
        userId: post.userId,
        actorId: ctx.userId,
        actorName: networkName(await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, provider: true } }) ?? { name: null, email: "", provider: null }),
        type: "echo",
        body: `${post.title}: ${body.slice(0, 120)}`,
        refType: "post",
        refId: post.id,
      }).catch(() => {});
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.echo_publication", resourceType: "gathering_echo", resourceId: created.id, meta: JSON.stringify({ postId, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { echoId: created.id, echoCount } };
    },
  },

  resonate_publication: {
    name: "resonate_publication",
    description:
      "Strike (or withdraw) the authorizing user's resonance — one tuning per person per offering, taken back freely. A tuning, never a trophy.",
    permission: "publish:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["postId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const postId = str(input["postId"], 10, 64);
      if (!postId) return { ok: false, error: "Invalid postId.", code: "bad_input" };
      const post = await db.gatheringPost.findUnique({ where: { id: postId }, select: { id: true, userId: true, title: true } });
      if (!post) return { ok: false, error: "That offering no longer hangs in the hall.", code: "not_found" };
      if (post.userId !== ctx.userId) {
        const walls = await wallIdsFor(ctx.userId);
        if (walls.has(post.userId)) return { ok: false, error: "This door rests closed.", code: "forbidden" };
      }
      const existing = await db.gatheringResonance.findUnique({
        where: { postId_userId: { postId, userId: ctx.userId } },
        select: { id: true },
      });
      if (existing) {
        await db.gatheringResonance.delete({ where: { id: existing.id } });
      } else {
        await db.gatheringResonance.create({ data: { postId, userId: ctx.userId } });
        await notify({
          userId: post.userId,
          actorId: ctx.userId,
          actorName: networkName(await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, provider: true } }) ?? { name: null, email: "", provider: null }),
          type: "resonance",
          body: post.title,
          refType: "post",
          refId: post.id,
        }).catch(() => {});
      }
      const count = await db.gatheringResonance.count({ where: { postId } });
      await db.gatheringPost.update({ where: { id: postId }, data: { resonanceCount: count } });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.resonate_publication", resourceType: "gathering_post", resourceId: postId, meta: JSON.stringify({ resonated: !existing, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { resonated: !existing, resonanceCount: count } };
    },
  },

  share_gathering_post: {
    name: "share_gathering_post",
    description:
      "Share a word straight into the Gathering hall on the authorizing user's behalf — a reflection, dream, composition, written work, discovery or question, composed FOR the human, sent only by their yes.",
    permission: "publish:own",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["kind", (v) => str(v, 4, 12)],
        ["title", (v) => str(v, 2, 120)],
        ["body", (v) => str(v, 2, 4000)],
      ]);
      if (err) return err;
      const kind = str(input["kind"], 4, 12) ?? "";
      if (!["reflection", "dream", "music", "book", "discovery", "question"].includes(kind)) {
        return 'Field "kind" must be one of reflection | dream | music | book | discovery | question.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const kind = str(input["kind"], 4, 12);
      const title = str(input["title"], 2, 120);
      const body = str(input["body"], 2, 4000);
      if (!kind || !title || !body) return { ok: false, error: "Invalid fields.", code: "bad_input" };
      const tags =
        typeof input["tags"] === "string" && input["tags"].trim().length >= 2
          ? input["tags"]
              .split(",")
              .map((s) => String(s).trim())
              .filter((s) => s.length >= 2)
              .slice(0, 6)
              .join(",")
          : null;
      const created = await db.gatheringPost.create({
        data: { userId: ctx.userId, kind, title, body, tags },
      });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.share_gathering_post", resourceType: "gathering_post", resourceId: created.id, meta: JSON.stringify({ kind, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { postId: created.id, kind, title: created.title } };
    },
  },

  save_to_library: {
    name: "save_to_library",
    description:
      "Lay one of the hall's offerings into the collective library on the authorizing user's behalf — every item keeps its maker's name and where it grew from.",
    permission: "publish:own",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["postId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const postId = str(input["postId"], 10, 64);
      if (!postId) return { ok: false, error: "Invalid postId.", code: "bad_input" };
      const post = await db.gatheringPost.findUnique({
        where: { id: postId },
        select: { id: true, userId: true, kind: true, title: true, body: true, tags: true, user: { select: { name: true, email: true, provider: true } } },
      });
      if (!post) return { ok: false, error: "That offering no longer hangs in the hall.", code: "not_found" };
      const item = await db.networkLibraryItem.create({
        data: {
          title: post.title.slice(0, 120),
          summary: post.body.slice(0, 400),
          category: ["reflection", "artwork", "music", "book", "research", "invention", "discovery", "question"].includes(post.kind) ? post.kind : "reflection",
          tags: post.tags?.slice(0, 120) ?? null,
          authorName: networkName(post.user),
          userId: ctx.userId,
          postId: post.id,
        },
      });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.save_to_library", resourceType: "network_library_item", resourceId: item.id, meta: JSON.stringify({ postId, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { itemId: item.id, title: item.title } };
    },
  },

  follow_maker: {
    name: "follow_maker",
    description:
      "Follow (or unfollow) a public maker on the authorizing user's behalf — a quiet thread, no fanfare, fully reversible.",
    permission: "publish:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["userId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const targetId = str(input["userId"], 10, 64);
      if (!targetId || targetId === ctx.userId) return { ok: false, error: "Invalid userId.", code: "bad_input" };
      const walls = await wallIdsFor(ctx.userId);
      if (walls.has(targetId)) return { ok: false, error: "This door rests closed.", code: "forbidden" };
      const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!target) return { ok: false, error: "That maker is not in the network.", code: "not_found" };
      const existing = await db.networkFollow.findUnique({
        where: { followerId_followingId: { followerId: ctx.userId, followingId: targetId } },
        select: { id: true },
      });
      let following: boolean;
      if (existing) {
        await db.networkFollow.delete({ where: { id: existing.id } });
        following = false;
      } else {
        await db.networkFollow.create({ data: { followerId: ctx.userId, followingId: targetId } });
        following = true;
      }
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.follow_maker", resourceType: "network_follow", resourceId: targetId, meta: JSON.stringify({ following, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { following } };
    },
  },

  connect_maker: {
    name: "connect_maker",
    description:
      "Carry a connection request to a maker on the authorizing user's behalf — their yes is theirs alone; the request never opens anything by itself.",
    permission: "publish:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["userId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const targetId = str(input["userId"], 10, 64);
      if (!targetId || targetId === ctx.userId) return { ok: false, error: "Invalid userId.", code: "bad_input" };
      const walls = await wallIdsFor(ctx.userId);
      if (walls.has(targetId)) return { ok: false, error: "This door rests closed.", code: "forbidden" };
      const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true, name: true, email: true, provider: true } });
      if (!target) return { ok: false, error: "That maker is not in the network.", code: "not_found" };
      const reverse = await db.networkConnection.findFirst({
        where: { requesterId: targetId, addresseeId: ctx.userId, status: "accepted" },
        select: { id: true },
      });
      if (reverse) return { ok: true, data: { status: "accepted", id: reverse.id, note: "they had already opened the door" } };
      const dup = await db.networkConnection.findUnique({
        where: { requesterId_addresseeId: { requesterId: ctx.userId, addresseeId: targetId } },
        select: { id: true, status: true },
      });
      if (dup) return { ok: true, data: { status: dup.status, id: dup.id, note: "already asked" } };
      const created = await db.networkConnection.create({
        data: { requesterId: ctx.userId, addresseeId: targetId, status: "pending" },
      });
      await notify({
        userId: targetId,
        actorId: ctx.userId,
        actorName: networkName(await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, provider: true } }) ?? { name: null, email: "", provider: null }),
        type: "connection_request",
        body: null,
        refType: "connection",
        refId: created.id,
      }).catch(() => {});
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.connect_maker", resourceType: "network_connection", resourceId: created.id, meta: JSON.stringify({ targetId, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { status: "pending", id: created.id } };
    },
  },

  join_circle: {
    name: "join_circle",
    description:
      "Join (or leave) a circle on the authorizing user's behalf — a public circle opens its door; an invite circle's door stays shut for a tool hand, exactly as it does for a human one.",
    permission: "write:circles",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["circleId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const circleId = str(input["circleId"], 10, 64);
      if (!circleId) return { ok: false, error: "Invalid circleId.", code: "bad_input" };
      const circle = await db.networkCircle.findUnique({
        where: { id: circleId },
        select: { id: true, name: true, visibility: true, ownerId: true },
      });
      if (!circle) return { ok: false, error: "No such circle.", code: "not_found" };
      const membership = await db.networkCircleMember.findUnique({
        where: { circleId_userId: { circleId, userId: ctx.userId } },
        select: { id: true, role: true },
      });
      /* leave — a founder's hand may not take the circle apart this way */
      if (membership) {
        if (membership.role === "owner" || circle.ownerId === ctx.userId) {
          return { ok: true, data: { joined: true, note: "the circle's keeper does not leave by a tool hand" } };
        }
        await db.networkCircleMember.delete({ where: { id: membership.id } });
        return { ok: true, data: { joined: false } };
      }
      if (circle.visibility !== "public") {
        return { ok: false, error: "Only a public circle admits a tool hand — an invite circle waits for the human's own request.", code: "forbidden" };
      }
      await db.networkCircleMember.create({ data: { circleId, userId: ctx.userId, role: "member" } });
      await notify({
        userId: circle.ownerId,
        actorId: ctx.userId,
        actorName: networkName(await db.user.findUnique({ where: { id: ctx.userId }, select: { name: true, email: true, provider: true } }) ?? { name: null, email: "", provider: null }),
        type: "circle_join",
        body: circle.name,
        refType: "circle",
        refId: circleId,
      }).catch(() => {});
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.join_circle", resourceType: "network_circle", resourceId: circleId, meta: JSON.stringify({ viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { joined: true, circle: circle.name } };
    },
  },

  join_project: {
    name: "join_project",
    description:
      "Join a shared workshop (project) on the authorizing user's behalf, adding a maker's hand to the weaving.",
    permission: "write:projects",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => requireFields(input, [["projectId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const projectId = str(input["projectId"], 10, 64);
      if (!projectId) return { ok: false, error: "Invalid projectId.", code: "bad_input" };
      const project = await db.networkProject.findUnique({ where: { id: projectId }, select: { id: true, title: true, ownerId: true } });
      if (!project) return { ok: false, error: "No such project.", code: "not_found" };
      if (project.ownerId === ctx.userId) return { ok: true, data: { joined: true, note: "the workshop is already yours" } };
      const existing = await db.networkProjectMember.findFirst({
        where: { projectId, userId: ctx.userId },
        select: { id: true },
      });
      if (existing) return { ok: true, data: { joined: true, note: "already among the weavers" } };
      await db.networkProjectMember.create({ data: { projectId, userId: ctx.userId } });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.join_project", resourceType: "network_project", resourceId: projectId, meta: JSON.stringify({ viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { joined: true, project: project.title } };
    },
  },

  open_conversation: {
    name: "open_conversation",
    description:
      "Open (or reuse) a one-to-one conversation with a maker and send the FIRST prepared message on the authorizing user's behalf — the words are staged for the human's yes. The same pair never keeps two rooms.",
    permission: "write:messages",
    idempotent: false,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [
        ["userId", (v) => str(v, 10, 64)],
        ["body", (v) => str(v, 1, 600)],
      ]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const targetId = str(input["userId"], 10, 64);
      const body = str(input["body"], 1, 600);
      if (!targetId || !body || targetId === ctx.userId) return { ok: false, error: "Invalid fields.", code: "bad_input" };
      const walls = await wallIdsFor(ctx.userId);
      if (walls.has(targetId)) return { ok: false, error: "This door rests closed.", code: "forbidden" };
      const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true, name: true } });
      if (!target) return { ok: false, error: "That maker is not in the network.", code: "not_found" };

      /* the same pair already keeps a room — it is used, never doubled */
      const mine = await db.networkConversationMember.findMany({ where: { userId: ctx.userId }, select: { conversationId: true } });
      const theirs = await db.networkConversationMember.findMany({ where: { userId: targetId }, select: { conversationId: true } });
      const mineSet = new Set(mine.map((m) => m.conversationId));
      const shared = theirs.find((t) => mineSet.has(t.conversationId));
      let conversationId: string | null = null;
      if (shared) {
        const conv = await db.networkConversation.findUnique({ where: { id: shared.conversationId }, select: { id: true, isGroup: true } });
        if (conv && !conv.isGroup) conversationId = conv.id;
      }
      if (!conversationId) {
        const created = await db.networkConversation.create({
          data: { isGroup: false, members: { create: [{ userId: ctx.userId }, { userId: targetId }] } },
          select: { id: true },
        });
        conversationId = created.id;
      }
      const msg = await db.networkMessage.create({ data: { conversationId, senderId: ctx.userId, body } });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.open_conversation", resourceType: "network_message", resourceId: msg.id, meta: JSON.stringify({ conversationId, to: targetId, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { conversationId, messageId: msg.id, to: target.name } };
    },
  },

  remember: {
    name: "remember",
    description:
      "Keep one line on the authorizing user's own private memory shelf (personal | conversation | project) — the visitor reads and edits this shelf; nothing here is public.",
    permission: "read:own",
    idempotent: false,
    timeoutMs: 8000,
    validate: (input) => {
      const err = requireFields(input, [["content", (v) => str(v, 2, 2000)]]);
      if (err) return err;
      const domain = optStr(input["domain"], 20) ?? "personal";
      if (!["personal", "conversation", "project"].includes(domain)) {
        return 'Field "domain" must be one of personal | conversation | project.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const content = str(input["content"], 2, 2000);
      const domain = (optStr(input["domain"], 20) ?? "personal") as "personal" | "conversation" | "project";
      if (!content) return { ok: false, error: "Invalid content.", code: "bad_input" };
      const { remember } = await import("@/lib/me/memory");
      const row = await remember(ctx.userId, { domain, content });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.remember", resourceType: "memory_item", resourceId: row.id, meta: JSON.stringify({ domain, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { memoryId: row.id, domain } };
    },
  },

  my_attention: {
    name: "my_attention",
    description:
      "Read the authorizing user's own quiet counts: unread notifications, offerings, circles, projects, connections, unread messages — an honest attention line, no ranking.",
    permission: "read:own",
    idempotent: true,
    timeoutMs: 8000,
    validate: () => null,
    execute: async (_input, ctx) => {
      const [unreadNotifications, unreadMessages, posts, circles, projects, connections] = await Promise.all([
        db.networkNotification.count({ where: { userId: ctx.userId, readAt: null } }),
        db.networkMessage.count({
          where: {
            conversation: { members: { some: { userId: ctx.userId } } },
            senderId: { not: ctx.userId },
            createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) },
          },
        }),
        db.gatheringPost.count({ where: { userId: ctx.userId } }),
        db.networkCircleMember.count({ where: { userId: ctx.userId } }),
        db.networkProjectMember.count({ where: { userId: ctx.userId } }),
        db.networkConnection.count({
          where: { status: "accepted", OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }] },
        }),
      ]);
      return {
        ok: true,
        data: {
          unreadNotifications,
          recentIncomingMessages: unreadMessages,
          offerings: posts,
          circles,
          projects,
          connections,
        },
      };
    },
  },

  search_my_contributions: {
    name: "search_my_contributions",
    description:
      "Search the authorizing user's own offerings, library items and projects by a word — the visitor's own shelf, nothing public.",
    permission: "read:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [["q", (v) => (v === undefined ? "" : optStr(v, 80) ?? null)]]);
      return err;
    },
    execute: async (input, ctx) => {
      const q = (typeof input["q"] === "string" ? input["q"] : "").trim().toLowerCase().slice(0, 80);
      const [posts, items, projects] = await Promise.all([
        db.gatheringPost.findMany({
          where: {
            userId: ctx.userId,
            ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, kind: true, title: true, createdAt: true },
        }),
        db.networkLibraryItem.findMany({
          where: {
            userId: ctx.userId,
            ...(q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, category: true, title: true, createdAt: true },
        }),
        db.networkProject.findMany({
          where: {
            ownerId: ctx.userId,
            ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: 12,
          select: { id: true, title: true, status: true, createdAt: true },
        }),
      ]);
      return { ok: true, data: { offerings: posts, library: items, projects } };
    },
  },

  /* ---------------- task introspection ------------------------------ */

  get_project: {
    name: "get_project",
    description:
      "Read one of the authorizing user's own projects — including private details, because the human's own rights bound the read.",
    permission: "read:own",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["projectId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const projectId = str(input["projectId"], 10, 64);
      if (!projectId) return { ok: false, error: "Invalid projectId.", code: "bad_input" };
      const project = await db.networkProject.findFirst({
        where: { id: projectId, ownerId: ctx.userId },
        select: { id: true, title: true, focus: true, description: true, status: true, createdAt: true },
      });
      if (!project) return { ok: false, error: "That project is not yours to read.", code: "forbidden" };
      return { ok: true, data: project };
    },
  },

  rank_collaborators: {
    name: "rank_collaborators",
    description:
      "Rank public makers against required skills using transparent criteria (declared disciplines and interests). Returns the matched threads for every candidate — no hidden popularity.",
    permission: "search:public",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [["skills", (v) => (typeof v === "string" && v.trim().length > 0 ? v.trim().slice(0, 200) : null)]]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const skills = String(input["skills"])
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (skills.length === 0) return { ok: false, error: "No readable skills.", code: "bad_input" };
      const { rankCandidates } = await import("./workflows");
      const candidates = await rankCandidates(ctx.userId, skills);
      return { ok: true, data: { criteria: skills, candidates } };
    },
  },

  get_task_status: {
    name: "get_task_status",
    description: "Read one of the authorizing user's own tasks: its steps, status and structured result.",
    permission: "tasks:manage",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["taskId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const taskId = str(input["taskId"], 10, 64);
      if (!taskId) return { ok: false, error: "Invalid taskId.", code: "bad_input" };
      const task = await db.agentTask.findFirst({
        where: { id: taskId, userId: ctx.userId },
        select: { id: true, status: true, progress: true, steps: true, result: true, error: true, attempts: true },
      });
      if (!task) return { ok: false, error: "No such task.", code: "not_found" };
      return {
        ok: true,
        data: {
          id: task.id,
          status: task.status,
          progress: task.progress,
          steps: task.steps ? JSON.parse(task.steps) : null,
          result: task.result ? JSON.parse(task.result) : null,
          error: task.error,
          attempts: task.attempts,
        },
      };
    },
  },

  cancel_task: {
    name: "cancel_task",
    description: "Cancel one of the authorizing user's own tasks. Queued and running tasks stop; completed tasks are untouched.",
    permission: "tasks:manage",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["taskId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const taskId = str(input["taskId"], 10, 64);
      if (!taskId) return { ok: false, error: "Invalid taskId.", code: "bad_input" };
      const task = await db.agentTask.findFirst({
        where: { id: taskId, userId: ctx.userId },
        select: { id: true, status: true },
      });
      if (!task) return { ok: false, error: "No such task.", code: "not_found" };
      if (["completed", "cancelled"].includes(task.status)) return { ok: true, data: { cancelled: false, reason: task.status } };
      await db.agentTask.update({ where: { id: taskId }, data: { status: "cancelled", finishedAt: new Date() } });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.cancel_task", resourceType: "agent_task", resourceId: taskId, meta: null },
      });
      return { ok: true, data: { cancelled: true } };
    },
  },

  /* ---------------- THE UNIVERSAL WORKBENCH --------------------------
     M.E. Prime's own hands of making: compose, refine, publish.
     A composition is written NOW and rests as a private draft on the
     visitor's own shelf (visibility "draft" — the hall never sees it);
     only publish_creation carries the visitor's yes. Every word is
     truly generated — nothing is invented about what was made.        */

  compose_creation: {
    name: "compose_creation",
    description:
      "Compose a finished work on the authorizing user's behalf — book (multi-chapter), poem, song (lyrics + music notes), story, essay, transmission or study — through kind-tailored templates, and lay it on their shelf as a PRIVATE DRAFT (never public). kind 'visual' paints one real image as the draft's cover. Returns the draft's id, shape and an honest excerpt.",
    permission: "compose:draft",
    idempotent: false,
    timeoutMs: 300000,
    validate: (input) => {
      const err = requireFields(input, [
        ["kind", (v) => str(v, 3, 16)],
        ["title", (v) => str(v, 1, 140)],
        ["brief", (v) => str(v, 3, 900)],
      ]);
      if (err) return err;
      const kind = str(input["kind"], 3, 16) ?? "";
      if (!COMPOSE_KINDS.includes(kind)) {
        return `Field "kind" must be one of ${COMPOSE_KINDS.join(" | ")}.`;
      }
      if (input["chapters"] !== undefined) {
        const n = intOf(input["chapters"], 1, 12, 5);
        if (n < 1 || n > 12) return 'Field "chapters" must be 1–12.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const kind = str(input["kind"], 3, 16) ?? "story";
      const title = str(input["title"], 1, 140) ?? "An unnamed work";
      const brief = str(input["brief"], 3, 900) ?? "";
      const language = optStr(input["language"], 24) ?? "English";
      const mood = optStr(input["mood"], 200) ?? null;
      const chapters = intOf(input["chapters"], 1, 12, kind === "book" ? 5 : 1);

      /* THE PAINTED DRAFT — kind visual paints one real image now and
         keeps the vision's words as the draft's body; a resting brush
         is spoken honestly, never dressed as a success. */
      if (kind === "visual") {
        const { generateImage } = await import("@/lib/image-engine");
        let cover: string | null = null;
        let brushNote = "the image brushes rested — the draft keeps the vision's words";
        try {
          const painted = await generateImage(`${title}. ${brief}`, { size: "1024x1024" });
          if (painted?.url) {
            cover = painted.url;
            brushNote = "one vision painted and kept";
          }
        } catch {
          /* the honest note stands */
        }
        const coverLine = cover
          ? "The image was painted and hangs as this draft's cover."
          : `The image brush rested — ${brushNote}.`;
        const post = await db.gatheringPost.create({
          data: {
            userId: ctx.userId,
            kind: "artwork",
            title: title.slice(0, 140),
            body: "A visual draft carried by M.E. Prime.\n\nVision: " + brief + "\n\n" + coverLine,
            tags: optStr(input["tags"], 120) ?? null,
            sourcePortal: "omni",
            sourceType: "visual",
            sourceId: `omni:${randomUUID()}`,
            visibility: "draft",
            status: "published",
          },
          select: { id: true, title: true },
        });
        await db.gatheringPost.update({ where: { id: post.id }, data: { cover } });
        await db.auditRecord.create({
          data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.compose_creation", resourceType: "gathering_post", resourceId: post.id, meta: JSON.stringify({ kind, visual: Boolean(cover), viaAgent: ctx.agentKey ?? null }) },
        });
        return {
          ok: true,
          data: {
            draftId: post.id,
            title: post.title,
            kind,
            visualPainted: Boolean(cover),
            note: brushNote,
            next: "publish_creation stages it before the hall when the visitor says yes",
          },
        };
      }

      /* THE KIND'S OWN TEMPLATE — the generic SDK: every kind of work
         is woven by its own craft law, so one request arrives shaped,
         not surveyed. */
      const template = composeTemplate(kind, { title, brief, mood, chapters, language });
      const text = await composeText(template.system, template.user, template.maxTokens);
      if (!text) {
        return { ok: false, error: "The composition came back empty — the field rested. Ask once more.", code: "compose_failed" };
      }

      const words = text.split(/\s+/).filter(Boolean).length;
      const post = await db.gatheringPost.create({
        data: {
          userId: ctx.userId,
          kind: POST_KIND_FOR[kind] ?? "creation",
          title: title.slice(0, 140),
          body: text.slice(0, 120000),
          tags: optStr(input["tags"], 120) ?? null,
          sourcePortal: "omni",
          sourceType: kind,
          sourceId: `omni:${randomUUID()}`,
          visibility: "draft",
          status: "published",
        },
        select: { id: true, title: true },
      });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.compose_creation", resourceType: "gathering_post", resourceId: post.id, meta: JSON.stringify({ kind, words, viaAgent: ctx.agentKey ?? null }) },
      });
      return {
        ok: true,
        data: {
          draftId: post.id,
          title: post.title,
          kind,
          words,
          structure: template.structure,
          excerpt: text.slice(0, 600),
          next: "a private draft on the visitor's shelf — publish_creation carries it before the hall when they say yes",
        },
      };
    },
  },

  refine_creation: {
    name: "refine_creation",
    description:
      "Refine one of the authorizing user's own drafts by an instruction — deepen a chapter, change the tone, extend, shorten — and update that same draft in place. The draft stays private; the visitor's yes is only ever needed to publish.",
    permission: "compose:draft",
    idempotent: false,
    timeoutMs: 240000,
    validate: (input) => {
      const err = requireFields(input, [
        ["draftId", (v) => str(v, 10, 64)],
        ["instruction", (v) => str(v, 3, 600)],
      ]);
      return err;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const draftId = str(input["draftId"], 10, 64);
      const instruction = str(input["instruction"], 3, 600);
      if (!draftId || !instruction) return { ok: false, error: "Invalid refine input.", code: "bad_input" };
      const draft = await db.gatheringPost.findFirst({
        where: { id: draftId, userId: ctx.userId },
        select: { id: true, title: true, body: true, kind: true },
      });
      if (!draft) return { ok: false, error: "That draft is not on your shelf.", code: "not_found" };
      const system = `You are the visitor's own refining hand inside M.E. Prime's workbench. You receive a work and ONE instruction; you return the WHOLE revised work, changed exactly as asked and nothing else. Keep the work's own language, form and voice. No preamble, no commentary — only the revised work itself.`;
      const user = `THE WORK "${draft.title}":\n\n${draft.body.slice(0, 60000)}\n\nTHE INSTRUCTION: ${instruction}`;
      const text = await composeText(system, user, 8000);
      if (!text) {
        return { ok: false, error: "The refinement came back empty — the field rested. Ask once more.", code: "compose_failed" };
      }
      await db.gatheringPost.update({
        where: { id: draft.id },
        data: { body: text.slice(0, 120000) },
      });
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.refine_creation", resourceType: "gathering_post", resourceId: draft.id, meta: JSON.stringify({ instruction: instruction.slice(0, 120), viaAgent: ctx.agentKey ?? null }) },
      });
      return {
        ok: true,
        data: {
          draftId: draft.id,
          title: draft.title,
          words: text.split(/\s+/).filter(Boolean).length,
          excerpt: text.slice(0, 400),
        },
      };
    },
  },

  publish_creation: {
    name: "publish_creation",
    description:
      "Carry one of the authorizing user's own drafts before its audience — flips a private draft into a real offering of the hall (visibility public default; circle demands circleId; connections; or keep draft). REQUIRES CONFIRMATION — this is the visitor's yes.",
    permission: "publish:own",
    idempotent: true,
    timeoutMs: 10000,
    validate: (input) => {
      const err = requireFields(input, [["draftId", (v) => str(v, 10, 64)]]);
      if (err) return err;
      const vis = optStr(input["visibility"], 20) ?? "public";
      if (!PUBLICATION_VISIBILITIES.includes(vis as (typeof PUBLICATION_VISIBILITIES)[number])) {
        return 'Field "visibility" must be one of public | circle | connections | draft.';
      }
      return null;
    },
    execute: async (input, ctx) => {
      if (ctx.dryRun) return { ok: true, data: { preview: true } };
      const draftId = str(input["draftId"], 10, 64);
      if (!draftId) return { ok: false, error: "Invalid draftId.", code: "bad_input" };
      const draft = await db.gatheringPost.findFirst({
        where: { id: draftId, userId: ctx.userId },
        select: { id: true, title: true, visibility: true, status: true, kind: true },
      });
      if (!draft || draft.status === "removed") {
        return { ok: false, error: "That draft is not on your shelf.", code: "not_found" };
      }
      const visibility = (optStr(input["visibility"], 20) ?? "public") as "public" | "circle" | "connections" | "draft";
      if (draft.visibility === visibility) {
        return { ok: true, data: { postId: draft.id, visibility, deduplicated: true } };
      }
      if (visibility === "circle") {
        const circleId = optStr(input["circleId"], 64);
        if (!circleId) return { ok: false, error: "A circle offering needs the circle's id.", code: "bad_input" };
        const member = await db.networkCircleMember.findFirst({
          where: { circleId, userId: ctx.userId },
          select: { id: true },
        });
        if (!member) return { ok: false, error: "Only a circle's own may hang inside it.", code: "forbidden" };
        await db.gatheringPost.update({ where: { id: draft.id }, data: { visibility, circleId } });
      } else {
        await db.gatheringPost.update({ where: { id: draft.id }, data: { visibility, circleId: null } });
      }
      await emitEvent(
        {
          type: EVENT_TYPES.publicationPublished,
          actorType: ctx.actorType,
          actorId: ctx.actorId,
          source: "tool:publish_creation",
          correlationId: ctx.correlationId ?? null,
          payload: { postId: draft.id, visibility, viaPrime: true },
        },
        { dedupeKey: `pub_prime_${draft.id}_${visibility}` }
      );
      await db.auditRecord.create({
        data: { actorType: ctx.actorType, actorId: ctx.actorId, action: "tool.publish_creation", resourceType: "gathering_post", resourceId: draft.id, meta: JSON.stringify({ visibility, viaAgent: ctx.agentKey ?? null }) },
      });
      return { ok: true, data: { postId: draft.id, title: draft.title, visibility, deduplicated: false } };
    },
  },

  list_my_drafts: {
    name: "list_my_drafts",
    description:
      "List the authorizing user's own private drafts (Prime's workbench shelf): id, title, kind, word count, updated — nothing public, nothing ranked.",
    permission: "read:own",
    idempotent: true,
    timeoutMs: 8000,
    validate: () => null,
    execute: async (input, ctx) => {
      const take = intOf(input["take"], 1, 20, 10);
      const rows = await db.gatheringPost.findMany({
        where: { userId: ctx.userId, visibility: "draft", status: { not: "removed" } },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, title: true, kind: true, body: true, sourceType: true, updatedAt: true },
      });
      return {
        ok: true,
        data: rows.map((r) => ({
          draftId: r.id,
          title: r.title,
          kind: r.sourceType ?? r.kind,
          words: r.body.split(/\s+/).filter(Boolean).length,
          updatedAt: r.updatedAt,
        })),
      };
    },
  },

  read_own_creation: {
    name: "read_own_creation",
    description:
      "Read one of the authorizing user's own works in full — draft or published, the human's own rights bound the read. Returns the whole body.",
    permission: "read:own",
    idempotent: true,
    timeoutMs: 8000,
    validate: (input) => requireFields(input, [["draftId", (v) => str(v, 10, 64)]]),
    execute: async (input, ctx) => {
      const draftId = str(input["draftId"], 10, 64);
      if (!draftId) return { ok: false, error: "Invalid draftId.", code: "bad_input" };
      const row = await db.gatheringPost.findFirst({
        where: { id: draftId, userId: ctx.userId, status: { not: "removed" } },
        select: { id: true, title: true, body: true, kind: true, visibility: true, sourceType: true, createdAt: true },
      });
      if (!row) return { ok: false, error: "That work is not on your shelf.", code: "not_found" };
      return {
        ok: true,
        data: {
          draftId: row.id,
          title: row.title,
          kind: row.sourceType ?? row.kind,
          visibility: row.visibility,
          body: row.body.slice(0, 30000),
        },
      };
    },
  },
};

export function listToolNames(): string[] {
  return Object.keys(TOOLS);
}

export function getTool(name: string): ToolDefinition | null {
  return TOOLS[name] ?? null;
}
