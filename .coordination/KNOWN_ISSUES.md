# KNOWN_ISSUES.md — confirmed problems and unresolved concerns

## Confirmed (2026-11-25, Z.ai)

1. **Sandbox memory reaper:** `next-server` is silently killed near the ~3.9GB ceiling; dev server must
   be restarted in background. Mitigation: watchdog script; avoid heavy parallel compiles.
2. **External restores can corrupt the working tree:** an external checkpoint restore merged foreign
   state into the sandbox (conflict markers in 70 files). Mitigation: backup branch created before any
   repair; future restores should be verified immediately (`git status`, conflict-marker grep, HTTP check).
3. **Publications not viewable:** founder-reported. Under repair (ZAI-4). Root cause TBD after code read.
4. **Book download interruption:** downloads tied to browser/session lifetime fail mid-flight. Under
   repair (ZAI-7) with durable server-side job + Library recovery.

## Assumptions to verify (do not treat as facts)

- Production (Vercel) deploy state unknown until independently checked — verify actual deployed commit.
- Whether publishing viewability bug is data-shaped (missing field) or UI-shaped (broken route/view).

## Resolved

- `glm-4.5-flash` default chat model (outdated) → upgraded to `glm-4.6` (2026-11-25).
- Missing node_modules after external restore → `bun install` restored 96 packages.
