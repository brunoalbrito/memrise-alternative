# Feature Specification: Session Picker

**Feature Branch**: `015-session-picker`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "When I click on the button Levels and items in the homescreen, that is what should be seen [screenshot: a dialog titled with the course name, a \"Next up for you\" section with a large \"Classic review\" button, and an \"Or choose your session\" row of three round buttons: Learn new words, Classic review (with a \"99+\" badge) and Speed review; a close X in the corner]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick a learning session from the Home card (Priority: P1)

On Home, pressing the grid button of a course card opens a dialog over the page. It shows the course name, a "Next up for you" section with one large button for the session the app recommends, and an "Or choose your session" row with three round buttons: "Learn new words", "Classic review" and "Speed review". The Classic review button carries a badge with the number of words due ("99+" when there are 99 or more). Choosing a session closes the dialog and opens that session's screen. The recommended session is "Classic review" when words are due, otherwise "Learn new words".

**Why this priority**: It is the quick way to start studying from Home, replacing the page the grid button opened before.

**Independent Test**: Press the grid button on a course with due words and on one without. Verify the dialog content, the recommendation, the badge and that each choice opens its session screen for that course.

**Acceptance Scenarios**:

1. **Given** a Home course card, **When** the learner presses its grid button, **Then** a dialog opens showing the course name, "Next up for you" with a large button, and "Or choose your session" with "Learn new words", "Classic review" and "Speed review".
2. **Given** a course with 26 words due, **When** the dialog opens, **Then** the large button reads "Classic review" and the Classic review round button shows the badge "26".
3. **Given** a course with 120 words due, **When** the dialog opens, **Then** the badge reads "99+".
4. **Given** a course with no words due, **When** the dialog opens, **Then** the large button reads "Learn new words", "Classic review" and "Speed review" are disabled, and no badge is shown.
5. **Given** the dialog is open, **When** the learner chooses a session (the large button or a round button), **Then** the dialog closes and that session's screen opens for the course ("Learn new words", "Classic review" or "Speed review").
6. **Given** a course with no words at all, **When** the dialog opens, **Then** "Learn new words" is available and the review sessions are disabled.

---

### User Story 2 - Close the dialog without choosing (Priority: P1)

The dialog has a close button (X) in its corner. It also closes with Escape and by clicking outside it. Closing changes nothing and returns the learner to Home with the focus back on the grid button.

**Why this priority**: A dialog that cannot be dismissed easily blocks the page.

**Independent Test**: Open the dialog and close it with the X, with Escape and by clicking outside; verify Home is unchanged each time.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **When** the learner presses the X, presses Escape or clicks outside the dialog, **Then** it closes and nothing else changes.
2. **Given** the dialog closed, **When** it is dismissed, **Then** keyboard focus returns to the grid button that opened it.

---

### Edge Cases

- Course title very long: the dialog title wraps and the dialog stays within the screen.
- Narrow phone widths: the dialog fits (at most 92% of the screen width) and the three round buttons fit on one row or wrap.
- Opening the dialog on one card does not affect other cards; only one dialog can be open.
- The course page is still reachable from Home through the course title (and the whole card); only the grid button changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pressing the grid button of a Home course card MUST open a session dialog for that course instead of opening the course page.
- **FR-002**: The dialog MUST show the course name as its title, a close button, a "Next up for you" section with one large button, and an "Or choose your session" row with the round buttons "Learn new words", "Classic review" and "Speed review", each with a label under it.
- **FR-003**: The large button MUST be "Classic review" when the course has words due and "Learn new words" otherwise.
- **FR-004**: The "Classic review" round button MUST show a badge with the number of words due, or "99+" when 99 or more, and no badge when none are due. "Classic review" and "Speed review" MUST be disabled when no words are due.
- **FR-005**: Choosing a session MUST close the dialog and open that session's screen for the course: "Learn new words", "Classic review" or "Speed review".
- **FR-006**: The dialog MUST close with the close button, Escape or a click outside, without changing anything, and MUST return focus to the grid button.
- **FR-007**: The grid button MUST have the accessible name "Choose a session".
- **FR-008**: The dialog MUST be keyboard operable with focus kept inside it while open, announce its title, work from 360 px width and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Learning session**: One of three ways to study a course: learn new words, classic review (words due) and speed review (words due, timed). Each has a screen opened from this dialog; the screens themselves are separate features and currently show a "coming soon" page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can open any course's session from Home in 2 interactions (open the dialog, choose a session).
- **SC-002**: The badge matches the course's due-word count shown elsewhere in 100% of cases.
- **SC-003**: The dialog can be dismissed with the mouse and with the keyboard in 100% of cases and focus returns to the grid button.
- **SC-004**: Every control in the dialog can be used with the keyboard alone and the dialog is usable from 360 px width.

## Assumptions

- This replaces the destination of the grid button from the Course Home Dashboard and Course Detail View features (it used to open the course page); the course page stays reachable through the course title.
- "Classic review" is the regular review of due words. Its screen is the existing review placeholder (renamed "Classic review"), and the course page's "Review" button opens the same screen.
- The session screens are future features and keep showing "coming soon" pages.
- The Home card's own primary button ("Speed review" or "Learn new words") is unchanged.
- Colors and shapes follow the project's Material Design 3 tokens rather than the reference image's exact look.
