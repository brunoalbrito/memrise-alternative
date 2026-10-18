---

description: "Task list for AI Word Image"
---

# Tasks: AI Word Image

**Input**: Design documents from `/specs/011-ai-word-image/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, contracts/gemini-image.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature extends the AI Word Assistant (feature 010): key, suggestions panel and Apply.

## Format: `[ID] [P?] [Story] Description`

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Material Design 3 tokens only (constitution Principle V). No new dependencies: browser `fetch`, `createImageBitmap` and canvas.
- SECURITY (unchanged from feature 010): the key is only used in the `x-goog-api-key` header in `src/features/ai-assistant/api/gemini.ts`, never logged, never in a URL or error message.
- Exact texts and request shapes come from `contracts/ui-contract.md` and `contracts/gemini-image.md`.
- `ai-assistant` never imports from `course-editor`.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] In `src/features/ai-assistant/api/errors.ts` add the kind `"image"` to `AiErrorKind` and the message "Image could not be created." in `aiMessage`.
- [x] T002 [P] Update `src/features/ai-assistant/store/aiStore.ts`: add `imageModel: string` (default constant `DEFAULT_IMAGE_MODEL = "gemini-nano-banana-2.1"`), change `setModels` to `(textModel, speechModel, imageModel)` validating all three (non-empty, no whitespace) and `restoreModels` to reset all three; add a persist `merge` so older saved settings without `imageModel` get the default. Keep the key rules unchanged.
- [x] T003 [P] Create `src/features/ai-assistant/api/image.ts` exporting `imageBlobFromBase64(base64: string, mimeType?: string): Blob` (decode base64, type `mimeType` or `image/jpeg`; empty or invalid input throws `new AiError("image")`) and `shrinkImage(blob: Blob): Promise<Blob>`: decode with `createImageBitmap`, scale so the longest side is at most 768 px, draw on a canvas (`OffscreenCanvas` when available, else `document.createElement("canvas")`), export JPEG at quality 0.85 and retry at 0.7 when the result is above 1.5 MB (1572864 bytes); if decoding or exporting fails, return the original blob when it is at most 2 MB (2097152 bytes), otherwise throw `new AiError("image")`. Depends on T001.
- [x] T004 Update `src/features/ai-assistant/api/gemini.ts`: export `extractImage(json): { data: string; mimeType?: string }` (order: `output_image.data`; first `steps[].content[]` item with a string `data` whose `mime_type` is missing or starts with `image/`; legacy `candidates[0].content.parts[].inlineData` whose `mimeType` starts with `image/`; empty `data` when none) and `buildImagePrompt(word, sentence)` with the exact prompt in `contracts/gemini-image.md` (word and sentence JSON-quoted); add `generateWordImage(word, sentence, settings, signal): Promise<Blob>` that posts the contract's request using `settings.imageModel` (extend `AiSettings` with `imageModel`), maps `AiError` kinds other than `invalid-key`, `limit`, `network` and `timeout` to `new AiError("image")`, throws `image` when there is no data, then returns `shrinkImage(imageBlobFromBase64(data, mimeType))`. Update every place that builds an `AiSettings` object (`useSuggestions.ts`, `ConnectDialog.tsx`) to include `imageModel` from the store. Depends on T001, T002, T003.

**Checkpoint**: `pnpm typecheck` passes; nothing user-visible changed yet.

---

## Phase 2: User Story 1 - Get an image for the chosen sentence (P1) 🎯 MVP

**Goal**: A picture is created for the selected sentence, shown in the panel and attached by Apply.

**Independent Test**: Quickstart scenarios 1 to 3 and 7 with a real key.

- [x] T005 [US1] Extend `src/features/ai-assistant/hooks/useSuggestions.ts` with image state: `image: { status: "idle" } | { status: "loading"; index: number } | { status: "ready"; index: number; blob: Blob } | { status: "error"; kind: AiErrorKind }` returned next to `state`. Add `startImage(sentence: string, index: number)` using its own `AbortController` (aborts the previous image request with reason "cancel", timeout 45000 ms with reason "timeout") and its own run counter so stale results are ignored; it sets `loading`, calls `generateWordImage(word.trim(), sentence, settings, signal)` and sets `ready` or `error` (an `AiError` kind, `service` or unknown becoming `image`; plain cancellation is ignored). Call it (a) at the end of `execute()` when the text succeeded, for `text.sentences[text.best]`, and (b) inside `select(index)` for the chosen sentence after updating `selected`. `retry()` (text) and `cancel()` also abort the image request and reset `image` to idle. Add `newImage()` that does nothing when the image status is `loading` and otherwise calls `startImage` for the currently selected sentence. Depends on T004.
- [x] T006 [US1] Update `src/features/ai-assistant/components/SuggestionDialog.tsx`: add the "Image" section after "Audio" per `contracts/ui-contract.md` (loading "Creating image…" in `aria-live="polite"`; ready: a square `<img>` (max width 16rem, rounded) from an object URL created from the blob and revoked on cleanup, `alt` = `Illustration for "<word>"`, and a "New image" button; error: `aiMessage(kind)` in `aria-live="assertive"` plus "New image"). Add `image: Blob | null` to `AutoFillResult` (the ready blob or null) and pass it in `onApply`. Disable "Apply" while `image.status === "loading"` and add a visually hidden hint "Waiting for the image" in that case. Depends on T005.
- [x] T007 [US1] In `src/features/course-editor/components/LevelsTab.tsx` generalize the audio attach code of `applyAutoFill` into a helper `attachBlob(levelId, wordId, kind: "images" | "audio", blob, fileName, type)` (validate with `validateMediaFile`, `storageWritable`, `putMedia`, `attachMedia`, keep the existing messages) and call it for the audio and then for the image: `new File([result.image], \`${slug(word.text)}.jpg\`, { type: "image/jpeg" })`. Map the limit message "A word can have at most 5 images." to "This word already has 5 images." and keep "A word can have at most 5 audio files." mapped to "This word already has 5 audio files."; size and storage messages are shown as returned. Text values and the other media are applied even when one attach is skipped. Depends on T006.

**Checkpoint**: US1 works alone (picture follows the selected sentence and is attached on Apply).

---

## Phase 3: User Story 2 - Make a new picture (P2)

**Goal**: "New image" replaces the picture without touching the text suggestions.

**Independent Test**: Quickstart scenario 4.

- [x] T008 [US2] Verify in `useSuggestions.ts` and `SuggestionDialog.tsx` that "New image" calls `newImage()`, leaves definition, sentences, IPA and audio untouched, is ignored while a picture is loading (the button may also be `disabled` then), replaces the picture shown on success, and that Apply attaches only the picture shown at that moment. Fix only deviations. Depends on T006.

---

## Phase 4: User Story 3 - Recover when the picture cannot be made (P2)

**Goal**: Image failures never block the rest.

**Independent Test**: Quickstart scenarios 5 and 6.

- [x] T009 [US3] Verify the failure paths: an image error shows its message with "New image" and leaves Apply enabled; Apply with no image applies text and audio only; with 5 images already the editor shows "This word already has 5 images."; an oversized or unsaveable picture shows the matching message; closing, Escape and Cancel abort the image request without an error; changing the sentence or "Try again" cancels the previous request and stale results are ignored (SC-004). Fix only deviations. Depends on T007.

---

## Phase 5: Settings and privacy text (supports FR-010)

- [x] T010 [US1] Update `src/features/ai-assistant/components/ConnectDialog.tsx`: replace the privacy sentence with "The word, the sentence you choose and the course language are sent to Google. Your key is stored on this device only and is never shown in full. Remove it on shared computers."; add an "Image model" input (label "Image model", state initialised from `imageModel`) in the "Models" section; "Save models" calls `setModels(text, speech, image)` and reports "Models saved." or "Enter model names without spaces."; "Restore defaults" resets and refreshes all three inputs. Depends on T002.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T011 Verify layout and accessibility per quickstart scenario 10: the picture fits at 360 px (max 16rem), has alt text, loading and errors are announced, "New image" is keyboard reachable, the dialog scrolls. Fix deviations.
- [x] T012 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors. Search `src/features/ai-assistant` to confirm no `console.` calls and that the key is only used in the `x-goog-api-key` header.
- [ ] T013 Walk through every scenario in `specs/011-ai-word-image/quickstart.md` with a real key. If the image model name or response shape differs from `contracts/gemini-image.md`, correct the default or the parsing in `gemini.ts` and update the contract, noting the change in the commit message.

---

## Dependencies & Execution Order

- Phase 1: T001, T002, T003 independent; T004 needs all three.
- US1: T005 then T006 then T007. T010 needs T002 and can run any time after Phase 1. US2 (T008) needs T006. US3 (T009) needs T007.
- Files edited by several tasks (run in sequence): `useSuggestions.ts` (T005, T008, T009), `SuggestionDialog.tsx` (T006, T008, T009), `gemini.ts` (T004, T013), `LevelsTab.tsx` (T007).

## Parallel Opportunities

- Phase 1: T001, T002, T003 together.
- T010 (settings dialog) in parallel with T005 to T007.

## Implementation Strategy

- **MVP**: Phase 1 and US1 (T001 to T007) plus T010 so the image model can be corrected without code changes.
- **Increment 2**: US2 and US3 verification, then Polish. T013 is the real acceptance step with a key.
