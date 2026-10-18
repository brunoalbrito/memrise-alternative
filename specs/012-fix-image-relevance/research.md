# Research: Fix Image Relevance to the Chosen Sentence

## R1. Root cause
- **Finding**: `buildImagePrompt` in `src/features/ai-assistant/api/gemini.ts` asked to "show the meaning of the
  word X as used in this sentence" and to keep "one clear subject on a plain light background". The word comes
  first and a single isolated subject is requested, so image models draw the word on its own and ignore the
  rest of the sentence (people, action, place). The state handling is not the cause: `select()` starts a new
  request and sets the image to loading at once, and stale results are discarded by a run counter.

## R2. New prompt
- **Decision**: Build the prompt around the sentence: "Draw a simple, friendly, colourful illustration of the
  scene described by this sentence: <sentence>. Show what the sentence says: the people, objects, action and
  setting it mentions, so that the meaning of the word <word> is clearly visible in the scene. If the sentence
  is abstract, show a simple everyday scene that conveys it. Square composition, flat illustration style. Do
  not include any text, letters, numbers, captions, speech bubbles or watermarks."
- **Rationale**: FR-001 and FR-002: the sentence is the primary instruction and the word is the focus inside
  the scene. "Plain light background" and "one clear subject" are removed because they push the model away
  from the scene.
- **Alternatives**: Asking the text model for an image description first (an extra request and cost; the
  image model already understands sentences).

## R3. Showing the link
- **Decision**: In the Image section, under a ready picture, show a caption `Made for: “<sentence>”` built from
  `suggestion.sentences[image.index]`. It is only shown with a ready picture.
- **Rationale**: FR-003 and SC-003: the learner sees what the picture was made for.

## R4. Guarding Apply
- **Decision**: Apply attaches the picture only when `image.status === "ready"` and `image.index ===
  selected`; otherwise it attaches none. Together with the immediate switch to "loading" on selection this
  guarantees FR-004 even if a future change introduced a gap.
- **Rationale**: SC-002: a picture for another sentence can never be attached.

## Resolved unknowns

None.
