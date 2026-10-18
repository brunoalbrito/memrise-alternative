# Research: Course Detail View

## R1. Route and how a course is opened
- **Decision**: Page route `/course/:id`. On Home the course title is a router link stretched
  over the whole card (the "stretched link" pattern), with the card's buttons and menu raised
  above it. The levels button navigates to the same route.
- **Rationale**: FR-001 requires title or card click. One link keeps keyboard and screen-reader
  behavior simple (one tab stop, a real link), and the existing buttons keep working untouched.
- **Alternatives**: `onClick` on the whole article (not keyboard accessible, nested interactive
  conflicts); wrapping the card in a link (invalid nested interactive content).

## R2. Deriving levels (FR-019)
- **Decision**: A pure `buildLevels(course, names)` splits `totalItems` across the level names as
  evenly as possible (remainder goes to the earliest levels) and fills `itemsLearned`
  sequentially from level 1. Level state: completed when learned equals total (and total > 0),
  not started when learned is 0, otherwise in progress. A course with 0 total words or no names
  gets 0 levels.
- **Rationale**: Guarantees the sum of level words equals the course total and the sum of learned
  equals the course learned, so Home and the page can never disagree. Sequential fill yields a
  natural mix of completed, in-progress and "Ready to learn" cards.
- **Alternatives**: Hand-written level tables per course (error prone, must be re-summed by
  hand); storing levels on the course (changes the existing model for no gain).

## R3. Sample extras
- **Decision**: `sampleCourseExtras` keyed by course id holds `creator`, `longTermCount`,
  `ignoredCount` and `levelNames`. Values obey: `learned + ignored <= total`,
  `longTermCount <= learned`, `due <= learned`. Courses without an entry (including every
  learner-created course) get creator "You" (created) and 0 / 0 / no levels.
- **Rationale**: FR-004, FR-006 and the assumptions; keeps display-only data out of the shared
  `Course` type.

## R4. Breadcrumb and cover
- **Decision**: `categoryPath(course)` returns `["Courses", ...]`. Language categories (ids
  starting with `lang-`, or the sample ids `english`, `japanese`, `spanish-mx`) become
  `Languages > <category name>`; others use just the category name. Entries before the last are
  links: "Courses" to `/courses` (placeholder), "Languages" to `/courses` as well. The cover is
  the category symbol in a large rounded square when the course has no cover image.
- **Rationale**: FR-002, FR-003; no image assets needed.
- **Alternatives**: Real cover images (assets to source and license).

## R5. Reusing the Home options menu
- **Decision**: Export `CourseOptionsMenu` from the `home` barrel and add an optional
  `onRemoved` callback that `RemoveCourseDialog` calls after `removeCourse`. The detail page
  passes `() => navigate("/")`.
- **Rationale**: FR-009 requires the same behavior as Home; reuse avoids a second copy of two
  dialogs. The callback is the smallest change that lets the page return Home after removal.
- **Alternatives**: Duplicate the menu (drift); watch the store and redirect in an effect
  (unneeded render and effect).

## R6. Removed and unknown courses
- **Decision**: `useCourseDetail(id)` returns `null` when the id is unknown or is a hidden
  (removed) sample course; the page then shows "Course not found" with a link to Home.
- **Rationale**: FR-017 and the Edge Cases. A removed course should not stay reachable by an old
  link.

## R7. Tabs
- **Decision**: One small `Tabs` component (`role="tablist"`, `role="tab"` with `aria-selected`,
  roving `tabIndex`, Left/Right/Home/End keys, `role="tabpanel"` linked by `aria-controls`) used
  for the leaderboard periods. The "Levels (N)" tab is the same component with a single tab.
- **Rationale**: Two uses (Principle IV threshold is three, but the component is tiny and the
  accessible pattern is easy to get wrong twice).
- **Alternatives**: Plain buttons (no tab semantics); a tab library (new dependency).

## R8. Leaderboard
- **Decision**: Static `sampleLeaderboard` with entries `{ id, name, points }` for each period,
  including the entry `you` with name "You". `rankEntries(entries)` sorts by points descending,
  then name ascending, and assigns competition ranks (equal points share a rank, for example
  1, 1, 3). The "You" row gets a highlighted style and `aria-current="true"`.
- **Rationale**: Clarification (fixed sample learners plus "You"), FR-014 and the tie edge case.
- **Alternatives**: Dense ranking (1, 1, 2) conflicts with the common "1, 1, 3" convention and
  the spec says equal points share a rank only.

## R9. Review and speed review buttons
- **Decision**: "Review (R)" is a filled tonal button and the clock an icon button with
  `aria-label="Speed review"`. Both use the native `disabled` attribute when R is 0 and otherwise
  navigate to `/course/:id/review` and `/course/:id/speed-review` placeholders. Home's
  "Speed review" action is repointed to `/course/:id/speed-review` so the placeholder title
  matches the label on every screen.
- **Rationale**: FR-007, FR-008; consistent labels across the app.

## R10. Placeholder routes
- **Decision**: Add `/course/:id/review` ("Review"), `/course/:id/speed-review` ("Speed
  review"), `/course/:id/share` ("Tweet"), `/course/:id/edit` ("Edit Course"),
  `/course/:id/leaderboard` ("Leaderboard") using the existing `CoursePlaceholder`, and
  `/course/:id/levels/:level` using a new `LevelPlaceholder` that names the course and the level
  (for example "Level 2: Second Level"). The old `/course/:id/levels` route is removed (the
  levels button now opens the page).
- **Rationale**: Every control has a destination that names the course (FR-005, 007, 008, 012,
  014, 015).

## R11. Layout
- **Decision**: Header band with surface-container-high background. Below it, a two-column grid
  `lg:grid-cols-[minmax(0,1fr)_20rem]`: levels column (summary card then level grid) and the
  leaderboard column, stacking on narrow screens with the leaderboard last. Level grid is
  `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`.
- **Rationale**: FR-018, SC-001; no horizontal scroll from 360 px.

## Resolved unknowns

None remained in Technical Context.
