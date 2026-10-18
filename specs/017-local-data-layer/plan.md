# Implementation Plan: Local Data Layer

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Persist the learner's library (created courses, edits to sample courses, levels and words, goals, removed courses) in SQLite
through the main process. The renderer keeps its Zustand store and component API but is now a write-through cache: it
hydrates from `window.api.library.load()` at start and sends one validated change per mutation with `library.apply()`.

## Technical Context
Migration `0002_content.sql` (courses, course_edits, course_settings, levels, words). Service `electron/services/library.ts`
(load, apply, purgeTrash). Validation with zod in `electron/shared/schemas.ts`, enforced in main by `electron/ipc/register.ts`.
Level edits are debounced 400 ms and flushed on page hide; queue is ordered; failed writes are kept for retry and shown in
the editor header (Saving / Saved / Save failed + Retry).

## Decisions
- Sample courses stay built into the app and can be removed/restored as before (hidden flag), instead of an install action;
  edits and levels for samples are stored in the library. This kept every screen unchanged.
- Words keep image/audio references as JSON until spec 018 moves media to files.
- Courses are soft-deleted and purged after 30 days.
- The browser build keeps working without persistence (development only); the old `localStorage` data is left untouched for the
  prototype import (spec 019).

## Constitution Check
Pass (v3.0.0): feature-scoped store stays in `features/home`; main-process code under `electron/`.
