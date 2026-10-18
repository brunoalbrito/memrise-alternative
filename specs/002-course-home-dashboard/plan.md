# Implementation Plan: Course Home Dashboard

**Branch**: `002-course-home-dashboard` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-course-home-dashboard/spec.md`

## Summary

Build the Home screen as a frontend-only prototype on the existing scaffold: a course list with
progress, stats, one primary action per course, a single-select filter menu, a per-course options
menu (daily goal, remove), top navigation, and "coming soon" placeholder routes for sessions,
Courses, Groups, levels and profile. Courses are bundled sample data. Learner state (goals,
removed courses) is persisted to the browser via Zustand's `persist` middleware. UI follows
Material Design 3 via tokens declared in the Tailwind theme.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Zustand 5.0.15 (incl. `persist`
middleware), Tailwind CSS 4.3.3. No new dependencies.

**Storage**: Browser `localStorage` via Zustand `persist` (key `membetter.learner`, versioned).
Sample courses are static modules, not persisted.

**Testing**: None for this version (constitution v2.0.0). Validation is manual via
[quickstart.md](./quickstart.md) plus `pnpm typecheck`, `pnpm lint` and `pnpm build`.

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Filter change visible <1s with up to 100 courses (SC-003); list rendered
<2s (SC-005). Sample data is local, so both are trivially met.

**Constraints**: Material Design 3 tokens only (no hard-coded colors); light and dark schemes;
keyboard accessible; WCAG 2.1 AA baseline; no libraries outside the constitution stack (so no
`@material/web`, no icon or menu libraries).

**Scale/Scope**: ~8 sample courses, 6 routes (1 real, 5 placeholder), ~12 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | Existing scaffold, TypeScript strict |
| II. Component-first | Pass | Small self-contained components, Tailwind utilities; filter/menu logic in hooks |
| III. Feature-scoped modules | Pass | `features/home` and `features/placeholder`, each with an `index.ts` barrel; no cross-feature deep imports |
| IV. Simplicity over abstraction | Pass | One store, plain selector functions, no generic menu or design-system layer |
| V. Material Design 3 | Pass | Tokens in `@theme`, M3 components built to spec (cards, filled/tonal/icon buttons, menus, progress indicator, top app bar); dark scheme included |
| Tech stack | Pass | Zustand `persist` ships with Zustand; no new package |
| Workflow / a11y | Pass | Keyboard-navigable menus with ARIA roles |

Post-design re-check: still Pass (see Complexity Tracking, empty).

## Project Structure

### Documentation (this feature)

```text
specs/002-course-home-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx                 # adds placeholder + session routes
│   └── theme/                     # M3 token CSS (imported by index.css)
├── shared/
│   ├── store/appStore.ts          # existing
│   └── ui/                        # M3 primitives reused by 2+ features (Button, IconButton, Menu)
└── features/
    ├── home/
    │   ├── index.ts
    │   ├── HomePage.tsx
    │   ├── components/            # TopAppBar, FilterMenu, CourseCard, ProgressBar, GoalRing,
    │   │                          # CourseStats, CourseOptionsMenu, GoalDialog, EmptyState
    │   ├── hooks/                 # useFilteredCourses, useFilterMenu
    │   ├── data/sampleCourses.ts
    │   ├── model/                 # types.ts, selectors.ts (percent, primary action, categories)
    │   └── store/learnerStore.ts  # persisted goals + removed course ids + active filter
    └── placeholder/
        ├── index.ts
        └── ComingSoonPage.tsx     # names destination, back-to-Home link
```

**Structure Decision**: Single frontend SPA, feature-scoped. The placeholder screen is its own
feature because five routes share it. `shared/ui` is created only for primitives needed by both
features (buttons, menu).

## Complexity Tracking

No constitution violations to justify.
