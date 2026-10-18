import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = { library: { apply(c: unknown): Promise<{ ok: boolean }> } };

async function seed(page: Page) {
  await page.evaluate(async () => {
    const api = (window as unknown as { api: Api }).api;
    const w = (id: string, text: string) => ({ id, text, meaning: `meaning of ${text}`, example: "", images: [], audio: [], learned: false });
    await api.library.apply({
      type: "upsertCourse",
      course: { id: "custom-s", title: "Study course", categoryId: "lang-en-gb", teaching: true, totalItems: 3, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
    });
    await api.library.apply({
      type: "saveLevels",
      courseId: "custom-s",
      levels: [{ id: "l1", name: "Level 1", tested: "t", words: [w("s1", "sink"), w("s2", "wash"), w("s3", "ladder")] }],
    });
  });
  await page.reload();
}

const go = (page: Page, hash: string) =>
  page.evaluate((h) => {
    location.hash = h;
  }, hash);

test("learn, see real progress and statistics, review when due, and ignore a word", async () => {
  const first = await launch();
  const { page } = first;
  try {
    await seed(page);

    // Nothing is due or learned yet.
    await go(page, "#/course/custom-s/review");
    await expect(page.getByRole("heading", { name: "All caught up" })).toBeVisible();
    await expect(page.getByText("Nothing to review yet")).toBeVisible();

    // Learn the three words.
    await go(page, "#/course/custom-s/learn");
    await expect(page.getByLabel("WORD", { exact: true })).toBeVisible();
    for (const word of ["sink", "wash", "ladder"]) {
      await expect(page.getByText(`meaning of ${word}`)).toBeVisible();
      await page.keyboard.type(word);
      await expect(page.getByText("Correct!")).toBeVisible();
      await expect(page.getByText("Correct!")).toBeHidden();
    }
    await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();

    // Learning again offers no new words, and review is not due yet.
    await page.getByRole("button", { name: "Practice again" }).click();
    await expect(page.getByRole("heading", { name: "No new words for now" })).toBeVisible();
    await go(page, "#/course/custom-s/review");
    await expect(page.getByText(/Nothing to review right now. The next words are due/)).toBeVisible();

    // The course page shows real numbers and statistics instead of a leaderboard.
    await go(page, "#/course/custom-s");
    await expect(page.getByRole("region", { name: "Your statistics" })).toBeVisible();
    await expect(page.getByText("Day streak").locator("..")).toContainText("1");
    await expect(page.getByText("Answers", { exact: true }).locator("..")).toContainText("3");
    await expect(page.getByText("Leaderboard")).toHaveCount(0);
    await expect(page.getByText("3 / 3").or(page.getByText(/3 of 3/)).first()).toBeVisible();
  } finally {
    await first.close();
  }

  // Time passes: make the cards due.
  const db = new Database(join(first.userData, "library", "membetter.db"));
  db.prepare("UPDATE cards SET due_at = '2020-01-01T00:00:00.000Z'").run();
  expect(db.prepare("SELECT COUNT(*) AS n FROM cards WHERE learned_at IS NOT NULL").get()).toEqual({ n: 3 });
  db.close();

  const second = await launch(first.userData);
  try {
    await go(second.page, "#/course/custom-s/review");
    await expect(second.page.getByLabel("WORD", { exact: true })).toBeVisible();
    // Ignore the first due word: it is skipped and left out of later reviews.
    const firstMeaning = await second.page.locator("p[lang='und']").textContent();
    await second.page.getByRole("button", { name: "Ignore this word" }).click();
    await expect(second.page.locator("p[lang='und']")).not.toHaveText(firstMeaning ?? "");
    await second.page.keyboard.press("Escape");
    await second.page.getByRole("button", { name: "End session" }).click();
  } finally {
    await second.close();
  }

  const check = new Database(join(first.userData, "library", "membetter.db"), { readonly: true });
  expect(check.prepare("SELECT COUNT(*) AS n FROM cards WHERE ignored = 1").get()).toEqual({ n: 1 });
  check.close();
  cleanup(first.userData);
});
