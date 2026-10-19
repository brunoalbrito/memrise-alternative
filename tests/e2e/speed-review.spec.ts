import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { sampleCourses } from "../../scripts/sample-data";
import { cleanup, launch } from "./launch";
import { go as goTo, importSamples, learnAll, makeDue as dueAll, only, reviewLog, SAMPLER } from "./fixtures/sample-library";

type Api = {
  library: { apply(c: unknown): Promise<unknown> };
  study: {
    setExerciseSettings(k: string[]): Promise<unknown>;
    startSession(c: string, k: string, n: number): Promise<{ data: string }>;
    answer(s: string, o: unknown): Promise<unknown>;
    endSession(s: string, st: string): Promise<unknown>;
  };
};

const NAMES = ["sink", "wash", "hamper", "rhythm", "humid", "ladder"];

/** A course whose words were all learned once (so they have cards that can be made due). */
async function learned(page: Page, id: string, words: string[]) {
  await page.evaluate(
    async ({ id, words }) => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({ type: "upsertCourse", course: { id, title: "Speed course", categoryId: "lang-en-gb", teaching: true, totalItems: words.length, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" } });
      await api.library.apply({
        type: "saveLevels",
        courseId: id,
        levels: [{ id: "l1", name: "L", tested: "t", words: words.map((t) => ({ id: `${id}-${t}`, text: t, meaning: `meaning of ${t}`, example: "", images: [], audio: [], learned: false })) }],
      });
      await api.study.setExerciseSettings(["meaning-to-word"]);
      const session = (await api.study.startSession(id, "learn", words.length)).data;
      for (const t of words) await api.study.answer(session, { wordId: `${id}-${t}`, result: "correct", hintsUsed: 0, attempts: 0, elapsedMs: 4000, points: 10, exercise: "type" });
      await api.study.endSession(session, "completed");
    },
    { id, words },
  );
}

const makeDue = (userData: string) => {
  const db = new Database(join(userData, "library", "membetter.db"));
  db.prepare("UPDATE cards SET due_at = '2020-01-01T00:00:00.000Z'").run();
  db.close();
};

const go = (page: Page, hash: string) => page.evaluate((h) => void (location.hash = h), hash);
const score = async (page: Page) => Number((await page.getByLabel("Score", { exact: true }).textContent())!.replace(/[^\d]/g, ""));

/** The prompt is "meaning of <word>": press the number of the option that shows that word. */
async function answerRight(page: Page) {
  const prompt = (await page.getByText(/^meaning of /).first().textContent())!;
  const wanted = prompt.replace("meaning of ", "");
  const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  const index = options.findIndex((t) => t.startsWith(wanted));
  expect(index).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(index + 1));
}
async function answerWrong(page: Page) {
  const prompt = (await page.getByText(/^meaning of /).first().textContent())!;
  const wanted = prompt.replace("meaning of ", "");
  const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  const index = options.findIndex((t) => !t.startsWith(wanted));
  await page.keyboard.press(String(index + 1));
}

test("plays a speed review game: points, lives, timer, game over, personal best and the answer log", async () => {
  const first = await launch();
  await learned(first.page, "custom-sp", NAMES);
  await first.close();
  makeDue(first.userData);

  const app = await launch(first.userData);
  const { page } = app;
  let finalScore: number;
  try {
    await go(page, "#/course/custom-sp/speed-review");
    // The game screen: lives, score, streak and multiplier, time bar, question and options.
    await expect(page.getByRole("heading", { name: /Speed review/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "3 lives left" })).toBeVisible();
    await expect(page.getByLabel("Streak 0, multiplier 1")).toBeVisible();
    await expect(page.getByRole("timer", { name: "Time left" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Which word has this meaning?" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Answers" }).getByRole("button")).toHaveCount(4);
    await expect(page.getByText(/question 1 of 6/)).toBeVisible();

    // Right answer: points between 100 and 150 (speed bonus) at x1, streak 1.
    await answerRight(page);
    await expect(page.getByText(/Correct! \+\d+ points/)).toBeVisible();
    const afterFirst = await score(page);
    expect(afterFirst).toBeGreaterThanOrEqual(100);
    expect(afterFirst).toBeLessThanOrEqual(150);
    await expect(page.getByLabel("Streak 1, multiplier 1")).toBeVisible();

    // Wrong answer: a life is lost, the streak starts again, the right option is shown.
    await expect(page.getByText(/question 2 of 6/)).toBeVisible();
    await answerWrong(page);
    await expect(page.getByText(/Not quite/)).toBeVisible();
    await expect(page.getByRole("img", { name: "2 lives left" })).toBeVisible();
    await expect(page.getByLabel("Streak 0, multiplier 1")).toBeVisible();
    expect(await score(page)).toBe(afterFirst);

    // No answer: the red tint grows and, when the time is up, a life is lost.
    await expect(page.getByText(/question 3 of 6/)).toBeVisible();
    await page.waitForTimeout(3500);
    expect(Number(await page.getByTestId("red-tint").evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.05);
    await expect(page.getByText("Time's up!")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("img", { name: "1 life left" })).toBeVisible();

    // The last life: game over.
    await expect(page.getByText(/question 4 of 6/)).toBeVisible();
    await answerWrong(page);
    await expect(page.getByRole("heading", { name: "Game over" })).toBeVisible();
    finalScore = afterFirst;
    await expect(page.getByLabel("Score")).toContainText(`${afterFirst.toLocaleString()} points`);
    await expect(page.getByText("New personal best!")).toBeVisible();
    await expect(page.getByRole("region", { name: "Missed words" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("region", { name: "Missed words" })).toContainText("too slow");
    await expect(page.getByText("Longest streak").locator("..")).toContainText("1");
    await expect(page.getByText("Accuracy").locator("..")).toContainText("25%");
  } finally {
    await app.close();
  }

  const db = new Database(join(first.userData, "library", "membetter.db"), { readonly: true });
  const rows = db.prepare("SELECT exercise, result, points FROM review_log WHERE session_id IN (SELECT id FROM sessions WHERE kind = 'speed') ORDER BY id").all() as { exercise: string; result: string; points: number }[];
  expect(rows.map((r) => r.result)).toEqual(["correct", "gave_up", "timeout", "gave_up"]);
  expect(rows.every((r) => r.exercise === "meaning-to-word")).toBe(true);
  expect(rows.reduce((sum, r) => sum + r.points, 0)).toBe(finalScore); // the score equals the points in the log
  expect(db.prepare("SELECT status, points_total FROM sessions WHERE kind = 'speed'").all()).toEqual([{ status: "completed", points_total: finalScore }]);
  expect(db.prepare("SELECT value FROM settings WHERE key = 'speed.best.custom-sp'").get()).toEqual({ value: String(finalScore) });
  db.close();

  // After a restart the best score is still known and a lower score is not a new best (time passes: the words are due again).
  makeDue(first.userData);
  const again = await launch(first.userData);
  try {
    await go(again.page, "#/course/custom-sp/speed-review");
    await expect(again.page.getByRole("heading", { name: "Which word has this meaning?" })).toBeVisible();
    for (let i = 0; i < 3; i += 1) {
      await answerWrong(again.page);
      if (i < 2) await expect(again.page.getByText(new RegExp(`question ${i + 2} of`))).toBeVisible();
    }
    await expect(again.page.getByRole("heading", { name: "Game over" })).toBeVisible();
    await expect(again.page.getByText(`Your best on this course: ${finalScore.toLocaleString()} points`)).toBeVisible();
    await expect(again.page.getByText("New personal best!")).toHaveCount(0);
    // The next game starts with fresh lives and the words that are due now.
    await again.page.getByRole("button", { name: "Play again" }).click();
    await expect(again.page.getByRole("img", { name: "3 lives left" })).toBeVisible();
  } finally {
    await again.close();
    cleanup(first.userData);
  }
});

test("a streak earns a higher multiplier, and closing asks first", async () => {
  const first = await launch();
  await learned(first.page, "custom-st", NAMES);
  await first.close();
  makeDue(first.userData);
  const app = await launch(first.userData);
  const { page } = app;
  try {
    await go(page, "#/course/custom-st/speed-review");
    for (let i = 0; i < 5; i += 1) {
      await expect(page.getByText(new RegExp(`question ${i + 1} of`))).toBeVisible();
      await answerRight(page);
      await expect(page.getByText(/Correct!/)).toBeVisible();
    }
    // Five right answers in a row: the sixth question is worth double.
    await expect(page.getByLabel("Streak 5, multiplier 2")).toBeVisible();
    await expect(page.getByText(/question 6 of 6/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "End this session?" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: "End session" }).click();
    await expect(page).toHaveURL(/#\/course\/custom-st$/);
  } finally {
    await app.close();
  }
  const db = new Database(join(first.userData, "library", "membetter.db"), { readonly: true });
  expect(db.prepare("SELECT COUNT(*) AS n FROM review_log WHERE session_id IN (SELECT id FROM sessions WHERE kind = 'speed')").get()).toEqual({ n: 5 });
  expect(db.prepare("SELECT status FROM sessions WHERE kind = 'speed'").all()).toEqual([{ status: "completed" }]);
  db.close();
  cleanup(first.userData);
});

test("explains when there is nothing due or too few words for a choice game", async () => {
  const none = await launch();
  try {
    await none.page.evaluate(async () => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({ type: "upsertCourse", course: { id: "custom-no", title: "No cards", categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0 } });
    });
    await none.page.reload();
    await go(none.page, "#/course/custom-no/speed-review");
    await expect(none.page.getByRole("heading", { name: "Nothing to review yet" })).toBeVisible();
  } finally {
    await none.close();
    cleanup(none.userData);
  }

  const small = await launch();
  await learned(small.page, "custom-sm", ["one", "two", "three"]);
  await small.close();
  makeDue(small.userData);
  const again = await launch(small.userData);
  try {
    await go(again.page, "#/course/custom-sm/speed-review");
    await expect(again.page.getByRole("heading", { name: "Speed review needs more words" })).toBeVisible();
  } finally {
    await again.close();
    cleanup(small.userData);
  }
});


// ---- Rounds on the sample library (pictures and recordings) ----------------------------------------------------

const MEANING_TO_WORD = new Map(sampleCourses.find((c) => c.id === SAMPLER)!.levels.flatMap((l) => l.words).map((w) => [w.meaning, w.text]));

/** Imports the samples, learns the sampler course once and makes its words due; returns the data folder with the app closed. */
async function dueSampler(): Promise<string> {
  const first = await launch();
  await importSamples(first);
  await learnAll(first.page, SAMPLER);
  await first.close();
  dueAll(first.userData);
  return first.userData;
}

/** Answers a meaning-to-word question by pressing the number of the right option (or of a wrong one). */
async function answerSample(page: Page, right: boolean) {
  const shown = [...MEANING_TO_WORD.keys()];
  let word = "";
  for (const meaning of shown) {
    if ((await page.getByText(meaning, { exact: true }).count()) > 0) word = MEANING_TO_WORD.get(meaning)!;
  }
  expect(word).not.toBe("");
  const options = await page.getByRole("group", { name: "Answers" }).getByRole("button").allTextContents();
  const index = options.findIndex((t) => (right ? t.startsWith(word) : !t.startsWith(word)));
  await page.keyboard.press(String(index + 1));
}

test("speed review asks picture, recording and text questions made from the sample words", async () => {
  const userData = await dueSampler();
  const app = await launch(userData);
  const { page } = app;
  const kinds: [string, () => Promise<void>][] = [
    ["image-to-word", async () => expect(page.getByRole("img", { name: "Picture clue" })).toBeVisible()],
    ["word-to-image", async () => expect(page.getByRole("group", { name: "Answers" }).locator("img")).toHaveCount(4)],
    ["audio-to-word", async () => expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible()],
    ["word-to-audio", async () => expect(page.getByRole("button", { name: /^Play recording/ })).toHaveCount(4)],
    ["word-to-meaning", async () => expect(page.getByRole("heading", { name: "What does this word mean?" })).toBeVisible()],
  ];
  try {
    for (const [kind, check] of kinds) {
      await only(page, [kind]);
      await page.reload();
      await goTo(page, `#/course/${SAMPLER}/speed-review`);
      await expect(page.getByRole("heading", { name: /Speed review/ })).toBeVisible();
      await expect(page.getByRole("img", { name: "3 lives left" })).toBeVisible();
      await check();
      await page.keyboard.press("1");
      await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "End session" }).click();
    }
  } finally {
    await app.close();
  }
  const log = reviewLog(userData, "speed");
  expect(log.map((r) => r.exercise)).toEqual(kinds.map(([k]) => k));
  expect(log.every((r) => ["correct", "gave_up"].includes(r.result))).toBe(true);
  cleanup(userData);
});

test("a whole round with the keyboard only: streak, multiplier, a score equal to the log and a saved best", async () => {
  const userData = await dueSampler();
  const app = await launch(userData);
  const { page } = app;
  try {
    await only(page, ["meaning-to-word"]);
    await page.reload();
    await goTo(page, `#/course/${SAMPLER}/speed-review`);
    await expect(page.getByText(/question 1 of 12/)).toBeVisible();
    for (let i = 0; i < 12; i += 1) {
      await expect(page.getByText(new RegExp(`question ${i + 1} of 12`))).toBeVisible();
      if (i === 5) await expect(page.getByLabel("Streak 5, multiplier 2")).toBeVisible();
      await answerSample(page, true);
      if (i < 11) await expect(page.getByText(/Correct! \+\d+ points/)).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Round complete" })).toBeVisible();
    await expect(page.getByText("New personal best!")).toBeVisible();
    await expect(page.getByText("Longest streak").locator("..")).toContainText("12");
    await expect(page.getByText("Accuracy").locator("..")).toContainText("100%");
    await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
  } finally {
    await app.close();
  }
  const log = reviewLog(userData, "speed");
  expect(log).toHaveLength(12);
  expect(log.every((r) => r.result === "correct")).toBe(true);
  const total = log.reduce((sum, r) => sum + r.points, 0);
  expect(total).toBeGreaterThanOrEqual(12 * 100);
  const db = new Database(join(userData, "library", "membetter.db"), { readonly: true });
  expect(db.prepare("SELECT value FROM settings WHERE key = ?").get(`speed.best.${SAMPLER}`)).toEqual({ value: String(total) });
  expect(db.prepare("SELECT status, points_total FROM sessions WHERE kind = 'speed'").all()).toEqual([{ status: "completed", points_total: total }]);
  db.close();
  cleanup(userData);
});

test("with reduced motion the red tint changes in coarse steps, otherwise it fades smoothly", async () => {
  const userData = await dueSampler();
  const app = await launch(userData);
  const { page } = app;
  const sample = async () => {
    const seen: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      seen.push(Number(await page.getByTestId("red-tint").evaluate((e) => getComputedStyle(e).opacity)));
      await page.waitForTimeout(350);
    }
    return seen;
  };
  const stepped = (n: number) => Math.abs(n * 5 - Math.round(n * 5)) < 0.001;
  try {
    await only(page, ["meaning-to-word"]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await goTo(page, `#/course/${SAMPLER}/speed-review`);
    await expect(page.getByTestId("red-tint")).toBeAttached();
    const reduced = await sample();
    expect(reduced.every(stepped)).toBe(true);
    expect(Math.max(...reduced)).toBeGreaterThan(0);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await goTo(page, `#/course/${SAMPLER}/speed-review`);
    await expect(page.getByTestId("red-tint")).toBeAttached();
    expect((await sample()).some((n) => !stepped(n))).toBe(true);
  } finally {
    await app.close();
    cleanup(userData);
  }
});

const SHOWS: Record<string, (page: Page) => Promise<void>> = {
  "image-to-word": (page) => expect(page.getByRole("img", { name: "Picture clue" })).toBeVisible(),
  "audio-to-word": (page) => expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible(),
  "meaning-to-word": (page) => expect(page.getByRole("heading", { name: "Which word has this meaning?" })).toBeVisible(),
  "word-to-image": (page) => expect(page.getByRole("group", { name: "Answers" }).locator("img")).toHaveCount(4),
  "word-to-audio": (page) => expect(page.getByRole("button", { name: /^Play recording/ })).toHaveCount(4),
  "word-to-meaning": (page) => expect(page.getByRole("heading", { name: "What does this word mean?" })).toBeVisible(),
};

test("a round takes turns between picture, recording and meaning questions, and their reverses", async () => {
  const userData = await dueSampler();
  const app = await launch(userData);
  const { page } = app;
  const rounds = [
    ["image-to-word", "audio-to-word", "meaning-to-word"],
    ["word-to-image", "word-to-audio", "word-to-meaning"],
  ];
  try {
    for (const order of rounds) {
      await only(page, order);
      await page.reload();
      await goTo(page, `#/course/${SAMPLER}/speed-review`);
      for (const [i, kind] of order.entries()) {
        await expect(page.getByText(new RegExp(`question ${i + 1} of`))).toBeVisible();
        await SHOWS[kind]!(page);
        // The clock allows longer for a recording.
        const seconds = Number((await page.getByRole("timer", { name: "Time left" }).textContent())!.replace(/[^\d]/g, ""));
        expect(seconds).toBeLessThanOrEqual(kind.includes("audio") ? 8 : 7);
        await page.keyboard.press("1");
        await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
      }
      await page.keyboard.press("Escape").catch(() => undefined);
      const end = page.getByRole("button", { name: "End session" });
      if (await end.isVisible().catch(() => false)) await end.click();
    }
  } finally {
    await app.close();
  }
  const kinds = reviewLog(userData, "speed").map((r) => r.exercise);
  // Every game asked the kinds in turn, starting again with the first.
  expect(kinds.slice(0, 3)).toEqual(["image-to-word", "audio-to-word", "meaning-to-word"]);
  expect(kinds.filter((k) => ["word-to-image", "word-to-audio", "word-to-meaning"].includes(k)).length).toBeGreaterThanOrEqual(3);
  cleanup(userData);
});
