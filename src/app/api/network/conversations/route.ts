import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE MESSAGES' HALLS — /api/network/conversations                   */
/*                                                                     */
/*  GET  — the conversations the visitor keeps: one-to-one and group,  */
/*         each wearing its unread truth.                              */
/*  POST — open a door: a one-to-one with a maker, or a group with     */
/*         invited members. Doors never open toward a closed wall.     */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const memberships = await db.networkConversationMember.findMany({
      where: { userId: visitor.user.id },
      orderBy: { conversation: { updatedAt: "desc" } },
      take: 50,
      include: {
        conversation: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true, provider: true, image: true } } },
            },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: true } },
          },
        },
      },
    });

    const conversations = memberships.map((m) => {
      const c = m.conversation;
      const others = c.members.filter((x) => x.userId !== visitor.user.id);
      const last = c.messages[0] ?? null;
      const unread = last
        ? last.senderId !== visitor.user.id && last.createdAt > m.lastReadAt
          ? 1
          : 0
        : 0;
      return {
        id: c.id,
        isGroup: c.isGroup,
        title:
          c.title ??
          (others[0] ? networkName(others[0].user) : "Just you"),
        members: c.members.map((x) => ({
          id: x.userId,
          name: networkName(x.user),
          image: x.user.image ?? null,
          anon: x.user.provider === "anon",
        })),
        lastMessage: last
          ? {
              body: last.body,
              senderId: last.senderId,
              senderName:
                last.senderId === visitor.user.id
                  ? "You"
                  : networkName(others.find((o) => o.userId === last.senderId)?.user ?? { name: null, email: "?", provider: "" }),
              createdAt: last.createdAt.toISOString(),
            }
          : null,
        unreadCount: unread,
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return withAnonCookie(NextResponse.json({ conversations }), visitor);
  } catch (err) {
    console.error("network conversations GET failed", err);
    return NextResponse.json({ error: "The conversations could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:conversation:create:${visitor.user.id}`, { limit: 12, windowMs: 60 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The halls ask for a breath — open again in a little while." },
        { status: 429 }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      userId?: unknown;
      title?: unknown;
      memberIds?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The request arrived unreadable." }, { status: 400 });
    }

    const walls = await wallIdsFor(visitor.user.id);

    if (typeof raw.userId === "string") {
      /* -------- one-to-one -------- */
      const targetId = raw.userId;
      if (targetId === visitor.user.id) {
        return NextResponse.json({ error: "One's own voice is always near." }, { status: 400 });
      }
      if (walls.has(targetId)) {
        return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
      }
      const target = await db.user.findUnique({
        where: { id: targetId },
        select: { id: true, name: true, email: true, provider: true, image: true },
      });
      if (!target) {
        return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
      }

      /* the same pair already keeps a room — it is used, never doubled */
      const mine = await db.networkConversationMember.findMany({
        where: { userId: visitor.user.id },
        select: { conversationId: true },
      });
      const theirs = await db.networkConversationMember.findMany({
        where: { userId: targetId },
        select: { conversationId: true },
      });
      const mineSet = new Set(mine.map((m) => m.conversationId));
      const shared = theirs.find((t) => mineSet.has(t.conversationId));
      if (shared) {
        const conv = await db.networkConversation.findUnique({
          where: { id: shared.conversationId },
          select: { id: true, isGroup: true },
        });
        if (conv && !conv.isGroup) {
          return withAnonCookie(NextResponse.json({ conversationId: conv.id, existed: true }), visitor);
        }
      }

      const created = await db.networkConversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: visitor.user.id },
              { userId: targetId },
            ],
          },
        },
      });
      return withAnonCookie(
        NextResponse.json({ conversationId: created.id, existed: false }),
        visitor
      );
    }

    if (Array.isArray(raw.memberIds) && raw.memberIds.length >= 1) {
      /* -------- a group conversation -------- */
      const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 60) : "";
      if (title.length < 3) {
        return NextResponse.json({ error: "A conversation's name wants at least 3 letters." }, { status: 400 });
      }
      const memberIds = Array.from(
        new Set(raw.memberIds.filter((x): x is string => typeof x === "string" && x !== visitor.user.id))
      ).slice(0, 12);
      if (memberIds.some((id) => walls.has(id))) {
        return NextResponse.json({ error: "One of these doors rests closed." }, { status: 403 });
      }
      const real = await db.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true },
      });
      const created = await db.networkConversation.create({
        data: {
          isGroup: true,
          title,
          members: {
            create: [
              { userId: visitor.user.id },
              ...real.map((r) => ({ userId: r.id })),
            ],
          },
        },
      });
      return withAnonCookie(
        NextResponse.json({ conversationId: created.id, existed: false }),
        visitor
      );
    }

    return NextResponse.json({ error: "Choose who the conversation gathers." }, { status: 400 });
  } catch (err) {
    console.error("network conversations POST failed", err);
    return NextResponse.json({ error: "The conversation could not be opened." }, { status: 500 });
  }
}
