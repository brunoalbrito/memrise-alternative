# Feature Specification: Course Home Dashboard

**Feature Branch**: `002-course-home-dashboard`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "I wanna to make a copy of the memrise home functionalities. It doesn't need to follow exactly the same layout. Focus on the functions [screenshot of Memrise home: course list with filter dropdown, per-course progress, stats and action buttons]"

## Clarifications

### Session 2026-10-18

- Q: Where do the courses and learning progress on Home come from in this first version? → A: Pre-loaded sample courses (prototype). Progress is saved on the learner's device only, with no accounts.
- Q: When the learner presses "Speed review" or "Learn new words" in this prototype, what should happen? → A: A placeholder "coming soon" screen is shown. Nothing on Home changes.
- Q: Where should the "Courses" and "Groups" navigation items and each course's levels/content button lead in this prototype? → A: All three open a "coming soon" placeholder screen that names the destination, with a way back to Home.
- Q: Can the learner combine filters, or does picking one option replace the previous one? → A: One filter at a time. Picking any option replaces the previous one.
- Q: When the learner sets a daily goal, what are they choosing? → A: One of a few fixed daily item targets (5, 10, 20 or 50), or no goal. The ring fills as today's learned count approaches the target.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See my courses and progress at a glance (Priority: P1)

A learner opens the Home page and sees every course they are enrolled in. Each course shows its title, a percentage completed, an "X / Y items learned" count and a progress bar. The learner can immediately tell where they stand in each course.

**Why this priority**: The course list with progress is the core of the home page. Without it nothing else has context.

**Independent Test**: Seed a learner with several courses at different progress levels. Open Home. Verify each course appears with correct title, percentage, learned/total count and progress bar.

**Acceptance Scenarios**:

1. **Given** a learner enrolled in 3 courses, **When** they open Home, **Then** all 3 courses are listed, each with title, percentage, "learned / total items learned" and a progress bar.
2. **Given** a course with 159 of 2363 items learned, **When** Home is shown, **Then** it displays 6% and "159 / 2363 items learned" with the bar filled to match.
3. **Given** a course with 0 items learned, **When** Home is shown, **Then** it displays 0% and an empty progress bar.
4. **Given** a learner who removed all their courses, **When** they open Home, **Then** they see an empty state with a way to restore the sample courses.

---

### User Story 2 - Start the right learning action for each course (Priority: P1)

Each course card shows a single primary action button that depends on the course state. When the course has items due for review, the button is "Speed review". When nothing is due, the button is "Learn new words". Pressing it opens a placeholder "coming soon" screen for that course, since real sessions are a separate feature.

**Why this priority**: Starting a session is the main reason to visit Home. It turns the dashboard into a daily entry point.

**Independent Test**: Seed one course with due reviews and one without. Verify button labels differ and each opens the placeholder screen naming the right course and session type.

**Acceptance Scenarios**:

1. **Given** a course with 26 items due for review, **When** Home is shown, **Then** the primary button reads "Speed review" and opens a placeholder screen for a review session of that course.
2. **Given** a course with no items due, **When** Home is shown, **Then** the primary button reads "Learn new words" and opens a placeholder screen for a learning session of that course.
3. **Given** the learner opens the placeholder screen, **When** they go back to Home, **Then** progress, counts and button labels are unchanged.

---

### User Story 3 - See per-course stats (Priority: P2)

Each course card shows three small stats: goal progress (with a ring indicator), number of items learned/planted, and number of items due for review. Stats are dimmed when their value is zero.

**Why this priority**: Stats tell the learner what to do next and motivate daily practice, but the page works without them.

**Independent Test**: Seed a course with known goal progress, learned count and due count. Verify the three values and the dimmed style for zero values.

**Acceptance Scenarios**:

1. **Given** a course with a goal set and 0 progress today, **When** Home is shown, **Then** the goal ring displays 0.
2. **Given** a course with 159 learned items and 26 due for review, **When** Home is shown, **Then** the stats show 159 and 26.
3. **Given** a course with no learned items and no reviews due, **When** Home is shown, **Then** the stats show 0 in a dimmed style.

---

### User Story 4 - Filter courses by goal, role and category (Priority: P2)

At the top of the list, the learner opens a filter menu titled "All Courses". The menu has two groups. "Filter Results" offers: All Courses, With Goal Set, Teaching. "By Category" lists the categories (for example language or subject) that the learner's courses belong to. Choosing an option updates the list and the page heading to show the active filter.

**Why this priority**: Learners with many courses need to narrow the list. It is useful but secondary to the list and actions.

**Independent Test**: Seed courses with different goals, roles and categories. Pick each filter option and verify only matching courses remain.

**Acceptance Scenarios**:

1. **Given** the filter menu is open, **When** the learner picks "With Goal Set", **Then** only courses with a goal set are listed and the heading shows the active filter.
2. **Given** the learner teaches 2 of their courses, **When** they pick "Teaching", **Then** only those 2 courses are listed.
3. **Given** courses in categories "English" and "Japanese", **When** the learner picks "Japanese", **Then** only Japanese courses are listed.
4. **Given** a filter is active, **When** the learner picks "All Courses", **Then** the full list returns.
5. **Given** a filter matches no course, **When** it is applied, **Then** an empty-result message is shown with a way to clear the filter.

---

### User Story 5 - Manage a course from its card (Priority: P3)

Each course card has an options menu (three dots) and a levels/content button. The options menu lets the learner act on the course, such as setting or changing a daily goal and removing the course from their list. The levels/content button opens a placeholder "coming soon" screen for that course's levels and items.

**Why this priority**: These are convenience actions that round out the dashboard. Core learning works without them.

**Independent Test**: Open the options menu on a course. Set a goal and verify the goal ring and the "With Goal Set" filter reflect it. Remove a course and verify it disappears from Home.

**Acceptance Scenarios**:

1. **Given** a course without a goal, **When** the learner sets a daily goal from the options menu, **Then** the course shows goal progress and appears under "With Goal Set".
2. **Given** a course on Home, **When** the learner removes it from the options menu and confirms, **Then** it is no longer listed.
3. **Given** a course card, **When** the learner presses the levels/content button, **Then** a placeholder screen naming that course's levels and items opens, with a way back to Home.

---

### User Story 6 - Navigate between main areas (Priority: P3)

A top navigation bar offers Home, Courses and Groups, plus a profile control. Home is highlighted as the current page. Selecting Courses or Groups opens a placeholder "coming soon" screen. Selecting Home returns to the course list.

**Why this priority**: Navigation frames the page, but the destination pages are separate features.

**Independent Test**: Open Home. Verify the three nav items and profile control are present, Home is marked active, and Courses and Groups open placeholder screens.

**Acceptance Scenarios**:

1. **Given** the learner is on Home, **When** the page loads, **Then** Home is shown as the active item.
2. **Given** the nav bar, **When** the learner selects Courses or Groups, **Then** a placeholder screen naming that area opens, with a way back to Home.

---

### Edge Cases

- Course with very long title: title wraps without breaking card layout.
- Course with 0 total items: percentage shows 0% and no divide-by-zero or "NaN" is shown.
- Progress is rounded down to a whole percent, and never shows 100% unless all items are learned.
- Learner has many courses: list stays usable (scrolls) and filter keeps working.
- Category list is empty: the "By Category" group is hidden.
- Course data fails to load: a clear error message with a retry action is shown.
- A filter is active and the learner removes the last matching course: empty-result state appears.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST list every course the learner is enrolled in on the Home page. A new learner starts enrolled in the pre-loaded sample courses.
- **FR-002**: Each course entry MUST show title, percentage learned, "learned / total items learned" and a progress bar.
- **FR-003**: Each course entry MUST show a goal indicator, a learned-items count and a due-for-review count, dimmed when zero.
- **FR-004**: Each course entry MUST show one primary action: "Speed review" when items are due, otherwise "Learn new words".
- **FR-005**: Pressing the primary action MUST open a placeholder "coming soon" screen that names the course and session type, with a way back to Home. It MUST NOT change progress.
- **FR-006**: System MUST provide a filter menu with "All Courses", "With Goal Set" and "Teaching".
- **FR-007**: System MUST provide a "By Category" filter group built from the categories of the learner's courses.
- **FR-008**: Only one filter MAY be active at a time. Picking any option (including a category) MUST replace the previous one, update the list and update the page heading to show the active filter. "All Courses" MUST be the default.
- **FR-009**: Each course entry MUST have an options menu to set, change or clear a daily goal and to remove the course. Goal choices are 5, 10, 20 or 50 items per day, or no goal.
- **FR-010**: Each course entry MUST have a levels/content button that opens a placeholder "coming soon" screen naming that course's levels and items.
- **FR-011**: System MUST show an empty state when the learner has no courses, and an empty-result state when a filter matches none.
- **FR-012**: System MUST show a top navigation with Home, Courses, Groups and a profile control, with the current page highlighted. Courses and Groups MUST open placeholder "coming soon" screens that name the destination and offer a way back to Home.
- **FR-013**: Progress, counts and primary action MUST update when a goal is set or a course is removed. Sessions do not change them in this version.
- **FR-014**: System MUST show a clear error with retry when course data cannot be loaded.
- **FR-015**: System MUST save progress, goals and course removals on the learner's device and restore them on the next visit.
- **FR-016**: Home MUST be usable on desktop and mobile screen widths, and its controls MUST be keyboard accessible.

### Key Entities *(include if feature involves data)*

- **Learner**: The anonymous person using Home on this device. Has enrolled courses, goals and a teaching role per course.
- **Course**: A set of learnable items. Has title, category, total item count and optional cover image.
- **Enrollment**: Link between a learner and a course. Holds items learned, items due for review, optional daily goal and whether the learner teaches it.
- **Category**: A grouping of courses (for example a language or subject) used by the filter.
- **Learning Session**: A review or learn-new-words run started from a course card. Only a placeholder in this version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can reach the review or learning screen for any course within 2 interactions from opening Home.
- **SC-002**: 100% of course cards show progress values that match the learner's actual learned and total counts.
- **SC-003**: Applying a filter updates the visible list in under 1 second for learners with up to 100 courses.
- **SC-004**: 90% of first-time users can find and use the filter menu without guidance.
- **SC-005**: Home shows its full course list within 2 seconds on a typical home connection.
- **SC-006**: After setting a goal or removing a course, Home shows the change immediately and still shows it after reopening the app.

## Assumptions

- This version is a layout and behavior prototype. There are no accounts: a single anonymous learner uses the app. Sign-up, login and profile management are out of scope.
- Layout does not need to match Memrise exactly. Visual design follows the project constitution (Material Design 3).
- Course content, the review and learning sessions themselves, the Courses catalog, Groups and course levels/content pages are separate features. Home only links to them.
- Real review and learning sessions are out of scope. The two buttons open a placeholder screen, and progress counts in the sample data are fixed.
- Goals are daily item-count targets (5, 10, 20 or 50) chosen by the learner. The goal ring shows today's learned count (fixed in the sample data) against the target, and shows full at or above the target.
- "Teaching" means the learner is the author or teacher of the course.
- Categories come from course metadata. Course ordering defaults to most recently studied first.
- Courses come from a fixed set of pre-loaded sample courses. Creating, editing or importing courses is out of scope.
- Learner progress, goals and removed courses are saved on the learner's device only and persist between visits. They do not sync across devices.
