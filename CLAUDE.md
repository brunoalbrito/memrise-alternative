# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MemBetter: local-first vocabulary learning (Memrise/Anki style). Electron + React + TypeScript desktop app with local SQLite storage. Data stays on the user's computer; AI help is optional.

## Setup

- Node.js ≥22.22
- pnpm 12.x (`npm i -g pnpm`)
- Run `pnpm install` to fetch Electron binary and SQLite module

## Build and Run

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Desktop app with hot reload (empty library by default) |
| `pnpm dev:samples` | Desktop app with sample course preloaded (first run only) |
| `pnpm dev:reset` | Clear dev data folder (~/Library/Application Support/MemBetter-dev) for next `pnpm dev` |
| `pnpm dev:web` | React UI only, no storage (for prototyping "Export my data") |
| `pnpm build` | Compile: tsc + electron-vite → out/ |
| `pnpm preview` | Preview built Electron app |
| `pnpm package` | Build installers for this computer (release/) |
| `pnpm package:dir` | Build unpacked app directory |
| `pnpm samples [file]` | Generate sample course to `dev-data/sample-courses.membetter` |

## Testing

### Commands

- `pnpm typecheck` — TypeScript (tsc -b --noEmit)
- `pnpm lint` — ESLint (standard config with react-hooks, typescript-eslint)
- `pnpm test` — Unit/integration tests (Vitest, tests/**/*.test.ts)
- `pnpm test:e2e` — End-to-end with Playwright (builds app first, single-worker, 60s timeout per test)
- `pnpm test:packaged` — Smoke test of release/mac-arm64 app (after `pnpm package:dir`)

Run one test file: `pnpm exec vitest run tests/unit/study.test.ts` or `pnpm exec playwright test tests/e2e/practice.spec.ts`.

### E2E Testing Quirks

- Requires `pnpm build` to succeed first (e2e command does this automatically)
- Single-worker execution (workers: 1) — don't run in parallel
- 60-second timeout per test
- **Data isolation guard**: Each test uses a temporary data folder. After e2e run, a guard (`tests/e2e/global-guard.ts`) verifies that the installed app's folders (~/Library/Application Support/MemBetter, ~/Documents/MemBetter Backups) and the dev app folder (MemBetter-dev) were not modified. This check must pass — don't touch the filesystem outside temp folders.
- On Linux in CI: `xvfb-run --auto-servernum pnpm exec playwright test` (needs virtual display)

### Data Folders

Two separate, never-overlapping data locations:

| Folder | Used by | Path |
|--------|---------|------|
| Real | Installed MemBetter app | ~/Library/Application Support/MemBetter |
| Dev | `pnpm dev` / `pnpm dev:samples` | ~/Library/Application Support/MemBetter-dev |

Sample course file (`dev-data/sample-courses.membetter`) is ignored by git and only loaded into the dev folder.

## Code Style

- ESLint: standard config (no custom rules beyond react-hooks, typescript-eslint)
- No formatter configured (Prettier, Biome, etc.)
- Conventional commits (feat:, fix:, test:, etc.)
- Branches: feature/ or bugfix/ prefix

## CI

GitHub Actions runs on macOS, Linux, Windows (multiplatform matrix). Checks: typecheck → lint → test → build → e2e (Linux uses xvfb for virtual display).

## Package Manager

pnpm 12.x. Frozen lockfile in CI.
