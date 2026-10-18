# Feature Specification: Local Media Storage

**Feature Branch**: `018-local-media-storage`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-004). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Images and audio are stored as files on the computer, shown in the editor, validated and cleaned up automatically.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add images and audio to words (Priority: P1)

The learner adds up to five images and five audio files per word and sees and plays them.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a word, **When** the learner picks an allowed image under 2 MB, **Then** it is attached and displayed.
2. **Given** a file of the wrong type, too large, or with a fake extension, **When** it is added, **Then** it is rejected with a clear message.
3. **Given** a word already has five images, **When** another is added, **Then** it is refused with a limit message.

---

### User Story 2 - No wasted space (Priority: P2)

Files no longer used are removed, and the same file used twice is stored once.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** an image is removed from its only word, **When** cleanup runs, **Then** the file is deleted.
2. **Given** the same image is attached to two words, **When** one is removed, **Then** the file remains for the other.

---

### User Story 3 - Duplicate a level with media (Priority: P2)

Duplicating a level keeps its images and audio without copying files.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a level with media, **When** it is duplicated, **Then** the copy shows the same media and disk use does not grow.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Images (PNG, JPEG, GIF, WebP, up to 2 MB) and audio (MP3, WAV, OGG, M4A, up to 3 MB) MUST be checked by actual content, not only name or declared type.
- **FR-002**: At most 5 images and 5 audio files per word.
- **FR-003**: Identical files MUST be stored once and shared.
- **FR-004**: Unused files MUST be removed automatically at startup and after deletions.
- **FR-005**: Media MUST be displayable in the app without exposing file system paths to the screens.

### Key Entities *(include if feature involves data)*

- Entities: Media file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rejected files leave the library unchanged.
- **SC-002**: Adding a 2 MB image shows it in under 1 second.
- **SC-003**: Duplicating a level adds no new files on disk.

## Assumptions

- Depends on 017. Replaces the browser media store.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
