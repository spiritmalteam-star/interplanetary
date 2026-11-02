/* ------------------------------------------------------------------ */
/*  THE ROLES — the platform's access hierarchy.                       */
/*                                                                     */
/*  Seven ranks, checked server-side on every protected operation:     */
/*    OWNER         — the keeper of the whole platform                 */
/*    SUPER_ADMIN   — the owner's appointed seconds                    */
/*    ADMIN         — the console's hands (the existing bound role)    */
/*    MODERATOR     — the community's shepherds (reserved)             */
/*    SUPPORT       — the helping passage (reserved)                   */
/*    PREMIUM       — a paying passage (reserved; entitlement lives    */
/*                    in UserWallet.planTier, not here)                */
/*    STANDARD      — every signed passage                             */
/*                                                                     */
/*  The database stores the role as a plain string on User.role; the   */
/*  existing "ADMIN" binding (seeded from ADMIN_EMAIL at boot) keeps   */
/*  its meaning — the hierarchy READS it at rank 50. The owner's       */
/*  email (OWNER_EMAIL/ADMIN_EMAIL in the vault) stands at rank 70     */
/*  without touching the database. Anonymous passages never rank.      */
/* ------------------------------------------------------------------ */

export type Role =
  | "OWNER"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATOR"
  | "SUPPORT"
  | "PREMIUM"
  | "STANDARD"
  | "user";

const RANK: Record<string, number> = {
  OWNER: 70,
  SUPER_ADMIN: 60,
  ADMIN: 50,
  MODERATOR: 40,
  SUPPORT: 30,
  PREMIUM: 20,
  STANDARD: 10,
  user: 10,
};

export type RoleThreshold = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT" | "STANDARD";

/** Does a stored role clear a threshold? The owner's email counts as
 *  OWNER even when the row still carries "ADMIN" (the binding is not
 *  rewritten — the vault's word is enough). */
export function roleAtLeast(
  role: string | null | undefined,
  threshold: RoleThreshold,
  email?: string | null
): boolean {
  if (!role && !email) return false;
  if (email && !email.startsWith("anon:")) {
    const owner = (process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || "").toLowerCase();
    if (owner && email.toLowerCase() === owner) return true;
  }
  const rank = role ? RANK[role] : undefined;
  if (rank == null) return false;
  return rank >= RANK[threshold];
}

export interface RoleGateResult {
  ok: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  reason: "no_session" | "anonymous" | "insufficient_role" | null;
}

/** The server-side role gate for protected operations. Resolves the
 *  signed session (never the browser's claim), excludes anonymous
 *  passages, and answers with an honest reason. */
export async function requireRole(
  req: Request,
  threshold: RoleThreshold
): Promise<RoleGateResult> {
  try {
    const { getSessionUser } = await import("@/lib/server/access");
    const user = await getSessionUser(req as Parameters<typeof getSessionUser>[0]);
    if (!user) return { ok: false, user: null, reason: "no_session" };
    const email = (user as { email?: string | null }).email ?? null;
    if (email && email.startsWith("anon:")) {
      return { ok: false, user: null, reason: "anonymous" };
    }
    const role = (user as { role?: string | null }).role ?? null;
    if (!roleAtLeast(role, threshold, email)) {
      return { ok: false, user: null, reason: "insufficient_role" };
    }
    return {
      ok: true,
      reason: null,
      user: {
        id: (user as { id: string }).id,
        email: email ?? "",
        role: role ?? "user",
      },
    };
  } catch {
    return { ok: false, user: null, reason: "no_session" };
  }
}

/** The admin gate — the drop-in for every console door. */
export async function requireAdmin(req: Request): Promise<RoleGateResult> {
  return requireRole(req, "ADMIN");
}
