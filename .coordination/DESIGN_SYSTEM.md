# DESIGN_SYSTEM.md — ReflectMe visual language

## Atmosphere

Intelligent, alive, refined, mysterious without confusion, premium, spacious yet compact, distinctively
ReflectMe. No generic templates, no oversized buttons, no uniform card grids, no overwhelming effects.

## Foundations

- shadcn/ui (New York) + Tailwind CSS 4 tokens (`bg-background`, `text-foreground`, `bg-primary`…).
- Color restriction: no indigo/blue unless the founder explicitly asks; the palette leans to the house
  tones (warm parchment `#d8c9a8`-family and violet `#a855f7`-family accents seen in scope styling).
- Light/dark via `next-themes`; respect both.
- Typography: consistent hierarchy; weights mean something (display vs body vs caption).

## Layout law

- Mobile-first; breakpoints `sm: md: lg: xl:`; minimum 44px touch targets.
- Sticky footer: root `min-h-screen flex flex-col`, footer `mt-auto`; content pushes it, never overlaps.
- Long lists: `max-h-96 overflow-y-auto` with styled scrollbars; no horizontal overflow anywhere.
- Cards aligned: `p-4`/`p-6` padding, `gap-4`/`gap-6` spacing.

## Motion

Subtle (Framer Motion or CSS): hover/focus feedback, soft page transitions; layers animate only in
motion and go dormant when unseen (the yielding-portal lesson); no live blurs while docked.

## Loading and feedback

Authentic Mirror-style loading (elegant, lightweight); spinners/skeletons on async; toasts for user
actions; clear actionable error states; semantic HTML + ARIA + `sr-only` + descriptive alt text.
