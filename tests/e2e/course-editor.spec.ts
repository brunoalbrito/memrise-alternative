import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch } from "./launch";

// 1x1 transparent PNG and a tiny valid WAV (44-byte header, 8 samples of silence).
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
function wav(): Buffer {
  const data = Buffer.alloc(16);
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(8000, 24);
  head.writeUInt32LE(16000, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

type Api = { library: { apply(c: unknown): Promise<unknown> } };

async function newCourse(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const api = (window as unknown as { api: Api }).api;
    await api.library.apply({
      type: "upsertCourse",
      course: { id: "custom-ed", title: "Editor course", categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
    });
  });
  await page.reload();
  await page.evaluate(() => {
    location.hash = "#/course/custom-ed/edit";
  });
}

test("adds levels and words with a picture and a recording, edits and deletes, and keeps everything after a restart", async () => {
  const first = await launch();
  const { page } = first;
  try {
    await newCourse(page);
    await expect(page.getByText("This course has no levels yet")).toBeVisible();

    // Level 1 with two words.
    await page.getByRole("button", { name: "Add Level" }).click();
    const level1 = page.getByRole("region", { name: "Level 1" });
    await level1.getByLabel("Level name").fill("Kitchen");
    await level1.getByRole("button", { name: "Add word" }).click();
    await level1.getByLabel("Word", { exact: true }).first().fill("sink");
    await level1.getByLabel("Meaning", { exact: true }).first().fill("where you wash dishes");
    await level1.getByLabel("Example", { exact: true }).first().fill("The plate is in the sink.");
    await level1.getByRole("button", { name: "Add word" }).click();
    await level1.getByLabel("Word", { exact: true }).nth(1).fill("wash");
    await level1.getByLabel("Meaning", { exact: true }).nth(1).fill("to clean with water");
    await expect(level1.getByLabel("Word", { exact: true })).toHaveCount(2);

    // A picture and a recording on the first word.
    await level1.getByLabel("Choose image files").first().setInputFiles({ name: "sink.png", mimeType: "image/png", buffer: PNG });
    await expect(level1.getByRole("button", { name: "Images: 1 image" }).first()).toBeVisible();
    await level1.getByLabel("Choose audio files").first().setInputFiles({ name: "sink.wav", mimeType: "audio/wav", buffer: wav() });
    await expect(level1.getByRole("button", { name: "Audio: 1 file" }).first()).toBeVisible();

    // Files of the wrong type or too large are refused with a message.
    await level1.getByLabel("Choose image files").nth(1).setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByText("Choose a PNG, JPEG, GIF or WebP image.")).toBeVisible();
    await level1.getByLabel("Choose audio files").nth(1).setInputFiles({ name: "big.wav", mimeType: "audio/wav", buffer: Buffer.alloc(3 * 1024 * 1024 + 1) });
    await expect(page.getByText("This file is too large (maximum 3 MB).")).toBeVisible();

    // Level 2 is duplicated and then deleted after confirming.
    await page.getByRole("button", { name: "Add Level" }).click();
    await page.getByRole("region", { name: "Level 2" }).getByLabel("Level name").fill("Scratch");
    await page.getByRole("region", { name: "Level 2" }).getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByRole("heading", { name: "Delete level 2 and its words?" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("region", { name: "Level 2" })).toBeVisible();
    await page.getByRole("region", { name: "Level 2" }).getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("region", { name: "Level 2" })).toHaveCount(0);

    // Delete the second word.
    await level1.getByRole("button", { name: "Delete word" }).nth(1).click();
    await expect(level1.getByLabel("Word", { exact: true })).toHaveCount(1);
  } finally {
    await first.close();
  }

  const again = await launch(first.userData);
  try {
    await again.page.evaluate(() => {
      location.hash = "#/course/custom-ed/edit";
    });
    const level1 = again.page.getByRole("region", { name: "Level 1" });
    await expect(level1.getByLabel("Level name")).toHaveValue("Kitchen");
    await expect(level1.getByLabel("Word", { exact: true })).toHaveCount(1);
    await expect(level1.getByLabel("Word", { exact: true }).first()).toHaveValue("sink");
    await expect(level1.getByLabel("Meaning", { exact: true }).first()).toHaveValue("where you wash dishes");
    await expect(level1.getByRole("button", { name: "Images: 1 image" }).first()).toBeVisible();
    await expect(level1.getByRole("button", { name: "Audio: 1 file" }).first()).toBeVisible();
    await expect(again.page.getByRole("region", { name: "Level 2" })).toHaveCount(0);
  } finally {
    await again.close();
    cleanup(first.userData);
  }
});

test("a word cannot have more than five pictures", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await newCourse(page);
    await page.getByRole("button", { name: "Add Level" }).click();
    const level = page.getByRole("region", { name: "Level 1" });
    await level.getByRole("button", { name: "Add word" }).click();
    const input = level.getByLabel("Choose image files").first();
    for (let i = 0; i < 5; i += 1) await input.setInputFiles({ name: `p${i}.png`, mimeType: "image/png", buffer: PNG });
    await expect(level.getByRole("button", { name: "Images: 5 images" }).first()).toBeVisible();
    await input.setInputFiles({ name: "p6.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByText("A word can have at most 5 images.")).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});
