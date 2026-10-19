# Implementation Plan: Speed Review Game

**Branch**: `feat/speed-review-game` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
A dedicated game screen `SpeedReviewPage` (route `/course/:id/speed-review`) replaces the typing-with-countdown version. A pure game model
(`model/speedGame.ts`) holds lives, streak and score rules; a hook runs the clock (real time, 50 ms ticks) and the question flow; the
existing `ChoiceExercise` component shows the question and options. Only choice exercises are used; words that cannot be asked as choices are left out.
Answers are recorded with `study.answer` (wrong pick = gave_up, timeout = timeout, so both rate Again).

## Decisions
- Question time: 6 s, 7 s above 25 characters of prompt, 8 s above 50 characters or for listening questions.
- Words: due words, oldest first, at most 20 (the existing plan); no typing fallback.
- After an answer the game pauses 350 ms (right) or 900 ms (wrong, showing the right option), then moves on.
- The red tint is a fixed overlay whose opacity follows the time left; with reduced motion it changes in coarse steps.
- Per-question points can exceed 100, so the answer log accepts up to 10,000.
- The old typing countdown code is removed from `PracticePage` (speed review is its own screen now).

## Constitution Check
Pass (v3.0.0): feature-scoped in `features/practice`, M3 tokens, no new libraries.
