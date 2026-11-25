import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE GAZE HAND — POST /api/gathering/[id]/view                      */
/*                                                                     */
/*  The possibilities realm's honest gaze counter: one landing of a    */
/*  slide, one gaze spoken to the offering's own column. The realm     */
/*  itself pings at most once per work per visit, so the number stays  */
/*  a measure of being seen, not of scrolling. No visitor data is      */
/*  kept here — a gaze carries no name.                                */
/* ------------------------------------------------------------------ */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!post || post.status !== "published") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const updated = await db.gatheringPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ ok: true, viewCount: updated.viewCount });
  } catch (err) {
    /* a young sky without the column yet — the gaze is simply not
       counted, the walk goes on undisturbed */
    console.error("gathering view ping failed", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
