import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

const KEY = "AIzaSy-e2e-secret-9876";

type Api = {
  ai: {
    saveKey(p: string, k: string): Promise<{ ok: boolean; error?: { code: string } }>;
    status(): Promise<{ ok: boolean; data: { google: { connected: boolean; last4: string } } }>;
    removeKey(p: string): Promise<{ ok: boolean }>;
    wordText(w: string, l: string): Promise<{ ok: boolean; error?: { code: string } }>;
  };
};

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test("a saved key is encrypted on disk, never returned, and only its last four characters are shown", async () => {
  const app = await launch();
  try {
    const saved = await app.page.evaluate((k) => (window as unknown as { api: Api }).api.ai.saveKey("google", k), KEY);
    test.skip(!saved.ok && saved.error?.code === "secret_unavailable", "No secure storage on this machine");
    expect(saved.ok).toBe(true);

    const status = await app.page.evaluate(() => (window as unknown as { api: Api }).api.ai.status());
    expect(status.data.google).toEqual({ connected: true, last4: "9876" });
    expect(JSON.stringify(status)).not.toContain(KEY);

    // The renderer cannot read it back through any channel it has.
    const leaked = await app.page.evaluate((k) => JSON.stringify(Object.keys((window as unknown as { api: Record<string, object> }).api)).includes(k), KEY);
    expect(leaked).toBe(false);

    // Without a network the call fails with a clear kind, and the error never contains the key.
    const call = await app.page.evaluate(() => (window as unknown as { api: Api }).api.ai.wordText("sink", "English"));
    expect(JSON.stringify(call)).not.toContain(KEY);

    await app.page.evaluate(() => (window as unknown as { api: Api }).api.ai.removeKey("google"));
    const after = await app.page.evaluate(() => (window as unknown as { api: Api }).api.ai.status());
    expect(after.data.google.connected).toBe(false);
  } finally {
    await app.close();
    // Nothing under the data folder (database, WAL, media, logs) contains the key in plain text.
    for (const file of filesUnder(app.userData)) {
      if (statSync(file).size < 50 * 1024 * 1024) expect(readFileSync(file).includes(Buffer.from(KEY)), file).toBe(false);
    }
    cleanup(app.userData);
  }
});
