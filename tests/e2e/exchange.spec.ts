import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = { library: { apply(c: unknown): Promise<{ ok: boolean }> } };

test("exports a course to a file and imports it into another library", async () => {
  const out = mkdtempSync(join(tmpdir(), "membetter-out-"));
  const file = join(out, "shared.membetter");

  const a = await launch();
  try {
    await a.page.evaluate(async () => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({
        type: "upsertCourse",
        course: { id: "custom-share", title: "Shared course", categoryId: "lang-en-gb", teaching: true, totalItems: 1, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
      });
      await api.library.apply({
        type: "saveLevels",
        courseId: "custom-share",
        levels: [{ id: "l1", name: "Level 1", tested: "t", words: [{ id: "w1", text: "sink", meaning: "m", example: "", images: [], audio: [], learned: false }] }],
      });
    });
    await a.page.reload();
    await a.app.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = (async () => ({ canceled: false, filePath: path })) as unknown as typeof dialog.showSaveDialog;
    }, file);

    const card = a.page.getByRole("listitem").filter({ hasText: "Shared course" });
    await card.getByRole("button", { name: /options/i }).click();
    await a.page.getByRole("menuitem", { name: "Export course" }).click();
    await expect(a.page.getByText("Exported 1 course.")).toBeVisible();
    expect(existsSync(file)).toBe(true);
  } finally {
    await a.close();
    cleanup(a.userData);
  }

  const b = await launch();
  try {
    await b.app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [path] })) as unknown as typeof dialog.showOpenDialog;
    }, file);
    await b.page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(b.page.getByRole("heading", { name: "Import course?" })).toBeVisible();
    await expect(b.page.getByText("Shared course")).toBeVisible();
    await b.page.getByRole("button", { name: "Import", exact: true }).last().click();
    await expect(b.page.getByText("Imported 1 course.")).toBeVisible();
    await expect(b.page.getByRole("listitem").filter({ hasText: "Shared course" })).toBeVisible();
  } finally {
    await b.close();
    cleanup(b.userData);
    cleanup(out);
  }
});

test("a damaged file is rejected with a message and changes nothing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "membetter-bad-"));
  const bad = join(dir, "bad.membetter");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(bad, "definitely not a zip");
  const app = await launch();
  try {
    await app.app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [path] })) as unknown as typeof dialog.showOpenDialog;
    }, bad);
    await app.page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(app.page.getByText(/not a valid MemBetter file|could not be read/)).toBeVisible();
    await expect(app.page.getByRole("heading", { name: "Import course?" })).toHaveCount(0);
  } finally {
    await app.close();
    cleanup(app.userData);
    cleanup(dir);
  }
});
