# Technical debt register (verified items only)

1. **Destructive schema sync on deploy** — `package.json` build sets `DB_PUSH_ACCEPT_DATA_LOSS=true`
   and runs `prisma db push`. A schema change that drops data would apply silently. Needs an
   owner-approved plan: versioned migrations, pre-deploy backup, restore test. *Not changed.*
2. **Type errors hidden** — `typescript.ignoreBuildErrors: true`; ~37 baseline `tsc` errors.
3. **God files** — `BranchCanopy.tsx` (7.9k lines), `mirror-store.ts` (6k lines), `gathering/*` (22k lines).
4. **No CSP / Permissions-Policy** — needs report-only trial (voice features need microphone).
5. **Thin automated tests** — 6 unit files; no API/auth/e2e/a11y/visual tests in CI.
6. **No request tracing / usage-per-model record** — cannot say which model served a request.
7. **Duplicate address strings** — apex vs www in `ProfilePage.tsx` share link; use `src/lib/site.ts`.
