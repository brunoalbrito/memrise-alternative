# Implementation Plan: Replace Pollinations with Nano Banana 2 Lite

**Branch**: `036-nano-banana-image-provider` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/036-nano-banana-image-provider/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace Pollinations image generation with Nano Banana 2 Lite as the image provider for Auto-fill suggestions. Migrate stored keys, update the UI dialog, and ensure all image generation requests route through the new provider while maintaining the same user experience and Image attachment workflow.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: React 19, Zustand (state management), Electron (desktop app), better-sqlite3 (local storage)

**Storage**: SQLite (local device storage for API keys via secure storage)

**Testing**: Vitest (unit), Playwright (e2e)

**Target Platform**: Desktop app (Electron) on macOS, Linux, Windows

**Project Type**: Desktop application (Electron + React + TypeScript)

**Performance Goals**: Image generation completes within 10-15 seconds (matching Pollinations speed)

**Constraints**: API keys must stay on device; no requests to Google during image generation; NEEDS CLARIFICATION: Nano Banana 2 Lite API rate limits and model availability

**Scale/Scope**: Single image provider change affecting auto-fill feature across all courses

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **I. React + Vite Stack**: Maintained. No change to toolchain; updating existing React/TypeScript components.

✅ **II. Component-First Architecture**: Maintained. Updating existing ConnectDialog component; no new abstractions.

✅ **III. Feature-Scoped Modules**: Maintained. Nano Banana provider lives within `ai-assistant` feature module alongside Google.

✅ **IV. Simplicity Over Abstraction**: Maintained. Direct provider replacement; no plugin system or feature flags.

✅ **V. Material Design 3**: Maintained. Update ConnectDialog to follow M3 guidelines (text fields, buttons, section layout).

**Violations**: None.

**Gate Status**: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── features/ai-assistant/
│   ├── components/
│   │   └── ConnectDialog.tsx          # Update: replace Pollinations with Nano Banana
│   ├── store/
│   │   └── aiStore.ts                 # Update: rename pollinations* → nanoBanana*
│   ├── hooks/
│   │   └── useSuggestions.ts           # Update: use nanoBananaConnected check
│   ├── api/
│   │   └── imageGeneration.ts          # NEEDS CLARIFICATION: separate file or inline?
│   └── index.ts
├── main/
│   └── backend/
│       └── api/
│           ├── index.ts                # Update: AI routes
│           └── ai-routes.ts            # Update: saveKey/removeKey for Nano Banana

tests/
├── unit/ai-assistant/
├── integration/ai-assistant/
└── e2e/
    └── practice.spec.ts                # Update: verify image generation with Nano Banana
```

**Structure Decision**: Feature-scoped. Nano Banana replaces Pollinations within the existing `ai-assistant` feature module. No new directories; only updates to existing store, components, and backend routes.

## Phase 0: Research ✅ COMPLETE

**Status**: Research findings integrated into design artifacts.

**Key Findings** (confirmed):
- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=YOUR_API_KEY` (Google's official API)
- **Auth**: API key in query parameter `?key=YOUR_API_KEY` (from Google AI Studio; free tier)
- **Request**: `{contents[0].parts[0].text: prompt, generationConfig: {aspectRatio, outputMimeType}}`
- **Response**: Base64-encoded image in `candidates[0].content.parts[0].inlineData.data`
- **Performance**: ~4 seconds per image (4x faster than Pollinations)
- **Rate Limits**: 100 req/min, 10 concurrent max (free tier)
- **Supported Aspect Ratios**: 14 ratios (1:1, 16:9, 9:16, 2:3, 3:2, 4:3, 3:4, etc.)
- **Fixed Resolution**: 1024×1024px (1K; no user-configurable size)
- **Cost**: Free (no billing required)

**Output**: ✅ `research.md` (complete with all NEEDS CLARIFICATION items resolved)

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts Generated**:
- ✅ `research.md` — All NEEDS CLARIFICATION items resolved with API findings
- ✅ `data-model.md` — Entity definitions, validation rules, storage schema (updated with confirmed specs)
- ✅ `quickstart.md` — 7 manual test scenarios (updated with actual endpoint, auth, response structure)
- ✅ `contracts/nano-banana-api.md` — Complete request/response contract with error handling
- ✅ `plan.md` — This implementation plan

**Design Decisions Confirmed**:
1. ✅ **No new service files** — Image logic stays inline (Constitution Principle IV: simplicity)
2. ✅ **Direct field renaming** — `pollinationsXxx` → `nanoBananaXxx` in Zustand store
3. ✅ **Key migration** — Clear old Pollinations keys; user enters new Nano Banana key (incompatible APIs)
4. ✅ **Data persistence** — Existing attached images preserved; only new requests use Nano Banana
5. ✅ **Fixed aspect ratio v1** — Use `1:1` (square) in v1; aspect ratio selection is v2 feature
6. ✅ **Base64 response handling** — Decode base64 from API response for display

**Constitution Check** (re-evaluation post-design):
- ✅ **Principle I (React + Vite)**: Maintained — updating existing React components
- ✅ **Principle II (Component-First)**: Maintained — updating existing ConnectDialog
- ✅ **Principle III (Feature-Scoped)**: Maintained — within `ai-assistant` module
- ✅ **Principle IV (Simplicity)**: Maintained — no new abstractions (inline logic)
- ✅ **Principle V (M3 Design)**: Maintained — ConnectDialog follows Material Design 3
- ✅ **No violations** — Ready for Phase 2 implementation

---

## Complexity Tracking

No violations. Design adheres to all constitution principles.

---

## Next Steps: Phase 2 Implementation

1. **Generate Implementation Tasks**: Run `/speckit-tasks` command
   - Generates `tasks.md` with detailed implementation checklist
   - Breaks down work into individual, trackable tasks
   - Estimates effort for each task

2. **Create Feature Branch**: 
   ```bash
   git checkout -b 036-nano-banana-image-provider
   ```

3. **Implementation** (Phase 2 work):
   - Update `aiStore.ts`: Rename Pollinations → Nano Banana (state management)
   - Update `ConnectDialog.tsx`: UI for key input/display
   - Update `useSuggestions.ts`: Use Nano Banana API call
   - Add backend routes for key storage/retrieval
   - Implement base64 image decoding
   - Implement error handling (403, 429, 500, etc.)
   - Implement rate limiting queue (100 req/min, 10 concurrent)
   - Add migration logic for existing Pollinations config
   - Add unit tests
   - Add e2e tests (Playwright)

4. **Testing**: Run automated test suite
   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
   ```

5. **Code Review**: Create PR against main branch with:
   - Screenshot of new Connect AI dialog
   - Description of API changes
   - Reference to this spec and plan

---

## Files Ready for Implementation

| File | Purpose | Status |
|------|---------|--------|
| `plan.md` | This implementation plan | ✅ Ready |
| `spec.md` | Feature specification | ✅ Complete |
| `research.md` | API research findings | ✅ Complete |
| `data-model.md` | Data entities & validation | ✅ Complete |
| `contracts/nano-banana-api.md` | API contract | ✅ Complete |
| `quickstart.md` | Test scenarios & validation | ✅ Complete |
| `tasks.md` | Implementation tasks (Phase 2) | 🔄 To be generated |

---

## References

- **Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contract**: [contracts/nano-banana-api.md](contracts/nano-banana-api.md)
- **Quickstart**: [quickstart.md](quickstart.md)
- **CLAUDE.md**: Project setup and build commands at repository root
