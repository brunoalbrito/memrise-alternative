# Data Model: AI Word Assistant

Extends `specs/009-course-editor/data-model.md`.

## Word (extended)

| Field | Type | Rules |
|-------|------|-------|
| ipa | string \| undefined | Plain text, stored without surrounding slashes (leading and trailing `/` stripped on save). Missing means empty. Existing words need no migration |

All other word fields are unchanged. Applying a suggestion sets `meaning`, `example` and `ipa` and may
append one audio `MediaRef` (name `<word>.wav`, type `audio/wav`).

## AI settings (new, `localStorage` key `membetter.ai`, persisted by Zustand)

| Field | Type | Rules |
|-------|------|-------|
| apiKey | string | Empty string means not connected. Non-empty, no whitespace, trimmed. Shown masked (last 4 characters). Never logged |
| textModel | string | Default `gemini-3.8-flash`. Non-empty, no whitespace. "Restore defaults" resets it |
| speechModel | string | Default `gemini-3.8-flash-tts`. Non-empty, no whitespace. "Restore defaults" resets it |

Actions: `saveKey(key)`, `removeKey()`, `setModels(text, speech)`, `restoreModels()`.

## WordSuggestion (temporary, in memory while the panel is open)

| Field | Type | Rules |
|-------|------|-------|
| word | string | The trimmed Word text the request was made for (at most 60 characters) |
| definition | string | Non-empty, at most 25 words expected |
| sentences | string[] | 1 to 3 non-empty strings (extra ones dropped) |
| best | number | Integer index into `sentences`; clamped to a valid index |
| selected | number | Index chosen in the panel; starts at `best` |
| ipa | string | Non-empty, without slashes |
| audio | Blob \| null | WAV audio, or null when audio could not be created |
| audioNote | string \| null | "Audio could not be created" when `audio` is null |

State machine of a request: `idle` to `loading` to `ready` or `error`; "Try again" goes back to
`loading`; Cancel, Escape, unmount and timeout abort.

## Error kinds (`AiError`)

`invalid-key`, `limit`, `network`, `timeout`, `refused`, `unusable`, `service`, `audio`. Messages are
listed in `contracts/ui-contract.md`.
