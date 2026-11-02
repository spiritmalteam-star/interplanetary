# THE LAUNCH RUNBOOK — Enterprise Rebirth

**Branch:** `enterprise-rebirth` (this branch, pushed — production `main` is untouched until the owner approves).

---

## 1. Branch & deployment law

- `main` remains the production branch (Vercel production domain).
- `enterprise-rebirth` carries the whole transformation. Pushing it produces a **Vercel Preview deployment automatically** (git-integration default). If previews are disabled for the repo, create them in Vercel → Project → Git → Preview Deployments.
- Merge to `main` happens ONLY after: preview verification + the owner's explicit approval + (if the reset is approved) the reset ceremony.

## 2. Staging (create before production work)

1. Vercel → Add New… → Project → import the same repo, set **production branch = `enterprise-rebirth`** (this project IS staging), name it `reflectme-staging`.
2. Give it its **own database** (any Postgres provider; never the production `DATABASE_URL`). Set `DATABASE_URL` in the staging project only.
3. Set the staging env vars from `.env.example` (all names are documented there): `AUTH_SECRET` (fresh), `ADMIN_EMAIL`, `ZAI_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` as needed, `WALLET_ENFORCED`, `STRIPE_SECRET_KEY` **left unset in staging** unless testing billing with Stripe test keys + a separate webhook secret.
4. First boot creates reserves, binds the admin role from `ADMIN_EMAIL`, and (on a fresh DB) gates the birth-gift lift to named accounts.

## 3. Environment variables — NO production value is overwritten by this work

Nothing in this branch requires a new env var on Vercel. The code's secure defaults changed in exactly two places:

- `COMPLIMENTARY_CHECKOUT` now defaults **closed** when neither env nor PlatformConfig speaks. If the owner wants the free-claim door open in production, set `COMPLIMENTARY_CHECKOUT=true` (or flip the `complimentary_checkout` PlatformConfig switch) — an explicit, deliberate act.
- `ADMIN_EMAIL` no longer carries a hardcoded personal-address fallback. Production already sets `ADMIN_EMAIL` (the admin binding is carved into the database at boot), so behavior is unchanged there; any deployment WITHOUT the var simply has no email-shortcut admin.

## 4. Verification gates (all must be green before merge)

1. `bunx tsc --noEmit` — clean (the only remaining error lives in `skills/`, outside the build).
2. `bun run lint` — clean.
3. Dev boot + Agent Browser golden paths: landing, conversation, registration, profile, command center (admin), account export.
4. Vercel Preview: repeat (3) against the preview URL.
5. `bun scripts/reset-user-data.ts plan` against the staging database → inventory sane.

## 5. Production migration & launch plan (owner-approved sequence)

1. Announce-freeze: deploy the code (merge), verify boot + health.
2. Backup: `bun scripts/reset-user-data.ts backup` against production (from a machine holding production `DATABASE_URL`), download the backup folder.
3. Restore-test the backup into a scratch database.
4. Owner approval gate (see RESET-PLAN.md §10).
5. `bun scripts/reset-user-data.ts execute --confirm=RESET-REFLECTME` against production.
6. Post-reset verification: register a fresh account, verify empty environment, confirm the owner login, confirm prices/config intact.
7. Rollback at any point: `bun scripts/reset-user-data.ts restore <dir>`.

## 6. Rollback of the CODE

`main` is untouched; if a merged change misbehaves, revert the merge commit and redeploy (Vercel instant rollback to the previous deployment also works).

## 7. Security posture of this branch (what changed)

| Change | Effect |
|---|---|
| `src/middleware.ts` | Security headers (nosniff, frame-deny, referrer, permissions, HSTS, CSP report-only) + `x-request-id` correlation + keyless-knock rejection on `/api/admin/*` |
| No default admin email | Hardcoded personal address removed from `admin.ts` + `economy/route.ts` |
| Complimentary checkout | Defaults CLOSED (was open) |
| `isAdminKey` | Timing-safe comparison |
| Birth gift | 500-light lift now named-accounts-only (anti-farming) |
| Role hierarchy | `src/lib/server/roles.ts` — OWNER/SUPER_ADMIN/ADMIN/MODERATOR/SUPPORT/PREMIUM/STANDARD, server-side gates |
| Audit trail | `AuditEvent` table + `recordAudit` on every admin mutation (grant, deduct, set_prices, switches, announcements) |
| Structured logs | `src/lib/server/logger.ts` — JSON lines with correlation ids, secrets shaved |
| GDPR workflows | `/api/account/export` (full data export), `/api/account/delete` (typed-confirmation erasure, financial rows kept) |
| Schema drift | `ProcessJob` added to the Postgres schema |

## 8. Known remaining work (honest list)

- MFA / enterprise SSO: reserved in the role model, not implemented.
- Org workspaces / teams: schema has Workspace+Member; management UI is planned.
- Shared rate-limit store (Upstash/Redis) for multi-instance fleets: current limiter is per-instance (documented in code).
- Enforcing CSP (from report-only): after the reports run quiet in production.
- `/api/auth/upgrade` legacy tier self-assign: dormant, no gating effect, scheduled for removal.
- Lighthouse re-run: not executable from this sandbox — run against the preview URL (targets: mobile LCP < 2.5s, LH 90+).
