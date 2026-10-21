# Contract: AI Service Interface

**Date**: 2026-10-21 | **Feature**: [Gemini Timeout Fix](../spec.md)

## Overview

This contract documents the public interface of the AI service that this feature modifies. The timeout fix adjusts internal request timing but does NOT change the method signatures, parameter types, return types, or error handling contract.

## AiService Class

**Location**: `electron/services/ai/service.ts`

**Purpose**: Provides text, audio, and image generation via Google Gemini API

### Public Methods

#### `wordText(word: string, languageName: string): Promise<WordText>`

**Behavior**: Generates vocabulary definition and example sentences for a word.

**Parameters**:
- `word` (string): The word to generate definitions for
- `languageName` (string): Language name (e.g., "Spanish", "French")

**Returns**: `Promise<WordText>`
```typescript
{
  definition: string;        // Vocabulary definition in target language
  sentences: [string, string, string];  // Exactly 3 example sentences
  best: 0 | 1 | 2;          // Index of clearest sentence
  ipa: string;               // IPA phonetic transcription
}
```

**Errors**: Throws `AiError` with kinds:
- `"timeout"` - Request exceeded TEXT_TIMEOUT_MS (45s) ← **MODIFIED TIMEOUT**
- `"invalid-key"` - Google API key invalid or expired
- `"limit"` - Rate limit exceeded (429)
- `"refused"` - Model refused to respond (content policy)
- `"service"` - Unexpected API error (400, 5xx)
- `"network"` - Network connectivity error

**Timeout**: 45 seconds ← **CHANGED FROM 30s**

---

#### `wordAudio(word: string): Promise<Uint8Array>`

**Behavior**: Generates pronunciation audio for a word using Gemini TTS.

**Parameters**:
- `word` (string): The word to generate audio for

**Returns**: `Promise<Uint8Array>`
- Raw WAV audio bytes (valid audio/wav file format)

**Errors**: Throws `AiError` with kinds:
- `"timeout"` - Request exceeded AUDIO_TIMEOUT_MS (60s) ← **NEW TIMEOUT**
- `"invalid-key"` - Google API key invalid
- `"limit"` - Rate limit exceeded
- `"audio"` - TTS generation failed (model refused, bad response, etc.)
- `"network"` - Network connectivity error

**Timeout**: 60 seconds ← **NEW, SEPARATE FROM TEXT TIMEOUT**

---

#### `wordImage(word: string, sentence: string): Promise<Uint8Array>`

**Behavior**: Generates an illustrative image for a sentence using Gemini image generation. Internally:
1. Calls `describeScene()` to get a visual description
2. Calls `drawImage()` to render the description as JPEG

**Parameters**:
- `word` (string): The vocabulary word
- `sentence` (string): Example sentence from the definition

**Returns**: `Promise<Uint8Array>`
- JPEG image bytes

**Errors**: Throws `AiError` with kinds:
- `"timeout"` - Request exceeded IMAGE_TIMEOUT_MS (90s) ← **MODIFIED TIMEOUT**
- `"image-no-key"` - Google API key missing for image generation
- `"image-key"` - Image API key invalid (401/403)
- `"limit"` - Rate limit exceeded
- `"image"` - Image generation failed (model error, encoding error, etc.)
- `"network"` - Network connectivity error
- `"unusable"` - Scene description was empty/unusable, fallback used

**Timeout**: 90 seconds ← **CHANGED FROM 45s** (covers both describe + draw)

**Cascade timeout**: Internally uses:
- `DESCRIBE_SCENE_TIMEOUT_MS` (30s) for scene description
- `IMAGE_TIMEOUT_MS` (90s) for total workflow

---

## Error Type: AiError

**Location**: `electron/services/ai/errors.ts`

**Definition**:
```typescript
export class AiError extends Error {
  constructor(public kind: AiErrorKind);
}

type AiErrorKind = 
  | "timeout"          // Request timeout (AbortSignal fired)
  | "no-key"           // No Google API key configured
  | "invalid-key"      // API key invalid
  | "limit"            // Rate limited (429)
  | "refused"          // Model refused (content policy)
  | "service"          // API error (400, 5xx)
  | "network"          // Network error
  | "audio"            // Audio generation error
  | "image"            // Image generation error
  | "image-no-key"     // Image generation: no key
  | "image-key"        // Image generation: invalid key
  | "unusable"         // Response unusable (empty, malformed)
  ;
```

**No changes**: Error types and meanings remain unchanged. Timeout handling already converts `DOMException("TimeoutError")` to `AiError("timeout")`.

---

## Client Calling Contract

**Location**: Callers in `src/features/ai-assistant/`

### Expected Caller Behavior

1. **Instantiate AiService** with secrets and settings:
   ```typescript
   const ai = new AiService(secretsService, settingsService, imageShrinkFn);
   ```

2. **Set up AbortController** for user cancellation:
   ```typescript
   const controller = new AbortController();
   const timeout = window.setTimeout(() => controller.abort("cancel"), TIMEOUT_MS);
   ```

3. **Call AI service method** and handle promise:
   ```typescript
   try {
     const result = await ai.wordText(word, lang);
   } catch (error) {
     if (error instanceof AiError) {
       // Handle error.kind (timeout, invalid-key, etc.)
     } else {
       // Unexpected error
     }
   }
   ```

4. **Clean up timers** and cancel controller:
   ```typescript
   clearTimeout(timeout);
   controller.abort("cancel");
   ```

### No Breaking Changes

This feature does NOT change:
- Method signatures
- Parameter types or validation
- Return types
- Error types or error handling flow
- Required caller code changes

---

## Backward Compatibility

✅ **Fully backward compatible**

- Existing callers need no code changes
- Error handling works identically
- Success paths unchanged
- Response data format unchanged

**Why compatible**: Timeouts are internal implementation details. Callers already handle `AiError("timeout")` in their catch blocks.

---

## Testing Contract

Methods should be tested for:
1. Successful completion within timeout window
2. Timeout handling (AbortSignal fires, converts to AiError)
3. Error handling (invalid key, rate limit, service errors)
4. Response validation (correct types, required fields)

Timeout-specific tests should verify:
- Requests complete before timeout fire
- Timeout error is propagated correctly
- No resource leaks on timeout
