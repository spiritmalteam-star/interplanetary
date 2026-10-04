import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/** GET /api/library — the visitor's own cosmic library: every saved
    transmission of every sector, newest first, read by its one owner.
    Everything is free — the library opens for every visitor, kept by
    their signed passage or by their anonymous cookie. */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const rows = await db.libraryEntry.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const entries = rows.map((r) => {
      let content: unknown = null;
      try {
        content = JSON.parse(r.content);
      } catch {
        content = { reply: r.content };
      }
      return {
        id: r.id,
        sector: r.sector,
        title: r.title,
        excerpt: r.excerpt,
        content,
        createdAt: r.createdAt.toISOString(),
      };
    });

    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.sector] = (counts[e.sector] ?? 0) + 1;

    return withAnonCookie(NextResponse.json({ entries, counts }), visitor);
  } catch (err) {
    console.error("[library] failed:", err);
    return NextResponse.json(
      { error: "The library is momentarily veiled. Rest, then return." },
      { status: 500 }
    );
  }
}
