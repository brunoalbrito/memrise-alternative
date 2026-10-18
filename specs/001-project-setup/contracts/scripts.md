# Contract: Developer Commands

The project exposes no network API. Its external interface is the set of `package.json` scripts
developers and CI run. Behavior below is the contract.

| Command | Behavior | Success | Failure |
|---|---|---|---|
| `pnpm install` | Install dependencies from the lockfile | Exit 0, no peer-dependency errors | Non-zero with pnpm message |
| `pnpm dev` | Start Vite dev server with HMR | Serves app on `http://localhost:5173` (auto-picks next port if busy) | Non-zero on config error |
| `pnpm build` | Type-check then production build | Exit 0, `dist/` produced | Non-zero on any type error (FR-003, FR-006) |
| `pnpm preview` | Serve `dist/` locally | App loads at printed URL | Non-zero if `dist/` missing |
| `pnpm lint` | Run ESLint over the project | Exit 0, no errors | Non-zero listing violations (FR-004) |
| `pnpm typecheck` | Run `tsc -b` without emit | Exit 0 | Non-zero listing type errors |

## Route contract

| Path | Renders | Notes |
|---|---|---|
| `/` | `HomePage` placeholder | FR-009. Unknown paths: default router 404 for v1 |

## Environment contract

- Node.js >=22.22 (React Router 8 floor; also satisfies Vite 8).
- pnpm 12.x available on PATH.
