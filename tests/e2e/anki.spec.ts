import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = { library: { apply(c: unknown): Promise<unknown> } };

test("exports a course for Anki and imports a CSV word list into a new course", async () => {
  const out = mkdtempSync(join(tmpdir(), "membetter-anki-e2e-"));
  const apkg = join(out, "deck.apkg");
  const csv = join(out, "words.csv");
  writeFileSync(csv, "word,meaning\nsink,a bowl\n,empty word\nwash,to clean\nsink,repeat\n");

  const app = await launch();
  const { page } = app;
  try {
    await page.evaluate(async () => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({ type: "upsertCourse", course: { id: "custom-a", title: "Anki course", categoryId: "lang-en-gb", teaching: true, totalItems: 1, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" } });
      await api.library.apply({
        type: "saveLevels",
        courseId: "custom-a",
        levels: [{ id: "l1", name: "Level 1", tested: "t", words: [{ id: "w1", text: "sink", meaning: "a bowl", example: "", images: [], audio: [], learned: false }] }],
      });
    });
    await page.reload();

    // Export for Anki
    await app.app.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = (async () => ({ canceled: false, filePath: path })) as unknown as typeof dialog.showSaveDialog;
    }, apkg);
    const card = page.getByRole("listitem").filter({ hasText: "Anki course" });
    await card.getByRole("button", { name: /options/i }).click();
    await page.getByRole("menuitem", { name: "Export for Anki" }).click();
    await expect(page.getByText(/Exported 1 word for Anki/)).toBeVisible();
    expect(existsSync(apkg)).toBe(true);
    const files = unzipSync(readFileSync(apkg));
    expect(Object.keys(files)).toContain("collection.anki2");
    expect(JSON.parse(strFromU8(files["media"]!))).toEqual({});

    // Import a CSV
    await app.app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [path] })) as unknown as typeof dialog.showOpenDialog;
    }, csv);
    await page.getByRole("button", { name: "Import word list" }).click();
    const dialog = page.getByRole("dialog", { name: "Import a word list" });
    await dialog.getByRole("button", { name: "Choose file…" }).click();
    await expect(dialog.getByText("5 rows, 2 columns.")).toBeVisible();
    await expect(dialog.getByLabel("The first row holds column names")).toBeChecked();
    await expect(dialog.getByRole("button", { name: "Import", exact: true })).toBeDisabled(); // a language is required
    await dialog.getByLabel("Language you are learning").selectOption("en-gb");
    await dialog.getByRole("button", { name: "Import", exact: true }).click();
    await expect(dialog.getByText(/Imported 2 words into/)).toBeVisible();
    await expect(dialog.getByText("Row 3: The word is empty.")).toBeVisible();
    await expect(dialog.getByText("Row 5: The word is a repeat of row 2.")).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "words" }).first()).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
    cleanup(out);
  }
});
