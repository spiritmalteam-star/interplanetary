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
- **Domain** — the laboratory lives at **https://reflectme.space**. In Vercel:
  Project → Settings → Domains → add `reflectme.space` and `www.reflectme.space`
  (apex: A record `76.76.21.21`; www: CNAME `cname.vercel-dns.com`), keep the
  `interplanetary-sigma.vercel.app` URL as a redirect. `metadataBase` in
  `src/app/layout.tsx` already points at the new home.
- Images flow through the multi-brush engine (`src/lib/image-engine.ts`):
  with `OPENAI_API_KEY` present the OpenAI brushes lead (DALL·E 3, then
  `gpt-image-1` — force either with `OPENAI_IMAGE_MODEL`), CogView (Z.ai)
  and the Z.ai atelier serve as fallbacks. When every brush rests, the
  fallback card shows *why* — each painter's last words travel in
  `paintErrors` and into the Vercel function logs. On Vercel (read-only
  filesystem) paintings are served from the painter's hosted url instead of
  the local gallery.
- Voice (TTS/ASR) rides the OpenAI sky on Vercel — the same `OPENAI_API_KEY`
  that paints also sings (`gpt-4o-mini-tts` → `tts-1` fallback, Whisper for
  hearing). In the laboratory the z-ai atelier speaks. If the voice is
  quiet, the response `detail` field and the Vercel logs say why.
- The cosmic library and accounts need a database (`DATABASE_URL`);
  point it at a hosted provider to use them in the cloud.
