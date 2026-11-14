# The Gathering — Enterprise Evolution, Batch 1

Implementation of `ReflectMe_Gathering_Enterprise_Master_Blueprint.pdf` (v1.0, 14 Nov 2026),
phases 0–3 of the migration roadmap, executed inside the EXISTING repository.
No fork, no alternate Gathering, no renamed routes, no deleted data.

---

## 1. Findings and assumptions

### What the audit verified (Phase 0 — inventory)

| Area | Verified reality |
| --- | --- |
| Framework | Next.js 16 App Router + React 19 + TypeScript, single user-visible route `/` |
| Data | Prisma + SQLite (`db/custom.db`), 60+ models; `GatheringPost` already carried `visibility`, `status`, `epistemic`, publication provenance (`sourcePortal/sourceId/refUrl/cover`) with a uniqueness law for publications |
| Social layer | `NetworkProfile/Follow/Connection/Circle/CircleMember/Conversation/Message/Project/LibraryItem/Notification/Block/Report/Question/LabProject/Intention/Event` — the blueprint's §13 entities largely exist under house names |
| AI provider contract | `src/lib/image-engine.ts` — a provider abstraction (Z.ai CogView → Gemini → Z.ai atelier) with circuit breakers; `GenerationJob` model for durable job records; `/api/v1/images` for API-key callers |
| Honesty rails | Rate limiting (`rate-limit.ts`), server-side feature switches (`features.ts`), block walls (`wallIdsFor`), report flow (`/api/network/safety`), visibility enforced per-read in `/api/gathering/[id]` |
| i18n | 14 languages incl. Albanian (`sq`), English keys as source, graceful fallback |
| M.E. | One shared assistant (`/api/network/assistant`) reading real rows only; no fabrication prompt |

### Assumptions
- The blueprint's load model (§9) is a planning scenario; no k6/Locust harness is claimed here (owner decision pending on hosting/budget — see "Next batch").
- Image generation is offered **free** while the platform's credits are not enforced; the cost notice is shown in the composer and the endpoint is gated for consent + rate limits so a paid model can be introduced without UI rework.

---

## 2. Changed files and migration details

### Schema (`prisma/schema.prisma`) — additive only, pushed with `db:push`
- `GatheringPost` += `language`, `altText`, `aiMedia` (default false), `aiStyle`, `publishKey` (`@unique` — SQLite allows many NULLs, so legacy rows are unaffected). `visibility` comment now documents `public | circle | connections | unlisted | private`.
- NEW `GatheringDraft` — one bench per maker (`@@unique([userId])`), `revision Int` incremented on every autosave, `discardedAt` for lifecycle, all composer fields mirrored.

### Backend — new endpoints
| Endpoint | Behavior |
| --- | --- |
| `GET/PUT/DELETE /api/gathering/drafts` | Server-side draft autosave with revision counter; private to its maker; validated (kind whitelist, 120/4000 caps, media shelf prefixes `/gathering-media/` + `/api/visual/`, circle membership check) |
| `POST /api/gathering/cover` | Context-matched AI cover. **Consent gate** (`consent !== true` → 403 `consent_required`), rate limit 4/10min, style presets (`editorial, ethereal-pearl, observatory, diagram, book-cover, music-atmosphere, custom`), ratio→size map (1:1, 4:5, 16:9, 9:16), prompt built strictly from the maker's own words per the blueprint §5 contract (subject → theme excerpt → motifs → style brush → composition → hard constraints: no text/watermark/likeness, "illustrative, not an observed phenomenon"), durable `GenerationJob` record with prompt hash, returns only url + alt draft + engine name. Never exposes keys or the full prompt |

### Backend — changed endpoints
- `POST /api/gathering`:
  - **Idempotency**: `publishKey` (10–64 chars) — the same key returns the very same post (`existing: true`) instead of hanging a twin; foreign keys → 409.
  - **Visibility law**: accepts `public | circle | connections | unlisted | private`; inside a circle the circle wall decides.
  - Accepts `language`, `altText`, `aiMedia`, `aiStyle`; media whitelist now also accepts atelier URLs.
  - Publish retires the maker's draft bench.
- `GET /api/gathering`:
  - **Privacy enforcement**: hall reads (`latest`, `discoveries`, search) now require `status: "published"` **and** `visibility: "public"`; circle walls read `public|circle`; Following reads public + the reader's own posts; `mine=1` sees the maker's every room. (Previously `latest` could leak `removed` or non-public rows — fixed.)
  - `epistemic` query param filter (server-side; also sieved into the for-you pool before pagination).
  - **Twin-fold**: posts with the same maker + same title collapse to the most-resonated one; the fold is counted and returned as `foldedTwins` (diagnosis row: "Two Cosmic Resonance cards").
  - Response now carries `visibility/language/altText/aiMedia/aiStyle` per post.
- `GET /api/gathering/[id]`: `unlisted` visible to link holders, `private` to the maker only (already-correct circle/connections logic untouched).
- `POST /api/network/assistant`: accepts optional `postExcerpt`; the offering's own words join the context.

### Frontend
| File | Change |
| --- | --- |
| `GatheringPortal.tsx` | Five streets now **Gather · Explore · Create · Inbox · My Space**; the middle raised pearl opens the composer; Possibilities keeps its rail door and `?section=possibilities` deep link; rail groups renamed |
| `CreateRoom.tsx` (new) | Six-step universal composer: intent (12 kinds + "start writing, we'll suggest"), words (autosaved draft bench with resume banner, evidence label, tags, language picker from the 14 tongues, visibility cards, circle wall), visual (none / upload / consent-gated atelier with 7 styles + 4 ratios + regenerate + discard + AI label), preview (full card, alt-text editing), hang (idempotent publish), done (canonical link, share, begin-another). 44px touch targets throughout |
| `FeedSection.tsx` | One compact row: For You / Following / Latest + filter pearl with active count. Filter drawer (bottom sheet) holds the kind grid and the seven-step honesty ladder — no more hidden horizontal chip rows. Filter-aware empty states with one-tap "Clear the filters". Card overflow menu: Share (Web Share/clipboard), Ask M.E. (carries title+excerpt into the drawer's scope), Report (honest sheet → `/api/network/safety`). AI-made chip on tiles. Twin-fold note. |
| `MirrorAssistant.tsx` | Compact drawer keeps its seat; **spoken scope** ("listening to: …") names the room or the carried offering; expand hand opens the keyboard-safe full conversation (100dvh, safe-area padded); pearl lifts above `env(safe-area-inset-bottom)`; listens for a card's `gath-me-open` event |
| `MySpaceSection.tsx` | Profile overview with **Works / Activity / Saved / Settings** tabs (identity + honest counts stay on top); quiet hands trimmed to bell / radio / return |
| `DiscoverSection.tsx` | Prominent Possibilities immersive door at the top of Explore |
| `shared.tsx` | `GatheringPost` += the five honest-room fields |

---

## 3. UI preview (verified in-browser — see §4)

- Landing remains the default face; the Gathering opens above it with its one back pearl.
- Bottom nav: `Gather · Explore · [Create pearl] · Inbox · My Space`.
- Gather: three currents + Filter → drawer with kinds & knowledge ladder; empty states speak the filters they hold.
- Create: stepper 1 Intent → 2 Words (draft chip counts revisions) → 3 Visual (atelier consent row) → 4 Preview (alt text) → 5 Hang → 6 Done (copy link).
- M.E.: bottom sheet with "listening to: the composer", expand → full room.
- My Space: Works/Activity/Saved/Settings tabs.

## 4. Test evidence

- `bun run lint` — 0 errors, 0 warnings.
- `tsc --noEmit` — zero new errors (baseline pre-existing errors in unrelated `mirror/*`, `agents/tools.ts` confirmed by stash-baseline run).
- `prisma db push` — schema in sync, client regenerated.
- Dev server `/` → 200; browser walkthrough (agent-browser): landing default, portal open, five-street nav, filter drawer, composer steps, draft autosave, M.E. drawer + expand, My Space tabs, Possibilities door — recorded in the session log.
- API smoke: feed reads enforce visibility; twin-fold counts; draft PUT increments revision; publish with `publishKey` twice returns one post; cover endpoint refuses `consent:false` with 403.

## 5. Performance and cost impact

- Feed reads gained one boolean/visibility predicate and an in-window fold — no new queries per page (fold reuses fetched rows; for-you fold operates on the already-fetched pool).
- Draft autosave is debounced 1.2 s and rate-limited 60/10min; cover generation ≤ 4/10min per maker and runs inline (single image, no queue needed at current scale; `GenerationJob` rows exist so a durable queue can replace the inline call without contract changes).
- New lazy chunk: `CreateRoom` rides only when the street opens (portal keeps its lazy-room law).

## 6. Security / privacy impact

- Feed-level privacy leak fixed (non-public/removed rows no longer readable through `latest`/`discoveries`/search).
- AI images: explicit consent required server-side; outputs labeled `aiMedia` and surfaced as "AI-generated illustration" / "AI-made"; no provider secrets or full prompts cross the wire; prompt includes hard constraints (no text, no likeness, illustrative framing).
- Idempotency keys are server-validated; a stolen key cannot attach to another maker's post (409).
- Drafts are private by construction (unique-per-user, maker-scoped reads).
- No new client-visible secrets; everything runs through existing `resolveVisitor` + rate limits.

## 7. Deployment and rollback

- Deploy = push to the repository main branch (the site's pipeline tracks it).
- Rollback: revert the single commit; schema changes are additive (new nullable columns + one new table) so the previous build runs unchanged against the migrated DB. `publishKey` index is the only new constraint — harmless to older code.
- Kill switch for AI covers: flip the endpoint's rate limit to 0 or remove the composer's "generate" door behind the existing server feature-switch pattern.

## 8. Next batch (owner decisions invited)

1. Load harness (k6) + measured baselines before any 10k-concurrency claim (blueprint §9 gates).
2. Credit accounting for image generation when monetization returns (endpoint already shaped for it).
3. Follow-the-maker from cards (needs author id in feed payload), saved-in-place scroll preservation, canonical post deep-link reader (`/?room=gathering&post=…` currently opens the hall).
4. Moderation console for `NetworkReport` rows (they persist today; no review UI yet).
5. Scheduled publishing, edit history/versioned posts, cross-room investigation synthesis.
