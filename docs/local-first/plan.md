# Implementation Plan: Local-First Desktop App with Typing Practice

**Branch**: `local-first-desktop` (shared design, not a spec) | **Date**: 2026-10-18 | **Spec**: [spec.md](./REQUIREMENTS.md)

**Input**: Feature specification from `/docs/local-first/spec.md`

**Technical reference**: [`LOCAL_FIRST_PLAN.md`](../../LOCAL_FIRST_PLAN.md) at the repository root.

## Summary

Turn the browser-only prototype into an Electron desktop app that keeps everything on the user's computer (SQLite file,
media files on disk, AI keys in the OS secure storage), exports and imports whole courses as one `.membetter` file, backs up
the library, and adds the missing learning loop: a typing practice screen (image shown, type the word, letter tiles, hint,
"I don't know") driven by FSRS spaced repetition for Learn, Classic review and Speed review.

Approach: keep the React/Vite renderer in `src/` and add an Electron main process and preload under `electron/`. The renderer
talks only to a typed `window.api` (zod-validated IPC). Main-process services own SQLite, media, import/export, backup,
study scheduling, AI calls and secrets. The migration ships in vertical slices so the app is runnable after every phase.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) in renderer, preload and main; Node.js >= 22.22; Electron current stable
(version pinned when phase 0 starts)

**Primary Dependencies**: Existing: React 19.3.1, React Router 8.4.0, Zustand 5.0.15, Tailwind CSS 4.3.3, Vite. New:
`electron`, `electron-vite`, `electron-builder`, `electron-updater`, `better-sqlite3`, `zod`, `fflate`, `ts-fsrs`

**Storage**: SQLite file (`membetter.db`, WAL mode) in the app data folder; media files in `media/<sha256>.<ext>`; AI keys
encrypted with the OS secure storage; settings in the same database. Browser `localStorage` and IndexedDB are used only
by the one-time prototype import and the web export button.

**Testing**: Vitest (services, import/export round trip, scheduling, practice logic, IPC schemas); Playwright for Electron
(end-to-end flows). This is the first feature that adds tests; see Constitution Check.

**Target Platform**: Desktop: Windows 10+, macOS 12+, Linux (AppImage and deb). Mobile and web hosting are out of scope.

**Project Type**: desktop-app (Electron main + preload + React renderer)

**Performance Goals**: Home usable in under 3 s with 50 courses and 20,000 words (SC-011); 500-word course with media
exports in under 30 s and imports in under 60 s (SC-003); practice feedback under 100 ms (SC-006)

**Constraints**: Offline for everything except AI calls; no account; renderer sandboxed with `contextIsolation` and no
Node access; media served through a custom protocol; import is all-or-nothing; keys never in exports, backups or logs;
M3 tokens only; keyboard-only practice

**Scale/Scope**: About 12 main-process services, about 40 IPC channels, 1 new feature module (`practice`), 1 new
(`library`) for backup and import/export screens, edits to every existing feature's data hooks; 16 SQLite tables

## Constitution Check

Constitution v2.1.0. Gate evaluated before research and again after design.

| Principle | Status | Notes |
|-----------|--------|-------|
| I. React + Vite stack | Pass | The renderer stays React + Vite; `electron-vite` drives Vite for renderer, preload and main. No other bundler is introduced |
| II. Component-first | Pass | Practice screen is composed of self-contained components (`LetterTile`, `TileTray`, `AnswerInput`, `PracticeHeader`, ...) with logic in hooks |
| III. Feature-scoped modules | Pass | New `features/practice` and `features/library`; main-process code is grouped by service under `electron/`, outside `src/`; features reach data only through `shared/api` |
| IV. Simplicity over abstraction | Pass with note | No repository layer, no ORM: services run plain SQL through one connection helper. Abstractions appear only where reused 3 or more times (IPC wrapper, migrations runner) |
| V. Material Design 3 | Pass | Practice screen uses M3 tokens, filled/tonal buttons, text field, dialogs; light and dark supported |
| Tech Stack: "No library outside this stack may be introduced without a constitution amendment" | **Violation, amendment required** | Electron, electron-vite, electron-builder, electron-updater, better-sqlite3, zod, fflate, ts-fsrs, Vitest and Playwright are new. See Complexity Tracking |
| Development workflow | Pass | PR per phase, CI gains test and Electron build jobs, conventional commits |
| Accessibility (WCAG 2.1 AA, keyboard operable) | Pass | Required by FR-030; tile tray uses buttons with labels and live-region feedback |

**Gate result**: passes only after the constitution is amended to v3.0.0 (task T001 of phase 0). No code that imports a new
library may be merged before that amendment lands.

Post-design re-check: unchanged. The amendment is the only open gate item.

## Project Structure

### Documentation (this feature)

```text
docs/local-first/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ipc-contract.md
│   ├── membetter-file-format.md
│   └── practice-screen-ui-contract.md
├── checklists/requirements.md
└── tasks.md                # produced later by /speckit-tasks
```

### Source Code (repository root)

```text
electron/
├── main/
│   ├── index.ts                    # app lifecycle, single-instance lock, window, menus, drag-and-drop open
│   ├── window.ts                   # BrowserWindow with hardened webPreferences, CSP, navigation lock
│   ├── protocol.ts                 # membetter-media:// handler (hash lookup, content-type, no path traversal)
│   └── updater.ts                  # electron-updater wiring
├── preload/
│   └── index.ts                    # contextBridge: exposes window.api only
├── ipc/
│   ├── register.ts                 # one handler per channel: zod parse -> service -> serialized result/error
│   └── channels.ts                 # channel names and zod schemas (imported by renderer types too)
├── services/
│   ├── courses.ts  levels.ts  words.ts
│   ├── media.ts                    # validate, hash, store, reference counting, cleanup
│   ├── study.ts                    # session building, ts-fsrs scheduling, points, review log
│   ├── exchange.ts                 # .membetter export/import, library export, prototype import
│   ├── anki.ts                     # .apkg export, CSV import (phase 6)
│   ├── backup.ts                   # scheduled backups, restore
│   ├── ai.ts                       # Gemini and Pollinations adapters (moved from src/features/ai-assistant/api)
│   ├── secrets.ts                  # safeStorage wrapper
│   └── settings.ts
├── db/
│   ├── connection.ts               # open, pragmas, single-writer helper, transaction wrapper
│   ├── migrate.ts                  # PRAGMA user_version runner, pre-upgrade copy
│   └── migrations/0001_init.sql  0002_study.sql  ...
└── shared/                         # types and zod schemas used by main, preload and renderer

src/
├── shared/
│   ├── api/                        # typed client over window.api, query hooks, error mapping
│   ├── store/                      # appStore stays; learnerStore persist removed
│   └── media/                      # mediaStore (IndexedDB) removed; useMediaUrl uses the protocol URL
├── features/
│   ├── home/                       # hooks switched to api; data/sample* become optional seed import
│   ├── course-editor/              # autosave + media via api
│   ├── course-detail/              # stats panel replaces leaderboard
│   ├── ai-assistant/               # api/* removed; calls window.api.ai.*; Connect dialog write-only
│   ├── practice/                   # NEW typing practice module
│   │   ├── PracticePage.tsx
│   │   ├── components/             # PracticeHeader, ProgressBar, PointsBadge, WordImage, AnswerInput,
│   │   │                           # TileTray, LetterTile, HintButton, GiveUpButton, FeedbackBanner,
│   │   │                           # ShortcutsToggle, SessionSummary, ExitDialog
│   │   ├── hooks/                  # usePracticeSession, useTiles, usePracticeKeys
│   │   ├── model/                  # matching.ts, tiles.ts, points.ts (pure, unit-tested)
│   │   └── index.ts
│   └── library/                    # NEW: export/import dialogs, backup settings, restore, prototype import
└── app/router.tsx                  # adds /courses/:id/practice/:kind and /library routes

tests/
├── unit/                           # Vitest: model, services with in-memory SQLite, schemas
├── integration/                    # round-trip export/import, migrations, backup/restore
└── e2e/                            # Playwright for Electron

electron.vite.config.ts   electron-builder.yml   vitest.config.ts   playwright.config.ts
```

**Structure Decision**: One repository, two TypeScript projects sharing `electron/shared` types. The renderer stays at
`src/` (existing paths and feature-module convention preserved). The web build (`pnpm dev`) is kept only for the prototype
export button and UI development with a mock `window.api`.

## Phases

Each phase leaves the app runnable and is a separate PR.

| Phase | Scope | Spec coverage | Exit check |
|-------|-------|---------------|------------|
| 0. Foundation | Constitution amendment; electron-vite and hardened shell; preload skeleton; DB connection and migration runner; CI (typecheck, lint, Vitest, Electron build matrix) | FR-001 (partly), FR-008 | Existing UI loads in Electron; empty DB created; CI green on three OSes |
| 1. Data layer | Schema for courses/levels/words/settings; services; typed IPC and `shared/api`; replace `learnerStore` persistence and sample data; autosave | FR-001 to FR-003 | Create/edit/close/reopen with network off |
| 2. Media | Media service, validation, content-addressed storage, protocol, cleanup; replace IndexedDB | FR-004 | Images and audio persist; unused files removed |
| 3. Exchange | `.membetter` export/import, conflict dialog, library export, zip safety, progress; web "export my data" button and prototype import | FR-007, FR-009 to FR-015 | Round-trip test passes; hostile-file tests pass |
| 4. AI and secrets | Move Gemini and Pollinations calls to main; `safeStorage`; write-only Connect dialog | FR-005, FR-006 | No key readable from renderer, exports or logs |
| 5. Practice and study | Typing practice screen; FSRS scheduling; Learn/Classic/Speed sessions; points; real Home and detail counts; personal stats | FR-019 to FR-035 | Ten-word keyboard-only session; due dates correct |
| 6. Backup | Scheduled and manual backup, restore, single-instance lock | FR-016 to FR-018 | Backup, delete, restore test passes |
| 7. Anki interop | `.apkg` export, CSV import | FR-036, FR-037 | Export opens in Anki; CSV skips reported |
| 8. Release | electron-builder installers, signing, auto-update, privacy text, performance pass | SC-001, SC-011 | Installers on three OSes; update tested |

Phase 5 can start (using fixtures) in parallel with phases 3 and 4 once phase 2 is done. The practice screen UI may be built
earlier against a mock `window.api` to finish design review in parallel.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New libraries outside the constitution's stack (Electron toolchain, better-sqlite3, zod, fflate, ts-fsrs, Vitest, Playwright) | The product direction is a local-first desktop app with durable storage, a portable file format, validated IPC, a proven scheduler and automated tests | Staying a browser app cannot give durable file storage, OS secret storage, or single-file portable courses; writing a scheduler, zip codec or schema validator by hand adds more code and risk than the dependency |
| A second TypeScript project (`electron/`) next to `src/` | Main process code must not ship in the renderer bundle and needs Node APIs | Putting main code under `src/` mixes trust levels and breaks the sandbox boundary |
| Introduction of automated tests (the project had none) | Import/export integrity, scheduling and data migrations cannot be validated by typecheck and manual runs | Manual quickstart runs do not catch data-loss regressions |
