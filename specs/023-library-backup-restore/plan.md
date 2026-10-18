# Implementation Plan: Library Backup and Restore

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
`electron/services/backup.ts`: a backup is `<folder>/membetter-<time>.db`, a consistent snapshot taken with SQLite's online backup
API while the app is open, plus a shared `<folder>/media` where only files not yet there are copied. AI keys are deleted from the
copy (with secure delete and VACUUM) so they never reach disk in a backup. Backups run at start and hourly when due (default:
daily, keep 10, `Documents/MemBetter Backups`), and on demand from the Backups dialog. Restore validates first (integrity, not
from a newer version, all media present), stages the restored database with the current keys put back, then swaps the live
database, keeps the previous library in `pre-restore/`, and restarts the app.

## Decisions
- A failed backup is remembered (`backup.lastError`) and shown as a non-blocking warning at start and in the dialog.
- Retention keeps the newest N databases and removes media no kept backup refers to.
- `MEMBETTER_BACKUP_FOLDER` overrides the default folder (used by tests).
- "Export entire library" already exists from spec 019 (Export all).
- A restore that is refused leaves the library and its files exactly as they were.

## Constitution Check
Pass (v3.0.0): no new libraries.
