# Quickstart: Validating the AI Word Assistant

## Prerequisites

- Node >= 22.22 and pnpm. Run `pnpm install`.
- A Google AI Studio API key from https://aistudio.google.com/apikey (free tier is enough). Never
  commit it or paste it into the repo.

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

1. **No key (US2)**: Open a course editor (Levels tab), add a word "humid" and press its
   "Auto-fill" button: the "Connect AI" dialog opens with the intro, privacy text and "Get a key"
   link.
2. **Connect and test (US2)**: Paste an invalid key (for example `abc`) and Save, then "Test
   connection": "Google did not accept your API key. Check it in AI settings." Replace it with your
   real key, Save ("AI connected."), then "Test connection": "Connection works." If the test reports a
   service problem, open "Models" and correct the model ids from Google's current docs.
3. **Suggestions (US1)**: After saving the key from the Auto-fill flow the panel starts by itself:
   "Preparing suggestions…", then a definition, 3 sentences (one marked "Best", selected), the IPA in
   slashes and an audio player that plays the word.
4. **Apply (US1)**: Press Apply: Meaning, Example and IPA are filled, the Audio cell shows "1 file"
   with `humid.wav` that plays from its dropdown. Reload: all still there. The word total is
   unchanged.
5. **Choose another sentence (US4)**: Auto-fill again, select a different sentence, Apply: the
   Example cell holds that sentence. "Try again" shows a new set.
6. **Cancel (US1)**: Open suggestions and press Cancel or Escape: the row is unchanged.
7. **Disabled button (US1)**: With an empty Word the "Auto-fill word" button is disabled; with a
   61-character word it is disabled too.
8. **Errors (US3)**: Remove the key via "AI settings" then Auto-fill (dialog opens). Turn the network
   off and Auto-fill: "Could not reach the AI service. Check your connection and try again."; turn it
   on and "Try again" works. With a wrong key: invalid-key message and "Open AI settings".
9. **Audio limit**: Give a word 5 audio files, then Apply suggestions: text fills, audio is skipped
   with "This word already has 5 audio files."
10. **IPA by hand (US5)**: Type `ˈtɛst` in an IPA cell: after leaving the cell it shows `/ˈtɛst/`;
    typing slashes does not double them; reload keeps it.
11. **Key privacy**: After saving, the key is never shown in full (only the mask), is not in the URL of
    the requests (browser dev tools, Network tab) and not in the console.
12. **Responsive and a11y**: At 360 px the dialogs fit and scroll. Tab through the panel: radios, Apply,
    Try again, Cancel; loading and errors are announced.

Contracts: [ui-contract.md](./contracts/ui-contract.md), [gemini-api.md](./contracts/gemini-api.md).
Data: [data-model.md](./data-model.md).
