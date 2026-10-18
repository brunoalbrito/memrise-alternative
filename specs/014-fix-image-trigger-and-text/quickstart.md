# Quickstart: Validating the Image Trigger and Text Fix

## Prerequisites

Google and Pollinations keys saved (features 010 and 013). `pnpm install`.

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

## Run

```bash
pnpm dev
```

## Scenarios

1. **No picture before choosing (US1)**: Auto-fill "running". When the suggestions appear, the Image section says
   "Select a sentence to create its image." with "Create image". In the browser Network tab there is no request to
   `gen.pollinations.ai` yet.
2. **Click the Best sentence (US1)**: Click the already selected Best sentence: "Creating image…" starts. Click it
   again: nothing new starts.
3. **Choose another (US1)**: Click another sentence: the old picture disappears at once and a new one is created for it
   (caption `Made for: “…”` shows that sentence).
4. **Keyboard (US1)**: Move between sentences with the arrow keys: a picture is requested for the newly selected one.
   "Create image" with the keyboard also works.
5. **Apply without picture (US1)**: Open suggestions, do not choose or create an image, press Apply: text and audio
   are applied, no image attached.
6. **Try again (US1)**: Press "Try again": the picture is cleared and no picture is requested until a sentence is
   chosen.
7. **No writing (US2)**: Choose the sentences of five different words: no picture contains the sentence or any other
   readable writing. Try a sentence about reading a sign: no legible writing. If one slips through, "New image" makes
   another.
8. **Network check (US2)**: In the Network tab the Pollinations request address contains a scene description, not the
   exact example sentence in quotes; a small request to the Google text model precedes it.
9. **Fallback**: Remove the Google key and choose a sentence: the picture is still requested from Pollinations (with the
   unquoted fallback prompt).

Contract: [scene-prompt.md](./contracts/scene-prompt.md).
