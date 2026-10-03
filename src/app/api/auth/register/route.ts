import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/server/access";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicUser(u: { email: string; name: string | null; tier: string }) {
  return { email: u.email, name: u.name, tier: u.tier === "light" ? "light" : "crystalline" };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";

    if (!EMAIL_RE.test(email) || email.length > 160) {
      return NextResponse.json(
        { error: "That email does not look ready to receive light." },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A passage needs at least 8 characters to hold its door." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "This email already holds a passage. Sign in instead." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: { email, name: name || null, passwordHash: hashPassword(password), provider: "email" },
    });

    const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
    setSessionCookie(res, user.id);
    return res;
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "This email already holds a passage." }, { status: 409 });
    }
    console.error("[auth/register] failed:", err);
    return NextResponse.json(
      { error: "The passage could not be carved. Rest, then try again." },
      { status: 500 }
    );
  }
}
