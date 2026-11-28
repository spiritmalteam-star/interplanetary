import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie, STATELESS_PREFIX } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { cleanStr, errorJson } from "@/lib/server/net-helpers";
import { questionDetail, QUESTION_INCLUDE } from "@/lib/server/question-detail";

/* ------------------------------------------------------------------ */
/*  THE BRANCH HAND — POST /api/network/questions/[id]/branch          */
/*                                                                     */
/*  A question grows by branching: an approach, a counter, a piece of  */
/*  evidence, a synthesis — each weighed under its own honest label,   */
/*  each possibly grown from another branch.                           */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

const BODY_MAX = 2000;
const BRANCH_KINDS = ["approach", "counter", "evidence", "synthesis"] as const;
const EVIDENCE = [
  "established", "preliminary", "hypothesis", "personal",
  "philosophical", "creative", "disputed",
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const me = visitor.user.id;
    if (me.startsWith(STATELESS_PREFIX)) {
      return errorJson("A branch needs a real maker — sign in or carry the quiet cookie.", 503);
    }

    const flood = rateLimit(`network:branch:${me}`, {
      limit: 15,
      windowMs: 30 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The branches ask for a breath — grow again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      content?: unknown;
      parentBranchId?: unknown;
      kind?: unknown;
      evidence?: unknown;
    } | null;

    const content = cleanStr(raw?.content, BODY_MAX);
    if (!content || content.length < 2) {
      return errorJson(`A branch wants between 2 and ${BODY_MAX} letters.`, 400);
    }

    const question = await db.networkQuestion.findUnique({ where: { id }, select: { id: true } });
    if (!question) return errorJson("That question no longer stands in the hall.", 404);

    /* a branch may only grow inside its own question */
    let parentId: string | null = null;
    if (typeof raw?.parentBranchId === "string" && raw.parentBranchId.length > 0) {
      const parent = await db.networkQuestionBranch.findFirst({
        where: { id: raw.parentBranchId, questionId: id },
        select: { id: true },
      });
      parentId = parent?.id ?? null;
    }

    const kind = BRANCH_KINDS.includes(raw?.kind as (typeof BRANCH_KINDS)[number])
      ? (raw?.kind as string)
      : "approach";
    const evidence = EVIDENCE.includes(raw?.evidence as (typeof EVIDENCE)[number])
      ? (raw?.evidence as string)
      : "hypothesis";

    await db.networkQuestionBranch.create({
      data: { questionId: id, parentId, authorId: me, kind, body: content, evidence },
    });
    await db.networkQuestion.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const fresh = await db.networkQuestion.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });

    return withAnonCookie(
      NextResponse.json({ question: fresh ? questionDetail(fresh, me) : null }),
      visitor
    );
  } catch (err) {
    console.error("network question branch POST failed", err);
    return errorJson("The branch could not be grown just now.", 500);
  }
}
