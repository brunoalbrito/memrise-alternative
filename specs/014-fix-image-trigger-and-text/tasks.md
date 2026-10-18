---

description: "Task list for Fix Image Trigger and Text in Pictures"
---

# Tasks: Fix Image Trigger and Text in Pictures

**Input**: Design documents from `/specs/014-fix-image-trigger-and-text/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/scene-prompt.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Conventions

- Paths relative to the repository root. TypeScript strict. M3 tokens only. No new dependencies.
- SECURITY unchanged: keys only in their headers, never logged or in addresses or messages.
- All changes inside `src/features/ai-assistant`. Exact prompt texts come from `contracts/scene-prompt.md`.

---

## Phase 1: User Story 2 - No writing inside the picture (P1)

- [x] T001 [US2] In `src/features/ai-assistant/api/gemini.ts` add `describeScene(word, sentence, settings, signal): Promise<string>`: a plain text request (model `settings.textModel`, `input` = the step 1 prompt from `contracts/scene-prompt.md` with the word and sentence JSON-quoted, no `response_format`), returning `extractText(json).trim()`; empty text throws `new AiError("unusable")`.
- [x] T002 [US2] In `src/features/ai-assistant/api/pollinations.ts` change `buildImagePrompt` to `buildImagePrompt(scene: string)` returning `` `${scene} Simple friendly flat illustration, bright colours, square composition. The image contains no text of any kind: no words, letters, numbers, captions, signs, labels, logos or speech bubbles.` ``, add `buildFallbackScene(sentence)` returning `Illustrate a scene in which ${sentence with all quote characters removed}.`, and change `generateWordImage(prompt: string, key, model, signal)` to take the finished prompt text instead of word and sentence. The sentence must never be wrapped in quotes in any picture prompt. Depends on T001.

## Phase 2: User Story 1 - Create the picture only after I choose a sentence (P1) 🎯 MVP

- [x] T003 [US1] In `src/features/ai-assistant/hooks/useSuggestions.ts`: (a) remove the automatic `startImage(...)` call at the end of `execute()`; (b) add `imageIndexRef = useRef<number | null>(null)`; `startImage` sets it to the index when it starts and clears it (null) on error, on `stopImage()`, on retry and on cancel; (c) change `startImage` to run, under the existing controller and 45 s timeout, first the Pollinations key check (no key keeps the existing `image-no-key` error and no requests), then `describeScene(word.trim(), sentence, settings, signal)` with the Google settings from the store (any failure, including an empty result, falls back to `buildFallbackScene(sentence)`; a plain cancellation abort is rethrown), then `generateWordImage(buildImagePrompt(scene), pollinationsKey, pollinationsModel, signal)`; (d) replace `select` by `choose(index)`: sets `selected`, and returns without a request when `imageIndexRef.current === index`, otherwise calls `startImage` for that sentence; (e) `newImage()` also works from the idle state for the selected sentence and is still ignored while loading; (f) return `{ state, image, retry, choose, newImage, cancel }`. Depends on T002.
- [x] T004 [US1] In `src/features/ai-assistant/components/SuggestionDialog.tsx`: use `choose` for each sentence radio from both `onClick` and `onChange`; in the Image section add the idle state "Select a sentence to create its image." with a "Create image" `Button` calling `newImage`; keep loading, ready (picture, caption, "New image"), and error states; keep Apply enabled when the image is idle (it passes `image: null`) and disabled only while loading. Depends on T003.

## Phase 3: Polish

- [x] T005 Update the docs that this fix supersedes: add a note to `specs/012-fix-image-relevance/contracts/prompt.md` ("Prompt superseded by specs/014-fix-image-trigger-and-text: the sentence is no longer sent as quoted text") and to `specs/011-ai-word-image/spec.md` User Story 1 ("the picture is now created only after a sentence is chosen; see specs/014-fix-image-trigger-and-text").
- [x] T006 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors. Search `src/features/ai-assistant` for `console` and for any picture prompt that wraps the sentence in quotes.
- [ ] T007 Walk through `specs/014-fix-image-trigger-and-text/quickstart.md` with your keys and check the pictures for writing. If an image model still draws text, strengthen the wording in `buildImagePrompt` or `describeScene`, update `contracts/scene-prompt.md` and note it in the commit message.

## Dependencies & Execution Order

- T001 then T002 then T003 then T004; T005 any time; T006 and T007 last.
- Files edited by several tasks in sequence: `pollinations.ts` (T002), `useSuggestions.ts` (T003), `SuggestionDialog.tsx` (T004).

## Implementation Strategy

- MVP: T001 to T004 are the whole fix; then T005 to T007.
