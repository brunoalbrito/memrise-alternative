# UI Contract: Course Editor

## Routes

| Path | Screen | Notes |
|------|--------|-------|
| `/course/:id/edit` | Editor, Levels tab | Opened by "Edit Course" and after "Create Course" |
| `/course/:id/edit/details` | Editor, Details tab | The details form |
| `/course/:id/edit/databases` | Editor, Databases tab | "coming soon" panel inside the editor |
| `/course/:id/edit/contributors` | Editor, Contributors tab | "coming soon" panel inside the editor |
| `/course/:id/levels/:level` | Placeholder "Level N: name" | "Preview" (existing route) |

Unknown or removed course id: "Course not found" with a link to Home.

## Flow changes

- Create form: "Create Course" creates the course and navigates to `/course/<newId>/edit`.
- Course page: "Edit Course" link goes to `/course/:id/edit` (unchanged link, new destination).
- Details tab: "Save Changes" saves and stays on `/course/:id/edit/details`.

## Editor header

Top app bar (Courses highlighted). A header band with the course title (h1) and "Created by <name>".
Below it the "Editing" bar: the label "Editing", then links "Levels (N)", "Databases",
"Contributors", "Details" (the current one has `aria-current="page"` and a selected style), and at
the right "Back to Course" (to `/course/:id`). N is the live level count.

## Levels tab

Toolbar: "Add Level" button and a "Show attributes" checkbox. Below, one block per level, in order.
No levels: the message "This course has no levels yet. Use Add Level to create one."

### Level block

- Header bar (token-coloured): number, an input for the level name (`aria-label="Level name"`),
  the language label `(<Teaching language>)`, and the buttons "Show/Hide" (`aria-expanded`),
  "Preview" (link to `/course/:id/levels/:n`), "Duplicate", "Delete".
- "Delete" opens a confirmation dialog "Delete level N and its words?" with "Cancel" and "Delete".
  New levels and renumbering update immediately.
- Under the header: an input with the tested line (`aria-label="How this level is tested"`) and a
  pencil icon.
- Table (hidden when collapsed): columns Word, Images, Audio, Meaning, Example (+ Attributes when
  "Show attributes" is checked; + a Delete word button column). Below the table: "Add word".

### Word row

| Cell | Content |
|------|---------|
| Word | text input (`aria-label="Word"`). Empty after blur: message "A word is required." and the row is not counted as a word |
| Images | "Upload" button (opens a file picker, images only), a dropdown button "N image(s)" listing each image with a thumbnail, its name and a Remove button |
| Audio | "Upload" button (audio only), a "Record" button, a dropdown button "N file(s)" listing each file with a player, its name and a Remove button |
| Meaning | multi-line text input (`aria-label="Meaning"`) |
| Example | multi-line text input (`aria-label="Example"`) |
| Attributes | word id, "images N", "audio N" (only when "Show attributes" is checked) |
| Delete | icon button `aria-label="Delete word"` |

Media messages (in an `aria-live` region under the cell), exact text:
- "Choose a PNG, JPEG, GIF or WebP image."
- "Choose an MP3, WAV, OGG or M4A audio file."
- "This file is too large (maximum 2 MB)." (images) / "(maximum 3 MB)." (audio)
- "A word can have at most 5 images." / "A word can have at most 5 audio files."
- "Could not save the file on this device. Please try again."
- "Recording is coming soon." (Record button; nothing is added)

Accepted files: images PNG, JPEG, GIF, WebP up to 2 MB; audio MP3, WAV, OGG, M4A/AAC up to 3 MB.

## Details tab

The create form pre-filled (same fields, hints, validation and messages), main button "Save
Changes", help panel beside it.

## Databases and Contributors tabs

A panel titled with the tab name and the text "<Name> are coming soon." (Databases / Contributors).

## Counts and consistency

Word totals on Home and on the course page equal the words with text in the editor. Learned and
due counts come from the words' learned flags (sample words only). All edits save immediately and
survive reload.

## Accessibility

Real `<table>` with header cells, labelled inputs, buttons with visible focus, dialogs on native
`<dialog>`, media messages in `aria-live="polite"` regions, tab links with `aria-current`. Tab order
follows the visual order. Contrast meets WCAG 2.1 AA in light and dark schemes. On phones the table
scrolls inside its own container with no horizontal page scroll.
