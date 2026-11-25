# TASK_REGISTRY.md — shared task registry

Statuses: Proposed / In development / Blocked / Ready for review / Integrated / Deployed / Production verified.

| ID | Owner | Objective | Branch | Base | Status | Notes |
|---|---|---|---|---|---|---|
| ZAI-1 | Z.ai | Restore sandbox health: repair damaged tree, align main to origin, dev server 200 | (hotfix on main) | `a0260ef7` | Deployed | Damaged tree preserved at `backup/damaged-merge-20261125`; verified 200 + browser check |
| ZAI-2 | Z.ai | Establish coordination system (`.coordination/*` + root `AGENTS.md`) | `agent/zai/coordination-foundation` | `a0260ef7` | In development | Protocol persisted for both intelligences |
| ZAI-3 | Z.ai | Upgrade Mirror chat API to latest Z.ai model (`glm-4.6` default, env-overridable) | `agent/zai/coordination-foundation` | `a0260ef7` | In development | One-line change in `zaiCloudConfig`; vision stays `glm-4.6v` |
| ZAI-4 | Z.ai | Publications viewable again (bug: published works cannot be opened/viewed) | `agent/zai/publications-evolution` | TBD | Proposed | User-reported |
| ZAI-5 | Z.ai | AI images for every publication (new publishes + retroactive for existing ones) | `agent/zai/publications-evolution` | TBD | Proposed | Uses image-engine (@google/genai) |
| ZAI-6 | Z.ai | Possibilities: TikTok-style vertical feed featuring publications | `agent/zai/publications-evolution` | TBD | Proposed | Featuring section requested by founder |
| ZAI-7 | Z.ai | Book downloading never interrupted unless user cancels (durable job + resume + Library recovery) | `agent/zai/publications-evolution` | TBD | Proposed | Protocol section 14 applies |
| ZAI-8 | Z.ai | The Gathering: every button opens its own Workplace Lab with tools/services | `agent/zai/gathering-workplace-labs` | TBD | Proposed | Extends laboratory architecture |
| CLAUDE-17 | Claude | fix/mirror-intelligence (Transmission failure classification, QA probe) | PR #17 (merged) | `3c62bcd` | Integrated | Preserved by Z.ai |
