# Data Model: Pollinations Image Provider

Extends `specs/010-ai-word-assistant/data-model.md` and `specs/011-ai-word-image/data-model.md`.

## AI settings (`localStorage` key `membetter.ai`, persist version 2)

| Field | Type | Rules |
|-------|------|-------|
| apiKey, textModel, speechModel | unchanged | Google key and models (feature 010) |
| pollinationsKey | string | Empty means not connected. Non-empty, no whitespace, trimmed. Shown masked (last 4 characters). Never logged |
| pollinationsModel | string | Empty means Pollinations' default model. No whitespace. Restored to empty by "Restore defaults" |
| imageModel | removed | The Google image model setting is dropped; version 1 data is migrated by discarding it |

Actions: `savePollinationsKey(key)` (ignores empty or whitespace-containing keys, returns whether it saved),
`removePollinationsKey()`, `setModels(text, speech, pollinationsModel)` (the third may be empty),
`restoreModels()`.

## Image state and AutoFillResult

Unchanged from `specs/011-ai-word-image/data-model.md`, with the new error kinds `image-no-key`, `image-key`
and `image-credit` possible in the `error` state.

## AiErrorKind (extended)

Adds `image-no-key`, `image-key`, `image-credit`.
