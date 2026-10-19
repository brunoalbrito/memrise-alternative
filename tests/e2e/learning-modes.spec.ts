import { expect, test, type Page } from "@playwright/test";
import { cleanup, launch } from "./launch";
import { go, importSamples, only, reviewLog, SAMPLER, SAMPLER_WORDS } from "./fixtures/sample-library";

/** Presses 1 to 4 until the answer is accepted. */
async function solve(page: Page): Promise<void> {
  for (let i = 1; i <= 4; i += 1) {
    await page.keyboard.press(String(i));
    if (await page.getByText("Correct!").isVisible()) return;
  }
  throw new Error("no option was accepted");
}

async function endSession(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "End session" }).click();
}

async function start(page: Page, kind: string): Promise<void> {
  await only(page, [kind]);
  await page.reload();
  await go(page, `#/course/${SAMPLER}/learn`);
}

test("every way to learn works on the sample library: typing, pictures, meanings and recordings", async () => {
  const app = await launch();
  const { page } = app;
  try {
    await importSamples(app);

    // Picture and meaning prompts, four options each.
    const choices: [string, string][] = [
      ["image-to-word", "Which word is this?"],
      ["word-to-image", "Which picture shows this word?"],
      ["word-to-meaning", "What does this word mean?"],
      ["meaning-to-word", "Which word has this meaning?"],
      ["audio-to-word", "Which word do you hear?"],
      ["word-to-audio", "Which recording says this word?"],
    ];
    for (const [kind, question] of choices) {
      await start(page, kind);
      await expect(page.getByRole("heading", { name: question })).toBeVisible();
      await expect(page.getByRole("group", { name: "Answers" }).getByRole("button")).toHaveCount(kind === "word-to-audio" ? 8 : 4); // a recording option is a play and a choose button
      if (kind === "image-to-word") await expect(page.getByRole("img", { name: "Picture clue" })).toBeVisible();
      if (kind === "word-to-image") await expect(page.getByRole("group", { name: "Answers" }).locator("img")).toHaveCount(4);
      if (kind === "audio-to-word") await expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible();
      if (kind === "word-to-audio") await expect(page.getByRole("button", { name: /^Play recording/ })).toHaveCount(4);
      await solve(page);
      await endSession(page);
    }

    // Typing from a picture or meaning, then hearing and typing.
    for (const kind of ["type", "audio-to-type"]) {
      await start(page, kind);
      await expect(page.getByLabel("WORD", { exact: true })).toBeVisible();
      if (kind === "audio-to-type") await expect(page.getByRole("button", { name: "Play the recording" })).toBeVisible();
      const tiles = await page.getByRole("group", { name: "Letters" }).getByRole("button").evaluateAll((els) => els.map((e) => (e.getAttribute("aria-label") ?? "").split(",")[0]).sort().join(""));
      const answer = SAMPLER_WORDS.find((w) => [...w].sort().join("") === tiles);
      expect(answer).toBeDefined();
      await page.keyboard.type(answer!);
      await expect(page.getByText("Correct!")).toBeVisible();
      await endSession(page);
    }
  } finally {
    await app.close();
  }
  expect(reviewLog(app.userData).map((r) => r.exercise)).toEqual(["image-to-word", "word-to-image", "word-to-meaning", "meaning-to-word", "audio-to-word", "word-to-audio", "type", "audio-to-type"]);
  cleanup(app.userData);
});

test("the sample pictures and recordings are stored, served and survive a restart", async () => {
  const first = await launch();
  try {
    await importSamples(first);
  } finally {
    await first.close();
  }
  const second = await launch(first.userData);
  try {
    await only(second.page, ["word-to-image"]);
    await second.page.reload();
    await go(second.page, `#/course/${SAMPLER}/learn`);
    const pictures = second.page.getByRole("group", { name: "Answers" }).locator("img");
    await expect(pictures).toHaveCount(4);
    const loaded = await pictures.evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0));
    expect(loaded).toEqual([true, true, true, true]);
  } finally {
    await second.close();
    cleanup(first.userData);
  }
});
