# Research: Memrise Speed Review

Searched on 2026-10-18. Sources: Memrise's [October 2021 product roundup](https://memrise.com/blog/product-news-oct21), reviews by
[FluentU](https://www.fluentu.com/blog/reviews/memrise-review/), [Ling](https://ling-app.com/tips/memrise-review/) and
[Actual Fluency](https://actualfluency.com/memrise-review), and the [Memrise+ browser extension](https://chrome.google.com/webstore/detail/memrise+/hmpiegnknhdokbhnifbpgbbfkeddbdfh)
page. Official rules are not published in detail; the facts below are what the sources agree on, and everything else is marked as a design choice.

## What the sources say
- Speed Review is a timed practice of words that need to be reviewed, like classic review but against the clock. It is offered when there are many words due (about 30 to 40).
- Each question has a time limit; the screen fades to red as the clock ticks on.
- The time depends on the length of the phrase: 6 seconds by default and 7 to 8 seconds for longer phrases.
- The faster you choose the correct answer, the higher the score.
- Answers are chosen from several options (a multiple-choice game), you have lives, and 15 correct answers in a row earn an extra life.

## Design choices made here (not documented by Memrise)
- Three lives at the start, at most five; a wrong answer or a timeout costs a life and ends the streak.
- Score: 100 points per correct answer plus up to 50 for speed, times a multiplier that grows by one for every five correct answers in a row (up to times five).
- A personal best score is remembered for each course, and the end screen lists the words that were missed.
- Answers still feed the spaced-repetition schedule: correct and fast is rated Easy, correct Good, wrong or too slow Again.
