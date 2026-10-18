# Quickstart: Validating the Course Editor

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

## Run

```bash
pnpm dev
```

Have a small PNG or JPEG (under 2 MB), a small MP3 or WAV (under 3 MB), a large file (over 3 MB)
and a text file ready on your computer.

## Scenarios

1. **Create to editor (US1)**: On Home press "Create a course", fill Name and Teaching, press
   "Create Course": the editor opens on the Levels tab ("Levels (0)", empty message, Add Level).
2. **Edit Course (US1)**: Open a course page and press "Edit Course": the editor opens for it.
   "Back to Course" returns to the course page.
3. **Levels (US2)**: Add Level twice: tab reads "Levels (2)", names "Level 1", "Level 2". Rename
   level 1, edit its tested line, Duplicate it (a copy appears after it, numbers update),
   Show/Hide collapses and expands, Preview opens its placeholder, Delete asks first and
   renumbers. Delete the last level: "Levels (0)".
4. **Words (US3)**: In a level press "Add word": the new row's Word field has focus. Type a word,
   meaning and example, reload: they are still there. Leave Word empty and tab away:
   "A word is required." and the word total does not count it.
5. **Images (US3)**: Press Upload in the Images cell, pick the PNG: the count becomes "1 image",
   the dropdown shows a thumbnail with a Remove button. Reload: still there. Try the text file:
   "Choose a PNG, JPEG, GIF or WebP image." Try a 6th image: the at-most-5 message.
6. **Audio (US3)**: Press Upload in the Audio cell, pick the MP3: count "1 file", the dropdown
   shows a player that plays it. Try the large file: "This file is too large (maximum 3 MB)."
   Press Record: "Recording is coming soon." and nothing is added.
7. **Counts (US3)**: Add three words with text in a new course. The course page and Home show
   "0 / 3". Delete one word: "0 / 2" everywhere.
8. **Media cleanup**: Delete a word that has an image, then the whole level: no error; the app
   keeps working. (Optional: check in the browser devtools Application > IndexedDB that the file
   is gone.)
9. **Details (US4)**: Open the Details tab: the form is pre-filled. Change the name, Save Changes:
   the editor header shows the new name and you stay on Details.
10. **Other controls (US5)**: Check "Show attributes": each row shows its id and the counts;
    uncheck hides them. Databases and Contributors show "coming soon" panels inside the editor
    with the Editing bar still visible.
11. **Sample courses**: Open "English Visual Dictionary" in the editor: 3 levels with sample words
    (sink, wash, ...). Home and the course page show "9 / 16". Edit a word, reload: kept.
12. **Not found**: `/course/does-not-exist/edit` shows "Course not found".
13. **Responsive and a11y**: At 360 px the table scrolls inside its box with no page scroll. Tab
    through all controls with visible focus. Dark mode keeps text legible.

Contract: [ui-contract.md](./contracts/ui-contract.md). Data: [data-model.md](./data-model.md).
