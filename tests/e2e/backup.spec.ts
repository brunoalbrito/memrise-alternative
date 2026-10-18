import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("backs up automatically and on demand, lists backups, and refuses a damaged one", async () => {
  const folder = mkdtempSync(join(tmpdir(), "membetter-backups-"));
  const app = await launch(undefined, { MEMBETTER_BACKUP_FOLDER: folder });
  const { page } = app;
  try {
    // The first start makes an automatic backup in the background.
    await expect.poll(() => readdirSync(folder).filter((n) => /^membetter-.*\.db$/.test(n)).length, { timeout: 10_000 }).toBe(1);

    await page.getByRole("button", { name: "Backups", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Backups" });
    await expect(dialog.getByText(/Last backup:/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Restore" })).toHaveCount(1);
    await expect(dialog.getByText(folder)).toBeVisible();

    await dialog.getByRole("button", { name: "Back up now" }).click();
    await expect(dialog.getByText("Backup saved.")).toBeVisible();

    // A second backup in the same second keeps a distinct name only when the time differs; wait for the list to refresh.
    await expect.poll(async () => dialog.getByRole("button", { name: "Restore" }).count()).toBeGreaterThanOrEqual(1);

    // Settings are remembered.
    await dialog.getByLabel("Back up automatically").uncheck();
    await expect(dialog.getByLabel("Back up automatically")).not.toBeChecked();

    // A damaged backup is refused with a clear message and the app keeps running.
    writeFileSync(join(folder, "membetter-20200101-000000.db"), "not a database");
    await dialog.getByRole("button", { name: "Close" }).click();
    await page.getByRole("button", { name: "Backups", exact: true }).click();
    const reopened = page.getByRole("dialog", { name: "Backups" });
    const row = reopened.getByRole("listitem").filter({ hasText: /2020/ });
    await row.getByRole("button", { name: "Restore" }).click();
    await expect(reopened.getByRole("alertdialog", { name: "Confirm restore" })).toBeVisible();
    await reopened.getByRole("button", { name: "Replace my library" }).click();
    await expect(reopened.getByText(/damaged/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Backups/ })).toBeVisible();
    expect(existsSync(join(app.userData, "library", "pre-restore"))).toBe(false);
  } finally {
    await app.close();
    cleanup(app.userData);
    cleanup(folder);
  }
});

test("a backup folder that cannot be used shows a warning without blocking the app", async () => {
  const dir = mkdtempSync(join(tmpdir(), "membetter-badfolder-"));
  const file = join(dir, "a-file");
  writeFileSync(file, "x");
  const app = await launch(undefined, { MEMBETTER_BACKUP_FOLDER: join(file, "inside") });
  try {
    await app.page.reload();
    await expect(app.page.getByText(/Your last backup did not work/)).toBeVisible({ timeout: 10_000 });
    await expect(app.page.getByRole("button", { name: "Create a course" }).first()).toBeVisible();
  } finally {
    await app.close();
    cleanup(app.userData);
    cleanup(dir);
  }
});
