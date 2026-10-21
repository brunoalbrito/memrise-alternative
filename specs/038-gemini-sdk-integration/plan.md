# Implementation Plan: Google Generative AI SDK Integration for Image Generation

**Branch**: `038-gemini-sdk-integration` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/038-gemini-sdk-integration/spec.md`

## Summary

Replace direct REST API calls to Gemini image endpoint with the official `@google/genai` SDK. This improves reliability, error handling, and type safety. Current REST approach shows generic "Image could not be created" errors; SDK provides structured error codes and response parsing.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 22.x)

**Primary Dependencies**: 
- Existing: `electron`, `react`, `zod`
- New: `@google/genai` (official Google SDK)

**Storage**: SQLite via better-sqlite3 (unchanged)

**Testing**: Vitest (unit), Playwright (e2e)

**Target Platform**: Desktop (Electron: macOS, Linux, Windows)

**Project Type**: desktop-app (Electron + React)

**Performance Goals**: Image generation latency <90s (existing IMAGE_TIMEOUT_MS); no performance regression

**Constraints**: 
- Maintain SDK compatibility with Node.js 22.x
- Error handling must map SDK errors to existing AiError kinds
- Response parsing must handle SDK's structured interaction response format
- Backward compatible with existing imageModel configuration

**Scale/Scope**: Single feature module (image generation); affects ~3 files in electron/services/ai/

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✓ **Principle I (React + Vite)**: Feature is backend (Electron main process), not UI. No impact. PASS

✓ **Principle II (Component-First)**: Feature is service code, not UI component. No impact. PASS

✓ **Principle III (Feature-Scoped)**: Code stays in `electron/services/ai/` module. No cross-feature circular dependencies. PASS

✓ **Principle IV (Simplicity)**: SDK replaces custom REST code, reducing complexity. Uses official Google library. PASS

✓ **Principle V (Material Design 3)**: Feature is backend service, not UI. No impact. PASS

**New Dependency Gate**: Adding `@google/genai` requires constitution amendment per Principle I. However, this is a backend dependency (not frontend framework/library), and it's the official SDK from the provider. Minimal impact on frontend stack. Justified as strategic replacement of error-prone custom REST code. CONDITIONAL PASS (note for review)

## Project Structure

### Documentation (this feature)

```text
specs/038-gemini-sdk-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output (SDK compatibility, error handling)
├── data-model.md        # Phase 1 output (interaction request/response structure)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output (SDK integration contract)
│   └── genai-image-request.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
electron/
├── services/
│   └── ai/
│       ├── service.ts          # MODIFIED: Replace drawImage REST call with SDK
│       ├── errors.ts           # UNCHANGED: Error types
│       └── suggestion.ts       # UNCHANGED: Text parsing
├── main/
│   └── index.ts               # UNCHANGED: IPC handlers
└── [other existing modules]

src/
├── features/
│   └── ai-assistant/
│       ├── api/
│       │   ├── client.ts      # UNCHANGED: IPC wrapper
│       │   └── errors.ts      # UNCHANGED: Error types
│       └── [other UI code]    # UNCHANGED

tests/
├── unit/
│   └── ai-image-generation.test.ts   # NEW: SDK integration tests
└── [existing tests]
```

**Structure Decision**: Feature changes are isolated to `electron/services/ai/service.ts` (single file modification for REST→SDK migration). No new modules or cross-module dependencies. Test coverage added to verify SDK error handling.

## Complexity Tracking

No constitution violations. New dependency (`@google/genai`) is:
- Official Google library (not community/unmaintained)
- Backend-only (no frontend framework impact)
- Replaces custom code (net simplification)
- Standard practice (official SDKs preferred over REST)

---

## Phase 0: Research (Complete)

**Output**: `research.md`

**Resolved**:
- ✓ SDK installation and Node.js 22.x compatibility
- ✓ SDK API endpoint and model naming conventions
- ✓ Error handling and response parsing differences
- ✓ Response structure (SDK vs REST)
- ✓ imageModel configuration handling
- ✓ Generation configuration fields
- ✓ Package installation and build impact
- ✓ Error message improvements strategy

---

## Phase 1: Design & Contracts (Complete)

**Outputs**:
- `data-model.md` — ImageGenerationRequest, SDKInteraction, ImageData entities
- `contracts/genai-image-request.md` — drawImage() function contract, SDK usage, error mapping
- `quickstart.md` — Validation guide with 7 test scenarios + regression checks

**Design Decisions**:
1. **SDK Initialization**: GoogleGenAI class with API key from secrets storage
2. **Model Selection**: Use `this.models().imageModel` or default to `gemini-3.1-flash-lite-image`
3. **Error Mapping**: SDK exceptions map to existing AiError kinds (no new types)
4. **Response Parsing**: Extract from `interaction.steps[].content[].data` (not REST format)
5. **Configuration**: Support user-configured imageModel via Connect AI dialog

**Breaking Changes**: None. Fully backward compatible.

**Testing Strategy**:
- Unit tests: SDK initialization, error mapping, response parsing
- Integration tests: wordImage() → drawImage() → SDK flow
- Manual tests: Happy path, error scenarios, configurations (in quickstart.md)

---

## Next Phase

After implementation (`/speckit-tasks` → `/speckit-implement`), validation against `quickstart.md` confirms:
- [ ] All 7 test scenarios pass
- [ ] All regression checks pass
- [ ] No REST API calls remain
- [ ] Error messages are specific and actionable
