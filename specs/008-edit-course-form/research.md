# Research: Edit Course Form

## R1. Reusing the create form
- **Decision**: Generalize `useCourseForm` to take `{ initialValues, onSubmit(values), successPath }`
  and `CourseForm` to take `{ initialValues, onSubmit, successPath, submitLabel }`. The create page
  passes empty values, `addCourse`, `/` and "Create Course". The edit page passes the course's
  draft, `updateCourse`, `/course/:id` and "Save Changes". Export `CourseForm` and `HelpPanel`
  from the `create-course` barrel.
- **Rationale**: Spec FR-002 and FR-005 and SC-004 require identical fields and rules, so one
  implementation avoids drift. This is the form's second use, so generalizing now is justified.
- **Alternatives**: Copy the form (two validation copies would diverge); move the form to
  `shared/` (large move, the form is feature-specific).

## R2. Where edits are stored
- **Decision**: `updateCourse(id, draft)` in the learner store.
  - Learner-created course: replace its editable fields inside `createdCourses`.
  - Sample course: write a `courseEdits[id]` override
    `{ title, teachingLanguageId, speakersLanguageId, tags, description, shortDescription,
    categoryId }`. `useAllCourses` returns `sampleCourses` with each override spread over its
    course, then the created courses.
- **Rationale**: FR-006, FR-008, FR-009. Sample data stays untouched and the learner's version
  persists. Counts, id, goal and levels are never part of an override, so FR-006's "unchanged"
  holds by construction.
- **Alternatives**: Convert a sample into a created course on first edit (changes its id and
  loses creator and levels); edit sample data in memory (lost on reload).

## R3. Category on language change
- **Decision**: In `updateCourse`, if `draft.teachingLanguageId` differs from the course's current
  `teachingLanguageId`, set `categoryId` to `lang-<new id>`; otherwise keep the current
  `categoryId`.
- **Rationale**: FR-007. Keeps sample categories (for example "English") unless the learner
  actually changes the language.

## R4. Pre-filling sample courses
- **Decision**: Add `teachingLanguageId` and `speakersLanguageId` to every sample course in
  `sampleCourses.ts`, following the Assumptions (English courses `en-gb`, Japanese courses `ja`,
  the Spanish (Mexico) course `es-mx`, networking `en-us` for `en-us` speakers; speakers `en-gb`
  elsewhere). `draftFromCourse(course)` builds the form values: name = title, languages from the
  course (speakers fall back to the default), `tagsInput` = tags joined with ", ", descriptions
  or empty string.
- **Rationale**: FR-003 needs every field filled. Teaching is required, so sample courses must
  have a value.

## R5. Validation and messages
- **Decision**: Reuse `validateCourseForm` and the existing messages unchanged. No new rules.
- **Rationale**: FR-005, SC-004.

## R6. Storage probe and failure
- **Decision**: Reuse the existing storage probe in `useCourseForm`. `onSubmit` is wrapped in a
  try/catch; on failure the same message is shown and the course keeps its old values. Because the
  store updates in-memory state before persisting, the probe runs first (as in creation).
- **Rationale**: US2 scenario 4.

## R7. Double save and leaving
- **Decision**: Same `useRef` guard as creation. "Back to course" is a router link to
  `/course/:id`, so unsaved state is simply dropped when the page unmounts.
- **Rationale**: FR-010, FR-011.

## R8. Course missing while editing (FR-012, edge case)
- **Decision**: `EditCoursePage` uses `useCourseDetail(id)` semantics: `null` for unknown or
  removed courses renders "Course not found". The `onSubmit` handler re-checks that the course
  still exists in the store before saving; if it does not, it shows the not-found state.
- **Rationale**: Prevents silent failure when the course was removed in another tab.

## R9. Route
- **Decision**: `/course/:id/edit` renders `EditCoursePage` (replaces the `CoursePlaceholder`).
  The link in the course tab row is unchanged.

## Resolved unknowns

None remained in Technical Context.
