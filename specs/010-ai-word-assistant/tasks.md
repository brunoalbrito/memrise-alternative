---

description: "Task list for AI Word Assistant"
---

# Tasks: AI Word Assistant

**Input**: Design documents from `/specs/010-ai-word-assistant/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, contracts/gemini-api.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature builds on the course editor (feature 009): words table, Audio cell, media rules and storage.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US5)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V).
- No new dependencies and no Google SDK: use `fetch`. Cross-feature imports go through barrels: `ai-assistant` imports only from `../home` (types) and `src/shared`; `course-editor` imports `ai-assistant` through `../ai-assistant`; `ai-assistant` never imports `course-editor`.
- SECURITY: the API key must never be logged (no `console.*` with it or with request headers), never placed in a URL, never included in error messages, never rendered except masked (last 4 characters), and never sent anywhere except the `x-goog-api-key` header of Google requests.
- Exact user-facing texts and request shapes come from `contracts/ui-contract.md` and `contracts/gemini-api.md`. Copy messages verbatim.
- Nothing is translated: all content is requested in the course's Teaching language.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] In `src/features/home/model/types.ts` add `ipa?: string` to `Word` with the comment "Plain text, stored without surrounding slashes. Missing means empty." No data migration is needed.
- [x] T002 [P] Create `src/features/ai-assistant/store/aiStore.ts`: a Zustand store with `persist` (localStorage key `membetter.ai`, version 1) holding `apiKey: string` (default ""), `textModel: string` (default "gemini-3.8-flash"), `speechModel: string` (default "gemini-3.8-flash-tts") and actions `saveKey(key)` (trims; ignores an empty or whitespace-containing key), `removeKey()`, `setModels(text, speech)` (ignore empty or whitespace-containing values) and `restoreModels()`. Export `maskKey(key): string` returning `"•••• " + last 4 characters` (or "" for an empty key) and the default model constants. Never log the key.
- [x] T003 [P] Create `src/features/ai-assistant/api/errors.ts`: `AiErrorKind = "invalid-key" | "limit" | "network" | "timeout" | "refused" | "unusable" | "service" | "audio"`, `class AiError extends Error { kind: AiErrorKind }` and `aiMessage(kind): string` returning exactly: invalid-key "Google did not accept your API key. Check it in AI settings."; limit "The usage limit was reached. Try again later."; network "Could not reach the AI service. Check your connection and try again."; timeout "The AI service took too long. Try again."; refused "The AI service could not prepare suggestions for this word."; unusable "Suggestions could not be prepared. Try again."; service "The AI service had a problem. Try again later."; audio "Audio could not be created.". Error messages must not contain the key or raw response bodies.
- [x] T004 [P] Create `src/features/ai-assistant/api/audio.ts`: `base64ToBytes(base64): Uint8Array`, `audioBlobFromBase64(base64): Blob` which returns a `audio/wav` Blob; if the bytes do not start with the ASCII "RIFF" treat them as raw 24 kHz mono 16-bit little-endian PCM and prepend a 44-byte WAV header (PCM format 1, 1 channel, 24000 Hz, byte rate 48000, block align 2, 16 bits). Never throws on empty input: throw `new AiError("audio")` instead (import from `./errors`). Depends on T003.
- [x] T005 [P] Create `src/features/ai-assistant/model/suggestion.ts`: `WordSuggestion { word: string; definition: string; sentences: string[]; best: number; ipa: string; audio: Blob | null }` and `parseWordText(raw: string): { definition; sentences; best; ipa }`. Strip an optional markdown code fence (```json … ```), `JSON.parse`, then validate: definition non-empty string; sentences an array of 1 to 3 non-empty strings (drop extras beyond 3, drop empty ones); `best` an integer clamped to a valid index (default 0); ipa non-empty string with leading and trailing "/" stripped. Anything else throws `new AiError("unusable")` (import `AiError` from `../api/errors`). Depends on T003.
- [x] T006 Create `src/features/ai-assistant/api/gemini.ts` following `contracts/gemini-api.md`: constants `BASE = "https://generativelanguage.googleapis.com/v1beta/interactions"` and `VOICE = "Kore"`; a private `post(body, settings, signal)` that `fetch`es with headers `Content-Type: application/json` and `x-goog-api-key`, maps `TypeError` to `new AiError("network")`, an `AbortError` to `new AiError("timeout")` when the signal reason is a timeout and rethrows a plain `DOMException` when the caller cancelled, HTTP 401 or 403 to `invalid-key`, HTTP 400 to `invalid-key` when the JSON error message matches /api key/i and otherwise `service`, 429 to `limit`, other non-OK to `service`, and returns the parsed JSON. Export `extractText(json)` and `extractAudio(json)` exactly as in the contract's "Response extraction" (output_text, steps content text, legacy candidates; steps content `data`, legacy `inlineData.data`), `buildTextPrompt(word, languageName)` using the contract's prompt text, `generateWordText(word, languageName, settings, signal): Promise<{definition; sentences; best; ipa}>` (empty text or a refusal/safety finish reason throws `refused`; otherwise `parseWordText`), `generateWordAudio(word, settings, signal): Promise<Blob>` (no audio data throws `audio`; other errors from `post` are rethrown as `audio` except `invalid-key`, `limit`, `network` and `timeout` which keep their kind) and `testConnection(settings, signal): Promise<void>` (prompt "Reply with the single word OK.", no schema; success is any non-error response). Take the key and model ids from the `settings` argument `{ apiKey; textModel; speechModel }`. Depends on T003, T004, T005.

**Checkpoint**: `pnpm typecheck` passes; nothing user-visible changed yet.

---

## Phase 2: User Story 2 - Connect my Google AI Studio key (P1)

**Goal**: A dialog saves, tests and removes the key; without a key Auto-fill opens it.

**Independent Test**: Quickstart scenarios 1, 2 and 11.

- [x] T007 [US2] Create `src/features/ai-assistant/components/ConnectDialog.tsx` on the native `<dialog>` element (same pattern as `src/features/course-editor/components/DeleteLevelDialog.tsx`, width `w-[min(92vw,32rem)]`, scrollable). Props: `onClose: () => void`, `onSaved?: () => void`. Content per `contracts/ui-contract.md`: the intro and privacy texts verbatim; a "Get a key" link to `https://aistudio.google.com/apikey` with `target="_blank" rel="noopener noreferrer"`; a labelled `type="password"` `autoComplete="off"` input "Google AI Studio API key" (empty even when a key is saved; when one is saved show the `maskKey` value as helper text); "Save" (validate: non-empty and no whitespace, else show "Enter your API key without spaces." beside the input; on success call `saveKey`, show "AI connected." in an `aria-live` region and call `onSaved`); "Test connection" (needs a saved key; shows "Testing…" then "Connection works." or `aiMessage(error.kind)`, using an `AbortController` with a 15 s timeout `AbortSignal.timeout(15000)`; the request uses the settings from the store); "Remove key" (shows "Remove the key from this device?" with "Remove" and "Keep"; Remove calls `removeKey` and shows "Key removed."); a collapsed `<details>` "Models" with inputs "Text model" and "Speech model", "Save models" and "Restore defaults"; and a "Close" button. Escape closes. Never log or echo the typed key. Depends on T002, T003, T006.
- [x] T008 [US2] Create `src/features/ai-assistant/components/AiSettingsButton.tsx`: props none. A text `Button` (variant `text`) reading "Connect AI" when `useAiStore((s) => s.apiKey)` is empty and "AI settings" otherwise, with a sparkle icon (add `SparkleIcon` to `src/shared/ui/icons.tsx` with the Material "auto_awesome" path `M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z`); clicking it opens `ConnectDialog`. Depends on T002, T007.
- [x] T009 [US2] Create `src/features/ai-assistant/index.ts` exporting `AiSettingsButton` (and later `AutoFill`). In `src/features/course-editor/components/LevelsTab.tsx` render `<AiSettingsButton />` in the toolbar next to "Add Level" and "Show attributes". Depends on T008.

**Checkpoint**: US2 works alone (key can be saved, tested and removed).

---

## Phase 3: User Story 1 - Get suggestions for a word (P1) 🎯 MVP

**Goal**: Auto-fill shows a review panel and Apply fills Meaning, Example, IPA and attaches the audio.

**Independent Test**: Quickstart scenarios 3, 4, 6 and 7 with a real key.

- [x] T010 [US1] Create `src/features/ai-assistant/hooks/useSuggestions.ts` exporting `useSuggestions(word: string, languageName: string)` returning `{ state, run, cancel }` where `state` is `{ status: "idle" } | { status: "loading" } | { status: "ready"; suggestion: WordSuggestion; selected: number; audioNote: string | null } | { status: "error"; kind: AiErrorKind }` plus `select(index)`. `run()` reads the settings from `useAiStore.getState()`, creates one `AbortController` (aborted by `cancel()` and on unmount) combined with `AbortSignal.timeout(30000)` through `AbortSignal.any`, starts `generateWordText` and `generateWordAudio` in parallel, waits for the text (an `AiError` becomes the error state; a plain cancellation abort is ignored), then waits for the audio: on an `AiError` of kind `audio` (or any non-key error) set `audio: null` and `audioNote: "Audio could not be created."` but still show the ready state; if the audio error is `invalid-key`, `limit`, `network` or `timeout` while the text succeeded, still show ready with the note. The word sent is `word.trim()` captured when `run()` starts. Ignore results from a superseded run. Depends on T006.
- [x] T011 [US1] Create `src/features/ai-assistant/components/SuggestionDialog.tsx` on the native `<dialog>` (width `w-[min(92vw,32rem)]`, max height with scroll) per `contracts/ui-contract.md`: title `Suggestions for "<word>"`; loading state "Preparing suggestions…" in `aria-live="polite"` with "Cancel"; ready state with Definition, Example sentence as labelled radio options (the `best` one carries a "Best" badge, `selected` starts at `best`), IPA shown as `/<ipa>/`, and Audio as a native `<audio controls>` using an object URL created from the blob and revoked on cleanup (or the note when `audio` is null), buttons "Apply", "Try again" and "Cancel"; error state with `aiMessage(kind)` in `aria-live="assertive"` and "Try again" (or "Open AI settings" for `invalid-key`, which closes this dialog and opens `ConnectDialog` through the `onOpenSettings` prop) and "Close". Props: `word`, `languageName`, `onApply(result: { definition: string; sentence: string; ipa: string; audio: Blob | null }): void`, `onClose()`, `onOpenSettings()`. Run the request on mount; Escape and Cancel call `cancel()` and `onClose()`. Depends on T010.
- [x] T012 [US1] Create `src/features/ai-assistant/components/AutoFill.tsx`: props `word: string`, `languageName: string`, `onApply: (result) => void`. Renders an `IconButton` (`SparkleIcon`, `aria-label="Auto-fill word"`) that is `disabled` when `word.trim()` is empty or longer than 60 characters (with `title` "Use a shorter word or phrase (up to 60 characters)." in the too-long case). On press: if `useAiStore.getState().apiKey` is empty open `ConnectDialog` with `onSaved` opening the suggestions dialog, otherwise open `SuggestionDialog`. Keep dialog state in `useState`; closing returns focus to the button. Export it from `src/features/ai-assistant/index.ts`. Depends on T007, T011.
- [x] T013 [US1] Extend `updateWord` in `src/features/course-editor/model/levelOps.ts` so its `patch` type is `Partial<Pick<Word, "text" | "meaning" | "example" | "ipa">>` (the spread already applies it). In `src/features/course-editor/components/WordRow.tsx` add the `AutoFill` button (imported from `../../ai-assistant`) in the last cell next to "Delete word", passing `word.text`, a new `languageName` prop and an `onAutoFill(result)` prop; thread `languageName` and `onAutoFill` through `src/features/course-editor/components/LevelEditor.tsx` (new props `languageName` already exists, add `onAutoFill: (wordId: string, result: AutoFillResult) => void`). Depends on T012.
- [x] T014 [US1] In `src/features/course-editor/components/LevelsTab.tsx` implement the apply handler `applyAutoFill(levelId, wordId, result)`: first update `meaning` = definition, `example` = sentence, `ipa` = ipa through `ops.updateWord` (via `run`); then, when `result.audio` is non-null, build `new File([result.audio], \`${slug(word)}.wav\`, { type: "audio/wav" })` (slug: lowercase, spaces to "-", strip characters other than letters, digits, "-" and "_", fallback "word"), count the word's current audio files (read the latest levels with `getCourseLevels`), run `validateMediaFile(file, "audio", count)`; on an error set the notice to the returned message ("This word already has 5 audio files." is `A word can have at most 5 audio files.` from the rules, so map that exact string to "This word already has 5 audio files." for this flow); otherwise check `storageWritable()`, `putMedia(id, file)` (on failure the notice "Could not save the file on this device. Please try again."), then attach a `MediaRef` (`media-<uuid>`, name, type `audio/wav`, size) with `ops.attachMedia`. Show notices in the existing `aria-live` region of the tab (reuse the `error` state or add `notice`). Pass `onAutoFill` into each `LevelEditor`. Depends on T013.

**Checkpoint**: US1 and US2 work together (full Auto-fill flow with a real key).

---

## Phase 4: User Story 3 - Understand and recover from problems (P2)

**Goal**: Every failure shows its own message and leaves the word unchanged.

**Independent Test**: Quickstart scenarios 8 and 9.

- [x] T015 [US3] Verify and fix error handling end to end: in `gemini.ts`, `useSuggestions.ts` and `SuggestionDialog.tsx` make sure each of the kinds `invalid-key`, `limit`, `network`, `timeout`, `refused`, `unusable`, `service` shows its exact message with the right action ("Try again" or "Open AI settings"), that audio failure alone yields the ready state with "Audio could not be created.", that a request is aborted after 30 seconds, that unmounting or closing the dialog cancels running requests without showing an error, that only one run per row can be active (the button stays disabled or the dialog is already open), and that closing after an error leaves the word unchanged. Also confirm no code path logs or exposes the key (search `ai-assistant` for `console`). Fix only deviations. Depends on T014.

---

## Phase 5: User Story 4 - Choose the best sentence and try again (P2)

**Goal**: Select another sentence or ask for a fresh set.

**Independent Test**: Quickstart scenario 5.

- [x] T016 [US4] Verify in `SuggestionDialog.tsx` and `useSuggestions.ts` that exactly one radio is marked "Best" and selected on open and after "Try again", that selecting another option makes Apply use it, that "Try again" starts a new run (the previous one is aborted, `selected` resets to the new `best`) and that Apply without changes uses the Best sentence. Fix only deviations. Depends on T011.

---

## Phase 6: User Story 5 - Keep IPA with the word (P3)

**Goal**: IPA column that is editable by hand and shown in slashes.

**Independent Test**: Quickstart scenario 10.

- [x] T017 [US5] Add the "IPA" column to `src/features/course-editor/components/LevelEditor.tsx` (header cell `<th scope="col">IPA</th>` between Audio and Meaning) and the cell to `src/features/course-editor/components/WordRow.tsx` (between the Audio cell and the Meaning cell): a text input `aria-label="IPA"` with a local `focused` state; value is the raw stripped text while focused and `/<ipa>/` (empty when no ipa) when not focused; `onChange` sends `{ ipa }` with leading and trailing "/" characters stripped and the value trimmed. Treat a missing `word.ipa` as "". Depends on T013.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T018 Verify layout and accessibility per quickstart scenario 12: dialogs fit and scroll at 360 px, Tab order in the suggestions dialog (radios, Apply, Try again, Cancel) with visible focus, loading and errors announced, the key input is a password field with a visible label. Fix deviations.
- [x] T019 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors. Search `src` to confirm `ai-assistant` imports nothing from `course-editor`, that no file under `src/features/ai-assistant` contains `console.`, and that the key is only used in the `x-goog-api-key` header in `gemini.ts`.
- [ ] T020 Walk through every scenario in `specs/010-ai-word-assistant/quickstart.md` in the browser with a real Google AI Studio key. If "Test connection" or Auto-fill fails because a model id or response shape differs from `contracts/gemini-api.md`, correct the defaults or the parsing in `gemini.ts` (and update the contract) and record what changed in the commit message.

---

## Dependencies & Execution Order

- Phase 1: T001, T002, T003 are independent; T004 and T005 need T003; T006 needs T003, T004, T005.
- US2 (T007 to T009) needs Phase 1. US1 (T010 to T014) needs Phase 1 and T007 (the connect dialog is opened by Auto-fill). US3 and US4 need US1. US5 (T017) needs T013.
- Priority order: US2, US1 (P1), US3, US4 (P2), US5 (P3). US2 comes first because Auto-fill depends on the connect dialog.
- Files edited by several tasks (run in sequence): `LevelsTab.tsx` (T009, T014), `WordRow.tsx` and `LevelEditor.tsx` (T013, T017), `ai-assistant/index.ts` (T009, T012), `SuggestionDialog.tsx` (T011, T015, T016), `gemini.ts` (T006, T015, T020).

## Parallel Opportunities

- Phase 1: T001, T002, T003 together, then T004 and T005 together.
- US1: T010 (hook) can start once T006 is done while T007 to T009 proceed; T017 (IPA column) can run any time after T013.

## Implementation Strategy

- **MVP**: Phase 1, US2 and US1 (T001 to T014): connect a key, press Auto-fill, review and apply.
- **Increment 2**: US3 and US4 (error handling and sentence choice verification).
- **Increment 3**: US5 (IPA column; T017 can be pulled forward since the Apply step writes `ipa`), then Polish.
- Because the Google API shapes could not be exercised without a key, T020 is the real acceptance step: run it with your key before relying on the feature.
