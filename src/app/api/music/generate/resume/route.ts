import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { resumeMusicJob } from "@/lib/server/music/job";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  THE CONTINUE ACTION — POST /api/music/generate/resume               */
/*                                                                      */
/*  An interrupted or partially-failed generation comes back to life:   */
/*  ONLY the tracks that are not already held are re-submitted, each    */
/*  charged once at its own price. Ready songs are never touched and    */
/*  never charged again — nothing is paid for twice.                    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`music-resume:${requestIp(req)}`, GATES.ai);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The sky needs a breath. Try again in a moment." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(
        NextResponse.json(
          { error: "The shelf rests while the vault rests.", code: "shelf_unavailable" },
          { status: 503 }
        ),
        visitor
      );
    }
    const userId = visitor.user.id;

    const body = (await req.json().catch(() => null)) as { jobId?: string } | null;
    const jobId = typeof body?.jobId === "string" ? body.jobId : null;
    if (!jobId) {
      return withAnonCookie(
        NextResponse.json({ error: "Name the generation to continue." }, { status: 400 }),
        visitor
      );
    }

    const view = await resumeMusicJob(jobId, userId, userId);
    return withAnonCookie(NextResponse.json({ job: view }), visitor);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "not_found" || code === "forbidden") {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
    if (code === "nokey") {
      return NextResponse.json({ error: (err as Error).message, code }, { status: 501 });
    }
    console.error("[music/resume] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The continue stumbled. Rest, then try again." },
      { status: 500 }
    );
  }
}
