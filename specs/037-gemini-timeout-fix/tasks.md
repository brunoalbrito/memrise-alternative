# Tasks: Gemini Timeout Fix

**Input**: Design documents from `/specs/037-gemini-timeout-fix/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature includes validation tasks (user story testing). Implementation is minimal (constants-only).

**Organization**: Tasks are grouped by user story to enable independent testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify branch and dependencies are in place

- [x] T001 Verify branch `037-gemini-timeout-fix` is checked out
- [x] T002 Verify `pnpm install` completed (Electron binary and SQLite module available)
- [x] T003 Verify Google API key is configured in test environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update timeout constants in AiService - MUST complete before any user story testing

**Critical**: No user story testing can begin until this phase completes and code is deployed

### Implementation Tasks

- [x] T004 Update `TEXT_TIMEOUT_MS` constant in `electron/services/ai/service.ts` line 14: change from 30_000 to 45_000
- [x] T005 [P] Create `AUDIO_TIMEOUT_MS` constant in `electron/services/ai/service.ts` after line 14: value 60_000
- [x] T006 [P] Create `DESCRIBE_SCENE_TIMEOUT_MS` constant in `electron/services/ai/service.ts` after line 15: value 30_000
- [x] T007 Update `IMAGE_TIMEOUT_MS` constant in `electron/services/ai/service.ts` line 16: change from 45_000 to 90_000
- [x] T008 Update `wordAudio()` method in `electron/services/ai/service.ts` line 189: change `TEXT_TIMEOUT_MS` to `AUDIO_TIMEOUT_MS` in the `post()` call
- [x] T009 Update `describeScene()` method in `electron/services/ai/service.ts` line 209: change `IMAGE_TIMEOUT_MS` to `DESCRIBE_SCENE_TIMEOUT_MS` in the `post()` call
- [x] T010 Build project: `pnpm build` to verify TypeScript compilation succeeds with no errors
- [x] T011 Type-check: `pnpm typecheck` to verify strict mode compliance
- [x] T012 Lint: `pnpm lint` to verify ESLint passes with no errors

**Checkpoint**: Foundation complete - timeout constants updated, code compiled and linted. Ready for user story testing.

---

## Phase 3: User Story 1 - Reliable TTS Audio Generation (Priority: P1) 🎯 MVP

**Goal**: Verify that audio generation completes within 60-second timeout without 499 errors

**Independent Test**: Can be fully tested by generating audio for 20 random words and verifying all complete without 499 errors

### Validation Tasks for User Story 1

- [ ] T013 [P] [US1] Manual test: Start dev app `pnpm dev:samples`, navigate to any word, click "Generate Audio"
- [ ] T014 [P] [US1] Manual test: Verify audio generates successfully within 60 seconds
- [ ] T015 [P] [US1] Manual test: Verify no "Image generation failed" or "Request timeout" error messages appear
- [ ] T016 [US1] Generate audio for 5+ different words in different languages, verify all succeed without 499 errors
- [ ] T017 [US1] Check Electron logs: `DEBUG=membetter:ai pnpm dev:samples` - verify `[Gemini] Audio generated successfully` logs appear
- [ ] T018 [US1] Verify audio file is valid WAV format by clicking play button and hearing pronunciation

**Checkpoint**: User Story 1 complete - TTS audio generation now reliably works with 60-second timeout.

---

## Phase 4: User Story 2 - Reliable Image Generation (Priority: P1)

**Goal**: Verify that image generation completes within 90-second timeout without cascade timeout failures

**Independent Test**: Can be fully tested by generating 10 images for different sentences and verifying all complete without 499 errors

### Validation Tasks for User Story 2

- [ ] T019 [P] [US2] Manual test: Start dev app `pnpm dev:samples`, navigate to word with definition, select a sentence
- [ ] T020 [P] [US2] Manual test: Click "Generate Image" and wait for image to render
- [ ] T021 [P] [US2] Manual test: Verify image completes within 90 seconds (note start and end times)
- [ ] T022 [US2] Generate images for 5+ different sentences, verify all complete without 499 errors
- [ ] T023 [US2] Generate images rapidly in succession (5+ images), verify each gets independent timeout window
- [ ] T024 [US2] Check Electron logs: verify separate `DESCRIBE_SCENE_TIMEOUT_MS` (30s) and `IMAGE_TIMEOUT_MS` (90s) are used
- [ ] T025 [US2] Measure timing: Scene description should complete within 30s, image drawing should use remaining time from 90s budget
- [ ] T026 [US2] Verify cascade timeout works: if scene description takes 25s, image drawing should have ~65s remaining (not timeout immediately)

**Checkpoint**: User Story 2 complete - image generation now reliably works with isolated 30s+60s timeouts.

---

## Phase 5: User Story 3 - Reliable Text Definition Generation (Priority: P1)

**Goal**: Verify that text definition generation completes within 45-second timeout

**Independent Test**: Can be fully tested by generating text definitions for 20 random words in different languages and verifying all complete without 499 errors

### Validation Tasks for User Story 3

- [ ] T027 [P] [US3] Manual test: Start dev app `pnpm dev:samples`, navigate to any word in Study mode
- [ ] T028 [P] [US3] Manual test: Wait for definition + sentences + IPA to load (should complete within 45 seconds)
- [ ] T029 [P] [US3] Manual test: Verify text appears with no "request timeout" errors
- [ ] T030 [US3] Generate text definitions for 10+ different words in different languages, verify all succeed without 499 errors
- [ ] T031 [US3] Generate definitions for complex words/phrases, verify 45-second timeout is adequate even under slow network
- [ ] T032 [US3] Check Electron logs: verify `[Gemini] Definition generated successfully` logs appear for all requests
- [ ] T033 [US3] Verify all required text fields present: definition (in target language), 3 sentences, IPA, and best sentence index

**Checkpoint**: User Story 3 complete - text definition generation now reliably works with 45-second timeout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and integration

- [ ] T034 [P] Run quickstart.md validation (Scenario 1: Text, Scenario 2: Audio, Scenario 3: Image)
- [ ] T035 [P] Run all e2e tests: `pnpm test:e2e` - verify data isolation guard passes and no filesystem pollution
- [ ] T036 [P] Run unit tests: `pnpm test` - verify all existing tests still pass
- [ ] T037 [P] Verify no 499 errors in application logs across all AI feature flows
- [ ] T038 Run full validation: `pnpm dev:samples`, test all three user story flows (text + audio + image) sequentially
- [ ] T039 Verify error handling: intentionally use invalid API key, verify appropriate error message (not 499)
- [ ] T040 Performance check: measure actual request times for text (should be 5-15s), audio (should be 15-30s), image (should be 30-60s)
- [ ] T041 Documentation: verify quickstart.md success criteria are all met
- [ ] T042 Commit code: `git add electron/services/ai/service.ts` and create conventional commit with speckit workflow

**Checkpoint**: All user stories validated, no 499 errors, ready for PR/merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - ⚠️ **CRITICAL**: Must complete Phase 2 before any user story testing begins
  - Code must compile, lint pass, and constants be updated
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - Can run in parallel (different test scenarios, independent validation)
  - Or sequentially by priority (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Audio)**: Independent after Foundational - No dependencies on US2 or US3
- **User Story 2 (Image)**: Independent after Foundational - No dependencies on US1 or US3
- **User Story 3 (Text)**: Independent after Foundational - No dependencies on US1 or US2
- All 3 stories can be tested in parallel once Foundational is complete

### Within Each Phase

- **Phase 2**: Constant updates can be done sequentially (single file, logical grouping)
  - Then compile/lint/typecheck verify all changes work together
- **Phases 3-5**: All validation tasks within a story can run in parallel
  - Different test scenarios on independent code paths
- **Phase 6**: Polish tasks marked [P] can run in parallel

---

## Parallel Opportunities

### Setup Phase
- No parallelization needed (3 simple verification tasks)

### Foundational Phase
- All constant creation tasks (T005, T006) can run in parallel (different constants)
- Compile/lint/typecheck (T010-T012) must run sequentially after code changes complete

### User Story Testing (Phases 3-5)
- **All 3 user stories can be tested in parallel**:
  - Developer A: Test User Story 1 (audio) - T013 to T018
  - Developer B: Test User Story 2 (image) - T019 to T026
  - Developer C: Test User Story 3 (text) - T027 to T033
- **Within each story**, validation tasks marked [P] can run in parallel:
  - Manual tests (T013-T015) independent
  - Multiple word/sentence generation tests (T016, T022, T030) can overlap
  - Log verification (T017, T024, T032) independent
  - Timing measurements can run concurrently

### Polish Phase
- Quickstart, e2e tests, unit tests (T034-T036) marked [P] can run in parallel
- Final validation and performance check (T038-T040) sequential after tests pass

---

## Parallel Example: User Story 1 Audio Testing

```bash
# All manual validation tests can run together:
Task: T013 Start dev app and click Generate Audio
Task: T014 Verify audio generates within 60s
Task: T015 Verify no error messages appear
Task: T016 Generate audio for 5+ words (concurrent generation)
Task: T017 Check logs show successful generation
Task: T018 Verify audio files are valid WAV
```

---

## Parallel Example: All User Stories Concurrently

Once Foundational (Phase 2) is complete:

```bash
# Team of 3 developers, working in parallel:

Developer A:
  - T013-T018: Test User Story 1 (Audio)

Developer B:
  - T019-T026: Test User Story 2 (Image)

Developer C:
  - T027-T033: Test User Story 3 (Text)

When all 3 story tests complete:
  - All together: T034-T042 Polish & final validation
```

---

## Implementation Strategy

### MVP First (All User Stories Together)

1. **Complete Phase 1**: Setup ✓ (5 min)
2. **Complete Phase 2**: Foundational - update constants ✓ (10 min)
3. **Complete Phases 3-5**: Validate all 3 user stories ✓ (parallel: 30 min each = 30 min total with 3 developers, or 90 min sequential)
4. **Complete Phase 6**: Polish & validation ✓ (20 min)

**Total time**: ~45 min (parallel) to ~125 min (sequential, single developer)

**All features shipped together** - no incremental releases needed since all changes are in one file and all are required for full fix.

### Alternative: Sequential User Story Approach

1. Phase 1 & 2: Setup + Foundational (15 min)
2. Phase 3: Test US1 (Audio) → Can ship "Audio now works" (30 min)
3. Phase 4: Test US2 (Image) → Can ship "Images now work" (30 min)
4. Phase 5: Test US3 (Text) → Complete (30 min)
5. Phase 6: Polish (20 min)

**NOT RECOMMENDED** - all timeout constants needed together for complete fix. Shipping incrementally would leave users with partially fixed experience.

---

## Validation Checkpoints

✅ **After Phase 2 (Foundational)**:
- Code compiles without errors
- TypeScript type-check passes
- ESLint passes
- Constants updated in source file

✅ **After Phase 3 (User Story 1)**:
- Audio generation works without 499 errors
- TTS completes within 60-second timeout

✅ **After Phase 4 (User Story 2)**:
- Image generation works without 499 errors
- Scene description and image drawing have isolated timeouts

✅ **After Phase 5 (User Story 3)**:
- Text definition generation works without 499 errors
- Definitions complete within 45-second timeout

✅ **After Phase 6 (Polish)**:
- All 3 user stories work independently
- No 499 errors in any flow
- Quickstart validation passes
- Ready to merge

---

## Notes

- All timeout constants in single file (electron/services/ai/service.ts)
- No new files, models, or UI changes required
- Each user story is independently testable
- Error handling unchanged - timeout behavior is internal detail
- Backwards compatible - no caller code changes needed
- Implementation is "constants only" - no business logic changes
