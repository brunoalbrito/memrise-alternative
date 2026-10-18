# Research: Fix Image Trigger and Text in Pictures

## R1. Root cause of the early picture
- **Finding**: `execute()` in `useSuggestions.ts` ends with `startImage(text.sentences[text.best], text.best)`, so a
  picture is requested for the pre-selected Best sentence the moment the text arrives. Radios use `onChange`,
  which never fires for the option that is already selected, so the learner cannot "choose" the Best sentence
  to request its picture.

## R2. Trigger
- **Decision**: Remove the automatic call. Add `choose(index)`: sets `selected` and starts a picture for that sentence
  unless a picture for it is already ready or being created (tracked synchronously in `imageIndexRef` so the
  `onClick` and `onChange` events of one click do not start two requests; the ref is cleared on error, retry
  and cancel). The radios call `choose` from both `onClick` (fires for an already selected option) and
  `onChange` (keyboard arrows). A new idle state shows "Select a sentence to create its image." and a "Create
  image" button that calls the existing `newImage()` logic for the selected sentence.
- **Rationale**: FR-001 to FR-004.
- **Alternatives**: Clearing the preselection (breaks the Best-preselected rule of feature 010); a confirm button
  only (extra step for the common case).

## R3. Root cause of the text in the picture
- **Finding**: The prompt of feature 012 included the full sentence as quoted text
  (`... described by this sentence: "Running is a brilliant way to keep fit..."`). Image models treat quoted text
  as something to draw, which matches the screenshot, where the whole sentence appears above the runners. The
  "no text" sentence at the end is overridden by the quoted words.

## R4. Scene description step
- **Decision**: Add `describeScene(word, sentence, settings, signal)` in `gemini.ts`: a plain text request (no
  schema) asking for one or two sentences (at most 40 words, in English) describing only what can be seen: who is
  there, what they do, where, with the word's meaning visible; it must not quote the sentence or mention any
  writing, signs, labels, captions or speech. The picture prompt becomes: `<description> Simple friendly flat
  illustration, bright colours, square composition. The image contains no text of any kind: no words, letters,
  numbers, captions, signs, labels, logos or speech bubbles.` The sentence itself is never in the image request.
- **Rationale**: FR-005, FR-006. A description of the visible scene gives the image model nothing to write out.
- **Cost**: one extra small text request on the Google free tier per picture.

## R5. Fallback
- **Decision**: If `describeScene` fails or returns nothing usable, build the picture prompt from the word and the
  sentence rewritten as an unquoted instruction ("Illustrate a scene in which <sentence without quotes>") plus the
  same no-text instructions, so a picture can still be made.
- **Rationale**: FR-007. A Google problem should not stop the picture when Pollinations works.

## R6. Where the steps run
- **Decision**: `startImage` runs: Pollinations key check (no key means the existing error, no requests), then
  `describeScene` (Google), then `generateWordImage(description, ...)` (Pollinations), all under the same
  abort controller and the existing 45 s timeout. `generateWordImage` now takes the already built prompt text
  instead of the word and sentence.

## Resolved unknowns

None.
