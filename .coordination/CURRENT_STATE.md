# CURRENT_STATE.md — ReflectMe shared state of truth

_Last updated: 2026-11-25 by Z.ai (sandbox session web-6fefa0f9)_

## Commits and environments

| Environment | State |
|---|---|
| GitHub `main` | `a0260ef7` — Merge PR #17 (`fix/mirror-intelligence`, authored by Claude) |
| Local sandbox (`/home/z/my-project`) | `a0260ef7`, clean tree, dev server :3000 HTTP 200 |
| Production www.reflectme.space | Vercel auto-deploys `main` (verify actual deploy independently) |
| z.ai hosted sandbox URL | reflectme.space-z.ai → Caddy :81 → localhost:3000 |

## Active architecture

- Next.js 16.1.3 (App Router, Turbopack dev), TypeScript 5, Tailwind CSS 4, shadcn/ui (New York).
- Prisma ORM, SQLite at `db/custom.db` (canonical schema `prisma/schema.prisma`; postgres twin derived
  by `scripts/select-schema.mjs` when `DATABASE_URL` is postgres).
- Intelligence bridge `src/lib/zai-client.ts`: Z.ai cloud (api.z.ai) primary; Gemini fallback for chat;
  atelier (SDK gateway) in dev; Albanian visitor tongue prefers Gemini sky. Voice (TTS/ASR) rides Z.ai only.
- Chat model default: `glm-4.6` (upgraded from `glm-4.5-flash` on 2026-11-25 by Z.ai; env `ZAI_MODEL` overrides).
- Vision model: `glm-4.6v`. Image generation: `@google/genai` via `src/lib/image-engine.ts`.
- Mini services under `mini-services/` (own ports, started by `.zscripts/dev.sh`).

## Working features (verified 2026-11-25)

- Homepage renders, HTTP 200, landing gate loads.

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
