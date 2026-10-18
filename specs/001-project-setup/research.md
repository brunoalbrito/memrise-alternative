# Research: Project Environment Setup

Versions verified against the npm registry on 2026-10-18.

## R1. TypeScript version

- **Decision**: TypeScript 6.0.3 (pinned `~6.0.3`).
- **Rationale**: Latest is 7.0.2, but `typescript-eslint` 8.71.2 declares peer `typescript >=4.8.4 <6.1.0`.
  Using 7.x would break lint (FR-004) or force `--force` peer overrides. 6.0.3 is the newest
  version inside the supported range and still satisfies strict mode (FR-003).
- **Alternatives considered**: TypeScript 7.0.2 (rejected: lint incompatibility); skip
  typescript-eslint and lint JS rules only (rejected: loses type-aware rules).
- **Revisit when**: typescript-eslint widens its peer range to include 7.x.

## R2. Vite and React plugin

- **Decision**: Vite 8.3.4 with `@vitejs/plugin-react` 6.1.2.
- **Rationale**: User asked for the latest Vite. plugin-react 6.x peers on `vite ^8.0.0`. Vite 8
  needs Node `^20.19 || >=22.12`.
- **Alternatives considered**: Vite 7 (rejected: not latest).

## R3. Tailwind CSS

- **Decision**: Tailwind 4.3.3 via `@tailwindcss/vite` plugin; single `@import "tailwindcss";` in
  `src/index.css`.
- **Rationale**: v4 needs no `tailwind.config` or PostCSS setup, satisfying FR-008 with zero
  per-file setup. The Vite plugin peers on Vite 5 to 8.
- **Alternatives considered**: Tailwind v3 + PostCSS (rejected: more config, superseded).

## R4. Routing

- **Decision**: `react-router` 8.4.0 in library (data router) mode: `createBrowserRouter` +
  `RouterProvider`, importing from `react-router` (not `react-router-dom`).
- **Rationale**: Constitution says "v6+". v8 is current; it requires Node >=22.22 and React
  >=19.2.7, both met. Single package import is the current convention.
- **Alternatives considered**: `BrowserRouter` component API (rejected: data router is the
  recommended path and costs nothing extra now).
- **Risk**: Node floor of 22.22 is higher than Vite's. README must state Node >=22.22.

## R5. State management

- **Decision**: Zustand 5.0.15 with one minimal store in `src/shared/store/appStore.ts`.
- **Rationale**: Constitution lists Zustand for cross-feature state. Spec assumption says
  minimal wiring only.
- **Alternatives considered**: Defer install (rejected: spec FR/assumptions say installed and
  wired).

## R6. Package manager

- **Decision**: pnpm 12.14.0, declared via `packageManager` field in `package.json`.
- **Rationale**: Constitution mandates pnpm (FR-005). pnpm is not installed locally and Corepack
  is absent from this Node 26 install, so install via `npm i -g pnpm` (or the pnpm standalone
  installer). README documents this prerequisite per spec assumptions.
- **Alternatives considered**: npm/yarn (rejected: constitution).

## R7. Linting

- **Decision**: ESLint 10.13.0 flat config with `typescript-eslint` 8.71.2 and
  `eslint-plugin-react-hooks` 7.1.1.
- **Rationale**: Satisfies FR-004. All three peer-compatible with ESLint 10 and (given R1)
  TS 6.0.3.
- **Alternatives considered**: Biome (rejected: not in constitution stack, larger deviation).
- **Note**: Not named in the constitution; tracked in plan Complexity Tracking.

## R8. Scaffolding method

- **Decision**: Write files by hand rather than running `create-vite`.
- **Rationale**: `create-vite` templates lag the latest dependency set and add a demo app and
  asset files to remove. Hand-written config matches the structure in plan.md exactly.
- **Alternatives considered**: `pnpm create vite --template react-ts` then edit (acceptable
  fallback; more cleanup).

## Resolved unknowns

No NEEDS CLARIFICATION items remained after Technical Context.
