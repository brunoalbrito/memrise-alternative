# Quickstart: Validating the AI Word Image

## Prerequisites

- Node >= 22.22 and pnpm. `pnpm install`.
- The AI Word Assistant already set up with a real Google AI Studio key (feature 010). Never commit the key.

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

## Run

```bash
pnpm dev
```

## Scenarios

1. **Picture appears (US1)**: In a level add the word "humid" and press "Auto-fill word". When the text shows,
   the "Image" section reads "Creating image…" and then shows a simple illustration with no written text.
   If it fails with a model problem, open Connect AI > Models, correct "Image model" from Google's current
   docs, and try again.
2. **Follows the selection (US1)**: Select a different sentence: the picture switches to "Creating image…" and
   then to a new picture for that sentence. Select three sentences quickly: only the last one's picture ends up
   shown.
3. **Apply (US1)**: While loading, Apply is disabled. When the picture is shown press Apply: Images shows
   "N images" including `humid.jpg`; open its dropdown to see the thumbnail; Meaning, Example, IPA and Audio
   are filled too. Reload: still there.
4. **New image (US2)**: Press "New image" twice: the picture changes, text and audio stay. Pressing it while
   "Creating image…" does nothing. Apply attaches only the picture shown.
5. **Failure (US3)**: Turn the network off and press "New image": the section shows the network message, Apply is
   enabled and applies the text and audio only.
6. **Five images (US3)**: Give a word 5 images, then Apply: text and audio apply, the editor says "This word
   already has 5 images."
7. **Cancel (US1)**: Press Cancel or Escape while the picture loads: nothing is attached and no more requests
   are sent (browser Network tab).
8. **Try again (text)**: Press "Try again": the picture is replaced after the new text arrives.
9. **Settings and privacy**: Connect AI shows the new privacy text and an "Image model" field; "Restore defaults"
   resets it. The key never appears in a URL or the console.
10. **Responsive and a11y**: At 360 px the picture fits (max 16rem). The picture has alt text and loading and
    errors are announced.

Contracts: [ui-contract.md](./contracts/ui-contract.md), [gemini-image.md](./contracts/gemini-image.md).
