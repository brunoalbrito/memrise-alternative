> **Superseded by `specs/013-pollinations-images`**: pictures are now created by Pollinations, not Google. This
> contract is kept for history.

# Contract: Gemini image request

Same endpoint, headers and key rules as `specs/010-ai-word-assistant/contracts/gemini-api.md`.

## Request

```json
{
  "model": "<image model, default gemini-nano-banana-2.1>",
  "input": [{ "type": "text", "text": "<prompt>" }],
  "response_format": {
    "type": "image",
    "mime_type": "image/jpeg",
    "aspect_ratio": "1:1",
    "image_size": "1K"
  }
}
```

Prompt: see `specs/012-fix-image-relevance/contracts/prompt.md` (a scene built from the whole selected sentence; it
superseded the first version of this prompt).

## Response extraction

1. `output_image.data` (base64), else
2. first `steps[].content[]` item with a string `data` whose `mime_type` is missing or starts with `image/`, else
3. `candidates[0].content.parts[].inlineData.data` where `inlineData.mimeType` starts with `image/`.

The base64 is decoded to a Blob typed `image/jpeg` (or the reported type), then reduced (max 768 px longest
side, JPEG quality 0.85, retry 0.7 if above 1.5 MB). No data means kind `image`.

## Errors

Same table as the text request. A failed image request maps to kind `image` unless it is `invalid-key`, `limit`,
`network` or `timeout`, which keep their kind.
