---

description: "Task list for Session Picker"
---

# Tasks: Session Picker

**Input**: Design documents from `/specs/015-session-picker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Conventions

- Paths relative to the repository root. TypeScript strict. M3 tokens only, no hard-coded colors. No new dependencies.
- Exact texts and routes come from `contracts/ui-contract.md`.

---

## Phase 1: Foundational

- [x] T001 [P] In `src/shared/ui/icons.tsx` add `WaterDropIcon` (Material "water_drop" path `M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z`) and `CloseIcon` (Material "close" path `M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z`) using the same `Icon` wrapper as the others.
- [x] T002 [P] In `src/features/home/model/selectors.ts` add `recommendedSession(course: Course): "classic-review" | "learn-new-words"` (classic review when `course.itemsDue > 0`, else learn new words) and `dueBadge(due: number): string | null` (`null` for 0 or less, the number as text from 1 to 98, `"99+"` from 99 up).

## Phase 2: User Story 1 - Pick a learning session from the Home card (P1) 🎯 MVP

- [x] T003 [US1] Create `src/features/home/components/SessionDialog.tsx` per `contracts/ui-contract.md`: props `course: Course`, `onClose: () => void`. Native `<dialog>` opened with `showModal()` in an effect (guard `!dialog.open`), `aria-labelledby` the title id, classes `m-auto max-h-[90vh] w-[min(92vw,28rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim`, `onClose` calling the prop; a click on the dialog element itself (`event.target === event.currentTarget`) closes it (use `dialog.close()`), content inside an inner `div` so clicks on content do not close. Header: `h2` course title (`break-words text-title-large`) and a close `IconButton aria-label="Close"` with `CloseIcon`. Section "Next up for you" (small heading) with a large filled `Button` showing `recommendedSession(course)`: "Classic review" with `WaterDropIcon` or "Learn new words" with `LeafIcon`. Section "Or choose your session" with three round buttons in a flex row that wraps: `size-16` circles with the icon (`LeafIcon` on `bg-primary-container text-on-primary-container`, `WaterDropIcon` on `bg-secondary-container text-on-secondary-container`, `TimerIcon` on `bg-surface-variant text-on-surface-variant`) and a label under each ("Learn new words", "Classic review", "Speed review"); Classic review shows a badge from `dueBadge(course.itemsDue)` (absolute top-right, `bg-on-surface text-surface`, rounded, plus visually hidden " N words due") only when not null; Classic review and Speed review are `disabled` when `course.itemsDue` is 0. Choosing any session calls `navigate` to `/course/${course.id}/learn`, `/course/${course.id}/review` or `/course/${course.id}/speed-review` (`useNavigate`) after closing the dialog. Depends on T001, T002.
- [x] T004 [US1] In `src/features/home/components/CourseCard.tsx` replace the grid `IconButton`'s `onClick` (it navigates to `/course/${course.id}`) with `() => setSessionOpen(true)`, change its `aria-label` to "Choose a session" and add `aria-haspopup="dialog"`; add `const [sessionOpen, setSessionOpen] = useState(false)` and a ref on that button; render `{sessionOpen && <SessionDialog course={course} onClose={() => { setSessionOpen(false); gridButtonRef.current?.focus(); }} />}` inside the card. `IconButton` already accepts `ref` and `className`. Depends on T003.
- [x] T005 [US1] In `src/app/router.tsx` change the title of the `/course/:id/review` placeholder from "Review" to "Classic review". Update `specs/005-course-detail-view/contracts/ui-contract.md` and `specs/002-course-home-dashboard/contracts/ui-contract.md` with a one-line note: "The Home grid button now opens the session dialog (specs/015-session-picker); the course page opens from the title." Depends on T004.

## Phase 3: User Story 2 - Close the dialog without choosing (P1)

- [x] T006 [US2] Verify in `SessionDialog.tsx` and `CourseCard.tsx` that the X, Escape and a click outside all close the dialog without navigating, that focus returns to the grid button, that the dialog traps focus, and that only one dialog exists at a time. Fix only deviations. Depends on T004.

## Phase 4: Polish

- [x] T007 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T008 Walk through `specs/015-session-picker/quickstart.md` in the browser and fix any deviation (layout at 360 px, badge, disabled states).

## Dependencies & Execution Order

- T001 and T002 together; T003 after both; T004 after T003; T005 and T006 after T004; T007 and T008 last.

## Implementation Strategy

- MVP: T001 to T006 are the whole feature; then T007 and T008.
