# Quickstart: Validating the Course Home Dashboard

## Prerequisites

- Node >= 22.22 and pnpm. Run `pnpm install`.

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

## Run

```bash
pnpm dev
```

Open the printed local URL.

## Scenarios

1. **Course list (US1)**: Home lists all sample courses with title, percent, "N / M items
   learned" and a progress bar. A course with 0 learned shows 0% and an empty bar.
2. **Primary action (US2)**: A course with due items shows "Speed review"; one without shows
   "Learn new words". Pressing either opens a "coming soon" page naming the course and session,
   with a Back to Home link. Progress is unchanged on return.
3. **Stats (US3)**: Goal ring, learned and due counts show; zero values are dimmed.
4. **Filter (US4)**: Open the menu. "With Goal Set" and "Teaching" narrow the list; a category
   narrows to that category; heading and `?filter=` update; picking another option replaces the
   previous filter; "All Courses" restores the list. A filter with no match shows the
   clear-filter state.
5. **Options (US5)**: Set a goal of 10 on a course: ring appears, course shows under "With Goal
   Set". Reload the page: goal persists. Remove a course and confirm: it disappears, also after
   reload. Remove all courses: "Restore sample courses" brings them back. Levels button opens a
   placeholder.
6. **Navigation (US6)**: Home is highlighted. Courses, Groups and the profile button open
   placeholders. Visiting `/course/unknown/levels` shows a not-found message.
7. **Accessibility and responsive**: Tab through the page, open menus with Enter and use arrow
   keys and Escape. Resize to phone width: no horizontal scroll. Toggle OS dark mode: dark
   scheme applies.

Contracts: [ui-contract.md](./contracts/ui-contract.md). Data: [data-model.md](./data-model.md).
