import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, expect, test } from "@playwright/test";
import { cleanup } from "./launch";

// Runs against an installed build: PACKAGED_APP=/path/to/MemBetter.app/Contents/MacOS/MemBetter pnpm exec playwright test packaged
const executable = process.env["PACKAGED_APP"];

test.skip(!executable, "Set PACKAGED_APP to the packaged executable to run this test");

test("the packaged app starts, creates its library with the native database module, and keeps data across restarts", async () => {
  const userData = mkdtempSync(join(tmpdir(), "membetter-packaged-"));
  const launch = () =>
    electron.launch({
      executablePath: executable!,
      args: [`--user-data-dir=${userData}`],
      env: { ...process.env, MEMBETTER_BACKUP_FOLDER: join(userData, "backups") } as Record<string, string>,
    });
  try {
    const first = await launch();
    const page = await first.firstWindow();
    await expect(page.getByRole("button", { name: "Create a course" })).toBeVisible();
    const info = await page.evaluate(() => (window as unknown as { api: { app: { info(): Promise<{ data: { libraryVersion: number; version: string } }> } } }).api.app.info());
    expect(info.data.libraryVersion).toBeGreaterThan(0);
    await page.evaluate(async () => {
      const api = (window as unknown as { api: { library: { apply(c: unknown): Promise<unknown> } } }).api;
      await api.library.apply({ type: "upsertCourse", course: { id: "custom-pk", title: "Packaged course", categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0 } });
    });
    await first.close();
    expect(existsSync(join(userData, "library", "membetter.db"))).toBe(true);

    const second = await launch();
    await expect((await second.firstWindow()).getByText("Packaged course")).toBeVisible();
    await second.close();
  } finally {
    cleanup(userData);
  }
});
