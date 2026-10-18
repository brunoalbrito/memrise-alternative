# UI Contract: Create Course Button

## Route added

| Path | Screen | Notes |
|------|--------|-------|
| `/courses/new` | ComingSoon("Create a course") | Includes the top app bar and a "Back to Home" link |

Existing routes (see `specs/002-course-home-dashboard/contracts/ui-contract.md`) are unchanged.

## Home header row

Heading, filter menu (when courses exist) and the new button share one row. The button is
right-aligned and wraps to its own line on narrow widths. It is rendered in every Home state:
list, filtered list, no filter match and no courses.

## Button

| Property | Value |
|----------|-------|
| Element | Native `<button type="button">` |
| Label | "Create a course" (exact text) |
| Style | M3 filled button, token colors, shape full, optional leading add icon |
| Size | 40 px high on desktop, at least 48 px high on phone widths |
| Press | Navigates to `/courses/new` once, even if activated repeatedly |
| Keyboard | Reachable with Tab, activated with Enter or Space, visible focus ring |
| Dark scheme | Uses token colors, meeting WCAG 2.1 AA contrast |
