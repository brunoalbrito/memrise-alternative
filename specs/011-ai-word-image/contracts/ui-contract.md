# UI Contract: AI Word Image

Extends `specs/010-ai-word-assistant/contracts/ui-contract.md`.

## Suggestions dialog: new "Image" section

Placed after "Audio". Heading "Image".
- Loading: "Creating image…" in an `aria-live="polite"` region.
- Ready: the picture (`<img>`, square, `max-width` 16rem, rounded, `alt` = `Illustration for "<word>"`) and a
  "New image" button.
- Error: the message in an `aria-live="assertive"` region and "New image":
  - `image`: "Image could not be created."
  - `invalid-key`, `limit`, `network`, `timeout`: the same texts as in the 010 contract.

## Behavior

- The picture request starts when the suggestions are ready (for the selected, Best sentence by default).
- Selecting another sentence cancels the running request and creates a new picture for that sentence.
- "New image" creates another picture for the selected sentence; ignored while one is loading.
- "Apply" is disabled while the picture is loading (its label stays "Apply"; a visually hidden hint says
  "Waiting for the image"). When enabled it attaches the picture shown (if any).
- "Try again" (text) discards the picture; a new one is created after the new text arrives.
- Cancel, Escape and closing cancel the picture request and attach nothing.

## Editor messages after Apply (live region)

| Case | Message |
|------|---------|
| Word already has 5 images | "This word already has 5 images." |
| Picture over 2 MB after reduction | "This file is too large (maximum 2 MB)." |
| Storage unavailable or full | "Could not save the file on this device. Please try again." |

Text values and audio are applied regardless.

## Connect dialog changes

- Privacy text: "The word, the sentence you choose and the course language are sent to Google. Your key is stored
  on this device only and is never shown in full. Remove it on shared computers."
- "Models" section gains an "Image model" input (default `gemini-nano-banana-2.1`); "Save models" validates
  all three, "Restore defaults" resets all three.

## Accessibility

Picture has a text alternative, loading and errors are announced, "New image" is a labelled button reachable
by keyboard, the dialog still fits and scrolls at 360 px.
