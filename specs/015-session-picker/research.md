# Research: Session Picker

## R1. Dialog implementation
- **Decision**: Native `<dialog>` with `showModal()` (same pattern as the goal and remove dialogs), mounted only
  while open. It gives the focus trap, Escape and a `::backdrop`. A click on the backdrop is detected with an
  `onClick` on the dialog element that closes when `event.target === event.currentTarget` (the padding area is
  inside an inner wrapper so clicks on content do not count). Focus returns to the opener: the grid button
  is focused in `onClose`.
- **Rationale**: FR-006, FR-008; no new dependency.
- **Alternatives**: A custom portal modal (needs hand-built focus trap).

## R2. Recommendation and badge
- **Decision**: `recommendedSession(course)` returns `"classic-review"` when `itemsDue > 0`, otherwise
  `"learn-new-words"`. `dueBadge(due)` returns `null` for 0, the number as text up to 98, and `"99+"` from 99 up
  (spec: "99+ when there are 99 or more").
- **Rationale**: FR-003, FR-004.

## R3. Destinations
- **Decision**: Learn new words `/course/:id/learn`, Classic review `/course/:id/review`, Speed review
  `/course/:id/speed-review` (all existing placeholder routes). The `/review` placeholder title changes from
  "Review" to "Classic review" so the dialog and the course page's Review button agree.
- **Rationale**: FR-005; no new screens.

## R4. Disabled sessions
- **Decision**: Classic review and Speed review use the native `disabled` attribute when `itemsDue` is 0 (Learn new
  words is always enabled), matching the course page's Review and clock buttons.
- **Rationale**: FR-004, consistency.

## R5. Icons and colors
- **Decision**: Learn new words uses the existing `LeafIcon` on `bg-primary-container`, Classic review a new
  `WaterDropIcon` on `bg-secondary-container`, Speed review the existing `TimerIcon` on `bg-surface-variant`;
  `CloseIcon` for the X. The badge is a small rounded label on the Classic review circle
  (`bg-on-surface text-surface`).
- **Rationale**: Tokens only (Principle V); the reference's colours are a guide.

## R6. The grid button
- **Decision**: In `CourseCard` the grid `IconButton` keeps its place, gets `aria-label="Choose a session"`, sets
  `sessionOpen` state and is focused again when the dialog closes (ref). The course page stays reachable through
  the stretched title link.
- **Rationale**: FR-001, FR-007.

## Resolved unknowns

None.
