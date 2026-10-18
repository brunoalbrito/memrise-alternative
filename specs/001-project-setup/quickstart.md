# Quickstart: Validate Project Setup

Run these after implementation to prove the spec's success criteria. Command behavior is defined
in [contracts/scripts.md](./contracts/scripts.md); structure in [plan.md](./plan.md).

## Prerequisites

- Node.js >=22.22 (`node -v`)
- pnpm installed (`npm i -g pnpm` if `pnpm -v` fails)

## Scenario 1: Fresh bootstrap (User Story 1, SC-001, SC-002)

```bash
pnpm install
pnpm dev
```

Expected:
- Install completes with no errors.
- Dev server ready in under 10 seconds; open the printed URL.
- Placeholder page shows the app name; browser console has no errors or warnings (SC-004).
- Edit text in `src/features/home/HomePage.tsx`: browser updates without full reload (FR-002).
- Introduce a type error: error appears in terminal or overlay.

## Scenario 2: Production build (User Story 2, SC-003)

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

Expected:
- All four commands exit 0; build finishes in under 60 seconds.
- `dist/` exists; preview URL loads the same placeholder page.
- With a deliberate type error, `pnpm build` fails (FR-003).

## Scenario 3: Structure checks (FR-007, FR-008, FR-009, SC-005)

- `src/features/home/index.ts` exists and `HomePage` is imported only through it.
- A Tailwind utility class (for example `text-3xl font-bold`) on the placeholder renders styled.
- Visiting `/` shows the placeholder.
- `find src -name '*.js'` prints nothing.
- `pnpm-lock.yaml` exists and is not git-ignored.
