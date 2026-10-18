# UI Contract: Create Course Form

## Routes

| Path | Screen | Notes |
|------|--------|-------|
| `/courses/new` | CreateCoursePage | Replaces the earlier placeholder. Opened by the Home "Create a course" button |
| `/help/course-creation` | ComingSoon("Course Creation knowledge base") | Opened by the side-panel link |

The top app bar is shown with "Courses" highlighted. A "Back to Home" link is available and
creates no course. On success the app navigates to `/`.

## Page layout

Title "Create a Course" (h1). Below: form and side panel. Wide screens: form left, panel right
(20 rem). Narrow screens: panel below the form. No horizontal scroll from 360 px.

## Form fields (in order)

| Field | Control | Required | Default | Hint text |
|-------|---------|----------|---------|-----------|
| Name | text input | Yes | empty, focused on open | Naming your course well will help other learners find it. |
| Teaching | select | Yes | "Please select one..." | none |
| For | select + the word "speakers" | Yes | English (UK) | none |
| Tags | text input | No | empty | E.g. Spanish vocabulary, learn spanish online, spanish grammar |
| Description | textarea | No | empty | Keep the description of the course in the language of what the learners speak. |
| Short description | text input | No | empty | A short description for our apps. |

Button: "Create Course" (filled, submits the form). Each field has a visible label, and its hint
(and error when present) is linked with `aria-describedby`. Invalid fields set `aria-invalid="true"`
and use the error color token.

## Error messages (exact text)

| Condition | Field | Message |
|-----------|-------|---------|
| Name empty or only spaces | Name | Enter a name for your course. |
| Name under 3 characters | Name | Name must be at least 3 characters. |
| Name over 100 characters | Name | Name must be 100 characters or fewer. |
| No Teaching language | Teaching | Select the language you are teaching. |
| Short description over 100 | Short description | Short description must be 100 characters or fewer. |
| Description over 2000 | Description | Description must be 2000 characters or fewer. |
| More than 10 tags | Tags | Use at most 10 tags. |
| A tag over 30 characters | Tags | Each tag must be 30 characters or fewer. |
| Storage not writable | Form (alert region above the button) | Could not save your course on this device. Please try again. |

Behavior: submit with errors creates nothing, shows all errors, focuses the first invalid field in
form order. Errors for a field clear as soon as its value becomes valid. Repeated submits create
one course.

## Side panel

Heading "Why create a course?" with a list of three items: "A quick list of personal facts to
remember", "Share common content with your classmates/colleagues", "Share awesome teaching
materials with the community!". Heading "Need more help?" with the text "Check out the Course
Creation knowledge base." where the phrase "Course Creation knowledge base" is a link to
`/help/course-creation`.

## Result on Home

The new course card shows the Name, 0%, "0 / 0 items learned", the "Learn new words" action,
the options menu and levels button. It matches the "Teaching" filter and the filter for its
Teaching language category (`By Category`). It survives reload.

## Accessibility

Tab order follows the visual order (Name, Teaching, For, Tags, Description, Short description,
Create Course, then the side-panel link). Enter in a single-line field submits the form. Focus
rings use the M3 focus token. Contrast meets WCAG 2.1 AA in light and dark schemes.
