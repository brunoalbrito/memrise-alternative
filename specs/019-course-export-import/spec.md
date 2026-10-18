# Feature Specification: Course Export and Import

**Feature Branch**: `019-course-export-import`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-007, FR-009 to FR-015). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Export a whole course (or the whole library) to one file and import it elsewhere safely, including data from the browser prototype.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export a course to one file (Priority: P1)

The learner exports a course with its media to a single file, optionally with their progress.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a course, **When** the learner exports it, **Then** one file is saved and progress is shown for large courses.
2. **Given** "Include my progress" is unticked (default), **When** the file is imported, **Then** the course starts without progress.

---

### User Story 2 - Import a course file (Priority: P2)

The learner opens or drops a file and gets the course, choosing what to do on conflict.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** an empty library, **When** a valid file is imported, **Then** the course is identical to the original.
2. **Given** the course already exists, **When** importing, **Then** the learner chooses Replace, Import as copy or Cancel.
3. **Given** a damaged, unsafe, unknown or newer-version file, **When** importing, **Then** a clear message appears and nothing changes.

---

### User Story 3 - Whole library and prototype data (Priority: P2)

The learner exports all courses to one file, and brings over data from the browser prototype once.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** several courses, **When** the learner exports the library, **Then** one file contains all and can be imported back.
2. **Given** the file produced by the prototype's export button, **When** imported twice, **Then** the data appears once.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Export MUST produce one file with course details, levels, words, images and audio; the format is defined in contracts/membetter-file-format.md of the local-first requirements.
- **FR-002**: Import MUST validate structure, version, content integrity, safe paths, and size limits, and MUST be all-or-nothing.
- **FR-003**: Conflict choices Replace, Import as copy and Cancel MUST be offered.
- **FR-004**: Exports MUST never contain AI keys, settings or backup information.
- **FR-005**: The browser prototype MUST offer an "Export my data" button producing an importable file.

### Key Entities *(include if feature involves data)*

- Entities: Course file, Library file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Export-import round trips of 100% of test courses match the original.
- **SC-002**: A 500-word course with media exports in under 30 seconds and imports in under 60 seconds.
- **SC-003**: 100% of hostile test files are rejected with no library change.

## Assumptions

- Depends on 018. Study progress export is only included once 022 exists; until then the option is hidden.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
