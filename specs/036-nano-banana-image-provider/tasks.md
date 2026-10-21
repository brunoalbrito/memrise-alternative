# Tasks: Replace Pollinations with Google Gemini Image Provider

**Input**: Design documents from `/specs/036-nano-banana-image-provider/`

**Prerequisites**: plan.md (tech stack: React, TypeScript, Zustand, Electron), spec.md (3 user stories, P1/P2), data-model.md, contracts/nano-banana-api.md, research.md

**Stack**: Electron + React + TypeScript + Zustand (state) + SQLite (storage) + Vitest (unit tests) + Playwright (e2e tests)

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/features/ai-assistant/` (existing feature)
- Store: `src/features/ai-assistant/store/aiStore.ts`
- Components: `src/features/ai-assistant/components/`
- Hooks: `src/features/ai-assistant/hooks/`
- Backend API: `src/main/backend/api/`
- Tests: `tests/unit/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create feature branch `036-nano-banana-image-provider` and verify build tools ready
- [ ] T002 [P] Review existing Pollinations integration in `src/features/ai-assistant/` to understand current implementation
- [ ] T003 [P] Verify Google Gemini API credentials and test access to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Update Zustand `aiStore.ts` to rename Pollinations state: `pollinationsConnected` → `nanoBananaConnected`, `pollinationsLast4` → `nanoBananaLast4`, `pollinationsModel` → `nanoBananaModel`
- [ ] T005 [P] Create `src/features/ai-assistant/api/googleGeminiApi.ts` with base function signature for API calls (endpoint: `generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent`)
- [ ] T006 [P] Create `src/main/backend/api/nano-banana-routes.ts` for backend endpoints: `POST /api/ai/saveKey`, `POST /api/ai/removeKey`, `GET /api/ai/config`
- [ ] T007 Add SQLite table `ai_provider_configs` with columns: `provider_id` (TEXT UNIQUE), `api_key_encrypted` (TEXT), `last_4` (TEXT), `model_name` (TEXT), `connected` (BOOLEAN), `created_at` (TEXT), `updated_at` (TEXT)
- [ ] T008 [P] Create encryption/decryption utility in `src/main/backend/utils/encryption.ts` for storing API keys securely in SQLite

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Migrate Image Generation to Nano Banana (Priority: P1) 🎯 MVP

**Goal**: Image generation in Auto-fill switches from Pollinations to Google Gemini

**Independent Test**: Save Nano Banana key → Auto-fill word → verify image generated via Gemini API → press Apply → reload app → image persists

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement `generateImageWithGemini()` in `src/features/ai-assistant/api/googleGeminiApi.ts`: accepts `prompt`, returns base64-decoded image or data URL
  - **Spec Contract**: Request to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY`
  - **Spec Contract**: Request body: `{contents[0].parts[0].text: prompt, generationConfig: {aspectRatio: "1:1", outputMimeType: "image/jpeg"}}`
  - **Spec Contract**: Response path: `candidates[0].content.parts[0].inlineData.data` (base64)
  - **Spec Contract**: Decode base64 to display image: `data:image/jpeg;base64,{data}`

- [ ] T010 [P] [US1] Update `src/features/ai-assistant/hooks/useSuggestions.ts` to call Gemini API instead of Pollinations: check `nanoBananaConnected` state, use `generateImageWithGemini()` for image section

- [ ] T011 [US1] Implement migration logic in `src/main/backend/api/index.ts` (IPC handler): on app startup, detect old Pollinations key (`pollinationsConnected === true`), clear it, prompt user to set Nano Banana key

- [ ] T012 [P] [US1] Add error handling in `src/features/ai-assistant/hooks/useSuggestions.ts` for Gemini API errors:
  - **Spec Contract**: 400 → "Invalid request"
  - **Spec Contract**: 429 → "Rate limit exceeded (100 per minute). Please try again."
  - **Spec Contract**: 500/503 → "Service temporarily unavailable"
  - Display user-friendly message in Image section

- [ ] T013 [P] [US1] Implement rate limiting queue in `src/features/ai-assistant/store/aiStore.ts`: track requests per minute (100 max), reject 11th concurrent request with message "Maximum 10 images at once"

- [ ] T014 [US1] Test User Story 1 end-to-end: Save Nano Banana key → Auto-fill → Image generates → Apply → Reload → Image persists. Verify no Pollinations API calls.

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Key Management UI (Priority: P1)

**Goal**: "Connect AI" dialog accepts and stores Nano Banana API key

**Independent Test**: Open Settings → Connect AI → Paste key → Save → See masked key. Reload → Key still there. Remove → Key gone.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Update `src/features/ai-assistant/components/ConnectDialog.tsx` to:
  - Replace "Pollinations API key" section with "Nano Banana 2 Lite API key (for images)"
  - Input field for API key, Save and Remove buttons (same UX as Google key section)
  - **Spec Constraint**: "Enter your API key without spaces." validation message if empty/spaces
  - Display "Nano Banana 2 Lite connected." on successful save
  - Mask key on display: show last 4 chars only (e.g., `••••••xyz7`)

- [ ] T016 [P] [US2] Implement `saveKey` action in `src/main/backend/api/nano-banana-routes.ts` (IPC handler):
  - Accept API key via `POST /api/ai/saveKey`
  - **Spec Constraint**: Validate non-empty, no whitespace
  - Encrypt and store in SQLite `ai_provider_configs` table
  - Return last 4 characters for display
  - **Spec Constraint**: Store `model_name` as empty (use Gemini default) for v1

- [ ] T017 [P] [US2] Implement `removeKey` action in `src/main/backend/api/nano-banana-routes.ts` (IPC handler):
  - Accept `DELETE /api/ai/removeKey`
  - Clear Nano Banana config from SQLite
  - Return confirmation

- [ ] T018 [US2] Connect dialog → backend: Update `useAiStore.saveKey("nano-banana", key)` and `useAiStore.removeKey("nano-banana")` in ConnectDialog to call backend routes and update Zustand state

- [ ] T019 [P] [US2] Update `src/main/backend/api/index.ts` to provide `getConfig()` IPC handler: load `nanoBananaConnected`, `nanoBananaLast4` from SQLite on app startup, populate Zustand store

- [ ] T020 [US2] Test User Story 2 end-to-end: Open Connect AI → Save key → Verify masked display → Reload → Key persists → Remove → Key gone. Verify Image section asks for key again.

**Checkpoint**: User Stories 1 AND 2 are fully functional and independently testable

---

## Phase 5: User Story 3 - API Contract Compliance (Priority: P2)

**Goal**: Ensure Gemini API calls follow correct contract (endpoint, auth, payload, response)

**Independent Test**: Network inspection: Generate image → verify request goes to `generativelanguage.googleapis.com` with correct headers/payload → verify response has base64 image

### Implementation for User Story 3

- [ ] T021 [P] [US3] Add detailed logging to `src/features/ai-assistant/api/googleGeminiApi.ts`:
  - Log request URL, method, headers (mask API key)
  - Log request body (prompt, model, aspectRatio, outputMimeType)
  - **Spec Contract**: Verify endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY`
  - **Spec Contract**: Verify authentication: Query parameter `?key=YOUR_API_KEY`
  - **Spec Contract**: Verify request format: `{contents[0].parts[0].text, generationConfig: {aspectRatio: "1:1", outputMimeType: "image/jpeg"}}`

- [ ] T022 [P] [US3] Add response parsing validation in `src/features/ai-assistant/api/googleGeminiApi.ts`:
  - **Spec Contract**: Extract image from `candidates[0].content.parts[0].inlineData.data` (base64 string)
  - **Spec Contract**: Extract MIME type from `candidates[0].content.parts[0].inlineData.mimeType`
  - Validate base64 format, throw clear error if malformed
  - Log response structure (without dumping full image data)

- [ ] T023 [US3] Write unit test `tests/unit/ai-assistant/googleGeminiApi.test.ts`:
  - Mock Gemini API response with base64 image
  - Test successful image generation and base64 decoding
  - Test error responses (400, 429, 500, 503) map to correct user messages
  - Test request payload has correct structure

- [ ] T024 [US3] Write contract test `tests/contract/nano-banana-api.test.ts`:
  - Test actual Gemini API endpoint (use test API key, free tier)
  - Verify endpoint exists and responds correctly
  - Verify authentication works with query parameter
  - Verify response has expected structure
  - Test rate limit behavior (may skip if hitting quota)

- [ ] T025 [US3] Write e2e test `tests/e2e/image-generation.spec.ts` (Playwright):
  - Open app with test Nano Banana key
  - Auto-fill word → Image generates
  - Use DevTools Network tab to verify:
    - Request goes to `generativelanguage.googleapis.com`
    - Query parameter includes API key
    - Request body has correct format
    - Response includes base64 image
  - Image renders and can be applied to word

- [ ] T026 [US3] Verify all acceptance scenarios from User Story 3 spec:
  - ✅ Image generation request uses correct endpoint
  - ✅ API key passed correctly (query parameter)
  - ✅ Payload includes correct parameter names (prompt, model, aspectRatio, outputMimeType)
  - ✅ Response correctly extracts and displays image

**Checkpoint**: All 3 user stories are fully functional, tested, and comply with API contract

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation

- [ ] T027 [P] Run type checking: `pnpm typecheck`
- [ ] T027b [P] Run linting: `pnpm lint`
- [ ] T028 [P] Run unit tests: `pnpm test`
- [ ] T029 Run e2e tests: `pnpm test:e2e` (builds app, runs Playwright tests with single worker)
- [ ] T030 [P] Verify quickstart.md scenarios:
  - Scenario 1: Save and view key ✓
  - Scenario 2: Remove key ✓
  - Scenario 3: Generate image ✓
  - Scenario 4: API key error handling ✓
  - Scenario 5: Missing key handling ✓
  - Scenario 6: Migration behavior ✓

- [ ] T031 Test with real Nano Banana key (free tier from Google AI Studio)
- [ ] T032 Code review: Verify Zustand store updates are correct, encryption works, error messages clear
- [ ] T033 [P] Update documentation: Note that Pollinations is no longer used, Nano Banana/Gemini is now image provider

**Final Checkpoint**: All stories complete, tests passing, quickstart validated, ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup → BLOCKS all user stories
- **User Story 1 (Phase 3, P1)**: Depends on Foundational
- **User Story 2 (Phase 4, P1)**: Depends on Foundational; can run in parallel with US1
- **User Story 3 (Phase 5, P2)**: Depends on US1 + US2 (needs both working to test contracts)
- **Polish (Phase 6)**: Depends on all user stories

### User Story Parallelization

Once Foundational (Phase 2) completes:
- US1 and US2 can run in parallel (different files: hooks vs ConnectDialog)
- US3 requires US1 + US2 complete first (tests the integrated system)

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002 and T003 can run in parallel

**Phase 2 (Foundational)**:
- T004 (state) and T005 (API base) and T006 (backend routes) can run in parallel (different files)
- T008 (encryption) once T007 (schema) is understood

**Phase 3 (US1)**:
- T009 (Gemini API) and T010 (useSuggestions hook) can start in parallel
- T012, T013 (error handling, rate limiting) can run in parallel

**Phase 4 (US2)**:
- T015 (ConnectDialog UI) and T016 (saveKey backend) and T017 (removeKey backend) can run in parallel
- T019 (state management) once T016/T017 ready

**Phase 6 (Polish)**:
- T027, T027b, T028, T029, T030, T033 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Once Foundational (Phase 2) complete, launch US1 in parallel:
Task T009: Implement generateImageWithGemini() in api/googleGeminiApi.ts
Task T010: Update useSuggestions.ts to call Gemini API

# Then sequentially:
Task T011: Migration logic
Task T012: Error handling  
Task T013: Rate limiting
Task T014: Integration test
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL)
3. ✅ Complete Phase 3: User Story 1
4. ✅ Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Image generation + key management working
6. **DEPLOY MVP**: Can launch feature now with core functionality
7. Polish Phase 6 (optional for initial release)

### Full Feature (Add Phase 5 for Complete Testing)

1. Phases 1-4 as above (MVP)
2. Complete Phase 5: User Story 3 (API contract compliance)
3. Complete Phase 6: Polish
4. Full release with complete test coverage

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label (US1, US2, US3) maps task to user story for traceability
- Each user story is independently completable and testable
- Verify each phase checkpoint before moving to next
- **Commit after Phase 2 (Foundational)**, then after each user story phase
- Stop at any checkpoint to validate independently
- Rate limiting (T013) is important: 100 req/min quota, 10 concurrent max per spec
- Test with free Google AI Studio key (no billing required)
- Deprecate Pollinations code gradually (don't delete yet per spec "out of scope")
