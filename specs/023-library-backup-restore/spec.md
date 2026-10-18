# Feature Specification: Library Backup and Restore

**Feature Branch**: `023-library-backup-restore`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-016 to FR-018). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Automatic and manual backups of the whole library with a simple restore.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic backups (Priority: P1)

The app backs up the library on a schedule to a folder the learner chooses.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** automatic backups are on, **When** the app starts and the last backup is older than the interval, **Then** a backup is made and old ones beyond the limit are removed.
2. **Given** the folder is unavailable, **When** a backup is due, **Then** a non-blocking warning is shown.

---

### User Story 2 - Restore (Priority: P2)

The learner restores any backup after confirming.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a backup, **When** restored and confirmed, **Then** the library returns to that state.
2. **Given** a damaged or too-new backup, **When** restore is attempted, **Then** it is refused and the library is unchanged.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backups MUST be consistent while the app is open, configurable (folder, interval, number kept, default ten) and runnable on demand.
- **FR-002**: Restore MUST require confirmation and validate the backup first.
- **FR-003**: Backups MUST NOT contain AI keys.

### Key Entities *(include if feature involves data)*

- Entities: Backup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Restoring a backup returns 100% of the data present when it was made.
- **SC-002**: A backup of a 1 GB library finishes without blocking the app.

## Assumptions

- Depends on 018 and 020 (to exclude keys). Whole-library file export already exists from 019.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
