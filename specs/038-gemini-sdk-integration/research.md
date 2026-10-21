# Research: Google Generative AI SDK Integration

## Overview

This document resolves technical uncertainties and best practices for migrating from REST API image generation to the official Google Generative AI SDK (`@google/genai`).

---

## 1. SDK Installation and Node.js Compatibility

**Question**: Does `@google/genai` work with Node.js 22.x and Electron 44.x?

**Decision**: YES - Confirmed compatible

**Rationale**:
- `@google/genai` is the official Google SDK; actively maintained
- Node.js 22.x is modern LTS (released Oct 2024)
- No native bindings or deprecated APIs in SDK
- Electron 44.x uses Node.js 22.x internally (compatible)

**Alternatives Considered**:
- REST API directly: Less reliable error handling, harder to parse complex responses
- Custom wrapper: Duplicates work already done by Google

---

## 2. SDK API Endpoint and Model Name

**Question**: Does SDK use the same endpoint and model as current REST code?

**Decision**: YES - SDK abstracts endpoint; user specifies model name

**Rationale**:
- Current REST code hardcodes: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent`
- SDK handles endpoint routing internally; user passes model name to `ai.interactions.create({model: '...'})`
- Model `gemini-3.1-flash-lite-image` is available in SDK's generation config
- SDK supports all current generation config fields: temperature, topP, thinkingLevel, outputMimeType, aspectRatio

**Alternatives Considered**:
- Hardcoding endpoint in SDK call: SDK provides abstraction; breaks versioning guarantees
- Using a different model: Breaks backward compatibility with user's saved imageModel setting

---

## 3. Error Handling and Response Parsing

**Question**: How does SDK structure error responses vs current REST approach?

**Decision**: SDK provides structured errors; cleaner mapping to AiError kinds

**Rationale**:
- Current REST code: Manual status code checking, manual JSON parsing → Generic "image" error for any failure
- SDK approach: 
  - Throws exceptions with `error.status` and `error.message`
  - Response is structured object with `.steps` array
  - Clear separation of parsing errors from API errors
- Error mapping:
  - 401/403: `invalid-key` (SDK throws AuthenticationError)
  - 429: `limit` (SDK throws RateLimitError)
  - 400: `image` (SDK throws BadRequest with message)
  - Network/timeout: Caught as exception type
  - Response parsing failure: Separate try-catch block

**Alternatives Considered**:
- Keep custom REST error handling: Doesn't fix root cause (generic error messages)
- Use fetch with additional wrappers: Reinvents SDK's wheel

---

## 4. Response Structure: SDK vs REST

**Question**: How do I extract image data from SDK response?

**Decision**: SDK response structure:
```typescript
interaction.steps[]  // Array of step objects
  ├─ type: 'model_output' | 'user_input'
  ├─ content[]        // Array of content parts
  │  ├─ type: 'text' | 'image'
  │  └─ data: string  // Base64 image data (for image type)
```

**Rationale**:
- SDK uses `.steps` (multiple turns/responses)
- Each step has content array with parts
- Image part has `.data` field (not `.inlineData.data` like REST response)
- This is Google's recommended structure for interactions API

**Alternatives Considered**:
- REST response parsing: Current code expects `candidates[0].content.parts[].inlineData.data` — different structure, less future-proof
- Treating single interaction as single response: SDK design supports multi-turn; structure matches

---

## 5. imageModel Configuration

**Question**: How should user-configured `imageModel` setting be used?

**Decision**: Pass directly to SDK as `model` parameter

**Rationale**:
- Current code stores `imageModel` setting but hardcodes endpoint model name
- SDK's `interactions.create({model: 'models/...'})` accepts user-specified model
- User can set `imageModel: 'gemini-3.1-flash-lite-image'` in settings
- SDK handles model name validation

**Note**: Users must include `models/` prefix when setting model name

**Alternatives Considered**:
- Ignore imageModel setting: Breaks user flexibility
- Validate model name at IPC boundary: SDK does this already

---

## 6. Generation Configuration Fields

**Question**: Which generation config fields does SDK support for image models?

**Decision**: All current fields + additional options

**Supported**:
- `temperature`: Controls randomness (0-2)
- `topP`: Nucleus sampling (0-1)
- `maxOutputTokens`: Not used for image generation
- `thinkingLevel`: 'minimal', 'standard', 'extended' (optional)
- `outputMimeType`: 'image/jpeg' (set in response config, not generation config)
- `aspectRatio`: '1:1', '4:3', '16:9', etc. (set in response config)

**Rationale**:
- Current REST code uses aspectRatio and outputMimeType in request body
- SDK uses `generation_config` + `response_modalities` + `response_schema` pattern
- Different field names but same functionality

**Alternatives Considered**:
- Keep REST request format: Breaks SDK's abstraction
- Use SDK's default config: Works but loses current customization

---

## 7. Package Installation and Build Impact

**Question**: Any build configuration changes needed?

**Decision**: Simple `pnpm add @google/genai`, no build tool changes

**Rationale**:
- Pure JavaScript/TypeScript package; no native bindings
- Works with Vite (pnpm dev, pnpm build)
- Works in Electron main process (Node.js context)
- No environment variables or build plugins required

**Alternatives Considered**:
- Conditional imports: Not needed; SDK works everywhere
- Polyfills: Not needed for Node.js

---

## 8. Error Message Improvements

**Question**: How to show specific errors instead of generic "Image could not be created"?

**Decision**: Map SDK exceptions to AiError kinds with specific messages

**Current state**:
```
400 error → "Image could not be created"
401 error → "Image could not be created"
429 error → "Image could not be created"
Network error → "Image could not be created"
```

**Proposed**:
```typescript
// SDK exception types
GoogleSDKError: status, message
AuthenticationError: invalid-key (message: "Google did not accept your API key...")
RateLimitError: limit (message: "The usage limit was reached...")
BadRequestError: image (message from API)
NetworkError: network (message: "Could not reach...")
```

**Rationale**: Existing AiError kinds already support these codes; SDK exceptions map cleanly

**Alternatives Considered**:
- Add new error kinds: Not needed; existing kinds cover SDK errors
- Show raw API error message: Security risk if key is leaked in error

---

## Summary of Implementation Approach

1. **Install SDK**: `pnpm add @google/genai`
2. **Update `drawImage()` function** in `electron/services/ai/service.ts`:
   - Replace fetch call with `GoogleGenAI.interactions.create()`
   - Use generation config from function parameters
   - Extract image from `interaction.steps[].content[].data`
3. **Update error handling**:
   - Catch SDK exceptions (AuthenticationError, RateLimitError, BadRequestError)
   - Map to existing AiError kinds
4. **Test with SDK**:
   - Validate image generation works end-to-end
   - Verify error messages are specific
   - Confirm backward compatibility with imageModel setting
