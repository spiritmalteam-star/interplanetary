import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE ARTIFACT REGISTER — every finished creation is written here:   */
/*  its type, its title, its source conversation and branch, its file  */
/*  references (the files themselves rest on the visitor's own device  */
/*  — the house's keeping law — or at a reference the sky returned),   */
/*  and its metadata. Versioned, bounded, honest.                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

type ArtifactBody = {
  type?: string;
  title?: string;
  description?: string;
  status?: string;
  jobId?: string;
  sourceConvId?: string;
  sourceBranch?: string;
  files?: unknown;
  metadata?: unknown;
};

const TYPES = new Set(["video", "book", "image", "song", "scene", "invention", "document"]);

export async function POST(req: NextRequest) {
  let body: ArtifactBody;
  try {
    body = (await req.json()) as ArtifactBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  const type = typeof body.type === "string" && TYPES.has(body.type) ? body.type : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  if (!type || !title) {
    return NextResponse.json({ error: "type and title are needed" }, { status: 400 });
  }
  try {
    const artifact = await db.creationArtifact.create({
      data: {
        type,
        title,
        description: typeof body.description === "string" ? body.description.slice(0, 400) : null,
        status: body.status === "draft" ? "draft" : "ready",
        jobId: typeof body.jobId === "string" ? body.jobId.slice(0, 64) : null,
        sourceConvId: typeof body.sourceConvId === "string" ? body.sourceConvId.slice(0, 64) : null,
        sourceBranch: typeof body.sourceBranch === "string" ? body.sourceBranch.slice(0, 300) : null,
        files: JSON.stringify(Array.isArray(body.files) ? body.files.slice(0, 8) : []),
        metadata: JSON.stringify(
          body.metadata && typeof body.metadata === "object" ? body.metadata : {}
        ),
      },
    });
    return NextResponse.json({ artifact: { ...artifact, files: [], metadataRaw: artifact.metadata } });
  } catch {
    return NextResponse.json({ error: "the register could not be written" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  try {
    const artifacts = await db.creationArtifact.findMany({
      where: type && TYPES.has(type) ? { type } : undefined,
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ artifacts });
  } catch {
    return NextResponse.json({ error: "the register could not be read" }, { status: 500 });
  }
}
