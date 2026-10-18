# Implementation Plan: Spaced Repetition Sessions

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Every practice answer now updates a per-word FSRS card (`ts-fsrs`, desired retention 0.9) stored in the `cards` table
(migration 0005). `study.plan` chooses a session's words: Learn takes new words in course order up to the daily new-word limit
(default 10, per course), Classic and Speed review take due cards oldest first (up to 20). Home and course pages show counts
computed from cards; the leaderboard is replaced by personal statistics (streak, recall rate, answers per day).

## Decisions
- Rating: gave up, timeout, or any mistake before the right answer = Again; hints = Hard; clean = Good; clean in under 3 s in
  Speed review = Easy. A word is "learned" at its first recalled answer.
- The learner's day starts at 04:00 local time (streak, "practiced today", new-word allowance). A clock set backwards never
  gives a review time before the last one.
- Ignored words never appear in sessions; long-term words are excluded from reviews; both are set on the practice screen
  (minus-circle and bolt buttons) and the word is skipped without an answer being recorded.
- Counts (`learned`, `due`, ignored, long-term, practiced today) are overlaid in the renderer from `study.progress`, refreshed at
  start, after each session and every minute; the browser build keeps the old sample numbers.
- Course export can include progress (cards only; the review history stays local). Import restores it only when the importer
  ticks the box, mapping cards to the freshly generated word ids.
- "New words per day" is an option in the course menu (5 to 30).
- The built-in sample leaderboard, its panel and route were removed.

## Constitution Check
Pass (v3.0.0): ts-fsrs is listed; features stay module-scoped (practice and course-detail read progress through `features/home`).
