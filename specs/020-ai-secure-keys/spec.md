# Feature Specification: AI Assistant with Protected Keys

**Feature Branch**: `020-ai-secure-keys`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-005, FR-006). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: The AI Word Assistant keeps working, with keys held in the operating system's protected storage and never shown again.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect and use the AI assistant (Priority: P1)

The learner saves a key, tests it, and uses Auto-fill with results stored locally.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a key is saved, **When** the dialog reopens, **Then** it shows only "connected, ending in 1234".
2. **Given** Auto-fill, **When** it runs, **Then** definition, sentences, IPA, audio and picture are produced and stored locally.
3. **Given** an invalid key or a network failure, **When** the assistant runs, **Then** a clear message appears and the word is unchanged.

---

### User Story 2 - Keys stay private (Priority: P2)

The key cannot be read from the screens, exports, backups or logs.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a saved key, **When** a course or library is exported, **Then** the key is not in the file.
2. **Given** the system has no secure storage, **When** a key is saved, **Then** the learner is warned that protection is weaker.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Keys MUST be stored in the operating system's protected storage and MUST be write-only for the screens.
- **FR-002**: AI requests MUST be made by the app core, not by the screens, with time limits and clear errors.
- **FR-003**: Generated audio and pictures MUST be stored through the local media storage.
- **FR-004**: Model names MUST stay editable per user.

### Key Entities *(include if feature involves data)*

- Entities: Secret, AI settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No key appears in any export, backup, log or screen after saving.
- **SC-002**: Auto-fill completes or fails with a clear message within 60 seconds.

## Assumptions

- Depends on 018. Existing keys in the browser prototype are not migrated; the learner enters them again.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
