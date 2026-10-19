# Feature Specification: Multiple-Choice Exercises

**Feature Branch**: `feat/exercise-types`

**Created**: 2026-10-18

**Status**: Draft

**Input**: Practice words by choosing the right answer: the right picture for a word, the right word for a picture, the right meaning for a word, and the right word for a meaning. The app chooses the exercise type for each word.

Research: [docs/exercises/research.md](../../docs/exercises/research.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick the right picture or word (Priority: P1)

The learner sees a word and picks its picture among four, or sees a picture and picks its word among four.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a word with a picture and at least three other pictured words in the course, **When** it is practiced, **Then** it can appear as "pick the picture for this word" with four pictures, one of them correct.
2. **Given** the same word, **Then** it can appear as "pick the word for this picture": the picture shown and four words, one correct.
3. **Given** the learner clicks a wrong option, **Then** that option is marked wrong and disabled, the attempt is counted, and they can try another.
4. **Given** the learner clicks the right option, **Then** success feedback, points and the next word follow, as in typing practice.
5. **Given** the learner presses a number key 1 to 4, **Then** the matching option is chosen; Ctrl or Cmd+Enter gives up and shows the right option.

---

### User Story 2 - Pick the right meaning or word from a meaning (Priority: P1)

The learner sees a word and picks its meaning, or sees a meaning and picks the word.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a word with a meaning and three other words with different meanings, **Then** both directions are possible with four text options.
2. **Given** options that are identical or empty, **Then** they are never offered; options are different from each other and from the right answer.

---

### User Story 3 - The app picks the exercise (Priority: P1)

Each word gets an exercise that fits what it has and where the learner is with it.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a new or just-learned word, **Then** an easier choice exercise is preferred; **given** a word in review, **Then** typing is preferred, with choices as a fallback.
2. **Given** a word with only a meaning, a word with only a picture, or a course with too few other words, **Then** the app uses an exercise that is possible (typing at the least) and never shows a broken one.
3. **Given** speed review, **Then** choice exercises are used so answers are quick.
4. **Given** the same session twice, **Then** the choice of exercise and the position of the right option vary, but stay stable while one word is on screen.

---

### User Story 4 - Recorded like any answer (Priority: P2)

Every exercise result is recorded and scheduled.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a choice exercise answered right the first time, **Then** the word is rated Good and earns half the points of a typed answer; **given** mistakes first, **Then** it counts as one lapse; **given** giving up, **Then** it is rated Again.
2. **Given** the answer log, **Then** it also stores which exercise type was used.

---

### Edge Cases

- A course with few words: exercises that need distractors fall back to ones that are possible.
- Words with identical meanings, repeated pictures or empty fields never produce duplicate or blank options.
- Very long text in options wraps; images that fail to load show an empty placeholder.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Four options per choice exercise (fewer only when the course does not have enough words: then another type is used).
- **FR-002**: Distractors come from the same course, preferring the same level, never repeating a word, picture or meaning.
- **FR-003**: The prompt and options are accessible: options are buttons with labels, pictures have text alternatives that do not reveal the answer.
- **FR-004**: Light and dark themes, keyboard use, narrow windows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A choice exercise opens within 100 ms of the previous answer.
- **SC-002**: 100% of choice exercises have exactly one correct option and no duplicate options in automated tests.

## Assumptions

- Builds on the typing practice screen (021), scheduling (022) and the level page (026).
- Out of scope: speaking exercises (needs speech recognition), writing a sentence, exercises across several words at once.
