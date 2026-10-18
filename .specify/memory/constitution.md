<!--
SYNC IMPACT REPORT (remove before commit)
=========================================
Version change: 2.1.0 → 3.0.0
Modified principles:
  - I. React + Vite Stack: renderer stays React + Vite; electron-vite (Vite) builds main/preload too
Added sections:
  - Platform: desktop app (Electron), local-first storage
Modified sections:
  - Tech Stack: added Electron toolchain, SQLite, zod, fflate, ts-fsrs, Vitest, Playwright
Removed sections: N/A
Follow-up TODOs: None
=========================================
-->

# MemBetter Constitution

## Core Principles

### I. React + Vite Stack (NON-NEGOTIABLE)

The project MUST use React with Vite as the build toolchain. Always use the latest stable
versions of both. No alternative bundlers (Webpack, Parcel, CRA) are permitted. TypeScript
is the default language for all source files.

**Rationale**: Vite provides fast HMR and optimized builds; React is the agreed UI layer.
Locking the stack prevents drift and ensures all tooling assumptions remain valid.

### II. Component-First Architecture

Every UI feature MUST be expressed as a composable React component. Components MUST be
self-contained: own markup, styles scoped via CSS Modules or Tailwind utilities, and
co-located logic. Shared logic MUST be extracted into custom hooks before being reused
across two or more components.

**Rationale**: Isolation makes components individually replaceable, matching the modular
philosophy of Memrise's community-driven feature set.

### III. Feature-Scoped Modules

Code MUST be organized by feature, not by technical layer. Each feature directory owns its
components, hooks, and types. Cross-feature dependencies MUST go through an explicit public
interface (`index.ts` barrel). Circular feature dependencies are forbidden.

**Rationale**: Feature-scoped modules bound the blast radius of changes and mirror the
product's learning-deck / course / vocabulary domain boundaries.

### IV. Simplicity Over Abstraction

Add abstractions only when the same logic appears in three or more places. YAGNI applies:
do not add configuration, feature flags, or plugin systems for hypothetical future needs.
Prefer readable, flat code over clever indirection.

**Rationale**: Community projects accrete complexity quickly; a strict simplicity gate keeps
onboarding cost low and maintenance sustainable.

### V. Material Design 3 Component Design

All UI components MUST follow Google's Material Design 3 (M3) guidelines: component anatomy,
states (enabled, hovered, focused, pressed, disabled), shape, elevation, motion, and
typography scale. Visual styling MUST be driven by M3 design tokens (color roles, type scale,
shape, elevation) defined once as Tailwind theme values or CSS custom properties, never
hard-coded per component. Light and dark color schemes MUST both be supported. Where M3
defines a component (button, text field, card, dialog, navigation bar, chip, etc.), the
project MUST implement that component per spec instead of inventing a custom variant.
Deviations MUST be justified in the PR description.

**Rationale**: A single, well-documented design system gives consistent, accessible UI and
removes per-component design debates.

## Tech Stack

- **Framework**: React (latest stable)
- **Build tool**: Vite (latest stable)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (utility-first; CSS Modules for component-level isolation when needed)
- **State management**: React Context + hooks for local state; Zustand for cross-feature global
  state when Context causes excessive re-renders
- **Routing**: React Router v6+
- **Design system**: Material Design 3 (tokens implemented via Tailwind theme / CSS variables)
- **Package manager**: pnpm (preferred for monorepo-friendliness and disk efficiency)

- **Desktop shell**: Electron (latest stable) built with electron-vite; electron-builder and
  electron-updater for packaging and updates. The renderer MUST NOT access Node, the file system or
  the network directly; it uses a typed preload API (`contextIsolation` on, `nodeIntegration` off, sandbox on).
- **Local storage**: SQLite via better-sqlite3 in the main process; media as content-addressed files.
  Browser storage MUST NOT be the source of truth.
- **Validation and data libraries**: zod (IPC and file validation), fflate (zip), ts-fsrs (scheduling).
- **Testing**: Vitest for unit and integration tests; Playwright for Electron end-to-end tests.
  Data integrity features (migrations, import/export, backup) MUST have automated tests.

No library outside this stack may be introduced without a constitution amendment. Adopting
an M3 component library (e.g., `@material/web`) counts as a new library and requires one.

## Development Workflow

- All feature work MUST land via pull request; direct pushes to `main` are forbidden.
- PRs MUST pass CI (type-check, lint) before merge.
- Commits MUST follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- Breaking UI changes MUST include a screenshot or short screen-recording in the PR description.
- Accessibility: interactive elements MUST be keyboard-navigable and carry appropriate ARIA
  roles. WCAG 2.1 AA compliance is the target baseline.

## Governance

This constitution supersedes all ad-hoc coding conventions. Amendments require:

1. A written rationale explaining what changed and why.
2. A version bump following semantic versioning (MAJOR: principle removal/redefinition;
   MINOR: new principle or section; PATCH: clarification/wording).
3. Update of `LAST_AMENDED_DATE` on the day the amendment is merged.

All code reviews MUST verify compliance with these principles, including M3 conformance for
UI changes (Principle V). Complexity that violates
Principle IV MUST be explicitly justified in the PR description before approval.

**Version**: 3.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
