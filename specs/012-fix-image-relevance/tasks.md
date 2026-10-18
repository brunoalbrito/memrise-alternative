---

description: "Task list for Fix Image Relevance to the Chosen Sentence"
---

# Tasks: Fix Image Relevance to the Chosen Sentence

**Input**: Design documents from `/specs/012-fix-image-relevance/`

**Prerequisites**: plan.md, spec.md, research.md, contracts/prompt.md, quickstart.md

**Tests**: None (constitution v2.0.0; not requested). Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: User Story 1 - The picture shows the scene of the chosen sentence (P1) 🎯 MVP

**Goal**: The picture depicts the selected sentence, the link is visible, and only a picture for the selected sentence can be applied.

**Independent Test**: Quickstart scenarios 1 to 4.

- [x] T001 [US1] In `src/features/ai-assistant/api/gemini.ts` rewrite `buildImagePrompt(word, sentence)` to return exactly the prompt in `specs/012-fix-image-relevance/contracts/prompt.md` (sentence and word JSON-quoted, sentence first, scene-based, no text in the picture, no "plain light background" or "one clear subject").
- [x] T002 [US1] In `src/features/ai-assistant/components/SuggestionDialog.tsx` show, under a ready picture and above "New image", the caption `Made for: “<sentence>”` using `state.suggestion.sentences[image.index]` (label typography, `text-on-surface-variant`, wraps). Show no caption for loading or error states.
- [x] T003 [US1] In `SuggestionDialog.tsx` make Apply attach the picture only when `image.status === "ready"` and `image.index === state.selected` (otherwise pass `image: null`). Depends on T002.
- [x] T004 [US1] Update `specs/011-ai-word-image/contracts/gemini-image.md` so its prompt section points to the new prompt in `specs/012-fix-image-relevance/contracts/prompt.md`.

---

## Phase 2: Polish

- [x] T005 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T006 Walk through the scenarios in `specs/012-fix-image-relevance/quickstart.md` with a real key and judge whether the pictures match their sentences. If a model keeps ignoring the scene, adjust the wording in `buildImagePrompt`, update `contracts/prompt.md`, and note it in the commit message.

## Dependencies & Execution Order

- T001 and T002 touch different files and can run together; T003 after T002; T004 any time; T005 and T006 last.

## Implementation Strategy

- MVP: T001 to T004 are the whole fix. Then T005 and T006.
