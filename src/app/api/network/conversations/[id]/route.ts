import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE CONVERSATION'S ROOM — /api/network/conversations/[id]          */
/*                                                                     */
/*  GET  — the words that already stand, the members who may read      */
/*         them, and the visitor's own reading mark set down.          */
/*  POST — a voice added to the room. Only a member may speak; a       */
/*         closed wall never receives a word.                          */
/* ------------------------------------------------------------------ */

async function requireMembership(conversationId: string, userId: string) {
  return db.networkConversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: { conversation: { select: { id: true, isGroup: true, title: true } } },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const membership = await requireMembership(id, visitor.user.id);
    if (!membership) {
      return NextResponse.json({ error: "This room keeps its own doors." }, { status: 403 });
    }

    const [conv, messages] = await Promise.all([
      db.networkConversation.findUnique({
        where: { id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, provider: true, image: true } } },
          },
        },
      }),
      db.networkMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
    ]);
    if (!conv) {
      return NextResponse.json({ error: "That room no longer stands." }, { status: 404 });
    }

    /* the reading mark is set down — the room is counted as heard */
    await db.networkConversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: visitor.user.id } },
      data: { lastReadAt: new Date() },
    });

    const others = conv.members.filter((m) => m.userId !== visitor.user.id);

    return withAnonCookie(
      NextResponse.json({
        conversation: {
          id: conv.id,
          isGroup: conv.isGroup,
          title: conv.title ?? (others[0] ? networkName(others[0].user) : "Just you"),
          members: conv.members.map((m) => ({
            id: m.userId,
            name: networkName(m.user),
            image: m.user.image ?? null,
            anon: m.user.provider === "anon",
          })),
        },
        messages: messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          mine: m.senderId === visitor.user.id,
          sender: {
            id: m.senderId,
            name:
              m.senderId === visitor.user.id
                ? networkName(visitor.user)
                : networkName(others.find((o) => o.userId === m.senderId)?.user ?? { name: null, email: "?", provider: "" }),
          },
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error("network conversation GET failed", err);
    return NextResponse.json({ error: "The room could not be read." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:message:${visitor.user.id}`, { limit: 40, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The room asks for a breath — speak again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const membership = await requireMembership(id, visitor.user.id);
    if (!membership) {
      return NextResponse.json({ error: "This room keeps its own doors." }, { status: 403 });
    }

    const raw = (await req.json().catch(() => null)) as { body?: unknown } | null;
    const body = raw && typeof raw.body === "string" ? raw.body.trim().slice(0, 4000) : "";
    if (body.length < 1) {
      return NextResponse.json({ error: "The words arrived empty." }, { status: 400 });
    }

    /* the quiet walls hold inside conversations too */
    const others = await db.networkConversationMember.findMany({
      where: { conversationId: id, userId: { not: visitor.user.id } },
      select: { userId: true },
    });
    const walls = await db.networkBlock.findMany({
      where: { OR: [{ blockerId: visitor.user.id }, { blockedId: visitor.user.id }] },
      select: { blockerId: true, blockedId: true },
    });
    const wallSet = new Set(walls.map((w) => (w.blockerId === visitor.user.id ? w.blockedId : w.blockerId)));
    const blockedMember = others.find((o) => wallSet.has(o.userId));
    if (blockedMember) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const created = await db.networkMessage.create({
      data: { conversationId: id, senderId: visitor.user.id, body },
    });
    await db.networkConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    await db.networkConversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: visitor.user.id } },
      data: { lastReadAt: new Date() },
    });

    /* the bell rings softly for the others */
    for (const o of others) {
      if (!wallSet.has(o.userId)) {
        await db.networkNotification.create({
          data: {
            userId: o.userId,
            type: "message",
            actorName: networkName(visitor.user),
            body: body.slice(0, 120),
            refType: "conversation",
            refId: id,
          },
        });
      }
    }

    return withAnonCookie(
      NextResponse.json({
        message: {
          id: created.id,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
          mine: true,
          sender: { id: visitor.user.id, name: networkName(visitor.user) },
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network conversation POST failed", err);
    return NextResponse.json({ error: "The words could not be spoken." }, { status: 500 });
  }
}
