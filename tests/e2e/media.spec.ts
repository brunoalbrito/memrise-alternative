import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

// 1x1 transparent PNG
const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

type Api = { media: { put(id: string, b: Uint8Array, n: string): Promise<{ ok: boolean; error?: { message: string } }> } };

test("stores an image on disk, serves it by id, and rejects fake files", async () => {
  const app = await launch();
  try {
    const result = await app.page.evaluate(async (b64) => {
      const api = (window as unknown as { api: Api }).api;
      const png = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const good = await api.media.put("media-e2e", png, "dot.png");
      const fake = await api.media.put("media-fake", new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg> padding"), "x.png");
      const img = new Image();
      img.src = "membetter-media://media/media-e2e";
      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      const ghost = new Image();
      ghost.src = "membetter-media://media/does-not-exist";
      const missing = await new Promise<boolean>((resolve) => {
        ghost.onload = () => resolve(true);
        ghost.onerror = () => resolve(false);
      });
      return { good: good.ok, fake: fake.ok, fakeMessage: fake.error?.message, loaded, missing };
    }, PNG_BASE64);
    expect(result.good).toBe(true);
    expect(result.fake).toBe(false);
    expect(result.fakeMessage).toMatch(/PNG, JPEG/);
    expect(result.loaded).toBe(true);
    expect(result.missing).toBe(false);
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});
