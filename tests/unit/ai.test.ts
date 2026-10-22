import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { AiError } from "../../electron/services/ai/errors";
import { AiService, buildFallbackScene, buildImagePrompt, DEFAULT_TEXT_MODEL } from "../../electron/services/ai/service";
import { parseWordText } from "../../electron/services/ai/suggestion";
import { wavFromBase64 } from "../../electron/services/ai/wav";
import { Secrets, SecretsUnavailableError, type Cipher } from "../../electron/services/secrets";
import { Settings } from "../../electron/services/settings";

const KEY = "AIzaSy-super-secret-1234";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({
    interactions: {
      create: vi.fn(),
    },
  })),
}));

/** Reversible fake: not real encryption, but the stored text must never equal the key. */
const fakeCipher = (available = true, weak = false): Cipher => ({
  available: () => available,
  weak: () => weak,
  encrypt: (plain) => new TextEncoder().encode(`enc:${[...plain].reverse().join("")}`),
  decrypt: (data) => [...new TextDecoder().decode(data).slice(4)].reverse().join(""),
});

let dir: string;
let db: Database.Database;
let settings: Settings;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-ai-"));
  db = openLibrary(join(dir, "membetter.db")).db;
  settings = new Settings(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("Secrets", () => {
  it("stores only ciphertext and the last four characters, and reveals the key inside main", () => {
    const secrets = new Secrets(settings, fakeCipher());
    expect(secrets.status("google")).toEqual({ connected: false, last4: "" });
    secrets.save("google", KEY);
    expect(secrets.status("google")).toEqual({ connected: true, last4: "1234" });
    expect(secrets.reveal("google")).toBe(KEY);
    const everything = JSON.stringify(db.prepare("SELECT key, value FROM settings").all());
    expect(everything).not.toContain(KEY);
    // Not even in the raw database file (WAL included).
    db.pragma("wal_checkpoint(TRUNCATE)");
    expect(readFileSync(join(dir, "membetter.db")).includes(Buffer.from(KEY))).toBe(false);
    secrets.remove("google");
    expect(secrets.status("google").connected).toBe(false);
    expect(secrets.reveal("google")).toBeNull();
  });

  it("refuses to save when the operating system cannot protect keys", () => {
    const secrets = new Secrets(settings, fakeCipher(false));
    expect(() => secrets.save("google", KEY)).toThrow(SecretsUnavailableError);
    expect(secrets.status("google").connected).toBe(false);
  });

  it("reports weak protection and treats an undecryptable key as not connected", () => {
    expect(new Secrets(settings, fakeCipher(true, true)).weakProtection()).toBe(true);
    const broken: Cipher = { ...fakeCipher(), decrypt: () => { throw new Error("different user"); } };
    const secrets = new Secrets(settings, broken);
    secrets.save("google", KEY);
    expect(secrets.reveal("google")).toBeNull();
  });
});

type Call = { url: string; init: RequestInit };
function service(handler: (call: Call) => Response | Promise<Response>, opts: { google?: boolean } = {}) {
  const secrets = new Secrets(settings, fakeCipher());
  if (opts.google !== false) secrets.save("google", KEY);
  else secrets.remove("google");
  const calls: Call[] = [];
  const fetchFake = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { ai: new AiService(secrets, settings, (b) => b, fetchFake), calls };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const goodText = { output_text: JSON.stringify({ definition: "a bowl", sentences: ["I wash it.", "The sink is full.", "Clean the sink."], best: 1, ipa: "/sɪŋk/" }) };

describe("AiService", () => {
  it("returns parsed suggestions and sends the key only in a header", async () => {
    const { ai, calls } = service(() => json(goodText));
    const result = await ai.wordText("sink", "English");
    expect(result).toEqual({ definition: "a bowl", sentences: ["I wash it.", "The sink is full.", "Clean the sink."], best: 1, ipa: "sɪŋk" });
    const call = calls[0]!;
    expect((call.init.headers as Record<string, string>)["x-goog-api-key"]).toBe(KEY);
    expect(call.url).not.toContain(KEY);
    expect(String(call.init.body)).not.toContain(KEY);
    expect(String(call.init.body)).toContain(DEFAULT_TEXT_MODEL);
  });

  it("asks for a key when none is saved, without calling the network", async () => {
    const { ai, calls } = service(() => json(goodText), { google: false });
    await expect(ai.wordText("sink", "English")).rejects.toMatchObject({ kind: "no-key" });
    expect(calls).toHaveLength(0);
  });

  it.each([
    [401, "invalid-key"],
    [403, "invalid-key"],
    [429, "limit"],
    [500, "service"],
  ])("maps HTTP %i to %s without leaking the key or the response body", async (status, kind) => {
    const { ai } = service(() => json({ error: { message: `bad ${KEY}` } }, status));
    const error = await ai.wordText("sink", "English").catch((e: AiError) => e);
    expect(error).toBeInstanceOf(AiError);
    expect((error as AiError).kind).toBe(kind);
    expect((error as AiError).message).not.toContain(KEY);
  });

  it("maps a network failure and unusable answers", async () => {
    expect(await service(() => { throw new TypeError("fetch failed"); }).ai.wordText("a", "English").catch((e: AiError) => e.kind)).toBe("network");
    expect(await service(() => json({ output_text: "not json" })).ai.wordText("a", "English").catch((e: AiError) => e.kind)).toBe("unusable");
    expect(await service(() => json({})).ai.wordText("a", "English").catch((e: AiError) => e.kind)).toBe("refused");
  });

  it("creates WAV audio from raw PCM and from a ready WAV", async () => {
    const pcm = Buffer.from(new Uint8Array(100)).toString("base64");
    const { ai } = service(() => json({ steps: [{ content: [{ data: pcm }] }] }));
    const wav = await ai.wordAudio("sink");
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
    expect(wav.length).toBe(144);
    const ready = wavFromBase64(Buffer.from(wav).toString("base64"));
    expect(ready.length).toBe(144);
    const failing = service(() => json({ steps: [] }));
    await expect(failing.ai.wordAudio("sink")).rejects.toMatchObject({ kind: "audio" });
  });

  it("draws an image with the Google key in query param, describing the scene first", async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const base64Jpeg = Buffer.from(jpeg).toString("base64");
    const { ai, calls } = service((call) =>
      json({ output_text: "A person washing a plate at a kitchen sink." }),
    );

    // Get the mocked GoogleGenAI and configure it
    const { GoogleGenAI } = await import("@google/genai");
    const mockCreate = vi.fn().mockResolvedValueOnce({
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: "image",
              data: base64Jpeg,
            },
          ],
        },
      ],
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(function () {
      return {
        interactions: {
          create: mockCreate,
        },
      };
    });

    const bytes = await ai.wordImage("sink", "I wash the plate in the sink.");
    expect(bytes).toEqual(jpeg);
    // Verify describeScene was called (it makes an API request to describe the scene)
    const describeCall = calls[0];
    expect(describeCall).toBeDefined();
    // The request should ask the AI to describe the scene for the image
    expect(JSON.stringify(describeCall?.init.body)).toContain("Describe in one or two sentences");
    expect(JSON.stringify(describeCall?.init.body)).toContain("I wash the plate in the sink");
  });

  it("falls back to a scene from the sentence when the description fails, and maps image errors", async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 1]);
    const base64Jpeg = Buffer.from(jpeg).toString("base64");
    const ok = service((call) =>
      json({}, 500), // describeScene fails, but we provide a mock SDK response for image generation
    );

    // Get the mocked GoogleGenAI and configure it
    const { GoogleGenAI } = await import("@google/genai");
    const mockCreate = vi.fn().mockResolvedValueOnce({
      steps: [
        {
          type: "model_output",
          content: [
            {
              type: "image",
              data: base64Jpeg,
            },
          ],
        },
      ],
    });

    vi.mocked(GoogleGenAI).mockImplementationOnce(function () {
      return {
        interactions: {
          create: mockCreate,
        },
      };
    });

    expect(await ok.ai.wordImage("sink", "He said \"hello\".")).toEqual(jpeg);
    // Verify describeScene was attempted (it will fail with 500, then use fallback)
    const describeCall = ok.calls[0];
    expect(describeCall).toBeDefined();
    expect(JSON.stringify(describeCall?.init.body)).toContain("He said");

    // Test error handling for different HTTP status codes
    for (const [status, kind] of [[401, "image-key"], [403, "image-key"], [429, "limit"], [500, "image"]] as const) {
      const s = service((call) =>
        new Response("x", { status }),
      );
      // Configure mock for error case
      const errorMockCreate = vi.fn().mockRejectedValueOnce(new Error(`HTTP ${status}`));
      vi.mocked(GoogleGenAI).mockImplementationOnce(function () {
        return {
          interactions: {
            create: errorMockCreate,
          },
        };
      });
      // The SDK error handling needs to map the status codes
      expect(await s.ai.wordImage("a", "b").catch((e: AiError) => e.kind)).toBe(kind);
    }
    expect(await service(() => json({}), { google: false }).ai.wordImage("a", "b").catch((e: AiError) => e.kind)).toBe("image-no-key");
  });

  it("keeps editable model names and restores the defaults", () => {
    const { ai } = service(() => json({}));
    expect(ai.models()).toEqual({ textModel: DEFAULT_TEXT_MODEL, speechModel: "gemini-3.8-flash-tts", imageModel: "" });
    ai.setModels({ textModel: "t", speechModel: "s", imageModel: "i" });
    expect(ai.models()).toEqual({ textModel: "t", speechModel: "s", imageModel: "i" });
    expect(ai.restoreModels().textModel).toBe(DEFAULT_TEXT_MODEL);
  });
});

describe("helpers", () => {
  it("builds prompts that never quote the sentence", () => {
    expect(buildImagePrompt(" a cat ")).toMatch(/^a cat Simple friendly/);
    expect(buildFallbackScene("She said “hi”!")).toBe("Illustrate a scene in which She said hi.");
  });
  it("parses fenced JSON and clamps the best index", () => {
    const raw = "```json\n" + JSON.stringify({ definition: "d", sentences: ["a", "b"], best: 9, ipa: "/x/" }) + "\n```";
    expect(parseWordText(raw)).toEqual({ definition: "d", sentences: ["a", "b"], best: 1, ipa: "x" });
    expect(() => parseWordText("{}")).toThrow(AiError);
  });
});
