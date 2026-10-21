# Contract: Google Generative AI SDK Image Request

## Interface

The `drawImage()` function in `electron/services/ai/service.ts` uses the Google Generative AI SDK to generate images.

### Function Signature

```typescript
private async drawImage(prompt: string, key: string): Promise<Uint8Array>
```

**Input**:
- `prompt`: Finalized image prompt with style directives (from `buildImagePrompt()`)
- `key`: Google API key (from secrets storage)

**Output**:
- `Uint8Array`: JPEG image bytes (shrunk to <8MB)

**Errors**:
- Throws `AiError("invalid-key")` if API key is invalid (401/403)
- Throws `AiError("limit")` if rate limit exceeded (429)
- Throws `AiError("image")` if generation fails (400, parsing error, or size error)
- Throws `AiError("timeout")` if request exceeds IMAGE_TIMEOUT_MS
- Throws `AiError("network")` if network unavailable

---

## SDK Initialization

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: key });
```

**Configuration**: API key from secrets storage (encrypted on disk)

---

## Request Format

```typescript
const interaction = await ai.interactions.create({
  model: this.models().imageModel || 'gemini-3.1-flash-lite-image',
  
  input: prompt,  // String input
  
  generation_config: {
    temperature: 1,
    topP: 0.95,
    thinkingLevel: 'minimal'
  },
  
  response_modalities: ['image'],
  
  response_config: {
    aspectRatio: '1:1',
    outputMimeType: 'image/jpeg'
  }
});
```

**Model Selection**:
- If user has set `imageModel` in Connect AI dialog, use that value
- Otherwise, use default `gemini-3.1-flash-lite-image`

**Generation Config**:
- `temperature: 1` — Moderate randomness
- `topP: 0.95` — Nucleus sampling for diversity
- `thinkingLevel: 'minimal'` — Fast generation (no extended reasoning)

**Response Modalities**:
- `['image']` — Request image output only (no text responses)

**Response Config**:
- `aspectRatio: '1:1'` — Square images for word cards
- `outputMimeType: 'image/jpeg'` — Standard format, compressed

---

## Response Format

```typescript
// SDK returns an Interaction object
interface Interaction {
  steps: Step[];
}

interface Step {
  type: 'model_output' | 'user_input';
  content: Part[];
}

interface Part {
  type: 'text' | 'image' | 'audio';
  data?: string;        // Base64-encoded for image/audio
  mimeType?: string;    // Content type hint
  text?: string;        // For text parts
}
```

**Image Extraction**:
```typescript
const candidates = (interaction.steps ?? [])
  .filter(s => s.type === 'model_output')
  .flatMap(s => s.content ?? []);

const imagePart = candidates.find(p => p.type === 'image');
const base64Data = imagePart?.data; // String, base64-encoded
```

---

## Error Handling

### HTTP Status Codes

| Status | SDK Exception | AiError Kind | Message |
|--------|---------------|--------------|---------|
| 401 | AuthenticationError | `invalid-key` | "Google did not accept your API key. Check it in AI settings." |
| 403 | ForbiddenError | `invalid-key` | "Google did not accept your API key. Check it in AI settings." |
| 429 | RateLimitError | `limit` | "The usage limit was reached. Try again later." |
| 400 | BadRequestError | `image` | "Image could not be created." |
| Other 4xx/5xx | Error | `image` | "Image could not be created." |
| Network timeout | DOMException | `timeout` | "The AI service took too long. Try again." |
| Network error | Error | `network` | "Could not reach the AI service. Check your connection and try again." |

### Exception Handling

```typescript
try {
  const interaction = await ai.interactions.create({...});
  // Parse response
} catch (error) {
  // SDK throws specific exception types
  if (error instanceof AuthenticationError) throw new AiError("invalid-key");
  if (error instanceof RateLimitError) throw new AiError("limit");
  if (error instanceof BadRequestError) throw new AiError("image");
  if (error instanceof DOMException && error.name === "TimeoutError") throw new AiError("timeout");
  throw new AiError("network");  // Default for unexpected errors
}
```

---

## Response Parsing

```typescript
// 1. Extract image part from interaction
const imageData = imagePart?.data;  // Base64 string

// 2. Validate
if (!imageData || imageData.length === 0) throw new AiError("image");

// 3. Decode base64 to bytes
let bytes: Uint8Array;
try {
  bytes = new Uint8Array(Buffer.from(imageData, 'base64'));
} catch {
  throw new AiError("image");
}

// 4. Validate size
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;  // 8 MB
if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
  throw new AiError("image");
}

// 5. Shrink (optimize JPEG quality/size)
try {
  return this.shrink(bytes);
} catch {
  throw new AiError("image");
}
```

---

## Timeouts

- SDK request timeout: `IMAGE_TIMEOUT_MS = 90_000` (90 seconds)
- Signal: `AbortSignal.timeout(IMAGE_TIMEOUT_MS)`
- Handling: Caught as `DOMException` with `name === "TimeoutError"`

---

## Backward Compatibility

- Existing `imageModel` setting continues to work
- If empty, SDK uses hardcoded default model
- No breaking changes to AiError kinds or error messages
- No changes to IPC contract between renderer and main process

---

## Testing

**Unit Tests**:
- ✓ SDK initializes with valid key
- ✓ Valid prompt generates image
- ✓ Invalid key throws "invalid-key" error
- ✓ Exceeded quota throws "limit" error
- ✓ Malformed response throws "image" error
- ✓ Timeout throws "timeout" error
- ✓ Network error throws "network" error

**Integration Tests**:
- ✓ wordImage() calls drawImage() with SDK (not REST)
- ✓ Error from drawImage() propagates to UI as AiError
- ✓ Image bytes are valid JPEG after shrinking

**Manual Tests** (in quickstart.md):
- ✓ Generate image with valid key → Image displays
- ✓ Revoke key, try again → Shows "invalid-key" error
- ✓ Hit rate limit → Shows "limit" error
- ✓ Invalid prompt format → Shows specific error
