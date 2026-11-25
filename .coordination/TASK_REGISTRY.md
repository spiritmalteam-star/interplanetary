# TASK_REGISTRY.md — shared task registry

Statuses: Proposed / In development / Blocked / Ready for review / Integrated / Deployed / Production verified.

| ID | Owner | Objective | Branch | Base | Status | Notes |
|---|---|---|---|---|---|---|
| ZAI-1 | Z.ai | Restore sandbox health: repair damaged tree, align main to origin, dev server 200 | (hotfix on main) | `a0260ef7` | Deployed | Damaged tree preserved at `backup/damaged-merge-20261125`; verified 200 + browser check |
| ZAI-2 | Z.ai | Establish coordination system (`.coordination/*` + root `AGENTS.md`) | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | Protocol persisted for both intelligences; pushed |
| ZAI-3 | Z.ai | Upgrade Mirror chat API to latest Z.ai model (`glm-4.6` default, env-overridable) | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | One-line change in `zaiCloudConfig`; vision stays `glm-4.6v` |
| ZAI-4 | Z.ai | Publications viewable again (stream scroll-locked, no exits, boot-vs-focus race, mine unreachable) | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | Fixed in FeedSection: scrollable snap stream, back/prev/next + count, keeper preserves focus, mine wall + own stream for drafts; browser-verified |
| ZAI-5 | Z.ai | AI images for every publication (new publishes + retroactive) | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | Publish-time paint already existed; retroactive self-healing sweep in GET /api/gathering (45s cooldown, batch 3, after-response); keeper fallback verified locally |
| ZAI-6 | Z.ai | Possibilities: TikTok-style feed featuring publications + gaze counts | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | `featured=1` param (sourcePortal filter, young-hall fallback), `viewCount` additive column, POST `/[id]/view` gaze route, Eye counter; browser-verified (vc 0→1) |
| ZAI-7 | Z.ai | Book/download durability — never interrupted unless cancelled | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | beforeunload guard while works run; Library kept-PDF carry wrapped in startDownloadWork; resilientFetch retries 2→4; resume re-kindles em/px/hyperx presses (404 path verified) |
| ZAI-8 | Z.ai | Gathering: every room carries its own Workplace Lab | `agent/zai/coordination-foundation` | `a0260ef7` | Ready for review | New `WorkplaceLab.tsx` (per-room tool catalog, real actions); flask hand on portal crown; browser-verified incl. tool→navigation |
| ZAI-9 | Z.ai | Session-restore healing + mirror verification (sandbox rolled back to `c873b47`) | `agent/zai/session-restore-mirror-verify` | `58dd0b89` | Deployed | Zero unique local content proven; realigned to origin; bun install + db:push; mirror verified code/API/browser; publish loop smoke-tested |
| CLAUDE-17 | Claude | fix/mirror-intelligence (Transmission failure classification, QA probe) | PR #17 (merged) | `3c62bcd` | Integrated | Preserved by Z.ai |

**Environment note:** the platform supervisor checked `main` back out mid-session while feature work sat
uncommitted in the tree; the dirty state survived and was re-homed on this branch. Push early, push often.
