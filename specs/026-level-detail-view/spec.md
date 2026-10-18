# Feature Specification: Level Detail View

**Feature Branch**: `feat/level-detail-view`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "When you click on each level (on the course page) it should show a page for that level: a header with the level number, plant, name, progress bar, Edit Level, an Options menu and a Review button; the number of words and ignored words; a list of the words with their picture and when each is due, with markers for ready to learn, ready to review and difficult; an Ignore action; and a link to the next level. A bar at the top links back to the levels and to Edit Course." (reference screenshot supplied by the user)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a level and its words (Priority: P1)

A learner opens a course and clicks a level card. A page for that level appears showing the level's number, plant, name and progress, and the list of its words with their pictures and status.

**Why this priority**: This replaces the "coming soon" placeholder the level cards lead to today, and is the core of the request.

**Independent Test**: Open a course with a level that has several words, some with pictures, some learned, some due; click the level and compare what is shown with the course data.

**Acceptance Scenarios**:

1. **Given** a course with levels, **When** the learner clicks a level on the course page, **Then** a level page opens that shows "Level N", the level name, the plant for that level's state, and a progress bar of learned words out of all words.
2. **Given** the level page, **Then** it shows the number of words in the level ("94 words") and how many of them are ignored ("0 ignored").
3. **Given** the level page, **Then** each word is listed in the level's order with the word, its first picture (or, when it has none, its meaning or example) and a status on the right.
4. **Given** a word that has never been practiced, **Then** its status reads "ready to learn" with the learn marker.
5. **Given** a learned word that is due, **Then** its status shows the review marker and "now"; **given** a learned word that is not due yet, **Then** the review marker shows when it will be due ("in 3 days").
6. **Given** a word that was answered wrongly several times (at least two mistakes after it was learned), **Then** it also shows the difficult marker.
7. **Given** a legend above the list, **Then** it explains the three markers: ready to learn, ready to review, difficult.
8. **Given** a word row has no text, **Then** it is not listed (a word needs text to count).
9. **Given** a level with no words, **Then** the page says the level has no words yet and offers to edit the level.

---

### User Story 2 - Practice just this level (Priority: P1)

The learner starts studying the words of this level from the level page.

**Why this priority**: The header's main button is what makes the page useful beyond a list.

**Independent Test**: With due words in the level, click the main button and check that only words of this level are practiced.

**Acceptance Scenarios**:

1. **Given** some words of the level are due, **When** the learner looks at the header, **Then** the main button reads "Review N words" (N = due words in this level) and starts a review of only those words.
2. **Given** no word of the level is due but some are new, **Then** the main button reads "Learn N new words" and starts learning only new words of this level (respecting the daily new-word limit).
3. **Given** nothing is due and nothing is new, **Then** the main button is disabled and says "Nothing to practice".
4. **Given** the learner finishes or leaves the session, **When** they return to the level page, **Then** the progress bar, counts and word statuses are up to date.

---

### User Story 3 - Ignore and restore words (Priority: P2)

The learner chooses words they do not want to study and ignores them, or restores ignored words.

**Why this priority**: Matches the "Actions" and "Ignore" controls of the reference and uses an existing capability (ignored words are skipped by sessions).

**Independent Test**: Select two words, ignore them, check the counts and that practice skips them; select them again and restore.

**Acceptance Scenarios**:

1. **Given** the level page, **When** the learner opens "Actions", **Then** a checkbox appears on every word, with a "select all" choice.
2. **Given** words are selected, **When** the learner chooses "Ignore", **Then** the selected words become ignored, are shown dimmed with an "ignored" label, and the "ignored" count rises.
3. **Given** the selection contains only ignored words, **Then** the button reads "Restore" and, when used, makes them study-able again.
4. **Given** no word is selected, **Then** the Ignore button is disabled.
5. **Given** ignored words, **When** a session of this level starts, **Then** they are not included, and the word counts used by the main button leave them out.

---

### User Story 4 - Move around (Priority: P2)

The learner moves between levels and back to the course or the editor.

**Why this priority**: Navigation that the reference shows on every level page.

**Independent Test**: From a level page use each link and check where it leads.

**Acceptance Scenarios**:

1. **Given** the level page, **Then** a bar at the top shows "Levels (N)" (back to the course page, where N is the number of levels) and "Edit Course" (to the course editor).
2. **Given** a following level exists, **Then** a card "Level N+1 ›" opens it; **given** a previous level exists, **Then** a card "‹ Level N-1" opens it.
3. **Given** the learner clicks "Edit Level" or chooses "Edit level" in Options, **Then** the course editor opens on its levels tab.
4. **Given** a level number that does not exist or a course that does not exist, **Then** a clear message with a link back is shown.

---

### Edge Cases

- A course with no levels or a deleted course: "Level not found" or "Course not found" with a link back.
- A word with a very long text or meaning wraps without breaking the layout; pictures that fail to load show an empty placeholder.
- A level with hundreds of words stays responsive (the list is not slowed by pictures that are not on screen).
- A word that is both ignored and due is shown as ignored and not counted as due.
- On a narrow window the next/previous level cards move below the level header and the list uses the full width.
- Progress changes while the page is open (a session finished elsewhere, time passing): the page updates when progress is refreshed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicking a level on the course page MUST open that level's page (`/course/<id>/levels/<number>`), replacing the placeholder.
- **FR-002**: The page MUST show the top bar with "Levels (N)" and "Edit Course".
- **FR-003**: The header MUST show the level number, the plant for the level's state (not started, in progress, completed), the level name, a progress bar of learned words out of words in the level, an "Edit Level" button, an "Options" menu and the main practice button.
- **FR-004**: The page MUST show the count of words in the level and the count of ignored words.
- **FR-005**: The word list MUST show each word with text, first picture (or meaning/example when there is none) and a status; status rules are those of User Story 1.
- **FR-006**: The status of a word MUST come from the learner's real progress (never invented): not practiced = ready to learn; practiced = ready to review with "now" or a relative due time; at least two mistakes after learning = also difficult.
- **FR-007**: A legend MUST explain the three markers; markers MUST also be available to assistive technology as text, not only as icons.
- **FR-008**: The main button MUST follow the rules of User Story 2 and start a session limited to this level's words.
- **FR-009**: Practice sessions MUST be able to be limited to one level; ignored words and the daily new-word limit MUST still be respected.
- **FR-010**: "Actions" MUST toggle selection of words with a select-all option; "Ignore" and "Restore" MUST change the ignored state of the selected words and update the page at once.
- **FR-011**: The Options menu MUST offer "Edit level", "Ignore all words" and "Restore all words".
- **FR-012**: Next and previous level cards MUST appear when those levels exist.
- **FR-013**: The page MUST work with the keyboard, have visible focus, follow the project's Material Design 3 tokens in light and dark schemes, and use a single column on narrow windows.
- **FR-014**: Missing courses or levels MUST show a clear message with a link back.

### Key Entities

- **Level**: ordered group of a course's words with a name; the page is about one level.
- **Word status**: derived from the study card of the word: ready to learn, ready to review (with due time), difficult, ignored.
- **Selection**: the words the learner ticked in "Actions" mode; not saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the course page, a learner reaches any level's word list in one click.
- **SC-002**: The level page for a level of 500 words is usable (scrolling and clicking respond within 100 ms) and opens in under one second.
- **SC-003**: The counts shown (words, ignored, due for the main button, learned in the progress bar) match the stored progress in 100% of tested cases.
- **SC-004**: After ignoring words from the level page, 100% of them are left out of the next session of that level.
- **SC-005**: A learner can start studying a level's due words within two clicks from the course page.

## Assumptions

- Levels are identified in the address by their position (1, 2, 3…), as the course page already links them.
- "Difficult" means two or more mistakes after the word was learned; the threshold is fixed.
- The reference's site header (logo, Home, Courses, Groups, profile) is the app's existing top bar; the level page keeps that bar.
- The reference shows a picture column; words without a picture show their meaning or example in that place.
- "Edit Level" opens the course editor's levels tab (there is no separate level editor).
- Out of scope: reordering words, editing words on this page, per-level options such as resetting progress, and sharing.
