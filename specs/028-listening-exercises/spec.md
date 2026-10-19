# Feature Specification: Listening Exercises

**Feature Branch**: `feat/exercise-types`

**Created**: 2026-10-18

**Status**: Draft

**Input**: Practice words by ear: hear a word and pick the right text, see a word and pick the right recording, or hear a word and type it.

Research: [docs/exercises/research.md](../../docs/exercises/research.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hear it, pick the word (Priority: P1)

The learner hears a recording and chooses the written word among four.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a word with audio, **When** it is practiced, **Then** the recording plays on its own and a replay button plays it again.
2. **Given** four written words, one correct, **When** the learner picks, **Then** feedback and recording behave like other choice exercises.
3. **Given** audio that cannot be played, **Then** a clear message appears and another exercise type is used for that word.

---

### User Story 2 - See it, pick the recording (Priority: P2)

The learner sees a word and picks which of four recordings says it.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a word and three other words with audio, **Then** four play buttons are shown; each plays its recording and one is correct.
2. **Given** the learner plays options and picks one, **Then** it is graded like any choice.

---

### User Story 3 - Hear it, type it (Priority: P2)

The learner hears a word and types it with the usual typing screen (letters, hints, give up).

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a word with audio, **Then** the typing screen shows a replay button instead of a picture, and grading is the same as typing practice.
2. **Given** the word text must stay hidden until answered, **Then** it is not shown on screen or in accessible labels before the answer.

---

### User Story 4 - Fits into the mix (Priority: P2)

Listening exercises are chosen only for words that have audio and only when the learner has them on.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** words without audio, **Then** they never get a listening exercise.
2. **Given** a word in review with audio, **Then** hear-and-type and hear-and-pick are among the harder types chosen.

---

### Edge Cases

- A course with few words: exercises that need distractors fall back to ones that are possible.
- Words with identical meanings, repeated pictures or empty fields never produce duplicate or blank options.
- Very long text in options wraps; images that fail to load show an empty placeholder.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Audio is played by the app without a network.
- **FR-002**: Replay is always available and by keyboard (R).
- **FR-003**: A word's own text is never exposed before answering in listening exercises.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A recording starts within 300 ms of the exercise appearing.
- **SC-002**: Listening exercises are never offered for a word without audio (automated test).

## Assumptions

- Builds on the typing practice screen (021), scheduling (022) and the level page (026).
- Out of scope: speaking exercises (needs speech recognition), writing a sentence, exercises across several words at once.
