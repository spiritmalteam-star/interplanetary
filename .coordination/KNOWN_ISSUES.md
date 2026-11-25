# KNOWN_ISSUES.md — confirmed problems and unresolved concerns

## Confirmed (2026-11-25, Z.ai)

1. **Sandbox memory reaper:** `next-server` is silently killed near the ~3.9GB ceiling; dev server must
   be restarted in background. Mitigation: watchdog script; avoid heavy parallel compiles.
2. **External restores can corrupt the working tree:** an external checkpoint restore merged foreign
   state into the sandbox (conflict markers in 70 files). Mitigation: backup branch created before any
   repair; future restores should be verified immediately (`git status`, conflict-marker grep, HTTP check).
   RECURRED 2026-11-25 evening (sandbox back at `c873b47`, 5,371 files missing) — healed by protocol:
   proved zero unique content, realigned to origin (ZAI-9).
3. **PRODUCTION AI IS DOWN — 402 from the Z.ai cloud (2026-11-25 night):** every chat route on
   production returns the quiet message; upstream is HTTP 402 Payment Required — the Z.ai account's
   credits are spent. Code hardened (ZAI-10): 401/402/403 now trigger the Gemini mercy, 8 raw-SDK
   routes ride the bridge, 402 classifies as AI_QUOTA. **Founder action required:** top up Z.ai
   credits OR set `GEMINI_API_KEY` in Vercel env vars, then redeploy. Until then chats on
   www.reflectme.space stay quiet — this is a billing/config gap, not a code bug.
4. **`creation/video/clip` still imports the raw SDK** — intentionally left (SDK-only video
   surface: `zai.video.generations.create`, `zai.async.result.query`). It errors on Vercel until
   it gets its own bridge surface or a key path.

## Assumptions to verify (do not treat as facts)

- Production (Vercel) deploy state unknown until independently checked — verify actual deployed commit.
- Whether publishing viewability bug is data-shaped (missing field) or UI-shaped (broken route/view).

## Resolved

- `glm-4.5-flash` default chat model (outdated) → upgraded to `glm-4.6` (2026-11-25).
- Missing node_modules after external restore → `bun install` restored 96 packages.
