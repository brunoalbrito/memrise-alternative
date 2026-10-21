# Feature Specification: Replace REST API with Google Generative AI SDK for Image Generation

**Feature Branch**: `038-gemini-sdk-integration`

**Created**: 2026-10-21

**Status**: Draft

**Summary**: Migrate image generation from direct REST API calls to the official Google Generative AI SDK (`@google/genai`). This provides better type safety, error handling, and compatibility with Google's recommended practices.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Image generation reliability (Priority: P1)

The app generates images using the Google Generative AI SDK instead of direct REST API calls. This improves reliability and error handling by using the official SDK's built-in validation and error recovery.

**Why this priority**: Current REST API approach lacks proper error handling and response structure validation. SDK provides structured error handling and proper response parsing, reducing "Image could not be created" errors.

**Independent Test**: User enters word and sentence, presses "Create image". Image is generated using SDK's `interactions.create()` method. If generation succeeds, image is displayed. If it fails, user sees specific error message.

**Acceptance Scenarios**:

1. **Given** user has valid Google API key set, **When** user presses "Create image", **Then** app calls `GoogleGenAI.interactions.create()` and successfully extracts image data from response
2. **Given** API key is invalid, **When** user tries to generate image, **Then** app shows specific error (not generic "Image could not be created")
3. **Given** network request fails, **When** user tries to generate image, **Then** app shows network error, not generic image error
4. **Given** API rate limit is hit, **When** user tries to generate image, **Then** app shows rate limit error, not generic image error

---

### User Story 2 - Configuration and performance (Priority: P2)

The app uses proper generation configuration (temperature, topP, thinkingLevel) through the SDK, allowing for better control over image generation quality and performance.

**Why this priority**: Current hardcoded REST request lacks flexibility. SDK allows configuring model parameters for optimal results without code changes.

**Independent Test**: User can configure image generation parameters. Generation respects these settings. Image quality and generation time are consistent with configured parameters.

**Acceptance Scenarios**:

1. **Given** generation config with temperature=1 and thinkingLevel='minimal', **When** image is generated, **Then** request includes these parameters in SDK call
2. **Given** model name is set to `gemini-3.1-flash-lite-image`, **When** image is generated, **Then** SDK uses this model correctly

---

### Edge Cases

- What happens when SDK package is not installed? (Should fail at build/runtime with clear error)
- What happens when API response structure changes? (SDK handles versioning)
- How does system handle SDK throwing unexpected exceptions? (Should wrap in AiError)
- What if imageModel field is empty - should it use default from SDK?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST import and initialize `GoogleGenAI` class with API key from secrets storage
- **FR-002**: Image generation MUST use `ai.interactions.create()` method instead of direct fetch calls
- **FR-003**: Image generation request MUST include proper generation configuration: temperature, topP, thinkingLevel, outputMimeType, aspectRatio
- **FR-004**: App MUST extract image data from SDK response using the structure: `interaction.steps[].content[].data` for type='image'
- **FR-005**: App MUST handle SDK errors properly and map them to appropriate AiError kinds (invalid-key, timeout, network, image)
- **FR-006**: App MUST support custom imageModel selection passed to SDK interactions
- **FR-007**: App MUST validate that `@google/genai` package is available before attempting image generation
- **FR-008**: Image generation MUST use the response_modalities configuration for image output

### Key Entities

- **GoogleGenAI SDK**: Official Google package providing structured API access with error handling
- **Interaction**: SDK object representing a request-response cycle with steps containing model output
- **ImagePart**: Response part containing base64-encoded image data with mime type

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Image generation errors are specific and actionable (not generic "Image could not be created")
- **SC-002**: Failed API requests (auth, rate limit, network) show appropriate error messages
- **SC-003**: All image generation code uses SDK instead of direct REST API calls
- **SC-004**: Image generation response parsing handles SDK's structured response format
- **SC-005**: Generation configuration (temperature, topP, thinkingLevel) is properly passed to SDK

---

## Assumptions

- `@google/genai` package is compatible with Node.js 22.x (or higher as per project requirements)
- SDK error handling is comprehensive enough to replace custom REST error handling
- ImagePart structure in SDK response uses `data` field for base64 image (not `inlineData.data`)
- Model name `gemini-3.1-flash-lite-image` continues to be supported by Google API
- Generation config fields (temperature, topP, thinkingLevel) are accepted by SDK for all image models
- SDK is maintained and updated regularly by Google
