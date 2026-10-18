import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = { library: { apply(c: unknown): Promise<{ ok: boolean }> } };


async function seed(page: Page) {
  await page.evaluate(async () => {
    const api = (window as unknown as { api: Api }).api;
    await api.library.apply({
      type: "upsertCourse",
      course: { id: "custom-p", title: "Practice course", categoryId: "lang-en-gb", teaching: true, totalItems: 3, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
    });
    const w = (id: string, text: string, meaning: string) => ({ id, text, meaning, example: "", images: [], audio: [], learned: false });
    await api.library.apply({
      type: "saveLevels",
      courseId: "custom-p",
      levels: [{ id: "l1", name: "Level 1", tested: "t", words: [w("w1", "sink", "where you wash dishes"), w("w2", "wash", "to clean with water"), w("w3", "laundry folding", "fold clean clothes"), w("w4", "no prompt", "")] }],
    });
  });
  await page.reload();
}

/** Presses the number keys for the tiles that spell `answer`. */
async function typeWithTiles(page: Page, answer: string) {
  const labels = await page.getByRole("group", { name: "Letters" }).getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
  const used = new Set<number>();
  for (const ch of answer.replace(/[^\p{L}\p{N}]/gu, "")) {
    const index = labels.findIndex((l, i) => !used.has(i) && l.startsWith(`${ch},`));
    used.add(index);
    await page.keyboard.press(String(index + 1));
  }
}

test("practice by typing, tiles, hint and giving up, with every answer recorded", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await page.evaluate(() => {
      location.hash = "#/course/custom-p/learn";
    });

    // Layout from the contract.
    await expect(page.getByRole("heading", { name: "Practice course" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Show keyboard shortcuts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(page.getByLabel("WORD")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Session progress" })).toHaveAttribute("aria-valuetext", "0 of 3");
    await expect(page.getByText("where you wash dishes")).toBeVisible(); // no image: the meaning is the clue
    await expect(page.getByRole("group", { name: "Letters" }).getByRole("button")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Hint/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Backspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: /I don’t know/ })).toBeVisible();

    // Word 1: keyboard typing, a wrong letter that has no tile is ignored, then correct.
    await page.keyboard.type("zsink");
    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Session progress" })).toHaveAttribute("aria-valuetext", "1 of 3");
    await expect(page.getByLabel("Points")).toHaveText("10");

    // Word 2: number keys, backspace and a hint (Alt+H works while the input is focused).
    await expect(page.getByText("to clean with water")).toBeVisible();
    await page.keyboard.press("Alt+h");
    await expect(page.getByLabel("WORD")).toHaveValue("w");
    await page.keyboard.press("a");
    await page.keyboard.press("Backspace");
    await expect(page.getByLabel("WORD")).toHaveValue("w");
    await typeWithTiles(page, "ash");
    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByLabel("Points")).toHaveText("17"); // 10 + (10 - 3 for one hint)

    // Word 3 has a space: spaces are filled in. Give up with Ctrl+Enter.
    await expect(page.getByText("fold clean clothes")).toBeVisible();
    await expect(page.getByRole("group", { name: "Letters" }).getByRole("button")).toHaveCount(14);
    await page.keyboard.press("Control+Enter");
    await expect(page.getByText("The word is “laundry folding”")).toBeVisible();
    await expect(page.getByLabel("WORD")).toHaveValue("laundry folding");
    await page.keyboard.press("Enter");

    // Summary: the word without any prompt was skipped.
    await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
    await expect(page.getByText("1 word was skipped")).toBeVisible();
    await expect(page.getByText("Hints used").locator("..")).toContainText("1");
    await expect(page.getByText("Points").last().locator("..")).toContainText("17");
  } finally {
    await app.close();
  }

  const db = new Database(join(app.userData, "library", "membetter.db"), { readonly: true });
  const log = db.prepare("SELECT word_id, result, hints_used, points FROM review_log ORDER BY id").all();
  expect(log).toEqual([
    { word_id: "w1", result: "correct", hints_used: 0, points: 10 },
    { word_id: "w2", result: "hinted", hints_used: 1, points: 7 },
    { word_id: "w3", result: "gave_up", hints_used: 0, points: 0 },
  ]);
  expect(db.prepare("SELECT status, correct_count, points_total FROM sessions").all()).toEqual([{ status: "completed", correct_count: 2, points_total: 17 }]);
  db.close();
  cleanup(app.userData);
});

test("closing mid-session asks first and keeps the answers given", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await page.evaluate(() => {
      location.hash = "#/course/custom-p/review";
    });
    await expect(page.getByLabel("WORD")).toBeVisible();
    await page.keyboard.type("sink");
    await expect(page.getByText("Correct!")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "End this session?" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("WORD")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: "End session" }).click();
    await expect(page).toHaveURL(/#\/course\/custom-p$/);
  } finally {
    await app.close();
  }
  const db = new Database(join(app.userData, "library", "membetter.db"), { readonly: true });
  expect(db.prepare("SELECT status FROM sessions").all()).toEqual([{ status: "completed" }]);
  expect(db.prepare("SELECT COUNT(*) AS n FROM review_log").get()).toEqual({ n: 1 });
  db.close();
  cleanup(app.userData);
});

test("a course with nothing to practice says so", async () => {
  const app = await launch();
  try {
    await app.page.evaluate(async () => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({ type: "upsertCourse", course: { id: "custom-e", title: "Empty course", categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0 } });
    });
    await app.page.reload();
    await app.page.evaluate(() => {
      location.hash = "#/course/custom-e/learn";
    });
    await expect(app.page.getByRole("heading", { name: "Nothing to practice yet" })).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});

