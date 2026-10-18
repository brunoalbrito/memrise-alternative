# Feature Specification: Course Editor

**Feature Branch**: `009-course-editor`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "The speckit last task planned it wrongly. When click on the button \"Edit Course\" or \"Create Course\" it should navigate to a screen where is able to insert the words, images, audio and messages like the following image [screenshot: a course editing screen with an \"Editing\" bar (Levels (4) tab, Databases, Contributors, Details, Back to Course), an \"Add Level\" control and \"Show attributes\" checkbox, a level header (\"1 First Level (English (US))\" with Show/Hide, Preview, Duplicate, Delete) and a table of words with columns Word, Images, Audio, Meaning, Example]. Create a new feature using speckit to make that correctly"

## Clarifications

### Session 2026-10-18

- Q: What happens when the learner uploads an image or audio file or records audio? → A: Quick prototype, but the learner can import real image and audio files from their computer. Imported files are kept on the device and can be viewed or played back. Recording is not built in this version.
- Q: What should the editor show for the pre-loaded sample courses, which have word counts but no real words? → A: Generated sample words. Each sample course gets fixed sample levels and words, and its word counts on Home and the course page come from those words (the old large sample totals are replaced by the real counts).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the course editor (Priority: P1)

A learner opens the course editor in two ways. After filling the "Create a Course" form and pressing "Create Course", the new course is saved and the editor opens for it. From a course page, pressing "Edit Course" opens the editor for that course. The editor shows an "Editing" bar with the tabs "Levels (N)", "Databases", "Contributors" and "Details", a "Back to Course" link, and the course title and creator in the header.

**Why this priority**: The editor is the place where a course's content is made. Both entry points must lead to it.

**Independent Test**: Create a course and verify the editor opens for it. Open a course page and press "Edit Course", and verify the editor opens for that course. Press "Back to Course" and verify the course page opens.

**Acceptance Scenarios**:

1. **Given** a valid "Create a Course" form, **When** the learner presses "Create Course", **Then** the course is created and the editor opens on the "Levels" tab for that course (not Home).
2. **Given** a course page, **When** the learner presses "Edit Course", **Then** the editor opens on the "Levels" tab for that course.
3. **Given** the editor, **When** it opens, **Then** the header shows the course title, "Created by" and the "Editing" bar with "Levels (N)" selected, "Databases", "Contributors", "Details" and "Back to Course".
4. **Given** the editor, **When** the learner presses "Back to Course", **Then** the course page opens showing the latest saved content.
5. **Given** an unknown or removed course id, **When** the editor is opened, **Then** "Course not found" with a link to Home is shown.

---

### User Story 2 - Add and manage levels (Priority: P1)

On the "Levels" tab the learner adds levels with an "Add Level" control and sees each level as a coloured header bar with its number, name and language, and the actions "Show/Hide", "Preview", "Duplicate" and "Delete". The learner can rename a level and edit the short line that says how the level is tested (for example "Test on Word, prompt with Images."). The tab label always shows the current number of levels.

**Why this priority**: Levels are how a course is structured, and words live inside levels.

**Independent Test**: Add a level, rename it, duplicate it, hide and show it, preview it and delete it. Verify the tab count and the level numbers update each time.

**Acceptance Scenarios**:

1. **Given** the editor, **When** the learner presses "Add Level", **Then** a new level is appended with the next number and a default name, and the tab reads "Levels (N+1)".
2. **Given** a level, **When** the learner edits its name, **Then** the new name is saved and shown in the level header and on the course page.
3. **Given** a level, **When** the learner presses "Show/Hide", **Then** the level's words table collapses or expands, and the level header stays visible.
4. **Given** a level, **When** the learner presses "Duplicate", **Then** a copy with all its words is inserted right after it and numbering updates.
5. **Given** a level, **When** the learner presses "Delete" and confirms, **Then** the level and its words are removed and the remaining levels are renumbered. Cancelling keeps the level.
6. **Given** a level, **When** the learner presses "Preview", **Then** a "coming soon" placeholder opens naming the course and the level.
7. **Given** a level, **When** the learner edits the "how it is tested" line, **Then** the line is saved with the level.

---

### User Story 3 - Add and edit words with images, audio, meaning and example (Priority: P1)

Inside a level the learner sees a table with the columns "Word", "Images", "Audio", "Meaning" and "Example". The learner adds a row for each word and fills in the word, its meaning and an optional example. In the "Images" cell the learner can import image files from their computer and see how many images the word has. In the "Audio" cell the learner can import audio files from their computer and see how many files the word has. A "Record" button is shown but recording is not available yet. The learner can edit any cell and delete a word.

**Why this priority**: Words with their media and messages are the actual content of a course, which is the point of this screen.

**Independent Test**: In a level add a word with meaning and example, upload an image and an audio file, then reload the app. Verify the word, its counts and its media are still there. Edit and delete a word.

**Acceptance Scenarios**:

1. **Given** a level, **When** the learner adds a word, **Then** an empty row appears with the word cell focused.
2. **Given** a word row, **When** the learner types a word, meaning and example, **Then** the values are saved and shown after reopening the editor.
3. **Given** a word row, **When** the learner presses "Upload" in the Images cell and picks an image file from their computer, **Then** the image is imported, the count increases, and from the count dropdown the learner can see a thumbnail and remove it.
4. **Given** a word row, **When** the learner presses "Upload" in the Audio cell and picks an audio file from their computer, **Then** the audio is imported, the count increases, and from the files dropdown the learner can play and remove it.
5. **Given** a word row, **When** the learner presses "Record", **Then** a message says recording is coming soon and nothing is added.
6. **Given** a file that is not an image (or not audio) for its cell, or is larger than the allowed size, **When** the learner picks it, **Then** it is rejected with a clear message beside the cell and nothing is added.
7. **Given** a word with imported media, **When** the learner reloads the app, **Then** the images and audio are still attached and can still be viewed and played.
8. **Given** a word row, **When** the learner deletes it, **Then** it is removed from the level and the course's word counts update.
9. **Given** a word with an empty "Word" cell, **When** the learner leaves the row, **Then** a message says the word is required and the row is not counted as a word.
10. **Given** the editor, **When** the learner adds, edits or deletes words, **Then** the course's total words shown on Home and on the course page match the words in the editor.

---

### User Story 4 - Edit course details (Priority: P2)

The "Details" tab shows the same form as the "Create a Course" page, filled with the course's current values (name, teaching language, speakers' language, tags, description, short description). Saving keeps the learner in the editor and shows the new title in the header.

**Why this priority**: It keeps the existing details editing, now inside the editor where the learner expects it.

**Independent Test**: Open "Details", change the name, save, and verify the editor header and the course page show it.

**Acceptance Scenarios**:

1. **Given** the editor, **When** the learner opens the "Details" tab, **Then** the details form is shown filled with the current values and the same validation as when creating a course.
2. **Given** valid changes, **When** the learner saves, **Then** the changes are saved, the editor header shows the new title and the learner stays in the editor.

---

### User Story 5 - Show attributes and the other tabs (Priority: P3)

A "Show attributes" checkbox toggles extra information in the level table (for example each word's id and the number of images and audio files). The "Databases" and "Contributors" tabs open "coming soon" placeholders.

**Why this priority**: These are secondary controls visible in the reference. They only need to exist and behave predictably.

**Independent Test**: Toggle "Show attributes" and verify the extra column appears and disappears. Press "Databases" and "Contributors" and verify the placeholders.

**Acceptance Scenarios**:

1. **Given** the Levels tab, **When** the learner checks "Show attributes", **Then** the extra attributes appear in each word row, and unchecking hides them.
2. **Given** the editor bar, **When** the learner presses "Databases" or "Contributors", **Then** a "coming soon" placeholder names the destination and offers a way back to the editor.

---

### Edge Cases

- Course with no levels: the Levels tab shows an empty message and the "Add Level" control.
- Level with no words: the table shows only the header row and an "Add word" control.
- Very long word, meaning or example: the cell wraps and the layout does not break.
- Deleting the last level: allowed; the course then has 0 levels.
- Duplicate words in the same level: allowed.
- Large or wrong-type files: rejected with a message (see FR-010); a file picked twice is imported twice as two items.
- Device storage full when importing: the learner sees an error message and the file is not attached.
- Deleting a word, a level or the course removes its imported media from the device.
- Narrow phone widths: the table scrolls inside its own container or stacks each word into a card, with no horizontal page scroll.
- Leaving the editor with unsaved typing: changes are saved as the learner edits, so nothing is lost.
- Storage unavailable or full: the learner sees an error message and the change is not shown as saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pressing "Create Course" on a valid create form MUST create the course and open the editor on the "Levels" tab for it.
- **FR-002**: The "Edit Course" link on the course page MUST open the editor on the "Levels" tab for that course, replacing the current edit-details page as its destination.
- **FR-003**: The editor MUST show the course title and "Created by" in the header and an "Editing" bar with the tabs "Levels (N)", "Databases", "Contributors", "Details" and a "Back to Course" link.
- **FR-004**: The editor MUST provide an "Add Level" control that appends a level with the next number and a default name. The tab label MUST always show the current level count.
- **FR-005**: Each level MUST show a header bar with its number, name and language, and the actions "Show/Hide", "Preview", "Duplicate" and "Delete".
- **FR-006**: The learner MUST be able to rename a level and edit its "how it is tested" line.
- **FR-007**: "Show/Hide" MUST collapse or expand the level's words table. "Duplicate" MUST insert a copy with all words after the level. "Delete" MUST ask for confirmation, remove the level with its words and renumber the others. "Preview" MUST open a "coming soon" placeholder.
- **FR-008**: Each level MUST show a table with the columns "Word", "Images", "Audio", "Meaning" and "Example" and a control to add a word.
- **FR-009**: The learner MUST be able to add, edit and delete words. A word MUST have a non-empty "Word" value.
- **FR-010**: Each word row MUST let the learner import image files and audio files from their computer through a file picker in the matching cell, show the count of each, and offer a dropdown to view an image (thumbnail), play an audio file, and remove an item. Accepted files: images (PNG, JPEG, GIF, WebP) up to 2 MB each and audio (MP3, WAV, OGG, M4A/AAC) up to 3 MB each, at most 5 images and 5 audio files per word. Wrong type, too large, or over the limit MUST be rejected with a clear message beside the cell. Imported files MUST be kept on the device and survive reloading the app. The "Record" button MUST be shown and MUST tell the learner that recording is coming soon, without adding anything.
- **FR-011**: Course totals (total words, learned words, due words) MUST be consistent between the editor, the course page and Home: total words equals the number of words in the course's levels.
- **FR-012**: All edits MUST be saved as the learner makes them and MUST survive reloading the app.
- **FR-013**: The "Details" tab MUST show the details form pre-filled with the same fields, hints and validation as the create form; saving MUST keep the learner in the editor.
- **FR-014**: The "Show attributes" checkbox MUST toggle extra word attributes in the table. "Databases" and "Contributors" MUST open "coming soon" placeholders.
- **FR-015**: "Back to Course" MUST open the course page.
- **FR-016**: An unknown or removed course MUST show "Course not found" with a link to Home.
- **FR-017**: The editor MUST be usable on desktop and phone widths, keyboard operable with visible focus, and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Course**: The course being edited. Has details (title, languages, tags, descriptions) and an ordered list of levels. Its word counts derive from its levels.
- **Level**: An ordered, named group of words with a language label, a "how it is tested" line and a collapsed/expanded state in the editor.
- **Word**: One learnable entry in a level with the word text, a meaning, an optional example, a set of images and a set of audio files.
- **Media item**: An image or an audio file imported from the learner's computer and attached to a word, with its file name, type, size and the stored content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can create a course and add its first word with a meaning in under 2 minutes from pressing "Create a course" on Home.
- **SC-002**: 100% of words, levels and attached media a learner adds are still there after reloading the app.
- **SC-003**: 100% of the time, the word total on the course page and on Home equals the number of words in the editor.
- **SC-004**: Adding, editing or deleting a word updates the table immediately, with no page reload.
- **SC-005**: Every control in the editor can be reached and used with the keyboard alone.
- **SC-006**: The editor is usable at widths from 360 px up with no horizontal page scroll.

## Assumptions

- This feature changes the flow set by earlier features: the create form now leads to the editor, and "Edit Course" leads to the editor. The edit-details form from the Edit Course Form feature becomes the "Details" tab.
- The prototype constraints still apply: no accounts, one anonymous learner, data saved on the device only.
- A new course starts with no levels and no words.
- The level language label shows the course's Teaching language (for example "English (US)").
- The default name of a new level is "Level N".
- "Preview", "Databases" and "Contributors" are future features and open placeholders.
- Each pre-loaded sample course opens in the editor with fixed sample levels and words (a few levels of 8 to 16 words each course), edited like any other course. A sample course's words learned and due counts come from its sample words. The empty sample course has no levels.
- Edits to a sample course are saved on the device as the learner's version and do not alter the built-in sample data.
