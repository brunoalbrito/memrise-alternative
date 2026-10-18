# Tasks: Electron Foundation

- [x] T001 Amend constitution to v3.0.0 (.specify/memory/constitution.md)
- [x] T002 Install Electron toolchain, better-sqlite3, zod, Vitest, Playwright; approve native builds
- [x] T003 electron.vite.config.ts, scripts (dev, build, test, test:e2e, package), tsconfig.electron.json
- [x] T004 Hardened window, CSP, navigation lock, preload with `window.api.app.info` (electron/main, electron/preload)
- [x] T005 Library DB: connection, forward-only migrations, pre-upgrade copy, newer-version refusal (electron/db)
- [x] T006 Single-instance lock and second-instance focus
- [x] T007 Unit tests for migrations (tests/unit/migrate.test.ts)
- [x] T008 E2E: isolation, library created, second instance (tests/e2e/shell.spec.ts)
- [x] T009 CI on Linux, macOS, Windows (.github/workflows/ci.yml); electron-builder.yml
