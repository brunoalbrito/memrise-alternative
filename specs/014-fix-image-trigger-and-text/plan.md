# Implementation Plan: Fix Image Trigger and Text in Pictures

**Branch**: `014-fix-image-trigger-and-text` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-fix-image-trigger-and-text/spec.md`

## Summary

Two bugs in the AI image feature. (1) The picture starts automatically as soon as the suggestions are ready,
for the pre-selected Best sentence, before the learner chose anything. Fix: no automatic request; the picture
starts when the learner clicks a sentence option (also the already selected one) or presses a new "Create image"
button. (2) The picture contains the sentence written out, because the prompt quoted the full sentence and image
models render quoted text. Fix: first ask the Google text model for a short purely visual scene description,
then send only that description, with strong no-text instructions, to Pollinations. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, browser `fetch`. No new dependencies.

**Storage**: None (no data change)

**External services**: Google text model (existing key and endpoint, one extra small request per picture),
Pollinations image API (unchanged).

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`, `pnpm build` and
[quickstart.md](./quickstart.md).

**Constraints**: Key handling rules unchanged; M3 tokens only

**Scale/Scope**: 4 files edited in `features/ai-assistant`

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Edits inside existing hook, dialog and client |
| III. Feature-scoped modules | Pass | All changes inside `features/ai-assistant` |
| IV. Simplicity over abstraction | Pass | One new client function; one ref and one handler in the hook |
| V. Material Design 3 | Pass | Existing buttons and tokens |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

```text
specs/014-fix-image-trigger-and-text/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── scene-prompt.md
└── tasks.md
```

```text
src/features/ai-assistant/
├── api/gemini.ts                       # edit: describeScene
├── api/pollinations.ts                 # edit: buildImagePrompt takes a scene description
├── hooks/useSuggestions.ts             # edit: no auto image, choose(index), createImage, scene step
└── components/SuggestionDialog.tsx     # edit: radios use choose, idle state with Create image
```

**Structure Decision**: Small edits in the existing AI module.

## Complexity Tracking

No constitution violations to justify.
