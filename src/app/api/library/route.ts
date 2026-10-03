import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";

/** GET /api/library — the visitor's own cosmic library: every saved
    transmission of every sector, newest first, read by its one owner. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { code: "auth", error: "The cosmic library opens with the Crystalline key." },
        { status: 401 }
      );
    }

    const rows = await db.libraryEntry.findMany({
      where: { userId: user.id },
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

    return NextResponse.json({ entries, counts });
  } catch (err) {
    console.error("[library] failed:", err);
    return NextResponse.json(
      { error: "The library is momentarily veiled. Rest, then return." },
      { status: 500 }
    );
  }
}
