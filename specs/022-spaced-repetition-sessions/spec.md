# Feature Specification: Spaced Repetition Sessions

**Feature Branch**: `022-spaced-repetition-sessions`

**Created**: 2026-10-18

**Status**: Draft

**Parent**: [Local-first requirements](../../docs/local-first/REQUIREMENTS.md) (covers FR-031 to FR-035). Shared design: [plan](../../docs/local-first/plan.md), [data model](../../docs/local-first/data-model.md), [contracts](../../docs/local-first/contracts/).

**Input**: Learn, Classic review and Speed review use a real schedule, with real progress counts and personal statistics.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn new words (Priority: P1)

Learn introduces new words in level order up to the daily limit.

**Why this priority**: Core value of this slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** unlearned words, **When** Learn starts, **Then** the next words in level order are presented up to the daily new-word limit.

---

### User Story 2 - Review due words (Priority: P2)

Classic review shows due words and reschedules them from the answers.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** due words, **When** Classic review runs, **Then** correct answers move the due date further and mistakes bring it closer.
2. **Given** nothing is due, **When** review opens, **Then** a message shows when the next words are due.

---

### User Story 3 - Speed review (Priority: P2)

A timed pass over due words.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** due words, **When** Speed review runs, **Then** each word has a countdown and an unanswered word counts as not recalled.

---

### User Story 4 - Real progress and statistics (Priority: P2)

Home and detail show real counts, daily goal progress and personal statistics.

**Why this priority**: Completes the slice.

**Independent Test**: Run the acceptance scenarios below on their own.

**Acceptance Scenarios**:

1. **Given** the learner finishes words, **When** Home opens, **Then** the goal ring and course counts are updated.
2. **Given** history, **When** the detail page opens, **Then** streak, reviews per day and recall rate are shown instead of the leaderboard.

---

### Edge Cases

- The disk is full or the operation is interrupted: nothing is left half-done and a clear message appears.
- Invalid, missing or unexpected input: the learner sees a clear message and data is unchanged.
- Large libraries (50 courses, 20,000 words) keep the feature responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each answer MUST update the word's next due date using a spaced-repetition schedule and store the review history.
- **FR-002**: Learners MUST be able to mark words ignored or long-term, and set a daily goal and a daily new-word limit per course.
- **FR-003**: Totals (words, learned, due, ignored, long-term) MUST be computed from stored progress.
- **FR-004**: The leaderboard MUST be replaced by personal statistics.
- **FR-005**: Course export MUST gain the optional "Include my progress" content once this exists.

### Key Entities *(include if feature involves data)*

- Entities: Study card, Review record, Session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Words answered correctly do not reappear in the same session and come back on a later date.
- **SC-002**: Words answered wrongly return sooner than correct ones.
- **SC-003**: Sessions of 50 words load in under 1 second.

## Assumptions

- Depends on 021.
- Out of scope: accounts, cloud sync, server, leaderboard, mobile.
- Technology choices are in the parent plan.
