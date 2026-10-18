# Feature Specification: Desktop Release

**Feature Branch**: `025-desktop-release`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers SC-001, SC-011). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Installers, signing, automatic updates and the privacy text for the public release.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install and update (Priority: P1)

The learner installs the app on their system and receives updates without losing data.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** an installer, **When** run on Windows, macOS or Linux, **Then** the app installs and starts without security warnings once signed.
2. **Given** a new version is published, **When** the app checks, **Then** the learner is offered the update and data survives it.

---

### User Story 2 - Know what is stored (Priority: P2)

The learner can read what the app stores and sends.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** the app, **When** the learner opens the privacy page, **Then** it explains local storage and what AI calls send.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Installers for Windows, macOS and Linux with signing and notarization where required.
- **FR-002**: Automatic update with data kept.
- **FR-003**: A privacy page describing stored data and data sent to AI providers.
- **FR-004**: A performance pass against the library size target.

### Key Entities *(include if feature involves data)*

- Entities: none new.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user installs and starts practicing within five minutes.
- **SC-002**: Home opens in under 3 seconds with 50 courses and 20,000 words.
- **SC-003**: Updates keep 100% of data.

## Assumptions

- Depends on all earlier specs; last to ship.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
