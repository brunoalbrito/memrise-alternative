# Feature Specification: Local-First Desktop App with Typing Practice

**Feature Branch**: `local-first-desktop` (umbrella, not a spec directory)

**Created**: 2026-10-18

**Status**: Umbrella (shared design; implement via the specs listed in ROADMAP.md)

**Input**: User description: "Migrate MemBetter from a browser-only prototype to a local-first desktop app (Anki style): everything stored on the user's computer, whole courses exportable and importable as a single file, backups, real study sessions with spaced repetition, and a typing practice screen where the learner types the word shown in an image."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install the desktop app and keep working with my existing data (Priority: P1)

A learner installs MemBetter on their computer and opens it. All existing features (Home, Create Course, Course Editor, course detail, session picker, AI Word Assistant) work as before. Courses, levels, words, images and audio persist on the computer and survive restarts. A learner who used the browser prototype can bring their data over once.

**Why this priority**: Without durable local storage and feature parity there is no product to build the rest on.

**Independent Test**: Install the app, create a course with levels, words, an image and an audio file, quit and reopen: everything is still there and no network connection is needed.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the learner creates a course and adds words with images and audio, **Then** all content is still present after closing and reopening the app, including with the network disabled.
2. **Given** a learner with data in the browser prototype, **When** they use the one-time "import from browser version" option with the file exported by the prototype, **Then** their courses, words, images, audio and goals appear in the desktop app and nothing is duplicated if they repeat the import.
3. **Given** the learner connected an AI key, **When** they use the AI Word Assistant, **Then** suggestions, audio and pictures are produced and stored locally, and the key is never visible again in the interface or in any exported file.
4. **Given** an unexpected shutdown while editing, **When** the app is reopened, **Then** at most the last unsaved keystroke is lost and the library opens without errors.

---

### User Story 2 - Export a whole course to one file and import it elsewhere (Priority: P1)

A learner exports a course (words, levels, images, audio, details) to a single file, sends it to a friend or moves it to another computer, and imports it there. Optionally the learner includes their own study progress.

**Why this priority**: This is the core sharing and portability promise of a local-first app.

**Independent Test**: Export a course with media from one library, import the file into an empty library, and compare: every level, word, image and audio file matches.

**Acceptance Scenarios**:

1. **Given** a course with images and audio, **When** the learner chooses "Export course", **Then** a single file is saved at the chosen location and a progress indicator is shown for large courses.
2. **Given** an exported file, **When** the learner opens it (menu or drag and drop) in an empty library, **Then** the course appears complete and identical to the original.
3. **Given** the course already exists in the library, **When** importing the file, **Then** the learner is asked to choose Replace, Import as copy, or Cancel, and the choice is respected.
4. **Given** a file that is damaged, from a newer app version, or not a MemBetter file, **When** the learner tries to import it, **Then** a clear message explains the problem and the library is left unchanged.
5. **Given** the learner ticks "Include my progress" on export, **When** the file is imported, **Then** scheduling and review history for that course are restored; if not ticked, the imported course starts with no progress.

---

### User Story 3 - Practice by typing the word shown in an image (Priority: P1)

When the learner starts a practice session for a course, a practice screen appears. It shows the image of the current word and asks the learner to type the word. The learner can type with the keyboard, tap letter tiles, ask for a hint, or give up. Correct answers advance to the next word.

**Why this priority**: This is the main learning activity; without it the app only stores words.

**Independent Test**: Start practice on a course with words that have images; type the correct word and confirm the screen advances, the progress bar moves, and the points counter increases.

**Acceptance Scenarios**:

1. **Given** the learner starts a practice session, **When** the screen opens, **Then** it shows the course name in the header, a close button, a progress bar, a points counter, the word's image, an input labeled "WORD", shuffled letter tiles for the answer, a Hint button, a backspace tile, and an "I don't know" button.
2. **Given** the screen is showing, **When** the learner clicks a letter tile or presses the tile's number key (1 to 8), **Then** that letter is added to the input and the tile appears used.
3. **Given** part of the answer is typed, **When** the learner uses the backspace tile or the keyboard backspace, **Then** the last letter is removed and its tile becomes available again.
4. **Given** the learner has not answered, **When** they press Hint (or the H key), **Then** the next correct letter is filled in and the hint is recorded as reducing the points for that word.
5. **Given** the learner is stuck, **When** they press "I don't know" (or Cmd/Ctrl+Enter), **Then** the correct word is revealed, the word is recorded as not recalled, and the learner continues to the next word.
6. **Given** the typed text matches the word (ignoring letter case, and tolerant of accents according to the course setting), **When** the answer is complete, **Then** the screen shows success feedback, adds points, records the review result and moves to the next word.
7. **Given** the learner typed a wrong word, **When** they submit, **Then** the screen shows the mistake, lets them correct it or reveal the answer, and records the word as a lapse only once per attempt.
8. **Given** a word with no image, **When** it appears in practice, **Then** the meaning or example sentence is shown instead so the learner can still answer.
9. **Given** the learner clicks the keyboard-shortcuts toggle, **When** it is on, **Then** the number labels, H and Cmd/Ctrl+Enter hints are visible; when off they are hidden.
10. **Given** the learner presses the close button mid-session, **When** they confirm, **Then** the session ends and all answers given so far are saved.
11. **Given** the last word is answered, **When** the session completes, **Then** a summary shows words practiced, correct answers, hints used and points earned.

---

### User Story 4 - Study with spaced repetition: learn, classic review, speed review (Priority: P2)

The existing session picker offers Learn, Classic review and Speed review. Learn introduces new words in level order. Classic review shows words that are due. Speed review is a timed pass over due words. Each answer updates when the word will next be due.

**Why this priority**: Turns the app into a real memorization tool, but it relies on the practice screen and local storage first.

**Independent Test**: Learn five new words, then confirm they are not due again immediately; advance the date and confirm they appear in classic review.

**Acceptance Scenarios**:

1. **Given** a course with unlearned words, **When** the learner chooses Learn, **Then** the next unlearned words are presented in level order, up to the daily new-word limit.
2. **Given** words are due, **When** the learner chooses Classic review, **Then** only due words are presented and answers reschedule them (correct answers push the next date further away, mistakes bring it closer).
3. **Given** words are due, **When** the learner chooses Speed review, **Then** each word has a visible countdown and an unanswered word counts as not recalled.
4. **Given** no words are due, **When** the learner opens a review, **Then** a friendly "nothing to review" message states when the next words are due.
5. **Given** the learner marks a word as ignored or long-term, **When** sessions are built, **Then** ignored words are skipped.
6. **Given** a daily goal is set, **When** the learner finishes words in sessions, **Then** the Home goal ring and the course progress update.

---

### User Story 5 - Back up and restore the whole library (Priority: P2)

The app saves automatic backups to a folder the learner can choose, keeps the latest ones, and lets the learner export the entire library to one file and restore from a backup.

**Why this priority**: Local-only data needs a safety net, but it is not needed to start learning.

**Independent Test**: Create a backup, delete a course, restore the backup, and see the course return.

**Acceptance Scenarios**:

1. **Given** automatic backups are on, **When** the app starts and the last backup is older than the chosen interval, **Then** a new backup is created and old ones beyond the retention count are removed.
2. **Given** a backup exists, **When** the learner chooses "Restore", **Then** they confirm the replacement and the library returns to the backed-up state.
3. **Given** the backup folder is unavailable, **When** a backup is due, **Then** the learner sees a clear, non-blocking warning.
4. **Given** the learner chooses "Export entire library", **When** it finishes, **Then** one file contains all courses and can be imported into another installation.

---

### User Story 6 - Export for Anki (Priority: P3)

A learner exports a course in a format Anki can open, and imports simple word lists (CSV) into a new course.

**Why this priority**: Convenient interoperability, but the native export already covers sharing.

**Independent Test**: Export a course for Anki, open it in Anki, and see one card per word with image and audio.

**Acceptance Scenarios**:

1. **Given** a course, **When** the learner chooses "Export for Anki", **Then** the resulting file opens in Anki with one deck per course and one card per word, including image and audio.
2. **Given** a CSV file with word and meaning columns, **When** the learner imports it, **Then** a new course is created with those words and the learner is told which rows were skipped and why.

---

### Edge Cases

- The disk is full during an edit, import, export, or backup: the operation stops, nothing is left half-written, and the learner sees a clear message.
- An import is interrupted (app closed, power loss): the library is unchanged on next start.
- An exported file contains a media file with the wrong content or an unsafe path: that file is rejected and the import stops with an explanation.
- The same media file is used by many words: it is stored once and kept until no word uses it.
- Two copies of the app open the same library at once: the second one warns and does not open it for editing.
- Practice for a word whose text has spaces, hyphens, apostrophes or punctuation: letter tiles cover only letters; spaces and punctuation are filled in automatically and the number of tiles never exceeds what fits (long words use extra rows).
- Words longer than eight letters: tiles beyond the eighth have no number key but remain clickable and typeable.
- Word with accented or non-Latin characters: tiles show the exact characters; typing the unaccented letter is accepted only if the course has accent-tolerant matching on.
- A learner pastes text into the input: it is accepted only as typed text and graded normally.
- Practicing with the image missing or failing to load: the screen still works using the fallback in scenario 8.
- Clock changes (device time moved back or forward): due dates never produce negative intervals and sessions still load.
- Importing a course made by a newer app version: a clear "update the app" message appears.
- An AI call fails or the key is invalid: the learner sees a clear message and the word is left unchanged.

## Requirements *(mandatory)*

### Functional Requirements

**Local storage and parity**
- **FR-001**: The app MUST store all courses, levels, words, details, goals, study progress, images and audio on the user's computer, with no account and no network needed for any feature except the AI Word Assistant.
- **FR-002**: All existing features (Home, Create Course, Course Editor, course detail, session picker, AI Word Assistant) MUST keep their current behavior and validation limits after the migration.
- **FR-003**: Edits MUST be saved automatically within one second of the change, with a visible saved or failed status.
- **FR-004**: Images and audio MUST be checked for allowed type and size limits (images up to 2 MB, audio up to 3 MB, at most 5 of each per word) when added, and files no longer used by any word MUST be removed automatically.
- **FR-005**: The user's AI keys MUST be kept in the operating system's protected storage, MUST NOT be shown again after saving, and MUST NOT be included in exports or backups.
- **FR-006**: AI requests MUST be made by the app itself rather than the screens, and results (audio, pictures) MUST be saved locally.
- **FR-007**: The app MUST offer a one-time import of the data held by the browser prototype, and repeating it MUST NOT create duplicates.
- **FR-008**: The library MUST upgrade automatically and safely when a new app version changes how data is stored, keeping a copy of the previous library before upgrading.

**Export and import**
- **FR-009**: Users MUST be able to export any single course to one file containing its details, levels, words, images and audio.
- **FR-010**: Users MUST be able to choose whether the export includes their study progress; the default is not to include it.
- **FR-011**: Users MUST be able to import a course file by menu or by dropping it on the app.
- **FR-012**: When imported content matches an existing course, the user MUST choose Replace, Import as copy, or Cancel, and the import MUST be all-or-nothing.
- **FR-013**: Import MUST validate the file (structure, format version, file integrity, safe file paths, size and count limits) and reject invalid files with a clear message without changing the library.
- **FR-014**: An exported course imported into an empty library MUST be identical to the original in content (round trip).
- **FR-015**: Users MUST be able to export the entire library to a single file and import it back.

**Backup and restore**
- **FR-016**: The app MUST create automatic backups at a user-configurable interval to a user-selectable folder and keep the most recent ten by default.
- **FR-017**: Users MUST be able to create a backup on demand and restore from any backup after confirming the replacement.
- **FR-018**: Backups MUST be consistent even while the app is open.

**Typing practice screen**
- **FR-019**: Starting a practice session MUST open a full-window practice screen with: header (course name, keyboard-shortcuts toggle, close button), a session progress bar, a points counter, the word's image, a labeled "WORD" text input, shuffled letter tiles of the answer, a Hint button, a backspace tile, and an "I don't know" button.
- **FR-020**: Letter tiles MUST be shuffled for each word, MUST show their number (1 to 8) when shortcuts are on, and MUST be selectable by click or by pressing their number key; a selected tile MUST appear used until its letter is removed.
- **FR-021**: The input MUST accept typing from the physical keyboard, tile selection, and backspace through either the keyboard or the backspace tile.
- **FR-022**: Hint (button or H key) MUST reveal the next correct letter and MUST lower the points available for that word; hints MUST be counted in the session summary.
- **FR-023**: "I don't know" (button or Cmd/Ctrl+Enter) MUST reveal the correct word, record the word as not recalled, and move on after the learner acknowledges it.
- **FR-024**: Answers MUST be compared ignoring letter case and surrounding spaces; accent tolerance MUST follow the course setting (default: accents required).
- **FR-025**: A correct answer MUST show success feedback, add points, record the review result, update the progress bar, and advance automatically to the next word.
- **FR-026**: A wrong submitted answer MUST show feedback, allow another attempt or revealing the answer, and MUST count as one lapse for that word regardless of the number of attempts.
- **FR-027**: Words without an image MUST show their meaning or example sentence so they can still be practiced; words with neither MUST be skipped with a note in the summary.
- **FR-028**: Closing the screen mid-session MUST ask for confirmation, then save all answers given so far.
- **FR-029**: At session end a summary MUST show words practiced, correct answers, hints used, and points earned.
- **FR-030**: The practice screen MUST be fully usable with the keyboard only and MUST meet the project's accessibility expectations (visible focus, labels for assistive technology, announced feedback).

**Study sessions**
- **FR-031**: Learn, Classic review and Speed review MUST build their word lists as described in User Story 4 and use the typing practice screen for each word.
- **FR-032**: Every answer MUST update when the word is next due using a spaced-repetition schedule, and the full review history MUST be stored.
- **FR-033**: Learners MUST be able to mark words as ignored or long-term, and to set a daily goal and a daily new-word limit per course.
- **FR-034**: Home and course detail MUST show real totals (words, learned, due, ignored, long-term) computed from stored progress instead of sample numbers.
- **FR-035**: The course leaderboard MUST be replaced by personal statistics (streak, reviews per day, recall rate).

**Anki interoperability**
- **FR-036**: Users MUST be able to export a course in a format that Anki can open (one deck per course, one card per word, with image and audio).
- **FR-037**: Users MUST be able to import a CSV list of words into a new course and see which rows were skipped.

### Key Entities

- **Library**: everything stored on the computer for the user; has a format version used for safe upgrades.
- **Course**: title, languages, category, tags, descriptions, optional cover, settings (daily goal, new-word limit, accent tolerance, hidden state).
- **Level**: ordered group of words inside a course with a name and tested-skill label.
- **Word**: text, meaning, example, pronunciation, order; may have up to five images and five audio files.
- **Media file**: an image or audio file stored once and referenced by any number of words, identified by its content.
- **Study card**: per-word learning state (due date, stability, difficulty, repetitions, lapses, ignored, long-term).
- **Review record**: one answer given (word, result, time taken, hints used, date).
- **Practice session**: an ordered set of words with progress, points, hints and results, tied to one course and one kind (learn, classic, speed).
- **Course file**: the single exportable package of one course (and optionally its progress).
- **Backup**: a saved copy of the whole library with its creation time.
- **Secret**: a user's AI key, kept in protected storage and never exported.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can install the app, create a course with ten words, and start practicing within five minutes without creating an account.
- **SC-002**: After closing and reopening the app, 100% of courses, words, images and audio created before closing are present, with the network disabled.
- **SC-003**: A course of 500 words with 500 images exports in under 30 seconds and imports in under 60 seconds on a typical laptop, showing progress throughout.
- **SC-004**: In round-trip tests, 100% of exported courses re-imported into an empty library match the original in all content fields and media.
- **SC-005**: 100% of corrupted, truncated or unsafe course files are rejected with a clear message and leave the library unchanged.
- **SC-006**: Each practice answer (typing, tile, hint, give up) gives visible feedback within 100 ms, and a learner can complete a ten-word session using only the keyboard.
- **SC-007**: At least 90% of first-time testers complete a ten-word practice session without help.
- **SC-008**: After restoring a backup, 100% of the data present at backup time is present again.
- **SC-009**: No AI key is found in any exported file, backup, log or on-screen after being saved.
- **SC-010**: Words answered correctly are not shown again in the same review session and appear on a later date, and words answered incorrectly are shown again sooner than correctly answered words.
- **SC-011**: The app opens to a usable Home screen in under 3 seconds with a library of 50 courses and 20,000 words.

## Assumptions

- The first release is for desktop computers (Windows, macOS and Linux); phones and tablets are out of scope.
- There are no accounts, cloud sync, public course sharing, server, or leaderboard in this release; sharing means sending the exported file.
- Study progress is private to the library and is exported only when the user chooses.
- AI features still need an internet connection and the learner's own keys; everything else works offline.
- Points for a word: full points for a correct answer without hints, fewer points with each hint, none when the learner gives up. Exact values will be set during planning.
- The practice screen follows the layout of the reference screenshot (header with course name, progress bar and points, image on the left, input and tiles in the center, "I don't know" and status icons on the right) restyled to the project's design system.
- Accent-tolerant matching is a per-course setting that defaults to off.
- The default daily new-word limit is ten and the default backup interval is daily, both adjustable.
- The existing prototype's validation limits (course title, tags, descriptions, media sizes) stay unchanged.
- The `LOCAL_FIRST_PLAN.md` document is the technical reference for this migration; technology choices are made in the implementation plan, not in this specification.
