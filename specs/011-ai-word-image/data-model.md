# Data Model: AI Word Image

Extends `specs/010-ai-word-assistant/data-model.md`.

## AI settings (extended, `localStorage` key `membetter.ai`)

| Field | Type | Rules |
|-------|------|-------|
| imageModel | string | Default `gemini-nano-banana-2.1`. Non-empty, no whitespace. Restored by "Restore defaults". Missing in older saved settings, then the default applies |

`setModels(textModel, speechModel, imageModel)` validates all three before saving.

## Image state (temporary, in memory while the panel is open)

| State | Fields | Meaning |
|-------|--------|---------|
| idle | none | Before the text suggestions are ready |
| loading | `sentenceIndex` | A request for that sentence is running |
| ready | `sentenceIndex`, `blob` (reduced JPEG) | Picture for the sentence shown |
| error | `kind` | `image`, `invalid-key`, `limit`, `network` or `timeout` |

Rules: only the result of the latest request is kept; changing the selected sentence, "New image" or "Try
again" starts a request and cancels the previous one; closing the panel cancels it.

## AutoFillResult (extended)

| Field | Type | Rules |
|-------|------|-------|
| image | Blob \| null | The reduced JPEG shown when Apply is pressed, or null when none is available |

## Word (no change)

Applying a picture appends one `MediaRef` to `images` (name `<word>.jpg`, type `image/jpeg`), counted in the
existing limits: at most 5 images per word, each at most 2 MB.

## AiErrorKind (extended)

New kind `image` with the message "Image could not be created.".
