# Technical debt register (verified items only)

1. **Destructive schema sync on deploy** — `package.json` build sets `DB_PUSH_ACCEPT_DATA_LOSS=true`
   and runs `prisma db push`. A schema change that drops data would apply silently. Needs an
   owner-approved plan: versioned migrations, pre-deploy backup, restore test. *Not changed.*
2. **Type errors hidden** — `typescript.ignoreBuildErrors: true`; ~37 baseline `tsc` errors.
3. **God files** — `BranchCanopy.tsx` (7.9k lines), `mirror-store.ts` (6k lines), `gathering/*` (22k lines).
4. **No CSP / Permissions-Policy** — needs report-only trial (voice features need microphone).
   ~~RESOLVED 2026-11-27 (ZAI-25):~~ CSP-Report-Only trial + Permissions-Policy live on every
   route with a braked `/api/csp-report` ear (query strings stripped); real pages harvested zero
   violations. Remaining: graduate to enforcing mode after the owner reviews the harvest.
5. **Thin automated tests** — 6 unit files; no API/auth/e2e/a11y/visual tests in CI.
6. **No request tracing / usage-per-model record** — ~~RESOLVED 2026-11-27 (ZAI-25):~~ every
   metered door now carries `x-request-id` (+ `x-served-model` when known at response time),
   writes one structured secret-free `ai_door` log line, and `UsageEvent` rows record the true
   serving rung (AsyncLocalStorage trace in the bridge; streamed answers witnessed in `after()`).
7. **Duplicate address strings** — ~~RESOLVED 2026-11-27 (ZAI-25):~~ `ProfilePage.tsx` server
   fallback now uses `SITE_URL` (`src/lib/site.ts`); no stray apex twin remains in the share path.
