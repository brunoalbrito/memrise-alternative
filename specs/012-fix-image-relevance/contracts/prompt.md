> **Prompt superseded by `specs/014-fix-image-trigger-and-text`**: the sentence is no longer sent as quoted text; a
> short visual scene description is sent instead. Kept for history.

# Contract: Image prompt (supersedes the prompt in specs/011-ai-word-image/contracts/gemini-image.md)

```
Draw a simple, friendly, colourful illustration of the scene described by this sentence: <JSON-quoted sentence>.
Show what the sentence says: the people, objects, action and setting it mentions, so that the meaning of the word <JSON-quoted word> is clearly visible in the scene.
If the sentence is abstract, show a simple everyday scene that conveys it.
Square composition, flat illustration style. Do not include any text, letters, numbers, captions, speech bubbles or watermarks.
```

The prompt is unchanged, but since `specs/013-pollinations-images` the request goes to Pollinations (see that
feature's `contracts/pollinations-api.md`) instead of Google.

## UI

Under a ready picture the Image section shows `Made for: “<sentence>”` (the sentence the picture was requested
for). Apply attaches the picture only when it was made for the currently selected sentence.
