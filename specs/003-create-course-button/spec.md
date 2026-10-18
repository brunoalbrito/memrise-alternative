# Feature Specification: Create Course Button

**Feature Branch**: `003-create-course-button`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "I need to introduce a button to create a new course [screenshot: a green button labeled \"Create a course\"]"

## Clarifications

### Session 2026-10-18

- Q: What should pressing "Create a course" do in this version? → A: Open a "coming soon" placeholder screen. No course is created.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and press "Create a course" on Home (Priority: P1)

A learner on the Home page sees a clearly visible button labeled "Create a course". It is always available, including when the course list is empty or a filter hides every course. Pressing it opens a placeholder "coming soon" screen.

**Why this priority**: The button is the entry point for the whole feature. Without it, learners have no way to start a new course.

**Independent Test**: Open Home with courses, with a filter that matches nothing, and with all courses removed. Verify the button is visible each time and can be pressed with mouse and keyboard.

**Acceptance Scenarios**:

1. **Given** a learner on Home, **When** the page loads, **Then** a "Create a course" button is visible without scrolling on desktop and phone widths.
2. **Given** a filter that matches no course, **When** the learner looks at Home, **Then** the button is still visible.
3. **Given** the learner has removed every course, **When** Home is shown, **Then** the button is visible next to the empty state.
4. **Given** keyboard-only use, **When** the learner tabs to the button and presses Enter or Space, **Then** the placeholder screen opens.

---

### User Story 2 - Reach a placeholder for course creation (Priority: P1)

When the learner presses "Create a course", a "coming soon" screen opens that names the destination ("Create a course") and offers a way back to Home. No course is created and Home is unchanged when the learner returns. Real course creation is a separate future feature.

**Why this priority**: The button must lead somewhere clear. A placeholder keeps the prototype consistent with the other Home actions and avoids a dead button.

**Independent Test**: Press the button. Verify the placeholder shows the destination name and a Back to Home link, and that the course list is unchanged after returning.

**Acceptance Scenarios**:

1. **Given** the learner is on Home, **When** they press "Create a course", **Then** a placeholder screen titled "Create a course" opens saying it is coming soon.
2. **Given** the placeholder is open, **When** the learner follows "Back to Home", **Then** Home shows the same courses, progress and filter-free list as before.
3. **Given** the placeholder is open, **When** the learner uses the browser back button, **Then** they return to Home.

---

### Edge Cases

- Button pressed repeatedly or double-clicked: only one placeholder screen opens (no duplicate history entries).
- Narrow phone width: the button stays fully visible and tappable (at least 48 px touch target) with no horizontal scroll.
- Dark scheme: label and background keep readable contrast.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Home MUST show a button labeled "Create a course".
- **FR-002**: The button MUST be visible whenever Home is shown, including empty and no-filter-match states.
- **FR-003**: Pressing the button MUST open a placeholder "coming soon" screen titled "Create a course", with a way back to Home. It MUST NOT create a course or change any data.
- **FR-004**: The button MUST be operable by keyboard and have a visible focus indicator.
- **FR-005**: The button MUST follow the project's Material Design 3 guidelines. The green color in the reference image is a visual hint and does not override the project's color tokens.
- **FR-006**: Repeated presses in quick succession MUST NOT open more than one placeholder screen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of learners can locate the "Create a course" button on Home within 5 seconds of the page loading.
- **SC-002**: The button is visible without scrolling at widths from 360 px up.
- **SC-003**: The button is reachable and operable using only the keyboard in 100% of Home states.

## Assumptions

- The button lives on the Home page, near the page heading and above the course list.
- The label is exactly "Create a course", as in the reference image.
- The prototype constraints from the Course Home Dashboard spec still apply: no accounts, data saved on the device only.
- The reference image shows only the button. The creation screens (form, items) are not specified and are out of scope.
- Creating, editing or saving courses is out of scope. The Home course list stays the pre-loaded samples.
