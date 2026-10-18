# Feature Specification: Electron Foundation

**Feature Branch**: `016-electron-foundation`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-001 (partly), FR-008). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Run the existing app inside a secure desktop shell with an empty local database and automated checks.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the existing app as a desktop app (Priority: P1)

The learner starts the desktop app and sees the current Home screen working as in the browser prototype.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the app starts, **Then** the Home screen appears and the window cannot reach files, the network or system features directly.
2. **Given** the app was started once, **When** it starts again, **Then** a local library already exists and opens without errors.
3. **Given** a second copy is started, **When** the first is running, **Then** the second focuses the first window instead of opening the same library twice.

---

### User Story 2 - Safe library upgrades (Priority: P2)

A future version can change how data is stored without losing existing data.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a library from an older version, **When** the new version starts, **Then** a copy is kept and the library is upgraded automatically.
2. **Given** a library from a newer version, **When** an older app opens it, **Then** the app refuses with an "update the app" message and changes nothing.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project constitution MUST be amended to allow the desktop toolchain, local database, validation, scheduling and test libraries before any of them is used.
- **FR-002**: The app MUST run on Windows, macOS and Linux, with the web renderer isolated from the operating system.
- **FR-003**: The app MUST create and open a local library file and upgrade it safely (copy first).
- **FR-004**: Only one instance MAY open a library at a time.
- **FR-005**: Automated checks (type check, lint, unit tests, desktop build on three systems) MUST run on every change.

### Key Entities *(include if feature involves data)*

- Entities: Library (with format version).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The packaged app starts to a usable Home screen in under 3 seconds on a typical laptop.
- **SC-002**: The same automated checks pass on Windows, macOS and Linux.
- **SC-003**: 100% of upgrades from a previous library version keep all data.

## Assumptions

- Prerequisite for all other desktop specs. No user data features here.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
