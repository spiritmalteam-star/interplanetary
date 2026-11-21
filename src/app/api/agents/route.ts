import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { ensureAgentRegistrySeeded, listManifests, getManifest } from "@/lib/agents/registry";
import { toolContractsFor } from "@/lib/agents/authz";
import { TOOLS } from "@/lib/agents/tools";
import { WORKFLOWS } from "@/lib/agents/workflows";

/* ------------------------------------------------------------------ */
/*  THE AGENTS' REGISTER — /api/agents                                 */
/*                                                                     */
/*  GET — the registered agents, their capability contracts and the    */
/*        tool manifest. Discovery for humans and authorized agents.   */
/*  POST — seed/refresh the registry (idempotent, non-destructive).    */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    await ensureAgentRegistrySeeded();
    const agents = await listManifests();
    const url = new URL(req.url);
    const detail = url.searchParams.get("key");
    if (detail) {
      const found = await getManifest(detail);
      if (!found) return NextResponse.json({ error: "No such agent." }, { status: 404 });
      return withAnonCookie(
        NextResponse.json({
          agent: {
            ...found.manifest,
            status: found.status,
            tools: toolContractsFor(found.manifest),
          },
        }),
        visitor
      );
    }
    return withAnonCookie(
      NextResponse.json({
        agents: agents.map((a) => ({
          key: a.manifest.agentKey,
          name: a.manifest.name,
          description: a.manifest.description,
          version: a.manifest.version,
          capabilities: a.manifest.capabilities,
          supportedTasks: a.manifest.supportedTasks,
          status: a.status,
          tools: toolContractsFor(a.manifest).map((t) => t.name),
        })),
        tools: Object.values(TOOLS).map((t) => ({
          name: t.name,
          description: t.description,
          permission: t.permission,
          idempotent: t.idempotent,
          timeoutMs: t.timeoutMs,
        })),
        workflows: Object.values(WORKFLOWS).map((w) => ({
          key: w.key,
          name: w.name,
          description: w.description,
          agentKey: w.agentKey,
          approvalRequired: w.approvalRequired,
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error("[agents] registry read failed:", err);
    /* the core platform keeps breathing — the register answers honestly */
    return NextResponse.json({ agents: [], tools: [], workflows: [], degraded: true });
  }
}

export async function POST(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    await ensureAgentRegistrySeeded();
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("[agents] seed failed:", err);
    return NextResponse.json({ error: "The register is momentarily quiet." }, { status: 500 });
  }
}
