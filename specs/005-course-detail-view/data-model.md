# Data Model: Course Detail View

Extends the model in `specs/002-course-home-dashboard/data-model.md` and
`specs/004-create-course-form/data-model.md`. No new persisted state.

## Course (existing, unchanged)

Uses `id`, `title`, `categoryId`, `totalItems`, `itemsLearned`, `itemsDue`, `teaching`,
`teachingLanguageId`. On this page "items" are shown as "words".

## CourseExtras (static, `course-detail/data/sampleCourseExtras.ts`)

Keyed by sample course id. Learner-created courses and unknown ids use defaults.

| Field | Type | Rules |
|-------|------|-------|
| creator | string | Display name shown after "Created by". Default for learner-created courses: "You" |
| longTermCount | number | Integer, `0 <= longTermCount <= itemsLearned`. Default 0 |
| ignoredCount | number | Integer >= 0, `itemsLearned + ignoredCount <= totalItems`. Default 0 |
| levelNames | string[] | Ordered level names. Empty array means no levels. Default empty |

## Level (derived, `course-detail/model/levels.ts`)

| Field | Type | Rules |
|-------|------|-------|
| number | number | 1-based position |
| name | string | From `levelNames` |
| totalWords | number | Integer >= 0. Even split of `totalItems` over the levels, remainder to the earliest levels |
| learnedWords | number | Integer, `0 <= learnedWords <= totalWords`. Filled sequentially from level 1 until `itemsLearned` is used up |

Invariants (spec FR-019): sum of `totalWords` equals `totalItems`; sum of `learnedWords` equals
`itemsLearned`. A course with `totalItems` 0 or no `levelNames` has 0 levels.

State (`levelState(level)`): `completed` when `totalWords > 0` and `learnedWords === totalWords`;
`not-started` when `learnedWords === 0`; otherwise `in-progress`.

## CourseDetail (view model, `useCourseDetail(id)`)

| Field | Type | Source |
|-------|------|--------|
| course | Course | `useCourse(id)`; `null` result when unknown or removed |
| creator | string | Extras, or "You" for learner-created courses |
| isOwn | boolean | Course id starts with `custom-` (drives "Edit Course") |
| path | string[] | `categoryPath(course)`: `["Courses", ...]` |
| percent | number | `percentLearned(course)` from Home |
| longTermCount, ignoredCount | number | Extras (0 for learner-created) |
| dueCount | number | `course.itemsDue` |
| levels | Level[] | `buildLevels(course, extras.levelNames)` |
| goal | GoalValue \| undefined | Learner store (used by the options menu) |

## Breadcrumb (`course-detail/model/breadcrumb.ts`)

`categoryPath(course)` returns labels and links: `Courses` (link `/courses`), then for language
categories (category id starts with `lang-` or is `english`, `japanese`, `spanish-mx`)
`Languages` (link `/courses`) and the category name (current page, not a link), otherwise just
the category name.

## LeaderboardEntry (static, `course-detail/data/sampleLeaderboard.ts`)

| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique within a period. The current learner is `you` |
| name | string | Display name. The current learner is "You" |
| points | number | Integer >= 0 |

`sampleLeaderboard: Record<"week" | "month" | "all", LeaderboardEntry[]>`. Each period has at
least 4 entries including `you`, with different points per period. Same data for every course.

`rankEntries(entries)` returns entries with `rank`: sort by points descending, then name
ascending; equal points share the same rank (competition ranking: 1, 1, 3).

## Route params

- `:id`: course id. Unknown or removed ids show "Course not found".
- `:level`: level number on the level placeholder. Out-of-range values show "Level not found"
  with a link back to the course page.
