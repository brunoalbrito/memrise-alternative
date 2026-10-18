# Quickstart: Validating the Pollinations Image Provider

## Prerequisites

- Node >= 22.22 and pnpm. `pnpm install`.
- The Google AI Studio key from feature 010 (text and audio work on a free account) and your Pollinations key.
  Never commit either key.

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

## Run

```bash
pnpm dev
```

## Scenarios

1. **Picture from Pollinations (US1)**: Connect AI > "Pollinations API key (for images)" > paste your key > Save
   ("Pollinations connected.", key shown masked). Auto-fill "humid": after the text, the Image section shows
   "Creating image…" and then a picture of the selected sentence with `Made for: “…”`. In the browser's Network tab
   the picture request goes to `gen.pollinations.ai` with the key only in the `Authorization` header (not in the
   address), and no image request goes to `generativelanguage.googleapis.com`. If the request is blocked as a
   cross-origin error, the section says "Could not reach the AI service…": report it.
2. **Follows the selection (US1)**: Select another sentence or press "New image": a new picture for the selected
   sentence; Apply attaches `humid.jpg` to Images; reload keeps it.
3. **No key (US3)**: Remove the Pollinations key and Auto-fill: the Image section says "Add your Pollinations key in
   AI settings to create images." with "Open AI settings" and no request goes out. Text, IPA and audio still apply.
4. **Wrong key (US3)**: Save a wrong key (for example `abc`) and Auto-fill: "Pollinations did not accept your key.
   Check it in AI settings." with "Open AI settings".
5. **Network (US3)**: Turn the network off and press "New image": the network message with "New image".
6. **Budget (US3)**: If your balance or key budget is used up, the section says "Your Pollinations balance or budget
   is used up." with "New image".
7. **Settings (US2)**: The key survives a reload and is shown masked. "Remove key" deletes it. The "Image model" field
   empty uses Pollinations' default; fill a model name from Pollinations' list to use another one. "Restore defaults"
   empties it. Old saved settings with a Google image model name are ignored (check by leaving the field empty after
   an upgrade).
8. **Privacy text and keys**: The dialog says the word and sentence are sent to Pollinations. Neither key is ever shown in
   full, in an address or in the console.
9. **Responsive and a11y**: At 360 px the dialog fits and scrolls; loading and errors are announced.

Contract: [pollinations-api.md](./contracts/pollinations-api.md).
