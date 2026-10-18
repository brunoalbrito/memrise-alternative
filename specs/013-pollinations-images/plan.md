# Implementation Plan: Pollinations Image Provider

**Branch**: `013-pollinations-images` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-pollinations-images/spec.md`

## Summary

Replace Google image generation with Pollinations. A new small client requests
`GET https://gen.pollinations.ai/image/<prompt>` with the learner's Pollinations key in an
`Authorization: Bearer` header, receives raw image bytes, reduces them to a small JPEG and hands them to the
existing Image section. Settings gain a Pollinations key and an optional model name (replacing the Google image
model). The Connect AI dialog gets a Pollinations section. Image errors get Pollinations-specific messages and
actions. Text, IPA and audio stay on Google. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, Zustand 5.0.15, Tailwind CSS 4.3.3, browser `fetch`, canvas. No new
dependencies and no Pollinations SDK.

**Storage**: AI settings (`membetter.ai`, bumped to version 2) lose `imageModel` and gain `pollinationsKey`
and `pollinationsModel`.

**External service**: Pollinations image API at `https://gen.pollinations.ai/image/{prompt}`
(docs: https://github.com/pollinations/pollinations/blob/main/APIDOCS.md, fetched 2026-10-18).

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`, `pnpm build` and
[quickstart.md](./quickstart.md). The Pollinations call could not be exercised without a key while planning;
browser access (CORS) is not documented, see research R2.

**Target Platform**: Modern evergreen browsers

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Picture within 30 s for 90% of requests; request timeout 45 s (as before)

**Constraints**: Key only in the `Authorization` header, never in a URL, log or message; M3 tokens only;
keyboard operable; works from 360 px

**Scale/Scope**: 1 new API file, edits to ~7 files in `ai-assistant`, docs of earlier features updated

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Edits stay inside existing components; the client is a plain module |
| III. Feature-scoped modules | Pass | All changes inside `features/ai-assistant` |
| IV. Simplicity over abstraction | Pass | One new client function replaces the Google image function; no provider framework |
| V. Material Design 3 | Pass | Same dialog components and tokens |
| Tech stack / workflow | Pass | `fetch` only |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

```text
specs/013-pollinations-images/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pollinations-api.md
└── tasks.md
```

```text
src/features/ai-assistant/
├── api/
│   ├── pollinations.ts            # new: buildImagePrompt, generateWordImage (Pollinations)
│   ├── gemini.ts                  # edit: remove image request, extractImage and imageModel
│   ├── image.ts                   # edit: remove imageBlobFromBase64 (no longer used), keep shrinkImage
│   └── errors.ts                  # edit: kinds image-no-key, image-key, image-credit
├── store/aiStore.ts               # edit: pollinationsKey, pollinationsModel, drop imageModel, version 2
├── hooks/useSuggestions.ts        # edit: image uses the Pollinations key, no key means no request
└── components/
    ├── SuggestionDialog.tsx       # edit: image error actions per kind
    └── ConnectDialog.tsx          # edit: Pollinations section, privacy text, model field
```

**Structure Decision**: A second small API client file beside `gemini.ts`; the rest is edits.

## Complexity Tracking

No constitution violations to justify.
