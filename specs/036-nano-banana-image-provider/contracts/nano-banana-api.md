# API Contract: Nano Banana 2 Lite Image Generation

**Status**: Confirmed | **Date**: 2026-10-21 | **Updated**: 2026-10-21

## Overview

This contract defines the interface between MemBetter and Nano Banana 2 Lite's image generation API (via EvoLink, FAL.ai, or Google AI Studio). It specifies request/response formats, error handling, and validation rules.

---

## HTTP Request Contract

### Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY
```

**Authentication Method**: API key in query parameter (simplest for desktop app)

**Alternative Providers** (gateway proxies; not recommended for v1):
- EvoLink: `https://api.evolink.ai/v1/images/generations`
- FAL.ai: `https://api.fal.ai/v1/images/generations`
- Cloudflare AI Gateway: Proxied through Cloudflare

### Headers

| Header | Value | Required | Example |
|--------|-------|----------|---------|
| `Content-Type` | `application/json` | Yes | `application/json` |
| `User-Agent` | App identifier | Optional | `MemBetter/1.0` |

**Authentication**: API key from Google AI Studio (`aistudio.google.com/apikey`) passed as query parameter `?key=YOUR_API_KEY`. Free tier available; no billing required for reasonable usage.

### Request Body

Google Gemini API uses wrapped content format:

```typescript
{
  "contents": [
    {
      "parts": [
        {
          "text": string;  // Required: Image description (up to 20,000 characters)
          "inlineData"?: {
            "mimeType": "image/jpeg" | "image/png" | "image/webp" | "image/heic";
            "data": string;  // Base64-encoded image for image-to-image editing (optional)
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "aspectRatio"?: string;      // Optional: "1:1", "16:9", "9:16", etc.
    "outputMimeType"?: string;   // Optional: "image/jpeg" (default) or "image/png"
  }
}
```

**Examples**:

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "A humid garden in summer with rain drops on glistening leaves, golden afternoon light, photorealistic"
        }
      ]
    }
  ],
  "generationConfig": {
    "aspectRatio": "1:1",
    "outputMimeType": "image/jpeg"
  }
}
```

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "A sun-drenched Mediterranean courtyard with terracotta pots and bougainvillea flowers"
        }
      ]
    }
  ],
  "generationConfig": {
    "aspectRatio": "16:9"
  }
}
```

### Validation

- `text` (prompt): Non-empty, max 20,000 characters, UTF-8 encoded
- `aspectRatio`: One of 14 supported ratios; omitted → defaults to `1:1`
  - Supported: `1:1`, `16:9`, `9:16`, `2:3`, `3:2`, `4:3`, `3:4`, `21:9`, `9:21`, `19:9`, `9:19`, `40:9`, `9:40`, `8:1`
- `outputMimeType`: `image/jpeg` (default), `image/png`, `image/webp`, `image/heic`

---

## HTTP Response Contract

### Success Response (200 OK)

```typescript
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": string;  // "image/jpeg", "image/png", "image/webp", or "image/heic"
              "data": string;      // Base64-encoded image data
            }
          }
        ]
      }
    }
  ]
}
```

**Response Path**: Image data at `candidates[0].content.parts[0].inlineData.data`

**Example**:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inlineData": {
              "mimeType": "image/jpeg",
              "data": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDACAgICAg..."
            }
          }
        ]
      }
    }
  ]
}
```

**Image Handling**: Decode base64 data to display or save:
```typescript
const imageData = response.candidates[0].content.parts[0].inlineData.data;
const mimeType = response.candidates[0].content.parts[0].inlineData.mimeType;
const dataUrl = `data:${mimeType};base64,${imageData}`;  // Display in <img src={dataUrl}>
// Or save to file: Buffer.from(imageData, 'base64')
```

### Error Response (4xx, 5xx)

**Common Error Cases**:

| HTTP Code | Error Code | Cause | Resolution |
|-----------|-----------|-------|-----------|
| **400** | Bad Request | Malformed payload, invalid parameters | Check request format |
| **403** | Forbidden | Invalid or expired API key | Verify API key in settings |
| **404** | Not Found | Invalid endpoint or model ID | Check endpoint URL |
| **429** | RESOURCE_EXHAUSTED | Rate limit exceeded (100 req/min) or quota exceeded | **Wait 60 seconds**, reduce concurrent requests |
| **500** | Internal Server Error | Provider side error | Retry with exponential backoff |
| **503** | Service Unavailable | Provider maintenance | Retry later |
| **504** | Gateway Timeout | Request took too long (usually >30s) | Simplify prompt, reduce detail |

**Error Response Format**:

```json
{
  "error": {
    "code": "RESOURCE_EXHAUSTED",
    "message": "Rate limit exceeded. Please wait before retrying."
  }
}
```

**Most Common Error**: **429 RESOURCE_EXHAUSTED** (~70% of errors when they occur)
- Cause: Exceeded 100 requests/minute or 10 concurrent requests
- **Fix**: Implement exponential backoff; retry after 60 seconds

---

## Field Mappings

### MemBetter → Google Gemini API Request

| MemBetter Field | Google API Path | Transform | Notes |
|-----------------|-----------------|-----------|-------|
| `prompt` (from selected sentence) | `contents[0].parts[0].text` | As-is (up to 20k chars) | Detailed descriptions → better images |
| `nanoBananaAspectRatio` (optional, default `1:1`) | `generationConfig.aspectRatio` | As-is (e.g., `16:9`); omit for default | Defaults to `1:1` (square) |
| `(hardcoded: jpeg)` | `generationConfig.outputMimeType` | Always `image/jpeg` | Balances size and quality |

**MemBetter Image Generation Hardcodes**:
- Resolution: **1024×1024px** (fixed by Gemini image generation) — no user-configurable width/height
- Aspect ratio: User can optionally select from 14 ratios; default `1:1`
- MIME type: `image/jpeg` (default; could add PNG option later)

### Google Gemini Response → MemBetter

| Google API Field | MemBetter Usage | Transform |
|-------------------|-----------------|-----------|
| `candidates[0].content.parts[0].inlineData.data` | Store as image buffer/data URL | Decode base64 → display in <img> or save to file |
| `candidates[0].content.parts[0].inlineData.mimeType` | Image MIME type | Cache for re-encoding if needed |

---

## Rate Limits & Quotas

**Confirmed Limits** (per API key):
- **100 image requests per minute** (hard limit)
- **10 concurrent requests maximum** (reject 11th until one completes)
- **Fixed resolution**: 1K (1024×1024px) for all outputs

**Handling Strategy**:
1. Queue image requests when approaching 100/min
2. Reject 11th concurrent request with user message: "Maximum 10 images at once. Please wait for one to finish."
3. On 429 error: exponential backoff (wait 60s minimum before retry)
4. Track per-minute quota in frontend; warn user when approaching limit

---

## Error Handling Strategy

**General Principle**: Surface clear, actionable errors to user.

| Error Type | User Message | Action |
|------------|--------------|--------|
| Invalid API key (403) | "Image generation failed: Invalid Nano Banana API key. Check your key in Settings." | Open Connect AI dialog for key correction |
| Rate limit exceeded (429) | "Image generation failed: Rate limit exceeded (100 per minute). Please try again in a moment." | Wait 60s; retry automatically or show retry button |
| Concurrent limit (429) | "Image generation failed: Maximum 10 images at once. Please wait for another to finish." | Queue request; auto-retry when slot opens |
| API server error (500, 503) | "Image generation failed: Service temporarily unavailable. Try again later." | Exponential backoff retry (5s, 10s, 20s) |
| Bad request (400) | "Image generation failed: Invalid request. Please try again." | Log full error; no user-facing detail |
| Network error (timeout) | "Image generation failed: Network error. Check your connection." | Retry with backoff |
| Safety violation | "Image request violates safety policies. Please try a different description." | Suggest softer prompt |

**Logging**: Log all errors to console/debug logs for troubleshooting.

---

## Backwards Compatibility

**Migration from Pollinations**:
- ❌ Old Pollinations keys are **NOT compatible** with Nano Banana
- ✅ User must provide new Nano Banana key (free tier available via Google AI Studio)
- ✅ Existing images (already attached to words) are preserved
- ✅ Only new image generation requests use Nano Banana
- ✅ App detects old Pollinations config on startup; prompts user to configure Nano Banana

---

## Performance & Caching

**Generation Speed**: ~4 seconds per image (much faster than Pollinations ~15-30s)

**Caching Strategy** (future optimization, out of scope for Phase 2):
- Fixed 1K resolution simplifies cache key: `hash(prompt + aspect_ratio) → imageData`
- Could cache identical requests within 24 hours to reduce API calls

---

## Testing Strategy

### Unit Tests
- Request payload construction (prompt, model, aspect_ratio)
- Response parsing (base64 decode, MIME type extraction)
- Error message mapping (403 → key error, 429 → rate limit, etc.)
- Rate limit queue logic (100/min, 10 concurrent)

### Integration Tests
- Call live Nano Banana API with test key
- Verify image generation succeeds within 10s
- Verify error cases: invalid key, rate limit, network timeout
- Verify base64 response decoding

### E2E Tests
- Full flow: Save Nano Banana key → Generate image → Attach to word → Reload → Image persists
- Error recovery: Provide invalid key → Show error → Fix key → Retry succeeds
- Rate limit: Queue images when exceeding limits; auto-retry when available

---

## API Documentation References

- **Google AI Studio** (Free, Recommended): https://aistudio.google.com/apikey
- **Google Generative AI API Docs**: https://ai.google.dev/api/generate-images
- **Google Cloud Gemini API**: https://cloud.google.com/docs/generative-ai
- **Alternative Providers** (not recommended for v1):
  - EvoLink: https://evolink.ai/docs/en/api-manual/image-series/nanobanana/nanobanana-2-lite/
  - FAL.ai: https://fal.ai/models/google/nano-banana-2-lite/api
  - Vercel AI Gateway: https://vercel.com/ai-gateway/models/gemini-3.1-flash-lite-image/api

---

## Related Artifacts

- **Data Model**: [data-model.md](../data-model.md)
- **Quickstart**: [quickstart.md](../quickstart.md)
- **Implementation Tasks**: [tasks.md](../tasks.md) (generated by `/speckit-tasks`)
