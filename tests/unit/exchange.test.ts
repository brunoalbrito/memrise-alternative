import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { strToU8, zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { ExchangeError, importArchive, previewOf, readArchive, writeArchive } from "../../electron/services/exchange";
import { applyChange, loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import type { CourseData, CourseLevelData, ExportItem } from "../../electron/shared/schemas";

const png = (seed: number): Uint8Array => {
  const out = new Uint8Array(100);
  out.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  out[20] = seed;
  return out;
};
const wav = (): Uint8Array => {
  const out = new Uint8Array(100);
  out.set(strToU8("RIFF"));
  out.set(strToU8("WAVE"), 8);
  return out;
};
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

interface Lib {
  dir: string;
  db: Database.Database;
  media: MediaStore;
}
const libs: Lib[] = [];
function newLib(): Lib {
  const dir = mkdtempSync(join(tmpdir(), "membetter-ex-"));
  const db = openLibrary(join(dir, "membetter.db")).db;
  const lib = { dir, db, media: new MediaStore(db, join(dir, "media")) };
  libs.push(lib);
  return lib;
}
afterEach(() => {
  for (const l of libs.splice(0)) {
    l.db.close();
    rmSync(l.dir, { recursive: true, force: true });
  }
});

const baseCourse = (id: string): CourseData => ({
  id,
  title: "Kitchen words",
  categoryId: "lang-en-gb",
  teaching: true,
  totalItems: 2,
  itemsLearned: 0,
  itemsDue: 0,
  learnedToday: 0,
  teachingLanguageId: "en-gb",
  speakersLanguageId: "pt-br",
  tags: ["food"],
  description: "d",
});

function seed(lib: Lib, id = "custom-1"): ExportItem {
  lib.media.put("img1", png(1), "sink.png");
  lib.media.put("img2", png(1), "sink-copy.png"); // same content, other reference
  lib.media.put("aud1", wav(), "sink.wav");
  const levels: CourseLevelData[] = [
    {
      id: "l1",
      name: "First",
      tested: "Test on Word",
      words: [
        { id: "w1", text: "sink", meaning: "a bowl", example: "ex", ipa: "sɪŋk", images: [{ id: "img1", name: "sink.png", type: "image/png", size: 100 }, { id: "img2", name: "sink-copy.png", type: "image/png", size: 100 }], audio: [{ id: "aud1", name: "sink.wav", type: "audio/wav", size: 100 }], learned: true },
        { id: "w2", text: "wash", meaning: "clean", example: "", images: [], audio: [], learned: false },
      ],
    },
    { id: "l2", name: "Second", tested: "t", words: [] },
  ];
  const course = baseCourse(id);
  applyChange(lib.db, { type: "upsertCourse", course });
  applyChange(lib.db, { type: "saveLevels", courseId: id, levels });
  return { course, levels };
}

const strip = (levels: CourseLevelData[]) =>
  levels.map((l) => ({
    name: l.name,
    tested: l.tested,
    words: l.words.map((w) => ({ text: w.text, meaning: w.meaning, example: w.example, ipa: w.ipa, images: w.images.map((r) => r.name), audio: w.audio.map((r) => r.name) })),
  }));

describe("round trip", () => {
  it("exports a course with media and imports an identical one into an empty library", async () => {
    const a = newLib();
    const item = seed(a);
    const file = join(a.dir, "kitchen.membetter");
    const result = await writeArchive([item], a.media, file);
    expect(result).toEqual({ courses: 1, missingMedia: 0 });
    expect(existsSync(`${file}.${process.pid}.tmp`)).toBe(false);

    const b = newLib();
    const parsed = readArchive(file);
    expect(previewOf(b.db, parsed, "t").courses).toEqual([{ title: "Kitchen words", levels: 2, words: 2, media: 2, conflict: false }]);
    expect(importArchive(b.db, b.media, parsed, "replace")).toBe(1);

    const snap = loadLibrary(b.db);
    expect(snap.createdCourses).toHaveLength(1);
    const imported = snap.createdCourses[0]!;
    expect(imported).toMatchObject({ title: "Kitchen words", tags: ["food"], description: "d", teachingLanguageId: "en-gb", totalItems: 2, itemsLearned: 0 });
    const levels = snap.courseLevels[imported.id]!;
    expect(strip(levels)).toEqual(strip(item.levels));
    expect(levels[0]!.words.every((w) => !w.learned)).toBe(true); // progress is not exported
    // Both image refs resolve, but identical content is one file on disk (plus one wav).
    for (const ref of levels[0]!.words[0]!.images) expect(b.media.resolve(ref.id)).not.toBeNull();
    expect(readdirSync(b.media.dir)).toHaveLength(2);
    expect(new Set(levels.map((l) => l.id)).size).toBe(2);
  });

  it("keeps the same course id on a fresh import and reports a conflict on the second", async () => {
    const a = newLib();
    const item = seed(a);
    const file = join(a.dir, "c.membetter");
    await writeArchive([item], a.media, file);
    const b = newLib();
    importArchive(b.db, b.media, readArchive(file), "replace");
    expect(loadLibrary(b.db).createdCourses[0]!.id).toBe("custom-1");
    expect(previewOf(b.db, readArchive(file), "t").courses[0]!.conflict).toBe(true);
  });

  it("replace overwrites in place; copy adds a second course; neither leaks media", async () => {
    const a = newLib();
    const item = seed(a);
    const file = join(a.dir, "c.membetter");
    await writeArchive([item], a.media, file);
    const b = newLib();
    importArchive(b.db, b.media, readArchive(file), "replace");
    importArchive(b.db, b.media, readArchive(file), "replace");
    expect(loadLibrary(b.db).createdCourses).toHaveLength(1);
    expect(readdirSync(b.media.dir)).toHaveLength(2);
    importArchive(b.db, b.media, readArchive(file), "copy");
    const snap = loadLibrary(b.db);
    expect(snap.createdCourses.map((c) => c.title)).toEqual(["Kitchen words", "Kitchen words (copy)"]);
    expect(snap.createdCourses[1]!.id).not.toBe("custom-1");
    expect(readdirSync(b.media.dir)).toHaveLength(2);
  });

  it("maps sample-course ids to a stable imported id so repeating does not duplicate", async () => {
    const a = newLib();
    const item = seed(a, "english-visual-dictionary");
    const file = join(a.dir, "s.membetter");
    await writeArchive([item], a.media, file);
    const b = newLib();
    importArchive(b.db, b.media, readArchive(file), "replace");
    importArchive(b.db, b.media, readArchive(file), "replace");
    const ids = loadLibrary(b.db).createdCourses.map((c) => c.id);
    expect(ids).toEqual(["imported-english-visual-dictionary"]);
  });

  it("exports and imports a whole library in one file", async () => {
    const a = newLib();
    const one = seed(a, "custom-1");
    const two = { course: { ...baseCourse("custom-2"), title: "Second course" }, levels: [] as CourseLevelData[] };
    const file = join(a.dir, "library.membetter");
    expect(await writeArchive([one, two], a.media, file)).toEqual({ courses: 2, missingMedia: 0 });
    const b = newLib();
    expect(importArchive(b.db, b.media, readArchive(file), "replace")).toBe(2);
    expect(loadLibrary(b.db).createdCourses.map((c) => c.title).sort()).toEqual(["Kitchen words", "Second course"]);
  });

  it("skips media that is missing on disk and reports it", async () => {
    const a = newLib();
    const item = seed(a);
    a.media.remove("aud1");
    const file = join(a.dir, "c.membetter");
    expect(await writeArchive([item], a.media, file)).toEqual({ courses: 1, missingMedia: 1 });
    const parsed = readArchive(file);
    expect(parsed.missingMedia).toBe(0);
  });
});

describe("hostile and invalid files", () => {
  const manifest = (over: object = {}) => ({ format: "membetter-course", formatVersion: 1, kind: "course", ...over });
  const course = {
    course: { id: "custom-9", title: "Bad file", categoryId: "x", teaching: true },
    levels: [{ id: "l", name: "L", tested: "t", words: [{ id: "w", text: "a", meaning: "", example: "", images: [], audio: [] }] }],
  };
  function write(files: Record<string, Uint8Array | string>): string {
    const lib = newLib();
    const entries: Record<string, Uint8Array> = {};
    for (const [k, v] of Object.entries(files)) entries[k] = typeof v === "string" ? strToU8(v) : v;
    const path = join(lib.dir, "x.membetter");
    writeFileSync(path, zipSync(entries));
    return path;
  }
  const j = JSON.stringify;
  const fails = (path: string, code: string, message?: RegExp) => {
    try {
      readArchive(path);
      throw new Error("expected readArchive to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ExchangeError);
      expect((error as ExchangeError).code).toBe(code);
      if (message) expect((error as ExchangeError).message).toMatch(message);
    }
  };

  it("accepts a minimal valid file", () => {
    const parsed = readArchive(write({ "manifest.json": j(manifest()), "course.json": j(course) }));
    expect(parsed.courses[0]!.course.title).toBe("Bad file");
  });
  it("rejects a file that is not a zip", () => {
    const lib = newLib();
    const path = join(lib.dir, "x.membetter");
    writeFileSync(path, "not a zip at all");
    fails(path, "validation_failed");
  });
  it("rejects a truncated zip", () => {
    const good = write({ "manifest.json": j(manifest()), "course.json": j(course) });
    writeFileSync(good, readFileSync(good).subarray(0, 40));
    fails(good, "validation_failed");
  });
  it("rejects zip-slip, absolute, backslash and unexpected entries", () => {
    for (const name of ["../evil.txt", "/abs.txt", "media/../../x.png", "media\\x.png", "other/file.txt", "media/short.png"]) {
      fails(write({ "manifest.json": j(manifest()), "course.json": j(course), [name]: "x" }), "validation_failed");
    }
  });
  it("rejects a newer format version with an update message", () => {
    fails(write({ "manifest.json": j(manifest({ formatVersion: 99 })), "course.json": j(course) }), "unsupported_format", /Update the app/);
  });
  it("rejects a wrong format and a missing course", () => {
    fails(write({ "manifest.json": j(manifest({ format: "other" })), "course.json": j(course) }), "validation_failed");
    fails(write({ "manifest.json": j(manifest()) }), "validation_failed", /missing the course/);
  });
  it("rejects invalid course content", () => {
    fails(write({ "manifest.json": j(manifest()), "course.json": j({ ...course, course: { ...course.course, title: "ab" } }) }), "validation_failed");
  });
  it("rejects media whose hash does not match its name", () => {
    const bytes = png(5);
    fails(write({ "manifest.json": j(manifest()), "course.json": j(course), [`media/${"a".repeat(64)}.png`]: bytes }), "integrity_failed");
  });
  it("rejects media whose content is not what its name says", () => {
    const bytes = strToU8("<svg xmlns='http://www.w3.org/2000/svg'></svg> padding padding");
    fails(write({ "manifest.json": j(manifest()), "course.json": j(course), [`media/${sha(bytes)}.png`]: bytes }), "integrity_failed");
  });
  it("rejects a decompression bomb", () => {
    const big = new Uint8Array(20 * 1024 * 1024); // zeros compress by far more than 100:1
    fails(write({ "manifest.json": j(manifest()), "course.json": j(course), [`media/${sha(big)}.png`]: big }), "limit_exceeded");
  });
  it("leaves the library unchanged when an import fails midway", () => {
    const lib = newLib();
    const good = png(7);
    const parsed = readArchive(write({ "manifest.json": j(manifest()), "course.json": j({ ...course, levels: [{ id: "l", name: "L", tested: "t", words: [{ id: "w", text: "a", meaning: "", example: "", images: [{ id: "i", name: "a.png", type: "image/png", size: 1, hash: sha(good) }], audio: [] }] }] }), [`media/${sha(good)}.png`]: good }));
    // Make storing fail after the course row would have been written.
    const original = lib.media.put.bind(lib.media);
    lib.media.put = () => {
      original("tmp-ok", good, "ok.png");
      throw new Error("disk full");
    };
    expect(() => importArchive(lib.db, lib.media, parsed, "replace")).toThrow("disk full");
    expect(loadLibrary(lib.db).createdCourses).toEqual([]);
    expect(readdirSync(lib.media.dir)).toEqual([]);
  });
});
