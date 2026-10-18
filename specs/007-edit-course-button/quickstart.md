# Quickstart: Validating the Edit Course Button

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

## Run

```bash
pnpm dev
```

## Scenarios

1. **Sample course (US1)**: Open "English Visual Dictionary". "Edit Course" with a pencil icon is
   at the right end of the tab row, level with "Levels (6)".
2. **Created course (US1)**: Create a course on `/courses/new` and open it: the link is shown too.
3. **Keyboard (US1)**: Tab from the Levels tab: the next stop is "Edit Course" with a visible
   focus ring. Press Enter: the placeholder opens.
4. **Phone width (US1)**: At 360 px the link is visible (beside or just below the tab), at least
   48 px high, and the page has no horizontal scroll.
5. **Placeholder (US2)**: Press the link: a page titled "Edit Course" naming the course opens.
   "Back to Home" and the browser back button return. Course title, progress and levels are
   unchanged.
6. **Double click**: Double-click the link, then press browser back once: you land on the course
   page, not on a second placeholder entry.
7. **Not found**: Open `/course/does-not-exist`: no link, only "Course not found".
8. **Dark scheme**: Label and icon are legible.

Contract: [ui-contract.md](./contracts/ui-contract.md).
