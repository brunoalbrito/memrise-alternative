# Implementation Plan: Fix Course Options Menu Overlap

**Branch**: `006-fix-menu-overlap` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-fix-menu-overlap/spec.md`

## Summary

The Home course card options menu is drawn behind the card's action buttons (and behind the next
card's controls). Cause: the card layering added in feature 005 (stretched title link) gives the
options container and the bottom button row the same `z-10`. Each becomes its own stacking
context, so the menu's `z-20` is trapped inside the first one and the later `z-10` row paints on
top. Fix: remove the `z-10` from both wrappers. They only need `relative`, because they come
later in the document than the stretched link, so they already paint above its overlay without
creating a stacking context. The menu's own `z-20` then competes in the page's stacking context
and wins over all card content.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, Tailwind CSS 4.3.3. No new dependencies.

**Storage**: N/A

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: N/A

**Constraints**: Styling change only; no behavior, data or API change

**Scale/Scope**: 1 file, 2 class strings

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Change stays inside `CourseCard` |
| III. Feature-scoped modules | Pass | Change stays inside `features/home` |
| IV. Simplicity over abstraction | Pass | Removes two classes; adds nothing |
| V. Material Design 3 | Pass | Menu elevation and layering follow M3 (menus sit above surrounding content) |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-fix-menu-overlap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/home/components/CourseCard.tsx    # edit: drop z-10 from two wrappers
```

**Structure Decision**: One-file styling fix in the existing Home feature.

## Complexity Tracking

No constitution violations to justify.
