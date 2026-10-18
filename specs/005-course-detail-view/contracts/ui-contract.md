# UI Contract: Course Detail View

## Routes

| Path | Screen | Notes |
|------|--------|-------|
| `/course/:id` | CourseDetailPage | Opened from a Home course (title or card) and its levels button. Unknown or removed id shows "Course not found" with a link to Home |
| `/course/:id/review` | Placeholder "Review" | "Review (R)" button |
| `/course/:id/speed-review` | Placeholder "Speed review" | Clock button and Home's "Speed review" action |
| `/course/:id/learn` | Placeholder "Learn new words" | Home action (unchanged) |
| `/course/:id/share` | Placeholder "Tweet" | Tweet button |
| `/course/:id/edit` | Placeholder "Edit Course" | Edit Course link |
| `/course/:id/leaderboard` | Placeholder "Leaderboard" | "More" link |
| `/course/:id/levels/:level` | Placeholder "Level N: name" | Level card |

All placeholders name the course, offer "Back to Home" and show the top app bar. The old
`/course/:id/levels` route is removed.

## Home changes

The course title on each card is a link to `/course/:id` stretched across the card. The primary
action button, levels button (now to `/course/:id`) and options menu stay independent controls
above it. The "Speed review" action goes to `/course/:id/speed-review`.

## Page layout

1. Top app bar with Courses highlighted.
2. Header band: breadcrumb, cover (large rounded square with the category symbol), h1 title,
   "Created by <name>" and a "Tweet" button.
3. Tab row: "Levels (N)" tab and, only for learner-created courses, an "Edit Course" link.
4. Two columns on wide screens (levels left, leaderboard right 20 rem), stacked on narrow
   screens with the leaderboard last.

## Progress summary card

| Element | Behavior |
|---------|----------|
| Text | "N / M words learned (L in long term memory)" and "K ignored" |
| Bar | `role="progressbar"`, value = `percentLearned`, empty at M = 0 |
| Options | M3 menu button "Options" with items "Set daily goal" and "Remove course" (reused from Home). Removing returns to `/` |
| Review | Button "Review (R)", `disabled` when R is 0, else goes to `/course/:id/review` |
| Clock | Icon button `aria-label="Speed review"`, `disabled` when R is 0, else `/course/:id/speed-review` |

## Level card

| State | Picture | Text | Extra |
|-------|---------|------|-------|
| completed | flower | level name | check mark |
| in progress | growing plant | level name, "X / Y learned" | none |
| not started | empty pot | level name, "Ready to learn" | none |

Each card shows its number. The card is a link to `/course/:id/levels/:level`, with an
accessible name like "Level 2, Second Level, completed". No levels: the empty message "This
course has no levels yet." replaces the grid and the tab reads "Levels (0)".

## Leaderboard panel

Heading "Leaderboard" with the tabs "Week" (selected first), "Month", "All Time" (`role="tablist"`,
Left/Right/Home/End keys, `role="tabpanel"`). Rows show rank, name, points (competition ranking),
ordered by points then name. The "You" row is highlighted and has `aria-current="true"`. A "More"
link goes to `/course/:id/leaderboard`.

## Accessibility

Tab order follows visual order: breadcrumb, Tweet, Levels tab, Edit Course, Options, Review,
clock, level cards, leaderboard tabs, rows (not focusable), More. Disabled buttons use the
native `disabled` attribute. Focus rings use the M3 focus token. Contrast meets WCAG 2.1 AA in
light and dark schemes.
