# Implementation Plan: AI Word Image

**Branch**: `011-ai-word-image` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-ai-word-image/spec.md`

## Summary

Extend the AI suggestions panel with an "Image" section. When the suggestions are ready, and each time
another sentence is selected, the app asks Google's image model (through the learner's saved key)
for a simple illustration of the word as used in the selected sentence. The picture is shown in the
panel, can be regenerated with "New image", and is attached to the word's Images by "Apply" after being
reduced to a small JPEG. Image failures never block the rest. The image model name is editable in the
Connect AI dialog. No new dependencies; image reduction uses the browser canvas.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, Zustand 5.0.15, Tailwind CSS 4.3.3, browser `fetch`,
`createImageBitmap` and canvas. No new dependencies.

**Storage**: AI settings (`membetter.ai`) gain `imageModel`. The attached picture is an ordinary image
in IndexedDB (feature 009) referenced from the word's Images list.

**External service**: Google Gemini API, Interactions endpoint, same `x-goog-api-key` header rule as the
text and audio requests. Default image model `gemini-nano-banana-2.1` (editable).

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`, `pnpm build` and
[quickstart.md](./quickstart.md). The image call could not be exercised without a key while planning
(see research R1).

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Picture shown within 20 s for 90% of common words (SC-001); timeout 45 s per image
request

**Constraints**: Key handling rules of feature 010 apply unchanged (never logged, only in the header);
stored picture at most 2 MB (normally about 100 to 300 KB after reduction); M3 tokens only; keyboard
operable; works from 360 px

**Scale/Scope**: 1 new small module file set inside `ai-assistant`, edits to ~8 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Image section is one small component; request logic in the existing suggestions hook plus a pure image helper |
| III. Feature-scoped modules | Pass | All AI code stays in `features/ai-assistant`; the editor only receives one more field in the apply result |
| IV. Simplicity over abstraction | Pass | One more function in the existing client, one helper file for size reduction, no new framework |
| V. Material Design 3 | Pass | Tonal/text buttons, token colors, rounded image container |
| Tech stack | Pass | `fetch` and canvas are browser APIs |
| Workflow / a11y | Pass | Live regions for loading and errors, `alt` text on the picture |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/011-ai-word-image/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-contract.md
│   └── gemini-image.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/features/
├── ai-assistant/
│   ├── api/
│   │   ├── errors.ts                   # edit: kind "image" and its message
│   │   ├── gemini.ts                   # edit: generateWordImage, extractImage
│   │   └── image.ts                    # new: shrinkImage (canvas reduce to JPEG)
│   ├── store/aiStore.ts                # edit: imageModel, setModels(text, speech, image)
│   ├── hooks/useSuggestions.ts         # edit: image state, start on ready and on select, regenerate
│   └── components/
│       ├── SuggestionDialog.tsx        # edit: Image section, Apply waits, result.image
│       └── ConnectDialog.tsx           # edit: image model input, privacy text
└── course-editor/
    └── components/LevelsTab.tsx        # edit: attach picture like audio, 5-image message
```

**Structure Decision**: Everything about Google AI stays in `ai-assistant`. The editor only attaches the
returned picture with the media rules it already has.

## Complexity Tracking

No constitution violations to justify.
