# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: speed-review.spec.ts >> plays a speed review game: points, lives, timer, game over, personal best and the answer log
- Location: tests/e2e/speed-review.spec.ts:66:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/question 3 of/)
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/question 3 of/) with timeout 5000ms
  - waiting for getByText(/question 3 of/)
  - Target page, context or browser has been closed

```

```yaml
- banner:
  - heading "Speed review · Speed course" [level=1]
  - button "Close"
- main:
  - img "1 life left"
  - text: 0 in a row · x1 0
  - timer "Time left"
  - paragraph: 6s · question 2 of 6
  - heading "Which word has this meaning?" [level=2]
  - paragraph: meaning of humid
  - status:
    - paragraph: Not quite. The right answer is highlighted.
  - group "Answers":
    - button "rhythm" [disabled]
    - button "humid" [disabled]
    - button "sink" [disabled]
    - button "wash" [disabled]
- status
```

# Test source

```ts
  41  |   const db = new Database(join(userData, "library", "membetter.db"));
  42  |   db.prepare("UPDATE cards SET due_at = '2020-01-01T00:00:00.000Z'").run();
  43  |   db.close();
  44  | };
  45  | 
  46  | const go = (page: Page, hash: string) => page.evaluate((h) => void (location.hash = h), hash);
  47  | const score = async (page: Page) => Number((await page.getByLabel("Score", { exact: true }).textContent())!.replace(/[^\d]/g, ""));
  48  | 
  49  | /** The prompt is "meaning of <word>": press the number of the option that shows that word. */
  50  | async function answerRight(page: Page) {
  51  |   const prompt = (await page.getByText(/^meaning of /).first().textContent())!;
  52  |   const wanted = prompt.replace("meaning of ", "");
  53  |   const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  54  |   const index = options.findIndex((t) => t.startsWith(wanted));
  55  |   expect(index).toBeGreaterThanOrEqual(0);
  56  |   await page.keyboard.press(String(index + 1));
  57  | }
  58  | async function answerWrong(page: Page) {
  59  |   const prompt = (await page.getByText(/^meaning of /).first().textContent())!;
  60  |   const wanted = prompt.replace("meaning of ", "");
  61  |   const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  62  |   const index = options.findIndex((t) => !t.startsWith(wanted));
  63  |   await page.keyboard.press(String(index + 1));
  64  | }
  65  | 
  66  | test("plays a speed review game: points, lives, timer, game over, personal best and the answer log", async () => {
  67  |   const first = await launch();
  68  |   await learned(first.page, "custom-sp", NAMES);
  69  |   await first.close();
  70  |   makeDue(first.userData);
  71  | 
  72  |   const app = await launch(first.userData);
  73  |   const { page } = app;
  74  |   let finalScore: number;
  75  |   try {
  76  |     await go(page, "#/course/custom-sp/speed-review");
  77  |     // The game screen: lives, score, streak and multiplier, time bar, question and options.
  78  |     await expect(page.getByRole("heading", { name: /Speed review/ })).toBeVisible();
  79  |     await expect(page.getByRole("img", { name: "3 lives left" })).toBeVisible();
  80  |     await expect(page.getByLabel("Streak 0, multiplier 1")).toBeVisible();
  81  |     await expect(page.getByRole("timer", { name: "Time left" })).toBeVisible();
  82  |     await expect(page.getByRole("heading", { name: "Which word has this meaning?" })).toBeVisible();
  83  |     await expect(page.getByRole("group", { name: "Answers" }).getByRole("button")).toHaveCount(4);
  84  |     await expect(page.getByText(/question 1 of 6/)).toBeVisible();
  85  | 
  86  |     // Right answer: points between 100 and 150 (speed bonus) at x1, streak 1.
  87  |     await answerRight(page);
  88  |     await expect(page.getByText(/Correct! \+\d+ points/)).toBeVisible();
  89  |     const afterFirst = await score(page);
  90  |     expect(afterFirst).toBeGreaterThanOrEqual(100);
  91  |     expect(afterFirst).toBeLessThanOrEqual(150);
  92  |     await expect(page.getByLabel("Streak 1, multiplier 1")).toBeVisible();
  93  | 
  94  |     // Wrong answer: a life is lost, the streak starts again, the right option is shown.
  95  |     await expect(page.getByText(/question 2 of 6/)).toBeVisible();
  96  |     await answerWrong(page);
  97  |     await expect(page.getByText(/Not quite/)).toBeVisible();
  98  |     await expect(page.getByRole("img", { name: "2 lives left" })).toBeVisible();
  99  |     await expect(page.getByLabel("Streak 0, multiplier 1")).toBeVisible();
  100 |     expect(await score(page)).toBe(afterFirst);
  101 | 
  102 |     // No answer: the red tint grows and, when the time is up, a life is lost.
  103 |     await expect(page.getByText(/question 3 of 6/)).toBeVisible();
  104 |     await page.waitForTimeout(3500);
  105 |     expect(Number(await page.getByTestId("red-tint").evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.05);
  106 |     await expect(page.getByText("Time's up!")).toBeVisible({ timeout: 10_000 });
  107 |     await expect(page.getByRole("img", { name: "1 life left" })).toBeVisible();
  108 | 
  109 |     // The last life: game over.
  110 |     await expect(page.getByText(/question 4 of 6/)).toBeVisible();
  111 |     await answerWrong(page);
  112 |     await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
  113 |     finalScore = afterFirst;
  114 |     await expect(page.getByLabel("Score")).toContainText(`${afterFirst.toLocaleString()} points`);
  115 |     await expect(page.getByText("New personal best!")).toBeVisible();
  116 |     await expect(page.getByRole("region", { name: "Missed words" }).getByRole("listitem")).toHaveCount(3);
  117 |     await expect(page.getByRole("region", { name: "Missed words" })).toContainText("too slow");
  118 |     await expect(page.getByText("Longest streak").locator("..")).toContainText("1");
  119 |     await expect(page.getByText("Accuracy").locator("..")).toContainText("25%");
  120 |   } finally {
  121 |     await app.close();
  122 |   }
  123 | 
  124 |   const db = new Database(join(first.userData, "library", "membetter.db"), { readonly: true });
  125 |   const rows = db.prepare("SELECT exercise, result, points FROM review_log WHERE session_id IN (SELECT id FROM sessions WHERE kind = 'speed') ORDER BY id").all() as { exercise: string; result: string; points: number }[];
  126 |   expect(rows.map((r) => r.result)).toEqual(["correct", "gave_up", "timeout", "gave_up"]);
  127 |   expect(rows.every((r) => r.exercise === "meaning-to-word")).toBe(true);
  128 |   expect(rows.reduce((sum, r) => sum + r.points, 0)).toBe(finalScore); // the score equals the points in the log
  129 |   expect(db.prepare("SELECT status, points_total FROM sessions WHERE kind = 'speed'").all()).toEqual([{ status: "completed", points_total: finalScore }]);
  130 |   expect(db.prepare("SELECT value FROM settings WHERE key = 'speed.best.custom-sp'").get()).toEqual({ value: String(finalScore) });
  131 |   db.close();
  132 | 
  133 |   // After a restart the best score is still known and a lower score is not a new best (time passes: the words are due again).
  134 |   makeDue(first.userData);
  135 |   const again = await launch(first.userData);
  136 |   try {
  137 |     await go(again.page, "#/course/custom-sp/speed-review");
  138 |     await expect(again.page.getByRole("heading", { name: "Which word has this meaning?" })).toBeVisible();
  139 |     for (let i = 0; i < 3; i += 1) {
  140 |       await answerWrong(again.page);
> 141 |       if (i < 2) await expect(again.page.getByText(new RegExp(`question ${i + 2} of`))).toBeVisible();
      |                                                                                         ^ Error: expect(locator).toBeVisible() failed
  142 |     }
  143 |     await expect(again.page.getByRole("heading", { name: "Game over" })).toBeVisible();
  144 |     await expect(again.page.getByText(`Your best on this course: ${finalScore.toLocaleString()} points`)).toBeVisible();
  145 |     await expect(again.page.getByText("New personal best!")).toHaveCount(0);
  146 |     // The next game starts with fresh lives and the words that are due now.
  147 |     await again.page.getByRole("button", { name: "Play again" }).click();
  148 |     await expect(again.page.getByRole("img", { name: "3 lives left" })).toBeVisible();
  149 |   } finally {
  150 |     await again.close();
  151 |     cleanup(first.userData);
  152 |   }
  153 | });
  154 | 
  155 | test("a streak earns a higher multiplier, and closing asks first", async () => {
  156 |   const first = await launch();
  157 |   await learned(first.page, "custom-st", NAMES);
  158 |   await first.close();
  159 |   makeDue(first.userData);
  160 |   const app = await launch(first.userData);
  161 |   const { page } = app;
  162 |   try {
  163 |     await go(page, "#/course/custom-st/speed-review");
  164 |     for (let i = 0; i < 5; i += 1) {
  165 |       await expect(page.getByText(new RegExp(`question ${i + 1} of`))).toBeVisible();
  166 |       await answerRight(page);
  167 |       await expect(page.getByText(/Correct!/)).toBeVisible();
  168 |     }
  169 |     // Five right answers in a row: the sixth question is worth double.
  170 |     await expect(page.getByLabel("Streak 5, multiplier 2")).toBeVisible();
  171 |     await expect(page.getByText(/question 6 of 6/)).toBeVisible();
  172 |     await page.keyboard.press("Escape");
  173 |     await expect(page.getByRole("heading", { name: "End this session?" })).toBeVisible();
  174 |     await page.getByRole("button", { name: "Continue" }).click();
  175 |     await page.getByRole("button", { name: "Close" }).click();
  176 |     await page.getByRole("button", { name: "End session" }).click();
  177 |     await expect(page).toHaveURL(/#\/course\/custom-st$/);
  178 |   } finally {
  179 |     await app.close();
  180 |   }
  181 |   const db = new Database(join(first.userData, "library", "membetter.db"), { readonly: true });
  182 |   expect(db.prepare("SELECT COUNT(*) AS n FROM review_log WHERE session_id IN (SELECT id FROM sessions WHERE kind = 'speed')").get()).toEqual({ n: 5 });
  183 |   expect(db.prepare("SELECT status FROM sessions WHERE kind = 'speed'").all()).toEqual([{ status: "completed" }]);
  184 |   db.close();
  185 |   cleanup(first.userData);
  186 | });
  187 | 
  188 | test("explains when there is nothing due or too few words for a choice game", async () => {
  189 |   const none = await launch();
  190 |   try {
  191 |     await none.page.evaluate(async () => {
  192 |       const api = (window as unknown as { api: Api }).api;
  193 |       await api.library.apply({ type: "upsertCourse", course: { id: "custom-no", title: "No cards", categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0 } });
  194 |     });
  195 |     await none.page.reload();
  196 |     await go(none.page, "#/course/custom-no/speed-review");
  197 |     await expect(none.page.getByRole("heading", { name: "Nothing to review yet" })).toBeVisible();
  198 |   } finally {
  199 |     await none.close();
  200 |     cleanup(none.userData);
  201 |   }
  202 | 
  203 |   const small = await launch();
  204 |   await learned(small.page, "custom-sm", ["one", "two", "three"]);
  205 |   await small.close();
  206 |   makeDue(small.userData);
  207 |   const again = await launch(small.userData);
  208 |   try {
  209 |     await go(again.page, "#/course/custom-sm/speed-review");
  210 |     await expect(again.page.getByRole("heading", { name: "Speed review needs more words" })).toBeVisible();
  211 |   } finally {
  212 |     await again.close();
  213 |     cleanup(small.userData);
  214 |   }
  215 | });
  216 | 
  217 | 
  218 | // ---- Rounds on the sample library (pictures and recordings) ----------------------------------------------------
  219 | 
  220 | const MEANING_TO_WORD = new Map(sampleCourses.find((c) => c.id === SAMPLER)!.levels.flatMap((l) => l.words).map((w) => [w.meaning, w.text]));
  221 | 
  222 | /** Imports the samples, learns the sampler course once and makes its words due; returns the data folder with the app closed. */
  223 | async function dueSampler(): Promise<string> {
  224 |   const first = await launch();
  225 |   await importSamples(first);
  226 |   await learnAll(first.page, SAMPLER);
  227 |   await first.close();
  228 |   dueAll(first.userData);
  229 |   return first.userData;
  230 | }
  231 | 
  232 | /** Answers a meaning-to-word question by pressing the number of the right option (or of a wrong one). */
  233 | async function answerSample(page: Page, right: boolean) {
  234 |   const shown = [...MEANING_TO_WORD.keys()];
  235 |   let word = "";
  236 |   for (const meaning of shown) {
  237 |     if ((await page.getByText(meaning, { exact: true }).count()) > 0) word = MEANING_TO_WORD.get(meaning)!;
  238 |   }
  239 |   expect(word).not.toBe("");
  240 |   const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  241 |   const index = options.findIndex((t) => (right ? t.startsWith(word) : !t.startsWith(word)));
```