---

description: "Task list for Fix Course Options Menu Overlap"
---

# Tasks: Fix Course Options Menu Overlap

**Input**: Design documents from `/specs/006-fix-menu-overlap/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/ui-contract.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - Menu not covered by card content (P1) 🎯 MVP

**Goal**: The open options menu is fully in front of the card and its neighbors.

**Independent Test**: Open the menu on the first, a middle and the last card; every item is visible and clickable and no card content is drawn over it.

- [x] T001 [US1] In `src/features/home/components/CourseCard.tsx` change the options container `<div className="relative z-10">` to `<div className="relative">`. Keep it positioned (`relative`) and after the title link in the document so it paints above the stretched link overlay.
- [x] T002 [US1] In `src/features/home/components/CourseCard.tsx` change the bottom row `<div className="pointer-events-none relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">` to `<div className="pointer-events-none relative mt-4 flex flex-wrap items-center justify-between gap-3">` (drop only `z-10`). Confirm with a search that no other `z-10` remains in `src/features/home/components/` and that `src/shared/ui/Menu.tsx` still uses `z-20`.

**Checkpoint**: menu is drawn above all card content.

---

## Phase 2: User Story 2 - Card links and buttons keep working (P1)

**Goal**: No regression in card clicks.

**Independent Test**: Quickstart scenario 6.

- [x] T003 [US2] Review `CourseCard.tsx` after T001 and T002: the title `Link` keeps `after:absolute after:inset-0`, the options container and bottom row stay `relative` and come after the link in the DOM, the button group keeps `pointer-events-auto`. Fix only if the structure was broken by the edit.

---

## Phase 3: Polish

- [x] T004 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T005 Walk through the scenarios in `specs/006-fix-menu-overlap/quickstart.md` in the browser and fix any deviation.

## Dependencies & Execution Order

- T001 and T002 edit the same file: run in order. T003 after both. T004 and T005 last.

## Implementation Strategy

- MVP: T001 to T003 are the whole fix. Then run T004 and T005.
