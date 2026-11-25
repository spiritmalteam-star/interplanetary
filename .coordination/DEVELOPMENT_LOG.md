# DEVELOPMENT_LOG.md — chronological record of significant changes

## 2026-11-25 (night) — Z.ai, production mirror root-caused + mobile profile law

- **ZAI-10 — the production mirror's true root cause:** founder reported "The field is momentarily
  quiet" on production. Reproduced via curl: POST `/api/transmission` → `code: AI_BAD_RESPONSE,
  upstreamStatus: 402` — **HTTP 402 Payment Required from the Z.ai cloud**. The deployment's Z.ai
  account has no credits left; the chain's Gemini mercy never fired because `FALLBACK_TRIGGER`
  (zai-client.ts) covered only 429/50x — a broke sky was never "refused". Fixes:
  1. `FALLBACK_TRIGGER` now also treats 401/402/403 + payment/balance words as sky-refused → the
     Gemini second sky carries the words whenever a Gemini key stands in the vault.
  2. `classifyAiError` (ai-errors.ts) maps 402 → honest `AI_QUOTA` (was generic AI_BAD_RESPONSE).
  3. Eight routes imported the raw `z-ai-web-dev-sdk` (needs the sandbox's gitignored
     `.z-ai-config`, dead on Vercel) — converted to the `@/lib/zai-client` bridge: mirror-entity,
     network/questions/[id], network/mirror, network/assistant, network/laboratory/mirror,
     particlex/novel, generate-study, tool-analysis. `creation/video/clip` stays raw (SDK-only
     video surface). All three mirror paths re-verified locally (200 + real prose).
  **OPS REQUIRED (only the founder can do):** top up the Z.ai account credits OR add
  `GEMINI_API_KEY` in Vercel → Settings → Environment Variables, then redeploy. Until then the
  second sky has nothing to catch the fall — code now tells the truth (`AI_QUOTA`) instead of a
  vague quiet.
- **ZAI-11 — the phone's own top bar (founder's request):** on mobile the profile left the chat's
  top bar for good and now stands opposite the gathering's sigil — gathering top-left, profile
  top-right (fixed, safe-area aware, z-46, veils with the sigil's own law when a deeper room
  stands open). The banner's old trio (language, light, About) folded INSIDE the profile room's
  purse row (About hand added there; language + RealmLightToggle already lived in it). Desktop
  untouched: the crown keeps profile, language, light and About exactly as they stood. Files:
  `LandingPage.tsx` (MobileProfileMark + cluster removed), `LivingNetwork.tsx` (useVeiledDoor
  exported), `BranchCanopy.tsx` (crown profile max-md:hidden), `ProfilePage.tsx` (About hand).
  Browser-verified at 390px: mark visible opposite sigil, crown clean, panel opens, About opens
  the tour, light toggle flips the realm; desktop 1280px regression-checked green.
- Full `bun run lint` clean.

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

## 2026-11-25 (night) — Z.ai (ZAI-12: production forensics + redeploy trigger)

- **Founder reports:** "No changes visible" + mirror still "The field is momentarily quiet."
- **Probe evidence (read-only, qa/prod_ai_probe.py against www.reflectme.space):**
  - `/api/transmission` returns structured `code/retryable/upstreamStatus` → deployed build HAS
    Claude's classification (post PR #17 / `a0260ef7`), but 402 classifies as `AI_BAD_RESPONSE` —
    the `402 → AI_QUOTA` rule only exists since `6b7337db` (16:44 UTC) → **deployed build predates
    the last three pushes** (6b7337db, d66b6cf3, fd7c5505).
  - Landing HTML lacks `data-testid="banner-profile-mark"` (added in `d66b6cf3`) → mobile top-bar
    rework NOT on production. Edge cache `age≈13.8k s` predates the commit time (secondary signal).
  - omni mode leaks upstream truth: `Gemini chat 402: "Your prepayment credits are depleted…"` →
    **the Gemini key IS configured on Vercel and reachable — its account is ALSO out of credits.**
    Combined with Z.ai's 402: both skies are broke; no code path can answer until either is funded.
- **Conclusion:** two independent causes — (1) Vercel did not deploy the latest pushes (GitHub
  auto-deploy missed them; no vercel.json/hook in repo to force it), (2) billing: Z.ai credits
  spent AND Gemini AI Studio prepayment depleted.
- **Founder ops (ordered):** 1) Vercel → Deployments → Redeploy latest main (or verify the GitHub
  app/webhook) so `fd7c5505`+ goes live; 2) top up Z.ai credits AND/OR fund Gemini AI Studio
  prepayment; 3) re-run the probe — expect `AI_QUOTA` while unfunded, real prose after funding.
- **Local verification of the undeployed work:** sandbox healed c873b47 → fd7c5505 (0 unique
  commits proven first); ZAI-11 mobile top bar browser-verified on iPhone-14 viewport (gathering
  sigil top-left, profile mark top-right, language/light/About inside the profile room, desktop
  `display:none`, zero console errors).
- Docs push (this commit) doubles as the Vercel redeploy trigger.

## 2026-11-25 (night, later) — Z.ai (ZAI-13: the founder's words' law)

- **Founder decree:** "Z.ai as api not Gemini please, Gemini only for music or image generator —
  use default z.ai that we have not as api but as integrated within."
- **The law implemented (`src/lib/zai-client.ts`):**
  - `createPreferred()` no longer hands Albanian to Gemini — every tongue rides the house's own
    Z.ai brains (language argument kept for the door's shape, no longer chooses a sky).
  - `geminiConfig()` removed from the bridge entirely: no chat fallback behind the Z.ai cloud,
    no second sky behind the atelier, no Gemini mercy on Vercel. A spent quota now speaks its
    honest word instead of silently switching skies.
  - The no-provider error names only `ZAI_API_KEY` (the one sky the house allows for words).
  - Gemini's remaining duties (unchanged, its own doors outside the bridge): image engines
    (`image-engine.ts`, covers, sketches) and music (`music/job.ts` Lyria, light codes).
    TTS "google" stays an explicit engine choice only; the house voice (Z.ai) remains default.
- **The honest words (`src/lib/server/ai-errors.ts` + word doors):** new `aiFailureMessage(code)`
  gives each lasting storm its own sentence — AI_QUOTA ("The sky's own light is spent — the keeper
  must tend its purse…"), AI_AUTH, AI_NOT_CONFIGURED; passing storms keep "The field is
  momentarily quiet." Wired into `/api/transmission` (4 spots — including the omni catch that
  previously leaked `Gemini chat 402: prepayment credits are depleted` raw to the visitor),
  `/api/mirror-entity`, `/api/mirror-os` (stream + JSON paths). New sentences added to
  `SKY_WORDS` + the sq dictionary (the audit-tongue).
- **Verification:** lint clean; mirror-entity / mirror-os / transmission all answer real prose
  through the integrated SDK (EN + SQ); failure map sanity-checked (402→AI_QUOTA→purse word,
  401→AI_AUTH→key word); browser whisper answered in character with zero console errors;
  mobile viewport 390px still holds the ZAI-11 top-bar law (sigil top-left, mark top-right).
- **Founder ops change (see HANDOFF):** funding Gemini no longer heals the words — only a
  Z.ai credit top-up (or a fresh `ZAI_API_KEY`) returns prose to production. Gemini funding
  serves only the paintings and the music.
