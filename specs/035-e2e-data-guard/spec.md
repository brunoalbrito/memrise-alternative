# Feature Specification: End-to-End Data Guard

**Feature Branch**: `test/isolate-e2e-data-2`

**Created**: 2026-10-18

**Status**: Draft

**Input**: Running the end-to-end tests must never put data in the folders of the installed app.

## Acceptance Scenarios

1. **Given** a test starts the app, **Then** its data folder, app-data folder and backups folder are temporary; any other folder is refused before the app starts.
2. **Given** the whole run finished, **Then** it fails if something new appeared in the library folder of the installed app (`MemBetter`), of the development app (`MemBetter-dev`) or in `~/Documents/MemBetter Backups`, and lists what.
3. **Given** files that disappeared, **Then** that is not an error.

## Requirements

- **FR-001**: The guard uses only names of files, never their content.
- **FR-002**: Unit tests cover the folder list, the comparison and the temporary-folder rule.

## Assumptions

- Using MemBetter during a test run may be reported by the guard; the message says so.
