# Research: Edit Course Button

## R1. Visibility
- **Decision**: Always render the link. `CourseDetailPage` passes `/course/${course.id}/edit`
  unconditionally and `LevelsSection` takes `editHref` as a required prop.
- **Rationale**: Spec FR-002 (every course). A required prop removes the now-dead "no link"
  branch (Principle IV).
- **Alternatives**: Keep the optional prop (dead branch, easy to reintroduce the hiding by
  accident).

## R2. `isOwn` field
- **Decision**: Remove `isOwn` from the object returned by `useCourseDetail`. The local variable
  stays inside the hook because it still selects default extras for learner-created courses.
- **Rationale**: After R1 nothing reads the returned field.

## R3. Touch target and layout (FR-004)
- **Decision**: Add `min-h-12 sm:min-h-10` to the link and `flex-wrap` to the tab row so the link
  can drop below the tab on very narrow widths instead of overflowing.
- **Rationale**: 48 px target on phones; no horizontal scroll (SC-002).

## R4. Double press (FR-005)
- **Decision**: A `useRef(false)` flag in `LevelsSection`; the link's `onClick` calls
  `preventDefault()` when the flag is set, otherwise sets it. The page unmounts on navigation, so
  no reset is needed.
- **Rationale**: Same approach as the Create a course button. Two clicks in one tick cannot push
  two history entries.

## R5. Destination
- **Decision**: Unchanged: `/course/:id/edit` renders `CoursePlaceholder` titled "Edit Course"
  and naming the course (spec FR-003).

## Resolved unknowns

None.
