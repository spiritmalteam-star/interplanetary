# CURRENT_STATE.md — ReflectMe shared state of truth

_Last updated: 2026-11-25 by Z.ai (sandbox session web-6fefa0f9)_

## Commits and environments

| Environment | State |
|---|---|
| GitHub `main` | `58dd0b89` — coordination foundation integrated + worklog truth (ZAI-2..8 integrated; PR #17 preserved in lineage) |
| Local sandbox (`/home/z/my-project`) | `58dd0b89`, clean tree, dev server :3000 HTTP 200, mirror verified (2026-11-25 evening) |
| Production www.reflectme.space | Vercel auto-deploys `main` (verify actual deploy independently) |
| z.ai hosted sandbox URL | reflectme.space-z.ai → Caddy :81 → localhost:3000 |

## Active architecture

- Next.js 16.1.3 (App Router, Turbopack dev), TypeScript 5, Tailwind CSS 4, shadcn/ui (New York).
- Prisma ORM, SQLite at `db/custom.db` (canonical schema `prisma/schema.prisma`; postgres twin derived
  by `scripts/select-schema.mjs` when `DATABASE_URL` is postgres).
- Intelligence bridge `src/lib/zai-client.ts`: Z.ai cloud (api.z.ai) primary; Gemini fallback for chat;
  atelier (SDK gateway) in dev; Albanian visitor tongue prefers Gemini sky. Voice (TTS/ASR) rides Z.ai only.
- Chat model default: `glm-4.6` (upgraded from `glm-4.5-flash`; re-fixed after a platform checkout silently reverted it; env `ZAI_MODEL` overrides).
- Vision model: `glm-4.6v`. Image generation: `@google/genai` via `src/lib/image-engine.ts`.
- Mini services under `mini-services/` (own ports, started by `.zscripts/dev.sh`).

## Working features (verified 2026-11-25, browser)

- Homepage renders, HTTP 200, landing gate loads.
- Publications viewable end-to-end: gallery tile → stream (back/prev/next + count) → mine wall → own stream.
- Retroactive painter heals faceless publications on hall reads (keeper fallback local; CogView/Gemini in production).
- Possibilities realm: featured publications, TikTok-true walk, gaze counter (Eye) verified 0→1.
- Download works: beforeunload guard, tray-cancelled only, Library carries resilient, resume re-kindles all presses.
- Workplace Labs: flask hand on the portal crown opens each room's own lab; tools navigate/open real surfaces.

## Known technical limitations

- Sandbox memory ceiling ~3.9GB silently kills `next-server`; rogue `next build` processes steal memory.
  Dev server must run in background (`bun run dev`), never `next build` casually.
- Browser cannot keep downloads alive after tab close; book PDFs must remain recoverable from Library.
- `ignoreBuildErrors` is not used; lint via `bun run lint` (single-file tsc has false positives).

## Recent history of note

- 2026-11-25: external restore dumped a damaged tree (conflict markers from a botched merge against
  `a0260ef7`) into the sandbox; preserved on branch `backup/damaged-merge-20261125`, then main was
  aligned to origin `a0260ef7` (documented, recoverable, human-informed).
- PR #17 (Claude): Transmission AI failure classification (code/retryable/upstream), read-only production
  AI probe, mirror-intelligence fixes. Preserved and built upon.
