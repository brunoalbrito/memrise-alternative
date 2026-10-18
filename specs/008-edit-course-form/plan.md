# Implementation Plan: Edit Course Form

**Branch**: `008-edit-course-form` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-edit-course-form/spec.md`

## Summary

Replace the "Edit Course" placeholder (`/course/:id/edit`) with a real page that reuses the
Create a Course form: same fields, hints, validation, help panel and look, pre-filled from the
course and saved with "Save Changes". The existing form and hook are generalized (initial values,
submit action, button label, success path) instead of copied. Edits to learner-created courses
update them in place. Edits to pre-loaded sample courses are stored as per-course overrides in
the persisted learner store and merged over the sample data. After saving, the app returns to the
course page. A new small `edit-course` feature owns the page; it reuses the form through the
`create-course` barrel. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Zustand 5.0.15 (`persist`),
Tailwind CSS 4.3.3. No new dependencies.

**Storage**: Browser `localStorage` through the existing `membetter.learner` store, extended with
`courseEdits` (overrides for sample courses). Learner-created courses are updated inside
`createdCourses`.

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Save-to-course-page is instant (local state)

**Constraints**: Same validation and messages as the create form (single source of truth); M3
tokens only; keyboard operable; layout works from 360 px; no libraries outside the stack

**Scale/Scope**: 1 new small feature module (2 files), edits to 9 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | `CourseForm` and `useCourseForm` are generalized, not duplicated; `EditCoursePage` is a thin page |
| III. Feature-scoped modules | Pass | New `features/edit-course` imports `home` and `create-course` through their barrels only. Neither imports `edit-course` |
| IV. Simplicity over abstraction | Pass | Reuse by parameters (initial values, submit callback, label, success path) rather than a new abstraction layer; the second use of the form is the trigger for generalizing it |
| V. Material Design 3 | Pass | Same M3 fields and filled button as the create form |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-edit-course-form/
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
├── app/router.tsx                                   # edit: /course/:id/edit → EditCoursePage
└── features/
    ├── edit-course/                                 # new feature module
    │   ├── index.ts                                 # exports EditCoursePage
    │   └── EditCoursePage.tsx
    ├── create-course/
    │   ├── index.ts                                 # edit: also export CourseForm, HelpPanel
    │   ├── components/CourseForm.tsx                # edit: props for initial values, submit, label
    │   └── hooks/useCourseForm.ts                   # edit: take initialValues, onSubmit, successPath
    │   └── CreateCoursePage.tsx                     # edit: pass create-mode props
    └── home/
        ├── index.ts                                 # edit: export draftFromCourse
        ├── model/
        │   ├── types.ts                             # edit: CourseEdit type
        │   └── draft.ts                             # new: draftFromCourse(course)
        ├── data/sampleCourses.ts                    # edit: language fields on each sample course
        ├── store/learnerStore.ts                    # edit: courseEdits, updateCourse
        └── hooks/useAllCourses.ts                   # edit: merge courseEdits over samples
```

**Structure Decision**: A tiny `edit-course` feature holds the page. The form is shared by
parameters, and course data rules (drafts, edits, merging) stay in `home`, which owns courses.

## Complexity Tracking

No constitution violations to justify.
