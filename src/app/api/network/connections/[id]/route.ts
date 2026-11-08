import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { networkName, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE INTRODUCTION'S DOOR — POST /api/network/connections/[id]       */
/*                                                                     */
/*  The addressee's own hands: accept, or let the request rest.        */
/*  Nothing is ever auto-accepted; consent is the network's law.       */
/* ------------------------------------------------------------------ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const raw = (await req.json().catch(() => null)) as { action?: unknown } | null;
    if (!raw || (raw.action !== "accept" && raw.action !== "decline")) {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    const connection = await db.networkConnection.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, provider: true } },
        addressee: { select: { id: true } },
      },
    });
    if (!connection) {
      return NextResponse.json({ error: "That introduction no longer stands." }, { status: 404 });
    }
    if (connection.addresseeId !== visitor.user.id) {
      return NextResponse.json({ error: "Only the asked hand may answer." }, { status: 403 });
    }

    if (raw.action === "decline") {
      await db.networkConnection.delete({ where: { id } });
      return withAnonCookie(NextResponse.json({ status: "declined" }), visitor);
    }

    await db.networkConnection.update({
      where: { id },
      data: { status: "accepted", updatedAt: new Date() },
    });
    await notify({
      userId: connection.requesterId,
      actorId: visitor.user.id,
      actorName: networkName(visitor.user),
      type: "connection_accepted",
      refType: "user",
      refId: visitor.user.id,
    });
    return withAnonCookie(NextResponse.json({ status: "accepted" }), visitor);
  } catch (err) {
    console.error("network connection POST failed", err);
    return NextResponse.json({ error: "The answer could not be given." }, { status: 500 });
  }
}
