# Feature Specification: Local Data Layer

**Feature Branch**: `017-local-data-layer`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-001 to FR-003). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Courses, levels, words, goals and settings are stored locally and every existing screen reads and writes them there.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and edit courses that survive restarts (Priority: P1)

The learner creates courses, levels and words and finds them after restarting, offline.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a new course with levels and words, **When** the app is closed and reopened offline, **Then** all content is present.
2. **Given** the learner edits a word, **When** one second passes, **Then** the change is saved and a saved status is shown.
3. **Given** a save fails, **When** it happens, **Then** a clear failed status is shown with a retry.

---

### User Story 2 - Home, details, goals and hide/restore keep working (Priority: P2)

All existing Home and detail behavior works from local data.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** courses exist, **When** Home opens, **Then** cards show real counts, goals and filters as before.
2. **Given** the learner removes a course from Home, **When** they restore it, **Then** it returns with its goal intact.

---

### User Story 3 - Optional sample courses (Priority: P2)

The learner can install the sample courses on demand.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** an empty library, **When** the learner chooses "Install sample courses", **Then** the samples appear as normal courses.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All existing course, level, word, goal, hide/restore and filter behavior MUST keep working with its current validation limits.
- **FR-002**: Changes MUST be saved automatically within one second with a visible saved or failed status.
- **FR-003**: Deleted courses MUST go to a trash for 30 days before being purged.
- **FR-004**: Counts shown (total words, per level) MUST be computed from stored words, not sample numbers.
- **FR-005**: The browser storage used by the prototype MUST no longer be the source of truth.

### Key Entities *(include if feature involves data)*

- Entities: Course, Level, Word, Course settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of data created before closing is present after reopening offline.
- **SC-002**: Home opens in under 3 seconds with 50 courses and 20,000 words.
- **SC-003**: Every prototype validation limit still rejects invalid input.

## Assumptions

- Depends on 016. Media is added in 018, so words keep their existing image and audio placeholders until then.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
