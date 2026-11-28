# ReflectMe quality scorecard (evidence-based)

Scores are 0–10 and reflect only what has been **measured or inspected**. "Unverified" means no
evidence yet — it is not a low score and not a pass. Last updated 2026-11-27 (Z.ai, ZAI-25).
Tools: `qa/seo_probe.py`, `qa/prod_ai_probe.py`, `qa/perf_probe.py`, `qa/perf_chat.py` (all read-only,
CI-run; emulation and stubbed AI unless stated).

| Category | Score | Evidence | Main weakness / next action |
|---|---|---|---|
| Intelligence integration | 8 | `prod_ai_probe` on main f428280: HTTP 200 + real prose for mirror, absolute, hyperx, omni, hyperx-stream; Z.ai-only ladder (glm-4.6 → glm-4.5-flash). ZAI-25: every metered door now returns `x-request-id` + `x-served-model`, writes a structured `ai_door` line, and `UsageEvent` records the true serving rung (verified live: `glm-4-plus` on both stream and one-breath paths) | No latency/usage dashboard yet — the data now exists in UsageEvent; build an admin health/cost view (§26) |
| Performance (landing/chat, emulated) | 7 | 4x CPU throttle: heap 12–28 MB flat over 14 turns, no long tasks after turn 2, 0 backdrop filters | Rooms other than chat measured only by Z.ai's sweep; no real-device or Lighthouse/CWV data → Unverified for LCP/INP/CLS |
| Technical SEO | 5 | seo_probe on production: apex 308→www, 1 h1, 4.9k chars visible without JS, meta description, OG image, canonical www, 2 JSON-LD blocks, robots.ts disallows /api/, sitemap + /api/health 200 | Public knowledge URLs not built (needs owner decision on what is public); hreflang 0; llms.txt 404; sitemap carries 1 URL |
| Security (headers) | 7 | ZAI-25 live: HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy (microphone=(self) preserved for voice; camera/geolocation/payment/usb closed), CSP Report-Only trial with braked collector; real pages harvested ZERO violations | CSP still report-only — graduate to enforcing after the owner reviews the harvest |
| Security (credits/rate limit) | 6 | Earlier hardening PRs (idempotent spend, shared rate limit, closed complimentary checkout) with unit tests | No integration tests against a real DB; authorization audit of every route not done → Unverified |
| Database integrity | 5 | 76 models, 83 indexes. Build now runs the additive-only guard (no data-loss flag); CI verifies guard, backup/restore (75 tables row-for-row, throwaway DB) and baseline zero-drift. NOT verified against the real production database; no production backup yet | Destructive-sync deploy strategy contradicts safe-migration goal. Needs owner-approved migration plan (versioned migrations, backup/restore test). Not changed here |
| Testing coverage | 3 | 6 unit test files (rate limit, idempotency, owned-json, birth-gift, ai-errors, model-ladder); CI runs them; probes exist | No Vitest, no API contract/auth/e2e suite, no a11y or visual-regression tests |
| Deployment reliability | 6 | Commit→deployment status verifiable via GitHub deployments API; post-deploy probe works; `/api/health` live | `next.config.ts` has `typescript.ignoreBuildErrors: true` (37 baseline tsc errors hidden) |
| Reliability / graceful failure | 5 | Failures are classified and shown honestly with Try again (PR #17/#21) | No circuit breaker; no persisted job state for long generations (§17 durable execution is the next step) |
| Structural architecture / maintainability | 4 | `BranchCanopy.tsx` 7,851 lines; `mirror-store.ts` 5,950 lines; `.coordination/*` and `docs/ARCHITECTURE_AUDIT.md` exist | Split along existing seams incrementally; do not rewrite |
| Accessibility | unverified | Orb/composer follow reduced-motion; no axe run | Add axe-core to CI |
| Mobile responsiveness | 6 | CI captures at 390/820/1440 for the chat; no overflow in perf_chat run; ZAI-25 browser check: 390px scrollWidth == clientWidth, zero errors | Other rooms not captured; no real device |
| Visual design, UX, Gathering, Codex, collaborative, Book | unverified | Active work (Z.ai ZAI-19..25, Claude CLAUDE-19) | Judged by owner review, not by metric |
| Scalability (100/1k/10k) | unverified | No load test, no capacity plan; SQLite locally, Postgres twin in prod | Needs measured load test + DB pool review before any claim |
| Observability | 4 | `/api/health` (200 live); ZAI-25: structured `ai_door` lines (requestId, status, latency, provider, rung, charged) on every metered door; `x-request-id` correlation header; CSP violation ear; UsageEvent model attribution verified in DB | No request-ID propagation into client errors, no error tracking service, no admin health dashboard |
| Cost sustainability | unverified | No token/usage cost report | UsageEvent now carries model + charged — aggregate per-room token/cost view is the next step |
| Privacy / i18n / Infra efficiency | unverified | 8 UI languages exist; no GDPR export/delete audit | Audit data export/deletion paths |
