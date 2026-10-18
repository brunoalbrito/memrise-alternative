---

description: "Task list for Edit Course Form"
---

# Tasks: Edit Course Form

**Input**: Design documents from `/specs/008-edit-course-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature reuses the create form (`features/create-course`), the learner store, `TopAppBar`, `useCourseDetail` and the existing "Edit Course" link from features 004, 005 and 007.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US3)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V).
- No new dependencies. Cross-feature imports go through the feature's `index.ts` barrel: `edit-course` imports from `../home`, `../create-course` and `../course-detail`; `home` and `create-course` never import `edit-course`.
- Validation rules and messages are NOT duplicated: always reuse `validateCourseForm` in `src/features/create-course/model/validation.ts`.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] In `src/features/home/model/types.ts` add `CourseEdit` with all-optional fields `title`, `teachingLanguageId`, `speakersLanguageId`, `tags`, `description`, `shortDescription`, `categoryId` and constraint comments verbatim from data-model.md: title "Trimmed, 3 to 100 characters"; tags "At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates"; description "At most 2000 characters"; shortDescription "At most 100 characters"; categoryId "Set to `lang-<teachingLanguageId>` only when the teaching language changed; otherwise the course's current category".
- [x] T002 [P] In `src/features/home/data/sampleCourses.ts` add `teachingLanguageId` and `speakersLanguageId` to every sample course exactly as in the data-model.md table: `english-visual-dictionary`, `irregular-verbs`, `english-polyglot` and `empty-course` use `en-gb` / `en-gb`; `japanese-hiragana` and `japanese-n5-vocab` use `ja` / `en-gb`; `spanish-mexico-basics` uses `es-mx` / `en-gb`; `networking-fundamentals` uses `en-us` / `en-us`. All ids must exist in `src/features/home/data/languages.ts`.
- [x] T003 [P] Create `src/features/home/model/draft.ts` exporting `draftFromCourse(course: Course): CourseDraft`: `name` = `course.title`; `teachingLanguageId` = `course.teachingLanguageId ?? ""`; `speakersLanguageId` = `course.speakersLanguageId ?? DEFAULT_SPEAKERS_LANGUAGE_ID` (import from `../data/languages`); `tagsInput` = `course.tags?.join(", ") ?? ""`; `description` = `course.description ?? ""`; `shortDescription` = `course.shortDescription ?? ""`.
- [x] T004 Update `src/features/home/store/learnerStore.ts`: add `courseEdits: Record<string, CourseEdit>` (initial `{}`) and an exported `class CourseNotFoundError extends Error`. Add `updateCourse(id: string, draft: CourseDraft): void`: find the course in `createdCourses` or in `sampleCourses` (a sample id that is in `removedCourseIds` counts as missing); if missing throw `new CourseNotFoundError()`. Compute `title` = `draft.name.trim()`, `tags` = `parseTags(draft.tagsInput)` (undefined when empty), `description` and `shortDescription` trimmed (empty becomes `undefined`), `categoryId` = `lang-<draft.teachingLanguageId>` if `draft.teachingLanguageId` differs from the course's current `teachingLanguageId`, otherwise the course's current `categoryId` (for a sample course the current value is `courseEdits[id]?.categoryId ?? sample.categoryId`). For a created course replace those fields (plus `teachingLanguageId`, `speakersLanguageId`) inside `createdCourses`; for a sample course write `courseEdits[id]` with those fields. Never touch `id`, counts, `teaching`, goals. Update `removeCourse` so removing a sample course also deletes `courseEdits[id]`. `restoreCourses` does not clear edits. Add `courseEdits` to `partialize`; in `merge` take `saved.courseEdits ?? {}` and drop entries whose id is not a sample id or whose language ids are not in the language list. Keep `version: 1`. Depends on T001.
- [x] T005 Update `src/features/home/hooks/useAllCourses.ts`: `useAllCourses()` returns each `sampleCourses` item spread with `courseEdits[item.id]` (if any), followed by `createdCourses`, memoized on `courseEdits` and `createdCourses`. Depends on T004.
- [x] T006 Update `src/features/home/index.ts` to also export `draftFromCourse` (from `./model/draft`), `CourseNotFoundError` (from `./store/learnerStore`) and the type `CourseEdit`. Depends on T003, T004.

**Checkpoint**: `pnpm typecheck` passes; Home and course pages still show the same data; editing is not wired yet.

---

## Phase 2: User Story 1 - Edit a course with the same form (P1) 🎯 MVP

**Goal**: "Edit Course" opens a page with the create form pre-filled; "Save Changes" saves and returns to the course page showing the new values.

**Independent Test**: Quickstart scenarios 1 to 4, 8 and 9: open "English Visual Dictionary", edit the name, save; course page and Home show it, also after reload; changing Teaching moves the course to the new language category; a created course round-trips tags and description; double-save opens one page.

- [x] T007 [US1] Generalize `src/features/create-course/hooks/useCourseForm.ts` to `useCourseForm({ initialValues, onSubmit, successPath }: { initialValues: CourseDraft; onSubmit: (values: CourseDraft) => void; successPath: string })`. Use `initialValues` as the initial `values` state (remove the hard-coded empty draft and the direct `addCourse` call). In `submit`: keep validation, first-invalid focus, the storage probe, and the double-submit guard; call `onSubmit(values)` inside the existing try/catch; on `CourseNotFoundError` (import from `../../home`) call `navigate(successPath)` and return (the destination shows "Course not found"); on any other error keep the existing behavior (reset the guard, show "Could not save your course on this device. Please try again."); on success `navigate(successPath)`. Name still receives focus on mount.
- [x] T008 [US1] Generalize `src/features/create-course/components/CourseForm.tsx` to props `{ initialValues: CourseDraft; onSubmit: (values: CourseDraft) => void; successPath: string; submitLabel: string }` passed to `useCourseForm`, with the button text `{submitLabel}`. Update `src/features/create-course/CreateCoursePage.tsx` to render `<CourseForm initialValues={emptyDraft} onSubmit={(v) => { useLearnerStore.getState().addCourse(v); }} successPath="/" submitLabel="Create Course" />` where `emptyDraft` is `{ name: "", teachingLanguageId: "", speakersLanguageId: DEFAULT_SPEAKERS_LANGUAGE_ID, tagsInput: "", description: "", shortDescription: "" }` (imports from `../home`). Update `src/features/create-course/index.ts` to export `CreateCoursePage`, `CourseForm` and `HelpPanel`. The create page must behave exactly as before. Depends on T007.
- [x] T009 [US1] Create `src/features/edit-course/EditCoursePage.tsx` and `src/features/edit-course/index.ts` (exports `EditCoursePage`). The page reads `id` from `useParams`, gets the course through `useCourse(id)` and the removed ids from `useLearnerStore` (a missing or removed course renders the not-found state of T011). Otherwise render `<TopAppBar />` and `<main>` with the same container and grid as the create page: h1 "Edit Course", a "Back to course" link to `/course/${id}` (T011 styles it), `<CourseForm key={course.id} initialValues={draftFromCourse(course)} onSubmit={(v) => useLearnerStore.getState().updateCourse(course.id, v)} successPath={`/course/${course.id}`} submitLabel="Save Changes" />` and `<HelpPanel />`. In `src/app/router.tsx` replace the `/course/:id/edit` element (`<CoursePlaceholder title="Edit Course" />`) with `<EditCoursePage />` imported from `../features/edit-course`. Depends on T005, T006, T008.

**Checkpoint**: US1 works alone (edit, save, see changes on course page and Home, reload).

---

## Phase 3: User Story 2 - Same validation and feedback (P1)

**Goal**: Identical rules and messages to creation, including on pre-filled values.

**Independent Test**: Quickstart scenario 5.

- [x] T010 [US2] Verify and fix in `src/features/create-course/hooks/useCourseForm.ts` and `src/features/edit-course/EditCoursePage.tsx` that the edit page uses the shared `validateCourseForm` unchanged: clearing Name shows "Enter a name for your course." beside Name with focus on Name and nothing saved; the limits "Name must be 3 to 100 characters after trimming", "Short description at most 100", "Description at most 2000" and "at most 10 tags of at most 30 characters each" are enforced; errors clear as fields become valid; the storage failure message "Could not save your course on this device. Please try again." appears and the course keeps its old values; saving with no changes succeeds. Fix only if a deviation is found. Depends on T009.

---

## Phase 4: User Story 3 - Leave without saving (P2)

**Goal**: Safe exit and not-found handling.

**Independent Test**: Quickstart scenarios 6 and 7.

- [x] T011 [US3] In `src/features/edit-course/EditCoursePage.tsx` style the "Back to course" link like the create page's "Back to Home" link (`text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`) so it discards unsaved changes by navigating to `/course/${id}`; and render, for an unknown or removed course, the top app bar plus a centered h1 "Course not found" and a "Back to Home" link to `/` (same markup as the not-found state in `src/features/course-detail/CourseDetailPage.tsx`). Depends on T009.

---

## Phase 5: Polish & Cross-Cutting

- [x] T012 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors. Also search `src` to confirm `edit-course` imports only from `../home`, `../create-course` and `../course-detail` barrels, and that the create page still creates courses as before.
- [ ] T013 Walk through every scenario in `specs/008-edit-course-form/quickstart.md` in the browser (`pnpm dev`) and fix any deviation, including the create page regression check (create a course, see it on Home).

---

## Dependencies & Execution Order

- Phase 1: T001, T002 and T003 are independent and can run together; T004 needs T001; T005 needs T004; T006 needs T003 and T004.
- US1: T007 then T008 (same hook and form files) then T009. US2 (T010) and US3 (T011) need T009.
- `useCourseForm.ts` is edited by T007 and T010, `EditCoursePage.tsx` by T009, T010 and T011, so those tasks run in sequence.

## Parallel Opportunities

- Phase 1: T001, T002, T003 together.
- After T009: T010 and T011 touch different concerns of the same page, so run them in sequence to avoid conflicts.

## Implementation Strategy

- **MVP**: Phase 1 and US1 (T001 to T009): a working edit page. US2 and US3 are mostly inherited from reuse; T010 and T011 verify and finish them.
- Stop after Phase 1 and after US1, run `pnpm typecheck`, then finish with Polish.
