# Implementation Plan: Edit Course Button

**Branch**: `007-edit-course-button` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-edit-course-button/spec.md`

## Summary

Show the existing "Edit Course" link on every course page, not only on learner-created courses,
and make it meet the spec's touch-target and double-press rules. The link keeps opening the
existing "Edit Course" placeholder (`/course/:id/edit`). No new route, data or dependency.
This supersedes the visibility rule of the Course Detail View spec (FR-015 and User Story 5,
"only for learner-created courses").

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Tailwind CSS 4.3.3. No new
dependencies.

**Storage**: N/A

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: N/A

**Constraints**: M3 tokens only; keyboard operable; 48 px touch target on phone widths

**Scale/Scope**: 3 files, small edits

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Edits stay inside existing components |
| III. Feature-scoped modules | Pass | Change stays inside `features/course-detail` |
| IV. Simplicity over abstraction | Pass | Removes a condition and an unused field |
| V. Material Design 3 | Pass | Text button with icon, token colors, focus ring |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/007-edit-course-button/
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
src/features/course-detail/
├── CourseDetailPage.tsx                  # edit: always pass the edit link
├── hooks/useCourseDetail.ts              # edit: drop the unused isOwn field from the result
└── components/LevelsSection.tsx          # edit: link always shown, 48 px target, double-press guard
```

**Structure Decision**: Edit in place inside the course-detail feature.

## Complexity Tracking

No constitution violations to justify.
