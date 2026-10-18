---

description: "Task list for Edit Course Button"
---

# Tasks: Edit Course Button

**Input**: Design documents from `/specs/007-edit-course-button/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/ui-contract.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - See "Edit Course" on every course page (P1) 🎯 MVP

**Goal**: The link is shown on every course page, correctly placed, sized and operable.

**Independent Test**: Quickstart scenarios 1 to 4 and 7.

- [x] T001 [US1] In `src/features/course-detail/components/LevelsSection.tsx` make `editHref` a required `string` prop and always render the "Edit Course" `Link` (remove the `editHref ? ... : undefined` condition). Add `min-h-12 sm:min-h-10` to the link's classes (keep `inline-flex items-center gap-2`, the `EditIcon` and the focus-visible outline).
- [x] T002 [US1] In `src/features/course-detail/components/Tabs.tsx` add `flex-wrap` to the tab row container (`<div className="flex items-center justify-between gap-3 border-b border-outline-variant">`) so the action can wrap below the tab on very narrow widths.
- [x] T003 [US1] In `src/features/course-detail/CourseDetailPage.tsx` change the `editHref` prop to always be `` `/course/${course.id}/edit` `` (remove the `detail.isOwn ? ... : undefined` condition).
- [x] T004 [US1] In `src/features/course-detail/hooks/useCourseDetail.ts` remove `isOwn` from the returned object (keep the local `isOwn` constant used to pick default extras). Search `src` to confirm nothing else reads `detail.isOwn`. Depends on T003.

**Checkpoint**: link visible on every course.

---

## Phase 2: User Story 2 - Reach the placeholder once (P1)

**Goal**: Pressing the link opens the "Edit Course" placeholder a single time.

**Independent Test**: Quickstart scenarios 5 and 6.

- [x] T005 [US2] In `LevelsSection.tsx` add `const pressed = useRef(false)` and an `onClick` on the link: if `pressed.current` is true call `event.preventDefault()` and return, otherwise set `pressed.current = true` and let the navigation proceed. Do not reset the flag. The route `/course/:id/edit` and its placeholder already exist and stay unchanged. Depends on T001.

---

## Phase 3: Polish

- [x] T006 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T007 Walk through the scenarios in `specs/007-edit-course-button/quickstart.md` in the browser and fix any deviation.

## Dependencies & Execution Order

- T001, T002 and T003 touch different files and can run together; T004 after T003; T005 after T001; T006 and T007 last.

## Implementation Strategy

- MVP: T001 to T005 are the whole feature. Then T006 and T007.
