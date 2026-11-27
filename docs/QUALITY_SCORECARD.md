# ReflectMe quality scorecard (evidence-based)

Scores are 0–10 and reflect only what has been **measured or inspected**. "Unverified" means no
evidence yet — it is not a low score and not a pass. Last updated 2026-11-27 (Claude, CLAUDE-20).
Tools: `qa/seo_probe.py`, `qa/prod_ai_probe.py`, `qa/perf_probe.py`, `qa/perf_chat.py` (all read-only,
CI-run; emulation and stubbed AI unless stated).

| Category | Score | Evidence | Main weakness / next action |
|---|---|---|---|
| Intelligence integration | 7 | `prod_ai_probe` on main f428280: HTTP 200 + real prose for mirror, absolute, hyperx, omni, hyperx-stream; Z.ai-only ladder (glm-4.6 → glm-4.5-flash) | Serving model not recorded per request; no latency/usage dashboard → add model id to response header + structured log |
| Performance (landing/chat, emulated) | 7 | 4x CPU throttle: heap 12–28 MB flat over 14 turns, no long tasks after turn 2, 0 backdrop filters | Rooms other than chat measured only by Z.ai's sweep; no real-device or Lighthouse/CWV data → Unverified for LCP/INP/CLS |
| Technical SEO | 4 | seo_probe: apex 308→www, 1 h1, 4.9k chars visible without JS, meta description, OG image. Defects found: sitemap/robots/OG pointed at apex, no canonical, no JSON-LD, no hreflang, robots lacked `/api/` disallow | Fixed in this PR (site URL, canonical, robots.ts, JSON-LD). Public knowledge URLs not built (needs owner decision on what is public) |
| Security (headers) | 5 | HSTS, nosniff, X-Frame-Options, Referrer-Policy present; no CSP, no Permissions-Policy | CSP needs a report-only trial; Permissions-Policy must allow microphone (voice features) |
| Security (credits/rate limit) | 6 | Earlier hardening PRs (idempotent spend, shared rate limit, closed complimentary checkout) with unit tests | No integration tests against a real DB; authorization audit of every route not done → Unverified |
| Database integrity | 3 | 76 models, 83 indexes. **Production build runs `prisma db push` with `DB_PUSH_ACCEPT_DATA_LOSS=true`** (package.json `build`) | Destructive-sync deploy strategy contradicts safe-migration goal. Needs owner-approved migration plan (versioned migrations, backup/restore test). Not changed here |
| Testing coverage | 3 | 6 unit test files (rate limit, idempotency, owned-json, birth-gift, ai-errors, model-ladder); CI runs them; probes exist | No Vitest, no API contract/auth/e2e suite, no a11y or visual-regression tests |
| Deployment reliability | 6 | Commit→deployment status verifiable via GitHub deployments API; post-deploy probe works | `next.config.ts` has `typescript.ignoreBuildErrors: true` (37 baseline tsc errors hidden); no health endpoint until now (added `/api/health`) |
| Reliability / graceful failure | 5 | Failures are classified and shown honestly with Try again (PR #17/#21) | No circuit breaker; no persisted job state for long generations |
| Structural architecture / maintainability | 4 | `BranchCanopy.tsx` 7,851 lines; `mirror-store.ts` 5,950 lines; `.coordination/*` and `docs/ARCHITECTURE_AUDIT.md` exist | Split along existing seams incrementally; do not rewrite |
| Accessibility | unverified | Orb/composer follow reduced-motion; no axe run | Add axe-core to CI |
| Mobile responsiveness | 6 | CI captures at 390/820/1440 for the chat; no overflow in perf_chat run | Other rooms not captured; no real device |
| Visual design, UX, Gathering, Codex, collaborative, Book | unverified | Active work (Z.ai ZAI-19..24, Claude CLAUDE-19) | Judged by owner review, not by metric |
| Scalability (100/1k/10k) | unverified | No load test, no capacity plan; SQLite locally, Postgres twin in prod | Needs measured load test + DB pool review before any claim |
| Observability | 2 | `/api/health` (new); console logs only | Structured request IDs, error tracking, admin health view |
| Cost sustainability | unverified | No token/usage cost report | Aggregate per-room token use from existing usage records |
| Privacy / i18n / Infra efficiency | unverified | 8 UI languages exist; no GDPR export/delete audit | Audit data export/deletion paths |
