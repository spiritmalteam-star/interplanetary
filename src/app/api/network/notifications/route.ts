import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { networkName } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE BELL — /api/network/notifications                              */
/*                                                                     */
/*  GET  — the rings, newest first, the unread marked.                 */
/*  POST — the reading hand: one ring, or every ring, set as heard.    */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const rows = await db.networkNotification.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    return withAnonCookie(
      NextResponse.json({
        notifications: rows.map((n) => ({
          id: n.id,
          type: n.type,
          actorName: n.actorName,
          body: n.body,
          refType: n.refType,
          refId: n.refId,
          read: n.readAt !== null,
          createdAt: n.createdAt.toISOString(),
        })),
        unread: rows.filter((n) => n.readAt === null).length,
      }),
      visitor
    );
  } catch (err) {
    console.error("network notifications GET failed", err);
    return NextResponse.json({ error: "The bell could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const raw = (await req.json().catch(() => ({}))) as { id?: unknown; all?: unknown } | null;

    if (raw?.all === true) {
      await db.networkNotification.updateMany({
        where: { userId: visitor.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return withAnonCookie(NextResponse.json({ ok: true }), visitor);
    }

    if (typeof raw?.id === "string") {
      await db.networkNotification.updateMany({
        where: { id: raw.id, userId: visitor.user.id },
        data: { readAt: new Date() },
      });
      return withAnonCookie(NextResponse.json({ ok: true }), visitor);
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network notifications POST failed", err);
    return NextResponse.json({ error: "The bell could not be set down." }, { status: 500 });
  }
}
