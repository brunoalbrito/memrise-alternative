import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";

export interface Launched {
  app: ElectronApplication;
  page: Page;
  userData: string;
  close(): Promise<void>;
}

/** Starts the built app with an isolated, temporary data folder. */
export async function launch(userData = mkdtempSync(join(tmpdir(), "membetter-e2e-"))): Promise<Launched> {
  const app = await electron.launch({ args: [".", `--user-data-dir=${userData}`] });
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
