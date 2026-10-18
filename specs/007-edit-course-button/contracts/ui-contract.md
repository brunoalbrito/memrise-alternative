# UI Contract: Edit Course Button

## Placement

Right end of the course page tab row, level with the "Levels (N)" tab. The tab row wraps on very
narrow widths, so the link may drop below the tab.

## Link

| Property | Value |
|----------|-------|
| Element | Router `Link` to `/course/:id/edit` |
| Label | "Edit Course", with a pencil icon before it |
| Visibility | Every course page that shows a course (not on "Course not found") |
| Size | At least 48 px high on phone widths, 40 px from the `sm` breakpoint up |
| Keyboard | Tab order: breadcrumb, Tweet, Levels tab, Edit Course, then the rest; visible focus ring; Enter opens it |
| Press | Opens the "Edit Course" placeholder naming the course, once even if pressed repeatedly |

Route and placeholder are unchanged (see `specs/005-course-detail-view/contracts/ui-contract.md`).
