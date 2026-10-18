---

description: "Task list for Create Course Button"
---

# Tasks: Create Course Button

**Input**: Design documents from `/specs/003-create-course-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. This feature is small, so there is no Setup phase and no new shared infrastructure: it reuses `Button`, `icons`, `ComingSoonPage` and the router from features 001 and 002.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1, US2)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict.
- Styling uses Tailwind utilities with the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V). The green in the reference image is a visual hint only.
- No new dependencies. Cross-feature imports go through the feature's `index.ts`.

---

## Phase 1: Foundational

- [x] T001 [P] Add a plus icon `AddIcon` to `src/shared/ui/icons.tsx` using the Material "add" path `M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z` and the same `Icon` wrapper pattern as the other icons.
- [x] T002 Add the route `{ path: "/courses/new", element: <ComingSoonPage title="Create a course" /> }` to `src/app/router.tsx`, directly after the existing `/courses` route. `ComingSoonPage` already shows the top app bar, "coming soon" text and a "Back to Home" link; no other route changes.

**Checkpoint**: visiting `/courses/new` in the browser shows the "Create a course" placeholder.

---

## Phase 2: User Story 1 - Find and press "Create a course" on Home (P1) 🎯 MVP

**Goal**: A "Create a course" button is always visible in the Home header row and works with mouse and keyboard.

**Independent Test**: Open Home with courses, with a filter that matches nothing (pick Teaching after removing the teaching courses, or a category with no match), and with all courses removed. The button is visible in each case, fully visible without scrolling at 360 px width, and can be activated with Tab then Enter or Space.

- [x] T003 [US1] Create `src/features/home/components/CreateCourseButton.tsx`: a component with no props that renders the shared `Button` (`src/shared/ui/Button.tsx`, `variant="filled"`) with the exact label "Create a course" and `icon={<AddIcon className="size-5" />}`. Add the classes `min-h-12 sm:min-h-10` to meet the 48 px phone touch target (the shared `Button` already has `h-10`; pass `className="h-12 sm:h-10"` so the later class wins). Use native `type="button"` (already the `Button` default). Use `useNavigate` from `react-router`; the click handler is wired in T006.
- [x] T004 [US1] Edit `src/features/home/HomePage.tsx`: in the header row (`<div className="mb-6 flex items-center gap-3">`) add `flex-wrap`, and render `<CreateCourseButton />` as the last child with `className` wrapper `ml-auto` (for example wrap it in `<div className="ml-auto">`). Render it unconditionally, outside the `hasCourses` check that hides `FilterMenu`, so it also shows in the empty-state and no-filter-match states. Do not move or change the empty-state components. Depends on T003.
- [x] T005 [US1] Verify focus and contrast: confirm the `Button` focus-visible outline appears on keyboard focus and the label is legible in both light and dark schemes (uses `bg-primary` / `text-on-primary` tokens). Fix only if the shared `Button` lacks this; do not change other buttons' styling. Depends on T004.

**Checkpoint**: US1 works alone (button visible and focusable; pressing it can be wired in US2).

---

## Phase 3: User Story 2 - Reach a placeholder for course creation (P1)

**Goal**: Pressing the button opens the "Create a course" placeholder once, creates no data, and Home is unchanged on return.

**Independent Test**: Press the button. The placeholder titled "Create a course" opens with a Back to Home link. Back to Home and the browser back button both return to a Home with the same courses, goals and removed courses. Double-clicking creates a single history entry.

- [x] T006 [US2] In `src/features/home/components/CreateCourseButton.tsx` wire the click handler: keep a `useRef(false)` flag named `pressed`; on click, return early if `pressed.current` is true, otherwise set it to true and call `navigate("/courses/new")`. Do not reset the flag (the component unmounts on navigation; Home remounts fresh on return). Do not read or write the learner store or any course data (spec FR-003: "It MUST NOT create a course or change any data."). Depends on T002, T003.

**Checkpoint**: US1 and US2 work together (full feature).

---

## Phase 4: Polish & Cross-Cutting

- [x] T007 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T008 Walk through every scenario in `specs/003-create-course-button/quickstart.md` in the browser (`pnpm dev`): visible at desktop and 360 px width, visible in no-match and no-courses states, keyboard Tab/Enter/Space, placeholder content and Back to Home, browser back, unchanged data, double-click gives a single history entry, dark scheme contrast. Fix any deviation.

---

## Dependencies & Execution Order

- T001 and T002 are independent and can run in parallel.
- T003 needs T001 (icon). T004 needs T003. T005 needs T004. T006 needs T002 and T003.
- US1 (T003 to T005) and US2 (T006) both edit `CreateCourseButton.tsx` (T003 then T006), so run them in sequence.
- Polish (T007, T008) runs last.

## Parallel Opportunities

- T001 and T002 together.
- After T003: T004 (HomePage) and T006 (button handler) touch different files and can proceed together once T002 is done.

## Implementation Strategy

- **MVP**: T001 to T006 deliver the whole feature (the button, the route and the guard). It is small enough to ship as one increment.
- Stop after T006, run `pnpm typecheck`, then finish with T007 and T008.
