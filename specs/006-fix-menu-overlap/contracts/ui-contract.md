# UI Contract: Fix Course Options Menu Overlap

Layering rules for a Home course card (`CourseCard`):

| Layer (back to front) | Element |
|-----------------------|---------|
| 1 | Card content without positioning (progress bar, text) |
| 2 | Stretched title link overlay (covers the card, opens the course page) |
| 3 | Options container and bottom button row (positioned, no `z-index`, later in the document than the link) |
| 4 | Open options menu popup (`z-20`, in the page stacking context, above every card) |

Rules:
- No card wrapper may set a numeric `z-index` (it would trap the menu).
- The popup stays `z-20` as defined in `src/shared/ui/Menu.tsx`.
- The bottom button row keeps `pointer-events-none` with `pointer-events-auto` on the button
  group so clicks on stats and empty space reach the overlay link.
