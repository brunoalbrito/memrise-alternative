# Feature Specification: Typing Practice Screen

**Feature Branch**: `021-typing-practice-screen`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-019 to FR-030). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: When practicing, the learner sees the word's image and types the word using the keyboard, letter tiles, hints or give-up.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type the word from its image (Priority: P1)

The learner sees the image, types the word and advances on a correct answer.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** practice starts, **When** the screen opens, **Then** header (course name, shortcuts toggle, close), progress bar, points, image, WORD input, shuffled tiles, Hint, backspace and "I don't know" are shown.
2. **Given** the screen, **When** the learner clicks a tile or presses its number key (1 to 8), **Then** the letter is added and the tile appears used; backspace restores it.
3. **Given** the typed text matches the word (case-insensitive, accents per course setting), **When** complete, **Then** success feedback, points and the next word follow.

---

### User Story 2 - Hint and give up (Priority: P2)

The learner can reveal one letter at a time or the whole answer.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** the screen, **When** Hint is used (button, H outside the input, Alt+H anywhere), **Then** the next correct letter is filled and points for the word drop.
2. **Given** the screen, **When** "I don't know" is used (button or Cmd/Ctrl+Enter), **Then** the answer is revealed and recorded as not recalled.

---

### User Story 3 - Leave and finish a session (Priority: P2)

The learner can close with confirmation and sees a summary at the end.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a session is running, **When** the learner closes it and confirms, **Then** answers so far are saved.
2. **Given** the last word, **When** answered, **Then** a summary shows words, correct answers, hints and points.

---

### User Story 4 - Words without an image and accessibility (Priority: P2)

The screen works without images and fully with the keyboard and assistive technology.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** a word without an image, **When** it appears, **Then** its meaning or example is shown instead.
2. **Given** keyboard only use, **When** a ten-word session runs, **Then** it completes with visible focus and spoken feedback.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The screen MUST follow the layout and behavior rules in contracts/practice-screen-ui-contract.md of the local-first requirements.
- **FR-002**: Tiles, keys, hint, give-up, matching, points and exit behavior MUST follow FR-019 to FR-030 of the local-first requirements.
- **FR-003**: Every answer MUST be recorded as an outcome (result, hints, attempts, time) through the study interface; scheduling itself is delivered in 022.
- **FR-004**: Until 022 exists, a simple in-order word list of the chosen course is used so the screen can be completed and tested.

### Key Entities *(include if feature involves data)*

- Entities: Practice session, Answer outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visible feedback appears within 100 ms of every action.
- **SC-002**: A ten-word session can be completed with the keyboard only.
- **SC-003**: 90% of first-time testers finish a ten-word session without help.

## Assumptions

- Depends on 018. May be built earlier against sample data for design review.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
