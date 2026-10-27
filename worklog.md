# Worklog — reflectme.space

> **READ THIS FIRST.** This file is the single source of truth for the project's current state.
> Full history of Tasks 1–9 lives in `worklog-archive.md` (never delete it).
> **Protocol:** every agent APPENDS a section below the snapshot using the
> `---` / `Task ID:` / `Work Log:` / `Stage Summary:` template. Never overwrite the snapshot.

---

## STATE SNAPSHOT (2026-10-27, the great cleaning)

**HEAD:** the great-cleaning commit on `main` — local and `github.com/spiritmalteam-star/interplanetary.git` pushed in lockstep.
Working tree: **clean**. Archive branch `archive/yielding-portal` (c873b47) exists on GitHub — never delete, never merge.

### What this house is
- **reflectme.space** — AI mirror app. Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite + Bun.
- Deploys to **Vercel** from `main`. Sandbox = dev mirror of the same repo.
- **Custom OAuth stack** (NOT NextAuth): start `src/app/api/auth/google/route.ts`,
  callback `src/app/api/auth/google/callback/route.ts`.
  → redirect_uri = `https://reflectme.space/api/auth/google/callback` (also `www.` variant).
- Single wallet (`UserWallet`: free/paid/deposit pools), keeper role bound in DB at boot,
  Stripe register with replay, durable music jobs (`GenerationJob`, `MusicTrack`).

### Where the work stands
- **Phase 1 of the Master Production Directive** (one purse, keeper's free hands, Stripe truths,
  durable music jobs) — done by the remote session, Tasks 64–66 (commit e0a18bb and parents).
- **Replication directive PDF** — bound in one volume, 21 pages, served from
  `public/reflectme-full-replication-prompt.pdf` (commit 2500888). Press sources in `.pdfbuild/`.
- **Directive Phases 2–4** (Mirror Gateway, Stripe webhook authority, RBAC console deepening,
  Music Studio cloud store, responsive audit, 17 e2e) — **not started**.

### Pending (user-side, external)
1. Google Cloud Console: add both redirect URIs (see "What this house is" above) to the OAuth client
   that matches Vercel's `GOOGLE_CLIENT_ID`; consent screen → Publish or add test user.
2. Vercel: verify `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` match that client.
3. **Vercel: redeploy `main`** — the live site is stale until this happens.

### Sandbox runbook — how to not break the vessel (3.9GB RAM!)
- **Restart the dev server (the one true way):**
  `bash .zscripts/restart-dev.sh` — kills by port, `bun install`, `db:push`, starts with heap
  guard, polls until HTTP 200. Add `--clean` to wipe `.next` first (after git resets, Turbopack
  panics like `inner_of_upper_lost_followers`, or anything weird).
- **Two memory guards, both mandatory, both already in place:**
  1. `package.json` dev script carries `NODE_OPTIONS=--max-old-space-size=2560` (Node heap cap —
     without it next-server is OOM-killed mid-compile: `Out of memory: Killed process (next-server)`).
  2. `next.config.ts` carries `turbopack.memoryLimit: 1536` (Rust side GC pressure).
- **Environment killers (all named, all healed before):** stale DB (→ `bun run db:push`),
  stale node_modules (→ `bun install`), corrupted `.next` (→ `restart-dev.sh --clean`), OOM (→ guards above).
- **Drift guard:** `.zscripts/dev.sh` re-pins the tree to `.zscripts/expected-head` on boot if HEAD
  lost the pin. `expected-head` is updated by the lead after every push. It uses an
  ancestor-check — a checkout that is merely AHEAD of the pin is never reset.
- **Never restart the server while `git reset` runs** — that is what corrupts `.next`.

### House rules (learned in blood)
- **Never commit QA screenshots or one-off artifacts.** `verify-*.png`, `.verify-*.png`,
  `.zscripts/*.png`, `download/*.png`, `tool-results/`, `upload/` are all gitignored now.
  App images live only under `public/images`, `public/sigils`, `public/landing`, `src/app`.
- The GitHub token is passed **inline only**, never written to any file.
- `db/` (runtime SQLite), `upload/` (user art), `.visualizations/` are runtime data — gitignored, never committed.
- Verify with agent-browser: open → wait networkidle → screenshot → read screenshot → check errors;
  desktop 1280px AND mobile 390px. "It compiles" is never done.
- tsc has 7 known pre-existing errors (filter `biology|science|wallet.ts|collect-dynamic|image-edit|stock-analysis|test-fuel`);
  lint has 1 pre-existing LandingGate warning. New code must add zero of either.

---

## Appended task log (newest at the bottom)

---
Task ID: 10
Agent: Z.ai Code (main orchestrator)
Task: Save the latest version to git and clean the sandbox totally — end the crash loop, end the confusion

Work Log:
- Amended the junk auto-commit (UUID message) into "the directive press" (e0ffe4c) — .pdfbuild kept as the press that printed the replication PDF.
- Archived the 6,306-line worklog into `worklog-archive.md` (git mv, nothing lost); wrote this fresh snapshot.
- Lifted ~170 tracked one-off QA screenshots from the repo (root `verify-*.png`, `.verify-*.png`, `.zscripts/*.png`, `download/*.png`, `tool-results/*.png`) and the stale `agent-ctx` note; untracked 5 grandfathered `upload/` images (kept on disk, now ignored).
- Hardened `.gitignore` against every recurrence pattern; deleted stale `dev.log.prev-2d`.
- Baked `NODE_OPTIONS=--max-old-space-size=2560` into the `package.json` dev script — the heap guard now travels with the repo, no launch path can forget it.
- Wrote `.zscripts/restart-dev.sh` (kill by port → install → db:push → guarded start → poll 200; `--clean` wipes `.next`).
- Updated `.zscripts/expected-head` to the new pushed HEAD (drift-guard ratchet).
- Restarted the dev server through the new script with `--clean`, verified desktop + mobile with agent-browser, pushed.

Stage Summary:
- local = remote = one clean HEAD; repo carries zero QA debris; crash root cause (unguarded heap) fixed at the script level; every future session starts from this snapshot and cannot confuse itself with 6,300 lines of history.
