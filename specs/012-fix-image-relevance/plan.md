# Implementation Plan: Fix Image Relevance to the Chosen Sentence

**Branch**: `012-fix-image-relevance` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-fix-image-relevance/spec.md`

## Summary

The picture can look unrelated to the sentence the learner picked. Cause: the image prompt (feature 011)
asked for "the meaning of the word ... as used in this sentence" with "one clear subject on a plain light
background", which makes the model draw the isolated word and treat the sentence as a footnote. Fix: build
the prompt around the whole selected sentence (a scene with its people, objects, action and setting, in which
the target word's meaning is visible), show the sentence the picture was made for next to the picture, and
guard Apply so only a picture made for the currently selected sentence can be attached.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, Tailwind CSS 4.3.3. No new dependencies.

**Storage**: N/A (no data model change)

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`, `pnpm build` and
[quickstart.md](./quickstart.md).

**Target Platform**: Modern evergreen browsers

**Project Type**: web-application (frontend-only SPA)

**Constraints**: Key handling rules of feature 010 unchanged; no text drawn in pictures; M3 tokens only

**Scale/Scope**: 2 files edited (`api/gemini.ts`, `components/SuggestionDialog.tsx`), contract text updated

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | Edits stay inside existing units |
| III. Feature-scoped modules | Pass | Everything stays in `features/ai-assistant` |
| IV. Simplicity over abstraction | Pass | One prompt function rewritten, one caption line added |
| V. Material Design 3 | Pass | Caption uses token colors and the label typography |
| Tech stack / workflow | Pass | No new library |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

```text
specs/012-fix-image-relevance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── prompt.md
└── tasks.md
```

```text
src/features/ai-assistant/
├── api/gemini.ts                       # edit: buildImagePrompt builds a scene from the sentence
└── components/SuggestionDialog.tsx     # edit: caption with the sentence, Apply guard on the sentence index
```

**Structure Decision**: Two small edits in the existing AI module.

## Complexity Tracking

No constitution violations to justify.
