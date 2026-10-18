# MemBetter

A community Memrise-style language learning app. React + Vite + TypeScript.

## Prerequisites

- Node.js >= 22.22
- pnpm 12.x (`npm i -g pnpm`)

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start dev server with hot reload (http://localhost:5173) |
| `pnpm build` | Type-check, then produce a production build in `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run the TypeScript compiler without emitting |

## Layout

```text
src/
├── main.tsx            # entry
├── index.css           # Tailwind import
├── app/                # app shell and router
├── features/<name>/    # one folder per feature, public API via index.ts
└── shared/             # cross-feature code (store)
```

See `.specify/memory/constitution.md` for project rules.
