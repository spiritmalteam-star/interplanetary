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

## 2026-11-25 (night, finale) — Z.ai (ZAI-14: the build healed, the threshold revealed)

- **"No changes visible" — ROOT CAUSE FOUND AND FIXED:** Vercel was NOT ignoring pushes — it built
  and FAILED every deployment since the 16:44 batch. Commit-status forensics (GitHub API):
  `71cd484f` = last success; everything after = "Vercel failure". A local production build
  reproduced it deterministically: `network/questions/[id]/branch/route.ts` (new in the batch)
  imported `questionDetail, QUESTION_INCLUDE` from `../../route` — exports that existed NOWHERE
  (route modules may not lend exports to each other anyway; the builder refuses).
- **The fix:** the question's own shape now lives in `src/lib/server/question-detail.ts`
  (`QUESTION_INCLUDE` + `questionDetail(q, viewerId)` matching the detail route's GET figure);
  the branch hand serves from it. Full local build now GREEN (Turbopack, standalone output).
- **"Default preview must reveal the website":** the welcome walk (About Us · 1 of 8) auto-rose
  1.2 s after load on every first visit and covered the site. The auto-open is gone (founder's
  law): the website IS the default preview; the walk opens only when a hand asks (About hand,
  question mark, canopy doors all keep working). Dead guards removed.
- **PRODUCTION VERIFIED LIVE:** push `c93809d3` → Vercel status flipped failure→success (poll 4);
  landing HTML carries `banner-profile-mark` (mobile top bar LIVE at last, age 0 fresh); probe
  speaks the words' law — omni returns the honest purse word (AI_QUOTA) instead of the leaked
  "Gemini chat 402: prepayment credits are depleted".
- **The one remaining founder action:** top up Z.ai credits (or set a funded ZAI_API_KEY on
  Vercel) — per the words' law this is the ONLY path to prose; Gemini's funding feeds only the
  painters and musicians.

## 2026-11-26 — Z.ai (ZAI-15: the visitor's own page — the profile leaves the chat's frame)

- **THE PROFILE IS AN INDIVIDUAL PAGE (the owner's word):** `ProfilePage` no longer plays
  `absolute inset-0` inside AppShell's frame div (where the docked lens's rounded corners clipped
  it). It now `createPortal`s itself to `document.body` and stands `fixed inset-0 z-[92]`,
  fully opaque (`bg-background`) — one full page of the house over the whole website, in BOTH
  gears (docked lens and fullscreen realm), measuring the true viewport regardless of any
  transformed ancestor (the zoomed-sky law). Verified geometry: 1280×800 desktop, 390×844 phone,
  `parentElement === document.body`.
- **THE PROFILE ICON HAS ONE HOME — THE TOP (the owner's word):** the icon is no longer inside
  the chat's frame. The threshold's gate (`LandingGate`) now renders a universal
  `TopProfileMark` (`banner-profile-mark` kept for the prod probe) at the website's top-right —
  opposite the gathering's sigil (top-left), on EVERY device (the old `md:hidden` mobile-only
  mark is gone from `LandingPage`). It is rendered BESIDE the landing root (never inside it), so
  the landing's through-phase `invisible` can never hide it. Docked gear: the mark is the one
  door. Fullscreen realm: the mark veils (phase !== landing) and the crown's own
  `CrownProfileIcon` takes over (`realm && !bare`, now on the phone too — the crown IS the top
  there), with the crown row reserve widened fullscreen (`pr-12`) so nothing slides beneath the
  corner's gear hand.
- **THE BROWNISH GLASS (the owner's word — never black):** the gathering sigil
  (`LivingNetwork`) and both profile marks (gate's `TopProfileMark`, crown's
  `CrownProfileIcon`) exchanged the near-black glass `rgba(7,10,17,0.82)` / scope-tinted
  backgrounds for warm amber-brown glass: `rgba(64,45,27,0.62)` (crown icon 0.55), brass
  hairline `rgba(196,158,110,0.34–0.4)`, warm shadow, `backdrop-blur-md`, hover warms to
  `rgba(232,217,176,0.6)`. One family look for the whole top pair.
- **The veil law grew one clause:** `useVeiledDoor` now also rests both top doors while the
  profile page itself stands (`profilePageOpen`) — verified in the hall (both opacity 0) and
  after (both opacity 1).
- **Verification (agent-browser):** landing 1280px — brownish sigil top-left + brownish mark
  top-right, NO profile icon in the docked crown; mark opens the individual page (portal to
  body, fixed, z-92, opaque); X and Escape both close clean, landing returns; fullscreen realm —
  mark veiled, brownish crown icon at top, opens the same individual page; minimize returns and
  the mark comes back; mobile 390px — pair at the top (both `rgba(64,45,27,0.62)`), docked crown
  clean, page 390×844; gathering hall opens (z-90) with both doors veiled, closes, doors return.
  Zero console errors / page errors. Lint clean. SSR HTML still carries `banner-profile-mark`
  (the production probe keeps working).

## 2026-11-26 — Z.ai (ZAI-16: the top that stays, the settings at home, the slim codex rail, the one simple light, each book its own bones, the mirror at the crown)

- **THE TOP HANDS STAY (the owner's word):** the gathering sigil's scroll law (slide to the
  bottom-right corner after 48px) is gone — `LivingNetwork` no longer carries a scroll listener
  at all. Both top hands (sigil top-left, profile mark top-right) are `fixed` at the very top on
  every device and never follow the walk; only the deeper rooms can veil them. Verified: icons
  fixed at top 14.4px with opacity 1 at 390px and 1440px.
- **THE SETTINGS AT HOME (the owner's word):** the profile page's Settings section now carries
  the tongue and the light: the language row speaks with the same floating nine-voice
  `LanguageButton` (falls below the hand in settings; new `labelledBy` prop binds the row's
  label) and a new "The realm's light" row holds the sun/moon toggle. Verified: toggle turns
  dark ⟷ daylight live; the menu opens with 11 tongues (Albanian first).
- **THE CODEX'S SLIM RAIL (the owner's word):** `CodexTabs` redesigned from a centered row of
  fat pills into hand-laid index tags at the margin: slim cards (`px-2 py-1`, 10.5px mono
  labels, hairline rims), a small brass tick before each name, and per-tab leans/offsets
  (sm-only) so the row reads scattered, never machine-symmetric; left-aligned (no
  justify-center), content-sized (`max-w-full`, the `w-full` squeeze removed) and the
  ArchiveRegister header row bounds the rail (`lg:max-w-[540px]`) so the intro paragraph reads
  full-width again. Verified in the codex room: readable 3-line intro + staggered two-line tag
  rail.
- **THE ONE SIMPLE LIGHT (the owner's word: not 5 animations for the same revealing):**
  - Every channeling variant now carries exactly ONE motion: mirror = one breathing ring around
    a still heart (inner ring removed); aperture = turning ring, still pupil; orbit = one
    particle, still nucleus; hyperx = one spinning ring, still heart; starfall/tide/spark/ink/
    bloom/helix/orb counts thinned to 2 (helix 3); dead CSS (inner rings, `-2` dots, pupil/heart
    keyframes, nth-child 3–6 rules) deleted.
  - The forge's `ForgingEmber` = one breathing ember inside a still dashed ring frame
    (halo/halo-rev rotations removed); the invention's blueprint keeps ONE motion (the outer
    ring turning — counter-ring, pulsing core, flowing force line, spinning flywheel, swinging
    pendulum and wobbling plaything all stand still); the mystery card keeps its single
    fade-rise.
  - `CreationReveal` trimmed from ~7 actors to ONE authentic reveal: a single ring of gold
    breathes outward and the making rises inside that breath (seal, violet echo, sparks and the
    two curtains retired; ceremony 1.6s → 1.1s).
- **EACH BOOK ITS OWN BONES (the owner's word):** the resonance draw is wired back into the
  dream-book loom — `drawResonance` + `resonanceCharter` speak the volume's blind skeleton into
  every opening breath (bias line binds the drawn axes to the visitor's chosen kind of tale),
  `resonanceEcho` returns as `out.resonance` and rides the volume's saved config; the client
  keeps the birth echo (`resonanceRef`), sends it as `resonance` on the next conjuring (the new
  draw refuses every bone) and inside the config on every stride (a one-line "the resonance
  still holds" keeps the skeleton without re-announcing it). `sanitizeEcho` guards the carried
  echo. LIVE PROOF (integrated Z.ai): two `open` weaves, same topic — book one "The Valley of
  Weather Reports" (heartbeat "wyrd that trades with the warm window"), book two "The Ledger of
  Falling Light" (heartbeat "chimney that carries the open ledger"); ZERO of 21 axes identical.
- **THE MIRROR AT THE CROWN (the owner's word: no overlap, aware of everything):** the hall's
  floating pearl left the foot (where it rode over the radio band, the Possibilities player and
  the lab sheet) and now sits INSIDE the crown bar, left of the lab hand (fixed top-right,
  z-30 — below every sheet/modal); its compact drawer falls from under the crown; all
  bottom-juggling (radio lifts) removed. The assistant API now ALWAYS reads the whole house
  before it speaks — open questions, circles, collective intentions, scheduled/live gatherings —
  and its system prompt names both worlds (chamber scopes/invent/manifest/books/library + the
  hall) with the five hands: DISCOVER, CREATE, SUGGEST, LINK, PUBLISH (new `link` and `publish`
  actions + quick hands "Link people & works" / "Publish a work"). Verified live: M.E. read the
  empty network and answered honestly, pointing at real rooms; pearl at (1336,12) overlaps
  nothing (back/lab/nav/name all clear) at 1440px and 390px.
- **Verification:** lint clean; dev server 200; agent-browser runs at 390px + 1440px across
  landing, profile (settings rows, toggle, tongue menu), hall (crown pearl, panel, M.E. answer),
  codex (new rail) and Invent (clean render); dream-book route compiled and proven with two real
  weaves. HMR ChunkLoadError during a hot rebuild was transient (fresh load clean).

## 2026-11-26 — Claude: measured performance baseline (PR #21)
Tools: `qa/perf_probe.py` (production landing, mobile, 4x CPU throttle) and `qa/perf_chat.py` (CI-built app, AI stubbed, 14-turn streamed conversation, 4x throttle; workflow `perf-chat.yml`).
- Landing (production): heap 12-19 MB, ~1000 DOM nodes, 0 backdrop filters, 5 long tasks / 642 ms at load, 23 `_next/image` requests, no leak.
- Long conversation: heap flat (~21-28 MB, no growth trend), DOM +15 nodes/turn, no long tasks after turn 2, no horizontal overflow, input responsive (~14 ms frame).
- ~7 layout passes/s at idle come from the Chronoscope's 5 s featured-world rotation (module childList/style churn); about 3% of one throttled core. Candidate: pause when off-screen.
- `document.getAnimations()` grows 2/turn: finished `forwards` one-shot animations (mirror-fuse-*), not running loops.
- No freeze reproduced on these paths. NOT yet profiled: IWork, Scopes, Invent, Manifest, Codex, Gathering, Book, Music rooms (rAF/canvas loops there are visibility-guarded per static scan).

## 2026-11-26 — Z.ai: the master directive's foundation (ZAI-17 → ZAI-20)

Session web-6fefa0f9, base `17a736be` (owner delivered the shared MIRROR_MASTER_DEVELOPMENT
directive — "Evolve and collaborate"). Four stages landed:

- **§2 HANDSHAKE (ZAI-17):** capability report verified and appended to HANDOFF.md — push/PR
  confirmed live, webhook events and agent-to-agent channel confirmed ABSENT (manual activation),
  tests = lint + real-browser + prod probes (no unit infra), profiling reproducible in-sandbox.
  Responsibilities split proposed; no runtime configuration touched during the handshake.
- **§10 ROOM SWEEP (ZAI-18):** read-only probe of every remaining room (Scopes, Invent, Manifest,
  Book, Music, Akashic, ArtX, Gathering) at 1280×720 after settle: heap 42–56 MB with no growth,
  DOM 670–1476, **zero** backdrop filters, ≤18 running animations (Music's player the busiest),
  0 long tasks. No freeze indicators; nothing to fix — the rooms are lean. Combined with Claude's
  landing + chat baselines, the profiling stage of §11 is complete.
- **§5 MIRROR GLASS (ZAI-19):** the shared liquid-glass vocabulary — `--mg-*` tokens for both skies
  (milky vanilla + lit crystal), `.mg-material` (one composited blur layer, conic-gradient silver
  rim, inset depth), the restrained hover sweep (transform-only), the tactile press, focus law,
  solid `@supports` fallback, reduced-motion rest. Compact primitives in `src/components/ui/glass.tsx`
  (button sm/default/lg/icon, input, textarea, card, tabs+tab, panel) — additive, nothing retrofitted,
  real elements only (never a styled div). Computed-style verified in both skies.
- **§7 THE INTELLIGENCE ORB (ZAI-20):** `src/components/ui/intelligence-orb.tsx` — one canvas, dots
  seeded on a Fibonacci lattice by the golden angle (cached per size, capped 96), depth-lit, wearing
  four room flavors (pearl/silver mirror, worn scope accent, champagne/amber invent, opalescent
  banded manifest) and SEVEN honest states. The laws held: IntersectionObserver + visibilitychange
  stop the loop offscreen/hidden, frame gap capped 100 ms, dpr ≤ 2, reduced-motion paints one frame
  and never loops, unmount cancels everything. Accent resolution via the canvas fillStyle sentinel —
  any CSS color accepted, invalid falls back to the flavor. Wired ONLY to real events:
  - BranchCanopy main chat: the three per-turn tells (full-size, thread compact, painting) —
    the orb replaces the compact channeling light, labels kept (HyperX ladder + making sigils untouched);
  - SimpleMirrorRoom: its two tells now wear the orb (WornAccentOrb reading the inherited --scope-a);
  - MirrorOSChat OsThinking: primary 44 px orb replaces ManifestLoading + inline 20 px error orb;
  - InventView: 44 px forge orb + inline error (ForgeLoading retired from the chat path);
  - TransmissionView (Manifest forming): inline 22 px opalescent orb beside the cryptic phrases —
    the little visitor preserved (the room's soul is protected by the non-destructive law).
- **Verification:** lint clean; dev server 200; orb CAUGHT LIVE in the docked mirror chat
  (state=working, 18 px) and in the Quantum scope (violet accent); mobile 390 px caught it too
  (visible, correct size); after the answer the canvas count returns to 0 (no lingering loops);
  heap 49 MB / DOM 705 / 0 long tasks after the sweep. Glass probe verified: milky veil + blur(14px)
  saturate(1.15) light, crystal veil dark, warm/icy hairlines, inset depth.

**Next (proposed in the registry):** ZAI-21 Codex dimensional gallery and ZAI-22 Gathering editorial —
each needs its own dedicated session; both claimed with scope notes so Claude can pick either up.
