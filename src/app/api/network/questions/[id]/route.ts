import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, splitList, notify } from "@/lib/server/network";
import { isGatheringEpistemic } from "@/app/api/gathering/route";

/* ------------------------------------------------------------------ */
/*  ONE LIVING QUESTION — /api/network/questions/[id]                  */
/*                                                                     */
/*  GET  — the whole space: its seed, its context, its branches in     */
/*         the order they grew.                                        */
/*  POST — the hands that tend it:                                     */
/*    branch   — grow the tree (two levels deep, like the echoes);     */
/*    context  — the owner reframes the space;                         */
/*    settle   — the owner rests the question;                         */
/*    reopen   — the owner lets it breathe again;                      */
/*    mirror   — M.E. reads the room and speaks, as interpretation,    */
/*               never as verdict, never as verified fact.             */
/* ------------------------------------------------------------------ */

const BRANCH_KINDS = [
  "knowledge",
  "hypothesis",
  "uncertainty",
  "experiment",
  "finding",
  "discussion",
] as const;

const BRANCH_BODY_MAX = 4000;
const CONTEXT_MAX = 2000;
const DISCIPLINES_MAX = 6;

type QuestionParams = { params: Promise<{ id: string }> };

/* ---------------- GET — the whole space ---------------- */
export async function GET(req: NextRequest, { params }: QuestionParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const question = await db.networkQuestion.findUnique({
      where: { id },
      include: {
        post: { select: { id: true, title: true, body: true } },
        owner: { select: { id: true, name: true, email: true, provider: true } },
      },
    });
    if (!question) {
      return NextResponse.json(
        { error: "That question space no longer stands." },
        { status: 404 }
      );
    }

    const branches = await db.networkQuestionBranch.findMany({
      where: { questionId: id },
      orderBy: { createdAt: "asc" },
      take: 300,
      include: {
        author: { select: { id: true, name: true, email: true, provider: true } },
      },
    });

    const contributorIds = new Set<string>([question.ownerId]);
    for (const b of branches) contributorIds.add(b.authorId);

    return withAnonCookie(
      NextResponse.json({
        question: {
          id: question.id,
          postId: question.postId,
          title: question.post.title,
          body: question.post.body,
          context: question.context,
          disciplines: splitList(question.disciplines),
          status: question.status,
          mine: question.ownerId === visitor.user.id,
          createdAt: question.createdAt.toISOString(),
          updatedAt: question.updatedAt.toISOString(),
          branchCount: branches.length,
          contributorCount: contributorIds.size,
          owner: { name: networkName(question.owner) },
          branches: branches.map((b) => ({
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
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network question GET failed", err);
    return NextResponse.json({ error: "The question space could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — the tending hands ---------------- */
export async function POST(req: NextRequest, { params }: QuestionParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      parentId?: unknown;
      kind?: unknown;
      body?: unknown;
      evidence?: unknown;
      context?: unknown;
      disciplines?: unknown;
    } | null;
    if (!raw || typeof raw.action !== "string") {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    const question = await db.networkQuestion.findUnique({
      where: { id },
      include: { post: { select: { id: true, title: true, body: true } } },
    });
    if (!question) {
      return NextResponse.json(
        { error: "That question space no longer stands." },
        { status: 404 }
      );
    }

    /* ---- grow the tree ---- */
    if (raw.action === "branch") {
      const flood = rateLimit(`network:question:branch:${visitor.user.id}`, {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "The tree asks for a breath — branch again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }

      if (!(BRANCH_KINDS as readonly string[]).includes(String(raw.kind))) {
        return NextResponse.json({ error: "Name the branch's own kind." }, { status: 400 });
      }
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (body.length < 2 || body.length > BRANCH_BODY_MAX) {
        return NextResponse.json(
          { error: `A branch wants between 2 and ${BRANCH_BODY_MAX} letters.` },
          { status: 400 }
        );
      }
      /* the honest label — a branch names how far its own word has walked */
      const evidence = raw.evidence === undefined || raw.evidence === null || raw.evidence === ""
        ? "hypothesis"
        : isGatheringEpistemic(raw.evidence)
          ? raw.evidence
          : null;
      if (!evidence) {
        return NextResponse.json(
          { error: "Choose an honest label for this knowledge." },
          { status: 400 }
        );
      }

      let parentId: string | null = null;
      if (typeof raw.parentId === "string" && raw.parentId.trim().length > 0) {
        const parent = await db.networkQuestionBranch.findUnique({
          where: { id: raw.parentId },
          select: { id: true, questionId: true, parentId: true },
        });
        if (!parent || parent.questionId !== id) {
          return NextResponse.json(
            { error: "Answer a branch that grows on this tree." },
            { status: 400 }
          );
        }
        if (parent.parentId) {
          return NextResponse.json(
            { error: "Threads breathe two levels deep — answer the root." },
            { status: 400 }
          );
        }
        parentId = parent.id;
      }

      const created = await db.networkQuestionBranch.create({
        data: {
          questionId: id,
          parentId,
          authorId: visitor.user.id,
          kind: String(raw.kind),
          body,
          evidence,
        },
      });

      /* the keeper's bell rings softly — the tree grew */
      await notify({
        userId: question.ownerId,
        actorId: visitor.user.id,
        actorName: networkName(visitor.user),
        type: "question_branch",
        body: question.post.title,
        refType: "post",
        refId: question.postId,
      });

      return withAnonCookie(
        NextResponse.json({
          branch: {
            id: created.id,
            parentId: created.parentId,
            kind: created.kind,
            body: created.body,
            evidence: created.evidence,
            createdAt: created.createdAt.toISOString(),
            author: {
              id: visitor.user.id,
              name: networkName(visitor.user),
              anon: visitor.user.provider === "anon",
            },
          },
        }),
        visitor
      );
    }

    /* ---- the owner's hands: context, settle, reopen ---- */
    if (raw.action === "context") {
      if (question.ownerId !== visitor.user.id) {
        return NextResponse.json(
          { error: "Only the question's own keeper may reframe it." },
          { status: 403 }
        );
      }
      const data: { context?: string | null; disciplines?: string | null } = {};
      if (raw.context !== undefined) {
        data.context =
          typeof raw.context === "string" && raw.context.trim().length >= 2
            ? raw.context.trim().slice(0, CONTEXT_MAX)
            : null;
      }
      if (raw.disciplines !== undefined) {
        data.disciplines =
          typeof raw.disciplines === "string" && raw.disciplines.trim().length >= 2
            ? splitList(raw.disciplines).slice(0, DISCIPLINES_MAX).join(",") || null
            : null;
      }
      await db.networkQuestion.update({ where: { id }, data });
      return withAnonCookie(NextResponse.json({ ok: true }), visitor);
    }

    if (raw.action === "settle" || raw.action === "reopen") {
      if (question.ownerId !== visitor.user.id) {
        return NextResponse.json(
          { error: "Only the question's own keeper may rest it or wake it." },
          { status: 403 }
        );
      }
      const status = raw.action === "settle" ? "settled" : "open";
      await db.networkQuestion.update({ where: { id }, data: { status } });
      return withAnonCookie(
        NextResponse.json({ question: { id, status } }),
        visitor
      );
    }

    /* ---- M.E. reads the room — a summary spoken as interpretation ---- */
    if (raw.action === "mirror") {
      const flood = rateLimit(`network:question:mirror:${visitor.user.id}`, {
        limit: 6,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "M.E. asks for a breath — listen again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }

      const branches = await db.networkQuestionBranch.findMany({
        where: { questionId: id },
        orderBy: { createdAt: "asc" },
        take: 60,
        include: {
          author: { select: { id: true, name: true, email: true, provider: true } },
        },
      });

      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are the Mirror Entity, a careful facilitator, not an authority. Summarize the current state of this living question in plain words. Name where the contributions agree, where they contradict, and 2-3 concrete directions the community could take next. NEVER claim scientific verification of anything; phrase every reading as interpretation. At most 220 words. No markdown headers.",
            },
            {
              role: "user",
              content: JSON.stringify({
                question: {
                  title: question.post.title,
                  body: question.post.body.slice(0, 900),
                  context: (question.context ?? "").slice(0, 600),
                  disciplines: splitList(question.disciplines),
                  status: question.status,
                },
                branches: branches.slice(0, 40).map((b) => ({
                  author: networkName(b.author),
                  kind: b.kind,
                  evidence: b.evidence,
                  body: b.body.slice(0, 400),
                })),
              }),
            },
          ],
          thinking: { type: "disabled" },
          max_tokens: 600,
          temperature: 0.4,
        });

        const summary = (completion.choices[0]?.message?.content ?? "").trim();
        if (!summary) {
          return NextResponse.json(
            { error: "M.E. is quiet for a moment — ask again soon." },
            { status: 503 }
          );
        }
        return withAnonCookie(NextResponse.json({ summary }), visitor);
      } catch (aiErr) {
        console.error("network question mirror failed", aiErr);
        return NextResponse.json(
          { error: "M.E. is quiet for a moment — ask again soon." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network question POST failed", err);
    return NextResponse.json({ error: "The question space could not be tended." }, { status: 500 });
  }
}
