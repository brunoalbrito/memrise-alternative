# Feature Specification: Edit Course Button

**Feature Branch**: `007-edit-course-button`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "I need to include the button edit course insade the page course [screenshot: the course page tab row with the \"Levels (4)\" tab on the left and an \"Edit Course\" pencil link on the right]"

## Clarifications

### Session 2026-10-18

- Q: Which courses show the "Edit Course" link? → A: Every course.
- Q: What should pressing "Edit Course" do in this version? → A: Open a "coming soon" placeholder. No course is changed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See "Edit Course" on the course page (Priority: P1)

A learner opens a course page and sees an "Edit Course" link with a pencil icon at the right end of the tab row, level with the "Levels (N)" tab, as in the reference. It appears on every course, including the pre-loaded sample courses. Before this change it appeared only on courses the learner created.

**Why this priority**: The link is the entry point to editing. If it is missing, learners cannot find where to change a course.

**Independent Test**: Open a sample course and a learner-created course. Verify the link position, label and icon, and that it is reachable by keyboard.

**Acceptance Scenarios**:

1. **Given** a course page, **When** it opens, **Then** "Edit Course" with a pencil icon is shown at the right end of the tab row, level with the "Levels (N)" tab.
2. **Given** a narrow phone width, **When** the page opens, **Then** the link stays visible next to or just below the tab, with no horizontal scroll and a touch target of at least 48 px.
3. **Given** keyboard-only use, **When** the learner tabs through the page, **Then** the link is reached right after the "Levels" tab, shows a visible focus ring and opens with Enter.
4. **Given** a pre-loaded sample course or a learner-created course, **When** its page opens, **Then** the "Edit Course" link is shown on both.

---

### User Story 2 - Start editing a course (Priority: P1)

When the learner presses "Edit Course", a "coming soon" screen opens that names the destination ("Edit Course") and the course, and offers a way back. No course data is changed. Real course editing is a separate future feature.

**Why this priority**: The link must lead somewhere clear, consistent with the other placeholder destinations, until editing is built.

**Independent Test**: Press the link on a sample course and on a created course. Verify the placeholder names the right course and that the course page and Home are unchanged afterwards.

**Acceptance Scenarios**:

1. **Given** a course page, **When** the learner presses "Edit Course", **Then** a placeholder titled "Edit Course" opens naming that course.
2. **Given** the placeholder is open, **When** the learner follows "Back to Home" or uses the browser back button, **Then** they return and the course shows the same title, progress and levels as before.

---

### Edge Cases

- Link pressed repeatedly or double-clicked: only one navigation happens.
- Course page opened for an unknown or removed course: no link, only "Course not found".
- Dark scheme: label and icon keep readable contrast.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The course page MUST show an "Edit Course" link with a pencil icon at the right end of the tab row, level with the "Levels (N)" tab.
- **FR-002**: The link MUST be visible on every course page, for pre-loaded sample courses and learner-created courses alike.
- **FR-003**: Pressing the link MUST open a placeholder "coming soon" screen titled "Edit Course" that names the course and offers a way back. It MUST NOT change any course data.
- **FR-004**: The link MUST be keyboard operable with a visible focus indicator and a touch target of at least 48 px on phone widths.
- **FR-005**: Repeated presses in quick succession MUST NOT trigger more than one navigation.
- **FR-006**: The link MUST follow the project's Material Design 3 guidelines and keep readable contrast in light and dark schemes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of learners can locate the "Edit Course" link on the course page within 5 seconds.
- **SC-002**: The link is visible without scrolling at widths from 360 px up.
- **SC-003**: The link is reachable and operable using only the keyboard on every course page where it is shown.

## Assumptions

- This feature changes the "Edit Course" link added by the Course Detail View feature, which currently shows only on learner-created courses. Its placeholder destination stays the same.
- Editing a course (changing its name, languages, tags or descriptions) is out of scope and a separate future feature.
- The label is exactly "Edit Course", as in the reference image.
- The prototype constraints still apply: no accounts, one anonymous learner, data saved on the device only, pre-loaded sample courses.
