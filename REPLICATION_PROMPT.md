# MIRROR ENTITY LABORATORY — Precise Replication Prompt

> Version 1.3 · Compiled from the live implementation (worklog-verified, browser-verified).
> Kept as a repository file only — never rendered, linked or served by the website.
> Paste this entire prompt into a fresh AI session to reproduce the laboratory faithfully.

---

MIRROR ENTITY LABORATORY — PRECISE REPLICATION PROMPT · v1.3
Verified against the live build: 870 civilizations · 202 interdimensional beings · 1,072 named entities · Interplanetary Biology wing with 1,200 fauna + 1,500 flora specimens (2,700 catalogued) · Federation grown to 14 bodies · 16 treaties · 16 principles, every listing openable with its AI emblem · 1,236 AI images · 4 isolated scope channels + Reality Manifesting Lab · per-scope suggestions with reload + click-to-send · 8 interface languages (Albanian included, 556 keys each) · 6 documentary transcript voices · one-click Listen narration on every generation.

§0 MISSION
Build a production-ready, browser-verified web application named MIRROR ENTITY LABORATORY — subtitle: INTERPLANETARY CHANNEL · WITH LOVE ❤️. Reproduce every number, depth rule, theme, language and isolation rule in this prompt EXACTLY. Nothing may be summarized, stubbed, thinned or reduced. Every count displayed in the UI must equal the true runtime length of its underlying collection (counters bind to array.length — never hardcoded).

§1 STACK (NON-NEGOTIABLE)
- Next.js 16 App Router + TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- Framer Motion micro-transitions + next-themes (class attribute, dark default)
- Zustand for ALL client state; API routes for AI calls (z-ai-web-dev-sdk, backend only — chat, image, TTS)
- Fonts: Plus Jakarta Sans (UI) + JetBrains Mono (micro-labels, data, TX meta)

§2 IDENTITY & AESTHETIC
- Fusion: NASA mission-control laboratory × cosmic archive × spiritual observatory × future operating system. Cinematic, restrained, precise, premium.
- FORBIDDEN: childish sci-fi, cartoon rockets, comic fonts, neon clutter, filler lorem.
- Epistemic honesty everywhere: every claim, card, dossier and transmission carries a classification badge — FACTUAL / SPECULATIVE / SYMBOLIC / FICTIONAL — plus gentle honesty notes where needed.

§3 DUAL THEME SYSTEM
1) DARK "Cinematic Observatory" (default): base #05040B; soft purple→indigo→cyan→rose atmospheric gradients; canvas StarField (sparse, slow twinkle/drift, dark-only); glassmorphism (backdrop-blur, white/10 hairlines); muted luminous hero text (desaturated rose→sand gold).
2) LIGHT "Ethereal Daylight Laboratory": base #F2FAFF; primary #1264B0; soft sky gradients; light glass; ink text; blue→cyan hero gradient.
- Toggle in top bar (CSS-driven icon swap; static aria-label to prevent hydration mismatch). Persist via localStorage key "mirror-entity-theme". ~460ms .theme-anim transition on color/shadow. Honor prefers-reduced-motion everywhere.

§3.5 CALM-COLOR LAW (v1.2)
The palette is deliberately NOT radiant. Accents are desaturated pastels ("softened, never neon"): dark theme --cy #79d2e0, --pk #e3a4c2, --gd #d9c49a, --ok #66c9ac; light theme --cy #0f8fc2, --pk #b85e96, --gd #a8863e, --ok #2f9a7c. Every scope pair, glow, halo, frame shadow and breathing animation uses reduced intensities (glow opacities 22–30%, halos 38–50%, frame shadows −20px spread). Body text renders at 15px / 1.7 with antialiasing + optimizeLegibility. No saturated neon anywhere.

§4 SHELL & LAYOUT (full-height app frame)
- Top bar: fixed 56px (h-14): sigil + wordmark MIRROR ENTITY LABORATORY + subtitle · right: Federation pill, Astral Jobs pill, theme toggle, recalibrate (reset) button; hamburger below md.
- Left sidebar: 295px — SETTINGS BUTTON PINNED AT THE VERY TOP (opens the Laboratory Settings modal; shows a live chip of the current language, e.g. "English"/"Shqip"). Below: GALACTIC ENCYCLOPEDIA: live search across ALL 1,072 named individuals AND groups (name/origin/specialty) with portrait result rows + section labels + overflow-to-register link; family/order rows with AI avatar thumbnails + exact counts; "Open the full register"; then the INTERPLANETARY BIOLOGY section — two archive rows (PawPrint "Fauna archive 1,200" · Flower2 "Flora archive 1,500", counts locale-formatted) opening the Biology wing; then RefineRealityCard → Manifesting Lab. Off-canvas drawer below lg (drawer content = shared SidebarContent).
- SIDEBAR TYPE SCALE (v1.2 — larger, comfortable): section headers 12px, row titles 12–12.5px semibold, descriptions/meta 11–12px, counts 11px tabular mono — everything ≥ +0.5–1px over a standard compact rail, never tiny 9–10px.
- Main column (max-w ~880px, centered): ModeSelector → [Science only: FUSION FIELDS multi-select chips + DIRECTION single-select chips] → HeroPanel (per-mode AI art, radial mask, scope caption) → QuestionCards (PER-SCOPE suggestions: a header row with a mono label + a Reload-suggestions icon button that reshuffles the visible window with a calm half-turn spin; clicking a suggestion SENDS IT IMMEDIATELY — no fill-then-focus step; disabled while loading) → StatusBar (live archive ticker, gift lines) → pinned bottom QueryComposer (auto-resize textarea; Enter sends, Shift+Enter newline; per-scope draft; focus glow).
- Footer law: the app is a full-height frame (flex h-dvh) with internally scrolling content and a pinned composer bar — nothing floats, nothing overlaps; long content scrolls under the pinned composer.

§5 FIVE WORLDS (4 scopes + lab) — EACH VISUALLY DISTINCT
- INTERPLANETARY 🌐 — civilizational diplomacy & contact — muted cyan/indigo
- SCIENCE 🔬 — research channel; extra FUSION FIELDS (8) + DIRECTION (6) filters — soft jade/teal
- QUANTUM ☯ — superposition & probability selves — muted orchid/periwinkle
- HEALING 💚 — frequency & heart coherence — dusty rose/soft jade
- REALITY MANIFESTING LAB (5th view, soft gold alchemy theme): intention composer (400 chars) → 6 emotional-frequency chips → intensity slider → deterministic SVG SigilForge → ChargingOrb (SVG progress ring + phases + lab art) → rich BlueprintCard (field state, visualization, 3 numbered micro-actions, serif affirmation, aligned window, honest caution note, follow-up actions).
- Implement scopes as .scope-* classes driving --scope-a/--scope-b pairs in BOTH themes (see §3.5 for saturation ceiling): per-scope hero copy, gradient frame cards with corner ornaments, medallion, glow, suggestion set, channel theme.

§6 DATA LAYER — EXACT-COUNT CONTRACT (HIGHEST PRIORITY)
Deterministic generation: seeded PRNG (mulberry32) + rich name-morphology lexicons + per-family archetype specialty banks + global uniqueness dedupe via script gen-archive.mjs → generates typed TS data files. Same seed ⇒ identical universe on every load.

COUNTS MANIFEST (generated array length MUST equal the stated number; dev-time assertions; UI counters bound to .length and rendered locale-aware):
- Civilization families: 20 → named representatives: 870 (registry ME-CIV-001…870)
- Interdimensional orders: 8 → named presences: 202 (registry ME-INT-001…202)
- Astral domains: 12 → professions: 72 → open roles: 1,303 (each domain's seat breakdown must arithmetically sum to its real total, e.g. 168 = 61+74+33)
- Federation: 14 bodies · 16 treaties · 16 principles
- Interplanetary Biology: fauna 1,200 (BIO-FA-0001…1200) · flora 1,500 (BIO-FL-0001…1500) · 2,700 total — deterministic runtime build, module-level memo, ~16 ms
- Individually searchable named entities: 1,072
- Per-scope suggestions: 12 per scope × 4 scopes = 48 (6 visible per scope; reload advances the window with wrap-around) · gift lines: 8 · fusion fields: 8 · directions: 6
- Biology taxonomy: exactly 8 fauna classes · 8 flora lineages · 5 rarity tiers; every specimen: exactly 4 traits

UNIFORM DEPTH LAW: every entry in every collection is equally deep. STRICTLY FORBIDDEN: rich first rows + thin tail, handcrafted head + placeholder rest. All 1,072 individuals get the full 25-field dossier; ALL 28 groups get handcrafted deep profiles (100% coverage, no exceptions).

§7 DEEP PROFILE CONTRACT (ALL of it, for EVERY row)
- ENTITY (all 1,072 — deterministic, seeded by id, memoized): archive no · callsign · rank · homeworld/star system · epoch · lifeform class · form · carrier Hz · aura · modality · 3 gifts · growth edge · teaching · Earth assignment · alliance · contact protocol + window · seal · quote · service length · session count.
- GROUP (20 families + 8 orders = 28, handcrafted): history (2–3 sentences) · structure · artifacts · exactly 3 teachings · contact protocol · honest discernment note · exactly 3 resonances.
- PROFESSION (72, handcrafted): mandate · pathway · 4-item toolkit · workplace · honest hazards · ring (I–V) · tenure · non-monetary compensation · 2 allied domains (real titles only).
- DOMAIN (12): charter · 4 disciplines · entrance trial · seats line whose 3-way breakdown sums to the domain's real count.
- FEDERATION BODY (14): mandate · seat (a place) · founded era · fleet sentence · 3 jurisdictions · Earth relation. TREATY (16): signed era · signatories · 3 numbered clauses · effect. PRINCIPLE (16): codified origin · 2 clauses · practice.
- BIOLOGY SPECIMEN (all 2,700, deterministic): id · registry no · name (unique per kind) · genus · class/lineage · origin civilization (real family from the archive) + origin world line · habitat · diet · temperament · size · lifespan (fauna) / habitat · bloom cycle · scent · height · properties (flora) · exactly 4 field traits · one-sentence field note · rarity tier · stable artIndex (hash32(genus) % 24 — all specimens of a genus share one field-guide plate, like real natural-history books).
- Quality gate: machine-verify zero missing/extra keys vs data ids, array-length contracts, seats arithmetic, and zero duplicate sentences across all content strings.

§8 CHAT — THREE HARD LAWS
1) TOTAL SCOPE ISOLATION: store shape sessions: Record<Mode, ScopeSession>, where ScopeSession = { messages: ChatMessage[], status, error, activeQuery, draft }. Switching modes reveals ONLY that scope's own channel (quiet-state card if empty; full history intact on return). Never carries, merges or leaks other scopes' content — even composer drafts are per-scope. Per-channel "Clear the <scope> channel" action + exchange counter footer.
2) VISUAL TRANSMISSIONS: never plain-text walls. Channel header (scope medallion AI art + rotating dashed ring + "independent channel" badge + per-scope promise line). Every exchange: ribbon + decorative query echo + themed scope frame card (corner ornaments, gradient rule, masked scope-art backdrop) + structured body (gradient opening line, staggered Framer Motion paragraphs, diamond list items) + classification chip + TX meta row (timestamp · TX id · frame name) + copy button. Loading: named phases + shimmer skeleton, appended in-thread.
3) AUTO-FOLLOW (v1.2): the channel view ALWAYS follows new generations — a bottom sentinel calls scrollIntoView({behavior:"smooth", block:"end"}) whenever messages.length or status changes, so the visitor never scrolls down manually; the freshest exchange stays in view (incl. during loading skeletons).

§9 MODULES
- ARCHIVE REGISTER (main view): ALL entities — exact counters (870/202 + groups + revealed X/Y), full-text search, per-family/order filter chips, progressive reveal 60/batch (IntersectionObserver auto-load + "Reveal N more" + "Reveal all N"), registry numbers on every row, per-row dossier open, switch-register + return actions.
- DOSSIER MODAL: entity view = full 25-field deep dossier (registry header, badges, 6-cell stat grid, form/modality/aura, 3 numbered gifts, growth edge, mission, teaching card, contact protocol + window, seal, quote, context note, ask CTA). Group view = AI banner + badges + deep sections + ALL named representatives progressively revealed (30/batch, in-list filter when above 36, counter, archive numbers).
- FEDERATION MODAL: 3 tabs (Bodies / Treaties / Principles); intro lines derive their counts from array.length (never hardcoded); every card is a real button (emblem thumbnail + badge + name + label + footer + "Open" affordance) that opens a FULL DETAIL RECORD inside the modal: back button, large AI emblem hero with graceful onError fallback, badge chips, full description, deep dossier fields (profile lookup miss-safe), and the working "Ask the Mirror" action.
- ASTRAL JOBS MODAL: 3-level drill-down — 12 domain cards (AI banner strips, role/domain stat chips, "open seats" badges) → 72 professions → full dossier (ring, tenure, yield, mandate, pathway, toolkit chips, workplace, honest hazards, allied domains, ask CTA).
- INTERPLANETARY BIOLOGY WING (v1.3 main view, sage accent via var(--ok)): hero with masked AI banner (bio-banner), "The Living Archive" pill, title, subtitle with exact {f}/{fl} counts; 3 locale-aware counter tiles (Fauna 1,200 · Flora 1,500 · Specimens 2,700); Fauna/Flora kind tabs; full-text search (name/origin/registry/class); "All" + 8 class/lineage filter chips with derived per-group counts; progressive reveal 60/batch (IntersectionObserver sentinel + "Reveal N more" + "Reveal all N", exact status lines); rows = thumbnail plate + name + class · origin civilization + mono registry number, opening the SPECIMEN MODAL (hero plate, class + rarity chips, Origin civilization block with world line, 2-col stat grid — Habitat/Diet/Temperament/Size/Lifespan or Habitat/Bloom cycle/Scent/Height/Properties — 4 diamond field traits, italic serif field note, "Ask the Mirror about {name}" CTA); switch-kind + return actions.
- LABORATORY SETTINGS MODAL (v1.2 — see §15): language grid + transcript voices + narration pace, opened from the sidebar-top Settings button.
- APIs: POST /api/transmission → LLM chat completion with a Mirror Entity system prompt (voice rules + honest epistemic framing + scope context), strict JSON {classification, transmission}, fence-tolerant extraction, whitelist-validated classification, 400/500 handling. POST /api/manifest → blueprint {title, field_state, visualization, micro_actions[3], affirmation, window, caution}, same strictness. POST /api/tts → documentary narration (see §16). ALL THREE accept the visitor's language and generate their content in it.

§10 IMAGE SYSTEM — 1,236 AI-GENERATED IMAGES
- 116 bespoke masters: 4 modes · 20 families · 8 orders · 4 lab · 14 federation emblems · 16 treaties · 16 principles · 12 domains · 8 fields · 6 directions · 5 scope backdrops · 2 hero · 1 biology banner.
- 48 exobiology field-guide plates (24 fauna + 24 flora): muted naturalist palette, deep charcoal slate, museum-archival style — the shared plate pool every specimen draws from via its genus.
- 1,072 entity portraits: unique per named entity — derived art (seeded crop + hue/sat/brightness grade + geometric SVG sigil overlay + vignette, 512px JPEG via sharp).
- Pipelines gen-images.mjs + gen-images-v13.mjs: 2-worker pools, 429-aware exponential backoff, resume-safe checkpoints; graceful procedural fallback; descriptive alt text mandatory.

§11 ATMOSPHERE & MOTION
CosmicBackdrop (4 drifting radial nebulae, theme-aware CSS vars, calm opacities) + StarField canvas (dark-only, reduced-motion aware) + gentle keyframes (drift, dot-pulse, pill-breathe, shimmer, rise-in, line-breathe) + mono micro-labels + hairline dividers + focus-glow rings — all at §3.5 reduced intensities. Transitions 300–500ms.

§12 RESPONSIVE & A11Y
≥1024: three-zone frame · <1024: off-canvas drawer, full-screen modal sheets, compact icon-only pills. Touch targets ≥44px · semantic landmarks · ARIA labels/roles (ALL translated, §15) · full keyboard path (ESC closes modals) · styled scrollbars · long lists capped (max-h + scroll). Verify desktop 1440×900 AND mobile 390×844, dark AND light.

§13 ARCHITECTURE RULES
One component per file: AppShell · TopNavigation · ThemeToggle · Sidebar (+SettingsButton+BiologySection+SidebarContent) · MobileSidebar · ModeSelector · ScienceFilters · HeroPanel · QuestionCards · StatusBar · QueryComposer · TransmissionView · ListenButton · ArchiveRegister · BiologyExplorer · SpecimenModal · ManifestationLab · ModalShell · SettingsModal · FederationModal · AstralJobsModal · DossierModal · CosmicBackdrop · StarField. Data in src/lib/data/* (incl. biology.ts deterministic specimen engine) · profiles in src/lib/{entity-profile, group-profiles, profession-profiles, federation-profiles}.ts · i18n in src/lib/i18n/{core,index,types}.ts + dicts/{sq,it,el,de,fr,es,tr}.ts (+ formatArchiveNumber + LOCALES) · generators in scripts/ (incl. extract-i18n.mjs, collect-dynamic-i18n.ts, check-i18n.mjs) · store in mirror-store.ts (view "biology", biologyKind, openBiology/exitBiology/setBiologyKind, specimen modal state).

§14 UNIVERSAL LANGUAGE SYSTEM (v1.2/1.3 — EVERY WORD, ONE SWITCH)
- Eight interface languages, default English: en English · sq Shqip (Albanian) · it Italiano · el Ελληνικά · de Deutsch · fr Français · es Español · tr Türkçe.
- FULL-COVERAGE LAW: switching language instantly translates ABSOLUTELY EVERY rendered word of the UI — top bar + subtitle, mode names, sidebar (all sections/rows/counts/placeholders incl. the Biology section), science chips, hero copy, per-scope suggestions, reload + send affordances, gift lines, status ticker, composer placeholder + hints, channel headers/promises/phases, classification badges + honesty notes, TX meta rows, register, the Biology wing + specimen modals, all 5 modals (dossier labels, federation incl. openable records, astral jobs, settings), buttons, empty states, toasts and EVERY aria-label — via a reactive useT() hook (natural-English keys + {param} interpolation; missing key falls back to English; per-language dictionaries of 556 keys, machine-checked complete: scripts/check-i18n.mjs). Numbers render locale-aware (formatArchiveNumber + per-language LOCALES map: 1200 → "1,200" / "1.200" / "1 200").
- DYNAMIC CONTENT LAW: the selected language is sent to /api/transmission and /api/manifest; the AI writes EVERY generated word — opening line, paragraphs, signature, blueprint fields — in fluent natural <language> (a CRITICAL language instruction is injected into the prompt; classification values stay English whitelist tokens; timestamps use locale-aware formatting via a per-language LOCALES map).
- Persistence: localStorage "mirror-entity-language" restored once on mount (bootPreferences); <html lang> follows; language also gates TTS cache keys. Canonical data content (names, registries, dossier values) remains English archival record.

§15 LABORATORY SETTINGS (v1.2)
- Entry: Settings button pinned at the very top of the sidebar (desktop + mobile drawer), showing a live chip of the active language; opens a centered glass modal ("Laboratory Settings — choose the language of every word and the voice that reads your transmissions").
- Language section: 2-column grid of the 8 languages (native name + English name, checkmark on active, instant switch + toast).
- Voice section: 6 transcript voices with per-voice instant preview buttons — Aurora (warm woman · documentary narrator — the default), Sage (calm, steady, professional woman), Regent (gentleman narrator · classic register), Harbor (natural, flowing storyteller), Nova (expressive cinematic narrator), Pixie (bright, luminous spirit). Each maps to a real synthesis engine (tongtong, xiaochen, jam, douji, luodo, chuichui).
- Narration pace: 3 chips — Measured 0.85 · Documentary 0.95 (signature/default) · Natural 1.1.
- Persistence: "mirror-entity-voice" + "mirror-entity-pace" in localStorage; changed preferences immediately silence any playing narration (settings always win).

§16 LISTEN — DOCUMENTARY NARRATION SYSTEM (v1.2)
- A Listen control sits AT THE TOP OF EVERY GENERATED CONTENT (each transmission frame; pill variant with label Listen/Gathering voice/Stop) + icon variant elsewhere. One click narrates the full text with the chosen documentary-grade voice; one voice sounds at a time (starting one stops the other); instant stop; states idle→loading(spinner)→playing(stop icon), themed to var(--scope-a).
- Backend POST /api/tts: accepts {text, voice, pace}; maps VoiceId→engine; sentence-bounded chunking ≤900 chars (≤14 chunks); synthesizes each chunk as WAV via zai.audio.tts.create (the SDK REJECTS response_format mp3 — error 1214 — so always wav, stream:false); parses RIFF/WAVE headers, concatenates raw PCM and rebuilds ONE canonical 44-byte-header WAV; responds audio/wav. Client caches object-URLs (Map, max 24, LRU revoke) keyed text+voice+pace+language for instant replay; errors surface as gentle toasts.
- Voice character law: narration must feel like a beautiful documentary — warm, unhurried, human. Aurora (tongtong) is the default warm woman narrator; pace 0.95 documentary signature.

§17 ACCEPTANCE CHECKS — ALL MUST PASS
1. Register reveals exactly 870 civilization rows and 202 being rows; counters read 870/870 and 202/202.
2. Searching a name (e.g. "Atlas") hits named individuals; EVERY row opens a 25-field deterministic dossier.
3. Scope isolation: ask in Interplanetary → switch to Science (quiet channel) → return (history intact) → parallel exchange in Science → clear channel wipes only that scope.
4. Science shows 8 FUSION FIELDS + 6 DIRECTION chips that filter suggestions.
5. Lab end-to-end: compose → charge → blueprint renders every field; API 200.
6. Astral drill-down seat arithmetic sums to domain totals; Federation records OPEN: tapping a treaty (e.g. The Passage Accord) shows its AI emblem + full dossier + Ask action; intro lines read 14 / 16 / 16 from array length.
7. Both themes coherent; ESC closes modals; mobile drawer + sheets work.
8. Lint clean · zero console errors · /api/transmission + /api/manifest + /api/tts return 200.
9. LANGUAGE: switch to Shqip in Settings → every visible word (and every ARIA label) becomes Albanian — including the Biology wing, specimen modals, federation records and suggestions; a new transmission is written by the AI fully in Albanian; after reload the language persists.
10. VOICES: Settings lists 6 voices with previews; selecting Aurora + Documentary pace, pressing Listen on a transmission produces playing state and audible documentary narration; only one narration sounds at a time.
11. LISTEN PLACEMENT: every transmission frame carries a Listen control at its top, above the body text.
12. AUTO-FOLLOW: after sending a question the view follows the loading skeleton and the finished transmission automatically — no manual scrolling.
13. BIOLOGY: sidebar shows "Fauna archive 1,200" and "Flora archive 1,500" (locale-formatted); the wing shows 1,200/1,500/2,700 tiles; class/lineage chips' counts sum exactly to the kind's total; search hits (e.g. "Lurristel") filter correctly; a specimen row opens the full modal with plate, origin civilization, stat grid, 4 traits, field note.
14. SUGGESTIONS: each scope shows its OWN 12-question set (6 visible); the reload icon reshuffles with wrap-around; clicking a suggestion TRANSMITS IMMEDIATELY (channel view opens, POST /api/transmission 200, exchange appears).
15. DETERMINISM: the biology build produces byte-identical specimens across processes (seeded mulberry32, fingerprinted); counts bound to array.length everywhere.

END OF REPLICATION PROMPT
