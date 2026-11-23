import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  OWNER_KEY,
  boundedJson,
  guardCreation,
  packOwned,
  unpackOwned,
} from "@/lib/server/creation-guard";

/* ------------------------------------------------------------------ */
/*  THE ARTIFACT REGISTER — every finished creation is written here:   */
/*  its type, its title, its source conversation and branch, its file  */
/*  references (the files themselves rest on the visitor's own device  */
/*  — the house's keeping law — or at a reference the sky returned),   */
/*  and its metadata. Versioned, bounded, honest.                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

/* identity, flood-gates and ownership — see lib/server/creation-guard.ts.
   The register lists only the visitor's own creations; rows written
   before the guard carry no owner and are not listed (nothing is deleted). */
const GATE = {
  bucket: "creation-artifacts",
  perVisitor: { limit: 60, windowMs: 60 * 1000 },
  perIp: { limit: 200, windowMs: 60 * 1000 },
};
const MAX_JSON = 100_000;

type Row = { metadata: string; files: string } & Record<string, unknown>;
function present(a: Row) {
  return { ...a, files: [], metadata: undefined, metadataRaw: JSON.stringify(unpackOwned(a.metadata).value ?? {}) };
}

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
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  let body: ArtifactBody;
  try {
    body = (await req.json()) as ArtifactBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  const type = typeof body.type === "string" && TYPES.has(body.type) ? body.type : "";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  if (!type || !title) {
    return guard.reply(NextResponse.json({ error: "type and title are needed" }, { status: 400 }));
  }
  const files = Array.isArray(body.files) ? body.files.slice(0, 8) : [];
  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
  if (boundedJson(files, MAX_JSON) === null || boundedJson(metadata, MAX_JSON) === null) {
    return guard.reply(NextResponse.json({ error: "that creation is too large for the register" }, { status: 413 }));
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
        files: JSON.stringify(files),
        metadata: packOwned(metadata, guard.userId),
      },
    });
    return guard.reply(NextResponse.json({ artifact: present(artifact) }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the register could not be written" }, { status: 500 }));
  }
}

export async function GET(req: NextRequest) {
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  const type = req.nextUrl.searchParams.get("type");
  try {
    const candidates = await db.creationArtifact.findMany({
      where: {
        metadata: { contains: `"${OWNER_KEY}":"${guard.userId}"` },
        ...(type && TYPES.has(type) ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    const mine = candidates
      .filter((a) => unpackOwned(a.metadata).owner === guard.userId)
      .slice(0, 30)
      .map((a) => present(a as unknown as Row));
    return guard.reply(NextResponse.json({ artifacts: mine }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the register could not be read" }, { status: 500 }));
  }
}
