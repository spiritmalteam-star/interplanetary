# Task 2-a — THE GATHERING (quantum social world)

Agent: 2-a · Date: 2026-11-11 · Status: DONE (all checks green)

## Files created / changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | APPENDED 4 models only (existing models untouched): `GatheringPresence` (userId @id, handle, aura, glyph, vibe, updatedAt), `GatheringSignal` (+`@@index([createdAt])`), `GatheringResonance` (`@@unique([signalId,userId])`, cascade delete via signal relation), `GatheringEntangle` (`@@unique([userId,targetId])`). `bunx prisma db push` succeeded (db/custom.db). |
| `src/app/api/gathering/_shared.ts` | NEW — allowed sets (auras/glyphs/vibes), `fail()` JSON errors, `handleFromUser()` sanitizer (max 24), `ensurePresence()` upsert helper, `isOneOf()` validator, `SIGNAL_MAX=600`. |
| `src/app/api/gathering/presence/route.ts` | NEW — GET + PATCH. |
| `src/app/api/gathering/signals/route.ts` | NEW — GET + POST. |
| `src/app/api/gathering/resonate/route.ts` | NEW — POST toggle. |
| `src/app/api/gathering/entangle/route.ts` | NEW — POST toggle. |
| `src/components/gathering/GatheringWorld.tsx` | NEW — the whole world (client component, named export `GatheringWorld`). |
| `src/components/mirror/AppShell.tsx` | ONE edit — added `import { GatheringWorld } ...` + the `view === "gathering"` branch right after the akashic branch, exact FRAME_LIFT pattern as specified. |

Not touched (per rules): mirror-store, BranchCanopy, globals.css, resonance-engine, light-codes, etc. No separate CSS file (all styling Tailwind + inline style vars; the twinkle keyframes live in an inline `<style>` tag inside the component).

## API shapes (verified by curl, both guest + 2 authenticated test users)

- `GET /api/gathering/presence` → `{ me: {userId,handle,aura,glyph,vibe}|null, presences: [{userId,handle,aura,glyph,vibe,signals,entangled,coherent}] }`
  - signed-in: auto-creates presence (handle from name/email-local, sanitized, ≤24), bumps `updatedAt` each GET (heartbeat → `coherent` = looked within 90s) — **`coherent` is an ADDITIVE field beyond spec**, needed to render the "Coherent" state.
  - guests: `me: null`, full presence list still returned (read-only).
- `PATCH /api/gathering/presence` body `{handle?|aura?|glyph?|vibe?}` → `{me}`; 401 guest; 400 on bad values (`handle` 2..24 trimmed; aura/glyph/vibe whitelisted).
- `GET /api/gathering/signals` → `{signals:[{id,userId,handle,aura,glyph,body,createdAt,resonances,resonated,entangled}]}` latest 80 newest-first (`_count` + my resonance/entangle sets; guests read-only, flags false).
- `POST /api/gathering/signals` `{body}` → `{signal:{...}}` (author snapshot from ensurePresence); 401 guest; 400 empty/>600.
- `POST /api/gathering/resonate` `{signalId}` → `{resonated,count}` toggle; 400 if signal dissolved.
- `POST /api/gathering/entangle` `{targetId}` → `{entangled}` toggle; 400 self-entangle / unknown target.

All routes: `export const dynamic = "force-dynamic"`, try/catch, 400/401/500 with short poetic English messages (client passes them through `t()`).

## Vibe toggle (the crown requirement)

- Pill in "Your Presence" card: **"Purple field" ↔ "Gold constellation"** (two `aria-pressed` buttons, role=group).
- Signed-in: instant local recolor + `PATCH {vibe}` persisted on presence. Guests: `localStorage["mirror-gathering-vibe"]` (read on mount; server vibe wins for signed-in and mirrors to localStorage).
- Purple: app-theme background + violet radial gradients, `--gath:#a78bfa`, violet stars.
- Gold: ink-dark ember room — locally overrides `--background/--foreground/--card/--muted*/--hairline*` (scoped to the world root) with gold `--gath:#d4af37`, warm gradients, brighter constellation.
- Constellation layer (both vibes): deterministic mulberry32(40 stars), SVG lines to neighbors <16 units (non-scaling-stroke), twinkle = opacity-only CSS animation, disabled under `prefers-reduced-motion`. Accent `--gath` only on borders/rings/glows/icons — body text stays `text-foreground`/muted (contrast law).

## Frontend notes

- Header: back (exitGathering) · Atom + "The Gathering" / "presences in one field" · presence chip (mobile → slide-over, desktop static).
- Signal field: `role="log"` list, oldest→newest bottom, sticky auto-scroll (disengages when you scroll up), empty state "The field is quiet — be the first signal."
- Composer: autosize textarea, Enter sends / Shift+Enter newline, 0/600 counter, spinner while posting, refetch after POSTs.
- Presences panel: Your Presence card (handle input save on blur/Enter, 6 aura swatches, 6 glyph chips, vibe toggle) + roll of others with sigil/aura-glow, signal count, "Resonates with the field" hint, Entangle button, Coherent dot.
- Guests: read everything; composer shows the ribbon "Enter the passage to speak into the field" → `useMirror.getState().openAuth("signin")` (the established store action, verified via ProfileModal/WalletGuard usage). Resonate/Entangle clicks as guest raise a dismissible ribbon.
- Polling: signals every 6s (in-flight ref guard, cleared on unmount), presence every 12s (every 2nd tick) + on sign-in change; optimistic resonate/entangle with server reconcile + revert+toast on failure; sonner toasts via dynamic import.
- Responsive: two columns on lg (aside w-80), single column on mobile with right slide-over (spring, Escape/backdrop/close button); ≥44px touch targets on buttons.

## Verification (definition of done)

1. ✅ `bunx prisma db push` — synced, client regenerated.
2. ✅ `bun run lint` — zero errors/warnings (ran twice, incl. after final edits).
3. ✅ `curl /api/gathering/signals` → `{"signals":[]}`.
4. ✅ `curl /api/gathering/presence` → `{"me":null,"presences":[]}` (+ full authenticated matrix tested: register→presence auto-create→PATCH→signal→resonate toggle→entangle toggle between two users; **all test rows and both test users were deleted afterwards** — field is pristine).
5. ✅ `GET /` → 200; dev.log tail shows no compile errors (only pre-existing `@/lib/resonance-engine` warning from `mirror-store.ts`, owned by another agent, in flight).
6. This report.

## Deviations / notes for the next agent

- **Dev server restart**: after `prisma db push`, the running dev server kept a stale in-memory PrismaClient (globalThis cache predating generate) → new `gathering*` delegates were undefined and GETs 500'd. I stopped the old process and relaunched the exact same pipeline (`bun run dev` → `next dev -p 3000 | tee dev.log`, detached). Server is up on :3000 and stable; dev.log was truncated by tee (fresh log). Anyone adding NEW models later should expect the same restart need.
- `coherent` additive field on presence rows (see above).
- Entanglement is one-directional (`I entangled them`), matching the spec's `entangled` semantics; the Entangle button on own signals is hidden and self-entangle is guarded client- and server-side.
- Touch targets: main buttons 44px; aura swatches are 40px to fit six across the w-80 panel (still finger-friendly, hover-scale).
- Test-user cleanup done via one-off `bun -e` prisma script (not committed anywhere).
