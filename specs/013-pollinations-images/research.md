# Research: Pollinations Image Provider

## R1. API shape (from Pollinations' APIDOCS.md, fetched 2026-10-18)
- `GET https://gen.pollinations.ai/image/{prompt}` returns raw image bytes (`image/jpeg`, `image/png` or
  `image/svg+xml` depending on the model).
- Auth: `Authorization: Bearer <key>` (preferred) or `?key=<key>`.
- Parameters: `model` (default `tongyi-mai/z-image-turbo`), `width`, `height` (default 1024), `seed`, `safe`,
  `quality`, `image` (reference images).
- Errors: 401 key missing or invalid, 402 account or per-key budget exhausted, 429 rate limit (see
  `Retry-After`), 400 invalid parameters, 502 upstream provider, usually transient.
- Key types: `sk_` secret keys are for backends and "never expose in browsers"; `pk_` app keys are for an OAuth
  flow; raw legacy `pk_` keys are rate-limited to 1 pollen per IP per hour.
- **Decision**: Use the header method, `width=768&height=768`, and `model` only when the learner set one (empty
  means the provider default). Never use the `?key=` form so the key never appears in a URL.

## R2. Using the key in a browser
- **Risk**: Pollinations says secret keys should not be exposed in browsers, and CORS is not documented. This
  app is frontend-only and keeps the learner's own key in their own browser storage, like the Google key, which
  is acceptable for personal use but means any script on the page could read it.
- **Decision**: Accept the learner's key as given, warn in the dialog (use a key with a spending limit, remove it
  on shared computers) and send it only in the header. If the browser blocks the request (a CORS failure looks
  like a network error), the Image section shows the network message; quickstart scenario 1 verifies it with
  a real key. If CORS blocks it, the follow-up is a tiny proxy or the Pollinations app-key OAuth flow, outside
  this feature.
- **Alternatives**: A proxy server (not part of this project); the OAuth "bring your own pollen" flow (a larger
  feature).

## R3. Prompt
- **Decision**: Keep the scene-based prompt from feature 012 unchanged (sentence first, word visible, no text),
  URL-encoded into the path with `encodeURIComponent`.
- **Rationale**: FR-002. The prompt is about 400 characters, well within URL limits.

## R4. Settings and migration
- **Decision**: `aiStore` adds `pollinationsKey` ("" default) with `savePollinationsKey` and
  `removePollinationsKey`, adds `pollinationsModel` ("" default, no whitespace allowed), and drops `imageModel`.
  Persist version becomes 2 with a `migrate` that discards the old `imageModel`. `setModels` takes
  `(text, speech, pollinationsModel)`; the last may be empty. `restoreModels` resets all three.
- **Rationale**: FR-003, FR-009: the old Google image model name must not be sent to Pollinations.

## R5. Errors
- **Decision**: New `AiErrorKind`s: `image-no-key` ("Add your Pollinations key in AI settings to create
  images."), `image-key` ("Pollinations did not accept your key. Check it in AI settings."), `image-credit`
  ("Your Pollinations balance or budget is used up."). Mapping: 401 and 403 to `image-key`, 402 to
  `image-credit`, 429 to `limit`, `TypeError` to `network`, timeout to `timeout`, anything else (400, 5xx,
  empty body, undecodable image) to `image`. Messages never include the key or response bodies.
- **Actions**: `image-no-key` and `image-key` show "Open AI settings" (which closes the panel and opens the
  Connect dialog as for the Google key); all other image errors show "New image".
- **Rationale**: FR-006, FR-007, US3.

## R6. Request flow
- **Decision**: `startImage` reads `pollinationsKey` and `pollinationsModel` from the store. With no key it sets
  the `image-no-key` error without calling `fetch`. Otherwise it calls `generateWordImage(word, sentence, key,
  model, signal)` which returns the reduced JPEG. Selection, caption, "New image", cancellation and Apply
  guards from features 011 and 012 are unchanged.
- **Rationale**: FR-001, FR-002, FR-006.

## R7. Response handling
- **Decision**: Read `response.blob()`; if the content type is not `image/*` treat it as `image`; SVG is passed to
  `shrinkImage`, which fails to decode and returns the original only when it is at most 2 MB (the editor's media
  rules will then reject an SVG with its usual message). `shrinkImage` is unchanged for raster images.
- **Rationale**: Models can return SVG; the editor's rules decide what can be attached.

## R8. Privacy text
- **Decision**: The dialog text becomes: "The word and the course language are sent to Google for text and audio.
  The word and the sentence you choose are sent to Pollinations to create the picture. Your keys are stored on
  this device only and are never shown in full. Use keys with spending limits and remove them on shared
  computers."
- **Rationale**: FR-004, FR-005.

## Resolved unknowns

CORS for browser calls to Pollinations is the one open item; it is verified by running the feature with a key.
