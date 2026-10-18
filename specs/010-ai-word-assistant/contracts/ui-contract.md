# UI Contract: AI Word Assistant

## Words table changes

New column "IPA" between "Audio" and "Meaning" (header and cell). The cell is a text input
(`aria-label="IPA"`): when not focused it shows `/<ipa>/` (or nothing if empty), when focused the raw
text. Slashes typed by the user are stripped on save. In each row, next to "Delete word", an
"Auto-fill" button (sparkle icon, `aria-label="Auto-fill word"`), disabled while the Word is empty or
longer than 60 characters after trimming.

## Editor toolbar

A button "Connect AI" (when no key is saved) or "AI settings" (when one is) next to "Add Level" and
"Show attributes". It opens the connect dialog.

## Connect dialog ("Connect AI")

| Element | Behavior |
|---------|----------|
| Intro | "Auto-fill uses Google AI Studio to prepare a definition, example sentences, IPA and audio for a word." |
| Privacy | "The word and the course language are sent to Google. Your key is stored on this device only and is never shown in full. Remove it on shared computers." |
| Link | "Get a key" opening `https://aistudio.google.com/apikey` in a new tab (`rel="noopener noreferrer"`) |
| Key input | `type="password"`, `autocomplete="off"`, label "Google AI Studio API key". When a key is saved shows the mask `•••• 1234` as a hint and the field stays empty |
| Save | Validates non-empty without spaces; error "Enter your API key without spaces." Saves, shows "AI connected." |
| Test connection | Shows "Testing…", then "Connection works." or the mapped error message |
| Remove key | Asks via the same dialog area "Remove the key from this device?" with "Remove" / "Keep"; then shows "Key removed." |
| Models (collapsed `<details>`) | Inputs "Text model" and "Speech model" with "Save models" and "Restore defaults" |
| Close | "Close" button and Escape |

## Suggestions dialog ("AI suggestions")

Title `Suggestions for "<word>"`. States:
- Loading: "Preparing suggestions…" in an `aria-live="polite"` region, with "Cancel".
- Ready: sections
  - Definition: the text.
  - Example sentence: 3 radio options (one marked with the badge "Best", selected first).
  - IPA: `/<ipa>/`.
  - Audio: an audio player, or the note "Audio could not be created."
  - Buttons: "Apply", "Try again", "Cancel".
- Error: message in an `aria-live="assertive"` region and buttons "Try again" (or "Open AI settings"
  for an invalid key) and "Close".

Escape and Cancel close it without any change and cancel running requests.

## Messages (exact text)

| Kind | Message |
|------|---------|
| invalid-key | "Google did not accept your API key. Check it in AI settings." |
| limit | "The usage limit was reached. Try again later." |
| network | "Could not reach the AI service. Check your connection and try again." |
| timeout | "The AI service took too long. Try again." |
| refused | "The AI service could not prepare suggestions for this word." |
| unusable | "Suggestions could not be prepared. Try again." |
| service | "The AI service had a problem. Try again later." |
| audio (note) | "Audio could not be created." |
| too long | "Use a shorter word or phrase (up to 60 characters)." |
| no key | opens the connect dialog |

After Apply, notices in the editor's live region: "This word already has 5 audio files." (audio skipped),
"This file is too large (maximum 3 MB)." or "Could not save the file on this device. Please try
again." (audio skipped); text values are still applied.

## Apply behavior

Meaning, Example and IPA are replaced by the suggestion (selected sentence for Example). The audio is
added to the word's Audio list if there are fewer than 5 files. Existing audio is kept. Everything
saves immediately and survives reload. Word counts are unchanged.

## Accessibility

Native `<dialog>` with focus trap, labelled radios, visible focus, loading and errors announced through
live regions, the key input is a password field with a visible label. Controls reachable by keyboard.
Layout works from 360 px (dialogs use `w-[min(92vw,32rem)]` with scroll).
