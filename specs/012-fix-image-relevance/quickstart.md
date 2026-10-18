# Quickstart: Validating the Image Relevance Fix

## Prerequisites

The AI Word Assistant set up with a real Google AI Studio key (feature 010). `pnpm install`.

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

## Run

```bash
pnpm dev
```

## Scenarios

1. **Scene of the sentence**: Auto-fill "humid". For the Best sentence, the picture shows what the sentence
   says (people, objects, action, place), not just a generic picture of the word. Under it:
   `Made for: “<that sentence>”`.
2. **Follows the selection**: Select the second sentence: the old picture and caption disappear at once and
   "Creating image…" shows; then a new picture appears for that sentence with its caption. Repeat for the
   third. The three pictures differ and each matches its sentence.
3. **New image**: Press "New image": a different rendering of the same selected scene, caption unchanged.
4. **Apply guard**: While a picture is loading after changing the sentence, Apply is disabled. After it
   appears, Apply attaches that picture (check the Images dropdown thumbnail matches the caption sentence).
5. **Abstract sentence**: Try a word with an abstract sentence (for example "rhythm"): the picture is a simple
   concrete scene, with no written text.
6. **Failure**: With the network off, "New image" shows its error and no caption.
