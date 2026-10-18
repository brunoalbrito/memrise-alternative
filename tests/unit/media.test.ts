import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { applyChange } from "../../electron/services/library";
import { MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, MediaError, MediaStore, sniff } from "../../electron/services/media";

const bytes = (...head: (number | string)[]): Uint8Array => {
  const out: number[] = [];
  for (const h of head) {
    if (typeof h === "string") out.push(...[...h].map((c) => c.charCodeAt(0)));
    else out.push(h);
  }
  while (out.length < 64) out.push(0);
  return Uint8Array.from(out);
};
const PNG = bytes(0x89, "PNG\r\n", 0x1a, 0x0a);
const PNG2 = bytes(0x89, "PNG\r\n", 0x1a, 0x0a, 1, 2, 3);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const GIF = bytes("GIF89a");
const WEBP = bytes("RIFF", 0, 0, 0, 0, "WEBP");
const WAV = bytes("RIFF", 0, 0, 0, 0, "WAVE");
const OGG = bytes("OggS");
const M4A = bytes(0, 0, 0, 0x20, "ftypM4A ");
const MP3 = bytes("ID3", 3, 0);
const MP3SYNC = bytes(0xff, 0xfb, 0x90);
const AAC = bytes(0xff, 0xf1, 0x50);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>      ');

let dir: string;
let db: Database.Database;
let store: MediaStore;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-media-"));
  db = openLibrary(join(dir, "membetter.db")).db;
  store = new MediaStore(db, join(dir, "media"));
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const files = () => readdirSync(join(dir, "media"));
const ref = (id: string) => ({ id, name: `${id}.png`, type: "image/png", size: 64 });
const useIn = (word: string, ...ids: string[]) =>
  applyChange(db, {
    type: "saveLevels",
    courseId: "c",
    levels: [{ id: "l", name: "L", tested: "t", words: [{ id: word, text: word, meaning: "", example: "", images: ids.map(ref), audio: [], learned: false }] }],
  });

describe("sniff", () => {
  it("detects every allowed type by content", () => {
    expect(sniff(PNG)?.contentType).toBe("image/png");
    expect(sniff(JPEG)?.contentType).toBe("image/jpeg");
    expect(sniff(GIF)?.contentType).toBe("image/gif");
    expect(sniff(WEBP)?.contentType).toBe("image/webp");
    expect(sniff(WAV)?.contentType).toBe("audio/wav");
    expect(sniff(OGG)?.contentType).toBe("audio/ogg");
    expect(sniff(M4A)?.contentType).toBe("audio/mp4");
    expect(sniff(MP3)?.contentType).toBe("audio/mpeg");
    expect(sniff(MP3SYNC)?.contentType).toBe("audio/mpeg");
    expect(sniff(AAC)?.contentType).toBe("audio/aac");
  });
  it("rejects SVG, text and tiny files", () => {
    expect(sniff(SVG)).toBeNull();
    expect(sniff(new TextEncoder().encode("hello world, not a media file"))).toBeNull();
    expect(sniff(Uint8Array.from([1, 2, 3]))).toBeNull();
  });
});

describe("MediaStore", () => {
  it("stores a file, resolves it and keeps its real type", () => {
    store.put("m1", PNG, "fake.mp3");
    const file = store.resolve("m1");
    expect(file?.contentType).toBe("image/png");
    expect(file?.path.endsWith(".png")).toBe(true);
  });

  it("rejects wrong content even with an allowed name, and does not store anything", () => {
    expect(() => store.put("m1", SVG, "a.png")).toThrow(MediaError);
    expect(files()).toEqual([]);
    expect(store.resolve("m1")).toBeNull();
  });

  it("enforces the size limits by real kind", () => {
    const bigImage = new Uint8Array(MAX_IMAGE_BYTES + 1);
    bigImage.set(PNG);
    expect(() => store.put("a", bigImage, "a.png")).toThrow(/too large/);
    const bigAudio = new Uint8Array(MAX_AUDIO_BYTES + 1);
    bigAudio.set(WAV);
    expect(() => store.put("b", bigAudio, "a.wav")).toThrow(/too large/);
    const okImage = new Uint8Array(MAX_IMAGE_BYTES);
    okImage.set(PNG);
    expect(() => store.put("c", okImage, "a.png")).not.toThrow();
  });

  it("rejects unsafe ids", () => {
    expect(() => store.put("../evil", PNG, "a.png")).toThrow(MediaError);
    expect(store.resolve("../../etc/passwd")).toBeNull();
  });

  it("stores identical content once and keeps it until the last reference is removed", () => {
    store.put("m1", PNG, "a.png");
    store.put("m2", PNG, "b.png");
    expect(files()).toHaveLength(1);
    store.remove("m1");
    expect(files()).toHaveLength(1);
    expect(store.resolve("m2")).not.toBeNull();
    store.remove("m2");
    expect(files()).toHaveLength(0);
  });

  it("garbage-collects unreferenced media and stray files, keeping referenced ones", () => {
    store.put("used", PNG, "a.png");
    store.put("unused", PNG2, "b.png");
    writeFileSync(join(dir, "media", "leftover.tmp"), "x");
    useIn("w", "used");
    const result = store.collectGarbage();
    expect(result.removedRows).toBe(1);
    expect(store.resolve("used")).not.toBeNull();
    expect(store.resolve("unused")).toBeNull();
    expect(files()).toHaveLength(1);
    expect(existsSync(join(dir, "media", "leftover.tmp"))).toBe(false);
  });

  it("keeps a file shared by a duplicated level (same id used twice)", () => {
    store.put("shared", PNG, "a.png");
    applyChange(db, {
      type: "saveLevels",
      courseId: "c",
      levels: [
        { id: "l1", name: "A", tested: "t", words: [{ id: "w", text: "w", meaning: "", example: "", images: [ref("shared")], audio: [], learned: false }] },
        { id: "l2", name: "A copy", tested: "t", words: [{ id: "w", text: "w", meaning: "", example: "", images: [ref("shared")], audio: [], learned: false }] },
      ],
    });
    store.collectGarbage();
    expect(store.resolve("shared")).not.toBeNull();
    expect(files()).toHaveLength(1);
  });
});
