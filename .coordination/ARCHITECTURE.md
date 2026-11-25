# ARCHITECTURE.md — shared understanding of ReflectMe

## Runtime map

- **App:** Next.js 16 App Router (`src/app`), one user-visible route `/` (LandingGate → AppShell).
  All subsystems render as workspaces inside the shell, not as separate routes.
- **API:** `src/app/api/**/route.ts` — REST-ish routes; backend-only SDK usage (`z-ai-web-dev-sdk`
  never imported client-side).
- **Data:** Prisma + SQLite (`db/custom.db`); canonical schema `prisma/schema.prisma`;
  postgres twin derived via `scripts/select-schema.mjs` (provider swap only).
- **Intelligence bridge:** `src/lib/zai-client.ts` — one cached `ZAI.create()` per process.
  Chains: zai-cloud primary + Gemini second sky (chat only); atelier SDK gateway in dev;
  Albanian tongue → Gemini first. Voice TTS/ASR: Z.ai only (CogTTS/GLM-ASR family).
- **Images:** `src/lib/image-engine.ts` on `@google/genai`.
- **Realtime:** socket.io mini services under `mini-services/` (own ports; reached via
  `/?XTransformPort=<port>` through the Caddy gateway — never direct localhost URLs client-side).

## Key subsystems (locations to be verified before edits)

- Mirror chat: `src/app/api/v1/chat/route.ts`, mirror OS `src/app/api/mirror-os/route.ts`.
- Mirror UI: `src/components/mirror/*` (AppShell, CreationRoom, TransmissionView, BranchCanopy,
  ScopesWorkplace, ToolWorkspace, dreambook/*).
- Gathering: `src/components/gathering/*` (sections: Discover, Live, Circles, Messages, Laboratory…).
- Publications/publishing: PublishPickerSheet + publishing APIs (verify exact routes before edit).
- Books: dream-book APIs + ManuscriptEditor (`src/components/mirror/dreambook/*`).
- Music: `src/lib/audio/visualization-engine`, `VisualizationCanvas`, viz-store, StyleShelf.
- Scopes: mirror-store (2500+ lines) + ScopesWorkplace.

## Rules of the road

- Frontend first, then backend APIs; use API routes (not server actions) for new backend surfaces.
- Sticky footer (`min-h-screen flex flex-col` + `mt-auto`), mobile-first responsive, shadcn/ui first,
  no indigo/blue unless the founder asks, `bun run lint` before integration, verify with a real browser.
- Long-running generation (books, PDFs, music, images) must be durable server-side jobs with progress,
  cancellation, retry and Library recovery — never browser-lifetime-bound.
