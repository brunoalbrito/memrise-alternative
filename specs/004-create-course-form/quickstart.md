# Quickstart: Validating the Create Course Form

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

1. **Open (US1)**: On Home press "Create a course". The "Create a Course" page shows all six
   fields, the "Create Course" button and the side panel. Name has focus.
2. **Create (US1)**: Enter Name "My Spanish Verbs" and choose Teaching "Spanish (Mexico)". Press
   Create Course. Home opens with the new card: name, 0%, "0 / 0 items learned", "Learn new
   words". Reload: it is still there.
3. **Filters (US1)**: On Home, filter "Teaching": the new course is listed. Open the filter menu:
   "Spanish (Mexico)" appears under By Category and lists the new course.
4. **Remove (US1)**: Remove the new course from its options menu: it disappears and does not
   come back after "Restore sample courses" or reload.
5. **Placeholders (US1)**: Press "Learn new words" and the levels button on the new course: the
   placeholders name the new course.
6. **Validation (US2)**: Submit the empty form: errors under Name and Teaching, nothing created,
   focus on Name. Enter "  " in Name: still rejected. Enter 101 characters: "too long" message.
   Fix the fields: errors clear as you type and the course is created.
7. **Optional limits (US2)**: Tags with 11 entries, a 31-character tag, a 101-character Short
   description and a 2001-character Description are each rejected with their message.
8. **Tags parsing**: Enter `  Spanish, spanish , ,verbs ` and create. The course is created
   (tags stored as Spanish, verbs).
9. **Double submit**: Double-click Create Course: Home shows exactly one new course.
10. **Hints and labels (US3)**: Every hint text is visible. With a screen reader or the
    accessibility tree, each field exposes its label, hint and error.
11. **Side panel (US4)**: At desktop width the panel is beside the form; at 360 px it is below
    with no horizontal scroll. The knowledge-base link opens a placeholder with a way back.
12. **Leave without saving**: Fill the form, press the browser back button: no course is created.
13. **Dark scheme**: Switch the OS to dark mode and confirm fields, errors and the button are
    legible.

Contract: [ui-contract.md](./contracts/ui-contract.md). Data: [data-model.md](./data-model.md).
