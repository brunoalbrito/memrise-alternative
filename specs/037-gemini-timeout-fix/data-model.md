# Data Model: Gemini Timeout Fix

**Date**: 2026-10-21 | **Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

This feature has no new data entities. Changes are isolated to service-layer timeout configuration constants used by the AI request service.

## Timeout Configuration Constants

These constants define HTTP request abort timers in the Google Gemini integration service. They control how long the client waits for responses before closing the connection.

### TEXT_TIMEOUT_MS

**Type**: `number` (milliseconds)

**Current value**: 30,000 ms (30 seconds)

**New value**: 45,000 ms (45 seconds)

**Purpose**: Controls maximum wait time for text generation requests (definitions, scene descriptions)

**Applies to methods**:
- `wordText(word, languageName)` - Generate vocabulary definitions
- `describeScene(word, sentence)` - Generate visual scene descriptions for images

**Rationale for increase**: Gemini 3.8-flash model requires more compute time than previous models, especially under load or for complex prompts. 45 seconds provides 99% reliability for standard definition requests.

**Validation rules**:
- Must be ≥ 30000 (minimum for reasonable responsiveness)
- Must be ≤ 120000 (maximum before user frustration sets in)
- Must be > 0

---

### AUDIO_TIMEOUT_MS (NEW)

**Type**: `number` (milliseconds)

**Value**: 60,000 ms (60 seconds)

**Purpose**: Controls maximum wait time for audio/TTS generation requests

**Applies to methods**:
- `wordAudio(word)` - Generate pronunciation audio using Gemini 3.8-flash-tts

**Rationale**: TTS (Text-To-Speech) is computationally more expensive than text generation because it requires:
- Tokenization and phoneme generation
- Audio synthesis and encoding
- WAV file generation
- Network transmission of binary audio data

60 seconds accommodates this complexity while remaining user-friendly.

**Validation rules**:
- Must be ≥ 45000 (TTS always takes longer than text generation)
- Must be ≤ 120000
- Must be > 0

---

### IMAGE_TIMEOUT_MS

**Type**: `number` (milliseconds)

**Current value**: 45,000 ms (45 seconds)

**New value**: 90,000 ms (90 seconds)

**Purpose**: Controls maximum wait time for image generation (including scene description + image drawing)

**Applies to methods**:
- `wordImage(word, sentence)` - Full image generation workflow (describe → draw)

**Rationale**: Image generation is the most complex workflow:
1. Scene description (30s max)
2. Image drawing (60s max)
3. Both steps are serialized, so total time is sum of both

90 seconds provides adequate headroom without blocking the user for an unreasonable time.

**Validation rules**:
- Must be ≥ 60000 (must accommodate both description and drawing)
- Must be ≤ 180000
- Must be > 0

---

### DESCRIBE_SCENE_TIMEOUT_MS (NEW)

**Type**: `number` (milliseconds)

**Value**: 30,000 ms (30 seconds)

**Purpose**: Controls maximum wait time for scene description generation (independent from image drawing)

**Applies to methods**:
- `describeScene(word, sentence)` - When called as part of image workflow (line 221)

**Rationale**: Scene description is a prerequisite for image drawing. By isolating this timeout, we prevent cascade failures:
- If overall image timeout is 90s and scene description takes 30s, image drawing gets 60s
- Without isolation, if scene description used all 90s, image drawing would timeout immediately

30 seconds is adequate for English-language prompt generation.

**Validation rules**:
- Must be ≥ 15000 (minimum for complex prompts)
- Must be ≤ 45000 (must leave room for image drawing in the 90s total budget)
- Must be < IMAGE_TIMEOUT_MS

---

## State Transitions

None. Timeout constants are immutable after initialization. They do not change during request lifecycle.

## Relationships

No cross-entity relationships. Each timeout constant is independent and used by a single method or set of methods.

## Constraints and Invariants

1. **Ordering invariant**: DESCRIBE_SCENE_TIMEOUT_MS < IMAGE_TIMEOUT_MS
   - Scene description must fit within the image generation window
   - Example: 30s < 90s ✓

2. **Hierarchy invariant**: AUDIO_TIMEOUT_MS > TEXT_TIMEOUT_MS
   - Audio generation (TTS) is more expensive than text generation
   - Example: 60s > 45s ✓

3. **Ceiling invariant**: All timeouts < 120000ms (2 minutes)
   - Prevents user-blocking waits
   - Gives up gracefully before HTTP layer timeout

## Implementation Notes

- Constants defined in `electron/services/ai/service.ts` lines 14-16 and new lines
- Constants are never exported or accessed outside the AiService class
- No configuration UI or runtime override mechanism (by design)
- Timeouts are applied via `AbortSignal.timeout(ms)` in fetch calls
- Changes are backwards-compatible (error handling unchanged)
