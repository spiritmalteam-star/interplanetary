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

---
Task ID: 13
Agent: Z.ai Code (main orchestrator)
Task: The channeling animation and the player share the stage; the sky's weight door can no longer eat a woven song (Vercel "too heavy to display" healed); the half-hour journey crosses warm instances; the sign-in hand no longer flips the light

Work Log:
- Synced the vessel first: local main had drifted onto the archived yielding-portal tip (c873b47) while remote main stood at 40bc521 (six wishes + the quiet keeper's light already standing). Reset to origin/main, re-pinned expected-head. Zero work lost (the portal keeps its archive branch).
- THE CHANNELING ON THE STAGE (LightCodesView): the weaving animation now lives in the music player itself — where "Nothing woven yet — the sounds you weave will rest here, ready to listen." stood, the wave now breathes the moment a weave begins (full stage when no sound holds the room; a quiet strip beneath the transport when one does), with the honest phrase (interpreting / full song / journey movement k of six). The old busy block under the describe line is lifted — the error card keeps its place and the room still rises to the top on landing or stumble. Loop and play-on-next were already standing (repeat dial off→all→one, auto-advance, prev/next, shelf) — verified alive, newest weave takes the stage with the glow.
- THE WEIGHT LAW (the "music was created but too heavy to display" fix): the engine's song heavier than the sky's 4.5MB response door was refused at extraction — thrown away BEFORE the vault could keep it. Now extractWeave carries an `oversized` flag instead of a refusal; the sound is kept FIRST (file where the shelf is writable, and the row's own bytes — MusicTrack.audioData, the deep shelf — always), and the answer travels by its serve key (/api/music-audio/<file>) with NO inline base64. A kept song never meets the weight door again; only an unkept heavy (truly stateless) speaks the honest weight words. The keeping law widened: anonymous keepers with a row (the quiet purse) are kept like any other — the visitor's exact Vercel flow. The serving door reads file first, deep shelf second, with full byte-range law (206) for seeking; ownership law unchanged (404 strangers).
- THE JOURNEY'S DEEP THREAD (30-minute songs in the sky): the endless journey's parts no longer rest on one warm instance's memory — LoopWeave / LoopWeavePart / LoopWeaveFinal models lay every movement in the vault's deep shelf, so the six-part half-hour weave crosses Vercel's warm instances and finishes wherever its last part lands. Soft crossings (ffmpeg) where the shelf has it, plain end-to-end join where it doesn't; one quiet hour sweeps unfinished threads and finished pieces alike. Stateless keepers keep the instance-local shelf. The journey's serve door reads the deep shelf first, honors byte ranges.
- THE SIGN-IN HAND'S ILLNESS, found and cured: reproduced the visitor's exact report — on the profile room, "Enter the passage" did not open the door; it toggled the realm's light off and on. Root cause: RealmLightToggle's touch-veil pseudo (`after:absolute after:-inset-1`) had no `relative` on its own button, so the invisible pseudo stretched across the WHOLE profile overlay (its nearest positioned ancestor) — every click on the page hit the toggle. One word added (`relative`); the veil now hugs its own button. Scanned the house for the same disease — no other offender.
- Verified in the browser (1280px and 390px): the stage wears the weaving at the player's position; the deep-shelf serve door answers 200 (full), 206 (range), 404 (stranger); a synthetic three-part journey began, guarded out-of-step, joined end-to-end (6144 bytes), served only to its owner, then swept; the passage modal opens, STAYS open, and its tabs switch true; "Enter the passage" is clickable again on both gears; purse whole at 500 after the sandbox's honest engine stumble (refund law). Probes cleaned from the vault.

Stage Summary:
- The music room's stage is one place now: the empty shelf's promise, the weaving animation, and the landed player all breathe at the very top, with loop, next and repeat standing. A woven song can no longer be too heavy to carry home — the vault's deep shelf holds the bytes and the serve key travels instead; the half-hour journey survives the sky's scattered instances. The sign-in hand opens the passage again instead of flipping the light. For the live site: redeploy main on Vercel — the stale deployment predates the quiet keeper's light and the birth gift.

---
Task ID: 14
Agent: Z.ai Code (main orchestrator)
Task: The tools hand opens a workplace (InDream) instead of a dropdown; the scopes open their own workplace; the five makers ride both; the music bench compacted (one style dropdown, default no style, one input, small symmetric transport, the deepening hand); the full song woven past the two-minute wall in two movements; the Invent room scratches ideas into up to three Gemini visions

Work Log:
- Synced the vessel first: local main had drifted onto the archived yielding-portal tip (c873b47) while remote main stood at c3c9507 (tasks 11-13 standing). Reset to origin/main, re-pinned expected-head, clean restart. Zero work lost.
- IN DREAM, THE WORKPLACE: the crown's making hand no longer drops a menu — one touch opens the workplace itself, named InDream, whose header lays the rooms as horizontal tab buttons. THE STANDING RAIL (ToolWorkspace): Book · Music · Akashic · Manifest · Invent · Scopes stand in the row ALWAYS — an unopened pill wears the dashed dress and opens its room on the touch, an open one turns to it; the extra rooms (video/register/library) ride the rail while open; the per-tab close crosses are lifted (the one back hand is the single return). THE ONE BACK: a new closeWorkspace lays the whole workplace down at once — the main chat landing stands again.
- THE SCOPES WORKPLACE: "scopes" joins the registry as its own page (ScopesRoom) — the five fields stand as full cards wearing their own light (the chosen one marked Here), and THE MAKERS ride beneath (Book · Music · Akashic · Manifest · Invent), so the visitor jumps between the tools and the scopes in one touch, both directions. Choosing a field dresses the chat in its light and returns to the landing. The crown's Scopes hand opens this room instead of the dropdown (the mobile-positioning question dissolves — there is no dropdown any more).
- THE MUSIC BENCH, COMPACTED: the old style rows (no-style chip, seven chamber chips, intents, civilizations, shape) fold into ONE dropdown button that wears the current style's name; Surprise me sits beside it as the second half of a symmetric pair. THE FIRST LAW, DEFAULTED: lcRaw now stands true at birth — no style rides with the ask until the visitor's own hand chooses a chamber (choosing one lifts the no-style law by itself). THE ONE INPUT LAW: the brief's refinement line (a second input nested under the first) is lifted — the describe line above the brief is the room's only input.
- THE DEEPENING HAND: while the visitor's idea stands in the input, one small wand appears and turns it into a more advanced telling that relies on the core idea (new free door /api/light-codes/idea, the Mirror's own voice, the refined words land in the input for the visitor's own hand to send). Verified live: "a slow river of starlight carrying fallen wishes home" became a rich paragraph keeping every core image and adding instruments and atmosphere.
- THE TRANSPORT, SMALL AND SYMMETRIC: back · play · forward · the repeat dial · ONE quiet more-hand (new version, reshape, download, translation folded inside) · mute · volume — every dial size-7, the play size-8; nothing crowds the bench.
- THE FULL SONG PAST THE TWO-MINUTE WALL: the full song now rides the journey's loom — TWO real movements (the opening begins the song and must not fade out; the closing carries the chorus back and ends whole), joined with soft crossings into one continuous piece (FULL_SONG_PARTS in the engine, kind "song" in the segment prompts). The journey was weighed ONCE at its first movement (the meter skips every continuation of any length); a stale token never resumes across shapes (journeyKind guard); the deep shelf carries the movements across warm instances. The length chip speaks honestly: "Full song · 4+ min". The endless journey keeps its six movements (~30 min). Stateless keepers keep the single-call full song (backward compatible).
- THE FORGE'S SKETCH DOOR (Invent): a new hand beside the paperclip scratches the idea into form — up to THREE visions of one idea, painted by the sky's own Gemini (GEMINI_API_KEY, gemini-2.5-flash-image with a name-fallback), one call per honest angle (mechanism · form · use). The visions land beneath the last turn, session-only (never written to the device's keep), and the door speaks the honest nokey word when the key is not placed. Verified: the button enables on the draft, the honest 501 in the keyless sandbox; the deepening door proven live.
- Every tongue carries the new hands (scripts/i18n-batch14.mjs): 12 keys × 7 dictionaries.
- Verified with agent-browser at 1280px AND 390px: the crown reads profile · InDream · Scopes; the InDream workplace opens on the touch with the standing rail; the rail jumps Book→Music→Invent→Scopes; the scopes room wears its five cards and the five makers; choosing HealX closes the workplace and the chat lands wearing the teal light; the music room shows the compact composer, the deepening wand appearing with text and WORKING, the style dropdown opening/picking/unlocking, the brief card with NO refine input and the honest length row ("This weave weighs 2 light — the purse holds 500"); the mobile 390px crown fits and the rail scrolls; zero console/page errors; lint and tsc carry zero new complaints.

Stage Summary:
- The tools and the scopes are two rooms of one workplace now — InDream with its five makers as horizontal tabs, the scopes with its five fields and the same five makers one touch away, both returning to the main chat landing by the one back hand. The music bench is compact, symmetric, one input, no style by default, with a working deepening hand; the full song weaves in two movements and lands past the two-minute wall with its light weighed once; the Invent room scratches ideas into three Gemini visions. For the live site: redeploy main on Vercel — the stale deployment predates ALL of tasks 11-14 (the birth gift, the spending law, the deep shelf, this batch).

---
Task ID: 15
Agent: Z.ai Code (main orchestrator)
Task: The scopes leave InDream and stand as their own independent workplace (back hand included); the Book and the Akashic wear the same input-bar structure and position as Invent and Manifest (each keeping its signature send hand); the Invent room no longer auto-inputs image requests

Work Log:
- THE SCOPES, INDEPENDENT: the standing rail of the InDream workplace now carries the five makers ONLY (Book · Music · Akashic · Manifest · Invent) — the scopes are no longer a tab of the tools' window. A new ScopesWorkplace window (mounted beside ToolWorkspace in the one realm) rises when the crown's Scopes hand is pressed: its own header with the one back hand at the left and the Scopes name, the identity strip, and the fields' subcategories rendered inside — one card per field, the chosen one marked Here, same as the inbounds always wore them. Its back hand (closeScopes — a new store action) lays ONLY the scopes down (the InDream tabs keep resting beneath) and the main chat landing stands again; picking a field dresses the chat in its light and returns the same way. The InDream hand no longer counts the scopes as its own window (openInDream ignores the scopes' occupancy). The makers row is lifted from the scopes room — the fields' workplace renders the fields' subcategories, nothing else.
- THE ONE INPUT BAR, EVERYWHERE: the Book's composer and the Akashic's ask bar stood as floating cards (absolute at the foot, their own card chrome). Both now stand IN FLOW at the foot of their rooms with the exact structure and position the Invent and Manifest rooms carry: shrink-0 wrapper (px-3 pb-3 pt-1), one rounded-2xl tinted container (the room's own scope light), the words growing inside (textarea, max-h-24, Enter sends / Shift+Enter breathes), and the room's SIGNATURE send hand at the right — the Book keeps its akashic-btn Waves (the channel hand), the Akashic keeps its akashic-btn Feather (receive by resonance), with the Librarian's attachment and voice extras riding the same bar. The bodies' old floating-clearance padding (pb-24 / pb-28) is lifted.
- THE INVENT'S QUIET: the "Draw it as an image" proceed chip (which auto-input an image request into the conversation) is lifted — the forge's sketch hand (the ImagePlus beside the paperclip) paints the up-to-three Gemini visions only when the visitor's own hand presses it. The room proceeds with "Go deeper" and "What would I build first?".
- Verified with agent-browser at 1280px AND 390px: the scopes window opens independent (no tab rail, makers gone, back at the left), back returns to the landing; the InDream rail reads Book · Music · Akashic · Manifest · Invent with tool-tab-scopes absent; the Book's and the Akashic's bars stand in flow, tinted, with their signature hands; the Invent's proceed chips read exactly [Go deeper, What would I build first?]; zero console/page errors; lint and tsc carry zero new complaints.

Stage Summary:
- The scopes are their own workplace now — opened by their own crown hand, rendering the fields' subcategories with the one back hand home; InDream carries only the five makers. Every conversation room of the house (Book, Akashic, Manifest, Invent) wears the same input-bar structure and position, each with its own signature send hand. The Invent no longer asks for images by itself — the visitor's hand leads.

---
Task ID: 63
Date: 2026-10-28
Task: Restore latest version; remove the music timing wall; Manifest one plate per request; Invent crystallize-on-request; Quantum and HealX rooms between InDream and Scopes; image style via "/"; zoom + pinch on every painting; the image hands leave the chat line; the chat hears the wish to see in any phrasing; fifty new civilization profiles (0241-0300) imported, duplicates skipped

Work Log:
- THE VESSEL RESTORED: local main had drifted onto the archived yielding-portal tip (c873b47, a stale duplicate of the remote's 0506bc1) while remote main stood at 101d6d0 (131 commits ahead). Backup branch backup/local-c873b47 cut, hard reset to origin/main, bun install, clean restart. Zero work lost.
- THE MUSIC'S NATURAL LENGTH LAW: the thirty-second wall is gone. Every weave — preview, full song, endless — now rides the full model (lyria-3.5) with NO duration dictated in the prompt ("a piece that finds its own natural length"); the clip model (lyria-3-clip-preview) is retired from the weave (kept only as a status mirror). The preview timeout rose 120s → 280s, the capability registry's music timeout to 300s, and the honest timeout word no longer points at the "30-second preview". The length chips speak plain: "Preview ✦2 · Full song ✦5 · Endless ✦15" — no "30s", no "4+ min", no "~30 min" anywhere (player badge, admin price labels, status route included).
- THE ONE PLATE LAW (Manifest): /api/visualize accepts single:true — the presentation door never opens for the Manifest's gift, the director is told ONE IMAGE ONLY in the prompt, and any presentation spec is coerced to illustration. The Manifest room's paintVision sends single:true with every gift.
- THE CRYSTALLIZE HAND (Invent · Quantum · HealX): these rooms never paint by themselves any more — the forge's old auto-vision is captured as the turn's own visionPrompt, and at the end of every transmission stands the crystallize button (Gem icon, the room's own light): the image is born only when the visitor's own hand presses it, painted from the model's vision direction or the turn's own subject, with "Crystallize anew" for a second plate. The composer's sketch hand (three angles) stays, and wears the chosen style too.
- QUANTUM AND HEALX, THE DEEP ROOMS: two new maker rooms on the SimpleMirrorRoom chassis — Quantum (Atom, #a78bfa, the quantum voice through /api/transmission mode quantum) and HealX (HeartPulse, #2dd4bf, the healing voice), each with the crystallize hand. The InDream rail now stands Book · Music · Akashic · Quantum · HealX · Invent (the Manifest's old place carries Quantum). The crown nav carries Quantum and HealX BETWEEN InDream and Scopes — icon pills on the narrow phone, labeled from sm up. THE MANIFEST AT THE SCOPES' SHORE: the ArtX card's old place in the scopes room carries the Manifest card (opens the Manifest room itself); ArtX leaves the pickable fields (the type and any worn light stay safe for old visitors).
- THE STYLE'S OWN HAND ("/"): a new shared shelf (src/lib/image-styles.ts) of twelve looks (Ethereal dream, Cosmic nebula, Bioluminescent, Crystalline, Ancient fresco, Golden baroque, Watercolor wash, Oil painting, Cinematic film, Retro anime, Ink line art, Vaporwave neon). Typing "/" alone in any composer opens the picker; the chosen look wears as a removable chip and rides with every painting: /api/visualize takes style (woven into the director's lines and the final prompt) and /api/invent-sketch takes style. The landing floor's whisper line carries the same "/" hand (visualStyle in the store, worn by crystallizeVisual, askScopeVisual, askForgeVisual and every room's paint).
- THE DEEP READING (ZOOM): a new shared kit (ZoomableLightbox.tsx) — ZoomStage with wheel zoom, two-finger pinch (the page's own zoom asleep), drag-to-pan, double-click 2.5x, and the ± / fit control bar with the live percentage. The VisualizationCard's expanded lightbox now wears the ZoomableImageSurface; the SimpleMirrorRoom paintings and sketches open the full-screen ZoomableLightbox. The render stays pure for the new react-hooks/refs law (state-driven transforms, refs only inside handlers).
- THE IMAGE HANDS STAND DOWN: the chat line's camera is gone and the paperclip carries documents only (PDF, Excel, Word) — the chat paints by itself now, so the image icons have no place on the line. (The rooms' own image hand — handing the Mirror a picture to speak about — stays.)
- THE WISH HAS A THOUSAND FACES: the landing chat now HEARS the wish to see in any phrasing. The client gate grew wish phrases ("I want to see", "can I see", "let me see", "would love a picture"...) and made forms (artwork, portrait, poster, wallpaper, logo, avatar...); the fast path paints at once, no LLM round trip, the last channel the subject. The Mirror's own eye (the transmission route's VISION_RULE) was rewritten: "the wish has a thousand faces — grant it in any shape", still guarded against stories, refusals and machinery talk. The landing floor AND the landing rooms crystallize into the field's own thread (paintLandingTurn); the landing's speakWithTransmission now returns the model's vision gift (speakReplyGift) so a reply that chose to paint carries its plate beneath the words; the vision turns keep their plate in the visit's sessionStorage page and return with the words on reload. Verified live: "draw a picture of a lighthouse over a void sea" → SILVER plate, no LLM words; "paint me a portrait of a star whale singing to the moon" → STAR WHALE SERENADE; the wheel zoomed to 156%; the plate returned after reload.
- FIFTY NEW CIVILIZATIONS: tools/codex/ingest_unique_profiles.py ingested the five uploaded batches (CIV-0241..0250, 0251..0260, 0261..0270, 0271..0280, 0291..0300 — 0281..0290 was never uploaded): 200 new role plates (being/world/technology/life), re-encoded to WebP, readyRoleAssets 800 → 1000, readyProfiles 200 → 250. The fingerprint dedup verified by replay (0 new, 40 skipped, archive untouched). Note for the keeper: batches 0201-0240 and 0281-0290 are still missing from the shelf.
- Every gate held: tsc clean (the seven pre-existing errors unchanged), eslint clean (0 problems), dev log carries only the pre-existing instrumentation warnings, and the browser walked the whole golden path on desk (1280) and phone (390): the nav's four hands, the six-pill scrolling rail, the "/" picker, the crystallize hand, the deep-reading room, the scopes' Manifest card.

Stage Summary: The music is as long as it is; the Manifest gifts one plate; the Invent, the Quantum and the HealX wait for the visitor's own hand to crystallize; the Quantum and the HealX stand between InDream and Scopes where the Manifest and the ArtX buttons stood; the "/" hand dresses every painting in the visitor's chosen style; every plate may be pinched closer; the chat line carries words and documents only; and the chat hears the wish to see however it is said. Fifty civilizations joined the archive, and none of them came twice.
