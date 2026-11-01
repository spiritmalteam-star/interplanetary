import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { meterRoute } from "@/lib/server/meter";
import {
  resolveVisitor,
  withAnonCookie,
} from "@/lib/server/access";
import {
  runDeepPress,
  splitCrystals,
} from "@/lib/server/deep-press";

/* ------------------------------------------------------------------ */
/*  POST /api/hyperx/pdf — THE DEEP RESEARCH PRESS, AS A WORK IN       */
/*  MOTION.                                                            */
/*                                                                     */
/*  HyperX's answer is a discovery; this door extends that truth into  */
/*  a full research treatise whose length THE VISITOR'S OWN LEVER      */
/*  chooses — 3 pages (~3000 words) up to the full 8 (~8000 words) —   */
/*  and presses it into a real PDF for deep research projects.         */
/*                                                                     */
/*  THE WORKS-IN-MOTION LAW: the door takes the visitor's ask, opens   */
/*  a ProcessJob in the hall, and answers at once — the press itself   */
/*  runs behind the response (after()), speaking its stage and         */
/*  progress into the hall at every movement, so the visitor may walk  */
/*  anywhere and the treatise still completes; when it lands it rests  */
/*  on the Library's own shelf, and the Profile's "Works in Motion"    */
/*  room tells the tale — including a failed press, which may be       */
/*  asked to rise again from its own stored input.                     */
/*                                                                     */
/*  THE GATE: while the vault's `hyperx_gate` reads "pro", only the    */
/*  OBSERVATORY_PRO wallet (and the ADMIN role) may press the deep     */
/*  research document.                                                 */
/* ------------------------------------------------------------------ */

export const POST = meterRoute("pdf", hyperxPdfImpl);
export const maxDuration = 300;

async function hyperxPdfImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const question: string =
      typeof body?.question === "string" ? body.question.trim().slice(0, 2000) : "";
    const rawAnswer: string =
      typeof body?.answer === "string" ? body.answer.slice(0, 20_000) : "";
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    /* THE LEVER — 3..8 pages, the visitor's own choice of length */
    const pages = Math.max(
      3,
      Math.min(8, Math.round(Number(body?.pages) || 8))
    );

    if (!question || !rawAnswer.trim()) {
      return NextResponse.json(
        { error: "The press needs a HyperX truth to extend — ask first, then press." },
        { status: 400 }
      );
    }

    /* THE GATE — the pro passage's own press. */
    const gate = await db.platformConfig
      .findUnique({ where: { key: "hyperx_gate" } })
      .catch(() => null);
    const gateMode =
      gate && typeof gate.value === "object" && gate.value !== null
        ? String((gate.value as { mode?: unknown }).mode ?? "open")
        : "open";
    if (gateMode === "pro") {
      const visitor = await resolveVisitor(req);
      const isAdmin = visitor.user.role === "ADMIN";
      let pro = isAdmin;
      if (!pro) {
        const wallet = await db.userWallet
          .findUnique({ where: { userId: visitor.user.id } })
          .catch(() => null);
        pro = wallet?.planTier === "OBSERVATORY_PRO";
      }
      if (!pro) {
        return NextResponse.json(
          {
            error:
              "The deep research press opens with the Pro passage — HyperX's long documents belong to the paid light.",
            code: "HYPERX_PRO_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    const visitor = await resolveVisitor(req);

    /* THE HALL'S OWN ROW — the work opens its place in the hall at
       once, so the visitor's Profile can hold it from its first breath. */
    const { body: proseBody } = splitCrystals(rawAnswer);
    const head =
      proseBody.split(/\n{2,}/).find((p) => p.trim().length > 40) ??
      proseBody.slice(0, 200);

    let job;
    try {
      job = await db.processJob.create({
        data: {
          userId: visitor.user.id,
          kind: "hyperx-pdf",
          title: question.slice(0, 140),
          subtitle: `A deep research treatise · ${pages} page${pages === 8 ? "s — the full press" : `s · ~${pages * 1000} words`}`,
          status: "running",
          progress: 4,
          stage: "The press is waking…",
          input: JSON.stringify({
            question,
            answer: rawAnswer,
            language: requestedLanguage,
            pages,
          }),
        },
      });
    } catch {
      /* no hall (a database at rest) — the honest word */
      return NextResponse.json(
        {
          error:
            "The hall of works rests — the press needs a database to keep its progress. Try again when the vault breathes.",
        },
        { status: 503 }
      );
    }

    /* THE PRESS ITSELF — behind the response: the visitor's page is
       never held, and the work carries on wherever they walk. */
    after(() => runDeepPress(job.id));

    const res = NextResponse.json({
      id: job.id,
      status: "running",
      pages,
    });
    return withAnonCookie(res, visitor);
  } catch (err) {
    console.error("[hyperx-pdf] failed:", err);
    return NextResponse.json(
      { error: "The press stayed quiet — rest, then try again." },
      { status: 500 }
    );
  }
}
