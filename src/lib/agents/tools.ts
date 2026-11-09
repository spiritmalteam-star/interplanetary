import { db } from "@/lib/db";
import { wallIdsFor, networkName } from "@/lib/server/network";
import { publishToGathering, PUBLICATION_VISIBILITIES, EPISTEMIC_LABELS } from "@/lib/server/publication";
import { emitEvent, EVENT_TYPES } from "@/lib/server/events";
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
};

export function listToolNames(): string[] {
  return Object.keys(TOOLS);
}

export function getTool(name: string): ToolDefinition | null {
  return TOOLS[name] ?? null;
}
