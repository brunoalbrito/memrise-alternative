# Feature Specification: Create Course Form

**Feature Branch**: `004-create-course-form`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "I need to create the follow screen when the user click on the button \"Create a course\" [screenshot: a \"Create a Course\" page with a form (Name, Teaching, For, Tags, Description, Short description, Create Course button) and a side panel \"Why create a course?\" / \"Need more help?\"]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a course from the form (Priority: P1)

A learner presses "Create a course" on Home and lands on a "Create a Course" page with a form. They type a name, choose the language they are teaching, optionally adjust the speakers' language and fill the optional fields, then press "Create Course". The new course is added to their courses and they are taken back to Home, where it appears in the list with 0 items learned.

**Why this priority**: This is the whole purpose of the screen. It replaces the "coming soon" placeholder behind the button.

**Independent Test**: Open the page from Home, fill Name and Teaching, submit. Verify Home shows the new course, with the entered name, 0% and "0 / 0 items learned", and that it is still there after reloading.

**Acceptance Scenarios**:

1. **Given** the learner pressed "Create a course" on Home, **When** the page opens, **Then** it is titled "Create a Course" and shows the fields Name, Teaching, For, Tags, Description and Short description, plus a "Create Course" button.
2. **Given** a valid Name and a selected Teaching language, **When** the learner presses "Create Course", **Then** a course with those values is created and Home opens showing it in the course list.
3. **Given** the new course on Home, **When** the learner looks at its card, **Then** it shows the entered name, 0%, "0 / 0 items learned" and the "Learn new words" action.
4. **Given** a course was created, **When** the learner reloads the app, **Then** the course is still listed.
5. **Given** the learner presses "Create Course" twice quickly, **When** Home opens, **Then** only one course was created.

---

### User Story 2 - Get clear feedback on invalid or missing input (Priority: P1)

If a required field is missing or a value is too long, the form does not submit. Each problem is shown next to its field in plain words, and the first problem receives keyboard focus. Name is required and highlighted when invalid, as in the reference.

**Why this priority**: Without validation the learner can create unusable courses with no name or language, so it is as important as the happy path.

**Independent Test**: Submit the empty form and verify the errors, focus, and that nothing is created. Fix the fields and submit successfully.

**Acceptance Scenarios**:

1. **Given** an empty form, **When** the learner presses "Create Course", **Then** nothing is created, the Name and Teaching fields show "required" messages, and focus moves to Name.
2. **Given** a Name made only of spaces, **When** the learner submits, **Then** it is treated as empty and rejected.
3. **Given** a Name longer than the limit, **When** the learner submits, **Then** the form shows a "too long" message and nothing is created.
4. **Given** errors are showing, **When** the learner corrects the fields and submits, **Then** the errors clear and the course is created.
5. **Given** the page just opened, **When** it renders, **Then** the Name field has keyboard focus.

---

### User Story 3 - Understand each field through hints (Priority: P2)

Each field has a short hint below it, as in the reference: Name ("Naming your course well will help other learners find it."), Tags ("E.g. Spanish vocabulary, learn spanish online, spanish grammar"), Description ("Keep the description of the course in the language of what the learners speak.") and Short description ("A short description for our apps."). The "For" field reads "For [language] speakers".

**Why this priority**: Hints reduce mistakes and make the form self-explanatory, but the form works without them.

**Independent Test**: Open the form and verify every hint text and the "speakers" label are present and associated with their field for assistive technology.

**Acceptance Scenarios**:

1. **Given** the form is open, **When** the learner reads it, **Then** each field shows its hint text below it.
2. **Given** a screen reader, **When** a field is focused, **Then** its label and hint are announced.

---

### User Story 4 - Read why to create a course and find help (Priority: P3)

A side panel next to the form shows "Why create a course?" with three reasons (a quick list of personal facts to remember, share common content with classmates or colleagues, share teaching materials with the community) and "Need more help?" with a "Course Creation knowledge base" link. On narrow screens the panel appears below the form.

**Why this priority**: It motivates and supports the learner but is not needed to create a course.

**Independent Test**: Open the page at desktop and phone widths and verify the panel content and placement. Follow the help link and verify the placeholder.

**Acceptance Scenarios**:

1. **Given** a desktop width, **When** the page opens, **Then** the form and the side panel are shown side by side.
2. **Given** a phone width, **When** the page opens, **Then** the panel appears below the form with no horizontal scroll.
3. **Given** the side panel, **When** the learner follows the "Course Creation knowledge base" link, **Then** a "coming soon" placeholder opens with a way back.

---

### Edge Cases

- Leaving the page without submitting (back button or navigation): nothing is created and the entered data is discarded.
- Tags with extra spaces, duplicates or empty entries: they are trimmed, de-duplicated and empty entries are dropped.
- Very long text pasted into Description: it is rejected with a "too long" message, not cut silently.
- Two courses with the same name: allowed; each is a separate course.
- Teaching language with no existing courses: the new course creates its own category so it can be filtered on Home.
- Storage unavailable on the device: the learner sees an error message and the course is not shown as created.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The "Create a course" button on Home MUST open the "Create a Course" page, replacing the current placeholder.
- **FR-002**: The page MUST contain the fields Name (single-line text), Teaching (single choice, placeholder "Please select one..."), For (single choice, default "English (UK)", followed by the word "speakers"), Tags (single-line text), Description (multi-line text) and Short description (single-line text), and a "Create Course" button.
- **FR-003**: Name and Teaching MUST be required. Tags, Description and Short description MUST be optional.
- **FR-004**: Name MUST be 3 to 100 characters after trimming. Short description MUST be at most 100 characters. Description MUST be at most 2000 characters. Tags MUST be comma-separated, with at most 10 tags of at most 30 characters each.
- **FR-005**: The Teaching and For choices MUST come from the same list of languages, and the list MUST include at least English (UK), English (US), Spanish (Mexico), Japanese and Portuguese (Brazil).
- **FR-006**: Each field MUST show its hint text below it (see User Story 3).
- **FR-007**: On submit with invalid input the system MUST NOT create a course, MUST show a clear message next to each invalid field, MUST mark those fields visually and for assistive technology, and MUST move focus to the first invalid field.
- **FR-008**: On a valid submit the system MUST create a course with the given values, mark it as taught by the learner, assign it to a category named after the Teaching language, set it to 0 total items, 0 learned, 0 due and 0 learned today, save it on the learner's device and open Home.
- **FR-009**: The new course MUST appear on Home like any other course (card, progress, "Learn new words" action, options menu, filters "Teaching" and its category) and MUST be removable through the existing remove action.
- **FR-010**: Repeated submits in quick succession MUST create only one course.
- **FR-011**: The Name field MUST have keyboard focus when the page opens.
- **FR-012**: The page MUST show a side panel with "Why create a course?" (three reasons) and "Need more help?" with a "Course Creation knowledge base" link that opens a "coming soon" placeholder.
- **FR-013**: The page MUST include the top navigation used on other screens, with "Courses" highlighted, and a way back to Home without creating a course.
- **FR-014**: The page MUST be usable on desktop and phone widths (form and panel side by side on wide screens, stacked on narrow ones), keyboard operable, with visible focus, and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Course (learner-created)**: A course the learner made. Has a unique id, name, teaching language, speakers' language, tags, description, short description, category, and item counts starting at 0. It is marked as taught by the learner.
- **Language**: A choice used for Teaching and For. Has a name such as "English (UK)". The Teaching language names the course's category.
- **Category**: Grouping used by the Home filter. A learner-created course uses the category of its Teaching language, created if it does not exist.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can create a course (name and teaching language only) in under 30 seconds from pressing "Create a course".
- **SC-002**: 100% of submissions with a missing required field or an over-limit value are blocked, each with a message next to the offending field.
- **SC-003**: 100% of successfully created courses appear on Home immediately and are still there after reopening the app.
- **SC-004**: 90% of first-time users complete the form on the first attempt without help.
- **SC-005**: The form and side panel are fully usable at widths from 360 px up with no horizontal scrolling.
- **SC-006**: Every form control can be reached and used with the keyboard alone.

## Assumptions

- This feature replaces the "coming soon" screen from the Create Course Button feature. The button itself is unchanged.
- No accounts: a single anonymous learner, data saved on the device only (as in the Course Home Dashboard feature).
- Adding items (words and translations) to a course is out of scope. A created course starts with 0 items and stays at 0 for now. Its "Learn new words" action opens the existing placeholder.
- Tags, Description, Short description and the speakers' language are stored with the course but not yet used elsewhere (no search or display beyond the course name on Home).
- The language list is a fixed built-in list of at least five languages, not user editable.
- Text limits in FR-004 are reasonable defaults for the prototype and can be changed later.
- The knowledge-base link has no real destination in the prototype and opens a placeholder.
- Leaving the page discards the entered data without a confirmation prompt.
