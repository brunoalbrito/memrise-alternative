# Feature Specification: Gemini Timeout Fix

**Feature Branch**: `037-gemini-timeout-fix`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Fix 499 status code responses from Google Gemini API by adjusting timeouts for Gemini 3.8 Flash and Gemini 3.8 Flash TTS models"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable TTS Audio Generation (Priority: P1)

User generates pronunciation audio for a word. Currently, TTS requests timeout after 30 seconds because the text timeout is used for audio generation, but TTS is computationally more expensive and requires more time.

**Why this priority**: Audio is critical for pronunciation learning. Timeouts break the primary study flow and frustrate users. This is the core blocker for TTS reliability.

**Independent Test**: Can be fully tested by generating audio for 20 random words and verifying all complete without 499 errors.

**Acceptance Scenarios**:

1. **Given** user is on word suggestion screen, **When** user clicks "Generate Audio" for a word, **Then** audio completes within 60 seconds without 499 error
2. **Given** audio request is in progress, **When** 50 seconds have elapsed, **Then** request is still active (not aborted)
3. **Given** audio generation fails, **When** user retries, **Then** request uses appropriate timeout for retry attempt

---

### User Story 2 - Reliable Image Generation (Priority: P1)

User generates an image to illustrate a sentence. Currently, image generation times out because the total timeout (45s) is shared between describing the scene and drawing the image. If scene description takes 30+ seconds, drawing gets timeout immediately (499 error).

**Why this priority**: Visual learning is a core feature. Images failing breaks the study experience and suggests product instability. Users avoid using image generation.

**Independent Test**: Can be fully tested by generating 10 images for different sentences and verifying all complete without 499 errors.

**Acceptance Scenarios**:

1. **Given** user selects a sentence for image generation, **When** scene description is requested, **Then** scene description completes within 30 seconds
2. **Given** scene description completes, **When** image drawing is requested, **Then** image drawing completes within 60 seconds
3. **Given** total image workflow (describe + draw), **When** workflow is running, **Then** total time does not exceed 90 seconds
4. **Given** image generation fails with timeout, **When** user retries, **Then** request uses appropriate timeout for retry

---

### User Story 3 - Reliable Text Definition Generation (Priority: P1)

User generates text definitions for a word. Currently uses 30-second timeout, which is adequate for Gemini 3.8-flash but may be tight for complex requests or under load.

**Why this priority**: Text definitions are the foundation of the study feature. Users must be able to reliably get definitions to study.

**Independent Test**: Can be fully tested by generating text definitions for 20 random words in different languages and verifying all complete without 499 errors.

**Acceptance Scenarios**:

1. **Given** user enters a word, **When** definition is requested, **Then** definition completes within 45 seconds without 499 error
2. **Given** definition request is slow, **When** 40 seconds have elapsed, **Then** request is still active (not aborted)

---

### Edge Cases

- What happens when user makes image request during slow network? System should complete within extended timeout, not abort at 45 seconds
- How does system handle cascade timeouts? If describe-scene uses full 45-second allowance, draw-image should not timeout immediately
- What happens when user generates multiple images in rapid succession? Each request should get its own timeout window, not compete for shared pool

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST increase text generation timeout from 30 seconds to 45 seconds
- **FR-002**: System MUST implement separate audio timeout of 60 seconds (distinct from text timeout)
- **FR-003**: System MUST implement separate scene-description timeout of 30 seconds (used for describe-scene only)
- **FR-004**: System MUST increase image generation timeout from 45 seconds to 90 seconds
- **FR-005**: System MUST allocate timeout independently for scene description and image drawing within the image workflow (not share one 45-second pool)
- **FR-006**: System MUST apply new timeouts consistently across all API request paths (text, audio, image)
- **FR-007**: System MUST handle timeout exceptions gracefully, converting AbortSignal.timeout() to AiError with "timeout" kind

### Key Entities

- **TextTimeout**: Timeout for definition/description generation (45 seconds)
- **AudioTimeout**: Timeout for TTS audio generation (60 seconds)
- **ImageTimeout**: Timeout for image generation (90 seconds)
- **SceneDescriptionTimeout**: Timeout for scene description step (30 seconds)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 499 Client Closed Request errors from Google Gemini API reduce by 95% (monitored via error logs)
- **SC-002**: Text definition generation completes within 45 seconds for 99% of requests
- **SC-003**: Audio generation completes within 60 seconds for 99% of requests
- **SC-004**: Image generation completes within 90 seconds for 99% of requests (includes scene description + image drawing)
- **SC-005**: Scene description completes within 30 seconds for 98% of requests
- **SC-006**: No increase in user-reported timeouts or request failures after deployment
- **SC-007**: System handles concurrent requests (5+ simultaneous) without timeout interference

## Assumptions

- Timeouts are root cause of 499 errors (client AbortSignal.timeout() triggers premature connection close)
- Gemini 3.8-flash and 3.8-flash-tts models require more time than legacy models previously used
- Network latency is stable and predictable within these timeout windows
- Scene description and image drawing should not share a single timeout pool (independent windows)
- Existing error handling infrastructure correctly converts timeout exceptions to user-facing errors
- Current logging captures timeout events for monitoring post-deployment
