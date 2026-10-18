# Feature Specification: Anki Interoperability

**Feature Branch**: `024-anki-interop`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-036, FR-037). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Export a course for Anki and import simple word lists from CSV.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export for Anki (Priority: P1)

The learner exports a course that opens in Anki.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a course, **When** exported for Anki, **Then** the file opens in Anki with one deck, one card per word, with image and audio.

---

### User Story 2 - Import a CSV (Priority: P2)

The learner turns a word list into a course.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a CSV with word and meaning columns, **When** imported, **Then** a new course is created and skipped rows are listed with reasons.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Anki export MUST include text fields, images and audio.
- **FR-002**: CSV import MUST let the learner map columns and MUST report skipped rows.

### Key Entities *(include if feature involves data)*

- Entities: none new.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Anki opens 100% of exported test files.
- **SC-002**: CSV files with 5,000 rows import in under 20 seconds.

## Assumptions

- Depends on 018. Optional for the first release.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
