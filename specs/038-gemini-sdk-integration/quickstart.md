# Quickstart: Google Generative AI SDK Integration Validation

## Overview

This guide validates that image generation successfully migrated from REST API to the Google Generative AI SDK. Tests cover happy path, error scenarios, and configuration handling.

---

## Prerequisites

1. **Google API Key**: Valid key with Gemini API access (not the revoked one)
   - Obtain from: https://aistudio.google.com/app/apikeys
   - Must have quota remaining

2. **MemBetter Dev Setup**:
   ```bash
   cd /Users/brunobrito/Documents/membetter/memrise-alternative
   pnpm install               # Includes @google/genai SDK
   pnpm build
   ```

3. **Dev App Ready**:
   ```bash
   pnpm dev
   ```

4. **Sample Course** (optional, for realistic testing):
   ```bash
   pnpm dev:samples
   ```

---

## Test Scenarios

### 1. Happy Path: Image Generation Works

**Setup**:
- Valid Google API key configured in "Connect AI" dialog
- App has text + audio configured and working
- Sample course loaded with words available

**Test Steps**:
1. Open Connect AI dialog
2. Verify "Google AI Studio API key" shows connected status (last 4 chars visible)
3. Set "Image model" field (optional): Leave empty or enter `gemini-3.1-flash-lite-image`
4. Click "Test connection" → Should pass
5. Open a word card (e.g., "book")
6. Scroll to "Get started" section
7. Select one or more suggestions
8. Click "Create image" (or auto-trigger with "Create picture")
9. **Expected**: Image displays within 30 seconds (typically 10-15s)

**Verification**:
- [ ] Image loads and displays on card
- [ ] Image is purely visual (no text visible)
- [ ] Image matches the scene (e.g., for "book," shows a book/library scenario)
- [ ] No error message shown
- [ ] Dev console has no errors from `[drawImage]` or `[generateWordImage]`

**SDK Validation** (check dev console):
- [ ] Log: `[generateWordImage] Called with {word: '...', sentence: '...'}`
- [ ] Log: `[drawImage] Start, prompt length: ...`
- [ ] Log: `[drawImage] Making fetch request to gemini-3.1-flash-lite-image...`
- [ ] Log: `[drawImage] Response status: 200`
- [ ] Log: `[drawImage] Response JSON: {...` (first 500 chars)
- [ ] Log: `[drawImage] Candidates count: 1`
- [ ] No errors logged

---

### 2. Error Scenario: Invalid API Key

**Setup**:
- Valid key currently set in Connect AI

**Test Steps**:
1. Open Connect AI dialog
2. Clear the API key field (or paste an invalid one: `invalid-key-123`)
3. Click "Save key"
4. Attempt to generate image on a word
5. **Expected**: Error dialog appears with specific message

**Expected Error Message**:
- If empty: "Add your Google AI Studio key in AI settings to create images."
- If invalid: "Google did not accept your API key. Check it in AI settings."

**Verification**:
- [ ] Error message is specific (not generic "Image could not be created")
- [ ] Error message mentions API key or settings
- [ ] "Try again" button available to retry
- [ ] Dev console log shows: `[drawImage] Response status: 401` or `403`

---

### 3. Error Scenario: Rate Limit Exceeded

**Setup**:
- Hit the rate limit by generating multiple images rapidly

**Test Steps**:
1. With valid key, click "Create image" 10+ times in quick succession
2. Some requests should hit rate limit (429)
3. **Expected**: Error dialog for rate-limited requests

**Expected Error Message**:
- "The usage limit was reached. Try again later."

**Verification**:
- [ ] Error message mentions quota/limit (not generic "Image could not be created")
- [ ] After waiting 60+ seconds, can generate again
- [ ] Dev console shows: `[drawImage] Response status: 429`

---

### 4. Configuration: Custom Image Model

**Setup**:
- Valid Google API key set
- Goal: Verify custom imageModel is used

**Test Steps**:
1. Open Connect AI dialog, expand "Models"
2. In "Image model" field, enter: `gemini-3.1-flash-lite-image`
3. Click "Save models"
4. Close dialog
5. Generate an image
6. **Expected**: Same behavior as before (still works)

**SDK Validation**:
- [ ] Check that imageModel setting is persisted (reload app, should still be set)
- [ ] Image generation works with custom model
- [ ] If you set invalid model (e.g., `invalid-model-name`), error message appears: "Image could not be created."

---

### 5. Configuration: Empty Image Model (Defaults)

**Setup**:
- Goal: Verify default model is used when field is empty

**Test Steps**:
1. Open Connect AI dialog, expand "Models"
2. Clear the "Image model" field (leave empty)
3. Click "Restore defaults" (or just save empty)
4. Generate an image
5. **Expected**: Image generates using default `gemini-3.1-flash-lite-image`

**Verification**:
- [ ] Image generates successfully (no "model not found" error)
- [ ] Log shows SDK was called with correct model
- [ ] Same image quality as before

---

### 6. Network Error Handling

**Setup**:
- Simulate network disconnect (disable WiFi/Ethernet)

**Test Steps**:
1. Disable network connectivity
2. Attempt to generate image
3. **Expected**: Network error message

**Expected Error Message**:
- "Could not reach the AI service. Check your connection and try again."

**Verification**:
- [ ] Error message mentions network/connection (not generic "Image could not be created")
- [ ] Re-enable network, try again → Image generates
- [ ] Dev console shows: `[drawImage] Fetch error: ...`

---

### 7. Response Parsing: Malformed SDK Response

**Setup**:
- Goal: Verify parser handles SDK response structure correctly

**Test Steps**:
- This is a code-level test (hardening; can mock SDK response in unit tests)
- Verify parser doesn't crash if:
  - [ ] interaction.steps is empty
  - [ ] interaction.steps[0].content is empty
  - [ ] content part is not an image (e.g., type='text')
  - [ ] image part has no `.data` field
  - [ ] `.data` is empty string

**Expected Behavior**:
- All cases throw `AiError("image")`
- User sees: "Image could not be created."

---

## Regression Tests (Verify No Breaks)

### REST API Not Called Anymore

**Setup**:
- Monitor network traffic or add logging

**Verification**:
- [ ] NO requests to old REST endpoint: `generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent`
- [ ] SDK method `GoogleGenAI.interactions.create()` is called instead
- [ ] Dev log shows: `[drawImage] Making fetch request to gemini-3.1-flash-lite-image...` (SDK endpoint, not REST)

### Error Handling Flow Intact

**Verification**:
- [ ] IPC handler `ai:wordImage` still works (no signature changes)
- [ ] Error codes still map correctly: `ai:invalid-key` → "Google did not accept..."
- [ ] Timeout handling still works (90s timeout)
- [ ] Image shrinking still applies (file size optimization)

### Backward Compatibility

**Verification**:
- [ ] Existing imageModel settings load correctly
- [ ] No database migrations needed
- [ ] UI (Connect AI dialog) unchanged
- [ ] No changes to media storage format

---

## Performance Baseline

- **Image generation time**: 10-20 seconds (typical)
- **Timeout**: 90 seconds (IMAGE_TIMEOUT_MS)
- **Max retries**: User can click "Try again" manually (no auto-retry in spec)

**Target**: No regression from previous implementation

---

## Sign-Off Checklist

| Test | Status | Date | Notes |
|------|--------|------|-------|
| Happy path (image generates) | ☐ | — | |
| Invalid key error | ☐ | — | |
| Rate limit error | ☐ | — | |
| Custom model config | ☐ | — | |
| Default model (empty field) | ☐ | — | |
| Network error | ☐ | — | |
| REST API not called | ☐ | — | |
| Error codes correct | ☐ | — | |
| Backward compatibility | ☐ | — | |
| Performance acceptable | ☐ | — | |

**Overall Status**: [PASS / FAIL / BLOCKED]

---

## Related Documentation

- **Data Model**: See [data-model.md](data-model.md) for entity definitions
- **SDK Contract**: See [contracts/genai-image-request.md](contracts/genai-image-request.md) for implementation details
- **Research**: See [research.md](research.md) for technical decisions

---

## Troubleshooting

### "Image could not be created" but no specific error

1. Check dev console for `[drawImage]` logs
2. Verify API key is saved (test connection passes)
3. Check if rate limit was hit (try again after 60s)
4. Verify network connectivity

### Image model setting not persisting

1. Check that you clicked "Save models" (not just entered and closed)
2. Reload app and verify in Connect AI dialog
3. Check browser console for any errors on save

### SDK installation failed

1. Run `pnpm install` again
2. Verify `node_modules/@google/genai/` exists
3. Check Node.js version: `node --version` (should be 22.x+)

### Still seeing REST API calls in network tab

1. Rebuild: `pnpm build`
2. Clear browser cache (dev tools → Application → Cache Storage)
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Restart dev server: `pnpm dev`
