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
