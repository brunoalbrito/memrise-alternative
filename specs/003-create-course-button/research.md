# Research: Create Course Button

## R1. Destination of the button
- **Decision**: Navigate to a new `/courses/new` route rendering the existing `ComingSoonPage`
  with title "Create a course".
- **Rationale**: Spec FR-003 requires a placeholder with a way back. The route nests under the
  existing `/courses` area, so the active nav item stays consistent and the URL is meaningful
  for the future real feature. The browser back button works because it is a normal push.
- **Alternatives**: A modal placeholder (no URL, harder to evolve into a form page); reusing
  `/courses` (loses the "Create a course" title).

## R2. Placement
- **Decision**: Header row of Home, right of the heading and filter menu, wrapping below on
  narrow widths. Rendered outside the empty-state logic, so it is always present.
- **Rationale**: Satisfies FR-002 (visible in empty and no-match states) and SC-002 (visible
  without scrolling at 360 px). The header row is above the list, so it is always in the first
  viewport.
- **Alternatives**: Floating action button (covers list content, extra a11y concerns); inside
  the empty state only (violates FR-002).

## R3. Styling
- **Decision**: Shared `Button` with the `filled` variant (primary color token) and a text
  label "Create a course", plus an add icon. Height 40 px on desktop and 48 px minimum on
  phone widths via a responsive class.
- **Rationale**: FR-005 requires M3 and the project's tokens. The green in the reference image
  is a visual hint only. Tokens give correct dark-scheme contrast automatically.
- **Alternatives**: Hard-coded green (violates Principle V); extended FAB (different M3
  component, not requested).

## R4. Double activation guard (FR-006)
- **Decision**: In the click handler, ignore presses after the first using a ref flag, then
  call `navigate`. The component unmounts on navigation, so no reset is needed.
- **Rationale**: Two clicks in the same tick can both fire before the route changes, producing
  duplicate history entries. A ref flag is the smallest fix and avoids extra state or renders.
- **Alternatives**: `disabled` state (needs a re-render, can lose a fast second click); debounce
  library (new dependency).

## Resolved unknowns

None remained in Technical Context.
