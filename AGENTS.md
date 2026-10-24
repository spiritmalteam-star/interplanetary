# AGENTS.md — ReflectMe Capability & Skills Discovery

*Established by the Universal Evolution Protocol (Part VII): a documented, repeatable
process for discovering, evaluating, installing, and maintaining the best compatible
skills — so ReflectMe keeps evolving without becoming more complicated.*

---

## 1. The discovery process (repeat every cycle)

1. **Discover** — `npx skills find <topic>` (registry: skills.sh; sources below).
2. **Evaluate every candidate against all ten gates before installing:**
   - Repository authenticity (official org or established author).
   - Maintenance status (installs, recent commits).
   - License compatibility (MIT/Apache preferred).
   - Framework compatibility (Next.js 16 App Router + TypeScript 5).
   - Dependency inspection (no new runtime deps unless justified).
   - Script & permission review (never run unreviewed remote install scripts).
   - Security/privacy implications (no telemetry, no network calls).
   - Overlap check — does ReflectMe already have this capability?
   - Bundle/operational overhead (docs-only skills cost 0 runtime bytes).
   - Isolated trial before adoption (git provides the rollback checkpoint).
3. **Install** — `npx skills add <owner/repo> --skill <name> --agent claude-code -y`
   (non-interactive; lands in `.claude/skills/<name>/`).
4. **Record** — append the decision to §3 below.
5. **Pin & maintain** — never auto-update across incompatible majors; re-evaluate
   on every major protocol revision.

## 2. Trusted candidate sources

- https://skills.sh/ — the skill registry the CLI searches
- https://github.com/vercel-labs/agent-skills — Vercel's agent skills
- https://ui.shadcn.com/docs/skills — shadcn/ui component guidance
- https://github.com/pmndrs/react-three-fiber — 3D rendering (runtime lib, evaluate separately)
- https://reactflow.dev/ — graph canvas performance guidance (already in use: @xyflow/react)
- https://github.com/motiondivision/motion — animation (already in use: framer-motion)

These are candidate sources, **not** instructions to install every package.

## 3. Installed skills (the ledger)

| Date | Skill | Source | License | What it provides | Runtime cost |
|------|-------|--------|---------|------------------|--------------|
| 2025-11 (Universal Evolution cycle) | `vercel-react-best-practices` | vercel-labs/agent-skills (834K installs) | MIT | 70 React/Next.js performance rules in 8 prioritized categories (waterfalls, bundle size, server perf, re-renders, rendering) — applied when writing/reviewing components | **0 bytes** (documentation only, `.claude/skills/vercel-react-best-practices/`) |

**Evaluated and deliberately not installed (with reasons):**
- `emilkowalski/skills@animation-performance` — relevant topic, but ReflectMe already
  enforces motion discipline (MotionConfig reducedMotion, perf-mode eco tier, measured
  animation budgets). Re-evaluate if animation jank regressions appear.
- `callstackincubator/…@react-native-best-practices`, `software-mansion/argent@…` —
  React Native focused; not applicable to a Next.js web app.

## 4. How skills relate to runtime libraries

Skills **guide implementation quality**; actual libraries provide runtime functionality.
Do not confuse the two. The runtime stack is fixed: Next.js 16, TypeScript 5, Tailwind 4,
shadcn/ui, @xyflow/react, three.js/@react-three/fiber (lazy), framer-motion, Zustand,
Prisma (SQLite). New runtime libraries enter only through the same evaluation gates
plus a measured bundle/perf budget.

## 5. Priority skill topics for future cycles

React performance (done) · UI/UX & accessibility · component architecture · browser
testing (Playwright/agent-browser workflows) · AI interface design (streaming, tool
status) · video production · workflow orchestration (durable jobs) · security
(permission boundaries) · performance (Web Vitals, memory profiling).
