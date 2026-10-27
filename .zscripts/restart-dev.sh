#!/bin/bash
# restart-dev.sh — the house's one true way to (re)start the dev server.
#
# Usage:  bash .zscripts/restart-dev.sh [--clean]
#   --clean   also wipes .next (use after git resets, Turbopack panics, or anything weird)
#
# What it does: kills whatever holds :3000 → bun install → prisma db:push →
# starts the dev server in its own detached session (setsid) with the Node heap
# guard → polls until HTTP 200 → prints the server's memory footprint.
set -u

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

CLEAN=0
[ "${1:-}" = "--clean" ] && CLEAN=1

echo "[restart] stopping anything on :3000 ..."
PIDS=$(ss -ltnp 2>/dev/null | grep ':3000' | grep -oP 'pid=\K[0-9]+' | sort -u)
if [ -n "$PIDS" ]; then
  for p in $PIDS; do kill "$p" 2>/dev/null || true; done
  sleep 2
  for p in $PIDS; do kill -9 "$p" 2>/dev/null || true; done
fi
pkill -f 'next dev' 2>/dev/null || true
sleep 1
echo "[restart] port 3000 is free."

if [ "$CLEAN" = "1" ]; then
  echo "[restart] wiping .next for a pristine rebuild ..."
  rm -rf .next
fi

echo "[restart] bun install (quiet) ..."
bun install >>dev.log 2>&1 || bun install

echo "[restart] pushing the schema to the database ..."
bun run db:push >>dev.log 2>&1 || bun run db:push

echo "[restart] starting the dev server (heap guard 2560MB) ..."
# package.json's dev script also carries NODE_OPTIONS; this export is the belt to those braces.
export NODE_OPTIONS="--max-old-space-size=2560"
# setsid: the server must outlive this script — the sandbox delivers SIGTERM to launchers.
setsid bun run dev >/dev/null 2>&1 < /dev/null &

echo "[restart] waiting for http://localhost:3000 ..."
OK=0
i=0
for i in $(seq 1 120); do
  if curl -fsS -o /dev/null --max-time 3 http://localhost:3000 2>/dev/null; then OK=1; break; fi
  sleep 1
done

if [ "$OK" = "1" ]; then
  echo "[restart] SERVER IS UP (after ${i}s)"
  RSS=$(ps -eo rss,comm | awk '/next-server/ {print $1; exit}')
  [ -n "$RSS" ] && echo "[restart] next-server RSS: ${RSS} KB"
  exit 0
else
  echo "[restart] FAILED to come up in 120s — the last 40 lines of dev.log:"
  tail -40 dev.log
  exit 1
fi
