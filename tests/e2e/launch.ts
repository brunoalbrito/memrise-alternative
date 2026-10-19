import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertTemporary } from "./guard";
import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";

export interface Launched {
  app: ElectronApplication;
  page: Page;
  userData: string;
  close(): Promise<void>;
}

/** Starts the built app with an isolated, temporary data folder. */
export async function launch(
  userData = mkdtempSync(join(tmpdir(), "membetter-e2e-")),
  env: Record<string, string> = {},
): Promise<Launched> {
  assertTemporary(userData);
  const app = await electron.launch({
    args: [".", `--user-data-dir=${userData}`],
    // Backups and the app-data folder never go to the real places during tests.
    env: { ...process.env, MEMBETTER_BACKUP_FOLDER: join(userData, "backups"), MEMBETTER_APP_DATA: join(userData, "appdata"), ...env } as Record<string, string>,
  });
  const page = await app.firstWindow();
  await page.waitForLoadState("domcontentloaded");
  return {
    app,
    page,
    userData,
    close: async () => {
      await app.close();
    },
  };
}

export function cleanup(userData: string): void {
  rmSync(userData, { recursive: true, force: true });
}

/** Practice with typing only, so tests that type answers do not get a multiple-choice exercise. */
export async function typingOnly(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { api: { study: { setExerciseSettings(k: string[]): Promise<unknown> } } }).api.study.setExerciseSettings(["type"]));
}
