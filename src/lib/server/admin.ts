import { db } from "@/lib/db";
import { hashPassword } from "@/lib/server/access";
import { roleAtLeast } from "@/lib/server/roles";

/* ------------------------------------------------------------------ */
/*  THE KEEPER'S KEY — the admin passage.                              */
/*                                                                     */
/*  The Fuel Engine Incubator is visible to exactly one passage:       */
/*  the ADMIN_EMAIL in the vault (env). Every admin route checks the   */
/*  signed session against this key — the browser is never trusted.    */
/* ------------------------------------------------------------------ */

/* THERE IS NO DEFAULT KEEPER — the ADMIN_EMAIL must come from the
   vault. A deployment without it simply has no email-shortcut admin
   (the role bound in the database still rules). No personal address
   is ever hardcoded into the house again. */
export const ADMIN_EMAIL: string | null =
  process.env.ADMIN_EMAIL?.toLowerCase().trim() || null;

/** True when a session email is the keeper's own. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(
    email &&
      !email.startsWith("anon:") &&
      ADMIN_EMAIL &&
      email.toLowerCase() === ADMIN_EMAIL
  );
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
    return roleAtLeast(user.role, "ADMIN", user.email);
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
  if (!ADMIN_EMAIL) {
    /* no keeper named in the vault — the house lays no account */
    throw new Error("ADMIN_EMAIL is not set — no keeper account can be ensured.");
  }
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
