# Implementation Plan: Course Export and Import

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

Format: [membetter-file-format](../../docs/local-first/contracts/membetter-file-format.md).

## Summary
`.membetter` is a zip (fflate) with `manifest.json`, `course.json` (or `courses/<id>/course.json` for a library) and
`media/<sha256>.<ext>`. The renderer builds the course payload (it owns built-in sample courses and the learner's edits) and
main writes the archive atomically with a save dialog. Import is two steps, both in main: `inspect` fully validates the file
(entry allow-list, size/count/ratio limits, schemas, SHA-256 and magic-byte checks of every media file) and stages it;
`commit` applies it in one SQLite transaction with the chosen conflict policy (replace, copy), then garbage-collects media.

## Decisions
- Imported courses always become the learner's own courses with fresh level, word and media ids.
- Course ids: `custom-…` and `imported-…` are kept; ids from built-in samples map to `imported-<id>` so repeating an import
  replaces instead of duplicating. A conflict is an existing non-deleted course with the target id.
- Progress is not exported yet (no study data until spec 022); learned flags are reset on import.
- Drag and drop and OS "open with" (`.membetter` association, `open-file`, argv) deliver a path to the same flow.
- The browser build gets "Export my data", which builds a library file from `localStorage` (`membetter.learner`) and IndexedDB.
- Hash router in the desktop build (file:// URLs do not survive reloads with the history router).
- Home gets its Import / Export all / Export course actions through a `HomeExtensions` context provided by the app shell, so
  `features/home` and `features/library` do not depend on each other circularly.
- The whole archive is read into memory (limit 2 GB); streaming reads are a later optimization.

## Constitution Check
Pass (v3.0.0): fflate and zod are listed; no new libraries beyond them.
