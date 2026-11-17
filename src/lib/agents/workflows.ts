import { db } from "@/lib/db";
import { wallIdsFor } from "@/lib/server/network";
import type { TaskStep } from "./types";

/* ------------------------------------------------------------------ */
/*  WORKFLOW DEFINITIONS — reusable multi-step plans.                  */
/*                                                                     */
/*  Workflows never contact anyone and never disclose private project  */
/*  information: they search public shelves only, rank transparently,  */
/*  and leave every consequential action (an invitation, a message)    */
/*  behind the human approval gate.                                    */
/* ------------------------------------------------------------------ */

export interface WorkflowDefinition {
  key: string;
  name: string;
  description: string;
  agentKey: string;
  /** validate the task input; return an error string or null */
  validateInput: (input: Record<string, unknown>) => string | null;
  /** build the durable step plan from the task input */
  plan: (input: Record<string, unknown>) => Omit<TaskStep, "status" | "output" | "error">[];
  approvalRequired: boolean;
}

export const FIND_COLLABORATORS: WorkflowDefinition = {
  key: "find_collaborators",
  name: "Find collaborators for a project",
  description:
    "Reads the user's own project, extracts its required skills, searches the public maker directory, ranks candidates transparently, and prepares invitations — each sent only after the human's explicit yes.",
  agentKey: "circle-steward",
  validateInput: (input) => {
    const projectId = typeof input["projectId"] === "string" ? input["projectId"].trim() : "";
    if (projectId.length < 10) return 'Field "projectId" is required.';
    return null;
  },
  plan: (input) => [
    {
      key: "read_project",
      name: "Read the project",
      tool: "get_project",
      input: { projectId: input["projectId"] },
    },
    {
      key: "search_makers",
      name: "Search public makers",
      tool: "search_people",
      input: { q: typeof input["skills"] === "string" ? input["skills"] : "", take: 8 },
    },
    {
      key: "rank_candidates",
      name: "Rank candidates by declared threads",
      tool: "rank_collaborators",
      input: { skills: typeof input["skills"] === "string" ? input["skills"] : "" },
    },
    {
      key: "send_invitations",
      name: "Send the human-approved invitations",
      tool: "invite_collaborator",
      input: { projectId: input["projectId"], needsApproval: true },
    },
  ],
  approvalRequired: true,
};

/** The transparent ranking — explicit criteria, no hidden popularity. */
export async function rankCandidates(
  userId: string,
  requiredSkills: string[]
): Promise<{ id: string; name: string; matched: string[]; disciplines: string | null }[]> {
  const walls = await wallIdsFor(userId);
  const skills = requiredSkills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const profiles = await db.networkProfile.findMany({
    where: {
      visibility: "public",
      user: { id: { not: userId, notIn: walls.size ? [...walls] : undefined } },
    },
    select: {
      userId: true,
      interests: true,
      disciplines: true,
      user: { select: { id: true, name: true, email: true, provider: true } },
    },
    take: 120,
  });
  const scored = profiles
    .map((p) => {
      const haystack = `${p.disciplines ?? ""} ${p.interests ?? ""}`.toLowerCase();
      const matched = skills.filter((s) => haystack.includes(s));
      return {
        id: p.user.id,
        name: p.user.name?.trim() || "A fellow maker",
        matched,
        disciplines: p.disciplines ?? null,
        score: matched.length,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return scored.map(({ score: _score, ...rest }) => rest);
}

export const WORKFLOWS: Record<string, WorkflowDefinition> = {
  find_collaborators: FIND_COLLABORATORS,
};

export function getWorkflow(key: string): WorkflowDefinition | null {
  return WORKFLOWS[key] ?? null;
}
