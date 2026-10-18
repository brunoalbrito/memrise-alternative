# Contract: Pollinations image request

Source: https://github.com/pollinations/pollinations/blob/main/APIDOCS.md (fetched 2026-10-18).

## Request

```
GET https://gen.pollinations.ai/image/<encodeURIComponent(prompt)>?width=768&height=768[&model=<model>]
Authorization: Bearer <learner's Pollinations key>
```

- The key is only ever sent in the `Authorization` header, never in a URL or logged.
- `model` is added only when the learner set a model name; empty means Pollinations' default.
- Prompt (same as `specs/012-fix-image-relevance/contracts/prompt.md`, URL-encoded into the path).

## Response

Raw image bytes. `Content-Type` must start with `image/`; otherwise the request counts as failed (`image`).
The blob goes through `shrinkImage` (longest side 768 px, JPEG quality 0.85, retry 0.7 above 1.5 MB).

## Errors

| Condition | Kind |
|-----------|------|
| HTTP 401, 403 | `image-key` |
| HTTP 402 | `image-credit` |
| HTTP 429 | `limit` |
| `fetch` rejects with `TypeError` (includes blocked cross-origin) | `network` |
| Aborted by the 45 s timeout | `timeout` |
| No key saved (no request sent) | `image-no-key` |
| Other status, wrong content type, empty or undecodable body | `image` |

## Messages (exact)

| Kind | Message | Action |
|------|---------|--------|
| image-no-key | "Add your Pollinations key in AI settings to create images." | Open AI settings |
| image-key | "Pollinations did not accept your key. Check it in AI settings." | Open AI settings |
| image-credit | "Your Pollinations balance or budget is used up." | New image |
| limit | "The usage limit was reached. Try again later." | New image |
| network | "Could not reach the AI service. Check your connection and try again." | New image |
| timeout | "The AI service took too long. Try again." | New image |
| image | "Image could not be created." | New image |
