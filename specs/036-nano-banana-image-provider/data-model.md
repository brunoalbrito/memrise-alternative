# Data Model: Nano Banana 2 Lite Image Provider

**Status**: Draft (awaiting API research) | **Date**: 2026-10-21

## Entities

### AIProviderConfig

Stores API configuration for image generation providers (Google, Nano Banana 2 Lite).

| Field | Type | Validation | Purpose |
|-------|------|-----------|---------|
| `providerId` | string (enum) | `"nanoBanana"` or `"google"` | Provider identifier |
| `apiKey` | string (encrypted) | Non-empty, no spaces | Secure storage on device |
| `last4` | string | Last 4 chars of key | Masked display |
| `modelName` | string | NEEDS CLARIFICATION: Nano Banana model names | User-selected model; empty → default |
| `connected` | boolean | True if key exists | Connection status |
| `createdAt` | timestamp | ISO 8601 | When key was saved |
| `updatedAt` | timestamp | ISO 8601 | Last modification |

### ImageGenerationRequest

Request sent to Nano Banana 2 Lite API.

| Field | Type | Example | Validation |
|-------|------|---------|-----------|
| `prompt` | string | "A humid garden in summer with golden light, photorealistic" | Non-empty, max 20k chars |
| `model` | string | `gemini-3.1-flash-lite-image` | Required; always use this model |
| `aspect_ratio` | string (optional) | `1:1` (default), `16:9`, `9:16` | One of 14 supported; omit for default |
| `output_format` | string (optional) | `jpg` (default) or `png` | jpg or png |

**Note**: Width/height not configurable. Nano Banana 2 Lite outputs fixed **1024×1024px** (aspect_ratio adjusts display proportions).

### ImageGenerationResponse

Response from Nano Banana 2 Lite API.

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `imageBase64` | string | `/9j/4AAQSkZJRgABAQEAYABgAAD/...` | Base64-encoded image (from `candidates[0].content.parts[0].inlineData.data`) |
| `mimeType` | string | `image/jpeg` or `image/png` | MIME type from API response |
| `generatedAt` | timestamp | ISO 8601 | When generated (client-side timestamp) |
| `model` | string | `gemini-3.1-flash-lite-image` | Model ID used |
| `resolution` | object | `{width: 1024, height: 1024}` | Fixed 1K; aspect ratio affects display |

---

## State Transitions

### Key Lifecycle

```
[No Key] 
  → saveKey(apiKey) → [Connected] 
  → removeKey() → [No Key]
```

### Image Generation Lifecycle

```
[Waiting for User]
  → startImageGeneration(prompt, selectedSentence)
  → [Generating...]
  → onImageReceived(imageUrl)
  → [Image Ready]
  → replaceImage() → [Generating...]
  → applyImage() → [Image Attached]
```

---

## Validation Rules

### API Key Validation

- Must be non-empty string
- Must not contain leading/trailing whitespace (trim before saving)
- No fixed length requirement (varies by provider: Google AI Studio, EvoLink, FAL.ai, etc.)
- Stored encrypted in SQLite

### Model Validation

- Always use `gemini-3.1-flash-lite-image` (recommended model for MemBetter)
- Do not expose model selection to users in v1 (simplicity)
- Future versions could allow model choice if needed

### Aspect Ratio Validation

- If empty or omitted: defaults to `1:1` (square, 1024×1024)
- If provided: must be one of 14 supported ratios:
  - Square: `1:1`
  - Common: `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
  - Wide: `19:9`, `9:19`, `21:9`, `9:21`, `40:9`, `9:40`, `8:1`
- Nano Banana automatically crops/scales to fit aspect ratio while maintaining 1K pixel count

### Prompt Validation

- Non-empty string (required)
- Max 20,000 characters (API limit)
- UTF-8 encoded
- Sent as-is to Nano Banana (no transformation)
- Detailed prompts → better images (include subject, setting, lighting, style)

---

## Storage Schema (SQLite)

### Table: `ai_provider_configs`

```sql
CREATE TABLE ai_provider_configs (
  id INTEGER PRIMARY KEY,
  provider_id TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  last_4 TEXT NOT NULL,
  model_name TEXT,
  connected BOOLEAN DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(provider_id)
);
```

### Example Rows

| provider_id | api_key_encrypted | last_4 | model_name | connected |
|-------------|-------------------|--------|------------|-----------|
| `nanoBanana` | `<encrypted>` | `xyz7` | (empty) | 1 |
| `google` | `<encrypted>` | `abc4` | `gemini-2.0-flash` | 1 |

---

## API Contract with Google Gemini (Nano Banana 2 Lite)

**Status**: ✅ Confirmed

**Reference**: See [contracts/nano-banana-api.md](contracts/nano-banana-api.md) for full specification.

**Quick Summary**:
- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY` (Google's official API; free tier)
- **Auth**: API key in query parameter (from Google AI Studio)
- **Request**: `{contents[0].parts[0].text: prompt, generationConfig: {aspectRatio?, outputMimeType?}}`
- **Response**: Base64-encoded image in `candidates[0].content.parts[0].inlineData.data`
- **Rate Limits**: 100 req/min, 10 concurrent max (free tier)
- **Performance**: ~4 seconds per image
- **Error Handling**: 400 (bad request), 429 (rate limit), 500/503 (server error)

---

## Migration Path: Pollinations → Nano Banana 2 Lite

### On App Launch (First Run After Migration)

1. App reads `pollinationsConnected` and `pollinationsLast4` from storage
2. If Pollinations config exists:
   - Prompt user: "Image provider changed to Nano Banana 2 Lite. Please enter your new API key."
   - Clear Pollinations config
   - Provide form to enter Nano Banana key
3. User enters Nano Banana key → saved as `nanoBananaConnected: true`

### Field Renaming (Internal)

| Old Field (Pollinations) | New Field (Nano Banana) | Type |
|--------------------------|-------------------------|------|
| `pollinationsConnected` | `nanoBananaConnected` | boolean |
| `pollinationsLast4` | `nanoBananaLast4` | string |
| `pollinationsModel` | `nanoBananaModel` | string |

---

## Out of Scope

- Supporting both Pollinations and Nano Banana simultaneously
- Multiple image providers (future feature)
- Changing existing image attachment logic
