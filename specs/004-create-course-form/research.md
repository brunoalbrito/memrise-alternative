# Research: Create Course Form

## R1. Where created courses live
- **Decision**: Add `createdCourses: Course[]` to the persisted `useLearnerStore`
  (`membetter.learner`, version stays 1; a missing field hydrates as `[]`). The Home list is
  `sampleCourses` plus `createdCourses`, minus `removedCourseIds`.
- **Rationale**: One store, one persistence key, already tested path. Spec FR-008 and SC-003
  need creation and reload persistence only.
- **Alternatives**: Separate store and key (two sources of truth for one list); persisting
  samples too (unneeded, samples are static).

## R2. Removing a learner-created course
- **Decision**: `removeCourse` on a created course deletes it from `createdCourses` and its goal.
  Removing a sample course still hides it through `removedCourseIds`. "Restore sample courses"
  restores only samples.
- **Rationale**: FR-009 requires removal through the existing action. Hiding a created course
  would leave dead data and could never be restored by a "samples" button.
- **Alternatives**: Hide created courses like samples (confusing restore semantics).

## R3. Categories for created courses
- **Decision**: Category id is `lang-<languageId>` and name/icon come from the language list.
  `getCategoryById` resolves sample categories first, then language categories. The Home filter
  builds its list from sample categories plus language categories, keeping only those with a
  visible course (existing `availableCategories`).
- **Rationale**: FR-008 says the course gets a category named after its Teaching language,
  created if absent. Deriving categories from the language list means nothing extra is
  persisted and an empty category disappears by itself.
- **Alternatives**: Persist categories (extra state to keep consistent).

## R4. Language list
- **Decision**: Static data in `features/home/data/languages.ts`, entries `{ id, name, icon }`:
  English (UK), English (US), Spanish (Mexico), Japanese, Portuguese (Brazil), French (France),
  German, Italian. Used for both Teaching and For.
- **Rationale**: FR-005 requires one shared list with at least five entries. It sits in `home`
  because both Home (categories) and the form need it.
- **Alternatives**: Duplicate lists per feature (drift); `Intl.DisplayNames` (no control over
  labels like "Spanish (Mexico)").

## R5. Form state and validation
- **Decision**: Plain React state in `useCourseForm` and a pure `validateCourseForm(values)`
  returning `{ field: message }`. Native `<form noValidate>` so the app controls messages.
  Validation runs on submit and re-runs on change for fields that currently show an error, so
  errors clear as soon as they are fixed (User Story 2, scenario 4).
- **Rationale**: Six fields do not justify a form library (Principle IV, and no new library).
  A pure function is easy to reason about against FR-003 and FR-004.
- **Alternatives**: React Hook Form / Zod (new dependencies, need an amendment).

## R6. Validation rules
- **Decision**, verbatim from FR-003 and FR-004: Name and Teaching required; Name 3 to 100
  characters after trimming; Short description at most 100; Description at most 2000; Tags
  comma-separated, trimmed, empty entries dropped, case-insensitive duplicates removed, at most
  10 tags of at most 30 characters each. Over-limit values are rejected, never truncated.
- **Rationale**: Edge cases in the spec (spaces-only names, trimmed tags, long pasted text).
- **Alternatives**: `maxLength` attributes (silently cut pasted text, violating the edge case).

## R7. Focus management
- **Decision**: Name gets focus on mount through `useEffect` and a ref. On a failed submit the
  handler focuses the first invalid field using refs keyed by field name, in form order.
- **Rationale**: FR-007 and FR-011. Focus calls in event handlers and an effect are lint-safe.
- **Alternatives**: `autoFocus` attribute (not announced consistently, no control on submit).

## R8. Double-submit guard
- **Decision**: A `useRef` flag set in the submit handler before `addCourse`; later submits are
  ignored. The page unmounts on navigation, so the flag needs no reset. If creation fails, the
  flag is reset so the learner can retry.
- **Rationale**: FR-010; same pattern as the Create Course button (feature 003).

## R9. Storage unavailable
- **Decision**: Before creating, probe storage with a set/remove of a throwaway key inside
  try/catch. On failure show "Could not save your course on this device. Please try again." in
  an alert region above the button and do not add the course.
- **Rationale**: Zustand `persist` updates in-memory state before writing, so a failed write
  would show a course that is lost on reload. The probe keeps the spec's "not shown as created"
  rule.
- **Alternatives**: Catch around `set` (state already changed); ignore (violates the edge case).

## R10. Layout and M3 components
- **Decision**: CSS grid, one column by default and `lg:grid-cols-[minmax(0,1fr)_20rem]` for form
  plus side panel. Labels above fields on narrow widths and in a left column on wide screens
  (as in the reference). M3 outlined text field look: 1 px outline, primary 2 px on focus, error
  token on invalid, supporting text below. Submit is the shared filled `Button`.
- **Rationale**: FR-014, SC-005. The shared `Button` and tokens already exist.

## R11. Help link
- **Decision**: "Course Creation knowledge base" is a router `Link` to `/help/course-creation`,
  rendered by `ComingSoonPage` with title "Course Creation knowledge base".
- **Rationale**: FR-012 requires a placeholder with a way back; reuses an existing screen.

## R12. Looking up a created course on other screens
- **Decision**: Replace the static `getCourseById` lookup in `CoursePlaceholder` with a
  `useCourse(id)` hook that searches sample plus created courses. The `home` barrel exports
  `useCourse` instead of `getCourseById`.
- **Rationale**: Review, learn and levels placeholders must name a learner-created course
  (FR-009). The static function cannot see persisted data.

## Resolved unknowns

None remained in Technical Context.
