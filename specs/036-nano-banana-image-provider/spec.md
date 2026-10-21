# Feature Specification: Replace Pollinations with Google Gemini for Image Generation

**Feature Branch**: `036-nano-banana-image-provider`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User request: "Replace Pollinations with a single Google API key for all purposes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate image provider from Pollinations to Google Gemini (Priority: P1)

The learner's saved Pollinations key and settings are migrated to Google Gemini. From then on, the picture in the AI suggestions panel is created by Google Gemini instead of Pollinations, for the sentence selected, and everything else about the picture stays the same: it follows the selected sentence, shows which sentence it was made for, can be replaced with "New image", and is attached to the word's Images when the learner presses "Apply". The definition, sentences, IPA and audio keep coming from Google.

**Why this priority**: Ensuring image generation continues to work after replacing the provider is critical.

**Independent Test**: With Google Gemini configured, press Auto-fill on a word, wait for the picture, press Apply, and verify one image is attached and survives a reload. Confirm no image request goes to Pollinations.

**Acceptance Scenarios**:

1. **Given** a Google Gemini key and ready suggestions, **When** the Image section starts, **Then** "Creating image…" is shown and then a picture that depicts the selected sentence with the caption "Made for: "…"".
2. **Given** a picture is shown, **When** the learner selects another sentence or presses "New image", **Then** a new picture is created for the selected sentence, as before.
3. **Given** the picture is ready, **When** the learner presses Apply, **Then** it is attached to the word's Images as before (same size and count limits).
4. **Given** an existing Pollinations key on the device, **When** the app first runs after the migration, **Then** the migration helper offers to transition the configuration to Google Gemini, or the key is cleared and the learner sets up Google Gemini.
5. **Given** a picture request, **When** it is made, **Then** it goes only to Google Gemini and the Google key is not sent to the image provider; the image provider key is not sent to Google.

---

### User Story 2 - Use a single Google API key (Priority: P1)

The "Connect AI" dialog uses a single Google AI Studio API key for text, audio, and image generation. There is no separate image key section. The learner pastes and saves the key, sees it masked (last 4 characters), and can remove it. The key stays on the learner's device.

**Why this priority**: Simplifying to a single key reduces configuration complexity and API management overhead.

**Independent Test**: Save a Google API key in the key field, verify text/audio/image generation all use the same key, reload and see it still saved, remove it and see Auto-fill ask for it again.

**Acceptance Scenarios**:

1. **Given** the Connect AI dialog, **When** it opens, **Then** it shows a single "Google AI Studio API key" section that handles text, audio, and image generation. No separate image key input.
2. **Given** a key typed in, **When** the learner saves it, **Then** it is stored on the device, "AI connected." is shown and the input empties; the key is shown only masked afterward.
3. **Given** an empty key or a key with spaces, **When** the learner saves, **Then** "Enter your API key without spaces." is shown and nothing is saved.
4. **Given** a saved key, **When** the learner removes it and confirms, **Then** it is deleted from the device and Auto-fill is disabled until a new key is configured.
5. **Given** Auto-fill enabled, **When** pressing Auto-fill on a word, **Then** the same key is used for text, audio, and image generation without asking for separate keys.
6. **Given** earlier saved settings with separate Pollinations and Google keys, **When** the app starts, **Then** only the Google key is retained and Pollinations settings are cleared.

---

### User Story 3 - API contract compliance (Priority: P2)

The Google Gemini image generation request respects the provider's API contract: correct endpoint, correct payload format, correct model names, correct authentication method, and correct image output handling.

**Why this priority**: Ensuring correct API integration prevents image generation failures.

**Independent Test**: Generate an image with Google Gemini and verify the network request uses correct endpoint, authentication, and payload format.

**Acceptance Scenarios**:

1. **Given** image generation request, **When** sent to Google Gemini, **Then** it uses the correct endpoint and HTTP method.
2. **Given** authentication, **When** sending the request, **Then** API key is passed in query parameter with correct format.
3. **Given** image request payload, **When** constructed, **Then** it includes the correct parameter names (prompt, generationConfig, etc.) matching Google Gemini API.
4. **Given** image response, **When** received, **Then** the app correctly extracts and displays the base64-encoded image data.

---

## Out of Scope

- Removing Pollinations-related code entirely (kept for backwards compatibility or gradual rollout)
- Supporting multiple image providers simultaneously
- Changing image generation UI or UX
- Modifying Google AI integration

---

## Technical Context

**Implementation Details**:
- Uses Google Gemini API (gemini-3.1-flash-lite-image model)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent`
- Authentication: API key passed as query parameter
- Image format: Base64-encoded JPEG response
- Fixed resolution: 1024×1024 pixels (aspect ratio configurable)
- Rate limits: 100 requests/minute, 10 concurrent max
- Performance: ~4 seconds per image

**Related files**:
- `src/features/ai-assistant/store/aiStore.ts` - AI provider state
- `src/features/ai-assistant/components/ConnectDialog.tsx` - API key UI
- `src/features/ai-assistant/hooks/useSuggestions.ts` - Image generation logic
- `src/main/backend/api/index.ts` - Backend API routes
