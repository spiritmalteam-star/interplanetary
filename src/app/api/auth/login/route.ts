import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  loginAttemptsExceeded,
  mergeAnonLibrary,
  readAnonId,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

export async function POST(req: NextRequest) {
  try {
    /* the flood-gates: twelve door attempts per quarter hour per IP */
    const gate = rateLimit(`login:${requestIp(req)}`, GATES.auth);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The doors rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "The passage needs both an email and its secret." },
        { status: 400 }
      );
    }
    if (loginAttemptsExceeded(email)) {
      return NextResponse.json(
        { error: "The door rests a while. Return in a quarter of an hour." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      // one message for both cases — the email's existence never leaks
      return NextResponse.json(
        { error: "The passage does not open with those words." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      user: { email: user.email, name: user.name, tier: user.tier === "light" ? "light" : "crystalline" },
    });
    setSessionCookie(res, user.id);
    /* make sure the passage carries its workspace, ledger and gift —
       also for accounts carved before the provisions existed */
    await ensureVisitorProvisions(user.id);
    /* everything the anonymous cookie kept comes with the visitor */
    await mergeAnonLibrary(readAnonId(req), user.id);
    return res;
  } catch (err) {
    console.error("[auth/login] failed:", err);
    return NextResponse.json(
      { error: "The passage could not be opened. Rest, then try again." },
      { status: 500 }
    );
  }
}
