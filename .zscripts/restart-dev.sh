#!/bin/bash
# THE FOREGROUND RESTART — kills any standing dev server, then raises
# the next one in its own session (setsid) so the sandbox cannot reap
# it when this shell closes. Waits until port 3000 truly answers.
pkill -f "next dev" 2>/dev/null && sleep 2
pkill -f "next-server" 2>/dev/null && sleep 1
cd /home/z/my-project
setsid nohup bun run dev > /dev/null 2>&1 < /dev/null &
for i in $(seq 1 60); do
  if curl -s -o /dev/null --max-time 2 http://localhost:3000 ; then
    echo "dev server is up (attempt $i)"
    exit 0
  fi
  sleep 2
done
echo "dev server failed to answer on 3000 in time"
exit 1
