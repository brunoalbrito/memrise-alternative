# Research: Course Editor

## R1. Where levels and words live
- **Decision**: Add `courseLevels: Record<courseId, CourseLevel[]>` to the persisted learner
  store. A course's levels are `courseLevels[id] ?? sampleLevels[id] ?? []`. Any edit writes the
  full level list for that course through `setCourseLevels(id, levels)`.
- **Rationale**: FR-011 and FR-012: one source of truth for words, saved immediately. Samples
  keep their built-in levels until edited, then the learner's list takes over (spec assumption:
  built-in sample data is never altered).
- **Alternatives**: Levels inside each `Course` (changes the model used everywhere and the
  persisted created courses); separate store (two persistence keys).

## R2. Word counts derive from words
- **Decision**: `countsFromLevels(levels, due)` returns `totalItems` = words with non-empty text,
  `itemsLearned` = those flagged `learned`, `itemsDue` = `min(due, learned)`. `useAllCourses`
  applies it to every course; sample course records get their counts from `sampleLevels` through
  the same function.
- **Rationale**: FR-011 and SC-003: Home, the course page and the editor can never disagree.
  Existing code that reads `totalItems`, `itemsLearned`, `itemsDue` keeps working unchanged.
- **Alternatives**: Store counts separately (can drift from the words).

## R3. Sample words
- **Decision**: `sampleLevels.ts` holds a compact seed per sample course (levels with a name,
  tested line and words with meaning and optional example) plus how many words are learned,
  applied to the first words in order. Sizes: 8 to 16 words, 2 to 3 levels (the empty sample has
  none). `sampleCourseExtras` loses `levelNames` and its long-term and ignored counts are lowered
  to respect `longTermCount <= learned` and `learned + ignored <= total`.
- **Rationale**: Clarification: generated sample words.

## R4. Storing imported files
- **Decision**: Blobs go to IndexedDB (`membetter-media` / `files`) through a four-function
  wrapper in `shared/media/mediaStore.ts` (`putMedia`, `getMedia`, `deleteMedia`, `listMediaIds`
  not needed). The store keeps only `MediaRef` metadata (`id`, `name`, `type`, `size`).
- **Rationale**: FR-010 needs 2 to 3 MB files, five per word, across many words. `localStorage`
  has about 5 MB total and is synchronous; IndexedDB handles large blobs and is built in.
- **Alternatives**: Base64 data URLs in `localStorage` (hits the quota after a couple of files);
  storing in memory only (lost on reload, violates FR-010).

## R5. Cleaning up media
- **Decision**: `setCourseLevels` compares the media ids referenced before and after, and deletes
  from IndexedDB any id no longer referenced by any course's levels. Deleting a created course
  clears its levels and runs the same cleanup. Duplicating a level reuses the same media ids
  (no blob copy); because cleanup checks every course's references, shared blobs are kept until
  the last reference is gone.
- **Rationale**: Spec edge case and FR-010 cleanup rule, with no reference counting field.
- **Alternatives**: Copy blobs on duplicate (async, more storage); reference counters (extra
  state to keep consistent).

## R6. Media validation
- **Decision**: Pure `validateMediaFile(file, kind, currentCount)` returns an error or null.
  Images: PNG, JPEG, GIF, WebP, at most 2 MB. Audio: MP3, WAV, OGG, M4A/AAC, at most 3 MB. At most
  5 images and 5 audio files per word. A file is accepted when its MIME type is on the list or,
  when the browser reports none, its extension is. The file input also sets `accept`.
- **Messages**: wrong type "Choose a PNG, JPEG, GIF or WebP image." / "Choose an MP3, WAV, OGG or
  M4A audio file."; too large "This file is too large (maximum 2 MB)." / "(maximum 3 MB)";
  limit "A word can have at most 5 images." / "5 audio files."; storage "Could not save the
  file on this device. Please try again."
- **Rationale**: FR-010 verbatim.

## R7. Previewing media
- **Decision**: `useMediaUrl(id)` loads the blob, creates an object URL and revokes it on unmount
  or id change. Images show as thumbnails, audio uses the native `<audio controls>`.
- **Rationale**: Native playback is accessible and needs no library.

## R8. Editor routing and shell
- **Decision**: Routes `/course/:id/edit` (Levels), `/course/:id/edit/details`,
  `/course/:id/edit/databases` and `/course/:id/edit/contributors`, all rendering
  `CourseEditorPage` with a `tab` prop. The "Editing" bar items are router links with
  `aria-current`. Databases and Contributors show a "coming soon" panel inside the shell, which
  keeps the way back to the editor. "Back to Course" links to `/course/:id`.
- **Rationale**: FR-001 to FR-003, FR-014 to FR-016; deep-linkable tabs.

## R9. Create flow
- **Decision**: `CourseForm`/`useCourseForm` accept `onSubmit` that may return a path. The create
  page returns `/course/<id>/edit` for the new course id. The Details tab keeps `successPath` at
  `/course/:id/edit/details` so the learner stays in the editor.
- **Rationale**: FR-001, FR-013.

## R10. Details tab and `edit-course` removal
- **Decision**: Move the body of `EditCoursePage` into `course-editor/components/DetailsTab.tsx`
  (same `CourseForm`, `HelpPanel`, Save Changes) and delete `features/edit-course`.
- **Rationale**: FR-013; avoids leaving a dead module.

## R11. Table layout on phones
- **Decision**: A semantic `<table>` inside a horizontally scrollable container
  (`overflow-x-auto`) with a minimum width, so the page itself never scrolls sideways.
- **Rationale**: FR-017, SC-006, and keeps real table semantics for screen readers.

## R12. Storage probe
- **Decision**: Move `storageWritable()` to `shared/storage/storageWritable.ts` and use it in the
  form hook and before editor writes that add content (add level, import file).
- **Rationale**: Two features need it; the spec's storage-unavailable messages.

## R13. Show/Hide and "Show attributes"
- **Decision**: Collapsed state per level and the "Show attributes" toggle are UI state kept in
  the editor components (not persisted). Attributes shown per word: word id, image count, audio
  count.
- **Rationale**: Spec treats them as view controls.

## Resolved unknowns

None remained in Technical Context.
