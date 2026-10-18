# Implementation Plan: Course Detail View

**Branch**: `005-course-detail-view` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-course-detail-view/spec.md`

## Summary

Add a course page at `/course/:id`, opened by clicking a course (title or whole card) on Home or
its levels button. The page shows a header (breadcrumb, cover symbol, title, creator, Tweet), a
progress summary with Review, speed-review and Options controls, a "Levels (N)" tab with level
cards (completed, in progress, ready to learn), a tabbed leaderboard of fixed sample learners plus
"You", and an Edit Course link for learner-created courses. Levels are derived from each course's
existing totals so Home and this page always agree. Everything beyond the page is a placeholder
route. Built in a new `course-detail` feature module with no new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, React Router 8.4.0, Zustand 5.0.15, Tailwind CSS 4.3.3.
No new dependencies.

**Storage**: No new storage. Reads courses, goals and removals from the existing
`membetter.learner` store. Levels, creators, leaderboard data are static or derived.

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Page renders from local data instantly; leaderboard tab switch under
1 second (SC-004)

**Constraints**: M3 tokens only; keyboard operable (tabs with arrow keys, cards as links or
buttons); visible focus; layout works from 360 px; no libraries outside the constitution stack

**Scale/Scope**: 1 new feature module (~15 files), 1 new page route plus 5 placeholder routes,
edits to 5 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Small self-contained components (`CourseHeader`, `ProgressSummary`, `LevelCard`, `PlantIcon`, `LeaderboardPanel`); data logic in a hook and pure model modules |
| III. Feature-scoped modules | Pass | New `features/course-detail`. It imports `home` and `placeholder` only through their barrels. `home` and `placeholder` do not import `course-detail` |
| IV. Simplicity over abstraction | Pass | Levels derived by one pure function instead of hand-written tables (needed to guarantee FR-019). Three plant variants, one tab pattern reused by two tab sets (levels, leaderboard) in one `Tabs` component |
| V. Material Design 3 | Pass | M3 tabs, cards, filled/tonal buttons, linear progress, token colors, light and dark |
| Tech stack | Pass | Plain React, React Router, Zustand |
| Workflow / a11y | Pass | Tablist roles with arrow keys, links/buttons for cards, `aria-disabled`/`disabled` states |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-course-detail-view/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   └── router.tsx                              # edit: course page + placeholder routes
└── features/
    ├── course-detail/                          # new feature module
    │   ├── index.ts                            # exports CourseDetailPage, LevelPlaceholder
    │   ├── CourseDetailPage.tsx
    │   ├── LevelPlaceholder.tsx
    │   ├── components/
    │   │   ├── CourseHeader.tsx
    │   │   ├── ProgressSummary.tsx
    │   │   ├── Tabs.tsx                        # shared by levels tab and leaderboard
    │   │   ├── LevelsSection.tsx
    │   │   ├── LevelCard.tsx
    │   │   ├── PlantIcon.tsx
    │   │   └── LeaderboardPanel.tsx
    │   ├── hooks/
    │   │   └── useCourseDetail.ts              # course + derived detail, or "not found"
    │   ├── model/
    │   │   ├── levels.ts                       # buildLevels, levelState
    │   │   ├── breadcrumb.ts                   # categoryPath(course)
    │   │   └── leaderboard.ts                  # rankEntries (ties, order)
    │   └── data/
    │       ├── sampleCourseExtras.ts           # creator, long term, ignored, level names
    │       └── sampleLeaderboard.ts            # fixed entries for Week, Month, All Time
    ├── home/
    │   ├── index.ts                            # edit: export CourseOptionsMenu, percentLearned, getCategoryById, Course type
    │   └── components/
    │       ├── CourseCard.tsx                  # edit: stretched title link, levels button, new routes
    │       ├── CourseOptionsMenu.tsx           # edit: optional onRemoved callback
    │       └── RemoveCourseDialog.tsx          # edit: optional onRemoved callback
    └── placeholder/                            # unchanged
```

**Structure Decision**: A separate `course-detail` feature owns the page. It reuses Home's
options menu, goal and remove dialogs through the barrel so behavior is identical, and the
shared placeholder screens.

## Complexity Tracking

No constitution violations to justify.
