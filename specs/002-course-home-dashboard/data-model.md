# Data Model: Course Home Dashboard

## Static sample data (`features/home/data/sampleCourses.ts`)

### Course
| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique, URL-safe |
| title | string | Non-empty; may be long (wraps) |
| categoryId | string | References Category |
| coverImage | string \| undefined | Optional URL or asset path |
| totalItems | number | Integer >= 0 |
| itemsLearned | number | Integer, 0 <= value <= totalItems |
| itemsDue | number | Integer >= 0 |
| learnedToday | number | Integer >= 0; drives the goal ring |
| teaching | boolean | True shows the course under the "Teaching" filter |

### Category
| Field | Type | Rules |
|-------|------|-------|
| id | string | Unique |
| name | string | Shown in "By Category" |
| icon | string | Icon or flag asset reference |

Relationship: Course N → 1 Category. Categories with no remaining (non-removed) courses are
hidden from the filter menu.

## Persisted learner state (`localStorage`, key `membetter.learner`, version 1)

| Field | Type | Rules |
|-------|------|-------|
| goals | Record<courseId, 5 \| 10 \| 20 \| 50> | Missing key means no goal |
| removedCourseIds | string[] | IDs hidden from Home; cleared by "Restore sample courses" |

State transitions: `setGoal(courseId, value | null)`, `removeCourse(courseId)`,
`restoreCourses()`. On hydration, unknown course ids are dropped.

## Derived values (pure selectors, `model/selectors.ts`)

- `percentLearned(course)` = `floor(itemsLearned / totalItems * 100)`, 0 if `totalItems` is 0.
- `primaryAction(course)` = `itemsDue > 0 ? "speed-review" : "learn-new-words"`.
- `goalProgress(course, goal)` = `min(learnedToday / goal, 1)`; undefined when no goal.
- `visibleCourses(courses, removedIds)`, `applyFilter(courses, goals, filter)`.
- `availableCategories(visibleCourses)`.

## Filter value (URL search param `filter`)

`all` (default) | `goal` | `teaching` | `cat:<categoryId>`. Unknown values fall back to `all`.
