# Feature Specification: Speed Review Scoring

**Feature Branch**: `feat/speed-review-game`

**Created**: 2026-10-18

**Status**: Draft

**Input**: Points, a streak multiplier, a bonus for speed, extra lives, a personal best per course, and an end screen that shows how the round went and which words were missed.

Research: [docs/exercises/speed-review-research.md](../../docs/exercises/speed-review-research.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Earn points for speed and streaks (Priority: P1)

Correct answers score more when they are fast and when they come in a row.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a correct answer, **Then** it scores 100 points plus up to 50 for the time left, multiplied by the streak multiplier.
2. **Given** the number of correct answers in a row, **Then** the multiplier is x1 for the first five, x2 for the next five, and so on up to x5.
3. **Given** a wrong answer or a timeout, **Then** the streak and the multiplier start again from x1.
4. **Given** the screen, **Then** the score, the streak and the multiplier are always visible.

---

### User Story 2 - Extra lives (Priority: P2)

A long streak earns a life back.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** 15 correct answers in a row, **Then** one life is added, up to a maximum of five, and the streak counter keeps going.

---

### User Story 3 - See how it went and beat your best (Priority: P1)

The end screen shows the result and the personal best of the course.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** the game is over, **Then** the summary shows the score, the correct answers, the longest streak, the accuracy and the best score of this course.
2. **Given** the score is higher than the best one, **Then** it says "New personal best!" and the best score is saved on this computer.
3. **Given** words were missed, **Then** they are listed with their correct answer.
4. **Given** "Play again", **Then** a new round starts with the words that are due now.

---

### Edge Cases

- No words due: the usual "nothing to review" message with the next due time.
- The window loses focus or the computer sleeps during a question: the time keeps running from a real clock, so waiting cannot give extra time.
- Two answers at the same moment (a click and a key): only the first counts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The best score of each course is saved in the library and survives restarts.
- **FR-002**: Scoring follows the formulas of the research document and is the same for every course.
- **FR-003**: Total points of a session are stored with the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The score shown on screen equals the sum of the points recorded in the answer log in 100% of tests.
- **SC-002**: A personal best survives a restart.

## Assumptions

- Builds on the exercise types (027 to 029), scheduling (022) and the practice screen (021).
- Out of scope: sound effects, online leaderboards, a pause button, speed review for words that are not yet due.
