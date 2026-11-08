import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  THE TAKING-BACK HAND — DELETE /api/gathering/[id]                  */
/*                                                                     */
/*  An offering belongs to its maker: only its own hand may take it    */
/*  out of the hall, echoes and resonances leaving with it.            */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }
    if (post.userId !== visitor.user.id) {
      return NextResponse.json({ error: "Only an offering's own maker may take it back." }, { status: 403 });
    }

    await db.gatheringPost.delete({ where: { id } });

    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("gathering DELETE failed", err);
    return NextResponse.json({ error: "The offering could not be taken back." }, { status: 500 });
  }
}
