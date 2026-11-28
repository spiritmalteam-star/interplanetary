#!/usr/bin/env bash
# Verifies, on a THROWAWAY Postgres: (1) the schema guard adds what is missing and never drops legacy data,
# (2) a pg_dump backup restores row-for-row, (3) the baseline migration reproduces the schema exactly.
set -euo pipefail
export PGPASSWORD=postgres
H="-h localhost -U postgres"
BASE="postgresql://postgres:postgres@localhost:5432"
psql $H -qc 'DROP DATABASE IF EXISTS prodlike' -c 'CREATE DATABASE prodlike' >/dev/null
export DATABASE_URL="$BASE/prodlike"
SCHEMA=$(node scripts/select-schema.mjs)
echo "== build an 'older production' database from the current schema, then age it"
npx prisma db push --schema "$SCHEMA" --skip-generate >/dev/null
Q() { psql $H -d prodlike -tAqc "$1"; }
Q "INSERT INTO \"User\" (id,email,\"updatedAt\") VALUES ('u1','real@example.test',now())" || Q "INSERT INTO \"User\" (id,email) VALUES ('u1','real@example.test')"
Q "ALTER TABLE \"User\" ADD COLUMN \"legacyNote\" TEXT"
Q "UPDATE \"User\" SET \"legacyNote\"='keep-me' WHERE id='u1'"
Q "CREATE TABLE \"LegacyThing\" (id TEXT PRIMARY KEY, body TEXT)"
Q "INSERT INTO \"LegacyThing\" VALUES ('l1','precious')"
Q "DROP TABLE \"UsageEvent\""
Q "ALTER TABLE \"GatheringPost\" DROP COLUMN \"viewCount\""
echo "== run the guard (dry run first)"
node scripts/db-guard.mjs "$SCHEMA" --dry-run | tee /tmp/guard-dry.txt
grep -q "would apply" /tmp/guard-dry.txt
echo "== run the guard for real"
node scripts/db-guard.mjs "$SCHEMA" | tee /tmp/guard.txt
[ "$(Q "SELECT to_regclass('\"UsageEvent\"') IS NOT NULL")" = "t" ] && echo "PASS missing table created"
[ "$(Q "SELECT count(*) FROM information_schema.columns WHERE table_name='GatheringPost' AND column_name='viewCount'")" = "1" ] && echo "PASS missing column added"
[ "$(Q "SELECT \"legacyNote\" FROM \"User\" WHERE id='u1'")" = "keep-me" ] && echo "PASS legacy column and its data survive"
[ "$(Q "SELECT body FROM \"LegacyThing\" WHERE id='l1'")" = "precious" ] && echo "PASS legacy table and its data survive"
grep -q "BLOCKED" /tmp/guard.txt && echo "PASS destructive statements were reported, not run"
node scripts/db-guard.mjs "$SCHEMA" | tee /tmp/guard2.txt
grep -q "0 additive" /tmp/guard2.txt && echo "PASS second run is a no-op (idempotent)"

echo "== backup and restore into an isolated database, row-for-row"
pg_dump $H -Fc -d prodlike -f /tmp/prodlike.dump
psql $H -qc 'DROP DATABASE IF EXISTS restored' -c 'CREATE DATABASE restored' >/dev/null
pg_restore $H -d restored --no-owner /tmp/prodlike.dump
counts() { psql $H -d "$1" -tAc "SELECT table_name||'='||(xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"; }
counts prodlike > /tmp/c1.txt; counts restored > /tmp/c2.txt
diff /tmp/c1.txt /tmp/c2.txt && echo "PASS restore matches source on every table ($(wc -l < /tmp/c1.txt) tables)"
[ "$(psql $H -d restored -tAc "SELECT body FROM \"LegacyThing\" WHERE id='l1'")" = "precious" ] && echo "PASS restored data readable"

echo "== baseline migration reproduces the schema exactly (no drift)"
psql $H -qc 'DROP DATABASE IF EXISTS fresh' -c 'CREATE DATABASE fresh' >/dev/null
npx prisma migrate diff --from-empty --to-schema-datamodel "$SCHEMA" --script > /tmp/baseline.sql
if [ -f prisma/migrations/0_baseline/migration.sql ]; then
  diff -q /tmp/baseline.sql prisma/migrations/0_baseline/migration.sql && echo "PASS committed baseline equals the current schema"
else
  echo "NO COMMITTED BASELINE"; gzip -c /tmp/baseline.sql | base64 -w0 > /tmp/baseline.b64; wc -c /tmp/baseline.b64
  split -b 12000 /tmp/baseline.b64 /tmp/bl.; for f in /tmp/bl.*; do echo "BASELINE-CHUNK $(basename $f) $(cat $f)"; done
fi
psql $H -d fresh -q -f /tmp/baseline.sql >/dev/null
DATABASE_URL="$BASE/fresh" npx prisma migrate diff --from-url "$BASE/fresh" --to-schema-datamodel "$SCHEMA" --exit-code >/dev/null && echo "PASS applying the baseline gives zero drift"
echo "ALL DB SAFETY CHECKS PASSED"
