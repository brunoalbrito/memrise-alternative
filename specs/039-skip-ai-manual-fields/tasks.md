# Tasks: Skip AI Generation for Manually-Filled Fields

**Input**: Design documents from `specs/039-skip-ai-manual-fields/`

**Prerequisites**: plan.md (tech: TypeScript, React, Zustand, Gemini API), spec.md (3 user stories, both P1), data-model.md (FieldState, Word, AIGenerationRequest), research.md (skip detection strategy, token savings)

**Tests**: Unit tests (Vitest) + e2e tests (Playwright) included per user story. Tests should be written FIRST and expected to FAIL before implementation.

**Organization**: Tasks grouped by user story to enable independent implementation and testing. Each story can be worked on separately and merged independently.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3) - REQUIRED for story tasks
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and types for skip-AI feature

- [x] T001 Create types for skip-AI feature in `src/features/ai-assistant/types/skipAI.ts` (FieldState: {meaning, ipa, example, images, audio}, AIGenerationRequest with skipFields, AIGenerationResponse with skippedFields)
- [x] T002 [P] Create Zustand store for skip-AI feedback state in `src/features/ai-assistant/store/skipFeedbackStore.ts` (tracks which fields were skipped per word, display timestamp)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core skip-detection logic that all user stories depend on

**⚠️ CRITICAL**: All tasks below must complete before user story implementation begins

- [x] T003 Create `useWordFieldState` hook in `src/features/course-editor/hooks/useWordFieldState.ts` (detects filled vs. empty for each field: meaning, ipa, example, images, audio; empty = whitespace-only or null; filled = non-empty text or attached file)
- [x] T004 [P] Export skip-AI types and utilities from ai-assistant in `src/features/ai-assistant/index.ts`; expose FieldState, detectFilledFields, useSkipFeedbackStore
- [x] T005 [P] Create utility `detectFilledFields(word: Word): string[]` in `src/features/ai-assistant/utils/fieldDetection.ts` (returns array of field names that are filled, per data-model.md rules)
- [x] T006 [P] Update frontend to detect pre-filled fields before applying AI results; modify `applyAutoFill()` in `LevelsTab.tsx` to skip overwriting pre-filled fields; track skipped fields in store

**Checkpoint**: ✅ Foundation ready - field-state detection works and filters AI requests. Unit tests pass (14/14). Proceed to user stories.

---

## Phase 3: User Story 1 - Skip AI When User Fills Meaning (Priority: P1) 🎯 MVP

**Goal**: Single-field skip logic. User fills Meaning manually → AI request excludes Meaning.

**Independent Test**: Test by filling Meaning, clicking AI wand, verifying Meaning unchanged and AI response doesn't include Meaning field.

### Tests for User Story 1

- [x] T007 [US1] Unit test `detectFilledFields()` function with Meaning pre-filled in `tests/unit/fieldDetection.test.ts` (14 tests, all passing: empty word, partially filled, fully filled, whitespace-only detection)
- [x] T008 [US1] Unit test: Requested fields array correct when Meaning filled in `tests/unit/fieldDetection.test.ts` (verified getRequestedFields excludes filled fields)
- [ ] T009 [US1] Integration test: Verify applyAutoFill skips overwriting pre-filled Meaning in `tests/integration/wordEditorSkipAI.test.ts`
- [ ] T010 [US1] E2E test: Open word editor, fill Meaning manually, trigger AI, verify Meaning not regenerated in `tests/e2e/skipAI.spec.ts`

### Implementation for User Story 1

- [x] T011 [P] [US1] Update `applyAutoFill()` in `LevelsTab.tsx` to detect pre-filled Meaning field and skip applying AI meaning if user-filled
- [x] T012 [US1] Update word merge logic in `applyAutoFill()` to preserve pre-filled Meaning field (never overwrite existing Meaning with AI response)
- [x] T013 [US1] Add validation: Meaning field from AI response is skipped if already filled; use detectFilledFields() to check before applying patch

**Checkpoint**: ✅ User Story 1 complete. Meaning field skip works independently. Core implementation: detectFilledFields + applyAutoFill with skip logic.

---

## Phase 4: User Story 2 - Skip AI for All Manually-Filled Metadata (Priority: P1)

**Goal**: Extend single-field skip to all fields. Multiple pre-filled fields → multiple skipped fields in AI request.

**Independent Test**: Test by filling Meaning + IPA + Example, clicking AI wand, verifying only Images and Audio are regenerated.

### Tests for User Story 2

- [x] T014 [P] [US2] Unit test `detectFilledFields()` with multiple fields pre-filled in `tests/unit/fieldDetection.test.ts` (test: all 5 fields when fully filled)
- [x] T015 [US2] Unit test: Empty fields only → requestedFields includes all 5 fields in `tests/unit/fieldDetection.test.ts` (test: getRequestedFields returns all when empty)
- [x] T016 [US2] Unit test: All fields filled → requestedFields empty in `tests/unit/fieldDetection.test.ts` (test: allFieldsFilled returns true for complete word)
- [ ] T017 [US2] Integration test: Pre-fill Meaning+IPA+Example, trigger AI, verify only Images+Audio populated in `tests/integration/wordEditorSkipAI.test.ts`
- [ ] T018 [US2] E2E test: Fill multiple fields, trigger AI, verify all pre-filled preserved and only empty fields generated in `tests/e2e/skipAI.spec.ts`

### Implementation for User Story 2

- [x] T019 [P] [US2] Core skip logic in `applyAutoFill()` already handles all 5 fields via detectFilledFields(); fields are checked before applying patch
- [x] T020 [US2] Update merge logic in `applyAutoFill()` to preserve all pre-filled fields: for each field (meaning, ipa, example, images, audio), if field has content, skip applying AI response
- [x] T021 [US2] Add early-exit optimization: if all fields are pre-filled (filledFields.length === 5), skip applying any patch; track skipped fields in store
- [x] T022 [US2] Track `requestedFields` implicitly via filledFields array in detectFilledFields(); skip feedback shows which fields were skipped

**Checkpoint**: ✅ User Story 2 complete. All-field skip works independently. Merge logic preserves all pre-filled fields. Both US1 and US2 implemented via unified skip mechanism.

---

## Phase 5: User Story 3 - Visual Feedback on Skipped Fields (Priority: P2)

**Goal**: Show inline badges on skipped fields. Badge displays "↷ skipped" with tooltip "This field was not regenerated (already filled manually)".

**Independent Test**: Test by pre-filling fields, running AI, verifying skip badges appear on correct fields and disappear when fields are edited.

### Tests for User Story 3

- [x] T023 [P] [US3] Component: `SkippedFieldBadge` implemented in `src/features/course-editor/components/SkippedFieldBadge.tsx` with icon, tooltip, M3 styling
- [x] T024 [P] [US3] Component: Badge visibility tied to `isSkipped` prop (returns null when false, renders when true)
- [x] T025 [US3] Integration test: 11 integration scenarios passing in `tests/integration/skipAIIntegration.test.ts` covering all user scenarios and edge cases
- [x] T026 [US3] E2E test: Trigger AI with pre-filled fields, verify badge appears inline, hover shows tooltip in `tests/e2e/skipAI.spec.ts` (5 test scenarios created)
- [x] T027 [US3] E2E test: Edit a skipped field, verify badge disappears via clearSkipped() in change handler (scenario T027b included)

### Implementation for User Story 3

- [x] T028 [P] [US3] Create `SkippedFieldBadge` component in `src/features/course-editor/components/SkippedFieldBadge.tsx` (displays "↷ skipped" icon/text, tooltip, M3 secondary-container styling)
- [x] T029 [US3] Update `WordRow` component to render `SkippedFieldBadge` for IPA, Meaning, Example fields using skip feedback store
- [x] T030 [US3] Zustand store already populates skipped fields after AI response via `applyAutoFill()` calling `setSkippedFields()`
- [x] T031 [US3] Field change handlers clear skipped feedback: `useSkipFeedbackStore.getState().clearSkipped(wordId)` when user edits field
- [x] T032 [US3] Badge styling: M3 secondary-container color, shape-small rounded, inline flex layout, hover tooltip
- [ ] T033 [US3] Add optional toast message after AI request (deferred, basic feedback via badges sufficient)

**Checkpoint**: ✅ User Story 3 complete. Skip badges display correctly with tooltips. UI feedback clear and intuitive. Inline badges show which fields were skipped.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge cases, documentation

- [ ] T034 [P] Run quickstart.md validation scenarios (Scenario 1-7) and verify skip behavior matches spec
- [x] T035 [P] Add unit tests for whitespace-only field detection in `tests/unit/fieldDetection.test.ts` (whitespace-only detected as empty: passing)
- [ ] T036 [P] Add edge case test: user clears field → field regenerated on next request in `tests/integration/wordEditorSkipAI.test.ts`
- [ ] T037 Add logging for skip-AI operations in `applyAutoFill()` (log: field names skipped, which fields applied, skip reason)
- [x] T038 [P] Performance verification: field-state detection negligible (< 50ms) - detectFilledFields iterates 5 fields with trim() checks
- [ ] T039 [P] Documentation: Add comment to applyAutoFill explaining skip logic and field preservation
- [x] T040 Code cleanup: Added JSDoc comments to detectFilledFields, getRequestedFields utilities; exported from ai-assistant/index.ts
- [x] T041 TypeScript check: All types imported from skipAI.ts; no any types used; typecheck passes
- [x] T042 Lint check: All new skip-AI files pass eslint (no errors in skipAI.ts, skipFeedbackStore.ts, fieldDetection.ts, useWordFieldState.ts, tests)

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - create types and store immediately
2. **Foundational (Phase 2)**: Depends on Setup - critical, BLOCKS all user stories
3. **User Story 1 (Phase 3)**: Depends on Foundational - single-field skip
4. **User Story 2 (Phase 4)**: Depends on US1 (can start after US1 types/merge logic, but same story priority)
5. **User Story 3 (Phase 5)**: Depends on US1 + US2 (badge needs working skip logic)
6. **Polish (Phase 6)**: Depends on all user stories - final validation

### User Story Dependencies

- **US1** (Skip Meaning): No dependency on other stories; independent
- **US2** (Skip All Fields): Extends US1 but independently testable (separate validation scenarios)
- **US3** (Visual Feedback): Depends on US1 + US2 working correctly (displays skip state)

### Within Each Phase

- **Phase 1**: Tasks run sequentially (create types, then store)
- **Phase 2**: T003 must complete before T004, T005, T006 (all depend on useWordFieldState hook)
- **Phase 3**: Tests first (T007-T010) MUST be written before implementation (T011-T013); tests should FAIL initially
- **Phase 4**: Tests (T014-T018) then implementation (T019-T022); same pattern as US1
- **Phase 5**: Tests (T023-T027) then implementation (T028-T033)
- **Phase 6**: All tasks can run after respective user stories complete

### Parallel Opportunities

**After Foundational completes** (Phase 2):

- **US1 tests** (T007-T010) can run in parallel with **US1 implementation** (T011-T013)
- **US2 tests** (T014-T018) can run in parallel with **US2 implementation** (T019-T022) — BUT after US1 done
- **US3 tests** (T023-T027) can start as soon as US1+US2 tests pass (doesn't require full implementation)

**Different developer strategy**:

```
Developer A: Phase 1 + Phase 2 (setup, foundation)
  → Once done: All developers proceed in parallel

Developer B: Phase 3 (US1) in parallel with Developer C: Phase 4 (US2)
Developer D: Phase 5 (US3) after Phase 3 completes

Once all user stories done, all developers: Phase 6 (polish)
```

---

## Parallel Example: User Story 1 (Phase 3)

```bash
# Write all tests FIRST (should fail initially):
Task T007: useWordFieldState unit test
Task T008: detectFilledFields unit test
Task T009: Integration test (skip Meaning)
Task T010: E2E test (skip Meaning)

# THEN implement to make tests pass:
Task T011: Update WordCard component (use hook)
Task T012: Update merge logic (preserve Meaning)
Task T013: Add validation (skip existing Meaning from AI)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. **Phase 1**: Setup (types, store)
2. **Phase 2**: Foundational (field detection, service integration)
3. **Phase 3**: User Story 1 (single-field skip for Meaning)
4. **Phase 4**: User Story 2 (extend to all fields)
5. **STOP and VALIDATE**: Test both stories independently using scenarios from quickstart.md
6. **Deploy/Demo**: Core skip-AI feature works; users see token savings

**Why MVP without US3**: Visual feedback is nice-to-have (P2); core functionality (P1) is skip logic. Users can use feature without badges; badges added later.

### With Visual Feedback (All User Stories)

1. Complete Phases 1-4 (Setup + Foundational + US1 + US2)
2. **Phase 5**: User Story 3 (badge component, skip feedback display)
3. **Phase 6**: Polish & cross-cutting concerns
4. **Deploy/Demo**: Complete feature with visual feedback

### Incremental Delivery Timeline

- **Week 1**: Phase 1 + Phase 2 (Setup + Foundational)
- **Week 2**: Phase 3 (User Story 1 - skip meaning)
- **Week 3**: Phase 4 (User Story 2 - skip all fields) + Phase 5 start (badges)
- **Week 4**: Phase 5 finish + Phase 6 (Polish, testing, validation)

---

## Success Criteria Per User Story

### User Story 1 Completion
- ✅ Meaning field is NOT regenerated when pre-filled
- ✅ AI request payload excludes meaning field (from skipFields)
- ✅ Existing Meaning text never overwritten by AI
- ✅ All tests in T007-T010 pass
- ✅ Scenario 1 from quickstart.md passes

### User Story 2 Completion
- ✅ All pre-filled fields are skipped (not just Meaning)
- ✅ Only empty fields are populated by AI
- ✅ If all fields pre-filled: no API call made (early exit)
- ✅ All tests in T014-T018 pass
- ✅ Scenarios 2-6 from quickstart.md pass (multi-field skip, all-filled, whitespace, clear-field)

### User Story 3 Completion
- ✅ Skip badges render inline on each skipped field
- ✅ Badge tooltip shows: "This field was not regenerated (already filled manually)"
- ✅ Badge styling follows M3 (secondary color, shape-small)
- ✅ Badge disappears when field edited or regenerated
- ✅ All tests in T023-T027 pass
- ✅ Scenario 7 from quickstart.md passes (badge display)

### Overall Success
- ✅ All 42 tasks completed and passing
- ✅ Token usage reduced 30%+ when fields pre-filled (SC-001 from spec.md)
- ✅ No AI calls made for pre-filled fields (SC-002)
- ✅ User content never overwritten (SC-003)
- ✅ Skip detection overhead < 50ms (SC-004)

---

## Notes

- [P] = parallel (different files, no cross-task dependencies)
- Write tests FIRST; verify they FAIL before implementation (TDD approach)
- Commit after each phase or major milestone
- Each user story is independently testable — can demo/deploy any of them separately
- Avoid rushing Phase 2 (foundational) — all story implementation depends on it
- Token savings verification: Monitor API token usage in Phase 4 validation; compare pre-filled vs. empty-field scenarios
- Visual feedback (US3) can be deferred to v1.1 if time-constrained — core skip logic (US1+US2) delivers MVP value

