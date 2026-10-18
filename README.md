# MemBetter

A local-first vocabulary learning app (Memrise / Anki style). Your courses, pictures, audio and progress stay on your
computer; AI help is optional and uses your own keys.

React + Vite + TypeScript renderer inside an Electron shell. Data lives in a local SQLite library.

## Prerequisites

- Node.js >= 22.22
- pnpm 12.x (`npm i -g pnpm`)

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies (the Electron binary and the SQLite module are fetched on install) |
| `pnpm dev` | Run the desktop app with hot reload |
| `pnpm dev:web` | Run only the web renderer in a browser (no storage; used for UI work and for the prototype's "Export my data") |
| `pnpm build` | Type-check and build the app into `out/` |
| `pnpm package:dir` | Build an unpacked app for this computer in `release/` |
| `pnpm package` | Build installers for this computer in `release/` |
| `pnpm test` | Unit and integration tests (Vitest) |
| `pnpm test:e2e` | Build, then end-to-end tests that drive the real app (Playwright) |
| `pnpm test:packaged` | Smoke test of the unpacked macOS arm64 app from `pnpm package:dir` |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |

## Layout

```text
electron/
├── main/        app start, hardened window, media protocol, updates, IPC wiring
├── preload/     the only API the renderer can use (window.api)
├── services/    library, media, exchange (.membetter files), study (FSRS), ai, secrets, backup, anki
├── db/          SQLite connection and forward-only migrations (db/migrations/*.sql)
└── shared/      types and zod schemas used by main, preload and renderer
src/
├── app/         shell and router
├── features/    one folder per feature (home, course-editor, course-detail, practice, library, ai-assistant, privacy, ...)
└── shared/      cross-feature code (api client, media, ui)
tests/           unit/ (Vitest) and e2e/ (Playwright for Electron)
specs/           feature specifications and plans (Spec Kit); shared design in docs/local-first/
```

## Releasing

Pushing a tag such as `v1.0.0` runs `.github/workflows/release.yml`, which builds installers for macOS, Windows and Linux and
publishes them to the GitHub Release (the installed app looks there for updates). Installers are unsigned unless the signing
secrets listed in the workflow are set: a macOS Developer ID certificate with Apple notarization credentials, and a Windows
code-signing certificate.

See `.specify/memory/constitution.md` for project rules and `docs/local-first/` for the design.
