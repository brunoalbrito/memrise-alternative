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

Prompt (word and sentence are quoted data):

```
Create a simple, clear, friendly illustration that shows the meaning of the word <JSON-quoted word> as used
in this sentence: <JSON-quoted sentence>. One clear subject on a plain light background. Do not include
any text, letters, numbers, captions or watermarks.
```

## Response extraction

1. `output_image.data` (base64), else
2. first `steps[].content[]` item with a string `data` whose `mime_type` is missing or starts with `image/`, else
3. `candidates[0].content.parts[].inlineData.data` where `inlineData.mimeType` starts with `image/`.

The base64 is decoded to a Blob typed `image/jpeg` (or the reported type), then reduced (max 768 px longest
side, JPEG quality 0.85, retry 0.7 if above 1.5 MB). No data means kind `image`.

## Errors

Same table as the text request. A failed image request maps to kind `image` unless it is `invalid-key`, `limit`,
`network` or `timeout`, which keep their kind.
