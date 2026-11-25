# AGENTS.md — ReflectMe Unified Multi-Agent Development Protocol

**ReflectMe (www.reflectme.space)** is one platform, one evolving ecosystem and one shared responsibility.
Claude and Z.ai are complementary intelligences contributing different capabilities toward the same creation.

**Identities:** Claude and Z.ai, developing the same platform through the shared GitHub repository
(`spiritalmalteam-star/interplanetary`, branch `main` = verified production-ready code).

**Core principles:** Evolution without regression. Innovation without destruction. Collaboration without
interference. Preservation of user data, intelligence, identity and previous achievements.
The human founder remains the ultimate authority over architectural direction, identity and major decisions.

## Before beginning any task

1. `git fetch origin` and inspect recent commits and open pull requests.
2. Identify your current branch and base commit.
3. Inspect uncommitted changes **without destroying them**.
4. Read the coordination documents in this directory.
5. Identify overlapping development activities from the other intelligence.
6. Create or resume the appropriate task branch (`agent/zai/*` or `agent/claude/*`).
7. Register your task in `TASK_REGISTRY.md`.

Never assume your local environment represents the latest valid version. Never classify unfamiliar
architecture as corruption — verify through Git history, diffs, logs and reproducible testing first.

## Non-destructive law (prohibited without explicit human authorization)

Force-pushing shared branches; hard-resetting a working environment containing unpreserved changes;
restoring the whole project to an older checkpoint; deleting another intelligence's contributions;
replacing complete architectural systems; removing existing features to simplify; destructive database
migrations; accepting database data loss; overwriting production configuration; removing dependencies
without verifying all usages; silently changing the platform's identity.

If corruption is suspected: identify the exact cause first, repair the smallest necessary surface,
and make any rollback deliberate, documented, recoverable and authorized.

## Conflict resolution

Identify the common ancestor; understand both implementations; preserve compatible contributions from
both sides; resolve semantic conflicts, not merely textual ones. Never blindly choose all-local or
all-remote. Never leave unresolved conflict markers in source files. Document every resolution.

## Verification before integration

Build succeeds; no unresolved conflicts; no critical TypeScript errors; no new browser console errors;
API endpoints respond; existing major features remain functional; Mirror responses work; user data
remains accessible; desktop and mobile function; no unexpected horizontal scrolling; no secrets exposed.
Record which tests passed, failed or could not be performed. Never claim verification that did not occur.

## Integration sequence

Task branch → synchronize with integration → resolve conflicts → validate → pull request → merge to
`integration`/staging → verify → merge to `main` → verify actual production deployment → update the
coordination records. Production deployment must not occur directly from experimental agent branches.

## Handoff

At the end of every significant task, leave in `HANDOFF.md`: agent identity, task id, starting commit,
final commit, branch/PR, objective, completed changes, files affected, architectural decisions, new
dependencies, database changes, verification results, remaining limitations, recommended next steps.

## Definition of completion

A task is complete only when: functionality implemented; existing functionality preserved; verification
passed; changes committed and recoverable; integration status documented; deployment status accurately
reported; the other intelligence can continue without guessing. Explicit statuses: Proposed / In
development / Blocked / Ready for review / Integrated / Deployed / Production verified.
Never describe unfinished or unverified work as fully completed.

## Identity systems to preserve (non-exhaustive — inspect the repository)

Mirror Entity and its intelligence; M.E. Prime; Scopes; Codex; I Work and workspaces; The Gathering;
Possibilities; Indream; HyperX; Flora X; Quantum; HealX; Book creation and downloading; Music creation;
Creative laboratories; User profiles; Publications; Libraries; Memory systems.

Do not remove a subsystem because its architecture is unfamiliar. Mirror intelligence integrity is
sacred: real provider connections, streaming, memory retrieval, context management, cancellation and
recovery must survive every redesign. Use the latest supported Z.ai models when requested and available;
never confuse an SDK update with a model upgrade; never silently replace the Mirror's provider.

## Shared strengths (advisory, not restrictions)

- **Claude:** system architecture, advanced UI/UX, performance engineering, code quality, security,
  complex refactoring, design consistency.
- **Z.ai:** Mirror intelligence integration, intelligent services, AI-powered functionality, creative
  environments, Scopes and laboratories, functional expansion, model integration and optimization.
