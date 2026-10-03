# interplanetary — Mirror Entity Laboratory

A chat-driven interplanetary laboratory: one presence, many worlds. Ask, and the
Mirror answers — in words, in paintings, and in living windows.

## Worlds

- **Mirror OS** — reality guidance from the Mirror Entity
- **Akashic Library** — records of the ancient one
- **Star Play** — the Mirror's arcana deck
- **Invent** — the Forge, the invention workshop
- **Dream Book** — tales woven from resonance (poems, riddles, ballads — read in-chat or full-screen)
- **ParticleX** — the quantum narrator of the laboratory (8 windows, note stickers with drawn 3D ink scenes)
- **Evolve Med** — the evolutionary medical nexus (4 vectors)

Plus registers (Federation, ET Technology, Astral Jobs), a cosmic library,
seven languages, a kind lady reader, and a Universal Visualization Engine —
every channel can answer with a painted image.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma (SQLite) · z-ai-web-dev-sdk · OpenAI DALL·E 3 (image bridge with automatic fallback)

## Run

```bash
bun install
bun run db:push
bun run dev
```

Open the preview panel and transmit your first question to the mirror.

## Secrets

Never commit `.env` — it holds API keys. The generated artwork gallery
(`.visualizations/`) and the local database (`db/`) are runtime data and are
gitignored as well.

## Deploy to Vercel

The worlds speak through a provider bridge (`src/lib/zai-client.ts`):

- **In this sandbox** — the z-ai-web-dev-sdk atelier answers (default provider `zai`).
- **On Vercel** — the Z.ai sky is the default: set `ZAI_API_KEY` in the Vercel
  project's Environment Variables and every world speaks with the same GLM
  brains as the laboratory (chat model `glm-4.5-flash` — free; override with
  `ZAI_MODEL`, vision with `ZAI_VISION_MODEL`, painter with `ZAI_IMAGE_MODEL`).
  With only `OPENAI_API_KEY` present the bridge switches to the OpenAI
  endpoint instead. `LLM_PROVIDER` can force `zai-cloud`, `openai` or `zai`
  explicitly.

```bash
# after deploying, the cloud sky needs one key:
# 1. create a key at https://z.ai/manage-apikey/apikey-list
# 2. Vercel → Project → Settings → Environment Variables → ZAI_API_KEY
# 3. Deployments → ⋯ → Redeploy
```

Notes:
- Images flow through the multi-brush engine (`src/lib/image-engine.ts`):
  the lead brush follows the chat brain — CogView (Z.ai) first in the Z.ai
  sky, DALL·E 3 first in the OpenAI sky — and the other brush plus the Z.ai
  atelier serve as fallbacks. On Vercel (read-only filesystem) paintings are
  served from the painter's hosted url instead of the local gallery.
- Voice (TTS/ASR) currently speaks only through the z-ai atelier
  (`LLM_PROVIDER=zai`); in the cloud the Listen button rests quietly.
- The cosmic library and accounts need a database (`DATABASE_URL`);
  point it at a hosted provider to use them in the cloud.
