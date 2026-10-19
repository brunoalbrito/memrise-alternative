# Feature Specification: Speed Review Game

**Feature Branch**: `feat/speed-review-game`

**Created**: 2026-10-18

**Status**: Draft

**Input**: A timed game for reviewing due words: each question is a multiple-choice with a shrinking timer, a limited number of lives, and a screen that turns red as time runs out. Opens from the speed review button.

Research: [docs/exercises/speed-review-research.md](../../docs/exercises/speed-review-research.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a round against the clock (Priority: P1)

The learner answers one multiple-choice question after another, each against a timer.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** words are due, **When** the learner starts speed review, **Then** a game screen opens with the first question: a prompt, four options, a shrinking time bar and three lives.
2. **Given** a question, **Then** its time is 6 seconds, 7 for a longer prompt (more than 25 characters) and 8 for a very long one (more than 50) or a recording to listen to.
3. **Given** time passes, **Then** the bar shrinks and the background turns more red as the time runs low.
4. **Given** the learner picks the right option (click or keys 1 to 4), **Then** the next question follows after a short pause.
5. **Given** the learner picks a wrong option or time runs out, **Then** the right answer is shown for a moment, a life is lost and the next question follows.
6. **Given** reduced-motion is preferred, **Then** the red fade and the movement of the bar are replaced by plain steps.

---

### User Story 2 - Lives and the end of the game (Priority: P1)

The game ends when lives run out or the words are finished.

**Why this priority**: Core of this slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** the last life is lost, **Then** the game ends at once with the summary.
2. **Given** every planned word was answered, **Then** the game ends with the summary.
3. **Given** the learner closes the game, **Then** they confirm, and answers given so far are kept.

---

### User Story 3 - Only questions that can be asked (Priority: P2)

Speed review uses choice questions made from the course's words.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a course with too few words for choices (fewer than four distinct options), **Then** the screen says speed review needs more words and offers to go back.
2. **Given** words that cannot be asked as a choice, **Then** they are left out of the game, never turned into typing.
3. **Given** the exercise types the learner turned off, **Then** they are respected as long as some choice type stays on; typing types are never used here.

---

### User Story 4 - Feeds the schedule (Priority: P2)

Every answer is recorded like in other sessions.

**Why this priority**: Completes the slice.

**Independent Test**: Run its acceptance scenarios on their own.

**Acceptance Scenarios**:

1. **Given** a correct answer in 3 seconds or less, **Then** the word is rated Easy; slower correct answers Good; wrong answers and timeouts Again.
2. **Given** the answer log, **Then** each answer stores its exercise type and the points earned.

---

### Edge Cases

- No words due: the usual "nothing to review" message with the next due time.
- The window loses focus or the computer sleeps during a question: the time keeps running from a real clock, so waiting cannot give extra time.
- Two answers at the same moment (a click and a key): only the first counts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game screen follows the project's design rules (Material Design 3 tokens, light and dark, keyboard use, narrow windows).
- **FR-002**: The time bar and tint are decorative: a text countdown and spoken status are available for assistive technology.
- **FR-003**: Questions come from words that are due, oldest first, up to 20 per round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The next question appears within 100 ms of an answer or the end of the pause.
- **SC-002**: A round of 20 questions can be played with the keyboard only.

## Assumptions

- Builds on the exercise types (027 to 029), scheduling (022) and the practice screen (021).
- Out of scope: sound effects, online leaderboards, a pause button, speed review for words that are not yet due.
