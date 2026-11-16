import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/admin";
import { getLcEngineStatus } from "@/lib/server/lc-engine";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the keeper's diagnostic. The chamber's engine        */
/*  state, spoken plainly: is the key placed, which doors have been    */
/*  proven, what the engine last said, what the day has spent.         */
/*                                                                      */
/*  THE KEEPING LAW: this door opens only for the keeper's own signed  */
/*  session (ADMIN_EMAIL). No secret ever rides home — only the shape  */
/*  of the truth around it. An ordinary visitor receives silence       */
/*  (403), and the chamber shows them nothing at all.                  */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "The keeper's door only." }, { status: 403 });
  }

  const engine = getLcEngineStatus();

  return NextResponse.json({
    provider: "Google DeepMind Lyria",
    via: "official Gemini API (@google/genai) · Interactions",
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
    models: {
      preview: {
        id: process.env.LYRIA_MODEL || "lyria-3.5",
        purpose: "previews — the piece finds its own natural length",
      },
      full: {
        id: process.env.LYRIA_MODEL || "lyria-3.5",
        purpose: "full compositions",
      },
    },
    limits: engine.limits,
    weavingNow: engine.weavingNow,
    generationsToday: engine.globalToday,
    lastSuccess: engine.lastSuccess,
    lastError: engine.lastError,
    instanceNote: engine.instanceNote,
  });
}
