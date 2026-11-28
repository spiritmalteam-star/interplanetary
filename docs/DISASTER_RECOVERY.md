# Database protection and recovery (what exists, what is verified)

## Schema changes on deploy
- The production build no longer uses `--accept-data-loss`. `scripts/postinstall.mjs` runs `scripts/db-guard.mjs` on Postgres:
  it computes the diff against the live database and applies **only additive** statements (new tables, columns, indexes).
  Anything that could drop or rewrite data is **never run**; it is printed as `[db-guard] BLOCKED (review by hand)` in the build log.
  Legacy columns/tables therefore stay until a human removes them deliberately.
- Verified in CI on a throwaway Postgres (`qa/db_safety.sh`): missing table/column are created; a legacy column and table with data survive;
  destructive statements are reported not run; a second run is a no-op.
- Local SQLite (atelier/CI) still uses `prisma db push`; that is a disposable file, never production.

## Versioned migrations
- `prisma/migrations/0_baseline/migration.sql` is generated from the Postgres schema and checked in CI to equal the current schema
  and to produce **zero drift** on a fresh database. Future changes: add a new migration directory, review its SQL, never edit the baseline.
- **Not yet adopted in production**: switching the live database to `prisma migrate deploy` needs a one-time, founder-approved baseline
  (`prisma migrate resolve --applied 0_baseline` against production after confirming the diff is empty). Until then the additive guard is the mechanism.

## Backups
- `.github/workflows/db-backup.yml` (manual + weekly) makes an AES-256 encrypted `pg_dump` of production. It refuses to run until the founder adds
  repository secrets `PRODUCTION_DATABASE_URL` (a read-only role is enough) and `BACKUP_PASSPHRASE`. **No production backup exists from this repo yet.**
- Also check the database host's own point-in-time recovery and snapshots (Neon / Vercel Postgres / Supabase): they are the first line of defence.
- Restore procedure (verified in CI against a throwaway database, 75 tables row-for-row):
  1. `gpg -d reflectme-DATE.dump.gpg > reflectme.dump`
  2. create an **empty new database**, never restore over production
  3. `pg_restore --no-owner --exit-on-error -d NEWDB reflectme.dump` using a client of the same major version as the server
  4. compare per-table row counts with the source; only then repoint `DATABASE_URL`.
- Not yet verified: a restore of the real production dump (requires the secrets above).

## Rollback
- Code: revert the merge commit on `main`; Vercel redeploys. The guard never removes data, so code rollback is always safe for the data.
- Data: restore from backup into a new database (above), then repoint. Never reset or truncate production.
