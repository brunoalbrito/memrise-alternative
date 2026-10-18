# Feature Specification: Course Detail View

**Feature Branch**: `005-course-detail-view`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "when you click on a course i need to have this view [screenshot: a course page with a header (breadcrumb, cover image, title, creator, share button), a Levels tab and Edit Course link, a progress summary with Review buttons and Options, a grid of level cards, and a Leaderboard panel]"

## Clarifications

### Session 2026-10-18

- Q: What should the leaderboard list contain, given there are no accounts and only one learner? → A: A few fixed sample learners plus "You". Each period (Week, Month, All Time) has different fixed sample points, and "You" is highlighted.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a course and see its header (Priority: P1)

A learner clicks a course on Home. A course page opens showing a header with a breadcrumb path (for example "Courses > Languages > English (US)"), the course cover image, the course title, who created it, and a "Tweet" share button. A way back to Home is always available.

**Why this priority**: Opening a course is what makes courses useful. Every other part of this page hangs off this header.

**Independent Test**: Click each kind of course on Home (sample, learner-created, long title). Verify the page opens, shows the right title, breadcrumb, cover and creator, and that Back to Home returns to Home.

**Acceptance Scenarios**:

1. **Given** a course card on Home, **When** the learner clicks the course title or the card, **Then** the course page for that course opens.
2. **Given** the course page is open, **When** the learner looks at the header, **Then** it shows the breadcrumb ending with the course's category, the cover image (or a symbol if it has none), the title and "Created by" with the creator's name.
3. **Given** a course created by the learner, **When** its page opens, **Then** "Created by" shows "You".
4. **Given** the course page, **When** the learner follows a breadcrumb entry or "Back to Home", **Then** the matching screen opens (Courses opens a placeholder, Home opens Home).
5. **Given** a course id that does not exist (for example from an old link), **When** the page is opened, **Then** a "Course not found" message with a link to Home is shown.
6. **Given** the "Tweet" button, **When** the learner presses it, **Then** a "coming soon" placeholder opens with a way back.

---

### User Story 2 - See my progress and start a review (Priority: P1)

Below the header the learner sees a summary of their progress in this course: "N / M words learned (L in long term memory)", "K ignored" and a progress bar. Next to it are a "Review (R)" button, a clock button for a speed review, and an "Options" menu. Review is available only when words are due.

**Why this priority**: Progress and the next action are the reason learners return to a course page.

**Independent Test**: Open a course with due words, one with none, and one with 0 words. Verify the summary numbers, the bar, the Review button state and the Options menu.

**Acceptance Scenarios**:

1. **Given** a course with 131 of 132 words learned, 0 in long term memory and 1 ignored, **When** the page opens, **Then** it shows "131 / 132 words learned (0 in long term memory)", "1 ignored" and a bar filled to match.
2. **Given** a course with 26 words due, **When** the page opens, **Then** the button reads "Review (26)" and opens a "coming soon" placeholder for a review of that course.
3. **Given** a course with no words due, **When** the page opens, **Then** the "Review (0)" button is disabled and cannot be activated.
4. **Given** the clock button, **When** the learner presses it (or it is disabled when nothing is due), **Then** it opens a "coming soon" placeholder for a speed review of that course.
5. **Given** the Options menu, **When** the learner opens it, **Then** it offers "Set daily goal" and "Remove course", which work as on Home. Removing the course returns the learner to Home.
6. **Given** a course with 0 words, **When** the page opens, **Then** it shows "0 / 0 words learned" with an empty bar and no division error.

---

### User Story 3 - Browse the course levels (Priority: P1)

A "Levels (N)" tab lists the course's levels as cards. Each card shows the level number, a plant picture showing its stage, the level name and its state. A completed level shows a flower and a check mark. A level in progress shows a growing plant with how many words are learned. A level not started shows an empty pot and "Ready to learn". Pressing a level opens a "coming soon" placeholder for that level.

**Why this priority**: Levels are how learners see the structure of a course and where they are in it.

**Independent Test**: Open a course with completed, in-progress and not-started levels. Verify each card's picture, state text and check mark, the tab count, and that pressing a card opens its placeholder.

**Acceptance Scenarios**:

1. **Given** a course with 4 levels, **When** the page opens, **Then** the tab reads "Levels (4)" and 4 level cards are shown in order.
2. **Given** a level where every word is learned, **When** it is shown, **Then** its card shows a flower and a check mark.
3. **Given** a level with some words learned, **When** it is shown, **Then** its card shows a growing plant and "X / Y learned".
4. **Given** a level with no words learned, **When** it is shown, **Then** its card shows an empty pot and the text "Ready to learn".
5. **Given** a level card, **When** the learner presses it (mouse or keyboard), **Then** a placeholder naming the course and the level opens, with a way back.
6. **Given** a course with no levels (for example a newly created course), **When** the page opens, **Then** the tab reads "Levels (0)" and an empty message explains that the course has no levels yet.

---

### User Story 4 - See the leaderboard (Priority: P2)

A "Leaderboard" panel beside the levels ranks fixed sample learners and the current learner ("You") by points. It has the tabs "Week", "Month" and "All Time", each with its own fixed sample points, a list of ranked rows (rank, name, points) with the "You" row highlighted, and a "More" link. On narrow screens the panel appears below the levels.

**Why this priority**: It adds motivation but the page works without it.

**Independent Test**: Open the page, switch each tab and check that the list changes. Press "More" and check the placeholder. Resize to phone width and check placement.

**Acceptance Scenarios**:

1. **Given** the course page, **When** it opens, **Then** the leaderboard shows the "Week" tab selected with a ranked list of at least 4 rows that includes "You".
2. **Given** the leaderboard, **When** the learner selects "Month" or "All Time", **Then** the list updates to that period's fixed points and order, and the selected tab is marked.
3. **Given** the list, **When** it is shown, **Then** each row shows rank, name and points, and the current learner's row is visually highlighted.
4. **Given** the "More" link, **When** the learner presses it, **Then** a "coming soon" placeholder opens with a way back.
5. **Given** a phone width, **When** the page opens, **Then** the leaderboard appears below the levels with no horizontal scroll.

---

### User Story 5 - Edit the course (Priority: P3)

For courses the learner created, an "Edit Course" link is shown next to the tab. It opens a "coming soon" placeholder. For courses the learner did not create, the link is not shown.

**Why this priority**: Editing is a future feature. The link only needs to exist and behave correctly.

**Independent Test**: Open a learner-created course and a sample course. Verify the link appears only on the former and opens a placeholder.

**Acceptance Scenarios**:

1. **Given** a course created by the learner, **When** the page opens, **Then** "Edit Course" is shown and opens a placeholder.
2. **Given** a sample course the learner did not create, **When** the page opens, **Then** no "Edit Course" link is shown.

---

### Edge Cases

- Course title very long: the title wraps and the header layout does not break.
- Course with no cover image: a symbol from its category is shown instead.
- Course with 0 words: no division by zero, bar empty, Review disabled, "Levels (0)".
- All words learned: the bar is full and every level shows as completed.
- Ignored count of 0: the "ignored" text shows "0 ignored".
- Unknown course id: "Course not found" with a link to Home.
- Course removed from the Options menu: the learner returns to Home and the course is gone from the list.
- Narrow phone widths: header, summary, level grid and leaderboard stack, with no horizontal scroll.
- "You" with 0 points: the row still appears, ranked after learners with points, and is highlighted.
- Equal points: learners with equal points share the same rank and are listed alphabetically by name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicking a course's title or card on Home MUST open that course's page. The levels button on the card MUST also open it.
- **FR-002**: The page MUST show a header with a breadcrumb, cover image (or category symbol), title, "Created by" and a "Tweet" button.
- **FR-003**: The breadcrumb MUST read "Courses > [category path]" where the category path is the course's category (for example "Languages > English (US)" for a language course). Each entry before the last MUST be a link.
- **FR-004**: "Created by" MUST show the creator's name for sample courses and "You" for learner-created courses.
- **FR-005**: The "Tweet" button MUST open a "coming soon" placeholder.
- **FR-006**: The page MUST show a progress summary in the form "N / M words learned (L in long term memory)", "K ignored" and a progress bar whose fill matches N / M. With M = 0 the bar MUST be empty and no error MUST appear.
- **FR-007**: The page MUST show a "Review (R)" button, where R is the number of words due. It MUST be disabled when R is 0 and otherwise open a "coming soon" placeholder naming a review of the course.
- **FR-008**: The page MUST show a clock button for a speed review that opens a "coming soon" placeholder, and is disabled when no words are due.
- **FR-009**: The page MUST show an "Options" menu with "Set daily goal" and "Remove course", reusing the same behavior as the Home course menu. Removing a course MUST return the learner to Home.
- **FR-010**: The page MUST show a "Levels (N)" tab with N equal to the number of levels, followed by one card per level in order.
- **FR-011**: Each level card MUST show its number and name and one of three states: completed (all words learned: flower and check mark), in progress (some learned: growing plant and "X / Y learned") or not started (empty pot and "Ready to learn").
- **FR-012**: Pressing a level card MUST open a "coming soon" placeholder naming the course and the level.
- **FR-013**: With no levels the page MUST show an empty message in place of the cards.
- **FR-014**: The page MUST show a leaderboard panel with "Week", "Month" and "All Time" tabs (Week selected first). Each period MUST list at least 4 rows (fixed sample learners plus "You") ordered by points, highest first, each with rank, name and points. The "You" row MUST be highlighted. A "More" link MUST open a "coming soon" placeholder.
- **FR-015**: For courses created by the learner the page MUST show an "Edit Course" link that opens a "coming soon" placeholder. It MUST NOT be shown for other courses.
- **FR-016**: The page MUST include the top navigation used on other screens with "Courses" highlighted, and a link back to Home.
- **FR-017**: An unknown course id MUST show a "Course not found" message with a link to Home.
- **FR-018**: The page MUST be usable on desktop and phone widths (levels and leaderboard side by side on wide screens, stacked on narrow), keyboard operable, with visible focus, and follow the project's Material Design 3 guidelines.
- **FR-019**: For sample courses, the word counts of all levels MUST add up to the course's total words and the learned counts to its learned words, so Home and this page always agree.

### Key Entities *(include if feature involves data)*

- **Course (detail)**: The course shown on the page. Has title, cover image or category symbol, creator name, category path, total words, learned words, words in long term memory, ignored words and words due.
- **Level**: A named step of a course with a number, name, total words and learned words. Its state (completed, in progress, not started) is derived from those counts.
- **Leaderboard entry**: A learner on the ranking for a period. Has rank (derived from points), display name, points for that period and whether it is the current learner ("You"). Sample entries and points are fixed data per period.
- **Leaderboard period**: One of Week, Month or All Time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can open any course from Home in one click and see its title and progress without scrolling on screens 360 px wide and up.
- **SC-002**: 100% of numbers on the course page (words learned, total, due, ignored, level counts) match the same course's numbers on Home and the sum of its levels.
- **SC-003**: A learner can tell which level to work on next within 5 seconds of opening the page, by seeing completed, in-progress and "Ready to learn" levels.
- **SC-004**: Switching a leaderboard tab updates the list in under 1 second.
- **SC-005**: Every control on the page (Tweet, Review, clock, Options, level cards, tabs, More, Edit Course, breadcrumb) can be reached and used with the keyboard alone.
- **SC-006**: 90% of first-time users can find the Review button and the level list on the first attempt without help.

## Assumptions

- Clicking a course on Home means clicking its title or its card. Existing card buttons (primary action, options menu) keep their current behavior and do not open the page.
- The "levels" button on the Home card now opens this page instead of its previous placeholder.
- The prototype constraints still apply: no accounts, one anonymous learner, data saved on the device only, pre-loaded sample courses.
- Sample courses get pre-loaded levels, creator names, words in long term memory, ignored counts and cover images or symbols. These are fixed sample data and do not change.
- Learner-created courses have 0 words and 0 levels, so they show the empty levels message and a disabled Review button.
- The leaderboard shows fixed sample learners plus the current learner (shown as "You") with fixed sample points for each period. Points do not change in this version and are the same for every course.
- Terminology on this page is "words" as in the reference, while Home says "items". Both refer to the same counts.
- "Tweet" has no real sharing in the prototype and opens a placeholder.
- Review, speed review, levels, leaderboard "More" and Edit Course destinations are separate future features and open placeholders.
- Options contains only "Set daily goal" and "Remove course" in this version.
- The reference image is a layout and behavior guide. Exact visuals follow the project's Material Design 3 tokens.
