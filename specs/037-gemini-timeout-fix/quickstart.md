# Quickstart: Gemini Timeout Fix Validation

**Date**: 2026-10-21 | **Feature**: [Gemini Timeout Fix](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

This guide validates that the timeout adjustments successfully eliminate 499 "Client Closed Request" errors from Google Gemini API. All tests exercise real Gemini API calls with the new timeout windows.

## Prerequisites

1. **Node.js** ≥22.22 and **pnpm** 12.x installed
2. **Google API key** from [aistudio.google.com](https://aistudio.google.com)
3. **Repo cloned** and `pnpm install` run (downloads Electron and dependencies)
4. **Branch checked out**: `037-gemini-timeout-fix` (or main after merge)

## Setup

### 1. Start the Dev App with Sample Course

```bash
cd /Users/brunobrito/Documents/membetter/memrise-alternative
pnpm dev:samples
```

This starts the Electron app with a preloaded sample course (Spanish, French, etc.). The app folder is `~/Library/Application Support/MemBetter-dev`.

Expected output:
```
✓ Vite built successfully
✓ Electron window opened
```

### 2. Configure Google API Key

In the running app:
1. Click **Settings** (gear icon in top-right)
2. Scroll to **AI Assistant**
3. Paste your Google API key in the **API Key** field
4. Click **Test Connection** → should show ✓ Connected

## Test Scenarios

### Scenario 1: Text Definition Generation (45s timeout)

**Objective**: Verify text generation completes within new 45-second window.

**Steps**:
1. In app, navigate to any course/deck
2. Click **Learn** or **Study**
3. Click any word card
4. Observe the **Definition** section loading
5. Wait for text to appear (definition + 3 sentences + IPA)
6. Note time taken (should be 5-15 seconds typical)

**Expected**:
- ✅ Definition loads successfully
- ✅ Three example sentences appear
- ✅ IPA pronunciation displayed
- ✅ No "Image generation failed" or timeout error
- ✅ Completion time < 45 seconds

**Validation**: If text appears without error, 45-second timeout is adequate.

---

### Scenario 2: Audio Generation (60s timeout) - PRIMARY TEST

**Objective**: Verify TTS audio generation completes within new 60-second window (most critical).

**Steps**:
1. From the suggestion screen with loaded definition
2. Click **Generate Audio** (speaker icon below IPA)
3. Wait for audio download and playback preparation
4. Observe the audio player appears
5. Click play to verify audio is valid

**Expected**:
- ✅ Audio generates successfully (no 499 error)
- ✅ Audio player appears with valid WAV file
- ✅ Playback works correctly
- ✅ Completion time < 60 seconds

**Validation**: Audio generation is the primary blocker fixed by this feature. Success here indicates the core issue is resolved.

**Repeat**: Test with 5+ different words to ensure consistency.

---

### Scenario 3: Image Generation (90s timeout, with scene description)

**Objective**: Verify image generation completes with isolated scene-description timeout.

**Steps**:
1. From word suggestion screen
2. Select one of the three example sentences by clicking it
3. Click **Generate Image** (camera icon below sentence)
4. Wait for scene description to load (internal, ~10-30 seconds)
5. Wait for image to be drawn (~20-40 seconds)
6. Observe final JPEG image appears

**Expected**:
- ✅ Scene description completes (invisible to user, happens first)
- ✅ Image drawing completes
- ✅ Final JPEG image displays
- ✅ No 499 error or timeout message
- ✅ Total time < 90 seconds

**Validation**: Verify cascade timeout works (scene description doesn't consume entire 90s budget).

**Timing check**: If scene description takes 25s and image drawing takes 35s = 60s total (well under 90s limit).

---

### Scenario 4: Timeout Error Handling (fallback verification)

**Objective**: Verify that if an error does occur, fallback image generation works.

**Steps**:
1. If image generation fails, app should automatically:
   - Fall back to a simple text-based scene description
   - Generate image from fallback description
   - Display final image (may look generic)

**Expected**:
- ✅ Fallback mechanism triggers on failure
- ✅ Generic image still appears (e.g., simple illustration)
- ✅ No crash or "Image generation failed" error message

**Note**: With new timeouts, this fallback should rarely trigger. If it does, check network connectivity.

---

### Scenario 5: Concurrent Requests (stress test)

**Objective**: Verify timeouts work correctly with multiple simultaneous requests.

**Steps**:
1. Open app with sample course
2. Open **Study** tab
3. Rapidly click between different words (5+ words in quick succession)
4. This triggers concurrent definition + audio + image requests

**Expected**:
- ✅ All requests complete without 499 errors
- ✅ UI remains responsive during loading
- ✅ No requests are cancelled due to timeout contention
- ✅ Each request gets its own timeout window

**Validation**: Timeouts are per-request, not shared. Concurrent requests should not interfere.

---

## Validation Checklist

Run through all scenarios and mark results:

- [ ] **Scenario 1**: Text definitions load reliably
- [ ] **Scenario 2**: Audio generation succeeds (PRIMARY)
- [ ] **Scenario 3**: Images generate without cascade timeout
- [ ] **Scenario 4**: Fallback mechanism works if needed
- [ ] **Scenario 5**: Concurrent requests work

**Success Criteria**: All 5 scenarios pass without 499 errors.

---

## Performance Metrics (Optional)

To measure actual timeout usage, enable debug logging:

1. In terminal, set env var:
   ```bash
   DEBUG=membetter:ai pnpm dev:samples
   ```

2. Open browser DevTools (in Electron: View → Toggle Developer Tools)

3. Check **Console** tab for logs:
   ```
   [Gemini] Generating [text|audio|image]
   [Gemini] [text|audio|image] generated successfully
   [Gemini] Request failed { message: "..." }
   ```

4. Note timestamps to measure actual request duration

**Expected timings**:
- Text: 5-15 seconds
- Audio: 15-30 seconds
- Image: 30-60 seconds (scene + draw combined)

---

## Troubleshooting

### Scenario fails with "Image generation failed: HTTP 499"

**Root cause**: Old timeout windows still active (code not updated).

**Check**:
1. Verify branch is `037-gemini-timeout-fix`
2. Run `git diff electron/services/ai/service.ts` to confirm timeout constants changed
3. Rebuild: `pnpm build && pnpm preview`
4. Retry test

### Scenario fails with "Invalid API key"

**Root cause**: API key incorrect or deactivated.

**Check**:
1. Get fresh key from [aistudio.google.com](https://aistudio.google.com)
2. Clear app settings: `pnpm dev:reset`, then `pnpm dev:samples`
3. Re-enter API key in Settings
4. Test connection before retrying

### Scenario fails with network error

**Root cause**: Network connectivity or firewall blocking Google API.

**Check**:
1. Verify internet connection: `curl https://generativelanguage.googleapis.com/`
2. Check firewall allows outbound HTTPS to Google
3. Try from different network if available

---

## Success Verification

After completing all scenarios:

1. **No 499 errors**: Verify error logs show 0 "Client Closed Request" errors
2. **Consistent success**: 95%+ of requests complete successfully
3. **Reasonable performance**: Requests complete within advertised timeout windows
4. **User experience**: No timeout messages in UI

If all checks pass: ✅ **Feature is ready for merge**.

---

## References

- [Data Model](data-model.md) - Timeout constant definitions and validation rules
- [Contract](contracts/ai-service.md) - AiService method signatures and error types
- [Research](research.md) - Root cause analysis and timeout strategy
- [Service Code](../../electron/services/ai/service.ts) - Implementation with new timeout constants
