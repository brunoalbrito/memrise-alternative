import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, expect, test } from "@playwright/test";

// The sample data and the real data live in different folders. MEMBETTER_APP_DATA points the app-data folder at a temporary one, so nothing real is touched.
test("sample data goes to its own MemBetter-dev folder, marked in the window title, and never to the real MemBetter folder", async () => {
  const home = mkdtempSync(join(tmpdir(), "membetter-home-"));
  const samples = join(home, "samples.membetter");
  execFileSync("node", ["scripts/make-sample-library.ts", samples], { stdio: "pipe" });
  const appData = join(home, "appdata");
  mkdirSync(appData, { recursive: true });
  const env = { ...process.env, MEMBETTER_APP_DATA: appData, MEMBETTER_BACKUP_FOLDER: join(home, "backups"), MEMBETTER_SEED_FILE: samples } as Record<string, string>;

  const first = await electron.launch({ args: ["."], env });
  try {
    const page = await first.firstWindow();
    await expect(page.getByText("Sample Course: Pictures and Sounds").first()).toBeVisible();
    expect(await first.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.getTitle())).toBe("MemBetter (sample data)");
  } finally {
    await first.close();
  }
  expect(existsSync(join(appData, "MemBetter-dev", "library", "membetter.db"))).toBe(true);
  expect(existsSync(join(appData, "MemBetter"))).toBe(false);

  // A second start keeps the library and does not load the sample again.
  const second = await electron.launch({ args: ["."], env });
  try {
    const page = await second.firstWindow();
    await expect(page.getByText("Sample Course: Pictures and Sounds")).toHaveCount(1);
  } finally {
    await second.close();
    rmSync(home, { recursive: true, force: true });
  }
});
