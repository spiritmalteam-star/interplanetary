# RELEASE_CHECKLIST.md — mandatory validation before production

- [ ] `git fetch origin` — no unexpected divergence; task branch rebased on latest integration state.
- [ ] `bun install` clean; lockfile updated when dependencies changed.
- [ ] `bun run lint` passes (no new errors).
- [ ] No unresolved merge-conflict markers anywhere (`rg '^(<<<<<<<|=======$|>>>>>>>)' src/`).
- [ ] Dev server boots clean; homepage HTTP 200; no error boundary / hydration crash.
- [ ] Browser (agent-browser) real-interaction pass: primary flows clicked, forms submitted, data flows
      from API to UI (not skeletons forever), desktop + mobile widths, sticky footer law, no horizontal
      scroll, no new console errors (cross-check dev.log).
- [ ] Mirror chat responds (streaming works end-to-end); voice unaffected.
- [ ] Database: schema changes reviewed; SQLite `db:push` shows no unintended data loss; production
      migration path documented if schema changed.
- [ ] No secrets in code, logs, or coordination docs; API keys server-side only.
- [ ] Existing subsystems spot-checked (Mirror, Gathering, Publications, Books, Possibilities).
- [ ] Coordination docs updated (CURRENT_STATE, TASK_REGISTRY, DEVELOPMENT_LOG, HANDOFF).
- [ ] Push via authorized token; verify the push landed on GitHub; verify the actual deployment commit.
