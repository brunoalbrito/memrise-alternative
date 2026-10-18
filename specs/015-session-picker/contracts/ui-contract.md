# UI Contract: Session Picker

## Trigger

The grid button on each Home course card (`aria-label="Choose a session"`, `aria-haspopup="dialog"`) opens the
dialog. It no longer navigates. The course page opens from the title link or the card.

## Dialog

| Element | Behavior |
|---------|----------|
| Container | Native modal `<dialog>`, `aria-labelledby` the title, surface-container-high, large radius, width `min(92vw, 28rem)`, scrolls if too tall |
| Close | X `IconButton` (`aria-label="Close"`) top right; Escape and a click outside also close |
| Title | h2 with the course title (wraps) |
| "Next up for you" | Small heading, then one large filled `Button`: "Classic review" if words are due, else "Learn new words" (with its icon) |
| "Or choose your session" | Small heading, then a row of 3 round buttons with a label under each |
| Learn new words | Circle (primary-container, leaf icon). Always enabled. Goes to `/course/:id/learn` |
| Classic review | Circle (secondary-container, water-drop icon) with a badge (due count, "99+" from 99). Disabled when nothing is due. Goes to `/course/:id/review` |
| Speed review | Circle (surface-variant, timer icon). Disabled when nothing is due. Goes to `/course/:id/speed-review` |

Choosing a session closes the dialog and navigates. Closing without choosing changes nothing and returns focus to
the grid button. The round buttons are `<button>` elements; the label under each is part of the button's accessible
name, the badge adds "N words due" (visually hidden text).

## Placeholder titles

`/course/:id/review` is titled "Classic review". `/course/:id/speed-review` "Speed review", `/course/:id/learn`
"Learn new words".

## Accessibility

Focus is trapped while open, the title is announced, disabled sessions use the native `disabled` attribute, visible
focus rings, works from 360 px (the three round buttons wrap if needed).
