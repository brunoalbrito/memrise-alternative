import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { cleanup, launch } from "./launch";

type Api = {
  exchange: { inspect(path: string): Promise<{ ok: boolean; error?: { message: string } }> };
  anki: { previewCsv(path: string): Promise<{ ok: boolean; error?: { message: string } }>; importCsv(input: unknown): Promise<{ ok: boolean }> };
  backup: { setConfig(patch: unknown): Promise<{ ok: boolean; error?: { message: string } }> };
};

test("the page cannot make the app read or write places the user did not choose", async () => {
  const dir = mkdtempSync(join(tmpdir(), "membetter-sec-"));
  const secret = join(dir, "secret.txt");
  writeFileSync(secret, "word,meaning\nprivate,data\n");
  const app = await launch();
  try {
    const result = await app.page.evaluate(async (path) => {
      const api = (window as unknown as { api: Api }).api;
      return {
        inspect: await api.exchange.inspect(path),
        preview: await api.anki.previewCsv(path),
        csvImport: await api.anki.importCsv({ path, hasHeader: true, mapping: { word: 0, meaning: 1, example: null, ipa: null }, title: "Stolen", teachingLanguageId: "en-gb", speakersLanguageId: "pt-br" }),
        folder: await api.backup.setConfig({ folder: "/tmp/anywhere" }),
      };
    }, secret);
    expect(result.inspect.ok).toBe(false);
    expect(result.preview.ok).toBe(false);
    expect(result.preview.error?.message).toMatch(/Choose the file again/);
    expect(result.csvImport.ok).toBe(false);
    expect(result.folder.ok).toBe(false);
    expect(result.folder.error?.message).toMatch(/Choose the folder again/);
  } finally {
    await app.close();
    cleanup(app.userData);
    cleanup(dir);
  }
});

test("the window denies permissions, blocks navigation away and has a content security policy", async () => {
  const app = await launch();
  try {
    const csp = await app.page.evaluate(async () => {
      const response = await fetch(location.href);
      return response.headers.get("content-security-policy");
    });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    const stayed = await app.page.evaluate(() => {
      location.href = "https://example.com/";
      return location.protocol;
    });
    expect(stayed).toBe("file:");
    await app.page.waitForTimeout(300);
    expect(new URL(app.page.url()).protocol).toBe("file:");
  } finally {
    await app.close();
    cleanup(app.userData);
  }
});
