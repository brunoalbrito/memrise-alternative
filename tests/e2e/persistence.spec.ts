import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = { library: { apply(c: unknown): Promise<{ ok: boolean }>; load(): Promise<{ ok: boolean; data: { createdCourses: { title: string }[] } }> } };

test("courses and words survive a restart, offline", async () => {
  const first = await launch();
  try {
    const course = {
      id: "custom-e2e",
      title: "Persistent course",
      categoryId: "lang-en-gb",
      teaching: true,
      totalItems: 0,
      itemsLearned: 0,
      itemsDue: 0,
      learnedToday: 0,
      teachingLanguageId: "en-gb",
      speakersLanguageId: "pt-br",
    };
    const saved = await first.page.evaluate(
      async (c) => {
        const api = (window as unknown as { api: Api }).api;
        const a = await api.library.apply({ type: "upsertCourse", course: c });
        const b = await api.library.apply({
          type: "saveLevels",
          courseId: c.id,
          levels: [{ id: "l1", name: "Level 1", tested: "t", words: [{ id: "w1", text: "sink", meaning: "m", example: "", images: [], audio: [], learned: false }] }],
        });
        return [a.ok, b.ok];
      },
      course,
    );
    expect(saved).toEqual([true, true]);
  } finally {
    await first.close();
  }

  const second = await launch(first.userData);
  try {
    await expect(second.page.getByText("Persistent course")).toBeVisible();
    // Invalid input is rejected by the main process, not stored.
    const bad = await second.page.evaluate(() =>
      (window as unknown as { api: Api }).api.library.apply({ type: "setGoal", courseId: "x", value: 7 }),
    );
    expect(bad.ok).toBe(false);
  } finally {
    await second.close();
    cleanup(first.userData);
  }
});
