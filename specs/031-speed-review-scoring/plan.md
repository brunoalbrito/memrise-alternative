# Implementation Plan: Speed Review Scoring

**Branch**: `feat/speed-review-game` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Scoring in `model/speedGame.ts`: points per answer, multiplier by streak, extra life every 15 in a row. A personal best per course is stored
in the library `settings` table (`speed.best.<courseId>`) through `study.speedBest` and `study.saveSpeedScore`. The end screen shows score,
correct answers, longest streak, accuracy, personal best and the missed words with their answers.

## Decisions
- points = round((100 + 50 x timeLeft / timeTotal) x multiplier); multiplier = min(5, 1 + floor(streakBefore / 5)).
- Lives: start 3, at most 5; +1 at every 15th correct answer in a row.
- The best score is only saved when it is higher; "New personal best!" is shown only when there was an earlier score or the score is above zero.

## Constitution Check
Pass (v3.0.0): feature-scoped in `features/practice`, M3 tokens, no new libraries.
