# Data Model: Project Environment Setup

This feature has no persisted data. The entities are structural (spec Key Entities).

## Project root

Top-level directory.

| Item | Purpose |
|---|---|
| `package.json` | Scripts, dependencies, `packageManager` field |
| `pnpm-lock.yaml` | Committed lockfile (FR-005) |
| `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` | Tool configuration |
| `index.html` | Vite entry |
| `src/`, `public/` | Source and static assets |

## Feature module

A directory `src/features/<feature-name>/`.

- Owns components, hooks, and types for one product feature.
- MUST expose its public API through `index.ts`.
- MUST NOT import another feature's internals, only its barrel.
- No circular feature dependencies.
- v1 contains one module: `home` (placeholder page).

## Production artifact

Output of `pnpm build`: the `dist/` directory with static HTML, hashed JS bundles, and CSS.
Not committed to version control.

## Application store (runtime state)

`src/shared/store/appStore.ts`: minimal Zustand store, v1 shape:

| Field | Type | Notes |
|---|---|---|
| `appName` | string | Constant `"MemBetter"`; proves store wiring by being read in `HomePage` |

No state transitions. Real domain entities (decks, words, progress) belong to later specs.
