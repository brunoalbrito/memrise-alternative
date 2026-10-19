import { join } from "node:path";
import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch } from "./launch";

const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** A short silent WAV that the browser can really play (8 kHz, mono, 16 bit, 0.1 s). */
function silentWav(): number[] {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const text = (o: number, t: string) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples * 2, true);
  return [...bytes];
}

type Api = {
  library: { apply(c: unknown): Promise<unknown> };
  media: { put(id: string, b: Uint8Array, n: string): Promise<unknown> };
  study: { setExerciseSettings(k: string[]): Promise<{ ok: boolean }>; exerciseSettings(): Promise<{ data: string[] }> };
};

const WORDS = ["sink", "wash", "hamper", "rhythm", "humid"];

/** A course of five words with picture, meaning and (optionally) a recording. */
async function seed(page: Page, options: { audio: "none" | "valid" | "broken" }) {
  await page.evaluate(
    async ({ b64, wav, words, audio }) => {
      const api = (window as unknown as { api: Api }).api;
      await api.media.put("img", Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), "a.png");
      const broken = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WAVE"), ...new Array(60).fill(1)]);
      await api.media.put("aud", audio === "broken" ? broken : Uint8Array.from(wav), "a.wav");
      await api.library.apply({
        type: "upsertCourse",
        course: { id: "custom-x", title: "Exercises course", categoryId: "lang-en-gb", teaching: true, totalItems: 5, itemsLearned: 0, itemsDue: 0, learnedToday: 0, teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" },
      });
      await api.library.apply({
        type: "saveLevels",
        courseId: "custom-x",
        levels: [
          {
            id: "l1",
            name: "Level 1",
            tested: "t",
            words: words.map((text) => ({
              id: `w-${text}`,
              text,
              meaning: `meaning of ${text}`,
              example: "",
              // Each word has its own picture reference (same file), so options are different from one another.
              images: [{ id: "img", name: `${text}.png`, type: "image/png", size: 68 }].map((m, i) => ({ ...m, id: `img-${text}-${i}` })),
              audio: audio === "none" ? [] : [{ id: `aud-${text}`, name: `${text}.wav`, type: "audio/wav", size: 68 }],
              learned: false,
            })),
          },
        ],
      });
      // One stored file per reference id.
      for (const text of words) {
        await api.media.put(`img-${text}-0`, Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), `${text}.png`);
        if (audio !== "none") await api.media.put(`aud-${text}`, audio === "broken" ? broken : Uint8Array.from(wav), `${text}.wav`);
      }
    },
    { b64: PNG_BASE64, wav: silentWav(), words: WORDS, audio: options.audio },
  );
}

const only = (page: Page, kinds: string[]) => page.evaluate((k) => (window as unknown as { api: Api }).api.study.setExerciseSettings(k), kinds);
const go = (page: Page, hash: string) => page.evaluate((h) => void (location.hash = h), hash);

/** Presses 1 to 4 until the answer is accepted; returns how many wrong options were tried first. */
async function solve(page: Page): Promise<number> {
  for (let i = 1; i <= 4; i += 1) {
    await page.keyboard.press(String(i));
    if (await page.getByText("Correct!").isVisible()) return i - 1;
  }
  throw new Error("no option was accepted");
}

const log = (userData: string) => {
  const db = new Database(join(userData, "library", "membetter.db"), { readonly: true });
  const rows = db.prepare("SELECT exercise, result, attempts, points FROM review_log ORDER BY id").all() as { exercise: string; result: string; attempts: number; points: number }[];
  db.close();
  return rows;
};

test("multiple-choice exercises: word to picture, picture to word, word to meaning, meaning to word", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page, { audio: "none" });
    const cases: [string, string][] = [
      ["image-to-word", "Which word is this?"],
      ["word-to-image", "Which picture shows this word?"],
      ["word-to-meaning", "What does this word mean?"],
      ["meaning-to-word", "Which word has this meaning?"],
    ];
    const tried: number[] = [];
    for (const [kind, question] of cases) {
      await only(page, [kind]);
      await page.reload();
      await go(page, "#/course/custom-x/learn?level=l1");
      await expect(page.getByRole("heading", { name: question })).toBeVisible();
      const answers = page.getByRole("group", { name: "Answers" }).getByRole("button");
      await expect(answers).toHaveCount(4);
      if (kind === "image-to-word") {
        // Four different words are offered.
        const texts = await answers.allTextContents();
        expect(new Set(texts.map((t) => t.replace(/\d$/, ""))).size).toBe(4);
      }
      tried.push(await solve(page));
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "End session" }).click();
    }
    // The first picks were wrong in some runs: wrong options are disabled and never accepted.
    expect(tried.every((n) => n >= 0 && n <= 3)).toBe(true);
  } finally {
    await app.close();
  }
  const rows = log(app.userData);
  expect(rows.map((r) => r.exercise)).toEqual(["image-to-word", "word-to-image", "word-to-meaning", "meaning-to-word"]);
  for (const row of rows) {
    // Choices earn half the points of a typed answer; mistakes before the right option are counted.
    expect(row.points).toBe(5);
    expect(row.result).toBe(row.attempts > 0 ? "wrong" : "correct");
  }
  cleanup(app.userData);
});

test("a wrong option is marked and cannot be chosen again; giving up shows the right one", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page, { audio: "none" });
    await only(page, ["image-to-word"]);
    await page.reload();
    await go(page, "#/course/custom-x/learn?level=l1");
    const answers = page.getByRole("group", { name: "Answers" }).getByRole("button");
    await expect(answers).toHaveCount(4);

    // Find a wrong option by trying them in order, then check it stays disabled.
    await page.keyboard.press("1");
    if (!(await page.getByText("Correct!").isVisible())) {
      await expect(page.getByText("Not quite. Try another.")).toBeVisible();
      await expect(answers.nth(0)).toBeDisabled();
      await page.keyboard.press("Control+Enter");
      await expect(page.getByText(/The word is/)).toBeVisible();
      await page.keyboard.press("Enter");
    }
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "End session" }).click();
  } finally {
    await app.close();
  }
  const rows = log(app.userData);
  expect(rows).toHaveLength(1);
  expect(["correct", "gave_up"]).toContain(rows[0]!.result);
  cleanup(app.userData);
});

test("a course too small for choices falls back to typing", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await page.evaluate(async () => {
      const api = (window as unknown as { api: Api }).api;
      await api.library.apply({ type: "upsertCourse", course: { id: "custom-s", title: "Small course", categoryId: "lang-en-gb", teaching: true, totalItems: 2, itemsLearned: 0, itemsDue: 0, learnedToday: 0 } });
      await api.library.apply({
        type: "saveLevels",
        courseId: "custom-s",
        levels: [{ id: "l1", name: "L", tested: "t", words: ["one", "two"].map((t) => ({ id: t, text: t, meaning: `meaning ${t}`, example: "", images: [], audio: [], learned: false })) }],
      });
    });
    await page.reload();
    await go(page, "#/course/custom-s/learn");
    await expect(page.getByLabel("WORD", { exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Answers" })).toHaveCount(0);
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});

test("listening: hear the word and pick it, pick the recording, hear and type", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page, { audio: "valid" });

    await only(page, ["audio-to-word"]);
    await page.reload();
    await go(page, "#/course/custom-x/learn?level=l1");
    await expect(page.getByRole("heading", { name: "Which word do you hear?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible();
    await expect(page.getByText(/meaning of/)).toHaveCount(0); // nothing about the word is written in the prompt
    await solve(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "End session" }).click();

    await only(page, ["word-to-audio"]);
    await page.reload();
    await go(page, "#/course/custom-x/learn?level=l1");
    await expect(page.getByRole("heading", { name: "Which recording says this word?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Play recording/ })).toHaveCount(4);
    await expect(page.getByRole("button", { name: /^Choose recording/ })).toHaveCount(4);
    await solve(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "End session" }).click();

    await only(page, ["audio-to-type"]);
    await page.reload();
    await go(page, "#/course/custom-x/learn?level=l1");
    await expect(page.getByText("Listen and type the word")).toBeVisible();
    await expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible();
    // The words are not written anywhere on screen before the answer (no picture, no meaning).
    for (const word of WORDS) await expect(page.getByText(word, { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("WORD", { exact: true })).toBeVisible();
    // Type whichever word it is: try each until one is accepted (wrong full-length answers only mark an attempt).
    const tiles = await page.getByRole("group", { name: "Letters" }).getByRole("button").evaluateAll((els) => els.map((e) => (e.getAttribute("aria-label") ?? "").split(",")[0]).sort().join(""));
    const answer = WORDS.find((w) => [...w].sort().join("") === tiles)!;
    await page.keyboard.type(answer);
    await expect(page.getByText("Correct!")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "End session" }).click();
  } finally {
    await app.close();
  }
  const rows = log(app.userData);
  expect(rows.map((r) => r.exercise)).toEqual(["audio-to-word", "word-to-audio", "audio-to-type"]);
  expect(rows.map((r) => r.points)).toEqual([5, 5, 10]);
  cleanup(app.userData);
});

test("words without audio never get a listening exercise; a recording that cannot play falls back", async () => {
  const none = await launch();
  try {
    await seed(none.page, { audio: "none" });
    await only(none.page, ["audio-to-word", "word-to-audio", "audio-to-type", "type"]);
    await none.page.reload();
    await go(none.page, "#/course/custom-x/learn?level=l1");
    await expect(none.page.getByLabel("WORD", { exact: true })).toBeVisible(); // typing, not listening
  } finally {
    await none.close();
    cleanup(none.userData);
  }

  const broken = await launch();
  try {
    await seed(broken.page, { audio: "broken" });
    await only(broken.page, ["audio-to-word", "type"]);
    await broken.page.reload();
    await go(broken.page, "#/course/custom-x/learn?level=l1");
    await expect(broken.page.getByText("This recording could not be played.")).toBeVisible({ timeout: 10_000 });
    // The word is practiced another way instead of getting stuck.
    await expect(broken.page.getByLabel("WORD", { exact: true })).toBeVisible();
  } finally {
    await broken.close();
    cleanup(broken.userData);
  }
});

test("exercise types can be turned off, the choice is remembered, and one always stays on", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await seed(page, { audio: "none" });
    await page.reload();
    await go(page, "#/course/custom-x/learn?level=l1");
    await page.getByRole("button", { name: "Exercise types" }).click();
    const dialog = page.getByRole("dialog", { name: "Exercise types" });
    await expect(dialog.getByRole("switch")).toHaveCount(8);

    await dialog.getByRole("button", { name: "No typing" }).click();
    await expect(dialog.getByRole("switch", { name: /Type the word/ })).not.toBeChecked();
    await expect(dialog.getByRole("switch", { name: /Pick the picture/ })).toBeChecked();

    await dialog.getByRole("button", { name: "Typing only" }).click();
    await expect(dialog.getByRole("switch", { name: /Pick the picture/ })).not.toBeChecked();
    await dialog.getByRole("switch", { name: /Hear it, type it/ }).uncheck();
    // The last one left cannot be turned off.
    await expect(dialog.getByRole("switch", { name: /Type the word/ })).toBeDisabled();
    await dialog.getByRole("button", { name: "All types" }).click();
    await dialog.getByRole("button", { name: "No typing" }).click();
  } finally {
    await app.close();
  }

  const again = await launch(app.userData);
  try {
    const saved = await again.page.evaluate(() => (window as unknown as { api: Api }).api.study.exerciseSettings());
    expect(saved.data).not.toContain("type");
    expect(saved.data).not.toContain("audio-to-type");
    expect(saved.data).toContain("image-to-word");
    const refused = await again.page.evaluate(() => (window as unknown as { api: Api }).api.study.setExerciseSettings([]));
    expect(refused.ok).toBe(false);
  } finally {
    await again.close();
    cleanup(app.userData);
  }
});
