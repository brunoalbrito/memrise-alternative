# Quickstart: Validating the Create Course Button

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

## Scenarios

1. **Visible (US1)**: Open Home. "Create a course" is visible in the header row without
   scrolling, at desktop width and at 360 px width.
2. **Always visible (US1)**: Pick a filter that matches nothing (for example Teaching after
   removing teaching courses): the button remains. Remove all courses: the button remains next
   to the empty state.
3. **Keyboard (US1)**: Tab to the button (visible focus ring), press Enter, then repeat with
   Space: the placeholder opens each time.
4. **Placeholder (US2)**: The page is titled "Create a course" and says it is coming soon.
   "Back to Home" returns to Home with the same courses. Browser back also returns to Home.
5. **No data change (US2)**: Course list, goals and removed courses are identical before and
   after visiting the placeholder.
6. **Double click**: Double-click the button, then press browser back once: you land on Home,
   not on a second placeholder entry.
7. **Dark scheme**: Switch the OS to dark mode and confirm the label contrast is readable.

Contract: [ui-contract.md](./contracts/ui-contract.md).
