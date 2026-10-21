# Feature Specification: Single Google API Key with Flexible Model Selection

**Feature Branch**: `036-nano-banana-image-provider`

**Created**: 2026-10-21

**Status**: Complete

**Summary**: Replace Pollinations image generation with Google Gemini using a single Google API key for text, audio, and image generation. Support flexible model selection for all three services.

---

## User Scenarios & Testing

### User Story 1 - Unified API key management (Priority: P1)

The learner configures a single Google AI Studio API key in the "Connect AI" dialog that powers text generation, audio generation, and image generation. No separate image provider key is needed.

**Why this priority**: Reduces configuration burden and simplifies key management.

**Independent Test**: Save a single Google API key, verify Auto-fill generates text/audio/images using the same key, remove the key and verify all services request it again.

**Acceptance Scenarios**:

1. **Given** the Connect AI dialog, **When** opened, **Then** shows one "Google AI Studio API key" input that serves text, audio, and image generation.
2. **Given** a key is entered and saved, **When** later viewing the status, **Then** it shows as connected (masked last 4 chars) and Auto-fill enables text, audio, and image generation.
3. **Given** a saved key, **When** removed, **Then** all Auto-fill features (text, audio, image) ask for a key on next use.
4. **Given** the app restarts, **When** loaded, **Then** previously saved key is still available and no re-authentication is needed.

---

### User Story 2 - Flexible model selection for all services (Priority: P1)

The learner can customize which AI models are used for text generation, audio generation, and image generation. Each model choice is optional; empty fields use the provider's default.

**Why this priority**: Users can optimize quality vs. performance trade-offs for each service independently.

**Independent Test**: Set custom models for text/audio/image, save them, reload app and verify models persist; generate content using each and verify correct models are called.

**Acceptance Scenarios**:

1. **Given** the Models section in Connect AI dialog, **When** expanded, **Then** shows three editable fields: "Text model", "Speech model", "Image model".
2. **Given** model names entered, **When** "Save models" is pressed, **Then** models are stored and used for all subsequent requests.
3. **Given** no model name (empty field), **When** content is generated, **Then** the provider's default model is used.
4. **Given** stored models, **When** "Restore defaults" is clicked, **Then** all model names revert to empty (using provider defaults).
5. **Given** app restart, **When** loaded, **Then** previously set model names are still in effect.

---

### User Story 3 - Image generation using Gemini API (Priority: P1)

Image generation is now powered by Google Gemini (gemini-3.1-flash-lite-image model) instead of Pollinations. Uses the same Google API key as text and audio, eliminating separate image provider authentication.

**Why this priority**: Eliminates dependency on Pollinations and consolidates all AI features under one provider.

**Independent Test**: With Google key configured, press Auto-fill on a word, verify image is generated using Gemini endpoint (not Pollinations), image displays correctly, and can be applied to word.

**Acceptance Scenarios**:

1. **Given** Auto-fill in progress with a Google key saved, **When** the Image section loads, **Then** image is generated using Google Gemini API.
2. **Given** an image displayed, **When** "New image" is pressed, **Then** a fresh image is generated for the selected sentence using Gemini.
3. **Given** image ready, **When** "Apply" is pressed, **Then** image is attached to the word exactly as with previous provider (size/count limits unchanged).
4. **Given** no image key configured separately, **When** Auto-fill starts, **Then** same Google key is automatically used for image generation (no separate auth step).

---

## Functional Requirements

1. **Single Key Storage**: The app accepts one Google API key in the Connect AI dialog. This key is encrypted on disk and used for all AI services (text, audio, image generation).

2. **Model Configuration**: Users can specify optional model names for text, speech, and image generation. Empty model fields trigger use of provider defaults.

3. **Models Persistence**: Model selections are saved to app settings and persist across restarts. Users can reset to defaults via "Restore defaults" button.

4. **Image Generation via Gemini**: All image generation requests go to Google Gemini (gemini-3.1-flash-lite-image endpoint) using the same Google API key, not a separate provider.

5. **Backward Compatibility**: If the app detects old Pollinations configuration on startup, it is cleared automatically and users are prompted to set up the new Google key.

6. **Key Management**: Users can view the saved key status (last 4 characters only), save a new key, and remove the key entirely.

---

## Success Criteria

1. **User Experience**: Users configure only one API key for all AI services (text, audio, image generation).
2. **Model Flexibility**: Users can independently choose models for text, audio, and image generation without affecting other services.
3. **Reliability**: Image generation never requests a separate key; it uses the configured Google key automatically.
4. **Performance**: Model switching has no noticeable latency impact; changes apply immediately on next request.
5. **Data Persistence**: Model choices and key status survive app restarts without re-configuration.

---

## Key Entities

- **Google API Key**: Single credential that authenticates text, audio, and image generation requests
- **Model Names**: Three optional strings (text_model, speech_model, image_model) stored in app settings
- **AI Status**: Current connection state (connected yes/no) and key's last 4 characters for display

---

## Assumptions

1. Users have a single Google AI Studio account providing access to text, audio, and image APIs.
2. Gemini image model (gemini-3.1-flash-lite-image) is stable and available.
3. Users can manage model names manually if switching between different Gemini variants.
4. Rate limits (100 req/min, 10 concurrent max) are sufficient for typical user workloads.
5. Base64-encoded JPEG responses from Gemini are fully supported by the image display pipeline.

---

## Out of Scope

- Multiple API keys for different services
- Other image providers (Pollinations removed entirely)
- Real-time model availability checking or fallback providers
- Automatic model recommendation based on workload
- API key validation before saving

---

## Notes

- Migration from old Pollinations setup happens silently on app startup
- No UI warning shown when old keys are cleared (assumed acceptable)
- Image model field is optional; users can omit it safely
