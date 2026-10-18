import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

test("opens the app in a hardened window with a local library", async () => {
  const { app, page, userData, close } = await launch();
  try {
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Renderer is isolated from Node.
    const isolation = await page.evaluate(() => ({
      require: typeof (globalThis as Record<string, unknown>)["require"],
      process: typeof (globalThis as Record<string, unknown>)["process"],
      api: typeof (window as unknown as { api?: unknown }).api,
    }));
    expect(isolation).toEqual({ require: "undefined", process: "undefined", api: "object" });

    const info = await page.evaluate(() =>
      (window as unknown as { api: { app: { info(): Promise<{ ok: boolean; data: { libraryVersion: number } }> } } }).api.app.info(),
    );
    expect(info.ok).toBe(true);
    expect(info.data.libraryVersion).toBeGreaterThan(0);

    expect(existsSync(join(userData, "library", "membetter.db"))).toBe(true);
    expect(app.windows()).toHaveLength(1);
  } finally {
    await close();
    cleanup(userData);
  }
});

test("a second instance does not open a second window", async () => {
  const first = await launch();
  try {
    const second = await launch(first.userData).catch(() => null);
    // The second process exits immediately because the first holds the lock.
    if (second) await second.close().catch(() => undefined);
    expect(first.app.windows()).toHaveLength(1);
  } finally {
    await first.close();
    cleanup(first.userData);
  }
});
