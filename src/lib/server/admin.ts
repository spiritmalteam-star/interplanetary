import { db } from "@/lib/db";
import { hashPassword } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  THE KEEPER'S KEY — the admin passage.                              */
/*                                                                     */
/*  The Fuel Engine Incubator is visible to exactly one passage:       */
/*  the ADMIN_EMAIL in the vault (env). Every admin route checks the   */
/*  signed session against this key — the browser is never trusted.    */
/* ------------------------------------------------------------------ */

export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "gentikoltraka28@gmail.com"
).toLowerCase();

/** True when a session email is the keeper's own. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && !email.startsWith("anon:") && email.toLowerCase() === ADMIN_EMAIL);
}

/** The admin truth of a signed session — used by every admin route.
 *  Two keys open the same door: the env key (ADMIN_EMAIL matched against
 *  the signed session's database identity) and the role carved into the
 *  user row at boot — so the keeper stays the keeper even if the env
 *  var is later renamed. The browser is never trusted. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  try {
    const { getSessionUser } = await import("@/lib/server/access");
    const user = await getSessionUser(req as Parameters<typeof getSessionUser>[0]);
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return isAdminEmail(user.email);
  } catch {
    return false;
  }
}

/**
 * The keeper's account, laid down idempotently: the admin passage exists,
 * carries a working password, and is verified — so the keeper can always
 * sign in and reach the Fuel Engine. Called by the seed script and by the
 * fuel status route's first breath.
 */
export async function ensureAdminAccount(password: string): Promise<{ email: string; created: boolean }> {
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    await db.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        passwordHash: hashPassword(password),
        provider: "email",
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      },
    });
    return { email: ADMIN_EMAIL, created: false };
  }
  await db.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hashPassword(password),
      provider: "email",
      emailVerifiedAt: new Date(),
    },
  });
  return { email: ADMIN_EMAIL, created: true };
}
