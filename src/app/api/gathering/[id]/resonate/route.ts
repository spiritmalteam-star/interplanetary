import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  THE RESONANCE HAND — POST /api/gathering/[id]/resonate             */
/*                                                                     */
/*  Resonance is a tuning, not a trophy: one touch strikes it, the     */
/*  same touch takes it back. No counter races — the hall's counts     */
/*  are read from the truth (the resonance table) after the move.      */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }

    const existing = await db.gatheringResonance.findUnique({
      where: { postId_userId: { postId: id, userId: visitor.user.id } },
      select: { id: true },
    });

    if (existing) {
      await db.gatheringResonance.delete({ where: { id: existing.id } });
    } else {
      await db.gatheringResonance.create({
        data: { postId: id, userId: visitor.user.id },
      });
    }

    const count = await db.gatheringResonance.count({ where: { postId: id } });

    /* the column carries the truth forward — the hall's reads never
       drift from the resonance table (a strike is written, not just
       counted) */
    await db.gatheringPost.update({
      where: { id },
      data: { resonanceCount: count },
    });

    return withAnonCookie(
      NextResponse.json({ resonated: !existing, resonanceCount: count }),
      visitor
    );
  } catch (err) {
    console.error("gathering resonate failed", err);
    return NextResponse.json({ error: "The resonance could not be struck." }, { status: 500 });
  }
}
