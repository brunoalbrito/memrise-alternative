# Implementation Plan: Electron Foundation

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

Shared design: [docs/local-first](../../docs/local-first/).

## Summary
Wrap the existing React app in an Electron shell built with electron-vite, add a local SQLite library with safe forward-only
migrations, a hardened window, single-instance lock, tests and CI. Constitution amended to v3.0.0 first.

## Technical Context
TypeScript strict, Node >= 22.22, Electron 44, electron-vite 6, better-sqlite3 13 (prebuilt N-API), Vitest 5, Playwright.
Storage: `<userData>/library/membetter.db` (WAL), `pre-upgrade/` copies. Targets: Windows, macOS, Linux.

## Constitution Check
Pass after the v3.0.0 amendment (done in this feature): new libraries are listed in the Tech Stack section.

## Structure
```text
electron/{main,preload,db,shared}   tests/{unit,e2e}   electron.vite.config.ts   electron-builder.yml
tsconfig.electron.json   vitest.config.ts   playwright.config.ts   .github/workflows/ci.yml
src/shared/api/index.ts             typed access to window.api
```
