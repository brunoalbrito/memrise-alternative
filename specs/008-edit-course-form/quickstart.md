# Quickstart: Validating the Edit Course Form

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

1. **Open (US1)**: Open "English Visual Dictionary" and press "Edit Course". A page titled "Edit
   Course" opens with all six fields filled (Teaching English (UK), For English (UK)), the help
   panel, and focus on Name.
2. **Save (US1)**: Change the name to "My Dictionary" and press "Save Changes": the course page
   shows "My Dictionary" with the same progress, levels and creator. Home shows the new name.
   Reload: still there.
3. **Category (US1)**: Edit the same course, change Teaching to "Japanese", save. On Home the
   course appears under the "Japanese" language category filter. Edit another course without
   changing Teaching: its category stays as before.
4. **Created course (US1)**: Create a course on `/courses/new` with tags "a, b" and a
   description, open it and press "Edit Course": tags show as `a, b` and the description is
   filled. Change tags to `x,  y, X`, save, edit again: tags show `x, y`.
5. **Validation (US2)**: Clear Name and save: "Enter a name for your course." beside Name, focus
   on Name, nothing saved. Try 101 characters in Name, 11 tags, a 31-character tag, a 101-character
   Short description and a 2001-character Description: each is rejected with its message.
6. **Leave (US3)**: Change a field and press "Back to course": the course page shows the old
   values. Repeat with the browser back button.
7. **Not found (US3)**: Open `/course/does-not-exist/edit`: "Course not found" with a link to
   Home.
8. **Double save**: Double-click "Save Changes", then press browser back once: you land on the
   course page, not on a second edit page.
9. **No changes**: Open the edit page and save without changes: succeeds and returns to the
   course page.
10. **Responsive and a11y**: At 360 px the form and panel stack with no horizontal scroll. Tab
    through every control with visible focus. Dark mode keeps text legible.

Contract: [ui-contract.md](./contracts/ui-contract.md). Data: [data-model.md](./data-model.md).
