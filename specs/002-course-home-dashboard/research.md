# Research: Course Home Dashboard

## R1. Persistence of learner state
- **Decision**: Zustand `persist` middleware with `localStorage`, versioned key, persisting only
  `goals` and `removedCourseIds`.
- **Rationale**: Zustand is already in the stack; `persist` is part of it, so no new library.
  Satisfies FR-015 with a few lines.
- **Alternatives**: Raw `localStorage` calls (more boilerplate, no hydration handling); IndexedDB
  (overkill for two small values).

## R2. Active filter storage
- **Decision**: Keep the active filter in the URL search param (`?filter=goal|teaching|cat:english`),
  not in persisted state. Default is All Courses.
- **Rationale**: Shareable, survives refresh, back button works, keeps persisted state minimal.
  Spec does not require restoring the filter across visits.
- **Alternatives**: Store state (lost on refresh); persisted store (stale filters on return).

## R3. Material Design 3 without a component library
- **Decision**: Declare M3 color roles, type scale, shape and elevation tokens as CSS custom
  properties in a Tailwind v4 `@theme` block. Light scheme by default, dark scheme under
  `prefers-color-scheme: dark`. Hand-build the needed components.
- **Rationale**: Constitution requires M3 and forbids new libraries without an amendment.
  `@material/web` would need one. Tokens-first keeps styling consistent.
- **Alternatives**: `@material/web` (needs amendment); MUI (not M3-native, needs amendment).

## R4. Menus and dialog accessibility
- **Decision**: Build one small `Menu` primitive (button + `role="menu"` popup, arrow-key
  navigation, Escape to close, focus return) and use the native `<dialog>` element for the goal
  and remove-confirm dialogs.
- **Rationale**: Native dialog gives focus trapping and Escape for free. One menu primitive is
  used by the filter menu and the card options menu (two uses, shared in `shared/ui`).
- **Alternatives**: Headless UI library (new dependency); no keyboard support (fails a11y).

## R5. Primary action logic
- **Decision**: Pure selector: `dueCount > 0` → "Speed review", else "Learn new words".
- **Rationale**: Directly from FR-004; trivial to verify against sample data.

## R6. Progress and goal ring
- **Decision**: Percent = `floor(learned / total * 100)`, 0 when total is 0. Progress bar uses
  an M3 linear progress indicator style with `role="progressbar"`. Goal ring is an SVG circle
  with `aria-valuenow`.
- **Rationale**: Matches the edge cases in the spec (no NaN, never 100% unless complete).

## R7. Routes
- **Decision**: `/` Home; `/courses`, `/groups`, `/profile`, `/course/:id/levels`,
  `/course/:id/review`, `/course/:id/learn` all render `ComingSoonPage`, which reads the route
  to name the destination (and the course for course routes). Unknown course id shows a
  not-found message with a link to Home.
- **Rationale**: Spec requires placeholders that name the destination (FR-005, 010, 012).

## R8. Empty and error states
- **Decision**: Empty state with "Restore sample courses" action when all courses are removed
  (clears `removedCourseIds`). Sample data is bundled, so a load error cannot occur from the
  network; FR-014 is met by an error boundary on Home with a retry (reload) button.
- **Rationale**: Honors spec edge cases without inventing a backend.

## Resolved unknowns

None remained in Technical Context.
