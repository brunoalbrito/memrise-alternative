# Implementation Plan: Separate Real and Sample Storage

**Branch**: `feat/separate-sample-storage` | **Spec**: [spec.md](./spec.md)

## Summary
`electron/main/profile.ts` decides the data profile (real, sample, custom) from `app.isPackaged`, argv and env. `main/index.ts` applies it
(app-data override, folder name, window title) and calls `services/seed.ts` (`seedIfEmpty`) with `MEMBETTER_SEED_FILE`. `scripts/dev-samples.ts`
(`pnpm dev:samples`) builds the sample file and starts `electron-vite dev` with that variable. README explains the two places.

## Constitution Check
Pass (v3.0.0): no new libraries; renderer unchanged.
