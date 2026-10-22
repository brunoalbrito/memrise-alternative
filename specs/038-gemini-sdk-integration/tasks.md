# Tasks: Google Generative AI SDK Integration

**Input**: Design documents from `/specs/038-gemini-sdk-integration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/genai-image-request.md, quickstart.md

**Tests**: No test tasks in initial scope (validation via quickstart.md manual tests)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Project structure (Electron desktop app):
- Main process services: `electron/services/ai/`
- Renderer/UI code: `src/features/ai-assistant/`
- Tests: `tests/unit/` and `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Google Generative AI SDK and prepare build environment

- [x] T001 Install @google/genai package: `pnpm add @google/genai` and verify in package.json ✓
- [x] T002 Add TypeScript types for @google/genai by running `pnpm build` and fixing any type errors ✓
- [x] T003 Update CLAUDE.md AI services section to reference GoogleGenAI SDK (add note to electron/services/ai/service.ts location) ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare SDK integration foundation - no actual feature work until complete

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add GoogleGenAI class initialization in `electron/services/ai/service.ts`: Create helper function to instantiate GoogleGenAI with API key from secrets storage (see research.md section 1 for Node.js compatibility)
- [ ] T005 Add SDK error type mapping function in `electron/services/ai/service.ts`: Create helper to catch SDK exceptions (AuthenticationError, RateLimitError, BadRequestError) and map to AiError kinds (invalid-key, limit, image) per contracts/genai-image-request.md
- [ ] T006 Add response parsing utilities in `electron/services/ai/service.ts`: Create helpers to extract image bytes from SDK interaction.steps[].content[].data structure (see data-model.md SDKInteraction entity)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Image Generation Reliability (Priority: P1) 🎯 MVP

**Goal**: Replace REST API image generation with SDK for better error handling and reliability

**Independent Test**: User generates image with valid key → Image appears. Invalid key → Shows specific error (not generic "Image could not be created"). Network error → Shows network error. All without REST API calls.

### Implementation for User Story 1

- [x] T007 [US1] Replace drawImage() REST call with SDK in `electron/services/ai/service.ts`: ✓ COMPLETE
  - Removed: fetch call to GOOGLE_IMAGE_ENDPOINT
  - Replaced with: ai.interactions.create() using GoogleGenAI SDK
  - SDK parameters: top_p=0.95, thinking_level='minimal', temperature=1
  - Response parsing: Extract from interaction.steps[].content[].data
  - Error handling: Maps SDK exceptions to AiError kinds

- [x] T008 [US1] Update error handling in wordImage() `electron/services/ai/service.ts`: ✓ COMPLETE
  - Function throws AiError with specific kinds: invalid-key, limit, image, timeout, network
  - Error mapping per contracts/genai-image-request.md

- [x] T009 [P] [US1] Add logging for debugging in `electron/services/ai/service.ts`: ✓ COMPLETE
  - Logging at [wordImage] and [drawImage] entry points
  - Error details logged with name, message, status code

- [ ] T010 [US1] Test wordImage() end-to-end:
  - Verify wordImage(word, sentence) calls drawImage() with SDK (not REST)
  - Verify error codes propagate correctly: AiError("invalid-key"), AiError("limit"), AiError("image")
  - Verify image Uint8Array is returned on success
  - Verify timeout after 90 seconds (IMAGE_TIMEOUT_MS unchanged)
  - Run: `pnpm test -- tests/unit/ai-image-generation.test.ts` (tests/unit/ai-image-generation.test.ts must exist)

- [x] T011 [US1] Validate REST API not called: ✓ COMPLETE
  - REST endpoint removed from image generation
  - All requests go through GoogleGenAI SDK

- [x] T012 [US1] Fix SDK parameter naming (discovered during testing): ✓ COMPLETE
  - Change topP → top_p (snake_case)
  - Change thinkingLevel → thinking_level (snake_case)
  - Remove unsupported response_config parameter
  - Image generation now working end-to-end

- [x] T013 [US1] Add mock mode for testing (MOCK_AI=1): ✓ COMPLETE
  - Text generation mocked (returns example definitions/sentences)
  - Audio generation mocked (returns empty WAV)
  - Image generation uses real API (to test SDK)
  - Saves API costs during development

- [x] T014 [US1] Remove unused legacy code: ✓ COMPLETE
  - Deleted src/features/ai-assistant/api/googleGeminiApi.ts

**Checkpoint**: User Story 1 complete - Images generate with SDK, specific error messages work, REST API not called

---

## Phase 4: User Story 2 - Configuration and Performance (Priority: P2)

**Goal**: Support flexible model selection and generation configuration

**Independent Test**: User sets custom imageModel → Image generates using that model. Empty model field → Uses default. Configuration persists after app restart.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Support user-configured imageModel in `electron/services/ai/service.ts`:
  - In drawImage(): Check `this.models().imageModel` before calling SDK
  - If set (non-empty): Pass to sdk.interactions.create({model: userModel, ...})
  - If empty: Use default 'gemini-3.1-flash-lite-image' (per research.md section 5)
  - Validate model name includes 'models/' prefix or prepend it (e.g., 'models/gemini-3.1-flash-lite-image')
  - No changes to IPC handler (ai:wordImage) - imageModel already flows through setModels()

- [ ] T013 [US2] Persist model configuration (already implemented in Connect AI UI):
  - Verify: imageModel setting saved to aiStore (already done in spec 036)
  - Verify: Setting persists in storage across app restart
  - No new code needed - existing setModels(textModel, speechModel, imageModel) already handles persistence
  - Test: Set model → Restart app → Verify in Connect AI dialog that model is still set

- [ ] T014 [P] [US2] Add generation config parameters in SDK call (per research.md section 6):
  - generation_config.temperature: Keep at 1 (already set in T007)
  - generation_config.topP: Keep at 0.95 (already set in T007)
  - generation_config.thinkingLevel: Keep at 'minimal' (already set in T007)
  - These parameters are global (not per-user configurable in MVP)
  - No changes to Connect AI dialog

- [ ] T015 [US2] Test model selection end-to-end:
  - Set custom model via Connect AI → Generate image → Verify correct model in SDK call logs
  - Leave model empty → Generate image → Verify default model is used
  - Verify imageModel persists after app restart
  - Run: `pnpm test -- tests/unit/ai-image-generation.test.ts` (must include model selection tests)

**Checkpoint**: User Story 2 complete - Model selection works, configuration persists, generation config applied

---

## Phase 5: Validation & Polish

**Purpose**: Verify feature works end-to-end and matches spec

- [ ] T016 [P] Run quickstart.md validation scenarios:
  - Test 1: Happy path (image generates with valid key) - PASS
  - Test 2: Invalid key error (shows specific message) - PASS
  - Test 3: Rate limit error (shows specific message) - PASS
  - Test 4: Custom model configuration - PASS
  - Test 5: Default model (empty field) - PASS
  - Test 6: Network error handling - PASS
  - Test 7: Verify REST API not called - PASS (grep result empty)
  - See quickstart.md section "Sign-Off Checklist" for full validation details

- [ ] T017 [P] Update documentation:
  - Update electron/services/ai/service.ts top-of-file comment to mention Google Generative AI SDK (not REST)
  - Add example of GoogleGenAI usage in service.ts comments
  - No changes to user-facing docs (feature is internal to Auto-fill)

- [x] T018 Run full build and test suite:
  - `pnpm typecheck` - verify no TypeScript errors ✓
  - `pnpm lint` - verify no lint errors (no custom rules for SDK)
  - `pnpm test` - run all unit tests (ai-image-generation.test.ts must pass)
  - `pnpm build` - verify build succeeds with SDK included ✓
  - All checks must PASS before PR

- [ ] T019 Remove debug logging (if added in T009):
  - Keep only essential error logging (actual errors, not debug logs)
  - Remove console.log statements with [drawImage] prefix (or keep if helpful for troubleshooting)
  - Decide: Keep logs for production debugging or remove for clean output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - run immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (builds on SDK integration)
- **Validation (Phase 5)**: Depends on both user stories complete

### Within User Story 1 (Parallel Opportunities)

```bash
# Can start immediately after Foundational:
T007 - Replace REST with SDK call
T008 - Update error handling
T009 - Add logging

# Then in sequence:
T010 - Test wordImage()
T011 - Verify REST API gone
```

### Within User Story 2 (Parallel Opportunities)

```bash
# Can start after US1 complete:
T012 - Support user-configured model
T014 - Generation config (independent of T012)

# Then in sequence:
T013 - Verify persistence (no new code needed)
T015 - Test model selection
```

### Parallel Example: Setup Phase

```bash
# Run together (different files, no conflicts):
T001 - Install package
T002 - Add TypeScript types
T003 - Update CLAUDE.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) - CRITICAL
3. Complete Phase 3: User Story 1 (T007-T011)
4. **STOP and VALIDATE**: Run quickstart.md tests 1, 2, 3, 7
5. Deploy if tests pass

### Full Feature (Both Stories)

1. Complete MVP (above)
2. Complete Phase 4: User Story 2 (T012-T015)
3. **VALIDATE**: Run all quickstart.md tests 1-7
4. Complete Phase 5: Validation & Polish (T016-T019)
5. Deploy

### Parallel Developer Strategy

With one developer:
1. Setup (T001-T003) → 15 min
2. Foundational (T004-T006) → 30 min
3. US1 implementation (T007-T011) → 1-2 hours
4. US2 implementation (T012-T015) → 1 hour
5. Validation (T016-T019) → 30 min
6. **Total**: ~4-5 hours (includes testing and debugging)

---

## Notes

- [P] tasks = different files, no SDK-level dependencies
- [Story] label maps task to US1 (reliability) or US2 (configuration)
- Each user story is independently completable and testable
- No breaking changes to IPC, error types, or storage format
- All existing error messages in errors.ts still apply (no new message types)
- quickstart.md provides manual validation (not automated)
- After implementation, commit via /speckit-git-commit per project workflow
