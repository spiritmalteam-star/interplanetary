# ReflectMe visual and UX audit — Stage A (source level)

**Status of this document.** This is a *source-level* audit. It was written in an environment that could neither reach the live site nor run the app, so **nothing below was seen on a screen.** Findings are counts and facts from the code; anything about how a screen *looks* is marked *unverified* and must be confirmed with `tests/visual/qa-matrix.py` against a Vercel preview.

## What the code already does well (verified in source)
- **Frame law.** `html, body { overflow: hidden }`; each view scrolls internally, so there is no page scroll to fight (`globals.css`).
- **Viewport units.** A `--vh-safe` variable falls back to `100vh` and uses `100dvh` where supported; `dvh`/`svh` appear 19 times, raw `100vh` only 4 times (toast, SideRail, one keyframe, the fallback itself).
- **Safe areas.** `safe-area-inset` is handled in 32 places.
- **Motion.** `prefers-reduced-motion` / `useReducedMotion` / `motion-reduce` appear in 97 places.
- **Fonts.** Loaded with `next/font` (self-hosted, preloaded) in `app/layout.tsx`.
- **Images.** All 55 `<img>` tags carry `alt`; 30 of 55 already set `loading=`.

## Findings

| # | Area | Finding (evidence) | Status |
|---|---|---|---|
| 1 | Accessibility | `outline-none` is used 104 times; 47 of them have no focus replacement on the same line, and there was no global focus baseline. Keyboard users could not see where they were. | **Fixed here** (keyboard-only ring in `globals.css`; tested in a browser on a synthetic page: ring on keyboard focus, none on mouse click, beats `outline-none`). Real pages unverified. |
| 2 | Performance | 25 of 55 `<img>` have no `loading=` and only 4 set `decoding=`; only 1 has `width`+`height` (layout-shift risk). | Not changed: some may be above the fold (LCP) or read by canvas/PDF code; needs per-image review. |
| 3 | Performance | `framer-motion` is imported in 55 files; `backdrop-blur`/`backdrop-filter` appears 88 times. Blur is expensive on low-end phones. | Unverified; needs profiling on a mid-range Android. |
| 4 | Bundle / re-render | Very large client components: `BranchCanopy.tsx` 7,801 lines, `mirror-store.ts` 5,933, `DreamBookView.tsx` 5,228, `LightCodesView.tsx` 2,938. One zustand store drives all rooms. | Not changed; splitting is a Phase-5/9 refactor. |
| 5 | Design system | shadcn/ui has 48 component files but only 25 files import it; The Gathering uses its own tokens (`GP_CARD`, `GP_HAND`, `GP_INPUT`) and its own modal shell. Two parallel systems. | Not changed; consolidate by extraction, not replacement. |
| 6 | Duplication | Near-identical buttons/tabs/loaders across rooms (`EmCopyButton`/`PxCopyButton`/`RoomCopyButton`, `EmPdfButton`/`PxPdfButton`, several loading screens). | Not changed. |
| 7 | Dead code | 8 components have zero importers (`MirrorOS`, `ArtX`, `ParticleX`, `EvolveMed`, `InventView`, `GatheringView`, `ProfileModal`, `CreationRoom`). | Not removed (needs your approval). |
| 8 | Build quality | `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `reactStrictMode: false`, so type and double-render problems are hidden. | Not changed. |
| 9 | Touch targets, overflow, layout at 320–2560px | **Unknown.** No rendering was possible. | Run the QA matrix (below). |

## The verification tool: `tests/visual/qa-matrix.py`
Loads every room (`?room=` keys from `UrlRooms.tsx`) at the 14 widths from the directive and records, per cell: elements overflowing the viewport, containers that scroll sideways, uncaught JS errors, touch targets under 44px, and a screenshot. Writes `results.json`, `matrix.md` and `screenshots/`.

It was tested only against a synthetic page with planted defects (a clipped element: not flagged; a real overflow, a sideways-scrolling frame, a 20px button and a thrown error: all flagged; a clean width: reported clean). **It has not been run against ReflectMe.**

```
pip install playwright && playwright install chromium
python3 tests/visual/qa-matrix.py --base https://<preview-url> --out qa-out
# signed-in rooms:  --state state.json      protected previews: --header "x-vercel-protection-bypass: <secret>"
```

## Proposed order (each its own reviewed PR, after the matrix gives a baseline)
1. **Baseline:** run the matrix on the preview, commit the matrix and screenshots as the "before".
2. **Tokens and primitives:** one source for radius, spacing, type scale, durations; make the Gathering tokens aliases of the shared ones.
3. **Buttons and toolbars:** a single button hierarchy (primary / secondary / icon-with-label); fold duplicated copy/PDF buttons into shared components.
4. **Room-by-room composition** driven by the matrix findings, smallest-visible-defect first.
5. **Performance:** per-image loading review, blur budget on mobile, lazy-load heavy rooms, measure LCP/INP/CLS with a real tool before and after.
