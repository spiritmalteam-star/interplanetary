import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  THE OPEN LEDGER — /api/v1/openapi                                  */
/*                                                                     */
/*  The versioned surface, documented in OpenAPI 3.1. Every endpoint   */
/*  the unified gateway exposes: its auth, its errors, its pagination. */
/* ------------------------------------------------------------------ */

const spec = {
  openapi: "3.1.0",
  info: {
    title: "ReflectMe Unified API",
    version: "1.0.0",
    description:
      "The unified, versioned surface of ReflectMe: profiles, publications, creations, circles, projects, knowledge, messages, notifications and agent execution. Session-cookie auth for humans (mirror_session), API-key auth for services (mir_live_).",
  },
  servers: [{ url: "/", description: "same-origin gateway" }],
  components: {
    securitySchemes: {
      sessionCookie: { type: "apiKey", in: "cookie", name: "mirror_session" },
      apiKey: { type: "http", scheme: "bearer", bearerFormat: "mir_live_" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" }, code: { type: "string", nullable: true } },
        required: ["error"],
      },
      Paginated: {
        type: "object",
        properties: {
          hasMore: { type: "boolean" },
          cursor: { type: "string", nullable: true, description: "pass as ?cursor= to fetch the next page" },
        },
      },
      Publication: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          preview: { type: "string" },
          contentType: { type: "string" },
          sourcePortal: { type: "string", nullable: true },
          sourceId: { type: "string", nullable: true },
          visibility: { type: "string", enum: ["public", "circle", "connections", "draft"] },
          epistemicLabel: { type: "string", enum: ["established", "hypothesis", "interpretation", "creative", null] },
          author: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["workflow", "tool"] },
          name: { type: "string" },
          status: { type: "string", enum: ["queued", "running", "awaiting_approval", "completed", "failed", "cancelled"] },
          progress: { type: "integer" },
          steps: { type: "array", items: { type: "object" } },
          result: { type: "object", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
    },
    responses: {
      Unauthorized: { description: "No session or key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Forbidden: { description: "The rights do not reach", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Rate: { description: "Rate limit reached (429, with retry-after)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
  },
  paths: {
    "/api/auth/me": { get: { summary: "The current visitor's own truth", security: [{ sessionCookie: [] }], responses: { "200": { description: "session user" }, "401": { $ref: "#/components/responses/Unauthorized" } } } },
    "/api/discover": {
      get: {
        summary: "The Discover current — six destinations",
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: "dest", in: "query", required: true, schema: { type: "string", enum: ["for-you", "people", "creations", "circles", "projects", "knowledge", "mine"] } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", description: "creations: content-type filter" } },
          { name: "epistemic", in: "query", schema: { type: "string", enum: ["established", "hypothesis", "interpretation", "creative"], description: "knowledge: epistemic filter" } },
          { name: "seeking", in: "query", schema: { type: "string", enum: ["1"], description: "projects: only those seeking collaborators" } },
          { name: "take", in: "query", schema: { type: "integer", minimum: 3, maximum: 36 } },
          { name: "cursor", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": { description: "the destination's answer, visibility enforced at retrieval", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/Paginated" }] } } } },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/Rate" },
        },
      },
    },
    "/api/publications": {
      post: {
        summary: "Publish a completed creation to the Gathering hall (idempotent per source)",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sourcePortal", "title", "visibility"],
                properties: {
                  sourcePortal: { type: "string", enum: ["artx", "music", "book", "dreambook", "hyperx", "channeling", "invent", "manifest"] },
                  title: { type: "string", maxLength: 140 },
                  body: { type: "string", nullable: true },
                  question: { type: "string", nullable: true },
                  introduction: { type: "string", nullable: true },
                  visibility: { type: "string", enum: ["public", "circle", "connections", "draft"] },
                  circleId: { type: "string", nullable: true },
                  epistemic: { type: "string", enum: ["established", "hypothesis", "interpretation", "creative"], nullable: true },
                  sourceId: { type: "string", nullable: true },
                  refKind: { type: "string", enum: ["library", "music"], nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "published (or deduplicated: the same source was already hung)" },
          "400": { $ref: "#/components/responses/Forbidden" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "429": { $ref: "#/components/responses/Rate" },
        },
      },
      patch: { summary: "Reshape one's own publication", security: [{ sessionCookie: [] }], responses: { "200": { description: "reshaped" }, "403": { $ref: "#/components/responses/Forbidden" } } },
      delete: { summary: "Take one's own publication down", security: [{ sessionCookie: [] }], responses: { "200": { description: "taken down" }, "403": { $ref: "#/components/responses/Forbidden" } } },
    },
    "/api/gathering": {
      get: { summary: "The hall's offerings (block-walled, membership-scoped)", security: [{ sessionCookie: [] }], responses: { "200": { description: "offerings" } } },
      post: { summary: "Hang a reflection or question in the hall", security: [{ sessionCookie: [] }], responses: { "200": { description: "created" }, "429": { $ref: "#/components/responses/Rate" } } },
    },
    "/api/network/people": { get: { summary: "The makers' directory", security: [{ sessionCookie: [] }], responses: { "200": { description: "people" } } } },
    "/api/network/circles": {
      get: { summary: "The circles' square", security: [{ sessionCookie: [] }], responses: { "200": { description: "circles" } } },
      post: { summary: "Found a circle", security: [{ sessionCookie: [] }], responses: { "200": { description: "founded" }, "429": { $ref: "#/components/responses/Rate" } } },
    },
    "/api/network/projects": {
      get: { summary: "The collaborative works", security: [{ sessionCookie: [] }], responses: { "200": { description: "projects" } } },
      post: { summary: "Open a project", security: [{ sessionCookie: [] }], responses: { "200": { description: "opened" } } },
    },
    "/api/network/messages": { get: { summary: "Conversations with unread truth", security: [{ sessionCookie: [] }], responses: { "200": { description: "conversations" } } } },
    "/api/network/notifications": { get: { summary: "The bell's truth", security: [{ sessionCookie: [] }], responses: { "200": { description: "notifications" } } } },
    "/api/agents": { get: { summary: "The agents' register: manifests, tool contracts, workflows", security: [{ sessionCookie: [] }], responses: { "200": { description: "registry" } } } },
    "/api/agents/tasks": {
      get: { summary: "One's own tasks", security: [{ sessionCookie: [] }], responses: { "200": { description: "tasks" } } },
      post: {
        summary: "Summon a durable task (workflow or single tool) and run it",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["key"],
                properties: {
                  kind: { type: "string", enum: ["workflow", "tool"] },
                  key: { type: "string" },
                  input: { type: "object" },
                  idempotencyKey: { type: "string", nullable: true },
                  agentKey: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: { "200": { description: "task created and run (resume-safe)", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } }, "404": { $ref: "#/components/responses/Forbidden" } },
      },
    },
    "/api/agents/tasks/{id}": {
      get: { summary: "One task's whole truth", security: [{ sessionCookie: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "task", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } }, "404": { $ref: "#/components/responses/Forbidden" } } },
      post: { summary: "Approve the gate, cancel, or resume", security: [{ sessionCookie: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "action taken" } } },
    },
    "/api/v1/chat": {
      post: { summary: "OpenAI-style chat completions (service-to-service)", security: [{ apiKey: [] }], responses: { "200": { description: "completion" }, "401": { $ref: "#/components/responses/Unauthorized" }, "429": { $ref: "#/components/responses/Rate" } } },
      get: { summary: "Status banner", responses: { "200": { description: "status" } } },
    },
    "/api/v1/channel": { post: { summary: "Mirror Intelligence API — persona channeling", security: [{ apiKey: [] }], responses: { "200": { description: "transmission" }, "401": { $ref: "#/components/responses/Unauthorized" } } } },
    "/api/v1/images": { post: { summary: "Image generation", security: [{ apiKey: [] }], responses: { "200": { description: "image" }, "401": { $ref: "#/components/responses/Unauthorized" } } } },
    "/api/capabilities": { get: { summary: "The capability registry (12 contracts)", responses: { "200": { description: "capabilities" } } } },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: { "cache-control": "public, max-age=300" },
  });
}
