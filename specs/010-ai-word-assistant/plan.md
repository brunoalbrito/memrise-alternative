# Implementation Plan: AI Word Assistant

**Branch**: `010-ai-word-assistant` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-ai-word-assistant/spec.md`

## Summary

Add an "Auto-fill" button to each word row of the course editor. It calls Google's Gemini API
straight from the browser with the learner's own Google AI Studio key (saved only on the device).
One request returns a simple definition, three example sentences with the best one marked, and
the IPA; a second request returns spoken audio of the word. A review panel shows the result and
"Apply" fills Meaning, Example and a new IPA column and attaches the audio as an ordinary audio
file; "Cancel" changes nothing. A "Connect AI" dialog saves, tests and removes the key. Everything
is in the word's own language (the course's Teaching language); nothing is translated. Built as a
new `ai-assistant` feature module consumed by `course-editor`, with no new dependencies.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.22

**Primary Dependencies**: React 19.3.1, Zustand 5.0.15 (`persist`, for AI settings), Tailwind CSS
4.3.3. Network through the browser `fetch` API with `AbortController`. No new dependencies and no
Google SDK.

**Storage**: AI settings (key, text model id, speech model id) in `localStorage` under
`membetter.ai`, separate from the course data. Word IPA in the existing learner store. Generated
audio is stored as an ordinary media file in IndexedDB (feature 009).

**External service**: Google Gemini API at `https://generativelanguage.googleapis.com/v1beta/`,
authenticated with the `x-goog-api-key` header (never in the URL). Model ids are editable in the AI
settings because Google renames models often.

**Testing**: None (constitution v2.0.0). Validation via `pnpm typecheck`, `pnpm lint`,
`pnpm build` and [quickstart.md](./quickstart.md). The Google calls could not be exercised without
a real key while planning; see research R2 and R9.

**Target Platform**: Modern evergreen browsers, desktop and mobile widths

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Suggestions within 10 s for 95% of common words (SC-002); hard timeout
30 s; one request pair per word row at a time

**Constraints**: The key is never logged, never placed in a URL, never shown after saving except
masked, never sent anywhere but Google; M3 tokens only; keyboard operable; layout works from
360 px

**Scale/Scope**: 1 new feature module (~12 files), edits to ~7 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | No stack change |
| II. Component-first | Pass | `AutoFill`, `SuggestionDialog`, `ConnectDialog`, `AiSettingsButton`; request logic in a hook and a plain client module |
| III. Feature-scoped modules | Pass | New `features/ai-assistant` imports only `home` (types) and `shared`. `course-editor` imports it through its barrel. `ai-assistant` never imports `course-editor` |
| IV. Simplicity over abstraction | Pass | One small fetch client (3 functions) instead of an SDK or provider abstraction; settings in one persisted store |
| V. Material Design 3 | Pass | M3 dialogs, tonal/text buttons, outlined field, radio options, token colors |
| Tech stack | Pass | `fetch` and Zustand are already in the stack; no Google SDK |
| Workflow / a11y | Pass | Native `<dialog>`, `aria-live` loading and errors, labelled controls |

Post-design re-check: still Pass. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/010-ai-word-assistant/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-contract.md
│   └── gemini-api.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
└── features/
    ├── ai-assistant/                                # new feature module
    │   ├── index.ts                                 # exports AutoFill, AiSettingsButton
    │   ├── store/aiStore.ts                         # persisted key + model ids
    │   ├── api/
    │   │   ├── gemini.ts                            # generateWordText, generateWordAudio, testConnection
    │   │   ├── errors.ts                            # AiError kinds and messages
    │   │   └── audio.ts                             # base64 to Blob, WAV wrapping fallback
    │   ├── hooks/useSuggestions.ts                  # request state machine, timeout, cancel
    │   ├── model/suggestion.ts                      # WordSuggestion type, parse + validate response
    │   └── components/
    │       ├── AutoFill.tsx                         # button + dialogs wiring
    │       ├── SuggestionDialog.tsx                 # review panel
    │       ├── ConnectDialog.tsx                    # save / test / remove key
    │       └── AiSettingsButton.tsx                 # toolbar entry
    ├── home/model/types.ts                          # edit: Word.ipa
    └── course-editor/
        ├── components/WordRow.tsx                   # edit: IPA cell, Auto-fill button
        ├── components/LevelEditor.tsx               # edit: IPA header, pass apply handler
        ├── components/LevelsTab.tsx                 # edit: AI settings button, apply handler, notice
        └── model/levelOps.ts                        # edit: updateWord accepts ipa
```

**Structure Decision**: A dedicated `ai-assistant` feature owns everything about Google AI. The
editor only decides what to do with a result (fill cells, attach audio), so the AI module stays
reusable and free of editor internals.

## Complexity Tracking

No constitution violations to justify.
