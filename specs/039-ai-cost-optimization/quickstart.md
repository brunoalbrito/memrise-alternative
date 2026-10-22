# Quickstart: AI Model Cost Optimization Validation

**Feature**: AI Cost Optimization (spec 039) | **Date**: 2026-10-21

End-to-end validation guide. Run these scenarios to confirm the feature works as specified.

---

## Prerequisites

- MemBetter app built: `pnpm build`
- Node.js ≥22.22
- Valid Google AI API key in secrets storage (for real API tests)
- Terminal/shell access

---

## Test 1: Mock Mode (All Operations, Zero Cost)

**Goal**: Verify MOCK_AI=1 returns fake data without any API calls.

**Setup**:
```bash
cd /Users/brunobrito/Documents/membetter/memrise-alternative
MOCK_AI=1 pnpm dev
```

**Steps**:
1. App opens in dev mode (with hot reload)
2. Navigate to any word card (e.g., library view, click a word)
3. Click "Get Definition" button
   - ✓ Definition appears instantly (from mock data)
   - ✓ Check dev console: No API call logs
4. Click "Hear Pronunciation" button
   - ✓ Audio plays (mock WAV, will be silent)
   - ✓ Check dev console: No API call logs
5. Click "Generate Image" button
   - ✓ Image appears (1x1 pixel mock JPEG)
   - ✓ Check dev console: No API call logs

**Verification**:
- All 3 operations complete without API calls
- No errors in console
- Cost logs are empty (if UI shows cost summary, it should be $0.00)

**Expected Duration**: <5 seconds for all operations

---

## Test 2: Real API Mode (Toggle Off Mock)

**Goal**: Verify real API calls work when MOCK_AI not set.

**Setup**:
```bash
pnpm dev  # MOCK_AI not set; uses real API
```

**Steps**:
1. App opens in dev mode
2. Navigate to a word card
3. Click "Get Definition"
   - ✓ Real definition fetched from API (takes ~1-2 seconds)
   - ✓ Check dev console: API call log shows operation="text", cost estimate
4. Click "Hear Pronunciation"
   - ✓ Real audio generated from API (takes ~2-3 seconds)
   - ✓ Check dev console: API call log shows operation="audio"
5. Click "Generate Image"
   - ✓ Real image generated from API (takes ~5-10 seconds)
   - ✓ Check dev console: API call log shows operation="image", cost estimate

**Verification**:
- All API calls logged with model name and cost estimate
- Cost summary updates after each call
- Cumulative cost increases (e.g., $0.01 + $0.02 + $0.05 = $0.08)

**Expected Duration**: ~10-15 seconds for all operations + API latency

---

## Test 3: Image Model Selection

**Goal**: Verify user-selected image model is used and cost reflects cheaper model.

**Setup**:
```bash
pnpm dev  # Real API mode
```

**Steps**:
1. App opens
2. Open "Connect AI" settings (usually in app menu or settings)
3. Look for "Image Model" field
4. Select custom model: `gemini-2.0-flash-lite-image` (if available) or any alternative
5. Click "Save" or "Apply"
6. Navigate to word card
7. Click "Generate Image"
   - ✓ Image generates using selected model
   - ✓ Check dev console: API call log shows `modelName: "gemini-2.0-flash-lite-image"`
   - ✓ Cost estimate is lower than default (compare to Test 2 image cost)

**Verification**:
- Selected model appears in API call log
- Cost is at least 20% lower than default model (or as specified in research.md)
- Image displays without errors

**Expected Duration**: ~10 seconds

---

## Test 4: Model Selection Persistence

**Goal**: Verify model selection persists after app restart.

**Setup**: Continue from Test 3 (custom model selected)

**Steps**:
1. Close the app completely (`Ctrl+C` in terminal)
2. Wait 2 seconds
3. Restart: `pnpm dev`
4. Open "Connect AI" settings
5. Check "Image Model" field
   - ✓ Shows previously selected model (not default)

**Verification**:
- Model selection persists across restarts
- No manual re-entry needed

**Expected Duration**: ~3 seconds

---

## Test 5: Rate Limit Error Handling

**Goal**: Verify rate limit errors (429) are handled gracefully without retry storms.

**Setup**:
```bash
pnpm dev
```

**Steps**:
1. Open browser DevTools (F12), go to Network tab
2. Navigate to word card
3. Generate 10+ images rapidly (click button 10 times quickly)
   - After 5-10 calls, API returns 429 (rate limit exceeded)
4. Check DevTools Network tab
   - ✓ Requests stop at rate limit; no additional requests queued
5. Check dev console
   - ✓ Error message shows for 429: "Rate limit exceeded" or similar
   - ✓ No automatic retries in background

**Verification**:
- No retry storm; exactly 1 request per user click
- Error message clear and visible to user
- User must manually retry (click button again) after delay

**Expected Duration**: ~10 seconds

---

## Test 6: Network Error Handling

**Goal**: Verify network errors are handled gracefully.

**Setup**:
```bash
pnpm dev
```

**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab, toggle Offline mode (or throttle to GPRS)
3. Navigate to word card
4. Click "Generate Image"
   - ✓ Error message shows: "Network error" or similar
   - ✓ No automatic retry in background
5. Toggle Online mode again
6. Click "Generate Image" again
   - ✓ Image generates successfully (clean retry)

**Verification**:
- Network errors don't spawn retry queue
- Manual retry works cleanly
- No duplicate API calls

**Expected Duration**: ~5 seconds

---

## Test 7: Cost Logging and Visibility

**Goal**: Verify all API calls are logged with costs; user can see cumulative cost.

**Setup**:
```bash
pnpm dev
```

**Steps**:
1. Generate 5 images (real API, not mock)
2. Check dev console logs
   - ✓ Each image logged with: timestamp, modelName, costEstimate, success
   - ✓ Costs visible: e.g., `[API] image via gemini-3.1-flash-lite-image: $0.0500`
3. If UI has cost summary (optional feature):
   - Open cost panel/modal
   - ✓ Total cost shown: "Total: $0.25 for 5 calls"
   - ✓ Breakdown by operation visible (if implemented)

**Verification**:
- All API calls logged to console
- Costs are visible and accurate
- Cumulative total calculated correctly

**Expected Duration**: ~20 seconds

---

## Test 8: Switching Between Mock and Real Mode

**Goal**: Verify mode can be switched without restarting app (if applicable).

**Setup**:
```bash
pnpm dev  # Start in real mode (MOCK_AI not set)
```

**Steps**:
1. Generate 1 image (real API)
   - ✓ Takes 5-10 seconds, API call logged
2. Stop the app (`Ctrl+C`)
3. Restart with mock mode: `MOCK_AI=1 pnpm dev`
4. Generate 1 image (mock)
   - ✓ Takes <1 second, no API call logged
5. Stop and restart in real mode: `pnpm dev`
6. Generate 1 image (real)
   - ✓ API call logged again

**Verification**:
- Mode controlled by environment variable
- Switching requires app restart (acceptable for dev)
- Mock and real modes work independently

**Expected Duration**: ~30 seconds

---

## Sign-Off Checklist

After running all tests, verify:

- [ ] Test 1: Mock mode returns fake data, zero cost
- [ ] Test 2: Real mode makes API calls, costs logged
- [ ] Test 3: Custom image model selected, cost lower
- [ ] Test 4: Model selection persists after restart
- [ ] Test 5: Rate limit errors handled gracefully
- [ ] Test 6: Network errors handled gracefully
- [ ] Test 7: All API calls logged with costs
- [ ] Test 8: Mode switching works (restart required)

**If all tests pass**: Feature ready for `/speckit-tasks`.

**If any test fails**: Document failure, file issue, debug before proceeding.

---

## Developer Notes

- **Mock data location**: `electron/services/ai/service.ts` (constants)
- **API call logging location**: `electron/services/ai/service.ts` (AiService.logApiCall)
- **Cost summary calculation**: `electron/services/ai/service.ts` (calculateCostSummary)
- **Model pricing map**: `electron/services/ai/service.ts` (MODEL_PRICING constant)
- **Environment variable**: `process.env.MOCK_AI === "1"` check in each AI method

---

## Common Issues

**Issue**: "MOCK_AI=1 not recognized" (Windows)
- **Solution**: Use `set MOCK_AI=1` (Windows CMD) or `$env:MOCK_AI=1` (PowerShell)

**Issue**: Mock image doesn't display (all black or error)
- **Solution**: Ensure mock image is valid JPEG (1x1 pixel minimum). Check `imageJPEG` constant in service.ts.

**Issue**: Cost logs not visible in console
- **Solution**: Check that logging is enabled in service.ts. Confirm console is open (DevTools or terminal).

**Issue**: Rate limit error not triggered in Test 5
- **Solution**: May need >10 rapid calls, or API may have high quota. Skip this test if quota is unlimited.
