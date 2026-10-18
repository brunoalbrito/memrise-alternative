# Data Model: Create Course Form

Extends the model in `specs/002-course-home-dashboard/data-model.md`.

## Language (static, `features/home/data/languages.ts`)

| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique, URL-safe (for example `en-gb`, `es-mx`, `pt-br`) |
| name | string | Shown in the selects and as the category name (for example "English (UK)") |
| icon | string | Flag or symbol shown with the category |

Minimum list: English (UK), English (US), Spanish (Mexico), Japanese, Portuguese (Brazil). The
plan adds French (France), German and Italian. Default For language: `en-gb`.

## Course (extended)

Existing fields are unchanged. Optional fields added, set only for learner-created courses:

| Field | Type | Rules |
|-------|------|-------|
| id | string | `custom-<uuid>` for created courses; unique |
| title | string | The Name, trimmed, 3 to 100 characters |
| categoryId | string | `lang-<teachingLanguageId>` |
| teaching | boolean | Always `true` for created courses |
| totalItems, itemsLearned, itemsDue, learnedToday | number | All 0 at creation |
| teachingLanguageId | string \| undefined | Required for created courses; must exist in the language list |
| speakersLanguageId | string \| undefined | Must exist in the language list; default `en-gb` |
| tags | string[] \| undefined | At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates |
| description | string \| undefined | At most 2000 characters |
| shortDescription | string \| undefined | At most 100 characters |

## CourseDraft (form values)

| Field | Type | Rules |
|-------|------|-------|
| name | string | Required. Trimmed length 3 to 100 |
| teachingLanguageId | string | Required. Empty string means "Please select one..." |
| speakersLanguageId | string | Required, default `en-gb` |
| tagsInput | string | Optional. Comma-separated, parsed by `parseTags` |
| description | string | Optional. At most 2000 characters |
| shortDescription | string | Optional. At most 100 characters |

## Validation (`features/create-course/model/validation.ts`)

`validateCourseForm(draft)` returns a map of field name to message (empty map means valid).
Messages are listed in `contracts/ui-contract.md`. `parseTags(input)` splits on commas, trims,
drops empty entries and removes case-insensitive duplicates (keeping the first spelling).

## Persisted learner state (extends version 1)

| Field | Type | Rules |
|-------|------|-------|
| goals | Record<courseId, 5 \| 10 \| 20 \| 50> | Existing |
| removedCourseIds | string[] | Existing; sample course ids only |
| createdCourses | Course[] | New. Missing on old data hydrates as `[]`. On hydrate, entries with an unknown language id or invalid counts are dropped |

State transitions: `addCourse(draft)` builds a Course, appends it to `createdCourses` and
returns its id. `removeCourse(id)` deletes a created course (and its goal), or hides a sample
course. `restoreCourses()` clears `removedCourseIds` only.

## Derived

- Home courses = (`sampleCourses` + `createdCourses`) minus `removedCourseIds`.
- `categoryForLanguage(language)` = `{ id: "lang-" + id, name, icon }`. Filter categories = sample
  categories plus all language categories, limited to those with a visible course.
