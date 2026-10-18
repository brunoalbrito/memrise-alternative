# Implementation Plan: Project Environment Setup

**Branch**: `001-project-setup` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-setup/spec.md`

## Summary

Bootstrap a React + Vite + TypeScript (strict) single-page app with Tailwind CSS, React Router,
Zustand, ESLint, and pnpm, laid out as feature-scoped modules per the constitution. Deliverable
is a working dev server, a production build, a lint command, and a placeholder root route.
No tests in this version (constitution v2.0.0).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict), Node.js >=22.12 (Vite 8 requires ^20.19 || >=22.12;
React Router 8 requires >=22.22 — local Node is v26.12.0)

**Primary Dependencies**: React 19.3.1, Vite 8.3.4, @vitejs/plugin-react 6.1.2, Tailwind CSS 4.3.3
(@tailwindcss/vite), React Router 8.4.0, Zustand 5.0.15

**Storage**: N/A

**Testing**: None for v1 (constitution v2.0.0 removed the test-first principle)

**Target Platform**: Modern evergreen browsers (desktop + mobile web)

**Project Type**: web-application (frontend-only SPA)

**Performance Goals**: Dev server ready <10s; production build <60s (spec SC-002, SC-003)

**Constraints**: pnpm only; lockfile committed; no plain `.js` under `src/`; no libraries outside
the constitution's stack

**Scale/Scope**: Single placeholder screen; scaffolding for future feature modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Status | Notes |
|---|---|---|
| I. React + Vite, latest stable, TS default | PASS | React 19.3.1, Vite 8.3.4. TS pinned to 6.0.3, not 7.x, because typescript-eslint peer range is `<6.1.0` (see research.md) |
| II. Component-first | PASS | Placeholder UI is a single self-contained component |
| III. Feature-scoped modules + `index.ts` barrels | PASS | `src/features/home/` with barrel; `src/app/` for shell |
| IV. Simplicity | PASS | No extra abstractions; one feature module, one empty store |
| Tech stack closed list | PASS | ESLint + typescript-eslint + eslint-plugin-react-hooks are tooling, not runtime libs; flagged as an assumption (see Complexity Tracking) |
| Workflow: CI = type-check + lint | PASS | `typecheck` and `lint` scripts provided; CI pipeline itself is out of scope per spec |
| Accessibility baseline | PASS | Placeholder uses semantic elements |

**Post-design re-check**: PASS. No new violations introduced by Phase 1 artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-setup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── scripts.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
package.json
pnpm-lock.yaml
vite.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
eslint.config.js
index.html
.gitignore
README.md
public/
src/
├── main.tsx
├── index.css                 # @import "tailwindcss";
├── vite-env.d.ts
├── app/
│   ├── App.tsx               # RouterProvider shell
│   └── router.tsx            # root route "/"
├── features/
│   └── home/
│       ├── HomePage.tsx
│       └── index.ts          # barrel
└── shared/
    └── store/
        └── appStore.ts       # minimal Zustand store (wiring proof)
```

**Structure Decision**: Single frontend project at repo root. `src/features/<name>/` owns
components, hooks, and types with an `index.ts` barrel (Principle III). `src/app/` holds the
shell and router; `src/shared/` holds cross-feature code (state). `eslint.config.js` is a root
config file, not under `src/`, so the no-plain-JS rule for `src/` still holds.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| ESLint + typescript-eslint + eslint-plugin-react-hooks not named in the constitution stack | Spec FR-004 requires a lint command; these are the standard linter for React + TS | No lint tooling means FR-004 cannot be met. Dev-only, no runtime footprint. Recommend a PATCH/MINOR amendment listing ESLint in Tech Stack |
