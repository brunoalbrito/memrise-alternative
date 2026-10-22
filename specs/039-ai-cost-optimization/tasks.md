# Tasks: AI Model Cost Optimization

**Input**: Design documents from `/specs/039-ai-cost-optimization/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api-logging-schema.json, quickstart.md

**Tests**: Optional - e2e validation via quickstart.md manual tests (no automated unit tests required for MVP)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths

## Path Conventions

Project structure (Electron desktop app):
- Main process services: `electron/services/ai/`
- Renderer/UI code: `src/features/ai-assistant/`
- Tests: `tests/unit/` and `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add mock data constants and logging infrastructure

- [ ] T001 Create type definitions for APICallLog, MockData, ModelPricing in `electron/services/ai/service.ts` type section
- [ ] T002 Define MOCK_DATA constant (definitions, sentences, audio WAV, image JPEG) in `electron/services/ai/service.ts`
- [ ] T003 Define MODEL_PRICING constant map (model name → cost) in `electron/services/ai/service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add logging infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add `apiCallLogs` array to AiService class state in `electron/services/ai/service.ts`
- [ ] T005 Implement `logApiCall(log: APICallLog): void` method in AiService class
- [ ] T006 Implement `getApiCallLogs(): APICallLog[]` getter in AiService class
- [ ] T007 Implement `getCostSummary(): CostSummary` method to aggregate logs in AiService class
- [ ] T008 Implement `clearApiCallLogs(): void` method in AiService class (for testing)
- [ ] T009 Add `estimateCost(modelName: string): number` helper function using MODEL_PRICING map

**Checkpoint**: Logging framework ready - user story implementation can begin

---

## Phase 3: User Story 1 - Reduce Dev/Test API Costs (Priority: P1) 🎯 MVP

**Goal**: Enable MOCK_AI=1 environment mode to mock all AI operations (text, audio, image) without API calls.

**Independent Test**: Developer sets MOCK_AI=1, runs app, generates definition/audio/image, verifies no API calls made (validation via quickstart.md Test 1).

### Implementation for User Story 1

- [ ] T010 [P] [US1] Add MOCK_AI environment variable check to `wordText()` method in `electron/services/ai/service.ts`
  - If MOCK_AI=1: return mock definition/sentences/ipa from MOCK_DATA
  - Else: call real API (existing code)
  - Call logApiCall() with success=true, costEstimate=$0.01 for mock

- [ ] T011 [P] [US1] Add MOCK_AI environment variable check to `wordAudio()` method in `electron/services/ai/service.ts`
  - If MOCK_AI=1: return mock audio WAV from MOCK_DATA
  - Else: call real API (existing code)
  - Call logApiCall() with success=true, costEstimate=$0.02 for mock

- [ ] T012 [P] [US1] Add MOCK_AI environment variable check to `drawImage()` method in `electron/services/ai/service.ts`
  - If MOCK_AI=1: return mock image JPEG from MOCK_DATA
  - Else: call real API (existing code)
  - Call logApiCall() with success=true, costEstimate=$0.05 for mock

- [ ] T013 [US1] Add logging call to `wordText()`: after successful API or mock, log with operation="text", modelName from this.models().textModel
  - Log success=true, costEstimate from estimateCost(modelName)
  - Log word parameter for debugging

- [ ] T014 [US1] Add logging call to `wordAudio()`: after successful API or mock, log with operation="audio", modelName from this.models().speechModel
  - Log success=true, costEstimate from estimateCost(modelName)

- [ ] T015 [US1] Add logging call to `drawImage()`: after successful API or mock, log with operation="image", modelName from this.models().imageModel
  - Log success=true, costEstimate from estimateCost(modelName)
  - Log word and sentence parameters for context

- [ ] T016 [US1] Add error logging: wrap existing error handlers to log failed API calls
  - When AiError thrown, log with success=false, errorType=error.kind
  - Call logApiCall() before throwing

- [ ] T017 [US1] Verify existing tests still pass: `pnpm test` and `pnpm test:e2e`
  - Confirm no regressions from added mock checks
  - All existing functionality works (real API mode when MOCK_AI not set)

**Checkpoint**: User Story 1 complete - mock mode functional. Developer can set MOCK_AI=1 and run zero-cost tests. Validate via quickstart.md Test 1, Test 2, Test 8.

---

## Phase 4: User Story 2 - Model Selection & Fallbacks (Priority: P2)

**Goal**: Support user-configured image model selection; gracefully handle API failures without retries.

**Independent Test**: User selects custom cheaper image model, generates image, cost is lower. Rate limit error handled gracefully (no retry storm). Validate via quickstart.md Test 3, Test 5, Test 6.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Ensure `drawImage()` reads user-selected `this.models().imageModel` from settings
  - If imageModel is set (non-empty): use it as model name
  - Else: use default 'gemini-3.1-flash-lite-image'
  - Pass to SDK: `ai.interactions.create({ model: userModel ? `models/${userModel}` : ... })`
  - (Already implemented in spec 038; verify it works)

- [ ] T019 [US2] Verify error handling for rate limits (429):
  - Existing code maps 429 to AiError("limit")
  - Confirm NO automatic retry in error handler
  - Confirm user sees error message, can manually retry via UI

- [ ] T020 [US2] Verify error handling for network errors:
  - Existing code maps network errors to AiError("network")
  - Confirm NO automatic retry queuing
  - User can manually retry after fix

- [ ] T021 [US2] Add validation in `drawImage()` for user-selected model:
  - If modelName is provided, validate it's a string (minimal check)
  - Log invalid model name to console (don't throw; use default instead)

- [ ] T022 [US2] Verify logging includes modelName in all error cases:
  - When API fails with 429, log operation="image", modelName, success=false, errorType="limit"
  - Cost estimate still applied (estimate based on model that was attempted)

**Checkpoint**: User Story 2 complete - model selection works, fallbacks graceful. Validate via quickstart.md Test 3 (custom model), Test 4 (persistence), Test 5 (rate limit), Test 6 (network).

---

## Phase 5: User Story 3 - Usage Monitoring & Alerts (Priority: P3)

**Goal**: Log all API calls with costs; provide cost summary for transparency.

**Independent Test**: User generates 5 images, checks logs, sees cumulative cost. Validate via quickstart.md Test 7.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Add IPC handler `ai:getCostSummary` in main process
  - Returns result of AiService.getCostSummary()
  - Renderer can call via `ipcRenderer.invoke("ai:getCostSummary")` to display costs

- [ ] T024 [P] [US3] Add IPC handler `ai:getApiCallLogs` in main process
  - Returns result of AiService.getApiCallLogs()
  - Renderer can query logs for debugging

- [ ] T025 [P] [US3] Add IPC handler `ai:clearApiCallLogs` in main process (development feature)
  - Calls AiService.clearApiCallLogs()
  - Allows developer to reset logs between test runs

- [ ] T026 [US3] (Optional) Create simple cost display in developer console
  - Log cost summary to console after every API call: `console.log(`[Cost] ${summary.totalCost.toFixed(2)} USD for ${summary.totalCalls} calls`)`
  - Or add to app's debug menu if UI has one

- [ ] T027 [US3] (Optional) Add cost alert if threshold exceeded
  - If cumulative cost > configurable threshold (e.g., $1.00), log warning: `console.warn("[Cost Alert] API costs exceed $1.00 threshold: $X.XX")`
  - Can be enabled via environment variable: `COST_ALERT_THRESHOLD_USD=1.00 pnpm dev`

**Checkpoint**: User Story 3 complete - cost monitoring visible. Developer can see all API calls logged, cumulative costs, breakdown by operation/model. Validate via quickstart.md Test 7.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, testing, documentation updates

- [ ] T028 Run quickstart.md validation scenarios (manual e2e tests)
  - Test 1: Mock mode all operations
  - Test 2: Real mode API calls
  - Test 3: Image model selection
  - Test 4: Model persistence
  - Test 5: Rate limit handling
  - Test 6: Network error handling
  - Test 7: Cost logging
  - Test 8: Mode switching
  - All 8 must pass

- [ ] T029 [P] Update `electron/services/ai/service.ts` comment header to mention cost optimization and MOCK_AI=1 feature
  - Add: "Supports MOCK_AI=1 environment variable for zero-cost testing"
  - Add: "All API calls logged with cost estimates"

- [ ] T030 [P] Verify no breaking changes: `pnpm typecheck` and `pnpm lint`
  - TypeScript compilation must succeed
  - ESLint must pass (no custom rules)

- [ ] T031 [P] Verify existing e2e tests still pass: `pnpm test:e2e`
  - All 42+ existing tests must PASS
  - No regressions in image generation, text, audio

- [ ] T032 Update CLAUDE.md (if needed) to document MOCK_AI=1 environment variable
  - Add section: "Cost Optimization (Spec 039)"
  - Document: `MOCK_AI=1 pnpm dev` for zero-cost testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - run immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion
- **User Story 3 (Phase 5)**: Depends on Foundational (independent of US1/US2)
- **Polish (Phase 6)**: Depends on all user stories desired for MVP

### Parallel Opportunities

**Phase 1 Setup**: All tasks independent (different constants), can run in parallel:
- T001, T002, T003 can be done together

**Phase 2 Foundational**: Tasks T004-T009 have dependencies:
- T004 (state) must be done first
- T005-T009 depend on T004, but can run in parallel once T004 done

**Phase 3 User Story 1**: Tasks have dependencies:
- T010, T011, T012 (add MOCK_AI checks) are independent, can run in parallel
- T013, T014, T015 (logging to real methods) depend on T010/T011/T012
- T016 (error logging) can run with T013-T015
- T017 (testing) done last

**Phase 5 User Story 3**: IPC handlers (T023-T025) can be done in parallel; console logging (T026-T027) after.

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types, constants, pricing map) - 30 min
2. Complete Phase 2: Foundational (logging framework) - 45 min
3. Complete Phase 3: User Story 1 (mock mode) - 1 hour
4. Complete Phase 4: User Story 2 (model selection, fallbacks) - 30 min
5. **VALIDATE**: Run quickstart.md Tests 1-6, run `pnpm test:e2e` - 15 min
6. **DEPLOY MVP**: Spec 039 US1 + US2 complete - cost reduction working

Total: ~3.5 hours for MVP

### Full Feature (All 3 User Stories)

1. Complete MVP as above
2. Complete Phase 5: User Story 3 (cost monitoring) - 45 min
3. Run quickstart.md Test 7 - 5 min
4. Complete Phase 6: Polish & validation - 30 min
5. **DEPLOY FULL**: Spec 039 complete with cost transparency

Total: ~5 hours for complete feature

---

## Notes

- [P] tasks = independent, no SDK-level dependencies
- [Story] label = maps task to US1, US2, or US3
- Each user story independently testable; can deploy MVP with just US1
- No breaking changes to existing IPC or error types
- All existing error handling (AiError framework) still applies
- MOCK_AI mode is development-only; production release removes or restricts
- Cost estimates are hardcoded per model; can refactor to dynamic pricing later

---

## Sign-Off Checklist

- [ ] Phase 1 (Setup) complete - types, constants, pricing defined
- [ ] Phase 2 (Foundational) complete - logging framework working
- [ ] Phase 3 (US1) complete - mock mode functional for text, audio, image
- [ ] Phase 4 (US2) complete - model selection works, fallbacks graceful
- [ ] Phase 5 (US3) complete - cost monitoring logs visible (optional for MVP)
- [ ] Phase 6 (Polish) complete - all tests pass, no regressions
- [ ] All quickstart.md validation scenarios PASS (8/8)
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm test:e2e` PASS (42+ tests)
- [ ] Ready for commit and PR to main
