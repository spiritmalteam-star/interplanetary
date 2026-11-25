# HANDOFF.md — what the next intelligence needs

## From Z.ai to Claude (2026-11-25, evening — after the snapshot rollback)

- **Sandbox rolled back again:** the platform supervisor restored an older checkpoint (local `main`
  at `c873b47`, 5,371 files missing vs origin). Protocol followed: proved zero unique local content
  (0 ahead, 0 insertions vs origin), then realigned — pure restoration, nothing destroyed. If you
  ever find the tree looking "old", **fetch first and diff against origin before touching anything**.
- **Everything survived on GitHub:** coordination foundation, publications generation, mirror model
  fix — main @ `58dd0b89`. The sandbox is disposable; the repository is the truth.
- **Mirror verified green (founder's explicit ask):** `glm-4.6` default active; `/api/mirror-entity`
  and `/api/mirror-os` answered real prose; browser whisper in the chamber got an in-character
  reply; zero console errors. Publish loop smoke-tested (POST + GET on `/api/gathering`).
- Local SQLite is empty of offerings (fresh restore); production DB is separate — never seed prod
  from local. New GitHub token supplied by the founder for this session's pushes (use in push URL,
  never commit it).
- Known-good commands: `(setsid bun run dev > /tmp/dev-live.log 2>&1 &)` then poll HTTP in the same
  shell; `bun run db:push`; `bun run lint`. Memory reaper still lurks near ~3.9GB — no casual builds.

## From Z.ai to Claude (2026-11-25)

- **Agent:** Z.ai, session web-6fefa0f9, z.ai hosted sandbox `/home/z/my-project`.
- **Starting commit:** `a0260ef7` (after aligning local main to origin; damaged tree preserved on
  `backup/damaged-merge-20261125` — inspect it before assuming anything was lost).
- **What happened:** sandbox restore dumped conflict-marker garbage into the working tree → dev server
  500 → user saw endless "Deploying...". Root-caused, preserved, aligned to origin, verified 200.
- **Model upgrade:** Z.ai cloud chat default is now `glm-4.6` (`ZAI_MODEL` env overrides). If you pin
  models anywhere new, keep them env-overridable.
- **Integrated (main @ `44adf17a`):** coordination foundation; publications viewable (stream walk + mine wall);
  retroactive publication faces (self-healing sweep); Possibilities featured feed + gaze counts;
  download durability (beforeunload guard, resilient carries, all-press resume); per-room Workplace Labs.
  Schema: one additive column `GatheringPost.viewCount` (default 0, zero data loss). Claim before overlapping.
- **Sandbox traps:** ~3.9GB memory ceiling silently kills `next-server`; never run `next build` casually;
  dev server via `bun run dev` in background only; verify with a real browser (`agent-browser`).
- **Database:** SQLite `db/custom.db`, in sync, zero data loss so far. Production DB is separate —
  never assume local data exists there.
