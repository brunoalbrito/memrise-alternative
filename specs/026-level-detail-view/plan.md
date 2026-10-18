# Implementation Plan: Level Detail View

**Branch**: `feat/level-detail-view` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Replace `LevelPlaceholder` with a real page at `/course/:id/levels/:level` inside the `course-detail` feature: top bar, level header
(plant, name, progress, Edit Level, Options, main practice button), counts, a legend, a selectable word list with pictures and
progress-based status, and previous/next level cards. Practice gains an optional level scope (`?level=<levelId>` on the learn,
review and speed-review routes). Ignoring words uses one batched IPC call and updates the page at once.

## Technical Context
TypeScript strict, React 19, React Router, Tailwind with M3 tokens, Zustand stores that already hold levels (`useCourseLevels`)
and study progress (`useProgressStore`). Main process: `study.markMany` (one transaction) and `lapses` added to the progress
payload (used for "difficult").

## Constitution Check
Pass (v3.0.0): new components live in `features/course-detail`; practice stays in `features/practice` and reads the level scope from
the address; M3 tokens only; no new libraries; keyboard operable with visible focus.

## Structure
```text
src/features/course-detail/
├── LevelDetailPage.tsx                 (replaces LevelPlaceholder.tsx)
├── components/level/  LevelTopBar, LevelHeader, StatusLegend, WordList, LevelWordRow, LevelNav
├── model/             wordStatus.ts (status, difficult rule), dueText.ts (relative time), levelStats.ts (counts, main action)
└── hooks/useLevelDetail.ts
src/features/practice/PracticePage.tsx  (level scope)
electron/services/study.ts              (markMany, lapses in progress); electron/shared/api.ts, preload, main IPC
tests/unit/level-model.test.ts          tests/e2e/level-detail.spec.ts
```

## Decisions
- "Difficult" = two or more lapses (mistakes after the word was learned), taken from the FSRS card.
- Status text and markers: new = eye + "ready to learn"; practiced = drop + "now" or "in 3 days"; difficult adds a bolt; ignored rows are dimmed
  with an "ignored" label. Each marker has a text alternative.
- Main button: due words first ("Review N words" opens classic review), else new words ("Learn N new words"), else disabled. The daily
  new-word limit is applied by the session, which shows its usual message when the limit is reached.
- The level is addressed by position, as the course page links it; the practice scope uses the level id so it survives reordering.
- Word list rows use `content-visibility: auto` and lazy pictures so a 500-word level stays responsive.
