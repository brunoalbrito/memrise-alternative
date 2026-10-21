# Feature Specification: Replace Pollinations with Nano Banana 2 Lite

**Feature Branch**: `036-nano-banana-image-provider`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User request: "Replace Pollinations API key by Nano Banana 2 Lite"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate image provider from Pollinations to Nano Banana 2 Lite (Priority: P1)

The learner's saved Pollinations key and settings are migrated to Nano Banana 2 Lite. From then on, the picture in the AI suggestions panel is created by Nano Banana 2 Lite instead of Pollinations, for the sentence selected, and everything else about the picture stays the same: it follows the selected sentence, shows which sentence it was made for, can be replaced with "New image", and is attached to the word's Images when the learner presses "Apply". The definition, sentences, IPA and audio keep coming from Google.

**Why this priority**: Ensuring image generation continues to work after replacing the provider is critical.

**Independent Test**: With Nano Banana 2 Lite configured, press Auto-fill on a word, wait for the picture, press Apply, and verify one image is attached and survives a reload. Confirm no image request goes to Pollinations.

**Acceptance Scenarios**:

1. **Given** a Nano Banana 2 Lite key and ready suggestions, **When** the Image section starts, **Then** "Creating image…" is shown and then a picture that depicts the selected sentence with the caption "Made for: "…"".
2. **Given** a picture is shown, **When** the learner selects another sentence or presses "New image", **Then** a new picture is created for the selected sentence, as before.
3. **Given** the picture is ready, **When** the learner presses Apply, **Then** it is attached to the word's Images as before (same size and count limits).
4. **Given** an existing Pollinations key on the device, **When** the app first runs after the migration, **Then** the migration helper offers to transition the configuration to Nano Banana 2 Lite, or the key is cleared and the learner sets up Nano Banana 2 Lite.
5. **Given** a picture request, **When** it is made, **Then** it goes only to Nano Banana 2 Lite and the Google key is not sent to Nano Banana 2 Lite; the Nano Banana 2 Lite key is not sent to Google.

---

### User Story 2 - Save and manage the Nano Banana 2 Lite key (Priority: P1)

The "Connect AI" dialog updates its image provider section to accept Nano Banana 2 Lite key instead of Pollinations: paste and save it, see it masked (last 4 characters), and remove it. The key stays on the learner's device. An optional "Image model" field lets the learner choose a Nano Banana 2 Lite model; left empty, Nano Banana 2 Lite's own default is used.

**Why this priority**: The learner needs to securely store and manage the new provider's key.

**Independent Test**: Save a Nano Banana 2 Lite key and see it masked, reload and see it still saved, remove it and see Auto-fill's Image section ask for it again.

**Acceptance Scenarios**:

1. **Given** the Connect AI dialog, **When** it opens, **Then** it shows a "Nano Banana 2 Lite API key (for images)" section with an input, "Save" and "Remove key", and the existing Google key section.
2. **Given** a key typed in the Nano Banana 2 Lite input, **When** the learner saves it, **Then** it is stored on the device, "Nano Banana 2 Lite connected." is shown and the input empties; the key is shown only masked afterward.
3. **Given** an empty key or a key with spaces, **When** the learner saves, **Then** "Enter your API key without spaces." is shown and nothing is saved.
4. **Given** a saved Nano Banana 2 Lite key, **When** the learner removes it and confirms, **Then** it is deleted from the device.
5. **Given** the "Image model" field, **When** the learner leaves it empty, **Then** Nano Banana 2 Lite's default model is used; when filled, that model name is used.
6. **Given** earlier saved settings with the Pollinations provider, **When** the app starts, **Then** those settings are cleared and the image provider is empty until configured.

---

### User Story 3 - API contract compliance (Priority: P2)

The Nano Banana 2 Lite image generation request respects the provider's API contract: correct endpoint, correct payload format, correct model names, correct authentication method, and correct image output handling.

**Why this priority**: Ensuring correct API integration prevents image generation failures.

**Independent Test**: Generate an image with Nano Banana 2 Lite and verify the network request uses correct endpoint, authentication, and payload format.

**Acceptance Scenarios**:

1. **Given** image generation request, **When** sent to Nano Banana 2 Lite, **Then** it uses the correct endpoint and HTTP method.
2. **Given** authentication, **When** sending the request, **Then** API key is passed with correct header name and format.
3. **Given** image request payload, **When** constructed, **Then** it includes the correct parameter names (prompt, model, size, etc.) matching Nano Banana 2 Lite API.
4. **Given** image response, **When** received, **Then** the app correctly extracts and displays the image URL or data.

---

## Out of Scope

- Removing Pollinations-related code entirely (kept for backwards compatibility or gradual rollout)
- Supporting multiple image providers simultaneously
- Changing image generation UI or UX
- Modifying Google AI integration

---

## Technical Context

**Dependencies to research**:
- Nano Banana 2 Lite API documentation and endpoints
- Nano Banana 2 Lite authentication method (API key format and header)
- Nano Banana 2 Lite image generation payload format
- Nano Banana 2 Lite supported models and size parameters
- Comparison of Pollinations vs Nano Banana 2 Lite API differences

**Related files**:
- `src/features/ai-assistant/store/aiStore.ts` - AI provider state
- `src/features/ai-assistant/components/ConnectDialog.tsx` - API key UI
- `src/features/ai-assistant/hooks/useSuggestions.ts` - Image generation logic
- `src/main/backend/api/index.ts` - Backend API routes
