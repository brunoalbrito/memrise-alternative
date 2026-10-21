# Implementation Plan: Gemini Timeout Fix

**Branch**: `037-gemini-timeout-fix` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-gemini-timeout-fix/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fix 499 Client Closed Request errors from Google Gemini API by adjusting request timeouts in the Electron main process. Increase timeout windows for text (45s), audio/TTS (60s), and image (90s) generation. Separate scene-description timeout (30s) from image-drawing timeout to prevent cascade failures. Changes are isolated to `electron/services/ai/service.ts` and require no UI, routing, or storage modifications.

## Technical Context

**Language/Version**: TypeScript (strict mode)

**Primary Dependencies**: Electron (main process), fetch API (native), AbortSignal.timeout()

**Storage**: N/A (no data model changes)

**Testing**: Vitest (unit tests for timeout logic), Playwright (e2e tests for AI feature flows)

**Target Platform**: macOS (primary), Linux, Windows (Electron multiplatform)

**Project Type**: desktop-app (Electron + React + SQLite)

**Performance Goals**: API requests complete within adjusted timeout windows (99% success rate for 45-60-90s targets)

**Constraints**: Cannot modify Google API behavior; must work within Electron's AbortSignal.timeout() API; backward-compatible with existing error handling

**Scale/Scope**: Single service file modification; affects 3 API request paths (text, audio, image)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Principle I (React + Vite Stack)**: No changes to build toolchain or frontend framework.

✅ **Principle II (Component-First Architecture)**: No UI component changes required.

✅ **Principle III (Feature-Scoped Modules)**: Changes isolated to `electron/services/ai/` - no cross-feature dependencies.

✅ **Principle IV (Simplicity Over Abstraction)**: Straightforward timeout constant adjustments; no new abstractions introduced.

✅ **Principle V (Material Design 3)**: No UI changes; not applicable.

✅ **Tech Stack Compliance**: Uses native Fetch API and AbortSignal (both standard); no new libraries introduced.

✅ **Development Workflow**: Changes will be committed via speckit workflow with conventional commit messages.

**Status**: ✅ PASS - No violations. Feature is backend-only timeout adjustment with no architectural impact.

## Project Structure

### Documentation (this feature)

```text
specs/037-gemini-timeout-fix/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

**Single project with Electron + React frontend and backend services**:

```text
electron/services/ai/
├── service.ts           # PRIMARY CHANGE: Adjust timeout constants (lines 14-16)
├── suggestion.ts        # No changes
├── errors.ts            # No changes
└── wav.ts               # No changes

tests/
├── unit/
│   └── ai-timeout.test.ts   # NEW: Unit tests for timeout behavior
└── e2e/
    └── ai-generation.spec.ts # MODIFY: Add timeout success scenarios
```

**Structure Decision**: Changes are isolated to one service file (`electron/services/ai/service.ts`) where the timeout constants are defined (lines 14-16). No new files required for the core feature. Tests will be added in existing test directories using standard Vitest and Playwright patterns.

## Complexity Tracking

No violations detected. Constitution check passed with no exceptions.
