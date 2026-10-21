# Data Model: Google Generative AI SDK Integration

## Overview

This document defines the data structures used in the Google Generative AI SDK image generation flow.

---

## Entities

### 1. ImageGenerationRequest

**Purpose**: Input parameters for creating an image via the SDK

**Fields**:
- `prompt`: string (required) — The complete image prompt with style directives
- `model`: string (required) — Model identifier (e.g., "gemini-3.1-flash-lite-image")
- `generationConfig`: object (required)
  - `temperature`: number (0-2) — Randomness control
  - `topP`: number (0-1) — Nucleus sampling parameter
  - `thinkingLevel`: string (optional) — 'minimal' | 'standard' | 'extended'
- `responseConfig`: object (required)
  - `outputMimeType`: string — 'image/jpeg'
  - `aspectRatio`: string — '1:1' for square images
- `responseModalities`: string[] — ['image'] for image-only requests

**Validation**:
- `prompt`: Non-empty string, max 2000 characters
- `temperature`: 0 ≤ temp ≤ 2
- `topP`: 0 < topP ≤ 1
- `outputMimeType`: Must be 'image/jpeg' or 'image/png'
- `aspectRatio`: Must match pattern '\d+:\d+' (e.g., '1:1')

**Example**:
```typescript
{
  prompt: "A sunset over a mountain landscape...",
  model: "gemini-3.1-flash-lite-image",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    thinkingLevel: "minimal"
  },
  responseConfig: {
    outputMimeType: "image/jpeg",
    aspectRatio: "1:1"
  },
  responseModalities: ["image"]
}
```

---

### 2. SDKInteraction (Response)

**Purpose**: Structured response from `GoogleGenAI.interactions.create()`

**Fields**:
- `steps`: Step[] — Array of request-response turns
  - `type`: 'model_output' | 'user_input'
  - `content`: Part[] — Array of response parts
    - `type`: 'text' | 'image' | 'audio'
    - `data`: string — Base64-encoded data (for text/image/audio parts)
    - `mimeType`: string (optional) — Content type hint

**Example**:
```typescript
{
  steps: [
    {
      type: "model_output",
      content: [
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUg...",  // Base64 JPEG
          mimeType: "image/jpeg"
        }
      ]
    }
  ]
}
```

---

### 3. ImageData (Extracted Output)

**Purpose**: Processed image ready for storage/display

**Fields**:
- `bytes`: Uint8Array — Raw JPEG image data (decoded from base64)
- `mimeType`: string — 'image/jpeg'
- `sizeBytes`: number — Size after shrinking/optimization

**Constraints**:
- Size must not exceed 8 MB (MAX_IMAGE_BYTES constant)
- Must be valid JPEG (verify on decode)
- May be further compressed by `shrink()` function

---

## State Transitions

### Image Generation Lifecycle

```
[START]
    ↓
[Describe Scene] → (via text model)
    ↓
[Build Image Prompt]
    ↓
[Call SDK] → Create interaction with image request
    ↓
[Parse Response] → Extract bytes from interaction.steps
    ↓
[Shrink Image] → Optimize JPEG quality/size
    ↓
[Ready] → Return Uint8Array to caller
    ↓
[Store/Display]
```

### Error States

```
[API Error]        → AiError("invalid-key" | "limit" | "image" | "timeout")
[Network Error]    → AiError("network")
[Parse Error]      → AiError("image")
[Size Error]       → AiError("image")
[Shrink Error]     → AiError("image")
```

---

## Data Flow Diagram

```
User triggers Auto-fill
        ↓
  [wordImage(word, sentence)]
        ↓
  [describeScene()] → Text model generates scene description
        ↓
  [buildImagePrompt(scene)] → Append style directives
        ↓
  [drawImage(prompt, key)] → Create GoogleGenAI instance
        ↓
  GoogleGenAI.interactions.create({
    model, prompt, generationConfig, responseConfig
  })
        ↓
  [Extract ImageData from interaction.steps]
        ↓
  [shrink()] → Optimize file size
        ↓
  Return Uint8Array ← Stored as media file
        ↓
  Display on word card
```

---

## Relationships

- **GenerationConfig** belongs to **ImageGenerationRequest**
- **SDKInteraction** contains multiple **Part** objects
- **ImageData** is derived from Part (type='image')
- **ImageData** optionally references a media record in SQLite (media ID)

---

## Notes

- SDK abstracts endpoint URL; no hardcoded URL in data model
- Model name passed by user via `imageModel` setting (from Connect AI dialog)
- Response structure (steps/content) is SDK standard for interactions API
- Error handling maps SDK exceptions to existing AiError types (no new types added)
