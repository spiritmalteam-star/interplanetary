import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { gatheringName } from "../../route";

/* ------------------------------------------------------------------ */
/*  THE ECHOES — an offering's responses: GET reads them, POST adds    */
/*  one. An echo is a response, not a comment section — short, calm,   */
/*  signed, and belonging to the hall's own weather.                   */
/* ------------------------------------------------------------------ */
const ECHO_MAX = 600;

/* ---------------- GET — the echo row of one offering ---------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const rows = await db.gatheringEcho.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true, provider: true, image: true } },
      },
    });

    const echoes = rows.map((e) => ({
      id: e.id,
      body: e.body,
      createdAt: e.createdAt.toISOString(),
      author: {
        name: gatheringName(e.user),
        image: e.user.image ?? null,
        anon: e.user.provider === "anon",
      },
      isMine: e.userId === visitor.user.id,
    }));

    return withAnonCookie(NextResponse.json({ echoes }), visitor);
  } catch (err) {
    console.error("gathering echoes GET failed", err);
    return NextResponse.json({ error: "The echoes could not be heard." }, { status: 500 });
  }
}

/* ---------------- POST — add one echo ---------------- */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const flood = rateLimit(`gathering:echo:${visitor.user.id}`, {
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The hall asks for a breath — echo again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as { body?: unknown } | null;
    const body = typeof raw?.body === "string" ? raw.body.trim() : "";
    if (body.length < 2 || body.length > ECHO_MAX) {
      return NextResponse.json(
        { error: `An echo wants between 2 and ${ECHO_MAX} letters.` },
        { status: 400 }
      );
    }

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }

    const created = await db.gatheringEcho.create({
      data: { postId: id, userId: visitor.user.id, body },
    });
    const echoCount = await db.gatheringEcho.count({ where: { postId: id } });

    return withAnonCookie(
      NextResponse.json({
        echo: {
          id: created.id,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
          author: {
            name: gatheringName(visitor.user),
            image: visitor.user.image ?? null,
            anon: visitor.user.provider === "anon",
          },
          isMine: true,
        },
        echoCount,
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering echoes POST failed", err);
    return NextResponse.json({ error: "The echo could not be spoken." }, { status: 500 });
  }
}
