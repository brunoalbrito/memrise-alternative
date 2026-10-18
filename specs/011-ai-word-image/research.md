# Research: AI Word Image

## R1. Which API and model
- **Finding** (Google's docs fetched on 2026-10-18): image creation uses the Interactions endpoint
  `POST /v1beta/interactions` with `x-goog-api-key`. Fast and cheap models listed: `gemini-nano-banana-2.1`
  and `gemini-3.1-flash-lite-image`; best quality `gemini-3-pro-image`. Request:
  `input: [{ type: "text", text }]`, `response_format: { type: "image", mime_type, aspect_ratio, image_size }`.
  Result: base64 image in `output_image.data`. Images carry a SynthID watermark.
- **Decision**: Default `imageModel` = `gemini-nano-banana-2.1`, editable in the Connect AI dialog
  ("Image model") with "Restore defaults". Request a 1:1 JPEG at size `1K`.
- **Caveat**: As with text and audio, this could not be run against a live key while planning; parsing is
  defensive (R3) and "Test connection" plus the editable model name cover mismatches.
- **Alternatives**: A larger model (slower, costs more); another provider (not requested).

## R2. Prompt
- **Decision**: "Create a simple, clear, friendly illustration that shows the meaning of the word <word>
  as used in this sentence: <sentence>. One clear subject on a plain light background. Do not include any
  text, letters, numbers, captions or watermarks." The word and sentence are passed as quoted data.
- **Rationale**: FR-003: illustrates meaning in context, language-independent because no text is drawn.

## R3. Reading the response
- **Decision**: `extractImage(json)` returns `output_image.data` if present, else the first
  `steps[].content[]` item with a string `data` and an `image/*` mime type (or no mime type), else the legacy
  `candidates[0].content.parts[].inlineData` with an `image/*` mime type. The result is base64.
- **Rationale**: Same tolerant approach as audio (feature 010 R9).

## R4. Reducing the picture
- **Decision**: `shrinkImage(blob)` loads it with `createImageBitmap`, scales it so the longest side is at most
  768 px, draws it on a canvas and exports JPEG at quality 0.85 (retrying at 0.7 if still above 1.5 MB). If
  decoding fails the original blob is used only when it is already under 2 MB, otherwise an `image` error.
  The File is named `<word>.jpg` with type `image/jpeg`.
- **Rationale**: FR-007: keeps the 2 MB rule satisfied without new libraries and keeps IndexedDB small.

## R5. When the picture is requested
- **Decision**: `useSuggestions` gets an image state (`idle | loading | ready | error`). The image request
  starts after the text is ready (for the best sentence) and inside `select(index)` when another sentence is
  chosen (event handler, so no effect-driven state). A new request aborts the previous one; a run counter
  discards stale results (SC-004). "New image" calls the same function for the current selection and is
  ignored while one is loading (spec US2 scenario 2). "Try again" for the text discards the picture and
  restarts the image after the new text arrives. Timeout 45 s.
- **Rationale**: FR-001, FR-002, FR-005, FR-009 and the edge cases.
- **Alternatives**: Generate only on a button press (the user asked for it to follow the selection); effect
  on `selected` (extra renders, lint rule against setState in effects).

## R6. Apply with a picture
- **Decision**: `AutoFillResult` gains `image: Blob | null`. `Apply` is disabled while the image state is
  `loading`. The editor attaches the picture with the same helper used for audio (validate with
  `validateMediaFile(file, "images", count)`, `storageWritable`, `putMedia`, `attachMedia`) and maps the
  limit message to "This word already has 5 images."
- **Rationale**: FR-006 to FR-008; reuses the editor's media code.

## R7. Errors
- **Decision**: New `AiError` kind `image`, message "Image could not be created.". Keys, limits, network and
  timeout keep their own kinds, shown in the Image section as that message (for example the usage limit text).
  The Image section shows the message and "New image"; it never blocks Apply.
- **Rationale**: FR-004, FR-008, US3.

## R8. Settings and privacy text
- **Decision**: `aiStore` gains `imageModel` (default above); `setModels(text, speech, image)` validates all
  three; "Restore defaults" resets them. The Connect dialog adds an "Image model" input and the privacy text
  becomes: "The word, the sentence you choose and the course language are sent to Google. Your key is stored
  on this device only and is never shown in full. Remove it on shared computers."
- **Rationale**: FR-010. Existing saved settings without `imageModel` get the default through the store's
  `merge`.

## Resolved unknowns

None remained in Technical Context. Open verification: one real Auto-fill with a key to confirm the image model
name and response shape (quickstart scenario 1).
