# Task 2-b — full-stack-developer — Work Record

**Task:** Reading worlds — fancy reading toggle (Book ↔ Akashic) inside the reading environments, no-auto-select / deselectable book shapes with a one-thread channel gate, chat-free Dream Book welcome screen.

## Files touched (and ONLY these)
1. `src/components/mirror/ReadingToggle.tsx` — **NEW**
2. `src/components/mirror/DreamBookView.tsx` — edited
3. `src/components/mirror/AkashicView.tsx` — edited

(`src/lib/mirror-store.ts` was read for `openAkashic` / `openDreamBook` / `view` / `dreamResume` — NOT edited, as it belongs to another agent.)

## What was built

### 1. ReadingToggle (new component)
- Pill-shaped groove track: `rounded-full border border-border bg-card p-1` + inset shadow (embossed leather feel), theme vars only (`--card` / `--border` / `--foreground` / `--background`) → native in light and dark.
- Two sides in Literata serif (`font-[family-name(var(--font-literata))]`): **Book** (Lucide `Bookmark`) and **Akashic** (Lucide `Library`).
- Thumb: sliding **bookmark-ribbon** — `bg-foreground`, `rounded-t-full`, folded V-notch via `clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 9px), 0 100%)`, brass sheen overlay, drop + inset highlight shadows; hangs ~9 px out of the groove like a ribbon between pages. Glides via framer-motion spring (stiffness 430, damping 34, mass 0.9); `useReducedMotion` honored.
- Entrance animation: fade + slight drop + scale, 0.55 s.
- No props: reads `useMirror((s) => s.view === "akashic")`, calls `openAkashic()` / `openDreamBook()`.
- Keyboard accessible: `role="radiogroup"` + two `role="radio"` buttons, `aria-checked`, roving tabIndex, Arrow keys (←/→/↑/↓) switch sides and move focus.
- Test ids: `reading-toggle`, `reading-toggle-book`, `reading-toggle-akashic`.

### Mounts
- **AkashicView**: floating top bar, immediately left of the back button; own `AnimatePresence` keyed on `!scrolledDown` → fades with the letter chrome while reading (immersive).
- **DreamBookView reader**: in the top bar after the zoom buttons, `hidden md:block` (mobile bar stays uncluttered); disappears with the whole header when the reading `immersed` state hides chrome.
- **DreamBookView atelier (welcome)**: centered directly under the welcome prose, near the heading.

### 2. Book selection — no auto-select, deselect at will
- `age` / `tale` / `volume` initial state changed `"timeless"/"wonder"/"classic"` → `""` (nothing pre-selected on mount).
- `choose()` now toggles: selecting the active chip / menu item deselects it; selection may empty again.
- `ShapeMenu`: no longer falls back to `options[0]` display; shows italic serif placeholder **"Choose the tale"** when empty; menu items toggle.
- Final gate only: submit ("Channel the book") disabled until `topicDraft.trim()` **and** `(age || tale || volume)`; `channelBook` guards the same. Gentle ink-hand hint fades above the composer when text is typed with no thread held.
- No other minimum forced; `newDream` keeps the reader's own previous choices (still deselectable); `dreamResume` restore is an explicit user restore, untouched.
- Server safety confirmed: `/api/dream-book` maps empty strings to its `timeless`/`wonder`/`classic` fallbacks (`AGE_PLAN[age] ?? AGE_PLAN.timeless` etc.), so an empty shape can never break the weave.

### 3. Welcome screen — chat interface removed
- Removed: `lines` / `AtelierLine` state, `pushLine()`, `threadRef` + pin-to-bottom effect, the scrollback bubble list, and the `AtelierBubble` component; all `pushLine` call sites cleaned.
- The welcome line is now static ink prose: `ink-hand` Literata, 50 px drop-cap first letter, `max-w-[440px]`, under the hero's ✦ divider.
- Composer unchanged — typing + submit starts the channeling exactly as before.

## New i18n literal keys (English source; dictionaries NOT edited)
1. `"Reading worlds"` — ReadingToggle radiogroup aria-label
2. `"Book"` — ReadingToggle side label (no prior standalone `"Book"` key existed)
3. `"Choose the tale"` — ShapeMenu placeholder when nothing is selected
4. `"The loom waits for a thread — choose the reader, the tale, or the book below."` — composer gate hint

Reused existing keys (not new): `"Akashic"`, `"Welcome, keeper of wishes. Speak anything — a subject, a wish, a whole world — and the book begins."`

## Verification
- `bunx eslint` on the three owned files → **0 problems**.
- `bunx tsc --noEmit` → **no errors** in the three files.
- Full-repo `bun run lint` currently fails only in `src/components/mirror/EvolveMed.tsx` (parsing error — another agent's in-flight file; NOT touched per task constraints).
- Browser walk-through could not be executed: the auto-managed dev server was down during this session (port 3000 not listening; `dev.log` idle since 07:37 with all-200 entries). Verify on next boot: welcome = static prose + composer only; toggle in atelier / reader (md+; hides when immersed) / akashic (fades on scroll) switches worlds both ways; shapes start empty, toggle on/off freely; channel button held until one thread + text.

## Handoff notes for next agents
- `EvolveMed.tsx` parse error blocks full-repo lint — fix lands outside this task's scope.
- The 4 new literal keys above should be picked up by the next i18n dictionary sweep (all 7 dicts), exactly like the previous batches.
