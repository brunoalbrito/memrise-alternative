# Feature Specification: Edit Course Form

**Feature Branch**: `008-edit-course-form`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Now I need to create a page inside the edit course, that is going to be the same after the \"Create Course\" is clicked [screenshot: the course page tab row with the Levels (4) tab and the Edit Course link]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a course with the same form as creation (Priority: P1)

A learner presses "Edit Course" on a course page and lands on an "Edit Course" page. It looks and works like the "Create a Course" page (same fields, hints, validation, help side panel and top navigation), but the fields start filled with the course's current values and the main button saves the changes instead of creating a course. After saving, the learner returns to the course page, which shows the new values.

**Why this priority**: This replaces the "coming soon" placeholder behind the link and delivers real editing.

**Independent Test**: Open a course, press Edit Course, change the name, save. Verify the course page and Home show the new name, and that it is still there after reloading.

**Acceptance Scenarios**:

1. **Given** a course page, **When** the learner presses "Edit Course", **Then** a page titled "Edit Course" opens with the same fields as "Create a Course" (Name, Teaching, For, Tags, Description, Short description) and the help side panel.
2. **Given** the page just opened, **When** it renders, **Then** every field holds the course's current value (tags shown comma-separated) and the Name field has keyboard focus.
3. **Given** valid changes, **When** the learner presses "Save Changes", **Then** the changes are saved on the device and the course page opens showing them.
4. **Given** a saved change, **When** the learner opens Home, **Then** the course card shows the new name and, if the Teaching language changed, the new category and filter entry.
5. **Given** a saved change, **When** the learner reloads the app, **Then** the change is still there.
6. **Given** a course edited by the learner, **When** its progress, levels, creator and goal are shown, **Then** they are unchanged by the edit.
7. **Given** the learner presses "Save Changes" twice quickly, **When** the course page opens, **Then** the changes were saved once and only one page was opened.

---

### User Story 2 - Same validation and feedback as creation (Priority: P1)

The form blocks invalid input with the same rules and messages as "Create a Course": Name and Teaching are required, limits apply to name, tags and descriptions, errors appear beside each field, the first invalid field receives focus, and errors clear as soon as a field is fixed.

**Why this priority**: Without it, editing could leave a course without a name or language.

**Independent Test**: Clear the Name and save: the form shows the required message, focuses Name and saves nothing. Enter an over-limit value in each limited field and save: each is rejected with its message.

**Acceptance Scenarios**:

1. **Given** the Name is cleared, **When** the learner presses "Save Changes", **Then** nothing is saved, "Enter a name for your course." shows beside Name, and focus moves to Name.
2. **Given** an over-limit Name, Tags, Description or Short description, **When** the learner saves, **Then** the matching message from the create form is shown and nothing is saved.
3. **Given** errors are showing, **When** the learner corrects them and saves, **Then** the errors clear and the changes are saved.
4. **Given** the device cannot store data, **When** the learner saves, **Then** the message "Could not save your course on this device. Please try again." is shown and the course keeps its old values.

---

### User Story 3 - Leave without saving (Priority: P2)

The learner can leave the page without saving: a "Back to course" link and the browser back button return to the course page and discard any unsaved changes.

**Why this priority**: Learners need a safe way out, but saving is the main flow.

**Independent Test**: Change a field, press "Back to course": the course page shows the old values.

**Acceptance Scenarios**:

1. **Given** changed but unsaved fields, **When** the learner presses "Back to course", **Then** the course page opens with the old values.
2. **Given** changed but unsaved fields, **When** the learner uses the browser back button, **Then** the same happens.
3. **Given** the edit page for an unknown or removed course, **When** it is opened, **Then** "Course not found" with a link to Home is shown.

---

### Edge Cases

- Editing a pre-loaded sample course: allowed; the changes are saved on this device as the learner's own version and the original sample data is not altered. Progress, levels and creator stay the same.
- Teaching language changed: the course's category on Home becomes the new language's category. Teaching language unchanged: the category stays as it was.
- Saving with no changes: succeeds and returns to the course page.
- Tags with extra spaces, duplicates or empty entries: trimmed, de-duplicated and empty entries dropped, as in creation.
- Very long course name: the course page header wraps it without breaking the layout.
- Course removed in another tab while editing: saving shows "Course not found" instead of failing silently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Edit Course" link MUST open an "Edit Course" page for that course, replacing the current placeholder.
- **FR-002**: The page MUST contain the same fields as the create form, with the same labels, hints, language lists, default speakers language for new values, side panel and top navigation (Courses highlighted).
- **FR-003**: On open, every field MUST be filled from the course's current values and Name MUST have keyboard focus. Tags MUST be shown comma-separated.
- **FR-004**: The main button MUST read "Save Changes" and the page title "Edit Course".
- **FR-005**: Validation limits and messages MUST be identical to the create form (Name and Teaching required; Name 3 to 100 characters after trimming; Short description at most 100; Description at most 2000; at most 10 tags of at most 30 characters each).
- **FR-006**: On a valid save the system MUST store the edited values for that course on the device, keep its progress, levels, creator and goal unchanged, and open the course page.
- **FR-007**: If the Teaching language changed, the course's category MUST become the new Teaching language's category. Otherwise the category MUST NOT change.
- **FR-008**: Edits to pre-loaded sample courses MUST be stored as the learner's version without altering the sample data, and MUST be shown on Home and on the course page.
- **FR-009**: Edits MUST survive reloading the app.
- **FR-010**: Repeated saves in quick succession MUST save once.
- **FR-011**: A "Back to course" link MUST return to the course page without saving. Unsaved changes MUST be discarded.
- **FR-012**: An unknown or removed course MUST show "Course not found" with a link to Home.
- **FR-013**: The page MUST be usable on desktop and phone widths, keyboard operable, with visible focus and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Course**: The course being edited. Editable values: name, teaching language, speakers language, tags, description, short description. Not editable here: id, creator, item counts, levels, goal.
- **Course edit**: The learner's saved changes to a pre-loaded sample course, stored on the device and applied on top of the sample data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can change a course name and save it in under 30 seconds from pressing "Edit Course".
- **SC-002**: 100% of valid saves show the new values on the course page and on Home immediately and after reopening the app.
- **SC-003**: 100% of invalid saves are blocked, each with a message beside the offending field.
- **SC-004**: The edit page behaves identically to the create page for the same inputs (same limits and messages) in 100% of checked cases.
- **SC-005**: The page is fully usable at widths from 360 px up with no horizontal scrolling and every control is reachable by keyboard.

## Assumptions

- "The same" means the same fields, hints, validation, side panel and look as the Create a Course page. The only differences are the pre-filled values, the title "Edit Course" and the button "Save Changes".
- This feature replaces the "Edit Course" placeholder from the Course Detail View and Edit Course Button features. The link and its position are unchanged.
- The prototype constraints still apply: no accounts, one anonymous learner, data saved on the device only.
- Pre-loaded sample courses get a Teaching and speakers language so the form can be pre-filled: English courses use English (UK), the Japanese courses Japanese, the Spanish (Mexico) course Spanish (Mexico), and the networking course English (US) for English (US) speakers. Speakers default to English (UK) elsewhere.
- Items, levels, goals and progress are not editable on this page.
- Leaving the page discards unsaved changes without a confirmation prompt, as on the create page.
