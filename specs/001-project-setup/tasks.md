---

description: "Task list for Project Environment Setup"
---

# Tasks: Project Environment Setup

**Input**: Design documents from `/specs/001-project-setup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/scripts.md, quickstart.md

**Tests**: None. The spec and constitution v2.0.0 exclude unit and integration tests for this version. Validation is done by running the commands in quickstart.md.

**Organization**: Tasks are grouped by user story. Paths are relative to the repository root `/Users/brunobrito/Documents/membetter/memrise-alternative`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1, US2)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling prerequisites, package manifest, dependencies, directory skeleton

- [X] T001 Verify prerequisites: `node -v` must print >=22.22; if `pnpm -v` fails, run `npm i -g pnpm` and confirm pnpm 12.x (document both in README.md later, T021)
- [X] T002 Create `package.json` with `"name": "membetter"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@12.14.0"`, `"engines": {"node": ">=22.22"}`, and scripts: `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"preview": "vite preview"`, `"lint": "eslint ."`, `"typecheck": "tsc -b --noEmit"`
- [X] T003 Install dependencies with pnpm and commit the generated `pnpm-lock.yaml`: runtime `pnpm add react@19.3.1 react-dom@19.3.1 react-router@8.4.0 zustand@5.0.15`; dev `pnpm add -D vite@8.3.4 @vitejs/plugin-react@6.1.2 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 typescript@~6.0.3 @types/react @types/react-dom @types/node eslint@10.13.0 @eslint/js typescript-eslint@8.71.2 eslint-plugin-react-hooks@7.1.1 globals` (TypeScript must stay below 6.1 per research.md R1)
- [X] T004 [P] Create `.gitignore` ignoring `node_modules`, `dist`, `*.local`, `.DS_Store`, `.vite`; MUST NOT ignore `pnpm-lock.yaml`
- [X] T005 [P] Create empty directory skeleton with `.gitkeep` only where needed: `public/`, `src/app/`, `src/features/home/`, `src/shared/store/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build, type-check, lint, and style configuration that every user story depends on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Create `tsconfig.json` with `"files": []` and `"references": [{"path": "./tsconfig.app.json"}, {"path": "./tsconfig.node.json"}]`
- [X] T007 [P] Create `tsconfig.app.json`: target ES2023, `"lib": ["ES2023", "DOM", "DOM.Iterable"]`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noFallthroughCasesInSwitch": true`, `"verbatimModuleSyntax": true`, `"isolatedModules": true`, `"noEmit": true`, `"skipLibCheck": true`, `"types": ["vite/client"]`, `"include": ["src"]` (FR-003)
- [X] T008 [P] Create `tsconfig.node.json` for config files: same strict flags, `"types": ["node"]`, `"include": ["vite.config.ts"]`, `"noEmit": true`
- [X] T009 [P] Create `vite.config.ts` using `defineConfig` with plugins `react()` from `@vitejs/plugin-react` and `tailwindcss()` from `@tailwindcss/vite`
- [X] T010 [P] Create `eslint.config.js` (flat config) using `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended rules, `globals.browser`, `ignores: ["dist"]`, applied to `**/*.{ts,tsx}` (FR-004)
- [X] T011 Create `index.html` with `<div id="root"></div>`, `<title>MemBetter</title>`, viewport meta, and `<script type="module" src="/src/main.tsx"></script>`
- [X] T012 [P] Create `src/vite-env.d.ts` containing `/// <reference types="vite/client" />`
- [X] T013 [P] Create `src/index.css` containing exactly `@import "tailwindcss";` (FR-008)

**Checkpoint**: Configuration complete. `pnpm typecheck` may report missing `src/main.tsx` until US1 lands.

---

## Phase 3: User Story 1 - Developer Bootstraps Project (Priority: P1) 🎯 MVP

**Goal**: After clone and `pnpm install`, `pnpm dev` serves a working app with hot reload and a styled placeholder page at `/`.

**Independent Test**: Quickstart Scenario 1: `pnpm install && pnpm dev`, open the URL, see the placeholder with no console errors, edit `HomePage.tsx` and see it update without a full reload.

### Implementation for User Story 1

- [X] T014 [P] [US1] Create `src/shared/store/appStore.ts`: Zustand `create` store exporting `useAppStore` with a single field `appName: string` set to `"MemBetter"` (data-model.md Application store)
- [X] T015 [P] [US1] Create `src/features/home/HomePage.tsx`: default-export-free named export `HomePage` rendering `<main>` with an `<h1 className="text-3xl font-bold">` showing `useAppStore((s) => s.appName)` imported from `../../shared/store/appStore`
- [X] T016 [US1] Create `src/features/home/index.ts` barrel: `export { HomePage } from "./HomePage";` (Principle III; depends on T015)
- [X] T017 [US1] Create `src/app/router.tsx`: `createBrowserRouter([{ path: "/", element: <HomePage /> }])` importing `HomePage` only from `../features/home` (FR-009; depends on T016)
- [X] T018 [US1] Create `src/app/App.tsx`: component rendering `<RouterProvider router={router} />` with `RouterProvider` imported from `react-router/dom` and `router` from `./router` (depends on T017)
- [X] T019 [US1] Create `src/main.tsx`: import `./index.css`, `createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>)` (depends on T018, T013)
- [X] T020 [US1] Create `README.md` documenting prerequisites (Node >=22.22, `npm i -g pnpm`), commands (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm lint`, `pnpm typecheck`) per contracts/scripts.md, and the `src/` layout from plan.md
- [ ] T021 [US1] Validate: run `pnpm dev`, confirm it is ready in under 10 seconds, `/` shows the styled "MemBetter" heading, console has no errors or warnings, editing text in `src/features/home/HomePage.tsx` hot-reloads, and an introduced type error surfaces in terminal or overlay (quickstart Scenario 1; revert the error afterwards)

**Checkpoint**: User Story 1 works on its own and is the MVP.

---

## Phase 4: User Story 2 - Developer Produces a Production Build (Priority: P2)

**Goal**: `pnpm build` yields an optimized `dist/` and `pnpm preview` serves it.

**Independent Test**: Quickstart Scenario 2: typecheck, lint, build, preview all succeed; a deliberate type error makes `pnpm build` fail.

### Implementation for User Story 2

- [X] T022 [US2] Run `pnpm typecheck` and `pnpm lint`; fix every reported issue in the files created above (`eslint.config.js`, `tsconfig*.json`, `src/**`) until both exit 0 (FR-003, FR-004)
- [X] T023 [US2] Run `pnpm build`; confirm exit 0, completes in under 60 seconds, and `dist/index.html` plus hashed assets exist (FR-006)
- [X] T024 [US2] Prove type errors block the build: add `const x: number = "a";` to `src/main.tsx`, run `pnpm build`, confirm non-zero exit, then remove the line (FR-003)
- [X] T025 [US2] Run `pnpm preview` and confirm the printed URL serves the same placeholder page (US2 scenario 2)

**Checkpoint**: Both user stories pass independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final spec-wide verification

- [X] T026 [P] Verify SC-005 and FR-005: `find src -name '*.js'` prints nothing; `pnpm-lock.yaml` exists and is not matched by `.gitignore`
- [X] T027 [P] Verify FR-007: `src/features/home/index.ts` exists and `src/app/router.tsx` imports `HomePage` only via `../features/home`
- [X] T028 Run the full `specs/001-project-setup/quickstart.md` start to finish on a clean install (`rm -rf node_modules && pnpm install`) and confirm every expected outcome, including SC-001 (running dev environment within 5 minutes of clone)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 then T002 then T003 in order; T004 and T005 can run in parallel with T002
- **Foundational (Phase 2)**: Depends on T003 (tooling installed); BLOCKS user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs source files to type-check and build)
- **Polish (Phase 5)**: Depends on US1 and US2

### Within User Story 1

- T014 and T015 in parallel, then T016, then T017, T018, T019 in order, then T020 and T021

### Parallel Opportunities

- Phase 1: T004, T005
- Phase 2: T006, T007, T008, T009, T010, T012, T013 (T011 has no file conflict either and may join)
- Phase 3: T014 with T015; T020 with T017 to T019
- Phase 5: T026 with T027

---

## Parallel Example: Phase 2

```bash
Task: "Create tsconfig.json"
Task: "Create tsconfig.app.json"
Task: "Create tsconfig.node.json"
Task: "Create vite.config.ts"
Task: "Create eslint.config.js"
Task: "Create src/vite-env.d.ts"
Task: "Create src/index.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1
4. **STOP and VALIDATE** with T021

### Incremental Delivery

1. Setup + Foundational gives the toolchain
2. US1 gives a running dev environment (MVP)
3. US2 confirms the production pipeline
4. Polish confirms every FR and SC

---

## Notes

- No test tasks: excluded by spec and constitution v2.0.0
- TypeScript is pinned `~6.0.3` for typescript-eslint compatibility; do not upgrade to 7.x until its peer range allows it
- `eslint.config.js` sits at the repo root, so the "no plain `.js` under `src/`" rule (SC-005) still holds
- Commit after each task or logical group
