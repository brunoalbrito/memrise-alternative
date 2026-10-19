import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch, typingOnly } from "./launch";

// 1x1 PNG
const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

type Api = { library: { apply(c: unknown): Promise<unknown> }; media: { put(id: string, b: Uint8Array, n: string): Promise<unknown> } };

async function seed(page: Page) {
  await page.evaluate(async (b64) => {
    const api = (window as unknown as { api: Api }).api;
    await api.media.put("media-lv", Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), "sink.png");
    await api.library.apply({
      type: "upsertCourse",
      course: { id: "custom-lv", title: "Levels course", categoryId: "lang-en-gb", teaching: true, totalItems: 5, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
    });
    const w = (id: string, text: string, withImage = false) => ({
      id,
      text,
      meaning: `meaning of ${text}`,
      example: "",
      images: withImage ? [{ id: "media-lv", name: "sink.png", type: "image/png", size: 68 }] : [],
      audio: [],
      learned: false,
    });
    await api.library.apply({
      type: "saveLevels",
      courseId: "custom-lv",
      levels: [
        { id: "lv1", name: "First Level", tested: "t", words: [w("a1", "sink", true), w("a2", "wash"), w("a3", "hamper"), w("a4", "rhythm")] },
        { id: "lv2", name: "Second Level", tested: "t", words: [w("b1", "ladder")] },
      ],
    });
  }, PNG_BASE64);
  await typingOnly(page);
  await page.reload();
}

const go = (page: Page, hash: string) =>
  page.evaluate((h) => {
    location.hash = h;
  }, hash);

test("opens a level from the course page and shows its words, status, actions and navigation", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await go(page, "#/course/custom-lv");

    // From the course page: click the level card.
    await page.getByRole("link", { name: /Level 1, First Level/ }).click();
    await expect(page).toHaveURL(/#\/course\/custom-lv\/levels\/1$/);

    // Top bar, header and counts.
    await expect(page.getByRole("link", { name: "Levels (2)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit Course" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "First Level" })).toBeVisible();
    await expect(page.getByText("Level 1", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit Level" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Options/ })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Words learned in this level" })).toHaveAttribute("aria-valuetext", "0 of 4 words learned");
    await expect(page.getByText("4 words", { exact: true })).toBeVisible();
    await expect(page.getByText("0 ignored", { exact: true })).toBeVisible();

    // Legend and rows: new words are ready to learn; the picture shows for the word that has one, the meaning for the others.
    await expect(page.getByRole("list", { name: "Legend" })).toContainText("Ready to learn");
    await expect(page.getByRole("list", { name: "Legend" })).toContainText("Ready to review");
    await expect(page.getByRole("list", { name: "Legend" })).toContainText("Difficult");
    const rows = page.getByRole("list", { name: "Word list" }).getByRole("listitem");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText("sink");
    await expect(rows.nth(0).getByLabel("Picture for sink")).toBeVisible();
    await expect(rows.nth(1)).toContainText("meaning of wash");
    await expect(rows.nth(1)).toContainText("ready to learn");
    await expect(page.getByText("ladder")).toHaveCount(0); // a word of the other level is not listed

    // The main button offers to learn the 4 new words.
    await expect(page.getByRole("link", { name: "Learn 4 new words" })).toBeVisible();

    // Neighbouring levels.
    await expect(page.getByRole("link", { name: /Next level: Level 2/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Previous level/ })).toHaveCount(0);
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});

test("practice from a level only uses that level, and coming back shows the new progress", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await go(page, "#/course/custom-lv/levels/1");
    await page.getByRole("link", { name: "Learn 4 new words" }).click();
    await expect(page.getByLabel("WORD", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Session progress" })).toHaveAttribute("aria-valuetext", "0 of 4");

    await page.keyboard.type("sink");
    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByText("meaning of wash")).toBeVisible();

    // Leaving the session returns to the level page, with progress up to date.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "End session" }).click();
    await expect(page).toHaveURL(/#\/course\/custom-lv\/levels\/1$/);
    await expect(page.getByRole("progressbar", { name: "Words learned in this level" })).toHaveAttribute("aria-valuetext", "1 of 4 words learned");
    await expect(page.getByRole("link", { name: "Learn 3 new words" })).toBeVisible();
    const sinkRow = page.getByRole("list", { name: "Word list" }).getByRole("listitem").nth(0);
    await expect(sinkRow).toContainText(/in \d+ minutes?/);
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});

test("ignores and restores words, from the selection and from Options", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await go(page, "#/course/custom-lv/levels/1");
    await expect(page.getByRole("button", { name: "Ignore", exact: true })).toBeDisabled();

    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByLabel("Select wash").check();
    await page.getByLabel("Select hamper").check();
    await page.getByRole("button", { name: "Ignore", exact: true }).click();
    await expect(page.getByText("2 ignored", { exact: true })).toBeVisible();
    const rows = page.getByRole("list", { name: "Word list" }).getByRole("listitem");
    await expect(rows.nth(1)).toContainText("ignored");
    await expect(page.getByRole("link", { name: "Learn 2 new words" })).toBeVisible();

    // Selecting only ignored words turns the button into Restore.
    await page.getByLabel("Select wash").check();
    await expect(page.getByRole("button", { name: "Restore", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await expect(page.getByText("1 ignored", { exact: true })).toBeVisible();

    // Options: ignore everything, nothing left to practice, then restore everything.
    await page.getByRole("button", { name: /Options/ }).click();
    await page.getByRole("menuitem", { name: "Ignore all words" }).click();
    await expect(page.getByText("4 ignored", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nothing to practice" })).toBeDisabled();
    await page.getByRole("button", { name: /Options/ }).click();
    await page.getByRole("menuitem", { name: "Restore all words" }).click();
    await expect(page.getByText("0 ignored", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Learn 4 new words" })).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});

test("moves between levels and shows clear messages for missing ones", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page);
    await go(page, "#/course/custom-lv/levels/1");
    await page.getByRole("link", { name: /Next level: Level 2/ }).click();
    await expect(page).toHaveURL(/levels\/2$/);
    await expect(page.getByRole("heading", { name: "Second Level" })).toBeVisible();
    await expect(page.getByText("1 word", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Previous level: Level 1/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Next level/ })).toHaveCount(0);

    await page.getByRole("link", { name: "Edit Course" }).click();
    await expect(page).toHaveURL(/#\/course\/custom-lv\/edit$/);

    await go(page, "#/course/custom-lv/levels/9");
    await expect(page.getByRole("heading", { name: "Level not found" })).toBeVisible();
    await go(page, "#/course/nope/levels/1");
    await expect(page.getByRole("heading", { name: "Course not found" })).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});
