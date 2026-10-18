---

description: "Task list for Course Detail View"
---

# Tasks: Course Detail View

**Input**: Design documents from `/specs/005-course-detail-view/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature reuses `Button`, `IconButton`, `Menu`, `icons`, `TopAppBar`, `CourseOptionsMenu`, `ProgressBar`, `ComingSoonPage` and `CoursePlaceholder` from features 001 to 004.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US5)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses Tailwind utilities with the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V).
- No new dependencies. Cross-feature imports go through the feature's `index.ts` barrel: `course-detail` imports from `../home` and `../placeholder`; `home` and `placeholder` never import `course-detail`.
- Exact user-facing texts, routes and roles come from `specs/005-course-detail-view/contracts/ui-contract.md`. Copy texts verbatim. In this feature's UI the counts are called "words" (Home keeps "items").
- Every placeholder route renders the existing `CoursePlaceholder` (`src/features/placeholder`), which names the course and links back to Home.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] Update `src/features/home/index.ts` to also export `CourseOptionsMenu` (from `./components/CourseOptionsMenu`), `ProgressBar` (from `./components/ProgressBar`), `percentLearned` (from `./model/selectors`), `getCategoryById` (from `./data/sampleCourses`) and the type `Course` (from `./model/types`). Keep the existing exports.
- [x] T002 [P] Add an optional `onRemoved?: () => void` prop to `src/features/home/components/RemoveCourseDialog.tsx` (call it right after `removeCourse(courseId)`, before `dialogRef.current?.close()`) and to `src/features/home/components/CourseOptionsMenu.tsx` (pass it through to `RemoveCourseDialog`). Also add an optional `triggerLabel?: string` prop to `CourseOptionsMenu`: when set, the trigger is a text button showing that label followed by an `ArrowDropDownIcon` (instead of the three-dot icon button) with the same `aria-haspopup`, `aria-expanded` and `ref` props from `Menu`. Behavior without these props is unchanged.
- [x] T003 [P] Create `src/features/course-detail/data/sampleCourseExtras.ts` exporting `sampleCourseExtras: Record<string, { creator: string; longTermCount: number; ignoredCount: number; levelNames: string[] }>` keyed by the 8 sample course ids in `src/features/home/data/sampleCourses.ts` (`english-visual-dictionary`, `irregular-verbs`, `english-polyglot`, `japanese-hiragana`, `japanese-n5-vocab`, `spanish-mexico-basics`, `networking-fundamentals`, `empty-course`). Give each a fixed creator name, 3 to 8 `levelNames` (use `[]` for `empty-course`), and values obeying, verbatim from data-model.md: "`0 <= longTermCount <= itemsLearned`" and "`itemsLearned + ignoredCount <= totalItems`". For example `english-visual-dictionary` (159 learned of 2363): `longTermCount` 40, `ignoredCount` 3. Also export `defaultExtras = { creator: "You", longTermCount: 0, ignoredCount: 0, levelNames: [] }` for learner-created courses.
- [x] T004 [P] Create `src/features/course-detail/model/levels.ts` with `Level { number: number; name: string; totalWords: number; learnedWords: number }`, `buildLevels(course: Course, names: string[]): Level[]` and `levelState(level): "completed" | "in-progress" | "not-started"`. Rules, verbatim from data-model.md: `totalWords` is an "Even split of `totalItems` over the levels, remainder to the earliest levels"; `learnedWords` is "Filled sequentially from level 1 until `itemsLearned` is used up" with "`0 <= learnedWords <= totalWords`"; "A course with `totalItems` 0 or no `levelNames` has 0 levels"; invariants "sum of `totalWords` equals `totalItems`; sum of `learnedWords` equals `itemsLearned`". State: `completed` when "`totalWords > 0` and `learnedWords === totalWords`"; `not-started` when "`learnedWords === 0`"; otherwise `in-progress`. Import `Course` from `../../home`.
- [x] T005 [P] Create `src/features/course-detail/model/breadcrumb.ts` with `categoryPath(course: Course): { label: string; to?: string }[]`. First entry `{ label: "Courses", to: "/courses" }`. For language categories (category id starts with `lang-` or is one of `english`, `japanese`, `spanish-mx`) add `{ label: "Languages", to: "/courses" }` then the category name (from `getCategoryById`, no `to`); otherwise add just the category name (no `to`). Fall back to `"Courses"` only if the category is not found. Import from `../../home`.
- [x] T006 Create `src/features/course-detail/hooks/useCourseDetail.ts` exporting `useCourseDetail(id: string)` returning `null` when `useCourse(id)` is undefined or the id is in the learner store's `removedCourseIds`; otherwise `{ course, creator, isOwn, path, percent, longTermCount, ignoredCount, dueCount, levels, goal }` where `isOwn` is `course.id.startsWith("custom-")`, extras come from `sampleCourseExtras[course.id] ?? defaultExtras` (learner-created courses always use `defaultExtras`), `path` from `categoryPath`, `percent` from `percentLearned`, `dueCount` is `course.itemsDue`, `levels` from `buildLevels(course, extras.levelNames)` and `goal` from `useLearnerStore((s) => s.goals[course.id])`. Depends on T001, T003, T004, T005.
- [x] T007 [P] Create `src/features/course-detail/components/Tabs.tsx`: accessible M3 tabs. Props: `tabs: { id: string; label: string }[]`, `selectedId: string`, `onSelect: (id: string) => void`, `label: string` (accessible name of the tablist), `children: ReactNode` (the panel content). Render `role="tablist"`, each tab a `<button role="tab" aria-selected aria-controls tabIndex={selected ? 0 : -1}>`, Left/Right/Home/End keys move focus and select, selected tab shows a primary-colored bottom indicator, and a `role="tabpanel"` wrapper with `aria-labelledby` the selected tab.

**Checkpoint**: `pnpm typecheck` passes and Home still works.

---

## Phase 2: User Story 1 - Open a course and see its header (P1) 🎯 MVP

**Goal**: Clicking a course (title, card or levels button) opens `/course/:id` showing the breadcrumb, cover symbol, title, creator and Tweet button, with a way back to Home.

**Independent Test**: Click the title of a course, an empty area of another card and the levels button of a third: each opens that course's page. The header shows the right title, breadcrumb, symbol and "Created by" (sample creator, or "You" for a created course). Tweet opens a placeholder. `/course/does-not-exist` shows "Course not found" with a link to Home.

- [x] T008 [US1] Create `src/features/course-detail/components/CourseHeader.tsx`. Props: `title`, `path` (from `categoryPath`), `symbol` (category icon), `creator`, `onTweet: () => void`. Render a header band (`bg-surface-container-high`, rounded bottom corners) with: a `<nav aria-label="Breadcrumb">` of `<ol>` items where entries with `to` are router `Link`s and the last entry has `aria-current="page"` (separator ">" decorative, `aria-hidden`); a large rounded square (`size-28 sm:size-36`, `bg-primary-container`, text-6xl) showing the symbol, `aria-hidden`; an h1 with the title (`break-words`, `text-headline-medium`); the text "Created by" followed by the creator name; and a `Button variant="tonal"` labeled "Tweet" calling `onTweet`. Long titles must wrap without breaking the layout.
- [x] T009 [US1] Create `src/features/course-detail/CourseDetailPage.tsx`: read `id` from `useParams`, call `useCourseDetail(id)`. When it returns `null` render `<TopAppBar />` plus a centered "Course not found" h1 and a "Back to Home" `Link` to `/`. Otherwise render `<TopAppBar />`, a "Back to Home" text link to `/`, the `CourseHeader` (`symbol` from `getCategoryById(course.categoryId)?.icon`, `onTweet` navigates to `/course/${course.id}/share`) and a `<main>` container (`mx-auto max-w-5xl px-4`) reserved for the sections added by later stories. Imports from `../home`. Depends on T006, T008.
- [x] T010 [US1] Create `src/features/course-detail/index.ts` exporting `CourseDetailPage`. In `src/app/router.tsx` add `{ path: "/course/:id", element: <CourseDetailPage /> }` and `{ path: "/course/:id/share", element: <CoursePlaceholder title="Tweet" /> }`. Depends on T009.
- [x] T011 [US1] Edit `src/features/home/components/CourseCard.tsx`: make the card `relative`; wrap the h2 text in a router `Link` to `/course/${course.id}` with classes `after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` (stretched link); give the options menu container and the bottom button row `relative z-10` so they stay clickable; and change the levels `IconButton` to `navigate(\`/course/${course.id}\`)`. Do not change the primary action button behavior in this task. Depends on T010.

**Checkpoint**: US1 works alone (open, header, not found, Tweet placeholder).

---

## Phase 3: User Story 2 - See my progress and start a review (P1)

**Goal**: Progress summary with Review and speed-review buttons and the Options menu.

**Independent Test**: "English Visual Dictionary" shows "159 / 2363 words learned (… in long term memory)", its ignored count and a 6% bar, matching Home's 159 / 2363. "Review (26)" and the clock open placeholders. A course with 0 due shows both disabled. A newly created course shows "0 / 0 words learned" with an empty bar. Options → Remove course returns to Home.

- [x] T012 [US2] Create `src/features/course-detail/components/ProgressSummary.tsx`. Props: `course`, `percent`, `longTermCount`, `ignoredCount`, `dueCount`, `goal`. Render a card (`bg-surface-container rounded-m3-lg p-4`) with the text `{itemsLearned} / {totalItems} words learned ({longTermCount} in long term memory)` and `{ignoredCount} ignored` on the same row, then `ProgressBar` (from `../../home`, `value={percent}`, label "Course progress"; empty bar when `totalItems` is 0). Below: left the options control, right the Review controls (filled in T013).
- [x] T013 [US2] In `ProgressSummary.tsx` add: `CourseOptionsMenu` (from `../../home`) with `triggerLabel="Options"` and an `onRemoved` callback that navigates to `/`; a `Button variant="tonal"` labeled `Review ({dueCount})` that is `disabled` when `dueCount` is 0 and otherwise navigates to `/course/${course.id}/review`; and an `IconButton` (`TimerIcon`, `aria-label="Speed review"`) that is `disabled` when `dueCount` is 0 and otherwise navigates to `/course/${course.id}/speed-review`. Depends on T002, T012.
- [x] T014 [US2] In `src/app/router.tsx` add `{ path: "/course/:id/review", element: <CoursePlaceholder title="Review" /> }` (replace the existing "Speed review" element of that path) and `{ path: "/course/:id/speed-review", element: <CoursePlaceholder title="Speed review" /> }`. In `src/features/home/components/CourseCard.tsx` change the `speed-review` action's target from `/course/${course.id}/review` to `/course/${course.id}/speed-review` so the placeholder title matches the "Speed review" label. Depends on T011.
- [x] T015 [US2] Render `ProgressSummary` in `CourseDetailPage.tsx` inside the `<main>` container with the values from `useCourseDetail`. Depends on T009, T013, T014.

**Checkpoint**: US1 and US2 work together (MVP).

---

## Phase 4: User Story 3 - Browse the course levels (P1)

**Goal**: "Levels (N)" tab with level cards showing completed, in-progress and "Ready to learn" states, and level placeholders.

**Independent Test**: "Japanese Hiragana Starter" (fully learned) shows all cards with a flower and check. "English Visual Dictionary" shows growing plants with "X / Y learned" then "Ready to learn" cards. The tab count equals the card count and the sum of card words equals the course total. A created course shows "Levels (0)" and "This course has no levels yet." Pressing a card (mouse or Enter) opens a placeholder naming the course and the level.

- [x] T016 [P] [US3] Create `src/features/course-detail/components/PlantIcon.tsx`: props `stage: "pot" | "growing" | "flower"` and `className`. Inline decorative SVGs (`aria-hidden`), colored only with token classes (`text-primary`, `text-on-surface-variant`, `text-secondary-container`): `pot` an empty pot, `growing` a pot with a sprout of two leaves, `flower` a pot with a stem and a flower head.
- [x] T017 [P] [US3] Create `src/features/course-detail/components/LevelCard.tsx`: props `courseId`, `level: Level`. Render a router `Link` to `/course/${courseId}/levels/${level.number}` styled as an M3 outlined card with: the level number badge, `PlantIcon` (`flower` when `levelState` is `completed`, `growing` when `in-progress`, `pot` when `not-started`), the level name, a check mark (`CheckIcon`) only when completed, `"{learnedWords} / {totalWords} learned"` when in progress and `"Ready to learn"` when not started. Accessible name: `Level {number}, {name}, {completed | in progress | ready to learn}` via `aria-label`. Visible focus ring.
- [x] T018 [US3] Create `src/features/course-detail/components/LevelsSection.tsx`: props `courseId`, `levels`. Render `Tabs` with a single tab `{ id: "levels", label: \`Levels (${levels.length})\` }` and, inside the panel, a grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`) of `LevelCard`s in order; when `levels.length` is 0 render the message "This course has no levels yet." instead of the grid. Depends on T007, T017.
- [x] T019 [US3] Create `src/features/course-detail/LevelPlaceholder.tsx`: read `id` and `level` from `useParams`, use `useCourseDetail(id)`; if it returns `null` show "Course not found" with a link to `/`; if the level number is out of range show "Level not found" with a link to `/course/${id}`; otherwise render `ComingSoonPage` (from `../placeholder`) with `title={\`Level ${n}: ${name}\`}` and `course={course.title}`. Export it from `src/features/course-detail/index.ts`. In `src/app/router.tsx` add `{ path: "/course/:id/levels/:level", element: <LevelPlaceholder /> }` and remove the old `/course/:id/levels` route. Depends on T006, T010.
- [x] T020 [US3] Render `LevelsSection` in `CourseDetailPage.tsx` below `ProgressSummary`. Depends on T015, T018, T019.

**Checkpoint**: US3 independently verifiable.

---

## Phase 5: User Story 4 - See the leaderboard (P2)

**Goal**: Leaderboard panel with Week, Month and All Time tabs, ranked rows with "You" highlighted and a "More" link.

**Independent Test**: Week is selected first with at least 4 rows including a highlighted "You". Month and All Time change order and points. Left and Right arrows move between tabs. Equal points share a rank. "More" opens a placeholder. At 360 px the panel is below the levels.

- [x] T021 [P] [US4] Create `src/features/course-detail/data/sampleLeaderboard.ts` exporting `type LeaderboardPeriod = "week" | "month" | "all"`, `LeaderboardEntry { id: string; name: string; points: number }` and `sampleLeaderboard: Record<LeaderboardPeriod, LeaderboardEntry[]>`. Rules, verbatim from data-model.md: "Each period has at least 4 entries including `you`, with different points per period"; `id` unique within a period, the current learner is `you` named "You", `points` an integer >= 0. Include one pair of equal points in at least one period and "You" with 0 points in Week.
- [x] T022 [P] [US4] Create `src/features/course-detail/model/leaderboard.ts` with `rankEntries(entries: LeaderboardEntry[]): (LeaderboardEntry & { rank: number })[]`. Rules, verbatim from data-model.md: "sort by points descending, then name ascending; equal points share the same rank (competition ranking: 1, 1, 3)".
- [x] T023 [US4] Create `src/features/course-detail/components/LeaderboardPanel.tsx`: props `courseId`. A card with an h2 "Leaderboard" and `Tabs` for "Week", "Month", "All Time" (selected state in `useState`, initial `week`). The panel shows an ordered list of `rankEntries(sampleLeaderboard[period])` rows with rank, name and points; the `you` row has a highlighted background (`bg-primary-container text-on-primary-container`) and `aria-current="true"`. Below the list a router `Link` "More" to `/course/${courseId}/leaderboard`. Depends on T007, T021, T022.
- [x] T024 [US4] In `CourseDetailPage.tsx` lay the content out as a grid: one column by default and `lg:grid-cols-[minmax(0,1fr)_20rem]` with `gap-6`, the levels column (`ProgressSummary`, `LevelsSection`) first and `LeaderboardPanel` second so it is below on narrow screens. In `src/app/router.tsx` add `{ path: "/course/:id/leaderboard", element: <CoursePlaceholder title="Leaderboard" /> }`. Ensure no horizontal scroll at 360 px. Depends on T020, T023.

**Checkpoint**: US4 independently verifiable.

---

## Phase 6: User Story 5 - Edit the course (P3)

**Goal**: "Edit Course" link for learner-created courses only.

**Independent Test**: Open a learner-created course: "Edit Course" is shown and opens a placeholder. Open a sample course: no such link.

- [x] T025 [US5] Add the optional prop `action?: ReactNode` to `src/features/course-detail/components/Tabs.tsx` (rendered at the right end of the tab row) and pass it from `LevelsSection.tsx` through a new optional prop `editHref?: string`: when set, render a router `Link` labeled "Edit Course" (with the `EditIcon`, add an `EditIcon` pencil path `M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z` to `src/shared/ui/icons.tsx`) as the `action`. In `CourseDetailPage.tsx` pass `editHref={isOwn ? \`/course/${course.id}/edit\` : undefined}`. In `src/app/router.tsx` add `{ path: "/course/:id/edit", element: <CoursePlaceholder title="Edit Course" /> }`. Depends on T024.

**Checkpoint**: all stories work.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T026 Verify layout and accessibility per `quickstart.md` scenario 12: at 360 px width the header, summary, level grid and leaderboard stack with no horizontal scroll; tab through the whole page in the order in `contracts/ui-contract.md` with visible focus; disabled Review and clock are skipped; dark scheme keeps text legible. Fix deviations.
- [x] T027 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T028 Walk through every scenario in `specs/005-course-detail-view/quickstart.md` in the browser (`pnpm dev`) and fix any deviation, including that Home and the course page show the same counts and that removing a course from the page returns to Home.

---

## Dependencies & Execution Order

- Phase 1 first: T001, T002, T003, T004, T005 and T007 are independent (different files) and can run together; T006 needs T001, T003, T004 and T005.
- US1 (T008 to T011) needs Phase 1. US2 needs US1's page and router. US3 needs US2's page wiring (T015) and Phase 1's `Tabs`. US4 needs Phase 1's `Tabs` and the page from US3's wiring. US5 needs US4's layout.
- Priority order: US1, US2, US3 (P1), US4 (P2), US5 (P3).
- `CourseDetailPage.tsx` is edited by T009, T015, T020, T024, T025; `router.tsx` by T010, T014, T019, T024, T025; `CourseCard.tsx` by T011 and T014; `Tabs.tsx` by T007 and T025; `LevelsSection.tsx` by T018 and T025 — those tasks run in sequence.

## Parallel Opportunities

- Phase 1: T001, T002, T003, T004, T005, T007 together.
- US3: T016 and T017 together (T017 needs T016's `PlantIcon` props fixed).
- US4: T021 and T022 together, while US3 work continues.

## Implementation Strategy

- **MVP**: Phase 1, US1 and US2 (T001 to T015): open a course, see the header and the progress summary with working Review controls and Options.
- **Increment 2**: US3 (levels), the core structure of the page.
- **Increment 3**: US4 (leaderboard), US5 (Edit Course), then Polish.
- Stop after each checkpoint and run the matching quickstart scenarios.
