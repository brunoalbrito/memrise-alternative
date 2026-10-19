# Feature Specification: Exercise Settings

**Feature Branch**: `feat/exercise-types`

**Created**: 2026-10-18

**Status**: Draft

**Input**: The learner chooses which exercise types are used, for example turning typing off, and the choice is saved on this computer.

Research: [docs/exercises/research.md](../../docs/exercises/research.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose exercise types (Priority: P1)

A dialog lists every exercise type with a short explanation and a switch.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** the practice screen, **When** the learner opens Exercise types, **Then** every type is listed (typing, pick the picture, pick the word for a picture, pick the meaning, pick the word for a meaning, hear and pick, pick the recording, hear and type).
2. **Given** a type is turned off, **Then** it is not used from the next session on; turning off all but one still works.
3. **Given** all types are turned off, **Then** the dialog refuses and keeps at least typing or one choice type on.
4. **Given** the app restarts, **Then** the choice is remembered.

---

### User Story 2 - Quick presets (Priority: P3)

One click sets a common mix.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** the dialog, **Then** presets "All types", "No typing" (choices and listening only) and "Typing only" are offered.

---

### Edge Cases

- A course with few words: exercises that need distractors fall back to ones that are possible.
- Words with identical meanings, repeated pictures or empty fields never produce duplicate or blank options.
- Very long text in options wraps; images that fail to load show an empty placeholder.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The setting is stored in the library settings and applies to all courses.
- **FR-002**: Exercises that are off are never chosen, even as a fallback, unless nothing else is possible; then typing is used and the learner is not blocked.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The setting survives a restart in 100% of tests.
- **SC-002**: Turning a type off takes effect from the next session.

## Assumptions

- Builds on the typing practice screen (021), scheduling (022) and the level page (026).
- Out of scope: speaking exercises (needs speech recognition), writing a sentence, exercises across several words at once.
