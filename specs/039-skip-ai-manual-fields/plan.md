# Implementation Plan: Skip AI Generation for Manually-Filled Fields

**Branch**: `039-skip-ai-manual-fields` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/039-skip-ai-manual-fields/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Skip AI generation for word metadata fields that are already manually filled by the user. When user triggers AI to populate missing fields in the word editor, detect which fields contain content and exclude them from the AI API call. Display inline badges on skipped fields. Reduces token usage by 30%+ when users pre-fill fields.

## Technical Context

**Language/Version**: TypeScript 5.x

**Primary Dependencies**: @google/generative-ai (Gemini API), React, Zustand, zod

**Storage**: SQLite (word metadata storage), local file system (for images, audio)

**Testing**: Vitest (unit/integration), Playwright (e2e)

**Target Platform**: Electron desktop app (macOS, Linux, Windows)

**Project Type**: desktop-app

**Performance Goals**: Field-state detection < 50ms overhead per request; no noticeable UI lag during AI skip validation

**Constraints**: AI calls require internet; skip-detection logic must run synchronously before API call; user data stays local (no cloud sync)

**Scale/Scope**: Single-user app; multiple courses with variable word counts (10s to 1000s per course)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. React + Vite Stack**: ✅ PASS — Feature uses existing React (word editor component) and Vite (no new build tool required)

**II. Component-First Architecture**: ✅ PASS — Inline badge component for skipped-field indicator follows component-first pattern; logic isolated in custom hook

**III. Feature-Scoped Modules**: ✅ PASS — Enhancement scoped to editor feature; AI service logic reuses existing module; no circular dependencies

**IV. Simplicity Over Abstraction**: ✅ PASS — Skip detection is conditional field-state check; no repository pattern, plugin system, or configuration layer added

**V. Material Design 3**: ✅ PASS — Skipped-field badge and tooltip follow M3 component specs; no custom variants; uses M3 design tokens for color/shape/elevation

**Gate Status**: ✅ ALL PASS

## Project Structure

### Documentation (this feature)

```text
specs/039-skip-ai-manual-fields/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md  # Quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Feature spans two Electron app feature modules:

```text
src/
├── features/
│   ├── course-editor/              # Word card editing UI
│   │   ├── components/
│   │   │   ├── WordCard.tsx        # Word metadata row (edit fields)
│   │   │   ├── SkippedFieldBadge.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useWordEditor.ts    # Manages field state, detects pre-filled
│   │   │   └── ...
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── index.ts
│   │
│   └── ai-assistant/               # AI service and request logic
│       ├── api/
│       │   └── geminiService.ts    # AI API wrapper (skip pre-filled in payload)
│       ├── hooks/
│       │   └── useAIWordAssistant.ts
│       ├── store/
│       │   └── aiStore.ts          # Global AI state (skip feedback)
│       └── index.ts

tests/
├── unit/
│   └── skipAIFields.test.ts        # Field-state detection logic
├── integration/
│   └── wordEditorAI.test.ts        # Editor + AI service integration
└── e2e/
    └── skipAI.spec.ts             # Full flow test
```

**Structure Decision**: Decentralized; feature touches two feature modules (editor UI + AI service). No new directory created—reuse existing features. Skip logic lives in `ai-assistant/api` (request builder) and editor hooks (field-state detection).

## Complexity Tracking

*No violations; all gates passed.*

---

## Phase 0 & Phase 1 Complete

**Phase 0 Output**: ✅ research.md (no NEEDS CLARIFICATION items; all design decisions documented)

**Phase 1 Outputs**:
- ✅ data-model.md (Word, FieldState, AIGenerationRequest, AIGenerationResponse, SkippedFieldFeedback entities)
- ✅ quickstart.md (7 validation scenarios covering all use cases and edge cases)
- ℹ️ contracts/ — Not applicable (feature is internal; no external API contracts)

**Re-check Constitution**: ✅ All gates still pass (no new abstractions or stack changes)

**Design Ready**: ✓ Yes. Proceed to `/speckit-tasks` to generate implementation tasks.
