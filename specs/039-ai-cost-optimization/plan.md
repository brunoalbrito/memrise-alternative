# Implementation Plan: AI Model Cost Optimization

**Branch**: `039-ai-cost-optimization` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/039-ai-cost-optimization/spec.md`

## Summary

Reduce AI API costs during development and testing by implementing three cost-control mechanisms:
1. Mock mode (MOCK_AI=1) returns fake data without API calls for text/audio/image
2. User-configurable image model selection enables cheaper model choices
3. API call logging with cost estimation for transparency

Primary value: Zero-cost dev/test cycles. Secondary: User control over model selection and cost visibility.

## Technical Context

**Language/Version**: TypeScript with Node.js ≥22.22

**Primary Dependencies**: @google/genai (existing), better-sqlite3 (optional for logging), zod (existing)

**Storage**: SQLite for API call logs (in-memory array initially, can migrate)

**Testing**: Vitest (unit), Playwright (e2e)

**Target Platform**: Electron desktop app

**Project Type**: desktop-app

**Performance Goals**: Mock mode switch <1 second; cost-efficient API calls per model

**Constraints**: Mock mode development-only; existing AiError framework sufficient

**Scale/Scope**: Single developer to small team; 3 AI operations (text, audio, image)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Phase 0 Gate**: PASS ✓
- ✓ TypeScript + Vite + Electron stack (existing)
- ✓ React Context/Zustand for state (cost logging)
- ✓ Feature-scoped modules (ai-assistant feature existing)
- ✓ No new libraries beyond @google/genai (already present)
- ✓ No new platform constraints

**Post-Phase 1 Gate**: PASS ✓
- ✓ No Material Design 3 violations (no UI component changes)
- ✓ Simplicity maintained (mock data hardcoded, no config system)

## Project Structure

### Documentation (this feature)

```text
specs/039-ai-cost-optimization/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisions)
├── data-model.md        # Phase 1 output (entities)
├── quickstart.md        # Phase 1 output (validation)
├── contracts/           # Phase 1 output (logging schema)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
electron/services/ai/
├── service.ts           # Add mock mode, logging (existing file)
├── errors.ts            # AiError types (existing, sufficient)
└── ...

src/features/ai-assistant/
├── components/
└── ...

tests/
├── unit/
│   └── ai-mock.test.ts  # New: mock mode unit tests
└── e2e/
    └── ai-costs.spec.ts # New: e2e MOCK_AI validation
```

**Structure Decision**: Feature-scoped AI service module. Mock mode added to `electron/services/ai/service.ts` (existing file). No new modules; changes internal to AI service.
