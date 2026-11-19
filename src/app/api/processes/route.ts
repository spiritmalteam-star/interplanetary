import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meterRoute } from "@/lib/server/meter";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  /api/processes — THE HALL OF WORKS IN MOTION.                      */
/*                                                                     */
/*  GET — the visitor's own hall: every carrying process (the deep     */
/*        research presses and whatever weaves follow), its honest     */
/*        progress, stage, and result.                                 */
/* ------------------------------------------------------------------ */

export interface ProcessJobLite {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  status: string;
  progress: number;
  stage: string | null;
  error: string | null;
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function toProcessLite(row: {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  status: string;
  progress: number;
  stage: string | null;
  error: string | null;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProcessJobLite {
  let result: Record<string, unknown> | null = null;
  if (row.result) {
    try {
      const parsed = JSON.parse(row.result) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        result = parsed as Record<string, unknown>;
      }
    } catch {
      /* an unreadable result is no result */
    }
  }
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    status: row.status,
    progress: row.progress,
    stage: row.stage,
    error: row.error,
    result,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const GET = meterRoute("processes-list", async (req: NextRequest) => {
  const visitor = await resolveVisitor(req);
  try {
    const rows = await db.processJob.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return withAnonCookie(
      NextResponse.json({ jobs: rows.map(toProcessLite) }),
      visitor
    );
  } catch {
    return NextResponse.json({ jobs: [] });
  }
});

export const maxDuration = 60;
