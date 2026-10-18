# UI Contract: Edit Course Form

## Routes

| Path | Screen | Notes |
|------|--------|-------|
| `/course/:id/edit` | EditCoursePage | Opened by "Edit Course" on the course page. Unknown or removed id shows "Course not found" with a link to Home |

On save the app navigates to `/course/:id`. "Back to course" links to `/course/:id` without
saving.

## Page

Same layout as `specs/004-create-course-form/contracts/ui-contract.md` (form left, help panel
right on wide screens, stacked on narrow), with these differences:

| Element | Create page | Edit page |
|---------|-------------|-----------|
| h1 | Create a Course | Edit Course |
| Back link | Back to Home (to `/`) | Back to course (to `/course/:id`) |
| Field values on open | empty, For = English (UK) | the course's current values |
| Main button | Create Course | Save Changes |
| On success | adds the course, opens `/` | saves the edits, opens `/course/:id` |

Fields, labels, hints, error messages, limits, focus behavior (Name focused on open, first invalid
field focused on a failed submit, errors clear when fixed), storage error text and the side panel
are identical to the create page. The side panel link still opens `/help/course-creation`.

## Pre-filled values

| Field | Value |
|-------|-------|
| Name | course title |
| Teaching | course teaching language |
| For | course speakers language |
| Tags | tags joined with ", " (empty if none) |
| Description | description or empty |
| Short description | short description or empty |

## After saving

The course page header shows the new title. Home shows the new title and, when the Teaching
language changed, the new category (By Category filter) for that course. Progress, levels,
creator, goal and counts are unchanged. Changes survive reload.

## Accessibility

Same as the create page: labels, hints and errors linked with `aria-describedby`, `aria-invalid`
on invalid fields, Tab order follows the visual order, Enter in a single-line field submits.
