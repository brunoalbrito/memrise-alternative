# Data Model: Edit Course Form

Extends `specs/002-course-home-dashboard/data-model.md`, `specs/004-create-course-form/data-model.md`
and `specs/005-course-detail-view/data-model.md`.

## Sample course language fields (static data change)

Every course in `sampleCourses.ts` gets `teachingLanguageId` and `speakersLanguageId` (both
must exist in the language list):

| Course id | teachingLanguageId | speakersLanguageId |
|-----------|--------------------|--------------------|
| english-visual-dictionary | en-gb | en-gb |
| irregular-verbs | en-gb | en-gb |
| english-polyglot | en-gb | en-gb |
| japanese-hiragana | ja | en-gb |
| japanese-n5-vocab | ja | en-gb |
| spanish-mexico-basics | es-mx | en-gb |
| networking-fundamentals | en-us | en-us |
| empty-course | en-gb | en-gb |

## CourseEdit (new, persisted)

Override for a pre-loaded sample course. All fields optional; only edited courses have an entry.

| Field | Type | Rules |
|-------|------|-------|
| title | string | Trimmed, 3 to 100 characters |
| teachingLanguageId | string | Must exist in the language list |
| speakersLanguageId | string | Must exist in the language list |
| tags | string[] \| undefined | At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates |
| description | string \| undefined | At most 2000 characters |
| shortDescription | string \| undefined | At most 100 characters |
| categoryId | string | Set to `lang-<teachingLanguageId>` only when the teaching language changed; otherwise the course's current category |

Never part of an edit: `id`, counts (`totalItems`, `itemsLearned`, `itemsDue`, `learnedToday`),
`teaching`, goal, levels and creator.

## Persisted learner state (extends version 1)

| Field | Type | Rules |
|-------|------|-------|
| goals, removedCourseIds, createdCourses | unchanged | See earlier data models |
| courseEdits | Record<courseId, CourseEdit> | New. Missing on old data hydrates as `{}`. On hydrate, entries for unknown sample ids or with an unknown language id are dropped |

Actions:
- `updateCourse(id, draft)`: if `id` is a learner-created course, replace its editable fields
  (title, languages, tags, description, short description, category per the language rule) in
  `createdCourses`. If it is a sample course, write or replace `courseEdits[id]`. Unknown ids
  throw so the form can show "Course not found".
- `removeCourse(id)` (existing): for a sample course also deletes `courseEdits[id]`.
- `restoreCourses()` (existing) does not clear edits (a restored sample keeps the learner's
  edits).

## Derived

- `useAllCourses()` = each `sampleCourses` item spread with `courseEdits[item.id]`, then
  `createdCourses`.
- `draftFromCourse(course): CourseDraft`: `name` = title; `teachingLanguageId` and
  `speakersLanguageId` from the course (speakers default `en-gb` if missing); `tagsInput` =
  `tags?.join(", ") ?? ""`; `description` and `shortDescription` or `""`.
