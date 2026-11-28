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
node scripts/db-guard.mjs "$SCHEMA" --dry-run 2>&1 | tee /tmp/guard-dry.txt
grep -q "would apply" /tmp/guard-dry.txt
echo "== run the guard for real"
node scripts/db-guard.mjs "$SCHEMA" 2>&1 | tee /tmp/guard.txt
[ "$(Q "SELECT to_regclass('\"UsageEvent\"') IS NOT NULL")" = "t" ] && echo "PASS missing table created"
[ "$(Q "SELECT count(*) FROM information_schema.columns WHERE table_name='GatheringPost' AND column_name='viewCount'")" = "1" ] && echo "PASS missing column added"
[ "$(Q "SELECT \"legacyNote\" FROM \"User\" WHERE id='u1'")" = "keep-me" ] && echo "PASS legacy column and its data survive"
[ "$(Q "SELECT body FROM \"LegacyThing\" WHERE id='l1'")" = "precious" ] && echo "PASS legacy table and its data survive"
grep -q "BLOCKED" /tmp/guard.txt && echo "PASS destructive statements were reported, not run" || { echo "FAIL blocked statements not reported"; exit 1; }
node scripts/db-guard.mjs "$SCHEMA" | tee /tmp/guard2.txt
grep -q "0 additive" /tmp/guard2.txt && echo "PASS second run is a no-op (idempotent)" || { echo "FAIL not idempotent"; exit 1; }

echo "== backup and restore into an isolated database, row-for-row"
# dump/restore with the SAME major version as the server (a newer client emits settings an older server rejects)
PGTOOLS="docker run --rm --network host -e PGPASSWORD=postgres -v /tmp:/tmp postgres:16"
$PGTOOLS pg_dump -h localhost -U postgres -Fc -d prodlike -f /tmp/prodlike.dump
psql $H -qc 'DROP DATABASE IF EXISTS restored' -c 'CREATE DATABASE restored' >/dev/null
$PGTOOLS pg_restore -h localhost -U postgres -d restored --no-owner --exit-on-error /tmp/prodlike.dump
counts() { psql $H -d "$1" -tAc "SELECT table_name||'='||(xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"; }
counts prodlike > /tmp/c1.txt; counts restored > /tmp/c2.txt
diff /tmp/c1.txt /tmp/c2.txt && echo "PASS restore matches source on every table ($(wc -l < /tmp/c1.txt) tables)"
[ "$(psql $H -d restored -tAc "SELECT body FROM \"LegacyThing\" WHERE id='l1'")" = "precious" ] && echo "PASS restored data readable"

echo "== committed migrations, applied in order, reproduce the schema exactly (no drift)"
psql $H -qc 'DROP DATABASE IF EXISTS fresh' -c 'CREATE DATABASE fresh' >/dev/null
[ -f prisma/migrations/0_baseline/migration.sql ] || { echo "FAIL no committed baseline"; exit 1; }
for d in $(ls -d prisma/migrations/*/ | sort); do
  echo "applying $d"; psql $H -d fresh -q -v ON_ERROR_STOP=1 -f "$d/migration.sql" >/dev/null
done
DATABASE_URL="$BASE/fresh" npx prisma migrate diff --from-url "$BASE/fresh" --to-schema-datamodel "$SCHEMA" --exit-code >/dev/null && echo "PASS baseline + later migrations give zero drift"
echo "ALL DB SAFETY CHECKS PASSED"
