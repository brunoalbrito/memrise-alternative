# UI Contract: Course Home Dashboard

> Update: the Home grid button now opens the session dialog (see `specs/015-session-picker`); the course page opens from the course title.

## Routes

| Path | Screen | Notes |
|------|--------|-------|
| `/` | Home | Query `?filter=` per data model |
| `/courses` | ComingSoon("Courses") | Nav item |
| `/groups` | ComingSoon("Groups") | Nav item |
| `/profile` | ComingSoon("Profile") | Profile control |
| `/course/:id/levels` | ComingSoon("Levels and items", course) | Levels button |
| `/course/:id/review` | ComingSoon("Speed review", course) | Primary action when due > 0 |
| `/course/:id/learn` | ComingSoon("Learn new words", course) | Primary action when due = 0 |

Unknown `:id` renders a not-found message with a link to `/`. Every placeholder has a "Back to
Home" link. Unknown paths redirect to `/`.

## Home screen regions

1. **Top app bar**: Home (active), Courses, Groups, profile button.
2. **Heading + filter trigger**: heading shows the active filter name (default "All Courses");
   trigger opens the filter menu.
3. **Filter menu** (`role="menu"`): group "Filter Results" (All Courses, With Goal Set, Teaching),
   group "By Category" (hidden when empty). Selecting closes the menu and sets `?filter=`.
4. **Course list**: one card per visible, filtered course.
5. **Empty states**: no courses (restore button) and no filter match (clear-filter button).

## Course card

| Element | Behavior |
|---------|----------|
| Title, percent, "N / M items learned", progress bar | `role="progressbar"` with value |
| Goal ring, learned count, due count | Dimmed when value is 0 (or no goal for the ring) |
| Primary button | Label and target route per `primaryAction` |
| Levels button | Navigates to `/course/:id/levels`, `aria-label="Levels and items"` |
| Options menu (three dots) | Items: "Set daily goal" (opens goal dialog), "Clear goal" (only when set), "Remove course" (opens confirm dialog) |

## Goal dialog

Radio options 5, 10, 20, 50 and "No goal". Save applies and closes. Cancel and Escape close
without change.

## Accessibility

All controls reachable by keyboard. Menus: arrow keys move, Enter selects, Escape closes and
returns focus to the trigger. Visible focus ring using the M3 focus token. Text and controls meet
WCAG 2.1 AA contrast in light and dark schemes.
