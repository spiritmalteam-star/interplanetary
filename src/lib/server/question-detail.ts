/* ------------------------------------------------------------------ */
/*  THE QUESTION'S OWN SHAPE — one shared serializer for the living    */
/*  questions of the network hall. The detail route (GET) and the      */
/*  branch hand (POST) must answer with the very same figure, so the   */
/*  include and the mapper live here — OUTSIDE any route module (a     */
/*  route module may not lend its own exports to another route: the    */
/*  builder refuses such loans, and the build was refusing to stand).  */
/* ------------------------------------------------------------------ */

import type { Prisma } from "@prisma/client";
import { networkName, splitList } from "@/lib/server/network";

export const QUESTION_INCLUDE = {
  post: { select: { id: true, title: true, body: true } },
  owner: { select: { id: true, name: true, email: true, provider: true } },
  branches: {
    orderBy: { createdAt: "asc" as const },
    take: 300,
    include: {
      author: { select: { id: true, name: true, email: true, provider: true } },
    },
  },
} satisfies Prisma.NetworkQuestionInclude;

export type QuestionWithBranches = Prisma.NetworkQuestionGetPayload<{
  include: typeof QUESTION_INCLUDE;
}>;

export function questionDetail(
  q: QuestionWithBranches,
  viewerId: string
) {
  const contributorIds = new Set<string>([q.ownerId]);
  for (const b of q.branches) contributorIds.add(b.authorId);

  return {
    id: q.id,
    postId: q.postId,
    title: q.post.title,
    body: q.post.body,
    context: q.context,
    disciplines: splitList(q.disciplines),
    status: q.status,
    mine: q.ownerId === viewerId,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    branchCount: q.branches.length,
    contributorCount: contributorIds.size,
    owner: { name: networkName(q.owner) },
    branches: q.branches.map((b) => ({
      id: b.id,
      parentId: b.parentId,
      kind: b.kind,
      body: b.body,
      evidence: b.evidence,
      createdAt: b.createdAt.toISOString(),
      author: {
        id: b.authorId,
        name: networkName(b.author),
        anon: b.author.provider === "anon",
      },
    })),
  };
}
