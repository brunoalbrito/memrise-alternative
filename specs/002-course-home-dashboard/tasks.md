---

description: "Task list for Course Home Dashboard"
---

# Tasks: Course Home Dashboard

**Input**: Design documents from `/specs/002-course-home-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US6)

## Conventions for every task

- All paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses Tailwind utilities driven by the Material Design 3 tokens from T001. Never hard-code colors (constitution Principle V).
- No new dependencies. Cross-feature imports go through the feature's `index.ts`.
- Interactive elements must be keyboard operable with ARIA roles (see `contracts/ui-contract.md`, Accessibility).

---

## Phase 1: Setup

- [x] T001 Create the M3 design tokens in `src/app/theme/tokens.css`: CSS custom properties for color roles (primary, on-primary, primary-container, on-primary-container, secondary-container, on-secondary-container, surface, surface-container, surface-container-high, on-surface, on-surface-variant, outline, outline-variant, error), type scale (display, headline, title, body, label), shape (corner small/medium/large/full) and elevation levels 1 to 3. Define the light scheme on `:root` and the dark scheme under `@media (prefers-color-scheme: dark)`. Expose them to Tailwind with an `@theme` block (e.g. `--color-surface`, `--color-on-surface`, `--radius-m3-md`).
- [x] T002 Import the tokens in `src/index.css` after `@import "tailwindcss";` and set the `body` background to the surface color and text to on-surface.
- [x] T003 [P] Create empty feature folders with barrels: `src/features/placeholder/index.ts` (exports `ComingSoonPage` after T010) and the folder skeletons `src/shared/ui/`, `src/features/home/components/`, `src/features/home/hooks/`, `src/features/home/model/`, `src/features/home/data/`, `src/features/home/store/`.

---

## Phase 2: Foundational (blocks all user stories)

- [x] T004 [P] Define types in `src/features/home/model/types.ts` per `data-model.md`: `Category { id: string; name: string; icon: string }`, `Course { id: string; title: string; categoryId: string; coverImage?: string; totalItems: number; itemsLearned: number; itemsDue: number; learnedToday: number; teaching: boolean }`, `GoalValue = 5 | 10 | 20 | 50`, `FilterValue = "all" | "goal" | "teaching" | \`cat:${string}\``, `PrimaryAction = "speed-review" | "learn-new-words"`. Document the constraints as comments: totalItems integer >= 0; `0 <= itemsLearned <= totalItems`; itemsDue integer >= 0; learnedToday integer >= 0.
- [x] T005 [P] Create sample data in `src/features/home/data/sampleCourses.ts`: 4 categories (Computers & Engineering, English, Japanese, Spanish (Mexico)) and 8 courses. Include these cases: "English Visual Dictionary" (159 / 2363 learned, 26 due, learnedToday 0, goal-eligible), "Learn English Irregular Verbs • No Typing" (0 / 697, 0 due), "Learn English for Polyglot • No Typing" (0 / 5385, 0 due), one course with `totalItems` 0, one with a very long title, one fully learned (itemsLearned = totalItems), and at least two with `teaching: true`. Every course must satisfy the T004 constraints. Export `sampleCourses` and `sampleCategories`.
- [x] T006 [P] Implement pure selectors in `src/features/home/model/selectors.ts` per `data-model.md`: `percentLearned(course)` = `floor(itemsLearned / totalItems * 100)`, 0 when totalItems is 0, and never 100 unless `itemsLearned === totalItems`; `primaryAction(course)` = `itemsDue > 0 ? "speed-review" : "learn-new-words"`; `goalProgress(course, goal?)` = `min(learnedToday / goal, 1)`, `undefined` when no goal; `visibleCourses(courses, removedIds)`; `applyFilter(courses, goals, filter)` (goal = has a goal, teaching = `teaching` true, `cat:<id>` = categoryId match, unknown value behaves as `all`); `availableCategories(visibleCourses, categories)` returning only categories that still have a visible course.
- [x] T007 Create the persisted store in `src/features/home/store/learnerStore.ts` using Zustand `persist` (localStorage key `membetter.learner`, version 1, persist only `goals` and `removedCourseIds`). State: `goals: Record<string, GoalValue>` (missing key = no goal), `removedCourseIds: string[]`. Actions: `setGoal(courseId, value | null)`, `removeCourse(courseId)`, `restoreCourses()`. On rehydrate, drop ids that are not in `sampleCourses`. Depends on T004, T005.
- [x] T008 [P] Create `src/shared/ui/Button.tsx`: M3 filled, tonal and text variants (props: `variant`, `icon?`, children, native button props) with hover, focus-visible, pressed and disabled states from the tokens.
- [x] T009 [P] Create `src/shared/ui/IconButton.tsx`: M3 standard and filled-tonal icon button, requires `aria-label`, 40px minimum touch target.
- [x] T010 [P] Create `src/features/placeholder/ComingSoonPage.tsx` and export it from `src/features/placeholder/index.ts`: props `title: string` and optional `course?: string`; shows the destination (and course name when given) with the text "coming soon" and a "Back to Home" link to `/`.
- [x] T011 Create `src/shared/ui/Menu.tsx` (used by the filter menu and the card options menu): a trigger button plus popup with `role="menu"`, items with `role="menuitem"` (and optional `role="separator"` / group label), arrow-key navigation, Enter/Space to select, Escape closes and returns focus to the trigger, closes on outside click and after selection. Props: `trigger` render prop, `items`, `onSelect`.
- [x] T012 Update `src/app/router.tsx` to the route table in `contracts/ui-contract.md`: `/` → `HomePage`; `/courses`, `/groups`, `/profile` → `ComingSoonPage` with titles "Courses", "Groups", "Profile"; unknown paths redirect to `/`. Course routes are added in T017 and T029.

**Checkpoint**: foundation ready. `pnpm typecheck` passes.

---

## Phase 3: User Story 1 - See my courses and progress at a glance (P1) 🎯 MVP

**Goal**: Home lists each course with title, percent, "N / M items learned" and a progress bar.

**Independent Test**: Open Home. Every sample course shows correct title, percent, count and bar. A 0-learned course shows 0% and an empty bar. Removing all courses (set `removedCourseIds` in localStorage) shows the empty state.

- [x] T013 [P] [US1] Create `src/features/home/components/ProgressBar.tsx`: M3 linear progress indicator, props `value` (0 to 100) and `label`, with `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow`, track in surface-variant tone and indicator in primary tone.
- [x] T014 [US1] Create `src/features/home/components/CourseCard.tsx` as an M3 card (outlined/filled card, shape large) showing the cover image when present, the title (wraps, never breaks the layout), `percentLearned` followed by "N / M items learned" and the `ProgressBar`. Leave slots for the stats row, primary action, levels button and options menu (added by later stories). Depends on T006, T013.
- [x] T015 [P] [US1] Create `src/features/home/components/EmptyState.tsx`: props `message`, `actionLabel`, `onAction`; M3 text/tonal button for the action.
- [x] T016 [US1] Replace `src/features/home/HomePage.tsx`: read `removedCourseIds` from `learnerStore`, compute `visibleCourses`, render a vertical list of `CourseCard`. When the list is empty because every course was removed, render `EmptyState` with the message "You have no courses" and action "Restore sample courses" calling `restoreCourses()`. Center the list with a max width and keep it usable at phone width without horizontal scroll. Depends on T007, T014, T015.

**Checkpoint**: US1 works alone.

---

## Phase 4: User Story 2 - Start the right learning action (P1)

**Goal**: One primary button per course, "Speed review" when items are due, otherwise "Learn new words", opening a placeholder.

**Independent Test**: A course with 26 due shows "Speed review", one with 0 due shows "Learn new words". Each opens a placeholder naming the course and session type with a Back to Home link, and progress is unchanged afterwards.

- [x] T017 [US2] In `src/app/router.tsx` add routes `/course/:id/review` (title "Speed review") and `/course/:id/learn` (title "Learn new words"). Create `src/features/placeholder/CoursePlaceholder.tsx` (exported via the barrel) that reads `:id`, looks the course up through a `getCourseById` helper exported from `src/features/home/index.ts`, and renders `ComingSoonPage` with the course title; for an unknown id it renders a "Course not found" message with a link to `/`. Depends on T010, T012.
- [x] T018 [US2] Add the primary action button to `src/features/home/components/CourseCard.tsx` using `Button` (filled tonal, with icon): label from `primaryAction(course)` ("Speed review" or "Learn new words"), navigates to `/course/:id/review` or `/course/:id/learn`. Depends on T014, T017.

**Checkpoint**: US1 and US2 work together (full MVP).

---

## Phase 5: User Story 3 - See per-course stats (P2)

**Goal**: Goal ring, learned count and due count on each card, dimmed when zero.

**Independent Test**: A course with learned 159 and due 26 shows 159 and 26. A course with zeros shows dimmed 0 values. A course with a goal shows the ring filled in proportion.

- [x] T019 [P] [US3] Create `src/features/home/components/GoalRing.tsx`: SVG circular indicator, props `progress?: number` (0 to 1, undefined = no goal) and `value` shown beside it; `role="progressbar"` with `aria-valuenow` and `aria-label="Daily goal"`; dimmed style when there is no goal or `value` is 0.
- [x] T020 [P] [US3] Create `src/features/home/components/CourseStats.tsx`: row with `GoalRing` (value = `learnedToday`, progress from `goalProgress`), a learned-items stat (value `itemsLearned`, icon + `aria-label="Items learned"`) and a due-for-review stat (value `itemsDue`, `aria-label="Items due for review"`). Each stat is dimmed when its value is 0. Depends on T019.
- [x] T021 [US3] Render `CourseStats` in `src/features/home/components/CourseCard.tsx`, passing the course and `goals[course.id]` from `learnerStore`. Depends on T014, T020.

**Checkpoint**: US3 independently verifiable.

---

## Phase 6: User Story 4 - Filter courses (P2)

**Goal**: Single-select filter menu (All Courses, With Goal Set, Teaching, By Category) with heading and URL updates.

**Independent Test**: Each option narrows the list correctly, the heading and `?filter=` update, picking another option replaces the previous filter, a no-match filter shows the clear-filter state, and the By Category group is hidden when no category remains.

- [x] T022 [P] [US4] Create `src/features/home/hooks/useFilterParam.ts`: reads and writes the `filter` URL search param with React Router's `useSearchParams`; returns `[filter, setFilter]` where unknown or missing values resolve to `"all"` and setting `"all"` removes the param.
- [x] T023 [US4] Create `src/features/home/hooks/useFilteredCourses.ts`: combines `sampleCourses`, `removedCourseIds`, `goals` and the active filter via `visibleCourses` and `applyFilter`; also returns the active filter's display name (All Courses, With Goal Set, Teaching or the category name) and `availableCategories`. Depends on T006, T007, T022.
- [x] T024 [US4] Create `src/features/home/components/FilterMenu.tsx` using `Menu`: trigger shows the globe-style icon and a dropdown arrow; group "Filter Results" with All Courses, With Goal Set, Teaching; group "By Category" listing each available category with its icon, omitted entirely when none are available; the active option is marked (`aria-checked`/check icon). Selecting calls `setFilter` (single selection, replaces the previous). Depends on T011, T023.
- [x] T025 [US4] Update `src/features/home/HomePage.tsx`: show a heading with the active filter name next to `FilterMenu`; render the filtered list; when the filter matches no course show `EmptyState` with "No courses match this filter" and action "Clear filter" calling `setFilter("all")`. Keep the T016 empty state for the no-courses case. Depends on T016, T023, T024.

**Checkpoint**: US4 independently verifiable.

---

## Phase 7: User Story 5 - Manage a course from its card (P3)

**Goal**: Options menu (set/clear goal, remove), goal dialog, remove confirmation, levels button with placeholder.

**Independent Test**: Set goal 10 → ring appears and the course shows under With Goal Set, still there after reload. Clear goal removes it. Remove + confirm hides the course, also after reload. Levels button opens a placeholder naming the course.

- [x] T026 [P] [US5] Create `src/features/home/components/GoalDialog.tsx` on the native `<dialog>` element (`showModal`): radio group with options 5, 10, 20, 50 and "No goal", preselected to the current goal; "Save" calls `setGoal(courseId, value | null)` and closes; "Cancel" and Escape close without change. Title "Set daily goal" and an items-per-day label.
- [x] T027 [P] [US5] Create `src/features/home/components/RemoveCourseDialog.tsx` on the native `<dialog>` element: text "Remove {course title} from your courses?", "Remove" calls `removeCourse(courseId)`, "Cancel" and Escape close without change.
- [x] T028 [US5] Create `src/features/home/components/CourseOptionsMenu.tsx` using `Menu` and an `IconButton` with `aria-label="Course options"` (three-dot icon): items "Set daily goal" (opens `GoalDialog`), "Clear goal" (only when a goal is set, calls `setGoal(courseId, null)`), "Remove course" (opens `RemoveCourseDialog`). Depends on T011, T026, T027.
- [x] T029 [US5] In `src/app/router.tsx` add `/course/:id/levels` (title "Levels and items") using `CoursePlaceholder`. Depends on T017.
- [x] T030 [US5] In `src/features/home/components/CourseCard.tsx` add the levels button (`IconButton`, grid icon, `aria-label="Levels and items"`) navigating to `/course/:id/levels`, and render `CourseOptionsMenu` in the card's top-right corner. Depends on T018, T028, T029.

**Checkpoint**: US5 independently verifiable.

---

## Phase 8: User Story 6 - Navigate between main areas (P3)

**Goal**: Top app bar with Home (active), Courses, Groups and a profile control.

**Independent Test**: Home is marked as the current page. Courses, Groups and the profile button open placeholders with a way back. Unknown paths go to Home.

- [x] T031 [US6] Create `src/features/home/components/TopAppBar.tsx`: M3 top app bar with the app name, nav links Home, Courses, Groups (use React Router `NavLink`; the active link gets `aria-current="page"` and an active indicator) and a profile `IconButton` (`aria-label="Profile"`) linking to `/profile`. Collapses to a compact layout at phone width without horizontal scroll.
- [x] T032 [US6] Render `TopAppBar` at the top of `src/features/home/HomePage.tsx`. Also render it on `ComingSoonPage` and `CoursePlaceholder` via a small shared wrapper so navigation stays available (create `src/shared/ui/AppShell.tsx` only if `TopAppBar` is imported by both features; otherwise import `TopAppBar` through the `home` barrel). Depends on T031.

**Checkpoint**: all stories work.

---

## Phase 9: Polish & Cross-Cutting

- [x] T033 [P] Add an error boundary around the course list in `src/features/home/components/HomeErrorBoundary.tsx` showing "Something went wrong loading your courses" with a "Retry" button that resets the boundary; wrap the list in `HomePage.tsx` (spec FR-014).
- [x] T034 [P] Export the public surface in `src/features/home/index.ts` (`HomePage`, `getCourseById`, and `TopAppBar` if needed by T032) and verify no deep cross-feature imports remain (search for `features/home/` imports outside the home feature).
- [ ] T035 Visual and a11y pass per `quickstart.md` scenario 7: tab through all controls, check focus ring, arrow-key and Escape behavior in both menus, dialogs trap focus, no horizontal scroll at 360px width, light and dark schemes both legible (WCAG 2.1 AA contrast).
- [x] T036 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T037 Walk through every scenario in `specs/002-course-home-dashboard/quickstart.md` in the browser (`pnpm dev`) and fix any deviation.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → user stories → Phase 9.
- US1 depends only on Phase 2. US2 depends on US1 (card). US3 depends on US1 (card). US4 depends on US1 (HomePage) and Menu (T011). US5 depends on US2 (placeholder routes) and US1 (card). US6 depends on US1 (HomePage).
- Priority order: US1, US2 (P1) → US3, US4 (P2) → US5, US6 (P3).
- `CourseCard.tsx` is edited by T014, T018, T021 and T030, and `HomePage.tsx` by T016, T025, T032 and T033, so those tasks run in sequence, not in parallel.

## Parallel Opportunities

- Phase 2: T004, T005, T006, T008, T009, T010 can run together (T006 needs T004's types, so start it after T004).
- US1: T013 and T015 in parallel.
- US3: T019 and T020 (after T019's props are fixed) while US4's T022 proceeds.
- US5: T026 and T027 in parallel.
- Different stories (US3, US4, US6) can be built by different people once US1 is done, merging into `CourseCard.tsx` and `HomePage.tsx` carefully.

## Implementation Strategy

- **MVP**: Phases 1, 2, then US1 and US2 (T001 to T018). Result: Home lists courses with progress and working primary buttons that open placeholders.
- **Increment 2**: US3 (stats) and US4 (filter).
- **Increment 3**: US5 (options) and US6 (navigation), then Polish.
- Stop after each checkpoint and run the matching quickstart scenario.
