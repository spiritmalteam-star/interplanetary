import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";

/** The Light passage — lifts the daily limits of the Crystalline key.
    A quiet self-attunement of the portal; no coin is asked here. */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "The Light passage opens after the Crystalline key — sign in first." },
        { status: 401 }
      );
    }
    await db.user.update({ where: { id: user.id }, data: { tier: "light" } });
    return NextResponse.json({ user: { ...user, tier: "light" } });
  } catch (err) {
    console.error("[auth/upgrade] failed:", err);
    return NextResponse.json(
      { error: "The Light could not be attuned. Rest, then try again." },
      { status: 500 }
    );
  }
}
