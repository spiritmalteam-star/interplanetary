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

---
Task ID: 11
Agent: Z.ai Code (main orchestrator)
Task: Remove the replication PDF and every trace; add the new civilisations (Unique_Profiles batches); strip the chat crown to profile + tools + scopes + zoom; fix the mobile Scopes dropdown; grant 500 free lights to every email and bind the purse into the profile room

Work Log:
- PDF erased: public/reflectme-full-replication-prompt.pdf, .pdfbuild/ (the press) and REPLICATION_PROMPT.md all lifted from the tree; zero references remain in served code (git history retains them; live site serves nothing).
- Codex Exobiologica press run (scripts/import-unique-profiles.mjs): extracted the 3 missing batches (0051-0060, 0071-0080, 0091-0100) from upload/, verified every plate against its manifest (raw sha256 + decoded-pixel sha256), audited uniqueness across the whole archive (800 distinct pixel plates), published 120 webp plates at 768x512 and 30 original SVG ornaments. 870 canonical fields verified; 30 detail records + 2 index rows healed against source-records; assets.json contract now readyRoleAssets 800 / pendingRoleAssets 12080; index.json manifest.readyProfiles = 200. ALL of CIV-0001 to CIV-0200 is now fully illustrated — zero pending in the first two hundred.
- Crown stripped at the visitor's word: CreditBadge (the number) removed from AppShell's realmControls; LightToggle removed from the crown and re-homed as RealmLightToggle (its own module) inside the profile room's purse panel. The crown now carries profile · CREATE · SCOPES · zoom, both gears.
- The purse's own room: ProfilePage wears a live purse panel (balance, free/gathered/deposited breakdown, fresh refreshWallet on mount, RealmLightToggle in the corner, and the working link — Open the account chamber — into AccountModal). Verified: 500 lights for the quiet guest, account chamber opens.
- The great birth gift: BIRTH_GIFT 5 -> 500 in wallet.ts (new passages born holding 500), and a one-time boot migration in instrumentation.ts guarded by PlatformConfig key wallet_birth_gift_500_applied — lifted 25 existing purses to 500 with PROMOTIONAL_GRANT ledger entries. .env.example comment updated. Vercel's production DB receives the same lift on next deploy boot.
- Scopes dropdown on mobile: with the crown shortened the centered panel now sits fully inside the viewport at 390px (verified: comfortable margins both sides); CREATE panel verified too.
- Browser-verified at 1280px and 390px: crown composition, purse panel, account chamber link, chronoscope CIV-0051 artwork ("ready artwork · unique-batch audited"), header "200 fully illustrated".

Stage Summary:
- The replication prompt no longer exists on the site in any form; the chronoscope's first two hundred records all wear their own unique artwork; the crown is quiet (profile, tools, scopes, zoom); every email now holds 500 free lights and the profile room speaks the purse's truth with a working door to the account chamber.

---
Task ID: 12
Agent: Z.ai Code (main orchestrator)
Task: The free coins must actually pay for the music; the song's explanation text removed; the generation's section and the music seated at the very top; the media buttons lifted from the composer

Work Log:
- Reproduced the visitor's exact report in the browser: an anonymous keeper holding 500 lights pressed Weave and the door answered 401 SIGN_IN_REQUIRED — the meter refused every unsigned passage outright, before ever weighing the purse, so the birth gift could never be spent; the unlock modal then lied "The purse holds 0" (the 401 handler passed a pretended zero).
- THE QUIET KEEPER'S OWN LIGHT (meter.ts): the anonymous purse is now weighed like any other — while it can pay, it pays (free lights first); only a DRY purse asks for a passage (401), and the ask carries the purse's true balance (`current`). The signed path (402) unchanged; keeper-free and stateless exceptions unchanged; stumbling doors still refund.
- WalletGuard: the 401 handler now passes the response's real `current` — the modal speaks the purse's truth, never a pretended zero.
- The passage copy told the truth at last: "it arrives already holding five lights" → "five hundred lights" in WalletGuard and all seven dictionaries (sq, el, fr, es, de, tr, it) with translated numerals.
- Music room seated as asked: the busy wave, the error card and the Mirror's brief moved directly beneath the describe line — the generation's own section stands at the very top of the music section, above the style row; on landing (or stumble) the chamber rises to its top so the stage is before the eye (reduced-motion honored). The endless journey still lands "ready" only once, so no yank mid-journey.
- The song's explanation removed: the player's "Transmission notes" block lifted; the raw machinery refusals (SIGN_IN_REQUIRED / INSUFFICIENT_CREDITS) now speak the Mirror's voice inline ("The purse has spent its gift — a passage carries the next five hundred lights.").
- The media buttons lifted from the music composer: the paperclip/camera attachment pair (ChatInputExtras + AttachmentChips) removed from the describe line — voice and words remain — clearing the bench for the coming media-player conversion.
- Browser-verified end-to-end (1280px and 390px): anon Weave DEBITS the purse (ledger: LIGHT_CODES −2, freePart 2 — free-first law) with no sign-in demand; the sandbox's missing GEMINI_API_KEY stumbled the engine and the door REFUNDED (+2, "the light returned") — purse whole at 500; drained to 3, the Endless weave (15) rose the honest modal "The purse holds 3 of light — this reflection asks for 15" with the five-hundred copy; profile purse panel reads 500 FREE with the account-chamber link working; zero console/page errors.

Stage Summary:
- The birth gift is now a real currency for every passage — signed or quiet: 500 lights that genuinely pay for music (and every other weighed door), with sign-in asked only when the purse stands empty. The modal and the inline card both speak the true balance and the Mirror's voice. The music room's generation lives at the very top and the woven music appears there, the explanation text and the media buttons are gone. Engine note, honestly kept: actual sound in the sandbox waits on GEMINI_API_KEY (user-side env); the wallet law itself is proven in the ledger.
