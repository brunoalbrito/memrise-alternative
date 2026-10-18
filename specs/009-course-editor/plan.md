# Implementation Plan: Course Editor

**Branch**: `009-course-editor` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-course-editor/spec.md`

## Summary

Add a course editor at `/course/:id/edit` with an "Editing" bar (Levels, Databases, Contributors,
Details, Back to Course). "Create Course" now ends in the editor and the "Edit Course" link opens
it. The Levels tab manages levels (add, rename, tested-line, show/hide, preview, duplicate, delete)
and a words table (Word, Images, Audio, Meaning, Example) with real image and audio import from the
computer. Words and levels become the source of truth for course word counts. Levels and words
are stored in the persisted learner store as text; imported files are stored as blobs in the
browser's IndexedDB (built into browsers, no library). The earlier edit-details form becomes the
Details tab and the `edit-course` feature module is folded into the new `course-editor` module.
Sample courses get fixed sample levels and words.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Zustand 5.0.15 (`persist`),
Tailwind CSS 4.3.3. No new dependencies (IndexedDB, File API and Object URLs are browser APIs).

**Storage**: Levels, words and media metadata in `localStorage` through the existing
`membetter.learner` store (new `courseLevels`). Media blobs in IndexedDB database
`membetter-media`, object store `files`, keyed by media id.

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Row edits reflect immediately; importing a file up to 3 MB completes
within 1 second on a typical computer

**Constraints**: Images up to 2 MB and audio up to 3 MB each, at most 5 of each per word;
M3 tokens only; keyboard operable; layout works from 360 px; no libraries outside the stack

**Scale/Scope**: 1 new feature module (~20 files), 1 shared media module, replaces 1 feature
module, edits to ~12 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Small components (`EditorShell`, `LevelEditor`, `WordRow`, `MediaCell`, `DetailsTab`); pure level operations in a model module; media access in hooks |
| III. Feature-scoped modules | Pass | New `features/course-editor` imports `home`, `create-course` and `course-detail` only through barrels. `shared/media` and `shared/storage` hold code needed by two features. `edit-course` is removed, its page folds into `course-editor` |
| IV. Simplicity over abstraction | Pass | Pure array operations instead of a state framework; one IndexedDB wrapper of ~4 functions; refcount-free media cleanup by diffing referenced ids |
| V. Material Design 3 | Pass | M3 tabs/links, filled and text buttons, outlined fields, dialogs, token colors; level header bars use tokens |
| Tech stack | Pass | IndexedDB is a browser API, not a library |
| Workflow / a11y | Pass | Real table semantics, labelled inputs, dialogs via native `<dialog>`, `aria-live` messages |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/009-course-editor/
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
├── app/router.tsx                                   # edit: editor routes; remove old edit route
├── shared/
│   ├── media/mediaStore.ts                          # new: IndexedDB put/get/delete for blobs
│   └── storage/storageWritable.ts                   # new: localStorage write probe (moved from the form hook)
└── features/
    ├── course-editor/                               # new feature module (replaces edit-course)
    │   ├── index.ts                                 # exports CourseEditorPage
    │   ├── CourseEditorPage.tsx                     # shell + tab routing + not found
    │   ├── components/
    │   │   ├── EditorHeader.tsx                     # title, created by, Editing bar, Back to Course
    │   │   ├── LevelsTab.tsx                        # toolbar, level list, empty state
    │   │   ├── LevelEditor.tsx                      # level header bar, tested line, words table
    │   │   ├── WordRow.tsx
    │   │   ├── MediaCell.tsx                        # upload / record / count dropdown
    │   │   ├── DeleteLevelDialog.tsx
    │   │   ├── DetailsTab.tsx                       # create form pre-filled, Save Changes
    │   │   └── TabPlaceholder.tsx                   # Databases / Contributors
    │   ├── hooks/
    │   │   ├── useLevels.ts                         # levels of a course + save helpers
    │   │   └── useMediaUrl.ts                       # object URL for a media id
    │   └── model/
    │       ├── levelOps.ts                          # pure add/rename/duplicate/delete level, word ops, media ops
    │       └── mediaRules.ts                        # validateMediaFile (types, sizes, counts)
    ├── edit-course/                                 # removed
    ├── create-course/
    │   ├── components/CourseForm.tsx                # edit: onSubmit may return the path to open
    │   ├── hooks/useCourseForm.ts                   # edit: use shared storageWritable, path from onSubmit
    │   └── CreateCoursePage.tsx                     # edit: open the editor after creating
    ├── course-detail/
    │   ├── hooks/useCourseDetail.ts                 # edit: levels come from stored levels
    │   ├── model/levels.ts                          # edit: levelViews replaces buildLevels
    │   ├── data/sampleCourseExtras.ts               # edit: drop levelNames, fix counts
    │   └── components/LevelsSection.tsx             # edit: Edit Course link target stays /course/:id/edit
    └── home/
        ├── data/sampleLevels.ts                     # new: sample levels and words per sample course
        ├── data/sampleCourses.ts                    # edit: counts derived from sample levels
        ├── model/types.ts                           # edit: MediaRef, Word, CourseLevel
        ├── model/counts.ts                          # new: countsFromLevels
        ├── store/learnerStore.ts                    # edit: courseLevels, setCourseLevels, media cleanup
        ├── hooks/useAllCourses.ts                   # edit: counts derived from levels
        ├── hooks/useCourseLevels.ts                 # new
        └── index.ts                                 # edit: exports
```

**Structure Decision**: One new `course-editor` feature owns the editor UI and level/word logic.
Course data (levels, words, counts) stays in `home`, which owns courses. Browser-storage
helpers live in `shared/` because the create form and the editor both need them.

## Complexity Tracking

No constitution violations to justify.
