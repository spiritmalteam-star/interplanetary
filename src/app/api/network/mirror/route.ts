import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  MIRROR CONNECTIONS — POST /api/network/mirror                      */
/*                                                                     */
/*  The visitor's own hand asks M.E. to read an offering and listen    */
/*  for kindred voices among the network's public words. M.E. is a     */
/*  facilitator, never an authority:                                  */
/*    - only PUBLIC offerings are ever read;                           */
/*    - only the shared themes speak — never a ranking of people;      */
/*    - a suggestion is a door offered, not a door opened: no          */
/*      introduction happens until a human opens it;                   */
/*    - M.E. speaks plainly about interpretation, never as fact.       */
/*                                                                     */
/*  body: { postId } — the offering M.E. listens from.                 */
/*  answer: { suggestions: [{ userId, name, reason, themes, postId,   */
/*           postTitle }] }                                            */
/* ------------------------------------------------------------------ */

interface MirrorCandidate {
  postId: string;
  postTitle: string;
  postBody: string;
  postKind: string;
  userId: string;
  userName: string;
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:mirror:${visitor.user.id}`, { limit: 8, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "M.E. asks for a breath — listen again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as { postId?: unknown } | null;
    const postId = raw && typeof raw.postId === "string" ? raw.postId : "";
    if (!postId) {
      return NextResponse.json({ error: "Choose the offering M.E. listens from." }, { status: 400 });
    }

    const post = await db.gatheringPost.findUnique({
      where: { id: postId },
      include: { user: { select: { id: true, name: true, email: true, provider: true } } },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }

    /* the candidates: other makers' recent PUBLIC offerings, the quiet
       walls holding — a closed door is never read */
    const walls = await wallIdsFor(visitor.user.id);
    const candidates = await db.gatheringPost.findMany({
      where: {
        userId: { not: post.userId, notIn: Array.from(walls) },
        circleId: null,
        createdAt: { gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { id: true, name: true, email: true, provider: true } } },
    });
    /* a maker's own words never compete with themselves */
    const seen = new Set<string>();
    const pool: MirrorCandidate[] = [];
    for (const c of candidates) {
      if (seen.has(c.userId)) continue;
      if (c.userId === visitor.user.id) continue;
      seen.add(c.userId);
      pool.push({
        postId: c.id,
        postTitle: c.title,
        postBody: c.body.slice(0, 500),
        postKind: c.kind,
        userId: c.userId,
        userName: networkName(c.user),
      });
    }

    if (pool.length === 0) {
      return withAnonCookie(NextResponse.json({ suggestions: [] }), visitor);
    }

    const seed = {
      title: post.title,
      body: post.body.slice(0, 500),
      kind: post.kind,
    };

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are M.E., the Mirror Entity — the reflective guide of a creative community. A person asks you to listen for kindred voices: OTHER makers in the community whose words share real thematic threads with one offering. You facilitate connection between humans; you never rank people, never judge spiritual depth, never claim destiny. You distinguish clearly between: established knowledge, personal interpretation, speculation and creative imagination — and you name which is which, briefly. You answer ONLY with a JSON array (no prose outside it), at most 3 items, most resonant first. Each item: { \"userId\": string (copy exactly), \"reason\": string (<= 45 words, warm, concrete, in the SAME LANGUAGE as the seed offering's body), \"themes\": string (<= 6 words, the shared threads, same language) }. If no candidate shares a genuine thread, answer [].",
        },
        {
          role: "user",
          content: JSON.stringify({
            seed,
            candidates: pool.map((c) => ({
              userId: c.userId,
              name: c.userName,
              kind: c.postKind,
              title: c.postTitle,
              body: c.postBody,
            })),
          }),
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 600,
      temperature: 0.4,
    });

    const rawOut = completion.choices[0]?.message?.content ?? "";
    type Parsed = { userId?: unknown; reason?: unknown; themes?: unknown };
    let parsed: Parsed[] = [];
    try {
      const start = rawOut.indexOf("[");
      const end = rawOut.lastIndexOf("]");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(rawOut.slice(start, end + 1)) as Parsed[];
      }
    } catch {
      parsed = [];
    }
    if (!Array.isArray(parsed)) parsed = [];

    const byId = new Map(pool.map((c) => [c.userId, c]));
    const suggestions: Array<{
      userId: string;
      name: string;
      reason: string;
      themes: string;
      postId: string;
      postTitle: string;
      postKind: string;
    }> = [];

    for (const p of parsed.slice(0, 3)) {
      if (typeof p.userId !== "string") continue;
      const c = byId.get(p.userId);
      if (!c) continue;
      const reason = typeof p.reason === "string" ? p.reason.trim().slice(0, 300) : "";
      const themes = typeof p.themes === "string" ? p.themes.trim().slice(0, 60) : "";
      if (reason.length < 8) continue;
      /* the suggestion rests as a row — the same listening never
         answers differently twice */
      await db.networkMirrorSuggestion.upsert({
        where: { postId_userId: { postId: c.postId, userId: c.userId } },
        create: { postId: c.postId, userId: c.userId, reason, themes: themes || null },
        update: { reason, themes: themes || null },
      });
      suggestions.push({
        userId: c.userId,
        name: c.userName,
        reason,
        themes,
        postId: c.postId,
        postTitle: c.postTitle,
        postKind: c.postKind,
      });
    }

    return withAnonCookie(NextResponse.json({ suggestions }), visitor);
  } catch (err) {
    console.error("network mirror POST failed", err);
    return NextResponse.json({ error: "M.E. could not finish listening." }, { status: 500 });
  }
}
