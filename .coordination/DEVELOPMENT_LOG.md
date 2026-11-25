# DEVELOPMENT_LOG.md — chronological record of significant changes

## 2026-11-25 (evening) — Z.ai, session restore + mirror verification

- **Sandbox snapshot rollback detected and healed (ZAI-9):** the platform supervisor restored the
  sandbox to an older checkpoint — local `main` fell back to `c873b47` with a partial working tree
  (5,371 files missing vs origin). Verified **zero unique content** existed locally
  (`git rev-list` 0 ahead; `git diff origin/main` showed 0 insertions — pure deletions), so
  realignment was pure restoration, no work destroyed. Local `main` re-aligned to `origin/main` =
  `58dd0b89` (coordination foundation + publications generation + mirror model fix all preserved).
- **Environment re-provisioned:** `bun install` (96 packages incl. `wavesurfer.js`), `bun run db:push`
  (Prisma Client v6.19.2 generated, schema in sync). Local SQLite is empty of hall offerings
  (fresh sandbox; production DB is separate and untouched).
- **Mirror verified working, three levels deep (founder's ask):**
  1. Code level — `src/lib/zai-client.ts` serves `glm-4.6` (no `ZAI_MODEL` env override active).
  2. API level — POST `/api/mirror-entity` and POST `/api/mirror-os` both returned real replies
     (HTTP 200, coherent glm-4.6 prose).
  3. Browser level — homepage rendered (welcome tour, zero console errors), whisper
     "Who are you, in one sentence?" sent from the chamber; the Mirror of the Absolute answered in
     character. Golden path green.
- **Publish loop smoke test:** POST `/api/gathering` (`kind: reflection`) created an offering,
  GET returned it in the hall read. Publications pipeline intact after restore.
- Documentation updated; all state carried on `agent/zai/session-restore-mirror-verify`, folded to main.

## 2026-11-25 (later the same day) — Z.ai, feature generation

- **ZAI-4 publications viewable:** `FeedSection.tsx` — the stream was a dead end: `overflow-hidden`
  locked it, no back/step hands existed, the boot read could wash away the deep-linked offering, and
  the "mine" view was unreachable (drafts unviewable). Repaired: scrollable snap stream, crown with
  back/prev/next + honest count, index-based landing (no offset overshoot), keeper-preserved focus
  post across fresh reads, "My wall" chip + back hand, mine tiles open their own stream. Verified in
  the browser: tile→stream→prev→back→mine, deep-link landing.
- **ZAI-5 retroactive faces:** `api/gathering/route.ts` — every hall read now heals up to 3 faceless
  published offerings behind a 45s cooldown (after-response). Publish-time painting unchanged. Local
  sweep healed all seeded faceless posts (keeper's brush); production skies paint with CogView/Gemini.
- **ZAI-6 featured realm + gaze:** `featured=1` on GET /api/gathering (publications only, young-hall
  fallback); additive `viewCount` column on GatheringPost; POST `/api/gathering/[id]/view` gaze route;
  realm fetches featured, pings one gaze per work per visit, shows an Eye counter. Verified vc 0→1.
- **ZAI-7 download durability:** `beforeunload` leave-warning while any download work runs; Library
  kept-PDF carry wrapped in the works registry (tray + cancel + retry); resilient retries 2→4; resume
  endpoint now re-kindles em-pdf / px-pdf / hyperx-pdf presses (verified 404 unknown-id path).
- **ZAI-8 workplace labs:** new `WorkplaceLab.tsx` — per-room catalog of real tools (rooms, main-house
  ateliers via openToolTab, publish hand); flask hand on the portal crown opens the current room's lab;
  Escape folds it first. Verified: lab opens, tool navigates to Possibilities.
- Full `bun run lint` clean; homepage 200; zero new console errors on the verified paths.
- Environment note: the platform supervisor checked `main` out mid-session; dirty state survived and
  was re-homed on `agent/zai/coordination-foundation`.

## 2026-11-25 — Z.ai (sandbox session web-6fefa0f9)

- **ZAI-1 recovery:** Dev server returned 500 (homepage unreachable → user saw endless
  "Deploying..." on reflectme.space-z.ai). Root cause: an external restore dumped a damaged working
  tree containing unresolved conflict markers from a botched merge against `a0260ef7` (a commit not
  present in the local clone at that time) into 70 files, plus missing node_modules
  (`wavesurfer.js`, `@google/genai`, `@tiptap/*`).
  - Preserved the damaged tree on branch `backup/damaged-merge-20261125` (no work destroyed).
  - Aligned local `main` to `origin/main` = `a0260ef7` (PR #17 by Claude preserved).
  - `bun install` (96 packages), `bun run db:push` (database already in sync, zero data loss).
  - Dev server restarted; homepage verified HTTP 200; Turbopack Ready.
- **ZAI-3 model upgrade:** `src/lib/zai-client.ts` — Z.ai cloud chat default `glm-4.5-flash` →
  `glm-4.6` (latest flagship served by api.z.ai). `ZAI_MODEL` env still overrides. Vision unchanged
  (`glm-4.6v`). Atelier path already follows the SDK gateway default.
- **ZAI-2 coordination:** created `.coordination/` documents and root `AGENTS.md` per the unified
  multi-agent protocol; registered tasks ZAI-1…ZAI-8 in `TASK_REGISTRY.md`.

## Earlier generations (from worklog.md)

- Threshold reborn (biotechnological landing, miniature portal, creation room rebuild) — tasks 54–62.
- Flora X greenhouse, music engine, transmission classification (PR #17 by Claude).
