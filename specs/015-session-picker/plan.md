# Implementation Plan: Session Picker

**Branch**: `015-session-picker` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-session-picker/spec.md`

## Summary

Pressing the grid button on a Home course card now opens a session dialog instead of the course page. The
dialog (native `<dialog>`, Material Design 3) shows the course name, a "Next up for you" large button for the
recommended session, and three round session buttons (Learn new words, Classic review with a due badge, Speed
review). Choosing one closes the dialog and opens the existing placeholder screen of that session. The review
placeholder is renamed "Classic review". No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Tailwind CSS 4.3.3. No new dependencies.

**Storage**: None

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`, `pnpm build` and
[quickstart.md](./quickstart.md).

**Constraints**: M3 tokens only; keyboard operable; focus trapped in the dialog and returned on close; works from
360 px

**Scale/Scope**: 1 new component, edits to 4 files

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | One self-contained `SessionDialog` plus a small pure helper for the badge and the recommendation |
| III. Feature-scoped modules | Pass | Inside `features/home`, routes in `app/router.tsx` |
| IV. Simplicity over abstraction | Pass | Reuses the native dialog pattern, existing icons and routes |
| V. Material Design 3 | Pass | Dialog surface, filled button, tonal circular buttons, token colors |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

```text
specs/015-session-picker/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

```text
src/
├── app/router.tsx                                  # edit: review placeholder title "Classic review"
├── shared/ui/icons.tsx                             # edit: WaterDropIcon, CloseIcon
└── features/home/
    ├── model/selectors.ts                          # edit: recommendedSession, dueBadge
    └── components/
        ├── SessionDialog.tsx                       # new
        └── CourseCard.tsx                          # edit: grid button opens the dialog
```

**Structure Decision**: One new dialog component beside the card that opens it.

## Complexity Tracking

No constitution violations to justify.
