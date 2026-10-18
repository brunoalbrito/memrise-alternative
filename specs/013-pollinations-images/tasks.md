---

description: "Task list for Pollinations Image Provider"
---

# Tasks: Pollinations Image Provider

**Input**: Design documents from `/specs/013-pollinations-images/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pollinations-api.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

## Conventions for every task

- Paths relative to the repository root. TypeScript strict. M3 tokens only. No new dependencies.
- SECURITY: neither key may be logged, placed in a URL, echoed in messages, or rendered except masked (last 4 characters). The Pollinations key travels only in the `Authorization` header of `api/pollinations.ts`; the Google key only in the `x-goog-api-key` header of `api/gemini.ts`.
- All changes stay in `src/features/ai-assistant`. Exact texts come from `contracts/pollinations-api.md`.

---

## Phase 1: Foundational

- [x] T001 [P] In `src/features/ai-assistant/api/errors.ts` add the kinds `"image-no-key"`, `"image-key"` and `"image-credit"` with the exact messages from the contract: "Add your Pollinations key in AI settings to create images."; "Pollinations did not accept your key. Check it in AI settings."; "Your Pollinations balance or budget is used up.".
- [x] T002 [P] Update `src/features/ai-assistant/store/aiStore.ts`: remove `imageModel` and `DEFAULT_IMAGE_MODEL`; add `pollinationsKey` ("" default) with `savePollinationsKey(key): boolean` (trim; reject empty or whitespace-containing) and `removePollinationsKey()`; add `pollinationsModel` ("" default; no whitespace); change `setModels` to `(textModel, speechModel, pollinationsModel)` (third may be empty but must not contain whitespace) and `restoreModels` to reset text, speech and pollinations models; set persist `version: 2` with a `migrate` that drops the old `imageModel` and a `merge` that keeps defaults for missing fields. Keep `maskKey`.
- [x] T003 Create `src/features/ai-assistant/api/pollinations.ts`: `buildImagePrompt(word, sentence)` (move it here unchanged from `gemini.ts`, the scene-based prompt) and `generateWordImage(word: string, sentence: string, key: string, model: string, signal: AbortSignal): Promise<Blob>` that `fetch`es `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=768&height=768` (plus `&model=${encodeURIComponent(model)}` only when `model` is non-empty) with header `Authorization: Bearer <key>`; maps a `TypeError` to `AiError("network")`, an `AbortError` to `timeout` when `signal.reason === "timeout"` (otherwise rethrow the abort), HTTP 401 or 403 to `image-key`, 402 to `image-credit`, 429 to `limit`, any other non-OK status to `image`; requires a `Content-Type` starting with `image/` and a non-empty blob, else `image`; returns `shrinkImage(blob)` (from `./image`). Never put the key in the URL or any message. Depends on T001.
- [x] T004 Update `src/features/ai-assistant/api/gemini.ts`: delete `extractImage`, `buildImagePrompt`, `generateWordImage` and the `imageBlobFromBase64`/`shrinkImage` import, and remove `imageModel` from `AiSettings`. In `src/features/ai-assistant/api/image.ts` delete `imageBlobFromBase64` (no longer used) and keep `shrinkImage`. Update every place that built an `AiSettings` with `imageModel` (`useSuggestions.ts`, `ConnectDialog.tsx`). Depends on T002, T003.

**Checkpoint**: `pnpm typecheck` passes; images are not yet wired to Pollinations in the panel.

---

## Phase 2: User Story 1 - Create the word picture with Pollinations (P1) 🎯 MVP

- [x] T005 [US1] In `src/features/ai-assistant/hooks/useSuggestions.ts` make `startImage` read `pollinationsKey` and `pollinationsModel` from `useAiStore.getState()`: when the key is empty set the image state to `{ status: "error", kind: "image-no-key" }` without any request; otherwise call `generateWordImage(word.trim(), sentence, key, model, controller.signal)` from `../api/pollinations`. Map any non-`AiError` failure to `kind: "image"` as before. Everything else (cancel, runs counter, 45 s timeout, selection, `newImage`) stays. Depends on T004.
- [x] T006 [US1] In `src/features/ai-assistant/components/SuggestionDialog.tsx` make the image error block show "Open AI settings" (closing the dialog and calling `onOpenSettings`) when the kind is `image-no-key` or `image-key`, and "New image" for every other kind; keep the message from `aiMessage(kind)`. Depends on T005.

## Phase 3: User Story 2 - Save and manage the Pollinations key (P1)

- [x] T007 [US2] Update `src/features/ai-assistant/components/ConnectDialog.tsx`: replace the privacy text with "The word and the course language are sent to Google for text and audio. The word and the sentence you choose are sent to Pollinations to create the picture. Your keys are stored on this device only and are never shown in full. Use keys with spending limits and remove them on shared computers."; add a section "Pollinations API key (for images)" with a labelled `type="password"` `autoComplete="off"` input, a masked "Saved key: •••• 1234" / "No key saved." helper, "Save" (validates with `savePollinationsKey`; error "Enter your API key without spaces."; success "Pollinations connected." and the input empties), and "Remove key" with the same confirm group as the Google key ("Remove the key from this device?" with "Remove" and "Keep", then "Key removed."); in the "Models" details replace the "Image model" input with "Image model (Pollinations, optional)" bound to `pollinationsModel` (placeholder "Provider default"), `Save models` calling `setModels(text, speech, pollinationsModel)`, and `Restore defaults` refreshing all three inputs. Keep the Google key section and test button unchanged. Depends on T002.

## Phase 4: User Story 3 - Understand image problems (P2)

- [x] T008 [US3] Verify every image error path against `contracts/pollinations-api.md`: no key sends no request and shows the no-key message with "Open AI settings"; 401 or 403 shows the key message with "Open AI settings"; 402 the budget message with "New image"; 429, network, timeout and other errors their messages with "New image"; Apply stays enabled after an error and applies text and audio only; closing or changing the sentence cancels the request without an error. Search `src/features/ai-assistant` for `console` and for any use of the Pollinations key other than the `Authorization` header and the dialog masking. Fix only deviations. Depends on T006, T007.

## Phase 5: Polish

- [x] T009 Update the superseded references: `specs/011-ai-word-image/contracts/gemini-image.md` and `specs/011-ai-word-image/spec.md` assumptions get a note "Superseded by specs/013-pollinations-images (images now come from Pollinations)"; `specs/012-fix-image-relevance/contracts/prompt.md` keeps the prompt and notes the request now goes to Pollinations.
- [x] T010 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T011 Walk through the scenarios in `specs/013-pollinations-images/quickstart.md` with your real keys. If the browser blocks the Pollinations request (cross-origin) or the response differs from the contract, record exactly what happens and fix `api/pollinations.ts` (or report that a proxy would be needed), noting it in the commit message.

---

## Dependencies & Execution Order

- T001 and T002 independent; T003 needs T001; T004 needs T002 and T003; T005 needs T004; T006 needs T005; T007 needs T002 (can run in parallel with T005 and T006); T008 needs T006 and T007; T009 to T011 last.
- Files edited by several tasks (run in sequence): `ConnectDialog.tsx` (T004, T007), `useSuggestions.ts` (T004, T005), `gemini.ts` (T004).

## Implementation Strategy

- MVP: T001 to T007. Then T008 (verification), T009 to T011. T011 is the real acceptance step with your keys.
