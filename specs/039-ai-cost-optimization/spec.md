# Feature Specification: AI Model Cost Optimization

**Feature Branch**: `039-ai-cost-optimization`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "i need you to search the best way to save money using the ai models. I already spent 1$ just calling a few times the google gemini"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduce Dev/Test API Costs (Priority: P1)

Developer runs application in test/development mode and wants to minimize API spend while validating features. Currently, all AI calls (text, audio, image) hit the real API even during repeated testing cycles, causing unnecessary expense.

**Why this priority**: Reduces operational costs immediately; every developer running tests burns money. Unblocks cost-effective development iteration.

**Independent Test**: Enable mock mode across all AI operations. Developer runs test suite, validates that no real API calls are made, costs drop to zero. Feature complete when mocking works for text generation, audio generation, and image generation independently.

**Acceptance Scenarios**:

1. **Given** developer sets `MOCK_AI=1` environment variable, **When** app generates word definition, **Then** mock definition returned, zero API call made
2. **Given** developer sets `MOCK_AI=1`, **When** app generates pronunciation audio, **Then** mock audio returned, zero API call made
3. **Given** developer sets `MOCK_AI=1`, **When** app generates word image, **Then** mock image returned, zero API call made
4. **Given** developer wants to test image SDK integration without mocking, **When** `MOCK_AI` not set, **Then** image generation uses real API, text/audio can still be mocked separately
5. **Given** developer disables `MOCK_AI=1`, **When** app runs normally, **Then** real API calls work as before

---

### User Story 2 - Model Selection & Fallbacks (Priority: P2)

User or developer can choose cheaper/faster models for image generation when lower quality is acceptable. If primary model fails (rate limit, timeout), system falls back gracefully without making duplicate requests.

**Why this priority**: Enables cost control by user preference; provides resilience. Reduces waste from failed requests retried unnecessarily.

**Independent Test**: Set custom cheaper image model in settings. Generate image, verify cheaper model used. Trigger rate-limit error, verify fallback handled gracefully. No retry storms.

**Acceptance Scenarios**:

1. **Given** user selects cheaper image model in settings, **When** generating image, **Then** that model used, cost lower than default
2. **Given** API returns 429 (rate limit), **When** user retries image generation, **Then** user sees error message, no silent retry queue builds up
3. **Given** image generation fails with network error, **When** user retries, **Then** clean retry, no ghost requests to API

---

### User Story 3 - Usage Monitoring & Alerts (Priority: P3)

User can see estimated/actual costs of API usage and receives alerts when approaching spending threshold. Helps users make informed decisions about feature usage.

**Why this priority**: Cost transparency; prevents surprise bills. Valuable for long-term cost control but not critical for initial save.

**Independent Test**: Log all API calls with estimated cost. Display cumulative cost in UI or logs. Trigger alert when threshold exceeded.

**Acceptance Scenarios**:

1. **Given** user generates 5 images at 1 cent each, **When** checking cost log, **Then** total shows 5 cents
2. **Given** spending threshold set to 50 cents, **When** user exceeds it, **Then** alert shown
3. **Given** cost logging enabled, **When** user generates definition, **Then** call logged with model name and estimated cost

---

### Edge Cases

- What happens if developer forgets to set `MOCK_AI=1` during test run? (Answer: Real API called, costs accrue—intent is to avoid this, so clear docs/warnings)
- What if mock data is insufficient to pass feature tests? (Answer: User can disable mock for specific operations while keeping others mocked)
- What if API response time is very slow (timeout) during fallback? (Answer: Don't retry automatically; show error; user decides)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support `MOCK_AI=1` environment variable to mock all AI operations (text, audio, image)
- **FR-002**: When `MOCK_AI=1` set, system MUST return valid mock data (definitions, audio bytes, image bytes) without making API calls
- **FR-003**: When `MOCK_AI=1` not set, system MUST make real API calls as before
- **FR-004**: User MUST be able to select custom image model in Connect AI settings (imageModel field already exists)
- **FR-005**: System MUST use user-selected imageModel if set (non-empty), otherwise use default model
- **FR-006**: When API call fails (401, 429, timeout, network), system MUST return specific error type, not generic "failed"
- **FR-007**: System MUST NOT retry API calls automatically on failure; only user-initiated retry should call API again
- **FR-008**: System MUST log all API calls with model name, timestamp, and operation type (text/audio/image)
- **FR-009**: System SHOULD estimate cost per API call based on model type (text cheaper than image)

### Key Entities

- **MockData**: Pre-defined responses for definitions, audio, images used when `MOCK_AI=1`
- **APICallLog**: Record of each API call: timestamp, model, operation, cost estimate, success/failure
- **UserModel**: Stores user-selected imageModel preference (already exists in settings)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can run test suite with `MOCK_AI=1` and zero API calls incurred (measurable via logs and zero API cost)
- **SC-002**: Switching between mock and real API mode takes <1 second (no restart required)
- **SC-003**: Mock data is realistic enough to validate UI/workflows (definitions are readable, images display without error, audio plays)
- **SC-004**: When using cheaper model, cost per image generation is at least 20% lower than default
- **SC-005**: User can see actual API cost in logs/UI within 30 seconds of operation completing
- **SC-006**: No duplicate API calls made on transient failures (timeout, network error)

## Assumptions

- Developer/user has access to environment variables or settings UI to toggle cost control features
- Mock data is acceptable for testing (does not need to be AI-generated; static is fine)
- Google Generative AI SDK pricing is stable; cost estimates can be hardcoded per model
- User will read docs/UI about cost control options
- Existing error handling framework (AiError) is sufficient for specific error types
- `MOCK_AI` mode is development-only; production release will remove or restrict this feature
