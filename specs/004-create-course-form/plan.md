# Implementation Plan: Create Course Form

**Branch**: `004-create-course-form` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-create-course-form/spec.md`

## Summary

Replace the "Create a course" placeholder with a real "Create a Course" page: a validated form
(Name, Teaching, For, Tags, Description, Short description) beside a help side panel. A valid
submit adds a learner-created course to the persisted learner store and returns to Home, where
it appears like any other course (0 items, "Learn new words", "Teaching" filter, a category named
after its Teaching language). Built in a new `create-course` feature module that depends on the
`home` feature only through its public barrel. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Zustand 5.0.15 (`persist`),
Tailwind CSS 4.3.3. No new dependencies.

**Storage**: Browser `localStorage` through the existing `membetter.learner` Zustand store,
extended with a `createdCourses` list. A write probe before submit detects unavailable storage.

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Submit-to-Home is instant (local state); validation feedback on submit
with no perceptible delay

**Constraints**: M3 tokens only (outlined text fields, filled button); keyboard operable;
screen-reader labels, hints and errors associated with fields; layout works from 360 px; no
libraries outside the constitution stack (no form or validation library)

**Scale/Scope**: 1 new feature module (~8 files), 1 new route plus 1 help route, edits to 6
existing files in `home`, `placeholder` and `app`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Small components (`TextField`, `SelectField`, `TextAreaField`, `CourseForm`, `HelpPanel`); validation in a pure module, form state in one hook |
| III. Feature-scoped modules | Pass | New `features/create-course`. It imports `home` only through `features/home/index.ts` (store action, language list). `home` does not import `create-course` |
| IV. Simplicity over abstraction | Pass | No form library; the three field components are used by 6 fields. Language list is plain data. No generic validation framework |
| V. Material Design 3 | Pass | M3 outlined text fields, filled button, token colors, error state per M3 |
| Tech stack | Pass | Plain React state, Zustand `persist`, React Router |
| Workflow / a11y | Pass | Native form controls, `aria-invalid`, `aria-describedby`, focus management |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-create-course-form/
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
│   └── router.tsx                          # edit: /courses/new → CreateCoursePage; add help route
└── features/
    ├── create-course/                      # new feature module
    │   ├── index.ts                        # exports CreateCoursePage
    │   ├── CreateCoursePage.tsx
    │   ├── components/
    │   │   ├── CourseForm.tsx
    │   │   ├── TextField.tsx
    │   │   ├── TextAreaField.tsx
    │   │   ├── SelectField.tsx
    │   │   └── HelpPanel.tsx
    │   ├── hooks/
    │   │   └── useCourseForm.ts            # values, errors, submit, double-submit guard
    │   └── model/
    │       └── validation.ts               # validateCourseForm, parseTags (pure)
    ├── home/
    │   ├── index.ts                        # edit: export useCourse, languages, useLearnerStore
    │   ├── data/
    │   │   ├── languages.ts                # new: language list + category-for-language
    │   │   └── sampleCourses.ts            # edit: getCategoryById also resolves language categories
    │   ├── model/types.ts                  # edit: Language, CourseDraft, optional Course fields
    │   ├── store/learnerStore.ts           # edit: createdCourses, addCourse, delete-on-remove
    │   └── hooks/
    │       ├── useAllCourses.ts            # new: sample + created courses
    │       └── useFilteredCourses.ts       # edit: use all courses and all categories
    └── placeholder/
        └── CoursePlaceholder.tsx           # edit: look up the course through useCourse
```

**Structure Decision**: A separate `create-course` feature owns the page and form logic. Course
storage and language data stay in `home`, which already owns courses, and are exposed through its
barrel.

## Complexity Tracking

No constitution violations to justify.
