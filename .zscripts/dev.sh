#!/bin/bash

set -euo pipefail

# 获取脚本所在目录（.zscripts）
# 使用 $0 获取脚本路径（与 build.sh 保持一致）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step_start() {
        local step_name="$1"
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $step_name"
        echo "=========================================="
        export STEP_START_TIME
        STEP_START_TIME=$(date +%s)
}

log_step_end() {
        local step_name="${1:-Unknown step}"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - STEP_START_TIME))
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed: $step_name"
        echo "[LOG] Step: $step_name | Duration: ${duration}s"
        echo "=========================================="
        echo ""
}

start_mini_services() {
        local mini_services_dir="$PROJECT_DIR/mini-services"
        local started_count=0

        log_step_start "Starting mini-services"
        if [ ! -d "$mini_services_dir" ]; then
                echo "Mini-services directory not found, skipping..."
                log_step_end "Starting mini-services"
                return 0
        fi

        echo "Found mini-services directory, scanning for sub-services..."

        for service_dir in "$mini_services_dir"/*; do
                if [ ! -d "$service_dir" ]; then
                        continue
                fi

                local service_name
                service_name=$(basename "$service_dir")
                echo "Checking service: $service_name"

                if [ ! -f "$service_dir/package.json" ]; then
                        echo "[$service_name] No package.json found, skipping..."
                        continue
                fi

                if ! grep -q '"dev"' "$service_dir/package.json"; then
                        echo "[$service_name] No dev script found, skipping..."
                        continue
                fi

                echo "Starting $service_name in background..."
                (
                        cd "$service_dir"
                        echo "[$service_name] Installing dependencies..."
                        bun install
                        echo "[$service_name] Running bun run dev..."
                        exec bun run dev
                ) >"$PROJECT_DIR/.zscripts/mini-service-${service_name}.log" 2>&1 &

                local service_pid=$!
                echo "[$service_name] Started in background (PID: $service_pid)"
                echo "[$service_name] Log: $PROJECT_DIR/.zscripts/mini-service-${service_name}.log"
                disown "$service_pid" 2>/dev/null || true
                started_count=$((started_count + 1))
        done

        echo "Mini-services startup completed. Started $started_count service(s)."
        log_step_end "Starting mini-services"
}

wait_for_service() {
        local host="$1"
        local port="$2"
        local service_name="$3"
        local max_attempts="${4:-60}"
        local attempt=1

        echo "Waiting for $service_name to be ready on $host:$port..."

        while [ "$attempt" -le "$max_attempts" ]; do
                if curl -s --connect-timeout 2 --max-time 5 "http://$host:$port" >/dev/null 2>&1; then
                        echo "$service_name is ready!"
                        return 0
                fi

                echo "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
                sleep 1
                attempt=$((attempt + 1))
        done

        echo "ERROR: $service_name failed to start within $max_attempts seconds"
        return 1
}

cleanup() {
        # NOTE: the dev server runs in its own setsid session on purpose —
        # it must OUTLIVE this launcher. The sandbox has repeatedly delivered
        # SIGTERM to this script right after startup, and an earlier version of
        # this trap killed the freshly started server with it. Never kill the
        # server here; the house stops it by port instead.
        return 0
}

trap cleanup EXIT INT TERM

cd "$PROJECT_DIR"

# --- drift guard: the sandbox must always serve the pinned git version ---
# The sandbox's file-restore mechanism has repeatedly reverted this checkout to
# an old Oct-20 line while the remote main already held the latest masterpiece.
# Before starting anything, re-pin the tree to the SHA recorded in
# .zscripts/expected-head (updated by the lead whenever a new version ships).
#
# THE RATCHET LESSON (the drift was self-inflicted): the old guard reset
# whenever HEAD differed from the pin — but a pin commit's tree can only
# hold its PARENT's sha, so every restart walked the tree one commit
# FURTHER BACK (3b821ab → 082d625 → bdbf438 → …): the pin itself was the
# "stale version" engine. The guard now resets only on TRUE drift — when
# HEAD does not CONTAIN the pinned commit (an ancestor check). A checkout
# that is simply AHEAD of the pin (the normal state after new work) is
# left standing; a reverted checkout (missing the pin) is healed forward.
EXPECTED_HEAD_FILE="$SCRIPT_DIR/expected-head"
if [ -f "$EXPECTED_HEAD_FILE" ]; then
        EXPECTED_HEAD=$(tr -d '[:space:]' < "$EXPECTED_HEAD_FILE")
        CURRENT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
        if [ -n "$EXPECTED_HEAD" ] && [ -n "$CURRENT_HEAD" ] && git cat-file -e "$EXPECTED_HEAD" 2>/dev/null; then
                if ! git merge-base --is-ancestor "$EXPECTED_HEAD" "$CURRENT_HEAD" >/dev/null 2>&1; then
                        echo "[GUARD] HEAD drifted (${CURRENT_HEAD:0:12}) — re-pinning the tree to the git version (${EXPECTED_HEAD:0:12})..."
                        if git reset --hard "$EXPECTED_HEAD" >/dev/null 2>&1; then
                                echo "[GUARD] Tree re-pinned to ${EXPECTED_HEAD:0:12}"
                        else
                                echo "[GUARD] WARNING: could not re-pin the tree to $EXPECTED_HEAD"
                        fi
                fi
        fi
fi

if ! command -v bun >/dev/null 2>&1; then
        echo "ERROR: bun is not installed or not in PATH"
        exit 1
fi

log_step_start "bun install"
echo "[BUN] Installing dependencies..."
bun install
log_step_end "bun install"

log_step_start "bun run db:push"
echo "[BUN] Setting up database..."
bun run db:push
log_step_end "bun run db:push"

log_step_start "Starting Next.js dev server"
echo "[BUN] Starting development server..."
if curl -s --connect-timeout 2 --max-time 5 http://localhost:3000 >/dev/null 2>&1; then
        echo "[BUN] Port 3000 is already serving — keeping the existing server."
        DEV_PID=""
else
        # setsid gives the server its own session: even if this launcher is
        # SIGTERMed by the sandbox, the server keeps serving.
        setsid bun run dev >/dev/null 2>&1 < /dev/null &
        DEV_PID=$!
fi
log_step_end "Starting Next.js dev server"

log_step_start "Waiting for Next.js dev server"
wait_for_service "localhost" "3000" "Next.js dev server"
log_step_end "Waiting for Next.js dev server"

log_step_start "Health check"
echo "[BUN] Performing health check..."
curl -fsS localhost:3000 >/dev/null
echo "[BUN] Health check passed"
log_step_end "Health check"

start_mini_services

echo "Next.js dev server is running in its own detached session."
echo "Stop it by port: kill \$(ss -ltnp | grep :3000 | grep -oP 'pid=\\K[0-9]+')"
