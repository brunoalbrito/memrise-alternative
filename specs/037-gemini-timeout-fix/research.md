# Research: Gemini Timeout Fix

**Date**: 2026-10-21 | **Feature**: [spec.md](spec.md) | **Status**: Complete

## Overview

Research investigates HTTP 499 "Client Closed Request" errors from Google Gemini API and validates the timeout strategy for newer models (Gemini 3.8-flash, Gemini 3.8-flash-tts).

## Findings

### 1. Root Cause: AbortSignal.timeout() Behavior

**Decision**: 499 errors are caused by `AbortSignal.timeout()` in the Fetch API aborting requests before the server responds.

**Rationale**: 
- AbortSignal.timeout(ms) creates a timer that automatically aborts the fetch after the specified time
- When abort fires, the client closes the connection
- Server sees this as "Client Closed Request" (HTTP 499)
- Current timeouts (30s text, 45s image) are too aggressive for Gemini 3.8 models

**Evidence**:
- Code location: `electron/services/ai/service.ts` lines 135, 251
- Pattern: `signal: AbortSignal.timeout(timeoutMs)` in fetch call
- When timeout fires: `DOMException` with name "TimeoutError" is caught at lines 138, 254
- User impact: Users see "Image generation failed" or "Audio could not be created" errors

**Alternatives considered**:
- Manual timeout via setTimeout + abort controller: More complex, same result
- Server-side timeouts: Not controllable (Google API has its own limits)
- Retry logic with exponential backoff: Addresses failure symptom, not root cause

### 2. Timeout Windows per Model

**Decision**: Increase timeout windows to accommodate Gemini 3.8 model performance:
- Text generation: 30s → 45s
- Audio generation (TTS): 30s → 60s (separate from text)
- Image generation: 45s → 90s total
- Scene description: 30s (new, isolated from image drawing)

**Rationale**:
- Gemini 3.8-flash is newer/larger than previous models, requires more compute time
- Gemini 3.8-flash-tts is specialized for speech synthesis, computationally expensive
- Image generation is compound (describe scene + draw image); was sharing one 45s window
- 99% success target requires headroom above median response time

**Evidence**:
- Observed issue: Users reporting consistent timeouts when generating images/audio
- Google API documentation: Newer models may take longer under load
- Network variance: Wireless, international, or congested networks add latency

**Alternatives considered**:
- Streaming responses: Would reduce latency perception but require API contract change
- Request batching: Not applicable to this API
- Caching scene descriptions: Would reduce accuracy for varied sentences

### 3. Implementation Approach

**Decision**: Modify constant definitions only (no logic changes needed).

**Rationale**:
- Existing error handling already works correctly
- AbortSignal.timeout() is built into Fetch API (no new dependencies)
- Timeouts are already caught and converted to AiError("timeout") per spec
- UI already shows user-friendly timeout error messages

**Implementation details**:
- File: `electron/services/ai/service.ts` lines 14-16
- Changes: 
  - `TEXT_TIMEOUT_MS`: 30_000 → 45_000
  - `AUDIO_TIMEOUT_MS`: new constant, 60_000 (created from TEXT_TIMEOUT_MS usage)
  - `IMAGE_TIMEOUT_MS`: 45_000 → 90_000
  - `DESCRIBE_SCENE_TIMEOUT_MS`: new constant, 30_000
- Methods affected:
  - `wordText()` (line 161): Use TEXT_TIMEOUT_MS
  - `wordAudio()` (line 189): Use AUDIO_TIMEOUT_MS
  - `describeScene()` (line 209): Use DESCRIBE_SCENE_TIMEOUT_MS
  - `drawImage()` (line 251): Use IMAGE_TIMEOUT_MS

**Alternatives considered**:
- Client-side request deduplication: Reduces redundant requests but doesn't fix timeouts
- Progressive timeout increase on retry: Complex, unreliable for user experience
- Configurable timeouts via settings: Over-engineering for this issue

## Success Validation

This research resolves all specifications without NEEDS CLARIFICATION markers.

**Verified**:
- ✅ Root cause identified (AbortSignal.timeout behavior)
- ✅ Timeout windows justified (Gemini 3.8 model performance characteristics)
- ✅ Implementation approach clear (constants only, no logic changes)
- ✅ No unresolved dependencies or blockers identified

**Next phase**: Phase 1 design (data model, contracts, quickstart)
