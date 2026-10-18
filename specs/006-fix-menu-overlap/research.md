# Research: Fix Course Options Menu Overlap

## R1. Root cause
- **Finding**: `CourseCard.tsx` has `relative z-10` on the options container (line with the
  `CourseOptionsMenu`) and on the bottom button row. A positioned element with a numeric `z-index`
  creates a stacking context. The menu popup (`Menu.tsx`, `absolute z-20`) lives inside the
  options container, so its `z-20` only orders it among that container's children. The two
  `z-10` siblings then compete at the card level, and the later one (the bottom row) wins, so the
  buttons paint over the menu. The same tie happens against the next card's `z-10` wrappers.
- **Evidence**: the screenshot shows "Speed review" and the levels button drawn over the lower
  menu items; `grep z-` shows only these two `z-10` uses and the menu's `z-20`.

## R2. Fix options considered
- **Decision**: Remove `z-10` from both wrappers, keep `relative`.
- **Rationale**: The stretched link overlay (`after:absolute after:inset-0`) sits earlier in the
  DOM than the options container and the button row. Positioned elements with `z-index: auto`
  paint in DOM order, so the later wrappers already paint above the overlay, which keeps the
  buttons and menu button clickable (spec FR-004). With no stacking contexts created, the menu's
  `z-20` joins the page stacking context and is above every `z-auto` card content, including
  neighboring cards (FR-001).
- **Alternatives**: Raise the options container to `z-20` (fixes the same card but ties with the
  next card's `z-20` container, so a menu near a card edge could still be covered); raise the
  whole open card (needs open state lifted out of the menu); render the menu in a portal
  (larger change, new focus handling).

## R3. Course page menu
- **Finding**: The `Options` menu on the course page sits in `ProgressSummary` with no `z-index`
  wrappers around it, so it is unaffected. Verified by reading the component; no change.

## Resolved unknowns

None.
