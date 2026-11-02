# THE FRESH START PLAN — Production User-Data Reset

**Status: AWAITING OWNER APPROVAL — nothing has been deleted.**
**Prepared:** Enterprise Rebirth, Task 84 · 2026-11-02
**Tool:** `scripts/reset-user-data.ts` (plan · backup · restore · execute)

---

## 1. Complete data inventory (every store, audited)

| # | Store | Location | Kind | Reset? |
|---|---|---|---|---|
| 1 | Production database | **Vercel deployment** — `DATABASE_URL` in Vercel env vars. Two schemas exist: SQLite (`prisma/schema.prisma`, used when the URL is a `file:`) and PostgreSQL (`prisma/schema.postgres.prisma`). **The owner must confirm which engine production actually uses before execution** — the tool adapts automatically via `DATABASE_URL`. | User DB | **YES** |
| 2 | Sandbox/dev database | `db/custom.db` (SQLite, this machine) | Dev | Yes (optional, harmless) |
| 3 | Staging databases | **None found.** No staging Vercel project, no second DATABASE_URL in `.env.example` flows. | — | n/a |
| 4 | Vercel storage integrations | None found in the repo (no Upstash/Blob/Edge-Config imports). | — | n/a |
| 5 | Audio vault (generated music bytes) | Inside the DB (`MusicTrack.audioData`, `LoopWeave*` bytes) + mirrored files under the house audio vault path served by `/api/music-audio` | User content | **YES** |
| 6 | Visualizations / images | `.visualizations` gallery directory (server filesystem), served by `/api/visual/[file]` | User content | **YES (owner-approved file purge)** |
| 7 | Uploads | `upload/` directory | User content | **YES (owner-approved file purge)** |
| 8 | Auth records | `User`, `VerificationToken`, sessions are stateless signed cookies | Identity | **YES** (owner row recreated) |
| 9 | Conversations / reflections | `LibraryEntry` (every transmission saved per sector) | User content | **YES** |
| 10 | Generated books | Library entries + PDF artifacts in `download/` | User content | **YES** |
| 11 | Generated music | `MusicTrack`, `LoopWeave*`, `GenerationJob` | User content | **YES** |
| 12 | Generated images | `MarketListing`, visualization files | User content | **YES** |
| 13 | Personal libraries | `LibraryEntry` | User content | **YES** |
| 14 | Preferences | `User.settings` (JSON) | User data | **YES** |
| 15 | Usage records | `UsageEvent` | Telemetry | **YES** |
| 16 | Credits / wallets | `UserWallet`, `CreditLedger`, legacy `Workspace/CreditAccount/CreditTransaction` | Economy | **YES** |
| 17 | Subscription records | `Subscription`, `Payment`, Stripe `ProcessedEvent` | **Financial** | **PRESERVED** (law) |
| 18 | Background jobs | `ProcessJob`, `GenerationJob`, `CreationJob/Artifact` | User content | **YES** |
| 19 | Cached user info | In-memory only (per-process maps: rate limits, provider health) | Ephemeral | Dies on redeploy |
| 20 | External buckets / vector DBs | **None found** in the codebase | — | n/a |
| 21 | Admin audit trail | `AuditEvent` (new) + `FuelGrant` (email-keyed) | Governance | FuelGrant **YES**; AuditEvent **PRESERVED** |

## 2. Environment classification

- **Production** = the Vercel deployment bound to `www.reflectme.space` (branch `main`).
- **Staging** = does not exist yet. The runbook (`LAUNCH-RUNBOOK.md`) creates a staging project + separate database BEFORE any production reset.
- **Dev** = this sandbox (`db/custom.db`).

## 3. Affected users and data categories

- Every non-admin user account and every anonymous passage (production count unknown from here — read with `plan` against production `DATABASE_URL`).
- Categories: identity, conversations, generations (books/music/images), libraries, preferences, wallets/credits, usage telemetry, background jobs.

## 4. Backups (created and VERIFIED before any deletion)

1. Run `bun scripts/reset-user-data.ts backup` against production → JSON per table under `backups/pre-reset-<ts>/`, with `manifest.json`.
2. Binary columns (audio) ≤20 MB ride base64; larger are named-and-omitted (regeneratable content).
3. **Restore test** (already proven on this sandbox db): `bun scripts/reset-user-data.ts restore <dir>` replanted 35 users / 11 library entries / 36 ledger rows identically. The same test is run against the production backup copy before deletion proceeds.
4. Keep one backup copy outside the deployment (download from the machine that ran it).

## 5. Retention requirements (kept on purpose)

- `Payment`, `DepositLedger` — financial/bookkeeping law.
- `PaymentSource` — the keeper's own sealed credentials (never backed up, never exported).
- `ProcessedEvent` — Stripe idempotency (prevents replay after reset).
- `PlatformConfig` — prices, switches, and the session secret (deleting it would sign everyone out — which the reset does anyway via user wipe, but keeping it avoids infra surprises).
- `AuditEvent` — the governance trail (the reset itself is recorded here).
- `FuelReserve` — the incubator's tanks.

## 6. Exact deletion scope (what `execute` does)

Deletes (user data): `User` rows except the ADMIN row (cascade removes their LibraryEntry, MusicTrack + audio, LoopWeave + parts/finals + audio, GenerationJob, ExpansionProfile/Event, Workspace + members + credit accounts + transactions + subscriptions + api keys, UserWallet, CreditLedger, MarketListing, VerificationToken), then `UsageEvent`, `FuelGrant`, `CreationJob`, `CreationArtifact`, `ProcessJob`.

Then: verifies zero rows in the checked tables (the tool prints ✓/✗ per table), leaves the ADMIN row with its untouched password, and resets remaining wallets to 0.

## 7. Rollback strategy

1. `bun scripts/reset-user-data.ts restore <backup-dir>` replants everything (roundtrip verified).
2. If the database engine is managed (Postgres provider), also take the provider's own snapshot first (owner runs it in the provider console) — belt and braces.

## 8. Legal/financial records retained

As listed in §5. No law-known retention beyond these is identified from the codebase; the owner confirms jurisdiction-specific needs before execution.

## 9. After the reset (initialization)

1. `prisma db push` (schema verified) — the deployment does this on boot via its own flow.
2. Registration, login, Google OAuth and email verification are exercised end to end.
3. Every new user starts with the standard birth gift and empty environments (the 500-light lift now applies to **named accounts only** — anonymous farming is shut).
4. No fake users, subscriptions or usage rows are created.

## 10. THE APPROVAL GATE

**Nothing runs until the owner replies with explicit confirmation naming production, e.g.:**
> "Approved: execute the reset against the production database (DATABASE_URL of www.reflectme.space), after backup and restore-test."

The tool itself also refuses `execute` without `--confirm=RESET-REFLECTME`.
