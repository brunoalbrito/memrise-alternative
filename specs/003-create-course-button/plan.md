# Implementation Plan: Create Course Button

**Branch**: `003-create-course-button` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-create-course-button/spec.md`

## Summary

Add an always-visible "Create a course" button to the Home page header row. Pressing it opens
the existing "coming soon" placeholder at a new `/courses/new` route, titled "Create a course".
No data is created or stored. The button is a Material Design 3 filled button built from the
existing shared `Button`, styled with project tokens (not the green from the reference image),
and guarded against double activation.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Tailwind CSS 4.3.3. No new
dependencies.

**Storage**: N/A (no data created or persisted)

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Navigation to the placeholder is instant (client-side route change)

**Constraints**: M3 tokens only, no hard-coded colors; keyboard operable with visible focus;
minimum 48 px touch target on phone widths; no libraries outside the constitution stack

**Scale/Scope**: 1 new component, 1 new route, 2 edited files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | One self-contained `CreateCourseButton` component |
| III. Feature-scoped modules | Pass | Button lives in `features/home`; the route reuses `features/placeholder` through its barrel |
| IV. Simplicity over abstraction | Pass | No new abstractions; reuses `Button` and `ComingSoonPage` |
| V. Material Design 3 | Pass | Filled button per M3 spec with token colors, states and focus ring |
| Tech stack | Pass | No new library |
| Workflow / a11y | Pass | Native `<button>`, keyboard operable |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-create-course-button/
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
│   └── router.tsx                                 # edit: add /courses/new
└── features/
    └── home/
        ├── HomePage.tsx                           # edit: render button in header row
        └── components/
            └── CreateCourseButton.tsx             # new
```

**Structure Decision**: Extend the existing Home feature. No new folders or modules.

## Complexity Tracking

No constitution violations to justify.
