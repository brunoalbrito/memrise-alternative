# Implementation Plan: Exercise Settings

**Branch**: `feat/exercise-types` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
A setting `practice.disabledExercises` (list of kinds) stored in the library settings table, read and written through the main process
(`study.exerciseSettings`, `study.setExerciseSettings`). The practice header gets an "Exercise types" button that opens a dialog with a
switch and a short explanation per kind and three presets (All types, No typing, Typing only). The selector uses the enabled kinds when
a session starts.

## Decisions
- At least one kind must stay on; if the enabled kinds are impossible for a word, typing (or hear-and-type) is used so the learner is not blocked.
- The change applies from the next session (exercises are prepared when a session starts); the dialog says so.
- The setting is global, not per course.

## Constitution Check
Pass: no new libraries.
