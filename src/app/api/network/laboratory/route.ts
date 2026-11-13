import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { isNetworkFocus, networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE LABORATORY — /api/network/laboratory                           */
/*                                                                     */
/*  Structured collaborative research that stays approachable: a       */
/*  question, a hypothesis, the method, the materials, the safety,     */
/*  and the benches where observations, results and reviews land.      */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - a lab opens by its maker's own hand;                             */
/*  - reviews are clearly distinct from votes — they never prove       */
/*    anything, they only speak;                                       */
/*  - the quiet walls hold: a closed door's benches never surface.     */
/* ------------------------------------------------------------------ */

const TITLE_MAX = 120;
const QUESTION_MAX = 600;
const HYPOTHESIS_MAX = 2000;
const SECTION_MAX = 3000;

/* ---------------- GET — the benches, newest first ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const statusRaw = url.searchParams.get("status");
    const status = ["open", "active", "concluded"].includes(statusRaw ?? "") ? statusRaw : null;
    const focus = url.searchParams.get("focus");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const take = Math.min(48, Math.max(1, Number(url.searchParams.get("take") ?? 30)));

    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.networkLabProject.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { members: true, entries: true, reviews: true } },
      },
    });

    const visible = rows
      .filter((l) => !walls.has(l.ownerId))
      .filter((l) => (isNetworkFocus(focus) ? l.focus === focus : true))
      .filter((l) => {
        if (!q) return true;
        return (
          l.title.toLowerCase().includes(q) ||
          l.question.toLowerCase().includes(q) ||
          l.hypothesis.toLowerCase().includes(q)
        );
      })
      .slice(0, take);

    const labs = visible.map((l) => ({
      id: l.id,
      title: l.title,
      question: l.question,
      status: l.status,
      focus: l.focus,
      memberCount: l._count.members,
      entryCount: l._count.entries,
      reviewCount: l._count.reviews,
      createdAt: l.createdAt.toISOString(),
      owner: {
        name: networkName(l.owner),
        anon: l.owner.provider === "anon",
      },
    }));

    return withAnonCookie(NextResponse.json({ labs }), visitor);
  } catch (err) {
    console.error("network laboratory GET failed", err);
    return NextResponse.json({ error: "The laboratory could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — open a bench ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:lab:create:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The laboratory asks for a breath — open a bench again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      question?: unknown;
      hypothesis?: unknown;
      background?: unknown;
      methodology?: unknown;
      materials?: unknown;
      safety?: unknown;
      focus?: unknown;
      seedPostId?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The bench arrived unreadable." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const question = typeof raw.question === "string" ? raw.question.trim() : "";
    const hypothesis = typeof raw.hypothesis === "string" ? raw.hypothesis.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    if (question.length < 4 || question.length > QUESTION_MAX) {
      return NextResponse.json(
        { error: `The question wants between 4 and ${QUESTION_MAX} letters.` },
        { status: 400 }
      );
    }
    if (hypothesis.length < 4 || hypothesis.length > HYPOTHESIS_MAX) {
      return NextResponse.json(
        { error: `The hypothesis wants between 4 and ${HYPOTHESIS_MAX} letters.` },
        { status: 400 }
      );
    }

    /* the honest sections — the maker's own words, sized gently */
    const section = (v: unknown): string | null =>
      typeof v === "string" && v.trim().length >= 2 ? v.trim().slice(0, SECTION_MAX) : null;
    const background = section(raw.background);
    const methodology = section(raw.methodology);
    const materials = section(raw.materials);
    const safety = section(raw.safety);

    const focus = raw.focus === undefined || raw.focus === null ? "science" : raw.focus;
    if (!isNetworkFocus(focus)) {
      return NextResponse.json({ error: "Choose the bench's own focus." }, { status: 400 });
    }

    /* a hypothesis post may open a bench — but only its maker's own */
    let seedPostId: string | null = null;
    if (typeof raw.seedPostId === "string" && raw.seedPostId.length > 0) {
      const seed = await db.gatheringPost.findUnique({
        where: { id: raw.seedPostId },
        select: { id: true, userId: true, kind: true },
      });
      if (!seed || seed.userId !== visitor.user.id) {
        return NextResponse.json(
          { error: "A bench grows only from its own maker's offering." },
          { status: 400 }
        );
      }
      if (seed.kind !== "hypothesis" && seed.kind !== "experiment") {
        return NextResponse.json(
          { error: "A bench grows from a hypothesis or an experiment." },
          { status: 400 }
        );
      }
      seedPostId = seed.id;
    }

    const created = await db.networkLabProject.create({
      data: {
        ownerId: visitor.user.id,
        title,
        question,
        hypothesis,
        background,
        methodology,
        materials,
        safety,
        focus,
        seedPostId,
      },
    });
    await db.networkLabMember.create({
      data: { labId: created.id, userId: visitor.user.id, role: "owner" },
    });

    return withAnonCookie(NextResponse.json({ lab: { id: created.id } }), visitor);
  } catch (err) {
    console.error("network laboratory POST failed", err);
    return NextResponse.json({ error: "The bench could not be opened." }, { status: 500 });
  }
}
