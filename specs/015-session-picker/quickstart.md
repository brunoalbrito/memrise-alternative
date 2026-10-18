# Quickstart: Validating the Session Picker

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

## Run

```bash
pnpm dev
```

## Scenarios

1. **Open (US1)**: On Home press the grid button of "English Visual Dictionary": a dialog opens with its name, a large
   "Classic review" button, and "Learn new words", "Classic review" (badge 3) and "Speed review".
2. **No due words (US1)**: Open the dialog on "Learn English Irregular Verbs": the large button reads "Learn new
   words", Classic review and Speed review are disabled and there is no badge.
3. **99+ badge (US1)**: (Optional) With a course that has 99 or more words due the badge reads "99+".
4. **Choose (US1)**: Press the large button, then reopen and press each round button: each closes the dialog and opens
   its placeholder for that course ("Classic review", "Learn new words", "Speed review" titles).
5. **Close (US2)**: Close with the X, with Escape and by clicking outside: Home is unchanged and focus returns to the
   grid button.
6. **Empty course (US1)**: Open the dialog on a newly created course (no words): "Learn new words" is enabled, the review
   sessions are disabled.
7. **Course page**: Click the course title: the course page still opens. On the course page "Review (N)" opens the
   "Classic review" placeholder.
8. **Responsive and a11y**: At 360 px the dialog fits and the round buttons wrap if needed. Tab stays inside the dialog.
   A screen reader reads the title, "Choose a session" on the button, and "N words due" on Classic review.
