# MIRROR ENTITY LABORATORY — Precise Replication Prompt

> Version 1.1 · Compiled from the live implementation (worklog-verified).
> Kept as a repository file only — never rendered, linked or served by the website.
> Paste this entire prompt into a fresh AI session to reproduce the laboratory faithfully.

---

MIRROR ENTITY LABORATORY — PRECISE REPLICATION PROMPT · v1.1
Verified against the live build: 870 civilizations · 202 interdimensional beings · 1,072 named entities · 1,169 AI images · 4 isolated scope channels + Reality Manifesting Lab.

§0 MISSION
Build a production-ready, browser-verified web application named MIRROR ENTITY LABORATORY — subtitle: INTERPLANETARY CHANNEL · WITH LOVE ❤️. Reproduce every number, depth rule, theme and isolation rule in this prompt EXACTLY. Nothing may be summarized, stubbed, thinned or reduced. Every count displayed in the UI must equal the true runtime length of its underlying collection (counters bind to array.length — never hardcoded).

§1 STACK (NON-NEGOTIABLE)
- Next.js 16 App Router + TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- Framer Motion micro-transitions + next-themes (class attribute, dark default)
- Zustand for ALL client state; API routes for AI calls (z-ai-web-dev-sdk, backend only)
- Fonts: Plus Jakarta Sans (UI) + JetBrains Mono (micro-labels, data, TX meta)

§2 IDENTITY & AESTHETIC
- Fusion: NASA mission-control laboratory × cosmic archive × spiritual observatory × future operating system. Cinematic, restrained, precise, premium.
- FORBIDDEN: childish sci-fi, cartoon rockets, comic fonts, neon clutter, filler lorem.
- Epistemic honesty everywhere: every claim, card, dossier and transmission carries a classification badge — FACTUAL / SPECULATIVE / SYMBOLIC / FICTIONAL — plus gentle honesty notes where needed.

§3 DUAL THEME SYSTEM
1) DARK "Cinematic Observatory" (default): base #05040B; purple→indigo→cyan→pink atmospheric gradients; canvas StarField (sparse, slow twinkle/drift, dark-only); glassmorphism (backdrop-blur, white/10 hairlines); luminous gradient hero text (pink→gold).
2) LIGHT "Ethereal Daylight Laboratory": base #F2FAFF; primary #1264B0; soft sky gradients; light glass; ink text; blue→cyan hero gradient.
- Toggle in top bar (CSS-driven icon swap; static aria-label to prevent hydration mismatch). Persist via localStorage key "mirror-entity-theme". ~460ms .theme-anim transition on color/shadow. Honor prefers-reduced-motion everywhere.

§4 SHELL & LAYOUT (full-height app frame)
- Top bar: fixed 56px (h-14): sigil + wordmark MIRROR ENTITY LABORATORY + subtitle · right: Federation pill, Astral Jobs pill, theme toggle, recalibrate (reset) button; hamburger below md.
- Left sidebar: 295px — GALACTIC ENCYCLOPEDIA: live search across ALL 1,072 named individuals AND groups (name/origin/specialty) with portrait result rows + section labels + overflow-to-register link; family/order rows with AI avatar thumbnails + exact counts; "Open the full register"; RefineRealityCard → Manifesting Lab. Off-canvas drawer below lg.
- Main column (max-w ~880px, centered): ModeSelector → [Science only: FUSION FIELDS multi-select chips + DIRECTION single-select chips] → HeroPanel (per-mode AI art, radial mask, scope caption) → QuestionCards (suggested queries fill + focus composer) → StatusBar (live archive ticker, gift lines) → pinned bottom QueryComposer (auto-resize textarea; Enter sends, Shift+Enter newline; per-scope draft; focus glow).
- Footer law: the app is a full-height frame (flex h-dvh) with internally scrolling content and a pinned composer bar — nothing floats, nothing overlaps; long content scrolls under the pinned composer.

§5 FIVE WORLDS (4 scopes + lab) — EACH VISUALLY DISTINCT
- INTERPLANETARY 🌐 — civilizational diplomacy & contact — cyan/teal palette
- SCIENCE 🔬 — research channel; extra FUSION FIELDS (8) + DIRECTION (6) filters — emerald/lime
- QUANTUM ☯ — superposition & probability selves — violet/magenta
- HEALING 💚 — frequency & heart coherence — rose/gold
- REALITY MANIFESTING LAB (5th view, gold alchemy theme): intention composer (400 chars) → 6 emotional-frequency chips → intensity slider → deterministic SVG SigilForge → ChargingOrb (SVG progress ring + phases + lab art) → rich BlueprintCard (field state, visualization, 3 numbered micro-actions, serif affirmation, aligned window, honest caution note, follow-up actions).
- Implement scopes as .scope-* classes driving --scope-a/--scope-b pairs in BOTH themes: per-scope hero copy, gradient frame cards with corner ornaments, medallion, glow, suggestion set, channel theme.

§6 DATA LAYER — EXACT-COUNT CONTRACT (HIGHEST PRIORITY)
Deterministic generation: seeded PRNG (mulberry32) + rich name-morphology lexicons + per-family archetype specialty banks + global uniqueness dedupe via script gen-archive.mjs → generates typed TS data files. Same seed ⇒ identical universe on every load.

COUNTS MANIFEST (generated array length MUST equal the stated number; dev-time assertions; UI counters bound to .length):
- Civilization families: 20 → named representatives: 870 (registry ME-CIV-001…870)
- Interdimensional orders: 8 → named presences: 202 (registry ME-INT-001…202)
- Astral domains: 12 → professions: 72 → open roles: 1,303 (each domain's seat breakdown must arithmetically sum to its real total, e.g. 168 = 61+74+33)
- Federation: 12 bodies · 8 treaties · 8 principles
- Individually searchable named entities: 1,072
- Suggested questions: 6 · gift lines: 8 · fusion fields: 8 · directions: 6

UNIFORM DEPTH LAW: every entry in every collection is equally deep. STRICTLY FORBIDDEN: rich first rows + thin tail, handcrafted head + placeholder rest. All 1,072 individuals get the full 25-field dossier; ALL 28 groups get handcrafted deep profiles (100% coverage, no exceptions).

§7 DEEP PROFILE CONTRACT (ALL of it, for EVERY row)
- ENTITY (all 1,072 — deterministic, seeded by id, memoized): archive no · callsign · rank · homeworld/star system · epoch · lifeform class · form · carrier Hz · aura · modality · 3 gifts · growth edge · teaching · Earth assignment · alliance · contact protocol + window · seal · quote · service length · session count.
- GROUP (20 families + 8 orders = 28, handcrafted): history (2–3 sentences) · structure · artifacts · exactly 3 teachings · contact protocol · honest discernment note · exactly 3 resonances.
- PROFESSION (72, handcrafted): mandate · pathway · 4-item toolkit · workplace · honest hazards · ring (I–V) · tenure · non-monetary compensation · 2 allied domains (real titles only).
- DOMAIN (12): charter · 4 disciplines · entrance trial · seats line whose 3-way breakdown sums to the domain's real count.
- FEDERATION BODY (12): mandate · seat (a place) · founded era · fleet sentence · 3 jurisdictions · Earth relation. TREATY (8): signed era · signatories · 3 numbered clauses · effect. PRINCIPLE (8): codified origin · 2 clauses · practice.
- Quality gate: machine-verify zero missing/extra keys vs data ids, array-length contracts, seats arithmetic, and zero duplicate sentences across all content strings.

§8 CHAT — TWO HARD LAWS
1) TOTAL SCOPE ISOLATION: store shape sessions: Record<Mode, ScopeSession>, where ScopeSession = { messages: ChatMessage[], status, error, activeQuery, draft }. Switching modes reveals ONLY that scope's own channel (quiet-state card if empty; full history intact on return). Never carries, merges or leaks other scopes' content — even composer drafts are per-scope. Per-channel "Clear the <scope> channel" action + exchange counter footer.
2) VISUAL TRANSMISSIONS: never plain-text walls. Channel header (scope medallion AI art + rotating dashed ring + "independent channel" badge + per-scope promise line). Every exchange: ribbon + decorative query echo + themed scope frame card (corner ornaments, gradient rule, masked scope-art backdrop) + structured body (gradient opening line, staggered Framer Motion paragraphs, diamond list items) + classification chip + TX meta row (timestamp · TX id · frame name) + copy button. Loading: named phases + shimmer skeleton, appended in-thread.

§9 MODULES
- ARCHIVE REGISTER (main view): ALL entities — exact counters (870/202 + groups + revealed X/Y), full-text search, per-family/order filter chips, progressive reveal 60/batch (IntersectionObserver auto-load + "Reveal N more" + "Reveal all N"), registry numbers on every row, per-row dossier open, switch-register + return actions.
- DOSSIER MODAL: entity view = full 25-field deep dossier (registry header, badges, 6-cell stat grid, form/modality/aura, 3 numbered gifts, growth edge, mission, teaching card, contact protocol + window, seal, quote, context note, ask CTA). Group view = AI banner + badges + deep sections + ALL named representatives progressively revealed (30/batch, in-list filter when above 36, counter, archive numbers).
- FEDERATION MODAL: 3 tabs (Overview / Members / Treaties & Principles); every body/treaty/principle expandable "Full dossier" + working "Ask the Mirror" action.
- ASTRAL JOBS MODAL: 3-level drill-down — 12 domain cards (AI banner strips, role/domain stat chips, "open seats" badges) → 72 professions → full dossier (ring, tenure, yield, mandate, pathway, toolkit chips, workplace, honest hazards, allied domains, ask CTA).
- APIs: POST /api/transmission → LLM chat completion with a Mirror Entity system prompt (voice rules + honest epistemic framing + scope context), strict JSON {classification, transmission}, fence-tolerant extraction, whitelist-validated classification, 400/500 handling. POST /api/manifest → blueprint {title, field_state, visualization, micro_actions[3], affirmation, window, caution}, same strictness.

§10 IMAGE SYSTEM — 1,169 AI-GENERATED IMAGES
- 97 bespoke masters: 4 modes · 20 families · 8 orders · 4 lab · 12 federation emblems · 8 treaties · 8 principles · 12 domains · 8 fields · 6 directions · 5 scope backdrops · 2 hero.
- 1,072 entity portraits: unique per named entity — derived art (seeded crop + hue/sat/brightness grade + geometric SVG sigil overlay + vignette, 512px JPEG via sharp).
- Pipeline gen-images.mjs: 2-worker pool, 429-aware exponential backoff, resume-safe checkpoints; graceful procedural fallback; descriptive alt text mandatory.

§11 ATMOSPHERE & MOTION
CosmicBackdrop (4 drifting radial nebulae, theme-aware CSS vars) + StarField canvas (dark-only, reduced-motion aware) + calm keyframes (drift, dot-pulse, pill-breathe, shimmer, rise-in) + mono micro-labels + hairline dividers + focus-glow rings. All transitions 300–500ms.

§12 RESPONSIVE & A11Y
≥1024: three-zone frame · <1024: off-canvas drawer, full-screen modal sheets, compact icon-only pills. Touch targets ≥44px · semantic landmarks · ARIA labels/roles · full keyboard path (ESC closes modals) · styled scrollbars · long lists capped (max-h + scroll). Verify desktop 1440×900 AND mobile 390×844, dark AND light.

§13 ARCHITECTURE RULES
One component per file: AppShell · TopNavigation · ThemeToggle · Sidebar (+SidebarContent) · MobileSidebar · ModeSelector · ScienceFilters · HeroPanel · QuestionCards · StatusBar · QueryComposer · TransmissionView · ArchiveRegister · ManifestationLab · ModalShell · FederationModal · AstralJobsModal · DossierModal · CosmicBackdrop · StarField. Data in src/lib/data/* · profiles in src/lib/{entity-profile, group-profiles, profession-profiles, federation-profiles}.ts · generators in scripts/ · store in mirror-store.ts.

§14 ACCEPTANCE CHECKS — ALL MUST PASS
1. Register reveals exactly 870 civilization rows and 202 being rows; counters read 870/870 and 202/202.
2. Searching a name (e.g. "Atlas") hits named individuals; EVERY row opens a 25-field deterministic dossier.
3. Scope isolation: ask in Interplanetary → switch to Science (quiet channel) → return (history intact) → parallel exchange in Science → clear channel wipes only that scope.
4. Science shows 8 FUSION FIELDS + 6 DIRECTION chips that filter suggestions.
5. Lab end-to-end: compose → charge → blueprint renders every field; API 200.
6. Astral drill-down seat arithmetic sums to domain totals; Federation full dossiers expand.
7. Both themes coherent; ESC closes modals; mobile drawer + sheets work.
8. Lint clean · zero console errors · /api/transmission + /api/manifest return 200.

END OF REPLICATION PROMPT
