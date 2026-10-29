import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  resolveVisitor,
  withAnonCookie,
  saveLibrary,
  updateLibrary,
  type LibrarySector,
} from "@/lib/server/access";

const LIBRARY_SECTORS: ReadonlySet<string> = new Set([
  "observatory",
  "manifest",
  "invent",
  "dreambook",
  "quantum",
  "evolvemed",
  "artx",
]);

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
        cover: r.cover ?? null,
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

/** PATCH /api/library — the book's own face arrives after the loom:
    the sky's own Gemini paints the volume's cover a breath after the
    open, and the visitor's room lays it on the entry here — the shelf
    and the market both read it from this one column. */
export async function PATCH(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "The cover arrived without its name." },
        { status: 400 }
      );
    }
    const b = body as Record<string, unknown>;

    const id = typeof b.id === "string" ? b.id : "";
    const cover = typeof b.cover === "string" ? b.cover : "";
    if (!id || !cover) {
      return NextResponse.json(
        { error: "The cover arrived without its name." },
        { status: 400 }
      );
    }
    /* the plate's own size law — the sky's covers ride well under it */
    if (cover.length > 4_500_000) {
      return NextResponse.json(
        { error: "The plate is too heavy for the shelf." },
        { status: 413 }
      );
    }

    const row = await db.libraryEntry.findFirst({
      where: { id, userId: visitor.user.id },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json(
        { error: "No volume of yours answers to that name." },
        { status: 404 }
      );
    }

    await db.libraryEntry.update({
      where: { id: row.id },
      data: { cover },
    });

    return withAnonCookie(
      NextResponse.json({ ok: true, id: row.id }),
      visitor
    );
  } catch (err) {
    console.error("[library/patch] failed:", err);
    return NextResponse.json(
      { error: "The cover could not be laid on the shelf just now." },
      { status: 500 }
    );
  }
}

/** POST /api/library — the visitor's own hand lays a transmission in its
    sector, and the house's quiet autosave whispers here too. One living
    volume per conversation surface: a thread that continues refreshes its
    own entry, it never accumulates copies on the shelf. */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "The volume arrived without its pages." },
        { status: 400 }
      );
    }
    const b = body as Record<string, unknown>;

    const sector = typeof b.sector === "string" ? b.sector : "";
    if (!LIBRARY_SECTORS.has(sector)) {
      return NextResponse.json(
        { error: "That sector is not one of the library's rooms." },
        { status: 400 }
      );
    }

    const content = b.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      return NextResponse.json(
        { error: "The volume arrived without its pages." },
        { status: 400 }
      );
    }

    const title =
      typeof b.title === "string" && b.title.trim()
        ? b.title.slice(0, 140)
        : "A transmission";
    const excerpt = typeof b.excerpt === "string" ? b.excerpt.slice(0, 280) : "";

    /* The living-volume law: a conversation updates its own entry. */
    let livingId: string | null = null;
    const c = content as Record<string, unknown>;
    if (c.kind === "conversation" && typeof c.surface === "string") {
      const rows = await db.libraryEntry.findMany({
        where: { userId: visitor.user.id, sector },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      for (const r of rows) {
        try {
          const old = JSON.parse(r.content) as Record<string, unknown>;
          if (old && old.kind === "conversation" && old.surface === c.surface) {
            livingId = r.id;
            break;
          }
        } catch {
          /* a row that does not speak conversation — pass it by */
        }
      }
    }

    const id = livingId
      ? (await updateLibrary(
          visitor.user.id,
          livingId,
          title,
          excerpt,
          content,
          60000
        ),
        livingId)
      : await saveLibrary(
          visitor.user.id,
          sector as LibrarySector,
          title,
          excerpt,
          content,
          60000
        );

    if (!id) {
      return NextResponse.json(
        { error: "The shelf did not receive the volume. Rest, then return." },
        { status: 503 }
      );
    }

    return withAnonCookie(NextResponse.json({ ok: true, id }), visitor);
  } catch (err) {
    console.error("[library] post failed:", err);
    return NextResponse.json(
      { error: "The library is momentarily veiled. Rest, then return." },
      { status: 500 }
    );
  }
}
