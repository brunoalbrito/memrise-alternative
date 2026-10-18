---

description: "Task list for Course Editor"
---

# Tasks: Course Editor

**Input**: Design documents from `/specs/009-course-editor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature reuses `Button`, `IconButton`, `icons`, `TopAppBar`, `CourseForm`, `HelpPanel`, the learner store and `CoursePlaceholder` from features 001 to 008.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US5)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V).
- No new dependencies (IndexedDB, File API and object URLs are browser APIs). Cross-feature imports go through barrels: `course-editor` imports from `../home`, `../create-course` and `../course-detail`; `home`, `create-course` and `course-detail` never import `course-editor`.
- Exact user-facing texts come from `specs/009-course-editor/contracts/ui-contract.md`. Copy them verbatim.
- Ids: `media-<uuid>`, `word-<uuid>`, `level-<uuid>` using `crypto.randomUUID()`.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] Create `src/shared/storage/storageWritable.ts` exporting `storageWritable(): boolean` (try `localStorage.setItem("membetter.probe","1")` then `removeItem`, return false on any exception). In `src/features/create-course/hooks/useCourseForm.ts` delete the local `storageWritable` function and import this one.
- [x] T002 [P] Create `src/shared/media/mediaStore.ts` with an IndexedDB wrapper (database `membetter-media`, version 1, object store `files`): `putMedia(id: string, blob: Blob): Promise<void>`, `getMedia(id: string): Promise<Blob | undefined>`, `deleteMedia(id: string): Promise<void>`. Open the database lazily and reuse the connection; reject on errors (quota included). Never throw synchronously.
- [x] T003 [P] In `src/features/home/model/types.ts` add `MediaRef { id: string; name: string; type: string; size: number }`, `Word { id: string; text: string; meaning: string; example: string; images: MediaRef[]; audio: MediaRef[]; learned: boolean }` and `CourseLevel { id: string; name: string; tested: string; words: Word[] }`, with constraint comments verbatim from data-model.md: images "At most 5 entries, each an image"; audio "At most 5 entries, each an audio file"; text "A row counts as a word only when `text.trim()` is not empty"; level name "Default \"Level N\" for new levels".
- [x] T004 [P] Create `src/features/home/model/counts.ts` exporting `countsFromLevels(levels: CourseLevel[], due: number): { totalItems: number; itemsLearned: number; itemsDue: number }`. Rules, verbatim from data-model.md: `totalItems` "number of words with `text.trim() !== \"\"`"; `itemsLearned` "number of those with `learned === true`"; `itemsDue` "`min(due, itemsLearned)`". Also export `levelViews`-free helper `wordHasText(word)`. Depends on T003.
- [x] T005 [P] Create `src/features/home/data/sampleLevels.ts` exporting `sampleLevels: Record<string, CourseLevel[]>` built from compact seeds (level name, tested line, words as `[text, meaning, example?]`) with ids `sample-<courseId>-l<i>-w<j>`, `images` and `audio` empty and `learned` true for the first N words in order. Sizes exactly as in data-model.md: `english-visual-dictionary` 3 levels (7, 5, 4 words), 9 learned (first level words: sink, wash, laundry folding, hamper, rhythm, humid, variant with their meanings from the reference image, tested line "Test on Word, prompt with Images."); `irregular-verbs` 4 levels of 3, 0 learned; `english-polyglot` 3 levels of 4, 0 learned; `japanese-hiragana` 2 levels of 5, 10 learned; `japanese-n5-vocab` 3 levels of 4, 5 learned; `spanish-mexico-basics` 2 levels of 5, 4 learned; `networking-fundamentals` 2 levels of 4, 2 learned; `empty-course` no entry. Every word has a text and a meaning. Depends on T003.
- [x] T006 In `src/features/home/data/sampleCourses.ts` derive the counts of every sample course from its sample levels: rename the existing array to `baseSamples`, keep each record's `itemsDue` as the "due" input (set to: `english-visual-dictionary` 3, `japanese-n5-vocab` 2, `spanish-mexico-basics` 1, `networking-fundamentals` 1, others 0) and export `sampleCourses = baseSamples.map((c) => ({ ...c, ...countsFromLevels(sampleLevels[c.id] ?? [], c.itemsDue) }))`. Remove the now-meaningless static `totalItems`/`itemsLearned` values from the records by setting them to 0 (they are overwritten). Update `src/features/course-detail/data/sampleCourseExtras.ts`: delete `levelNames` from the type and every entry (and from `defaultExtras`); set values obeying "`0 <= longTermCount <= itemsLearned`" and "`itemsLearned + ignoredCount <= totalItems`" with the new counts: english-visual-dictionary longTerm 3 / ignored 2; irregular-verbs 0 / 0; english-polyglot 0 / 1; japanese-hiragana 6 / 0; japanese-n5-vocab 2 / 1; spanish-mexico-basics 1 / 1; networking-fundamentals 0 / 0; empty-course 0 / 0. Depends on T004, T005.
- [x] T007 Update `src/features/home/store/learnerStore.ts`: add `courseLevels: Record<string, CourseLevel[]>` (initial `{}`); `setCourseLevels(courseId: string, levels: CourseLevel[]): void` which computes the set of media ids referenced by all courses before and after (a course's levels are `courseLevels[id] ?? sampleLevels[id] ?? []`), writes the list, then calls `deleteMedia(id).catch(() => {})` (from `../../../shared/media/mediaStore`) for every id referenced before and by none after; `addCourse` also sets `courseLevels[newId] = []`; `removeCourse` also deletes `courseLevels[courseId]` (created or sample) and runs the same media cleanup. Add `courseLevels` to `partialize`; in `merge` keep only entries whose id is a sample id or the id of a hydrated created course, and drop media-less malformed levels (levels must be arrays, words arrays). Keep `version: 1`. Depends on T002, T003, T005.
- [x] T008 Update `src/features/home/hooks/useAllCourses.ts` so each course (sample with edits, or created) gets `countsFromLevels(levels, course.itemsDue)` applied, where levels are `courseLevels[course.id] ?? sampleLevels[course.id] ?? []`; memoize on `courseEdits`, `createdCourses` and `courseLevels`. Create `src/features/home/hooks/useCourseLevels.ts` exporting `useCourseLevels(courseId: string): CourseLevel[]` (same rule). Update `src/features/home/index.ts` to export `useCourseLevels`, `countsFromLevels`, `wordHasText` and the types `CourseLevel`, `Word`, `MediaRef`. Depends on T004, T006, T007.
- [x] T009 Update the course page to use stored levels: in `src/features/course-detail/model/levels.ts` replace `buildLevels` with `levelViews(levels: CourseLevel[]): Level[]` mapping each level to `{ number: index + 1, name, totalWords: words with text, learnedWords: learned words with text }` (keep `Level` and `levelState`); in `src/features/course-detail/hooks/useCourseDetail.ts` call `useCourseLevels(course.id)` before the early return, build `levels` with `levelViews`, and stop reading `levelNames`. Depends on T008.
- [x] T010 Update the create form so `onSubmit` may return the path to open: in `src/features/create-course/components/CourseForm.tsx` and `src/features/create-course/hooks/useCourseForm.ts` change the `onSubmit` type to `(values: CourseDraft) => string | void` and navigate to the returned path if it is a string, otherwise to `successPath` (the `CourseNotFoundError` behavior is unchanged). Depends on T001.

**Checkpoint**: `pnpm typecheck` passes; Home and course pages show the sample words' counts (for example "9 / 16" for English Visual Dictionary) and levels.

---

## Phase 2: User Story 1 - Open the course editor (P1) 🎯 MVP

**Goal**: Create Course and Edit Course both open the editor on the Levels tab with its header and Editing bar.

**Independent Test**: Quickstart scenarios 1, 2 and 12.

- [x] T011 [US1] Create `src/features/course-editor/components/EditorHeader.tsx`. Props: `title`, `creator`, `courseId`, `levelCount`, `activeTab: "levels" | "databases" | "contributors" | "details"`. Render a header band (`bg-surface-container-high`) with the h1 title and "Created by <creator>", then a `<nav aria-label="Editing">` with the text "Editing" and router `Link`s "Levels (N)" (to `/course/:id/edit`), "Databases", "Contributors", "Details" (to `/course/:id/edit/<tab>`) where the active one has `aria-current="page"` and the selected style (`bg-secondary-container`), and "Back to Course" (to `/course/:id`) at the right end. The nav wraps on narrow widths.
- [x] T012 [US1] Create `src/features/course-editor/CourseEditorPage.tsx` with prop `tab`. Read `id` from `useParams`, use `useCourseDetail`-equivalent data from the barrels (`useCourse`, `useCourseLevels`, `useLearnerStore` removed ids; creator is "You" for ids starting with `custom-`, otherwise use the creator exposed by `../course-detail` — export a small `useCourseCreator(courseId)` hook from `src/features/course-detail/index.ts` if needed). A missing or removed course renders `TopAppBar` plus "Course not found" and a "Back to Home" link. Otherwise render `TopAppBar`, `EditorHeader` and a `<main>` showing, for now, the Levels tab stub (created in this task as `src/features/course-editor/components/LevelsTab.tsx` returning the empty message "This course has no levels yet. Use Add Level to create one.") for `tab === "levels"`. Create `src/features/course-editor/index.ts` exporting `CourseEditorPage`. Depends on T009, T011.
- [x] T013 [US1] In `src/app/router.tsx` replace the `/course/:id/edit` element (`<EditCoursePage />`) with `<CourseEditorPage tab="levels" />` imported from `../features/course-editor`, and add `/course/:id/edit/details`, `/course/:id/edit/databases`, `/course/:id/edit/contributors` rendering `<CourseEditorPage tab="details" />`, `tab="databases"` and `tab="contributors"`. Depends on T012.
- [x] T014 [US1] In `src/features/create-course/CreateCoursePage.tsx` change the form's `onSubmit` to `(values) => \`/course/${useLearnerStore.getState().addCourse(values)}/edit\`` so a successful create opens the editor (keep `successPath="/"` as fallback). Depends on T010, T013.

**Checkpoint**: US1 works alone (both entry points open the editor shell; no content editing yet).

---

## Phase 3: User Story 2 - Add and manage levels (P1)

**Goal**: Add, rename, tested-line, show/hide, preview, duplicate and delete levels.

**Independent Test**: Quickstart scenario 3.

- [x] T015 [US2] Create `src/features/course-editor/model/levelOps.ts` with pure functions on `CourseLevel[]`: `addLevel(levels): CourseLevel[]` (append `{ id: "level-<uuid>", name: "Level N", tested: "", words: [] }` where N is the new position), `renameLevel(levels, levelId, name)` (an empty trimmed name becomes "Level N" for its position), `setTested(levels, levelId, tested)`, `duplicateLevel(levels, levelId)` (insert after the original a copy with a new level id, new word ids, the same media refs and `learned` set to false for all copied words, name unchanged), `deleteLevel(levels, levelId)`. Never mutate inputs.
- [x] T016 [US2] Create `src/features/course-editor/hooks/useLevels.ts` exporting `useLevels(courseId)` returning `{ levels, commit(next: CourseLevel[]): boolean }` where `levels` is `useCourseLevels(courseId)` and `commit` calls `useLearnerStore.getState().setCourseLevels(courseId, next)` inside try/catch and returns false on failure. Depends on T008.
- [x] T017 [P] [US2] Create `src/features/course-editor/components/DeleteLevelDialog.tsx` on the native `<dialog>` element (same pattern as `src/features/home/components/RemoveCourseDialog.tsx`): props `levelNumber`, `onConfirm`, `onClose`; text "Delete level N and its words?" with "Cancel" and "Delete" buttons; Escape and Cancel close without change.
- [x] T018 [US2] Create `src/features/course-editor/components/LevelEditor.tsx`. Props: `courseId`, `level`, `number`, `languageName`, `showAttributes`, `onChange(next: CourseLevel)`, `onDuplicate()`, `onDelete()`. Render a header bar (`bg-primary text-on-primary` rounded top corners) with the number, a name `<input aria-label="Level name">` (on blur an empty value falls back to "Level N"), the label `(<languageName>)`, and buttons "Show/Hide" (`aria-expanded`), "Preview" (router `Link` to `/course/${courseId}/levels/${number}`), "Duplicate", "Delete" (opens `DeleteLevelDialog`, confirming calls `onDelete`). Under it an input `aria-label="How this level is tested"` for `tested` with a pencil icon (`EditIcon`). A body area (hidden when collapsed; collapsed state in `useState`) that US3 fills with the words table. Depends on T015, T017.
- [x] T019 [US2] Replace the stub `src/features/course-editor/components/LevelsTab.tsx`: props `courseId`, `languageName`. Use `useLevels`; render a toolbar with a "Add Level" `Button` (text/tonal with `AddIcon`; before committing call `storageWritable()` and show "Could not save your change on this device. Please try again." in an `aria-live` region if false) and, for now, nothing else; below it one `LevelEditor` per level wired to `levelOps` through `commit`; with no levels show "This course has no levels yet. Use Add Level to create one.". Pass `languageName` resolved from the course's `teachingLanguageId` through `languages` (from `../../home`). In `CourseEditorPage.tsx` render `<LevelsTab>` for `tab === "levels"`. Depends on T016, T018.

**Checkpoint**: US2 works alone (levels can be managed; counts and tab label update).

---

## Phase 4: User Story 3 - Add and edit words with images, audio, meaning and example (P1)

**Goal**: A words table per level with real image and audio import.

**Independent Test**: Quickstart scenarios 4 to 8.

- [x] T020 [US3] Extend `src/features/course-editor/model/levelOps.ts` with word operations: `addWord(levels, levelId)` (append `{ id: "word-<uuid>", text: "", meaning: "", example: "", images: [], audio: [], learned: false }`, returns `{ levels, wordId }`), `updateWord(levels, levelId, wordId, patch: Partial<Pick<Word, "text" | "meaning" | "example">>)`, `deleteWord(levels, levelId, wordId)`, `attachMedia(levels, levelId, wordId, kind: "images" | "audio", ref: MediaRef)` and `removeMedia(levels, levelId, wordId, kind, mediaId)`. Never mutate inputs.
- [x] T021 [P] [US3] Create `src/features/course-editor/model/mediaRules.ts` exporting `validateMediaFile(file: File, kind: "images" | "audio", currentCount: number): string | null`. Rules, verbatim from the spec: "images (PNG, JPEG, GIF, WebP) up to 2 MB each and audio (MP3, WAV, OGG, M4A/AAC) up to 3 MB each, at most 5 images and 5 audio files per word". Accept a file when its MIME type is on the list (images `image/png`, `image/jpeg`, `image/gif`, `image/webp`; audio `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a`, `audio/aac`) or, when `file.type` is empty, its extension is (`png jpg jpeg gif webp` / `mp3 wav ogg m4a aac`). Return exact messages: "Choose a PNG, JPEG, GIF or WebP image."; "Choose an MP3, WAV, OGG or M4A audio file."; "This file is too large (maximum 2 MB)."; "This file is too large (maximum 3 MB)."; "A word can have at most 5 images."; "A word can have at most 5 audio files.". Check type first, then size, then count.
- [x] T022 [P] [US3] Create `src/features/course-editor/hooks/useMediaUrl.ts` exporting `useMediaUrl(id: string | undefined): string | null` that loads the blob with `getMedia`, creates an object URL with `URL.createObjectURL`, and revokes it in the effect cleanup (also when the id changes or the component unmounts); returns null while loading or if the blob is missing. Depends on T002.
- [x] T023 [US3] Create `src/features/course-editor/components/MediaCell.tsx`. Props: `kind: "images" | "audio"`, `items: MediaRef[]`, `onAdd(ref: MediaRef): boolean`, `onRemove(mediaId: string): void`. Render a visually styled "Upload" button that triggers a hidden `<input type="file" multiple accept=...>` (images: `image/png,image/jpeg,image/gif,image/webp`; audio: `audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac`), for audio also a "Record" button whose click sets the message "Recording is coming soon." and adds nothing, and a count button (`aria-expanded`) reading "N image(s)" or "N file(s)" that toggles a popover list (close on Escape and outside click). For each picked file: run `validateMediaFile(file, kind, items.length + addedSoFar)`; on error show the message in an `aria-live="polite"` region and skip; otherwise check `storageWritable()`, create a `MediaRef` (`id` `media-<uuid>`, `name`, `type` = `file.type`, `size`), `await putMedia(ref.id, file)` inside try/catch (on failure show "Could not save the file on this device. Please try again." and skip) and call `onAdd(ref)`. Popover rows: images show an `<img>` thumbnail (via `useMediaUrl`, `alt` = file name) with the name and a "Remove" button; audio rows show `<audio controls>` (via `useMediaUrl`) with the name and a "Remove" button. Reset the input value after each pick so the same file can be chosen again. Depends on T002, T021, T022.
- [x] T024 [US3] Create `src/features/course-editor/components/WordRow.tsx`. Props: `word`, `showAttributes`, `autoFocus`, `onChange(patch)`, `onDelete()`, `onAddMedia(kind, ref): boolean`, `onRemoveMedia(kind, mediaId)`. A `<tr>` with cells: Word `<input aria-label="Word">` (focused on mount when `autoFocus`; after blur with an empty trimmed value show "A word is required." under it via `aria-describedby`/`aria-invalid`), Images `MediaCell kind="images"`, Audio `MediaCell kind="audio"`, Meaning `<textarea rows={1} aria-label="Meaning">`, Example `<textarea rows={1} aria-label="Example">`, an Attributes cell (only when `showAttributes`: the word id, "images N", "audio N") and a final cell with an `IconButton aria-label="Delete word"`. Long text wraps. Depends on T023.
- [x] T025 [US3] In `src/features/course-editor/components/LevelEditor.tsx` fill the body: a `<div className="overflow-x-auto">` containing a `<table>` (min width 48rem) with header cells Word, Images, Audio, Meaning, Example (+ Attributes when `showAttributes`, + an empty header for the delete column), one `WordRow` per word, and below the table an "Add word" button that appends a word with `addWord` and focuses its Word input (track `focusWordId` in state). Wire `onChange`, delete and media callbacks through `levelOps` and the `onChange(nextLevel)` prop; media `onAdd` returns `commit` success. Pass the `showAttributes` prop. Depends on T020, T024.
- [x] T026 [US3] Make counts and cleanup consistent: in `LevelsTab.tsx` ensure every commit goes through `useLevels().commit` (so `setCourseLevels` derives counts and cleans orphaned media), and verify that deleting a word or level, and duplicating a level, behave per research.md R5 (shared media ids are kept until the last reference is gone). Fix only if a deviation is found. Depends on T025.

**Checkpoint**: US1 to US3 work together (full content editing with real media).

---

## Phase 5: User Story 4 - Edit course details (P2)

**Goal**: The Details tab holds the pre-filled details form.

**Independent Test**: Quickstart scenario 9.

- [x] T027 [US4] Create `src/features/course-editor/components/DetailsTab.tsx` from the body of `src/features/edit-course/EditCoursePage.tsx`: props `course`; render a grid with `<CourseForm key={course.id} initialValues={draftFromCourse(course)} onSubmit={(values) => { useLearnerStore.getState().updateCourse(course.id, values); }} successPath={\`/course/${course.id}/edit/details\`} submitLabel="Save Changes" />` and `<HelpPanel />` (imports from `../../create-course` and `../../home`). In `CourseEditorPage.tsx` render it for `tab === "details"`. Depends on T012.
- [x] T028 [US4] Delete `src/features/edit-course/` (both files) and remove its import from `src/app/router.tsx`. Search `src` to confirm nothing else imports it. Depends on T013, T027.

---

## Phase 6: User Story 5 - Show attributes and the other tabs (P3)

**Goal**: "Show attributes" toggle and Databases / Contributors placeholders.

**Independent Test**: Quickstart scenario 10.

- [x] T029 [US5] In `src/features/course-editor/components/LevelsTab.tsx` add the "Show attributes" checkbox (`<label><input type="checkbox"> Show attributes</label>`, state in `useState`, default off) to the toolbar and pass its value to every `LevelEditor` as `showAttributes`.
- [x] T030 [P] [US5] Create `src/features/course-editor/components/TabPlaceholder.tsx`: props `name: "Databases" | "Contributors"`; renders a panel (`bg-surface-container rounded-m3-lg p-6`) with an h2 of the name and the text "<name> are coming soon.". In `CourseEditorPage.tsx` render it for `tab === "databases"` and `tab === "contributors"`. Depends on T012.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T031 Verify layout and accessibility per `quickstart.md` scenario 13: at 360 px the table scrolls inside its own container with no horizontal page scroll; Tab through the editor (Editing bar, toolbar, level header, tested line, table cells, upload and record buttons, count buttons) with visible focus; dialogs trap focus; dark scheme keeps text legible. Fix deviations.
- [x] T032 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors. Search `src` to confirm no leftover imports of `buildLevels`, `levelNames`, `edit-course`, and that `home`, `create-course` and `course-detail` never import `course-editor`.
- [ ] T033 Walk through every scenario in `specs/009-course-editor/quickstart.md` in the browser (`pnpm dev`) with real files and fix any deviation, including that Home and the course page counts match the editor and that imported media survive a reload.

---

## Dependencies & Execution Order

- Phase 1: T001 to T005 are independent (different files) and can run together; T006 needs T004 and T005; T007 needs T002, T003 and T005; T008 needs T004, T006 and T007; T009 needs T008; T010 needs T001.
- US1 needs Phase 1 (T011, T012 in order; T013 then T014). US2 needs US1. US3 needs US2 (it fills `LevelEditor`). US4 needs US1 (and T013). US5 needs US2 (T029) and US1 (T030).
- Priority order: US1, US2, US3 (P1), US4 (P2), US5 (P3).
- Files edited by several tasks (run in sequence): `learnerStore.ts` (T007), `levelOps.ts` (T015, T020), `LevelEditor.tsx` (T018, T025), `LevelsTab.tsx` (T012, T019, T026, T029), `CourseEditorPage.tsx` (T012, T019, T027, T030), `router.tsx` (T013, T028), `useCourseForm.ts` and `CourseForm.tsx` (T001, T010).

## Parallel Opportunities

- Phase 1: T001, T002, T003, then T004 and T005 together.
- US2: T017 (dialog) while T015 and T016 proceed.
- US3: T021 (rules) and T022 (media URL hook) together, while T020 proceeds.
- US5: T030 (placeholder) can be built while US3 is in progress.

## Implementation Strategy

- **MVP**: Phase 1 and US1 to US3 (T001 to T026): create or edit a course and manage levels and words with real images and audio.
- **Increment 2**: US4 (Details tab, removal of the old edit page).
- **Increment 3**: US5 (attributes toggle, placeholder tabs), then Polish.
- Stop after Phase 1 and after each story, run `pnpm typecheck`, and check the matching quickstart scenarios.
