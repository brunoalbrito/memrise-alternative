# Quickstart: Validating the Course Detail View

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

1. **Open (US1)**: On Home click the title of "English Visual Dictionary", then go back and click
   an empty part of another card, then press the levels button on a third. Each opens
   `/course/<id>` for that course. Buttons and the options menu on a card still do their own
   action and do not open the page.
2. **Header (US1)**: Title, breadcrumb "Courses > Languages > English", cover symbol, "Created by"
   and "Tweet". "Created by" shows the sample creator for samples. Create a course on `/courses/new`,
   open it: "Created by You". Breadcrumb "Courses" opens a placeholder. Tweet opens its
   placeholder naming the course.
3. **Unknown and removed (US1)**: Open `/course/does-not-exist`: "Course not found" with a link to
   Home. Remove a sample course, then open its old URL: "Course not found".
4. **Summary (US2)**: "English Visual Dictionary" shows "159 / 2363 words learned (N in long term
   memory)", an ignored count and a bar at 6%. Counts equal the Home card's 159 / 2363.
5. **Review (US2)**: With words due, "Review (26)" is enabled and opens its placeholder, the clock
   opens the speed-review placeholder. On a course with 0 due, both are disabled.
6. **Options (US2)**: Set a daily goal 10, go Home: goal ring and "With Goal Set" reflect it. On
   the page choose Remove course and confirm: you land on Home and the course is gone.
7. **Zero words (US2/US3)**: Open a newly created course: "0 / 0 words learned", empty bar, "Levels
   (0)", "This course has no levels yet.", Review disabled.
8. **Levels (US3)**: Open "Japanese Hiragana Starter" (fully learned): all cards show a flower and
   check. Open "English Visual Dictionary": first levels show growing or completed plants with
   "X / Y learned", later levels show "Ready to learn". The tab count equals the number of cards.
   Sum of the cards' words equals the course total.
9. **Level placeholder (US3)**: Press a level card with mouse and with Enter: the placeholder names
   the course and the level.
10. **Leaderboard (US4)**: Week is selected with at least 4 rows including a highlighted "You".
    Press Month, All Time: order and points change. Use Left/Right on the tabs. "More" opens its
    placeholder. Equal points share a rank.
11. **Edit Course (US5)**: Shown on a learner-created course, hidden on a sample, and opens its
    placeholder.
12. **Responsive and a11y**: At 360 px everything stacks, leaderboard last, no horizontal scroll.
    Tab through the whole page, focus is visible. Dark mode keeps text legible.

Contract: [ui-contract.md](./contracts/ui-contract.md). Data: [data-model.md](./data-model.md).
