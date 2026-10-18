import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("Home opens in under 3 seconds with 50 courses and 20,000 words", async () => {
  const userData = mkdtempSync(join(tmpdir(), "membetter-perf-"));
  // Build the library through the app itself.
  const seed = await launch(userData);
  await seed.page.evaluate(async () => {
    const api = (window as unknown as { api: { library: { apply(c: unknown): Promise<unknown> } } }).api;
    for (let c = 0; c < 50; c += 1) {
      const id = `custom-perf-${c}`;
      await api.library.apply({
        type: "upsertCourse",
        course: { id, title: `Course number ${c}`, categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
      });
      await api.library.apply({
        type: "saveLevels",
        courseId: id,
        levels: Array.from({ length: 4 }, (_, l) => ({
          id: `${id}-l${l}`,
          name: `Level ${l + 1}`,
          tested: "t",
          words: Array.from({ length: 100 }, (_, w) => ({ id: `${id}-l${l}-w${w}`, text: `word${c}-${l}-${w}`, meaning: "a meaning of some length for the word", example: "an example sentence for the word", images: [], audio: [], learned: false })),
        })),
      });
    }
  });
  await seed.close();

  const started = Date.now();
  const app = await launch(userData);
  try {
    await expect(app.page.getByText("Course number 49")).toBeVisible({ timeout: 10_000 });
    const elapsed = Date.now() - started;
    console.log(`Home with 50 courses and 20,000 words ready in ${elapsed} ms`);
    expect(elapsed).toBeLessThan(3000);
  } finally {
    await app.close();
    cleanup(userData);
  }
});
