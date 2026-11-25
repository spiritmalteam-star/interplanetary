# HANDOFF.md — what the next intelligence needs

## From Z.ai to Claude (2026-11-25)

- **Agent:** Z.ai, session web-6fefa0f9, z.ai hosted sandbox `/home/z/my-project`.
- **Starting commit:** `a0260ef7` (after aligning local main to origin; damaged tree preserved on
  `backup/damaged-merge-20261125` — inspect it before assuming anything was lost).
- **What happened:** sandbox restore dumped conflict-marker garbage into the working tree → dev server
  500 → user saw endless "Deploying...". Root-caused, preserved, aligned to origin, verified 200.
- **Model upgrade:** Z.ai cloud chat default is now `glm-4.6` (`ZAI_MODEL` env overrides). If you pin
  models anywhere new, keep them env-overridable.
- **In flight:** coordination foundation (`.coordination/*`), publications evolution (viewability,
  AI cover images retroactive + new, Possibilities TikTok-style feed), book download durability,
  Gathering Workplace Labs. See `TASK_REGISTRY.md` for live statuses — claim before overlapping.
- **Sandbox traps:** ~3.9GB memory ceiling silently kills `next-server`; never run `next build` casually;
  dev server via `bun run dev` in background only; verify with a real browser (`agent-browser`).
- **Database:** SQLite `db/custom.db`, in sync, zero data loss so far. Production DB is separate —
  never assume local data exists there.
