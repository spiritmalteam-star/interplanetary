# REFLECTME — STAGE 1 ARCHITECTURE AUDIT

**Directive:** Ultimate Master Evolution Prompt (Unified Mirror Intelligence Operating Environment)
**Law observed:** §1 Absolute Preservation — audit before change, no destructive action.
**Scope inspected:** full repository at `/home/z/my-project` (Next.js 16 App Router, TS 5, Tailwind 4, shadcn/ui, Prisma 6/SQLite, Stripe, z-ai-web-dev-sdk).

---

## 1. What Exists Today (Mapped)

### 1.1 Application identity
The platform is the **Mirror Entity Digital Chamber** ("Mirror Entity Laboratory", reflectme.space) — a mystical, astral, reflective single-page experience: a **Landing threshold** (editorial page with the portal docked live inside it) that opens into the **Branch Realm** (a full-screen living tree of rooms).

### 1.2 Frontend architecture
- **Entry:** `src/app/page.tsx` → `LandingGate` → `LandingPage` + docked live `AppShell` (the "one portal law": the same chamber instance expands from miniature to full screen; no second portal).
- **Shell:** `src/components/mirror/AppShell.tsx` — a `view` state machine (`MainView`: observatory | transmission | mirroros | register | akashic | invent | dreambook | particlex | evolvemed | artx | lightcodes | library | about) over full-screen "worlds"; shared passage modals (Profile, Auth, Account, BranchHub).
- **Rooms (preserved identities):** BranchCanopy (Mirror walk), AkashicView, DreamBookView (Book), ArtX, ParticleX, EvolveMed, InventView (Forge), LightCodesView, LibraryView, ArchiveRegister, CreationRoom (artifacts: akashic records, manifest rituals, forge strikes, books, poems, light codes, quantum reveals, remedies, paintings), ScopeNotes, ExpansionMirror.
- **State:** `src/lib/mirror-store.ts` (3,715 lines, zustand) — sessions per mode, askMirror flow, view navigation, preferences, i18n language.
- **i18n:** 8 languages (en, sq, it, el, de, fr, es, tr); keys are English source strings; dictionaries in `src/lib/i18n/dicts/*`; graceful fallback to English.
- **Design system:** `globals.css` cosmic tokens (dark deep-space + light ethereal), hairline/glass/glow utilities, mono-label typography, StarField/CosmicBackdrop atmospheres. **This is the visual identity to preserve.**

### 1.3 Backend architecture
- **Auth (custom, no NextAuth despite dep):** `src/lib/server/access.ts` — scrypt password hashes, HMAC-signed httpOnly session cookies, anonymous UUID cookie identity, Google OAuth (`/api/auth/google/*`), verification/reset tokens, login throttling, anon→user library merge. **Visitor resolution:** `resolveVisitor()` (session user or anon).
- **Billing:** dual system — (a) workspace tenancy (`Workspace`, `CreditAccount`, `CreditTransaction`, `Subscription`, `Payment`, `ApiKey`) behind `CREDITS_ENFORCED`; (b) **per-user frontier wallet** (`UserWallet`, `CreditLedger` with signed amounts, Stripe webhooks idempotent via `ProcessedEvent`). Plans: FREE/SEEKER/OBSERVATORY_PRO. Actions metered: CHAT, AKASHIC, ART_X, LIGHT_CODES, DREAM_BOOK.
- **AI provider:** `src/lib/zai-client.ts` (810 lines) — the ONLY intelligence integration; server-side only; chat/transmission/image/TTS/ASR flows; usage recorded via `recordUsage()` (`UsageEvent` with tokens, latency, cost, success).
- **Rate limiting:** `src/lib/server/rate-limit.ts`. **Mail:** `src/lib/server/mail.ts`. **PDF:** book-pdf, transmission-pdf, pdf-lib pipelines.
- **API routes (~40):** auth, wallet, billing/checkout+portal+webhook, transmission, mirror-entity, akashic (chat + generate), artx, dream-book, library, expansion, manifest, forge, particlex (+pdf), evolve-med (+pdf), light-codes, poem, communion, visualize, visual/[file], asr, tts, suggestions, account (summary/settings/password/keys), tool-analysis, parse-doc, `/api/v1/chat`, `/api/v1/channel`.

### 1.4 Data layer
- **Prisma 6 + SQLite** (file DB in `/db`), additive-migration discipline already established; `schema.postgres.prisma` kept for future lift.
- **Models today (12):** User, LibraryEntry (sector-keyed creation store — the de-facto creation record), Workspace(+Member), VerificationToken, CreditAccount/Transaction, UsageEvent, Subscription, Payment, ApiKey, ProcessedEvent, UserWallet, CreditLedger, ExpansionProfile/Event.
- **LibraryEntry is the existing "universal creation" germ:** `{ userId, sector, title, excerpt, content(JSON: query/reply/meta), createdAt }` — sectors: observatory | manifest | dreambook | quantum | evolvemed.

### 1.5 Ops
- Vercel deployment (git push → deploy); sandbox dev server on :3000; gateway (Caddy) routes multi-port via `XTransformPort`; mini-services folder convention (socket.io demo in `examples/`).

---

## 2. Reusable Infrastructure (what the evolution builds ON)

| Asset | Reuse for |
|---|---|
| `resolveVisitor` + anon identity | every new Gathering/M.E. endpoint's auth layer |
| `LibraryEntry` | **source-of-truth** for Universal Creation Protocol: creations reference entries, never copy them |
| `recordUsage` + UsageEvent | M.E. provider accounting & cost monitoring |
| rate-limit middleware pattern | new public discovery endpoints |
| globals.css token system | Gathering/adaptive/spatial UI (no new visual language) |
| view state machine + full-screen world pattern | Gathering & Spatial rooms integrate exactly like existing rooms |
| i18n fallback design | new strings safe in all 8 languages |
| `ProcessedEvent` idempotency pattern | event bus + publish idempotency |
| Stripe wallet plumbing | untouched; new features consume no new money flows |

## 3. Architectural Weaknesses & Gaps (honest assessment)

1. **No social/collective layer at all** — no follows, connections, feeds, communities, messaging, notifications, or public profiles. `User.settings` JSON is private-only; nothing exposes a public profile surface.
2. **No publication path** — `LibraryEntry` is private per user; no visibility model, no share/audit trail, no dedupe/idempotency on publish.
3. **Intelligence is coupled to one provider client** (`zai-client.ts`) — no provider abstraction, no capability registry, no orchestration, no task persistence; each route hand-wires its own flow.
4. **No event architecture** — subsystems are invoked directly; no envelope, no correlation IDs, no durable events.
5. **Memory is implicit** — settings JSON + ExpansionProfile only; no domain-separated memory with retention/ownership boundaries.
6. **No admin environment** — no owner-only surface for health/costs/capabilities/feature flags; ops knowledge lives in env + logs.
7. **No realtime layer** — everything request/response; notifications will need a delivery design.
8. **SQLite** — fine for current scale; Postgres schema already drafted (`schema.postgres.prisma`) for the future lift. New models must stay portable (no SQLite-only types).
9. **Monolithic store** (3,715 lines) — new domains must NOT inflate it further; new state goes into dedicated stores/modules.
10. **No tests** — the directive's acceptance criteria are verified via lint + typecheck + agent-browser E2E (the established house method).

## 4. Dependencies & Risks

- **Dev server OOM law:** heavy parallel builds crash the sandbox; lint/verification runs after killing dev server (established house rule from worklog).
- **Single visible route:** the sandbox previews `/` only — all new surfaces must be reachable inside the existing view machine (no new routes).
- **Do-not-break list:** LandingGate lens/docking, BranchCanopy doors, WalletGuard, askMirror flow, Stripe webhooks, auth cookies, i18n fallback, anon library merge.
- **i18n tax:** every new UI string ×8 dictionaries — new keys must be hand-translated, not machine-dumped.

## 5. Evolution Strategy (approved plan for this directive)

**Additive-only, backwards-compatible, incremental:**

- **Data (Stage 4/5/6/7/8 foundations):** extend `schema.prisma` additively: Creation + Publication (idempotent publish, source references), PublicProfile, Follow, Connection, Circle(+Member), Comment, Reaction, Project(+Member/Update), KnowledgeItem, PlatformEvent (envelope), Notification, MeTask (orchestrated execution), MemoryItem (domain-separated), DiscoveryPref, FeatureConfig. **No column drops, no type changes, no resets.**
- **M.E. Runtime (Stage 3):** new server-only `src/lib/me/*` — provider abstraction (wrapping the existing client, never replacing it), capability registry (existing rooms registered with contracts), tool registry (validated, authorized, audited, idempotent), orchestration core (persisted tasks, idempotency keys), five memory domains, agent manifests, event bus with standard envelope + dead-letter bookkeeping.
- **Gathering (Stage 6):** new `/api/gathering/*` gateway surface + a new full-screen realm view with the six destinations (For You, People, Creations, Circles, Projects, Knowledge); **Create stays out of Gathering**; publish actions live inside the original rooms.
- **Contextual Publishing (§9–11):** small unobtrusive "Publish to Gathering" action in CreationRoom/LibraryView/TransmissionView → panel auto-fills source, requires explicit publish, visibility options, idempotent (unique sourceRef), publication history recorded, private sources never auto-exposed.
- **Adaptive & Spatial (Stage 2/9):** device-capability profile hook + device-independent spatial component descriptors + a Spatial Mirror prototype (CSS-3D immersive view over the real chat; WebXR detection with graceful fallback — no hardware required).
- **Administration (Stage 10):** owner-only `/api/admin/*` + quiet admin surface (health, usage, costs, capability registry, feature flags).
- **Events/Notifications (Stage 8):** DB-backed `PlatformEvent` + in-app notifications (polling delivery; WebSocket upgrade path documented, mini-service convention reserved).

**Preservation guarantees:** no route replaced, no room renamed, no store rewrite, no DB reset, no auth/billing change; all new behavior enters through new files, additive schema, and one new `view` branch.
