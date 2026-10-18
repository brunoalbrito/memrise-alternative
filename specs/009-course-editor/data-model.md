# Data Model: Course Editor

Extends the models in specs 002, 004, 005 and 008.

## MediaRef (persisted metadata)

| Field | Type | Rules |
|-------|------|-------|
| id | string | `media-<uuid>`; key of the blob in IndexedDB |
| name | string | Original file name |
| type | string | MIME type, or `image/*` / `audio/*` family inferred from the extension |
| size | number | Bytes. Images at most 2 MB (2097152), audio at most 3 MB (3145728) |

## Word

| Field | Type | Rules |
|-------|------|-------|
| id | string | `word-<uuid>`; unique in the course |
| text | string | The word. A row counts as a word only when `text.trim()` is not empty |
| meaning | string | Optional, may be empty |
| example | string | Optional, may be empty |
| images | MediaRef[] | At most 5 entries, each an image |
| audio | MediaRef[] | At most 5 entries, each an audio file |
| learned | boolean | True for sample words marked learned. New words are not learned |

## CourseLevel

| Field | Type | Rules |
|-------|------|-------|
| id | string | `level-<uuid>`; unique in the course |
| name | string | Default "Level N" for new levels. May be edited. Must not be left empty (empty falls back to "Level N" on blur) |
| tested | string | The "how it is tested" line, for example "Test on Word, prompt with Images." May be empty |
| words | Word[] | Ordered |

The level's number is its 1-based position. The level's language label is the course's Teaching
language name. Collapsed state is UI-only.

## Counts (derived, `home/model/counts.ts`)

`countsFromLevels(levels, due)` returns:
- `totalItems`: number of words with `text.trim() !== ""`
- `itemsLearned`: number of those with `learned === true`
- `itemsDue`: `min(due, itemsLearned)`

Invariant: `0 <= itemsDue <= itemsLearned <= totalItems`.

## Persisted learner state (extends version 1)

| Field | Type | Rules |
|-------|------|-------|
| goals, removedCourseIds, createdCourses, courseEdits | unchanged | See earlier data models |
| courseLevels | Record<courseId, CourseLevel[]> | New. Missing on old data hydrates as `{}`. On hydrate, entries for course ids that are neither a sample id nor a created course id are dropped |

Levels for a course = `courseLevels[id] ?? sampleLevels[id] ?? []`.

Actions:
- `setCourseLevels(id, levels)`: writes the list, then deletes from IndexedDB every media id that
  was referenced by any course before and is referenced by none after.
- `addCourse(draft)` (existing): also sets `courseLevels[newId] = []`.
- `removeCourse(id)` (existing): for a created course also deletes `courseLevels[id]` and runs the
  media cleanup; for a sample course it also deletes `courseLevels[id]` (the built-in sample
  levels return when the course is restored) and runs the cleanup.

## Sample levels (`home/data/sampleLevels.ts`)

`sampleLevels: Record<courseId, CourseLevel[]>` built from seeds, with `learned` applied to the
first N words in order. Sizes (words / learned / due):

| Course id | Levels | Words | Learned | Due |
|-----------|--------|-------|---------|-----|
| english-visual-dictionary | 3 (7, 5, 4) | 16 | 9 | 3 |
| irregular-verbs | 4 (3 each) | 12 | 0 | 0 |
| english-polyglot | 3 (4 each) | 12 | 0 | 0 |
| japanese-hiragana | 2 (5, 5) | 10 | 10 | 0 |
| japanese-n5-vocab | 3 (4 each) | 12 | 5 | 2 |
| spanish-mexico-basics | 2 (5, 5) | 10 | 4 | 1 |
| networking-fundamentals | 2 (4, 4) | 8 | 2 | 1 |
| empty-course | none | 0 | 0 | 0 |

`sampleCourseExtras` constraints after the change: `longTermCount <= learned` and
`learned + ignored <= total` for every sample course.

## Level view (course page, `course-detail/model/levels.ts`)

`Level { number, name, totalWords, learnedWords }` is now built from `CourseLevel`: `totalWords`
= words with text, `learnedWords` = learned words among them. `levelState` is unchanged.
